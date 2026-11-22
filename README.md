# Graine AI × Country Delight: transformation proposal and prototype

An evidence-based proposal for an AI assistance layer across Country Delight's app, WhatsApp and voice. It contains research, root-cause analysis, six use cases, a working prototype, a business case and the meeting package.

> **Status:** complete and QA'd. See [PROJECT_STATUS.md](PROJECT_STATUS.md).
> **Important:** the prototype runs on a **simulated** back end with a fictional customer. Nothing is connected to Country Delight's systems or to a live Graine agent. Every financial baseline is **illustrative** until Country Delight supplies its data.

## Start here

| If you are… | Open |
|---|---|
| Presenting to Country Delight | [Sales deck](07_Sales_Enablement/CountryDelight_Sales_Deck.pptx) · [Pitch script](07_Sales_Enablement/CountryDelight_Sales_Pitch.docx) · [Demo script](07_Sales_Enablement/Meeting_Demo_Script.md) |
| Meeting their CTO | [CTO discussion guide](07_Sales_Enablement/CTO_Discussion_Guide.docx) · [Solution architecture](05_Product_Architecture/Solution_Architecture.md) · [Security](05_Product_Architecture/Security_Considerations.md) |
| Running the demo | [Prototype README](06_Prototype/README.md) (commands below) |
| Checking the evidence | [Evidence register](01_Research_and_Discovery/Evidence_Register.md) · [Executive findings](02_Product_Audit_and_RCA/Executive_Findings.md) |
| Reviewing quality | [QA report](08_Quality_Assurance/QA_Report.md) · [Validation checklist](08_Quality_Assurance/Final_Validation_Checklist.md) |

## Run the prototype

Three ways to run it, easiest first:

1. **Hosted link (no install):** https://claude.ai/artifact/6PBj2aEbdkCtro7HiFwXC8. It is private until you share it from the page's Share menu. Microphone input is blocked there, so voice uses the tap-to-speak phrases.
2. **Double-click file (offline):** open [`06_Prototype/Demo_Standalone.html`](06_Prototype/Demo_Standalone.html) in Chrome or Edge. Real microphone input works here after you allow it.
3. **From source (needs Node 18+):**

```bash
cd 06_Prototype/Source_Code && npm install
```

```bash
npm run build && npm run preview
```

Then open http://localhost:4173. Whichever way you run it, use a screen at least 1280 px wide and press **P** for presentation mode (or add `#present` to the link). Run the tests with `npm test` (unit) and, after `npm run build`, `npm run test:e2e` (UI; needs Playwright with Chromium; it starts its own preview server).

## Contents

### 00 Project management
- [Project_Brief.md](00_Project_Management/Project_Brief.md): purpose, audience, scope and the rules we applied
- [Source_Inventory.md](00_Project_Management/Source_Inventory.md): every supplied source, the conflicts between sources, and missing information
- [Execution_Plan.md](00_Project_Management/Execution_Plan.md): steps done and the proposed steps after the meeting
- [Decision_Log.md](00_Project_Management/Decision_Log.md): 15 decisions, with alternatives and evidence

### 01 Research and discovery
- [Business_Research.md](01_Research_and_Discovery/Business_Research.md)
- [Customer_Review_Analysis.md](01_Research_and_Discovery/Customer_Review_Analysis.md): 2,150 public reviews; low-star reviews coded by theme; reproducible from `data/` and `scripts/`
- [Competitor_Analysis.md](01_Research_and_Discovery/Competitor_Analysis.md)
- [Application_Audit.md](01_Research_and_Discovery/Application_Audit.md): 31 screens from the app recording, with timestamps
- [Graine_Capability_Matrix.md](01_Research_and_Discovery/Graine_Capability_Matrix.md): available today / configuration / integration / proposed
- [Client_Requirement_Analysis.md](01_Research_and_Discovery/Client_Requirement_Analysis.md) *(internal)*
- [Evidence_Register.xlsx](01_Research_and_Discovery/Evidence_Register.xlsx) ([.md](01_Research_and_Discovery/Evidence_Register.md)): 79 entries, VERIFIED / OBSERVED / HYPOTHESIS / PROPOSED
- [Research_Sources_Register.md](01_Research_and_Discovery/Research_Sources_Register.md)

### 02 Product audit and RCA
- [Current_State_Analysis.md](02_Product_Audit_and_RCA/Current_State_Analysis.md) · [Root_Cause_Analysis.md](02_Product_Audit_and_RCA/Root_Cause_Analysis.md) · [Executive_Findings.md](02_Product_Audit_and_RCA/Executive_Findings.md)
- [Friction_Register.xlsx](02_Product_Audit_and_RCA/Friction_Register.xlsx) · [Opportunity_Prioritisation.xlsx](02_Product_Audit_and_RCA/Opportunity_Prioritisation.xlsx)

### 03 Customer journey and personas
- [User_Personas.md](03_Customer_Journey_and_Personas/User_Personas.md) · [Current_Journey.md](03_Customer_Journey_and_Personas/Current_Journey.md) · [Enhanced_Journey.md](03_Customer_Journey_and_Personas/Enhanced_Journey.md)
- [Use_Case_Specifications.md](03_Customer_Journey_and_Personas/Use_Case_Specifications.md): UC1–UC6 and A1–A7
- [Journey_Maps/Sequence_Diagrams.md](03_Customer_Journey_and_Personas/Journey_Maps/Sequence_Diagrams.md)

### 04 Revenue and financial model
- [CountryDelight_Revenue_Model.xlsx](04_Revenue_and_Financial_Model/CountryDelight_Revenue_Model.xlsx): editable inputs, three scenarios, sensitivity; generated by `build_model.py`
- [Financial_Assumptions.md](04_Revenue_and_Financial_Model/Financial_Assumptions.md) · [ROI_Analysis.md](04_Revenue_and_Financial_Model/ROI_Analysis.md)

### 05 Product architecture
- [Solution_Architecture.md](05_Product_Architecture/Solution_Architecture.md) · [Integration_Requirements.md](05_Product_Architecture/Integration_Requirements.md) · [Data_Flow.md](05_Product_Architecture/Data_Flow.md) · [Security_Considerations.md](05_Product_Architecture/Security_Considerations.md)
- [Pilot_Recommendation.md](05_Product_Architecture/Pilot_Recommendation.md) · [Implementation_Roadmap.md](05_Product_Architecture/Implementation_Roadmap.md)

### 06 Prototype
- [README.md](06_Prototype/README.md) · [Source_Code/](06_Prototype/Source_Code/) · [Test_Results.md](06_Prototype/Test_Results.md) · [screenshots/](06_Prototype/screenshots/)

### 07 Sales enablement
- [CountryDelight_Sales_Deck.pptx](07_Sales_Enablement/CountryDelight_Sales_Deck.pptx): 30 slides with speaker notes
- [CountryDelight_Sales_Pitch.docx](07_Sales_Enablement/CountryDelight_Sales_Pitch.docx) · [CTO_Discussion_Guide.docx](07_Sales_Enablement/CTO_Discussion_Guide.docx) · [Meeting_Demo_Script.md](07_Sales_Enablement/Meeting_Demo_Script.md)
- `build/`: generators for the deck and documents (`npm install && node deck.js && node docs.js`)

### 08 Quality assurance
- [Functional_Test_Cases.xlsx](08_Quality_Assurance/Functional_Test_Cases.xlsx) · [QA_Report.md](08_Quality_Assurance/QA_Report.md) · [Final_Validation_Checklist.md](08_Quality_Assurance/Final_Validation_Checklist.md)

### Supplied material in this repository
- `Graine AI Country Delight Deck (1).html`: the existing client deck (source S5)
