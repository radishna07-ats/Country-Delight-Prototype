# Client Requirement Analysis

## 1. What Country Delight has explicitly requested

**Nothing in writing.** No email, brief, RFP or meeting note from Country Delight was supplied (Source Inventory C-01). The existing deck (S5) and executive pitch (S5b) are **Graine's independent proposals**; S5 states on slides 1 and 15 that it was "not reviewed, approved or endorsed by Country Delight". The meeting is with the VP Technology / CTO and leadership (S5b addressee).

*Explicit Country Delight requirements: Not available in the supplied sources. Requires validation from Country Delight.*

## 2. What Graine is independently proposing

| Origin | Proposal | Status |
|---|---|---|
| S5 deck | UC1 Wallet & Smart Recharge (phone, WhatsApp) | PROPOSED, "requires validation" |
| S5 deck | UC2 Delivery issue resolution (phone, WhatsApp) | PROPOSED, "requires validation" |
| S5 deck | UC3 In-app conversational agent | PROPOSED concept |
| S5 deck | UC4 Offer & promotion outreach | PROPOSED |
| S8 whiteboard | UC5 Conversational subscription via web components | PROPOSED (internal discussion) |
| S8 whiteboard | UC6 Workout/wellness section with allergy-aware product recommendations | PROPOSED (internal discussion) |
| S5b pitch | Phase 1 telephony + WhatsApp, no app release; Phase 2 in-app SDK; 14-day NCR sandbox at 5% traffic | PROPOSED (claims to revise: see Customer_Review_Analysis §6) |

## 3. About the supplied email thread (S6)

The thread is **between Graine and Zee Entertainment / ZBullet** about a health-coaching app. It is the most detailed record we have of how Graine's in-app SDK behaves in a real integration. What we take from it, at the level of **capability and process only**:

| Learning | Relevance to Country Delight | Classification |
|---|---|---|
| SDK integration path (configure → identify → chat/voice → calls → booking → go-live checklist) | CTO guide: realistic integration steps | VERIFIED (for SDK) |
| Frequent SDK releases (0.10.1 → 0.14.7 in ~5 weeks) adding headless UI, past sessions, booking state, workflows, server tokens | Fast-moving product: pin versions, plan regression tests | VERIFIED |
| Typical integration blockers: iOS target not linking the SDK; `identify()` not called so booking unavailable; push credentials for the wrong bundle; device-per-user limits; credits at zero blocking bookings (HTTP 402) | CTO guide: risk register and test plan | VERIFIED |
| Health-onboarding flow agent that "makes clear it's AI, not a doctor", avoids diagnosis, prescriptions and calorie targets, and switches to emergency guidance | **Direct template for UC6 safety guardrails** | VERIFIED (design pattern) |
| Commercial structuring by component (flow implementation, conversational usage, platform/integration, infrastructure, operations) | How to structure the CD proposal | VERIFIED (process) |
| Ownership principle: Graine owns platform IP; client owns client-specific agents, prompts, flows, content and data, with export rights | Expect the same question from CD | VERIFIED (process) |
| Deployment options discussed: Graine cloud, dedicated, client cloud with Graine control plane | Matches public docs | VERIFIED |

**Deliberately excluded:** the other client's negotiated prices, volumes, staff names, contact details and internal timelines. None appears in any deliverable. Country Delight cost assumptions use **Graine's public pricing** (EV-040) only.

## 4. Likely expectations of a CTO audience (to validate in the meeting)

Inferred, not stated; marked HYPOTHESIS:

1. No disruption to the core app or release cadence (supports the Phase 1 no-release pilot).
2. Clear security model: identity, authorisation, auditability, data residency, DPDP.
3. Who builds what, and how much CD engineering time is needed.
4. Measurable pilot with a kill switch.
5. Coexistence with Ayuh and existing support tooling.
6. Cost predictability at CD's volumes.

## 5. Unresolved points to close with Country Delight

| # | Question | Why it matters |
|---|---|---|
| Q1 | Which customer problems does CD itself rank highest (support contact reasons by volume)? | Pilot selection |
| Q2 | Which APIs already exist for wallet ledger, orders/delivery status, tickets, subscriptions, vacations, cart? | Feasibility and effort |
| Q3 | What is Ayuh (in-house? vendor?) and who owns it? | Orchestration design |
| Q4 | Mobile stack and release cadence? | SDK path |
| Q5 | Policies the agent may apply automatically (credit, replacement, refund) and thresholds? | UC2 automation boundary |
| Q6 | WhatsApp Business account, templates, DLT registrations, consent records? | UC2/UC4 channels |
| Q7 | Data residency requirement? | Deployment model |
| Q8 | Nutrition and allergen data per SKU? | UC6 feasibility |
| Q9 | Baselines: contacts per 1,000 orders, cost per contact, cancellation rate, subscription modification rate | Business case |
