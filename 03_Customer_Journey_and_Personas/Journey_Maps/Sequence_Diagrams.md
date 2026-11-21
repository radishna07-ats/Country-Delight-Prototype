# Journey Maps — Sequence Diagrams

Mermaid diagrams (render on GitHub). Each shows who does what, where confirmation sits, and where a failure goes. Tool names are the proposed contract from [Enhanced_Journey.md](../Enhanced_Journey.md).

## UC1 · Explain a deduction (WhatsApp or in-app)

```mermaid
sequenceDiagram
  actor C as Customer
  participant G as Graine agent
  participant CD as CD back end
  C->>G: "Why was ₹500 deducted?"
  G->>CD: verify identity (session / registered number)
  CD-->>G: verified customer id
  G->>CD: list_wallet_transactions(amount=500, last 14 days)
  CD-->>G: 1 match: Smart Recharge Monthly Once, 18 Nov
  G->>CD: explain_transaction(txn_id)
  CD-->>G: rule: ₹25 cashback now, ₹100 over next 4 orders
  G-->>C: Explanation + wallet card (source row)
  C->>G: "I didn't want Smart Recharge"
  G-->>C: Options: pause plan (opens CD screen) · talk to a person
  Note over G,CD: Agent never pays, never asks for OTP/UPI PIN
```

## UC2 · Milk not arrived (5:40 AM)

```mermaid
sequenceDiagram
  actor C as Customer
  participant G as Graine agent
  participant CD as CD back end
  participant H as CD support (from 6 AM)
  C->>G: "Mera doodh abhi tak nahi aaya"
  G->>CD: get_todays_delivery()
  alt status = out for delivery
    CD-->>G: ETA window
    G-->>C: Status card + "I'll message you if it's late"
  else status = delivered
    CD-->>G: delivered 05:12, POD photo
    G-->>C: "Marked delivered at 5:12. Is anything at the door or gate?"
    C->>G: "Nothing"
    G->>CD: request_resolution(reason=not_received)
    CD-->>G: eligible: re-delivery by 9 AM | wallet credit
    G-->>C: Options card
    C->>G: Confirms re-delivery
    G->>CD: create_support_ticket + resolution
    CD-->>G: case CD-2611-0042
    G-->>C: Confirmation with case id
  else API unavailable
    G->>CD: create_support_ticket(callback 06:00)
    G-->>C: "I can't see the status right now; a person will call after 6 AM"
  end
  G->>H: ticket with transcript summary
```

## UC3/UC5 · Change a subscription with a component

```mermaid
sequenceDiagram
  actor C as Customer
  participant App as CD app + Graine SDK
  participant G as Graine agent
  participant CD as CD back end
  C->>App: (voice) "Add one more packet to my regular milk"
  App->>G: speech + screen context (Home)
  G->>CD: list_subscriptions()
  CD-->>G: Cow Milk 450 ml · Daily · Qty 1
  G->>App: show subscription_change_card (1 → 2, from Sat 22 Nov, +₹48/day)
  C->>App: taps Confirm
  App->>CD: update_subscription(id, qty=2) via action handler
  CD-->>App: ok
  App-->>G: action result ok
  G-->>C: "Done — 2 packets daily from Saturday." (Undo 2 min)
```

## UC4 · Consent-first offer conversation

```mermaid
sequenceDiagram
  participant W as Graine workflow
  participant CD as CD CRM / offers
  actor C as Customer
  W->>CD: eligible ∩ consented ∩ not DNC ∩ cap
  CD-->>W: audience + offer record
  W->>C: in-app card / opted-in WhatsApp (voice only if consented, 10 am–7 pm)
  C->>W: "What's the catch?"
  W-->>C: conditions verbatim from offer record
  alt interested
    W-->>C: product card → add / subscribe (UC5)
  else stop
    W->>CD: add to DNC, log opt-out
  end
```

## UC6 · Wellness onboarding

```mermaid
sequenceDiagram
  actor C as Customer
  participant G as Graine agent
  participant CD as CD catalogue
  C->>G: "I've started working out; recommend products"
  G-->>C: consent to remember goals & allergies? (skip allowed)
  G-->>C: goal / diet / allergy quick replies
  C->>G: High protein · Vegetarian · Peanut allergy
  G->>CD: recommend_products(tags=[high_protein, veg], exclude_allergens=[peanut])
  CD-->>G: SKUs with attributes
  G-->>C: product cards with "why" + "not medical advice"
  C->>G: "Add the paneer and protein milk"
  G->>CD: add_to_cart
```
