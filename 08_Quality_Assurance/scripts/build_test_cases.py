"""Builds Functional_Test_Cases.xlsx from the prototype's automated results plus the manual QA checks.

Usage: python3 build_test_cases.py <vitest-verbose-output.txt>
  (create it with: npx vitest run --reporter=verbose > unit.txt, in 06_Prototype/Source_Code)
"""
import json, os, re, sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import FormulaRule

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..")
E2E = os.path.join(ROOT, "06_Prototype", "Source_Code", "tests", "e2e", "e2e-results.json")
OUT = os.path.join(HERE, "..", "Functional_Test_Cases.xlsx")

E2E_STEPS = {
    "E01": ("Reset data, open Home", "Wallet Rs 395; tomorrow 3 items Rs 179"),
    "E02": ("Run scenario s1, tap Add on Cow Milk, close sheet", "Agent reads back the cart; cart badge shows 2"),
    "E03": ("Run s2, Confirm, open My Subscriptions, Undo", "Qty 2 shown after confirm; Qty 1 after Undo"),
    "E04": ("Run s3 (voice), Confirm card, open Menu > Set Vacation", "Sun 22 to Tue 24 Nov paused; resumes Wed 25 Nov"),
    "E05": ("Run s4", "Explanation names UPI Autopay and the Rs 78 balance below Rs 200; explainer card shown"),
    "E06": ("Type: Why was 999 deducted?", "Agent says it cannot find that deduction; nothing invented"),
    "E07": ("Run s5, Checked - nothing there, Re-deliver, Confirm, open History", "Policy options only; case CD-1122-xxxx; case listed"),
    "E08": ("Run s5w (WhatsApp, Hinglish)", "Hinglish reply with delivery status and reply buttons"),
    "E09": ("Run s5c (call), verify, say: My milk hasn't arrived", "Pincode check before account data; status 05:12"),
    "E10": ("Run s6, consent, High Protein, Vegetarian, Peanuts", "Peanut butter and eggs excluded, with the reason"),
    "E11": ("Run s7: Voice, In-app push, STOP, open Account", "Voice skipped (no consent); push shown; consent toggle off"),
    "E12": ("Run s9: VIP, Something else, Ask the assistant", "Assistant opens with Ayuh context"),
    "E13": ("Run s2, tick Fail next tool call, Confirm", "Says nothing was changed; Qty still 1"),
    "E14": ("Run s2, Cancel", "Card shows Cancelled; data unchanged"),
    "E15": ("Menu > Set Vacation: 23 Nov-31 Jan, then 23-25 Nov, Confirm", "70-day range blocked with reason; 3-day range accepted"),
    "E16": ("Confirm s2, reload page, Reset data", "Qty 2 persists across reload; reset restores Qty 1"),
    "E17": ("Open My Subscriptions three times within 45 s", "One quiet suggestion appears"),
    "E18": ("Open at 390 x 844", "No horizontal scroll; Demo button visible"),
    "E19": ("Whole run", "No uncaught page errors"),
    "E20": ("Home > open assistant > type: Find me a protein powder under Rs 2,000 and add the best-rated option to my cart", "Live step line shown; app search has the query; Top rated sort active; whey 1 kg (4.6, under budget) added; cart badge 1; reply gives the reason"),
    "E21": ("Say: Open greek yogurt, then: Add two of this to my cart", "Product page opened; one-time chosen, quantity 2, Add to cart pressed; cart line shows 2"),
    "E22": ("Open assistant, tap Products in the app", "Bar under 64 px; compact assistant covers under 35% of the screen; app navigates while the assistant stays open"),
    "E23": ("Run s2 (card), Collapse, Show details", "Panel opens for the card and leaves the top of the app visible; collapses; reopens"),
    "E24": ("Fake microphone: tap mic on/off three times; separate run with permission denied", "getUserMedia called once; denied state explains how to allow the microphone"),
}

MANUAL = [
    ("M01", "Prototype - Design QA", "Phone, laptop and desktop layouts", "Screenshots at 390, 1280 and 1600 px", "Readable; no overlap; dock does not cover CTAs", "PASS", "06_Prototype/screenshots; D-05, D-07 fixed"),
    ("M02", "Prototype - Design QA", "Empty, loading and error states", "Empty cart, no subscriptions, thinking indicator, fault injection", "Each state has a message and a next action", "PASS", "Visual review"),
    ("M03", "Prototype - Conversational QA", "No hallucinated data", "Unknown amount; missing status (fault); unknown request", "Agent says it does not know and offers a person", "PASS", "E06, E13, unit fallback test"),
    ("M04", "Prototype - Conversational QA", "No unconfirmed sensitive action", "All T2/T3 flows", "Change only after Confirm; Cancel changes nothing", "PASS", "E03, E13, E14"),
    ("M05", "Prototype - Conversational QA", "Never pays; never asks for OTP or PIN", "Please pay for my order; refund flow", "Refuses payment; bank details only via the CD screen", "PASS", "Unit: payment guardrail"),
    ("M06", "Prototype - Conversational QA", "Hinglish and mixed-language input", "mera doodh abhi tak nahi aaya; doodh 2 kar do", "Correct intent; Hinglish reply", "PASS", "Unit NLU; E08"),
    ("M07", "Prototype - Accessibility", "Labels, roles and motion", "aria-labels on icon buttons; role=switch on toggles; prefers-reduced-motion", "Present", "PASS", "Code review"),
    ("M08", "Prototype - Build", "Type check and production build", "npm run typecheck; npm run build", "0 type errors; build succeeds", "PASS", "tsc --noEmit; vite build"),
    ("M09", "Prototype - Design QA", "Compact dock at phone size", "iPhone 13 emulation; run the protein journey", "No horizontal scroll; bar, bubble and step line clear of app CTAs and the Demo button", "PASS", "Screenshots in QA run; D-28 fixed"),
    ("M10", "Prototype - Build", "Standalone file passes the same E2E suite", "E2E_URL=file://.../Demo_Standalone.html", "24/24", "PASS", "tests/e2e/e2e-results-alt.json"),
    ("F01", "Financial QA", "Formula errors", "LibreOffice full recalculation; scan every cell", "0 errors", "PASS", "CountryDelight_Revenue_Model.xlsx"),
    ("F02", "Financial QA", "Streams reconcile to total", "Use Cases sheet check row", "0.000000 in all scenarios", "PASS", "Use Cases check row"),
    ("F03", "Financial QA", "Independent recomputation", "Python re-implementation of the Base case", "Rs 162.3 L/month matches", "PASS", "ROI_Analysis.md"),
    ("F04", "Financial QA", "Prioritisation weights sum to 100%", "Weights sheet", "100% impact, 100% feasibility", "PASS", "Defect D-11 fixed"),
    ("F05", "Financial QA", "No double counting", "Review UC2 vs A2 populations; overlap haircut", "Disjoint populations; 10% haircut on UC3-UC6", "PASS", "Financial_Assumptions.md"),
    ("F06", "Financial QA", "Monthly vs annual consistency", "Year 1 = monthly run-rate x ramp + one-time cost", "Consistent", "PASS", "Model sheet"),
    ("F07", "Financial QA", "Sensitivity cases move in the expected direction", "22 cases at +/-25%", "Higher margin/ARPU raise net; higher cost lowers it", "PASS", "Sensitivity sheet"),
    ("D01", "Deliverable QA", "Deck validates and renders", "pptx validate.py; LibreOffice render of 30 slides", "Validation passed; no overflow after fixes", "PASS", "CountryDelight_Sales_Deck.pptx"),
    ("D02", "Deliverable QA", "Word documents render", "LibreOffice PDF render and page review", "Pitch and CTO guide render without overflow", "PASS", "07_Sales_Enablement"),
    ("C03", "Claims QA", "Prototype disclosed as simulated wherever shown", "Search deck, pitch and CTO guide text for the disclosure", "Present on every prototype screen and in both documents", "PASS", "Defect D-21 fixed"),
    ("D03", "Deliverable QA", "Register workbooks recalculate", "Recalc summary counts", "Counts by evidence class correct", "PASS", "Evidence_Register.xlsx"),
    ("D04", "Deliverable QA", "Internal links resolve", "Check relative links in all .md files", "No broken links", "PASS", "QA_Report.md section 7"),
    ("P01", "Privacy QA", "No PII from the screen recording", "Search all files for phone and address strings seen in the recording", "0 matches; frames with PII not stored", "PASS", "QA_Report.md section 5"),
    ("P02", "Privacy QA", "No third-party confidential terms", "Search all files incl. docx/pptx for the other client's name, prices and contacts", "0 in client-facing files", "PASS", "QA_Report.md section 5"),
    ("P03", "Privacy QA", "Reviewer personal data minimised", "Redact salutation names, phones and emails in datasets", "1,162 fields redacted; theme counts unchanged", "PASS", "01_Research_and_Discovery/data"),
    ("C01", "Claims QA", "No misleading production claims", "Scan deck and docs for live / integrated / production-ready", "Only simulated / not connected / proposed statements", "PASS", "QA_Report.md section 6"),
    ("C02", "Claims QA", "Metrics traceable to evidence", "Each number in deck and pitch maps to the evidence register or is labelled illustrative", "All mapped", "PASS", "Evidence_Register.xlsx"),
]


def main(unit_path):
    rows = []
    e2e = json.load(open(E2E, encoding="utf-8"))
    for r in e2e["results"]:
        steps, exp = E2E_STEPS.get(r["id"], ("", ""))
        rows.append([r["id"], "Prototype - E2E UI", r["title"], steps, exp,
                     "PASS" if r["status"] == "PASS" else "FAIL", "tests/e2e/e2e-results.json"])
    lines = [l.strip() for l in open(unit_path, encoding="utf-8") if re.match(r"^\s*[✓×]", l)]
    for i, x in enumerate(lines, 1):
        t = re.sub(r"^[✓×]\s*tests/unit/", "", x)
        t = re.sub(r"\s+\d+ms$", "", t)
        f, _, rest = t.partition(" > ")
        area = "Prototype - NLU" if f.startswith("nlu") else "Prototype - Agent engine"
        rows.append([f"U{i:02d}", area, rest, "Automated (Vitest)", "As asserted in the test",
                     "PASS" if x.startswith("✓") else "FAIL", "tests/unit/" + f])
    rows += [list(m) for m in MANUAL]

    wb = Workbook()
    ws = wb.active
    ws.title = "Test Cases"
    ws.append(["ID", "Area", "Test case", "Steps", "Expected result", "Result", "Evidence"])
    for r in rows:
        ws.append(r)
    thin = Side(style="thin", color="D5DED8")
    for row in ws.iter_rows():
        for c in row:
            c.alignment = Alignment(wrap_text=True, vertical="top")
            c.border = Border(top=thin, bottom=thin, left=thin, right=thin)
            c.font = Font(name="Arial", size=9, bold=c.row == 1, color="FFFFFF" if c.row == 1 else "1D2A22")
    for c in ws[1]:
        c.fill = PatternFill("solid", start_color="1F4D2B")
    for col, w in zip("ABCDEFG", (7, 26, 52, 42, 42, 9, 30)):
        ws.column_dimensions[col].width = w
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = f"A1:G{ws.max_row}"
    rng = f"F2:F{ws.max_row}"
    ws.conditional_formatting.add(rng, FormulaRule(formula=['$F2="PASS"'], fill=PatternFill("solid", start_color="E3F1E7")))
    ws.conditional_formatting.add(rng, FormulaRule(formula=['$F2="FAIL"'], fill=PatternFill("solid", start_color="FDE2E1")))

    s = wb.create_sheet("Summary")
    s.append(["Area", "Passed", "Total", "Pass rate"])
    areas = sorted(set(r[1] for r in rows))
    for i, a in enumerate(areas, 2):
        s.append([a, f"=COUNTIFS('Test Cases'!B:B,A{i},'Test Cases'!F:F,\"PASS\")",
                  f"=COUNTIF('Test Cases'!B:B,A{i})", f"=IF(C{i}>0,B{i}/C{i},0)"])
        s[f"D{i}"].number_format = "0%"
    n = len(areas) + 2
    s.append(["Total", f"=SUM(B2:B{n-1})", f"=SUM(C2:C{n-1})", f"=IF(C{n}>0,B{n}/C{n},0)"])
    s[f"D{n}"].number_format = "0%"
    for row in s.iter_rows():
        for c in row:
            c.font = Font(name="Arial", size=10, bold=c.row in (1, n))
    s.column_dimensions["A"].width = 34
    s.append([])
    s.append(["Generated from automated results (e2e-results.json, Vitest output) and the manual checks listed in QA_Report.md."])
    wb.save(OUT)
    print(len(rows), "cases;", sum(1 for r in rows if r[5] == "PASS"), "pass;", len(areas), "areas")


if __name__ == "__main__":
    main(sys.argv[1])
