import { useMemo, useState } from "react";
import { db, navigate, toast, useDb, useUi } from "../backend/store";
import { CATALOGUE, byId, HEALTH_GOALS } from "../data/catalogue";
import type { Frequency, Product } from "../data/types";
import { addDays, earliestChangeDate, fmtDate, rupees, today, unitPrice, DAY_SHORT, toDate, FREQ_LABEL } from "../backend/rules";
import { api, placeCartOrder, orderValueFor } from "../backend/api";
import { ProductArt } from "../ui/ProductArt";
import { I } from "../ui/icons";
import { Btn, Card, Empty, Header, Pill, PriceCta, Sheet, Stepper, cx } from "../ui/kit";

// ------------------------------------------------------------------ Home
export function Home() {
  const d = useDb();
  const [mode, setMode] = useState<"morning" | "instant">("morning");
  const first = earliestChangeDate(d.clock);
  const days = [-1, 0, 1, 2].map((i) => addDays(today(d.clock), i));
  const tomorrowOrder = d.orders.find((o) => o.date === first && o.status === "scheduled");
  const low = d.wallet.balance < d.wallet.lowThreshold;
  const usualIds = Array.from(new Set(d.subscriptions.filter((s) => s.status !== "removed").map((s) => s.productId)));
  const protein = CATALOGUE.filter((p) => p.tags.includes("high_protein")).slice(0, 6);
  return (
    <div className="pb-36">
      <div className="bg-cd-deep text-[#C6F36B] text-[12px] font-bold px-4 py-2 flex items-center justify-between">
        <span>You've saved ₹2,113 so far <span className="text-white/70 font-medium">· Keep saving more with VIP</span></span>
        <I.chevron size={14} />
      </div>
      <div className={cx("px-3 pt-3 pb-2 transition-colors", mode === "morning" ? "bg-gradient-to-b from-[#FFF7DD] to-white" : "bg-gradient-to-b from-cd-sky to-white")}>
        <div className="grid grid-cols-2 gap-2 bg-white/70 rounded-2xl p-1 shadow-card">
          {(["morning", "instant"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} data-testid={`mode-${m}`}
              className={cx("h-11 rounded-xl text-[13px] font-extrabold flex items-center justify-center gap-1.5", mode === m ? (m === "morning" ? "bg-[#FFE9A8] text-cd-ink" : "bg-[#BFE3FA] text-cd-ink") : "text-cd-muted")}>
              {m === "morning" ? <I.sun size={16} /> : <I.bolt size={16} />}{m === "morning" ? "Morning" : "Instant"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="w-9 h-9 rounded-full bg-cd-mint grid place-items-center text-cd-green"><I.user size={18} /></div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[14px]">{mode === "morning" ? "5am – 7:30am" : "30 minutes"}</div>
            <div className="text-[11px] text-cd-muted truncate">{d.customer.area}</div>
          </div>
          <button type="button" onClick={() => navigate("cdmoney")} data-testid="wallet-chip" className={cx("h-8 px-2.5 rounded-lg text-[12px] font-extrabold flex items-center gap-1", low ? "bg-orange-100 text-cd-danger" : "bg-cd-deep text-white")}>
            <I.wallet size={14} />{rupees(d.wallet.balance)}
          </button>
        </div>
        <button type="button" onClick={() => navigate("products")} className="mt-3 w-full h-11 rounded-xl bg-white border border-cd-line flex items-center gap-2 px-3 text-[13px] text-cd-muted">
          <I.search size={18} /> Search for “Paneer”
        </button>
      </div>

      {mode === "morning" ? (<>
        <div className="px-3 mt-1 flex gap-2 overflow-x-auto no-scrollbar">
          {days.map((x) => {
            const o = d.orders.find((y) => y.date === x && y.mode === "morning");
            const isFirst = x === first;
            return (
              <button key={x} type="button" onClick={() => navigate("orders")} className={cx("shrink-0 rounded-xl border px-3 py-2 text-left min-w-[74px]", isFirst ? "border-cd-leaf bg-cd-mint min-w-[150px]" : "border-cd-line bg-white")}>
                <div className="text-[10.5px] text-cd-muted font-semibold">{DAY_SHORT[toDate(x).getUTCDay()]}</div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[16px]">{toDate(x).getUTCDate()}</span>
                  {isFirst && (tomorrowOrder
                    ? <span className="text-[10.5px] font-bold text-cd-green leading-tight">{tomorrowOrder.lines.length} items · {rupees(tomorrowOrder.lines.reduce((s, l) => s + l.price * l.qty, 0))}</span>
                    : <span className="text-[10.5px] text-cd-muted leading-tight">No orders yet<br />for tomorrow</span>)}
                  {!isFirst && o && <span className="w-1.5 h-1.5 rounded-full bg-cd-leaf" />}
                </div>
              </button>
            );
          })}
        </div>
        {low && (
          <Card className="mx-3 mt-3 p-4 bg-[#2B2A2A] border-0 text-white flex items-center gap-3" testId="balance-low">
            <div className="flex-1"><div className="font-extrabold text-[15px]">BALANCE LOW</div><div className="text-[12px] text-white/75">Your upcoming deliveries could soon be affected</div>
              <Btn tone="vip" size="sm" className="mt-2" onClick={() => navigate("cdmoney")}>RECHARGE NOW</Btn></div>
            <I.wallet size={44} className="text-[#E84C3D]" />
          </Card>
        )}
        <div className="px-3 mt-4 grid grid-cols-5 gap-2">
          {[["Milk", "pouch"], ["Dairy", "block"], ["Breakfast", "bread"], ["Fruits", "banana"], ["Staples", "bag"]].map(([label]) => (
            <button key={label} type="button" onClick={() => navigate("products", { cat: label.toLowerCase() })} className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-2xl overflow-hidden"><ProductArt p={byId(label === "Milk" ? "cow-milk" : label === "Dairy" ? "taaza-paneer" : label === "Breakfast" ? "wholewheat-bread" : label === "Fruits" ? "banana" : "atta")} size={56} /></div>
              <span className="text-[10.5px] font-semibold text-cd-ink">{label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => navigate("wellness")} data-testid="wellness-entry" className="mx-3 mt-4 w-[calc(100%-24px)] text-left rounded-2xl p-4 bg-gradient-to-br from-[#E4F5DC] to-[#FFF6D6] border border-cd-line flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white grid place-items-center text-cd-green shadow-card"><I.leaf size={26} /></div>
          <div className="flex-1"><div className="flex items-center gap-2"><span className="font-extrabold text-[14.5px] text-cd-deep">Your Wellness Journey</span><Pill tone="vip">NEW</Pill></div>
            <div className="text-[11.5px] text-cd-muted">Goal-based picks that respect your allergies</div></div>
          <I.chevron size={18} />
        </button>
        <Rail title="Your usuals" ids={usualIds} />
        <Rail title="High Protein picks" ids={protein.map((p) => p.id)} />
        <div className="px-3 mt-5">
          <div className="font-extrabold text-[15px] mb-2">Pick Your Health Goal</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {HEALTH_GOALS.map((g) => <button key={g.id} type="button" onClick={() => navigate("products", { goal: g.id })} className="shrink-0 h-9 px-3 rounded-full border border-cd-line bg-white text-[12px] font-semibold">{g.label}</button>)}
          </div>
        </div>
      </>) : (
        <div className="px-3 mt-3">
          <Card className="p-4 bg-cd-sky border-0"><div className="font-extrabold text-[15px]">Instant · 30 minutes</div><div className="text-[12px] text-cd-muted">Free ₹79 cash on cart value of ₹1,149 · Instant mode is shown for completeness; the prototype's agent flows use Morning orders.</div></Card>
          <Rail title="Previously bought" ids={usualIds} />
        </div>
      )}
    </div>
  );
}

function Rail({ title, ids }: { title: string; ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="mt-5">
      <div className="px-3 font-extrabold text-[15px] mb-2">{title}</div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-3">
        {ids.map((id) => <ProductTile key={id} p={byId(id)} />)}
      </div>
    </div>
  );
}

export function ProductTile({ p, wide }: { p: Product; wide?: boolean }) {
  const d = useDb(); const vip = d.customer.vip.active;
  return (
    <div className={cx("shrink-0", wide ? "w-full" : "w-[132px]")}>
      <button type="button" onClick={() => navigate("product", { id: p.id })} className="relative w-full rounded-2xl overflow-hidden border border-cd-line bg-white" data-testid={`tile-${p.id}`}>
        <div className="w-full flex justify-center"><ProductArt p={p} size={wide ? 150 : 130} /></div>
        {p.badge && <span className="absolute top-2 left-2"><Pill tone="mint">{p.badge}</Pill></span>}
      </button>
      <div className="mt-1.5 flex items-start gap-1">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold leading-tight line-clamp-2">{p.name}</div>
          <div className="mt-1 inline-block text-[10px] border border-cd-line rounded-md px-1.5 py-0.5 text-cd-muted">{p.size}</div>
          <div className="text-[12px] font-extrabold mt-0.5">{rupees(unitPrice(p, vip))}{unitPrice(p, vip) < p.mrp && <span className="ml-1 text-[10px] text-cd-muted line-through font-medium">{rupees(p.mrp)}</span>}</div>
        </div>
        <button type="button" aria-label={`Add ${p.name}`} onClick={async () => { const r = await api.add_to_cart("inapp", { productId: p.id, qty: 1 }); toast(r.status === "ok" ? `Added ${p.name}` : r.message ?? "Couldn't add", r.status === "ok" ? "ok" : "warn"); }}
          className="mt-0.5 h-7 px-2.5 rounded-lg border border-cd-leaf text-cd-green text-[11px] font-extrabold bg-white hover:bg-cd-mint">ADD</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Products listing
export function Products() {
  const { route } = useUi();
  const [cat, setCat] = useState(route.params?.cat ?? (route.params?.goal ? "goal" : "milk"));
  const [q, setQ] = useState("");
  const goal = route.params?.goal;
  const tabs = [["milk", "Milk & Coconut"], ["dairy", "Paneer, Dahi"], ["breakfast", "Breads, Eggs"], ["fruits", "Fruits"], ["veggies", "Veggies"], ["staples", "Staples"], ["snacks", "Snacks"]];
  const list = useMemo(() => CATALOGUE.filter((p) => (q ? p.name.toLowerCase().includes(q.toLowerCase()) : goal && cat === "goal" ? p.tags.includes(goal) : p.category === cat)), [cat, q, goal]);
  const d = useDb();
  return (
    <div className="pb-36">
      <Header title={fmtDate(earliestChangeDate(d.clock))} subtitle="5am to 7:30am" right={<button type="button" aria-label="Cart" onClick={() => navigate("cart")} className="relative w-9 h-9 grid place-items-center"><I.cart size={20} />{d.cart.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-cd-danger text-white text-[9px] font-bold grid place-items-center">{d.cart.reduce((s, c) => s + c.qty, 0)}</span>}</button>} />
      <div className="px-3 pt-3"><label className="h-10 rounded-xl border border-cd-line flex items-center gap-2 px-3 text-[13px]"><I.search size={16} className="text-cd-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="flex-1 outline-none bg-transparent" data-testid="search-input" /></label></div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 py-3">
        {goal && <button type="button" onClick={() => setCat("goal")} className={cx("shrink-0 h-8 px-3 rounded-full text-[12px] font-bold border", cat === "goal" ? "bg-cd-green text-white border-cd-green" : "border-cd-line")}>{HEALTH_GOALS.find((g) => g.id === goal)?.label}</button>}
        {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => { setCat(id); setQ(""); }} className={cx("shrink-0 h-8 px-3 rounded-full text-[12px] font-bold border", cat === id && !q ? "bg-cd-green text-white border-cd-green" : "border-cd-line bg-white")}>{label}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-3">
        {list.map((p) => <ProductTile key={p.id} p={p} wide />)}
        {!list.length && <div className="col-span-2"><Empty icon={<I.search size={26} />} title="No products found" body="Try another search word." /></div>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Product detail (subscribe / add)
export function ProductDetail() {
  const { route } = useUi(); const d = useDb();
  const p = byId(route.params?.id ?? "cow-milk");
  const existing = d.subscriptions.find((s) => s.productId === p.id && s.status !== "removed");
  const [qty, setQty] = useState(existing?.qty ?? 1);
  const [freq, setFreq] = useState<Frequency>(existing?.frequency ?? (p.subscribable ? "daily" : "once"));
  const [freqOpen, setFreqOpen] = useState(false);
  const price = unitPrice(p, d.customer.vip.active) * qty;
  const confirm = async () => {
    if (freq === "once") { const r = await api.add_to_cart("inapp", { productId: p.id, qty }); toast(r.status === "ok" ? "Added to cart" : r.message!, r.status === "ok" ? "ok" : "warn"); if (r.status === "ok") navigate("cart"); return; }
    const r = existing ? await api.update_subscription("inapp", { id: existing.id, qty, frequency: freq }) : await api.create_subscription("inapp", { productId: p.id, qty, frequency: freq, weekday: freq === "weekly" ? 0 : undefined });
    if (r.status === "ok") { toast(existing ? "Subscription updated" : "Order Subscribed!"); navigate("subscriptions"); } else toast(r.message ?? "Couldn't save", "warn");
  };
  return (
    <div className="pb-28">
      <Header title={p.name} />
      <div className="flex justify-center bg-cd-cream py-4"><ProductArt p={p} size={220} /></div>
      <div className="px-4 pt-4">
        <div className="flex items-start gap-2"><div className="flex-1"><div className="font-extrabold text-[16px] leading-tight">{p.name}</div><div className="text-[12px] text-cd-muted">{p.size}</div></div>
          {p.allergens.length === 0 ? <Pill>No common allergens</Pill> : <Pill tone="gray">Contains {p.allergens.join(", ")}</Pill>}</div>
        <div className="mt-3 flex items-center justify-between"><div className="font-extrabold text-[16px]">{rupees(unitPrice(p, d.customer.vip.active))}{unitPrice(p, d.customer.vip.active) < p.mrp && <span className="ml-1.5 text-[12px] line-through text-cd-muted font-medium">{rupees(p.mrp)}</span>}</div><Stepper value={qty} onChange={setQty} min={1} testId="pd-stepper" /></div>
        <div className="mt-3 rounded-xl bg-[#FFF8DA] px-3 py-2 text-[12px] flex justify-between"><span>Upto 40% off with <b>VIP</b></span><span className="text-cd-green font-bold">{d.customer.vip.active ? "VIP ACTIVE" : "SEE PLAN"}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
          <div><div className="text-cd-muted">Subscription type</div><button type="button" onClick={() => setFreqOpen(true)} className="mt-1 font-bold flex items-center gap-1" data-testid="pd-frequency">{FREQ_LABEL[freq]} <I.down size={14} /></button></div>
          <div><div className="text-cd-muted">Start date</div><div className="mt-1 font-bold">{fmtDate(earliestChangeDate(d.clock))}</div></div>
        </div>
        <div className="mt-4 text-[12.5px] text-cd-muted">{p.description}</div>
        {p.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.tags.map((t) => <Pill key={t} tone="gray">{t.replace(/_/g, " ")}</Pill>)}</div>}
        <div className="mt-2 text-[10.5px] text-cd-muted">Prototype catalogue · prices and tags are illustrative.</div>
      </div>
      <div className="absolute bottom-[86px] left-0 right-0 px-4 z-10"><PriceCta price={rupees(price)} label={freq === "once" ? "Add to cart" : existing ? "Update subscription" : "Confirm subscription"} onClick={confirm} testId="pd-confirm" /></div>
      <Sheet open={freqOpen} onClose={() => setFreqOpen(false)} title="Subscription type">
        <div className="p-4 grid gap-2">{p.frequencies.map((f) => <button key={f} type="button" onClick={() => { setFreq(f); setFreqOpen(false); }} className={cx("h-11 rounded-xl border text-left px-4 text-[13px] font-bold", f === freq ? "border-cd-leaf bg-cd-mint" : "border-cd-line")}>{FREQ_LABEL[f]}</button>)}</div>
      </Sheet>
    </div>
  );
}

// ------------------------------------------------------------------ Cart (customer checks out; agent never does)
export function Cart() {
  const d = useDb(); const [paid, setPaid] = useState<string | null>(null);
  const vip = d.customer.vip.active;
  const total = d.cart.reduce((s, c) => s + unitPrice(byId(c.productId), vip) * c.qty, 0);
  const tomorrowSubs = orderValueFor(earliestChangeDate(d.clock));
  const setQty = (pid: string, q: number) => db.set((s) => ({ ...s, cart: q <= 0 ? s.cart.filter((c) => c.productId !== pid) : s.cart.map((c) => (c.productId === pid ? { ...c, qty: q } : c)) }));
  if (paid) return (<div><Header title="Order placed" /><Empty icon={<I.check size={28} />} title="Order placed!" body={`Delivering on ${fmtDate(paid)}, 5:00–7:30 AM. Amount will only be charged after the products are delivered.`} action={<Btn onClick={() => navigate("orders")}>View My Orders</Btn>} /></div>);
  return (
    <div className="pb-40">
      <Header title="Your cart" subtitle={d.cart.length ? `Delivering ${fmtDate(d.cart[0].date)}` : undefined} />
      {!d.cart.length ? <Empty icon={<I.cart size={28} />} title="Your cart is empty" body="Add products, or ask the assistant: “add two packets of milk”." action={<Btn onClick={() => navigate("products")}>Browse products</Btn>} /> : (
        <div className="p-3 grid gap-2">
          {d.cart.map((c) => { const p = byId(c.productId); return (
            <Card key={c.productId} className="p-3 flex items-center gap-3" testId={`cart-line-${c.productId}`}>
              <ProductArt p={p} size={56} />
              <div className="flex-1 min-w-0"><div className="text-[13px] font-bold truncate">{p.name}</div><div className="text-[11px] text-cd-muted">{p.size} · {rupees(unitPrice(p, vip))}</div></div>
              <Stepper value={c.qty} onChange={(q) => setQty(c.productId, q)} />
            </Card>); })}
          <Card className="p-3 text-[12.5px] grid gap-1.5">
            <Row k="Items total" v={rupees(total)} /><Row k="Packaging charge" v="Free" /><Row k="Convenience fee" v="₹1" />
            <div className="border-t border-cd-line pt-1.5"><Row k={<b>To pay</b>} v={<b>{rupees(total + 1)}</b>} /></div>
            <div className="text-[11px] text-cd-muted">Amount will only be charged after the products are delivered.{tomorrowSubs ? ` Your subscriptions for that day (${rupees(tomorrowSubs)}) are delivered with it.` : ""}</div>
          </Card>
        </div>)}
      {d.cart.length > 0 && <div className="absolute bottom-[86px] left-0 right-0 px-4 z-10"><PriceCta price={rupees(total + 1)} label="Place order" testId="place-order" onClick={() => { const o = placeCartOrder(); if (o) { setPaid(o.date); toast("Order placed"); } }} /></div>}
    </div>
  );
}
export const Row = ({ k, v }: { k: React.ReactNode; v: React.ReactNode }) => <div className="flex justify-between gap-3"><span className="text-cd-muted">{k}</span><span className="text-right">{v}</span></div>;
