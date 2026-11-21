"""Generates CountryDelight_Revenue_Model.xlsx — a formula-driven, editable model.

Every number on the Summary, Use Cases and Sensitivity sheets is an Excel formula that traces back to
the Inputs sheet. Scenarios (Conservative / Base / Aggressive) and ±25% sensitivity cases are computed
side by side on the Model sheet, so the workbook needs no macros or data tables.
Usage: python3 build_model.py
"""
import os
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "CountryDelight_Revenue_Model.xlsx")
F = "Arial"
BLUE = Font(name=F, size=10, color="0000FF"); BLACK = Font(name=F, size=10, color="000000"); GREEN = Font(name=F, size=10, color="008000")
BOLD = Font(name=F, size=10, bold=True); HDR = Font(name=F, size=10, bold=True, color="FFFFFF"); TITLE = Font(name=F, size=14, bold=True, color="1F4D2B")
NOTE = Font(name=F, size=9, italic=True, color="555555"); SECT = Font(name=F, size=10, bold=True, color="1F4D2B")
FILL_H = PatternFill("solid", start_color="1F4D2B"); FILL_IN = PatternFill("solid", start_color="FFFFFF"); FILL_KEY = PatternFill("solid", start_color="FFFF00")
FILL_SECT = PatternFill("solid", start_color="EEF6EA"); FILL_OUT = PatternFill("solid", start_color="F3F7F4")
thin = Side(style="thin", color="D5DED8"); BOX = Border(top=thin, bottom=thin, left=thin, right=thin)
PCT = "0.0%;(0.0%);-"; INR = "₹#,##0;(₹#,##0);-"; INR2 = "₹#,##0.00;(₹#,##0.00);-"; NUM = "#,##0;(#,##0);-"; NUM1 = "#,##0.0;(#,##0.0);-"; LAKH = "#,##0.0;(#,##0.0);-"; MULT = "0.00x;(0.00x);-"

# ------------------------------------------------------------------------------------------------ inputs
# key, label, unit, fmt, (cons, base, aggr) or single value, varies, classification, source / rationale
S = "SECTION"
INPUTS = [
    (S, "A. Baseline business (same in every scenario — replace with Country Delight's actuals)"),
    ("customers", "Monthly ordering customers", "customers", NUM, 550000, False, "Illustrative", "Sanity check from public FY24 revenue ~₹1,380 cr ÷ 12 ÷ ₹2,100 ≈ 5.5 lakh. Not a Country Delight metric."),
    ("arpu", "Average monthly revenue per ordering customer", "₹", INR, 2100, False, "Illustrative", "Daily milk (~₹36–50 × 30) plus some groceries. Requires CD data."),
    ("deliveries", "Delivery days per customer per month", "days", NUM1, 22, False, "Illustrative", "Mix of daily and alternate-day subscribers."),
    ("sub_share", "Share of customers with an active subscription", "%", PCT, 0.70, False, "Illustrative", "Subscription-first model (Business_Research.md)."),
    ("churn", "Monthly churn of ordering customers", "%", PCT, 0.06, False, "Illustrative", "Requires CD cohort data."),
    ("service_churn_share", "Share of churn driven by service issues (delivery, wallet, support)", "%", PCT, 0.30, False, "Hypothesis", "66–78% of negative reviews mention a workflow theme; discounted heavily because reviews over-represent complainants."),
    ("margin", "Contribution margin on incremental revenue", "%", PCT, 0.25, False, "Illustrative", "Used only for the profit view. Requires CD finance."),
    ("contacts_per_1000", "Support contacts per 1,000 deliveries", "contacts", NUM1, 20, False, "Illustrative", "Requires CD support data."),
    ("cost_per_contact", "Fully loaded cost per human-handled contact", "₹", INR, 45, False, "Illustrative", "Typical Indian contact-centre range ₹30–60; requires CD data."),
    ("low_balance_rate", "Customers hitting a low-balance delivery hold per month", "%", PCT, 0.04, False, "Hypothesis", "‘BALANCE LOW’ banner observed (EV-014); frequency unknown."),
    ("days_lost_per_hold", "Delivery days lost per balance hold", "days", NUM1, 1.5, False, "Illustrative", "—"),
    (S, "B. Support automation (UC1, UC2)"),
    ("support_reach", "Share of support contacts handled first by the agent", "%", PCT, (0.20, 0.35, 0.50), True, "Proposed", "Pilot → scaled rollout across WhatsApp, voice and in-app."),
    ("containment", "Agent containment (resolved without a person)", "%", PCT, (0.30, 0.45, 0.60), True, "Hypothesis", "Deliberately below the executive brief's 60–75% (EV-063). Measure in pilot."),
    ("voice_share", "Share of agent support contacts on voice (rest chat/WhatsApp)", "%", PCT, (0.40, 0.40, 0.40), True, "Illustrative", "—"),
    ("voice_minutes", "Average connected minutes per voice contact", "min", NUM1, (3, 3, 3), True, "Illustrative", "—"),
    ("chat_sessions", "Chat sessions (≤5 min) per text contact", "sessions", NUM1, (1.2, 1.2, 1.2), True, "Illustrative", "—"),
    ("runway_reach", "A1: share of at-risk customers reached by an opt-in balance reminder", "%", PCT, (0.30, 0.50, 0.70), True, "Proposed", "Requires opt-in consent."),
    ("hold_prevented", "A1: holds prevented when reached", "%", PCT, (0.20, 0.30, 0.40), True, "Hypothesis", "—"),
    ("service_churn_reduction", "UC2: reduction in service-driven churn among agent-covered customers", "%", PCT, (0.05, 0.10, 0.15), True, "Hypothesis", "Measure vs control group in pilot."),
    ("retention_months", "Revenue months credited per retained customer (cap)", "months", NUM1, (6, 6, 6), True, "Assumption", "Caps lifetime value to avoid overstatement."),
    (S, "C. In-app agent (UC3, UC5, A2)"),
    ("inapp_adoption", "Monthly in-app agent users (% of ordering customers)", "%", PCT, (0.04, 0.08, 0.15), True, "Hypothesis", "Optional, docked agent; not imposed on every customer."),
    ("inapp_sessions", "In-app agent sessions per user per month", "sessions", NUM1, (2, 2, 2.5), True, "Illustrative", "—"),
    ("inapp_voice_share", "Share of in-app sessions by voice", "%", PCT, (0.30, 0.35, 0.40), True, "Illustrative", "—"),
    ("inapp_voice_minutes", "Minutes per in-app voice session", "min", NUM1, (1.5, 1.5, 1.5), True, "Illustrative", "—"),
    ("expansion_rate", "UC5: in-app users who increase or add a subscription", "%", PCT, (0.03, 0.06, 0.09), True, "Hypothesis", "Confirm-and-undo change cards (HY-003)."),
    ("expansion_value", "UC5: incremental monthly value per expansion", "₹", INR, (350, 450, 550), True, "Illustrative", "+1 milk packet ≈ ₹1,080/month; weekly paneer ≈ ₹440/month."),
    ("expansion_months", "UC5: months an expansion persists", "months", NUM1, (4, 5, 6), True, "Assumption", "—"),
    ("aov_uplift", "UC3: order-value uplift on agent-assisted cart orders", "%", PCT, (0.02, 0.04, 0.06), True, "Hypothesis", "Global benchmarks are self-reported and not transferred (EV-071)."),
    ("assisted_orders", "UC3: agent-assisted cart orders per in-app user per month", "orders", NUM1, (1, 1.5, 2), True, "Illustrative", "—"),
    ("cancel_intent", "A2: subscribers with a cancellation intent per month", "%", PCT, (0.03, 0.03, 0.03), True, "Illustrative", "No save step observed at removal (EV-024)."),
    ("save_flow_reach", "A2: share of cancellation intents that meet the save conversation", "%", PCT, (0.25, 0.40, 0.60), True, "Proposed", "—"),
    ("save_rate", "A2: saves (pause / reduce instead of cancel)", "%", PCT, (0.08, 0.15, 0.22), True, "Hypothesis", "—"),
    ("saved_months", "A2: revenue months credited per save", "months", NUM1, (3, 3, 3), True, "Assumption", "—"),
    (S, "D. Offers & wellness (UC4, UC6)"),
    ("campaign_audience", "UC4: eligible and consented campaign audience per month (% of customers)", "%", PCT, (0.10, 0.15, 0.20), True, "Proposed", "Consent, DNC and frequency caps applied (EV-068)."),
    ("campaign_engage", "UC4: engagement (answered / opened)", "%", PCT, (0.15, 0.20, 0.25), True, "Hypothesis", "—"),
    ("campaign_convert", "UC4: conversion among engaged", "%", PCT, (0.05, 0.08, 0.10), True, "Hypothesis", "—"),
    ("campaign_value", "UC4: first-month incremental value per conversion", "₹", INR, (350, 450, 550), True, "Illustrative", "—"),
    ("campaign_incrementality", "UC4: share of conversions that are incremental vs holdout", "%", PCT, (0.40, 0.50, 0.60), True, "Assumption", "Only incremental revenue is counted."),
    ("campaign_voice_share", "UC4: share of campaign contacts by voice (rest WhatsApp/in-app)", "%", PCT, (0.20, 0.20, 0.20), True, "Proposed", "Voice only with consent, 10 am–7 pm."),
    ("campaign_minutes", "UC4: connected minutes per answered campaign call", "min", NUM1, (1.5, 1.5, 1.5), True, "Illustrative", "—"),
    ("wellness_start", "UC6: customers creating a wellness profile per month", "%", PCT, (0.003, 0.008, 0.015), True, "Hypothesis", "Requires nutrition/allergen data per SKU."),
    ("wellness_convert", "UC6: profile creators who buy a recommended product", "%", PCT, (0.20, 0.25, 0.30), True, "Hypothesis", "—"),
    ("wellness_value", "UC6: incremental monthly value per buyer", "₹", INR, (250, 300, 400), True, "Illustrative", "—"),
    ("wellness_months", "UC6: months the purchase pattern persists", "months", NUM1, (3, 4, 5), True, "Assumption", "—"),
    ("wellness_sessions", "UC6: chat sessions per profile creator", "sessions", NUM1, (2, 2, 2), True, "Illustrative", "—"),
    ("overlap_haircut", "Haircut on growth streams for overlap between UC3/UC4/UC5/UC6", "%", PCT, (0.15, 0.10, 0.10), True, "Assumption", "Avoids double counting the same purchase."),
    (S, "E. Costs"),
    ("rate_min", "Graine price per connected minute (voice, all-in)", "₹", INR2, (6, 6, 6), True, "Published", "graine.ai/pricing, 21 Nov 2026 (EV-040). Excl. GST."),
    ("rate_chat", "Graine price per chat session (≤5 min)", "₹", INR2, (10, 10, 10), True, "Published", "graine.ai/pricing, 21 Nov 2026 (EV-040). Excl. GST."),
    ("discount", "Volume discount vs published rates", "%", PCT, (0, 0, 0), True, "Requires Graine proposal", "Enterprise pricing is quoted per volume; 0% keeps the case conservative."),
    ("wa_msg_cost", "WhatsApp (Meta) fee per campaign message", "₹", INR2, (0.9, 0.9, 0.9), True, "Illustrative", "Meta's own pricing; varies by category and country."),
    ("platform_fee", "Monthly platform / dedicated-infrastructure fee", "₹", INR, (0, 0, 0), True, "Requires Graine proposal", "0 on shared cloud (all-in rate). Dedicated instance for India-only residency would add cost (EV-045)."),
    ("run_ops", "Monthly operations, QA and agent tuning", "₹", INR, (200000, 200000, 200000), True, "Illustrative", "Graine and/or CD effort."),
    ("impl_cost", "One-time implementation & integration services", "₹", INR, (3000000, 3000000, 3000000), True, "Requires Graine proposal", "Illustrative placeholder."),
    ("cd_eng_pm", "One-time Country Delight engineering effort", "person-months", NUM1, (10, 8, 8), True, "Illustrative", "APIs, SDK, handlers, QA (Integration_Requirements.md)."),
    ("cd_eng_rate", "Cost per engineering person-month", "₹", INR, (250000, 250000, 250000), True, "Illustrative", "—"),
    ("ramp", "Year-1 average realisation of run-rate (ramp-up)", "%", PCT, (0.50, 0.60, 0.70), True, "Assumption", "Pilot first, then expansion (Implementation_Roadmap.md)."),
]
KEYS = [r[0] for r in INPUTS if r[0] != S]

# ------------------------------------------------------------------------------------------------ calculations
# key, label, fmt, formula template ({key} → input or earlier calc in the same column)
CALCS = [
    (S, "Baseline"),
    ("deliveries_month", "Deliveries per month", NUM, "{customers}*{deliveries}"),
    ("aov", "Average value per delivery", INR2, "{arpu}/{deliveries}"),
    ("baseline_rev", "Baseline monthly revenue (illustrative)", INR, "{customers}*{arpu}"),
    (S, "Support automation (UC1, UC2)"),
    ("contacts", "Support contacts per month", NUM, "{deliveries_month}*{contacts_per_1000}/1000"),
    ("agent_contacts", "Contacts handled first by the agent", NUM, "{contacts}*{support_reach}"),
    ("contained", "Contacts resolved without a person", NUM, "{agent_contacts}*{containment}"),
    ("support_savings", "Support cost avoided", INR, "{contained}*{cost_per_contact}"),
    ("support_min", "Voice minutes (support)", NUM, "{agent_contacts}*{voice_share}*{voice_minutes}"),
    ("support_chat", "Chat sessions (support)", NUM, "{agent_contacts}*(1-{voice_share})*{chat_sessions}"),
    ("holds", "Low-balance holds per month", NUM, "{customers}*{low_balance_rate}"),
    ("holds_prevented", "A1: holds prevented", NUM, "{holds}*{runway_reach}*{hold_prevented}"),
    ("rev_a1", "A1/UC1: revenue protected from prevented holds", INR, "{holds_prevented}*{days_lost_per_hold}*{aov}"),
    ("churners", "Churning customers per month", NUM, "{customers}*{churn}"),
    ("service_churners", "…of which service-driven", NUM, "{churners}*{service_churn_share}"),
    ("retained_service", "UC2: service-driven churners retained per month", NUM1, "{service_churners}*{support_reach}*{service_churn_reduction}"),
    ("rev_uc2", "UC2: retained revenue (steady state = inflow × months × ARPU)", INR, "{retained_service}*{arpu}*{retention_months}"),
    (S, "In-app agent (UC3, UC5, A2)"),
    ("inapp_users", "In-app agent users per month", NUM, "{customers}*{inapp_adoption}"),
    ("expansions", "UC5: subscription expansions per month", NUM, "{inapp_users}*{expansion_rate}"),
    ("rev_uc5", "UC5: expansion revenue (steady state)", INR, "{expansions}*{expansion_value}*{expansion_months}"),
    ("rev_uc3", "UC3: AOV uplift on assisted cart orders", INR, "{inapp_users}*{assisted_orders}*{aov}*{aov_uplift}"),
    ("inapp_min", "Voice minutes (in-app)", NUM, "{inapp_users}*{inapp_sessions}*{inapp_voice_share}*{inapp_voice_minutes}"),
    ("inapp_chat", "Chat sessions (in-app)", NUM, "{inapp_users}*{inapp_sessions}*(1-{inapp_voice_share})"),
    ("voluntary_churners", "Voluntary churners (not service-driven) — disjoint from UC2", NUM, "{churners}-{service_churners}"),
    ("saves", "A2: subscriptions saved per month (capped at voluntary churners reached)", NUM1, "MIN({customers}*{sub_share}*{cancel_intent}*{save_flow_reach}*{save_rate},{voluntary_churners}*{save_flow_reach})"),
    ("rev_a2", "A2: saved revenue (steady state)", INR, "{saves}*{arpu}*{saved_months}"),
    (S, "Offers & wellness (UC4, UC6)"),
    ("audience", "UC4: campaign audience per month", NUM, "{customers}*{campaign_audience}"),
    ("engaged", "UC4: engaged", NUM, "{audience}*{campaign_engage}"),
    ("conversions", "UC4: conversions", NUM, "{engaged}*{campaign_convert}"),
    ("rev_uc4", "UC4: incremental campaign revenue", INR, "{conversions}*{campaign_value}*{campaign_incrementality}"),
    ("campaign_min", "Voice minutes (campaign)", NUM, "{audience}*{campaign_voice_share}*{campaign_engage}*{campaign_minutes}"),
    ("wa_msgs", "WhatsApp campaign messages", NUM, "{audience}*(1-{campaign_voice_share})"),
    ("campaign_chat", "Chat sessions (campaign follow-ups)", NUM, "{engaged}*(1-{campaign_voice_share})"),
    ("wellness_starts", "UC6: wellness profiles created per month", NUM, "{customers}*{wellness_start}"),
    ("rev_uc6", "UC6: wellness cross-sell revenue (steady state)", INR, "{wellness_starts}*{wellness_convert}*{wellness_value}*{wellness_months}"),
    ("wellness_chat", "Chat sessions (wellness)", NUM, "{wellness_starts}*{wellness_sessions}"),
    (S, "Totals — monthly run-rate (steady state)"),
    ("growth_net", "Growth streams after overlap haircut (UC3+UC4+UC5+UC6)", INR, "({rev_uc3}+{rev_uc4}+{rev_uc5}+{rev_uc6})*(1-{overlap_haircut})"),
    ("rev_total", "Incremental revenue (gross)", INR, "{rev_a1}+{rev_uc2}+{rev_a2}+{growth_net}"),
    ("rev_pct", "Incremental revenue as % of baseline revenue", PCT, "{rev_total}/{baseline_rev}"),
    ("contribution", "Incremental contribution (revenue × margin)", INR, "{rev_total}*{margin}"),
    ("minutes_total", "Total connected voice minutes", NUM, "{support_min}+{inapp_min}+{campaign_min}"),
    ("chats_total", "Total chat sessions", NUM, "{support_chat}+{inapp_chat}+{campaign_chat}+{wellness_chat}"),
    ("graine_usage", "Graine usage cost", INR, "({minutes_total}*{rate_min}+{chats_total}*{rate_chat})*(1-{discount})"),
    ("wa_cost", "WhatsApp messaging fees", INR, "{wa_msgs}*{wa_msg_cost}"),
    ("fixed_cost", "Fixed monthly costs (platform + operations)", INR, "{platform_fee}+{run_ops}"),
    ("run_cost", "Total monthly running cost", INR, "{graine_usage}+{wa_cost}+{fixed_cost}"),
    ("net_month", "Net monthly benefit (contribution + savings − running cost)", INR, "{contribution}+{support_savings}-{run_cost}"),
    (S, "Year 1 (with ramp-up)"),
    ("one_time", "One-time investment (implementation + CD engineering)", INR, "{impl_cost}+{cd_eng_pm}*{cd_eng_rate}"),
    ("y1_revenue", "Year-1 incremental revenue (gross)", INR, "{rev_total}*12*{ramp}"),
    ("y1_contribution", "Year-1 incremental contribution", INR, "{contribution}*12*{ramp}"),
    ("y1_savings", "Year-1 operational savings", INR, "{support_savings}*12*{ramp}"),
    ("y1_running", "Year-1 running cost (variable × ramp + fixed)", INR, "({graine_usage}+{wa_cost})*12*{ramp}+{fixed_cost}*12"),
    ("y1_investment", "Year-1 total investment (one-time + running)", INR, "{one_time}+{y1_running}"),
    ("y1_net", "Year-1 net benefit", INR, "{y1_contribution}+{y1_savings}-{y1_running}-{one_time}"),
    ("y1_roi", "Year-1 ROI (net benefit ÷ total investment)", MULT, "IF({y1_investment}>0,{y1_net}/{y1_investment},0)"),
    ("net_month_ramped", "Net monthly benefit at Year-1 average realisation", INR, "({contribution}+{support_savings}-{graine_usage}-{wa_cost})*{ramp}-{fixed_cost}"),
    ("payback", "Payback on one-time investment (months, at Year-1 realisation)", NUM1, "IF({net_month_ramped}>0,{one_time}/{net_month_ramped},\"n/a\")"),
    ("annual_runrate_net", "Annualised net benefit at full run-rate (after Year 1)", INR, "{net_month}*12"),
]

SENS = [("margin", "Contribution margin"), ("arpu", "Revenue per customer (ARPU)"), ("containment", "Agent containment"), ("cost_per_contact", "Cost per human contact"),
        ("support_reach", "Agent share of support contacts"), ("rate_chat", "Graine price per chat session"), ("expansion_rate", "UC5 expansion rate"),
        ("expansion_value", "UC5 value per expansion"), ("service_churn_reduction", "UC2 service-churn reduction"), ("rate_min", "Graine price per minute"),
        ("inapp_adoption", "In-app agent adoption")]  # ordered by swing (largest first) for the tornado
DELTA = 0.25

def build():
    wb = Workbook()
    # ---------------------------------------------------------------- README
    rd = wb.active; rd.title = "README"
    lines = [
        ("Graine AI × Country Delight — Revenue & ROI model", TITLE),
        ("Purpose: estimate how Graine's agents could affect Country Delight's revenue, retention and support cost, with transparent, editable assumptions.", BLACK),
        ("", BLACK),
        ("IMPORTANT", SECT),
        ("• No Country Delight internal metric was available. Baseline figures (customers, ARPU, churn, contacts) are ILLUSTRATIVE and must be replaced with Country Delight's data.", BLACK),
        ("• Impact rates are HYPOTHESES to be measured in a pilot against a control group — not promises.", BLACK),
        ("• Graine prices use the PUBLISHED rates (₹6 per connected minute, ₹10 per chat session, excl. GST). Enterprise pricing requires a Graine proposal.", BLACK),
        ("• Revenue impact and profit impact are shown separately. Only contribution (revenue × margin) and cost savings enter net benefit and ROI.", BLACK),
        ("", BLACK),
        ("HOW TO USE", SECT),
        ("1. Edit blue cells on the Inputs sheet (Conservative / Base / Aggressive). Baseline rows are linked: edit Base and the other scenarios follow (or overwrite them).", BLACK),
        ("2. Read results on Summary and Use Cases. Sensitivity shows ±25% swings on 11 drivers around the Base case.", BLACK),
        ("3. Model shows every calculation for every case; nothing is hard-coded.", BLACK),
        ("", BLACK),
        ("METHOD NOTES", SECT),
        ("• Steady state: revenue from customers retained/saved/expanded each month = monthly inflow × months credited × monthly value (cohort stock).", BLACK),
        ("• No double counting: UC2 acts on service-driven churners; A2 acts only on voluntary churners (disjoint). Growth streams (UC3–UC6) carry an overlap haircut.", BLACK),
        ("• Year 1 applies a ramp-up factor to benefits and variable costs; fixed costs and one-time investment are taken in full.", BLACK),
        ("", BLACK),
        ("COLOUR CODE", SECT),
        ("Blue text = input you can change · Black = formula · Green = link to another sheet · Yellow fill = key output", BLACK),
        ("", BLACK),
        ("See 04_Revenue_and_Financial_Model/Financial_Assumptions.md and ROI_Analysis.md for the narrative.", NOTE),
    ]
    for i, (t, f) in enumerate(lines, 1):
        c = rd.cell(row=i, column=1, value=t); c.font = f; c.alignment = Alignment(wrap_text=True, vertical="top")
    rd.column_dimensions["A"].width = 150
    rd["A21"].font = Font(name=F, size=10, color="0000FF")

    # ---------------------------------------------------------------- Inputs
    ws = wb.create_sheet("Inputs")
    ws["A1"] = "Inputs — edit blue cells"; ws["A1"].font = TITLE
    hdr = ["Key", "Input", "Unit", "Conservative", "Base", "Aggressive", "Classification", "Source / rationale"]
    for j, h in enumerate(hdr, 1):
        c = ws.cell(row=3, column=j, value=h); c.font = HDR; c.fill = FILL_H; c.alignment = Alignment(wrap_text=True, vertical="center")
    row = 4; IROW = {}; IFMT = {}
    for r in INPUTS:
        if r[0] == S:
            ws.cell(row=row, column=1, value=r[1]).font = SECT
            for j in range(1, 9): ws.cell(row=row, column=j).fill = FILL_SECT
            row += 1; continue
        key, label, unit, fmt, val, varies, cls, src = r
        IROW[key] = row; IFMT[key] = fmt
        ws.cell(row=row, column=1, value=key).font = NOTE
        ws.cell(row=row, column=2, value=label).font = BLACK
        ws.cell(row=row, column=3, value=unit).font = BLACK
        if varies:
            for j, v in zip((4, 5, 6), val):
                c = ws.cell(row=row, column=j, value=v); c.font = BLUE; c.number_format = fmt
        else:
            c = ws.cell(row=row, column=5, value=val); c.font = BLUE; c.number_format = fmt
            for j in (4, 6):
                c = ws.cell(row=row, column=j, value=f"=E{row}"); c.font = BLACK; c.number_format = fmt
        ws.cell(row=row, column=7, value=cls).font = BLACK
        ws.cell(row=row, column=8, value=src).font = NOTE
        for j in range(1, 9): ws.cell(row=row, column=j).border = BOX; ws.cell(row=row, column=j).alignment = Alignment(wrap_text=True, vertical="top")
        row += 1
    for col, w in zip("ABCDEFGH", (20, 58, 13, 14, 14, 14, 20, 70)): ws.column_dimensions[col].width = w
    ws.freeze_panes = "D4"
    dv = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", showErrorMessage=True, error="Must be ≥ 0"); ws.add_data_validation(dv)
    dv.add(f"D4:F{row}")

    # ---------------------------------------------------------------- Case inputs (scenarios + sensitivity)
    cases = [("Conservative", "Inputs", "D"), ("Base", "Inputs", "E"), ("Aggressive", "Inputs", "F")]
    ci = wb.create_sheet("Case Inputs")
    ci["A1"] = "Inputs per case — scenarios link to Inputs; sensitivity cases = Base × (1 ± 25%) on one driver"; ci["A1"].font = TITLE
    ci.cell(row=3, column=1, value="Key").font = HDR; ci.cell(row=3, column=1).fill = FILL_H
    sens_cols = []
    col = 2
    for key, lab in SENS:
        for sign, tag in ((-1, "Low"), (1, "High")):
            c = ci.cell(row=3, column=col, value=f"{lab} — {tag} ({'-' if sign < 0 else '+'}{int(DELTA*100)}%)"); c.font = HDR; c.fill = FILL_H; c.alignment = Alignment(wrap_text=True)
            for k in KEYS:
                r = IROW[k]
                f = f"=Inputs!$E${r}*{1 + sign * DELTA}" if k == key else f"=Inputs!$E${r}"
                cc = ci.cell(row=r, column=col, value=f); cc.font = GREEN; cc.number_format = IFMT[k]
            sens_cols.append((f"{lab} {tag}", "'Case Inputs'", L(col), key, tag))
            col += 1
    for k in KEYS: ci.cell(row=IROW[k], column=1, value=k).font = NOTE
    ci.column_dimensions["A"].width = 22
    for j in range(2, col): ci.column_dimensions[L(j)].width = 16
    ci.freeze_panes = "B4"
    all_cases = cases + [(n, sh, c) for (n, sh, c, _, _) in sens_cols]

    # ---------------------------------------------------------------- Model
    md = wb.create_sheet("Model")
    md["A1"] = "Model — every calculation, every case"; md["A1"].font = TITLE
    md.cell(row=3, column=1, value="Calculation").font = HDR; md.cell(row=3, column=1).fill = FILL_H
    md.cell(row=3, column=2, value="Key").font = HDR; md.cell(row=3, column=2).fill = FILL_H
    for j, (n, _, _) in enumerate(all_cases):
        c = md.cell(row=3, column=3 + j, value=n); c.font = HDR; c.fill = FILL_H; c.alignment = Alignment(wrap_text=True)
    CROW = {}; row = 4
    import re
    for r in CALCS:
        if r[0] == S:
            md.cell(row=row, column=1, value=r[1]).font = SECT
            for j in range(1, 3 + len(all_cases)): md.cell(row=row, column=j).fill = FILL_SECT
            row += 1; continue
        key, label, fmt, tpl = r; CROW[key] = row
        md.cell(row=row, column=1, value=label).font = BLACK; md.cell(row=row, column=2, value=key).font = NOTE
        for j, (n, sheet, icol) in enumerate(all_cases):
            mc = L(3 + j)
            def ref(m):
                k = m.group(1)
                if k in CROW and k != key: return f"{mc}{CROW[k]}"
                if k in IROW: return f"{sheet}!{icol}{IROW[k]}"
                raise KeyError(k)
            f = "=" + re.sub(r"\{(\w+)\}", ref, tpl)
            c = md.cell(row=row, column=3 + j, value=f); c.font = BLACK; c.number_format = fmt
        row += 1
    md.column_dimensions["A"].width = 62; md.column_dimensions["B"].width = 20
    for j in range(len(all_cases)): md.column_dimensions[L(3 + j)].width = 16
    md.freeze_panes = "C4"
    # group sensitivity columns
    md.column_dimensions.group(L(6), L(2 + len(all_cases)), hidden=False, outline_level=1)
    SCOL = {"Conservative": "C", "Base": "D", "Aggressive": "E"}

    # ---------------------------------------------------------------- Summary
    sm = wb.create_sheet("Summary", 1)
    sm["A1"] = "Summary — Graine AI × Country Delight (illustrative)"; sm["A1"].font = TITLE
    sm["A2"] = "All values are formulas from Inputs → Model. ₹ lakh = ₹1,00,000. Replace illustrative baseline inputs with Country Delight data before use."; sm["A2"].font = NOTE
    for j, h in enumerate(["Metric", "Conservative", "Base", "Aggressive", "Unit"], 1):
        c = sm.cell(row=4, column=j, value=h); c.font = HDR; c.fill = FILL_H
    rows = [
        (S, "Monthly run-rate (steady state)"),
        ("rev_total", "Incremental revenue (gross)", "lakh"), ("rev_pct", "…as % of baseline revenue", "pct"),
        ("contribution", "Incremental contribution (profit before fixed costs)", "lakh"), ("support_savings", "Support cost avoided", "lakh"),
        ("run_cost", "Running cost (Graine usage + WhatsApp + fixed)", "lakh"), ("net_month", "Net monthly benefit", "lakh"),
        (S, "Year 1 (with ramp-up)"),
        ("y1_revenue", "Year-1 incremental revenue (gross)", "lakh"), ("y1_contribution", "Year-1 incremental contribution", "lakh"),
        ("y1_savings", "Year-1 operational savings", "lakh"), ("one_time", "One-time investment", "lakh"), ("y1_running", "Year-1 running cost", "lakh"),
        ("y1_net", "Year-1 net benefit", "lakh"), ("y1_roi", "Year-1 ROI (net ÷ investment)", "mult"), ("payback", "Payback on one-time investment", "months"),
        ("annual_runrate_net", "Annualised net benefit at full run-rate", "lakh"),
        (S, "Volumes (monthly run-rate)"),
        ("agent_contacts", "Support contacts handled by the agent", "num"), ("contained", "…resolved without a person", "num"),
        ("inapp_users", "In-app agent users", "num"), ("minutes_total", "Connected voice minutes", "num"), ("chats_total", "Chat sessions", "num"),
    ]
    r = 5; SUMROW = {}
    for item in rows:
        if item[0] == S:
            sm.cell(row=r, column=1, value=item[1]).font = SECT
            for j in range(1, 6): sm.cell(row=r, column=j).fill = FILL_SECT
            r += 1; continue
        key, lab, kind = item; SUMROW[key] = r
        sm.cell(row=r, column=1, value=lab).font = BLACK
        for j, sc in enumerate(("Conservative", "Base", "Aggressive")):
            src = f"Model!{SCOL[sc]}{CROW[key]}"
            f = f"={src}/100000" if kind == "lakh" else f"={src}"
            c = sm.cell(row=r, column=2 + j, value=f); c.font = GREEN
            c.number_format = {"lakh": LAKH, "pct": "0.00%", "mult": MULT, "months": NUM1, "num": NUM}[kind]
            c.border = BOX
        sm.cell(row=r, column=5, value={"lakh": "₹ lakh", "pct": "%", "mult": "x", "months": "months", "num": "count"}[kind]).font = NOTE
        if key in ("y1_net", "y1_roi", "net_month", "rev_total"):
            for j in range(2, 5): sm.cell(row=r, column=j).fill = FILL_KEY
        r += 1
    sm.cell(row=r + 1, column=1, value="Reading this: revenue is not profit. Net benefit counts contribution (revenue × margin) plus avoided support cost, minus Graine and WhatsApp costs and the one-time investment.").font = NOTE
    sm.cell(row=r + 2, column=1, value="Payback is measured at Year-1 average realisation (ramp-up), not at full run-rate.").font = NOTE
    sm.column_dimensions["A"].width = 58
    for col in "BCD": sm.column_dimensions[col].width = 16
    sm.column_dimensions["E"].width = 10

    # ---------------------------------------------------------------- Use cases
    uc = wb.create_sheet("Use Cases", 2)
    uc["A1"] = "Contribution by use case — monthly run-rate (₹ lakh)"; uc["A1"].font = TITLE
    for j, h in enumerate(["Use case / stream", "Conservative", "Base", "Aggressive", "Type"], 1):
        c = uc.cell(row=3, column=j, value=h); c.font = HDR; c.fill = FILL_H
    streams = [("UC1/A1 Wallet: holds prevented", "rev_a1", "Revenue", 1), ("UC2 Delivery: service churn retained", "rev_uc2", "Revenue", 1),
               ("A2 Save flow (pause instead of cancel)", "rev_a2", "Revenue", 1), ("UC3 In-app: AOV uplift", "rev_uc3", "Revenue (pre-haircut)", None),
               ("UC5 Subscription expansion", "rev_uc5", "Revenue (pre-haircut)", None), ("UC4 Offers (incremental)", "rev_uc4", "Revenue (pre-haircut)", None),
               ("UC6 Wellness cross-sell", "rev_uc6", "Revenue (pre-haircut)", None), ("Overlap haircut on UC3–UC6", None, "Adjustment", None),
               ("Total incremental revenue", "rev_total", "Revenue", None), ("Support cost avoided (UC1/UC2/UC3)", "support_savings", "Cost saving", None),
               ("Graine usage cost", "graine_usage", "Cost", None), ("WhatsApp messaging fees", "wa_cost", "Cost", None)]
    rr = 4
    for lab, key, typ, _ in streams:
        uc.cell(row=rr, column=1, value=lab).font = BOLD if key == "rev_total" else BLACK
        for j, sc in enumerate(("Conservative", "Base", "Aggressive")):
            colm = SCOL[sc]
            if key is None:
                f = f"=-(Model!{colm}{CROW['rev_uc3']}+Model!{colm}{CROW['rev_uc4']}+Model!{colm}{CROW['rev_uc5']}+Model!{colm}{CROW['rev_uc6']})*'Inputs'!{'DEF'[j]}{IROW['overlap_haircut']}/100000"
            else:
                f = f"=Model!{colm}{CROW[key]}/100000"
            c = uc.cell(row=rr, column=2 + j, value=f); c.font = GREEN; c.number_format = LAKH; c.border = BOX
        uc.cell(row=rr, column=5, value=typ).font = NOTE
        rr += 1
    uc.cell(row=rr + 1, column=1, value="Check: streams minus haircut equal the total (should be 0):").font = NOTE
    for j in range(3):
        cl = "BCD"[j]
        uc.cell(row=rr + 1, column=2 + j, value=f"=ROUND(SUM({cl}4:{cl}11)-{cl}12,6)").number_format = "0.000000"
    uc.column_dimensions["A"].width = 44
    for col in "BCD": uc.column_dimensions[col].width = 15
    uc.column_dimensions["E"].width = 22
    ch = BarChart(); ch.type = "bar"; ch.style = 10; ch.title = "Base case: monthly run-rate by stream (₹ lakh)"
    ch.add_data(Reference(uc, min_col=3, min_row=3, max_row=10), titles_from_data=True); ch.set_categories(Reference(uc, min_col=1, min_row=4, max_row=10))
    ch.add_data(Reference(uc, min_col=3, min_row=13, max_row=13), titles_from_data=False)
    ch.height = 9; ch.width = 18; ch.legend = None
    uc.add_chart(ch, "G3")

    # ---------------------------------------------------------------- Sensitivity
    se = wb.create_sheet("Sensitivity", 3)
    se["A1"] = f"Sensitivity — Year-1 net benefit, Base case, each driver ±{int(DELTA*100)}% (₹ lakh)"; se["A1"].font = TITLE
    for j, h in enumerate(["Driver", "Low case", "Base", "High case", "Swing (|High − Low|)", "Low − Base", "High − Base"], 1):
        c = se.cell(row=3, column=j, value=h); c.font = HDR; c.fill = FILL_H
    y1 = CROW["y1_net"]
    for i, (key, lab) in enumerate(SENS):
        rr = 4 + i
        lo = L(3 + 3 + 2 * i); hi = L(3 + 3 + 2 * i + 1)
        se.cell(row=rr, column=1, value=lab).font = BLACK
        se.cell(row=rr, column=2, value=f"=Model!{lo}{y1}/100000").font = GREEN
        se.cell(row=rr, column=3, value=f"=Model!D{y1}/100000").font = GREEN
        se.cell(row=rr, column=4, value=f"=Model!{hi}{y1}/100000").font = GREEN
        se.cell(row=rr, column=5, value=f"=ABS(D{rr}-B{rr})").font = BLACK
        se.cell(row=rr, column=6, value=f"=B{rr}-C{rr}").font = BLACK
        se.cell(row=rr, column=7, value=f"=D{rr}-C{rr}").font = BLACK
        for j in range(2, 8): se.cell(row=rr, column=j).number_format = LAKH; se.cell(row=rr, column=j).border = BOX
    se.cell(row=5 + len(SENS), column=1, value="Read: the larger the swing, the more the business case depends on that assumption — validate those first in the pilot.").font = NOTE
    se.column_dimensions["A"].width = 34
    for col in "BCDEFG": se.column_dimensions[col].width = 15
    tc = BarChart(); tc.type = "bar"; tc.grouping = "clustered"; tc.overlap = 100; tc.title = "Change in Year-1 net benefit vs Base (₹ lakh)"
    tc.add_data(Reference(se, min_col=6, min_row=3, max_row=3 + len(SENS)), titles_from_data=True)
    tc.add_data(Reference(se, min_col=7, min_row=3, max_row=3 + len(SENS)), titles_from_data=True)
    tc.set_categories(Reference(se, min_col=1, min_row=4, max_row=3 + len(SENS))); tc.height = 10; tc.width = 20
    se.add_chart(tc, "I3")

    for sh in (ws, md, sm, uc, se, ci):
        sh.sheet_view.showGridLines = False
    from openpyxl.workbook.properties import CalcProperties
    wb.calculation = CalcProperties(fullCalcOnLoad=True)
    wb.save(OUT)
    return CROW, IROW

if __name__ == "__main__":
    build(); print("saved", OUT)
