// End-to-end tests through the real UI (Playwright + built app).
// Usage: npm run build && npm run test:e2e   (starts `vite preview` on :4174 itself)
// E2E_URL=file:///…/Demo_Standalone.html node tests/e2e/run-e2e.cjs  tests another build (e.g. the standalone file) without a server;
// results then go to e2e-results-alt.json so the main results file is not overwritten.
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "../..");
const URL = process.env.E2E_URL || "http://127.0.0.1:4174/";
const EXTERNAL = !!process.env.E2E_URL;
const results = [];

async function waitForServer(ms = 20000) {
  if (EXTERNAL) return;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { const r = await fetch(URL); if (r.ok) return; } catch {} await new Promise((r) => setTimeout(r, 300)); }
  throw new Error("preview server did not start");
}

async function tc(id, title, fn, page) {
  const t0 = Date.now();
  try { await fn(page); results.push({ id, title, status: "PASS", ms: Date.now() - t0 }); console.log(`PASS ${id} ${title}`); }
  catch (e) { results.push({ id, title, status: "FAIL", ms: Date.now() - t0, error: String(e.message || e).slice(0, 300) }); console.log(`FAIL ${id} ${title}\n     ${e.message}`); }
}
const expectText = async (loc, re, timeout = 8000) => { await loc.filter({ hasText: re }).first().waitFor({ timeout }); };

(async () => {
  const server = EXTERNAL ? null : spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"], { cwd: ROOT, stdio: "ignore" });
  let browser;
  try {
    await waitForServer();
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
    const page = await ctx.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    await page.goto(URL); await page.waitForTimeout(1600);
    const scenario = async (id) => { await page.click(`[data-testid=scenario-${id}]`); await page.waitForTimeout(400); };
    const agent = page.locator("[data-testid=msg-agent]");

    await tc("E01", "Home renders seeded state (wallet ₹395, tomorrow 3 items)", async () => {
      await page.click("[data-testid=ctl-reset]"); await page.click("[data-testid=ctl-home]");
      await expectText(page.locator("[data-testid=wallet-chip]"), /₹395/);
      await expectText(page.locator("[data-testid=screen-home]"), /3 items · ₹179/);
    });

    await tc("E02", "UC3 Scenario 1: add two packets of milk → cart badge 2", async () => {
      await scenario("s1"); await page.waitForSelector("[data-testid=add-cow-milk]", { timeout: 8000 });
      await page.click("[data-testid=add-cow-milk]");
      await expectText(agent, /Added 2 × Cow Milk/);
      await page.click("[data-testid=close-agent]");
      await expectText(page.locator("[data-testid=cart-badge]"), /^2$/);
    });

    await tc("E03", "UC5 Scenario 2: confirm subscription change, reflected in My Subscriptions, undo restores", async () => {
      await scenario("s2"); await page.waitForSelector("[data-testid=card-sub-change][data-state=pending]", { timeout: 8000 });
      await page.click("[data-testid=card-sub-change] [data-testid=card-confirm]");
      await page.waitForSelector("[data-testid=card-sub-change][data-state=confirmed]", { timeout: 8000 });
      await page.click("[data-testid=close-agent]");
      await expectText(page.locator("[data-testid=sub-qty-cow-milk]"), /Daily, Qty 2/);
      await page.click("[data-testid=dock-open]"); await page.getByRole("button", { name: "Undo" }).last().click();
      await expectText(agent, /Undone/);
      await page.click("[data-testid=close-agent]");
      await expectText(page.locator("[data-testid=sub-qty-cow-milk]"), /Daily, Qty 1/);
    });

    await tc("E04", "UC3 Scenario 3: vacation for next three days via voice card → Vacations screen", async () => {
      await scenario("s3"); await page.waitForSelector("[data-testid=voice-overlay] [data-testid=card-vacation][data-state=pending]", { timeout: 10000 });
      await expectText(page.locator("[data-testid=vac-start]"), /Sun, 22 Nov/);
      await expectText(page.locator("[data-testid=vac-end]"), /Tue, 24 Nov/);
      await page.click("[data-testid=voice-overlay] [data-testid=card-confirm]");
      await page.waitForSelector("[data-testid=voice-overlay] [data-testid=card-vacation][data-state=confirmed]", { timeout: 8000 });
      await page.click("[data-testid=voice-close]");
      await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-vacation]");
      await expectText(page.locator("[data-testid=vacation-card]"), /resume from Wed, 25 Nov/);
    });

    await tc("E05", "UC1 Scenario 4: ₹500 explained as Autopay from ledger (₹78 below ₹200)", async () => {
      await scenario("s4"); await expectText(agent, /UPI Autopay/, 10000);
      await expectText(agent, /₹78/); await page.waitForSelector("[data-testid=card-txn-explain]");
    });

    await tc("E06", "UC1: unknown amount is not invented", async () => {
      await page.fill("[data-testid=composer]", "Why was ₹999 deducted?"); await page.click("[data-testid=send]");
      await expectText(agent, /can't find a ₹999 deduction/, 10000);
    });

    await tc("E07", "UC2 Scenario 5: status + POD → policy options → confirm → case created and listed in history", async () => {
      await scenario("s5"); await expectText(agent, /marked delivered at 05:12/, 10000);
      await page.getByRole("button", { name: "Checked — nothing there" }).click();
      await page.waitForSelector("[data-testid=resolve-redeliver]", { timeout: 8000 });
      await page.click("[data-testid=resolve-redeliver]");
      await page.waitForSelector("[data-testid=card-resolution-confirm] [data-testid=card-confirm]", { timeout: 8000 });
      await page.click("[data-testid=card-resolution-confirm] [data-testid=card-confirm]");
      await expectText(page.locator("[data-testid=ticket-id]"), /CD-1122-\d{4}/, 10000);
      await page.click("[data-testid=close-agent]"); await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-history]");
      await page.waitForSelector("[data-testid^=ticket-CD-]");
    });

    await tc("E08", "UC2 WhatsApp Hinglish: Hinglish reply with order status", async () => {
      await scenario("s5w"); await expectText(page.locator("[data-testid=wa-agent]"), /Aaj ka order/, 10000);
    });

    await tc("E09", "UC2 inbound call: verification before account data, then status", async () => {
      await scenario("s5c"); await page.waitForSelector("[data-testid=call-verify]");
      await expectText(page.locator("[data-testid=captions]"), /confirm your delivery pincode/);
      await page.click("[data-testid=call-verify]"); await expectText(page.locator("[data-testid=captions]"), /verified/);
      await page.getByText("Say: “My milk hasn't arrived”").click(); await expectText(page.locator("[data-testid=captions]"), /05:12/, 10000);
      await page.click("[data-testid=call-end]");
    });

    await tc("E10", "UC6 Scenario 6: consent → goal → diet → peanut allergy → peanut butter excluded", async () => {
      await scenario("s6"); await expectText(agent, /isn't medical advice/, 10000);
      await page.getByRole("button", { name: "Yes, remember them" }).last().click();
      await page.getByRole("button", { name: "High Protein", exact: true }).last().click();
      await page.getByRole("button", { name: "Vegetarian", exact: true }).last().click();
      await page.getByRole("button", { name: "Peanuts", exact: true }).last().click();
      await expectText(agent, /left out Peanut Butter/, 10000);
      if (await page.locator("[data-testid=transcript] [data-testid=prow-peanut-butter]").count()) throw new Error("peanut butter recommended");
      if (await page.locator("[data-testid=transcript] [data-testid=prow-brown-eggs]").count()) throw new Error("eggs recommended to vegetarian");
    });

    await tc("E11", "UC4 campaign: voice skipped without consent; in-app push → offer; STOP withdraws consent", async () => {
      await scenario("s7"); await page.click("[data-testid=campaign-voice]");
      await expectText(page.locator("[data-testid=campaign-result]"), /skipped — consent/);
      await page.click("[data-testid=campaign-inapp]"); await page.click("[data-testid=incoming]");
      await page.waitForSelector("[data-testid=card-offer]", { timeout: 8000 });
      await page.locator("[data-testid=phone] [data-testid=chips]").getByRole("button", { name: "STOP" }).click();
      await expectText(agent, /won't show you offers/, 8000);
      await page.click("[data-testid=close-agent]"); await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-account]");
      if (await page.locator("[data-testid=consent-promoInApp]").getAttribute("aria-checked") !== "false") throw new Error("consent not withdrawn");
    });

    await tc("E12", "Ayuh coexistence: Something else → assistant opens with Ayuh context", async () => {
      await scenario("s9"); await page.click("[data-testid=ayuh-vip]");
      await page.click("[data-testid='ayuh-opt-Something else']"); await page.click("[data-testid=ayuh-ask-graine]");
      await expectText(agent, /came from Ayuh/, 8000);
    });

    await tc("E13", "Guardrail: fault injection on confirm → 'nothing was changed', state unchanged", async () => {
      await scenario("s2"); await page.waitForSelector("[data-testid=card-sub-change][data-state=pending]", { timeout: 8000 });
      await page.check("[data-testid=ctl-fail]");
      await page.click("[data-testid=card-sub-change] [data-testid=card-confirm]");
      await expectText(agent, /nothing was changed/, 8000);
      await page.click("[data-testid=close-agent]");
      await expectText(page.locator("[data-testid=sub-qty-cow-milk]"), /Qty 1/);
    });

    await tc("E14", "Guardrail: declining a change leaves data unchanged", async () => {
      await scenario("s2"); await page.waitForSelector("[data-testid=card-sub-change][data-state=pending]", { timeout: 8000 });
      await page.click("[data-testid=card-sub-change] [data-testid=card-cancel]");
      await page.waitForSelector("[data-testid=card-sub-change][data-state=cancelled]");
      await expectText(agent, /haven't changed anything/);
    });

    await tc("E15", "Manual app flow: Set Vacation sheet blocks > 60 days and accepts a valid range", async () => {
      await page.click("[data-testid=ctl-reset]"); await page.click("[data-testid=ctl-home]");
      await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-vacation]"); await page.click("[data-testid=set-vacation]");
      await page.click("[data-testid=cal-2026-11-23]"); await page.click("[data-testid=cal-2027-01-31]");
      if (!(await page.locator("[data-testid=vacation-confirm]").isDisabled())) throw new Error("70-day range allowed");
      await expectText(page.locator("[data-testid=vacation-sheet]"), /at most 60 days/);
      await page.click("[data-testid=cal-2026-11-23]"); await page.click("[data-testid=cal-2026-11-25]");
      await page.click("[data-testid=vacation-confirm]");
      await page.waitForSelector("[data-testid=vacation-card]");
    });

    await tc("E16", "Persistence: subscription change survives a reload; Reset restores seed", async () => {
      await scenario("s2"); await page.waitForSelector("[data-testid=card-sub-change][data-state=pending]", { timeout: 8000 });
      await page.click("[data-testid=card-sub-change] [data-testid=card-confirm]");
      await page.waitForSelector("[data-testid=card-sub-change][data-state=confirmed]");
      await page.waitForTimeout(400); await page.reload(); await page.waitForTimeout(1800);
      await page.click("[data-testid=ctl-home]"); await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-subscriptions]");
      await expectText(page.locator("[data-testid=sub-qty-cow-milk]"), /Qty 2/);
      await page.click("[data-testid=ctl-reset]"); await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-subscriptions]");
      await expectText(page.locator("[data-testid=sub-qty-cow-milk]"), /Qty 1/);
    });

    await tc("E17", "Friction: looping My Subscriptions ×3 in 45 s shows one quiet suggestion", async () => {
      await page.click("[data-testid=ctl-reset]");
      for (let i = 0; i < 3; i++) { await page.click("[data-testid=ctl-home]"); await page.click("[data-testid=nav-menu]"); await page.click("[data-testid=menu-subscriptions]"); }
      await page.waitForSelector("[data-testid=nudge]", { timeout: 5000 });
    });

    await tc("E18", "Mobile viewport (390×844): app fills screen, no horizontal scroll, demo button present", async () => {
      const m = await ctx.newPage(); await m.setViewportSize({ width: 390, height: 844 }); await m.goto(URL); await m.waitForTimeout(1600);
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) throw new Error(`horizontal overflow ${overflow}px`);
      await m.waitForSelector("[data-testid=demo-fab]"); await m.close();
    });

    await tc("E19", "No uncaught page errors during the run", async () => { if (pageErrors.length) throw new Error(pageErrors.join(" | ")); });
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
    const out = path.join(ROOT, EXTERNAL ? "tests/e2e/e2e-results-alt.json" : "tests/e2e/e2e-results.json");
    fs.writeFileSync(out, JSON.stringify({ ranAt: new Date().toISOString(), passed: results.filter((r) => r.status === "PASS").length, total: results.length, results }, null, 2));
    console.log(`\n${results.filter((r) => r.status === "PASS").length}/${results.length} passed → ${out}`);
    process.exit(results.every((r) => r.status === "PASS") ? 0 : 1);
  }
})();
