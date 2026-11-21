# Prototype Test Results

**Run:** 2026-11-21 15:26 UTC · Node 22 · Chromium (Playwright) · Vite 5.4.11

| Suite | Passed | Total |
|---|---|---|
| Unit & scenario tests (Vitest) | 67 | 67 |
| End-to-end UI tests (Playwright) | 19 | 19 |
| TypeScript strict typecheck | pass | — |
| Production build | pass | — |

## End-to-end UI tests

| ID | Test | Result | Time |
|---|---|---|---|
| E01 | Home renders seeded state (wallet ₹395, tomorrow 3 items) | ✅ PASS | 0.1s |
| E02 | UC3 Scenario 1: add two packets of milk → cart badge 2 | ✅ PASS | 1.8s |
| E03 | UC5 Scenario 2: confirm subscription change, reflected in My Subscriptions, undo restores | ✅ PASS | 3.6s |
| E04 | UC3 Scenario 3: vacation for next three days via voice card → Vacations screen | ✅ PASS | 2.2s |
| E05 | UC1 Scenario 4: ₹500 explained as Autopay from ledger (₹78 below ₹200) | ✅ PASS | 1.7s |
| E06 | UC1: unknown amount is not invented | ✅ PASS | 1.4s |
| E07 | UC2 Scenario 5: status + POD → policy options → confirm → case created and listed in history | ✅ PASS | 4.6s |
| E08 | UC2 WhatsApp Hinglish: Hinglish reply with order status | ✅ PASS | 2.2s |
| E09 | UC2 inbound call: verification before account data, then status | ✅ PASS | 1.8s |
| E10 | UC6 Scenario 6: consent → goal → diet → peanut allergy → peanut butter excluded | ✅ PASS | 2.2s |
| E11 | UC4 campaign: voice skipped without consent; in-app push → offer; STOP withdraws consent | ✅ PASS | 1.2s |
| E12 | Ayuh coexistence: Something else → assistant opens with Ayuh context | ✅ PASS | 0.6s |
| E13 | Guardrail: fault injection on confirm → 'nothing was changed', state unchanged | ✅ PASS | 2.3s |
| E14 | Guardrail: declining a change leaves data unchanged | ✅ PASS | 1.3s |
| E15 | Manual app flow: Set Vacation sheet blocks > 60 days and accepts a valid range | ✅ PASS | 1.4s |
| E16 | Persistence: subscription change survives a reload; Reset restores seed | ✅ PASS | 4.8s |
| E17 | Friction: looping My Subscriptions ×3 in 45 s shows one quiet suggestion | ✅ PASS | 0.5s |
| E18 | Mobile viewport (390×844): app fills screen, no horizontal scroll, demo button present | ✅ PASS | 1.7s |
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
| ✅ | engine.test.ts > Scenario 1 — product discovery: add two packets of milk > clarifies the milk, then adds after the customer taps Add |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > shows current → proposed, executes only on confirm, supports undo |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > 'one more packet' adds one to the current quantity |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > declining changes nothing |
| ✅ | engine.test.ts > Scenario 2 — subscription modification > changing coconut frequency warns that the 4 pe 4 offer is voided |
| ✅ | engine.test.ts > Scenario 3 — vacation > resolves next three days, respects cut-off, updates orders |
| ✅ | engine.test.ts > Scenario 3 — vacation > refuses more than 60 days |
| ✅ | engine.test.ts > Scenario 4 — wallet > explains the ₹500 as a UPI Autopay top-up using ledger data |
| ✅ | engine.test.ts > Scenario 4 — wallet > lists recent debits and explains the latest from the order |
| ✅ | engine.test.ts > Scenario 4 — wallet > never invents an unknown deduction |
| ✅ | engine.test.ts > Scenario 4 — wallet > balance with runway |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > shows status + POD, offers policy options, creates a ticket |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > Hinglish input gets a Hinglish reply |
| ✅ | engine.test.ts > Scenario 5 — delivery issue > status service down → no guessing, ticket + callback |
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

## Not tested / known limitations

- Real microphone input was not exercised in headless tests (browser speech requires a real device and permission); the simulated tap-to-speak path is covered.
- Safari/Firefox not tested; Web Speech recognition is Chrome/Edge only (fallback works everywhere).
- The rule-based parser covers the demo vocabulary and common variants; unusual phrasings fall back to a clarification with options (by design). One intent per turn: a sentence with two requests (“add milk and pause tomorrow”) is handled as the first recognised intent.
- Instant (30-minute) mode is shown but agent flows use Morning orders.

