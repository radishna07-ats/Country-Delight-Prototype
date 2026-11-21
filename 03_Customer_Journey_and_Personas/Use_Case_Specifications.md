# Use Case Specifications (Phase 4)

All six use cases are in scope. UC1–UC4 come from the existing deck (S5) and UC5–UC6 from the whiteboard (S8); their original intent is kept. Priority and phasing come from [`../02_Product_Audit_and_RCA/Opportunity_Prioritisation.xlsx`](../02_Product_Audit_and_RCA/Opportunity_Prioritisation.xlsx). Every use case is **PROPOSED**; none is integrated today.

---

## UC1 · Wallet & Smart Recharge — *Pilot*

**Objective.** Explain any wallet movement and recharge option from source data, at the moment of doubt, on in-app, voice and WhatsApp.

**Scenarios:** check balance · why a deduction occurred · how Smart Recharge works · Monthly Once vs Smart Plan · failed payment · refund options · Autopay help · VIP benefit balance.

| # | User story | Acceptance criteria |
|---|---|---|
| 1.1 | As a customer, I want to know why ₹X left my wallet so I can trust the charge. | Given a verified customer and a ledger line of ₹X, the agent names the date, type (order/recharge/membership/fee) and linked order or plan, shows the source line on a card, and makes no statement not present in the data. If no line matches, it says so and asks for date/amount. |
| 1.2 | As a customer, I want to compare Smart Recharge options. | The agent lists only plans returned by the plan API with their cashback terms verbatim, incl. how cashback is split; it opens CD's payment screen; it never initiates payment. |
| 1.3 | As a customer, I want my wallet balance refunded to my bank. | The agent explains the published process and timeline (5–7 working days), asks for explicit confirmation, creates the request through CD's API, and shows the reference. It never asks for bank details in chat; CD's secure link is used. |
| 1.4 | As a customer whose payment failed, I want to know if money left my bank. | The agent reports CD's payment status for that attempt; if pending/unknown, it states that and gives the published reversal guidance. It never claims success without a backend confirmation. |

**Safeguards:** never ask for UPI PIN, OTP, card or bank numbers · read-only by default · T3 confirmation for refund requests · show source data · escalate disputes.
**Dependencies:** ledger API with references; plan API; payment status API; refund-request API; verification.
**Business value:** fewer wallet contacts; fewer disputes and refunds; higher recharge completion (hypothesis HY-001).
**Metrics:** containment rate for wallet intents; repeat-contact rate within 7 days; dispute rate; recharge completion after agent explanation; CSAT.

## UC2 · Delivery issue resolution — *Pilot*

**Objective.** Resolve morning delivery problems 24×7 with verified status and CD-approved remedies.

**Scenarios:** not arrived · item missing · wrong product · leaking/damaged · marked delivered not received · update delivery instructions · status check.

| # | User story | Acceptance criteria |
|---|---|---|
| 2.1 | As a customer at 5:30 AM, I want to know where my milk is. | After verification, the agent states the order's items, slot (5:00–7:30) and status exactly as returned; if the status is unavailable it says so and never estimates. |
| 2.2 | As a customer with a missing item, I want it fixed without calling. | The agent captures the reason via quick replies, offers only options the resolution service returns as eligible, confirms the choice, and returns a case ID. |
| 2.3 | As a customer with a leaking packet, I want to report it with evidence. | In the pilot: ticket with reason and order line. Photo upload is a **proposed integration**, shown in the prototype as such. |
| 2.4 | As a customer, I want the rider to call before delivery instead of ringing the bell. | The agent shows current preferences, proposes the change, and updates after confirmation (T2). |

**Safeguards:** no invented status; refunds/credits only via policy service; repeated incidents escalate; food-safety concerns escalate.
**Dependencies:** order/delivery status, POD, resolution policy service, ticketing, preference API.
**Business value:** fewer avoidable contacts; protected retention after bad mornings.
**Metrics:** first-contact resolution; time to resolution; contacts per 1,000 orders; churn within 30 days after an incident vs control.

## UC3 · In-app conversational agent — *Phase 2*

**Objective.** A voice and chat layer inside the app that understands, shows and acts through declared actions, complementing Ayuh.

| # | User story | Acceptance criteria |
|---|---|---|
| 3.1 | "Add two packets of milk to my cart." | Ambiguity → one clarifying question; product card shown; on add, the cart count updates and the agent reads back the verified cart state. |
| 3.2 | "Pause my deliveries next week." | Dates resolved to Mon–Sun of next week; checked against the 60-day rule and cut-off; vacation card shown; created only after Confirm; Vacations screen reflects the change. |
| 3.3 | "Where can I see tomorrow's order?" | Agent navigates to My Orders and highlights tomorrow; no data invented. |
| 3.4 | Contextual help | A suggestion appears only when a friction rule fires (e.g. looping 3× in 45 s); max 3 per session; dismissible. |
| 3.5 | Ayuh coexistence | Ayuh's "Something else" can open the Graine agent with Ayuh's selected path as context. |

**Dependencies:** SDK; screen context per screen; action handlers; app release.
**Metrics:** task completion; time to task; adoption among exposed users; cart additions via agent; Ayuh→Graine handoff resolution.

## UC4 · Offer & promotion outreach — *Phase 3, validate first*

**Objective.** Explain relevant, approved offers to consenting customers through in-app, opted-in WhatsApp, and consented voice.

| # | User story | Acceptance criteria |
|---|---|---|
| 4.1 | As an eligible customer, I see an offer that fits my subscriptions. | Audience = eligible ∩ consented ∩ not DNC ∩ under frequency cap; content only from the offer record. |
| 4.2 | As a customer, I want the conditions before I act. | Agent states validity, eligible products and voiding conditions verbatim. |
| 4.3 | As a customer, I want calls to stop. | "Stop/not interested" adds to DNC on the spot and ends the conversation politely. |

**Safeguards:** AI disclosure; 10 am–7 pm voice window (stricter than the 9–9 default); no promotional content in service calls; campaign approval; frequency caps; consent records.
**Metrics:** incremental redemption vs holdout; opt-out rate; complaint rate.

## UC5 · Conversational subscription management — *Phase 2*

**Objective (whiteboard).** Let customers change subscriptions inside the conversation with interactive components, without switching screens.

| # | User story | Acceptance criteria |
|---|---|---|
| 5.1 | "Add one more packet to my regular milk." | Change card shows product, current → proposed qty, effective date respecting the 11 pm cut-off, price per delivery and per month, offer impact; executes only on Confirm; My Subscriptions reflects it; Undo available. |
| 5.2 | "Stop my curd." | Asks reason; offers pause/vacation/qty change; if still remove, confirms removal; records reason. |
| 5.3 | "Add paneer every Sunday." | Finds product, proposes weekly subscription card, confirms, shows the result. |
| 5.4 | Unsupported change (e.g. a frequency CD does not offer) | Agent states supported options only. |

**Dependencies:** subscription read/write per operation; price; offer eligibility; cut-off; components with live data.
**Metrics:** modification completion rate; net quantity change; save rate on removal intents; errors/undo rate.

## UC6 · Personalised wellness & product discovery — *Phase 3, experiment*

**Objective (whiteboard).** A "Your Wellness Journey" section where a customer starting a fitness routine shares goals, diet and allergies, and gets catalogue-grounded product suggestions the in-app agent can add.

| # | User story | Acceptance criteria |
|---|---|---|
| 6.1 | "I've started working out; recommend products." | Agent asks goal, diet, allergies, preferences; asks consent to remember; skippable. |
| 6.2 | Recommendations | Only products whose catalogue attributes match; each shows "why"; any product containing a declared allergen is excluded, with no exceptions; no nutrition value that isn't in the catalogue. |
| 6.3 | Safety | Medical conditions, pregnancy, medication or symptoms → not advice; suggests a qualified professional; emergency wording → emergency guidance. |
| 6.4 | Act | Add to cart or subscribe via UC5 card. |

**Dependencies:** nutrition and allergen attributes per SKU (gap); consent store; new section in the app.
**Metrics:** profile completion; recommendation CTR; wellness-SKU attach rate vs control; repeat purchase.

---

## Additional opportunities evaluated (§8.1)

Scores in the prioritisation workbook. Summary:

| ID | Opportunity | Verdict | Why |
|---|---|---|---|
| A1 | Balance runway & replenishment reminder (opt-in) | **Pilot add-on** | Prevents delivery holds (EV-014); read-only |
| A2 | Cancellation save conversation | **With UC5** | No save step today (EV-024) |
| A3 | Doorstep preference assistant | With UC2 | Preferences exist but are buried (EV-030) |
| A4 | Proactive exception & price-change notifications | Phase 2 | Event feeds needed; WhatsApp/push only |
| A5 | Structured feedback & quality capture | Phase 2 | Quality is the top complaint; route data to quality ops |
| A6 | Lapsed-subscriber win-back | Phase 3 | Same governance as UC4 |
| A7 | Product education from approved content | Easy add-on | Knowledge base only; supports trust (test reports) |
| — | Cart recovery, loyalty engagement, lifecycle automation | Not prioritised | Weak evidence of need; overlaps UC4 risk |
