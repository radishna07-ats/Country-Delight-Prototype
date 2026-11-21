// Captures phone-only screenshots (2x) of each scenario for the sales deck and docs.
// Usage: npm run build && node tests/e2e/capture-screens.cjs <outDir>
const { spawn } = require("child_process");
const path = require("path");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "../..");
const OUT = process.argv[2] || path.join(ROOT, "../screenshots");
const URL = "http://127.0.0.1:4175/";

(async () => {
  const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4175", "--strictPort"], { cwd: ROOT, stdio: "ignore" });
  for (let i = 0; i < 60; i++) { try { if ((await fetch(URL)).ok) break; } catch {} await new Promise((r) => setTimeout(r, 300)); }
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 960 }, deviceScaleFactor: 2 });
  const phone = (n) => p.locator("[data-testid=phone]").screenshot({ path: path.join(OUT, `${n}.png`) });
  const sc = async (id, wait = 3500) => { await p.click(`[data-testid=scenario-${id}]`); await p.waitForTimeout(wait); };
  try {
    await p.goto(URL); await p.waitForTimeout(1800);
    await p.click("[data-testid=ctl-reset]"); await p.click("[data-testid=ctl-home]"); await p.waitForTimeout(600);
    await phone("01_home_with_dock");
    await sc("s1"); await p.click("[data-testid=add-cow-milk]"); await p.waitForTimeout(1800); await phone("02_uc3_add_to_cart");
    await sc("s2"); await phone("03_uc5_subscription_card");
    await sc("s3", 5500); await phone("04_uc3_voice_vacation");
    await sc("s4"); await phone("05_uc1_wallet_explainer");
    await sc("s5", 4000); await p.getByRole("button", { name: "Checked — nothing there" }).click(); await p.waitForTimeout(2200); await phone("06_uc2_resolution_options");
    await p.click("[data-testid=resolve-redeliver]"); await p.waitForTimeout(1200); await p.click("[data-testid=card-resolution-confirm] [data-testid=card-confirm]"); await p.waitForTimeout(2500); await phone("07_uc2_case_created");
    await sc("s5w", 4500); await phone("08_uc2_whatsapp_hinglish");
    await sc("s5c", 1500); await p.click("[data-testid=call-verify]"); await p.waitForTimeout(600); await p.getByText("Say: “My milk hasn't arrived”").click(); await p.waitForTimeout(3000); await phone("09_uc2_voice_call");
    await sc("s6", 3000); await p.getByRole("button", { name: "Yes, remember them" }).last().click(); await p.waitForTimeout(1200);
    await p.getByRole("button", { name: "High Protein", exact: true }).last().click(); await p.waitForTimeout(1200);
    await p.getByRole("button", { name: "Vegetarian", exact: true }).last().click(); await p.waitForTimeout(1200);
    await p.getByRole("button", { name: "Peanuts", exact: true }).last().click(); await p.waitForTimeout(3000); await phone("10_uc6_wellness_recs");
    await p.click("[data-testid=close-agent]"); await p.waitForTimeout(1500); await phone("11_uc6_wellness_screen");
    await sc("s7", 1200); await p.click("[data-testid=campaign-inapp]"); await p.waitForTimeout(900); await phone("12_uc4_push");
    await p.click("[data-testid=incoming]"); await p.waitForTimeout(2200); await phone("13_uc4_offer_in_app");
    await sc("s9", 1200); await p.click("[data-testid=ayuh-recharges]"); await p.waitForTimeout(500); await p.getByText("Payment not reflected in CD Money Balance").click(); await p.waitForTimeout(800); await phone("14_ayuh_handoff");
    await p.click("[data-testid=ctl-reset]"); await p.click("[data-testid=ctl-home]"); await p.click("[data-testid=nav-menu]"); await p.click("[data-testid=menu-subscriptions]"); await p.waitForTimeout(700); await phone("15_my_subscriptions");
    await p.locator("[data-testid=inspector]").screenshot({ path: path.join(OUT, "16_inspector.png") });
    await sc("s4"); await p.screenshot({ path: path.join(OUT, "00_presenter_view.png") });
    console.log("captured →", OUT);
  } finally { await b.close(); server.kill(); }
})();
