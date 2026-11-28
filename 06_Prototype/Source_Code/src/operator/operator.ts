// The in-app operator: turns a customer's goal into steps on the live app — observe the screen, decide,
// act through a declared action, observe again to verify, repeat. Nothing here is a scripted demo path:
// each decision reads the products, prices, ratings, fields and buttons actually rendered at that moment.
import { byId } from "../data/catalogue";
import { logCall, type Screen } from "../backend/store";
import { appRoot, describe, elementFor, observe, rupee, type ScreenContext, type ScreenProduct, type UiEl } from "./screen";
import { endOperator, fill, goBack, goTo, highlight, OP, scroll, setStep, Stopped, tap, until, wait } from "./actions";

export type Pick = "best_rated" | "cheapest" | "most_reviewed" | "first";
export interface FindSpec { query: string; maxPrice?: number; minPrice?: number; pick?: Pick; add: boolean; qty: number; productId?: string }
export interface OpChip { label: string; say?: string; screen?: Screen }
/** `text` is what the assistant says (and its caption, word for word); `detail` is shown under it, never spoken. */
export interface OpReport { ok: boolean; text: string; detail?: string; chips?: OpChip[]; productId?: string; options?: ScreenProduct[] }

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : /(ch|sh|x|s)$/.test(w) ? "es" : "s"}`;
const budgetText = (s: FindSpec) => (s.maxPrice != null ? ` within your ${rupee(s.maxPrice)} budget` : s.minPrice != null ? ` above ${rupee(s.minPrice)}` : "");
const facts = (p: ScreenProduct) => [p.size, rupee(p.price), p.rating ? `★${p.rating.toFixed(1)} (${p.reviews?.toLocaleString("en-IN")} ratings)` : ""].filter(Boolean).join(" · ");
const priceText = (s: FindSpec) => (s.maxPrice != null && s.minPrice != null ? `between ${rupee(s.minPrice)} and ${rupee(s.maxPrice)}` : s.maxPrice != null ? `under ${rupee(s.maxPrice)}` : s.minPrice != null ? `above ${rupee(s.minPrice)}` : "");

/** Run an operator task with a step indicator; always clears it, and honours Stop. */
export async function run(task: () => Promise<OpReport>): Promise<OpReport> {
  OP.cancelled = false;
  try { return await task(); }
  catch (e) {
    if (e instanceof Stopped) { logCall({ name: "operator stopped by the customer", kind: "guardrail", status: "info", channel: "inapp" }); return { ok: false, text: "Stopped. I didn't do anything after that." }; }
    logCall({ name: "operator error", kind: "app_action", status: "error", channel: "inapp", note: String((e as Error)?.message ?? e) });
    return { ok: false, text: "Something on the screen didn't respond as expected, so I stopped. Nothing else was changed." };
  } finally { endOperator(); }
}
export const stopOperator = () => { OP.cancelled = true; };

// ------------------------------------------------------------------ helpers over the live screen
function within(container: string, els: UiEl[]): UiEl[] {
  const c = elementFor(container); if (!c) return [];
  return els.filter((e) => { const el = elementFor(e.ref); return !!el && c.contains(el); });
}
function stepperValue(scope?: Element | null): number | undefined {
  const st = (scope ?? appRoot())?.querySelector("[data-agent-stepper]");
  const v = st?.getAttribute("data-agent-value"); return v == null ? undefined : Number(v);
}

async function ensureSearch(): Promise<string | null> {
  let ctx = observe();
  let s = ctx.inputs.find((i) => i.field === "search");
  if (s) return s.ref;
  await setStep("Opening search…");
  const homeSearch = ctx.elements.find((e) => e.nav === "products" && /search/i.test(e.label));
  if (homeSearch) await tap(homeSearch.ref, { why: "open search" }); else await goTo("products");
  ctx = observe(); s = ctx.inputs.find((i) => i.field === "search");
  return s?.ref ?? null;
}

export async function searchFor(query: string): Promise<ScreenContext | null> {
  const ref = await ensureSearch(); if (!ref) return null;
  const cur = observe().inputs.find((i) => i.ref === ref);
  if ((cur?.value ?? "").trim().toLowerCase() !== query.toLowerCase()) { await setStep(`Typing “${query}” into search…`); await fill(ref, query); }
  return observe();
}

async function sortBy(kind: "rating" | "price") {
  const label = kind === "rating" ? "Sort by Rating" : "Sort by Price: low to high";
  const b = observe().elements.find((e) => e.label === label);
  if (b) { await setStep(kind === "rating" ? "Sorting results by rating…" : "Sorting results by price…"); await tap(b.ref, { why: `sort by ${kind}` }); }
}

function choose(c: ScreenProduct[], pick?: Pick): ScreenProduct {
  if (pick === "cheapest") return [...c].sort((a, b) => a.price - b.price)[0];
  if (pick === "best_rated") return [...c].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0))[0];
  if (pick === "most_reviewed") return [...c].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0))[0];
  return c.find((p) => p.inView) ?? c[0];
}

// ------------------------------------------------------------------ goals
/** Search the catalogue in the app, filter what is on screen by the customer's constraints, pick, optionally add. */
export async function findProducts(spec: FindSpec): Promise<OpReport> {
  return run(async () => {
    let ctx = await searchFor(spec.query);
    if (!ctx) return { ok: false, text: "I couldn't find a search box in the app." };
    if (spec.pick === "best_rated" || spec.pick === "most_reviewed") await sortBy("rating"); else if (spec.pick === "cheapest") await sortBy("price");
    ctx = observe();
    const results = ctx.products;
    await setStep(`Reviewing ${plural(results.length, "result")}…`);
    logCall({ name: `read_results("${spec.query}")`, kind: "screen", status: "info", channel: "inapp", args: { results: results.map((r) => ({ id: r.productId, price: r.price, rating: r.rating })) } });
    await wait(350);
    if (!results.length) {
      const protein = /protein|whey/i.test(spec.query);
      return { ok: false, text: `I couldn't find any ${spec.query} in the catalogue. ${protein ? "Would you like to see high-protein products instead?" : "Would you like to browse all products instead?"}`,
        chips: protein ? [{ label: "Show high-protein products", say: "Show me high protein products" }] : [{ label: "Browse products", screen: "products" }] };
    }
    const inStock = results.filter((r) => !r.outOfStock);
    const ok = inStock.filter((r) => (spec.maxPrice == null || r.price <= spec.maxPrice) && (spec.minPrice == null || r.price >= spec.minPrice));
    if (!ok.length) {
      const low = [...inStock].sort((a, b) => a.price - b.price)[0];
      return { ok: false, text: `I found ${spec.query}, but nothing ${priceText(spec) || "in stock"}.${low ? ` The most affordable is ${low.name} at ${rupee(low.price)}. Would you like that instead?` : ""}`,
        detail: results.map((r) => `${r.name} · ${rupee(r.price)}`).join("  |  "),
        chips: low ? [{ label: `Add ${low.name}`, say: `Add the ${low.name} to my cart` }] : [] };
    }
    const chosen = (spec.productId && ok.find((r) => r.productId === spec.productId)) || choose(ok, spec.pick);
    await setStep(`Choosing ${chosen.name}…`); await highlight(chosen.ref, 700);
    const why = reason(spec, chosen, ok, inStock);
    if (!spec.add) {
      return { ok: true, productId: chosen.productId, options: ok,
        text: `I found ${plural(ok.length, `${spec.query} option`)}${priceText(spec) ? ` ${priceText(spec)}` : ""}. Here they are on your screen, with their prices.${spec.pick ? ` The ${spec.pick === "cheapest" ? "most affordable" : "best-rated"} is ${chosen.name} at ${rupee(chosen.price)}.` : ""} Would you like me to add one?`,
        detail: ok.slice(0, 4).map((r) => `${r.name} · ${rupee(r.price)}${r.rating ? ` · ★${r.rating.toFixed(1)}` : ""}`).join("  |  "),
        chips: [{ label: `Add ${chosen.name}`, say: `Add the ${chosen.name} to my cart` }] };
    }
    const r = await addProductOnScreen(chosen.productId, spec.qty);
    if (!r.ok) return r;
    return { ok: true, productId: chosen.productId,
      text: spec.pick === "best_rated" || spec.pick === "most_reviewed" ? `Done! I've added the best-rated ${spec.query}${budgetText(spec)} to your cart. It's ${chosen.name}, at ${rupee(chosen.price)}.`
        : spec.pick === "cheapest" ? `Done! I've added the most affordable ${spec.query}${budgetText(spec)} to your cart. It's ${chosen.name}, at ${rupee(chosen.price)}.`
        : `Done! I've added ${spec.qty > 1 ? `${spec.qty} × ` : ""}${chosen.name} to your cart, at ${rupee(chosen.price)}.`,
      detail: `${facts(chosen)} · ${why} Checkout stays with you.`,
      chips: [{ label: "View cart", screen: "cart" }, { label: "Remove it", say: `Remove the ${chosen.name} from my cart` }] };
  });
}

function reason(spec: FindSpec, c: ScreenProduct, ok: ScreenProduct[], all: ScreenProduct[]): string {
  const range = priceText(spec);
  if (spec.pick === "best_rated" || spec.pick === "most_reviewed") {
    const better = all.filter((x) => (x.rating ?? 0) > (c.rating ?? 0) && !ok.includes(x)).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];
    return `It's the best-rated of ${plural(ok.length, "option")}${range ? ` ${range}` : ""}${better ? ` (${better.name} is rated ★${better.rating?.toFixed(1)} but costs ${rupee(better.price)})` : ""}.`;
  }
  if (spec.pick === "cheapest") return `It's the cheapest of ${plural(ok.length, "option")}${range ? ` ${range}` : ""}.`;
  return ok.length > 1 ? `It's the first of ${plural(ok.length, "match")}${range ? ` ${range}` : ""}.` : "";
}

/** Add a product using whatever this screen offers: its Add button in a list, or the product page's own controls. */
export async function addProductOnScreen(productId: string, qty: number): Promise<OpReport & { cart?: number }> {
  let ctx = observe();
  if (ctx.screen === "product" && ctx.contextProductId === productId) return addFromDetail(productId, qty);
  let prod = ctx.products.find((p) => p.productId === productId && ctx.elements.some((e) => e.productId === productId && e.action === "add"));
  if (!prod) {
    const p = byId(productId);
    const c = await searchFor(p.short.length > 3 ? p.short : p.name);
    ctx = c ?? observe(); prod = ctx.products.find((x) => x.productId === productId);
  }
  if (!prod) return { ok: false, text: `I couldn't find ${byId(productId).name} on screen.` };
  if (prod.outOfStock) return { ok: false, text: `${prod.name} isn't available for tomorrow, so I didn't add it.` };
  const before = prod.inCart;
  const inCart = () => observe().products.find((p) => p.productId === productId)?.inCart ?? 0;
  for (let i = 0; i < qty; i++) {
    const cur = observe(); const pr = cur.products.find((p) => p.productId === productId)!;
    const btn = within(pr.ref, cur.elements).find((e) => e.action === "add");
    if (!btn) return { ok: false, text: `I can see ${pr.name}, but not its Add button.` };
    await setStep(`Adding ${pr.name}${qty > 1 ? ` (${i + 1} of ${qty})` : ""}…`);
    const r = await tap(btn.ref, { why: `add ${pr.name} to cart` });
    if (r.status !== "ok") return { ok: false, text: r.message ?? "That didn't go through." };
    await until(() => inCart() >= before + i + 1);
  }
  const after = inCart();
  logCall({ name: `verify: ${byId(productId).name} in cart ${before} → ${after}`, kind: "screen", status: after - before >= qty ? "ok" : "error", channel: "inapp" });
  if (after - before < qty) return { ok: false, text: `I tapped Add, but the cart didn't change, so ${after > before ? "only part of it was" : "nothing was"} added. Want me to try again?`, chips: [{ label: "Try again", say: `Add ${qty} ${byId(productId).short} to my cart` }] };
  return { ok: true, text: "", cart: observe().cartCount };
}

/** On a product page: switch to one-time purchase if needed, set the quantity, press Add to cart. */
async function addFromDetail(productId: string, qty: number): Promise<OpReport & { cart?: number }> {
  let ctx = observe();
  const freq = ctx.elements.find((e) => e.label.startsWith("Subscription type:"));
  if (freq && !/One time$/.test(freq.label)) {
    await setStep("Switching to a one-time purchase…");
    await tap(freq.ref, { why: "change subscription type" });
    const once = observe().elements.find((e) => e.label === "Frequency One time");
    if (!once) return { ok: false, text: "This product can only be subscribed to, not added once." };
    await tap(once.ref, { why: "choose one-time" });
  }
  const set = await setQtyOnScreen(qty); if (!set.ok) return set;
  ctx = observe();
  const cta = ctx.elements.find((e) => e.label === "Add to cart");
  if (!cta) return { ok: false, text: "I can't see an Add to cart button here." };
  const before = ctx.cartCount;
  await setStep(`Adding ${byId(productId).name}…`);
  const r = await tap(cta.ref, { why: "add to cart" });
  if (r.status !== "ok") return { ok: false, text: r.message ?? "That didn't go through." };
  await until(() => observe().cartCount - before >= qty);
  const after = observe();
  if (after.cartCount - before < qty) return { ok: false, text: "I pressed Add to cart, but the cart didn't change, so nothing was added." };
  return { ok: true, text: "", cart: after.cartCount };
}

/** Set the quantity stepper on the current screen (product page). */
export async function setQtyOnScreen(target: number): Promise<OpReport> {
  const root = appRoot()?.querySelector("[data-agent-viewport]");
  for (let i = 0; i < 25; i++) {
    const v = stepperValue(root); if (v == null) return { ok: false, text: "There's no quantity control on this screen." };
    if (v === target) return { ok: true, text: `Quantity set to ${target}.` };
    const label = v < target ? "Increase" : "Decrease";
    const btn = observe().elements.find((e) => e.label === label && !e.productId && e.inView) ?? observe().elements.find((e) => e.label === label && !e.productId);
    if (!btn || btn.disabled) return { ok: false, text: `The quantity can't go ${v < target ? "higher" : "lower"} than ${v} here.` };
    await setStep(`Setting quantity to ${target}…`);
    await tap(btn.ref, { why: `quantity ${v} → ${target}` });
  }
  return { ok: false, text: "The quantity didn't change as expected." };
}

/** Change or remove a cart line through the cart screen's own controls. */
export async function cartChange(productId: string | undefined, target: number | "remove", delta?: number): Promise<OpReport> {
  return run(async () => {
    await setStep("Opening your cart…");
    await goTo("cart");
    let ctx = observe();
    const lines = ctx.products;
    if (!lines.length) return { ok: false, text: "Your cart is empty, so there's nothing to change." };
    const line = productId ? lines.find((l) => l.productId === productId) : lines.length === 1 ? lines[0] : undefined;
    if (!line) {
      return { ok: false, text: productId ? `${byId(productId).name} isn't in your cart. It has ${lines.map((l) => `${l.inCart} × ${l.name}`).join(", ")}.` : `Which item? Your cart has ${lines.map((l) => l.name).join(", ")}.`,
        chips: lines.slice(0, 3).map((l) => ({ label: l.name, say: `${target === "remove" ? "Remove" : "Change"} the ${l.name} ${target === "remove" ? "from my cart" : `in my cart to ${target}`}` })) };
    }
    const goal = target === "remove" ? 0 : delta != null ? Math.max(0, line.inCart + delta) : target;
    if (goal === line.inCart) return { ok: true, text: `${line.name} is already at ${goal} in your cart.` };
    for (let i = 0; i < 25; i++) {
      ctx = observe(); const cur = ctx.products.find((l) => l.productId === line.productId);
      const have = cur?.inCart ?? 0;
      if (have === goal) break;
      if (!cur) break;
      const btn = within(cur.ref, ctx.elements).find((e) => e.label === (have > goal ? "Decrease" : "Increase"));
      if (!btn) return { ok: false, text: "I can't find the quantity buttons for that item." };
      await setStep(goal === 0 ? `Removing ${line.name}…` : `Changing ${line.name} to ${goal}…`);
      await tap(btn.ref, { why: `cart quantity ${have} → ${goal}` });
    }
    ctx = observe();
    const now = ctx.products.find((l) => l.productId === line.productId)?.inCart ?? 0;
    logCall({ name: `verify: ${line.name} in cart → ${now}`, kind: "screen", status: now === goal ? "ok" : "error", channel: "inapp" });
    if (now !== goal) return { ok: false, text: "The cart didn't update as expected, so please check it." };
    const total = ctx.products.reduce((s, l) => s + l.price * l.inCart, 0);
    return { ok: true, detail: ctx.products.length ? `Cart: ${plural(ctx.cartCount, "item")}, ${rupee(total)}` : "Cart is empty", text: goal === 0 ? `Done! I've removed ${line.name} from your cart.${ctx.products.length ? "" : " Your cart is empty now."}` : `Done! ${line.name} is now ${goal} in your cart. Total ${rupee(total)}.` };
  });
}

/** Open a screen through the app's own navigation. */
export async function openScreen(target: Screen, params?: Record<string, string>): Promise<OpReport & { path: string[] }> {
  let path: string[] = [];
  const r = await run(async () => {
    await setStep("Finding the way there…");
    const g = await goTo(target, params); path = g.path;
    return { ok: g.ctx.screen === target, text: g.ctx.title };
  });
  return { ...r, path };
}

/** Tap something by its visible name ("tap Rating", "open Transactions"). */
export async function tapByName(name: string, allowT2 = false): Promise<OpReport> {
  return run(async () => {
    const ctx = observe(); const n = name.toLowerCase().replace(/\b(the|button|tab|option|on)\b/g, " ").replace(/\s+/g, " ").trim();
    if (!n) return { ok: false, text: "What should I tap?" };
    const score = (e: UiEl) => { const l = e.label.toLowerCase(); return l === n ? 3 : l.startsWith(n) ? 2 : l.includes(n) ? 1 : n.includes(l) && l.length > 3 ? 0.5 : 0; };
    const cands = ctx.elements.filter((e) => e.role !== "input" && score(e) > 0).sort((a, b) => score(b) - score(a) || Number(b.inView) - Number(a.inView));
    if (!cands.length) return { ok: false, text: `I can't see “${name}” on this screen. ${describe(ctx)}` };
    await setStep(`Tapping “${cands[0].label}”…`);
    const r = await tap(cands[0].ref, { allowT2, why: `customer asked to tap ${name}` });
    if (r.status !== "ok") return { ok: false, text: r.message ?? "That didn't work." };
    return { ok: true, text: r.ctx.screen !== ctx.screen ? `Done. You're now on ${r.ctx.title}.` : "Done.", detail: `Tapped “${cands[0].label}”` };
  });
}

/** Type into a field by name, or the only field on screen. */
export async function fillByName(field: string | undefined, text: string): Promise<OpReport> {
  return run(async () => {
    const ctx = observe(); const f = (field ?? "").toLowerCase();
    const input = (f && ctx.inputs.find((i) => i.label.toLowerCase().includes(f))) || (ctx.inputs.length === 1 ? ctx.inputs[0] : ctx.inputs.find((i) => i.field === "search"));
    if (!input) return { ok: false, text: ctx.inputs.length ? `Which field? I can see ${ctx.inputs.map((i) => i.label).join(", ")}.` : "There's no text field on this screen." };
    await setStep(`Typing into ${input.label}…`);
    const r = await fill(input.ref, text);
    return { ok: r.status === "ok", text: r.status === "ok" ? `Done, I've entered “${text}”.` : r.message ?? "That didn't work.", detail: r.status === "ok" ? `Field: ${input.label}` : undefined };
  });
}

export async function scrollScreen(dir: "up" | "down"): Promise<OpReport> {
  return run(async () => { await setStep(`Scrolling ${dir}…`); const r = await scroll(dir); return { ok: r.status === "ok", text: r.status === "ok" ? "Done." : r.message!, detail: r.status === "ok" ? `Scrolled ${dir}` : undefined }; });
}
export async function back(): Promise<OpReport> {
  return run(async () => { await setStep("Going back…"); const r = await goBack(); return { ok: true, text: `You're back on ${r.ctx.title}.` }; });
}
/** Open a product's page from wherever it is visible, searching for it if needed. */
export async function openProduct(productId: string): Promise<OpReport> {
  return run(async () => {
    let ctx = observe(); const p = byId(productId);
    if (ctx.screen === "product" && ctx.contextProductId === productId) return { ok: true, text: `You're already on ${p.name}.` };
    let tile = ctx.products.find((x) => x.productId === productId);
    if (!tile) { ctx = (await searchFor(p.short.length > 3 ? p.short : p.name)) ?? observe(); tile = ctx.products.find((x) => x.productId === productId); }
    const open = tile && within(tile.ref, ctx.elements).find((e) => e.action === "open");
    if (!open) return { ok: false, text: `I couldn't find ${p.name} on screen.` };
    await setStep(`Opening ${p.name}…`);
    const r = await tap(open.ref, { why: `open ${p.name}` });
    const ok = r.ctx.screen === "product" && r.ctx.contextProductId === productId;
    return { ok, text: ok ? `Here's ${p.name}. Would you like to add it to your cart, or set up a subscription?` : `I tried to open ${p.name}, but the screen didn't change.`,
      detail: ok ? [p.size, p.rating ? `★${p.rating.toFixed(1)} (${p.reviews?.toLocaleString("en-IN")} ratings)` : ""].filter(Boolean).join(" · ") : undefined,
      chips: ok ? [{ label: "Add to cart", say: "Add this to my cart" }, { label: "Subscribe daily", say: "Subscribe to this daily" }] : [] };
  });
}
export async function setQuantity(qty: number): Promise<OpReport> { return run(() => setQtyOnScreen(qty)); }
export async function addProduct(productId: string, qty: number): Promise<OpReport & { cart?: number }> {
  return run(async () => {
    const r = await addProductOnScreen(productId, qty);
    if (!r.ok) return r;
    const p = byId(productId);
    return { ...r, productId, text: `Done! I've added ${qty} × ${p.name} to your cart.`, detail: `Cart: ${plural(r.cart ?? 0, "item")} · checkout and payment stay with you`,
      chips: [{ label: "View cart", screen: "cart" }, { label: "Remove it", say: `Remove the ${p.name} from my cart` }] };
  });
}
