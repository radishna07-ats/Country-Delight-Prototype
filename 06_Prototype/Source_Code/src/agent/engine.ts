// Conversation engine for the PROTOTYPE agent.
// Grounding rule: every statement about money, orders, subscriptions or offers comes from a tool
// result. Changes are proposed on a card and executed only after an explicit Confirm (tiers T2/T3).
// The agent never pays, never asks for OTP/UPI PIN/bank details, and always offers a human.
import { db, ui, uid, navigate, toast, logCall, type AgentEvent, type CardData, type Chip, type Msg, type Screen } from "../backend/store";
import { api, monthlyCost, orderValueFor } from "../backend/api";
import { parse, type Parsed } from "./nlu";
import { byId, MILK_VARIANT_IDS } from "./catalogueRefs";
import type { Channel, Frequency, Subscription, Txn } from "../data/types";
import {
  addDays, checkVacation, daysBetween, deliversOn, earliestChangeDate, fmtDate, fmtTs, freqText, hour, inVacation, rupees, RULE_TEXT, today, unitPrice, DAY_NAMES,
} from "../backend/rules";
import { ALLERGENS, HEALTH_GOALS } from "../data/catalogue";

// ------------------------------------------------------------------ session memory (not persisted)
type Pending =
  | { kind: "sub_change"; subId: string; before: Subscription; to: { qty?: number; frequency?: Frequency; weekday?: number } }
  | { kind: "new_sub"; productId: string; qty: number; frequency: Frequency; weekday?: number; createdId?: string; offerId?: string }
  | { kind: "vacation"; start: string; end: string; vacationId?: string }
  | { kind: "pause_sub"; subId: string; until: string; before: Subscription }
  | { kind: "remove_sub"; subId: string; before: Subscription; reason: string }
  | { kind: "prefs"; patch: Partial<{ ringBell: boolean; callBefore: boolean; voiceNote: string }>; before: Record<string, unknown> }
  | { kind: "refund" }
  | { kind: "resolution"; orderId: string; option: string; reason: string };
const pending: Record<string, Pending & { done?: boolean; at?: number }> = {};

type Awaiting =
  | { intent: "pick_milk_cart"; qty: number }
  | { intent: "pick_milk_sub"; qty: number; frequency?: Frequency; weekday?: number }
  | { intent: "vacation_dates"; productSubId?: string }
  | { intent: "remove_reason"; subId: string }
  | { intent: "door_check"; orderId: string }
  | { intent: "wellness"; step: "consent" | "goal" | "diet" | "allergy"; draft: { save: boolean; goals: string[]; diet: string; allergies: string[] } }
  | { intent: "sub_frequency"; productId: string; qty: number }
  | { intent: "outreach"; offerId: string }
  | null;
let awaiting: Awaiting = null;
let lang: "en" | "hi" = "en";
let lastParsed: Parsed | null = null;
const L = (en: string, hi?: string) => (lang === "hi" && hi ? hi : en);

export const speakListeners = new Set<(text: string, channel: Channel) => void>();

// ------------------------------------------------------------------ message plumbing
const threadKey = (ch: Channel) => (ch === "whatsapp" ? "waMessages" : ch === "voice" ? "callMessages" : "messages") as "messages" | "waMessages" | "callMessages";
function push(ch: Channel, m: Omit<Msg, "id" | "at" | "channel">) {
  const msg: Msg = { id: uid("m"), at: db.get().clock, channel: ch, ...m };
  ui.set((s) => ({ ...s, [threadKey(ch)]: [...s[threadKey(ch)], msg] }));
  if (m.role === "agent") speakListeners.forEach((l) => l(m.text, ch));
  return msg;
}
const say = (ch: Channel, text: string, cards?: CardData[], chips?: Chip[]) => push(ch, { role: "agent", text, cards, chips });
const chip = (label: string, event: AgentEvent): Chip => ({ label, event });
const sayChip = (label: string, text = label) => chip(label, { kind: "say", text });

export function patchCard(changeId: string, patch: Record<string, unknown>) {
  ui.set((s) => {
    const fix = (msgs: Msg[]) => msgs.map((m) => (m.cards?.some((c) => c.changeId === changeId) ? { ...m, cards: m.cards!.map((c) => (c.changeId === changeId ? { ...c, ...patch } : c)) } : m));
    return { ...s, messages: fix(s.messages), waMessages: fix(s.waMessages), callMessages: fix(s.callMessages) };
  });
}
const thinking = (on: boolean) => ui.set((s) => ({ ...s, thinking: on }));
const cust = () => db.get().customer;
const isVip = () => cust().vip.active;

const HELP_CHIPS = (): Chip[] => [
  sayChip("Pause deliveries next week"), sayChip("Why was money deducted?"), sayChip("My milk hasn't arrived"),
  sayChip("One more milk packet daily", "Add one more packet of milk to my regular subscription"), sayChip("I've started working out"),
];

// ------------------------------------------------------------------ public entry points
export async function userSays(text: string, ch: Channel = ui.get().channel) {
  const clean = text.trim(); if (!clean) return;
  push(ch, { role: "user", text: clean });
  const p = parse(clean, db.get().clock);
  lang = p.hinglish ? "hi" : "en";
  logCall({ name: `intent: ${p.intent}`, kind: "nlu", status: "info", channel: ch, args: compactEntities(p) });
  thinking(true);
  try { await route(p, ch); } finally { thinking(false); }
}

export async function handleEvent(ev: AgentEvent, ch: Channel = ui.get().channel) {
  thinking(true);
  try {
    switch (ev.kind) {
      case "say": return await userSaysOrInternal(ev.text, ch);
      case "confirm": return await confirm(ev.changeId, ch);
      case "cancel": return cancel(ev.changeId, ch);
      case "undo": return await undo(ev.changeId, ch);
      case "add": return await doAddToCart(ev.productId, ev.qty, ch);
      case "explain_txn": return await explainTxn(ev.txnId, ch);
      case "navigate": return await goTo(ev.screen, ch, ev.params);
      case "reason": return await deliveryReason(ev.orderId, ev.reason, ch);
      case "resolve": return proposeResolution(ev.orderId, ev.option, ev.reason, ch);
      case "wellness": return await wellnessStep(ev.step, ev.value, ch);
      case "offer": return await offerAction(ev.offerId, ev.action, ch);
      case "pick_sub": { const base = lastParsed ?? parse("", db.get().clock); return await route({ ...base, intent: ev.intent as any, products: [byId(subById(ev.subId)!.productId)] }, ch, ev.subId); }
    }
  } finally { thinking(false); }
}

/** Opening message when the assistant is opened (optionally with context, e.g. from Ayuh). */
export function greet(ch: Channel, context?: string) {
  const name = cust().firstName;
  if (context) {
    say(ch, `Hi ${name}, I can see you came from Ayuh about “${context}”. Tell me what happened in your own words, and I'll check your account.`, undefined, HELP_CHIPS().slice(0, 3));
  } else {
    say(ch, `Hi ${name}! I can help with deliveries, subscriptions, vacations, your wallet and orders. Speak or type, or tap an option.`, undefined, HELP_CHIPS());
  }
}

// ------------------------------------------------------------------ router
async function route(p: Parsed, ch: Channel, subIdHint?: string) {
  if (!subIdHint) lastParsed = p;
  // Continue an open question first
  if (awaiting) {
    const handled = await continueAwaiting(p, ch);
    if (handled) return;
  }
  switch (p.intent) {
    case "greet": return greet(ch);
    case "thanks": return say(ch, L("You're welcome! Anything else?", "Koi baat nahi! Aur kuch?"));
    case "yes": case "no": return yesNo(p.intent === "yes", ch);
    case "human": return handoff(ch, "Customer asked for a person");
    case "medical": return medical(ch);
    case "wellness": return startWellness(ch);
    case "delivery_issue": return deliveryIssue(p, ch);
    case "delivery_prefs": return deliveryPrefs(p, ch);
    case "wallet_balance": return walletBalance(ch);
    case "wallet_deduction": return walletDeduction(p, ch);
    case "wallet_refund": return walletRefund(ch);
    case "payment_failed": return paymentFailed(ch);
    case "smart_recharge": return smartRecharge(p, ch);
    case "vacation": return vacation(p, ch);
    case "pause_subscription": return pauseSub(p, ch, subIdHint);
    case "end_vacation": return endVacation(ch);
    case "remove_subscription": return removeSub(p, ch, subIdHint);
    case "change_subscription": return changeSub(p, ch, subIdHint);
    case "add_subscription": return addSub(p, ch);
    case "add_to_cart": return addToCart(p, ch);
    case "tomorrow_order": return tomorrowOrder(ch);
    case "offers": return offers(ch);
    case "navigate": return goTo((p.screen ?? "home") as Screen, ch);
    default:
      logCall({ name: "fallback: not understood", kind: "guardrail", status: "info", channel: ch, args: { text: p.text } });
      return say(ch, L("Sorry, I didn't quite get that. I can help with deliveries, subscriptions, vacations, your wallet and orders, or connect you to a person.",
        "Maaf kijiye, samajh nahi aaya. Main deliveries, subscriptions, vacation, wallet aur orders mein madad kar sakti hoon."), undefined,
        [...HELP_CHIPS().slice(0, 3), sayChip("Talk to a person", "I want to talk to a person")]);
  }
}

async function continueAwaiting(p: Parsed, ch: Channel): Promise<boolean> {
  const a = awaiting!;
  if (a.intent === "pick_milk_cart" || a.intent === "pick_milk_sub") {
    const prod = p.products.find((x) => MILK_VARIANT_IDS.includes(x.id)) ?? (/usual|regular|same|cow/i.test(p.text) ? byId("cow-milk") : undefined);
    if (prod) {
      awaiting = null;
      if (a.intent === "pick_milk_cart") { showProductForCart(prod.id, p.qty ?? a.qty, ch); return true; }
      await proposeNewSub(prod.id, p.qty ?? a.qty, a.frequency ?? "daily", a.weekday, ch); return true;
    }
  }
  if (a.intent === "vacation_dates" && p.range) { awaiting = null; await vacation({ ...p, intent: "vacation" }, ch); return true; }
  if (a.intent === "door_check") {
    if (p.intent === "no" || /nothing|not there|isn'?t there|nahi hai|kuch nahi|checked/i.test(p.text)) { awaiting = null; await deliveryReason(a.orderId, "not_received", ch); return true; }
    if (p.intent === "yes" || /found it|got it|mil gaya|it'?s there/i.test(p.text)) { awaiting = null; say(ch, L("Great, glad it's there! Have a good morning.", "Badhiya! Aapka din accha ho.")); return true; }
  }
  if (a.intent === "outreach") {
    if (/whatsapp/i.test(p.text)) { awaiting = null; await sendOfferOnWhatsApp(a.offerId, ch); return true; }
    if (p.intent === "yes" || /go ahead|tell me|okay|sure|haan/i.test(p.text)) { outreachDetails(a.offerId, ch); return true; }
    if (p.intent === "no" || /not interested|stop|busy/i.test(p.text)) { awaiting = null; await offerAction(a.offerId, "stop", ch); return true; }
  }
  if (a.intent === "remove_reason") { awaiting = null; await removeReason(a.subId, p.text, ch); return true; }
  if (a.intent === "sub_frequency" && (p.frequency || /daily|every day/i.test(p.text))) {
    awaiting = null; await proposeNewSub(a.productId, a.qty, p.frequency ?? "daily", p.weekday, ch); return true;
  }
  if (a.intent === "wellness" && p.intent === "unknown") { await wellnessStep(a.step, p.text, ch); return true; }
  if (p.intent !== "unknown" && p.intent !== "yes" && p.intent !== "no") { awaiting = null; return false; }
  return false;
}

// ------------------------------------------------------------------ helpers
const subById = (id: string) => db.get().subscriptions.find((s) => s.id === id);
const activeSubs = () => db.get().subscriptions.filter((s) => s.status !== "removed");
function findSub(p: Parsed): Subscription[] {
  const subs = activeSubs();
  if (p.products.length) return subs.filter((s) => p.products.some((x) => x.id === s.productId));
  if (p.genericMilk) return subs.filter((s) => MILK_VARIANT_IDS.includes(s.productId));
  return [];
}
function compactEntities(p: Parsed) {
  return Object.fromEntries(Object.entries({ qty: p.qty, delta: p.delta, products: p.products.map((x) => x.id), genericMilk: p.genericMilk || undefined, range: p.range, frequency: p.frequency, weekday: p.weekday, amount: p.amount, reason: p.reason, hinglish: p.hinglish || undefined }).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length)));
}
function lastPendingChange(): string | undefined {
  const msgs = ui.get()[threadKey(ui.get().channel)];
  for (let i = msgs.length - 1; i >= 0; i--) { const c = msgs[i].cards?.find((x) => x.changeId && x.state === "pending"); if (c) return c.changeId; }
  return undefined;
}
async function yesNo(yes: boolean, ch: Channel) {
  const id = lastPendingChange();
  if (!id) return say(ch, yes ? "Okay! What would you like to do?" : "No problem.", undefined, HELP_CHIPS().slice(0, 3));
  return yes ? confirm(id, ch) : cancel(id, ch);
}
function pickSubChips(subs: Subscription[], intent: string): Chip[] {
  return subs.map((s) => chip(`${byId(s.productId).name} · ${s.qty} × ${freqText(s).toLowerCase()}`, { kind: "pick_sub", subId: s.id, intent }));
}
async function goTo(screen: Screen, ch: Channel, params?: Record<string, string>) {
  await api.navigate(ch, screen);
  if (ch === "inapp") navigate(screen, params);
  const names: Record<string, string> = { subscriptions: "My Subscriptions", vacations: "Vacations", cdmoney: "CD Money", transactions: "Transactions", orders: "My Orders", account: "Account & Preferences", cart: "your cart", offers: "Offer Zone", wellness: "Your Wellness Journey", menu: "the menu", home: "Home", products: "Products" };
  if (ch === "inapp") say(ch, `Opened ${names[screen] ?? screen}.`);
  else say(ch, `You'll find that in the app under ${names[screen] ?? screen}.`);
}

// ------------------------------------------------------------------ UC3: cart
function addToCart(p: Parsed, ch: Channel) {
  const qty = p.qty ?? 1;
  if (p.genericMilk && !p.products.some((x) => x.id !== "cow-milk" && MILK_VARIANT_IDS.includes(x.id))) {
    awaiting = { intent: "pick_milk_cart", qty };
    const usual = activeSubs().find((s) => MILK_VARIANT_IDS.includes(s.productId))?.productId ?? "cow-milk";
    const ids = [usual, ...MILK_VARIANT_IDS.filter((i) => i !== usual)];
    return say(ch, L(`Sure. Which milk would you like — your usual ${byId(usual).name} ${byId(usual).size}, or another one? I'll add ${qty} ${qty > 1 ? "packets" : "packet"} for ${fmtDate(earliestChangeDate(db.get().clock))}.`,
      `Zaroor. Kaunsa doodh — aapka usual ${byId(usual).name}, ya koi aur? Main ${qty} packet add kar dungi.`),
      [{ type: "products", mode: "add", items: ids.map((id) => ({ productId: id, qty, usual: id === usual })), date: earliestChangeDate(db.get().clock) }],
      ids.slice(0, 2).map((id) => chip(`${byId(id).name}`, { kind: "add", productId: id, qty })));
  }
  if (!p.products.length) return say(ch, "Which product should I add?", undefined, [sayChip("Cow milk"), sayChip("Paneer"), sayChip("Dahi")]);
  const items = p.products.map((x) => ({ productId: x.id, qty }));
  return say(ch, items.length === 1 ? `Here's ${byId(items[0].productId).name}. Set the quantity and tap Add.` : "Here they are. Set quantities and tap Add on each.",
    [{ type: "products", mode: "add", items, date: earliestChangeDate(db.get().clock) }]);
}
function showProductForCart(productId: string, qty: number, ch: Channel) {
  return say(ch, `${byId(productId).name} ${byId(productId).size}. Adjust the quantity if you like and tap Add.`, [{ type: "products", mode: "add", items: [{ productId, qty }], date: earliestChangeDate(db.get().clock) }]);
}
async function doAddToCart(productId: string, qty: number, ch: Channel) {
  awaiting = null;
  const r = await api.add_to_cart(ch, { productId, qty });
  if (r.status !== "ok") return say(ch, r.status === "refused" ? `I couldn't add that: ${r.message}` : "That didn't go through, so nothing was added. Want me to try again?", undefined,
    [chip("Try again", { kind: "add", productId, qty }), sayChip("Talk to a person", "I want to talk to a person")]);
  const cart = db.get().cart; const total = cart.reduce((s, c) => s + unitPrice(byId(c.productId), isVip()) * c.qty, 0);
  toast(`Added ${qty} × ${byId(productId).name}`);
  return say(ch, `Added ${qty} × ${byId(productId).name} to your cart for ${fmtDate((r.data as any).date)}. Your cart now has ${cart.reduce((s, c) => s + c.qty, 0)} item(s), ${rupees(total)}. Checkout stays with you — I don't place orders or pay.`,
    [{ type: "cart_result", lines: cart, total }], [chip("View cart", { kind: "navigate", screen: "cart" }), sayChip("Add paneer too", "Add one paneer to my cart")]);
}

// ------------------------------------------------------------------ UC5: subscriptions
async function changeSub(p: Parsed, ch: Channel, subIdHint?: string) {
  const r = await api.list_subscriptions(ch);
  if (r.status !== "ok") return toolDown(ch);
  let subs = subIdHint ? [subById(subIdHint)!] : findSub(p);
  if (!subs.length && !p.products.length && !p.genericMilk) subs = activeSubs();
  if (!subs.length) {
    const prod = p.products[0] ?? (p.genericMilk ? byId("cow-milk") : undefined);
    if (prod) { awaiting = { intent: "sub_frequency", productId: prod.id, qty: p.qty ?? 1 }; return say(ch, `You don't have a ${prod.name} subscription yet. How often would you like it?`, undefined, [sayChip("Daily"), sayChip("Alternate days"), sayChip("Every Sunday")]); }
    return say(ch, "You don't have an active subscription yet.");
  }
  if (subs.length > 1) return say(ch, "Which subscription should I change?", undefined, pickSubChips(subs, "change_subscription"));
  const sub = subs[0];
  const absolute = /\b(to|make it|set (it )?to|kar do)\s+(\d+|one|two|three|four|five|ek|do|teen)\b/i.test(p.text) && p.qty;
  const moreN = p.text.match(/\b(\d|two|three)\s+more\b/i);
  const nMore = moreN ? (Number(moreN[1]) || { two: 2, three: 3 }[moreN[1].toLowerCase() as "two" | "three"]) : undefined;
  let qty = sub.qty;
  if (absolute) qty = p.qty!;
  else if (p.delta) qty = sub.qty + p.delta;
  else if (nMore) qty = sub.qty + nMore;
  else if (/\b(decrease|reduce|less|fewer|kam)\b/i.test(p.text)) qty = sub.qty - (p.qty ?? 1);
  else if (/\b(increase|more|extra|badha)\b/i.test(p.text)) qty = sub.qty + (p.qty && p.qty !== sub.qty ? p.qty : 1);
  else if (p.qty) qty = p.qty;
  const frequency = p.frequency && p.frequency !== sub.frequency && p.frequency !== "once" ? p.frequency : undefined;
  if (qty < 1) return say(ch, `${byId(sub.productId).name} is already at 1 per delivery. Would you like to pause it or remove it instead?`, undefined, [sayChip("Pause it for a week", `Pause my ${byId(sub.productId).short} next week`), sayChip("Remove it", `Stop my ${byId(sub.productId).short}`)]);
  if (qty === sub.qty && !frequency) return say(ch, `Your ${byId(sub.productId).name} is ${sub.qty} × ${freqText(sub).toLowerCase()}. What should it change to?`, undefined, [sayChip(`Make it ${sub.qty + 1}`, `Make my ${byId(sub.productId).short} ${sub.qty + 1} packets`), sayChip("Alternate days", `Change my ${byId(sub.productId).short} to alternate days`)]);
  return proposeSubChange(sub, { qty, frequency, weekday: p.weekday }, ch);
}

function proposeSubChange(sub: Subscription, to: { qty?: number; frequency?: Frequency; weekday?: number }, ch: Channel) {
  const changeId = uid("chg");
  pending[changeId] = { kind: "sub_change", subId: sub.id, before: { ...sub }, to };
  const prod = byId(sub.productId); const unit = unitPrice(prod, isVip());
  const after = { ...sub, qty: to.qty ?? sub.qty, frequency: to.frequency ?? sub.frequency, weekday: (to.weekday ?? sub.weekday) as any };
  const effective = earliestChangeDate(db.get().clock);
  const offerImpact = sub.offer && to.frequency && sub.offer.voidsOnChange.includes("frequency") ? `This ends your “${sub.offer.name}” offer (changing frequency voids it).` : undefined;
  const perDelta = (after.qty - sub.qty) * unit;
  logCall({ name: "show_component: subscription_change_card", kind: "component", status: "info", channel: ch, args: { subId: sub.id, from: sub.qty, to: after.qty } });
  const text = `Your ${prod.name} is ${sub.qty} × ${freqText(sub).toLowerCase()}. I'll change it to ${after.qty} × ${freqText(after).toLowerCase()} from ${fmtDate(effective)}` +
    (perDelta ? ` — that's ${perDelta > 0 ? "+" : "−"}${rupees(Math.abs(perDelta))} per delivery.` : ".") + (offerImpact ? ` Note: ${offerImpact}` : "") + " Shall I go ahead?";
  return say(ch, text, [{ type: "sub_change", changeId, productId: prod.id, fromQty: sub.qty, toQty: after.qty, fromFreq: freqText(sub), toFreq: freqText(after),
    effective, unit, perDelta, monthlyFrom: monthlyCost(sub), monthlyTo: monthlyCost(after), offerImpact, state: "pending" }],
    [chip("Confirm", { kind: "confirm", changeId }), chip("Cancel", { kind: "cancel", changeId })]);
}

async function addSub(p: Parsed, ch: Channel) {
  const qty = p.qty ?? 1;
  if (p.genericMilk && !p.products.some((x) => x.id !== "cow-milk")) {
    awaiting = { intent: "pick_milk_sub", qty, frequency: p.frequency, weekday: p.weekday };
    return say(ch, "Which milk should I subscribe?", undefined, MILK_VARIANT_IDS.map((id) => sayChip(byId(id).name)));
  }
  const prod = p.products[0];
  if (!prod) return say(ch, "Which product would you like to subscribe to?");
  const existing = activeSubs().find((s) => s.productId === prod.id);
  if (existing) return proposeSubChange(existing, { qty: existing.qty + qty, frequency: p.frequency && p.frequency !== existing.frequency ? p.frequency : undefined, weekday: p.weekday }, ch);
  if (!p.frequency) { awaiting = { intent: "sub_frequency", productId: prod.id, qty }; return say(ch, `How often would you like ${prod.name}?`, undefined, [sayChip("Daily"), sayChip("Alternate days"), sayChip("Every Sunday")]); }
  return proposeNewSub(prod.id, qty, p.frequency, p.weekday, ch);
}

async function proposeNewSub(productId: string, qty: number, frequency: Frequency, wd: number | undefined, ch: Channel, offerId?: string) {
  const prod = byId(productId);
  if (!prod.subscribable || !prod.frequencies.includes(frequency)) {
    return say(ch, `${prod.name} can be ordered ${prod.frequencies.map((f) => (f === "once" ? "one time" : f)).join(", ")}, so I can't set it up ${frequency}.`, undefined, prod.frequencies.includes("once") ? [chip("Add to cart instead", { kind: "add", productId, qty })] : undefined);
  }
  const changeId = uid("chg");
  const weekday = frequency === "weekly" ? wd ?? 0 : undefined;
  pending[changeId] = { kind: "new_sub", productId, qty, frequency, weekday, offerId };
  let first = earliestChangeDate(db.get().clock); if (weekday !== undefined) { while (new Date(first).getUTCDay() !== weekday) first = addDays(first, 1); }
  const offer = offerId ? db.get().offers.find((o) => o.id === offerId) : db.get().offers.find((o) => o.productIds.includes(productId) && o.validTill >= today(db.get().clock));
  const unit = unitPrice(prod, isVip());
  logCall({ name: "show_component: new_subscription_card", kind: "component", status: "info", channel: ch, args: { productId, qty, frequency, weekday } });
  return say(ch, `${qty} × ${prod.name} ${frequency === "weekly" ? `every ${DAY_NAMES[weekday!]}` : freqText({ frequency }).toLowerCase()}, first delivery ${fmtDate(first)}, ${rupees(unit * qty)} per delivery. Confirm?`,
    [{ type: "new_sub", changeId, productId, qty, freq: frequency === "weekly" ? `Every ${DAY_NAMES[weekday!]}` : freqText({ frequency }), first, unit, monthly: monthlyCost({ productId, qty, frequency }),
      offer: offer ? { name: offer.name, benefit: offer.benefit, conditions: offer.conditions, validTill: offer.validTill } : undefined, state: "pending" }],
    [chip("Confirm", { kind: "confirm", changeId }), chip("Cancel", { kind: "cancel", changeId })]);
}

async function removeSub(p: Parsed, ch: Channel, subIdHint?: string) {
  const subs = subIdHint ? [subById(subIdHint)!] : findSub(p);
  if (!subs.length) return say(ch, "I couldn't find that subscription. Here are your active ones:", undefined, pickSubChips(activeSubs(), "remove_subscription"));
  if (subs.length > 1) return say(ch, "Which one should I stop?", undefined, pickSubChips(subs, "remove_subscription"));
  const sub = subs[0];
  awaiting = { intent: "remove_reason", subId: sub.id };
  logCall({ name: "save_flow: ask_reason", kind: "policy", status: "info", channel: ch, args: { subId: sub.id } });
  return say(ch, `Before I stop your ${byId(sub.productId).name}, may I ask why? It helps Country Delight improve — and there may be an easier option.`, undefined, [
    sayChip("Going away for a while"), sayChip("Too much / too often"), sayChip("Price"), sayChip("Quality issue"), sayChip("Just remove it"),
  ]);
}
async function removeReason(subId: string, reasonText: string, ch: Channel) {
  const sub = subById(subId)!; const prod = byId(sub.productId); const t = reasonText.toLowerCase();
  logCall({ name: "save_flow: reason_captured", kind: "policy", status: "info", channel: ch, args: { subId, reason: reasonText } });
  if (/away|travel|vacation|holiday/.test(t)) {
    awaiting = { intent: "vacation_dates", productSubId: subId };
    return say(ch, `Instead of removing it, I can pause your deliveries while you're away and they'll restart automatically. Which dates?`, undefined, [sayChip("Next week", "Pause next week"), sayChip("Next 3 days", "Pause for the next 3 days")]);
  }
  if (/too much|too often|less|reduce|often/.test(t)) {
    const opts: Chip[] = [];
    if (sub.qty > 1) opts.push(sayChip(`Reduce to ${sub.qty - 1}`, `Make my ${prod.short} ${sub.qty - 1}`));
    if (sub.frequency === "daily" && prod.frequencies.includes("alternate")) opts.push(sayChip("Alternate days instead", `Change my ${prod.short} to alternate days`));
    if (prod.frequencies.includes("weekly")) opts.push(sayChip("Once a week instead", `Change my ${prod.short} to every Sunday`));
    opts.push(chip("Still remove it", { kind: "say", text: `__remove__${subId}` }));
    return say(ch, `Would one of these suit you better?`, undefined, opts);
  }
  if (/quality/.test(t)) {
    return say(ch, `Sorry to hear that. I can raise a quality report on your last ${prod.name} delivery, and you can see the lab test reports in the app. Or I can still remove it.`, undefined,
      [sayChip("Report a quality issue", `My ${prod.short} was spoiled`), chip("Still remove it", { kind: "say", text: `__remove__${subId}` })]);
  }
  return proposeRemoval(subId, reasonText, ch);
}
function proposeRemoval(subId: string, reason: string, ch: Channel) {
  const sub = subById(subId)!; const changeId = uid("chg");
  pending[changeId] = { kind: "remove_sub", subId, before: { ...sub }, reason };
  const offerImpact = sub.offer?.voidsOnChange.includes("remove") ? `This also ends “${sub.offer.name}”.` : undefined;
  return say(ch, `Okay. I'll stop ${byId(sub.productId).name} from ${fmtDate(earliestChangeDate(db.get().clock))}.${offerImpact ? " " + offerImpact : ""} Confirm?`,
    [{ type: "remove_sub", changeId, productId: sub.productId, from: earliestChangeDate(db.get().clock), offerImpact, state: "pending" }],
    [chip("Confirm removal", { kind: "confirm", changeId }), chip("Keep it", { kind: "cancel", changeId })]);
}

async function pauseSub(p: Parsed, ch: Channel, subIdHint?: string): Promise<unknown> {
  const subs = subIdHint ? [subById(subIdHint)!] : findSub(p);
  if (!subs.length) return vacation({ ...p, intent: "vacation" }, ch);
  if (subs.length > 1) return say(ch, "Which one should I pause?", undefined, pickSubChips(subs, "pause_subscription"));
  const sub = subs[0];
  if (!p.range) { awaiting = { intent: "vacation_dates", productSubId: sub.id }; return say(ch, `Until when should I pause ${byId(sub.productId).name}?`, undefined, [sayChip("3 days", `Pause my ${byId(sub.productId).short} for 3 days`), sayChip("Next week", `Pause my ${byId(sub.productId).short} next week`)]); }
  const first = earliestChangeDate(db.get().clock);
  const until = p.range.end;
  if (daysBetween(first, until) + 1 > 60) return say(ch, "A pause can be at most 60 days.");
  const changeId = uid("chg");
  pending[changeId] = { kind: "pause_sub", subId: sub.id, until, before: { ...sub } };
  const note = p.range.start > first ? ` A single-product pause starts from ${fmtDate(first)}; for a later start date I can set a vacation instead.` : "";
  return say(ch, `Pause ${byId(sub.productId).name} from ${fmtDate(first)} to ${fmtDate(until)}; it restarts on ${fmtDate(addDays(until, 1))}. Your other deliveries continue.${note} Confirm?`,
    [{ type: "vacation", changeId, start: first, end: until, resume: addDays(until, 1), productId: sub.productId, skipped: countDeliveries(first, until, sub), state: "pending" }],
    [chip("Confirm", { kind: "confirm", changeId }), chip("Cancel", { kind: "cancel", changeId })]);
}
function countDeliveries(start: string, end: string, only?: Subscription) {
  const d = db.get(); let n = 0; let value = 0;
  for (let x = start; x <= end; x = addDays(x, 1)) {
    const subs = only ? [only] : d.subscriptions;
    const items = subs.filter((s) => deliversOn(s, x));
    if (items.length && !inVacation(d.vacations, x)) { n++; value += items.reduce((s, i) => s + unitPrice(byId(i.productId), isVip()) * i.qty, 0); }
  }
  return { deliveries: n, value };
}

// ------------------------------------------------------------------ UC3: vacation
async function vacation(p: Parsed, ch: Channel): Promise<unknown> {
  if (awaiting?.intent === "vacation_dates" && awaiting.productSubId) {
    const subId = awaiting.productSubId; awaiting = null;
    return pauseSub(p, ch, subId);
  }
  if (!p.range) {
    awaiting = { intent: "vacation_dates" };
    return say(ch, L("Sure — for which dates? You can say “next week”, “next 3 days” or “from Monday to Sunday”.", "Zaroor — kin dates ke liye? “Agle hafte” ya “kal se 3 din” bol sakte hain."), undefined,
      [sayChip("Next 3 days", "Pause my deliveries for the next 3 days"), sayChip("Next week", "Pause my deliveries next week"), sayChip("This weekend", "Pause my deliveries this weekend")]);
  }
  const d = db.get();
  const chk = checkVacation(d.clock, p.range.start, p.range.end, d.vacations);
  logCall({ name: "rule_check: vacation", kind: "policy", status: chk.ok ? "ok" : "refused", channel: ch, args: { start: p.range.start, end: p.range.end, maxDays: 60, cutoff: "23:00" }, note: chk.reason });
  if (!chk.ok) return say(ch, `I can't set that: ${chk.reason}`, undefined, [sayChip("Next 3 days", "Pause my deliveries for the next 3 days"), sayChip("Next week", "Pause my deliveries next week")]);
  const changeId = uid("chg");
  pending[changeId] = { kind: "vacation", start: p.range.start, end: p.range.end };
  const sk = countDeliveries(p.range.start, p.range.end);
  logCall({ name: "show_component: vacation_card", kind: "component", status: "info", channel: ch, args: { start: p.range.start, end: p.range.end } });
  return say(ch, L(`I'll pause all deliveries from ${fmtDate(p.range.start)} to ${fmtDate(p.range.end)} (${chk.days} day${chk.days! > 1 ? "s" : ""}). They'll resume on ${fmtDate(chk.resume!)}. Shall I confirm?`,
    `${fmtDate(p.range.start)} se ${fmtDate(p.range.end)} tak sab deliveries band kar doon? ${fmtDate(chk.resume!)} se phir shuru hongi.`),
    [{ type: "vacation", changeId, start: p.range.start, end: p.range.end, resume: chk.resume, days: chk.days, skipped: sk, state: "pending" }],
    [chip("Confirm", { kind: "confirm", changeId }), chip("Change dates", { kind: "cancel", changeId })]);
}
async function endVacation(ch: Channel) {
  const v = db.get().vacations.find((x) => x.status !== "ended");
  if (!v) return say(ch, "You don't have a vacation set right now.");
  const r = await api.end_vacation(ch, v.id);
  if (r.status !== "ok") return toolDown(ch);
  toast("Vacation ended");
  return say(ch, `Done — I've ended the vacation (${fmtDate(v.start)} – ${fmtDate(v.end)}). Deliveries continue as normal from ${fmtDate(earliestChangeDate(db.get().clock))}.`);
}

// ------------------------------------------------------------------ confirm / cancel / undo (T2, T3)
async function confirm(changeId: string, ch: Channel) {
  const pc = pending[changeId];
  if (!pc) return say(ch, "That card has expired (the demo was reloaded). Please ask again and I'll prepare it afresh.");
  if (pc.done) return say(ch, "That's already done — nothing more to change.");
  logCall({ name: "customer_confirmed", kind: "guardrail", status: "ok", channel: ch, args: { changeId, kind: pc.kind } });
  let r: any; let okText = ""; let chips: Chip[] = [];
  switch (pc.kind) {
    case "sub_change": {
      r = await api.update_subscription(ch, { id: pc.subId, ...pc.to });
      const s = subById(pc.subId)!;
      okText = `Done — ${s.qty} × ${byId(s.productId).name} ${freqText(s).toLowerCase()} from ${fmtDate(earliestChangeDate(db.get().clock))}. You can undo this for the next 2 minutes.`;
      chips = [chip("Undo", { kind: "undo", changeId }), chip("View My Subscriptions", { kind: "navigate", screen: "subscriptions" })];
      break;
    }
    case "new_sub": {
      r = await api.create_subscription(ch, { productId: pc.productId, qty: pc.qty, frequency: pc.frequency, weekday: pc.weekday });
      if (r.status === "ok") pc.createdId = r.data.id;
      okText = `Done — ${byId(pc.productId).name} is now in your subscriptions, first delivery ${fmtDate(r.data?.startDate ?? earliestChangeDate(db.get().clock))}.`;
      chips = [chip("Undo", { kind: "undo", changeId }), chip("View My Subscriptions", { kind: "navigate", screen: "subscriptions" })];
      break;
    }
    case "vacation": {
      r = await api.create_vacation(ch, { start: pc.start, end: pc.end });
      if (r.status === "ok") pc.vacationId = r.data.vacation.id;
      okText = L(`Done. Deliveries are paused from ${fmtDate(pc.start)} to ${fmtDate(pc.end)} and resume on ${fmtDate(addDays(pc.end, 1))}. No wallet deduction or auto-recharge for those days.`,
        `Ho gaya. ${fmtDate(pc.start)} se ${fmtDate(pc.end)} tak deliveries band; ${fmtDate(addDays(pc.end, 1))} se phir shuru.`);
      chips = [chip("Undo", { kind: "undo", changeId }), chip("View vacations", { kind: "navigate", screen: "vacations" })];
      break;
    }
    case "pause_sub": {
      r = await api.pause_subscription(ch, { id: pc.subId, until: pc.until });
      okText = `Paused. ${byId(subById(pc.subId)!.productId).name} restarts on ${fmtDate(addDays(pc.until, 1))}.`;
      chips = [chip("Undo", { kind: "undo", changeId }), chip("View My Subscriptions", { kind: "navigate", screen: "subscriptions" })];
      break;
    }
    case "remove_sub": {
      r = await api.remove_subscription(ch, { id: pc.subId, reason: pc.reason });
      okText = `Removed ${byId(pc.before.productId).name}. If you change your mind, you can undo for 2 minutes or add it back anytime.`;
      chips = [chip("Undo", { kind: "undo", changeId })];
      break;
    }
    case "prefs": {
      r = await api.set_delivery_preferences(ch, pc.patch);
      okText = "Saved. Your rider will see this from the next delivery.";
      chips = [chip("Undo", { kind: "undo", changeId }), chip("View preferences", { kind: "navigate", screen: "account" })];
      break;
    }
    case "refund": {
      r = await api.request_wallet_refund(ch);
      if (r.status === "ok") {
        pc.done = true; patchCard(changeId, { state: "confirmed", reference: r.data.reference });
        return say(ch, `Refund requested: ${rupees(r.data.refundable)}, reference ${r.data.reference}. Country Delight will send you a secure SMS link to share your bank details — I never ask for bank details here. It reaches your bank ${r.data.sla}.`);
      }
      break;
    }
    case "resolution": return applyResolution(changeId, pc, ch);
  }
  if (r.status === "ok") {
    pc.done = true; pc.at = Date.now();
    patchCard(changeId, { state: "confirmed" });
    toast(okText.split(".")[0]);
    return say(ch, okText, undefined, chips);
  }
  patchCard(changeId, { state: "failed", error: r.message });
  if (r.status === "refused") return say(ch, `Country Delight's system didn't accept that: ${r.message} Nothing was changed.`);
  return say(ch, "That didn't go through — nothing was changed. Would you like me to try again?", undefined, [chip("Try again", { kind: "confirm", changeId }), sayChip("Talk to a person", "I want to talk to a person")]);
}
function cancel(changeId: string, ch: Channel) {
  const pc = pending[changeId];
  if (pc && !pc.done) delete pending[changeId];
  patchCard(changeId, { state: "cancelled" });
  logCall({ name: "customer_declined", kind: "guardrail", status: "info", channel: ch, args: { changeId } });
  if (pc?.kind === "vacation") { awaiting = { intent: "vacation_dates" }; return say(ch, "No problem — nothing was changed. Which dates would you prefer?"); }
  return say(ch, "Okay, I haven't changed anything.");
}
async function undo(changeId: string, ch: Channel) {
  const pc = pending[changeId];
  if (!pc || !pc.done) return say(ch, "There's nothing to undo.");
  if (pc.at && Date.now() - pc.at > 2 * 60 * 1000) return say(ch, "The 2-minute undo window has passed, but I can make a new change for you.");
  let r: any = { status: "ok" };
  if (pc.kind === "sub_change" || pc.kind === "pause_sub" || pc.kind === "remove_sub") r = await api.restore_subscription(ch, pc.before);
  if (pc.kind === "new_sub" && pc.createdId) r = await api.remove_created_subscription(ch, pc.createdId);
  if (pc.kind === "vacation" && pc.vacationId) r = await api.end_vacation(ch, pc.vacationId);
  if (pc.kind === "prefs") r = await api.set_delivery_preferences(ch, pc.before as any);
  if (r.status !== "ok") return toolDown(ch);
  pc.done = false; delete pending[changeId];
  patchCard(changeId, { state: "undone" });
  toast("Change undone", "info");
  return say(ch, "Undone — everything is back as it was.");
}

// ------------------------------------------------------------------ UC1: wallet
async function walletBalance(ch: Channel) {
  const r = await api.get_wallet_summary(ch);
  if (r.status !== "ok") return toolDown(ch);
  const w = r.data as any;
  const ap = w.autopay.enabled ? ` Autopay is on: when your balance falls below ${rupees(w.autopay.threshold)}, ${rupees(w.autopay.amount)} is added from ${w.autopay.method} — your bank notifies you about a day before the debit.` : "";
  return say(ch, L(`You have ${rupees(w.balance)} in CD Money — enough for about ${w.runwayDays} day${w.runwayDays === 1 ? "" : "s"} of your usual deliveries (about ${rupees(w.perDay)} a day).${ap}`,
    `Aapke CD Money mein ${rupees(w.balance)} hain — lagbhag ${w.runwayDays} din ki deliveries ke liye.${ap}`),
    [{ type: "wallet_summary", ...w }], [sayChip("Why was money deducted?"), sayChip("Smart Recharge options", "What is Smart Recharge?"), chip("Open CD Money", { kind: "navigate", screen: "cdmoney" })]);
}

async function walletDeduction(p: Parsed, ch: Channel) {
  if (p.amount) {
    const r = await api.list_wallet_transactions(ch, { amount: p.amount, days: 30 });
    if (r.status !== "ok") return toolDown(ch);
    const rows = r.data as Txn[];
    if (!rows.length) {
      const recent = await api.list_wallet_transactions(ch, { direction: "debit", days: 14 });
      return say(ch, `I can't find a ${rupees(p.amount)} deduction in your CD Money for the last 30 days, so I won't guess. Here are your recent deductions — or a person can check your bank statement with you.`,
        [{ type: "txn_list", txnIds: ((recent.data as Txn[]) ?? []).slice(0, 6).map((t) => t.id) }], [sayChip("Talk to a person", "I want to talk to a person")]);
    }
    return explainTxn(rows[0].id, ch);
  }
  const r = await api.list_wallet_transactions(ch, { direction: "debit", days: 7 });
  if (r.status !== "ok") return toolDown(ch);
  const rows = r.data as Txn[];
  if (!rows.length) return say(ch, "There were no deductions from your CD Money in the last 7 days.");
  const latest = rows[0];
  const o = db.get().orders.find((x) => x.id === latest.ref?.orderId);
  const what = o ? o.lines.map((l) => `${l.qty} × ${byId(l.productId).name} at ${rupees(l.price)}`).join(", ") : latest.title;
  const autopay = db.get().txns.find((t) => t.type === "autopay");
  return say(ch, L(`Here are the deductions from the last 7 days. The latest was ${rupees(-latest.amount)} on ${fmtDate(latest.ts)} for that morning's delivery (${what}${o ? " + ₹1 convenience fee" : ""}). Orders are charged only after delivery. Tap any line and I'll explain it.`,
    `Pichhle 7 din ki deductions yeh rahi. Latest ${rupees(-latest.amount)} ${fmtDate(latest.ts)} ki delivery ke liye tha. Kisi bhi line par tap karein, main samjha dungi.`),
    [{ type: "txn_list", txnIds: rows.map((t) => t.id), highlight: latest.id }],
    [chip(`Explain ${rupees(-latest.amount)} on ${fmtDate(latest.ts).split(", ")[1]}`, { kind: "explain_txn", txnId: latest.id }),
     ...(autopay ? [sayChip(`What was the ${rupees(autopay.bankDebit!.amount)} Autopay?`, `Why was ₹${autopay.bankDebit!.amount} deducted?`)] : [])]);
}

async function explainTxn(txnId: string, ch: Channel) {
  const r = await api.explain_transaction(ch, txnId);
  if (r.status !== "ok") return r.status === "refused" ? say(ch, "I can't find that transaction on your account.") : toolDown(ch);
  const { txn, order, rule } = r.data as { txn: Txn; order?: any; rule?: string };
  const lines: string[] = []; let text = "";
  if (txn.type === "autopay" && txn.bankDebit) {
    const d = db.get();
    const idx = d.txns.findIndex((t) => t.id === txn.id);
    const trigger = d.txns.slice(idx + 1).find((t) => t.ts <= txn.bankDebit!.mandateNoticeAt && t.closing < d.wallet.autopay.threshold);
    const cb = d.txns.find((t) => t.type === "cashback" && t.ts.slice(0, 13) === txn.ts.slice(0, 13));
    text = `${rupees(txn.bankDebit.amount)} left your bank account, not your wallet — it was a UPI Autopay top-up. ` +
      (trigger ? `Your CD Money balance dropped to ${rupees(trigger.closing)} after the ${fmtDate(trigger.ts)} delivery, below your ${rupees(d.wallet.autopay.threshold)} Autopay limit. ` : "") +
      `Your bank sent the mandate notice on ${fmtTs(txn.bankDebit.mandateNoticeAt)}, and ${rupees(txn.bankDebit.amount)} was debited about a day later (${fmtTs(txn.ts)}) and added to CD Money${cb ? `, plus ${rupees(cb.amount)} Autopay cashback` : ""}. Nothing was spent — it's in your balance.`;
    lines.push(`${fmtTs(txn.ts)} · ${txn.title} · +${rupees(txn.amount)} · closing ${rupees(txn.closing)}`);
    if (trigger) lines.push(`${fmtTs(trigger.ts)} · ${trigger.title} · ${rupees(trigger.amount)} · closing ${rupees(trigger.closing)} (below ${rupees(d.wallet.autopay.threshold)})`);
    if (cb) lines.push(`${fmtTs(cb.ts)} · ${cb.title} · +${rupees(cb.amount)}`);
  } else if (order) {
    const items = order.lines.map((l: any) => `${l.qty} × ${byId(l.productId).name} @ ${rupees(l.price)}`);
    text = `${rupees(-txn.amount)} on ${fmtDate(txn.ts)} paid for that morning's delivery (${order.id}): ${items.join(", ")}, plus a ₹1 convenience fee. It was delivered at ${order.statusAt} and charged after delivery.${isVip() ? " Prices shown are your VIP prices." : ""}`;
    lines.push(...items, "Convenience fee · ₹1", `Total · ${rupees(-txn.amount)} · closing balance ${rupees(txn.closing)}`);
  } else {
    text = `${txn.title}: ${txn.amount > 0 ? "+" : "−"}${rupees(Math.abs(txn.amount))} on ${fmtTs(txn.ts)}, closing balance ${rupees(txn.closing)}.`;
    lines.push(`${fmtTs(txn.ts)} · ${txn.title}`);
  }
  logCall({ name: "show_component: wallet_explainer", kind: "component", status: "info", channel: ch, args: { txnId } });
  return say(ch, text, [{ type: "txn_explain", txnId: txn.id, lines, rule, title: txn.title, amount: txn.amount, ts: txn.ts }],
    txn.type === "autopay" ? [sayChip("Change my Autopay", "How does Autopay work?"), sayChip("Refund my balance to bank", "Refund my wallet balance to my bank"), sayChip("Talk to a person", "I want to talk to a person")]
      : [sayChip("That's not right — talk to a person", "I want to talk to a person"), chip("All transactions", { kind: "navigate", screen: "transactions" })]);
}

async function smartRecharge(p: Parsed, ch: Channel) {
  const r = await api.get_recharge_options(ch);
  if (r.status !== "ok") return toolDown(ch);
  const plans = r.data as any[]; const ap = db.get().wallet.autopay;
  if (/autopay|auto pay|auto-pay/i.test(p.text)) {
    return say(ch, `UPI Autopay tops up CD Money automatically: when your balance falls below ${rupees(ap.threshold)}, your bank sends a mandate notice and debits ${rupees(ap.amount)} 25–26 hours later. You can change the limit or amount, or switch it off anytime in Account & Preferences. It's currently ${ap.enabled ? "on" : "off"} (${ap.method}).`,
      undefined, [chip("Open CD Money", { kind: "navigate", screen: "cdmoney" })]);
  }
  return say(ch, `Smart Recharge adds money automatically when your balance is low. There are two plans, and you can also recharge any amount yourself. I can't make payments — you'll confirm in the CD Money screen.`,
    [{ type: "recharge_options", plans }], [chip("Open CD Money", { kind: "navigate", screen: "cdmoney" }), sayChip("How does Autopay work?")]);
}

async function paymentFailed(ch: Channel) {
  const r = await api.list_wallet_transactions(ch, { direction: "credit", days: 14 });
  if (r.status !== "ok") return toolDown(ch);
  const last = (r.data as Txn[]).find((t) => ["recharge", "autopay"].includes(t.type));
  return say(ch, last ? `I don't see a failed or pending recharge in the last 14 days. Your latest recharge, ${rupees(last.amount)} (${last.title}) on ${fmtTs(last.ts)}, was successful. If money left your bank but isn't here, a person can trace it with your UPI reference.`
    : "I don't see any recharge attempts in the last 14 days.", undefined, [chip("Show transactions", { kind: "navigate", screen: "transactions" }), sayChip("Talk to a person", "I want to talk to a person")]);
}

async function walletRefund(ch: Channel) {
  const d = db.get();
  const cashback = d.txns.filter((t) => t.type === "cashback").reduce((s, t) => s + t.amount, 0);
  const refundable = Math.max(0, +(d.wallet.balance - cashback).toFixed(2));
  const changeId = uid("chg"); pending[changeId] = { kind: "refund" };
  return say(ch, `${RULE_TEXT["R-REFUND-BANK"]} You can get back ${rupees(refundable)} (your ${rupees(d.wallet.balance)} balance minus ${rupees(cashback)} cashback). Deliveries stop if the balance runs out. Shall I raise the request?`,
    [{ type: "refund", changeId, amount: refundable, balance: d.wallet.balance, cashback, state: "pending" }],
    [chip("Request refund", { kind: "confirm", changeId }), chip("Not now", { kind: "cancel", changeId })]);
}

// ------------------------------------------------------------------ UC2: delivery issues
async function deliveryIssue(p: Parsed, ch: Channel) {
  const r = await api.get_todays_delivery(ch);
  if (r.status !== "ok") {
    const t = await api.create_support_ticket(ch, { reason: "status_unavailable", summary: "Customer reported a delivery issue; status service unavailable.", status: "awaiting_callback" });
    return say(ch, L(`I can't see today's delivery status right now, so I won't guess. I've raised case ${(t.data as any)?.id ?? "—"} and our team will call you ${hour(db.get().clock) < 6 ? "after 6:00 AM" : "shortly"}.`,
      `Abhi delivery status nahi dikh raha, isliye andaaza nahi lagaungi. Case ${(t.data as any)?.id ?? "—"} bana diya hai; team aapko call karegi.`));
  }
  const o = r.data as any;
  if (!o) return say(ch, "You don't have a delivery scheduled for today. Your next one is shown in My Orders.", undefined, [chip("Open My Orders", { kind: "navigate", screen: "orders" })]);
  const items = o.lines.map((l: any) => `${byId(l.productId).name}`).join(", ");
  if (p.reason && p.reason !== "not_received") return deliveryReason(o.id, p.reason, ch);
  if (o.status === "delivered") {
    const pod = await api.get_proof_of_delivery(ch, o.id);
    awaiting = { intent: "door_check", orderId: o.id };
    return say(ch, L(`Today's order (${items}) was marked delivered at ${o.statusAt}${pod.status === "ok" ? `, with a photo at the ${(pod.data as any).photo === "gate" ? "building gate" : "door"}` : ""}. Could you check ${(pod.data as any)?.photo === "gate" ? "the gate or security desk" : "outside your door"}?`,
      `Aaj ka order (${items}) ${o.statusAt} baje delivered mark hua hai${pod.status === "ok" ? `, ${(pod.data as any).photo === "gate" ? "gate" : "darwaze"} par photo ke saath` : ""}. Kya aap ${(pod.data as any)?.photo === "gate" ? "gate ya security desk" : "darwaza"} check kar sakte hain?`),
      [{ type: "order_status", orderId: o.id, pod: pod.status === "ok" ? pod.data : undefined }],
      [sayChip(L("Checked — nothing there", "Check kiya — kuch nahi hai"), "Checked, nothing there"), sayChip(L("Found it, thanks", "Mil gaya"), "Found it, thanks"),
       chip(L("One item is missing", "Ek item missing hai"), { kind: "reason", orderId: o.id, reason: "missing_item" }), chip(L("Damaged or leaking", "Leak/damaged hai"), { kind: "reason", orderId: o.id, reason: "leaking" })]);
  }
  if (o.status === "out_for_delivery" || o.status === "scheduled" || o.status === "packed") {
    const late = hour(db.get().clock) >= 7.5;
    return say(ch, late ? `Your order is still marked ${o.status.replace(/_/g, " ")} and the 7:30 AM window has passed. Let me sort it out.` : `Your order (${items}) is ${o.status === "out_for_delivery" ? "out for delivery" : "being prepared"}; the delivery window runs until 7:30 AM. I'll message you if it's running late.`,
      [{ type: "order_status", orderId: o.id }], late ? [chip("Get help with this order", { kind: "reason", orderId: o.id, reason: "not_received" })] : [sayChip("Okay, thanks", "thanks")]);
  }
  return say(ch, `Today's order is ${o.status}.`, [{ type: "order_status", orderId: o.id }]);
}

async function deliveryReason(orderId: string, reason: string, ch: Channel) {
  awaiting = null;
  const r = await api.request_resolution(ch, { orderId, reason });
  if (r.status !== "ok") return toolDown(ch);
  const { options, value } = r.data as any;
  logCall({ name: "policy: resolution_options", kind: "policy", status: "info", channel: ch, args: { reason, value, options: options.map((o: any) => o.id) } });
  const photo = reason === "leaking" || reason === "damaged" ? " (A photo upload here is a proposed integration; it isn't active in this prototype.)" : "";
  return say(ch, L(`I'm sorry about this. Under Country Delight's policy for this order, here's what I can do:${photo}`, `Maaf kijiye. Is order ke liye yeh options hain:${photo}`),
    [{ type: "resolution_options", orderId, reason, value, options }],
    options.map((o: any) => chip(o.label, { kind: "resolve", orderId, option: o.id, reason })));
}

function proposeResolution(orderId: string, option: string, reason: string, ch: Channel) {
  if (option === "human") return handoff(ch, `Delivery issue (${reason}) on ${orderId}`, orderId);
  const changeId = uid("chg"); pending[changeId] = { kind: "resolution", orderId, option, reason };
  const o = db.get().orders.find((x) => x.id === orderId)!;
  const what = o.lines.map((l) => byId(l.productId).name).join(", ");
  const label = option === "redeliver" ? `Re-deliver ${what} by 9:00 AM today` : option === "credit" ? `Credit ${rupees(o.lines.reduce((s, l) => s + l.price * l.qty, 0))} to CD Money` : `Replace ${what} in tomorrow's delivery`;
  return say(ch, `${label}. Confirm?`, [{ type: "resolution_confirm", changeId, label, state: "pending" }], [chip("Confirm", { kind: "confirm", changeId }), chip("Cancel", { kind: "cancel", changeId })]);
}

async function applyResolution(changeId: string, pc: Extract<Pending, { kind: "resolution" }>, ch: Channel) {
  const r = await api.request_resolution(ch, { orderId: pc.orderId, reason: pc.reason, option: pc.option });
  if (r.status !== "ok") { patchCard(changeId, { state: "failed" }); return r.status === "refused" ? say(ch, `${r.message} I'll connect you to a person.`) : toolDown(ch); }
  const res = (r.data as any).option;
  const t = await api.create_support_ticket(ch, { reason: pc.reason, orderId: pc.orderId, summary: `Customer reported ${pc.reason.replace("_", " ")}; agent applied: ${res.label}.`, resolution: res.label, status: "resolved" });
  pending[changeId].done = true; patchCard(changeId, { state: "confirmed" });
  toast(res.id === "credit" ? "Credit added to CD Money" : "Resolution confirmed");
  const ticket = t.data as any;
  return say(ch, L(`Done — ${res.label.toLowerCase()}. Your case number is ${ticket.id}; you won't need to explain this again. Would you like the rider to call you before delivery instead of leaving it at the gate?`,
    `Ho gaya — ${res.label}. Aapka case number ${ticket.id} hai. Kya rider delivery se pehle call kare?`),
    [{ type: "ticket", ticketId: ticket.id }],
    [sayChip(L("Yes, call before delivery", "Haan, call kare"), "Please call before delivery"), sayChip(L("No, thanks", "Nahi"), "thanks")]);
}

async function deliveryPrefs(p: Parsed, ch: Channel) {
  const t = p.text.toLowerCase(); const before = { ...db.get().prefs };
  const patch: Partial<{ ringBell: boolean; callBefore: boolean }> = {};
  if (/(don'?t|do not|no|stop|mat)\b.{0,15}(ring|bell)/.test(t)) patch.ringBell = false;
  else if (/\bring (the )?bell\b/.test(t)) patch.ringBell = true;
  if (/call (me )?before/.test(t)) patch.callBefore = !/(don'?t|do not|no)\s.{0,10}call/.test(t);
  if (!Object.keys(patch).length) return say(ch, "What should the rider do?", undefined, [sayChip("Don't ring the bell"), sayChip("Call before delivery", "Please call before delivery")]);
  const changeId = uid("chg"); pending[changeId] = { kind: "prefs", patch, before: { ringBell: before.ringBell, callBefore: before.callBefore } };
  const desc = [patch.ringBell !== undefined ? `Ring the bell: ${patch.ringBell ? "On" : "Off"}` : "", patch.callBefore !== undefined ? `Call before delivery: ${patch.callBefore ? "On" : "Off"}` : ""].filter(Boolean);
  return say(ch, `I'll update your delivery preferences — ${desc.join(", ")}. Confirm?`,
    [{ type: "prefs_change", changeId, from: { ringBell: before.ringBell, callBefore: before.callBefore }, to: { ...{ ringBell: before.ringBell, callBefore: before.callBefore }, ...patch }, state: "pending" }],
    [chip("Confirm", { kind: "confirm", changeId }), chip("Cancel", { kind: "cancel", changeId })]);
}

async function tomorrowOrder(ch: Channel) {
  const date = earliestChangeDate(db.get().clock);
  const r = await api.get_todays_delivery(ch, date);
  if (r.status !== "ok") return toolDown(ch);
  const o = r.data as any;
  if (ch === "inapp") { await api.navigate(ch, "orders"); navigate("orders", { highlight: o?.id ?? "" }); }
  if (!o) return say(ch, `There's no delivery scheduled for ${fmtDate(date)}${inVacation(db.get().vacations, date) ? " — you're on vacation" : ""}.`);
  const total = o.lines.reduce((s: number, l: any) => s + l.price * l.qty, 0);
  return say(ch, `${ch === "inapp" ? "I've opened My Orders — it's at the top. " : ""}Your order for ${fmtDate(date)} has ${o.lines.length} item(s), ${rupees(total)}, arriving 5:00–7:30 AM. You can still change it until 11 pm tonight.`,
    [{ type: "order_status", orderId: o.id }], [sayChip("Add one more milk", "Add one more packet of milk to my regular subscription"), sayChip("Skip tomorrow", "Pause my deliveries tomorrow")]);
}

// ------------------------------------------------------------------ UC4: offers (customer-initiated in chat)
async function offers(ch: Channel) {
  const c = cust();
  if (!c.consents.promoInApp && ch === "inapp") logCall({ name: "consent: in-app offers off — answering because customer asked", kind: "guardrail", status: "info", channel: ch });
  const r = await api.list_eligible_offers(ch);
  if (r.status !== "ok") return toolDown(ch);
  const list = r.data as any[];
  if (!list.length) return say(ch, "There are no offers on your account right now. I only mention offers that are approved and that you're eligible for.");
  return say(ch, `There ${list.length === 1 ? "is 1 offer" : `are ${list.length} offers`} you're eligible for. Conditions are shown exactly as Country Delight approved them.`,
    list.map((o) => ({ type: "offer", offerId: o.id, name: o.name, benefit: o.benefit, validTill: o.validTill, conditions: o.conditions })),
    [chip(`Use “${list[0].name}”`, { kind: "offer", offerId: list[0].id, action: "accept" }), chip("Not interested", { kind: "offer", offerId: list[0].id, action: "stop" })]);
}

async function offerAction(offerId: string, action: string, ch: Channel) {
  const o = db.get().offers.find((x) => x.id === offerId)!;
  if (action === "details") return say(ch, `${o.name}: ${o.benefit}. Valid till ${fmtDate(o.validTill)}. Conditions: ${o.conditions.join("; ")}.`);
  if (action === "stop") {
    db.set((s) => ({ ...s, customer: { ...s.customer, consents: { ...s.customer.consents, ...(ch === "voice" ? { promoVoice: false } : ch === "whatsapp" ? { promoWhatsApp: false } : { promoInApp: false }) }, ...(ch === "voice" ? { dnc: true } : {}) } }));
    logCall({ name: ch === "voice" ? "dnc_added (opt-out captured)" : `consent_withdrawn: ${ch} promotions`, kind: "guardrail", status: "ok", channel: ch, args: { offerId } });
    return say(ch, ch === "voice" ? "Understood — I've added your number to our do-not-call list. You won't get promotional calls from us. Have a good day!" : "Understood. I won't show you offers here again unless you ask.");
  }
  if (action === "later") return say(ch, "No problem. I'll leave it here; you can ask me about offers anytime.");
  const prod = o.productIds[0];
  if (o.id === "OFR-PANEER-SUN") return proposeNewSub(prod, 1, "weekly", 0, ch, o.id);
  return proposeNewSub(prod, 1, "daily", undefined, ch, o.id);
}

// ------------------------------------------------------------------ UC6: wellness
async function startWellness(ch: Channel) {
  const existing = db.get().wellness;
  if (existing) {
    return say(ch, `Welcome back. I have your wellness preferences: ${existing.goals.map(goalLabel).join(", ")}, ${dietLabel(existing.diet)}, allergies: ${existing.allergies.length ? existing.allergies.map(allergyLabel).join(", ") : "none"}. Want fresh suggestions?`,
      undefined, [chip("Show suggestions", { kind: "wellness", step: "recommend", value: "" }), chip("Update my preferences", { kind: "wellness", step: "restart", value: "" }), chip("Open Wellness Journey", { kind: "navigate", screen: "wellness" })]);
  }
  awaiting = { intent: "wellness", step: "consent", draft: { save: false, goals: [], diet: "any", allergies: [] } };
  logCall({ name: "consent_prompt: wellness_profile", kind: "guardrail", status: "info", channel: ch });
  return say(ch, "Great that you've started working out! I can suggest Country Delight products that fit your goals. To do that, may I remember your goals, diet and any food allergies? I'll only use them for product suggestions, and you can delete them anytime. This isn't medical advice.",
    undefined, [chip("Yes, remember them", { kind: "wellness", step: "consent", value: "save" }), chip("Just this once", { kind: "wellness", step: "consent", value: "once" }), chip("No thanks", { kind: "wellness", step: "consent", value: "no" })]);
}
const goalLabel = (g: string) => HEALTH_GOALS.find((x) => x.id === g)?.label ?? g;
const allergyLabel = (a: string) => ALLERGENS.find((x) => x.id === a)?.label ?? a;
const dietLabel = (d: string) => ({ veg: "vegetarian", egg: "eggetarian", vegan: "vegan", any: "no diet restriction" } as Record<string, string>)[d] ?? d;

async function wellnessStep(step: string, value: string, ch: Channel) {
  if (step === "restart") { db.set((s) => ({ ...s, wellness: null })); return startWellness(ch); }
  if (step === "recommend") { const w = db.get().wellness!; return recommend({ goals: w.goals, diet: w.diet, allergies: w.allergies, save: true }, ch); }
  const a = awaiting?.intent === "wellness" ? awaiting : { intent: "wellness" as const, step: "consent" as const, draft: { save: false, goals: [] as string[], diet: "any", allergies: [] as string[] } };
  const draft = a.draft;
  const v = value.toLowerCase();
  if (step === "consent") {
    if (v === "no") { awaiting = null; return say(ch, "No problem. You can still browse “Pick Your Health Goal” in Groceries, or ask me about any product."); }
    draft.save = v === "save";
    logCall({ name: draft.save ? "consent_given: wellness_profile" : "consent: session only", kind: "guardrail", status: "ok", channel: ch });
    awaiting = { intent: "wellness", step: "goal", draft };
    return say(ch, "What's your main goal?", undefined, HEALTH_GOALS.map((g) => chip(g.label, { kind: "wellness", step: "goal", value: g.id })));
  }
  if (step === "goal") {
    const g = HEALTH_GOALS.find((x) => x.id === v || x.label.toLowerCase() === v || v.includes(x.label.toLowerCase().split(" ")[0].toLowerCase()));
    draft.goals = [g?.id ?? "high_protein"];
    awaiting = { intent: "wellness", step: "diet", draft };
    return say(ch, "Any diet preference?", undefined, [["veg", "Vegetarian"], ["egg", "Eggetarian"], ["vegan", "Vegan"], ["any", "No preference"]].map(([id, l]) => chip(l, { kind: "wellness", step: "diet", value: id })));
  }
  if (step === "diet") {
    draft.diet = ["veg", "egg", "vegan", "any"].includes(v) ? v : /vegan/.test(v) ? "vegan" : /egg/.test(v) ? "egg" : /veg/.test(v) ? "veg" : "any";
    awaiting = { intent: "wellness", step: "allergy", draft };
    return say(ch, "Any food allergies or intolerances I must avoid?", undefined, [chip("None", { kind: "wellness", step: "allergy", value: "none" }), ...ALLERGENS.map((x) => chip(x.label, { kind: "wellness", step: "allergy", value: x.id }))]);
  }
  if (step === "allergy") {
    const hit = ALLERGENS.find((x) => x.id === v || v.includes(x.id) || (x.id === "milk" && /lactose|dairy/.test(v)));
    draft.allergies = v === "none" || /none|no allerg/.test(v) ? [] : hit ? [hit.id] : [];
    awaiting = null;
    return recommend(draft, ch);
  }
}

async function recommend(draft: { save: boolean; goals: string[]; diet: string; allergies: string[] }, ch: Channel) {
  if (draft.save) await api.save_wellness_profile(ch, { goals: draft.goals, diet: draft.diet as any, allergies: draft.allergies, consentAt: db.get().clock });
  const r = await api.recommend_products(ch, { goals: draft.goals, diet: draft.diet, allergies: draft.allergies });
  if (r.status !== "ok") return toolDown(ch);
  const { items, excluded } = r.data as any;
  logCall({ name: "guardrail: allergen_filter", kind: "guardrail", status: "ok", channel: ch, args: { allergies: draft.allergies, excluded } });
  const goal = goalLabel(draft.goals[0]);
  const reason = (id: string) => {
    const p = byId(id);
    return `Tagged ${goal} in the catalogue · ${p.diet === "vegan" ? "vegan" : p.diet === "egg" ? "contains egg" : "vegetarian"}${draft.allergies.length ? ` · no ${draft.allergies.map(allergyLabel).join(", ").toLowerCase()}` : ""}`;
  };
  const ex = (excluded as string[]).filter((id) => byId(id).tags.includes(draft.goals[0]));
  const exText = ex.length ? ` I left out ${ex.map((id) => byId(id).name).join(", ")} because ${ex.length > 1 ? "they contain" : "it contains"} ${draft.allergies.map(allergyLabel).join(", ").toLowerCase()}.` : "";
  if (!items.length) return say(ch, `I couldn't find products tagged ${goal} that match your diet and allergies.${exText}`);
  const bundleIds = items.slice(0, 3).map((p: any) => p.id);
  const bundleTotal = bundleIds.reduce((s: number, id: string) => s + unitPrice(byId(id), isVip()), 0);
  return say(ch, `Here are Country Delight products tagged ${goal} that are ${dietLabel(draft.diet)}${draft.allergies.length ? ` and free of ${draft.allergies.map(allergyLabel).join(", ").toLowerCase()}` : ""}.${exText} This is product information, not medical or diet advice — for a specific plan, please talk to a qualified nutritionist.`,
    [{ type: "products", mode: "add", items: items.map((p: any) => ({ productId: p.id, qty: 1, reason: reason(p.id) })), date: earliestChangeDate(db.get().clock) },
     { type: "bundle", title: `Morning ${goal} starter`, productIds: bundleIds, total: bundleTotal }],
    [chip("Open my Wellness Journey", { kind: "navigate", screen: "wellness" }), sayChip("Add the protein milk daily", "Subscribe to high protein milk daily")]);
}

function medical(ch: Channel) {
  logCall({ name: "guardrail: medical_topic", kind: "guardrail", status: "ok", channel: ch });
  return say(ch, "I can't give medical or diet advice. For a health condition, please speak to a doctor or a registered dietitian. I can share product information from Country Delight's catalogue — for example items tagged Low Sugar — if that helps.",
    [{ type: "safety", text: "Not medical advice. Product information only." }], [sayChip("Show Low Sugar products", "I want low sugar products for my workout"), sayChip("No thanks", "thanks")]);
}

// ------------------------------------------------------------------ escalation & failures
async function handoff(ch: Channel, why: string, orderId?: string) {
  const thread = ui.get()[threadKey(ch)].filter((m) => m.role === "user").slice(-4).map((m) => m.text);
  const summary = `${why}. Customer said: ${thread.map((t) => `“${t}”`).join(" · ") || "—"}`;
  await api.handoff_to_human(ch, summary);
  const h = hour(db.get().clock);
  const open = h >= 6 && h < 21;
  const t = await api.create_support_ticket(ch, { reason: "handoff", orderId, summary, status: open ? "open" : "awaiting_callback" });
  const id = (t.data as any)?.id ?? "—";
  return say(ch, open ? L(`I'm connecting you to a Country Delight support executive (simulated). They'll see your case ${id} and this summary, so you won't have to repeat yourself.`, `Main aapko support executive se jod rahi hoon (simulated). Case ${id}.`)
    : L(`Our support team works 6:00 AM – 9:00 PM. I've raised case ${id} with this summary and booked a callback for ${h < 6 ? "6:00 AM today" : "6:00 AM tomorrow"}.`, `Support team 6 AM – 9 PM kaam karti hai. Case ${id} bana diya hai; ${h < 6 ? "aaj 6 baje" : "kal 6 baje"} call aayega.`),
    [{ type: "handoff", ticketId: id, summary, open }]);
}
function toolDown(ch: Channel) {
  logCall({ name: "fallback: tool_error", kind: "guardrail", status: "info", channel: ch });
  return say(ch, L("I couldn't reach Country Delight's system just now, so I won't guess. Nothing has been changed. Want me to try again, or connect you to a person?",
    "Abhi system se connect nahi ho paya, isliye andaaza nahi lagaungi. Kuch change nahi hua."), undefined, [sayChip("Try again", ui.get()[threadKey(ch)].filter((m) => m.role === "user").slice(-1)[0]?.text ?? "hi"), sayChip("Talk to a person", "I want to talk to a person")]);
}

// Hidden "still remove" chip handler
const _userSays = userSays;
export async function userSaysOrInternal(text: string, ch: Channel = ui.get().channel) {
  const m = text.match(/^__remove__(.+)$/);
  if (m) { thinking(true); try { push(ch, { role: "user", text: "Still remove it" }); proposeRemoval(m[1], "Customer chose to remove", ch); } finally { thinking(false); } return; }
  return _userSays(text, ch);
}

/** Proactive outreach opener (UC4) used by the campaign simulator. */
export function outreachOpener(offerId: string, ch: Channel) {
  const o = db.get().offers.find((x) => x.id === offerId)!; const c = cust();
  awaiting = { intent: "outreach", offerId };
  logCall({ name: "disclosure: AI assistant", kind: "guardrail", status: "ok", channel: ch });
  const text = ch === "voice"
    ? `Hello ${c.firstName}, this is Country Delight's AI assistant — an automated call. Is this a good time for one minute about an offer on your account?`
    : `Hi ${c.firstName} 👋 This is Country Delight's AI assistant. Because you get Cow Milk daily, you're eligible for “${o.name}”: ${o.benefit}, valid till ${fmtDate(o.validTill)}. Reply STOP to opt out.`;
  return say(ch, text, ch === "voice" ? undefined : [{ type: "offer", offerId: o.id, name: o.name, benefit: o.benefit, validTill: o.validTill, conditions: o.conditions }],
    ch === "voice" ? [sayChip("Yes, go ahead", "yes go ahead"), chip("Not interested — stop calling", { kind: "offer", offerId, action: "stop" })]
      : [chip("Show conditions", { kind: "offer", offerId, action: "details" }), chip("Subscribe with offer", { kind: "offer", offerId, action: "accept" }), chip("STOP", { kind: "offer", offerId, action: "stop" })]);
}
export function outreachDetails(offerId: string, ch: Channel) {
  const o = db.get().offers.find((x) => x.id === offerId)!;
  return say(ch, `Thank you. You're eligible for “${o.name}”: ${o.benefit}, valid till ${fmtDate(o.validTill)}. The conditions: ${o.conditions.join("; ")}. Would you like me to set up a Sunday paneer subscription, or send these details on WhatsApp?`, undefined,
    [chip("Set it up", { kind: "offer", offerId, action: "accept" }), sayChip("Send on WhatsApp", "send it on whatsapp"), chip("Not interested", { kind: "offer", offerId, action: "stop" })]);
}
async function sendOfferOnWhatsApp(offerId: string, ch: Channel) {
  const c = cust();
  if (!c.consents.promoWhatsApp) return say(ch, "You haven't opted in to WhatsApp messages from us, so I won't send it there. You'll find the offer in the app's Offer Zone.");
  logCall({ name: "workflow_step: whatsapp_template (offer)", kind: "workflow", status: "ok", channel: "whatsapp", args: { offerId, template: "offer_details_v1" } });
  outreachOpener(offerId, "whatsapp");
  awaiting = null;
  return say(ch, "Done — I've sent the details to your WhatsApp. Thank you for your time, and have a good day!");
}

export const resetEngine = () => { for (const k of Object.keys(pending)) delete pending[k]; awaiting = null; lang = "en"; };
export const _test = { get awaiting() { return awaiting; }, pending };
export { orderValueFor };
