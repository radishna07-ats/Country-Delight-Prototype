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

## Not tested / known limitations

- Real microphone input was not exercised in headless tests (browser speech requires a real device and permission); the simulated tap-to-speak path is covered.
- Safari/Firefox not tested; Web Speech recognition is Chrome/Edge only (fallback works everywhere).
- The rule-based parser covers the demo vocabulary and common variants; unusual phrasings fall back to a clarification with options (by design). One change per turn: when a sentence has two requests (“pause tomorrow and increase my milk”), the agent handles the first and offers the second as a one-tap chip.
- Instant (30-minute) mode is shown but agent flows use Morning orders.
