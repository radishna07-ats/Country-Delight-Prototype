import { useSyncExternalStore } from "react";
import { makeSeed, STATE_VERSION, type DemoState } from "../data/seed";
import type { Channel } from "../data/types";

// ------------------------------------------------------------------------------------------------
// Tiny external store (no dependency). Domain state persists to localStorage so the demo survives a
// reload; "Reset demo data" restores the seed. Storage access is wrapped: the app still works when
// storage is unavailable (private window, blocked site data).
// ------------------------------------------------------------------------------------------------
function createStore<T>(key: string | null, init: () => T, version?: number) {
  let state: T = init();
  if (key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (version === undefined || parsed?.version === version) state = parsed;
      }
    } catch { /* storage unavailable: run in memory */ }
  }
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    if (!key) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* ignore */ } }, 120);
  };
  return {
    get: () => state,
    set(updater: (s: T) => T) { state = updater(state); persist(); listeners.forEach((l) => l()); },
    replace(next: T) { state = next; persist(); listeners.forEach((l) => l()); },
    subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
    reset() { state = init(); try { if (key) localStorage.removeItem(key); } catch { /* ignore */ } listeners.forEach((l) => l()); },
  };
}

export const db = createStore<DemoState>("cd-graine-demo-state", makeSeed, STATE_VERSION);
export const useDb = () => useSyncExternalStore(db.subscribe, db.get);

// ---------------------------------------------- UI / session ----------------------------------------------
export type Screen =
  | "home" | "products" | "product" | "cart" | "subscriptions" | "subscription_edit" | "vacations" | "cdmoney"
  | "transactions" | "orders" | "order" | "account" | "menu" | "offers" | "wellness" | "ayuh" | "history"
  | "whatsapp" | "call";

export interface Route { screen: Screen; params?: Record<string, string> }

export type CardData = Record<string, any> & { type: string };
export interface Chip { label: string; event: AgentEvent }
export type AgentEvent =
  | { kind: "say"; text: string }
  | { kind: "confirm"; changeId: string }
  | { kind: "cancel"; changeId: string }
  | { kind: "undo"; changeId: string }
  | { kind: "add"; productId: string; qty: number }
  | { kind: "explain_txn"; txnId: string }
  | { kind: "navigate"; screen: Screen; params?: Record<string, string> }
  | { kind: "resolve"; orderId: string; option: string; reason: string }
  | { kind: "reason"; orderId: string; reason: string }
  | { kind: "wellness"; step: string; value: string }
  | { kind: "offer"; offerId: string; action: "details" | "accept" | "stop" | "later" }
  | { kind: "pick_sub"; subId: string; intent: string };

export interface Msg {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  at: string;
  cards?: CardData[];
  chips?: Chip[];
  channel: Channel;
}

export interface ToolCallLog {
  id: string; at: number; name: string; kind: "api_tool" | "app_action" | "component" | "friction" | "policy" | "workflow" | "nlu" | "guardrail";
  args?: unknown; status: "pending" | "ok" | "refused" | "error" | "info"; ms?: number; tier?: string; channel?: Channel; note?: string;
}

export interface UiState {
  version: number;
  route: Route;
  history: Route[];
  agentOpen: boolean;
  voiceOpen: boolean;
  channel: Channel;              // which channel the active conversation is on
  messages: Msg[];               // active conversation (persisted)
  waMessages: Msg[];             // WhatsApp simulator thread
  callMessages: Msg[];           // voice call captions
  thinking: boolean;
  toast: { text: string; tone: "ok" | "warn" | "info" } | null;
  inspectorOpen: boolean;
  faults: { failNext: boolean; slow: boolean };
  speak: boolean;                // speak agent replies (speech synthesis)
  nudge: { screen: string; text: string; event: AgentEvent } | null;
  nudgesShown: number;
  lastNudgeAt: number;
  incoming: { kind: "push" | "call" | "whatsapp"; title: string; body: string; action?: string } | null;
  splash: boolean;
}

const UI_VERSION = 3;
const initUi = (): UiState => ({
  version: UI_VERSION,
  route: { screen: "home" }, history: [], agentOpen: false, voiceOpen: false, channel: "inapp",
  messages: [], waMessages: [], callMessages: [], thinking: false, toast: null, inspectorOpen: true,
  faults: { failNext: false, slow: false }, speak: false, nudge: null, nudgesShown: 0, lastNudgeAt: 0, incoming: null, splash: true,
});

export const ui = createStore<UiState>("cd-graine-ui", initUi, UI_VERSION);
// transient bits never survive a reload
ui.set((s) => ({ ...s, thinking: false, toast: null, voiceOpen: false, incoming: null, nudge: null }));
export const useUi = () => useSyncExternalStore(ui.subscribe, ui.get);

export function navigate(screen: Screen, params?: Record<string, string>) {
  ui.set((s) => ({ ...s, history: [...s.history, s.route].slice(-30), route: { screen, params } }));
  db.set((d) => ({ ...d, screenVisits: [...d.screenVisits, { screen, at: Date.now() }].slice(-40) }));
}
export function back() {
  ui.set((s) => {
    const h = [...s.history]; const prev = h.pop() ?? { screen: "home" as Screen };
    return { ...s, route: prev, history: h };
  });
}
export function toast(text: string, tone: "ok" | "warn" | "info" = "ok") {
  ui.set((s) => ({ ...s, toast: { text, tone } }));
  setTimeout(() => ui.set((s) => (s.toast?.text === text ? { ...s, toast: null } : s)), 2600);
}

// ---------------------------------------------- inspector ----------------------------------------------
const inspector = createStore<ToolCallLog[]>(null, () => []);
export const useInspector = () => useSyncExternalStore(inspector.subscribe, inspector.get);
let seq = 0;
export function logCall(entry: Omit<ToolCallLog, "id" | "at">): string {
  const id = `call-${++seq}`;
  inspector.set((l) => [{ id, at: Date.now(), ...entry }, ...l].slice(0, 200));
  return id;
}
export function updateCall(id: string, patch: Partial<ToolCallLog>) {
  inspector.set((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}
export const clearInspector = () => inspector.reset();

// ---------------------------------------------- reset helpers ----------------------------------------------
export function resetDemo() {
  db.reset(); ui.reset(); clearInspector();
  ui.set((s) => ({ ...s, splash: false }));
}
export function restartConversation() {
  ui.set((s) => ({ ...s, messages: [], waMessages: [], callMessages: [], thinking: false, nudge: null }));
}

let idn = 0;
export const uid = (p = "id") => `${p}-${Date.now().toString(36)}-${(++idn).toString(36)}`;
