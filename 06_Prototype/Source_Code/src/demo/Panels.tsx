import { useState } from "react";
import { db, ui, useDb, useInspector, useUi, navigate, resetDemo, restartConversation, clearInspector, type ToolCallLog } from "../backend/store";
import { resetEngine, userSays, greet } from "../agent/engine";
import { refreshUpcomingOrders } from "../backend/api";
import { fmtDate, rupees } from "../backend/rules";
import { SCENARIOS, runCampaign } from "./scenarios";
import { I } from "../ui/icons";
import { cx } from "../ui/kit";

const CLOCKS = [
  { label: "Sat 8:15 PM · before cut-off", v: "2026-11-21T20:15" },
  { label: "Sun 5:40 AM · delivery window", v: "2026-11-22T05:40" },
  { label: "Sat 11:30 PM · after cut-off", v: "2026-11-21T23:30" },
  { label: "Sat 11:00 AM · campaign window", v: "2026-11-21T11:00" },
];

export function ScenarioPanel({ compact }: { compact?: boolean }) {
  const s = useUi(); const d = useDb();
  const [active, setActive] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [camp, setCamp] = useState<string | null>(null);
  const sc = SCENARIOS.find((x) => x.id === active);
  const sayNext = (t: string) => {
    const ch = s.route.screen === "whatsapp" ? "whatsapp" : s.route.screen === "call" ? "voice" : "inapp";
    if (ch === "inapp" && !s.agentOpen && !s.voiceOpen) ui.set((x) => ({ ...x, agentOpen: true }));
    void userSays(t, ch);
  };
  return (
    <div className={cx("flex flex-col gap-3 text-[12.5px]", compact ? "" : "h-full overflow-y-auto no-scrollbar pr-1")} data-testid="scenario-panel">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-graine-600">Graine AI × Country Delight</div>
        <div className="font-extrabold text-[18px] text-cd-deep leading-tight">Interactive prototype</div>
        <div className="text-[11.5px] text-cd-muted mt-1">Simulated back end and agent · fictional customer · no live Graine or Country Delight connection.</div>
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between"><span className="font-bold text-[12px] text-cd-ink">Demo scenarios</span>
          <label className="flex items-center gap-1 text-[11px] text-cd-muted"><input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} className="accent-[#2FA84F]" />auto-play first line</label></div>
        {SCENARIOS.map((x) => (
          <button key={x.id} type="button" data-testid={`scenario-${x.id}`} onClick={() => { setActive(x.id); setCamp(null); x.run(autoplay); }}
            className={cx("text-left rounded-xl border px-3 py-2 transition-colors", active === x.id ? "border-cd-leaf bg-cd-mint" : "border-cd-line bg-white hover:border-cd-leaf")}>
            <div className="flex items-center gap-2"><span className={cx("text-[10px] font-extrabold px-1.5 py-0.5 rounded", x.uc === "Ayuh" ? "bg-gray-100 text-gray-600" : "bg-graine-100 text-graine-600")}>{x.uc}</span><span className="font-bold text-[12.5px] flex-1">{x.title}</span><span className="text-[10px] text-cd-muted">{x.channel}</span></div>
          </button>))}
      </div>
      {sc && (
        <div className="rounded-xl bg-white border border-cd-line p-3 grid gap-2" data-testid="scenario-detail">
          <div className="text-[12px]">{sc.summary}</div>
          {sc.lines.length > 0 && <div><div className="text-[10.5px] font-bold text-cd-muted uppercase">Say next</div>
            <div className="flex flex-wrap gap-1.5 mt-1">{sc.lines.map((l) => <button key={l} type="button" onClick={() => sayNext(l)} className="px-2 py-1 rounded-lg bg-cd-mint text-cd-green text-[11.5px] font-semibold text-left">“{l}”</button>)}</div></div>}
          <div><div className="text-[10.5px] font-bold text-cd-muted uppercase">Talking points</div><ul className="list-disc ml-4 text-[11.5px] text-cd-ink">{sc.points.map((p) => <li key={p}>{p}</li>)}</ul></div>
          {sc.id === "s7" && (
            <div className="grid gap-1.5">
              <div className="text-[10.5px] font-bold text-cd-muted uppercase">Campaign console · Paneer Sundays</div>
              <div className="grid grid-cols-3 gap-1.5">{(["inapp", "whatsapp", "voice"] as const).map((chn) => <button key={chn} type="button" data-testid={`campaign-${chn}`} onClick={() => { const r = runCampaign(chn); setCamp(`${chn}: ${r.ok ? "sent" : "skipped — " + Object.entries(r.checks).filter(([, v]) => !v).map(([k]) => k).join(", ")}`); }} className="h-8 rounded-lg border border-cd-line bg-white text-[11.5px] font-bold">{chn === "inapp" ? "In-app push" : chn === "whatsapp" ? "WhatsApp" : "Voice call"}</button>)}</div>
              {camp && <div className="text-[11.5px] rounded-lg bg-gray-50 px-2 py-1" data-testid="campaign-result">{camp}</div>}
              <div className="text-[10.5px] text-cd-muted">Voice needs consent (Account & Preferences) and the 10 am–7 pm window (set the clock below).</div>
            </div>)}
        </div>)}
      <div className="rounded-xl bg-white border border-cd-line p-3 grid gap-2">
        <div className="font-bold text-[12px]">Controls</div>
        <div className="grid grid-cols-3 gap-1.5">
          <Ctl icon={<I.undo size={14} />} label="Reset data" testId="ctl-reset" onClick={() => { resetDemo(); resetEngine(); refreshUpcomingOrders(); setActive(null); }} />
          <Ctl icon={<I.chat size={14} />} label="Restart chat" testId="ctl-restart" onClick={() => { restartConversation(); resetEngine(); if (ui.get().agentOpen) greet("inapp"); }} />
          <Ctl icon={<I.home size={14} />} label="Home" testId="ctl-home" onClick={() => { ui.set((x) => ({ ...x, agentOpen: false, voiceOpen: false })); navigate("home"); }} />
        </div>
        <label className="text-[11px] text-cd-muted">Demo clock <span className="text-cd-ink font-bold">({fmtDate(d.clock)}, {d.clock.slice(11)})</span>
          <select value={d.clock} onChange={(e) => { db.set((x) => ({ ...x, clock: e.target.value })); refreshUpcomingOrders(); }} className="mt-1 w-full h-8 rounded-lg border border-cd-line bg-white px-2 text-[12px] text-cd-ink" data-testid="ctl-clock">
            {CLOCKS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}{!CLOCKS.some((c) => c.v === d.clock) && <option value={d.clock}>{d.clock}</option>}
          </select></label>
        <Toggle label="Fail next tool call (fault injection)" on={s.faults.failNext} testId="ctl-fail" onChange={(v) => ui.set((x) => ({ ...x, faults: { ...x.faults, failNext: v } }))} />
        <Toggle label="Slow network (2.2 s per call)" on={s.faults.slow} onChange={(v) => ui.set((x) => ({ ...x, faults: { ...x.faults, slow: v } }))} />
        <Toggle label="Speak replies in chat" on={s.speak} onChange={(v) => ui.set((x) => ({ ...x, speak: v }))} />
        <div className="text-[11px] text-cd-muted">Wallet {rupees(d.wallet.balance)} · {d.subscriptions.filter((x) => x.status !== "removed").length} subscriptions · {d.vacations.filter((v) => v.status !== "ended").length} vacations · {d.tickets.length} cases</div>
      </div>
    </div>
  );
}
const Ctl = ({ icon, label, onClick, testId }: { icon: React.ReactNode; label: string; onClick: () => void; testId?: string }) => (
  <button type="button" onClick={onClick} data-testid={testId} className="h-9 rounded-lg border border-cd-line bg-white text-[11px] font-bold flex items-center justify-center gap-1 hover:border-cd-leaf">{icon}{label}</button>);
const Toggle = ({ label, on, onChange, testId }: { label: string; on: boolean; onChange: (v: boolean) => void; testId?: string }) => (
  <label className="flex items-center justify-between gap-2 text-[11.5px]"><span>{label}</span><input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="accent-[#2FA84F] w-4 h-4" data-testid={testId} /></label>);

const KIND: Record<ToolCallLog["kind"], { label: string; cls: string }> = {
  api_tool: { label: "API TOOL", cls: "bg-blue-50 text-blue-700" }, app_action: { label: "APP ACTION", cls: "bg-cd-mint text-cd-green" }, component: { label: "COMPONENT", cls: "bg-purple-50 text-purple-700" },
  friction: { label: "FRICTION", cls: "bg-amber-50 text-amber-700" }, policy: { label: "RULE / POLICY", cls: "bg-orange-50 text-orange-700" }, workflow: { label: "WORKFLOW", cls: "bg-teal-50 text-teal-700" },
  nlu: { label: "INTENT", cls: "bg-gray-100 text-gray-700" }, guardrail: { label: "GUARDRAIL", cls: "bg-rose-50 text-rose-700" },
};
const ST: Record<ToolCallLog["status"], string> = { pending: "text-gray-400", ok: "text-cd-green", refused: "text-orange-600", error: "text-red-600", info: "text-gray-500" };

export function Inspector() {
  const log = useInspector(); const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="h-full flex flex-col" data-testid="inspector">
      <div className="flex items-center justify-between">
        <div><div className="font-extrabold text-[14px] text-cd-deep">Agent activity</div><div className="text-[10.5px] text-cd-muted">What the agent did, in order · all tools are simulated</div></div>
        <button type="button" onClick={clearInspector} className="text-[11px] text-cd-muted hover:text-cd-ink">Clear</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">{Object.values(KIND).map((k) => <span key={k.label} className={cx("text-[9px] font-extrabold px-1.5 py-0.5 rounded", k.cls)}>{k.label}</span>)}</div>
      <div className="mt-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar grid grid-cols-1 gap-1.5 content-start">
        {!log.length && <div className="text-[11.5px] text-cd-muted mt-4">Run a scenario or talk to the assistant. Every intent, tool call, rule check, confirmation and guardrail appears here — the evidence that the agent only acts through declared tools.</div>}
        {log.map((c) => (
          <button key={c.id} type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="text-left rounded-lg border border-cd-line bg-white px-2 py-1.5 min-w-0 w-full overflow-hidden" data-testid="inspector-row">
            <div className="flex items-center gap-1.5">
              <span className={cx("text-[8.5px] font-extrabold px-1 py-0.5 rounded shrink-0", KIND[c.kind].cls)}>{KIND[c.kind].label}</span>
              <span className="font-mono text-[11px] flex-1 truncate">{c.name}</span>
              {c.tier && <span className="text-[9px] font-bold text-gray-400">{c.tier}</span>}
              <span className={cx("text-[10px] font-bold", ST[c.status])}>{c.status === "pending" ? "…" : c.status}</span>
              {c.ms !== undefined && <span className="text-[9.5px] text-gray-400">{c.ms}ms</span>}
            </div>
            {c.note && <div className="text-[10.5px] text-orange-700 mt-0.5">{c.note}</div>}
            {open === c.id && c.args !== undefined && <pre className="mt-1 text-[10px] bg-gray-50 rounded p-1.5 whitespace-pre-wrap break-all">{JSON.stringify(c.args, null, 1)}</pre>}
          </button>))}
      </div>
      <div className="text-[9.5px] text-cd-muted mt-2">T0 read · T1 cart (read-back) · T2 account change (explicit confirm) · T3 money request (policy + confirm) · T4 payment: never by the agent.</div>
    </div>
  );
}
