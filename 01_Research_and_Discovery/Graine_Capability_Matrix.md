# Graine Capability Assessment

**Sources:** S1 (graine.ai docs and pricing, read 21 Nov 2026), S4 (dashboard recording), S6 (SDK integration thread with another client, Oct–Nov 2026), S7 (In-App & Avatar deck). Graine-stated performance numbers are labelled as such.

## Legend

- **Available today:** documented on graine.ai and/or seen working in S4/S6.
- **Configuration:** done in the Graine dashboard by Graine or CD; no CD code.
- **Integration:** needs CD engineering: APIs, SDK, handlers, credentials.
- **Proposed:** new for CD or future; must not be presented as existing.

## 1. Matrix

| # | Capability | Available today | Configuration required | Integration required | Proposed for CD | Evidence |
|---|---|---|---|---|---|---|
| 1 | Inbound & outbound **voice agents** on own numbers / SIP; per-second billing | ✅ | Agent prompt, voice, languages, calling window | Number porting or SIP trunk; CD helpline routing | UC1, UC2, UC4 voice | S1 home, /pricing; S4 03:28 |
| 2 | **Languages**: 18 on calls, 11 with mid-call switching; Voice Studio TTS 22 Indian + English; Hinglish | ✅ | Per-language voice/recognition/prompt | — | All channels | EV-041 |
| 3 | **Flow agents**: steps, fixed lines, rule branches, events, per-step tools & knowledge | ✅ | Flow design | Event sources from CD (optional) | Identity-first UC1/UC2; disclosure-first UC4 | EV-052; S4 00:28 |
| 4 | **API tools** (HTTPS calls mid-conversation) and **MCP tools** | ✅ | Tool definitions | **CD APIs reachable from Graine**, auth tokens | Wallet ledger, order status, ticket creation | /docs/tools |
| 5 | **Knowledge base** (document collections) | ✅ | Upload CD FAQ, policies | Owner for updates | Grounded policy answers (VIP, refunds, vacation) | S4 03:20 |
| 6 | **In-app agent SDK**: React Native, Android, iOS, Flutter, KMP, web; voice bar; WebView engine updates without app release | ✅ | Publishable key, allowed domains, appearance | **SDK in CD app + app release** | UC3, UC5, UC6 | EV-042; S6 msg 11, 21, 25 |
| 7 | **Screen context** (app reports structured fields per screen) | ✅ | — | **One hook per screen** in CD app | "What am I looking at?" grounding | /docs/in-app/screen-context |
| 8 | **Actions** (declared handlers: ok/refused/error, 6 s timeout, ≤24 per agent, undeclared refused) | ✅ | Declare actions in dashboard | **Handler per action in CD app**, calling CD back end | add_to_cart, update_subscription_qty, set_vacation, navigate, set_delivery_preference | EV-042 |
| 9 | **Components**: product lists, plan cards, quick actions, calendar slots; live content from CD API at show time (server-side, 8 s timeout, fallback) | ✅ | Design in Web components; enable "On screen" | **CD read endpoints (HTTPS, public)** for live content | **UC5 subscription cards, UC6 product recommendations** (whiteboard "web components") | EV-043; S4 03:40 |
| 10 | **Friction detection**: stalled, repeated error, looping screens, rage taps, incomplete submit, screen error; cooldown & per-session cap | ✅ | Rules per screen | Screen context already reported | Contextual offer on My Subscriptions / Vacation loops | EV-044; S4 02:36 |
| 11 | **Memory** per identified user across chat, voice, calls; user can view/erase; 7-day recent conversation | ✅ | Identity field, memory on | `identify()` with stable CD user id | Remembers preferences (e.g. allergies in UC6, with consent) | /docs/in-app/memory; S6 msg 25 |
| 12 | **Variables** (≤12 per conversation, ≤200 chars each) | ✅ | Prompt placeholders | `setVariables()` | Name, city, VIP status, wallet bucket | S6 msg 21 |
| 13 | **In-app calling** (WhatsApp-style, CallKit / full-screen), booking, scheduled calls | ✅ | Calls & scheduling settings | APNs/FCM credentials; WebRTC module | Not in pilot (optional "call me back") | S6 msg 11, 35 |
| 14 | **Your own UI** (headless SDK states for chat/talk/calls/components) | ✅ (SDK ≥0.14.3) | — | CD builds UI | Native CD look-and-feel | S6 msg 23, 25 |
| 15 | **Text chat surface** in native SDKs | ⚠️ Conflicting: architecture page lists RN + web "today"; S6 shows chat on KMP/iOS/Android | — | — | Confirm for CD stack | EV-049 |
| 16 | **WhatsApp calling** (voice inside WhatsApp Business) | ✅ (observed) | Meta phone number id, access token | CD WhatsApp Business Account | UC2 voice on WhatsApp | S4 03:36 |
| 17 | **WhatsApp messages** as a workflow step | ✅ (documented in outreach workflows) | Templates | CD WABA, approved templates, consent | UC2 status updates, UC4 follow-up | EV-050 |
| 18 | **WhatsApp conversational text agent** (two-way chat on WhatsApp) | ⚠️ Not established from sources (S5 deck proposes it; docs show workflow messages and WhatsApp calling) | — | — | **Requires Graine confirmation** before promising UC1/UC2 on WhatsApp chat | Gap |
| 19 | **Campaigns & outreach workflows** (retries, waits, HTTP, WhatsApp, SMS, email steps; outcomes) | ✅ | Workflow design, calling hours | CRM/segment source, webhooks | UC4 | EV-050 |
| 20 | **Compliance**: DNC list, opt-out capture, consent records API, data requests (export/erase), AI disclosure, recording notice, PII redaction | ✅ | Turn on; DNC import | Consent sync from CD | UC4 and all voice | /docs/data-and-privacy; S4 05:24 |
| 21 | **Calling hours** defaults (9 am–9 pm IST option) and per-agent calling window, quiet hours | ✅ | Set | — | Enforce no pre-dawn voice | /docs/calling-hours; S4 05:04 |
| 22 | **Security**: publishable key + allowed domains; single-use tickets; rate limits; on-device masking; server tokens; App Attest / Play Integrity | ✅ / ⚠️ attestation status conflicting | Security settings | Server-token endpoint at CD | Verified identity before account data | EV-046, EV-047, EV-048 |
| 23 | **Webhooks** (call/chat outcomes, transcripts, collected fields) and **records API** | ✅ | Endpoint | CD receiver | Ticket creation, analytics | /docs/webhooks; S4 03:52 |
| 24 | **Analytics & observability**: agent analytics, call history, call inspector, execution logs, evals, A/B testing, goals & outcomes | ✅ | Goals | Export to CD BI | Pilot measurement | S4 04:00, 04:28 |
| 25 | **Deployment**: shared cloud (India compute; US credentials; UK recordings), dedicated instance, own compute + Graine control plane | ✅ | — | Scoping for dedicated/own compute | Residency decision | EV-045 |
| 26 | **Avatar agent** | 🧪 Beta, by invitation | — | — | Not in scope | EV-054 |
| 27 | **Image/photo-based damage verification** | ❌ Not documented (chat `onAttach` exists for attachments per S6; automated photo verification against rider logs is not documented) | — | CD proof-of-delivery data, policy | **Proposed integration**, not a capability (UC2) | S6 msg 21; S5b claim EV-063 |
| 28 | **Payments by the agent** | ❌ By design: "leaves money moves to the user" | — | — | Never; agent prepares, customer pays in CD's flow | S7 slide 8 |
| 29 | **Pricing** | ✅ ₹6/connected min; ₹10/chat session ≤5 min; enterprise custom | — | — | Model inputs | EV-040 |

## 2. What Country Delight must provide (summary)

| Need | For | Owner |
|---|---|---|
| Read APIs: customer profile, catalogue (with availability by pincode/date), subscriptions, vacations, wallet ledger (with order/product/plan references), orders and delivery status, offers and eligibility | All use cases | CD back end |
| Write APIs: cart add, subscription create/update/pause/remove, vacation create/end, delivery preferences, ticket create, refund-request create | UC2, UC3, UC5 | CD back end |
| Identity: stable user id; server-token endpoint; phone-number match for WhatsApp/voice with OTP-free verification rules | All | CD back end + security |
| Mobile: SDK integration, screen-context hooks, action handlers, release | UC3, UC5, UC6 | CD mobile |
| Policy: canonical rules for refunds, replacements, credits, vacation, VIP, offers | UC1, UC2, UC4 | CD ops / legal |
| Consent & channels: WABA, templates, DLT, DNC, consent records | UC2, UC4 | CD marketing / legal |
| Data: nutrition attributes and allergen tags per SKU | UC6 | CD catalogue |

## 3. What Graine must implement

Agent design (prompt + flow) per use case; tool definitions against CD APIs; components (subscription card, product list, offer card, wallet explainer, vacation calendar); friction rules; knowledge base from approved CD policy; analytics goals; security configuration; test plan and evals; operational runbook.

## 4. Key limits to state honestly in the meeting

1. The agent can only do what CD's app and APIs expose; **undeclared actions are refused** by design.
2. Device-supplied identity is not proof. **Account data requires verified identity** (server token or in-app signed session).
3. Shared-cloud **recordings are stored in the UK**. Strict India residency means a dedicated instance or own compute.
4. **WhatsApp two-way text chat**, **native text chat per platform** and **attestation status** need confirmation from Graine product before they are promised.
5. Avatar is beta. Photo-based damage verification is not a documented capability.
