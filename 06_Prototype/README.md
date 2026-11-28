# Prototype — Country Delight app with a Graine AI assistance layer

An interactive, presentation-ready prototype of the Country Delight app with the proposed Graine agent: in-app chat and voice, WhatsApp and phone-call simulators, and a presenter shell that launches every use case and shows every tool call.

> **Simulated, not connected.** The Country Delight back end, the agent's language understanding and the channels are simulated locally. No Graine agent, Country Delight system, WhatsApp account or phone line is connected. The customer, address, prices and offers are fictional or illustrative. The prototype shows the *intended experience and controls*, not production readiness.

![Presenter view](screenshots/00_presenter_view.png)

## Run it

**No install needed:**

- **Hosted:** https://claude.ai/artifact/6PBj2aEbdkCtro7HiFwXC8 (private until shared from the page's Share menu). Voice uses claude.ai's dictation: the first mic tap asks once, and the answer is kept for this page (Chrome or Edge, signed-in members of your organization). Add `#present` to the link for presentation mode.
- **Offline:** open [`Demo_Standalone.html`](Demo_Standalone.html) in Chrome or Edge by double-clicking it. It is the same build inlined into one file and passes the same 19 end-to-end tests. Regenerate it with `npm run standalone`.

**From source** (requires Node 18+, tested on Node 22):

```bash
cd 06_Prototype/Source_Code
```

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. For a meeting, build once and serve the static build (works offline except the web font):

```bash
npm run build && npm run preview
```

Then open http://localhost:4173 (`?present` opens presentation mode).

| Layout | What you see |
|---|---|
| Desktop ≥ 1280 px | Scenario launcher · phone · agent-activity inspector |
| Laptop 700–1280 px | Phone + buttons that open the scenarios / inspector drawers |
| Phone < 700 px | Full-screen app; a floating **Demo** button opens the drawers |
| Presentation mode (**P** or `?present`) | Phone only, centred |

## Demo scenarios (left panel)

| # | Use case | What to show | Start line (auto-played) |
|---|---|---|---|
| 1 | UC3 | Add to cart, with clarification and cart read-back | “Add two packets of milk to my cart.” |
| 2 | UC5 | Subscription change card: now → new, effective date, price, offer impact, Confirm, Undo | “I want to add one more packet of milk to my regular subscription.” |
| 3 | UC3 | Voice: pause deliveries, rule-checked dates, on-screen confirmation | “Pause my delivery for the next three days” |
| 4 | UC1 | Explain a ₹500 deduction from the ledger (Autopay top-up) | “Why was ₹500 deducted from my wallet?” |
| 4w | UC1 | Same agent on WhatsApp | “Why was ₹500 deducted?” |
| 5 | UC2 | 5:40 AM, order marked delivered: proof of delivery, policy options, case ID | “My milk hasn't arrived.” |
| 5w | UC2 | Hinglish on WhatsApp | “mera doodh abhi tak nahi aaya” |
| 5c | UC2 | Out-of-hours helpline call with identity check | tap the suggested lines |
| 6 | UC6 | Wellness: consent, goal, diet, allergy, allergen-safe suggestions, bundle | “I have started working out. Recommend products.” |
| 7 | UC4 | Campaign console: per-channel eligibility (consent, DNC, cap, window), push → offer → STOP | use the three buttons |
| 8 | UC3 | Friction: open Set Vacation and wait 20 s → one quiet suggestion | — |
| 9 | Ayuh | Ayuh tree kept; hand over to the assistant with context | — |

**Controls:** Reset data · Restart chat · Home · demo clock (before / after the 11 pm cut-off, 5:40 AM delivery window, 11 AM campaign window) · *Fail next tool call* (fault injection) · *Slow network* · *Speak replies*.

**Inspector:** every intent, API tool, in-app action, component, rule check, friction signal, workflow step and guardrail, with tier (T0–T4), latency and arguments.

## The in-app agent: screen-aware, operating the app

The assistant follows the in-app agent model in Graine's dashboard recording (*Embed & Widgets → Actions / On screen / Appearance → Assistant bar*): the agent **sees the customer's screen** through structured fields the app reports, and **acts through declared actions** the app implements (Navigate, Fill a field, Highlight, tap). It does not answer with instructions; it does the task in the app.

**How screen context is detected** (`src/operator/screen.ts`). On every turn, and again after every action, the agent reads the live rendered app:

- which screen and title are showing;
- every input with its current value;
- every button, switch and navigation target, with its label, whether it's disabled and whether it's in view;
- every product on screen, with price, rating, number of ratings, size, stock and how many are already in the cart.

Screens expose this through `data-agent-*` attributes, the prototype's version of Graine's "screen reporting via structured fields". The snapshot is logged in the inspector (**SCREEN** rows) and resolves references such as "this", "the first one" and "the cheapest one".

**How it interacts with the UI** (`src/operator/actions.ts`, `operator.ts`). Each goal runs as a loop: observe, choose, act, observe again to verify.

- **Actions:** `tap`, `fill` (typed character by character), `goTo` (through the bottom bar, Menu or on-screen links, falling back to the app's Navigate handler), `scroll`, `goBack` and `highlight`.
- **Visibility:** a green ring shows what the agent is touching, and a step line ("Typing "protein powder" into search…") with **Stop** sits in the bar.
- **Verification:** results are checked on screen. For example, an add is only reported once the cart count on screen has changed; if it hasn't, the agent says nothing was added.
- **Safety tiers, enforced in the action layer:**
  - T4 buttons (Pay, Place order, Recharge) are never pressed.
  - T2 buttons (Confirm or Update subscription, Remove, Pause) need the customer's confirmation.
  - Account changes keep using the confirmation cards.

| Say | What the agent does in the app |
|---|---|
| "Find me a protein powder under ₹2,000 and add the best-rated option to my cart." | Opens search → types → taps *Top rated* → reads prices and ratings → skips the ₹2,974 tub over budget → taps ADD on the best-rated one under ₹2,000 → checks the cart badge → confirms with the reason |
| "Add two packets of milk to my cart" | Opens the milk options, asks which one (usual first), then taps ADD twice |
| "Open greek yogurt" → "Add two of this to my cart" | Opens the product page; switches it to one-time, sets the quantity to 2, presses *Add to cart* |
| "Show me paneer under 120" → "Add the first one" | Searches, then resolves "the first one" from the results on screen |
| "Remove the protein powder from my cart" · "Change the paneer in my cart to 3" | Opens the cart and uses that line's − / + controls |
| "Open my subscriptions" | Taps Menu › My Subscriptions |
| "What's on this screen?" · "Tap top rated" · "Type almonds into the search box" · "Scroll down" · "Go back" | Describes, taps, types, scrolls, goes back |

**The assistant's UI** (`src/agent-ui/AgentSheet.tsx` → `AgentDock`).

- **Compact (default):** a bottom bar with input, mic, expand and close; one reply bubble and suggestion chips above it. There's no backdrop, so the app stays visible and usable.
- **Expanded:** opens on its own when a component needs room (subscription, vacation, refund or resolution cards, product lists, wellness steps). It folds back into the bar about 2 seconds after the card is confirmed or cancelled. The customer can expand or collapse it at any time.
- **Voice:** listening happens inside the bar, not on a separate screen.

**Voice-first conversation** (`src/agent-ui/conversation.ts`).

- **Speaks to communicate, not to narrate** (`src/agent/speechPolicy.ts`, the single place that decides).
  - Every assistant message carries speech metadata:
    - **conversational:** acknowledgements, questions, clarifications, explanations, confirmation requests, issues;
    - **final:** the outcome of a task;
    - **operational:** background progress;
    - **silent.**
  - Only conversational and final messages enter the speech queue.
  - The step line ("Typing…", "Sorting…", "Adding…"), screen changes and tool calls are operational. They stay visible but have no path to the voice.
  - Typical turn:
    1. "Sure! I'll find the best-rated option within your ₹2,000 budget and add it to your cart." (spoken)
    2. The work happens silently on screen.
    3. "Done! I've added the best-rated whey protein powder within your ₹2,000 budget to your cart. It's Whey Protein Powder — Unflavoured, at ₹1,614." (spoken)
  - Supporting facts (size, rating, the pricier option it skipped, cart total, the route taken) go in a smaller **detail** line under the caption, which is never spoken. So the spoken words and the caption always match exactly.
  - Spoken messages are queued in order, are never cut off by a later update, and are never queued twice.
  - Sentences are highlighted as they're spoken. Only pronunciation is normalised ("₹1,614" is read as "1,614 rupees", "★4.6" as "4.6 stars").
  - Each decision is logged in the activity inspector ("speech: spoken (final)…" or "shown only").
  - The speaker button mutes the voice.
- **Hands-free.** One tap on the mic starts a conversation that loops: listen, detect the end of speech, process, answer aloud, listen again. It needs no more taps.
  - It ends when the customer says "that's all", "bye" or "I'm done", taps End, or stays silent for two turns. In the silent case the assistant says it will stop listening.
- **States in the bar:**
  - **Listening:** a live mic-level meter.
  - **Thinking or Working:** while it processes or works in the app.
  - **Speaking:** tap to interrupt.
  - **Muted:** the mic is paused.
- **Interruptions:**
  - Tap the mic or the bar while it speaks.
  - Or just start talking. Voice-activity detection on the mic stream interrupts the assistant; steady background noise and the assistant's own echo are filtered out.
  - Say "stop" during a task (hosted page), or tap Stop on the step line.
- **No duplicates.** While the assistant is working, anything heard is ignored except "stop", and a repeated recognition within 3 seconds is dropped. A task can't be triggered twice.
- **Failures.**
  - If the speech engine has no voices, the captions continue without waiting.
  - If the speech service can't be reached, the assistant retries once, then ends the conversation.
  - If the microphone is blocked, it explains how to allow it.

**Microphone** (`src/agent-ui/voice.ts`):

- The Permissions API is checked first, and `getUserMedia()` is called once per page session.
- The stream is kept, with its track disabled between turns, and passed to `SpeechRecognition.start(track)` where supported. Repeated mic taps don't ask again.
- If the permission is denied or revoked, the stream is released and the bar explains how to allow the microphone from the address bar.
- During a hands-free conversation the stream stays live between turns; it is released when the conversation ends.
- On the hosted page, claude.ai's dictation is used instead. It asks once per page.
- **On a double-clicked file, Chrome can't remember the answer after the page is closed:** it asks once per page load. For a permanent grant, serve the demo (`npm run preview`, http://localhost) or use the hosted link.

## Free-form things to try

“How much money is left in my CD Money wallet?” · “Why was ₹999 deducted?” (not invented) · “Refund my wallet balance to my bank” · “Please don't ring the bell” · “Stop my curd” (save flow) · “Change my coconut water to daily” (offer-void warning) · “Add paneer every Sunday” · “Any offers for me?” · “I have diabetes, what should I eat?” (safety) · “I want to talk to a person” · “kal se 3 din doodh band kar do”.

Voice uses the browser's Web Speech API (Chrome or Edge), or claude.ai dictation on the hosted page. Where neither is available, tap-to-speak phrases simulate it.

## What is real vs simulated

| Part | In this prototype | In production |
|---|---|---|
| App screens | Re-created from the recorded app (v10.9.100), original illustrations | Country Delight's app, unchanged |
| Agent understanding | Rule-based English/Hinglish parser (`src/agent/nlu.ts`) | Graine model runtime |
| Agent orchestration | `src/agent/engine.ts` (flows, tiers, guardrails) | Graine flow agents / prompt agents |
| Screen context and in-app actions | `src/operator/` reads the rendered app and acts on it (tap, type, navigate, verify) | Graine SDK screen reporting + the app's declared action handlers |
| Product ratings, protein powders | Illustrative attributes and three illustrative SKUs added for the operator demo; not observed in CD's app | CD catalogue API |
| Tools | `src/backend/api.ts` against a local store | Graine API tools + CD back-end endpoints; in-app actions via the Graine SDK |
| Business rules | `src/backend/rules.ts`: 11 pm cut-off, 60-day vacation, charge after delivery, Autopay lag, refund rules (from CD's public FAQ/app); resolution policy is a **prototype policy** | CD's rule and policy services |
| Voice | Browser speech recognition and synthesis | Graine voice stack |
| WhatsApp / calls | UI simulators | Graine WhatsApp / telephony with CD's accounts and numbers |
| Persistence | `localStorage` (reset in the panel) | CD systems of record |

## Code map

```
Source_Code/
  src/data/        types, catalogue (illustrative prices), seed (fictional customer, consistent ledger)
  src/backend/     rules.ts · api.ts (simulated tools) · store.ts (persisted state, inspector log)
  src/agent/       nlu.ts · engine.ts (conversation engine) · speechPolicy.ts (what is spoken)
  src/operator/    screen.ts (screen context) · actions.ts (tap, fill, navigate, highlight, tiers) · operator.ts (goal planner)
  src/agent-ui/    AgentSheet (AgentDock: compact bar ⇄ expanded panel) · Cards (components) · Channels (WhatsApp, call) · voice.ts (persistent mic, dictation) · conversation.ts (spoken captions, hands-free loop, voice activity)
  src/screens/     Shop (Home, Products, Product, Cart) · Account (Subscriptions, Edit, Vacations, CD Money, Transactions, Orders, Account & Preferences, Menu, Offers, History) · Wellness · Ayuh
  src/demo/        scenarios.ts · Panels (scenario launcher, controls, inspector)
  tests/unit/      108 tests: NLU, dates, rules, all six scenarios, guardrails, the operator against the rendered app (jsdom), speech policy
  tests/e2e/       29 Playwright tests through the real UI (incl. operator, compact dock, microphone, speech policy across all journeys, hands-free loop); screenshot capture
```

## Checks

```bash
npm run typecheck && npm test
```

```bash
npm run build && npm run test:e2e
```

Latest results: [Test_Results.md](Test_Results.md).
