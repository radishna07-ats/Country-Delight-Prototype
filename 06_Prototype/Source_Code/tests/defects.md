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
