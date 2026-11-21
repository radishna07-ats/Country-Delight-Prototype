import { useState } from "react";
import type { CardData } from "../backend/store";
import { useDb } from "../backend/store";
import { handleEvent } from "../agent/engine";
import { byId } from "../data/catalogue";
import type { Channel } from "../data/types";
import { fmtDate, fmtTs, rupees, unitPrice } from "../backend/rules";
import { ProductArt } from "../ui/ProductArt";
import { I } from "../ui/icons";
import { Btn, Pill, Stepper, cx } from "../ui/kit";

const STATE: Record<string, { label: string; tone: "mint" | "gray" | "warn" | "sky" }> = {
  pending: { label: "Awaiting your confirmation", tone: "sky" }, confirmed: { label: "Confirmed · done", tone: "mint" },
  cancelled: { label: "Cancelled · nothing changed", tone: "gray" }, undone: { label: "Undone", tone: "gray" }, failed: { label: "Not done", tone: "warn" },
};

function Shell({ title, icon, state, children, testId, tag }: { title: string; icon: React.ReactNode; state?: string; children: React.ReactNode; testId?: string; tag?: string }) {
  return (
    <div data-testid={testId} data-state={state} className={cx("rounded-2xl border bg-white overflow-hidden shadow-card", state === "confirmed" ? "border-cd-leaf" : state === "failed" ? "border-orange-300" : "border-cd-line")}>
      <div className="px-3 py-2 bg-cd-mint/70 flex items-center gap-2 border-b border-cd-line/70">
        <span className="text-cd-green">{icon}</span><span className="text-[12px] font-extrabold text-cd-deep flex-1">{title}</span>
        {tag && <Pill tone="graine">{tag}</Pill>}
        {state && <Pill tone={STATE[state]?.tone ?? "gray"}>{state === "confirmed" && <I.check size={11} />}{STATE[state]?.label ?? state}</Pill>}
      </div>
      <div className="p-3 text-[12.5px]">{children}</div>
    </div>
  );
}
const Line = ({ k, v, strong }: { k: React.ReactNode; v: React.ReactNode; strong?: boolean }) => <div className="flex justify-between gap-3 py-0.5"><span className="text-cd-muted">{k}</span><span className={cx("text-right", strong && "font-extrabold")}>{v}</span></div>;
const Actions = ({ c, ch, yes = "Confirm", no = "Cancel" }: { c: CardData; ch: Channel; yes?: string; no?: string }) =>
  c.state === "pending" ? (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <Btn tone="outline" size="sm" onClick={() => handleEvent({ kind: "cancel", changeId: c.changeId }, ch)} testId="card-cancel">{no}</Btn>
      <Btn size="sm" onClick={() => handleEvent({ kind: "confirm", changeId: c.changeId }, ch)} testId="card-confirm">{yes}</Btn>
    </div>) : null;

export function AgentCard({ c, ch }: { c: CardData; ch: Channel }) {
  const d = useDb(); const vip = d.customer.vip.active;
  switch (c.type) {
    case "products": return <ProductsCard c={c} ch={ch} vip={vip} />;
    case "cart_result": return (
      <Shell title="Cart updated" icon={<I.cart size={16} />} testId="card-cart" tag="verified">
        {c.lines.map((l: any) => <Line key={l.productId} k={`${byId(l.productId).name} × ${l.qty}`} v={rupees(unitPrice(byId(l.productId), vip) * l.qty)} />)}
        <div className="border-t border-cd-line mt-1 pt-1"><Line k="Cart total" v={rupees(c.total)} strong /></div>
        <div className="text-[10.5px] text-cd-muted mt-1">Read back from the cart after the change. Checkout stays with you.</div>
      </Shell>);
    case "sub_change": {
      const p = byId(c.productId);
      return (
        <Shell title="Subscription change" icon={<I.box size={16} />} state={c.state} testId="card-sub-change">
          <div className="flex gap-3 items-center">
            <ProductArt p={p} size={52} />
            <div className="flex-1"><div className="font-bold leading-tight">{p.name}</div><div className="text-[11px] text-cd-muted">{p.size} · {rupees(c.unit)} each</div></div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
            <div className="rounded-xl bg-gray-50 py-2"><div className="text-[10px] text-cd-muted">NOW</div><div className="font-extrabold text-[15px]" data-testid="card-from">{c.fromQty} × </div><div className="text-[10.5px]">{c.fromFreq}</div></div>
            <I.chevron size={18} className="text-cd-green" />
            <div className="rounded-xl bg-cd-mint py-2 ring-1 ring-cd-leaf"><div className="text-[10px] text-cd-green">NEW</div><div className="font-extrabold text-[15px]" data-testid="card-to">{c.toQty} × </div><div className="text-[10.5px]">{c.toFreq}</div></div>
          </div>
          <div className="mt-2"><Line k="Effective from" v={<b>{fmtDate(c.effective)}</b>} /><Line k="Per delivery" v={c.perDelta ? `${c.perDelta > 0 ? "+" : "−"}${rupees(Math.abs(c.perDelta))}` : "no change"} /><Line k="Approx. per month" v={`${rupees(c.monthlyFrom)} → ${rupees(c.monthlyTo)}`} /></div>
          {c.offerImpact && <div className="mt-2 rounded-lg bg-orange-50 text-cd-danger text-[11.5px] px-2 py-1.5 flex gap-1.5"><I.alert size={14} />{c.offerImpact}</div>}
          {c.error && <div className="mt-2 text-[11.5px] text-cd-danger">{c.error}</div>}
          <Actions c={c} ch={ch} />
          {c.state === "pending" && <div className="text-[10.5px] text-cd-muted mt-2">Changes before 11 pm apply from tomorrow's delivery.</div>}
        </Shell>);
    }
    case "new_sub": {
      const p = byId(c.productId);
      return (
        <Shell title="New subscription" icon={<I.plus size={16} />} state={c.state} testId="card-new-sub">
          <div className="flex gap-3 items-center"><ProductArt p={p} size={52} /><div className="flex-1"><div className="font-bold">{p.name}</div><div className="text-[11px] text-cd-muted">{c.qty} × {p.size}</div></div></div>
          <div className="mt-2"><Line k="Frequency" v={c.freq} /><Line k="First delivery" v={<b>{fmtDate(c.first)}</b>} /><Line k="Per delivery" v={rupees(c.unit * c.qty)} /><Line k="Approx. per month" v={rupees(c.monthly)} /></div>
          {c.offer && <div className="mt-2 rounded-lg bg-[#FFF8DA] p-2 text-[11.5px]"><b>🎁 {c.offer.name}</b> — {c.offer.benefit} · till {fmtDate(c.offer.validTill)}<ul className="list-disc ml-4 mt-1 text-cd-muted">{c.offer.conditions.map((x: string) => <li key={x}>{x}</li>)}</ul></div>}
          <Actions c={c} ch={ch} />
        </Shell>);
    }
    case "remove_sub": return (
      <Shell title="Remove subscription" icon={<I.x size={16} />} state={c.state} testId="card-remove">
        <div className="flex gap-3 items-center"><ProductArt p={byId(c.productId)} size={44} /><div><div className="font-bold">{byId(c.productId).name}</div><div className="text-[11px] text-cd-muted">Stops from {fmtDate(c.from)}</div></div></div>
        {c.offerImpact && <div className="mt-2 rounded-lg bg-orange-50 text-cd-danger text-[11.5px] px-2 py-1.5">{c.offerImpact}</div>}
        <Actions c={c} ch={ch} yes="Remove" no="Keep it" />
      </Shell>);
    case "vacation": return (
      <Shell title={c.productId ? `Pause ${byId(c.productId).name}` : "Vacation · pause all deliveries"} icon={<I.plane size={16} />} state={c.state} testId="card-vacation">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 p-2"><div className="text-[10px] text-cd-muted">START</div><div className="font-extrabold" data-testid="vac-start">{fmtDate(c.start)}</div></div>
          <div className="rounded-xl bg-gray-50 p-2"><div className="text-[10px] text-cd-muted">END</div><div className="font-extrabold" data-testid="vac-end">{fmtDate(c.end)}</div></div>
        </div>
        <div className="mt-2 rounded-lg bg-cd-mint text-cd-green text-[11.5px] px-2 py-1.5 text-center">Deliveries resume from {fmtDate(c.resume)}</div>
        <div className="mt-2">{c.days && <Line k="Days" v={c.days} />}<Line k="Deliveries skipped" v={`${c.skipped.deliveries} (≈ ${rupees(c.skipped.value)} not charged)`} /></div>
        {!c.productId && <div className="text-[10.5px] text-cd-muted mt-1">Orders paused · no wallet deduction or auto-recharge · membership to be paused (as shown in the app). Max 60 days.</div>}
        <Actions c={c} ch={ch} />
      </Shell>);
    case "wallet_summary": return (
      <Shell title="CD Money" icon={<I.wallet size={16} />} testId="card-wallet" tag="from your account">
        <div className="text-[24px] font-extrabold">{rupees(c.balance)}</div>
        {c.runwayDays !== null && c.runwayDays !== undefined && (<><div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className={cx("h-full", c.runwayDays <= 2 ? "bg-orange-400" : "bg-cd-leaf")} style={{ width: `${Math.min(100, c.runwayDays * 14)}%` }} /></div>
          <div className="text-[11px] text-cd-muted mt-1">≈ {c.runwayDays} days of deliveries at ~{rupees(c.perDay)}/day</div></>)}
        <div className="mt-2"><Line k="Autopay" v={c.autopay?.enabled ? `On · +${rupees(c.autopay.amount)} below ${rupees(c.autopay.threshold)}` : "Off"} />
          {c.vip && <Line k="VIP benefit left" v={`${rupees(c.vip.benefitLeft)} of ${rupees(c.vip.benefitTotal)}`} />}</div>
      </Shell>);
    case "txn_list": return (
      <Shell title="Wallet transactions" icon={<I.receipt size={16} />} testId="card-txn-list" tag="ledger">
        <div className="divide-y divide-cd-line -my-1">
          {c.txnIds.map((id: string) => { const t = d.txns.find((x) => x.id === id); if (!t) return null; return (
            <button key={id} type="button" onClick={() => handleEvent({ kind: "explain_txn", txnId: id }, ch)} className={cx("w-full py-2 flex items-center gap-2 text-left", c.highlight === id && "bg-[#FFF8DA] -mx-3 px-3 w-[calc(100%+24px)]")}>
              <div className="flex-1"><div className="font-semibold text-[12px]">{t.title}</div><div className="text-[10.5px] text-cd-muted">{fmtTs(t.ts)}</div></div>
              <div className={cx("font-bold text-[12px]", t.amount < 0 ? "" : "text-cd-green")}>{t.amount < 0 ? "−" : "+"}{rupees(Math.abs(t.amount))}</div><I.chevron size={14} className="text-cd-muted" />
            </button>); })}
        </div>
        <div className="text-[10.5px] text-cd-muted mt-1">Tap a line to have it explained.</div>
      </Shell>);
    case "txn_explain": return (
      <Shell title="Explained from your ledger" icon={<I.info size={16} />} testId="card-txn-explain" tag="source data">
        <div className="font-bold">{c.title} · {c.amount < 0 ? "−" : "+"}{rupees(Math.abs(c.amount))}</div>
        <ul className="mt-1.5 grid gap-1">{c.lines.map((l: string) => <li key={l} className="text-[11.5px] rounded-lg bg-gray-50 px-2 py-1 font-mono">{l}</li>)}</ul>
        {c.rule && <div className="mt-2 text-[11.5px] rounded-lg bg-cd-mint px-2 py-1.5"><b>Rule:</b> {c.rule}</div>}
      </Shell>);
    case "recharge_options": return (
      <Shell title="Smart Recharge options" icon={<I.wallet size={16} />} testId="card-recharge">
        {c.plans.map((p: any) => <div key={p.id} className="rounded-xl border border-cd-line p-2 mb-2"><div className="font-bold">{p.name} · {rupees(p.amount)}</div><div className="text-[11.5px]">{rupees(p.cashback)} cashback · {p.schedule}</div><div className="text-[10.5px] text-cd-muted">{p.notes}</div></div>)}
        <div className="text-[11px] text-cd-muted">Or recharge any amount yourself. Payment happens in CD Money — the assistant never pays.</div>
      </Shell>);
    case "order_status": {
      const o = d.orders.find((x) => x.id === c.orderId); if (!o) return null;
      return (
        <Shell title={`Order ${o.id} · ${fmtDate(o.date)}`} icon={<I.truck size={16} />} testId="card-order" tag="live status">
          <div className="flex items-center gap-2"><Pill tone={o.status === "delivered" ? "mint" : "sky"}>{o.status === "scheduled" ? "Scheduled" : o.status.replace(/_/g, " ")}{o.statusAt ? ` · ${o.statusAt}` : ""}</Pill><span className="text-[11px] text-cd-muted">{o.slot}</span></div>
          <div className="mt-2 grid gap-1">{o.lines.map((l) => <div key={l.productId} className="flex items-center gap-2"><ProductArt p={byId(l.productId)} size={30} /><span className="flex-1">{byId(l.productId).name} × {l.qty}</span><span>{rupees(l.price * l.qty)}</span></div>)}</div>
          {c.pod && <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 p-2"><div className="w-14 h-10 rounded-md bg-gradient-to-br from-gray-300 to-gray-500 grid place-items-center text-[8px] text-white font-bold">{c.pod.photo === "gate" ? "GATE" : "DOOR"} PHOTO</div><div className="text-[11px] text-cd-muted">Proof of delivery · {c.pod.at} · {c.pod.note}</div></div>}
        </Shell>);
    }
    case "resolution_options": return (
      <Shell title="What Country Delight's policy allows" icon={<I.shield size={16} />} testId="card-resolution" tag="policy">
        <div className="grid gap-2">{c.options.map((o: any) => (
          <button key={o.id} type="button" onClick={() => handleEvent({ kind: "resolve", orderId: c.orderId, option: o.id, reason: c.reason }, ch)} className="text-left rounded-xl border border-cd-line p-2.5 hover:border-cd-leaf hover:bg-cd-mint" data-testid={`resolve-${o.id}`}>
            <div className="font-bold">{o.label}</div><div className="text-[11px] text-cd-muted">{o.detail}</div></button>))}</div>
        <div className="text-[10.5px] text-cd-muted mt-2">Prototype policy. In production these options come from Country Delight's resolution rules.</div>
      </Shell>);
    case "resolution_confirm": return <Shell title="Confirm resolution" icon={<I.check size={16} />} state={c.state} testId="card-resolution-confirm"><div className="font-bold">{c.label}</div><Actions c={c} ch={ch} /></Shell>;
    case "ticket": { const t = d.tickets.find((x) => x.id === c.ticketId); return t ? (
      <Shell title="Support case" icon={<I.receipt size={16} />} testId="card-ticket" tag="created">
        <div className="flex items-center justify-between"><span className="font-extrabold text-[15px]" data-testid="ticket-id">{t.id}</span><Pill tone={t.status === "resolved" ? "mint" : "warn"}>{t.status.replace("_", " ")}</Pill></div>
        <div className="text-[11.5px] mt-1">{t.summary}</div>{t.resolution && <div className="text-[11.5px] mt-1 text-cd-green">Resolution: {t.resolution}</div>}
      </Shell>) : null; }
    case "prefs_change": return (
      <Shell title="Delivery preferences" icon={<I.bell size={16} />} state={c.state} testId="card-prefs">
        <Line k="Ring the bell" v={`${c.from.ringBell ? "On" : "Off"} → ${c.to.ringBell ? "On" : "Off"}`} /><Line k="Call before delivery" v={`${c.from.callBefore ? "On" : "Off"} → ${c.to.callBefore ? "On" : "Off"}`} />
        <Actions c={c} ch={ch} />
      </Shell>);
    case "offer": return (
      <Shell title="Offer you're eligible for" icon={<I.tag size={16} />} testId="card-offer" tag="approved content">
        <div className="font-extrabold text-[14px]">{c.name}</div><div>{c.benefit}</div><div className="text-[11px] text-cd-muted">Valid till {fmtDate(c.validTill)} · prototype offer</div>
        <ul className="list-disc ml-4 mt-1.5 text-[11.5px] text-cd-muted">{c.conditions.map((x: string) => <li key={x}>{x}</li>)}</ul>
      </Shell>);
    case "bundle": return (
      <Shell title={c.title} icon={<I.leaf size={16} />} testId="card-bundle">
        <div className="flex gap-2">{c.productIds.map((id: string) => <ProductArt key={id} p={byId(id)} size={52} />)}</div>
        <div className="mt-2 flex items-center justify-between"><b>{rupees(c.total)}</b><Btn size="sm" onClick={async () => { for (const id of c.productIds) await handleEvent({ kind: "add", productId: id, qty: 1 }, ch); }}>Add bundle</Btn></div>
      </Shell>);
    case "refund": return (
      <Shell title="Refund wallet balance to bank" icon={<I.wallet size={16} />} state={c.state} testId="card-refund">
        <Line k="Balance" v={rupees(c.balance)} /><Line k="Cashback (not refundable)" v={`−${rupees(c.cashback)}`} /><Line k="Refundable" v={rupees(c.amount)} strong />
        {c.reference && <Line k="Reference" v={c.reference} />}
        <div className="text-[10.5px] text-cd-muted mt-1">Bank details are collected only through Country Delight's secure SMS link — never in chat.</div>
        <Actions c={c} ch={ch} yes="Request refund" no="Not now" />
      </Shell>);
    case "safety": return <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-[11.5px] text-cd-danger flex gap-2" data-testid="card-safety"><I.shield size={16} />{c.text}</div>;
    case "handoff": return (
      <Shell title={c.open ? "Handing over to a person (simulated)" : "Callback booked"} icon={<I.users size={16} />} testId="card-handoff">
        <Line k="Case" v={<b>{c.ticketId}</b>} /><div className="text-[11.5px] mt-1 rounded-lg bg-gray-50 p-2">{c.summary}</div>
        <div className="text-[10.5px] text-cd-muted mt-1">The agent passes this summary so you don't repeat yourself.</div>
      </Shell>);
    default: return null;
  }
}

function ProductsCard({ c, ch, vip }: { c: CardData; ch: Channel; vip: boolean }) {
  return (
    <Shell title={c.items.some((i: any) => i.reason) ? "Suggested products" : "Products"} icon={<I.grid size={16} />} testId="card-products">
      <div className="grid gap-2">{c.items.map((it: any) => <ProductRow key={it.productId} it={it} ch={ch} vip={vip} date={c.date} />)}</div>
    </Shell>
  );
}
function ProductRow({ it, ch, vip, date }: { it: any; ch: Channel; vip: boolean; date: string }) {
  const p = byId(it.productId); const [qty, setQty] = useState(it.qty ?? 1); const [added, setAdded] = useState(false);
  return (
    <div className="flex items-center gap-2" data-testid={`prow-${p.id}`}>
      <ProductArt p={p} size={50} />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[12px] leading-tight">{p.name} {it.usual && <Pill tone="vip">Your usual</Pill>}</div>
        <div className="text-[11px] text-cd-muted">{p.size} · {rupees(unitPrice(p, vip))}{!p.inStockTomorrow && <span className="text-cd-danger"> · not available {fmtDate(date)}</span>}</div>
        {it.reason && <div className="text-[10.5px] text-cd-green mt-0.5">{it.reason}</div>}
      </div>
      <div className="flex flex-col items-end gap-1">
        <Stepper value={qty} onChange={setQty} min={1} max={10} />
        <Btn size="sm" tone={added ? "ghost" : "primary"} disabled={!p.inStockTomorrow} testId={`add-${p.id}`} onClick={async () => { await handleEvent({ kind: "add", productId: p.id, qty }, ch); setAdded(true); }}>{added ? <><I.check size={13} /> Added</> : "Add"}</Btn>
      </div>
    </div>
  );
}
