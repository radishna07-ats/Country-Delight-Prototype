// Rule-based NLU for the PROTOTYPE. In production this is Graine's model runtime; here a transparent,
// testable parser stands in so the demo is deterministic and never invents data.
import type { Frequency, Product } from "../data/types";
import { addDays, earliestChangeDate, findProducts, isGenericMilk, today, weekday } from "../backend/rules";

export type Intent =
  | "human" | "medical" | "wellness" | "delivery_issue" | "delivery_prefs" | "wallet_deduction" | "wallet_refund"
  | "payment_failed" | "smart_recharge" | "wallet_balance" | "end_vacation" | "vacation" | "pause_subscription"
  | "remove_subscription" | "change_subscription" | "add_subscription" | "add_to_cart" | "tomorrow_order"
  | "offers" | "navigate" | "greet" | "thanks" | "yes" | "no" | "unknown";

export interface Parsed {
  intent: Intent;
  text: string;
  qty?: number;
  delta?: number;            // "one more" → +1, "one less" → −1
  products: Product[];
  genericMilk: boolean;
  range?: { start: string; end: string; label: string };
  frequency?: Frequency;
  weekday?: number;
  amount?: number;
  screen?: string;
  reason?: string;
  hinglish: boolean;
}

const NUM: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1, single: 1, couple: 2,
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, saat: 7,
};
const DAYS: Record<string, number> = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, friday: 5, fri: 5, saturday: 6, sat: 6, ravivar: 0, somvar: 1 };
const HINGLISH = /\b(mera|meri|mere|nahi|nhi|aaya|aayi|kal|parso|kar do|karo|band|chahiye|kitna|kitne|paise|doodh|dudh|bhej|hai|hua|kyun|kyu|kab|abhi tak)\b/;

const lower = (s: string) => s.toLowerCase().replace(/[’']/g, "'");

export function parseQty(t: string): number | undefined {
  const m = t.match(/\b(\d{1,2})\s*(x\s*)?(packets?|packs?|pouches?|units?|bottles?|pieces?|pcs|nos|of)?\b/);
  if (m && !/₹|rs\.?\s*$/.test(t.slice(0, m.index))) {
    const n = Number(m[1]); if (n > 0 && n <= 20 && !/\b\d{1,2}(st|nd|rd|th)\b/.test(m[0])) return n;
  }
  for (const [w, n] of Object.entries(NUM)) {
    if (w.length <= 2 && !["do", "ek"].includes(w)) continue; // avoid "a"/"an" noise
    if (new RegExp(`\\b${w}\\b\\s+(more\\s+|extra\\s+|additional\\s+)?(packets?|packs?|pouches?|units?|bottles?|litres?|milk|paneer|coconuts?|eggs?|dahi|curd|bread|packet)`).test(t)) return n;
  }
  return undefined;
}

function parseAmount(t: string): number | undefined {
  const m = t.match(/(?:₹|rs\.?\s?|inr\s?)(\d[\d,]*)/i) ?? t.match(/\b(\d{2,5})\s*(?:rupees|rs\b|₹)/i);
  return m ? Number(m[1].replace(/,/g, "")) : undefined;
}

const nextWeekday = (from: string, wd: number, allowSame = true) => {
  let d = from; for (let i = 0; i < 8; i++) { if (weekday(d) === wd && (allowSame || i > 0)) return d; d = addDays(d, 1); } return from;
};

/** Resolve date ranges relative to the demo clock. Start never precedes the first changeable date. */
export function parseRange(t: string, clock: string): Parsed["range"] {
  const first = earliestChangeDate(clock);
  const now = today(clock);
  const nOf = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUM[s]);
  let m = t.match(/\b(?:next|for|agle|aane wale)\s+(\d{1,2}|one|two|three|four|five|six|seven|ten|ek|do|teen|char|paanch)\s+(days?|din)\b/)
       ?? t.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|ten|ek|do|teen|char|paanch)\s+(days?|din)\b/);
  if (m) { const n = nOf(m[1]); if (n) return { start: first, end: addDays(first, n - 1), label: `${n} day${n > 1 ? "s" : ""}` }; }
  if (/\bnext week\b|\bagle hafte\b/.test(t)) {
    const mon = nextWeekday(addDays(now, 1), 1); const start = mon < first ? first : mon;
    return { start, end: addDays(mon, 6), label: "next week" };
  }
  m = t.match(/\bfrom\s+(\w+)\s+(?:to|till|until|-)\s+(\w+)/) ?? t.match(/\b(\w+day)\s+(?:to|till|until|se)\s+(\w+day)\b/);
  if (m && DAYS[m[1]] !== undefined && DAYS[m[2]] !== undefined) {
    const s = nextWeekday(first, DAYS[m[1]]); const e = nextWeekday(s, DAYS[m[2]]);
    return { start: s, end: e, label: `${cap(m[1])} to ${cap(m[2])}` };
  }
  m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:nov(?:ember)?|dec(?:ember)?)?\s*(?:to|till|-)\s*(\d{1,2})(?:st|nd|rd|th)?\s*(nov(?:ember)?|dec(?:ember)?)?/);
  if (m && /(to|till|-)/.test(m[0]) && /(nov|dec|th|st|nd|rd)/.test(m[0])) {
    const mon = /dec/.test(m[0]) ? "12" : "11";
    const s = `2026-${mon}-${m[1].padStart(2, "0")}`; let e = `2026-${/dec/.test(m[3] ?? "") ? "12" : mon}-${m[2].padStart(2, "0")}`;
    if (e < s) e = addDays(e, 30);
    return { start: s, end: e, label: "those dates" };
  }
  m = t.match(/\b(?:till|until|upto|up to)\s+(\w+day)\b/);
  if (m && DAYS[m[1]] !== undefined) return { start: first, end: nextWeekday(first, DAYS[m[1]]), label: `till ${cap(m[1])}` };
  if (/\b(this )?weekend\b/.test(t)) { const s = nextWeekday(first, 6); return { start: s, end: addDays(s, 1), label: "the weekend" }; }
  if (/\btomorrow\b|\bkal\b/.test(t)) return { start: first, end: first, label: "tomorrow" };
  return undefined;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function parseFrequency(t: string): { frequency?: Frequency; weekday?: number } {
  const wd = Object.entries(DAYS).find(([k]) => k.length > 3 && new RegExp(`\\bevery ${k}\\b|\\b${k}s\\b|\\bhar ${k}\\b`).test(t));
  if (wd) return { frequency: "weekly", weekday: wd[1] };
  if (/\b(daily|every day|everyday|har roz|roz|har din)\b/.test(t)) return { frequency: "daily" };
  if (/\b(alternate|every other day)\b/.test(t)) return { frequency: "alternate" };
  if (/\bweekly|every week\b/.test(t)) return { frequency: "weekly" };
  if (/\b(once|one time|just tomorrow)\b/.test(t)) return { frequency: "once" };
  return {};
}

const SCREENS: [RegExp, string][] = [
  [/subscription/, "subscriptions"], [/vacation/, "vacations"], [/(wallet|cd money|recharge)/, "cdmoney"], [/transaction|passbook|ledger/, "transactions"],
  [/orders?\b/, "orders"], [/(account|preference|profile|address)/, "account"], [/\bcart\b/, "cart"], [/offers?|coupon/, "offers"],
  [/wellness/, "wellness"], [/menu/, "menu"], [/home/, "home"], [/products?|shop/, "products"],
];

export function parse(input: string, clock: string): Parsed {
  const t = ` ${lower(input).trim()} `;
  const products = findProducts(input);
  const base: Parsed = { intent: "unknown", text: input, products, genericMilk: isGenericMilk(input), hinglish: HINGLISH.test(t), ...parseFrequency(t) };
  base.qty = parseQty(t);
  base.amount = parseAmount(input);
  base.range = parseRange(t, clock);
  if (/\b(one|1|ek)\s+(more|extra|additional|aur)\b|\banother\b|\bek aur\b/.test(t)) base.delta = 1;
  if (/\b(one|1)\s+(less|fewer)\b/.test(t)) base.delta = -1;
  const has = (re: RegExp) => re.test(t);

  const intent = ((): Intent => {
    if (has(/^\s*(yes|yeah|yep|haan|han|ok|okay|sure|confirm|go ahead|theek hai)\s*[.!]?\s*$/)) return "yes";
    if (has(/^\s*(no|nope|nahi|nah|cancel|don'?t)\s*[.!]?\s*$/)) return "no";
    if (has(/\b(talk|speak|connect)\b.*\b(person|human|agent|executive|someone|customer care)\b|\bcustomer care\b|\breal person\b/)) return "human";
    if (has(/\b(diabet\w*|pregnan\w*|blood pressure|\bbp\b|cholesterol|kidney|thyroid|pcos|medicine|medication|my doctor|disease|heart patient|surgery)\b/)) return "medical";
    if (has(/\b(work ?out|workouts|working out|started training|gym|fitness|exercis\w*|protein intake|muscle|wellness|weight loss|lose weight|healthy eating|nutrition)\b/)) return "wellness";
    if (has(/\b(not|n't|nahi|nhi)\b.{0,25}\b(arriv\w*|come|came|received|deliver\w*|aaya|aayi|mila)\b|\b(hasn'?t|didn'?t|haven'?t)\b.{0,20}\b(arriv\w*|come|receiv\w*|deliver\w*|get)\b|\bmissing\b|\bleak\w*\b|\bdamag\w*\b|\bbroken\b|\bwrong (item|product|milk)\b|\bspoil\w*\b|\bsour\b|\bwhere is my (milk|order|delivery)\b|\babhi tak\b/)) return "delivery_issue";
    if (has(/\b(ring|bell|doorbell|knock|call (me )?before|voice (note|instruction))\b/)) return "delivery_prefs";
    if (has(/\b(refund|withdraw|money back|transfer.*bank|to my bank)\b/)) return "wallet_refund";
    if (has(/\b(payment|recharge|upi)\b.{0,30}\b(fail\w*|stuck|pending|not (reflect\w*|added|credited))\b/)) return "payment_failed";
    if (has(/\b(deduct\w*|debit\w*|charged|kata|kaata|kat gaya|cut from)\b|\bwhy\b.{0,25}(money|₹|rs\b|balance)|\bmoney\b.{0,15}\b(gone|taken|missing)\b/)) return "wallet_deduction";
    if (has(/\b(smart recharge|smart plan|monthly once|monthly recharge|autopay|auto pay|auto-pay|recharge)\b/)) return "smart_recharge";
    if (has(/\b(balance|how much money|money left|wallet|cd money|paise kitne|kitne paise)\b/)) return "wallet_balance";
    if (has(/\b(end|cancel|stop|resume)\b.{0,15}\b(vacation|pause|holiday)\b|\bresume (my )?deliver\w*\b/)) return "end_vacation";
    if (has(/\b(tomorrow'?s order|kal ka order|upcoming order|next order|where can i see|my orders)\b/)) return "tomorrow_order";
    if (has(/\b(offers?|discount|deals?|coupons?|promo\w*)\b/)) return "offers";
    if ((has(/\b(pause|hold|skip|vacation|holiday|travel\w*|away|out of town|band kar\w*|band karo|rok do)\b/) || (has(/\bstop\b/) && base.range))) {
      return products.length && !has(/\b(deliveries|delivery|everything|all)\b/) ? "pause_subscription" : "vacation";
    }
    if (has(/\b(stop|remove|cancel|discontinue|unsubscribe|don'?t want|band)\b/) && (products.length || base.genericMilk)) return "remove_subscription";
    if (has(/\b(increase|decrease|reduce|more|extra|another|make it|change|update|modify|less|fewer)\b/) && has(/\b(subscription|regular|daily|usual|every day|quantity|qty|packets?|milk|doodh)\b/)) return "change_subscription";
    if ((base.frequency && base.frequency !== "once") && (products.length || base.genericMilk) && has(/\b(add|subscribe|start|send|deliver|bhej|chahiye|want|get)\b/)) return "add_subscription";
    if (has(/\b(subscribe|subscription)\b/) && products.length) return "add_subscription";
    if (has(/\b(add|order|buy|get|send|bhej\w*|chahiye|want|need|cart)\b/) && (products.length || base.genericMilk)) return "add_to_cart";
    if (has(/\b(open|go to|show|take me|navigate|where is|kahan)\b/) && SCREENS.some(([re]) => re.test(t))) return "navigate";
    if (has(/\b(hi|hello|hey|namaste|what can you do|help me|how does this work)\b/)) return "greet";
    if (has(/\b(thanks|thank you|thx|shukriya|dhanyavaad)\b/)) return "thanks";
    return "unknown";
  })();
  base.intent = intent;
  if (intent === "navigate") base.screen = SCREENS.find(([re]) => re.test(t))?.[1];
  if (intent === "delivery_issue") base.reason =
    /leak/.test(t) ? "leaking" : /damag|broken|crack/.test(t) ? "damaged" : /wrong/.test(t) ? "wrong_item" : /missing/.test(t) ? "missing_item" : /spoil|sour/.test(t) ? "quality" : "not_received";
  return base;
}
