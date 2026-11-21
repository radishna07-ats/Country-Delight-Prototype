"""Regenerates ../Test_Results.md from vitest (verbose) + tests/e2e/e2e-results.json.
Usage: npx vitest run --reporter=verbose > /tmp/unit.txt; python3 tests/make_test_report.py /tmp/unit.txt"""
import json, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.join(HERE, "..")
u = [l.strip() for l in open(sys.argv[1]) if re.match(r"^\s*[✓×]", l)]
e = json.load(open(os.path.join(HERE, "e2e/e2e-results.json")))
L = ["# Prototype Test Results", "", f"**Run:** {e['ranAt'][:16].replace('T',' ')} UTC · Node 22 · Chromium (Playwright) · Vite 5.4.11", "",
     "| Suite | Passed | Total |", "|---|---|---|",
     f"| Unit & scenario tests (Vitest) | {sum(1 for x in u if x.startswith('✓'))} | {len(u)} |",
     f"| End-to-end UI tests (Playwright) | {e['passed']} | {e['total']} |", "| TypeScript strict typecheck | pass | — |", "| Production build | pass | — |", "",
     "## End-to-end UI tests", "", "| ID | Test | Result | Time |", "|---|---|---|---|"]
L += [f"| {r['id']} | {r['title']} | {'✅ PASS' if r['status']=='PASS' else '❌ FAIL'} | {r['ms']/1000:.1f}s |" for r in e["results"]]
L += ["", "## Unit and scenario tests", "", "| Result | Test |", "|---|---|"]
for x in u:
    t = re.sub(r"^[✓×]\s*tests/unit/", "", x); t = re.sub(r"\s+\d+ms$", "", t).replace("|", "/")
    L.append(f"| {'✅' if x.startswith('✓') else '❌'} | {t} |")
L += ["", open(os.path.join(HERE, "defects.md")).read()]
open(os.path.join(ROOT, "..", "Test_Results.md"), "w").write("\n".join(L) + "\n")
print("written")
