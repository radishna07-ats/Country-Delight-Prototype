# Project Brief

## Purpose

Prepare Graine AI for a client meeting with Country Delight's technology leadership. We want to show an **evidence-based** transformation proposal and a working prototype. Together they should show how an AI assistance layer (in-app, WhatsApp and voice) can fix real friction in Country Delight's post-order experience, and they should lead to a measurable pilot.

## Audience

| Reader | What they need |
|---|---|
| CD VP Technology / CTO | What is feasible today, what needs CD engineering, how security, data and failure handling work |
| CD product and CX leaders | Which customer problems this fixes, with evidence; what the customer experiences |
| CD business leadership | Value, cost, risk and a pilot that proves it |
| Graine sales and solutions team | Deck, pitch script, CTO guide, demo script, answers to objections |

## Scope

- **Six use cases.**
  - UC1–UC4 are from the existing Graine deck: wallet and Smart Recharge, delivery issue resolution, in-app conversational agent, offer outreach.
  - UC5 and UC6 are from the whiteboard: conversational subscriptions with web components, and a wellness journey with workout goals and allergies.
  - Seven more opportunities (A1–A7) were found in research.
- **Channels:** the CD Android/iOS app, WhatsApp and voice (inbound; outbound only with consent).
- **Out of scope:**
  - Real integration with CD systems.
  - Production deployment.
  - Commercial terms beyond Graine's published pricing.

## Inputs

S1–S9, described in [Source_Inventory.md](Source_Inventory.md).

The supplied email thread (S6) concerns a different Graine client. It is used only as evidence of how Graine's SDK behaves; no Country Delight requirement is drawn from it.

## Rules applied throughout

1. **Evidence classes:**
   - VERIFIED: from a primary source.
   - OBSERVED: seen in a recording or the app.
   - HYPOTHESIS: inferred and to be tested.
   - PROPOSED: our design.

   Each is recorded in the [Evidence Register](../01_Research_and_Discovery/Evidence_Register.md).
2. **No invented facts.** We don't invent metrics, APIs, complaints, integrations or capabilities. Where data is missing we write: *"Not available in the supplied sources. Requires validation from Country Delight."*
3. **Simulation is never presented as production.** The prototype runs on a simulated back end with a fictional customer, and every surface says so.
4. **Graine capabilities are claimed only as documented.** Each is tagged available today / configuration / integration / proposed.
5. **Privacy:**
   - No personal data from the recordings.
   - Review datasets redacted.
   - No other client's confidential terms.

## Deliverables

See the [README](../README.md) for the full index. In summary: research (01), audit and RCA (02), journeys, personas and use cases (03), financial model (04), architecture, security, pilot and roadmap (05), prototype (06), sales enablement (07), QA (08), and [PROJECT_STATUS.md](../PROJECT_STATUS.md).

## Definition of done

Brief §19, checked line by line in [Final_Validation_Checklist.md](../08_Quality_Assurance/Final_Validation_Checklist.md).
