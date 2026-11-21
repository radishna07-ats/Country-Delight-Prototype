// Builds CountryDelight_Sales_Pitch.docx and CTO_Discussion_Guide.docx
// Usage (from this folder): npm install && node docs.js
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  LevelFormat, PageOrientation, Footer, PageNumber, BorderStyle, TableOfContents,
} = require("docx");

const OUTDIR = path.resolve(__dirname, "..");
const GREEN = "1F4D2B", MINT = "EEF6EA", GREY = "5E6E63", LINE = "C9D6CC";

const styles = {
  default: { document: { run: { font: "Arial", size: 21 } } },
  paragraphStyles: [
    { id: "Title", name: "Title", basedOn: "Normal", run: { font: "Arial", size: 44, bold: true, color: GREEN }, paragraph: { spacing: { before: 0, after: 120 }, keepNext: true } },
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 30, bold: true, color: GREEN }, paragraph: { spacing: { before: 320, after: 120 }, keepNext: true, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 24, bold: true, color: GREEN }, paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Arial", size: 21, bold: true, color: "1D2A22" }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 2 } },
  ],
};
const numbering = { config: [
  { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 260 } } } }] },
  { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
] };

// inline **bold** support
const runs = (t, o = {}) => t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((seg) => seg.startsWith("**") ? new TextRun({ text: seg.slice(2, -2), bold: true, ...o }) : new TextRun({ text: seg, ...o }));
const P = (t, o = {}) => new Paragraph({ children: runs(t, o.run), spacing: { after: 100, line: 276 }, ...o.p });
const NOTE = (t) => new Paragraph({ children: runs(t, { italics: true, color: GREY, size: 18 }), spacing: { after: 100 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const UL = (items) => items.map((t) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: runs(t), spacing: { after: 60, line: 264 } }));
const OL = (items) => items.map((t) => new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: runs(t), spacing: { after: 60, line: 264 } }));
const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
function TABLE(header, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, w, head) => new TableCell({
    width: { size: w, type: WidthType.DXA }, margins: { top: 70, bottom: 70, left: 100, right: 100 },
    shading: head ? { type: ShadingType.CLEAR, color: "auto", fill: GREEN } : undefined,
    borders: { top: border, bottom: border, left: border, right: border },
    children: String(t).split("\n").map((line) => new Paragraph({ children: runs(line, head ? { bold: true, color: "FFFFFF", size: 19 } : { size: 19 }), spacing: { after: 40 } })),
  });
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, widths[i], false)) }))] });
}
const SP = () => new Paragraph({ children: [], spacing: { after: 60 } });
const footer = (label) => new Footer({ children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: `${label}  ·  Graine AI × Country Delight  ·  page `, size: 16, color: GREY }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY })] })] });
const cover = (title, sub, meta) => [
  new Paragraph({ children: [new TextRun({ text: "GRAINE AI × COUNTRY DELIGHT", bold: true, color: "1E7B34", size: 20 })], spacing: { after: 160 } }),
  new Paragraph({ style: "Title", children: [new TextRun(title)] }),
  P(sub, { run: { size: 24, color: GREY } }),
  P(meta, { run: { size: 18, color: GREY } }),
];

// ================================================================== SALES PITCH
function pitch() {
  const slides = [
    ["1 · Cover", "We've spent time inside your app and with your customers' own words. We built what we think the next version of the experience could feel like, and we'd like to show you.", "Nothing yet; keep the prototype open in presentation mode.", "This is evidence-led and specific to Country Delight, not a generic AI pitch.", "Before we start: what would make this hour most useful for you?"],
    ["2 · Executive summary", "Four messages: the product is loved; customers leave over post-order friction; a grounded agent layer fixes the friction without disturbing the app; start with a no-release pilot.", "—", "There is a concrete, low-risk first step.", "Do these four points match what you see in your own data?"],
    ["3 · How we worked", "Every number traces to evidence: the app recording, 2,150 public reviews, your public FAQ, and Graine's own documentation.", "Offer the evidence register.", "We separate verified facts from hypotheses.", "—"],
    ["5 · What to preserve", "Quality, range and the 5–7:30 AM ritual dominate praise. 16% of positive reviewers praise pausing and vacations. The agent must be optional.", "—", "We are not redesigning their app.", "Which parts of the app do you consider untouchable?"],
    ["6 · Where it breaks", "After quality, it's support access, wallet clarity, price, subscription control. 66–78% of negative reviews touch a workflow an agent can help with. Quality itself is not something we fix.", "—", "The agent's job is post-order friction, not the product.", "What are your top three contact reasons by volume?"],
    ["7 · Observed in the app", "The ledger has data but not the why; subscription control is spread over three surfaces; Ayuh's deepest answer is a phone number; you already merchandise by health goal.", "Optionally open the real app.", "We studied their product closely.", "Who owns Ayuh, and what does it resolve today?"],
    ["8 · Friction map", "Four clusters, each with evidence, a hypothesis on cause, and an intervention.", "—", "Interventions are tied to specific friction.", "Which cluster costs you most today?"],
    ["9 · What the data changed", "Our earlier brief overstated two things; we corrected them: quality complaints, and pre-dawn voice calls.", "—", "We correct ourselves before they find it.", "—"],
    ["11 · Principles", "Optional, grounded, confirm before change, a person one step away, respectful outreach, works with Ayuh.", "—", "Brand and risk concerns are designed in.", "Any principle you'd add?"],
    ["12 · Current vs enhanced", "Same tasks, fewer steps: pause, explain a deduction, missing milk at 5:40 AM, one more packet, safe protein picks.", "**Live demo** — see Meeting_Demo_Script.md.", "This works, end to end.", "—"],
    ["13–18 · Use cases", "Walk UC1, UC2, UC3, UC5, UC4, UC6: what the customer gets, guardrails, what CD provides, how we measure.", "Scenarios 4, 5/5w/5c, 1, 3, 2, 7, 6 with the inspector visible.", "Each use case has a dependency list and a metric.", "Which use case would you put in front of customers first?"],
    ["19 · Ayuh & opportunities", "Ayuh stays; seven more opportunities, four worth doing early.", "Scenario 9 (Ayuh hand-off).", "Coexistence, not replacement.", "—"],
    ["21 · Architecture", "Graine sits beside your systems; reads via server tools, changes via your app's handlers; three deployment models.", "Inspector: API tool vs app action.", "No monolith change; clear integration points.", "What does your API layer look like today?"],
    ["22 · Security", "Authority never exceeds the signed-in app. Five tiers; the agent never pays.", "Scenario: fault injection → 'nothing was changed'.", "Failure is honest and safe.", "What would your security review require?"],
    ["23 · Feasibility", "What each side builds; what we confirm before the pilot.", "—", "Work split is realistic.", "Who would be our technical counterpart?"],
    ["25 · Business case", "Illustrative: Base positive, Conservative negative. That is why we pilot with a control group.", "Open the Excel model if asked.", "We won't oversell; the model is theirs to edit.", "Can we rebuild this with your margin, ARPU and contact data?"],
    ["26 · Value sources", "Most value is retention: UC2 and the save flow. Support savings alone don't pay for the platform.", "—", "Retention is the lever.", "What is your monthly churn, and why do customers say they leave?"],
    ["27 · Pilot", "Wallet + delivery help on WhatsApp and out-of-hours voice, one city, no app release, control group, kill switch.", "—", "The first step is small and measurable.", "Which city and hub would you choose?"],
    ["28 · Metrics", "Targets after a two-week baseline; exit criteria agreed up front.", "—", "Success is defined jointly.", "—"],
    ["29 · Roadmap", "About four months from discovery to a measured pilot readout.", "—", "Clear sequence and owners.", "—"],
    ["30 · Next steps", "Five asks: discovery session, five data points, API inventory, WhatsApp and helpline routing, pilot city.", "Leave the prototype link.", "What happens on Monday.", "Who should we schedule discovery with?"],
  ];
  const doc = new Document({ styles, numbering, creator: "Graine AI", title: "Country Delight — Sales Pitch & Meeting Script",
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, footers: { default: footer("Sales pitch & meeting script") }, children: [
      ...cover("Sales Pitch & Meeting Script", "For the Country Delight technology and leadership meeting", "Prepared by Graine AI · November 2026 · Internal: for the Graine presenting team"),
      H1("1. Meeting plan (60 minutes)"),
      TABLE(["Time", "Segment", "Slides / demo"], [
        ["0–5", "Opening and agenda", "1–3"], ["5–15", "What we learned", "4–9"], ["15–35", "Proposed experience + live demo", "10–19, prototype"],
        ["35–45", "Architecture, security, feasibility", "20–23"], ["45–55", "Value, pilot, roadmap", "24–29"], ["55–60", "Next steps and questions", "30"],
      ], [1300, 4600, 3700]),
      H1("2. Opening statement"),
      P("“Thank you for the time. We didn't want to walk in and say we have an AI agent that answers questions. So we studied your app frame by frame, read more than six hundred of your customers' negative reviews and many positive ones, and built a working prototype of what we think the next version of the Country Delight experience could feel like. Everything we show is grounded in public evidence; anything about your internal numbers is illustrative until you share yours. We'd like to leave with a small, measurable first step.”"),
      H2("Executive hook"),
      P("Your customers love the milk and the morning. When they leave, it's mostly about what happens after the order: a deduction they can't explain, a missing packet at 5:40 AM with no one to talk to until six, or a subscription change that feels risky. Each of these has a clear, measurable fix that needs no change to your core app in phase one."),
      H1("3. What we observed"),
      ...UL(["**App (v10.9.100):** the ledger shows “Paid for Order −₹49” without saying what was paid for; edit, pause, remove and vacation sit on three surfaces; removing a subscription has no save step; Ayuh's deepest branch opens the phone dialer; doorstep preferences exist but are buried; health goals are shelves.",
        "**Public FAQ:** delivery 5:00–7:30 AM; support 6 am–9 pm; Autopay debits 25–26 hours after the mandate notice; VIP ends when its benefit cap is used; bank refunds only via support.",
        "**Reviews:** quality is the largest single complaint theme; 66–78% of coded negative reviews mention a post-order workflow; repeated promotional calls are already a complaint."]),
      H1("4. Customer problems and hypotheses"),
      TABLE(["Problem (observed)", "Hypothesis to validate with CD data"], [
        ["Unexplained wallet movements", "Wallet/deduction contacts are a top-3 reason; explaining from the ledger reduces repeat contacts and disputes (HY-001)"],
        ["Pre-6 AM delivery problems", "Issues discovered before support opens drive escalation and churn (HY-002)"],
        ["Risky-feeling subscription changes", "A confirm-and-undo card raises modification completion and reduces accidental churn (HY-003)"],
        ["Cancellation with no alternative", "A short save conversation retains a share of voluntary cancellations (HY-005)"],
        ["Goal-led shoppers lack a guided path", "An allergy-aware wellness flow lifts cross-sell (HY-004)"],
      ], [4200, 5400]),
      H1("5. How Graine improves the experience"),
      ...UL(["**In-app:** an optional assistant docked above the navigation; voice or chat; shows cards; acts only through actions your app declares; asks for confirmation before any change.",
        "**WhatsApp and voice:** the same tools for wallet and delivery help, 24×7, with identity verification and hand-off to people.",
        "**Governance:** grounded answers, policy-bound remedies, consent-first outreach, audit of every action, kill switch without an app release."]),
      H1("6. Slide-by-slide guide"),
      TABLE(["Slide", "What to say", "What to demonstrate", "What the client should understand", "Question to ask"], slides, [1600, 3000, 1650, 1850, 1500]),
      H1("7. Prototype walkthrough"),
      P("Follow **Meeting_Demo_Script.md**. Keep the inspector visible on a second screen if possible: it is the strongest technical proof that the agent acts only through declared tools and confirms before changes."),
      H1("8. Revenue opportunity"),
      P("Use the Base case as illustration and the Conservative case as honesty: run-rate incremental revenue ≈ ₹162 lakh/month in Base (1.4% of an illustrative baseline), Year-1 net benefit ≈ ₹170 lakh, ROI 0.70×; Conservative is negative in year one. Most of the value is retention (UC2 and the save flow). Ask for margin, ARPU, contact reasons and cost, churn reasons and cancellation volume to rebuild the model."),
      NOTE("All figures come from CountryDelight_Revenue_Model.xlsx with illustrative inputs. Never present them as Country Delight forecasts."),
      H1("9. Technical architecture (talking points)"),
      ...UL(["Graine never becomes a system of record. Reads go through server-side API tools; changes go through your signed-in app's handlers or token-scoped tools.",
        "Phase 1 needs no mobile release (WhatsApp + voice). Phase 2 adds the SDK with about eleven action handlers on about eight screens.",
        "Data residency: shared cloud processes in India but stores recordings in the UK; India-only residency means a dedicated instance or your compute."]),
      H1("10. Pilot recommendation"),
      P("Wallet explanation and delivery-issue resolution on WhatsApp and out-of-hours voice, in one city hub, for eight weeks after a four-to-six-week build, with a matched control group and a kill switch. In-app UC3/UC5 follows in Phase 2."),
      H1("11. Closing statement"),
      P("“We'd like to earn the right to scale by proving value in one city first. If you can give us a discovery session, five data points and an API inventory, we'll come back with a pilot plan sized to your numbers.”"),
      H1("12. Objection handling"),
      TABLE(["Objection", "Response"], [
        ["“Customers hate chatbots.”", "They hate loops. Our reviews show that too. This agent acts, shows its result, and hands off with a summary. Ayuh stays for those who prefer it."],
        ["“We can't risk wrong refunds.”", "The model never decides money. Remedies come from your policy service; the agent proposes, the customer confirms, your system executes."],
        ["“Our app release cycle is slow.”", "Phase 1 needs no release. Design and component changes in Phase 2 ship from the dashboard."],
        ["“What about data protection?”", "On-device masking, verified identity, consent records, erase/export, DPA with you as fiduciary; residency options."],
        ["“Your ROI looks optimistic.”", "Our Conservative case is negative in year one. That's why we propose a pilot with a control group and agreed exit criteria."],
        ["“We could build this ourselves.”", "You could; the brief estimated 4–6 months for voice alone. The pilot lets you measure value before deciding to build or buy."],
      ], [3000, 6600]),
    ] }] });
  return Packer.toBuffer(doc).then((b) => fs.writeFileSync(path.join(OUTDIR, "CountryDelight_Sales_Pitch.docx"), b));
}

// ================================================================== CTO GUIDE
function cto() {
  const Q = [
    ["SDK integration", "How does the agent get into our app?",
      "SDKs for React Native, Android (Kotlin), iOS (Swift, iOS 15+), Flutter, Kotlin Multiplatform and web. configure(publishableKey) at launch, identify(user_id) after sign-in and at every launch. The voice bar runs in a Graine-hosted engine page, so fixes reach installed apps without a release; native calls update with the SDK.",
      "SDK version to pin; release cadence and changelog commitments (the SDK moved through several minor versions in recent weeks).", "Mobile stack and release cadence."],
    ["Existing app architecture", "Do we need to change our screens?",
      "No screen redesign. Each screen that the agent should understand reports structured fields (screen context); screens that can act register handlers. The SDK never reads the screen on its own and never records it.",
      "—", "Which screens are in scope for Phase 2 (we propose ~8)."],
    ["Back-end APIs", "Which APIs do you need?",
      "Pilot: read wallet ledger (with order/plan references), recharge plans, today's order and status, proof of delivery; write ticket, resolution request, delivery preferences, refund request. Phase 2: catalogue, subscriptions, vacations, cart. Contracts in Integration_Requirements.md (proposals, not your API).",
      "—", "API inventory; gaps; owners; rate limits."],
    ["Authentication", "How do you know who the customer is?",
      "In-app: your session plus identify(user_id) and a server token from your back end. WhatsApp: sender number matched to the registered number plus a CD-approved check. Voice: caller ID plus a knowledge check. Graine's own docs say device-supplied traits are for personalisation, not authorisation.",
      "Server-token flow for your stack; App Attest / Play Integrity status (documentation and recent release notes differ).", "Accepted verification method for WhatsApp and voice."],
    ["Security", "What protects the publishable key and our users?",
      "The key selects the agent and cannot read data or place calls; allowed domains admit apps via app://; single-use connection tickets (~2 minutes); per-key and per-address rate limits; credit limits; server tokens to prove each user; Security log.",
      "Attestation availability; penetration-test reports; certifications.", "Security review / VAPT scope and timeline."],
    ["Data privacy", "What data leaves the device and what is kept?",
      "Identifiers (PAN, Aadhaar, card, phone, email) are masked on device and again server-side; custom mask rules for your IDs. Screen state shapes the conversation but isn't kept as a separate record. For identified users with memory on, the recent conversation is kept 7 days after the last message; users can see and erase memories. Data-request tooling: export, correct, erase; DNC and consent records APIs.",
      "DPA; sub-processors; retention settings per data type.", "Fiduciary/processor roles; DPO sign-off; retention policy."],
    ["Identity management", "How is a customer the same person across channels?",
      "Memory keys on the identifier you send (one-way key in the memory service). The same user_id across app, WhatsApp-linked number and calls gives continuity, subject to your identity resolution.",
      "Cross-channel linking of phone number and user_id.", "Canonical customer ID; phone-to-ID mapping."],
    ["Agent permissions", "What stops the agent doing something it shouldn't?",
      "Undeclared actions are refused by the SDK; a screen can narrow what is allowed; action catalogue capped at 24 per agent (we use ~11 in-app actions; reads are server tools). Tiers: T0 read, T1 cart with read-back, T2 explicit confirm, T3 policy + confirm, T4 payment never by the agent.",
      "—", "Policy thresholds for credits and re-deliveries."],
    ["Action execution", "How do we know an action really happened?",
      "Your handler returns ok, refused (with reason) or error; the agent waits and speaks only after that. No answer within 6 seconds = reported as not done. Slow work returns immediately and reports the outcome via screen state.",
      "—", "Idempotency keys on write APIs."],
    ["Latency", "How fast is it?",
      "Graine states ~500–600 ms typical reply time. In-app voice connects in about 0.2 s when the engine is ready and under 2 s when not; for calls, Graine reported 0.8–1.5 s from answer to first words on production in October 2026.",
      "Latency on Indian 4G at 5–7 AM; p95 figures; region.", "p95 latency of your read APIs (we propose < 800 ms)."],
    ["Reliability", "What happens on a bad network?",
      "WebRTC with automatic fallback to WebSocket inside the same call; reconnection within the same session after drops; connection report per call (setup, first words, packet loss, jitter, round trip).",
      "SLA / uptime commitments; incident history.", "Availability target for read APIs during 4:30–9:30 AM."],
    ["Monitoring", "How do we see what the agent did?",
      "Call history with transcripts, execution logs, call inspector, friction timeline, every action with your app's answer; agent analytics; evals and A/B testing; goals and outcomes; exports.",
      "Access model for CD teams; log export to your SIEM.", "Who reviews the weekly quality report."],
    ["Scalability", "Can it handle the morning peak?",
      "Concurrency is a per-organisation limit on shared cloud; enterprise plans set it to your peak; a dedicated instance or your compute sets its own ceiling.",
      "Concurrency limits for the pilot and at scale.", "Peak concurrent conversations expected."],
    ["Failure handling", "What does the customer hear when something fails?",
      "Tool or API down: the agent doesn't guess, says nothing changed, raises a ticket and offers a callback. Declined confirmation: nothing changes. Ambiguity: one clarifying question. Demonstrated in the prototype with fault injection.",
      "—", "Fallback routing when Graine is unavailable (kill switch → existing IVR/Ayuh)."],
    ["Human escalation", "How do customers reach a person?",
      "Always available (“talk to a person”), after two failed attempts, on disputes, food-safety concerns, repeat incidents or distress. Hand-off carries a summary and case ID; out of hours, a callback at 6 AM.",
      "Transfer to your telephony; hand-off into your ticketing tool.", "Ticketing system and queue design."],
    ["Infrastructure & deployment", "Where does it run?",
      "Three models: Graine shared cloud (compute and call records in India-Mumbai, credential store in the US, recordings in the UK with a third-party store), a dedicated instance in a region you choose, or your compute with Graine's control plane (needs outbound TCP/443). Air-gapped is not offered.",
      "Cost and timeline per model; recording-off option for the pilot.", "Residency requirement; cloud provider."],
    ["Analytics", "How will we measure the pilot?",
      "Graine outcomes and webhooks (transcript, summary, collected fields, outcome) into your BI; we define containment, repeat contact, time to resolution, retention after incident vs a control group.",
      "Webhook payload and signing.", "Baseline data and BI owner."],
    ["Operational responsibilities", "Who does what after launch?",
      "CD: policies, APIs, app releases, consent, customer communication. Graine: agent design and tuning, platform operations, evals, monitoring, weekly quality report. Joint: metrics and go/no-go.",
      "Support hours and escalation path; ops cost model.", "Named owners for product, tech, security, support ops."],
    ["Commercials", "What will it cost?",
      "Published rates: ₹6 per connected minute (all-in, per-second billing) and ₹10 per chat session up to 5 minutes, excl. GST; enterprise pricing on commitment. The illustrative model uses published rates without discount.",
      "Enterprise proposal for CD volumes; Phase 2 pricing for in-app scale.", "Volumes by channel."],
  ];
  const doc = new Document({ styles, numbering, creator: "Graine AI", title: "CTO Discussion Guide — Graine AI × Country Delight",
    sections: [{ properties: { page: { size: { orientation: PageOrientation.LANDSCAPE }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } }, footers: { default: footer("CTO discussion guide") }, children: [
      ...cover("CTO Discussion Guide", "Anticipated technical questions, what we can answer today, and what each side must confirm", "Prepared by Graine AI · November 2026 · Sources: Graine documentation (graine.ai/docs), Graine pricing page, Country Delight public FAQ, prototype"),
      H1("How to use this guide"),
      ...UL(["Answer from the **‘What we know’** column only. If a question goes beyond it, say so and take it as an action.",
        "The **Graine to confirm** column lists items where our documentation and recent product releases differ, or where commitments need a proposal. Confirm these internally before the meeting.",
        "The **CD to confirm** column becomes the discovery agenda."]),
      H1("Questions and answers"),
      TABLE(["Topic · question", "What we know (Graine documentation / prototype)", "Graine to confirm", "Country Delight to confirm"],
        Q.map(([t, q, a, g, c]) => [`**${t}**\n${q}`, a, g, c]), [2600, 6400, 2900, 2600]),
      H1("Do not say"),
      ...UL(["That any Country Delight integration exists today (none does).", "Specific endpoint names as if they were Country Delight's (the earlier brief's examples were illustrative).",
        "That photos of damaged products are verified automatically (proposed integration only).", "Deflection or cost-reduction percentages before a baseline.", "That data stays in India on shared cloud (recordings are stored in the UK)."]),
    ] }] });
  return Packer.toBuffer(doc).then((b) => fs.writeFileSync(path.join(OUTDIR, "CTO_Discussion_Guide.docx"), b));
}

Promise.all([pitch(), cto()]).then(() => console.log("written")).catch((e) => { console.error(e); process.exit(1); });
