import type { Customer, DeliveryPrefs, Offer, Order, RechargePlan, Subscription, Ticket, Txn, Vacation, Wallet, WellnessProfile } from "./types";
import { byId } from "./catalogue";

// All demo customers are fictional. Values are illustrative prototype data.

export const DEFAULT_CLOCK = "2026-11-21T20:15"; // Saturday evening, before the 11 pm cut-off

export interface Conversation { id: string; title: string; startedAt: string; channel: "inapp" | "whatsapp" | "voice"; summary: string }

export interface DemoState {
  version: number;
  clock: string;
  customer: Customer;
  wallet: Wallet;
  txns: Txn[];               // newest first
  subscriptions: Subscription[];
  vacations: Vacation[];
  orders: Order[];
  cart: { productId: string; qty: number; date: string }[];
  prefs: DeliveryPrefs;
  tickets: Ticket[];
  wellness: WellnessProfile | null;
  offers: Offer[];
  plans: RechargePlan[];
  pastConversations: Conversation[];
  screenVisits: { screen: string; at: number }[];
}

export const STATE_VERSION = 7;

const VIP_PRICE: Record<string, number> = { "cow-milk": 36, "coconut-water": 97, "low-fat-dahi": 46 };

function buildLedgerAndOrders(): { txns: Txn[]; orders: Order[]; balance: number } {
  // Chronological events from 14 Nov 2026 (opening balance ₹600).
  let bal = 600;
  const txns: Txn[] = [];
  const orders: Order[] = [];
  const days = ["2026-11-14", "2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21"];
  const times = ["05:48", "05:31", "05:55", "06:04", "06:03", "06:02", "06:05", "06:01"];
  const coconutDays = new Set(["2026-11-14", "2026-11-16", "2026-11-18", "2026-11-20"]);
  days.forEach((d, i) => {
    const lines = [{ productId: "cow-milk", qty: 1, price: VIP_PRICE["cow-milk"], status: "delivered" as const }];
    if (coconutDays.has(d)) lines.push({ productId: "coconut-water", qty: 1, price: VIP_PRICE["coconut-water"], status: "delivered" as const });
    if (d === "2026-11-15") lines.push({ productId: "low-fat-dahi", qty: 1, price: VIP_PRICE["low-fat-dahi"], status: "delivered" as const });
    const id = `ORD-${d.slice(5).replace("-", "")}-M`;
    const deliveredAt = times[i];
    orders.push({ id, date: d, mode: "morning", lines, status: "delivered", statusAt: deliveredAt, slot: "5:00–7:30 AM", charged: true,
      pod: { at: deliveredAt, note: "Left at door", photo: "door" } });
    const amount = lines.reduce((s, l) => s + l.price * l.qty, 0) + 1; // ₹1 convenience fee (observed)
    bal = +(bal - amount).toFixed(2);
    txns.push({ id: `TXN-${d.slice(5).replace("-", "")}-1`, ts: `${d}T${deliveredAt}`, amount: -amount, type: "order", title: "Paid for Order", closing: bal,
      ref: { orderId: id }, rule: "R-CHARGE-AFTER-DELIVERY" });
    if (d === "2026-11-19") {
      // Balance fell below ₹200 on 18 Nov 06:03 → mandate notice 18 Nov 06:30 → bank debit ~25.5 h later
      bal = +(bal + 500).toFixed(2);
      txns.push({ id: "TXN-1119-2", ts: "2026-11-19T08:10", amount: 500, type: "autopay", title: "Added via UPI Autopay", closing: bal,
        bankDebit: { amount: 500, method: "UPI Autopay · HDFC Bank ••21", mandateNoticeAt: "2026-11-18T06:30" }, rule: "R-AUTOPAY" });
      bal = +(bal + 25).toFixed(2);
      txns.push({ id: "TXN-1119-3", ts: "2026-11-19T08:11", amount: 25, type: "cashback", title: "Autopay cashback", closing: bal, rule: "R-AUTOPAY-CASHBACK" });
    }
  });
  // Tomorrow's scheduled order (Sun 22 Nov): milk + coconut (alternate) + dahi (weekly Sunday)
  orders.push({ id: "ORD-1122-M", date: "2026-11-22", mode: "morning", slot: "5:00–7:30 AM", status: "scheduled", charged: false,
    lines: [
      { productId: "cow-milk", qty: 1, price: 36 },
      { productId: "coconut-water", qty: 1, price: 97 },
      { productId: "low-fat-dahi", qty: 1, price: 46 },
    ] });
  return { txns: txns.reverse(), orders: orders.reverse(), balance: bal };
}

export function makeSeed(): DemoState {
  const { txns, orders, balance } = buildLedgerAndOrders();
  const subscriptions: Subscription[] = [
    { id: "SUB-01", productId: "cow-milk", qty: 1, frequency: "daily", startDate: "2026-09-01", status: "active" },
    { id: "SUB-02", productId: "low-fat-dahi", qty: 1, frequency: "weekly", weekday: 0, startDate: "2026-10-04", status: "active" },
    { id: "SUB-03", productId: "coconut-water", qty: 1, frequency: "alternate", startDate: "2026-11-14", status: "active",
      offer: { id: "OFR-4PE4", name: "4 pe 4 on Tender Coconut (2 free deliveries left)", voidsOnChange: ["frequency", "remove"] } },
  ];
  const vacations: Vacation[] = [];
  return {
    version: STATE_VERSION,
    clock: DEFAULT_CLOCK,
    customer: {
      id: "CUST-DEMO-0042", firstName: "Ananya", lastName: "Sharma", city: "Gurugram", area: "Tower B, Palm Grove, Sector 56 (demo address)",
      language: "en", phoneMasked: "+91 ••••• 43210", slot: "Morning (5:00 AM – 7:30 AM)",
      vip: { active: true, plan: "VIP · 30 days", validTill: "2026-12-02", benefitLeft: 164, benefitTotal: 600, autoRenew: true },
      consents: { promoInApp: true, promoWhatsApp: true, promoVoice: false, memory: true, wellness: false },
      promoTouchesThisMonth: 1, dnc: false,
    },
    wallet: { balance, lowThreshold: 200, autopay: { enabled: true, threshold: 200, amount: 500, method: "UPI Autopay · HDFC Bank ••21" }, smartRecharge: { planId: null } },
    txns,
    subscriptions,
    vacations,
    orders,
    cart: [],
    prefs: { ringBell: true, callBefore: false, voiceNote: "", reusableBag: true },
    tickets: [],
    wellness: null,
    offers: [
      { id: "OFR-PANEER-SUN", name: "Paneer Sundays", productIds: ["taaza-paneer"], benefit: "20% off Taaza Paneer on a weekly Sunday subscription",
        validTill: "2026-11-30", channel: ["inapp", "whatsapp", "voice"], eligibleSegment: "Active milk subscribers without a paneer subscription",
        conditions: ["Weekly subscription delivered on Sundays", "Up to 1 pack per delivery", "If VIP price is lower, the VIP price applies (offers don't club)", "Removing the subscription ends the offer"] },
      { id: "OFR-GREEK-TRIAL", name: "Greek Yogurt trial", productIds: ["greek-yogurt"], benefit: "First 2 deliveries at ₹59",
        validTill: "2026-12-05", channel: ["inapp"], eligibleSegment: "Customers who have not bought Greek Yogurt",
        conditions: ["New subscriptions only", "Price returns to the regular member price from the 3rd delivery"] },
    ],
    plans: [
      { id: "PLAN-SMART-3000", name: "Smart Plan", amount: 3000, cashback: 250, schedule: "₹50 cashback on each of your next 5 orders", notes: "Recharges automatically when your balance is low · pause or cancel anytime · 24-hr prior notification" },
      { id: "PLAN-MONTHLY-1500", name: "Monthly Once", amount: 1500, cashback: 125, schedule: "₹25 now + ₹100 over your next 4 orders", notes: "One recharge a month · illustrative amount in this prototype" },
    ],
    pastConversations: [
      { id: "CONV-1112", title: "VIP benefit balance", startedAt: "2026-11-12T19:42", channel: "inapp", summary: "Explained that VIP ends at 30 days or when the ₹600 benefit is used, whichever is first." },
    ],
    screenVisits: [],
  };
}

export const productName = (id: string) => byId(id).name;
