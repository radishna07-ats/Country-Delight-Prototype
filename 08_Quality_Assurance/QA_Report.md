# QA Report

**Date:** 21 Nov 2026 · **Scope:** every deliverable in this repository · **Method:** automated tests, recalculation, render checks, text scans and manual review, each listed below with how to re-run it.
Test-by-test results are in [`Functional_Test_Cases.xlsx`](Functional_Test_Cases.xlsx). Prototype detail is in [`../06_Prototype/Test_Results.md`](../06_Prototype/Test_Results.md).

## 1. Summary

| Area | Result | Evidence |
|---|---|---|
| Prototype unit and scenario tests (Vitest) | **78 / 78 pass** | `npm test` |
| Prototype end-to-end UI tests (Playwright, Chromium) | **19 / 19 pass** | `npm run test:e2e` → `tests/e2e/e2e-results.json` |
| TypeScript strict typecheck and production build | Pass, 0 errors | `npm run typecheck`, `npm run build` |
| Functional test case register | **122 / 122 pass** across 11 areas | `Functional_Test_Cases.xlsx` |
| Financial model recalculation | **0 formula errors in 2,844 formulas**; streams reconcile to 0 | LibreOffice recalculation (§4) |
| Other workbooks (evidence, friction, prioritisation, tests) | 0 errors | Same recalculation |
| Sales deck | Validation passed; 30 slides render | `validate.py`; PDF render |
| Pitch and CTO guide | Render cleanly (5 pages and 4 pages) | PDF render |
| Internal links in all Markdown files | 0 broken | Link check (§7) |
| Privacy scans | 0 findings in client-facing files | §5 |
| Production-claim scan | 0 misleading claims | §6 |
| Defects found and fixed | **21** (D-01 to D-21); **0 open** | §8 |

**Verdict.** Everything the brief's §14 asks for has been tested. Every defect found has been fixed and re-tested, and no critical defect is open. What has not been tested is listed in §9.

## 2. Functional testing (brief §14.1)

| Brief item | Covered by | Result |
|---|---|---|
| Navigation | E02, E04, E07, E11, E12; unit `navigate` intent | Pass |
| Product selection | E02; unit scenario 1 (clarify milk, add after tap) | Pass |
| Cart operations | E02; unit cart read-back, empty cart, unavailable product | Pass |
| Quantity updates | E03; unit "one more", "make it 3", quantity 0, quantity 50 | Pass |
| Subscription modifications | E03, E13, E14, E16; unit scenario 2 (including the offer-void warning) | Pass |
| Vacation management | E04, E15; unit scenario 3, 60-day rule, overlap, reversed dates | Pass |
| Wallet interactions | E05, E06; unit scenario 4 (Autopay explanation, unknown deduction, runway) | Pass |
| Order status | E07, E09; unit scenario 5 | Pass |
| Delivery issue creation | E07 (case number, history); unit ticket and callback | Pass |
| Wellness onboarding | E10; unit scenario 6 (consent, goal, diet, allergy) | Pass |
| Product recommendations | E10 (allergen exclusion with reason) | Pass |
| Agent conversations | All E-tests; 78 unit tests | Pass |
| State persistence | E16 (survives reload) | Pass |
| Demo reset | E16 (reset restores seed); each scenario resets itself | Pass |

## 3. Edge cases, conversational and design QA (brief §14.2–14.4)

### 3.1 Edge cases (§14.2)

On the first pass, six of these cases were wrong. They were fixed before this report (D-14 to D-19).

| Brief edge case | Test | Behaviour now |
|---|---|---|
| Missing information | Unit: vacation with no dates; "Add milk" | Asks for dates or which milk; no default guess |
| Invalid dates | E15 (70-day range); unit "30 Nov to 25 Nov" | Refused with the reason and both dates; nothing set |
| Unavailable products | Unit: spinach | Refused with the reason; cart unchanged |
| Empty cart | Unit: "What's in my cart?"; empty-cart screen | Says the cart is empty and offers a next step |
| Duplicate actions | Unit: confirm twice | "Already done"; applied once |
| Failed mock API | E13; unit failed write | "Nothing was changed"; retry offered |
| Network error / service down | Unit: status service down | No guess; ticket and callback offered |
| Unauthorised action | Unit: "Please pay for my order"; E09 (caller verified before account data) | Payment refused (T4); account data only after verification |
| Ambiguous intent | Unit: "Add milk"; unrecognised text | Clarifying question; fallback with a "Talk to a person" option |
| User changes their mind | E03 (Undo); unit "Actually make it 3" | Old proposal withdrawn and cannot be confirmed; new one shown |
| User declines confirmation | E14; unit declining changes nothing | "Cancelled · nothing changed" |
| Conflicting instructions | Unit: "Pause my deliveries for three days and increase my milk" | One change at a time; the second request is offered as a chip |

### 3.2 Conversational QA (§14.3)

| Requirement | How it was checked | Result |
|---|---|---|
| Does not hallucinate data | E06 (₹999 deduction not in ledger); status-down test; every figure in replies comes from the simulated tools (inspector) | Pass |
| Asks clarifying questions | Generic milk; missing dates; several subscriptions | Pass |
| Uses customer context | Usual milk offered first; Ayuh hand-off context (E12); balance runway | Pass |
| No unconfirmed sensitive actions | T2/T3 changes only after Confirm (E03, E07, E13, E14); payment never (T4) | Pass |
| Explains failed actions | E13; vacation and quantity refusals give the reason | Pass |
| No success claim without confirmation | The success message is written only after the tool returns `ok` (E13 shows the failure path) | Pass |

### 3.3 Design QA (§14.4)

| Check | Result | Note |
|---|---|---|
| Mobile responsiveness | Pass | E18 at 390×844: no horizontal scroll |
| Desktop presentation | Pass | Presenter view (scenario panel · phone · inspector) at 1280 and 1600 px; presentation mode (P) |
| Typography, spacing, consistency | Pass | One type scale and Tailwind tokens; reviewed on 17 screenshots |
| Product imagery | Pass, with a caveat | Illustrated product art, **not Country Delight photography**. Real assets are needed for a client-branded build |
| Loading, empty and error states | Pass | Thinking indicator; empty cart, orders and subscriptions; fault-injection messages |
| Button functionality | Pass | Every scenario path in E01–E17 is driven by real clicks |
| Accessibility | Pass, partial | 35 `aria-label`s; switch role and state; polite live regions for the conversation (D-20) and steppers; reduced-motion support. **No screen-reader or WCAG audit by a specialist** |

## 4. Financial QA (brief §14.5)

Recalculated in LibreOffice (headless) on 21 Nov 2026.

| Check | Result |
|---|---|
| Every formula recalculated | 2,844 formulas, **0 errors** (#REF!, #DIV/0!, #VALUE!, #NAME?, #N/A) |
| Every scenario | Conservative, Base and Aggressive are driven from one `Case Inputs` column each; a switch, not copies |
| Streams reconcile to total | `Use Cases` check row = **0.00** in all three scenarios |
| Hand recomputation (Base) | Monthly net = 40.58 + 17.15 − 25.78 = **31.95** ✓ · Year-1 net = 292.18 + 123.49 − 50 − 195.21 = **170.46** ✓ · ROI = 170.46 ÷ (50 + 195.21) = **0.70×** ✓ · Conservative = 59.58 + 39.20 − 55 − 100.63 = **−56.84** ✓ |
| Percentages | Revenue uplift 162.32 ÷ 11,550 = **1.41%** ✓. Prioritisation weights sum to 100% (they summed to 80% before fix D-11) |
| Monthly vs annual | Annualised run-rate = monthly net × 12 (31.95 × 12 = 383.4 ✓); Year 1 uses a ramp, so it is lower |
| Double counting | UC2 (service churn) and A2 (cancellation save) apply to separate populations; a 10% overlap haircut is applied to UC3–UC6; support savings are not also counted as revenue |
| Unrealistic assumptions | Every baseline input is labelled *illustrative* and listed in [Financial_Assumptions.md](../04_Revenue_and_Financial_Model/Financial_Assumptions.md) §6. The Conservative case shows a **Year-1 loss (−₹57 L)**, which is a safeguard against overselling |
| Sensitivity | 22 cases at ±25% all move in the expected direction; margin is the largest swing (±₹146 L Year-1 net) |
| Pricing inputs | Graine pricing uses only published rates (₹6/min voice, ₹10/chat session); no enterprise discount is assumed |

**Limitation:** the model is arithmetically correct, but its baseline is not Country Delight data. Its outputs are illustrative until CD supplies the inputs listed in [ROI_Analysis.md](../04_Revenue_and_Financial_Model/ROI_Analysis.md) §4.

## 5. Privacy QA

| Check | Method | Result |
|---|---|---|
| PII from the CD app screen recording (customer name, phone, address) | Frames showing personal details were not saved. The repository was searched for the strings visible in the recording, and for 10-digit mobile patterns in every text file and in the extracted text of the deck and documents | 0 matches. The 12 saved frames show no personal data |
| Third-party confidential terms | The supplied email thread belongs to a different Graine client. Every file, including extracted .pptx/.docx text, was searched for that client's name, prices and contacts | 0 in client-facing files. Named only in internal source notes ([Source_Inventory.md](../00_Project_Management/Source_Inventory.md), [Client_Requirement_Analysis.md](../01_Research_and_Discovery/Client_Requirement_Analysis.md)) and in Graine's public customer list (EV-053). Commercial terms are not reproduced anywhere |
| Reviewer personal data | Salutation names, phone numbers and e-mails in the public review datasets were redacted | 1,162 fields redacted; re-coding gives the same theme counts (N08 = 126, 26.2%) |
| Demo customer | Seed data | "Ananya Sharma" is fictional; no real customer data is used |
| Secrets | Searched for keys and tokens | None; the prototype has no back end and no credentials |

## 6. Claims audit (no misleading production claims)

- **Text scan:** the deck, pitch, CTO guide, demo script and every Markdown file were searched for "production-ready", "is live", "live integration", "fully integrated" and "already integrated": 0 matches.
- **Disclosure on every surface:** the prototype README, the in-app labels ("Prototype · simulated back end"), the scenario panel, the inspector, the demo script's opening line, the pitch and the CTO guide all say that the back end is simulated and that nothing is connected to Country Delight's systems or to a live Graine agent. In the deck, the executive summary says so, and every prototype screen has the caption "Prototype screen · simulated data".
- **Gap found and fixed (D-21):** before this pass, the deck and the two documents said "working prototype" without saying that the data is simulated.
- **Capability claims:** every Graine capability in the deck and documents traces to the [Graine_Capability_Matrix.md](../01_Research_and_Discovery/Graine_Capability_Matrix.md), tagged *supported today*, *configuration*, *development*, *needs CD API*, *needs CD engineering* or *future*.
- **Metrics:** every number on a client-facing slide is in the [Evidence_Register](../01_Research_and_Discovery/Evidence_Register.md) or is labelled illustrative.
- **Corrections to the existing executive pitch:**
  - Its product-quality claim is contradicted by the review data: quality and damage is the largest negative theme.
  - Pre-dawn voice calls are replaced by opt-in WhatsApp or push.
  - ">80% automation" becomes 66–78%.
  - The midnight cut-off becomes 11 pm.

## 7. Deliverables open correctly

| Deliverable | Check | Result |
|---|---|---|
| `CountryDelight_Sales_Deck.pptx` | `validate.py` (schema, relationships, charts); LibreOffice render; slide-by-slide visual review | Passed; 30 slides; overflow and alignment issues fixed earlier |
| `CountryDelight_Sales_Pitch.docx`, `CTO_Discussion_Guide.docx` | LibreOffice PDF render; page review | 5 pages and 4 pages; no overflow |
| All `.xlsx` | LibreOffice recalculation | 0 errors |
| All `.md` | Relative-link check across the repository | 0 broken links |
| Prototype | `npm run build`, `npm run preview` (the E2E suite runs against this build) | Runs at http://localhost:4173 |
| Mermaid diagrams | Labels with special characters quoted to avoid parse errors | Not render-tested outside GitHub |

## 8. Defects

Twenty-one defects were found and fixed: D-01 to D-13 during build and the first QA pass, and D-14 to D-21 in this pass. The full log is in [`../06_Prototype/Test_Results.md`](../06_Prototype/Test_Results.md). The most important ones were:

- **D-18 (high):** reversed dates produced a 34-day pause. Reversed ranges are now refused.
- **D-01:** the wallet explanation named the wrong trigger balance.
- **D-12:** a payment request was not refused explicitly.
- **D-11:** the prioritisation weights summed to 80%.
- **D-21:** the deck did not say that the prototype runs on simulated data.

## 9. Not tested / known limitations

- **No real integrations.** Every Country Delight API, Graine runtime call, WhatsApp delivery and telephony leg is simulated. Latency, authentication, rate limits and failure modes of the real systems are untested and are part of the pilot plan.
- **Language understanding is rule-based.** It covers the demo vocabulary plus common English and Hinglish variants. Graine's production model will behave differently and needs its own evaluation set; the cases in `tests/unit` are a starting point.
- **Browsers:** tested in Chromium only. Real speech recognition needs Chrome or Edge; the simulated voice fallback works everywhere. The real microphone path was not tested headless.
- **Accessibility:** basic checks only; no expert WCAG audit.
- **Financial model:** illustrative baseline (§4).
- **Business rules from the FAQ:** the 11 pm cut-off and the 60-day vacation limit are applied as published. The VIP pause rule is contradictory in the FAQ and must be confirmed with Country Delight.

## 10. How to re-run

```bash
cd 06_Prototype/Source_Code && npm install && npm test && npm run typecheck && npm run build
```

```bash
cd 06_Prototype/Source_Code && npm run preview   # in one terminal
```

```bash
cd 06_Prototype/Source_Code && npm run test:e2e  # in a second terminal (needs Playwright + Chromium)
```

```bash
cd 06_Prototype/Source_Code && npx vitest run --reporter=verbose > /tmp/unit.txt && python3 ../../08_Quality_Assurance/scripts/build_test_cases.py /tmp/unit.txt
```
