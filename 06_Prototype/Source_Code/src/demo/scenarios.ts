import { db, ui, navigate, resetDemo, logCall } from "../backend/store";
import { resetEngine, userSays } from "../agent/engine";
import { openAssistant } from "../agent-ui/assistant";
import { refreshUpcomingOrders } from "../backend/api";

export interface Scenario {
  id: string; uc: string; title: string; channel: string; summary: string;
  lines: string[];                 // what the presenter can say/tap next
  points: string[];                // talking points for the presenter
  run: (autoplay: boolean) => void;
}

const fresh = (clock?: string) => {
  resetDemo(); resetEngine();
  if (clock) db.set((s) => ({ ...s, clock }));
  refreshUpcomingOrders();
  ui.set((s) => ({ ...s, splash: false }));
};
const inapp = (first: string, autoplay: boolean, screen: Parameters<typeof navigate>[0] = "home") => {
  navigate(screen);
  setTimeout(() => (autoplay ? openAssistant({ say: first }) : openAssistant({})), 250);
};
const morningIssue = () => db.set((s) => ({ ...s, clock: "2026-11-22T05:40", orders: s.orders.map((o) => (o.date === "2026-11-22" ? { ...o, status: "delivered", statusAt: "05:12", pod: { at: "05:12", note: "Left at building gate", photo: "gate" } } : o)) }));

export const SCENARIOS: Scenario[] = [
  { id: "s0", uc: "UC3", title: "Agent operates the app", channel: "In-app", summary: "“Find me a protein powder under ₹2,000 and add the best-rated option to my cart.” The agent reads the screen, opens search, types the query, sorts by rating, filters by price, taps Add and checks the cart, all in the app.",
    lines: ["Find me a protein powder under ₹2,000 and add the best-rated option to my cart.", "What's on this screen?", "Open greek yogurt", "Add two of this to my cart", "Remove the protein powder from my cart", "Show me paneer under 120", "Add the first one to my cart", "Open my subscriptions"],
    points: ["Screen context is read before every decision and re-read after every action (inspector: SCREEN rows).", "Actions go through the app's own UI: tap, type, sort, navigate. A green ring shows what the agent touches; Stop halts it.", "Guardrails are enforced in the action layer: it never presses Pay or Place order (T4) and needs your confirmation for account changes (T2)."],
    run: (a) => { fresh(); inapp("Find me a protein powder under ₹2,000 and add the best-rated option to my cart.", a); } },
  { id: "s1", uc: "UC3", title: "Add to cart by voice or chat", channel: "In-app", summary: "“Add two packets of milk to my cart.” The agent opens the milk options on screen, asks which one (usual first), then adds it through the app and reads back the cart.",
    lines: ["Add two packets of milk to my cart.", "Add one paneer to my cart", "What's in my cart?", "Where can I see tomorrow's order?"],
    points: ["Clarifies instead of guessing (cow vs buffalo), with the options visible in the app.", "Cart is not checkout: the agent never pays.", "Inspector: each tap is an in-app action (T1), verified by re-reading the screen."],
    run: (a) => { fresh(); inapp("Add two packets of milk to my cart.", a); } },
  { id: "s2", uc: "UC5", title: "Change a subscription with a card", channel: "In-app", summary: "“Add one more packet of milk to my regular subscription.” Current → proposed, effective date, price impact, Confirm, Undo — no screen hopping.",
    lines: ["I want to add one more packet of milk to my regular subscription.", "Change my coconut water to daily", "Stop my curd"],
    points: ["Web-component card instead of 3 screens (whiteboard UC5).", "Offer impact shown before the change (4 pe 4 voids on frequency change).", "Cancel save-flow asks why and offers pause first."],
    run: (a) => { fresh(); inapp("I want to add one more packet of milk to my regular subscription.", a, "subscriptions"); } },
  { id: "s3", uc: "UC3", title: "Pause deliveries (vacation)", channel: "In-app voice", summary: "“Pause my delivery for the next three days.” Dates resolved against the 11 pm cut-off and 60-day rule, confirmed on screen.",
    lines: ["Pause my delivery for the next three days", "Pause my deliveries next week", "kal se 3 din doodh band kar do"],
    points: ["Voice for intent, screen for confirmation.", "Rule check is logged (cut-off, max 60 days).", "Vacations screen and Home date strip update."],
    run: (a) => { fresh(); navigate("home"); setTimeout(() => { openAssistant({ voice: true }); if (a) setTimeout(() => userSays("Pause my delivery for the next three days", "inapp"), 600); }, 250); } },
  { id: "s4", uc: "UC1", title: "Explain a wallet deduction", channel: "In-app", summary: "“Why was ₹500 deducted from my wallet?” The ledger shows it was a UPI Autopay top-up from the bank, triggered when the balance fell below ₹200.",
    lines: ["Why was ₹500 deducted from my wallet?", "Why was money deducted?", "How much money is left in my CD Money wallet?", "Refund my wallet balance to my bank"],
    points: ["Explanation comes only from ledger rows + published rules.", "Never asks for OTP/UPI PIN; never pays.", "Unknown amount → says so instead of guessing (try ₹999)."],
    run: (a) => { fresh(); inapp("Why was ₹500 deducted from my wallet?", a, "cdmoney"); } },
  { id: "s4w", uc: "UC1", title: "Wallet help on WhatsApp", channel: "WhatsApp", summary: "Same agent and tools on WhatsApp: number matched to the account, answers with reply buttons.",
    lines: ["Why was ₹500 deducted?", "What's my balance?", "Talk to a person"],
    points: ["Channel-appropriate rendering: text + up to 3 reply buttons.", "Identity: sender number matched (logged).", "Requires CD WhatsApp Business account; two-way text agent to confirm with Graine."],
    run: (a) => { fresh(); navigate("whatsapp"); if (a) setTimeout(() => userSays("Why was ₹500 deducted?", "whatsapp"), 900); } },
  { id: "s5", uc: "UC2", title: "Milk hasn't arrived (5:40 AM)", channel: "In-app", summary: "Order marked delivered at 05:12 with a gate photo. The agent shows proof of delivery, asks the customer to check, offers only policy-approved remedies and creates a case.",
    lines: ["My milk hasn't arrived.", "Checked, nothing there", "Please call before delivery"],
    points: ["Support opens at 6 AM — the agent covers the gap.", "Remedies come from a policy service, not the model.", "A3: offers doorstep preference after a complaint."],
    run: (a) => { fresh(); morningIssue(); inapp("My milk hasn't arrived.", a, "orders"); } },
  { id: "s5w", uc: "UC2", title: "Hinglish on WhatsApp", channel: "WhatsApp", summary: "“mera doodh abhi tak nahi aaya” — Hinglish in, Hinglish out, same verified status and options.",
    lines: ["mera doodh abhi tak nahi aaya", "Check kiya — kuch nahi hai"],
    points: ["Code-switching (Graine: 18 call languages, 11 mid-call).", "Same tools and policy as in-app."],
    run: (a) => { fresh(); morningIssue(); navigate("whatsapp"); if (a) setTimeout(() => userSays("mera doodh abhi tak nahi aaya", "whatsapp"), 900); } },
  { id: "s5c", uc: "UC2", title: "Out-of-hours helpline call", channel: "Phone (inbound)", summary: "Customer calls at 5:40 AM. The voice agent verifies, checks status, resolves within policy, and books a 6 AM callback if needed.",
    lines: ["It's 122 011.", "My milk hasn't arrived", "Checked, nothing there"],
    points: ["Identity before account data.", "Captions + spoken replies (browser speech in this prototype).", "Ayuh's “Call Us” can route here out of hours."],
    run: () => { fresh(); morningIssue(); navigate("call", { mode: "inbound" }); } },
  { id: "s6", uc: "UC6", title: "Wellness journey", channel: "In-app", summary: "“I've started working out.” Consent → goal → diet → allergies → catalogue-grounded suggestions that exclude allergens, with a safety note.",
    lines: ["I have started working out. Recommend products.", "I have diabetes, what should I eat?"],
    points: ["Consent first; profile deletable in Account & Preferences.", "Allergens always exclude (choose Peanuts → peanut butter removed).", "No medical advice; uses catalogue tags only."],
    run: (a) => { fresh(); inapp("I have started working out. Recommend products.", a, "wellness"); } },
  { id: "s7", uc: "UC4", title: "Offer campaign (consent-first)", channel: "Push / WhatsApp / voice", summary: "Run “Paneer Sundays”: eligibility (consent, DNC, frequency cap, calling window) is checked per channel before anything is sent.",
    lines: ["Show conditions", "Subscribe with offer", "STOP"],
    points: ["Voice consent is OFF for this customer → voice is skipped (toggle it in Account & Preferences).", "Offer text only from the approved offer record.", "STOP → do-not-call / consent withdrawn instantly."],
    run: () => { fresh(); navigate("home"); } },
  { id: "s8", uc: "UC3", title: "Contextual help (friction)", channel: "In-app", summary: "Open Set Vacation and wait 20 s, or bounce between screens: one quiet suggestion appears (max 3 per session).",
    lines: [], points: ["Graine friction detection: stalled_on_step, looping_between_screens.", "Never interrupts while talking; cooldown and per-session cap."],
    run: () => { fresh(); navigate("vacations", { open: "1" }); } },
  { id: "s9", uc: "Ayuh", title: "Ayuh + Graine together", channel: "In-app", summary: "Ayuh's tree stays. From “Something else” or a leaf, the customer continues with the Graine assistant without repeating context.",
    lines: [], points: ["Complement, not replace (deck slide 2).", "Context passed: Ayuh path → assistant opening line."],
    run: () => { fresh(); navigate("ayuh"); } },
];

/** UC4 campaign simulator: checks eligibility per channel and delivers on the first allowed channel(s). */
export function runCampaign(channel: "inapp" | "whatsapp" | "voice") {
  const s = db.get(); const c = s.customer; const h = Number(s.clock.slice(11, 13));
  const checks = {
    eligible: !s.subscriptions.some((x) => x.productId === "taaza-paneer" && x.status === "active"),
    consent: channel === "inapp" ? c.consents.promoInApp : channel === "whatsapp" ? c.consents.promoWhatsApp : c.consents.promoVoice,
    notDnc: channel !== "voice" || !c.dnc,
    frequencyCap: c.promoTouchesThisMonth < 2,
    window: channel !== "voice" || (h >= 10 && h < 19),
  };
  const ok = Object.values(checks).every(Boolean);
  logCall({ name: `campaign "Paneer Sundays" → ${channel}: ${ok ? "send" : "skip"}`, kind: "workflow", status: ok ? "ok" : "refused", args: checks, note: ok ? undefined : Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(", ") });
  if (!ok) return { ok, checks };
  db.set((x) => ({ ...x, customer: { ...x.customer, promoTouchesThisMonth: x.customer.promoTouchesThisMonth + 1 } }));
  if (channel === "inapp") ui.set((x) => ({ ...x, incoming: { kind: "push", title: "Country Delight", body: "Paneer Sundays: 20% off Taaza Paneer on a weekly Sunday subscription. Tap to see conditions.", action: "offer" } }));
  if (channel === "whatsapp") ui.set((x) => ({ ...x, incoming: { kind: "whatsapp", title: "WhatsApp · Country Delight", body: "You're eligible for Paneer Sundays — 20% off…", action: "wa-offer" } }));
  if (channel === "voice") navigate("call", { mode: "outbound", offer: "OFR-PANEER-SUN" });
  return { ok, checks };
}
