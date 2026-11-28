// @vitest-environment jsdom
// The in-app operator against the REAL rendered app (React in jsdom): the agent reads the screen, acts through
// the UI and verifies on screen. No scripted paths — each test only sends what a customer would say or tap.
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db, ui, resetDemo } from "../../src/backend/store";
import { handleEvent, resetEngine, userSays } from "../../src/agent/engine";
import { OP } from "../../src/operator/actions";
import { stopOperator, tapByName } from "../../src/operator/operator";
import { observe } from "../../src/operator/screen";
import { Phone } from "../../src/App";

let root: Root; let host: HTMLDivElement;
const tick = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const agentMsgs = () => ui.get().messages.filter((m) => m.role === "agent");
const last = () => agentMsgs().slice(-1)[0]?.text ?? "";
const lastDetail = () => agentMsgs().slice(-1)[0]?.detail ?? "";
const cartQty = (id: string) => db.get().cart.filter((c) => c.productId === id).reduce((n, c) => n + c.qty, 0);
const say = async (t: string) => { await userSays(t, "inapp"); await tick(); };

beforeAll(() => { OP.speed = 0; host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); root.render(createElement(Phone)); });
afterAll(() => { root.unmount(); });
beforeEach(async () => {
  resetDemo(); resetEngine();
  ui.set((s) => ({ ...s, splash: false, agentOpen: true, channel: "inapp", faults: { failNext: false, slow: false } }));
  await tick(50);
});

describe("screen context", () => {
  it("reads the live screen: route, inputs, products with price and rating", async () => {
    ui.set((s) => ({ ...s, route: { screen: "products", params: { cat: "nutrition" } } })); await tick(50);
    const c = observe();
    expect(c.hasDom).toBe(true);
    expect(c.screen).toBe("products");
    expect(c.inputs.find((i) => i.field === "search")).toBeTruthy();
    expect(c.products.map((p) => p.productId)).toEqual(expect.arrayContaining(["whey-1kg", "plant-protein", "whey-2kg"]));
    expect(c.products.find((p) => p.productId === "whey-1kg")?.rating).toBe(4.6);
  });
  it("answers “what's on this screen?” from what is rendered", async () => {
    await say("What's on this screen?");
    expect(last()).toMatch(/You're on Home/);
    expect(last()).toMatch(/cart is empty/);
  });
});

describe("operating the app", () => {
  it("find protein powder under ₹2,000, add the best-rated: searches, sorts, filters by price, taps Add, verifies", async () => {
    await say("Find me a protein powder under ₹2,000 and add the best-rated option to my cart.");
    const c = observe();
    expect(c.screen).toBe("products");
    expect(c.inputs.find((i) => i.field === "search")?.value).toBe("protein powder");
    expect(cartQty("whey-1kg")).toBe(1);   // ★4.6 at ₹1,614 (VIP price)
    expect(cartQty("whey-2kg")).toBe(0);   // ★4.7 but over budget
    // spoken outcome (short) vs visual detail (facts, comparison)
    expect(last()).toMatch(/^Done! I've added the best-rated protein powder within your ₹2,000 budget to your cart\. It's Whey Protein Powder — Unflavoured/);
    expect(lastDetail()).toMatch(/best-rated of 2 options under ₹2,000/);
    expect(lastDetail()).toMatch(/rated ★4\.7 but costs/);
    // speech policy: one acknowledgement + one final outcome; no step ever became a message
    const turn = agentMsgs().slice(-2);
    expect(turn[0]).toMatchObject({ speech: "conversational", text: "Sure! I'll find the best-rated option within your ₹2,000 budget and add it to your cart." });
    expect(turn[1].speech).toBe("final");
    expect(agentMsgs().some((m) => /Typing|Sorting|Reviewing|Choosing|Adding|Opening search/.test(m.text))).toBe(false);
  });
  it("cheapest + quantity", async () => {
    await say("Add the cheapest protein powder to my cart");
    expect(cartQty("plant-protein")).toBe(1);
  });
  it("nothing within budget: says so and adds nothing", async () => {
    await say("Find a protein powder under ₹500 and add the best-rated one");
    expect(db.get().cart).toHaveLength(0);
    expect(last()).toMatch(/nothing under ₹500\. The most affordable is .+ Would you like that instead\?/);
  });
  it("ambiguous “milk”: puts the options on screen, asks, then adds the chosen one through the app", async () => {
    await say("Add two packets of milk to my cart");
    expect(observe().inputs.find((i) => i.field === "search")?.value).toBe("milk");
    expect(db.get().cart).toHaveLength(0);
    expect(last()).toMatch(/Which milk would you like\?/);
    await handleEvent({ kind: "add", productId: "cow-milk", qty: 2 }, "inapp"); await tick();
    expect(cartQty("cow-milk")).toBe(2);
  });
  it("“this” on a product page: switches to one-time, sets quantity, presses Add to cart", async () => {
    await say("Open greek yogurt");
    expect(observe()).toMatchObject({ screen: "product", contextProductId: "greek-yogurt" });
    await say("Add two of this to my cart");
    expect(cartQty("greek-yogurt")).toBe(2);
    expect(ui.get().route.screen).toBe("cart");
  });
  it("“the first one” resolves against the products on screen", async () => {
    await say("Show me paneer under 120");
    expect(db.get().cart).toHaveLength(0);
    await say("Add the first one to my cart");
    expect(cartQty("taaza-paneer")).toBe(1);
  });
  it("removes and changes cart items through the cart's own controls", async () => {
    await say("Add the cheapest protein powder to my cart");
    await say("Remove the protein powder from my cart");
    expect(cartQty("plant-protein")).toBe(0);
    expect(ui.get().route.screen).toBe("cart");
  });
  it("navigates through the UI (Menu › My Subscriptions), not by jumping", async () => {
    await say("Open my subscriptions");
    expect(ui.get().route.screen).toBe("subscriptions");
    expect(ui.get().history.map((h) => h.screen)).toContain("menu");
    expect(last()).toBe("Here's My Subscriptions.");
    expect(lastDetail()).toMatch(/Menu › My Subscriptions/);
  });
  it("on a subscription screen, “this” is that subscription", async () => {
    ui.set((s) => ({ ...s, route: { screen: "subscription_edit", params: { id: db.get().subscriptions[0].id } } })); await tick(50);
    await say("Increase the quantity of this by one");
    const c = [...ui.get().messages].reverse().flatMap((m) => m.cards ?? []).find((x) => x.type === "sub_change");
    expect(c?.productId).toBe(db.get().subscriptions[0].productId);
  });
});

describe("guardrails in the action layer", () => {
  it("never presses Place order (T4)", async () => {
    await say("Add the cheapest protein powder to my cart");
    await say("Open the cart");
    await say("Tap place order");
    expect(db.get().cart.length).toBeGreaterThan(0); // still in the cart: no order was placed
    expect(last()).toMatch(/can't make payments or place orders|Paying and placing orders always stays with you/);
  });
  it("the action layer itself refuses T4, even if asked directly", async () => {
    await say("Add the cheapest protein powder to my cart");
    await say("Open the cart");
    const r = await tapByName("Place order");
    expect(r.ok).toBe(false);
    expect(r.text).toMatch(/Paying and placing orders always stays with you/);
    expect(db.get().cart.length).toBeGreaterThan(0);
  });
  it("needs confirmation before pressing an account-changing button (T2)", async () => {
    ui.set((s) => ({ ...s, route: { screen: "subscription_edit", params: { id: db.get().subscriptions[0].id } } })); await tick(50);
    await say("Press confirm subscription");
    expect(last()).toMatch(/need your confirmation first/);
  });
  it("a failed add is reported, not claimed", async () => {
    ui.set((s) => ({ ...s, faults: { failNext: true, slow: false } }));
    await say("Add the cheapest protein powder to my cart");
    expect(db.get().cart).toHaveLength(0);
    expect(last()).toMatch(/didn't change|nothing was added|didn't go through/);
  });
  it("Stop halts the operator", async () => {
    const p = userSays("Find me a protein powder under ₹2,000 and add the best-rated option to my cart.", "inapp");
    stopOperator();
    await p; await tick();
    expect(last()).toMatch(/Stopped/);
    expect(db.get().cart).toHaveLength(0);
  });
});
