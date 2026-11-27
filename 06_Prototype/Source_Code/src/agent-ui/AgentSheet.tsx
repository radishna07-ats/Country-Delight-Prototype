import { useEffect, useRef, useState } from "react";
import { ui, useUi, restartConversation, type Msg, logCall } from "../backend/store";
import { handleEvent, userSays, greet, resetEngine } from "../agent/engine";
import type { Channel } from "../data/types";
import { AgentCard } from "./Cards";
import { openAssistant } from "./assistant";
import { clearVoiceError, isListening, listen, simulateSpeech, stopListening, stopSpeaking, useVoice } from "./voice";
import { stopOperator } from "../operator/operator";
import { SCREEN_NAMES } from "../operator/screen";
import { I } from "../ui/icons";
import { cx } from "../ui/kit";

export function AssistantAvatar({ size = 32, busy }: { size?: number; busy?: boolean }) {
  return <div className={cx("rounded-full orb grid place-items-center text-white shadow shrink-0", busy && "orb-busy")} style={{ width: size, height: size }}><I.sparkle size={size * 0.55} /></div>;
}

export function MessageList({ msgs, ch, thinking }: { msgs: Msg[]; ch: Channel; thinking: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  const op = useUi().operator;
  useEffect(() => { end.current?.scrollIntoView?.({ behavior: "smooth", block: "end" }); }, [msgs.length, thinking, msgs[msgs.length - 1]?.cards?.[0]?.state]);
  return (
    <div className="grid gap-3" role="log" aria-live="polite" aria-label="Conversation with the assistant">
      {msgs.map((m) => m.role === "user" ? (
        <div key={m.id} className="ml-auto max-w-[82%] rounded-2xl rounded-br-md bg-cd-green text-white px-3 py-2 text-[13px] animate-rise" data-testid="msg-user">{m.text}</div>
      ) : (
        <div key={m.id} className="flex gap-2 animate-rise" data-testid="msg-agent">
          <AssistantAvatar size={26} />
          <div className="flex-1 min-w-0 grid gap-2">
            <div className="max-w-[94%] rounded-2xl rounded-tl-md bg-gray-50 border border-cd-line/70 px-3 py-2 text-[13px] leading-relaxed">{m.text}</div>
            {m.cards?.map((c, i) => <AgentCard key={i} c={c} ch={ch} />)}
          </div>
        </div>
      ))}
      {thinking && <div className="flex gap-2 items-center text-[12px] text-cd-muted" data-testid="thinking"><AssistantAvatar size={26} busy /><Dots />{op?.step ?? "Thinking…"}</div>}
      <div ref={end} />
    </div>
  );
}

const Dots = () => <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-cd-leaf animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>;

export function Chips({ msgs, ch, max }: { msgs: Msg[]; ch: Channel; max?: number }) {
  const last = [...msgs].reverse().find((m) => m.role === "agent");
  if (!last?.chips?.length || msgs[msgs.length - 1]?.role === "user") return null;
  // In-app, Confirm/Cancel live on the card itself; chips remain for WhatsApp/voice which have no cards.
  const pendingCard = last.cards?.some((c) => c.state === "pending");
  const chips = last.chips.filter((c) => !(ch === "inapp" && pendingCard && (c.event.kind === "confirm" || c.event.kind === "cancel"))).slice(0, max ?? 99);
  if (!chips.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar" data-testid="chips">
      {chips.map((c) => <button key={c.label} type="button" onClick={() => handleEvent(c.event, ch)} className="shrink-0 h-8 px-3 rounded-full border border-cd-leaf text-cd-green bg-white text-[12px] font-bold hover:bg-cd-mint shadow-sm">{c.label}</button>)}
    </div>
  );
}

export function Composer({ ch, onMic, placeholder = "Type or speak your request" }: { ch: Channel; onMic?: () => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const send = () => { if (!text.trim()) return; void userSays(text, ch); setText(""); };
  return (
    <div className="flex items-center gap-2 px-3 pb-3 pt-1">
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={placeholder} aria-label="Message the assistant" data-testid="composer"
        className="flex-1 h-11 rounded-full border border-cd-line bg-white px-4 text-[13px] outline-none focus:border-cd-leaf" />
      {text.trim() ? (
        <button type="button" onClick={send} aria-label="Send" data-testid="send" className="w-11 h-11 rounded-full bg-cd-green text-white grid place-items-center"><I.send size={18} /></button>
      ) : onMic && (
        <button type="button" onClick={onMic} aria-label="Speak" data-testid="mic" className="w-11 h-11 rounded-full orb text-white grid place-items-center"><I.mic size={18} /></button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the in-app assistant: compact bar ⇄ expanded panel
const TRY = ["Find me a protein powder under ₹2,000 and add the best-rated option to my cart", "Pause my delivery for the next three days", "Add one more packet of milk to my regular subscription", "Why was ₹500 deducted from my wallet?"];
const CTA_SCREENS = ["product", "subscription_edit", "vacations", "cart"];
const NO_NAV = ["whatsapp", "call", "ayuh"];
/** Card types that need room (components): the panel expands for these. A cart read-back stays compact — the app shows it. */
const COMPACT_CARDS = ["cart_result"];
const TERMINAL = ["confirmed", "cancelled", "undone", "failed"];

function useAutoExpand() {
  const s = useUi();
  const last = [...s.messages].reverse().find((m) => m.role === "agent");
  const needsRoom = !!last?.cards?.some((c) => !COMPACT_CARDS.includes(c.type));
  const settled = needsRoom && last!.cards!.filter((c) => !COMPACT_CARDS.includes(c.type)).every((c) => c.state && TERMINAL.includes(c.state));
  const key = `${last?.id}:${last?.cards?.map((c) => c.state).join(",")}`;
  useEffect(() => {
    if (!s.agentOpen) return;
    if (needsRoom && !settled && !s.agentExpanded) { ui.set((x) => ({ ...x, agentExpanded: true })); return; }
    if (s.agentExpanded && !s.agentPinned && (settled || (!needsRoom && last))) {
      // Give the customer time to see the result (e.g. "Confirmed · done") before folding back into the bar.
      const t = setTimeout(() => ui.set((x) => (x.agentPinned ? x : { ...x, agentExpanded: false })), 1800);
      return () => clearTimeout(t);
    }
  }, [key, s.agentOpen]);
}

export function AgentDock() {
  const s = useUi(); const v = useVoice();
  const [text, setText] = useState("");
  const [hideBubble, setHideBubble] = useState<string | null>(null);
  useAutoExpand();
  if (["whatsapp", "call"].includes(s.route.screen)) return null;
  const cta = CTA_SCREENS.includes(s.route.screen);
  const bottom = NO_NAV.includes(s.route.screen) ? 12 : cta ? 146 : 76;

  // ---------- idle: unobtrusive entry point (hidden on Ayuh, which has its own hand-off button)
  if (!s.agentOpen) {
    if (s.route.screen === "ayuh") return null;
    const nudge = s.nudge && s.nudge.screen === s.route.screen ? s.nudge : null;
    const accept = () => { const ev = nudge!.event; ui.set((x) => ({ ...x, nudge: null })); logCall({ name: "friction_nudge_accepted", kind: "friction", status: "ok" }); openAssistant({}); setTimeout(() => void handleEvent(ev, "inapp"), 300); };
    return (
      <div className={cx("absolute z-[48]", cta ? "right-3" : "left-3 right-3")} style={{ bottom }} data-agent-ignore data-testid="agent-idle">
        {nudge && (
          <div className={cx("mb-2 rounded-2xl bg-white border border-cd-leaf shadow-card p-2.5 flex items-center gap-2 animate-rise", cta && "w-[260px]")} data-testid="nudge">
            <AssistantAvatar size={26} /><div className="flex-1 text-[12px]">{nudge.text}</div>
            <button type="button" className="h-7 px-2.5 rounded-full bg-cd-green text-white text-[11px] font-bold" onClick={accept}>Yes</button>
            <button type="button" aria-label="Dismiss" className="w-7 h-7 grid place-items-center text-cd-muted" onClick={() => ui.set((x) => ({ ...x, nudge: null }))}><I.x size={14} /></button>
          </div>)}
        {cta ? (
          <div className="flex justify-end"><button type="button" aria-label="Ask Country Delight" data-testid="dock-open" onClick={() => openAssistant({})} className="w-12 h-12 rounded-full orb text-white grid place-items-center shadow-lg"><I.sparkle size={22} /></button></div>
        ) : (
          <div className="h-12 rounded-full bg-white/95 backdrop-blur border border-cd-line shadow-card flex items-center pl-2 pr-1 gap-2">
            <button type="button" data-testid="dock-open" onClick={() => openAssistant({})} className="flex-1 flex items-center gap-2 h-full text-left">
              <AssistantAvatar size={32} /><span className="text-[13px] text-cd-muted">Ask or tell me what to do…</span>
            </button>
            <button type="button" aria-label="Speak to the assistant" data-testid="dock-mic" onClick={() => { openAssistant({}); startMic(); }} className="w-10 h-10 rounded-full grid place-items-center text-white orb"><I.mic size={18} /></button>
          </div>
        )}
      </div>
    );
  }

  // ---------- active
  const lastAgent = [...s.messages].reverse().find((m) => m.role === "agent");
  const lastMsg = s.messages[s.messages.length - 1];
  const busy = s.thinking || !!s.operator;
  const listening = v.listening || v.starting;
  const send = () => { const t = text.trim(); if (!t) return; setText(""); void userSays(t, "inapp"); };
  function startMic() {
    clearVoiceError(); stopSpeaking();
    if (isListening()) { stopListening(); return; }
    listen({ onInterim: () => {}, onFinal: (t) => void userSays(t, "inapp"), onError: () => {}, onEnd: () => {} });
  }
  const expand = (on: boolean) => ui.set((x) => ({ ...x, agentExpanded: on, agentPinned: on }));
  const close = () => { stopListening(); stopOperator(); ui.set((x) => ({ ...x, agentOpen: false, agentExpanded: false, agentPinned: false, voiceOpen: false })); };
  const bubbleKey = lastAgent?.id ?? "none";
  const showBubble = !s.agentExpanded && hideBubble !== bubbleKey;
  const hasHiddenCards = !!lastAgent?.cards?.some((c) => !COMPACT_CARDS.includes(c.type));

  return (
    <div className="absolute left-2.5 right-2.5 top-[30%] z-[48] flex flex-col justify-end gap-2 pointer-events-none" style={{ bottom }} data-agent-ignore data-testid="agent-dock">
      {/* Expanded panel — components, results, full conversation */}
      <div className={cx("dock-panel pointer-events-auto min-h-0 flex flex-col bg-white rounded-3xl border border-cd-line shadow-sheet overflow-hidden", s.agentExpanded ? "is-open" : "is-closed")}
        data-testid={s.agentExpanded ? "agent-sheet" : undefined} aria-hidden={!s.agentExpanded}>
        <div className="px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-cd-line">
          <AssistantAvatar size={28} busy={busy} />
          <div className="flex-1 min-w-0"><div className="font-extrabold text-[13.5px] text-cd-deep leading-tight">Delight Assistant</div>
            <div className="text-[10.5px] text-cd-muted truncate" data-testid="agent-context"><span className="inline-block w-1.5 h-1.5 rounded-full bg-cd-leaf mr-1 align-middle" />Sees: {SCREEN_NAMES[s.route.screen] ?? s.route.screen} · simulated data</div></div>
          <button type="button" aria-label="New conversation" title="New conversation" data-testid="new-conversation" tabIndex={s.agentExpanded ? 0 : -1} onClick={() => { restartConversation(); resetEngine(); logCall({ name: "new_conversation", kind: "app_action", status: "ok", channel: "inapp" }); greet("inapp"); }} className="w-8 h-8 rounded-full hover:bg-cd-mint grid place-items-center text-cd-muted"><I.undo size={16} /></button>
          <button type="button" aria-label="Collapse assistant" data-testid="agent-collapse" tabIndex={s.agentExpanded ? 0 : -1} onClick={() => expand(false)} className="w-8 h-8 rounded-full hover:bg-cd-mint grid place-items-center text-cd-muted"><I.down size={18} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-3" data-testid="transcript">{s.agentExpanded && <MessageList msgs={s.messages} ch="inapp" thinking={s.thinking} />}</div>
        {s.agentExpanded && <div className="px-3 pb-2"><Chips msgs={s.messages} ch="inapp" /></div>}
      </div>

      {/* Compact state — one reply bubble, a live step line while working, suggestion chips */}
      {!s.agentExpanded && (
        <div className="pointer-events-auto grid gap-1.5 dock-compact">
          {s.operator ? (
            <div className="rounded-2xl bg-cd-deep text-white px-3 py-2 text-[12.5px] flex items-center gap-2 shadow-card" data-testid="operator-step" role="status">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
              <span className="flex-1 min-w-0 truncate">{s.operator.step}</span>
              <button type="button" onClick={() => stopOperator()} data-testid="operator-stop" className="h-6 px-2 rounded-full bg-white/15 text-[11px] font-bold">Stop</button>
            </div>
          ) : listening || v.interim ? (
            <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-cd-green/95 text-white px-3 py-2 text-[13px] italic shadow-card" data-testid="voice-interim">{v.interim || "Listening…"}</div>
          ) : v.error ? (
            <div className="rounded-2xl bg-orange-50 border border-orange-200 px-3 py-2 text-[12px] text-cd-ink shadow-card" data-testid="voice-error" role="alert">
              {v.error}
              <div className="mt-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">{TRY.slice(0, 3).map((t) => <button key={t} type="button" onClick={() => { clearVoiceError(); simulateSpeech(t, (x) => void userSays(x, "inapp")); }} className="shrink-0 h-7 px-2.5 rounded-full bg-white border border-cd-line text-[11px]">“{t.length > 34 ? t.slice(0, 32) + "…" : t}”</button>)}</div>
            </div>
          ) : s.thinking ? (
            <div className="rounded-2xl bg-white/95 backdrop-blur border border-cd-line px-3 py-2 text-[12.5px] text-cd-muted flex items-center gap-2 shadow-card w-fit" data-testid="thinking"><Dots />Thinking…</div>
          ) : showBubble && lastAgent && lastMsg?.role !== "user" ? (
            <div className="flex items-end gap-1.5 animate-rise" key={bubbleKey}>
              <div className="flex-1 min-w-0 rounded-2xl rounded-bl-md bg-white border border-cd-line px-3 py-2 text-[13px] leading-snug shadow-card" data-testid="msg-agent">
                <div className="line-clamp-4" data-testid="agent-bubble">{lastAgent.text}</div>
                {(hasHiddenCards || lastAgent.text.length > 180) && <button type="button" onClick={() => expand(true)} className="mt-1 text-[11.5px] font-bold text-cd-green" data-testid="show-details">{hasHiddenCards ? "Show details" : "Show more"}</button>}
              </div>
              <button type="button" aria-label="Hide reply" onClick={() => setHideBubble(bubbleKey)} className="w-7 h-7 rounded-full bg-white/90 border border-cd-line grid place-items-center text-cd-muted shrink-0"><I.x size={12} /></button>
            </div>
          ) : s.voiceOpen && !lastAgent ? (
            <div className="rounded-2xl bg-white/95 border border-cd-line px-3 py-2 text-[12px] shadow-card">Tap the mic and speak, or try one of these:</div>
          ) : null}
          {!busy && !listening && showBubble && <Chips msgs={s.messages} ch="inapp" />}
          {s.voiceOpen && !busy && !listening && !lastAgent && <div className="flex gap-1.5 overflow-x-auto no-scrollbar">{TRY.slice(1).map((t) => <button key={t} type="button" onClick={() => simulateSpeech(t, (x) => void userSays(x, "inapp"))} className="shrink-0 h-8 px-3 rounded-full bg-white border border-cd-line text-[11.5px] shadow-sm">“{t}”</button>)}</div>}
        </div>
      )}

      {/* The bar: always docked at the bottom while the assistant is active */}
      <div className={cx("pointer-events-auto h-[52px] rounded-full bg-white border shadow-card flex items-center pl-1.5 pr-1 gap-1", listening ? "border-cd-leaf ring-2 ring-cd-leaf/30" : "border-cd-line")} data-testid="agent-bar">
        <button type="button" aria-label={s.agentExpanded ? "Collapse assistant" : "Expand assistant"} onClick={() => expand(!s.agentExpanded)} className="shrink-0"><AssistantAvatar size={38} busy={busy || listening} /></button>
        {listening ? (
          <div className="flex-1 min-w-0 px-2 flex items-center gap-2" data-testid="voice-state"><span className="flex items-end gap-[3px] h-4">{[0, 1, 2, 3].map((i) => <span key={i} className="w-[3px] h-full bg-cd-leaf rounded-full origin-bottom animate-bar" style={{ animationDelay: `${i * 0.12}s` }} />)}</span><span className="text-[13px] text-cd-ink truncate">{v.starting ? "Starting microphone…" : "Listening…"}</span></div>
        ) : (
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={s.operator ? "Working in the app…" : "Ask or tell me what to do…"} aria-label="Message the assistant" data-testid="composer"
            className="flex-1 min-w-0 h-10 bg-transparent px-2 text-[13.5px] outline-none" />
        )}
        {text.trim() && !listening ? (
          <button type="button" onClick={send} aria-label="Send" data-testid="send" className="w-10 h-10 rounded-full bg-cd-green text-white grid place-items-center shrink-0"><I.send size={17} /></button>
        ) : (
          <button type="button" onClick={startMic} aria-label={listening ? "Stop listening" : "Speak"} aria-pressed={listening} data-testid="mic"
            className={cx("w-10 h-10 rounded-full grid place-items-center text-white shrink-0 transition-colors", listening ? "bg-cd-danger" : "orb")}>{listening ? <span className="w-3.5 h-3.5 rounded-[3px] bg-white" /> : <I.mic size={18} />}</button>
        )}
        <button type="button" aria-label="Close assistant" data-testid="close-agent" onClick={close} className="w-9 h-9 rounded-full grid place-items-center text-cd-muted hover:bg-cd-mint shrink-0"><I.x size={17} /></button>
      </div>
    </div>
  );
}
