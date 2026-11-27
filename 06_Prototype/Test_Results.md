# Prototype Test Results

**Run:** 2026-11-27 12:03 UTC · Node 22 · Chromium (Playwright) · Vite 5.4.11

| Suite | Passed | Total |
|---|---|---|
| Unit & scenario tests (Vitest) | 100 | 100 |
| End-to-end UI tests (Playwright) | 24 | 24 |
| TypeScript strict typecheck | pass | — |
| Production build | pass | — |

## End-to-end UI tests

| ID | Test | Result | Time |
|---|---|---|---|
| E01 | Home renders seeded state (wallet ₹395, tomorrow 3 items) | ✅ PASS | 0.1s |
| E02 | UC3 Scenario 1: add two packets of milk → cart badge 2 | ✅ PASS | 4.1s |
| E03 | UC5 Scenario 2: confirm subscription change, reflected in My Subscriptions, undo restores | ✅ PASS | 3.3s |
| E04 | UC3 Scenario 3: vacation for next three days via voice card → Vacations screen | ✅ PASS | 2.2s |
| E05 | UC1 Scenario 4: ₹500 explained as Autopay from ledger (₹78 below ₹200) | ✅ PASS | 1.2s |
| E06 | UC1: unknown amount is not invented | ✅ PASS | 0.8s |
| E07 | UC2 Scenario 5: status + POD → policy options → confirm → case created and listed in history | ✅ PASS | 4.7s |
| E08 | UC2 WhatsApp Hinglish: Hinglish reply with order status | ✅ PASS | 2.2s |
| E09 | UC2 inbound call: verification before account data, then status | ✅ PASS | 1.8s |
| E10 | UC6 Scenario 6: consent → goal → diet → peanut allergy → peanut butter excluded | ✅ PASS | 2.1s |
| E11 | UC4 campaign: voice skipped without consent; in-app push → offer; STOP withdraws consent | ✅ PASS | 1.4s |
| E12 | Ayuh coexistence: Something else → assistant opens with Ayuh context | ✅ PASS | 0.5s |
| E13 | Guardrail: fault injection on confirm → 'nothing was changed', state unchanged | ✅ PASS | 2.3s |
| E14 | Guardrail: declining a change leaves data unchanged | ✅ PASS | 1.5s |
| E15 | Manual app flow: Set Vacation sheet blocks > 60 days and accepts a valid range | ✅ PASS | 1.5s |
| E16 | Persistence: subscription change survives a reload; Reset restores seed | ✅ PASS | 4.6s |
| E17 | Friction: looping My Subscriptions ×3 in 45 s shows one quiet suggestion | ✅ PASS | 0.4s |
| E18 | Mobile viewport (390×844): app fills screen, no horizontal scroll, demo button present | ✅ PASS | 1.7s |
| E20 | Operator: “protein powder under ₹2,000, best-rated, add to cart” is done in the app (search, sort, filter, tap, verify) | ✅ PASS | 4.4s |
| E21 | Context: on a product page, “add two of this” uses that product and the page's own controls | ✅ PASS | 5.7s |
| E22 | Compact dock: app stays visible and usable while the assistant is active | ✅ PASS | 0.4s |
| E23 | Expanded state: opens for a component card, collapses on request and returns to the compact bar | ✅ PASS | 2.0s |
| E24 | Microphone: permission requested once, stream reused across mic taps; denied state explains how to enable | ✅ PASS | 7.6s |
| E19 | No uncaught page errors during the run | ✅ PASS | 0.0s |

## Unit and scenario tests

| Result | Test |
|---|---|
| ✅ | nlu.test.ts > intent classification — brief scenarios > Add two packets of milk to my cart. → add_to_cart |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Increase my daily milk quantity → change_subscription |
| ✅ | nlu.test.ts > intent classification — brief scenarios > I want to add one more packet of milk to my regular subscription. → change_subscription |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Pause my delivery for the next three days → vacation |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Pause my deliveries next week → vacation |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Why was money deducted? → wallet_deduction |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Why was ₹500 deducted from my wallet? → wallet_deduction |
| ✅ | nlu.test.ts > intent classification — brief scenarios > My milk hasn't arrived. → delivery_issue |
| ✅ | nlu.test.ts > intent classification — brief scenarios > mera doodh abhi tak nahi aaya → delivery_issue |
| ✅ | nlu.test.ts > intent classification — brief scenarios > I have started working out. Recommend products. → wellness |
| ✅ | nlu.test.ts > intent classification — brief scenarios > How much money is left in my CD Money wallet? → wallet_balance |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Where can I see tomorrow's order? → tomorrow_order |
| ✅ | nlu.test.ts > intent classification — brief scenarios > What is Smart Recharge? → smart_recharge |
| ✅ | nlu.test.ts > intent classification — brief scenarios > My payment failed → payment_failed |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Refund my wallet balance to my bank → wallet_refund |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Please don't ring the bell → delivery_prefs |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Stop my curd → remove_subscription |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Add paneer every Sunday → add_subscription |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Any offers for me? → offers |
| ✅ | nlu.test.ts > intent classification — brief scenarios > I want to talk to a person → human |
| ✅ | nlu.test.ts > intent classification — brief scenarios > I have diabetes, what should I eat? → medical |
| ✅ | nlu.test.ts > intent classification — brief scenarios > open my subscriptions → navigate |
| ✅ | nlu.test.ts > intent classification — brief scenarios > Pause my coconut water for 3 days → pause_subscription |
| ✅ | nlu.test.ts > intent classification — brief scenarios > yes → yes |
| ✅ | nlu.test.ts > intent classification — brief scenarios > My recharge cashback was not received → cashback |
| ✅ | nlu.test.ts > intent classification — brief scenarios > How does VIP benefit work? → vip |
| ✅ | nlu.test.ts > entities > quantity from words and digits |
| ✅ | nlu.test.ts > entities > one more → delta +1 |
| ✅ | nlu.test.ts > entities > generic milk is flagged for clarification |
| ✅ | nlu.test.ts > entities > specific milk is not generic |
| ✅ | nlu.test.ts > entities > amount |
| ✅ | nlu.test.ts > entities > weekly frequency with weekday |
| ✅ | nlu.test.ts > entities > product specificity: buffalo milk beats milk |
| ✅ | nlu.test.ts > entities > product specificity: greek yogurt beats yogurt/dahi |
| ✅ | nlu.test.ts > date resolution > cut-off: before 11 pm → tomorrow; after → day after |
| ✅ | nlu.test.ts > date resolution > next three days starts at first changeable date |
| ✅ | nlu.test.ts > date resolution > next week = Monday to Sunday |
| ✅ | nlu.test.ts > date resolution > from monday to sunday |
| ✅ | nlu.test.ts > date resolution > hinglish: kal se 3 din |
| ✅ | nlu.test.ts > vacation rules > rejects > 60 days |
| ✅ | nlu.test.ts > vacation rules > rejects start before cut-off date |
| ✅ | nlu.test.ts > vacation rules > accepts valid range and gives resume date |
| ✅ | nlu.test.ts > vacation rules > rejects overlap |
| ✅ | nlu.test.ts > date edge cases > 28 Nov to 3 Dec keeps the start in November |
| ✅ | nlu.test.ts > date edge cases > 28th to 3rd rolls the end into the next month |
| ✅ | nlu.test.ts > date edge cases > reversed explicit dates are flagged, not repaired |
| ✅ | nlu.test.ts > date edge cases > a second request in one message is detected |
| ✅ | nlu.test.ts > in-app operator intents > find with price ceiling, rating preference and add |
| ✅ | nlu.test.ts > in-app operator intents > search without adding |
| ✅ | nlu.test.ts > in-app operator intents > screen, tap, type, scroll, back |
| ✅ | nlu.test.ts > in-app operator intents > references to what is on screen |
| ✅ | nlu.test.ts > in-app operator intents > cart changes |
| ✅ | nlu.test.ts > in-app operator intents > existing intents are unaffected |
| ✅ | engine.test.ts > Scenario 1 — product discovery: add two packets of milk > clarifies the milk, then adds after the customer taps Add |
| ✅ | operator.test.ts > screen context > reads the live screen: route, inputs, products with price and rating |
| ✅ | operator.test.ts > screen context > answers “what's on this screen?” from what is rendered |
| ✅ | operator.test.ts > operating the app > find protein powder under ₹2,000, add the best-rated: searches, sorts, filters by price, taps Add, verifies |
| ✅ | operator.test.ts > operating the app > cheapest + quantity |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > shows current → proposed, executes only on confirm, supports undo |
| ✅ | operator.test.ts > operating the app > nothing within budget: says so and adds nothing |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > 'one more packet' adds one to the current quantity |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > declining changes nothing |
| ✅ | operator.test.ts > operating the app > ambiguous “milk”: puts the options on screen, asks, then adds the chosen one through the app |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > changing coconut frequency warns that the 4 pe 4 offer is voided |
| ✅ | engine.test.ts > Scenario 3 — vacation > resolves next three days, respects cut-off, updates orders |
| ✅ | engine.test.ts > Scenario 3 — vacation > refuses more than 60 days |
| ✅ | operator.test.ts > operating the app > “this” on a product page: switches to one-time, sets quantity, presses Add to cart |
| ✅ | operator.test.ts > operating the app > “the first one” resolves against the products on screen |
| ✅ | engine.test.ts > Scenario 4 — wallet > explains the ₹500 as a UPI Autopay top-up using ledger data |
| ✅ | operator.test.ts > operating the app > removes and changes cart items through the cart's own controls |
| ✅ | operator.test.ts > operating the app > navigates through the UI (Menu › My Subscriptions), not by jumping |
| ✅ | engine.test.ts > Scenario 4 — wallet > lists recent debits and explains the latest from the order |
| ✅ | operator.test.ts > operating the app > on a subscription screen, “this” is that subscription |
| ✅ | engine.test.ts > Scenario 4 — wallet > never invents an unknown deduction |
| ✅ | operator.test.ts > guardrails in the action layer > never presses Place order (T4) |
| ✅ | engine.test.ts > Scenario 4 — wallet > balance with runway |
| ✅ | operator.test.ts > guardrails in the action layer > the action layer itself refuses T4, even if asked directly |
| ✅ | operator.test.ts > guardrails in the action layer > needs confirmation before pressing an account-changing button (T2) |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > shows status + POD, offers policy options, creates a ticket |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > Hinglish input gets a Hinglish reply |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > status service down → no guessing, ticket + callback |
| ✅ | operator.test.ts > guardrails in the action layer > a failed add is reported, not claimed |
| ✅ | operator.test.ts > guardrails in the action layer > Stop halts the operator |
| ✅ | engine.test.ts > Scenario 6 — wellness > asks consent, goal, diet, allergy; excludes allergens; adds safety note |
| ✅ | engine.test.ts > Scenario 6 — wellness > medical questions get a safety response |
| ✅ | engine.test.ts > Guardrails > failed write: says nothing changed and offers retry |
| ✅ | engine.test.ts > Guardrails > human handoff creates a case |
| ✅ | engine.test.ts > Guardrails > cancellation save flow offers alternatives before removing |
| ✅ | engine.test.ts > Guardrails > duplicate confirmation does not apply the change twice |
| ✅ | engine.test.ts > Guardrails > unavailable product is refused with a reason, cart unchanged |
| ✅ | engine.test.ts > Guardrails > asking the agent to pay is refused (T4) and routed to the customer's own screen |
| ✅ | engine.test.ts > Guardrails > ambiguous request asks a clarifying question instead of guessing |
| ✅ | engine.test.ts > Guardrails > unrecognised request falls back with options and a human path |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > empty cart: says so and offers a next step |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > cart read-back lists items and total, never checks out |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > customer changes their mind before confirming: the old proposal is withdrawn |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > conflicting / combined instructions: one change at a time, second request kept as a chip |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > invalid dates (end before start) are not guessed |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > quantity 0 offers pause or remove instead of a change |
| ✅ | engine.test.ts > Edge cases (brief §14.2) > unusually large quantity is not set automatically |

## Defects found by testing and fixed

| # | Defect | Found by | Fix |
|---|---|---|---|
| D-01 | Wallet explanation named the wrong trigger balance (₹41 on 19 Nov instead of ₹78 on 18 Nov before the mandate notice) | Unit test, scenario 4 | Trigger = latest balance below the limit **before** the mandate-notice time |
| D-02 | “Checked, nothing there” read as *found it* (matched “there”) | Unit test, scenario 5 | Negative phrases checked first |
| D-03 | “Working out” not recognised as wellness intent | Unit test | Pattern extended |
| D-04 | Recharge-cashback question routed to delivery issue (“not received”) | Code review of Ayuh hand-off | New `cashback` and `vip` intents ahead of delivery rules |
| D-05 | Assistant dock covered bottom CTAs (SET VACATION, Confirm subscription, Place order) | E2E E15 | Compact floating button on screens with their own CTA |
| D-06 | Voice mode hid the confirmed card after Confirm | E2E E04 | Voice overlay keeps the latest card visible |
| D-07 | Ayuh header under the status bar | Visual QA | Separate full-bleed vs no-nav screen lists |
| D-08 | In-app offer said “Reply STOP” (WhatsApp wording) | Visual QA | Channel-specific wording |
| D-09 | Duplicate Confirm/Cancel (card + chips) in-app | Visual QA | Chips suppressed in-app when the card has actions |
| D-10 | Calendar ended 31 Dec, so the 60-day rule could not be exercised in the app | E2E E15 | Calendar extended to Feb 2027 |
| D-11 | Impact weights summed to 80% in the prioritisation workbook | LibreOffice recalculation | Weights 30/25/25/20 |
| D-12 | Asking the agent to pay fell through to “not understood” | Edge-case review (§14.2) | Explicit T4 guardrail: refuses and opens cart / CD Money |
| D-13 | Demo script step order would have reset the fault toggle | Script review | Order corrected (run scenario, then toggle) |
| D-14 | “What's in my cart?” fell through to “not understood” | Edge-case probe (§14.2 empty cart) | Cart read-back intent; empty cart says so and offers a next step |
| D-15 | “Make my cow milk 2 packets” not recognised as a subscription change | Edge-case probe | “make/set” accepted with a subscription word |
| D-16 | Revising a pending change (“actually make it 3”) was not understood | Edge-case probe (user changes mind) | Old proposal withdrawn (card shows Cancelled, cannot be confirmed), new one proposed |
| D-17 | Two requests in one message: the second was silently dropped | Edge-case probe (conflicting instructions) | Second request acknowledged and offered as a one-tap chip; one change at a time |
| D-18 | **Severity high.** Reversed dates (“30 Nov to 25 Nov”) produced a 34-day pause to 25 Dec; “28 Nov to 3 Dec” used December for the start | Edge-case probe (invalid dates) | Reversed ranges are refused with both dates shown; month parsing fixed per side |
| D-19 | “Set my milk to 0” proposed 2; “50 packets” proposed +1 | Edge-case probe (invalid quantity) | 0 offers pause/remove; unusually large quantities go to a person |
| D-20 | Agent replies were not announced to screen readers | Accessibility review (§14.4) | Conversation is a `role="log"` polite live region |
| D-21 | Deck, pitch and CTO guide said “working prototype” without stating that it runs on simulated data | Claims audit (§19 “no misleading production claims”) | Caption on every prototype screen in the deck, disclosure in the executive summary, and a “say once” line in the pitch and CTO guide |
| D-22 | **Client review.** The agent didn't use the screen: it answered from back-end tools and gave instructions instead of acting in the app | Client review of the prototype | Screen-context layer + declared in-app actions + goal planner (`src/operator/`); the agent searches, sorts, taps, types and navigates in the app and verifies each step on screen |
| D-23 | **Client review.** The assistant opened as an 86%-height sheet over a dark backdrop, hiding the app | Client review | Compact bottom-docked bar with one reply bubble; panel expands only for components and folds back after; app stays usable |
| D-24 | **Client review.** The browser asked for the microphone on every tap in the HTML demo | Client review | Permissions API check, one `getUserMedia()` stream per session reused for recognition, revocation handling, clear denied-state guidance; claude.ai dictation on the hosted page |
| D-25 | After a confirmed card, the panel collapsed in 250 ms, before “Confirmed” could be seen | E2E E03/E16 after the redesign | Collapse waits 1.8 s |
| D-26 | Compact chips were capped at three, hiding wellness options (Vegetarian, Peanuts) | E2E E10 | All chips in one scrollable row |
| D-27 | Idle assistant bar covered Ayuh's own options | E2E E12 | Idle bar hidden on Ayuh (it has its own hand-off) |
| D-28 | “Add two of this” added one; “2 matchs”; transparent reply bubble; app toast and mobile Demo button overlapped the bar | Browser runs at 1600 px and 390 px | Quantity words before “of this”; plural fix; solid bubble; toast moves to the top and Demo button to the side while the assistant is open |

## Not tested / known limitations

- Real speech was not exercised in headless tests (recognition needs a real voice and, in Chrome, Google's speech service). The microphone permission flow is covered with a fake device: one `getUserMedia()` call across repeated mic taps, and the denied-state message (E24).
- Safari/Firefox not tested; Web Speech recognition is Chrome/Edge only (fallback works everywhere).
- The rule-based parser covers the demo vocabulary and common variants; unusual phrasings fall back to a clarification with options (by design). One change per turn: when a sentence has two requests (“pause tomorrow and increase my milk”), the agent handles the first and offers the second as a one-tap chip.
- Instant (30-minute) mode is shown but agent flows use Morning orders.

