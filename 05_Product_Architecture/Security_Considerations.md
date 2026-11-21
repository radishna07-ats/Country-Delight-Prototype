# Security, Privacy & Governance

## 1. Principles

1. **The agent never has more authority than the customer's own signed-in app.** Account changes run through CD action handlers in the app session, or through server-side tools that require a CD-verified identity token. Graine documents that device-supplied traits are unverified and must not be used to authorise (EV-047).
2. **Confirmation scales with consequence** (tiers T0–T4, [Enhanced_Journey](../03_Customer_Journey_and_Personas/Enhanced_Journey.md)). The agent never pays (Graine design, S7 slide 8).
3. **No secrets in conversation.** The agent never requests or reads OTPs, UPI PINs, card numbers, CVV or bank account numbers; on-device masking replaces PAN/Aadhaar/card/phone/email before data leaves the phone (EV-046), with CD-specific mask rules for customer and order identifiers.
4. **Data minimisation.** Variables limited to what the conversation needs (≤12 by design); no full ledger dumps into the model; tool responses filtered server-side to the fields needed.
5. **Grounded or silent.** If a tool or the knowledge base does not return it, the agent does not say it.

## 2. Identity & authentication

| Channel | Verification | Notes |
|---|---|---|
| In-app | CD session → `identify(user_id)` + **server token** from CD back end | Bind key to app with App Attest / Play Integrity (status to confirm: EV-048) |
| WhatsApp | Sender number = registered number + CD rule (e.g. last order date or pincode challenge); no OTP read-aloud | [CC] CD's accepted verification method |
| Voice | Caller ID match + knowledge challenge; high-risk requests deferred to app or human | Same |

## 3. Authorisation matrix

| Action | In-app | WhatsApp | Voice | Confirmation | Limit |
|---|---|---|---|---|---|
| Read balance/ledger/order status | ✓ | ✓ verified | ✓ verified | — | last 90 days |
| Add to cart | ✓ | — | — | Result read-back | cart only |
| Change subscription / vacation | ✓ | ✓ verified (pilot: optional) | — | Explicit, card | per CD rules |
| Delivery preferences | ✓ | ✓ verified | ✓ verified | Explicit | — |
| Ticket creation | ✓ | ✓ | ✓ | — | — |
| Resolution request (credit/re-delivery) | ✓ | ✓ verified | ✓ verified | Explicit | CD policy service thresholds |
| Wallet refund request | ✓ | ✓ verified | → app/human | Explicit | CD process, bank details via CD link |
| Payment / recharge | **Never** | **Never** | **Never** | — | Customer in CD payment screen |

## 4. Data protection & DPDP

- **Roles:** CD = data fiduciary; Graine = data processor under a DPA (to be executed). Graine provides data-request tooling: export, correct, erase (EV-050).
- **Consent:** separate purposes for (a) service conversations, (b) memory, (c) promotional contact (UC4), (d) wellness profile (UC6). Consent records via Graine's consent API mirrored in CD's consent store. DPDP Rules phase-in: consent managers ~Nov 2026, main notice/consent obligations ~May 2027 (EV-073).
- **Retention:** recent conversation 7 days after the last message for identified users with memory on (EV-046); transcripts and recordings per CD policy; erase on request.
- **Residency:** shared cloud puts compute and call records in India (Mumbai), the credential store in the US, and **recordings in the UK** (third-party object storage). If CD requires India-only, use a **dedicated instance in an Indian region or CD compute with Graine control plane** (EV-045). Option: disable call recording in the pilot.
- **Sensitive data (UC6):** allergies and fitness goals may be treated as sensitive. Explicit consent, purpose limitation, no medical inference, easy deletion.

## 5. Outreach compliance (UC4)

AI disclosure at the start; promotional calls only to consented customers on the correct number series; no promotional content in service conversations (TRAI 2025 amendment: mixed content is promotional, EV-072); DNC enforced platform-wide; opt-out capture on; voice window 10 am–7 pm; frequency caps (e.g. ≤2 promotional touches per customer per month across channels, CD to set); campaign content approval workflow.

## 6. Reliability & failure handling

| Failure | Behaviour |
|---|---|
| Action handler timeout (6 s) or error | Agent says it was **not** done; offers retry or a person (Graine contract) |
| Tool/API down | No speculation; ticket + callback |
| Ambiguous intent | One clarifying question; never guess between products or dates |
| Customer declines confirmation | Nothing changes; agent confirms nothing changed |
| Duplicate request | Idempotency key per proposed change; second confirm shows "already done" |
| Undeclared action requested | Refused by SDK; agent explains what to tap instead |
| Network loss mid-call | SDK reconnects up to 10–30 s; conversation resumes (EV per S6) |

## 7. Audit & monitoring

Every conversation, tool call, action and result is logged (Graine call history, execution logs, friction timeline; hash-chained audit per S7 slide 13). Weekly evals on a fixed test set (hallucination, unauthorised action attempts, escalation correctness). Kill switch: disable the agent or a single action from the dashboard without an app release.

## 8. Human escalation

Always available by saying "person/agent/human", after two failed attempts, on any dispute, food-safety concern, repeat incident, abusive language, or a customer in distress. Handoff carries a summary, verified identity status, the screen/order, and what was already tried. Out of hours: ticket + callback at 6 AM.
