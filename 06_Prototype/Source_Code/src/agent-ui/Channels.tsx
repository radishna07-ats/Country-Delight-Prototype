import { useEffect, useRef, useState } from "react";
import { back, db, logCall, navigate, toast, ui, useDb, useUi, type CardData, type Msg } from "../backend/store";
import { greet, handleEvent, outreachOpener, speakListeners, userSays } from "../agent/engine";
import { byId } from "../data/catalogue";
import { fmtDate, fmtTs, rupees } from "../backend/rules";
import { listen, recognitionSupported, speak, stopSpeaking } from "./voice";
import { I } from "../ui/icons";
import { cx } from "../ui/kit";

// ------------------------------------------------------------------ WhatsApp (simulated channel)
function waLines(c: CardData, d: ReturnType<typeof db.get>): string[] {
  switch (c.type) {
    case "txn_list": return c.txnIds.slice(0, 6).map((id: string) => { const t = d.txns.find((x) => x.id === id)!; return `• ${fmtTs(t.ts)} — ${t.title} ${t.amount < 0 ? "−" : "+"}${rupees(Math.abs(t.amount))}`; });
    case "txn_explain": return [...c.lines.map((l: string) => `• ${l}`), ...(c.rule ? [`Rule: ${c.rule}`] : [])];
    case "order_status": { const o = d.orders.find((x) => x.id === c.orderId)!; return [`*Order ${o.id}* · ${fmtDate(o.date)}`, `Status: ${o.status}${o.statusAt ? ` at ${o.statusAt}` : ""}`, ...o.lines.map((l) => `• ${byId(l.productId).name} × ${l.qty}`), ...(c.pod ? [`📷 Proof of delivery: ${c.pod.photo} photo, ${c.pod.at}`] : [])]; }
    case "resolution_options": return c.options.map((o: any) => `• *${o.label}* — ${o.detail}`);
    case "ticket": { const t = d.tickets.find((x) => x.id === c.ticketId); return t ? [`🧾 Case *${t.id}* · ${t.status}`] : []; }
    case "wallet_summary": return [`💰 Balance *${rupees(c.balance)}*`, ...(c.autopay?.enabled ? [`Autopay on: +${rupees(c.autopay.amount)} below ${rupees(c.autopay.threshold)}`] : [])];
    case "offer": return [`*${c.name}* — ${c.benefit}`, `Valid till ${fmtDate(c.validTill)}`, ...c.conditions.map((x: string) => `• ${x}`)];
    case "vacation": return [`✈️ ${fmtDate(c.start)} → ${fmtDate(c.end)}, resumes ${fmtDate(c.resume)}${c.state === "confirmed" ? " ✅" : ""}`];
    case "sub_change": return [`${byId(c.productId).name}: ${c.fromQty} → *${c.toQty}* from ${fmtDate(c.effective)}${c.state === "confirmed" ? " ✅" : ""}`];
    case "prefs_change": return [`Ring bell: ${c.to.ringBell ? "On" : "Off"} · Call before: ${c.to.callBefore ? "On" : "Off"}${c.state === "confirmed" ? " ✅" : ""}`];
    case "refund": return [`Refundable *${rupees(c.amount)}*${c.reference ? ` · ref ${c.reference}` : ""}`];
    case "handoff": return [`👤 Case *${c.ticketId}*`];
    case "resolution_confirm": return [`${c.label}${c.state === "confirmed" ? " ✅" : ""}`];
    default: return [];
  }
}

export function WhatsAppScreen() {
  const s = useUi(); const d = useDb();
  const [text, setText] = useState(""); const [listOpen, setListOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ui.set((x) => ({ ...x, channel: "whatsapp" }));
    if (!ui.get().waMessages.length) {
      logCall({ name: "identity: WhatsApp sender matched to registered number", kind: "guardrail", status: "ok", channel: "whatsapp", args: { phone: d.customer.phoneMasked } });
      greet("whatsapp");
    }
    return () => ui.set((x) => ({ ...x, channel: "inapp" }));
  }, []);
  useEffect(() => { end.current?.scrollIntoView?.({ behavior: "smooth" }); }, [s.waMessages.length, s.thinking]);
  const last = [...s.waMessages].reverse().find((m) => m.role === "agent");
  const chips = s.waMessages[s.waMessages.length - 1]?.role === "agent" ? last?.chips ?? [] : [];
  const send = () => { if (text.trim()) { void userSays(text, "whatsapp"); setText(""); } };
  return (
    <div className="h-full flex flex-col" data-testid="whatsapp">
      <div className="bg-[#075E54] text-white pt-11 pb-2 px-2 flex items-center gap-2">
        <button type="button" aria-label="Back" onClick={() => back()} className="w-8 h-8 grid place-items-center"><I.back /></button>
        <div className="w-9 h-9 rounded-full bg-white grid place-items-center text-cd-green font-extrabold text-[12px]">CD</div>
        <div className="flex-1"><div className="font-bold text-[14px] flex items-center gap-1">Country Delight <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] grid place-items-center"><I.check size={9} strokeWidth={3} /></span></div><div className="text-[10.5px] opacity-80">Business account · AI assistant (simulated)</div></div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar wa-bg p-3 grid gap-2 content-start">
        <div className="mx-auto text-[10.5px] bg-[#FFF5C4] rounded-lg px-2 py-1 text-center max-w-[90%]">🔒 Simulated WhatsApp conversation. Messages are AI-generated; you can ask for a person anytime.</div>
        {s.waMessages.map((m) => <WaBubble key={m.id} m={m} lines={(m.cards ?? []).flatMap((c) => waLines(c, d))} />)}
        {s.thinking && <div className="bg-white rounded-lg px-3 py-2 text-[12px] text-gray-500 w-fit">typing…</div>}
        <div ref={end} />
      </div>
      {chips.length > 0 && (
        <div className="bg-[#EFE7DE] px-3 pb-2 grid gap-1.5">
          {chips.slice(0, 3).map((c) => <button key={c.label} type="button" onClick={() => handleEvent(c.event, "whatsapp")} className="h-9 rounded-lg bg-white text-[#00A884] text-[13px] font-semibold shadow-sm">{c.label}</button>)}
          {chips.length > 3 && <button type="button" onClick={() => setListOpen(true)} className="h-9 rounded-lg bg-white text-[#00A884] text-[13px] font-semibold shadow-sm flex items-center justify-center gap-1"><I.menu size={14} /> More options</button>}
        </div>)}
      <div className="bg-[#F0F2F5] px-2 py-2 flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message" aria-label="WhatsApp message" data-testid="wa-input" className="flex-1 h-10 rounded-full bg-white px-4 text-[13px] outline-none" />
        <button type="button" aria-label="Send" onClick={send} data-testid="wa-send" className="w-10 h-10 rounded-full bg-[#00A884] text-white grid place-items-center"><I.send size={16} /></button>
      </div>
      {listOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end"><button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={() => setListOpen(false)} />
          <div className="relative bg-white rounded-t-2xl p-3 grid gap-1">{chips.map((c) => <button key={c.label} type="button" onClick={() => { setListOpen(false); void handleEvent(c.event, "whatsapp"); }} className="h-11 text-left px-3 rounded-lg hover:bg-gray-50 text-[13px]">{c.label}</button>)}</div></div>)}
    </div>
  );
}
function WaBubble({ m, lines }: { m: Msg; lines: string[] }) {
  const mine = m.role === "user";
  return (
    <div className={cx("max-w-[86%] rounded-lg px-2.5 py-1.5 text-[13px] shadow-sm whitespace-pre-wrap", mine ? "ml-auto bg-[#D9FDD3]" : "bg-white")} data-testid={mine ? "wa-user" : "wa-agent"}>
      {m.text}
      {lines.length > 0 && <div className="mt-1.5 pt-1.5 border-t border-gray-100 text-[12px] text-gray-700 grid gap-0.5">{lines.map((l, i) => <div key={i}>{l.split("*").map((seg, j) => (j % 2 ? <b key={j}>{seg}</b> : seg))}</div>)}</div>}
      <div className="text-[9.5px] text-gray-400 text-right mt-0.5">{m.at.slice(11, 16)}{mine && " ✓✓"}</div>
    </div>
  );
}

// ------------------------------------------------------------------ Phone call (simulated inbound / outbound)
export function CallScreen() {
  const s = useUi(); const d = useDb();
  const mode = (s.route.params?.mode ?? "inbound") as "inbound" | "outbound";
  const offerId = s.route.params?.offer ?? "OFR-PANEER-SUN";
  const [phase, setPhase] = useState<"ringing" | "verify" | "live" | "ended">(mode === "outbound" ? "ringing" : "verify");
  const [secs, setSecs] = useState(0); const [interim, setInterim] = useState(""); const [listening, setListening] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    ui.set((x) => ({ ...x, channel: "voice", callMessages: [] }));
    const l = (m: Msg, ch: string) => { if (ch === "voice") speak(m.text); };
    speakListeners.add(l);
    return () => { speakListeners.delete(l); stopSpeaking(); ui.set((x) => ({ ...x, channel: "inapp" })); };
  }, []);
  useEffect(() => { if (phase === "ringing" || phase === "ended") return; const t = setInterval(() => setSecs((x) => x + 1), 1000); return () => clearInterval(t); }, [phase]);
  useEffect(() => {
    if (phase === "verify" && !started.current) {
      started.current = true;
      logCall({ name: "inbound_call: routed out-of-hours helpline → Graine voice agent", kind: "workflow", status: "ok", channel: "voice" });
      pushVoice(`Namaste! You've reached Country Delight's AI assistant — this call may be recorded. I've matched this number to ${d.customer.firstName}'s account. For your security, please confirm your delivery pincode.`);
    }
  }, [phase]);
  const pushVoice = (text: string) => { ui.set((x) => ({ ...x, callMessages: [...x.callMessages, { id: `v${Date.now()}`, role: "agent", text, at: db.get().clock, channel: "voice" }] })); speak(text); };
  const accept = () => {
    const c = db.get().customer;
    const checks = { consentVoice: c.consents.promoVoice, dnc: !c.dnc, cap: c.promoTouchesThisMonth < 2 };
    logCall({ name: "outbound_call: eligibility re-checked at dial time", kind: "guardrail", status: Object.values(checks).every(Boolean) ? "ok" : "refused", channel: "voice", args: checks });
    setPhase("live"); outreachOpener(offerId, "voice");
  };
  const verify = () => { logCall({ name: "identity: caller ID + pincode verified", kind: "guardrail", status: "ok", channel: "voice" }); ui.set((x) => ({ ...x, callMessages: [...x.callMessages, { id: `u${Date.now()}`, role: "user", text: "It's 122 011.", at: db.get().clock, channel: "voice" }] })); setPhase("live"); pushVoice("Thank you, you're verified. How can I help you today?"); };
  const mic = () => {
    if (!recognitionSupported()) { toast("Browser speech isn't available — tap a phrase instead", "info"); return; }
    stopSpeaking(); setListening(true);
    listen({ onInterim: setInterim, onFinal: (t) => { setInterim(""); phase === "verify" ? verify() : void userSays(t, "voice"); }, onError: () => setListening(false), onEnd: () => setListening(false) });
  };
  const end = () => { stopSpeaking(); setPhase("ended"); logCall({ name: "call_ended: summary + transcript → webhook (simulated)", kind: "workflow", status: "ok", channel: "voice", args: { seconds: secs, turns: ui.get().callMessages.length } }); };
  const msgs = s.callMessages.slice(-5);
  const lastAgent = [...s.callMessages].reverse().find((m) => m.role === "agent");
  const chips = phase === "verify" ? [] : (s.callMessages[s.callMessages.length - 1]?.role === "agent" ? lastAgent?.chips ?? [] : []);
  const suggestions = mode === "inbound" && phase === "live" && s.callMessages.length <= 3 ? ["My milk hasn't arrived", "Mera doodh abhi tak nahi aaya", "Why was ₹500 deducted?"] : [];
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#102A1B] to-[#06140B] text-white" data-testid="call-screen">
      <div className="pt-14 text-center">
        <div className="w-20 h-20 mx-auto rounded-full orb grid place-items-center"><I.sparkle size={34} /></div>
        <div className="mt-3 font-bold text-[18px]">{mode === "outbound" ? "Country Delight Assistant" : "Country Delight"}</div>
        <div className="text-[12px] text-white/60">{phase === "ringing" ? "Incoming call · AI assistant" : phase === "ended" ? "Call ended" : `${mode === "outbound" ? "AI assistant · " : "Helpline · AI assistant · "}${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`}</div>
        <div className="mt-1 text-[10.5px] text-white/40">Simulated call · browser speech · no real telephony</div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 mt-4 grid gap-2 content-end" data-testid="captions">
        {msgs.map((m) => <div key={m.id} className={cx("rounded-2xl px-3 py-2 text-[13px] leading-relaxed", m.role === "user" ? "ml-auto bg-white/15 max-w-[80%]" : "bg-white/5 border border-white/10")}>{m.role === "agent" && <span className="text-[10px] text-[#8BE29A] block">ASSISTANT</span>}{m.text}</div>)}
        {s.thinking && <div className="text-[12px] text-white/50">…</div>}
        {interim && <div className="ml-auto text-[13px] text-white/70 italic">{interim}</div>}
      </div>
      {phase === "ringing" ? (
        <div className="flex justify-around pb-14 pt-6">
          <button type="button" aria-label="Decline" onClick={() => { logCall({ name: "outbound_call: declined by customer", kind: "workflow", status: "info", channel: "voice" }); back(); }} className="w-16 h-16 rounded-full bg-red-500 grid place-items-center rotate-[135deg]"><I.phone size={26} /></button>
          <button type="button" aria-label="Accept" data-testid="call-accept" onClick={accept} className="w-16 h-16 rounded-full bg-[#25D366] grid place-items-center animate-pulse"><I.phone size={26} /></button>
        </div>
      ) : phase === "ended" ? (
        <div className="p-6 grid gap-2"><div className="text-center text-[12px] text-white/60">Transcript and outcome saved to call history (simulated).</div><button type="button" onClick={() => navigate("home")} className="h-11 rounded-xl bg-white text-cd-deep font-bold">Back to app</button></div>
      ) : (
        <div className="px-4 pb-8 pt-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {phase === "verify" && <button type="button" onClick={verify} data-testid="call-verify" className="shrink-0 h-9 px-3 rounded-full bg-white/15 text-[12px]">Say: “It's 122 011” (demo pincode)</button>}
            {chips.map((c) => <button key={c.label} type="button" onClick={() => handleEvent(c.event, "voice")} className="shrink-0 h-9 px-3 rounded-full bg-white/15 text-[12px]">Say: “{c.label}”</button>)}
            {suggestions.map((t) => <button key={t} type="button" onClick={() => userSays(t, "voice")} className="shrink-0 h-9 px-3 rounded-full bg-white/15 text-[12px]">Say: “{t}”</button>)}
          </div>
          <div className="flex justify-around items-center">
            <div className="w-14 h-14 rounded-full bg-white/10 grid place-items-center"><I.volume size={22} /></div>
            <button type="button" aria-label="Speak" onClick={mic} className={cx("w-16 h-16 rounded-full grid place-items-center", listening ? "bg-[#2FA84F] animate-pulse" : "bg-white/20")}><I.mic size={26} /></button>
            <button type="button" aria-label="End call" data-testid="call-end" onClick={end} className="w-14 h-14 rounded-full bg-red-500 grid place-items-center rotate-[135deg]"><I.phone size={22} /></button>
          </div>
        </div>)}
    </div>
  );
}
