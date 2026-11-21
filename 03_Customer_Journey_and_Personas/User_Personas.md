# User Personas

**Status: PROPOSED, evidence-informed.** Each persona is built from recurring review themes (N/P codes in [Customer_Review_Analysis](../01_Research_and_Discovery/Customer_Review_Analysis.md)) and observed app behaviour. Personas are not segments with known sizes. *Segment sizes: Not available in the supplied sources. Requires validation from Country Delight.* The names are fictional and the same customers appear in the prototype's demo data.

| | 1 · Daily household purchaser | 2 · Subscription-heavy family | 3 · Working professional | 4 · Health-conscious starter | 5 · Occasional buyer | 6 · Customer with a delivery problem | 7 · Senior / vernacular-first |
|---|---|---|---|---|---|---|---|
| **Prototype name** | Meera Iyer | Ananya Sharma (demo lead) | Rohit Verma | Kabir Malhotra | Sana Qureshi | Ananya on a bad morning | Mr. Raghunath (parent of a customer) |
| **Evidence** | P01, P02 dominant positives; Home date-strip use (A2) | Multiple subscriptions, VIP, Smart Recharge (A14, A21, A23); N03, N10 | Vacation/pause praise (P05); "travel frequently" reviews | Health-goal shelves (A31); "High Protein" SKUs; review on protein-milk claims | Price/VIP pressure (N01, N02); Instant mode (A27) | N06, N07, N08, N09 | Language-mismatch review (N09); "we are old age persons… give me delivery boy phone number" (P-review) |
| **Goals** | Milk every morning without thinking | Predictable household supply, control of spend | Zero effort; pause when travelling | Hit a protein goal with familiar foods | Get what's needed today at a fair price | Get it fixed *this morning* | Speak, not type; feel safe |
| **Behaviours** | Opens app rarely; uses date strip to add one-offs | Edits quantities around guests; watches wallet | Plans at night (before 11 pm cut-off) | Browses by goal; reads labels | Responds to offers; uses Instant | Checks My Orders at 5:30 AM; calls | Relies on a child to manage the app |
| **Pain points** | Price rises unnoticed (N01) | Unexplained deductions (N03); fear of unintended changes (N10) | Rigid vacation picker; app changes (F-09) | No allergy/diet filter; claims scepticism | VIP pop-ups (N02); minimum recharge (N04) | No one to talk to at 5:30 AM (F-04); slow refunds | Typing, English UI, IVR language |
| **Expectations** | Nothing breaks | Transparency, undo | Speed, memory of preferences | Honest product facts, no medical claims | Clarity on what an offer really gives | Status + action + case ID | Patience, Hindi/regional voice |
| **Graine opportunities** | Balance runway reminder (A1); price-change notice (A4) | UC1 explain-a-deduction; UC5 change cards | UC3 voice "pause from Monday to Sunday"; memory | UC6 wellness profile + filtered recommendations | UC4 opted-in offer explanation; UC1 VIP benefit balance | UC2 24×7 status, ticket, approved remedy | Voice-first UC2/UC3 in Hindi/Hinglish |
| **Revenue opportunity** | Fewer holds from low balance | Subscription expansion; retention | Pause instead of cancel (retention) | Cross-sell protein/wellness SKUs | Campaign conversion | Churn avoided | Retention of high-tenure households |
| **Must not** | Interrupt | Change anything without confirmation | Call at night | Give medical advice | Push VIP | Promise outcomes CD has not approved | Ask for OTP/PIN |

## Design principles derived from personas

1. **Optional, not imposed.** Personas 1 and 5 do not want an assistant. The agent stays docked and silent unless invoked or friction rules fire (cooldown, per-session cap; EV-044).
2. **Voice for intent, screen for confirmation.** Persona 3 and 7 speak; every change is confirmed on a visual card.
3. **Explain before you sell.** Persona 2 and 5 distrust money flows; offers are explained only on request or opt-in.
4. **Never medical.** Persona 4 receives product facts only, with a safety disclaimer, and allergens always exclude.
5. **Human path always visible.** Persona 6 must reach a person with the context already captured.
