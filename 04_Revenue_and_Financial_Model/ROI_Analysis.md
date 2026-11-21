# ROI Analysis (illustrative)

Results from [`CountryDelight_Revenue_Model.xlsx`](CountryDelight_Revenue_Model.xlsx), recalculated in LibreOffice on 21 Nov 2026 with no formula errors. **All baseline inputs are illustrative** (Financial_Assumptions.md §2). ₹ lakh = ₹1,00,000; ₹1 crore = 100 lakh.

## 1. Summary

| | Conservative | Base | Aggressive |
|---|---|---|---|
| **Monthly run-rate** | | | |
| Incremental revenue (gross) | ₹39.7 L | ₹162.3 L | ₹480.2 L |
| …as % of baseline revenue (₹11,550 L) | 0.3% | 1.4% | 4.2% |
| Incremental contribution | ₹9.9 L | ₹40.6 L | ₹120.0 L |
| Support cost avoided | ₹6.5 L | ₹17.2 L | ₹32.7 L |
| Running cost (Graine usage + WhatsApp + ops) | ₹14.8 L | ₹25.8 L | ₹44.4 L |
| **Net monthly benefit** | **₹1.7 L** | **₹32.0 L** | **₹108.4 L** |
| **Year 1 (with ramp-up)** | | | |
| Incremental revenue (gross) | ₹238 L | ₹1,169 L | ₹4,033 L |
| Contribution + savings | ₹99 L | ₹416 L | ₹1,283 L |
| One-time investment | ₹55 L | ₹50 L | ₹50 L |
| Running cost | ₹101 L | ₹195 L | ₹380 L |
| **Year-1 net benefit** | **−₹57 L** | **₹170 L** | **₹853 L** |
| **Year-1 ROI** | **−0.37×** | **0.70×** | **1.98×** |
| Payback on one-time investment | not reached | 2.7 months | 0.7 months |
| Annualised net benefit at full run-rate | ₹20 L | ₹383 L | ₹1,300 L |

## 2. What the numbers say

1. **The case is not automatic.** In the Conservative case, Year 1 loses money: low containment and adoption don't cover usage and set-up costs at published rates. That is the reason to pilot one city with a control group before scaling.
2. **In the Base case the value is mostly retention, not upsell.** Of ₹162 L/month incremental revenue, about ₹87 L comes from keeping customers (UC2 service-churn retention ₹43.7 L, A2 save flow ₹43.7 L) and ₹4.7 L from prevented balance holds; growth streams (UC5 expansion, UC6, UC4, UC3) add ₹70 L after the overlap haircut. This matches the research: Country Delight's risk is losing satisfied-product customers to post-order friction.
3. **Support savings alone don't justify the investment** (₹17 L/month vs ₹26 L/month running cost in Base). The case rests on retention and subscription changes. That is why the pilot measures churn-after-incident against a control group, not only deflection.
4. **Margin and ARPU dominate sensitivity.** A ±25% change in contribution margin moves Year-1 net by ₹146 L; ARPU by ₹85 L; containment and cost per contact by ₹62 L each.
5. **Pricing matters for in-app scale.** At published per-session rates, more in-app users raise usage cost almost as much as revenue (adoption has the smallest swing, ₹20 L). An enterprise rate or a per-user component should be part of the commercial proposal for Phase 2.

## 3. Use-case contribution (Base, monthly run-rate)

| Stream | ₹ lakh | Share of revenue |
|---|---|---|
| UC2 delivery: service-driven churn retained | 43.7 | 27% |
| A2 save flow (pause instead of cancel) | 43.7 | 27% |
| UC5 subscription expansion (pre-haircut) | 59.4 | — |
| UC6 wellness cross-sell (pre-haircut) | 13.2 | — |
| UC4 incremental offers (pre-haircut) | 3.0 | — |
| UC3 AOV uplift (pre-haircut) | 2.5 | — |
| UC1/A1 balance holds prevented | 4.7 | 3% |
| Overlap haircut (10%) on UC3–UC6 | −7.8 | — |
| **Total incremental revenue** | **162.3** | 100% |

UC4 (offers) contributes little by design: only incremental conversions count, audiences are consent-limited, and the reviews show over-contact is already a risk.

## 4. How to use this in the meeting

- Present the **structure and the Base case as illustrative**, and offer to rebuild it with Country Delight's numbers in discovery.
- Put the **Conservative case on screen** as well. It shows we are not overselling, and it explains why the pilot exists.
- Ask for the five inputs that matter most: contribution margin, ARPU, support contacts by reason and cost per contact, monthly churn and its reasons, cancellation volume.
