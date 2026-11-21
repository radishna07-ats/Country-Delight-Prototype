import { useState } from "react";
import { back, logCall, useDb } from "../backend/store";
import { I } from "../ui/icons";
import { Btn, Sheet } from "../ui/kit";
import { openAssistant } from "../agent-ui/assistant";

// Faithful reproduction of the existing Ayuh decision tree (recording S3 03:48–04:27),
// with the PROPOSED coexistence: leaves and "Something else" can hand over to the Graine assistant with context.
type Node = { q: string; opts: { label: string; next?: string; graine?: string }[] };
const TREE: Record<string, Node> = {
  vip: { q: "What do you need help with?", opts: [{ label: "Explore Plan" }, { label: "Know more about VIP", graine: "How does VIP benefit work?" }, { label: "Something else", next: "else" }] },
  recharges: { q: "Please select any one option from the below", opts: [
    { label: "Recharge Cashback not received", graine: "My recharge cashback was not received" },
    { label: "Payment not reflected in CD Money Balance", graine: "My payment failed and is not reflected" },
    { label: "Referral cashback is pending" }] },
  profile: { q: "Please select any one option from the below", opts: [
    { label: "My location is Non Serviceable" }, { label: "Update mobile number" }, { label: "Update delivery address" },
    { label: "Set delivery preference", graine: "Please call before delivery" }, { label: "Set Vacation", graine: "Pause my deliveries next week" }] },
  else: { q: "Please select the option", opts: [{ label: "Describe the issue and raise a ticket" }, { label: "Talk to an agent", next: "agent" }] },
  agent: { q: "Select the option from below", opts: [{ label: "Call Us", next: "call" }] },
};

export function Ayuh() {
  const d = useDb();
  const [path, setPath] = useState<{ topic: string; node: string; picks: string[] } | null>(null);
  const [leaf, setLeaf] = useState<{ label: string; graine?: string } | null>(null);
  const [dial, setDial] = useState(false);
  const pick = (o: { label: string; next?: string; graine?: string }) => {
    if (o.next === "call") { setDial(true); return; }
    if (o.next) { setPath((p) => ({ ...p!, node: o.next!, picks: [...p!.picks, o.label] })); return; }
    setPath((p) => ({ ...p!, picks: [...p!.picks, o.label] })); setLeaf(o);
  };
  const context = path ? [path.topic, ...path.picks].join(" › ") : "";
  const handToGraine = (sayText?: string) => {
    logCall({ name: "ayuh_handoff → graine (context passed)", kind: "app_action", status: "ok", args: { context } });
    openAssistant({ context, say: sayText });
  };
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="h-14 px-3 flex items-center gap-2 border-b border-cd-line">
        <button type="button" aria-label="Back" onClick={() => (path ? (setPath(null), setLeaf(null)) : back())} className="w-9 h-9 grid place-items-center"><I.back /></button>
        <AyuhFace /><div className="flex-1 font-bold text-[14px]">How can I help?</div><I.history size={20} className="text-cd-muted" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 text-[13px]">
        {!path ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center"><AyuhFace big /><div className="text-[18px] font-bold">Hi, I'm Ayuh!</div><div className="text-[11.5px] text-cd-muted">Country Delight's existing help assistant (reproduced from the app)</div></div>
        ) : (
          <div className="grid gap-3">
            <div className="ml-auto max-w-[80%] rounded-2xl bg-cd-mint px-3 py-2">{path.topic}</div>
            {path.topic === "I have an issue with my VIP Membership" && (
              <div className="rounded-2xl bg-[#2E2B28] text-white p-3"><div className="text-[11px] opacity-70">Here are the recent details of your VIP Membership</div><div className="font-extrabold text-[18px] mt-1">VIP · {d.customer.vip.plan}</div><div className="text-[11.5px] opacity-80">Valid till 2 Dec · benefit left ₹{d.customer.vip.benefitLeft} of ₹{d.customer.vip.benefitTotal}</div></div>)}
            {path.picks.map((p) => <div key={p} className="ml-auto max-w-[80%] rounded-2xl bg-cd-mint px-3 py-2">{p}</div>)}
            {!leaf && <div className="text-cd-muted">{TREE[path.node].q}</div>}
            {leaf && (
              <div className="grid gap-2">
                <div className="rounded-2xl bg-gray-50 px-3 py-2">{leaf.graine ? "We've noted this." : "We'll raise a ticket and our team will get back to you."}</div>
                <div className="rounded-2xl border-2 border-dashed border-graine-500 bg-graine-100/50 p-3" data-testid="ayuh-graine-handoff">
                  <div className="text-[11px] font-bold text-graine-600 flex items-center gap-1"><I.sparkle size={14} /> PROPOSED · Graine works alongside Ayuh</div>
                  <div className="mt-1 text-[12.5px]">Want me to check this on your account right now? Describe it in your own words, or speak.</div>
                  <Btn size="sm" className="mt-2 !bg-graine-600" onClick={() => handToGraine(leaf.graine)}>Ask the assistant</Btn>
                </div>
              </div>)}
          </div>)}
      </div>
      {!path && (
        <div className="p-3 grid grid-cols-3 gap-2">
          {[["I have an issue with my VIP Membership", "vip"], ["I have an issue with my Recharges", "recharges"], ["Update my Profile & Address", "profile"]].map(([t, n]) => (
            <button key={n} type="button" onClick={() => setPath({ topic: t, node: n, picks: [] })} className="rounded-xl border border-cd-line p-2.5 text-left text-[11px] leading-tight h-20 flex flex-col justify-between" data-testid={`ayuh-${n}`}>{t}<I.down size={14} className="-rotate-45 self-end" /></button>))}
        </div>)}
      {path && !leaf && (
        <div className="p-3 grid gap-2 border-t border-cd-line">
          {TREE[path.node].opts.map((o) => <button key={o.label} type="button" onClick={() => pick(o)} className="h-11 rounded-xl border border-cd-line px-3 flex items-center justify-between text-[12.5px]" data-testid={`ayuh-opt-${o.label}`}>{o.label}<I.chevron size={16} /></button>)}
          {path.node === "else" && <button type="button" onClick={() => handToGraine()} className="h-11 rounded-xl border-2 border-dashed border-graine-500 px-3 flex items-center gap-2 text-[12.5px] text-graine-600 font-bold" data-testid="ayuh-ask-graine"><I.sparkle size={16} /> Ask in your own words (proposed)</button>}
        </div>)}
      <Sheet open={dial} onClose={() => setDial(false)} title="Call Us">
        <div className="p-4 grid gap-3 text-[12.5px]">
          <div className="text-center text-[20px] font-bold tracking-wider">Customer care</div>
          <div className="text-center text-cd-muted">Opens the phone dialer · 6 am – 9 pm. Outside these hours there is no live channel today.</div>
          <div className="rounded-xl border-2 border-dashed border-graine-500 p-3"><b className="text-graine-600">Proposed:</b> out-of-hours calls are answered by the Graine voice agent, which can check delivery status, raise a case and book a 6 AM callback.</div>
          <Btn onClick={() => { setDial(false); handToGraine("My milk hasn't arrived"); }}>Try the proposed experience</Btn>
        </div>
      </Sheet>
    </div>
  );
}

const AyuhFace = ({ big }: { big?: boolean }) => (
  <svg width={big ? 64 : 28} height={big ? 64 : 28} viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="15" fill="#1D2A22" /><ellipse cx="16" cy="18" rx="10" ry="8" fill="#fff" /><circle cx="12" cy="17" r="1.8" fill="#1D2A22" /><circle cx="20" cy="17" r="1.8" fill="#1D2A22" /><path d="M12.5 21.5c2.2 1.6 4.8 1.6 7 0" stroke="#1D2A22" strokeWidth="1.4" fill="none" /></svg>
);
