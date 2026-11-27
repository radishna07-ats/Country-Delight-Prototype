// Domain types for the simulated Country Delight back end.
// These model what the prototype needs; they are NOT Country Delight's real API.

export type ArtKind =
  | "pouch" | "tetra" | "tub" | "block" | "jar" | "bottle" | "coconut" | "eggs"
  | "bread" | "banana" | "leafy" | "papaya" | "bag" | "nuts" | "cup" | "batter" | "powder";

export type Category = "milk" | "dairy" | "breakfast" | "fruits" | "veggies" | "staples" | "snacks" | "nutrition";
export type Frequency = "daily" | "alternate" | "weekly" | "once";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Product {
  id: string;
  name: string;
  short: string;            // short spoken name, e.g. "cow milk"
  size: string;             // "450 ml"
  mrp: number;              // illustrative
  price: number;            // regular selling price, illustrative
  vipPrice?: number;        // VIP member price where shown; otherwise derived in rules.ts
  category: Category;
  art: { kind: ArtKind; color: string; accent: string; label?: string };
  tags: string[];           // catalogue tags e.g. high_protein, gut_health, low_sugar, vegan, a2
  allergens: string[];      // milk, nuts, gluten, egg, soy, peanut
  diet: "veg" | "egg" | "vegan";
  subscribable: boolean;
  frequencies: Frequency[];
  inStockTomorrow: boolean;
  badge?: string;
  description: string;
  aliases: string[];        // words customers use: "doodh", "milk packet"
  rating?: number;          // ILLUSTRATIVE customer rating (1–5) for the operator demo; not observed in CD's app
  reviews?: number;         // ILLUSTRATIVE number of ratings
}

export interface CartLine { productId: string; qty: number; date: string }

export interface Subscription {
  id: string;
  productId: string;
  qty: number;
  frequency: Frequency;
  weekday?: Weekday;        // for weekly
  startDate: string;        // YYYY-MM-DD
  status: "active" | "paused" | "removed";
  pausedUntil?: string;
  offer?: { id: string; name: string; voidsOnChange: string[] };
}

export interface Vacation { id: string; start: string; end: string; createdAt: string; status: "scheduled" | "active" | "ended" }

export type TxnType = "order" | "recharge" | "autopay" | "cashback" | "membership" | "fee" | "refund" | "credit";
export interface Txn {
  id: string;
  ts: string;               // ISO
  amount: number;           // positive = into wallet, negative = out of wallet
  type: TxnType;
  title: string;            // ledger line as shown in the app
  closing: number;
  ref?: { orderId?: string; planId?: string; offerId?: string };
  bankDebit?: { amount: number; method: string; mandateNoticeAt: string }; // money taken from bank (Autopay)
  rule?: string;            // rule id that explains it
}

export interface OrderLine { productId: string; qty: number; price: number; status?: "delivered" | "missing" | "damaged" }
export type OrderStatus = "scheduled" | "packed" | "out_for_delivery" | "delivered" | "cancelled";
export interface Order {
  id: string;
  date: string;             // delivery date
  mode: "morning" | "instant";
  lines: OrderLine[];
  status: OrderStatus;
  statusAt?: string;        // HH:MM
  pod?: { at: string; note: string; photo: "gate" | "door" };
  slot: string;
  charged: boolean;         // CD charges after delivery
}

export interface DeliveryPrefs { ringBell: boolean; callBefore: boolean; voiceNote: string; reusableBag: boolean }

export interface Ticket {
  id: string; createdAt: string; reason: string; orderId?: string; summary: string;
  resolution?: string; status: "open" | "resolved" | "awaiting_callback"; channel: Channel;
}

export interface WellnessProfile { goals: string[]; diet: "veg" | "egg" | "vegan" | "any"; allergies: string[]; consentAt: string; activity?: string }

export interface Offer {
  id: string; name: string; productIds: string[]; benefit: string; validTill: string;
  conditions: string[]; channel: ("inapp" | "whatsapp" | "voice")[]; eligibleSegment: string;
}

export interface Customer {
  id: string; firstName: string; lastName: string; city: string; area: string; language: "en" | "hi";
  phoneMasked: string; slot: string;
  vip: { active: boolean; plan: string; validTill: string; benefitLeft: number; benefitTotal: number; autoRenew: boolean };
  consents: { promoInApp: boolean; promoWhatsApp: boolean; promoVoice: boolean; memory: boolean; wellness: boolean };
  promoTouchesThisMonth: number;
  dnc: boolean;
}

export type Channel = "inapp" | "whatsapp" | "voice";

export interface Wallet {
  balance: number;
  lowThreshold: number;
  autopay: { enabled: boolean; threshold: number; amount: number; method: string };
  smartRecharge: { planId: string | null };
}

export interface RechargePlan { id: string; name: string; amount: number; cashback: number; schedule: string; notes: string }

export type ToolStatus = "ok" | "refused" | "error";
export interface ToolResult<T = unknown> { status: ToolStatus; data?: T; message?: string }
