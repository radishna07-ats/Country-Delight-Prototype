# Pilot Recommendation

## Recommendation

**Pilot "CD Help": wallet explanation (UC1) + delivery issue resolution (UC2) on WhatsApp and out-of-hours inbound voice, for one city cohort, for 8 weeks after a 4–6 week build. No app release.** Add A1 (balance-runway reminder, opt-in) if the ledger API supports it.

## Why this pilot

| Criterion | UC1 + UC2 | UC3/UC5 in-app | UC4 outreach | UC6 wellness |
|---|---|---|---|---|
| Customer impact (evidence) | **High**: N03/N06/N09 | High: N10 | Low demand, risk N13 | Unproven |
| Measurable business value | **Contacts, repeat contacts, churn after incident** | Modification and expansion | Redemption vs holdout | Attach rate |
| Integration complexity | **Low–medium**: read APIs + ticket + policy | High: SDK + handlers + release | Medium | High (data gap) |
| Time to deploy | **Weeks** | Months | Weeks after consent setup | Months |
| Risk | **Low**: read-only + tickets; remedies policy-bound | Medium | Regulatory/brand | Health claims |
| Prioritisation rank | **1 and 3** | 6 and 9 | 12 | 13 |

The in-app agent (UC3/UC5) is the most visible experience and is shown in full in the prototype. It is **Phase 2** because it needs SDK integration, action handlers and an app release; the pilot de-risks the shared back-end tools it will reuse.

## Scope

**In:** verify customer; balance; explain a transaction; recharge options (link to CD payment); refund request (if API exists); today's delivery status; POD (if available); missing/damaged/not-received reasons; CD-approved remedies within thresholds; ticket creation with case ID; delivery preferences; handoff to humans; Hindi, English, Hinglish (+1 regional language in the pilot city).

**Out:** payments; promotional content; order placement; anything requiring OTP; photo verification (proposed integration).

## Cohort and design

- One city (e.g. a single NCR hub, as suggested in S5b), customers opted in via WhatsApp entry and out-of-hours helpline routing.
- **Control:** matched customers in the same hub without access (or a time-based holdout) for churn and contact comparisons.
- Kill switch: per-intent and global, no release required.

## Success metrics (targets set after baseline, not before)

| Metric | Definition | Baseline source |
|---|---|---|
| Containment (resolved without a person) | Conversations with outcome resolved and no human handoff within 24 h | Graine outcomes |
| Repeat contact rate | Same customer, same issue, within 7 days | CD support |
| Time to resolution | Contact → resolution | CD support |
| Contacts per 1,000 orders (pilot vs control) | — | CD |
| 30-day subscription retention after an incident (pilot vs control) | — | CD |
| CSAT | Post-conversation rating | Graine chat rating / CD survey |
| Safety | Incorrect statements, unauthorised actions (target: zero), escalation correctness | Weekly evals |

> We deliberately do **not** carry forward the executive brief's 60–75% deflection or 40% cost-reduction targets (EV-063). Targets are agreed with CD after a two-week baseline.

## Exit criteria

- **Expand** (add in-app Phase 2) if safety holds and at least two of: containment, repeat contacts, retention-after-incident beat control.
- **Redesign** if customer metrics improve but containment is low (tools or policy gaps).
- **Stop** if safety incidents occur that the controls do not prevent.
