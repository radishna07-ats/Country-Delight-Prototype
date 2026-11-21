# Integration Requirements

**These are proposed contracts for discussion, not Country Delight's API.** CD's actual endpoints are *not available in the supplied sources* (EV-064). Each tool maps to whatever CD already has; where nothing exists, CD decides whether to build it.

## 1. Read tools (server-side API tools: Graine → CD)

| Tool | Proposed request | Minimum response fields | Use cases | Phase |
|---|---|---|---|---|
| `get_customer_profile` | `customer_id` | first name, city, language, VIP status & benefit balance, delivery slot, doorstep preferences | All | Pilot |
| `get_wallet_summary` | `customer_id` | balance, low-balance threshold, Autopay/Smart Recharge status, days of deliveries covered | UC1, A1 | Pilot |
| `list_wallet_transactions` | `customer_id, from, to, amount?` | txn_id, timestamp, amount, direction, **type** (order/recharge/cashback/membership/fee/refund), **reference** (order_id / plan_id / offer_id), closing balance | UC1 | Pilot |
| `explain_transaction` | `txn_id` | linked order lines or plan terms, applicable rule id and text | UC1 | Pilot |
| `get_recharge_options` | `customer_id` | plans with amount, cashback schedule, conditions | UC1 | Pilot |
| `get_todays_delivery` / `get_order` | `customer_id, date` / `order_id` | lines, slot, status, status time, rider ETA (if any) | UC2, UC3 | Pilot |
| `get_proof_of_delivery` | `order_id` | delivered_at, photo URL (signed, short-lived), geo flag | UC2 | Pilot (if available) |
| `search_catalogue` | `query, pincode, date` | sku, name, size, price, member price, available, image | UC3, UC5, UC6 | Phase 2 |
| `list_subscriptions` / `list_vacations` | `customer_id` | sku, qty, frequency, start, status, price; vacation ranges | UC3, UC5 | Phase 2 |
| `list_eligible_offers` | `customer_id` | offer_id, name, products, benefit, validity, conditions, voiding rules | UC4, UC5 | Phase 3 |
| `recommend_products` | `tags[], exclude_allergens[]` | sku + nutrition/allergen attributes + reason | UC6 | Phase 3 |

## 2. Write tools (confirmed; in-app actions or server tools with verified identity)

| Tool | Request | Response | Tier | Idempotency |
|---|---|---|---|---|
| `add_to_cart` | sku, qty, date | cart lines, total | T1 | client request id |
| `update_subscription` | subscription_id, qty?, frequency?, effective_date | new state, price impact, offer impact | T2 | change id |
| `pause_subscription` / remove | subscription_id, from, to? / reason | state | T2 | change id |
| `create_vacation` / `end_vacation` | from, to | range, resume date | T2 | change id |
| `set_delivery_preferences` | ring_bell, call_before, voice_note | prefs | T2 | — |
| `create_support_ticket` | reason, order_id?, summary, transcript ref | case id, SLA | T0/T1 | conversation id |
| `request_resolution` | order_id, line, reason, chosen option | approved / declined + reason | T3 | case id |
| `request_wallet_refund` | amount (full balance less cashback) | reference, SLA | T3 | case id |
| `save_wellness_profile` | goals, diet, allergies, consent id | stored | T2 | — |

All writes return `ok | refused(reason) | error(reason)` so the agent can say exactly what happened (Graine action contract).

## 3. App integration (Phase 2)

| Item | Detail | Owner |
|---|---|---|
| SDK | Graine in-app SDK for CD's stack; pinned version; WebRTC module only if calls are used | CD mobile |
| Configure | `configure(publishableKey)` at launch; `identify(user_id)` after login and every launch; `setVariables(...)` | CD mobile |
| Server token | CD endpoint minting short-lived user tokens for Graine | CD back end |
| Screen context | `useGraineScreen` (or native equivalent) on Home, Product, My Subscriptions, Vacations, Orders, Transactions, CD Money, Account | CD mobile |
| Actions | 11 handlers (Enhanced Journey) registered on the screens that can perform them | CD mobile |
| Ayuh | Deep link from "Something else" to the Graine dock with context | CD (Ayuh owner) |
| Design | Dock and component look set in Graine dashboard to CD brand; no app release for changes | Graine |

## 4. Channel integration (Pilot)

| Item | Detail | Owner |
|---|---|---|
| Inbound voice | Route out-of-hours helpline (and optionally an IVR option) to Graine number / SIP | CD telephony |
| WhatsApp | CD WABA connected; templates approved; **two-way text agent support confirmed by Graine** (Capability #18) | CD marketing + Graine |
| Ticketing | Webhook/API into CD's ticketing; summary + transcript link | CD support tech |

## 5. Non-functional requirements (proposed targets, to agree)

| Area | Target |
|---|---|
| Read tool latency | p95 < 800 ms (agent speaks a holding line if slower) |
| Action handler | must answer < 6 s (Graine limit) |
| Component live content | < 8 s (Graine limit), fallback content defined |
| Availability | 99.5% for read APIs during 4:30–9:30 AM |
| Rate limits | per-customer and global limits agreed |
| Observability | correlation id per conversation in CD logs |
