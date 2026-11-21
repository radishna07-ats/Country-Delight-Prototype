# Execution Plan

The steps follow the sequence in brief §17. Each step ended in a deliverable, not a plan. Status as of 21 Nov 2026.

| Step | Phase | Work | Output | Status |
|---|---|---|---|---|
| 1 | Source inventory | Opened every supplied file; read the recordings frame by frame; logged conflicts and missing information | [Source_Inventory.md](Source_Inventory.md) | ✅ Done |
| 2 | Research | CD website (rendered), Graine website and 30+ docs pages, 2,150 public app reviews collected (Play and App Store; all 633 one- and two-star reviews in the primary samples read and coded), competitors | [01_Research_and_Discovery](../01_Research_and_Discovery/) | ✅ Done |
| 3 | Audit and RCA | 31-screen app audit, friction register, root causes, executive findings | [02_Product_Audit_and_RCA](../02_Product_Audit_and_RCA/) | ✅ Done |
| 4 | Journeys | Personas, current and enhanced journeys, sequence diagrams | [03_Customer_Journey_and_Personas](../03_Customer_Journey_and_Personas/) | ✅ Done |
| 5 | Use cases | Six specifications plus A1–A7; prioritisation workbook | `Use_Case_Specifications.md`, `Opportunity_Prioritisation.xlsx` | ✅ Done |
| 6 | Solution | Architecture, integration requirements, data flow, security, pilot, roadmap | [05_Product_Architecture](../05_Product_Architecture/) | ✅ Done |
| 7 | Prototype | React/TypeScript app with a simulated back end, agent engine, voice, WhatsApp and call channels, demo mode and inspector | [06_Prototype](../06_Prototype/) | ✅ Done |
| 8 | Business case | Formula-driven model with three scenarios and sensitivity; assumptions; ROI | [04_Revenue_and_Financial_Model](../04_Revenue_and_Financial_Model/) | ✅ Done |
| 9 | Sales enablement | 30-slide deck, pitch script, CTO guide, demo script | [07_Sales_Enablement](../07_Sales_Enablement/) | ✅ Done |
| 10 | QA | Functional, edge-case, conversational, design, financial, privacy and claims QA; 21 defects fixed | [08_Quality_Assurance](../08_Quality_Assurance/) | ✅ Done |
| 11 | Meeting package | Deck, pitch, CTO guide, demo script, prototype run instructions, fallback screenshots | [07_Sales_Enablement](../07_Sales_Enablement/), [README](../README.md) | ✅ Done |

## After the meeting (proposed, depends on Country Delight)

| Step | Work | Needs |
|---|---|---|
| Discovery and alignment (≈3 weeks) | Replace illustrative inputs with CD data; API inventory; policy sign-off | CD metrics, API docs, policy owners |
| Technical preparation (≈4–6 weeks) | UC1 + UC2 on WhatsApp and out-of-hours voice in one city | CD ledger, order status and ticket APIs; WhatsApp number; telephony routing |
| Pilot run (≈1 week dogfood + 8 weeks) | Measure against a control group | Agreed success metrics (see [Pilot_Recommendation.md](../05_Product_Architecture/Pilot_Recommendation.md)) |
| Scale decision | Phase 2 (in-app SDK: UC3, UC5) and Phase 3 (UC4, UC6) | Pilot results; app release slot |

Durations are proposals and need confirmation from both teams. See [Implementation_Roadmap.md](../05_Product_Architecture/Implementation_Roadmap.md).
