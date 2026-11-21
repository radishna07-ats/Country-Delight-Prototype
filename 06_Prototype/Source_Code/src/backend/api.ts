// SIMULATED Country Delight back end, exposed as the tool contract proposed in
// 03_Customer_Journey_and_Personas/Enhanced_Journey.md. Every call is logged to the inspector and
// returns ok | refused | error, mirroring Graine's action contract. Nothing here talks to a real system.
import { db, ui, logCall, updateCall, uid } from "./store";
import type { Channel, Frequency, Order, Subscription, Ticket, ToolResult, Txn, Vacation, WellnessProfile } from "../data/types";
import { byId, CATALOGUE } from "../data/catalogue";
import {
  addDays, checkVacation, deliveriesPerMonth, deliversOn, earliestChangeDate, fmtDate, inVacation, resolutionOptions,
  RULE_TEXT, today, unitPrice, weekday,
} from "./rules";

type Kind = "api_tool" | "app_action";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function tool<T>(name: string, kind: Kind, tier: string, args: unknown, channel: Channel, fn: () => ToolResult<T>): Promise<ToolResult<T>> {
  const id = logCall({ name, kind, args, status: "pending", tier, channel });
  const started = performance.now();
  const { faults } = ui.get();
  await sleep(faults.slow ? 2200 : 260 + Math.random() * 380);
  let res: ToolResult<T>;
  if (faults.failNext) {
    ui.set((s) => ({ ...s, faults: { ...s.faults, failNext: false } }));
    res = { status: "error", message: "Simulated failure: the Country Delight service did not respond (fault injection)." };
  } else {
    try { res = fn(); } catch (e) { res = { status: "error", message: (e as Error).message }; }
  }
  updateCall(id, { status: res.status, ms: Math.round(performance.now() - started), note: res.message });
  return res;
}

const vip = () => db.get().customer.vip.active;

// ---------------------------------------------------------------- reads (server-side API tools)
export const api = {
  get_customer_profile: (ch: Channel) => tool("get_customer_profile", "api_tool", "T0", {}, ch, () => ({ status: "ok", data: db.get().customer })),

  get_wallet_summary: (ch: Channel) => tool("get_wallet_summary", "api_tool", "T0", {}, ch, () => {
    const d = db.get();
    const tomorrow = earliestChangeDate(d.clock);
    let spend = 0;
    for (let i = 0; i < 7; i++) spend += orderValueFor(addDays(tomorrow, i));
    const perDay = spend / 7 || 1;
    return { status: "ok", data: { balance: d.wallet.balance, autopay: d.wallet.autopay, lowThreshold: d.wallet.lowThreshold, perDay: Math.round(perDay), runwayDays: Math.floor(d.wallet.balance / perDay), vip: d.customer.vip } };
  }),

  list_wallet_transactions: (ch: Channel, q: { amount?: number; days?: number; direction?: "debit" | "credit" | "any" } = {}) =>
    tool("list_wallet_transactions", "api_tool", "T0", q, ch, () => {
      const d = db.get(); const since = addDays(today(d.clock), -(q.days ?? 14));
      let rows = d.txns.filter((t) => t.ts.slice(0, 10) >= since);
      if (q.direction === "debit") rows = rows.filter((t) => t.amount < 0);
      if (q.direction === "credit") rows = rows.filter((t) => t.amount > 0);
      if (q.amount) rows = rows.filter((t) => Math.abs(t.amount) === q.amount || t.bankDebit?.amount === q.amount);
      return { status: "ok", data: rows };
    }),

  explain_transaction: (ch: Channel, txnId: string) => tool("explain_transaction", "api_tool", "T0", { txnId }, ch, () => {
    const d = db.get(); const t = d.txns.find((x) => x.id === txnId);
    if (!t) return { status: "refused", message: "No such transaction for this customer." };
    const order = t.ref?.orderId ? d.orders.find((o) => o.id === t.ref!.orderId) : undefined;
    return { status: "ok", data: { txn: t, order, rule: t.rule ? RULE_TEXT[t.rule] : undefined } };
  }),

  get_recharge_options: (ch: Channel) => tool("get_recharge_options", "api_tool", "T0", {}, ch, () => ({ status: "ok", data: db.get().plans })),

  get_todays_delivery: (ch: Channel, date?: string) => tool("get_todays_delivery", "api_tool", "T0", { date: date ?? "today" }, ch, () => {
    const d = db.get(); const day = date ?? today(d.clock);
    const o = d.orders.find((x) => x.date === day && x.mode === "morning");
    return o ? { status: "ok", data: o } : { status: "ok", data: null };
  }),

  get_proof_of_delivery: (ch: Channel, orderId: string) => tool("get_proof_of_delivery", "api_tool", "T0", { orderId }, ch, () => {
    const o = db.get().orders.find((x) => x.id === orderId);
    return o?.pod ? { status: "ok", data: o.pod } : { status: "refused", message: "No proof of delivery recorded." };
  }),

  search_catalogue: (ch: Channel, q: { query?: string; ids?: string[] }) => tool("search_catalogue", "api_tool", "T0", q, ch, () => {
    const items = q.ids ? q.ids.map(byId) : CATALOGUE.filter((p) => !q.query || p.name.toLowerCase().includes(q.query.toLowerCase()));
    return { status: "ok", data: items.map((p) => ({ ...p, unit: unitPrice(p, vip()) })) };
  }),

  list_subscriptions: (ch: Channel) => tool("list_subscriptions", "api_tool", "T0", {}, ch, () => ({ status: "ok", data: db.get().subscriptions.filter((s) => s.status !== "removed") })),

  list_eligible_offers: (ch: Channel) => tool("list_eligible_offers", "api_tool", "T0", { channel: ch }, ch, () => {
    const d = db.get();
    const offers = d.offers.filter((o) => o.validTill >= today(d.clock) && !d.subscriptions.some((s) => s.status === "active" && o.productIds.includes(s.productId)));
    return { status: "ok", data: offers };
  }),

  recommend_products: (ch: Channel, p: { goals: string[]; diet: string; allergies: string[] }) => tool("recommend_products", "api_tool", "T0", p, ch, () => {
    const excluded: string[] = [];
    const items = CATALOGUE.filter((prod) => {
      if (p.allergies.some((a) => prod.allergens.includes(a))) { excluded.push(prod.id); return false; }
      if (p.diet === "vegan" && prod.diet !== "vegan") return false;
      if (p.diet === "veg" && prod.diet === "egg") return false;
      return p.goals.some((g) => prod.tags.includes(g));
    });
    return { status: "ok", data: { items: items.slice(0, 6), excluded } };
  }),

  // ---------------------------------------------------------------- writes (confirmed; in-app actions)
  add_to_cart: (ch: Channel, a: { productId: string; qty: number; date?: string }) => tool("add_to_cart", "app_action", "T1", a, ch, () => {
    const p = byId(a.productId); const d = db.get(); const date = a.date ?? earliestChangeDate(d.clock);
    if (!p.inStockTomorrow) return { status: "refused", message: `${p.name} is not available for ${fmtDate(date)}.` };
    if (a.qty < 1 || a.qty > 20) return { status: "refused", message: "Quantity must be between 1 and 20." };
    db.set((s) => {
      const ex = s.cart.find((c) => c.productId === a.productId && c.date === date);
      const cart = ex ? s.cart.map((c) => (c === ex ? { ...c, qty: c.qty + a.qty } : c)) : [...s.cart, { productId: a.productId, qty: a.qty, date }];
      return { ...s, cart };
    });
    return { status: "ok", data: { cart: db.get().cart, date } };
  }),

  update_subscription: (ch: Channel, a: { id: string; qty?: number; frequency?: Frequency; weekday?: number }) => tool("update_subscription", "app_action", "T2", a, ch, () => {
    const d = db.get(); const sub = d.subscriptions.find((s) => s.id === a.id);
    if (!sub || sub.status === "removed") return { status: "refused", message: "That subscription no longer exists." };
    if (a.qty !== undefined && (a.qty < 1 || a.qty > 10)) return { status: "refused", message: "Subscriptions allow 1 to 10 units per delivery." };
    const p = byId(sub.productId);
    if (a.frequency && !p.frequencies.includes(a.frequency)) return { status: "refused", message: `${p.name} isn't available ${a.frequency}.` };
    const effective = earliestChangeDate(d.clock);
    const voidOffer = sub.offer && a.frequency && a.frequency !== sub.frequency && sub.offer.voidsOnChange.includes("frequency");
    db.set((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => x.id === a.id ? { ...x, qty: a.qty ?? x.qty, frequency: a.frequency ?? x.frequency, weekday: (a.weekday ?? x.weekday) as any, offer: voidOffer ? undefined : x.offer } : x) }));
    refreshUpcomingOrders();
    return { status: "ok", data: { effective, sub: db.get().subscriptions.find((s) => s.id === a.id) } };
  }),

  create_subscription: (ch: Channel, a: { productId: string; qty: number; frequency: Frequency; weekday?: number }) => tool("create_subscription", "app_action", "T2", a, ch, () => {
    const d = db.get(); const p = byId(a.productId);
    if (!p.subscribable || !p.frequencies.includes(a.frequency)) return { status: "refused", message: `${p.name} can't be subscribed ${a.frequency}.` };
    let start = earliestChangeDate(d.clock);
    if (a.frequency === "weekly" && a.weekday !== undefined) { while (weekday(start) !== a.weekday) start = addDays(start, 1); }
    const sub: Subscription = { id: uid("SUB"), productId: a.productId, qty: a.qty, frequency: a.frequency, weekday: a.weekday as any, startDate: start, status: "active" };
    db.set((s) => ({ ...s, subscriptions: [...s.subscriptions, sub] }));
    refreshUpcomingOrders();
    return { status: "ok", data: sub };
  }),

  pause_subscription: (ch: Channel, a: { id: string; until: string }) => tool("pause_subscription", "app_action", "T2", a, ch, () => {
    db.set((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === a.id ? { ...x, status: "paused", pausedUntil: a.until } : x)) }));
    refreshUpcomingOrders();
    return { status: "ok", data: { resume: addDays(a.until, 1) } };
  }),

  remove_subscription: (ch: Channel, a: { id: string; reason: string }) => tool("remove_subscription", "app_action", "T2", a, ch, () => {
    db.set((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === a.id ? { ...x, status: "removed" } : x)) }));
    refreshUpcomingOrders();
    return { status: "ok", data: { id: a.id } };
  }),

  restore_subscription: (ch: Channel, snapshot: Subscription) => tool("undo_subscription_change", "app_action", "T2", { id: snapshot.id }, ch, () => {
    db.set((s) => ({ ...s, subscriptions: s.subscriptions.some((x) => x.id === snapshot.id) ? s.subscriptions.map((x) => (x.id === snapshot.id ? snapshot : x)) : [...s.subscriptions, snapshot] }));
    refreshUpcomingOrders();
    return { status: "ok", data: snapshot };
  }),

  remove_created_subscription: (ch: Channel, id: string) => tool("undo_subscription_change", "app_action", "T2", { id }, ch, () => {
    db.set((s) => ({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
    refreshUpcomingOrders();
    return { status: "ok" };
  }),

  create_vacation: (ch: Channel, a: { start: string; end: string }) => tool("create_vacation", "app_action", "T2", a, ch, () => {
    const d = db.get(); const chk = checkVacation(d.clock, a.start, a.end, d.vacations);
    if (!chk.ok) return { status: "refused", message: chk.reason };
    const v: Vacation = { id: uid("VAC"), start: a.start, end: a.end, createdAt: d.clock, status: "scheduled" };
    db.set((s) => ({ ...s, vacations: [...s.vacations, v] }));
    refreshUpcomingOrders();
    return { status: "ok", data: { vacation: v, resume: chk.resume, days: chk.days } };
  }),

  end_vacation: (ch: Channel, id: string) => tool("end_vacation", "app_action", "T2", { id }, ch, () => {
    db.set((s) => ({ ...s, vacations: s.vacations.map((v) => (v.id === id ? { ...v, status: "ended" } : v)) }));
    refreshUpcomingOrders();
    return { status: "ok" };
  }),

  set_delivery_preferences: (ch: Channel, patch: Partial<{ ringBell: boolean; callBefore: boolean; voiceNote: string }>) => tool("set_delivery_preferences", "app_action", "T2", patch, ch, () => {
    db.set((s) => ({ ...s, prefs: { ...s.prefs, ...patch } }));
    return { status: "ok", data: db.get().prefs };
  }),

  create_support_ticket: (ch: Channel, a: { reason: string; orderId?: string; summary: string; resolution?: string; status?: Ticket["status"] }) =>
    tool("create_support_ticket", "api_tool", "T1", a, ch, () => {
      const d = db.get();
      const t: Ticket = { id: `CD-${d.clock.slice(5, 7)}${d.clock.slice(8, 10)}-${String(1000 + d.tickets.length + 42).slice(-4)}`, createdAt: d.clock, reason: a.reason,
        orderId: a.orderId, summary: a.summary, resolution: a.resolution, status: a.status ?? "open", channel: ch };
      db.set((s) => ({ ...s, tickets: [t, ...s.tickets] }));
      return { status: "ok", data: t };
    }),

  request_resolution: (ch: Channel, a: { orderId: string; reason: string; option?: string }) => tool<any>("request_resolution", "api_tool", a.option ? "T3" : "T0", a, ch, () => {
    const d = db.get(); const o = d.orders.find((x) => x.id === a.orderId);
    if (!o) return { status: "refused", message: "Order not found." };
    const value = o.lines.reduce((s, l) => s + l.price * l.qty, 0);
    const recent = d.tickets.filter((t) => t.createdAt.slice(0, 10) >= addDays(today(d.clock), -7)).length;
    const opts = resolutionOptions(a.reason, value, d.clock, recent);
    if (!a.option) return { status: "ok", data: { options: opts, value } };
    const chosen = opts.find((x) => x.id === a.option);
    if (!chosen) return { status: "refused", message: "That option isn't available for this order under the current policy." };
    if (chosen.id === "credit") {
      db.set((s) => {
        const bal = +(s.wallet.balance + value).toFixed(2);
        const txn: Txn = { id: uid("TXN"), ts: s.clock, amount: value, type: "credit", title: `Credit for order ${o.id}`, closing: bal, ref: { orderId: o.id } };
        return { ...s, wallet: { ...s.wallet, balance: bal }, txns: [txn, ...s.txns] };
      });
    }
    return { status: "ok", data: { option: chosen, value } };
  }),

  request_wallet_refund: (ch: Channel) => tool("request_wallet_refund", "api_tool", "T3", {}, ch, () => {
    const d = db.get();
    const cashback = d.txns.filter((t) => t.type === "cashback").reduce((s, t) => s + t.amount, 0);
    const refundable = Math.max(0, +(d.wallet.balance - cashback).toFixed(2));
    if (refundable <= 0) return { status: "refused", message: "There is no refundable balance (cashback is not refundable)." };
    return { status: "ok", data: { refundable, reference: `RF-${d.clock.slice(8, 10)}${d.clock.slice(11, 13)}${d.clock.slice(14, 16)}`, sla: "5–7 working days after you share bank details via the secure SMS link" } };
  }),

  save_wellness_profile: (ch: Channel, p: WellnessProfile) => tool("save_wellness_profile", "app_action", "T2", { goals: p.goals, diet: p.diet, allergies: p.allergies }, ch, () => {
    db.set((s) => ({ ...s, wellness: p, customer: { ...s.customer, consents: { ...s.customer.consents, wellness: true } } }));
    return { status: "ok", data: p };
  }),

  navigate: (ch: Channel, screen: string) => tool("navigate", "app_action", "T0", { screen }, ch, () => ({ status: "ok" })),

  handoff_to_human: (ch: Channel, summary: string) => tool("handoff_to_human", "app_action", "T0", { summary }, ch, () => ({ status: "ok" })),
};

// ---------------------------------------------------------------- derived data
export function orderValueFor(date: string): number {
  const d = db.get();
  if (inVacation(d.vacations, date)) return 0;
  return d.subscriptions.filter((s) => deliversOn(s, date)).reduce((sum, s) => sum + unitPrice(byId(s.productId), d.customer.vip.active) * s.qty, 0);
}

export function monthlyCost(sub: Pick<Subscription, "productId" | "qty" | "frequency">) {
  return Math.round(unitPrice(byId(sub.productId), db.get().customer.vip.active) * sub.qty * deliveriesPerMonth(sub));
}

/** Recompute scheduled (not yet dispatched) orders from subscriptions + vacations + placed cart orders. */
export function refreshUpcomingOrders() {
  db.set((s) => {
    const first = earliestChangeDate(s.clock);
    const keep = s.orders.filter((o) => o.status !== "scheduled" || o.date < first || o.id.endsWith("-C"));
    const upcoming: Order[] = [];
    for (let i = 0; i < 3; i++) {
      const date = addDays(first, i);
      if (inVacation(s.vacations, date)) continue;
      const lines = s.subscriptions.filter((x) => deliversOn(x, date)).map((x) => ({ productId: x.productId, qty: x.qty, price: unitPrice(byId(x.productId), s.customer.vip.active) }));
      if (lines.length) upcoming.push({ id: `ORD-${date.slice(5).replace("-", "")}-M`, date, mode: "morning", slot: "5:00–7:30 AM", status: "scheduled", charged: false, lines });
    }
    const ids = new Set(upcoming.map((o) => o.id));
    return { ...s, orders: [...upcoming, ...keep.filter((o) => !ids.has(o.id))].sort((a, b) => (a.date < b.date ? 1 : -1)) };
  });
}

/** Customer-performed checkout from the cart (not an agent action — the agent never pays or places orders). */
export function placeCartOrder() {
  const d = db.get(); if (!d.cart.length) return null;
  const date = d.cart[0].date;
  const order: Order = { id: `ORD-${date.slice(5).replace("-", "")}-C`, date, mode: "morning", slot: "5:00–7:30 AM", status: "scheduled", charged: false,
    lines: d.cart.map((c) => ({ productId: c.productId, qty: c.qty, price: unitPrice(byId(c.productId), d.customer.vip.active) })) };
  db.set((s) => ({ ...s, cart: [], orders: [order, ...s.orders.filter((o) => o.id !== order.id)] }));
  return order;
}

/** Customer-performed recharge in Country Delight's payment screen (simulated; no money moves). */
export function simulateRecharge(amount: number, label: string) {
  db.set((s) => {
    const bal = +(s.wallet.balance + amount).toFixed(2);
    const txn: Txn = { id: uid("TXN"), ts: s.clock, amount, type: "recharge", title: label, closing: bal };
    return { ...s, wallet: { ...s.wallet, balance: bal }, txns: [txn, ...s.txns] };
  });
}

export { RULE_TEXT };
