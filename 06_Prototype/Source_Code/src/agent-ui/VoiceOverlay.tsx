import { useEffect, useRef, useState } from "react";
import { ui, useUi, logCall } from "../backend/store";
import { userSays, speakListeners } from "../agent/engine";
import { AgentCard } from "./Cards";
import { listen, recognitionSupported, speak, stopSpeaking } from "./voice";
import { I } from "../ui/icons";
import { cx } from "../ui/kit";

const TRY = ["Pause my delivery for the next three days", "Add one more packet of milk to my regular subscription", "Why was ₹500 deducted from my wallet?", "Where can I see tomorrow's order?"];

export function VoiceOverlay() {
  const s = useUi();
  const [phase, setPhase] = useState<"idle" | "listening" | "speaking">("idle");
  const [interim, setInterim] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [s.messages.length, s.messages[s.messages.length - 1]?.cards?.[0]?.state]);
  const supported = recognitionSupported();

  useEffect(() => {
    if (!s.voiceOpen) return;
    const l = (text: string, ch: string) => { if (ch !== "inapp") return; setPhase("speaking"); speak(text, () => setPhase("idle")); };
    speakListeners.add(l);
    return () => { speakListeners.delete(l); stopSpeaking(); recRef.current?.abort?.(); };
  }, [s.voiceOpen]);

  if (!s.voiceOpen) return null;
  const lastUser = [...s.messages].reverse().find((m) => m.role === "user");
  const lastAgent = [...s.messages].reverse().find((m) => m.role === "agent");
  // keep the most recent card on screen (e.g. the vacation card switching to "Confirmed") — voice for intent, screen for confirmation
  const agents = s.messages.filter((m) => m.role === "agent");
  const cardMsg = [...agents].slice(-2).reverse().find((m) => m.cards?.length);
  const start = () => {
    stopSpeaking(); setErr(null); setInterim("");
    if (!supported) { setErr("Speech recognition isn't available in this browser. Tap a phrase below to simulate speaking."); return; }
    setPhase("listening");
    logCall({ name: "voice: listening (browser speech recognition, en-IN)", kind: "app_action", status: "info", channel: "inapp" });
    recRef.current = listen({
      onInterim: setInterim,
      onFinal: (t) => { setInterim(t); void userSays(t, "inapp"); },
      onError: (e) => { setPhase("idle"); setErr(e === "not-allowed" ? "Microphone permission was denied. Tap a phrase below to simulate speaking." : e === "no-speech" ? "I didn't hear anything. Try again or tap a phrase." : "Voice input unavailable here. Tap a phrase below."); },
      onEnd: () => setPhase((p) => (p === "listening" ? "idle" : p)),
    });
  };
  const simulate = (t: string) => {
    stopSpeaking(); setPhase("listening"); setInterim("");
    logCall({ name: "voice: simulated utterance (tap-to-speak)", kind: "app_action", status: "info", channel: "inapp" });
    const words = t.split(" "); let i = 0;
    const timer = setInterval(() => { i++; setInterim(words.slice(0, i).join(" ")); if (i >= words.length) { clearInterval(timer); setPhase("idle"); void userSays(t, "inapp"); } }, 110);
  };
  const state = s.thinking ? "thinking" : phase;
  return (
    <div className="absolute inset-0 z-50 bg-gradient-to-b from-[#0F2A19] via-[#123B22] to-[#0B1F13] text-white flex flex-col" data-testid="voice-overlay">
      <div className="flex items-center justify-between px-4 pt-12">
        <span className="text-[11px] uppercase tracking-widest text-white/60">Delight Assistant · voice</span>
        <button type="button" aria-label="Close voice" data-testid="voice-close" onClick={() => { stopSpeaking(); ui.set((x) => ({ ...x, voiceOpen: false })); }} className="w-9 h-9 rounded-full bg-white/10 grid place-items-center"><I.x size={18} /></button>
      </div>
      <div className="flex flex-col items-center mt-6">
        <div className="relative w-36 h-36 grid place-items-center">
          {state === "listening" && <span className="absolute inset-0 rounded-full bg-[#2FA84F] animate-pulseRing" />}
          <div className={cx("w-28 h-28 rounded-full orb shadow-[0_0_60px_rgba(47,168,79,.55)] grid place-items-center transition-transform", state === "speaking" && "scale-105", state === "thinking" && "animate-pulse")}>
            {state === "speaking" ? <div className="flex items-end gap-1 h-10">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="w-1.5 h-full bg-white/90 rounded-full origin-bottom animate-bar" style={{ animationDelay: `${i * 0.12}s` }} />)}</div> : <I.mic size={36} />}
          </div>
        </div>
        <div className="mt-4 text-[13px] text-white/70" data-testid="voice-state">{state === "listening" ? "Listening…" : state === "thinking" ? "Checking your account…" : state === "speaking" ? "Speaking" : "Tap the mic and speak"}</div>
      </div>
      <div className="px-5 mt-4 min-h-[48px] text-center text-[16px] font-semibold">{interim || lastUser?.text || ""}</div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 mt-2">
        {lastAgent && <div className="rounded-2xl bg-white/10 px-3 py-2 text-[13px] leading-relaxed">{lastAgent.text}</div>}
        {cardMsg?.cards?.map((c, i) => <div key={i} className="mt-2 text-cd-ink"><AgentCard c={c} ch="inapp" /></div>)}
        {err && <div className="mt-3 rounded-xl bg-orange-500/20 px-3 py-2 text-[12px]">{err}</div>}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-2">
        <div className="text-[10.5px] text-white/50 mb-1.5">{supported ? "Or tap to simulate saying:" : "Simulated voice · tap to say:"}</div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">{TRY.map((t) => <button key={t} type="button" onClick={() => simulate(t)} className="shrink-0 h-8 px-3 rounded-full bg-white/10 text-[11.5px]">“{t}”</button>)}</div>
      </div>
      <div className="flex items-center justify-center gap-6 pb-8 pt-3">
        <button type="button" aria-label="Switch to chat" onClick={() => { stopSpeaking(); ui.set((x) => ({ ...x, voiceOpen: false, agentOpen: true })); }} className="w-12 h-12 rounded-full bg-white/10 grid place-items-center"><I.keyboard size={20} /></button>
        <button type="button" aria-label="Start listening" data-testid="voice-mic" onClick={start} className="w-16 h-16 rounded-full bg-white text-cd-deep grid place-items-center shadow-lg"><I.mic size={26} /></button>
        <div className="w-12 h-12 grid place-items-center text-[10px] text-white/50 text-center leading-tight">browser<br />speech</div>
      </div>
    </div>
  );
}
