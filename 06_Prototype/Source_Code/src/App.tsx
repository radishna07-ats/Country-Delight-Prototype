import { useEffect, useState } from "react";
import { db, ui, useDb, useUi, navigate, logCall, type Screen } from "./backend/store";
import { outreachOpener, speakListeners } from "./agent/engine";
import { Home, Products, ProductDetail, Cart } from "./screens/Shop";
import { Subscriptions, SubscriptionEdit, Vacations, CDMoney, Transactions, Orders, OrderDetail, Account, Menu, Offers, History } from "./screens/Account";
import { Wellness } from "./screens/Wellness";
import { Ayuh } from "./screens/Ayuh";
import { AgentSheet, Dock } from "./agent-ui/AgentSheet";
import { VoiceOverlay } from "./agent-ui/VoiceOverlay";
import { WhatsAppScreen, CallScreen } from "./agent-ui/Channels";
import { speak } from "./agent-ui/voice";
import { ScenarioPanel, Inspector } from "./demo/Panels";
import { I } from "./ui/icons";
import { cx } from "./ui/kit";

const SCREENS: Record<Screen, () => JSX.Element> = {
  home: Home, products: Products, product: ProductDetail, cart: Cart, subscriptions: Subscriptions, subscription_edit: SubscriptionEdit,
  vacations: Vacations, cdmoney: CDMoney, transactions: Transactions, orders: Orders, order: OrderDetail, account: Account, menu: Menu,
  offers: Offers, wellness: Wellness, ayuh: Ayuh, history: History, whatsapp: WhatsAppScreen, call: CallScreen,
};
const FULL: Screen[] = ["whatsapp", "call"];          // full-bleed (own header under the status bar)
const NO_NAV: Screen[] = ["whatsapp", "call", "ayuh"]; // no bottom navigation

function StatusBar({ dark }: { dark?: boolean }) {
  const d = useDb(); const [h, m] = d.clock.slice(11, 16).split(":").map(Number);
  return (
    <div className={cx("absolute top-0 inset-x-0 h-11 z-50 px-7 flex items-center justify-between text-[13px] font-bold pointer-events-none", dark ? "text-white" : "text-cd-ink")}>
      <span data-testid="status-time">{((h + 11) % 12) + 1}:{String(m).padStart(2, "0")}</span>
      <span className="flex items-center gap-1.5"><span className="flex items-end gap-[2px] h-3">{[4, 6, 8, 10].map((x) => <span key={x} className="w-[3px] rounded-sm bg-current" style={{ height: x }} />)}</span><span className="text-[11px]">4G</span><span className="w-6 h-3 rounded-[3px] border border-current p-[1px]"><span className="block h-full w-4/5 bg-current rounded-[1px]" /></span></span>
    </div>
  );
}

function BottomNav() {
  const { route } = useUi(); const d = useDb();
  const item = (s: Screen | null, label: string, icon: JSX.Element, onClick?: () => void) => (
    <button key={label} type="button" onClick={onClick ?? (() => s && navigate(s))} data-testid={`nav-${label.toLowerCase().replace(/\s/g, "")}`}
      className={cx("flex-1 flex flex-col items-center gap-0.5 pt-2 text-[10.5px] font-semibold", s && route.screen === s ? "text-cd-green" : "text-cd-muted")}>{icon}{label}</button>);
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 h-[68px] bg-white border-t border-cd-line flex pb-2">
      {item("home", "Home", <I.home size={22} />)}
      {item("products", "Products", <I.grid size={22} />)}
      {item(null, "Join VIP", <I.crown size={22} />, () => navigate("offers"))}
      {item("cart", "Cart", <span className="relative"><I.cart size={22} />{d.cart.length > 0 && <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-cd-danger text-white text-[9px] font-bold grid place-items-center" data-testid="cart-badge">{d.cart.reduce((s, c) => s + c.qty, 0)}</span>}</span>)}
      {item("menu", "Menu", <I.menu size={22} />)}
    </div>
  );
}

function Toast() {
  const { toast } = useUi(); if (!toast) return null;
  return <div className="absolute bottom-[132px] left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-cd-ink text-white text-[12.5px] font-semibold shadow-lg animate-rise max-w-[86%] text-center" data-testid="toast" role="status">{toast.text}</div>;
}

function Incoming() {
  const { incoming } = useUi(); if (!incoming) return null;
  const open = () => {
    ui.set((s) => ({ ...s, incoming: null }));
    if (incoming.action === "offer") { logCall({ name: "push_opened → in-app offer conversation", kind: "workflow", status: "ok", channel: "inapp" }); ui.set((s) => ({ ...s, agentOpen: true, channel: "inapp" })); outreachOpener("OFR-PANEER-SUN", "inapp"); }
    if (incoming.action === "wa-offer") { outreachOpener("OFR-PANEER-SUN", "whatsapp"); navigate("whatsapp"); }
  };
  return (
    <button type="button" onClick={open} data-testid="incoming" className="absolute top-12 left-3 right-3 z-[70] rounded-2xl bg-white/95 backdrop-blur shadow-lg border border-cd-line p-3 text-left animate-rise flex gap-2.5">
      <div className={cx("w-9 h-9 rounded-xl grid place-items-center text-white shrink-0", incoming.kind === "whatsapp" ? "bg-[#25D366]" : "bg-cd-green")}>{incoming.kind === "whatsapp" ? <I.whatsapp size={20} /> : <I.leaf size={18} />}</div>
      <div className="flex-1 min-w-0"><div className="text-[11px] font-bold text-cd-muted">{incoming.title} · now</div><div className="text-[12.5px] leading-snug">{incoming.body}</div></div>
    </button>
  );
}

function Splash() {
  const { splash } = useUi();
  useEffect(() => { if (splash) { const t = setTimeout(() => ui.set((s) => ({ ...s, splash: false })), 1300); return () => clearTimeout(t); } }, [splash]);
  if (!splash) return null;
  return (
    <div className="absolute inset-0 z-[80] bg-white flex flex-col items-center justify-center gap-3" data-testid="splash">
      <div className="w-24 h-24 rounded-full border-4 border-cd-leaf grid place-items-center text-center"><div className="text-cd-green font-extrabold leading-none text-[15px]">Country<br />Delight</div></div>
      <div className="italic text-cd-green font-bold">Live better</div>
      <div className="text-[11px] text-cd-muted mt-6">Fresh milk, fruits & vegetables and more at your doorstep</div>
      <div className="absolute bottom-10 text-[10px] text-cd-muted">Prototype · simulated data · with Graine AI</div>
    </div>
  );
}

/** Friction rule: looping between subscription screens (Graine looping_between_screens: 3 visits / 45 s). */
function useLoopingFriction() {
  const d = useDb();
  useEffect(() => {
    const now = Date.now(); const recent = d.screenVisits.filter((v) => now - v.at < 45000 && ["subscriptions", "subscription_edit"].includes(v.screen));
    const s = ui.get();
    if (recent.filter((v) => v.screen === "subscriptions").length >= 3 && !s.nudge && !s.agentOpen && s.nudgesShown < 3 && now - s.lastNudgeAt > 20000) {
      logCall({ name: "friction: looping_between_screens (my_subscriptions ×3 in 45s)", kind: "friction", status: "info" });
      ui.set((x) => ({ ...x, nudge: { screen: "subscriptions", text: "Changing a subscription? Tell me what you'd like and I'll set it up in one step.", event: { kind: "say", text: "I want to change my subscription" } }, nudgesShown: x.nudgesShown + 1, lastNudgeAt: now }));
    }
  }, [d.screenVisits.length]);
}

export function Phone() {
  const s = useUi(); useLoopingFriction();
  useEffect(() => {
    const l = (t: string, ch: string) => { if (ch === "inapp" && ui.get().speak && !ui.get().voiceOpen) speak(t); };
    speakListeners.add(l); return () => { speakListeners.delete(l); };
  }, []);
  const Cur = SCREENS[s.route.screen] ?? Home;
  const full = FULL.includes(s.route.screen);
  return (
    <div className="phone shrink-0" data-testid="phone">
      <div className="phone-screen">
        <div className="phone-notch" />
        <StatusBar dark={s.route.screen === "call" || s.route.screen === "whatsapp" || s.voiceOpen} />
        <div className={cx("absolute inset-0", full ? "" : "pt-11")}>
          <div className={cx("h-full", full ? "" : "overflow-y-auto no-scrollbar bg-white")} key={s.route.screen + JSON.stringify(s.route.params ?? {})} data-testid={`screen-${s.route.screen}`}><Cur /></div>
        </div>
        {!NO_NAV.includes(s.route.screen) && <BottomNav />}
        <Dock />
        <AgentSheet />
        <VoiceOverlay />
        <Incoming />
        <Toast />
        <Splash />
      </div>
    </div>
  );
}

export default function App() {
  const [present, setPresent] = useState(() => new URLSearchParams(location.search).has("present") || location.hash === "#present");
  const [drawer, setDrawer] = useState<null | "scenarios" | "inspector">(null);
  const s = useUi();
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT") return; if (e.key === "p" || e.key === "P") setPresent((x) => !x); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="min-h-full w-full flex">
      {/* desktop: three columns */}
      {!present && <aside className="hidden lg:block w-[330px] shrink-0 h-screen p-4 border-r border-cd-line bg-[#F6F9F4]"><ScenarioPanel /></aside>}
      <main className="flex-1 min-w-0 min-h-screen flex flex-col items-center justify-center gap-3 py-4 max-[700px]:py-0">
        <Phone />
        <div className="max-[700px]:hidden flex items-center gap-2 text-[11px] text-cd-muted">
          <button type="button" onClick={() => setPresent((x) => !x)} className="px-2.5 py-1 rounded-lg border border-cd-line bg-white font-semibold" data-testid="toggle-present">{present ? "Exit presentation (P)" : "Presentation mode (P)"}</button>
          <button type="button" onClick={() => setDrawer("scenarios")} className="lg:hidden px-2.5 py-1 rounded-lg border border-cd-line bg-white font-semibold">Scenarios</button>
          <button type="button" onClick={() => setDrawer("inspector")} className="xl:hidden px-2.5 py-1 rounded-lg border border-cd-line bg-white font-semibold">Agent activity</button>
          <span>Prototype · simulated back end · {s.route.screen}</span>
        </div>
      </main>
      {!present && s.inspectorOpen && <aside className="hidden xl:block w-[360px] shrink-0 h-screen overflow-hidden p-4 border-l border-cd-line bg-[#F6F9F4]"><Inspector /></aside>}
      {/* mobile / narrow: floating demo button */}
      <button type="button" onClick={() => setDrawer("scenarios")} className="min-[701px]:hidden fixed right-3 bottom-[150px] z-[90] h-10 px-3 rounded-full bg-graine-600 text-white text-[12px] font-bold shadow-lg" data-testid="demo-fab">Demo</button>
      {drawer && (
        <div className="fixed inset-0 z-[100] flex">
          <button type="button" aria-label="Close" className="flex-1 bg-black/40" onClick={() => setDrawer(null)} />
          <div className="w-[min(380px,92vw)] h-full bg-[#F6F9F4] p-4 flex flex-col">
            <div className="flex gap-2 mb-3">{(["scenarios", "inspector"] as const).map((t) => <button key={t} type="button" onClick={() => setDrawer(t)} className={cx("flex-1 h-9 rounded-lg text-[12px] font-bold", drawer === t ? "bg-cd-green text-white" : "bg-white border border-cd-line")}>{t === "scenarios" ? "Scenarios" : "Agent activity"}</button>)}
              <button type="button" aria-label="Close" onClick={() => setDrawer(null)} className="w-9 h-9 rounded-lg bg-white border border-cd-line grid place-items-center"><I.x size={16} /></button></div>
            <div className="flex-1 min-h-0">{drawer === "scenarios" ? <div className="h-full overflow-y-auto no-scrollbar" onClick={(e) => { if ((e.target as HTMLElement).closest("[data-testid^='scenario-s']")) setTimeout(() => setDrawer(null), 150); }}><ScenarioPanel compact /></div> : <Inspector />}</div>
          </div>
        </div>)}
    </div>
  );
}

export const _db = db;
