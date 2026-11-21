import { useEffect, useRef, useState } from "react";
import { ui, useUi, restartConversation, type Msg, logCall } from "../backend/store";
import { handleEvent, userSays, greet, resetEngine } from "../agent/engine";
import type { Channel } from "../data/types";
import { AgentCard } from "./Cards";
import { openAssistant } from "./assistant";
import { I } from "../ui/icons";
import { cx } from "../ui/kit";

export function AssistantAvatar({ size = 32 }: { size?: number }) {
  return <div className="rounded-full orb grid place-items-center text-white shadow" style={{ width: size, height: size }}><I.sparkle size={size * 0.55} /></div>;
}

export function MessageList({ msgs, ch, thinking }: { msgs: Msg[]; ch: Channel; thinking: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length, thinking]);
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
      {thinking && <div className="flex gap-2 items-center text-[12px] text-cd-muted" data-testid="thinking"><AssistantAvatar size={26} /><span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-cd-leaf animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>Checking your account…</div>}
      <div ref={end} />
    </div>
  );
}

export function Chips({ msgs, ch }: { msgs: Msg[]; ch: Channel }) {
  const last = [...msgs].reverse().find((m) => m.role === "agent");
  if (!last?.chips?.length || msgs[msgs.length - 1]?.role === "user") return null;
  // In-app, Confirm/Cancel live on the card itself; chips remain for WhatsApp/voice which have no cards.
  const pendingCard = last.cards?.some((c) => c.state === "pending");
  const chips = last.chips.filter((c) => !(ch === "inapp" && pendingCard && (c.event.kind === "confirm" || c.event.kind === "cancel")));
  if (!chips.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 pb-2" data-testid="chips">
      {chips.map((c) => <button key={c.label} type="button" onClick={() => handleEvent(c.event, ch)} className="shrink-0 h-8 px-3 rounded-full border border-cd-leaf text-cd-green bg-white text-[12px] font-bold hover:bg-cd-mint">{c.label}</button>)}
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

export function AgentSheet() {
  const s = useUi();
  if (!s.agentOpen) return null;
  const close = () => ui.set((x) => ({ ...x, agentOpen: false }));
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" data-testid="agent-sheet">
      <button type="button" aria-label="Close assistant" className="absolute inset-0 bg-black/30" onClick={close} />
      <div className="relative h-[86%] bg-white rounded-t-3xl shadow-sheet flex flex-col animate-rise">
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 border-b border-cd-line">
          <AssistantAvatar />
          <div className="flex-1 min-w-0"><div className="font-extrabold text-[14px] text-cd-deep">Delight Assistant</div><div className="text-[10.5px] text-cd-muted truncate">Powered by Graine AI · prototype with simulated data</div></div>
          <button type="button" aria-label="Voice mode" title="Voice mode" onClick={() => ui.set((x) => ({ ...x, agentOpen: false, voiceOpen: true }))} className="w-9 h-9 rounded-full hover:bg-cd-mint grid place-items-center text-cd-green"><I.mic size={18} /></button>
          <button type="button" aria-label="New conversation" title="New conversation" data-testid="new-conversation" onClick={() => { restartConversation(); resetEngine(); logCall({ name: "new_conversation", kind: "app_action", status: "ok", channel: "inapp" }); greet("inapp"); }} className="w-9 h-9 rounded-full hover:bg-cd-mint grid place-items-center text-cd-muted"><I.undo size={18} /></button>
          <button type="button" aria-label="Close" data-testid="close-agent" onClick={close} className="w-9 h-9 rounded-full hover:bg-cd-mint grid place-items-center text-cd-muted"><I.x size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3" data-testid="transcript"><MessageList msgs={s.messages} ch="inapp" thinking={s.thinking} /></div>
        <Chips msgs={s.messages} ch="inapp" />
        <Composer ch="inapp" onMic={() => ui.set((x) => ({ ...x, agentOpen: false, voiceOpen: true }))} />
        <div className="text-center text-[9.5px] text-cd-muted pb-2 -mt-1">Never shares OTPs or UPI PINs · always confirms before changing anything · say “talk to a person” anytime</div>
      </div>
    </div>
  );
}

/** Persistent but unobtrusive entry point, docked above the bottom navigation. */
export function Dock() {
  const s = useUi();
  if (s.agentOpen || s.voiceOpen || ["whatsapp", "call", "ayuh"].includes(s.route.screen)) return null;
  // Screens with their own bottom call-to-action get a compact floating button so the dock never covers it.
  if (["product", "subscription_edit", "vacations", "cart"].includes(s.route.screen)) {
    return (
      <div className="absolute right-3 bottom-[146px] z-30 flex flex-col items-end gap-2">
        {s.nudge && s.nudge.screen === s.route.screen && (
          <div className="w-[260px] rounded-2xl bg-white border border-cd-leaf shadow-card p-2.5 text-[12px] animate-rise" data-testid="nudge">
            {s.nudge.text}
            <div className="mt-2 flex gap-2"><button type="button" className="h-7 px-2.5 rounded-full bg-cd-green text-white text-[11px] font-bold" onClick={() => { const ev = s.nudge!.event; ui.set((x) => ({ ...x, nudge: null })); logCall({ name: "friction_nudge_accepted", kind: "friction", status: "ok" }); openAssistant({}); setTimeout(() => void handleEvent(ev, "inapp"), 300); }}>Yes, help me</button>
              <button type="button" className="h-7 px-2 text-cd-muted text-[11px]" onClick={() => ui.set((x) => ({ ...x, nudge: null }))}>Dismiss</button></div>
          </div>)}
        <button type="button" aria-label="Ask Country Delight" data-testid="dock-open" onClick={() => openAssistant({})} className="w-12 h-12 rounded-full orb text-white grid place-items-center shadow-lg"><I.sparkle size={22} /></button>
      </div>
    );
  }
  return (
    <div className="absolute left-3 right-3 bottom-[74px] z-30">
      {s.nudge && s.nudge.screen === s.route.screen && (
        <div className="mb-2 rounded-2xl bg-white border border-cd-leaf shadow-card p-2.5 flex items-center gap-2 animate-rise" data-testid="nudge">
          <AssistantAvatar size={26} /><div className="flex-1 text-[12px]">{s.nudge.text}</div>
          <button type="button" className="h-7 px-2.5 rounded-full bg-cd-green text-white text-[11px] font-bold" onClick={() => { const ev = s.nudge!.event; ui.set((x) => ({ ...x, nudge: null })); logCall({ name: "friction_nudge_accepted", kind: "friction", status: "ok" }); openAssistant({}); setTimeout(() => void handleEvent(ev, "inapp"), 300); }}>Yes</button>
          <button type="button" aria-label="Dismiss" className="w-7 h-7 grid place-items-center text-cd-muted" onClick={() => ui.set((x) => ({ ...x, nudge: null }))}><I.x size={14} /></button>
        </div>)}
      <div className="h-12 rounded-full bg-white/95 backdrop-blur border border-cd-line shadow-card flex items-center pl-2 pr-1 gap-2">
        <button type="button" data-testid="dock-open" onClick={() => openAssistant({})} className="flex-1 flex items-center gap-2 h-full text-left">
          <AssistantAvatar size={32} /><span className="text-[13px] text-cd-muted">Ask Country Delight…</span>
        </button>
        <button type="button" aria-label="Speak to the assistant" data-testid="dock-mic" onClick={() => openAssistant({ voice: true })} className={cx("w-10 h-10 rounded-full grid place-items-center text-white orb")}><I.mic size={18} /></button>
      </div>
    </div>
  );
}
