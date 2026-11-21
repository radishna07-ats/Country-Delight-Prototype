# Source Inventory

**Project:** Graine AI × Country Delight · **Prepared:** 21 Nov 2026 · **Owner:** Graine AI (internal)

Every supplied source was located, opened and read before any product work began. This register records what each source is, how it was read, what it is authoritative for, and its limits. Source IDs (S1–S9) are cited throughout the project; external research sources are listed separately in [`../01_Research_and_Discovery/Research_Sources_Register.md`](../01_Research_and_Discovery/Research_Sources_Register.md).

## 1. Supplied sources

| ID | Source | Format | How it was read | Authoritative for | Limits / cautions |
|---|---|---|---|---|---|
| **S1** | Graine AI website — graine.ai | Web | Home, In-app agent, Pricing, Security, Trust, Customers pages and 30+ docs pages fetched and read in full (21 Nov 2026) | Graine's **published** capabilities, SDK behaviour, limits, public pricing (₹6/connected min; ₹10/chat session ≤5 min), deployment models, data residency | Marketing pages describe the product as Graine states it; a capability being documented ≠ configured for Country Delight |
| **S2** | Country Delight website — countrydelight.in | Web (JS-rendered) | Rendered in headless Chromium: Home, FAQ (all categories expanded), Story, Policies, Redressals, T&C | Public business proposition, delivery window (5:00–7:30 AM), 11 pm order cut-off, published FAQ rules (wallet refunds, Autopay, VIP, vacation, offers) | Public rules only; internal policy may differ. The FAQ contradicts itself on VIP pause limits (see EV-034) |
| **S3** | Country Delight app screen recording — `WhatsApp_Video_2026-11-21_at_5.42.45_PM_1.mp4` | MP4, 430.7 s, 576×1280, Android | Watched end to end as 144 timestamped frames (1 frame / 3 s) on contact sheets, plus ~30 full-resolution frames at key moments. App version **10.9.100** visible at 03:16 | **Observed** UI, navigation, features and copy of the live app as of 19–21 Nov 2026 | Shows one customer's account in Gurgaon. Business logic behind any screen is **not** established by the recording. The recording shows the recorder's phone number and home address: **no frame containing them is stored or reproduced** |
| **S4** | Graine website/dashboard screen recording — `Screen_Recording_2026-11-21_180651_2.mp4` | MP4, 341.9 s, 1890×870 | Watched as 86 timestamped frames (1 frame / 4 s) | **Observed** Graine builder: Agents, Flow agents (28 steps / 127 paths example), Voice studio, Voice library, Knowledge base, Workflows, Phone numbers, Campaigns, WhatsApp calling & consent, Web components, Deploy with code (APIs), Agent analytics, People, Call history, Embed & Widgets (Install / Appearance / **Actions** / **On screen** / **Friction** / People & memory / Calls), Goal & Outcomes, Compliance (PII redaction, AI notice), Calling window | A demo workspace of other customers' agents; no Country Delight agent exists yet |
| **S5** | Existing client deck — `Graine AI Country Delight Deck (1).html` (repo root) | Self-unpacking HTML, 15 slides | Rendered in Chromium; every slide paged through and its DOM text extracted | What Graine **already proposed**: UC1–UC4, cross-channel matrix, guardrails, deployment, pilot approach | Slides 1 & 15: "Independent proposal… not reviewed, approved or endorsed by Country Delight." Proposal, not evidence of integration |
| **S5b** | Executive pitch — `Graine_AI_x_Country_Delight_Executive_Pitch.pdf` | PDF, 2 pages | Read in full | The commercial/positioning brief addressed to Country Delight's VP Technology | Contains **unverified quantitative claims** (500-review audit, ">80%", category shares, 60–75% deflection, 40% cost drop, 14-day production). These are tested in [Customer_Review_Analysis.md](../01_Research_and_Discovery/Customer_Review_Analysis.md) §6 and registered as EV-060 to EV-066 |
| **S6** | Email thread — `Bulletshorts Onboarding Agent Ready for Review | Next Steps` | PDF, 440 pages, 50 messages (11 Oct – 19 Nov 2026) | De-duplicated to 50 unique messages and read in full | Real-world behaviour of Graine's **in-app SDK** (0.10.1 → 0.14.7), integration steps, failure modes, security features, commercial structuring | **This thread is with a different Graine client (Zee / ZBullet "Sia" health app), not Country Delight.** It contains no Country Delight requirement. It contains another client's confidential commercial terms and staff contact details — **deliberately not reproduced anywhere in this project**. Used only for capability evidence and to inform UC6 (health onboarding pattern). See [Client_Requirement_Analysis.md](../01_Research_and_Discovery/Client_Requirement_Analysis.md) |
| **S7** | Graine In-App & Avatar presentation — `Graine_In_AppAvatar.pdf` | PDF, 14 slides | Read in full | In-app agent positioning: voice · chat · avatar; 18 languages; ~500 ms reply; 6 native SDKs; screen reporting via structured fields; declared handlers; App Attest / Play Integrity; hash-chained audit | Avatar is **"Beta · by invitation"** (slide 9). Performance figures are Graine-stated |
| **S8** | Handwritten whiteboard (image) | Photo | Transcribed | Origin of **UC5** (conversational subscription via "web components", without changing screens) and **UC6** (separate workout/wellness section; products by workout plan and allergies; in-app agent helps) | States "4 use cases already shared in the deck" — consistent with S5 |
| **S9** | Prior Graine work in sibling repo `radishna07-ats/Country-Delight` | Code + docs | Read (README, project audit, deck extraction) | An earlier mock ecosystem for UC1–UC4 built from an **older 165 s recording (app 10.9.93)** | Superseded for screen evidence by S3 (newer, 2.6× longer, shows Ayuh, Instant, health goals, VIP, offers, referral). Reused only as design reference; no code copied |

## 2. Source conflicts discovered

| # | Conflict | Sources | Resolution in this project |
|---|---|---|---|
| C-01 | Email thread supplied as "client correspondence" concerns Zee/ZBullet, not Country Delight | S6 vs brief | Treated as capability evidence only. **No Country Delight requirement is attributed to it.** Explicit CD requirements: none in writing — see Client Requirement Analysis |
| C-02 | Executive pitch: "customers rarely complain about milk quality or freshness" | S5b vs our review analysis | Our sample shows quality/freshness/damage is the **largest single negative theme** (26% Play, 33% App Store). Pitch claim should be withdrawn (EV-061) |
| C-03 | Executive pitch: "over 80% of negative ratings stem from post-order workflow bottlenecks" | S5b vs our analysis | Our sample: 66% (Play) / 78% (App Store) of coded negative reviews mention ≥1 post-order workflow theme. Directionally supportive; "80%" not reproduced (EV-062) |
| C-04 | Executive pitch: midnight (12:00 AM) cut-off | S5b vs S2 | Website: "Order anytime before 11 pm & get by 7:30 AM". Use 11 pm unless CD confirms otherwise (EV-007) |
| C-05 | Executive pitch: 4:30 AM automated voice calls | S5b vs S1 docs & reviews | Graine's own docs note commercial calls in India are generally limited to 9 am–9 pm; reviews already complain about 5 AM bells/calls. Recommend WhatsApp/push for pre-dawn, never voice (D-07) |
| C-06 | Deck slide 13: "India or US data residency" | S5 vs S1 (`/docs/enterprise/deployment`) | Shared cloud stores recordings in the UK (third-party object storage) and the credential store in the US; single-jurisdiction residency requires a dedicated instance or own compute (EV-045) |
| C-07 | App attestation: docs privacy page says "in progress"; Oct-28 email (S6) says App Attest / Play Integrity per agent shipped (report-only first) in SDK 0.14.7 | S1 vs S6 | Treat as **available, requires confirmation for CD's platforms** (EV-048) |
| C-08 | Text chat surface: architecture page lists "React Native and websites today"; S6 shows chat on KMP/iOS/Android | S1 vs S6 | Requires Graine confirmation for CD's app stack (EV-049) |
| C-09 | CD FAQ gives three different VIP pause rules | S2 | Evidence that rule text is inconsistent; any agent must be grounded in one CD-approved rule source (EV-034) |
| C-10 | Deck: "22 Indian languages + English"; website: "18 languages on calls, 11 mid-call" | S5 vs S1 | Voice Studio TTS = 22 Indian languages + English; **call** languages = 18 (11 with mid-call switching). Use the precise wording (EV-041) |

## 3. Missing information (requested from Country Delight / Graine)

Not available in the supplied sources. Requires validation:

1. Any written Country Delight requirement, email or brief (none supplied).
2. Country Delight API documentation (catalogue, cart, subscription, vacation, wallet ledger, orders, delivery status, tickets, offers, consent).
3. Internal metrics: MAU, ordering customers, AOV, subscription penetration, churn, support contacts by reason, cost per contact, campaign conversion.
4. Ayuh's architecture, owner, roadmap and analytics.
5. Mobile app stack (native / React Native / Flutter / KMP) and release cadence.
6. Refund, replacement and credit policies used by support.
7. Consent records for WhatsApp and outbound calls; DND scrubbing process.
8. Nutritional data for the catalogue (needed for UC6).
9. Graine: confirmed enterprise rates for CD volumes; WhatsApp messaging (vs WhatsApp *calling*) support; chat surface availability per SDK; attestation status.
