import { beforeEach, describe, expect, it } from "vitest";
import { db, ui, resetDemo } from "../../src/backend/store";
import { handleEvent, resetEngine, userSays } from "../../src/agent/engine";

const last = (): any => ui.get().messages.filter((m) => m.role === "agent").slice(-1)[0];
const card = (type: string): any => [...ui.get().messages].reverse().flatMap((m) => m.cards ?? []).find((c) => c.type === type);
const sub = (productId: string) => db.get().subscriptions.find((s) => s.productId === productId && s.status !== "removed");

beforeEach(() => { resetDemo(); resetEngine(); ui.set((s) => ({ ...s, channel: "inapp", faults: { failNext: false, slow: false } })); });

describe("Scenario 1 — product discovery: add two packets of milk", () => {
  it("clarifies the milk, then adds after the customer taps Add", async () => {
    await userSays("Add two packets of milk to my cart.");
    const c = card("products");
    expect(c.items[0]).toMatchObject({ productId: "cow-milk", qty: 2, usual: true });
    expect(db.get().cart).toHaveLength(0); // nothing added without approval
    await handleEvent({ kind: "add", productId: "cow-milk", qty: 2 });
    expect(db.get().cart).toEqual([{ productId: "cow-milk", qty: 2, date: "2026-11-22" }]);
    expect(last().text).toMatch(/Added 2 × Cow Milk/);
    expect(last().text).toMatch(/don't place orders or pay/);
  });
});

describe("Scenario 2 — subscription modification", () => {
  it("shows current → proposed, executes only on confirm, supports undo", async () => {
    await userSays("Increase my daily milk quantity");
    const c = card("sub_change");
    expect(c).toMatchObject({ fromQty: 1, toQty: 2, effective: "2026-11-22", state: "pending" });
    expect(sub("cow-milk")!.qty).toBe(1);
    await handleEvent({ kind: "confirm", changeId: c.changeId });
    expect(sub("cow-milk")!.qty).toBe(2);
    expect(card("sub_change").state).toBe("confirmed");
    await handleEvent({ kind: "undo", changeId: c.changeId });
    expect(sub("cow-milk")!.qty).toBe(1);
  });
  it("'one more packet' adds one to the current quantity", async () => {
    await userSays("I want to add one more packet of milk to my regular subscription.");
    expect(card("sub_change")).toMatchObject({ fromQty: 1, toQty: 2 });
  });
  it("declining changes nothing", async () => {
    await userSays("Increase my daily milk quantity");
    await handleEvent({ kind: "cancel", changeId: card("sub_change").changeId });
    expect(sub("cow-milk")!.qty).toBe(1);
    expect(last().text).toMatch(/haven't changed anything/);
  });
  it("changing coconut frequency warns that the 4 pe 4 offer is voided", async () => {
    await userSays("Change my coconut water to daily");
    expect(card("sub_change").offerImpact).toMatch(/voids/);
  });
});

describe("Scenario 3 — vacation", () => {
  it("resolves next three days, respects cut-off, updates orders", async () => {
    await userSays("Pause my delivery for the next three days");
    const c = card("vacation");
    expect(c).toMatchObject({ start: "2026-11-22", end: "2026-11-24", resume: "2026-11-25", days: 3 });
    await handleEvent({ kind: "confirm", changeId: c.changeId });
    expect(db.get().vacations).toHaveLength(1);
    expect(db.get().orders.some((o) => o.date === "2026-11-22" && o.status === "scheduled")).toBe(false);
  });
  it("refuses more than 60 days", async () => {
    await userSays("pause from 22 nov to 30 jan");
    expect(db.get().vacations).toHaveLength(0);
  });
});

describe("Scenario 4 — wallet", () => {
  it("explains the ₹500 as a UPI Autopay top-up using ledger data", async () => {
    await userSays("Why was ₹500 deducted from my wallet?");
    const t = last().text;
    expect(t).toMatch(/UPI Autopay/);
    expect(t).toMatch(/₹78/);        // balance that triggered Autopay
    expect(t).toMatch(/₹200/);       // Autopay limit
    expect(card("txn_explain").txnId).toBe("TXN-1119-2");
  });
  it("lists recent debits and explains the latest from the order", async () => {
    await userSays("Why was money deducted?");
    expect(card("txn_list").txnIds.length).toBeGreaterThan(3);
    expect(last().text).toMatch(/₹37/);
  });
  it("never invents an unknown deduction", async () => {
    await userSays("Why was ₹999 deducted?");
    expect(last().text).toMatch(/can't find a ₹999 deduction/);
  });
  it("balance with runway", async () => {
    await userSays("How much money is left in my CD Money wallet?");
    expect(last().text).toMatch(/₹395/);
  });
});

describe("Scenario 5 — delivery issue", () => {
  beforeEach(() => {
    db.set((s) => ({ ...s, clock: "2026-11-22T05:40", orders: s.orders.map((o) => (o.date === "2026-11-22" ? { ...o, status: "delivered", statusAt: "05:12", pod: { at: "05:12", note: "Left at gate", photo: "gate" } } : o)) }));
  });
  it("shows status + POD, offers policy options, creates a ticket", async () => {
    await userSays("My milk hasn't arrived.");
    expect(card("order_status").orderId).toBe("ORD-1122-M");
    expect(last().text).toMatch(/05:12/);
    await userSays("Checked, nothing there");
    const opts = card("resolution_options").options.map((o: any) => o.id);
    expect(opts).toEqual(expect.arrayContaining(["redeliver", "credit", "human"]));
    await handleEvent({ kind: "resolve", orderId: "ORD-1122-M", option: "redeliver", reason: "not_received" });
    await handleEvent({ kind: "confirm", changeId: card("resolution_confirm").changeId });
    expect(db.get().tickets[0]).toMatchObject({ orderId: "ORD-1122-M", status: "resolved" });
    expect(last().text).toMatch(/case number is CD-\d{4}-\d{4}/);
  });
  it("Hinglish input gets a Hinglish reply", async () => {
    await userSays("mera doodh abhi tak nahi aaya");
    expect(last().text).toMatch(/Aaj ka order/);
  });
  it("status service down → no guessing, ticket + callback", async () => {
    ui.set((s) => ({ ...s, faults: { failNext: true, slow: false } }));
    await userSays("My milk hasn't arrived.");
    expect(last().text).toMatch(/won't guess/);
    expect(db.get().tickets[0].status).toBe("awaiting_callback");
  });
});

describe("Scenario 6 — wellness", () => {
  it("asks consent, goal, diet, allergy; excludes allergens; adds safety note", async () => {
    await userSays("I have started working out. Recommend products.");
    expect(last().text).toMatch(/isn't medical advice/);
    await handleEvent({ kind: "wellness", step: "consent", value: "save" });
    await handleEvent({ kind: "wellness", step: "goal", value: "high_protein" });
    await handleEvent({ kind: "wellness", step: "diet", value: "veg" });
    await handleEvent({ kind: "wellness", step: "allergy", value: "peanut" });
    const ids = card("products").items.map((i: any) => i.productId);
    expect(ids).not.toContain("peanut-butter");
    expect(ids).not.toContain("brown-eggs"); // vegetarian excludes egg
    expect(ids).toContain("hp-cow-milk");
    expect(last().text).toMatch(/left out Peanut Butter/);
    expect(last().text).toMatch(/not medical or diet advice/);
    expect(db.get().wellness?.allergies).toEqual(["peanut"]);
  });
  it("medical questions get a safety response", async () => {
    await userSays("I have diabetes, what should I eat?");
    expect(last().text).toMatch(/can't give medical/);
  });
});

describe("Guardrails", () => {
  it("failed write: says nothing changed and offers retry", async () => {
    await userSays("Increase my daily milk quantity");
    ui.set((s) => ({ ...s, faults: { failNext: true, slow: false } }));
    await handleEvent({ kind: "confirm", changeId: card("sub_change").changeId });
    expect(sub("cow-milk")!.qty).toBe(1);
    expect(last().text).toMatch(/nothing was changed/);
  });
  it("human handoff creates a case", async () => {
    await userSays("I want to talk to a person");
    expect(db.get().tickets).toHaveLength(1);
  });
  it("cancellation save flow offers alternatives before removing", async () => {
    await userSays("Stop my curd");
    expect(sub("low-fat-dahi")).toBeTruthy();
    expect(last().chips?.map((c: any) => c.label)).toContain("Going away for a while");
  });
});
