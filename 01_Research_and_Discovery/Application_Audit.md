# Application Screen Audit — Country Delight app v10.9.100 (Android)

**Source:** S3, 7 min 11 s recording, watched end to end (144 frames at 1 per 3 s, plus ~30 full-resolution frames). Timestamps are `mm:ss` in the recording. Everything here is **OBSERVED**: what the screen shows, not the business logic behind it. Screens showing the recorder's phone number or address are described but **not reproduced**; reference frames without personal data are in [`screens/`](screens/).

## 1. Screen inventory

| # | Screen | Time | What is visible | Customer decisions | Friction observed | Conversational opportunity |
|---|---|---|---|---|---|---|
| A1 | Launch / splash | 00:00–00:05 | Logo, promotional creative ("Seven Gourmet Mushrooms"), loader "Fresh milk, fruits & vegetables and more at your doorstep" | — | Load wait (several seconds) | — |
| A2 | **Home · Morning** | 00:06–00:15, 05:21–05:33 | VIP savings banner; Morning / Instant toggle; slot 5am–7:30am + address; wallet chip ₹112; search with rotating hints; 3-day date strip with "No orders yet for tomorrow · ADD"; category chips; hero "Breakfast Made Better"; **BALANCE LOW banner**; curated rails; bottom nav Home · Products · Join VIP · Refer · Favourites | Browse, search, add for a date, recharge | Many competing promotions before the task | Persistent, unobtrusive "Ask" entry; date-aware intents ("add paneer for tomorrow") |
| A3 | Category listing (Milk & Coconut) | 00:15, 00:27–00:45 | "Thu, 19th November · 5am to 7:30am"; category tabs; sub-chips (Milk, Coconut Water, Country Fruits, Add-ons); grid with size, price, strike price, ADD; badges ("HIGH PROTEIN", "Travel Friendly") | Pick product | Pack sizes (450 ml) prominent: a known complaint (N01) | Product clarification ("cow or buffalo?") |
| A4 | Product video / detail | 00:18–00:24 | Hero video, "Naturally Sweet Taste · Village-like Freshness · Passes 140+ Quality Tests · No Water or Powder Mixing · No Preservatives", name, "Hormone Free", stepper, VIP nudge, Subscription type (Daily ✎), Start Date ✎, description, **CONFIRM SUBSCRIPTION ₹96** | Quantity, frequency, start date | 3 parameters + confirm; frequency picker not shown | UC5 subscription card |
| A5 | Snacks listing (multi-pack variants) | 00:39–00:47 | Pack chips "4 Packs / 2 Packs / 1 Pack" with per-pack price | Variant | Per-pack vs total confusion (review N01 "per pack pricing is shown, not for the whole") | Agent states the total |
| A6 | One-time product | 00:48–00:53 | Subscription type "One Time", CONFIRM ORDER ₹200 | — | — | — |
| A7 | **My Subscriptions · empty** | 00:54–00:57 | "No Subscription — Pick from a variety of healthy & fresh products"; Explore Category grid (~32 categories incl. Healthy Diet Combos, Hydroponics) | — | — | — |
| A8 | **Subscribe flow** (Low Malai Milk) | 01:03–01:15 | Ingredients card (Fat 3.0% min, SNF 8.5% min); stepper set to 2; Daily; 19 Nov; CONFIRM SUBSCRIPTION ₹94 | Qty 2 Daily | — | — |
| A9 | **Order Subscribed!** | 01:17–01:26 | VIP upsell "You can still save ₹15 with VIP"; Deliver on Thu 19 Nov; item ×2 "Daily Subscription"; Start date, type; Items Total ₹94, Packaging Free, Convenience Fee ₹1, To Pay ₹95; *"Amount will only be charged after the products are delivered."*; Delivery details; Disclaimer on weights | — | — | Read-back of confirmation by agent |
| A10 | **Menu** | 01:27, 02:00, 02:09, 02:15, 03:15 | Products and Subscriptions (Products, My Subscriptions, Set Vacation); Orders and Billing (My Orders, Transactions); Rewards (Refer, Offer Zone); VIP banner; LBStays ad; Account & Preferences; CD Money & Payment Modes; Test Reports; Legal; **Ayuh FAB**; Version 10.9.100 | Navigate | Account, wallet and help are 2–3 taps deep | Agent navigation targets |
| A11 | **Set Vacation sheet** | 01:30–01:35 | "Select start and end date (Max 60 days)"; calendar; Start/End fields; CONFIRM disabled until valid | Date range | Range selection by two taps; no "how long?" shortcut | "Pause next week" |
| A12 | **Vacations · active** | 01:36–01:41 | Fri 20 Nov – Thu 26 Nov; "Any upcoming delivery will resume from 27 Nov"; Subscription Paused card; toast "Vacation set successfully"; END VACATION | End vacation | — | Read-back |
| A13 | Vacations · empty | 01:42 | "Plan your vacations"; "Your orders will be paused · No wallet deduction or auto-recharge · Membership to be paused"; SET VACATION | — | — | Verbatim policy copy |
| A14 | **My Subscriptions · active** | 01:45, 01:51 | Card: Low Malai Milk 450 ml, "Daily, Qty 2", ₹47, EDIT, VIP nudge; **Add More Subscriptions** carousel (Coconut Water, Idli Dosa Batter, Taaza Paneer, Low Fat Dahi) | Edit, add | — | UC5 entry point |
| A15 | **Edit subscription** | 01:48–01:54 | Product page in edit mode; stepper; Daily; start date; **Pause/Remove Subscription: PAUSE · REMOVE · GOING ON VACATION**; CONFIRM SUBSCRIPTION | Change qty, pause, remove, vacation | Three distinct operations hidden below the fold | UC5 actions |
| A16 | **Subscription Cancelled** | 01:57 | "Order Cancelled! Subscription Cancelled — Your subscription has been cancelled. Please try our other products." | — | **No reason captured; no save offer** (pause/vacation alternative) | Retention flow (A2) |
| A17 | **My Orders** | 02:03–02:08 | Morning Orders / Instant Orders; delivered orders with timestamp (e.g. 04:19 am, 06:03 am), items, total, RATE ORDER, REPEAT ORDER | Rate, repeat | No "report a problem" on the order card | UC2 contextual help on an order |
| A18 | **Transaction History** | 02:12 | Current Wallet Balance ₹112.00, ADD MONEY; "Paid for Order −₹49, closing balance ₹112" | — | **Ledger does not name the order or product** | UC1 "why was ₹49 deducted?" |
| A19 | Refer | 02:18, 06:51 | "Recommend Better Living… earn up to ₹1500"; Pending 0 / Successful 0 / Earned ₹0; steps; Refer Now (WhatsApp) | Refer | Referral terms not visible | — |
| A20 | **Offer Zone** | 02:21–02:33 | Promo code input; Offers / Partner Offers; offer cards with validity dates; some internal test campaign names visible to customers | Apply code | Test campaigns leaking to production (minor QA finding) | UC4 grounding source |
| A21 | VIP Membership & plans | 02:42–03:00 | ₹2,113 saved; VIP vs Non-VIP price comparison; testimonials; plans 30 days ₹406 (₹606), 60 days ₹813, 90 days ₹1,220, 15 days ₹406; Have a coupon code?; SUBSCRIBE TO VIP | Subscribe | Benefit cap not shown on the plan card | UC1 VIP explanation |
| A22 | **Account & Preferences** | 03:06–03:12 | My Profile; Address; **Delivery Time Slot Morning (5.00 AM – 7.30 AM)**; Delivery Preferences: reusable bag Yes/No, **Call before delivery**, **Ring the bell**, **Add voice instructions**; Door Image upload | Set preferences | Doorstep controls buried; directly relevant to N07 complaints | Agent sets preferences after a doorstep complaint |
| A23 | **CD Money** | 03:18–03:21, 05:54 | Balance ₹112; Smart Recharge "Recharge automatically when wallet balance is low": Smart Plan ₹3,000 (₹250 cashback = ₹50 × next 5 txns), Monthly Once (₹125 = ₹25 now + ₹100 in next 4 txns); "Hassle free recharges · Pause/cancel anytime · 24-hr prior notification"; Recharge accordion; UPI Autopay banner; PAY ₹3000 | Choose plan | Split cashback is hard to verify later (N05) | UC1 Smart Recharge explainer |
| A24 | Test Reports | 03:27–03:39 | Product Quality Report picker (long list); lab report images | Pick product | Long picker | Agent fetches the report for a named product |
| A25 | Legal | 03:42 | Privacy Policy, Terms and Conditions, Third-Party Licenses | — | — | — |
| A26 | **Ayuh** | 03:48–04:27 | "Hi, I'm Ayuh!"; tiles: issue with VIP Membership / Recharges / Update Profile & Address; VIP card (savings stats, Ended 29 Jul 2026, INACTIVE); "What do you need help with?": Explore Plan / Know more about VIP / Something else → **Describe the issue and raise a ticket / Talk to an agent** → **Call Us** (opens the phone dialer to the helpline); Recharges → Recharge cashback not received / Payment not reflected in CD Money / Referral cashback pending; Profile → My location is non-serviceable / Update mobile / Update delivery address / Set delivery preference / Set vacation; "How was your experience?" rating | Pick a branch | Menu tree; **no free text, no voice, no action execution observed**; escalation leaves the app for a phone call | **Complement, not replace**: Graine handles free text/voice, actions and warm handoff; Ayuh tiles can open Graine with context (PR-001) |
| A27 | **Instant (30 minutes)** | 04:30–05:18 | "30 minutes"; Explore / Morning Needs / Fruits & Veggies / Groceries / Snack Fest / More Protein; Winter Mode creative; Previously Bought; Deals of the Day; "Free ₹79 Cash on cart value of ₹1149"; "Hurray! Free Handling Charge Unlocked"; Buy Again tab | Quick order | Separate nav (Home · Products · Buy Again) | Mode-aware agent |
| A28 | Products tab · Trusted Organics, Fresh Finds, Fruits | 05:27–06:24 | Crafted Daily, Morning Must-Haves, High Protein, Organic Veggies, Fresh Ozosafe, Country Store, Why Choose Country Delight (Lab-tested, No Adulterants, Finest Sourcing, Ozone Washed) | Browse | Very long scroll | Search-by-need |
| A29 | Weekly subscription (Papaya) | 06:32 | Subscription type "Weekly"; "Will be delivered every Thursday"; CONFIRM SUBSCRIPTION ₹122.45 | — | — | Frequency options exist beyond Daily |
| A30 | Product listing (Dairy Delight, ghee variants) | 06:54–06:57 | Size chips with per-unit price | — | — | — |
| A31 | **Groceries · Pick Your Health Goal** | 07:00–07:06 | Gut Health, Low Sugar, High Protein, Heart Health, Immunity; Everyday Essentials; Spice Up Every Dish; "No Fillers. Just Flavour" | Pick goal | Goals are shelves, not a personal profile; no allergy filter | **UC6 base** |

## 2. Feature map against the brief's audit areas

| Area | Observed | Not observed / not established |
|---|---|---|
| A. Home | Morning/Instant, date strip, categories, search, recommendations rails | Personalised recommendations logic |
| B. Product discovery | Listing, detail, qty, subscription type, start date, CONFIRM | Cart screen and multi-item checkout (EV-037) |
| C. Subscription management | My Subscriptions, edit, qty, PAUSE / REMOVE / GOING ON VACATION, Add More | Alternate-day frequency UI; skip-a-day |
| D. Vacation | Set Vacation (Max 60 days), active state, resume date, End Vacation; empty-state policy copy | Same-day cut-off; overlap rules |
| E. CD Money | Balance, Smart Recharge (two plans), Recharge, Autopay banner, ledger | Refund-to-bank flow (FAQ: via support only) |
| F. Orders & delivery | My Orders (Morning/Instant), delivery timestamps, Rate/Repeat | Live tracking, ETA, partner contact, proof-of-delivery photo, issue reporting from order card |
| G. Account & preferences | Profile, address, slot, doorstep preferences, door image | Notification preferences, language |
| H. Ayuh | Menu tree, ticket, call escalation, rating | Back end, NLU, containment, owner (EV-033) |

## 3. Interaction conventions to reuse in the prototype

Bottom sheets for calendars and confirmations; full-width green primary button with price on the left; outlined stepper; pill chips; toasts at the bottom; skeleton loaders; disabled primary until a selection is valid; light mint/cream backgrounds; dark-green headings; rounded product cards with an "ADD" ghost button; VIP yellow accents.

## 4. Top audit findings

1. **The money story has no "why".** Ledger lines say "Paid for Order −₹49" with no order, product or plan attached (A18), while cashback, VIP benefit and Autopay all move money on different clocks (A21, A23). → UC1.
2. **Self-help stops at a phone number.** Ayuh's deepest branch opens the dialer (A26), and support opens at 6 AM while deliveries start at 5 AM (EV-001, EV-002). → UC2.
3. **Subscription control is complete but scattered.** Edit, pause, remove and vacation live on three surfaces (A11, A14, A15). Removal has no save step (A16). → UC5 and retention.
4. **Doorstep preferences exist but are buried** (A22), while doorstep complaints recur (N07). → agent-set preferences.
5. **Health goals are shelves, not a journey** (A31). → UC6.
6. **Offer data is structured** (name, product, validity) (A20): a safe grounding source for UC4.
