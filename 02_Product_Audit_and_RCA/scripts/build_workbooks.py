"""Builds Friction_Register.xlsx and Opportunity_Prioritisation.xlsx (formula-driven).
Usage: python3 build_workbooks.py
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import ColorScaleRule, FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "..")
GREEN = "1E5631"; thin = Side(style="thin", color="D5DED8")
F_HDR = Font(name="Arial", size=9, bold=True, color="FFFFFF"); F_BODY = Font(name="Arial", size=9, color="1F2A24")
F_INPUT = Font(name="Arial", size=9, color="0000FF"); F_CALC = Font(name="Arial", size=9, color="000000", bold=True)

def style_sheet(ws, widths, hdr_row=1):
    for i, w in enumerate(widths): ws.column_dimensions[ws.cell(row=1, column=i + 1).column_letter].width = w
    for r in ws.iter_rows(min_row=hdr_row, max_row=ws.max_row):
        for c in r:
            c.alignment = Alignment(wrap_text=True, vertical="top"); c.border = Border(top=thin, bottom=thin, left=thin, right=thin)
            if c.row == hdr_row: c.font = F_HDR; c.fill = PatternFill("solid", start_color=GREEN)
            elif c.font == Font(): c.font = F_BODY

# ---------------------------------------------------------------- Friction register
FR = [
# id, symptom, evidence, current journey, potential root cause (hypothesis), dependency, customer impact, business impact, frequency signal, severity(1-5), intervention, use case, validation
("F-01","Customers cannot explain wallet deductions; call them fraud","N03 16.7% Play / 27.5% iOS negatives; EV-026 ledger shows 'Paid for Order −₹49' with no product/order; EV-009 Autopay deducts 25–26 h after trigger; EV-031 split cashback; EV-010 VIP benefit cap","Menu → Transactions (or CD Money) → read ledger → no link to order → Ayuh 'Recharges' tree → ticket or call","Ledger UI shows amount and balance but not the cause; multiple money mechanics on different clocks; no single explanation surface","Wallet ledger API with order/product/plan references","Distrust, contact, churn ('keep watch your wallet')","Support cost; refund disputes; uninstall","High (top-3 theme)",5,"Grounded wallet explanation on request: identify transaction, link to order/plan, explain rule, offer next step","UC1","CD contact reasons: share 'wallet/deduction'; ledger fields available"),
("F-02","Refund of wallet balance to bank needs a human","EV-008 FAQ: via support only, 5–7 working days; reviews 'can't withdraw money'","Find helpline (6 am–9 pm) → request → SMS link → bank details → wait","Process designed as an exception path through support","Refund-request API + bank-detail link flow","Effort, anxiety","Support cost","Medium",3,"Agent initiates the same refund request (customer confirms; bank details via CD's existing secure link); status updates","UC1","Refund API; approval rules"),
("F-03","Recharge feels forced/complex (₹3,000 Smart Plan, minimums, Autopay compulsion)","N04 8.3% / 13.7%; EV-031; review quoting 4-step path to ₹3,000","Home banner → CD Money → choose plan → pay","Commercial design favours larger prepaid top-ups; options not explained in context","Plan rules, recharge deep link","Irritation; some abandonment","Lower recharge completion (hypothesis)","Medium",3,"Explain options neutrally (incl. a manual amount, which FAQ says is allowed); deep-link to CD's payment screen; agent never pays","UC1","Recharge funnel data"),
("F-04","Pre-6 AM delivery problems have no live channel","EV-001 delivery 5:00–7:30; EV-002 support 6 am–9 pm; reviews 'no way to get issues sorted the same day'","Discover missing milk at 5:30 → app has no order-level 'report issue' → Ayuh tree → call (closed until 6) → wait","Support staffed for daytime; self-serve stops at tree/phone","Order & delivery-status API; ticket API","Morning plans disrupted (e.g. tea, children)","Escalations, cancellations","High (core window)",5,"24×7 agent: verified status, ticket with case id, approved remedy, call-back slot when humans start","UC2","Contacts by hour; first-contact resolution"),
("F-05","'Marked delivered but not received' and missing items resolved slowly or closed without resolution","N06 10.2%/15.0% (understated); EV-069; FAQ path exists; reviews '24–48 h', 'marked resolved'","Raise ticket in chat → wait → follow up by phone","Proof-of-delivery data not surfaced to customer or first-line agent; manual investigation","POD photo/GPS, rider assignment, ticket system","Feeling cheated","Refunds, repeat contacts, churn","High",5,"Agent retrieves POD and status, explains what is known, creates ticket with evidence, sets expectation by policy","UC2","POD data availability; SLA"),
("F-06","Damaged/poor items (leaks, coconut water, broken eggs) need a call to resolve","N08 26.2%/33.3%; reviews about calls and photo sharing by email/WhatsApp","Call → asked to share photo via email/WhatsApp → wait","No in-app evidence capture tied to the order line","Attachment upload, replacement/credit policy","Frustration, waste","Credits, churn","High",4,"Report against the order line, optional photo (proposed integration), policy-bound replacement or credit request","UC2","Replacement/credit rules; photo storage"),
("F-07","Ayuh feels like a loop; escalation leaves the app for a phone call","EV-033; N09 18.1%/32.7%; 'chatbots keep going round and round'","Ayuh tile → sub-tile → 'Something else' → ticket or 'Call Us' dialer","Menu tree cannot understand free text or act; no handoff with context","Ayuh owner; orchestration","Abandonment","Avoidable calls","High",4,"Graine complements Ayuh: free text/voice, executes declared actions, warm handoff with summary","UC3","Ayuh containment & drop-off data"),
("F-08","Subscription changes spread over 3 surfaces; fear of unintended consequences","EV-022/EV-023 (edit, pause, remove, vacation on different surfaces); EV-011 offer voids on change; N10 13.3%/15.7% incl. 'adds items on its own'","My Subscriptions → EDIT → scroll → PAUSE/REMOVE/VACATION or stepper → CONFIRM","Operations modelled per product page, not per intent; consequences (offer void, price) not previewed","Subscription APIs per operation; offer-eligibility API","Anxiety, mistakes","Lower expansion; accidental churn","Medium-High",4,"Intent-level change card: current → proposed, effective date, price, offer impact, Confirm/Undo","UC5","Funnel analytics on My Subscriptions"),
("F-09","Vacation setup is rigid and has changed unexpectedly","EV-019 Max 60 days; reviews: '2-day limit', 'end date silently set to 1 day'","Menu → Set Vacation → calendar sheet → pick start & end → CONFIRM","Date-range UI only; app updates changed behaviour without notice","Vacation API and rules","Wasted deliveries, deductions","Refunds, contacts","Medium",3,"'Pause from Monday to Sunday' → resolved dates, rule check, read-back, confirm","UC3/UC5","Vacation error rates"),
("F-10","Subscription removal has no save step or reason capture","EV-024 'Subscription Cancelled — Please try our other products'","EDIT → REMOVE → cancelled","Cancellation treated as a terminal action","Reason taxonomy; pause/vacation alternatives","—","Recoverable churn lost (hypothesis)","Unknown",4,"Ask why; offer pause/vacation/quantity change; never block removal","A2","Cancellation reasons; save rate test"),
("F-11","Doorstep disturbances (5 AM bell, calls, items left outside)","N07 6.2%/8.5%; EV-030 preferences exist in Account","Complain or tolerate; preferences 3 taps deep","Preference controls not surfaced at the moment of complaint","Delivery-preference API","Sleep disruption, spoilage","Churn of otherwise happy customers","Medium",3,"Agent offers and sets 'Don't ring the bell / Call before delivery / Voice instruction' after a doorstep complaint","A3","Preference adoption"),
("F-12","Offer and VIP terms misunderstood (4+4 void, benefit cap, cashback split)","N05 9.0%/9.8%; N02 11.2%/17.6%; EV-010, EV-011, EV-031","Read terms in FAQ (if found) → complain","Terms disclosed outside the moment of decision","Offer & VIP rule APIs","Feels misled","Disputes, reputation","Medium-High",4,"Explain the exact rule at decision time and when asked; show benefit balance","UC1/UC4","—"),
("F-13","Unwanted repeated promotional calls","EV-068 (N13 1.9%/2.6%)","Receive calls; no visible opt-out path","Outbound frequency not capped per customer (hypothesis)","Consent & frequency data","Annoyance","Brand damage, regulatory risk","Low-Medium",4,"UC4 only with consent, caps, DNC, AI disclosure, opt-out; prefer in-app/WhatsApp opt-in","UC4 (guardrail)","Outbound volumes, opt-outs"),
("F-14","Health goals are shelves; no profile, no allergy filter","EV-036 'Pick Your Health Goal'; no allergy/diet filter observed","Groceries → goal chip → browse","Merchandising view, not personalisation","Nutrition & allergen attributes per SKU","Harder discovery for goal-led shoppers","Untapped cross-sell (hypothesis)","Unknown",2,"Wellness profile (goals, diet, allergies with consent) → filtered, explained recommendations","UC6","Catalogue attribute coverage; experiment"),
("F-15","Low balance puts deliveries at risk with little forecast","EV-014 BALANCE LOW banner; reviews 'delivery hold', 'Rs 3 short'","Banner → recharge or miss delivery","No 'runway' forecast (days of deliveries left)","Ledger + subscription schedule","Missed delivery","Lost orders","Medium",3,"Balance runway explanation + opt-in reminder before a hold","A1","Delivery holds due to balance"),
("F-16","Price changes discovered after the fact","Reviews N01/N03: 'prices change without any SMS/notification'","Notice in ledger","Price updates not proactively communicated (hypothesis)","Price-change events","Distrust","Disputes","Medium",3,"Opt-in notice before a subscribed item's price changes; agent can explain a price history","A4","Price-change frequency"),
("F-17","Support language mismatch","N09 example (Telugu); multi-city base","IVR language → mismatched agent","Staffing by language","Language routing","Exclusion","CSAT","Low-Medium",3,"Voice/chat agent in caller's language, Hinglish code-switch","UC2/UC3","Language mix of contacts"),
("F-18","Login/OTP failures lock customers out","N11 examples ('OTP failure 10 times')","Retry OTP","Auth delivery issues","Auth service","Cannot order","Lost orders","Low-Medium",3,"Out of agent scope in-app; WhatsApp/voice help can still check status after verification","— (note)","Auth error rates"),
("F-19","Product quality complaints (taste, freshness, pack size)","N08 26%/33%; N01 15%/25%","Complain","Product/operations, not interface","Quality ops","Dissatisfaction","Churn","High",5,"Not an agent fix. Agent captures structured feedback per batch and shows test reports; data to quality team","A5","Quality ops engagement"),
]
FR_HDR = ["ID","Customer symptom","Evidence","Current journey","Potential root cause (HYPOTHESIS unless stated)","Technical / operational dependency","Customer impact","Business impact","Frequency signal","Severity (1–5)","Proposed intervention","Use case","Validation required"]

def build_friction():
    wb = Workbook(); ws = wb.active; ws.title = "Friction Register"; ws.append(FR_HDR)
    for r in FR: ws.append(list(r))
    style_sheet(ws, [6, 30, 42, 34, 34, 26, 20, 20, 14, 9, 40, 9, 26])
    ws.freeze_panes = "C2"; ws.auto_filter.ref = f"A1:M{ws.max_row}"
    ws.conditional_formatting.add(f"J2:J{ws.max_row}", ColorScaleRule(start_type="num", start_value=1, start_color="F3F7F4", end_type="num", end_value=5, end_color="E8A33D"))
    s = wb.create_sheet("By Use Case"); s.append(["Use case", "Friction points", "Avg severity"])
    for i, uc in enumerate(["UC1", "UC2", "UC3", "UC4", "UC5", "UC6", "A1", "A2", "A3", "A4", "A5"], start=2):
        s.append([uc, f"=COUNTIF('Friction Register'!L:L,\"*{uc}*\")", f"=IFERROR(AVERAGEIF('Friction Register'!L:L,\"*{uc}*\",'Friction Register'!J:J),\"–\")"])
        s[f"C{i}"].number_format = "0.0"
    style_sheet(s, [14, 16, 14])
    wb.save(os.path.join(OUT, "Friction_Register.xlsx"))

# ---------------------------------------------------------------- Opportunity / use-case prioritisation
CRIT = [("Customer value", 0.30, "impact"), ("Revenue potential", 0.25, "impact"), ("Retention potential", 0.25, "impact"), ("Operational impact", 0.20, "impact"),
        ("Technical feasibility", 0.30, "feas"), ("Integration simplicity", 0.25, "feas"), ("Time to value", 0.25, "feas"), ("Data availability", 0.20, "feas")]
# scores 1–5; for feasibility criteria 5 = easiest / simplest / fastest / most available
OPP = [
("UC1","Wallet & Smart Recharge explanation (in-app, voice, WhatsApp)","Core",       [5,3,4,4, 5,4,5,4],"Read-only ledger + rules; strong review signal (N03/N04)"),
("UC2","Delivery issue resolution (status, ticket, approved remedy)","Core",          [5,2,5,5, 4,3,4,3],"Needs status + ticket APIs; POD data may lag"),
("UC3","In-app conversational agent (help, navigation, cart, Ayuh complement)","Core",[4,4,4,3, 3,2,2,4],"SDK + app release + handlers"),
("UC4","Offer & promotion outreach (consent-first)","Core",                           [2,4,3,2, 4,3,3,3],"High governance need; risk N13"),
("UC5","Conversational subscription management (components, confirm/undo)","Core",  [4,5,5,3, 3,2,2,4],"Subscription write APIs + components"),
("UC6","Personalised wellness & product discovery","Core",                           [3,4,3,1, 3,3,2,1],"Nutrition/allergen data gap; hypothesis"),
("A1","Balance runway & replenishment reminder (opt-in)","Additional",               [4,4,4,3, 4,4,4,4],"Ledger + schedule; small build"),
("A2","Cancellation save conversation (reason → pause/vacation alternative)","Additional",[3,4,5,2, 4,3,3,4],"Hooks into UC5"),
("A3","Doorstep preference assistant after a doorstep complaint","Additional",       [4,1,3,3, 4,4,4,4],"Preference API exists in app"),
("A4","Proactive delivery-exception & price-change notifications (WhatsApp/push, opt-in)","Additional",[4,2,4,4, 3,3,3,3],"Event feeds needed; no pre-dawn voice"),
("A5","Structured post-delivery feedback & quality capture","Additional",            [3,1,3,4, 4,4,4,3],"Feeds quality team"),
("A6","Lapsed-subscriber win-back (consent-first)","Additional",                     [2,4,4,1, 4,3,3,3],"Overlaps UC4 governance"),
("A7","Product education (test reports, ingredients Q&A from approved content)","Additional",[3,2,2,3, 5,5,5,4],"Knowledge base only"),
]

def build_prioritisation():
    wb = Workbook(); w = wb.active; w.title = "Weights"
    w.append(["Criterion", "Weight", "Dimension", "Notes"])
    for name, wt, dim in CRIT: w.append([name, wt, "Impact" if dim == "impact" else "Feasibility", "Score 1–5; for feasibility 5 = easiest/simplest/fastest/most available"])
    w.append(["Impact weights total", "=SUM(B2:B5)", "", "Must equal 100%"]); w.append(["Feasibility weights total", "=SUM(B6:B9)", "", "Must equal 100%"])
    for r in range(2, 12): w[f"B{r}"].number_format = "0%"
    for r in range(2, 10): w[f"B{r}"].font = F_INPUT
    w.append([]); w.append(["Quadrant thresholds", "", "", ""]); w.append(["Impact threshold", 3.5]); w.append(["Feasibility threshold", 3.4])
    w["B14"].font = F_INPUT; w["B15"].font = F_INPUT
    style_sheet(w, [28, 12, 14, 60])

    s = wb.create_sheet("Scoring")
    hdr = ["ID", "Opportunity", "Type"] + [c[0] for c in CRIT] + ["Impact score", "Feasibility score", "Priority (I×F)", "Rank", "Quadrant", "Rationale"]
    s.append(hdr)
    for i, (oid, name, typ, sc, why) in enumerate(OPP, start=2):
        row = [oid, name, typ] + sc
        imp = "=(" + "+".join(f"{chr(68 + k)}{i}*Weights!$B${2 + k}" for k in range(4)) + ")"
        fea = "=(" + "+".join(f"{chr(72 + k)}{i}*Weights!$B${6 + k}" for k in range(4)) + ")"
        row += [imp, fea, f"=L{i}*M{i}", f"=RANK(N{i},$N$2:$N${len(OPP)+1})",
                f'=IF(AND(L{i}>=Weights!$B$14,M{i}>=Weights!$B$15),"Quick win / Pilot",IF(L{i}>=Weights!$B$14,"Strategic bet",IF(M{i}>=Weights!$B$15,"Easy add-on","Later / validate first")))', why]
        s.append(row)
        for col in "DEFGHIJK": s[f"{col}{i}"].font = F_INPUT
        for col in "LMN": s[f"{col}{i}"].number_format = "0.00"; s[f"{col}{i}"].font = F_CALC
    style_sheet(s, [6, 46, 11] + [11] * 8 + [11, 11, 11, 7, 18, 40])
    for col in "LMN":
        for i in range(2, len(OPP) + 2): s[f"{col}{i}"].font = F_CALC
    s.freeze_panes = "D2"
    s.conditional_formatting.add(f"N2:N{len(OPP)+1}", ColorScaleRule(start_type="min", start_color="F3F7F4", end_type="max", end_color="2E8B57"))
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="5", showErrorMessage=True, error="Score 1–5")
    s.add_data_validation(dv); dv.add(f"D2:K{len(OPP)+1}")

    k = wb.create_sheet("Legend")
    for row in [["Colour", "Meaning"], ["Blue text", "Input you can change (scores, weights, thresholds)"], ["Black bold", "Formula"],
                ["Quadrants", "Quick win / Pilot: impact ≥ threshold and feasibility ≥ threshold · Strategic bet: high impact, harder · Easy add-on: easy, lower impact · Later / validate first: lower impact and harder today"],
                ["Scores", "Analyst judgement from the evidence in 01_Research_and_Discovery and the Friction Register; to be re-scored with Country Delight in discovery"]]:
        k.append(row)
    style_sheet(k, [16, 110])
    wb.save(os.path.join(OUT, "Opportunity_Prioritisation.xlsx"))

if __name__ == "__main__":
    build_friction(); build_prioritisation(); print("ok", len(FR), len(OPP))
