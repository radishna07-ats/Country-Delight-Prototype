"""Builds Evidence_Register.xlsx and Evidence_Register.md from evidence_data.py.
Usage: python3 build_registers.py  (run from this folder)
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import FormulaRule
from evidence_data import E

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..")
HDR = ["ID", "Description", "Classification", "Source", "Evidence / reference", "Timestamp / page",
       "Business implication", "Confidence", "Validation required"]

def build_xlsx():
    wb = Workbook(); ws = wb.active; ws.title = "Evidence Register"
    ws.append(HDR)
    for row in E: ws.append(list(row))
    widths = [9, 70, 18, 22, 30, 12, 55, 11, 34]
    for i, w in enumerate(widths): ws.column_dimensions[chr(65 + i)].width = w
    thin = Side(style="thin", color="D5DED8")
    for r in ws.iter_rows(min_row=1, max_row=ws.max_row):
        for c in r:
            c.alignment = Alignment(wrap_text=True, vertical="top")
            c.border = Border(top=thin, bottom=thin, left=thin, right=thin)
            c.font = Font(name="Arial", size=9, bold=(c.row == 1), color="FFFFFF" if c.row == 1 else "1F2A24")
    for c in ws[1]: c.fill = PatternFill("solid", start_color="1E5631")
    ws.freeze_panes = "B2"
    tab = Table(displayName="Evidence", ref=f"A1:I{ws.max_row}")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleLight1", showRowStripes=True)
    ws.add_table(tab)
    colors = {"VERIFIED": "E3F1E7", "OBSERVED": "E6EEF8", "HYPOTHESIS": "FFF4DC", "PROPOSED": "F1E8F7"}
    for k, col in colors.items():
        ws.conditional_formatting.add(f"C2:C{ws.max_row}", FormulaRule(formula=[f'LEFT($C2,{len(k)})="{k}"'], fill=PatternFill("solid", start_color=col)))
    # Summary sheet with live formulas
    s = wb.create_sheet("Summary")
    s.append(["Classification", "Count", "Share"])
    for i, k in enumerate(["VERIFIED", "OBSERVED", "HYPOTHESIS", "PROPOSED"], start=2):
        s.append([k, f'=COUNTIF(\'Evidence Register\'!C:C,"{k}*")', f"=B{i}/SUM($B$2:$B$5)"])
        s[f"C{i}"].number_format = "0%"
    s.append(["Total", "=SUM(B2:B5)", "=SUM(C2:C5)"]); s["C6"].number_format = "0%"
    s.append([]); s.append(["Confidence", "Count"])
    for i, k in enumerate(["High", "Medium", "Low"], start=9):
        s.append([k, f'=COUNTIF(\'Evidence Register\'!H:H,"{k}")'])
    for r in s.iter_rows():
        for c in r: c.font = Font(name="Arial", size=10, bold=(c.row in (1, 8)))
    s.column_dimensions["A"].width = 18
    g = wb.create_sheet("Legend")
    for row in [["Class", "Meaning"],
                ["VERIFIED", "Directly established by an authoritative source, supplied documentation or reliable research."],
                ["OBSERVED", "Visible in the app recording or dashboard recording; business logic not verified."],
                ["HYPOTHESIS", "Potential customer/business problem or claim that requires validation."],
                ["PROPOSED", "A solution, feature or improvement recommended by Graine."],
                ["", ""], ["Source IDs", "See 00_Project_Management/Source_Inventory.md (S1–S9) and Research_Sources_Register.md (R-xx)."]]:
        g.append(row)
    g.column_dimensions["A"].width = 14; g.column_dimensions["B"].width = 100
    wb.save(os.path.join(OUT, "Evidence_Register.xlsx"))

def build_md():
    lines = ["# Evidence and Assumptions Register", "",
             "Generated from `scripts/evidence_data.py` by `scripts/build_registers.py` — edit the data file, not this page. "
             "The same register, filterable and with formula-driven counts, is in [`Evidence_Register.xlsx`](Evidence_Register.xlsx).", "",
             "**Classes:** VERIFIED · OBSERVED · HYPOTHESIS · PROPOSED (definitions in the workbook's Legend sheet). "
             "Where a value is not in the supplied sources it is written as *Not available in the supplied sources. Requires validation from Country Delight.*", ""]
    counts = {}
    for r in E: counts[r[2].split()[0]] = counts.get(r[2].split()[0], 0) + 1
    lines += ["| Class | Entries |", "|---|---|"] + [f"| {k} | {v} |" for k, v in counts.items()] + [""]
    lines += ["| " + " | ".join(HDR) + " |", "|" + "---|" * len(HDR)]
    for r in E:
        lines.append("| " + " | ".join(str(x).replace("|", "/").replace("\n", " ") for x in r) + " |")
    open(os.path.join(OUT, "Evidence_Register.md"), "w").write("\n".join(lines) + "\n")

if __name__ == "__main__":
    build_xlsx(); build_md(); print("entries:", len(E))
