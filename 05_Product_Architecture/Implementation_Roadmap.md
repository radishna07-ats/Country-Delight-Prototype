# Implementation Roadmap (Phase 9)

Durations are **planning assumptions**, not commitments; they depend on CD's API readiness (Q2) and release cadence (Q4).

```mermaid
gantt
  dateFormat  YYYY-MM-DD
  axisFormat  %d %b
  section Stage 1 Discovery & alignment
  Use cases, baselines, API inventory       :s1, 2026-12-01, 21d
  section Stage 2 Technical preparation
  Tool contracts & CD endpoints (pilot)      :s2a, after s1, 28d
  Agent design, KB, flows, evals             :s2b, after s1, 28d
  Security, DPA, residency decision          :s2c, after s1, 21d
  section Stage 3 Pilot
  Internal dogfood                           :s3a, after s2a, 7d
  City cohort (UC1+UC2, WhatsApp+voice)      :s3b, after s3a, 56d
  section Stage 4 Measurement
  Pilot vs control readout                   :s4, after s3b, 14d
  section Stage 5 Expansion
  In-app SDK, handlers, release (UC3+UC5+A2) :s5a, after s4, 60d
  UC4 consent-first outreach                 :s5b, after s5a, 30d
  UC6 wellness experiment                    :s5c, after s5a, 45d
```

| Stage | Activities | Deliverables | Graine | Country Delight | Dependencies |
|---|---|---|---|---|---|
| 1 Discovery & alignment (≈3 wks) | Validate problems with contact-reason data; confirm use cases; API inventory; baselines; success metrics; Ayuh orchestration decision | Agreed pilot scope, metrics, baseline | PM, solution architect | Product, support ops, tech lead, legal | Data access |
| 2 Technical preparation (≈4 wks) | Tool contracts; CD endpoints; flow agents; knowledge base from approved policy; verification method; security config; evals; WhatsApp setup; DPA; residency | Pilot-ready agents, test report | Agent engineers, QA | Back-end engineers, telephony, marketing (WABA), DPO | Q2, Q6, Q7 |
| 3 Pilot (≈1 + 8 wks) | Dogfood; controlled cohort; weekly evals; daily monitoring 4:30–9:30 AM | Live pilot, weekly report | Ops on call, tuning | Support ops escalation owner | Kill switch |
| 4 Measurement (≈2 wks) | Pilot vs control; customer behaviour; operational and financial impact | Readout; go/redesign/stop | Analyst | BI, finance | Baseline |
| 5 Expansion (≈3–5 months) | In-app SDK (UC3, UC5, A2), components, friction rules; UC4 with consent; UC6 experiment; more cities and languages | Phase 2/3 launches | Full team | Mobile team, catalogue (nutrition data), marketing | App release; nutrition data |

**RACI highlights:** CD owns policies, APIs, app releases, consent, customer communication; Graine owns agent design, platform operation, evals, monitoring and the weekly quality report; jointly own metrics and the go/no-go.
