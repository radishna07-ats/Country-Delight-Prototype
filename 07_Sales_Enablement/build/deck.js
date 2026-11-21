// Builds 07_Sales_Enablement/CountryDelight_Sales_Deck.pptx
// Usage (from this folder): npm install && node deck.js
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");
// applyTheme writes THEME's colours into the theme part (pptxgenjs cannot). Source: the pptx skill's apply_theme.js.
let applyTheme = async () => console.warn("apply_theme.js not found: theme colours fall back to Office defaults");
try { ({ applyTheme } = require(process.env.PPTX_SKILL_DIR ? path.join(process.env.PPTX_SKILL_DIR, "scripts/apply_theme.js") : "./apply_theme.js")); } catch { /* optional */ }

const ROOT = path.resolve(__dirname, "../..");
const SHOT = (f) => path.join(ROOT, "06_Prototype/screenshots", f);
const APP = (f) => path.join(ROOT, "01_Research_and_Discovery/screens", f);
const OUT = path.join(ROOT, "07_Sales_Enablement/CountryDelight_Sales_Deck.pptx");

const THEME = {
  name: "Country Delight x Graine",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1D2A22", lt1: "FFFFFF", dk2: "1F4D2B", lt2: "EEF6EA",
    accent1: "2FA84F", accent2: "1E7B34", accent3: "F4D35E", accent4: "5552E0", accent5: "C2410C", accent6: "5E6E63",
    hlink: "1E7B34", folHlink: "5552E0",
  },
};
const HEX = THEME.colors;

async function icon(Comp, color, size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: `#${color}`, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
  pres.author = "Graine AI";
  pres.company = "Graine AI";
  pres.title = "Graine AI x Country Delight — proposal";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const W = 13.333;

  const FOOT = "Graine AI × Country Delight  ·  Independent proposal for discussion  ·  Figures illustrative unless marked";
  // ---------------------------------------------------------------- layouts
  pres.defineSlideMaster({
    title: "COVER", background: { color: HEX.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.7, y: 1.1, w: 7.2, h: 0.4, fontSize: 13, bold: true, color: C.accent3, charSpacing: 3, align: "left" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 1.6, w: 7.4, h: 2.3, fontSize: 42, bold: true, color: C.background1, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "body", type: "body", x: 0.7, y: 4.0, w: 7.2, h: 1.2, fontSize: 18, color: C.background2, valign: "top", align: "left" }, text: "" } },
      { placeholder: { options: { name: "meta", type: "body", x: 0.7, y: 6.1, w: 7.4, h: 0.8, fontSize: 12, color: C.background2, valign: "top", align: "left" }, text: "" } },
    ],
  });
  pres.defineSlideMaster({
    title: "SECTION", background: { color: HEX.dk2 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.8, y: 2.5, w: 11, h: 0.5, fontSize: 14, bold: true, color: C.accent3, charSpacing: 3, align: "left" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 3.0, w: 11.5, h: 1.4, fontSize: 40, bold: true, color: C.background1, valign: "top", align: "left" }, text: "" } },
      { text: { text: FOOT, options: { x: 0.8, y: 6.95, w: 10, h: 0.3, fontSize: 10, color: C.background2 } } },
    ],
    slideNumber: { x: 12.3, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: C.background2 },
  });
  pres.defineSlideMaster({
    title: "CONTENT", background: { color: HEX.lt1 },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.6, y: 0.3, w: 12.1, h: 0.35, fontSize: 12, bold: true, color: C.accent2, charSpacing: 2, align: "left" }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.62, w: 12.1, h: 0.95, fontSize: 28, bold: true, color: C.text2, valign: "top", align: "left" }, text: "" } },
      { text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 10.5, h: 0.3, fontSize: 10, color: C.accent6 } } },
    ],
    slideNumber: { x: 12.3, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent6 },
  });

  const IC = {
    wallet: await icon(Fa.FaWallet, HEX.dk2), truck: await icon(Fa.FaTruck, HEX.dk2), sync: await icon(Fa.FaSyncAlt, HEX.dk2), bull: await icon(Fa.FaBullhorn, HEX.dk2),
    leaf: await icon(Fa.FaLeaf, HEX.dk2), shield: await icon(Fa.FaShieldAlt, HEX.dk2), users: await icon(Fa.FaUserFriends, HEX.dk2), check: await icon(Fa.FaCheckCircle, HEX.dk2),
    eye: await icon(Fa.FaRegEye, HEX.dk2), handshake: await icon(Fa.FaHandshake, HEX.dk2), mic: await icon(Fa.FaMicrophone, HEX.dk2), video: await icon(Fa.FaMobileAlt, HEX.dk2),
    star: await icon(Fa.FaStar, HEX.dk2), comments: await icon(Fa.FaComments, HEX.dk2), search: await icon(Fa.FaSearch, HEX.dk2), flask: await icon(Fa.FaFlask, HEX.dk2),
    clock: await icon(Fa.FaClock, HEX.dk2), robot: await icon(Fa.FaRobot, HEX.dk2), chart: await icon(Fa.FaChartLine, HEX.dk2), plug: await icon(Fa.FaPlug, HEX.dk2),
  };
  const circleIcon = (s, data, x, y, d = 0.62, name = "icon") => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: C.background2 }, line: { type: "none" }, objectName: `${name}-circle` });
    s.addImage({ data, x: x + d * 0.24, y: y + d * 0.24, w: d * 0.52, h: d * 0.52, objectName: name });
  };
  const card = (s, x, y, w, h, name, fill = C.background2) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { type: "none" }, objectName: name });
  const txt = (s, text, o) => s.addText(text, { isTextBox: true, fontSize: 14, color: C.text1, valign: "top", margin: 0, ...o });
  const phone = (s, file, x, y, h, name) => s.addImage({ path: SHOT(file), x, y, h, w: h * (780 / 1690), objectName: name, altText: name });
  const appShot = (s, file, x, y, h, name) => s.addImage({ path: APP(file), x, y, h, w: h * (480 / 1017), objectName: name, altText: name,
    shadow: { type: "outer", color: "000000", opacity: 0.18, blur: 6, offset: 2, angle: 90 } });
  const pill = (s, text, x, y, w, color = C.accent2, name = "pill") => s.addText(text, { isTextBox: true, x, y, w, h: 0.32, fontSize: 11, bold: true, color: C.background1, align: "center", valign: "middle",
    shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.16, fill: { color }, margin: 0, objectName: name });
  const content = (section, kicker, title) => { const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section }); s.addText(kicker, { placeholder: "kicker" }); s.addText(title, { placeholder: "title" }); return s; };
  const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6, ...o } }));
  const chartBase = { catAxisLabelColor: HEX.accent6, valAxisLabelColor: HEX.accent6, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt",
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 11, dataLabelFontSize: 11, dataLabelColor: HEX.dk1, valGridLine: { color: "E3E8E4", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, titleFontSize: 13, titleColor: HEX.dk2 };

  // ================================================================= 1 Cover
  pres.addSection({ title: "Opening" });
  let s = pres.addSlide({ masterName: "COVER", sectionTitle: "Opening" });
  s.addText("GRAINE AI × COUNTRY DELIGHT", { placeholder: "kicker" });
  s.addText("Making every Country Delight morning effortless", { placeholder: "title" });
  s.addText("An evidence-based proposal for an AI assistance layer across the app, WhatsApp and voice — with a working prototype", { placeholder: "body" });
  s.addText("Prepared for Country Delight technology and leadership  ·  November 2026\nIndependent proposal by Graine AI · not reviewed or endorsed by Country Delight · figures illustrative", { placeholder: "meta" });
  phone(s, "01_home_with_dock.png", 8.9, 0.55, 6.4, "cover-phone");
  s.addNotes("Open with intent, not technology: we have spent time inside your app and with your customers' own words, and we built what we think the next version of the experience could feel like. Everything you'll see is grounded in public evidence; any number about your business is illustrative until you give us yours.");

  // ================================================================= 2 Executive summary
  s = content("Opening", "EXECUTIVE SUMMARY", "We studied your app and customers, built the experience, and propose a pilot");
  const exec = [
    [IC.star, "Customers love the product and the morning ritual", "They leave over what happens after the order: unexplained money movements, a bad morning with no one to talk to, and changes that feel risky."],
    [IC.comments, "A grounded assistance layer — in-app, WhatsApp, voice", "It explains from your systems, acts only through declared actions with confirmation, and hands off to people. Ayuh stays."],
    [IC.video, "A working prototype of all six use cases", "Wallet, delivery issues, in-app agent, offers, conversational subscriptions and a wellness journey — with every guardrail visible."],
    [IC.flask, "A pilot that needs no app release", "Wallet and delivery help on WhatsApp and out-of-hours voice in one city, measured against a control group."],
  ];
  exec.forEach(([ic, h, b], i) => {
    const y = 1.85 + i * 1.22;
    circleIcon(s, ic, 0.7, y, 0.7, `exec-icon-${i}`);
    txt(s, h, { x: 1.65, y: y - 0.02, w: 6.6, h: 0.38, fontSize: 17, bold: true, color: C.text2, objectName: `exec-h-${i}` });
    txt(s, b, { x: 1.65, y: y + 0.38, w: 6.6, h: 0.72, fontSize: 14, objectName: `exec-b-${i}` });
  });
  card(s, 8.75, 1.85, 4.0, 4.75, "exec-stat-card", C.text2);
  txt(s, "66–78%", { x: 9.05, y: 2.15, w: 3.5, h: 1.0, fontSize: 54, bold: true, color: C.accent3, fontFace: THEME.headFontFace, objectName: "exec-stat" });
  txt(s, "of coded negative reviews mention a post-order workflow an agent can help with: wallet, delivery, support, subscription changes, offers.", { x: 9.05, y: 3.25, w: 3.45, h: 1.6, fontSize: 15, color: C.background1, objectName: "exec-stat-label" });
  txt(s, "Play Store and App Store, Jul–Nov 2026; 633 negative reviews read and coded (≈88% coding precision).", { x: 9.05, y: 5.4, w: 3.45, h: 0.9, fontSize: 11, color: C.background2, objectName: "exec-stat-src" });
  s.addNotes("Four messages. One: the product is loved — protect it. Two: the agent layer explains, acts with confirmation, and hands off; it complements Ayuh. Three: we built it, and we'll show it live. Four: start small — wallet and delivery help on WhatsApp and voice, no app release, one city, with a control group. The 66–78% figure is our own coding of public reviews; it tells us what dissatisfied customers talk about, not how many customers are affected — your contact data will size it.");

  // ================================================================= 3 Evidence base
  s = content("Opening", "HOW WE WORKED", "Every claim in this deck traces to evidence we can show you");
  const stats = [["7 min", "screen recording of the app (v10.9.100), 31 screens audited frame by frame"], ["2,150", "public reviews collected from Google Play and the App Store, Jul–Nov 2026"],
    ["633", "negative reviews read in full and coded into 13 themes, validated by hand"], ["79", "evidence entries, each classified Verified · Observed · Hypothesis · Proposed"]];
  stats.forEach(([n, l], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.95, 2.85, 3.1, `evidence-card-${i}`);
    txt(s, n, { x: x + 0.25, y: 2.2, w: 2.4, h: 1.0, fontSize: 48, bold: true, color: C.accent2, fontFace: THEME.headFontFace, objectName: `evidence-n-${i}` });
    txt(s, l, { x: x + 0.25, y: 3.3, w: 2.4, h: 1.5, fontSize: 14, objectName: `evidence-l-${i}` });
  });
  circleIcon(s, IC.shield, 0.6, 5.45, 0.62, "evidence-rule-icon");
  txt(s, "No Country Delight internal data was used. Where a fact was not available, we say so — and we list the five data points that would sharpen the business case.", { x: 1.45, y: 5.5, w: 11.2, h: 0.8, fontSize: 15, color: C.text2, objectName: "evidence-rule" });
  s.addNotes("Credibility slide. We watched the full recording of your app, collected 2,150 public reviews and read every negative one, read your public FAQ and policies, and read Graine's own documentation so we promise only what exists. Everything is classified in an evidence register — happy to share it.");

  // ================================================================= 4 Section
  pres.addSection({ title: "What we learned" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "What we learned" });
  s.addText("01  ·  WHAT WE LEARNED", { placeholder: "kicker" });
  s.addText("Your customers, in their own words", { placeholder: "title" });
  s.addNotes("Transition: first, what customers value; then where it breaks.");

  // ================================================================= 5 Loved
  s = content("What we learned", "WHAT TO PRESERVE", "Customers love the product and the morning — protect both");
  s.addChart(pres.charts.BAR, [{ name: "Share of substantive 4–5★ reviews", labels: ["Quality & taste", "Product range", "Reliable early delivery", "Value, VIP & offers", "Subscription & vacation control", "Helpful support"], values: [55.4, 52.0, 38.3, 36.2, 16.1, 15.1] }],
    { x: 0.6, y: 1.8, w: 7.4, h: 4.9, barDir: "bar", chartColors: [HEX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0"%"', valAxisHidden: true, catAxisOrientation: "maxMin",
      showTitle: true, title: "What 4–5★ reviewers praise (Google Play, n = 298)", ...chartBase, objectName: "loved-chart" });
  card(s, 8.4, 1.85, 4.3, 2.3, "loved-quote-card");
  txt(s, "“one of the best apps I have been using — on time delivery and good packing and quality products”", { x: 8.65, y: 2.05, w: 3.85, h: 1.4, fontSize: 16, italic: true, color: C.text2, objectName: "loved-quote" });
  txt(s, "Google Play · 29 Oct 2026 · 5★", { x: 8.65, y: 3.65, w: 3.85, h: 0.3, fontSize: 11, color: C.accent6, objectName: "loved-quote-src" });
  txt(s, [{ text: "Design implications", options: { bold: true, breakLine: true, color: C.text2 } }, ...bullets(["Keep the existing screens fully usable", "No pre-dawn calls; the morning is sacred", "Explain VIP and offers, never push them"])],
    { x: 8.4, y: 4.45, w: 4.3, h: 2.2, fontSize: 14, objectName: "loved-implications" });
  s.addNotes("This is what we must not break. Quality, range, and the 5–7:30 AM delivery dominate positive reviews; 16% explicitly praise how easy pausing and vacation are. So the agent is optional, docked, and quiet — it adds a way, it doesn't replace one.");

  // ================================================================= 6 Breaks
  s = content("What we learned", "WHERE IT BREAKS", "Unhappy customers mostly talk about what happens after the order");
  s.addChart(pres.charts.BAR, [{ name: "Share of 1–2★ reviews", labels: ["Product quality, freshness, damage", "Support access & resolution", "Wallet deductions & refunds", "Price & pack size", "Subscription, vacation & schedule", "VIP pressure & benefit caps", "Delivery reliability*", "App usability & login", "Offers, cashback & referral", "Recharge & Autopay"], values: [26.2, 18.1, 16.7, 15.0, 13.3, 11.2, 10.2, 10.2, 9.0, 8.3] }],
    { x: 0.6, y: 1.8, w: 7.8, h: 4.95, barDir: "bar", chartColors: [HEX.accent2], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: '0.0"%"', valAxisHidden: true, catAxisOrientation: "maxMin",
      showTitle: true, title: "Themes in 1–2★ reviews (Google Play, n = 480; a review can carry several)", ...chartBase, catAxisLabelFontSize: 11, objectName: "breaks-chart" });
  card(s, 8.8, 1.85, 3.95, 2.45, "breaks-callout", C.text2);
  txt(s, "66–78%", { x: 9.05, y: 2.0, w: 3.5, h: 0.9, fontSize: 44, bold: true, color: C.accent3, fontFace: THEME.headFontFace, objectName: "breaks-stat" });
  txt(s, "of coded negatives mention at least one post-order workflow (Play / App Store)", { x: 9.05, y: 2.95, w: 3.5, h: 1.2, fontSize: 14, color: C.background1, objectName: "breaks-stat-label" });
  txt(s, [{ text: "Quality is the largest single theme. ", options: { bold: true } }, { text: "An agent cannot fix the product — it can make resolving a bad item faster and fairer." }],
    { x: 8.8, y: 4.55, w: 3.95, h: 1.1, fontSize: 14, objectName: "breaks-quality" });
  txt(s, "* Likely understated (recall gaps found in validation). Reviews show what complainants talk about, not prevalence — your contact-reason data will size each theme.", { x: 8.8, y: 5.75, w: 3.95, h: 1.0, fontSize: 11, color: C.accent6, objectName: "breaks-note" });
  s.addNotes("Recent written reviews are far more negative than your star average — complainants write. The pattern is clear though: after quality, it's support access, wallet clarity, price, and subscription control. Two-thirds or more of negative reviews touch a workflow an agent can help with. Be explicit that quality isn't something we fix.");

  // ================================================================= 7 Observed in app
  s = content("What we learned", "WHAT WE OBSERVED IN THE APP", "The pieces already exist — they are just several taps apart");
  const frames = [["132s_wallet_transaction_history.jpg", "Ledger says “Paid for Order −₹49” — not what it paid for"], ["112s_subscription_edit_pause_remove.jpg", "Pause, Remove and Vacation sit below the fold of a product page"],
    ["236s_ayuh_ticket_or_agent.jpg", "Ayuh's deepest branch opens the phone dialer (6 am – 9 pm)"], ["421s_pick_your_health_goal.jpg", "Health goals exist as shelves — a base for personalisation"]];
  frames.forEach(([f, cap], i) => {
    const x = 0.75 + i * 3.15;
    appShot(s, f, x + 0.2, 1.7, 4.0, `app-frame-${i}`);
    txt(s, cap, { x, y: 5.8, w: 2.8, h: 0.9, fontSize: 13, color: C.text2, objectName: `app-caption-${i}` });
  });
  s.addNotes("These are frames from the recording of your live app, version 10.9.100. The ledger has the data but not the why. Subscription control is complete but scattered. Ayuh routes — its deepest answer is a phone number. And you already merchandise by health goal, which UC6 builds on.");

  // ================================================================= 8 Friction map
  s = content("What we learned", "FRICTION → OPPORTUNITY", "Four friction clusters map to clear, measurable interventions");
  const H = { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 };
  const rows = [
    [{ text: "Friction cluster", options: H }, { text: "Evidence", options: H }, { text: "Likely cause (hypothesis)", options: H }, { text: "Intervention", options: H }],
    ["Money moves faster than understanding", "Wallet & deductions in 17–28% of negatives; ledger lacks the ‘why’", "Four money mechanics on different clocks: charge after delivery, Autopay +25 h, split cashback, VIP benefit cap", "UC1 explain from the ledger · A1 opt-in balance reminder"],
    ["An hour with no one to talk to", "Deliveries 5:00–7:30 AM; support from 6 AM; “marked delivered” complaints", "Self-help ends in a ticket or a phone call", "UC2 24×7 status, proof of delivery, policy-bound remedy, case ID"],
    ["Control without confidence", "Subscription & vacation in 13–16% of negatives; also praised", "Changes spread over three surfaces; offer and price consequences not previewed", "UC3/UC5 change card with confirm & undo · A2 pause-instead-of-cancel"],
    ["Outreach already feels like too much", "Repeated promotional calls cited in reviews", "No visible frequency control", "UC4 consent-first, frequency-capped, instant opt-out"],
  ];
  s.addTable(rows, { x: 0.6, y: 1.8, w: 12.1, colW: [2.6, 3.0, 3.6, 2.9], fontSize: 13, color: C.text1, border: { type: "solid", pt: 0.75, color: "D5DED8" }, fill: { color: C.background1 },
    valign: "middle", rowH: [0.5, 1.0, 1.0, 1.0, 0.9], margin: 0.08, objectName: "friction-table" });
  s.addNotes("Read left to right: what customers feel, what we saw, our hypothesis on why, and what we'd do. Note we call the causes hypotheses — your data confirms them.");

  // ================================================================= 9 What changed
  s = content("What we learned", "WHAT THE DATA CHANGED", "The evidence changed parts of our own earlier brief");
  const changes = [["Earlier: customers ‘rarely complain about quality’", "Data: quality is the largest single complaint theme. We position the agent as faster, fairer resolution — not a quality fix."],
    ["Earlier: 4:30 AM automated voice calls for stockouts", "Customers already object to 5 AM bells and calls, and early commercial calls carry regulatory risk. We propose opt-in WhatsApp or push — never pre-dawn voice."],
    ["Earlier: 60–75% deflection and −40% cost targets", "Replaced with pilot measurements against a baseline and a control group. Targets are agreed after two weeks of baseline data."]];
  changes.forEach(([a, b], i) => {
    const y = 1.85 + i * 1.62;
    card(s, 0.6, y, 5.2, 1.4, `change-before-${i}`, "F3F3F1");
    txt(s, a, { x: 0.85, y: y + 0.25, w: 4.7, h: 0.95, fontSize: 16, color: C.accent6, objectName: `change-before-text-${i}` });
    s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.0, y: y + 0.5, w: 0.6, h: 0.4, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `change-arrow-${i}` });
    card(s, 6.8, y, 5.9, 1.4, `change-after-${i}`);
    txt(s, b, { x: 7.05, y: y + 0.2, w: 5.45, h: 1.05, fontSize: 14, color: C.text2, objectName: `change-after-text-${i}` });
  });
  s.addNotes("We're showing you this deliberately. Our first brief made claims we could not back up when we did the full analysis. We'd rather correct ourselves here than have you discover it in a pilot.");

  // ================================================================= 10 Section
  pres.addSection({ title: "The proposed experience" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "The proposed experience" });
  s.addText("02  ·  THE PROPOSED EXPERIENCE", { placeholder: "kicker" });
  s.addText("Say it, see it, confirm it — with your rules on every answer", { placeholder: "title" });
  s.addNotes("Transition into the experience. Offer the live demo here or after the use-case slides.");

  // ================================================================= 11 Principles
  s = content("The proposed experience", "DESIGN PRINCIPLES", "Optional, grounded, and always confirms before it changes anything");
  const pr = [[IC.eye, "Optional, never intrusive", "Docked and quiet. Speaks up only when the customer is stuck (max 3 nudges per session)."], [IC.plug, "Grounded in your systems", "Answers money, order and subscription questions only from your data and approved policy."],
    [IC.check, "Confirm before any change", "Change cards show now → new, date and price impact, with Undo. The agent never pays."], [IC.users, "A person is always one step away", "Hand-off carries a summary, so customers never repeat themselves."],
    [IC.bull, "Respectful outreach", "Consent, frequency caps and instant opt-out; offers only from approved records."], [IC.handshake, "Works with Ayuh", "Ayuh's tree stays. Its ‘Something else’ opens the assistant with context."]];
  pr.forEach(([ic, h, b], i) => {
    const col = i % 3, row = Math.floor(i / 3); const x = 0.6 + col * 4.1, y = 1.9 + row * 2.45;
    card(s, x, y, 3.85, 2.2, `principle-card-${i}`);
    circleIcon(s, ic, x + 0.25, y + 0.25, 0.6, `principle-icon-${i}`);
    txt(s, h, { x: x + 1.0, y: y + 0.3, w: 2.65, h: 0.6, fontSize: 16, bold: true, color: C.text2, objectName: `principle-h-${i}` });
    txt(s, b, { x: x + 0.25, y: y + 1.0, w: 3.4, h: 1.05, fontSize: 14, objectName: `principle-b-${i}` });
  });
  s.addNotes("These six principles answer most CTO and brand concerns before they are raised. Grounded and confirm-before-change are enforced by the platform: undeclared actions are refused, handlers return ok/refused/error, and a handler that takes more than six seconds is reported as not done.");

  // ================================================================= 12 Current vs enhanced
  s = content("The proposed experience", "CURRENT VS ENHANCED", "Same tasks, fewer steps, more certainty");
  const H2 = { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 };
  s.addTable([
    [{ text: "Customer task", options: H2 }, { text: "Today (observed)", options: H2 }, { text: "With the assistant", options: H2 }],
    ["Pause deliveries next week", "Menu → Set Vacation → pick start → pick end → Confirm (≈5 taps)", "“Pause my deliveries next week” → dates checked against cut-off and 60-day rule → Confirm"],
    ["Understand a ₹500 deduction", "Transactions → no link to cause → Ayuh tree → ticket or call (7+ taps)", "One question → answer from the ledger: Autopay top-up after balance fell below ₹200"],
    ["Milk missing at 5:40 AM", "Ticket, or call after 6 AM; resolution in 24–48 h", "Status and proof of delivery → policy-approved remedy → case ID in about two minutes"],
    ["One more packet daily", "My Subscriptions → Edit → stepper → Confirm; no price or offer preview", "Change card: 1 → 2 from Sunday, +₹36 per delivery, offer impact shown, Undo"],
    ["Protein products, nut allergy", "Browse health-goal shelves; no allergy filter", "Consented profile → catalogue-grounded picks that exclude allergens, with a safety note"],
  ], { x: 0.6, y: 1.8, w: 12.1, colW: [2.7, 4.5, 4.9], fontSize: 13, color: C.text1, border: { type: "solid", pt: 0.75, color: "D5DED8" }, valign: "middle", rowH: [0.48, 0.9, 0.9, 0.9, 0.9, 0.9], margin: 0.08, objectName: "compare-table" });
  s.addNotes("Every 'today' column is from the recording; every 'with the assistant' column is running in the prototype.");

  // ================================================================= 13–18 Use cases
  const ucSlide = (kicker, title, shots, blocks, status, channels, notes) => {
    const sl = content("The proposed experience", kicker, title);
    let x = 0.6;
    shots.forEach((f, i) => { phone(sl, f, x, 1.65, 5.2, `uc-phone-${i}`); x += 2.55; });
    const tx = 0.6 + shots.length * 2.55 + 0.25; const tw = 12.7 - tx;
    pill(sl, status, tx, 1.75, 1.6, status.startsWith("Pilot") ? C.accent2 : status.startsWith("Phase 2") ? C.accent4 : C.accent6, "uc-status");
    txt(sl, channels, { x: tx + 1.75, y: 1.78, w: tw - 1.75, h: 0.3, fontSize: 12, color: C.accent6, objectName: "uc-channels" });
    let y = 2.3;
    blocks.forEach(([h, items], i) => {
      txt(sl, h, { x: tx, y, w: tw, h: 0.32, fontSize: 15, bold: true, color: C.text2, objectName: `uc-h-${i}` });
      const lines = items.reduce((n, t) => n + Math.ceil((t.length * 0.088) / (tw - 0.35)), 0);
      const hh = lines * 0.25 + items.length * 0.08;
      txt(sl, bullets(items), { x: tx, y: y + 0.36, w: tw, h: hh, fontSize: 14, objectName: `uc-b-${i}` });
      y += 0.4 + hh + 0.1;
    });
    sl.addNotes(notes);
  };
  ucSlide("USE CASE 1 · WALLET & SMART RECHARGE", "Every deduction explained from the ledger", ["05_uc1_wallet_explainer.png"],
    [["What the customer gets", ["“Why was ₹500 deducted?” answered from ledger rows and published rules", "Balance with runway in days, Smart Recharge options, refund request", "Unknown amounts are never guessed — the agent says so"]],
     ["Guardrails", ["Never asks for OTP, UPI PIN or bank details; never pays", "Refund to bank via your existing secure SMS link"]],
     ["Country Delight provides", ["Ledger API with order / plan references, plan and refund APIs"]],
     ["Measure", ["Wallet-intent containment, repeat contacts, disputes, CSAT"]]],
    "Pilot", "In-app · WhatsApp · Voice",
    "Demo scenario 4. The ₹500 is not a wallet charge at all — it is a UPI Autopay top-up from the bank after the balance fell below ₹200. That's exactly the confusion in the reviews. Ask the CTO whether the ledger API carries order and plan references.");
  ucSlide("USE CASE 2 · DELIVERY ISSUE RESOLUTION", "A 5:40 AM problem solved before support opens", ["06_uc2_resolution_options.png", "08_uc2_whatsapp_hinglish.png"],
    [["Flow", ["Verify → status and proof of delivery → ask the customer to check → only policy-approved remedies → case ID", "Hinglish in, Hinglish out; same tools on app, WhatsApp and voice"]],
     ["Guardrails", ["No invented status; repeat incidents and food-safety concerns go to a person", "Photo evidence is a proposed integration, not a current capability"]],
     ["Measure", ["First-contact resolution, time to resolution, 30-day retention after an incident vs control"]]],
    "Pilot", "WhatsApp · Voice · In-app",
    "Demo scenarios 5, 5w, 5c. Point out the remedies come from a policy service — the model never decides money. Then the A3 add-on: offer 'call before delivery' after a doorstep complaint, using a preference you already have.");
  ucSlide("USE CASE 3 · IN-APP CONVERSATIONAL AGENT", "Ask in plain words, see it on screen, confirm", ["02_uc3_add_to_cart.png", "04_uc3_voice_vacation.png"],
    [["What it does", ["Understands, clarifies (“cow or buffalo?”), shows product cards, adds after the tap", "Voice for intent, screen for confirmation: vacations checked against the 11 pm cut-off and 60-day rule", "Navigates (“where is tomorrow's order?”) and helps only when friction is detected"]],
     ["How it works", ["Graine SDK: screen context + declared action handlers in your app", "Cart is not checkout; the customer always pays"]]],
    "Phase 2", "In-app voice and chat",
    "Demo scenarios 1 and 3. Open the inspector: every intent, tool, rule check and confirmation is visible — evidence the agent only acts through declared actions.");
  ucSlide("USE CASE 5 · CONVERSATIONAL SUBSCRIPTIONS", "Subscriptions changed in one card, not three screens", ["03_uc5_subscription_card.png", "15_my_subscriptions.png"],
    [["The card", ["Now → new quantity or frequency, effective date, per-delivery and monthly price", "Offer impact shown before the change (e.g. 4 pe 4 voids on frequency change)", "Confirm, then Undo for two minutes; My Subscriptions updates instantly"]],
     ["Save flow (A2)", ["“Stop my curd” → why? → pause, vacation or less often → remove only if still wanted"]],
     ["Built with", ["Graine web components with live content from your subscription API"]]],
    "Phase 2", "In-app",
    "This is the whiteboard idea: change subscriptions inside the conversation using components, without screen hopping. The save flow addresses the observed gap: removing a subscription today has no reason capture and no alternative offered.");
  ucSlide("USE CASE 4 · OFFER & PROMOTION OUTREACH", "Offers that respect consent, caps and opt-outs", ["12_uc4_push.png", "13_uc4_offer_in_app.png"],
    [["Eligibility, per channel", ["Eligible ∩ consented ∩ not on do-not-call ∩ under frequency cap", "Voice only with consent, 10 am – 7 pm; in-app and opted-in WhatsApp first"]],
     ["Content", ["AI disclosed; offer facts only from the approved offer record", "No promotional content in service conversations"]],
     ["Measure", ["Incremental redemption vs holdout, opt-out and complaint rates"]]],
    "Phase 3", "In-app · WhatsApp · Voice (consented)",
    "Demo scenario 7: with voice consent off, the voice channel is skipped and logged. Reviews already complain about repeated promo calls — this use case only works if it is governed tightly.");
  ucSlide("USE CASE 6 · WELLNESS JOURNEY", "Goal-based picks that never ignore an allergy", ["10_uc6_wellness_recs.png", "11_uc6_wellness_screen.png"],
    [["Journey", ["Consent → goal → diet → allergies → catalogue-grounded suggestions with a reason each", "A morning bundle and one-tap subscribe via the UC5 card"]],
     ["Safeguards", ["Allergens always exclude; no medical advice; conditions → a qualified professional", "Profile deletable anytime; no invented nutrition values"]],
     ["Dependency", ["Verified nutrition and allergen attributes per SKU"]]],
    "Phase 3", "In-app (new section)",
    "Demo scenario 6: choose Peanuts and peanut butter disappears, with an explanation. This extends your existing 'Pick Your Health Goal' shelves. The safety pattern mirrors a health-onboarding agent Graine has built before.");

  // ================================================================= 19 Ayuh + additional
  s = content("The proposed experience", "AYUH & MORE OPPORTUNITIES", "Ayuh stays — plus seven more opportunities we found");
  phone(s, "14_ayuh_handoff.png", 0.6, 1.65, 5.2, "ayuh-phone");
  const H3 = { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 };
  s.addTable([
    [{ text: "Opportunity", options: H3 }, { text: "Verdict", options: H3 }, { text: "Why", options: H3 }],
    ["A1 Balance runway reminder (opt-in)", "Pilot add-on", "Prevents delivery holds; read-only"],
    ["A2 Pause-instead-of-cancel save flow", "With UC5", "No save step at removal today"],
    ["A3 Doorstep preference assistant", "With UC2", "Preferences exist but are buried"],
    ["A4 Exception & price-change alerts", "Phase 2", "Event feeds; WhatsApp/push only"],
    ["A5 Structured quality feedback", "Phase 2", "Routes data to your quality team"],
    ["A6 Lapsed-subscriber win-back", "Phase 3", "Same governance as UC4"],
    ["A7 Product education (test reports)", "Easy add-on", "Knowledge base only"],
  ], { x: 3.45, y: 1.75, w: 9.25, colW: [3.9, 1.75, 3.6], fontSize: 13, color: C.text1, border: { type: "solid", pt: 0.75, color: "D5DED8" }, valign: "middle", rowH: 0.56, margin: 0.08, objectName: "additional-table" });
  s.addNotes("Left: Ayuh unchanged, with a proposed hand-off to the assistant carrying Ayuh's path as context. Right: opportunities we found ourselves; scoring is in the prioritisation workbook.");

  // ================================================================= 20 Section
  pres.addSection({ title: "How it works" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "How it works" });
  s.addText("03  ·  HOW IT WORKS", { placeholder: "kicker" });
  s.addText("Architecture, security and what each side builds", { placeholder: "title" });
  s.addNotes("For the CTO: architecture, authority model, feasibility.");

  // ================================================================= 21 Architecture
  s = content("How it works", "ARCHITECTURE", "Graine sits beside your systems; they stay the source of truth");
  const tagColor = { V: HEX.accent1, P: HEX.accent4, API: HEX.accent5, CC: HEX.accent6 };
  const box = (x, y, w, h, label, tag, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background1 }, line: { color: "C9D6CC", width: 1 }, objectName: name });
    txt(s, label, { x: x + 0.12, y: y + 0.06, w: w - 0.85, h: h - 0.1, fontSize: 12, color: C.text1, valign: "middle", objectName: `${name}-label` });
    s.addText(tag, { isTextBox: true, x: x + w - 0.7, y: y + (h - 0.26) / 2, w: 0.6, h: 0.26, fontSize: 9, bold: true, color: C.background1, align: "center", valign: "middle", shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, fill: { color: tagColor[tag] }, margin: 0, objectName: `${name}-tag` });
  };
  const col = (x, title, items, name) => {
    card(s, x, 1.75, 3.9, 4.85, `${name}-panel`);
    txt(s, title, { x: x + 0.2, y: 1.85, w: 3.5, h: 0.35, fontSize: 14, bold: true, color: C.text2, objectName: `${name}-title` });
    items.forEach(([l, t], i) => box(x + 0.2, 2.3 + i * 0.53, 3.5, 0.44, l, t, `${name}-box-${i}`));
  };
  col(0.6, "Customer touchpoints", [["CD app (unchanged screens)", "CC"], ["Graine in-app SDK: voice, chat, components", "V"], ["Screen context + action handlers", "P"], ["Ayuh (existing) → hand-off", "CC"], ["WhatsApp Business", "CC"], ["Helpline / out-of-hours voice", "CC"], ["Opt-in push & WhatsApp alerts", "P"]], "arch-left");
  col(4.72, "Graine platform", [["In-app agent", "V"], ["Flow agents (identity-first)", "V"], ["API tools (server-side)", "V"], ["Components with live content", "V"], ["Workflows & campaigns", "V"], ["Memory per verified user", "V"], ["Consent, DNC, audit, evals", "V"]], "arch-mid");
  col(8.84, "Country Delight systems", [["Identity & server token", "API"], ["Catalogue & availability", "API"], ["Subscriptions & vacations", "API"], ["Wallet ledger & refunds", "API"], ["Orders, delivery & proof", "API"], ["Resolution policy service", "P"], ["Ticketing · CRM · offers", "API"]], "arch-right");
  [4.52, 8.64].forEach((x, i) => s.addShape(pres.shapes.RIGHT_ARROW, { x: x - 0.02, y: 3.95, w: 0.24, h: 0.4, fill: { color: C.accent1 }, line: { type: "none" }, objectName: `arch-arrow-${i}` }));
  const legend = [["V", "Verified Graine capability"], ["P", "Proposed design"], ["API", "Requires a CD API"], ["CC", "Requires CD confirmation"]];
  legend.forEach(([t, l], i) => {
    const x = 0.6 + i * 3.05;
    s.addText(t, { isTextBox: true, x, y: 6.68, w: 0.55, h: 0.26, fontSize: 9, bold: true, color: C.background1, align: "center", valign: "middle", shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.1, fill: { color: tagColor[t] }, margin: 0, objectName: `legend-tag-${i}` });
    txt(s, l, { x: x + 0.65, y: 6.68, w: 2.3, h: 0.28, fontSize: 11, color: C.accent6, valign: "middle", objectName: `legend-label-${i}` });
  });
  s.addNotes("Graine never becomes a system of record. Reads go through server-side API tools; changes go through your signed-in app's handlers or token-scoped server tools. Deployment options: shared cloud (compute India; recordings stored in the UK), a dedicated instance in an Indian region, or your own compute with Graine's control plane.");

  // ================================================================= 22 Security
  s = content("How it works", "SECURITY & GOVERNANCE", "The agent never has more authority than the signed-in app");
  const H4 = { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 13 };
  s.addTable([
    [{ text: "Tier", options: H4 }, { text: "Examples", options: H4 }, { text: "Control", options: H4 }],
    ["T0 Information", "Balance, status, product facts, navigation", "Answers only from tool results"],
    ["T1 Cart", "Add to cart", "Executed, then read back from the cart"],
    ["T2 Account change", "Quantity, pause, vacation, preferences", "Explicit confirm on a card · Undo"],
    ["T3 Money request", "Credit, re-delivery, refund request", "Policy service decides · explicit confirm"],
    ["T4 Payment", "Recharge, checkout", "Never by the agent — the customer pays"],
  ], { x: 0.6, y: 1.8, w: 7.3, colW: [1.9, 2.8, 2.6], fontSize: 13, color: C.text1, border: { type: "solid", pt: 0.75, color: "D5DED8" }, valign: "middle", rowH: 0.62, margin: 0.08, objectName: "tiers-table" });
  const ctl = ["Identifiers masked on the device (PAN, Aadhaar, card, phone, email)", "Verified identity: server tokens; app attestation (status to confirm)", "Declared actions only; undeclared refused; 6-second timeout reported as not done",
    "Audit of every screen, tool call and action; weekly evals", "Kill switch per intent without an app release", "DPDP: CD fiduciary, Graine processor; consent records, erase and export"];
  card(s, 8.25, 1.8, 4.45, 4.95, "controls-panel");
  circleIcon(s, IC.shield, 8.5, 2.0, 0.6, "controls-icon");
  txt(s, "Controls", { x: 9.25, y: 2.1, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: C.text2, objectName: "controls-title" });
  txt(s, bullets(ctl), { x: 8.5, y: 2.75, w: 4.0, h: 3.9, fontSize: 13, objectName: "controls-list" });
  s.addNotes("Graine's own documentation says device-supplied identity is for personalisation, not authorisation — so account actions require a verified token or the app's own session. Data residency answer: on shared cloud, recordings are stored in the UK; India-only residency means a dedicated instance or your compute.");

  // ================================================================= 23 Feasibility
  s = content("How it works", "TECHNICAL FEASIBILITY", "What each side builds, and what we confirm before the pilot");
  const cols3 = [[IC.plug, "Country Delight provides", ["Read APIs: ledger, orders & proof of delivery, subscriptions, catalogue", "Write APIs: ticket, resolution request, preferences (pilot)", "Server-token endpoint; WhatsApp Business account; helpline routing", "Canonical policies: refunds, credits, vacation, VIP"]],
    [IC.robot, "Graine provides", ["Agent and flow design, knowledge base from approved policy", "Tool definitions, components, friction rules", "Security configuration, evals, monitoring, weekly quality report", "Operations and tuning during the pilot"]],
    [IC.search, "To confirm before the pilot", ["Graine: two-way WhatsApp text agent, native chat per SDK, attestation status, enterprise pricing", "CD: API inventory, Ayuh ownership, residency requirement, nutrition data for UC6"]]];
  cols3.forEach(([ic, h, items], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.85, 3.85, 4.2, `feas-card-${i}`);
    circleIcon(s, ic, x + 0.25, 2.05, 0.6, `feas-icon-${i}`);
    txt(s, h, { x: x + 1.0, y: 2.15, w: 2.7, h: 0.45, fontSize: 16, bold: true, color: C.text2, objectName: `feas-h-${i}` });
    txt(s, bullets(items), { x: x + 0.25, y: 2.9, w: 3.4, h: 3.6, fontSize: 13, objectName: `feas-b-${i}` });
  });
  s.addNotes("Be explicit about the confirmation list — it builds trust. Phase 1 needs no mobile release; Phase 2 adds the SDK with roughly eleven action handlers on about eight screens.");

  // ================================================================= 24 Section
  pres.addSection({ title: "Value and plan" });
  s = pres.addSlide({ masterName: "SECTION", sectionTitle: "Value and plan" });
  s.addText("04  ·  VALUE AND PLAN", { placeholder: "kicker" });
  s.addText("An illustrative business case, a measurable pilot", { placeholder: "title" });
  s.addNotes("Transition to value. Stress: illustrative until we use your numbers.");

  // ================================================================= 25 Business case
  s = content("Value and plan", "ILLUSTRATIVE BUSINESS CASE", "Positive in Base, negative if adoption stays low — hence a pilot");
  s.addChart(pres.charts.BAR, [{ name: "Year-1 net benefit (₹ lakh)", labels: ["Conservative", "Base", "Aggressive"], values: [-57, 170, 853] }],
    { x: 0.6, y: 1.8, w: 6.6, h: 4.9, barDir: "col", chartColors: [HEX.accent2], invertedColors: [HEX.accent5], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0",
      valAxisHidden: true, showTitle: true, title: "Year-1 net benefit after one-time investment (₹ lakh)", ...chartBase, objectName: "case-chart" });
  const bstats = [["₹162 L", "incremental revenue per month at run-rate (Base) — 1.4% of illustrative baseline"], ["0.70×", "Year-1 ROI (Base); 1.98× Aggressive; −0.37× Conservative"], ["2.7 months", "payback on one-time investment at Year-1 realisation (Base)"]];
  bstats.forEach(([n, l], i) => {
    const y = 1.85 + i * 1.5;
    card(s, 7.6, y, 5.1, 1.3, `case-stat-${i}`);
    txt(s, n, { x: 7.85, y: y + 0.18, w: 2.0, h: 0.9, fontSize: 28, bold: true, color: C.accent2, fontFace: THEME.headFontFace, valign: "middle", objectName: `case-stat-n-${i}` });
    txt(s, l, { x: 9.9, y: y + 0.15, w: 2.65, h: 1.0, fontSize: 13, valign: "middle", objectName: `case-stat-l-${i}` });
  });
  txt(s, "All baseline inputs are illustrative (no Country Delight data). Graine costs at published rates (₹6/min, ₹10/chat), no discount. Editable model: CountryDelight_Revenue_Model.xlsx.", { x: 7.6, y: 6.35, w: 5.1, h: 0.6, fontSize: 10, color: C.accent6, objectName: "case-note" });
  s.addNotes("Show the Conservative bar on purpose: if containment and adoption stay low, year one loses money at published rates. That's the honest reason for a pilot with a control group. Offer to rebuild the model with their margin, ARPU, contact volumes and churn in discovery.");

  // ================================================================= 26 Value sources
  s = content("Value and plan", "WHERE THE VALUE COMES FROM", "Most of the value is keeping customers, not selling more");
  s.addChart(pres.charts.BAR, [{ name: "Base, ₹ lakh per month", labels: ["UC5 subscription expansion*", "UC2 service-churn retained", "A2 save flow", "Support cost avoided", "UC6 wellness cross-sell*", "UC1/A1 holds prevented", "UC4 incremental offers*", "UC3 AOV uplift*"], values: [59.4, 43.7, 43.7, 17.2, 13.2, 4.7, 3.0, 2.5] }],
    { x: 0.6, y: 1.8, w: 7.4, h: 4.9, barDir: "bar", chartColors: [HEX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.0", valAxisHidden: true, catAxisOrientation: "maxMin",
      showTitle: true, title: "Base case, monthly run-rate (₹ lakh)", ...chartBase, objectName: "value-chart" });
  card(s, 8.4, 1.85, 4.3, 2.4, "value-callout");
  txt(s, [{ text: "₹87 L of ₹162 L", options: { bold: true, fontSize: 22, color: C.accent2, breakLine: true } }, { text: "of monthly incremental revenue comes from retention: UC2 and the A2 save flow. Support savings alone don't pay for the platform." }],
    { x: 8.65, y: 2.05, w: 3.85, h: 2.1, fontSize: 14, objectName: "value-callout-text" });
  txt(s, [{ text: "Validate first (largest swings)", options: { bold: true, color: C.text2, breakLine: true } }, ...bullets(["Contribution margin and ARPU", "Containment and cost per contact", "Agent share of support contacts"])],
    { x: 8.4, y: 4.5, w: 4.3, h: 1.6, fontSize: 14, objectName: "value-validate" });
  txt(s, "* Before a 10% overlap haircut. Revenue is not profit: net benefit uses contribution margin plus avoided cost.", { x: 8.4, y: 6.2, w: 4.3, h: 0.6, fontSize: 10, color: C.accent6, objectName: "value-note" });
  s.addNotes("The insight for leadership: the money is in retention — keeping customers who love the product through a bad morning or a confusing deduction. That's why the pilot measures retention after an incident against a control group, not just deflection.");

  // ================================================================= 27 Pilot
  s = content("Value and plan", "RECOMMENDED PILOT", "Pilot: wallet and delivery help on WhatsApp and voice");
  const pil = [[IC.check, "Scope", ["UC1: balance, explain a transaction, recharge options, refund request", "UC2: status, proof of delivery, policy-bound remedies, case ID", "A1 opt-in balance reminder · A3 doorstep preferences", "Hindi, English, Hinglish + one regional language"]],
    [IC.users, "Cohort & design", ["One city hub; customers via WhatsApp entry and out-of-hours helpline", "Matched control group or time-based holdout", "≈4–6 weeks build, 8 weeks live; kill switch per intent"]],
    [IC.chart, "Why this first", ["Ranked 1 and 3 of 13 opportunities on impact × feasibility", "Read-only plus tickets: lowest-risk actions", "De-risks the back-end tools Phase 2 reuses"]]];
  pil.forEach(([ic, h, items], i) => {
    const x = 0.6 + i * 4.1;
    card(s, x, 1.85, 3.85, 4.1, `pilot-card-${i}`);
    circleIcon(s, ic, x + 0.25, 2.05, 0.6, `pilot-icon-${i}`);
    txt(s, h, { x: x + 1.0, y: 2.15, w: 2.7, h: 0.45, fontSize: 16, bold: true, color: C.text2, objectName: `pilot-h-${i}` });
    txt(s, bullets(items), { x: x + 0.25, y: 2.9, w: 3.4, h: 3.2, fontSize: 13, objectName: `pilot-b-${i}` });
  });
  txt(s, "Out of scope for the pilot: payments, promotional content, order placement, anything requiring an OTP, photo verification.", { x: 0.6, y: 6.2, w: 12.1, h: 0.4, fontSize: 12, color: C.accent6, objectName: "pilot-out" });
  s.addNotes("The ask. One city, two use cases, two channels, no app release. In-app (UC3+UC5) follows in Phase 2 once the shared back-end tools are proven.");

  // ================================================================= 28 Metrics
  s = content("Value and plan", "SUCCESS METRICS", "We will agree targets after two weeks of baseline — not before");
  const mets = [[IC.comments, "Customer", ["Resolved without a person (containment)", "Repeat contacts within 7 days", "CSAT after the conversation"]],
    [IC.handshake, "Retention", ["30-day retention after an incident, pilot vs control", "Delivery holds avoided"]],
    [IC.clock, "Operations", ["Contacts per 1,000 orders vs control", "Time to resolution", "Out-of-hours contacts handled"]],
    [IC.shield, "Safety", ["Unauthorised actions: target zero", "Incorrect statements in weekly evals", "Escalation correctness"]]];
  mets.forEach(([ic, h, items], i) => {
    const x = 0.6 + i * 3.1;
    card(s, x, 1.85, 2.85, 4.2, `metric-card-${i}`);
    circleIcon(s, ic, x + 0.25, 2.05, 0.6, `metric-icon-${i}`);
    txt(s, h, { x: x + 1.0, y: 2.18, w: 1.75, h: 0.4, fontSize: 16, bold: true, color: C.text2, objectName: `metric-h-${i}` });
    txt(s, bullets(items), { x: x + 0.25, y: 2.9, w: 2.4, h: 3.0, fontSize: 13, objectName: `metric-b-${i}` });
  });
  txt(s, "Exit: expand if safety holds and two of containment, repeat contacts and retention beat control · redesign if customer metrics improve but containment is low · stop if a control fails.", { x: 0.6, y: 6.25, w: 12.1, h: 0.6, fontSize: 13, color: C.text2, objectName: "metrics-exit" });
  s.addNotes("We deliberately don't carry forward the earlier deflection and cost targets. Baselines first.");

  // ================================================================= 29 Roadmap
  s = content("Value and plan", "IMPLEMENTATION ROADMAP", "From discovery to a measured pilot in about four months");
  const stages = [["1", "Discovery & alignment", "≈3 weeks", "Problems validated with your data · API inventory · baselines · metrics"], ["2", "Technical preparation", "≈4 weeks", "Endpoints · flow agents · knowledge base · security · WhatsApp setup · DPA"],
    ["3", "Pilot", "1 + 8 weeks", "Internal dogfood, then one city cohort with a control group"], ["4", "Measurement", "≈2 weeks", "Pilot vs control readout · go / redesign / stop"], ["5", "Expansion", "3–5 months", "In-app SDK (UC3, UC5, A2) · UC4 with consent · UC6 experiment"]];
  s.addShape(pres.shapes.LINE, { x: 1.0, y: 2.55, w: 11.3, h: 0, line: { color: "C9D6CC", width: 2 }, objectName: "roadmap-line" });
  stages.forEach(([n, h, d, b], i) => {
    const x = 0.6 + i * 2.45;
    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: 2.2, w: 0.7, h: 0.7, fill: { color: i === 2 ? C.accent2 : C.text2 }, line: { type: "none" }, objectName: `roadmap-dot-${i}` });
    txt(s, n, { x: x + 0.15, y: 2.2, w: 0.7, h: 0.7, fontSize: 18, bold: true, color: C.background1, align: "center", valign: "middle", objectName: `roadmap-n-${i}` });
    txt(s, h, { x, y: 3.15, w: 2.25, h: 0.65, fontSize: 16, bold: true, color: C.text2, objectName: `roadmap-h-${i}` });
    txt(s, d, { x, y: 3.85, w: 2.25, h: 0.35, fontSize: 13, bold: true, color: C.accent2, objectName: `roadmap-d-${i}` });
    txt(s, b, { x, y: 4.3, w: 2.2, h: 1.7, fontSize: 13, objectName: `roadmap-b-${i}` });
  });
  txt(s, "Durations are planning assumptions; they depend on API readiness and release cadence. Country Delight owns policies, APIs, releases and consent; Graine owns agent design, operations, evals and monitoring.", { x: 0.6, y: 6.2, w: 12.1, h: 0.6, fontSize: 12, color: C.accent6, objectName: "roadmap-note" });
  s.addNotes("Highlight stage 3 — the pilot — and that expansion is a decision based on measured results.");

  // ================================================================= 30 Next steps
  pres.addSection({ title: "Close" });
  s = pres.addSlide({ masterName: "COVER", sectionTitle: "Close" });
  s.addText("NEXT STEPS", { placeholder: "kicker" });
  s.addText("Let's validate this with your data", { placeholder: "title" });
  txt(s, [
    { text: "90-minute discovery with product, support operations and technology", options: { bullet: { type: "number" }, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Five data points: margin, ARPU, contact reasons and cost, churn reasons, cancellations", options: { bullet: { type: "number" }, breakLine: true, paraSpaceAfter: 6 } },
    { text: "API inventory: wallet ledger, orders and proof of delivery, tickets", options: { bullet: { type: "number" }, breakLine: true, paraSpaceAfter: 6 } },
    { text: "WhatsApp Business account and out-of-hours helpline routing", options: { bullet: { type: "number" }, breakLine: true, paraSpaceAfter: 6 } },
    { text: "Agree the pilot city, cohort and control group", options: { bullet: { type: "number" } } },
  ], { x: 0.7, y: 3.25, w: 7.4, h: 2.7, fontSize: 16, color: C.background1, objectName: "next-steps-list" });
  s.addText("graine.ai/contact-us  ·  The prototype, research, model and evidence register are available to your team", { placeholder: "meta" });
  phone(s, "07_uc2_case_created.png", 8.9, 0.55, 6.4, "close-phone");
  s.addNotes("Close with the five concrete asks. Offer to leave the prototype link and the evidence register. Ask: who owns Ayuh, and who should we work with on the API inventory?");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("written", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
