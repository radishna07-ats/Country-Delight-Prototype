# Journey B — Graine-Enhanced Experience

**Design principle (§7.1 of the brief):** the existing app stays fully usable. The agent is one of five ways to get something done: normal navigation, chat, voice, a contextual suggestion (only when friction rules fire), or an interactive card. Nothing changes without an explicit confirmation, and a human is always one step away.

**Confirmation tiers** (consequence → control):

| Tier | Examples | Rule |
|---|---|---|
| T0 Information | balance, status, product facts, navigate | No confirmation; data shown from source |
| T1 Reversible cart change | add to cart | Execute, then show the verified result (cart is not checkout) |
| T2 Account change | subscription qty, pause, vacation, delivery preferences | **Explicit confirm** on a card showing current → proposed, effective date, price/offer impact; Undo offered |
| T3 Money request | refund request, re-delivery/credit request | Explicit confirm; **policy-bound**; CD back end decides; result read back |
| T4 Payment | pay, recharge | **Never by the agent.** The agent opens CD's payment screen; the customer pays |

## Proposed tool catalogue (contract to agree with CD; not CD's API)

Read: `get_customer_profile`, `get_wallet_summary`, `list_wallet_transactions`, `explain_transaction`, `get_recharge_options`, `get_todays_delivery`, `get_order`, `get_proof_of_delivery`, `search_catalogue`, `list_subscriptions`, `list_vacations`, `list_eligible_offers`, `recommend_products`.
Write (confirmed): `add_to_cart`, `update_subscription`, `pause_subscription`, `create_vacation`, `set_delivery_preferences`, `create_support_ticket`, `request_resolution`, `request_wallet_refund`, `save_wellness_profile`.
App: `navigate`, `handoff_to_human`.
That is 24 tools, exactly Graine's cap of 24 declared **in-app actions** per agent (EV-042). Recommended split: the 13 read tools run as **server-side API tools** (Graine → CD back end, Capability Matrix #4), and only the 9 writes plus `navigate` and `handoff_to_human` are **in-app actions** executed by CD's signed-in app (11 actions, leaving headroom). Voice and WhatsApp agents get a smaller, read-heavy subset ("one agent per surface", Graine docs).

---

## UC1 · Wallet & Smart Recharge

**Channels:** in-app (chat/voice), inbound voice, WhatsApp (subject to confirmation of WhatsApp text support, Capability Matrix #18).

| Stage | Current experience | Potential friction | Enhanced experience | Graine intervention | Expected outcome |
|---|---|---|---|---|---|
| Notice | Balance drops; Autopay SMS | Cause unclear | Customer asks "Why was ₹500 deducted?" from any screen or on WhatsApp | Intent: explain_deduction | Same-moment answer |
| Verify | — | — | In-app: signed-in session. Voice/WhatsApp: registered number + CD-approved verification, **never OTP or UPI PIN read aloud** | Flow step "identity first" (fixed line) | Account data only after verification |
| Retrieve | Ledger row only | No link | Ledger line joined to order/plan/rule | `list_wallet_transactions`, `explain_transaction` | Grounded explanation |
| Explain | — | — | "₹500 was your Monthly Once Smart Recharge on 18 Nov; ₹25 cashback now, ₹100 over the next 4 orders." with the source row shown on a card | Component: wallet_explainer | Trust restored |
| Next step | Ticket/call | Leaves app | Options: see all transactions · change Smart Recharge · request refund to bank (support process) · talk to a person | `navigate`, `request_wallet_refund` (T3), `handoff_to_human` | Fewer contacts |
| Recharge | Banner → CD Money | Minimums confusing | Agent explains options; opens CD's payment screen with the chosen plan | `get_recharge_options`, `navigate` (T4 customer pays) | Informed recharge |

- **Customer actions:** ask, pick a transaction, confirm a refund request, pay in CD's screen.
- **System actions:** ledger and rule lookup; refund request creation; deep link.
- **Agent actions:** classify intent, verify, retrieve, explain with citation, offer next steps.
- **Backend dependencies:** ledger API with references; recharge plan API; refund-request API; identity verification.
- **Confirmation:** T0 for explanations; T3 for refund requests.
- **Failure scenarios:** ledger API down → "I can't see your transactions right now" + ticket; transaction not found → ask for date/amount, never guess; ambiguous (two ₹49 rows) → show both.
- **Human escalation:** disputes, suspected double charge, any request outside rules → ticket with the transaction attached + callback.

## UC2 · Delivery issue resolution

| Stage | Current | Friction | Enhanced | Graine intervention | Outcome |
|---|---|---|---|---|---|
| Discover | Nothing at door 5:30 AM | Support closed | "My milk hasn't arrived" via app, WhatsApp or voice, 24×7 | Intent: delivery_issue | Immediate engagement |
| Verify | — | — | Session / verified number | Identity step | Safe |
| Status | My Orders may say Delivered | Conflict | Today's order card: items, slot, status, rider ETA or POD (photo/time) if CD exposes it | `get_todays_delivery`, `get_proof_of_delivery` | Facts, not guesses |
| Diagnose | — | — | Ask: missing all / missing item / wrong / damaged / leaking | Quick-reply component | Structured reason |
| Resolve | Ticket, call | 24–48 h | Offer **only CD-approved options** for that reason and customer: re-delivery (if slot available), wallet credit request, replacement next morning | `request_resolution` (T3) | Faster, policy-consistent |
| Record | — | — | Ticket with case ID, reason, evidence, transcript summary | `create_support_ticket` | No repeat explanation |
| Prevent | — | — | After doorstep complaints: offer "Call before delivery / Don't ring the bell / Voice instruction" | `set_delivery_preferences` (T2) | Fewer repeats (A3) |

- **Backend:** order and delivery status, POD, rider assignment (optional), ticketing, resolution policy service.
- **Failure:** status unavailable → do not speculate; create ticket and callback at 6 AM. Policy service says "not eligible" → explain and offer a human.
- **Photo of damage:** proposed integration (CD storage + review), not a current Graine capability.
- **Escalation:** high-value orders, repeat incidents (≥2 in 7 days), safety/food-quality concerns → human with context.

## UC3 · In-app conversational agent

| Stage | Current | Friction | Enhanced | Graine intervention | Outcome |
|---|---|---|---|---|---|
| Entry | Navigate menus | 2–7 taps | Persistent "Ask" dock; voice or chat; Ayuh "Something else" opens Graine with context | SDK launcher, `useGraineScreen` | Optional, contextual |
| Understand | — | — | "Add two packets of milk to my cart" | NLU + clarification ("Cow or buffalo, 450 ml?") | Fewer wrong items |
| Show | Grid | — | Product card component with qty | Component: product_list (live from catalogue API) | Visual confirmation |
| Act | ADD | — | Add to cart; cart badge updates; read back | `add_to_cart` (T1) | Verified result |
| Navigate | Menu | Buried | "Where can I see tomorrow's order?" → opens My Orders and highlights it | `navigate` | Found in one step |
| Contextual help | — | — | Friction rule (e.g. looping between My Subscriptions and product page 3× in 45 s) → one quiet suggestion chip | Friction detection, max 3 nudges/session | Help without interruption |

- **Failure:** product unavailable for tomorrow → say so, offer alternatives; handler timeout (6 s) → "That didn't go through" (never claim success).
- **Escalation:** "talk to a person" at any time.

## UC4 · Offer & promotion outreach (consent-first)

| Stage | Current | Friction | Enhanced | Graine intervention | Outcome |
|---|---|---|---|---|---|
| Audience | Human calls | Repeated calls | Eligible + consented + not on DNC + under frequency cap | Workflow eligibility step | Fewer, better contacts |
| Channel | Phone | Intrusive | In-app offer card or opted-in WhatsApp first; voice only where consent covers it, 10 am–7 pm | Workflow + calling window | Respectful |
| Message | Script | Terms unclear | AI disclosed; offer facts **only from the offer record**: name, products, benefit, validity, conditions (e.g. "changing frequency voids 4+4") | Flow fixed lines + variables | Fewer disputes |
| Respond | — | — | "Show me the products" → product card; "Not interested" → logged; "Stop" → DNC immediately | Components; DNC API | Measured, compliant |
| Measure | — | — | Verified redemption vs control group | Goals & outcomes | Incrementality |

- **Hard rules:** never invent a discount or eligibility; promotional content never mixed into service calls (TRAI, EV-072); opt-out honoured on the spot.

## UC5 · Conversational subscription management (web components)

| Stage | Current | Friction | Enhanced | Graine intervention | Outcome |
|---|---|---|---|---|---|
| Intent | My Subscriptions → EDIT | 3 surfaces | "Add one more packet of milk to my regular subscription" from any screen | Intent: change_subscription | No screen hopping |
| Identify | Customer finds card | — | Agent finds the matching subscription; asks if ambiguous | `list_subscriptions` | Correct target |
| Propose | Stepper | Consequences hidden | **Subscription change card**: product · current qty → proposed · effective date (respecting 11 pm cut-off) · price per delivery and per month · offer impact (e.g. 4+4 voids) · Confirm / Cancel | Component: subscription_change_card (live from CD API) | Informed decision |
| Confirm | CONFIRM | No undo | Tap Confirm; card shows "Updated, effective Sat 22 Nov"; Undo for 2 minutes | `update_subscription` (T2) | Confidence |
| Other changes | Scroll for PAUSE/REMOVE | Removal has no save | "Stop my curd" → ask reason → offer pause/vacation/qty change → if still remove, confirm removal | A2 save flow, `pause_subscription` | Retention |
| Add products | Add More carousel | — | "Also add paneer every Sunday" → product card → weekly subscription card → confirm | `search_catalogue`, `update_subscription` | Expansion |

- **Backend:** subscription read/write per operation; pricing; offer-eligibility; cut-off rules.
- **Failure:** write refused (e.g. after cut-off) → show the rule and the next possible date.

## UC6 · Personalised wellness & product discovery

| Stage | Current | Friction | Enhanced | Graine intervention | Outcome |
|---|---|---|---|---|---|
| Entry | Health-goal shelf | Generic | "Your Wellness Journey" section + "I've started working out" | New section (CD app) + agent | Guided |
| Consent | — | — | Plain-language consent to store goals, diet and allergies for recommendations; skip allowed | Consent record | DPDP-ready |
| Profile | — | — | Goals (protein, gut health…), diet (veg/egg/vegan), allergies (lactose, nuts, gluten…), preferences | Quick-reply components; `save_wellness_profile` | Personal |
| Recommend | Shelf | No "why" | Products from the **catalogue's own attributes** only; each with "why recommended" and allergen-safe check; allergens **always exclude** | `recommend_products` | Relevant, safe |
| Bundle | — | — | Suggested morning bundle (e.g. high-protein milk + paneer + Greek yogurt) with price | Component: bundle_card | Basket growth |
| Act | ADD | — | Add to cart or subscribe via UC5 card | `add_to_cart`, `update_subscription` | Conversion |
| Safety | — | — | "Not medical advice"; medical conditions → suggest a qualified professional; no calorie or diet prescriptions | Flow guardrail step | Safe |

- **Backend:** nutrition and allergen attributes per SKU (**gap**, EV-036 / Q8); consent store.
- **Failure:** missing nutrition data → don't claim values; show product page facts only.
