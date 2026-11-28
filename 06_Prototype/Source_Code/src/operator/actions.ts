// Declared in-app actions the agent may call (the prototype's equivalent of Graine's Actions tab:
// Navigate · Fill a field · Highlight · tap). Every action works on the LIVE app UI, is shown to the
// customer with an on-screen pointer, is logged in the activity inspector, and is verified by re-reading
// the screen afterwards. Safety tiers are enforced here, not left to the conversation:
//   T4 (pay, place order, recharge) — the agent never presses these.
//   T2 (confirm / update / remove / pause) — only after the customer has explicitly confirmed.
import { back as appBack, logCall, navigate as appNavigate, ui, updateCall, type Screen } from "../backend/store";
import { appRoot, elementFor, labelOf, observe, type ScreenContext, type UiEl } from "./screen";

/** speed 1 = human-visible pacing in the app; 0 = instant (unit tests). */
export const OP = { speed: 1, cancelled: false };
export class Stopped extends Error { constructor() { super("stopped"); } }

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms * OP.speed));
const check = () => { if (OP.cancelled) throw new Stopped(); };

// The step line is an OPERATIONAL update: shown in the bar while the agent works, never spoken (speechPolicy).
let stepSeq = 0;
export function setStep(step: string): Promise<void> {
  const id = `step-${++stepSeq}`;
  ui.set((s) => ({ ...s, operator: { step, running: true, id } }));
  return Promise.resolve();
}
export function endOperator() {
  hidePointer();
  ui.set((s) => ({ ...s, operator: null }));
}

// ------------------------------------------------------------------ on-screen pointer (highlight)
function pointerEl(): HTMLElement | null {
  const root = appRoot() as HTMLElement | null; if (!root) return null;
  let p = root.querySelector<HTMLElement>("#agent-pointer");
  if (!p) {
    p = document.createElement("div"); p.id = "agent-pointer"; p.setAttribute("aria-hidden", "true"); p.setAttribute("data-agent-ignore", "");
    p.className = "agent-pointer"; root.appendChild(p);
  }
  return p;
}
export function pointAt(el: Element, mode: "tap" | "focus" = "tap") {
  const root = appRoot(); const p = pointerEl(); if (!root || !p) return;
  const rr = root.getBoundingClientRect(); const r = el.getBoundingClientRect();
  if (!r.width && !r.height) return;
  p.style.left = `${r.left - rr.left - 4}px`; p.style.top = `${r.top - rr.top - 4}px`;
  p.style.width = `${r.width + 8}px`; p.style.height = `${r.height + 8}px`;
  p.dataset.mode = mode; p.classList.add("on");
}
export function hidePointer() { pointerEl()?.classList.remove("on"); }

async function reveal(el: Element) {
  const r = el.getBoundingClientRect(); const vpEl = el.closest("[data-agent-viewport]");
  if (vpEl && r.height) {
    const vp = vpEl.getBoundingClientRect();
    const margin = 150; // keep clear of the bottom navigation and the assistant bar
    if (r.top < vp.top + 60 || r.bottom > vp.bottom - margin) {
      (vpEl as HTMLElement).scrollBy?.({ top: r.top - vp.top - vp.height / 3, behavior: OP.speed ? "smooth" : "auto" });
      await wait(380);
    }
  }
}
/** Poll the live screen until a condition holds (real time: the simulated back end answers in 0.3–2 s). */
export async function until(pred: () => boolean, ms = 3500): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (pred()) return true; await new Promise((r) => setTimeout(r, 80)); }
  return pred();
}
export async function settle() {
  await new Promise((r) => setTimeout(r, OP.speed ? 110 : 0));
  if (OP.speed && typeof requestAnimationFrame !== "undefined") await new Promise((r) => requestAnimationFrame(() => r(null)));
}

// ------------------------------------------------------------------ safety tiers
export function tierOf(el: Element): "T1" | "T2" | "T4" {
  const t = el.getAttribute("data-agent-tier");
  if (t === "T4" || t === "T3") return "T4";
  if (t === "T2") return "T2";
  if (t === "T1") return "T1";
  const label = labelOf(el);
  if (/\b(pay|place order|recharge|add money|checkout|check out)\b/i.test(label)) return "T4";
  if (/\b(confirm|update subscription|remove|pause|end vacation|delete|unsubscribe)\b/i.test(label)) return "T2";
  return "T1";
}

export interface ActResult { status: "ok" | "refused" | "error"; message?: string; ctx: ScreenContext }
const res = (status: ActResult["status"], message?: string): ActResult => ({ status, message, ctx: observe() });

function resolve(target: string | Element): Element | null {
  return typeof target === "string" ? elementFor(target) : target.isConnected ? target : null;
}

/** Tap a button / link / switch on the current screen. */
export async function tap(target: string | Element, opts: { allowT2?: boolean; why?: string } = {}): Promise<ActResult> {
  check();
  const el = resolve(target);
  if (!el) return res("error", "That element is no longer on the screen.");
  const label = labelOf(el); const tier = tierOf(el); const screen = ui.get().route.screen;
  if (tier === "T4") {
    logCall({ name: `tap("${label}") refused — payments and orders stay with the customer (T4)`, kind: "guardrail", status: "refused", channel: "inapp" });
    return res("refused", `I don't press “${label}”. Paying and placing orders always stays with you.`);
  }
  if (tier === "T2" && !opts.allowT2) {
    logCall({ name: `tap("${label}") held — needs the customer's confirmation (T2)`, kind: "guardrail", status: "refused", channel: "inapp" });
    return res("refused", `“${label}” changes your account, so I need your confirmation first.`);
  }
  if ((el as HTMLButtonElement).disabled) return res("refused", `“${label}” is disabled right now.`);
  const id = logCall({ name: `tap("${label}")`, kind: "app_action", status: "pending", tier, channel: "inapp", args: { screen, why: opts.why } });
  await reveal(el); pointAt(el); await wait(360); check();
  (el as HTMLElement).click();
  await settle(); await wait(140);
  const ctx = observe();
  updateCall(id, { status: "ok", note: `screen now: ${ctx.title}` });
  return { status: "ok", ctx };
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, v: string) {
  const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, v);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Type into an input field, character by character so the customer sees it. */
export async function fill(target: string | Element, text: string): Promise<ActResult> {
  check();
  const el = resolve(target) as HTMLInputElement | null;
  if (!el) return res("error", "That field is no longer on the screen.");
  const label = labelOf(el);
  const id = logCall({ name: `fill_field("${label}", "${text}")`, kind: "app_action", status: "pending", tier: "T1", channel: "inapp" });
  await reveal(el); pointAt(el, "focus"); el.focus?.();
  if (el.value) { setNativeValue(el, ""); await wait(120); }
  if (OP.speed) {
    for (let i = 1; i <= text.length; i++) { check(); setNativeValue(el, text.slice(0, i)); await wait(32); }
  } else setNativeValue(el, text);
  await settle();
  const ok = (resolve(target) as HTMLInputElement | null)?.value === text;
  updateCall(id, { status: ok ? "ok" : "error", note: ok ? "value verified on screen" : "value did not stick" });
  return ok ? res("ok") : res("error", `I typed into “${label}” but it didn't take the text.`);
}

/** Scroll the current screen. */
export async function scroll(dir: "down" | "up"): Promise<ActResult> {
  check();
  const vp = appRoot()?.querySelector<HTMLElement>("[data-agent-viewport]");
  if (!vp) return res("error", "This screen doesn't scroll.");
  logCall({ name: `scroll(${dir})`, kind: "app_action", status: "ok", tier: "T0", channel: "inapp" });
  vp.scrollBy?.({ top: (dir === "down" ? 1 : -1) * vp.clientHeight * 0.6, behavior: OP.speed ? "smooth" : "auto" });
  await wait(420);
  return res("ok");
}

/** Back, through the screen's own back button when there is one. */
export async function goBack(): Promise<ActResult> {
  const ctx = observe();
  const b = ctx.elements.find((e) => e.role === "back" && e.inView);
  if (b) return tap(b.ref);
  logCall({ name: "navigate(back) — app handler", kind: "app_action", status: "ok", tier: "T0", channel: "inapp" });
  appBack(); await settle();
  return res("ok");
}

/** Navigate to a screen through the app's own UI: a visible link, the bottom bar, or Menu › item.
 *  Falls back to the app's declared Navigate handler only when no visible path exists. */
export async function goTo(target: Screen, params?: Record<string, string>): Promise<ActResult & { path: string[] }> {
  const path: string[] = [];
  for (let step = 0; step < 4; step++) {
    check();
    const ctx = observe();
    if (ctx.screen === target && (!params || Object.entries(params).every(([k, v]) => ctx.params[k] === v))) return { status: "ok", ctx, path };
    if (params) break; // parameterised screens (a specific order or product) use the Navigate handler below
    const direct = pick(ctx.elements.filter((e) => e.nav === target && !e.disabled));
    if (direct) { const r = await tap(direct.ref, { why: `navigate to ${target}` }); path.push(direct.label.replace(/ tab$/, "")); if (r.status !== "ok") break; continue; }
    const menu = target !== "menu" ? pick(ctx.elements.filter((e) => e.nav === "menu")) : undefined;
    if (menu) { const r = await tap(menu.ref, { why: `open Menu to reach ${target}` }); path.push("Menu"); if (r.status !== "ok") break; continue; }
    const b = ctx.elements.find((e) => e.role === "back" && e.inView);
    if (b && step < 2) { await tap(b.ref, { why: "go back to find a route" }); path.push("Back"); continue; }
    break;
  }
  const ctx0 = observe();
  if (ctx0.screen === target && !params) return { status: "ok", ctx: ctx0, path };
  logCall({ name: `navigate(${target}${params ? `, ${JSON.stringify(params)}` : ""}) — app's Navigate handler`, kind: "app_action", status: "ok", tier: "T0", channel: "inapp" });
  appNavigate(target, params); await settle(); await wait(200);
  return { status: "ok", ctx: observe(), path: [...path, "direct"] };
}
const pick = (els: UiEl[]) => els.find((e) => e.inView) ?? els[0];

/** Highlight an element (Graine "Highlight" action) without pressing it. */
export async function highlight(target: string | Element, ms = 700) {
  const el = resolve(target); if (!el) return;
  await reveal(el); pointAt(el, "focus"); await wait(ms);
}
