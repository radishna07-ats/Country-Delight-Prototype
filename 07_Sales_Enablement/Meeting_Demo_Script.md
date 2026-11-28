# Meeting Demo Script (≈15 minutes)

**Setup (before the meeting):** open the hosted demo (https://claude.ai/artifact/6PBj2aEbdkCtro7HiFwXC8), or double-click `06_Prototype/Demo_Standalone.html` in Chrome or Edge, or run `npm run build && npm run preview` in `06_Prototype/Source_Code` and open http://localhost:4173. Use a laptop at ≥1280 px wide (scenario panel · phone · inspector). Click **Reset data**. Turn on **Speak replies** only if the room audio is good. Voice is hands-free: tap the mic once and just talk. The assistant speaks when it has something to say (an acknowledgement, a question, the result) and works silently in between, then listens again; say “that's all” or tap the red End button to finish. Allow the microphone once when asked (hosted link: claude.ai dictation; local server: browser permission, remembered; double-clicked file: asked once per page load). Have [`../06_Prototype/screenshots/`](../06_Prototype/screenshots/) ready as a fallback.

**Say once at the start:** “Everything here runs on a simulated Country Delight back end and a fictional customer. The flows, rules and guardrails are what we propose. Nothing is connected to your systems or to a live Graine agent.”

| # | Time | Click | Say | Point at |
|---|---|---|---|---|
| 0 | 0:30 | Home | “This is your app as it works today, re-created from the recording. The only addition is the assistant docked above the navigation. It stays out of the way.” | Dock; date strip; wallet chip |
| 0a | 1:30 | Scenario **UC3 · Agent operates the app** (or type it) | “Watch the app, not the chat. It reads this screen, opens search, types, sorts by rating, ignores the tub that's over budget, taps Add and checks the cart. Everything it does is something you could tap yourself, and it says why it chose that one.” Then: *Open greek yogurt* → *Add two of this to my cart*. “‘This’ means what's on screen.” | Green ring on what it touches; step line with Stop; inspector SCREEN and APP ACTION rows |
| 1 | 2:00 | Scenario **UC1 · Explain a wallet deduction** | “The most common money complaint is ‘why was this deducted?’. Here the ₹500 wasn't a wallet charge at all: it was a UPI Autopay top-up from the bank, triggered when the balance fell below ₹200 after the 18 Nov delivery. The answer comes only from ledger rows and your published Autopay rule.” Then type **“Why was ₹999 deducted?”**: “It doesn't invent an answer.” | Wallet explainer card; inspector: `list_wallet_transactions`, `explain_transaction` |
| 2 | 2:30 | **UC2 · Milk hasn't arrived (5:40 AM)** → *Checked — nothing there* → *Re-deliver this morning* → **Confirm** → *Yes, call before delivery* → **Confirm** | “It's 5:40. Support opens at 6. The agent shows the order was marked delivered at 05:12 with a gate photo, asks the customer to check, then offers only what your policy allows. Confirm, case number, done. And it offers a preference you already have, so it doesn't happen again.” | Proof of delivery; “What Country Delight's policy allows”; case ID; inspector `request_resolution` T3 |
| 3 | 1:00 | **UC2 · Hinglish on WhatsApp** | “Same tools on WhatsApp, in Hinglish. WhatsApp shows text with reply buttons, because that's what WhatsApp supports.” | Reply buttons |
| 4 | 1:30 | **UC5 · Change a subscription** → **Confirm** → **Undo** | “One sentence, one card: now one, new two, from Sunday, plus ₹36 per delivery, about ₹1,080 more a month. Confirm, and it's in My Subscriptions. Undo for two minutes.” Then **“Change my coconut water to daily”**: “It warns that the 4 pe 4 offer would be voided, before anything changes.” | Card states; offer warning |
| 5 | 1:30 | **UC3 · Pause deliveries** (voice) → **Confirm** | “Voice for intent, screen for confirmation. ‘Next three days’ becomes Sunday to Tuesday, because tonight is before the 11 pm cut-off. It checks your 60-day rule.” Optional: set the clock to *after cut-off* and repeat: dates shift by a day. | Vacation card; inspector `rule_check: vacation` |
| 6 | 1:00 | **UC3 · Add to cart** → chip **Cow Milk** | “It clarifies rather than guessing, with the options open in the app, then adds it there and reads the cart back. It never checks out or pays.” | Cart badge |
| 7 | 1:30 | **UC6 · Wellness** → *Yes, remember* → *High Protein* → *Vegetarian* → *Peanuts* | “Consent first. Then goal, diet, allergies. Peanut butter disappears, and it tells you why. No medical advice: try ‘I have diabetes’.” | Excluded line; safety note; Wellness screen |
| 8 | 1:30 | **UC4 · Offer campaign** → *Voice call* (skipped) → *In-app push* → tap notification → **STOP** | “The campaign checks consent, do-not-call, frequency cap and calling window per channel. Voice is skipped because this customer hasn't consented. In-app goes through. STOP withdraws consent immediately.” | Campaign result; inspector `workflow` + `guardrail` |
| 9 | 1:00 | **Ayuh + Graine together** → *I have an issue with my Recharges* → *Payment not reflected…* → **Ask the assistant** | “Ayuh stays. Where Ayuh would raise a ticket, the assistant can check the account right now, with Ayuh's context.” | Hand-off card |
| 10 | 0:30 | Run **UC5**, *then* tick **Fail next tool call** (running a scenario resets it), then **Confirm** | “If your system doesn't answer, the agent says nothing was changed. It never claims success it can't verify.” | “nothing was changed” |

## If something goes wrong

- **Microphone blocked or no speech recognition:** use the tap-to-speak phrases in the voice screen (labelled simulated).
- **Wrong state:** Reset data, then re-run the scenario (each scenario resets itself).
- **Laptop screen too small:** press **P** for presentation mode and drive from the phone; open *Scenarios* from the button under the phone.
- **No laptop:** use the screenshots in `06_Prototype/screenshots/` (also in the deck).

## Questions to ask during the demo

1. Which of these would you put in front of customers first?
2. Does your ledger API carry order and plan references?
3. Who owns Ayuh, and what does it resolve today?
4. Which remedies can be automatic, and up to what value?
