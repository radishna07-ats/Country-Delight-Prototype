// Business rules of the SIMULATED back end.
// Sources: 11 pm cut-off (countrydelight.in), 5:00–7:30 AM slot (FAQ), vacation max 60 days (app, S3 01:33),
// charge after delivery (app, S3 01:17), Autopay 25–26 h lag (FAQ), refund to bank 5–7 working days (FAQ).
import type { Frequency, Product, Subscription, Vacation, Weekday } from "../data/types";
import { CATALOGUE, byId } from "../data/catalogue";

export const CUTOFF_HOUR = 23;
export const VACATION_MAX_DAYS = 60;
export const SLOT = "5:00–7:30 AM";

// ---------- naive local date helpers (all demo times are IST wall-clock; no timezone maths) ----------
export const toDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export const addDays = (isoDate: string, n: number) => { const d = toDate(isoDate); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
export const weekday = (isoDate: string) => toDate(isoDate).getUTCDay() as Weekday;
export const daysBetween = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86400000);
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (isoDate: string) => { const d = toDate(isoDate); return `${DAY_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const fmtDay = (isoDate: string) => { const d = toDate(isoDate); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
export const fmtTs = (ts: string) => `${fmtDate(ts.slice(0, 10))} · ${ts.slice(11, 16)}`;
export const today = (clock: string) => clock.slice(0, 10);
export const hour = (clock: string) => Number(clock.slice(11, 13)) + Number(clock.slice(14, 16)) / 60;
export const rupees = (n: number) => `₹${Number.isInteger(n) ? n.toLocaleString("en-IN") : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** First date a change can affect, given the 11 pm cut-off. */
export const earliestChangeDate = (clock: string) => addDays(today(clock), hour(clock) < CUTOFF_HOUR ? 1 : 2);

// ---------- prices ----------
export const unitPrice = (p: Product, vip: boolean) => (vip ? p.vipPrice ?? Math.round(p.price * 0.85 * 2) / 2 : p.price);

// ---------- subscriptions ----------
export const FREQ_LABEL: Record<Frequency, string> = { daily: "Daily", alternate: "Alternate days", weekly: "Weekly", once: "One time" };
export const deliversOn = (s: Subscription, date: string): boolean => {
  if (s.status === "removed" || date < s.startDate) return false;
  if (s.status === "paused" && s.pausedUntil && date <= s.pausedUntil) return false;
  switch (s.frequency) {
    case "daily": return true;
    case "alternate": return daysBetween(s.startDate, date) % 2 === 0;
    case "weekly": return weekday(date) === (s.weekday ?? weekday(s.startDate));
    case "once": return date === s.startDate;
  }
};
export const inVacation = (vacs: Vacation[], date: string) => vacs.some((v) => v.status !== "ended" && date >= v.start && date <= v.end);
export const deliveriesPerMonth = (s: Pick<Subscription, "frequency">) => ({ daily: 30, alternate: 15, weekly: 4.3, once: 1 }[s.frequency]);
export const freqText = (s: Pick<Subscription, "frequency" | "weekday">) =>
  s.frequency === "weekly" ? `Every ${DAY_NAMES[s.weekday ?? 0]}` : FREQ_LABEL[s.frequency];

// ---------- vacations ----------
export interface VacationCheck { ok: boolean; reason?: string; days?: number; resume?: string }
export function checkVacation(clock: string, start: string, end: string, existing: Vacation[]): VacationCheck {
  const earliest = earliestChangeDate(clock);
  if (start < earliest) return { ok: false, reason: `The earliest date that can still be changed is ${fmtDate(earliest)} (orders lock at 11 pm).` };
  if (end < start) return { ok: false, reason: "The end date is before the start date." };
  const days = daysBetween(start, end) + 1;
  if (days > VACATION_MAX_DAYS) return { ok: false, reason: `A vacation can be at most ${VACATION_MAX_DAYS} days; this is ${days} days.` };
  const clash = existing.find((v) => v.status !== "ended" && !(end < v.start || start > v.end));
  if (clash) return { ok: false, reason: `It overlaps a vacation already set for ${fmtDate(clash.start)} – ${fmtDate(clash.end)}.` };
  return { ok: true, days, resume: addDays(end, 1) };
}

// ---------- catalogue search ----------
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
/** Products mentioned in free text. A product whose matched phrase is contained in a longer
 *  matched phrase is dropped ("milk" → cow milk is dropped when "buffalo milk" also matches). */
export function findProducts(text: string): Product[] {
  const t = ` ${norm(text)} `;
  const hits: { p: Product; phrase: string }[] = [];
  for (const p of CATALOGUE) {
    let best = "";
    for (const a of [p.name, ...p.aliases]) {
      const n = norm(a);
      if (n && t.includes(` ${n} `) && n.length > best.length) best = n;
    }
    if (best) hits.push({ p, phrase: best });
  }
  return hits
    .filter((h) => !hits.some((o) => o !== h && o.phrase.length > h.phrase.length && o.phrase.includes(h.phrase)))
    .map((h) => h.p);
}
export const MILK_VARIANTS = ["cow-milk", "buffalo-milk", "low-fat-cow-milk", "hp-cow-milk"].map(byId);
export const isGenericMilk = (text: string) => /\bmilk|doodh|dudh\b/i.test(text) && !/(cow|buffalo|bhains|low fat|toned|protein|a2|malai|coconut)/i.test(text);

// ---------- resolution policy (UC2) — prototype policy, to be replaced by CD's ----------
export interface ResolutionOption { id: "redeliver" | "credit" | "replace_tomorrow" | "human"; label: string; detail: string }
export function resolutionOptions(reason: string, orderValue: number, clock: string, recentIncidents: number): ResolutionOption[] {
  if (recentIncidents >= 2) return [{ id: "human", label: "Review by our support team", detail: "This is your 3rd issue in 7 days, so a person will look at it and call you back." }];
  const opts: ResolutionOption[] = [];
  if ((reason === "not_received" || reason === "missing_item") && hour(clock) < 8) opts.push({ id: "redeliver", label: "Re-deliver this morning", detail: "A rider can bring it by 9:00 AM today." });
  opts.push({ id: "credit", label: `Wallet credit of ${rupees(orderValue)}`, detail: "Credited to CD Money once you confirm." });
  if (reason === "damaged" || reason === "wrong_item") opts.push({ id: "replace_tomorrow", label: "Free replacement tomorrow", detail: "Added to tomorrow's 5:00–7:30 AM delivery." });
  opts.push({ id: "human", label: "Talk to a person instead", detail: "Support team from 6:00 AM; we'll call you." });
  return opts;
}

export const RULE_TEXT: Record<string, string> = {
  "R-CHARGE-AFTER-DELIVERY": "Orders are charged to CD Money only after the products are delivered.",
  "R-AUTOPAY": "With UPI Autopay, when your balance falls below your limit your bank sends a mandate notice; the amount is debited from your bank 25–26 hours later and added to CD Money.",
  "R-AUTOPAY-CASHBACK": "Autopay recharges earn the cashback shown on your Autopay offer.",
  "R-VIP": "VIP ends after its days, or earlier if the plan's maximum benefit amount is fully used.",
  "R-REFUND-BANK": "Wallet balance (excluding cashback) can be refunded to your bank; it reaches your account within 5–7 working days after you share bank details through Country Delight's secure link.",
};
