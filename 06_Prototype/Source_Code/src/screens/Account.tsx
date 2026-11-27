import { useEffect, useState } from "react";
import { db, navigate, toast, ui, useDb, useUi, logCall } from "../backend/store";
import { byId } from "../data/catalogue";
import type { Frequency } from "../data/types";
import { addDays, checkVacation, earliestChangeDate, fmtDate, fmtTs, freqText, rupees, toDate, unitPrice, VACATION_MAX_DAYS, FREQ_LABEL, DAY_SHORT } from "../backend/rules";
import { api, simulateRecharge } from "../backend/api";
import { ProductArt } from "../ui/ProductArt";
import { I } from "../ui/icons";
import { Btn, Card, Empty, Header, Pill, PriceCta, Sheet, Stepper, Toggle, cx } from "../ui/kit";
import { Row } from "./Shop";
import { openAssistant } from "../agent-ui/assistant";

// ------------------------------------------------------------------ My Subscriptions
export function Subscriptions() {
  const d = useDb(); const vip = d.customer.vip.active;
  const subs = d.subscriptions.filter((s) => s.status !== "removed");
  const suggestions = ["coconut-water", "idli-batter", "taaza-paneer", "low-fat-dahi", "greek-yogurt"].filter((id) => !subs.some((s) => s.productId === id));
  return (
    <div className="pb-36">
      <Header title="My Subscriptions" />
      {!subs.length ? <Empty icon={<I.box size={26} />} title="No Subscription" body="Pick from a variety of healthy & fresh products directly from farm to home." action={<Btn onClick={() => navigate("products")}>Explore</Btn>} /> : (
        <div className="p-3 grid gap-3">
          {subs.map((s) => { const p = byId(s.productId); return (
            <Card key={s.id} className="p-3" testId={`sub-${s.productId}`}>
              <div className="flex gap-3">
                <ProductArt p={p} size={64} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold leading-tight">{p.name}</div>
                  <div className="text-[11px] text-cd-muted">{p.size}</div>
                  <div className="mt-1 flex flex-wrap gap-1"><Pill tone="mint" ><span data-testid={`sub-qty-${s.productId}`}>{freqText(s)}, Qty {s.qty}</span></Pill>{s.status === "paused" && <Pill tone="warn">Paused till {fmtDate(s.pausedUntil!)}</Pill>}</div>
                  <div className="text-[12px] font-extrabold mt-1">{rupees(unitPrice(p, vip))}</div>
                </div>
                <Btn size="sm" onClick={() => navigate("subscription_edit", { id: s.id })} testId={`edit-${s.productId}`}>EDIT</Btn>
              </div>
              {s.offer && <div className="mt-2 text-[11px] rounded-lg bg-[#FFF8DA] px-2 py-1">🎁 {s.offer.name}</div>}
            </Card>); })}
          <div className="rounded-xl bg-[#FFF8DA] px-3 py-2 text-[12px]">Upto 40% off with <b>VIP</b></div>
          <div className="flex items-center justify-between mt-1"><div className="font-extrabold text-[14px]">Add More Subscriptions</div><button type="button" onClick={() => navigate("products")} className="text-[11px] font-bold text-cd-green">VIEW ALL PRODUCTS</button></div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {suggestions.map((id) => { const p = byId(id); return (
              <button key={id} type="button" onClick={() => navigate("product", { id })} className="shrink-0 w-[100px] text-left">
                <ProductArt p={p} size={100} /><div className="text-[11px] font-bold mt-1 line-clamp-2">{p.name}</div><div className="text-[11px]">{rupees(unitPrice(p, vip))}</div>
              </button>); })}
          </div>
        </div>)}
    </div>
  );
}

// ------------------------------------------------------------------ Edit subscription (faithful to observed app)
export function SubscriptionEdit() {
  const { route } = useUi(); const d = useDb();
  const sub = d.subscriptions.find((s) => s.id === route.params?.id);
  const [qty, setQty] = useState(sub?.qty ?? 1);
  const [freq, setFreq] = useState<Frequency>(sub?.frequency ?? "daily");
  const [cancelled, setCancelled] = useState(false);
  if (cancelled) return (<div><Header title="Order Cancelled!" onBack={() => navigate("subscriptions")} /><Empty icon={<I.box size={26} />} title="Subscription Cancelled" body="Your subscription has been cancelled. Please try our other products." action={<Btn onClick={() => navigate("products")}>Browse products</Btn>} /></div>);
  if (!sub) return <div><Header title="Subscription" /><Empty icon={<I.box size={26} />} title="Not found" body="This subscription no longer exists." /></div>;
  const p = byId(sub.productId);
  const save = async () => { const r = await api.update_subscription("inapp", { id: sub.id, qty, frequency: freq }); if (r.status === "ok") { toast("Subscription updated"); navigate("subscriptions"); } else toast(r.message ?? "Couldn't update", "warn"); };
  const remove = async () => { const r = await api.remove_subscription("inapp", { id: sub.id, reason: "removed in app (no reason captured)" }); if (r.status === "ok") setCancelled(true); };
  const pause = async () => { const r = await api.pause_subscription("inapp", { id: sub.id, until: addDays(earliestChangeDate(d.clock), 6) }); if (r.status === "ok") { toast("Paused for 7 days"); navigate("subscriptions"); } };
  return (
    <div className="pb-28">
      <Header title={p.name} />
      <div className="flex justify-center bg-cd-cream py-3"><ProductArt p={p} size={180} /></div>
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between"><div><div className="font-extrabold">{p.name}</div><div className="text-[12px] text-cd-muted">{p.size} · {rupees(unitPrice(p, d.customer.vip.active))}</div></div><Stepper value={qty} onChange={setQty} min={1} max={10} testId="edit-stepper" /></div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div><div className="text-cd-muted">Subscription type</div><select value={freq} onChange={(e) => setFreq(e.target.value as Frequency)} className="mt-1 font-bold bg-transparent" aria-label="Subscription type">{p.frequencies.filter((f) => f !== "once").map((f) => <option key={f} value={f}>{FREQ_LABEL[f]}</option>)}</select></div>
          <div><div className="text-cd-muted">Start date</div><div className="mt-1 font-bold">{fmtDate(sub.startDate)}</div></div>
        </div>
        <div className="mt-5 text-[12px] text-cd-muted">Pause/Remove Subscription</div>
        <div className="mt-2 flex gap-2">
          <Btn tone="outline" size="sm" onClick={pause} tier="T2">PAUSE</Btn>
          <Btn tone="danger" size="sm" onClick={remove} testId="remove-sub" tier="T2">REMOVE</Btn>
          <Btn tone="outline" size="sm" onClick={() => navigate("vacations", { open: "1" })}>GOING ON VACATION</Btn>
        </div>
        {sub.offer && <div className="mt-3 text-[11.5px] rounded-lg bg-[#FFF8DA] px-3 py-2">🎁 {sub.offer.name}. Changing frequency or removing ends the offer.</div>}
      </div>
      <div className="absolute bottom-[86px] left-0 right-0 px-4 z-10"><PriceCta price={rupees(unitPrice(p, d.customer.vip.active) * qty)} label="Confirm subscription" onClick={save} testId="edit-confirm" tier="T2" /></div>
    </div>
  );
}

// ------------------------------------------------------------------ Vacations (+ Set Vacation sheet, Max 60 days)
export function Vacations() {
  const d = useDb(); const { route } = useUi();
  const [open, setOpen] = useState(route.params?.open === "1");
  const active = d.vacations.filter((v) => v.status !== "ended");
  useEffect(() => {
    if (!open) return;
    // Friction rule (Graine "stalled_on_step"): sheet open 20 s without a confirmed range → one quiet suggestion
    const t = setTimeout(() => {
      const s = ui.get(); if (s.nudgesShown >= 3 || Date.now() - s.lastNudgeAt < 20000) return;
      logCall({ name: "friction: stalled_on_step (set_vacation, 20s)", kind: "friction", status: "info" });
      ui.set((x) => ({ ...x, nudge: { screen: "vacations", text: "Want me to pick the dates? Just say “pause next week”.", event: { kind: "say", text: "Pause my deliveries next week" } }, nudgesShown: x.nudgesShown + 1, lastNudgeAt: Date.now() }));
    }, 20000);
    return () => clearTimeout(t);
  }, [open]);
  return (
    <div className="pb-36">
      <Header title="Vacations" />
      {active.length ? (
        <div className="p-3 grid gap-3">
          {active.map((v) => (
            <Card key={v.id} className="p-3" testId="vacation-card">
              <div className="grid grid-cols-2 text-[12px]"><div><div className="text-cd-muted">Start Date</div><div className="font-bold">{fmtDate(v.start)}</div></div><div><div className="text-cd-muted">End Date</div><div className="font-bold">{fmtDate(v.end)}</div></div></div>
              <div className="mt-2 rounded-lg bg-cd-mint text-cd-green text-[11.5px] px-2 py-1.5 text-center">Any upcoming delivery will resume from {fmtDate(addDays(v.end, 1))}</div>
              <Btn tone="dark" className="w-full mt-3" onClick={async () => { await api.end_vacation("inapp", v.id); toast("Vacation ended"); }} tier="T2">END VACATION</Btn>
            </Card>))}
          <div className="font-bold text-[13px] mt-1">Subscription Paused</div>
          {d.subscriptions.filter((s) => s.status !== "removed").map((s) => <Card key={s.id} className="p-2.5 flex items-center gap-3"><ProductArt p={byId(s.productId)} size={44} /><div className="flex-1 text-[12px] font-bold">{byId(s.productId).name}<div className="text-[11px] text-cd-muted font-medium">{freqText(s)}, Qty {s.qty}</div></div><Pill tone="warn">Paused</Pill></Card>)}
        </div>
      ) : (
        <Empty icon={<I.plane size={28} />} title="Plan your vacations" body="Enjoy a worry-free vacation: your orders will be paused · no wallet deduction or auto-recharge · membership to be paused." />
      )}
      <div className="absolute bottom-[86px] left-0 right-0 px-4 z-10"><Btn tone="dark" size="lg" className="w-full" onClick={() => setOpen(true)} testId="set-vacation">SET VACATION</Btn></div>
      <SetVacationSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function SetVacationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useDb();
  const [start, setStart] = useState<string | null>(null); const [end, setEnd] = useState<string | null>(null);
  const first = earliestChangeDate(d.clock); const monthStart = "2026-11-01";
  const cells: (string | null)[] = []; const lead = toDate(monthStart).getUTCDay();
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 0; i < 120; i++) { const x = addDays(monthStart, i); if (x > "2027-02-28") break; cells.push(x); }
  const chk = start && end ? checkVacation(d.clock, start, end, d.vacations) : null;
  const pick = (x: string) => { if (!start || (start && end) || x < start) { setStart(x); setEnd(null); } else setEnd(x); };
  const confirm = async () => { if (!start || !end) return; const r = await api.create_vacation("inapp", { start, end }); if (r.status === "ok") { toast("Vacation set successfully"); onClose(); setStart(null); setEnd(null); } else toast(r.message ?? "Couldn't set", "warn"); };
  return (
    <Sheet open={open} onClose={onClose} title="Set Vacation" testId="vacation-sheet">
      <div className="px-4 pb-4">
        <div className="text-center text-[12px] text-cd-muted">Select start and end date (Max {VACATION_MAX_DAYS} days)</div>
        <div className="grid grid-cols-7 gap-y-1 mt-3 text-center text-[11px] text-cd-muted">{DAY_SHORT.map((x) => <div key={x}>{x}</div>)}</div>
        <div className="grid grid-cols-7 gap-y-1 mt-1 max-h-[260px] overflow-y-auto no-scrollbar">
          {cells.map((x, i) => x === null ? <div key={`e${i}`} /> : (
            <button key={x} type="button" disabled={x < first} onClick={() => pick(x)} data-testid={`cal-${x}`}
              className={cx("h-9 rounded-lg text-[13px] font-semibold disabled:text-gray-300", (x === start || x === end) && "bg-cd-leaf text-white", start && end && x > start && x < end && "bg-cd-mint", x.slice(8) === "01" && "ring-1 ring-cd-line")}>
              {Number(x.slice(8))}{x.slice(8) === "01" && <span className="block text-[8px] -mt-1">{({ "11": "Nov", "12": "Dec", "01": "Jan", "02": "Feb" } as Record<string, string>)[x.slice(5, 7)]}</span>}
            </button>))}
        </div>
        <div className="grid grid-cols-2 text-[12px] mt-3"><div><div className="text-cd-muted">Start Date</div><div className="font-bold">{start ? fmtDate(start) : "—"}</div></div><div className="text-right"><div className="text-cd-muted">End Date</div><div className="font-bold">{end ? fmtDate(end) : "—"}</div></div></div>
        {chk && !chk.ok && <div className="mt-2 text-[11.5px] text-cd-danger">{chk.reason}</div>}
        <Btn tone="dark" size="lg" className="w-full mt-3" disabled={!chk?.ok} onClick={confirm} testId="vacation-confirm" tier="T2">CONFIRM</Btn>
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ CD Money
export function CDMoney() {
  const d = useDb();
  const [plan, setPlan] = useState<string>("PLAN-SMART-3000");
  const [amount, setAmount] = useState(500);
  const [pay, setPay] = useState<{ amount: number; label: string } | null>(null);
  return (
    <div className="pb-36 bg-cd-mint min-h-full">
      <Header title="CD Money" />
      <div className="px-4 pt-3"><div className="text-[12px] text-cd-muted">CD Money Balance</div><div className="text-[30px] font-extrabold" data-testid="cdmoney-balance">{rupees(d.wallet.balance)}</div></div>
      <Card className="mx-3 mt-3 p-3">
        <div className="font-extrabold text-[14px]">Smart Recharge</div><div className="text-[11.5px] text-cd-muted">Recharge automatically when wallet balance is low</div>
        {d.plans.map((p) => (
          <button key={p.id} type="button" onClick={() => setPlan(p.id)} className={cx("mt-3 w-full text-left rounded-xl border p-3", plan === p.id ? "border-cd-leaf bg-cd-mint" : "border-cd-line")}>
            <div className="flex justify-between"><span className="font-bold text-[13px]">{p.name} · {rupees(p.amount)}</span><span className={cx("w-4 h-4 rounded-full border-2", plan === p.id ? "border-cd-leaf bg-cd-leaf" : "border-gray-300")} /></div>
            <div className="mt-1.5 rounded-lg bg-[#FFF3D6] px-2 py-1 text-[11.5px]"><b>{rupees(p.cashback)} cashback</b> · {p.schedule}</div>
          </button>))}
        <div className="mt-3 grid grid-cols-3 text-center text-[10.5px] text-cd-muted"><div>Hassle free recharges</div><div>Pause/cancel anytime</div><div>24-hr prior notification</div></div>
        <PriceCta price={rupees(d.plans.find((x) => x.id === plan)!.amount)} label="Pay" tier="T4" onClick={() => setPay({ amount: d.plans.find((x) => x.id === plan)!.amount, label: `Smart Recharge · ${d.plans.find((x) => x.id === plan)!.name}` })} testId="pay-plan" />
      </Card>
      <Card className="mx-3 mt-3 p-3">
        <div className="font-extrabold text-[14px]">Recharge</div>
        <div className="mt-2 flex gap-2">{[200, 500, 1000].map((a) => <button key={a} type="button" onClick={() => setAmount(a)} className={cx("flex-1 h-10 rounded-xl border text-[13px] font-bold", amount === a ? "border-cd-leaf bg-cd-mint" : "border-cd-line")}>{rupees(a)}</button>)}</div>
        <Btn tone="outline" className="w-full mt-2" tier="T4" onClick={() => setPay({ amount, label: "Wallet recharge" })}>Recharge {rupees(amount)}</Btn>
      </Card>
      <Card className="mx-3 mt-3 p-3 bg-gradient-to-br from-[#3E4FD8] to-[#2E3AA8] text-white border-0">
        <div className="text-[11px] opacity-80">DISCOVER</div><div className="font-extrabold text-[16px]">UPI Autopay</div>
        <div className="text-[12px] mt-1 opacity-90">{d.wallet.autopay.enabled ? `On · adds ${rupees(d.wallet.autopay.amount)} when balance < ${rupees(d.wallet.autopay.threshold)} · ${d.wallet.autopay.method}` : "Off"}</div>
        <div className="text-[11px] mt-1 opacity-75">Your bank sends a mandate notice; the debit happens 25–26 hours later.</div>
      </Card>
      <button type="button" onClick={() => navigate("transactions")} className="mx-3 mt-3 w-[calc(100%-24px)] h-11 rounded-xl bg-white border border-cd-line flex items-center justify-between px-3 text-[13px] font-bold">Transaction history <I.chevron size={16} /></button>
      <Sheet open={!!pay} onClose={() => setPay(null)} title="Payment (simulated)" testId="payment-sheet">
        {pay && <div className="p-4 grid gap-3">
          <div className="rounded-xl bg-orange-50 text-[11.5px] text-cd-danger px-3 py-2">Prototype: no money moves. In production the customer completes payment in Country Delight's own payment screen — the assistant never pays.</div>
          <Row k="Amount" v={<b>{rupees(pay.amount)}</b>} />
          {["UPI · GPay ••21", "UPI · PhonePe", "Card ••4412"].map((m) => <div key={m} className="h-11 rounded-xl border border-cd-line flex items-center px-3 text-[13px]">{m}</div>)}
          <Btn size="lg" testId="pay-confirm" tier="T4" onClick={() => { simulateRecharge(pay.amount, pay.label); toast(`${rupees(pay.amount)} added (simulated)`); setPay(null); }}>Pay {rupees(pay.amount)}</Btn>
        </div>}
      </Sheet>
    </div>
  );
}

export function Transactions() {
  const d = useDb();
  return (
    <div className="pb-36">
      <Header title="Transaction History" />
      <div className="px-4 py-3 flex items-center justify-between border-b border-cd-line"><div><div className="text-[11px] text-cd-muted">Current Wallet Balance</div><div className="font-extrabold text-[18px]">{rupees(d.wallet.balance)}</div></div><Btn size="sm" onClick={() => navigate("cdmoney")}>ADD MONEY</Btn></div>
      <div className="divide-y divide-cd-line">
        {d.txns.map((t) => (
          <button key={t.id} type="button" onClick={() => openAssistant({ say: t.type === "autopay" ? `Why was ₹${t.bankDebit?.amount} deducted?` : undefined, explainTxn: t.type === "autopay" ? undefined : t.id })} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-cd-mint" data-testid={`txn-${t.id}`}>
            <div className={cx("w-8 h-8 rounded-full grid place-items-center", t.amount < 0 ? "bg-gray-100 text-gray-500" : "bg-cd-mint text-cd-green")}>{t.amount < 0 ? <I.receipt size={16} /> : <I.wallet size={16} />}</div>
            <div className="flex-1"><div className="text-[13px] font-semibold">{t.title}</div><div className="text-[11px] text-cd-muted">{fmtTs(t.ts)}</div></div>
            <div className="text-right"><div className={cx("text-[13px] font-bold", t.amount < 0 ? "text-cd-ink" : "text-cd-green")}>{t.amount < 0 ? "−" : "+"}{rupees(Math.abs(t.amount))}</div><div className="text-[10.5px] text-cd-muted">Closing balance {rupees(t.closing)}</div></div>
          </button>))}
      </div>
      <div className="p-4 text-[11px] text-cd-muted text-center">Tap any line to ask the assistant to explain it.</div>
    </div>
  );
}

// ------------------------------------------------------------------ Orders
export function Orders() {
  const d = useDb(); const { route } = useUi();
  const list = [...d.orders].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <div className="pb-36">
      <Header title="My Orders" />
      <div className="grid grid-cols-2 border-b border-cd-line text-[12.5px] font-bold"><div className="py-2.5 text-center border-b-2 border-cd-leaf text-cd-green">Morning Orders</div><div className="py-2.5 text-center text-cd-muted">Instant Orders</div></div>
      <div className="p-3 grid gap-2.5">
        {list.map((o) => {
          const total = o.lines.reduce((s, l) => s + l.price * l.qty, 0); const hi = route.params?.highlight === o.id;
          return (
            <button key={o.id} type="button" onClick={() => navigate("order", { id: o.id })} className={cx("text-left rounded-2xl border bg-white p-3 shadow-card", hi ? "border-cd-leaf ring-2 ring-cd-leaf/40" : "border-cd-line/60")} data-testid={`order-${o.id}`}>
              <div className="flex items-center justify-between"><div className="font-bold text-[13px]">{fmtDate(o.date)}{o.statusAt ? ` · ${o.statusAt} am` : ""}</div>
                <Pill tone={o.status === "delivered" ? "mint" : o.status === "scheduled" ? "sky" : "gray"}>{o.status === "scheduled" ? "Upcoming" : o.status.replace(/_/g, " ")}</Pill></div>
              <div className="text-[11.5px] text-cd-muted mt-1">{o.lines.map((l) => `${byId(l.productId).name} × ${l.qty}`).join(" · ")}</div>
              <div className="flex items-center justify-between mt-2 text-[12px]"><span>Order Total <b>{rupees(total)}</b></span><span className="text-cd-green font-bold text-[11px]">{o.status === "delivered" ? "RATE ORDER · REPEAT ORDER" : "VIEW ORDER"}</span></div>
            </button>);
        })}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const d = useDb(); const { route } = useUi();
  const o = d.orders.find((x) => x.id === route.params?.id);
  if (!o) return <div><Header title="Order" /><Empty icon={<I.box size={26} />} title="Order not found" body="" /></div>;
  const total = o.lines.reduce((s, l) => s + l.price * l.qty, 0);
  return (
    <div className="pb-36">
      <Header title={`Order ${o.id}`} subtitle={`${fmtDate(o.date)} · ${o.slot}`} />
      <div className="p-3 grid gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><I.truck size={18} className="text-cd-green" /><span className="font-bold text-[13px] capitalize">{o.status.replace(/_/g, " ")}{o.statusAt ? ` at ${o.statusAt}` : ""}</span></div>
          {o.pod && <div className="mt-2 flex items-center gap-3"><div className="w-16 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 grid place-items-center text-[9px] text-white">{o.pod.photo === "gate" ? "GATE PHOTO" : "DOOR PHOTO"}</div><div className="text-[11.5px] text-cd-muted">Proof of delivery · {o.pod.note}</div></div>}
        </Card>
        <Card className="p-3 grid gap-2">{o.lines.map((l) => <div key={l.productId} className="flex items-center gap-3"><ProductArt p={byId(l.productId)} size={44} /><div className="flex-1 text-[12.5px] font-semibold">{byId(l.productId).name}<div className="text-[11px] text-cd-muted">{l.qty} × {rupees(l.price)}</div></div><div className="text-[12.5px] font-bold">{rupees(l.price * l.qty)}</div></div>)}
          <div className="border-t border-cd-line pt-2 text-[12.5px]"><Row k="Total" v={<b>{rupees(total)}</b>} /><div className="text-[11px] text-cd-muted mt-1">{o.charged ? "Charged after delivery." : "Amount will only be charged after the products are delivered."}</div></div></Card>
        <Btn tone="outline" size="lg" testId="order-help" onClick={() => openAssistant({ say: o.status === "delivered" ? "My order hasn't arrived" : "Where is my order?" })}><I.sparkle size={16} /> Get help with this order</Btn>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Account & Preferences (incl. privacy controls)
export function Account() {
  const d = useDb(); const c = d.customer;
  const setPref = async (patch: Partial<{ ringBell: boolean; callBefore: boolean }>) => { await api.set_delivery_preferences("inapp", patch); toast("Preference saved"); };
  const setConsent = (k: keyof typeof c.consents, v: boolean) => { db.set((s) => ({ ...s, customer: { ...s.customer, consents: { ...s.customer.consents, [k]: v } }, ...(k === "wellness" && !v ? { wellness: null } : {}) })); logCall({ name: `consent_${v ? "given" : "withdrawn"}: ${k}`, kind: "guardrail", status: "ok" }); toast(v ? "Consent recorded" : "Consent withdrawn"); };
  return (
    <div className="pb-36">
      <Header title="Account & Preferences" />
      <div className="p-3 grid gap-3">
        <Card className="p-3 grid gap-2 text-[12.5px]">
          <Row k="My Profile" v={<b>{c.firstName} {c.lastName}</b>} /><Row k="Phone" v={c.phoneMasked} /><Row k="Address" v={<span className="text-[11.5px]">{c.area}</span>} /><Row k="Delivery Time Slot" v={c.slot} />
        </Card>
        <Card className="p-3">
          <div className="font-extrabold text-[14px]">Delivery Preferences</div><div className="text-[11.5px] text-cd-muted">Support our delivery partners in creating a seamless delivery experience.</div>
          <div className="mt-3 flex items-center justify-between text-[13px]"><span>Ring the bell</span><Toggle on={d.prefs.ringBell} onChange={(v) => setPref({ ringBell: v })} label="Ring the bell" testId="pref-ringbell" /></div>
          <div className="mt-3 flex items-center justify-between text-[13px]"><span>Call before delivery</span><Toggle on={d.prefs.callBefore} onChange={(v) => setPref({ callBefore: v })} label="Call before delivery" testId="pref-callbefore" /></div>
          <div className="mt-3 flex items-center justify-between text-[13px]"><span>Reusable bag</span><Pill>{d.prefs.reusableBag ? "Yes" : "No"}</Pill></div>
        </Card>
        <Card className="p-3">
          <div className="font-extrabold text-[14px] flex items-center gap-2"><I.shield size={16} className="text-cd-green" /> Assistant & privacy</div>
          <div className="text-[11.5px] text-cd-muted">You decide what the assistant remembers and how we contact you.</div>
          {([["memory", "Remember my conversations (7 days)"], ["wellness", "Wellness profile (goals, diet, allergies)"], ["promoInApp", "Offers inside the app"], ["promoWhatsApp", "Offers on WhatsApp"], ["promoVoice", "Offer calls from the AI assistant"]] as const).map(([k, l]) => (
            <div key={k} className="mt-3 flex items-center justify-between text-[12.5px] gap-3"><span>{l}</span><Toggle on={c.consents[k]} onChange={(v) => setConsent(k, v)} label={l} testId={`consent-${k}`} /></div>))}
          {c.dnc && <div className="mt-3 text-[11.5px] text-cd-danger">Your number is on the do-not-call list.</div>}
        </Card>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Menu (as observed) + Offers + History
export function Menu() {
  const d = useDb();
  const go = (s: Parameters<typeof navigate>[0]) => () => navigate(s);
  const tile = (label: string, icon: React.ReactNode, on: () => void, testId?: string, nav?: string) => (
    <button type="button" onClick={on} data-testid={testId} data-agent-nav={nav} data-agent-label={label} className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-cd-mint"><span className="text-cd-green">{icon}</span><span className="text-[11.5px] font-semibold">{label}</span></button>);
  return (
    <div className="pb-36 relative min-h-full">
      <Header title="Menu" />
      <div className="px-4 pt-3 text-[12px] font-bold text-cd-muted">Products and Subscriptions</div>
      <div className="grid grid-cols-3 px-2">{tile("Products", <I.grid />, go("products"), undefined, "products")}{tile("My Subscriptions", <I.box />, go("subscriptions"), "menu-subscriptions", "subscriptions")}{tile("Set Vacation", <I.plane />, go("vacations"), "menu-vacation", "vacations")}</div>
      <div className="px-4 pt-2 text-[12px] font-bold text-cd-muted">Orders and Billing</div>
      <div className="grid grid-cols-3 px-2">{tile("My Orders", <I.cart />, go("orders"), "menu-orders", "orders")}{tile("Transactions", <I.receipt />, go("transactions"), "menu-transactions", "transactions")}{tile("Assistant history", <I.history />, go("history"), "menu-history", "history")}</div>
      <div className="px-4 pt-2 text-[12px] font-bold text-cd-muted">Rewards</div>
      <div className="grid grid-cols-3 px-2">{tile("Refer", <I.users />, () => toast("Referral is unchanged in this prototype", "info"))}{tile("Offer Zone", <I.tag />, go("offers"), undefined, "offers")}{tile("Wellness", <I.leaf />, go("wellness"), undefined, "wellness")}</div>
      <div className="mx-3 mt-3 rounded-xl bg-[#F3F9D9] px-3 py-2.5 flex items-center gap-2 text-[12px]"><I.crown size={18} className="text-cd-vipdeep" /><div className="flex-1"><b>VIP Membership</b><div className="text-cd-muted text-[11px]">{d.customer.vip.active ? `Active till ${fmtDate(d.customer.vip.validTill)} · benefit left ${rupees(d.customer.vip.benefitLeft)} of ${rupees(d.customer.vip.benefitTotal)}` : "Your VIP Membership is waiting!"}</div></div></div>
      <div className="mx-3 mt-3 divide-y divide-cd-line rounded-2xl border border-cd-line bg-white">
        {([["Account & Preferences", "Edit address, delivery preferences, privacy", "account"], ["CD Money & Payment Modes", "Add money, Smart Recharge, Autopay", "cdmoney"], ["Test Reports", "View latest quality check reports", null], ["Legal", "Privacy, Terms & Conditions", null]] as const).map(([t, s, to]) => (
          <button key={t} type="button" data-testid={`menu-${to ?? t.split(" ")[0].toLowerCase()}`} data-agent-nav={to ?? undefined} data-agent-label={t} onClick={() => (to ? navigate(to) : toast("Unchanged Country Delight screen (not in prototype)", "info"))} className="w-full px-3 py-3 flex items-center gap-3 text-left"><div className="flex-1"><div className="text-[13px] font-bold">{t}</div><div className="text-[11px] text-cd-muted">{s}</div></div><I.chevron size={16} /></button>))}
      </div>
      <div className="text-center text-[10.5px] text-cd-muted mt-4">Version 10.9.100 · prototype</div>
      <button type="button" aria-label="Ayuh help" data-testid="ayuh-fab" onClick={() => navigate("ayuh")} className="absolute right-4 bottom-[150px] w-14 h-14 rounded-full bg-cd-ink text-white grid place-items-center shadow-lg">
        <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden><ellipse cx="16" cy="18" rx="11" ry="9" fill="#fff" /><circle cx="12" cy="17" r="2" fill="#1D2A22" /><circle cx="20" cy="17" r="2" fill="#1D2A22" /><path d="M12 22c2.5 2 5.5 2 8 0" stroke="#1D2A22" strokeWidth="1.6" fill="none" /><path d="M16 9V5M13 5h6" stroke="#fff" strokeWidth="1.8" /></svg>
      </button>
    </div>
  );
}

export function Offers() {
  const d = useDb();
  return (
    <div className="pb-36">
      <Header title="Offers" />
      <div className="px-3 pt-3"><div className="h-10 rounded-xl border border-cd-line flex items-center px-3 text-[13px] text-cd-muted gap-2">Enter Promo Code <span className="ml-auto h-7 px-3 rounded-lg bg-[#5B6BEA] text-white text-[11px] font-bold grid place-items-center">APPLY</span></div></div>
      <div className="p-3 grid gap-3">
        {d.offers.map((o) => (
          <Card key={o.id} className="overflow-hidden" testId={`offer-${o.id}`}>
            <div className="bg-[#E9F7EF] p-3"><Pill tone="warn">Hot Deal</Pill><div className="font-extrabold text-[14px] mt-2">{o.name}</div><div className="text-[12px]">{o.benefit}</div><div className="text-[10.5px] text-cd-muted mt-1">*Offer valid till {fmtDate(o.validTill)} · prototype offer, not a real Country Delight offer</div></div>
            <div className="px-3 py-2 text-[11px] text-cd-muted">{o.conditions.join(" · ")}</div>
          </Card>))}
      </div>
    </div>
  );
}

export function History() {
  const d = useDb(); const { messages } = useUi();
  return (
    <div className="pb-36">
      <Header title="Assistant history" subtitle="Your conversations and support cases" />
      <div className="p-3 grid gap-3">
        <div className="text-[12px] font-bold text-cd-muted">Support cases</div>
        {d.tickets.length ? d.tickets.map((t) => (
          <Card key={t.id} className="p-3" testId={`ticket-${t.id}`}><div className="flex justify-between"><b className="text-[13px]">{t.id}</b><Pill tone={t.status === "resolved" ? "mint" : "warn"}>{t.status.replace("_", " ")}</Pill></div><div className="text-[11.5px] text-cd-muted mt-1">{fmtTs(t.createdAt)} · {t.channel}</div><div className="text-[12px] mt-1">{t.summary}</div>{t.resolution && <div className="text-[12px] mt-1 text-cd-green">Resolution: {t.resolution}</div>}</Card>))
          : <div className="text-[12px] text-cd-muted">No support cases yet.</div>}
        <div className="text-[12px] font-bold text-cd-muted mt-2">Conversations</div>
        {messages.length > 0 && <Card className="p-3"><div className="font-bold text-[13px]">Current conversation</div><div className="text-[11.5px] text-cd-muted">{messages.length} messages · {messages.filter((m) => m.role === "user").slice(-1)[0]?.text ?? ""}</div><Btn size="sm" className="mt-2" onClick={() => openAssistant({})}>Continue</Btn></Card>}
        {d.pastConversations.map((c) => <Card key={c.id} className="p-3"><div className="font-bold text-[13px]">{c.title}</div><div className="text-[11.5px] text-cd-muted">{fmtTs(c.startedAt)} · {c.channel}</div><div className="text-[12px] mt-1">{c.summary}</div></Card>)}
        <div className="text-[10.5px] text-cd-muted">Recent conversations are kept for 7 days when memory is on (Account & Preferences).</div>
      </div>
    </div>
  );
}
