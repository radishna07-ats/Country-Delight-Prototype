import { useEffect, useState } from "react";
import { db, toast, useDb, logCall } from "../backend/store";
import { ALLERGENS, HEALTH_GOALS, byId } from "../data/catalogue";
import { api } from "../backend/api";
import { rupees, unitPrice } from "../backend/rules";
import type { Product } from "../data/types";
import { ProductArt } from "../ui/ProductArt";
import { I } from "../ui/icons";
import { Btn, Card, Header, Pill, cx } from "../ui/kit";
import { openAssistant } from "../agent-ui/assistant";

export function Wellness() {
  const d = useDb(); const w = d.wellness;
  const [goals, setGoals] = useState<string[]>(w?.goals ?? ["high_protein"]);
  const [diet, setDiet] = useState<string>(w?.diet ?? "veg");
  const [allergies, setAllergies] = useState<string[]>(w?.allergies ?? []);
  const [consent, setConsent] = useState<boolean>(!!w);
  const [recs, setRecs] = useState<{ items: Product[]; excluded: string[] } | null>(null);
  const [editing, setEditing] = useState(!w);
  useEffect(() => { if (w) { setGoals(w.goals); setDiet(w.diet); setAllergies(w.allergies); setEditing(false); void load(w.goals, w.diet, w.allergies); } }, [w?.consentAt]);
  async function load(g = goals, di = diet, al = allergies) { const r = await api.recommend_products("inapp", { goals: g, diet: di, allergies: al }); if (r.status === "ok") setRecs(r.data as any); }
  const save = async () => {
    if (!consent) { toast("Please tick consent to save, or use “Just show me”", "warn"); return; }
    await api.save_wellness_profile("inapp", { goals, diet: diet as any, allergies, consentAt: d.clock }); toast("Wellness profile saved"); setEditing(false); void load();
  };
  const vip = d.customer.vip.active;
  const bundle = recs?.items.slice(0, 3) ?? [];
  return (
    <div className="pb-36 bg-gradient-to-b from-[#EAF6E3] to-white min-h-full">
      <Header title="Your Wellness Journey" subtitle="Goal-based product discovery" />
      <div className="px-3 pt-3">
        <Card className="p-4 bg-white">
          <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-cd-mint grid place-items-center text-cd-green"><I.leaf size={22} /></div>
            <div className="flex-1 text-[12.5px]"><div className="font-extrabold text-[14px]">Products that fit your goals</div>Tell us your goal, diet and allergies. We suggest Country Delight products using catalogue information. <b>This is not medical or diet advice</b> — for health conditions, please consult a doctor or registered dietitian.</div></div>
          <Btn tone="outline" className="w-full mt-3" onClick={() => openAssistant({ say: "I've started working out. Recommend products." })} testId="wellness-ask"><I.sparkle size={16} /> Set it up by talking to the assistant</Btn>
        </Card>
      </div>
      {editing ? (
        <div className="px-3 mt-3 grid gap-3">
          <Card className="p-3"><div className="font-bold text-[13px]">Goal</div><div className="mt-2 flex flex-wrap gap-2">{HEALTH_GOALS.map((g) => <Chip key={g.id} on={goals.includes(g.id)} onClick={() => setGoals([g.id])}>{g.label}</Chip>)}</div></Card>
          <Card className="p-3"><div className="font-bold text-[13px]">Diet</div><div className="mt-2 flex flex-wrap gap-2">{[["veg", "Vegetarian"], ["egg", "Eggetarian"], ["vegan", "Vegan"], ["any", "No preference"]].map(([id, l]) => <Chip key={id} on={diet === id} onClick={() => setDiet(id)}>{l}</Chip>)}</div></Card>
          <Card className="p-3"><div className="font-bold text-[13px]">Allergies & intolerances <span className="text-cd-muted font-medium">(always excluded)</span></div><div className="mt-2 flex flex-wrap gap-2">{ALLERGENS.map((a) => <Chip key={a.id} on={allergies.includes(a.id)} onClick={() => setAllergies(allergies.includes(a.id) ? allergies.filter((x) => x !== a.id) : [...allergies, a.id])}>{a.label}</Chip>)}</div></Card>
          <label className="flex items-start gap-2 text-[12px] px-1"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 accent-[#2FA84F]" data-testid="wellness-consent" />Remember these for product suggestions. I can delete them anytime in Account & Preferences.</label>
          <div className="grid grid-cols-2 gap-2"><Btn tone="outline" onClick={() => { logCall({ name: "wellness: session-only recommendations (no consent to store)", kind: "guardrail", status: "info" }); void load(); }}>Just show me</Btn><Btn onClick={save} testId="wellness-save">Save & show</Btn></div>
        </div>
      ) : w && (
        <div className="px-3 mt-3"><Card className="p-3 flex items-center gap-3"><div className="flex-1 text-[12px]"><b>Your profile</b><div className="text-cd-muted">{w.goals.map((g) => HEALTH_GOALS.find((x) => x.id === g)?.label).join(", ")} · {diet === "veg" ? "Vegetarian" : diet} · {w.allergies.length ? `avoid ${w.allergies.join(", ")}` : "no allergies"}</div></div>
          <Btn size="sm" tone="ghost" onClick={() => setEditing(true)}>Edit</Btn><Btn size="sm" tone="ghost" onClick={() => { db.set((s) => ({ ...s, wellness: null, customer: { ...s.customer, consents: { ...s.customer.consents, wellness: false } } })); setRecs(null); setEditing(true); toast("Wellness profile deleted"); }}>Delete</Btn></Card></div>
      )}
      {recs && (
        <div className="px-3 mt-4" data-testid="wellness-recs">
          <div className="font-extrabold text-[15px]">Suggested for you</div>
          {recs.excluded.length > 0 && <div className="text-[11.5px] text-cd-muted mt-0.5">Excluded for your allergies: {recs.excluded.map((id) => byId(id).name).join(", ")}</div>}
          <div className="grid gap-2 mt-2">
            {recs.items.map((p) => (
              <Card key={p.id} className="p-2.5 flex items-center gap-3">
                <ProductArt p={p} size={60} />
                <div className="flex-1 min-w-0"><div className="text-[12.5px] font-bold leading-tight">{p.name}</div><div className="text-[11px] text-cd-muted">{p.size} · {rupees(unitPrice(p, vip))}</div>
                  <div className="mt-1 flex flex-wrap gap-1">{p.tags.filter((t) => goals.includes(t)).map((t) => <Pill key={t}>{HEALTH_GOALS.find((g) => g.id === t)?.label}</Pill>)}{allergies.length > 0 && <Pill tone="sky">Allergen-safe for you</Pill>}</div></div>
                <Btn size="sm" tone="outline" onClick={async () => { const r = await api.add_to_cart("inapp", { productId: p.id, qty: 1 }); toast(r.status === "ok" ? `Added ${p.name}` : r.message!, r.status === "ok" ? "ok" : "warn"); }}>ADD</Btn>
              </Card>))}
            {!recs.items.length && <div className="text-[12px] text-cd-muted">No products match all your preferences.</div>}
          </div>
          {bundle.length >= 2 && (
            <Card className="p-3 mt-3 bg-[#FFF8DA] border-0">
              <div className="font-extrabold text-[13.5px]">Morning starter bundle</div>
              <div className="text-[11.5px] text-cd-muted">{bundle.map((p) => p.name).join(" + ")}</div>
              <div className="flex items-center justify-between mt-2"><b>{rupees(bundle.reduce((s, p) => s + unitPrice(p, vip), 0))}</b>
                <Btn size="sm" onClick={async () => { for (const p of bundle) await api.add_to_cart("inapp", { productId: p.id, qty: 1 }); toast("Bundle added to cart"); }} testId="bundle-add">Add bundle</Btn></div>
            </Card>)}
          <div className="text-[10.5px] text-cd-muted mt-3">Suggestions use catalogue tags in this prototype. Production would use Country Delight's verified nutrition and allergen data per SKU.</div>
        </div>)}
    </div>
  );
}
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} className={cx("h-8 px-3 rounded-full text-[12px] font-bold border", on ? "bg-cd-green text-white border-cd-green" : "bg-white border-cd-line")}>{children}</button>
);
