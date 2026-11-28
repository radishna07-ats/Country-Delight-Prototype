import { describe, expect, it } from "vitest";
import { parse, parseRange } from "../../src/agent/nlu";
import { checkVacation, earliestChangeDate, findProducts } from "../../src/backend/rules";

const CLOCK = "2026-11-21T20:15"; // Sat evening, before cut-off
const LATE = "2026-11-21T23:30";  // after cut-off

describe("intent classification — brief scenarios", () => {
  const cases: [string, string][] = [
    ["Add two packets of milk to my cart.", "add_to_cart"],
    ["Increase my daily milk quantity", "change_subscription"],
    ["I want to add one more packet of milk to my regular subscription.", "change_subscription"],
    ["Pause my delivery for the next three days", "vacation"],
    ["Pause my deliveries next week", "vacation"],
    ["Why was money deducted?", "wallet_deduction"],
    ["Why was ₹500 deducted from my wallet?", "wallet_deduction"],
    ["My milk hasn't arrived.", "delivery_issue"],
    ["mera doodh abhi tak nahi aaya", "delivery_issue"],
    ["I have started working out. Recommend products.", "wellness"],
    ["How much money is left in my CD Money wallet?", "wallet_balance"],
    ["Where can I see tomorrow's order?", "tomorrow_order"],
    ["What is Smart Recharge?", "smart_recharge"],
    ["My payment failed", "payment_failed"],
    ["Refund my wallet balance to my bank", "wallet_refund"],
    ["Please don't ring the bell", "delivery_prefs"],
    ["Stop my curd", "remove_subscription"],
    ["Add paneer every Sunday", "add_subscription"],
    ["Any offers for me?", "offers"],
    ["I want to talk to a person", "human"],
    ["I have diabetes, what should I eat?", "medical"],
    ["open my subscriptions", "navigate"],
    ["Pause my coconut water for 3 days", "pause_subscription"],
    ["yes", "yes"],
    ["My recharge cashback was not received", "cashback"],
    ["How does VIP benefit work?", "vip"],
  ];
  it.each(cases)("%s → %s", (text, intent) => { expect(parse(text, CLOCK).intent).toBe(intent); });
});

describe("entities", () => {
  it("quantity from words and digits", () => {
    expect(parse("Add two packets of milk to my cart", CLOCK).qty).toBe(2);
    expect(parse("add 3 paneer", CLOCK).qty).toBe(3);
  });
  it("one more → delta +1", () => { expect(parse("add one more packet of milk to my regular subscription", CLOCK).delta).toBe(1); });
  it("generic milk is flagged for clarification", () => {
    const p = parse("Add two packets of milk", CLOCK);
    expect(p.genericMilk).toBe(true);
  });
  it("specific milk is not generic", () => { expect(parse("add buffalo milk", CLOCK).genericMilk).toBe(false); });
  it("amount", () => { expect(parse("Why was ₹500 deducted", CLOCK).amount).toBe(500); });
  it("weekly frequency with weekday", () => { const p = parse("add paneer every Sunday", CLOCK); expect(p.frequency).toBe("weekly"); expect(p.weekday).toBe(0); });
  it("product specificity: buffalo milk beats milk", () => { expect(findProducts("add buffalo milk").map((p) => p.id)).toEqual(["buffalo-milk"]); });
  it("product specificity: greek yogurt beats yogurt/dahi", () => { expect(findProducts("greek yogurt please").map((p) => p.id)).toEqual(["greek-yogurt"]); });
});

describe("date resolution", () => {
  it("cut-off: before 11 pm → tomorrow; after → day after", () => {
    expect(earliestChangeDate(CLOCK)).toBe("2026-11-22");
    expect(earliestChangeDate(LATE)).toBe("2026-11-23");
  });
  it("next three days starts at first changeable date", () => {
    expect(parseRange(" pause my delivery for the next three days ", CLOCK)).toMatchObject({ start: "2026-11-22", end: "2026-11-24" });
  });
  it("next week = Monday to Sunday", () => {
    expect(parseRange(" pause next week ", CLOCK)).toMatchObject({ start: "2026-11-23", end: "2026-11-29" });
  });
  it("from monday to sunday", () => {
    expect(parseRange(" i'm travelling from monday to sunday ", CLOCK)).toMatchObject({ start: "2026-11-23", end: "2026-11-29" });
  });
  it("hinglish: kal se 3 din", () => {
    expect(parseRange(" kal se 3 din doodh band kar do ", CLOCK)).toMatchObject({ start: "2026-11-22", end: "2026-11-24" });
  });
});

describe("vacation rules", () => {
  it("rejects > 60 days", () => { expect(checkVacation(CLOCK, "2026-11-22", "2027-01-30", []).ok).toBe(false); });
  it("rejects start before cut-off date", () => { expect(checkVacation(CLOCK, "2026-11-21", "2026-11-23", []).ok).toBe(false); });
  it("accepts valid range and gives resume date", () => { expect(checkVacation(CLOCK, "2026-11-22", "2026-11-24", [])).toMatchObject({ ok: true, days: 3, resume: "2026-11-25" }); });
  it("rejects overlap", () => {
    expect(checkVacation(CLOCK, "2026-11-23", "2026-11-25", [{ id: "v", start: "2026-11-24", end: "2026-11-26", createdAt: CLOCK, status: "scheduled" }]).ok).toBe(false);
  });
});

describe("date edge cases", () => {
  it("28 Nov to 3 Dec keeps the start in November", () => {
    expect(parseRange(" pause from 28 nov to 3 dec ", CLOCK)).toMatchObject({ start: "2026-11-28", end: "2026-12-03" });
  });
  it("28th to 3rd rolls the end into the next month", () => {
    expect(parseRange(" pause from 28th to 3rd ", CLOCK)).toMatchObject({ start: "2026-11-28", end: "2026-12-03" });
  });
  it("reversed explicit dates are flagged, not repaired", () => {
    const p = parse("Pause my milk from 30 Nov to 25 Nov", CLOCK);
    expect(p.range).toBeUndefined();
    expect(p.badRange).toEqual({ start: "2026-11-30", end: "2026-11-25" });
  });
  it("a second request in one message is detected", () => {
    expect(parse("Pause my deliveries for three days and increase my milk", CLOCK).also).toMatchObject({ intent: "change_subscription" });
    expect(parse("Add two packets of milk and one paneer", CLOCK).also).toBeUndefined();
    expect(parse("I am travelling and won't need milk", CLOCK).also).toBeUndefined();
  });
});


describe("in-app operator intents", () => {
  it("find with price ceiling, rating preference and add", () => {
    const p = parse("Find me a protein powder under ₹2,000 and add the best-rated option to my cart.", CLOCK);
    expect(p.intent).toBe("ui_find");
    expect(p.find).toEqual({ query: "protein powder", maxPrice: 2000, minPrice: undefined, pick: "best_rated", add: true });
    expect(p.qty).toBeUndefined();
  });
  it("search without adding", () => {
    expect(parse("Show me paneer under 120", CLOCK).find).toMatchObject({ query: "paneer", maxPrice: 120, add: false });
    expect(parse("search for greek yogurt", CLOCK).intent).toBe("ui_find");
  });
  it("screen, tap, type, scroll, back", () => {
    expect(parse("What's on this screen?", CLOCK).intent).toBe("screen_query");
    expect(parse("Tap top rated", CLOCK)).toMatchObject({ intent: "ui_tap", tapTarget: "top rated" });
    expect(parse("Type almonds into the search box", CLOCK)).toMatchObject({ intent: "ui_fill", fillText: "almonds", fillField: "search" });
    expect(parse("scroll down", CLOCK)).toMatchObject({ intent: "ui_scroll", scrollDir: "down" });
    expect(parse("go back", CLOCK).intent).toBe("ui_back");
  });
  it("references to what is on screen", () => {
    expect(parse("Add two of this to my cart", CLOCK)).toMatchObject({ intent: "add_to_cart", deictic: true, qty: 2 });
    expect(parse("Add the first one to my cart", CLOCK)).toMatchObject({ intent: "add_to_cart", ordinal: 1 });
    expect(parse("open greek yogurt", CLOCK).intent).toBe("open_product");
  });
  it("cart changes", () => {
    expect(parse("Remove the protein powder from my cart", CLOCK).intent).toBe("cart_remove");
    expect(parse("Change the paneer in my cart to 3", CLOCK)).toMatchObject({ intent: "cart_qty", qty: 3 });
  });
  it("existing intents are unaffected", () => {
    expect(parse("Add two packets of milk to my cart.", CLOCK).intent).toBe("add_to_cart");
    expect(parse("Please pay for my order", CLOCK).intent).toBe("payment_request");
    expect(parse("Pause my delivery for the next three days", CLOCK).intent).toBe("vacation");
    expect(parse("open my subscriptions", CLOCK).intent).toBe("navigate");
  });
});

describe("client example phrasing", () => {
  it("“Show me my whey protein powder” searches without adding", () => {
    expect(parse("Show me my whey protein powder.", CLOCK)).toMatchObject({ intent: "ui_find", find: { query: "whey protein powder", add: false } });
  });
  it("“Find my whey protein powder under ₹2,000 and add the best-rated option to my cart”", () => {
    expect(parse("Find my whey protein powder under ₹2,000 and add the best-rated option to my cart.", CLOCK)).toMatchObject({ intent: "ui_find", find: { query: "whey protein powder", maxPrice: 2000, pick: "best_rated", add: true } });
  });
});
