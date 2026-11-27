// Screen context for the in-app agent.
//
// Graine's in-app SDK lets the agent "see the customer's screen" through structured fields the app reports,
// and act through declared handlers the app implements (Navigate, Fill a field, Highlight, …). This module is
// the prototype's version of that reporting layer: it reads the LIVE rendered app (not a script), so whatever
// the customer can see — screen, title, inputs and their values, buttons, product listings with price and
// rating, what is already in the cart — is what the agent reasons over. It is re-read after every action.
import { db, ui, type Screen } from "../backend/store";

export type Role = "button" | "input" | "switch" | "nav" | "back";

export interface UiEl {
  ref: string;
  role: Role;
  label: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  tier?: string;          // T2 needs the customer's confirmation, T4 the agent never presses
  nav?: string;           // screen this element opens (declared by the app)
  action?: string;        // add | open | back
  field?: string;         // input purpose, e.g. "search"
  productId?: string;     // element belongs to this product
  inView: boolean;
}

export interface ScreenProduct {
  ref: string;
  productId: string;
  name: string;
  price: number;
  rating?: number;
  reviews?: number;
  size?: string;
  inCart: number;
  outOfStock: boolean;
  inView: boolean;
}

export interface ScreenContext {
  screen: Screen;
  params: Record<string, string>;
  title: string;
  elements: UiEl[];
  inputs: UiEl[];
  products: ScreenProduct[];
  contextProductId?: string;  // the product a detail screen is about ("this")
  cartCount: number;
  hasDom: boolean;
  summary: string;
}

export const SCREEN_NAMES: Record<string, string> = {
  home: "Home", products: "Products", product: "Product details", cart: "Cart", subscriptions: "My Subscriptions",
  subscription_edit: "Edit subscription", vacations: "Vacations", cdmoney: "CD Money", transactions: "Transactions", orders: "My Orders",
  order: "Order details", account: "Account & Preferences", menu: "Menu", offers: "Offer Zone", wellness: "Your Wellness Journey",
  ayuh: "Ayuh help", history: "Assistant history", whatsapp: "WhatsApp", call: "Phone call",
};

// ref ↔ element registry, rebuilt on every observation
let refs = new Map<string, Element>();
const refOf = new WeakMap<Element, string>();
let seq = 0;
function register(el: Element): string {
  let r = refOf.get(el);
  if (!r) { r = `e${++seq}`; refOf.set(el, r); }
  refs.set(r, el);
  return r;
}
export const elementFor = (ref: string): Element | null => {
  const el = refs.get(ref);
  return el && el.isConnected ? el : null;
};

export const appRoot = (): Element | null => (typeof document === "undefined" ? null : document.querySelector("[data-agent-root]"));
export const hasDom = () => !!appRoot();

export function labelOf(el: Element): string {
  const raw = el.getAttribute("data-agent-label") || el.getAttribute("aria-label") || (el as HTMLInputElement).placeholder || el.textContent || "";
  return raw.replace(/\s+/g, " ").trim().slice(0, 90);
}

function visibleIn(el: Element, root: Element): boolean {
  const r = el.getBoundingClientRect();
  const vpEl = el.closest("[data-agent-viewport]") ?? root;
  const vp = vpEl.getBoundingClientRect();
  if (vp.width === 0 && vp.height === 0) return true; // no layout engine (unit tests): treat as visible
  if (r.width === 0 && r.height === 0) return false;
  return r.bottom > vp.top + 4 && r.top < vp.bottom - 4 && r.right > vp.left + 2 && r.left < vp.right - 2;
}

const num = (v: string | null) => (v == null || v === "" ? undefined : Number(v));

/** Read what is on the customer's screen right now. */
export function observe(): ScreenContext {
  const s = ui.get(); const d = db.get();
  const screen = s.route.screen;
  const base: ScreenContext = {
    screen, params: s.route.params ?? {}, title: SCREEN_NAMES[screen] ?? screen, elements: [], inputs: [], products: [],
    contextProductId: screen === "product" ? s.route.params?.id ?? "cow-milk" : undefined,
    cartCount: d.cart.reduce((n, c) => n + c.qty, 0), hasDom: false, summary: "",
  };
  const root = appRoot();
  if (!root) return { ...base, summary: summarize(base) };
  refs = new Map();
  const skip = (el: Element) => !!el.closest("[data-agent-ignore]");
  const title = root.querySelector("[data-agent-viewport] [data-agent-title]")?.textContent?.trim();

  const elements: UiEl[] = [];
  root.querySelectorAll("button, input, textarea, select, [role=switch]").forEach((el) => {
    if (skip(el)) return;
    const tag = el.tagName;
    const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    const nav = el.getAttribute("data-agent-nav") ?? undefined;
    const action = el.getAttribute("data-agent-action") ?? undefined;
    const role: Role = isInput ? "input" : el.getAttribute("role") === "switch" ? "switch" : action === "back" ? "back" : nav ? "nav" : "button";
    elements.push({
      ref: register(el), role, label: labelOf(el),
      value: isInput ? (el as HTMLInputElement).value : undefined,
      checked: el.getAttribute("role") === "switch" ? el.getAttribute("aria-checked") === "true" : undefined,
      disabled: (el as HTMLButtonElement).disabled || undefined,
      tier: el.getAttribute("data-agent-tier") ?? undefined, nav, action,
      field: el.getAttribute("data-agent-field") ?? undefined,
      productId: el.closest("[data-agent-product]")?.getAttribute("data-agent-product") ?? undefined,
      inView: visibleIn(el, root),
    });
  });

  const seen = new Set<string>();
  const products: ScreenProduct[] = [];
  root.querySelectorAll("[data-agent-product]").forEach((el) => {
    if (skip(el)) return;
    const id = el.getAttribute("data-agent-product")!;
    const inView = visibleIn(el, root);
    if (seen.has(id)) { // the same product in two rails: keep the visible one
      const prev = products.find((p) => p.productId === id)!;
      if (!prev.inView && inView) Object.assign(prev, { ref: register(el), inView });
      return;
    }
    seen.add(id);
    products.push({
      ref: register(el), productId: id, name: el.getAttribute("data-agent-name") ?? id, price: Number(el.getAttribute("data-agent-price") ?? 0),
      rating: num(el.getAttribute("data-agent-rating")), reviews: num(el.getAttribute("data-agent-reviews")), size: el.getAttribute("data-agent-size") ?? undefined,
      inCart: Number(el.getAttribute("data-agent-incart") ?? 0), outOfStock: el.getAttribute("data-agent-stock") === "out", inView,
    });
  });

  const ctx: ScreenContext = {
    ...base, title: screen === "product" && title ? title : base.title, elements,
    inputs: elements.filter((e) => e.role === "input"), products, hasDom: true,
  };
  ctx.summary = summarize(ctx);
  return ctx;
}

export const rupee = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function summarize(c: ScreenContext): string {
  const parts = [c.title];
  c.inputs.forEach((i) => parts.push(`${i.label || "input"}: ${i.value ? `“${i.value}”` : "empty"}`));
  if (c.products.length) {
    const shown = c.products.filter((p) => p.inView);
    parts.push(`${c.products.length} product${c.products.length > 1 ? "s" : ""} listed${shown.length && shown.length < c.products.length ? ` (${shown.length} in view)` : ""}`);
  }
  if (c.contextProductId) parts.push(`showing ${c.contextProductId}`);
  parts.push(`cart ${c.cartCount}`);
  return parts.join(" · ");
}

/** Plain-language description of the screen for "what's on this screen?". */
export function describe(c: ScreenContext): string {
  const lines: string[] = [`You're on ${c.title}.`];
  const search = c.inputs.find((i) => i.field === "search");
  if (search) lines.push(search.value ? `The search box has “${search.value}”.` : "There's a search box at the top.");
  if (c.products.length) {
    const list = (c.products.some((p) => p.inView) ? c.products.filter((p) => p.inView) : c.products).slice(0, 4);
    lines.push(`I can see ${c.products.length} product${c.products.length > 1 ? "s" : ""}, including ${list.map((p) => `${p.name} (${rupee(p.price)}${p.rating ? `, ★${p.rating.toFixed(1)}` : ""})`).join(", ")}.`);
  }
  const keys = c.elements.filter((e) => e.inView && e.role !== "input" && !e.productId && e.label && e.label.length < 40 && !/tab$/.test(e.label)).map((e) => e.label);
  const uniq = Array.from(new Set(keys)).slice(0, 5);
  if (uniq.length) lines.push(`Buttons here include ${uniq.join(", ")}.`);
  lines.push(c.cartCount ? `Your cart has ${c.cartCount} item${c.cartCount > 1 ? "s" : ""}.` : "Your cart is empty.");
  return lines.join(" ");
}
