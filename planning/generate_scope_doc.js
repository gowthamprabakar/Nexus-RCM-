const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, 
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat, TableOfContents
} = require('docx');
const fs = require('fs');

const NAVY = "1B3A6B";
const TEAL = "0D7377";
const PURPLE = "6B21A8";
const LIGHT_BLUE = "DBEAFE";
const LIGHT_GREEN = "DCFCE7";
const LIGHT_PURPLE = "F3E8FF";
const LIGHT_ORANGE = "FEF3C7";
const GRAY_BG = "F8FAFC";
const WHITE = "FFFFFF";
const DARK_TEXT = "1E293B";
const MED_TEXT = "475569";

const border = { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: NAVY, font: "Arial" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, color: TEAL, font: "Arial" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 24, color: DARK_TEXT, font: "Arial" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, size: 22, color: opts.color || DARK_TEXT, bold: opts.bold, font: "Arial" })]
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, size: 22, color: DARK_TEXT, font: "Arial" })]
  });
}

function spacer() {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [new TextRun("")] });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTable(headers, rows, colWidths, headerBg = NAVY) {
  const headerCells = headers.map((h, i) => new TableCell({
    borders,
    width: { size: colWidths[i], type: WidthType.DXA },
    shading: { fill: headerBg, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [
      new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: "Arial" })
    ]})]
  }));

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders,
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? WHITE : GRAY_BG, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [
        new TextRun({ text: String(cell), size: 20, color: DARK_TEXT, font: "Arial" })
      ]})]
    }))
  }));

  return new Table({
    width: { size: colWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows]
  });
}

// ─── COVER PAGE ───────────────────────────────────────────────────────────────
const coverPage = [
  new Paragraph({ spacing: { before: 2000, after: 400 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "NEXUS RCM", bold: true, size: 72, color: NAVY, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "INTELLIGENCE PLATFORM", bold: true, size: 56, color: TEAL, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 400, after: 200 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Product Scope Document", bold: true, size: 40, color: DARK_TEXT, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 800 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "v1.0", size: 40, color: MED_TEXT, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Prepared by: BA + PM Team", size: 24, color: MED_TEXT, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Date: March 2026", size: 24, color: MED_TEXT, font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Status: APPROVED", bold: true, size: 24, color: "16A34A", font: "Arial" })] }),
  new Paragraph({ spacing: { before: 0, after: 120 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Classification: CONFIDENTIAL", size: 22, color: "DC2626", font: "Arial" })] }),
  pageBreak()
];

// ─── TOC ──────────────────────────────────────────────────────────────────────
const tocSection = [
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak()
];

// ─── SECTION 1: EXECUTIVE SUMMARY ────────────────────────────────────────────
const section1 = [
  h1("1. Executive Summary"),
  para("Nexus RCM Intelligence Platform is a three-layer, AI-powered Revenue Cycle Management solution designed for enterprise health systems. The platform unifies prevention, analytics, and automation into a single cohesive operating environment — eliminating the fragmentation that causes revenue leakage in traditional RCM workflows."),
  spacer(),
  makeTable(
    ["Layer", "Name", "Goal", "Key Outcome"],
    [
      ["Layer 1", "PREVENTION", "Stop denials before submission", "Clean Claim Rate > 95%"],
      ["Layer 2", "ANALYTICS", "Identify root causes across all 7 RCM stages", "Denial Rate < 5%"],
      ["Layer 3", "AUTOMATION", "System works defects automatically", "Days in A/R < 35"]
    ],
    [1200, 1800, 3600, 2760]
  ),
  spacer(),
  para("The platform covers the full 7-stage RCM lifecycle: Charge Capture → Coded → Scrubbed → Submitted → Acknowledged → Adjusted → Posted → Reconciled."),
  pageBreak()
];

// ─── SECTION 2: THREE-LAYER ARCHITECTURE ─────────────────────────────────────
const section2 = [
  h1("2. Three-Layer Platform Architecture"),
  h2("2.1 Layer 1 — PREVENTION (Pre-Submission Intelligence)"),
  para("Goal: Every claim clean, complete, and payer-ready BEFORE it leaves the system.", { bold: true }),
  spacer(),
  bullet("Claim Readiness Score (CRS): Rules-based Sprint 1, ML-powered Sprint 5. Scores 0-100 across 6 checks"),
  bullet("Real-time Eligibility Verification (270/271 EDI) — triggered on patient save and claim open"),
  bullet("Prior Authorization validation with 7-day expiry alerts and payer-specific rule checks"),
  bullet("Coding accuracy pre-screen: flags unbundling, upcoding, missing modifiers, wrong POA"),
  bullet("COB Sequencing validation: primary/secondary/tertiary payer order verified before billing"),
  bullet("EVV pre-validation for home health: GPS + caregiver signature required before billing"),
  bullet("Documentation completeness checker: required docs per claim type (rule-based Sprint 3, NLP Sprint 6)"),
  bullet("Unified Claim Readiness Hub: all 6 checks in one dashboard per claim — single prevention nerve centre"),
  spacer(),
  makeTable(
    ["CRS Check", "Weight", "Sprint Available", "Failure Action"],
    [
      ["Eligibility Verified", "25 pts", "Sprint 1", "Block submission, trigger 270/271 re-ping"],
      ["Authorization Present", "25 pts", "Sprint 1", "Block submission, route to auth queue"],
      ["Coding Clean", "20 pts", "Sprint 1", "Block submission, flag to coder with fix instructions"],
      ["COB Sequencing Correct", "10 pts", "Sprint 2", "Block submission, open COB Manager"],
      ["Documentation Complete", "10 pts", "Sprint 3", "Warning, route to doc completion queue"],
      ["EVV Verified (Home Health)", "10 pts", "Sprint 2", "Block billing, route to EVV portal"]
    ],
    [2400, 1200, 2000, 3760]
  ),
  spacer(),
  h2("2.2 Layer 2 — ANALYTICS (Intelligence Engine)"),
  para("Goal: Root cause identification across all 7 RCM stages with all 4 AI analytics types on every page.", { bold: true }),
  spacer(),
  bullet("Descriptive Analytics: What happened — KPIs, trends, benchmarks, period comparisons"),
  bullet("Diagnostic Analytics: Why it happened — Root Cause Tree, contributing factors, pattern detection"),
  bullet("Predictive Analytics: What will happen — denial forecast, payment propensity, AR projection, risk scores"),
  bullet("Prescriptive Analytics: What to do — confidence-weighted recommendations, effort/impact scoring"),
  bullet("LIDA AI Chat: Natural language Q&A over live RCM data, inline visualizations, report generation + sharing"),
  bullet("MECE Framework: Mutually Exclusive Collectively Exhaustive analysis of denial and revenue gap data"),
  bullet("Interactive Root Cause Tree: 5 L1 categories, 14 L2 leaf nodes, prescriptive touchpoints, click-through to claims"),
  spacer(),
  h2("2.3 Layer 3 — AUTOMATION (Remediation Intelligence)"),
  para("Goal: System works defects automatically where permitted; human-in-loop at all regulated boundaries.", { bold: true }),
  spacer(),
  bullet("Auto-correct coding errors + queue corrected claim for resubmission"),
  bullet("Auto-route denied claims to correct specialist queue in under 30 seconds of denial receipt"),
  bullet("Auto-generate appeal letters: AI drafts full letter, human must Approve then Send (no auto-send)"),
  bullet("AI-prioritized work queues: composite score = confidence x financial impact x claim age"),
  bullet("Batch automation: select N claims, apply correction, queue all for human review, submit"),
  bullet("Live automation feed: real-time WebSocket stream of all system-executed actions"),
  bullet("Full audit trail: every automated action logged with timestamp, confidence score, user approval status"),
  spacer(),
  makeTable(
    ["Action", "Automated?", "Human Required?", "Compliance Reason"],
    [
      ["Code error correction", "Yes — AI corrects", "Review recommended", "Low risk — coding fix"],
      ["Denial auto-routing", "Yes — instant routing", "No", "Workflow only"],
      ["Appeal letter generation", "Yes — AI drafts", "Must approve + send", "False Claims Act"],
      ["Claim submission to payer", "No", "Always required", "FDA SaMD + HIPAA EDI"],
      ["Work queue prioritization", "Yes — AI ranks", "No", "Workflow only"],
      ["Batch coding corrections", "Yes — bulk apply", "Review + approve batch", "Audit requirement"]
    ],
    [2400, 1800, 2000, 3160]
  ),
  pageBreak()
];

// ─── SECTION 3: PAGE INVENTORY ────────────────────────────────────────────────
const section3 = [
  h1("3. Complete Page Inventory"),
  para("Total pages: 75+ routes across 11 modules. Only 2 net-new pages are being added — all other work is enhancement of the existing build.", { bold: true }),
  spacer(),
  h2("3.1 Status Key"),
  makeTable(
    ["Status", "Meaning"],
    [
      ["FULL", "Production-quality content, all 4 AI analytics types, fully interactive"],
      ["ENHANCE", "Structure exists, needs deeper functionality or AI integration"],
      ["UPGRADE", "Was a stub/placeholder — full implementation required"],
      ["NET NEW", "Brand new page not previously in codebase"],
      ["KEEP", "Fully functional as-is, no changes planned"],
      ["BACKLOG", "Out of scope for this program — future consideration"]
    ],
    [2000, 7360]
  ),
  spacer(),
  h2("3.2 Intelligence Hub"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Command Center", "/", "FULL — KEEP", "—"],
      ["Executive Dashboard", "/executive-dashboard", "FULL — KEEP", "—"],
      ["LIDA Chat", "/lida/chat", "FULL — KEEP", "—"],
      ["LIDA Dashboard", "/lida/dashboard", "FULL — KEEP", "—"],
      ["MECE Report Builder", "/lida/reports", "ENHANCE", "Sprint 6"],
      ["Revenue Forecast", "/reporting", "KEEP", "—"],
      ["Action Tracker", "/action-tracker", "ENHANCE", "Sprint 11"]
    ],
    [2400, 2800, 2000, 2160]
  ),
  spacer(),
  h2("3.3 Patient Access — Prevention Layer"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Patient Access Hub", "/insurance-verification/overview", "KEEP", "—"],
      ["Eligibility Verification", "/insurance-verification/eligibility", "ENHANCE — real-time 270/271", "Sprint 1"],
      ["Prior Authorization Manager", "/insurance-verification/auths", "ENHANCE — expiry alerts + payer rules", "Sprint 2"],
      ["Benefit Analytics", "/insurance-verification/benefits", "KEEP", "—"],
      ["Verification History", "/insurance-verification/history", "KEEP", "—"],
      ["Patient Accounts", "/patient-accounts", "KEEP", "—"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.4 Coding and Charge Capture"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["AI Coding Optimizer", "/ai-coding", "ENHANCE — pre-screen feeds CRS", "Sprint 2"],
      ["Coding Audit", "/ai-coding/audit", "KEEP", "—"],
      ["Compliance Monitor", "/ai-coding/compliance", "KEEP", "—"],
      ["Payer Rulebook", "/ai-coding/rulebook", "ENHANCE — rules feed CRS coding check", "Sprint 2"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.5 Claims Management"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Claims Overview", "/claims/overview", "ENHANCE — CRS badge per claim", "Sprint 1"],
      ["Work Queue", "/claims/work-queue", "ENHANCE — AI priority sort", "Sprint 8"],
      ["Pre-Batch Scrub Dashboard", "/claims/pre-batch-scrub/dashboard", "ENHANCE", "Sprint 3"],
      ["Validation Queue", "/claims/pre-batch-scrub/queue", "ENHANCE", "Sprint 3"],
      ["Auto-Fix Center", "/claims/pre-batch-scrub/auto-fix", "ENHANCE — top 25 error types", "Sprint 8"],
      ["Claim Validation Detail", "/claims/pre-batch-scrub/claim/:id", "KEEP", "—"],
      ["Rule Engine", "/claims/rules", "KEEP", "—"],
      ["Submission Tracking", "/claims/submission-tracking", "UPGRADE FROM STUB — live EDI 837", "Sprint 3"],
      ["Payer Acknowledgments", "/claims/acknowledgments", "UPGRADE FROM STUB — 277CA parsing", "Sprint 3"],
      ["Claims Analytics", "/claims-analytics", "KEEP — RootCauseTree embedded", "—"],
      ["Claim Readiness Hub", "/claims/readiness", "NET NEW", "Sprint 1"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.6 Payments and Posting"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Payment Dashboard", "/payments/dashboard", "FULL — KEEP", "—"],
      ["ERA/835 Processing", "/payments/era-processing", "KEEP", "—"],
      ["Payment Posting", "/payments/posting", "KEEP", "—"],
      ["Contract Manager", "/payments/contracts", "KEEP", "—"],
      ["Payer Performance", "/finance/payer-performance", "ENHANCE — contract variance", "Sprint 4"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.7 Denial Prevention"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Prevention Dashboard", "/denials/prevention-dashboard", "KEEP", "—"],
      ["Denial Management", "/denials", "FULL — KEEP", "—"],
      ["Denial Work Queue", "/denials/work-queue", "ENHANCE — AI priority + win probability", "Sprint 8"],
      ["High Risk Claims", "/denials/high-risk", "KEEP", "—"],
      ["AI Appeals Generator", "/denials/appeal", "ENHANCE — full human-in-loop build", "Sprint 9"],
      ["Denial Analytics", "/denials/analytics", "ENHANCE — MECE breakdown, win rates", "Sprint 4"],
      ["Payer Variance", "/denials/variance", "KEEP", "—"],
      ["Workflow Log", "/denials/workflow-log", "KEEP", "—"],
      ["Claim Denial Detail", "/denials/claim/:id", "KEEP", "—"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.8 Billing and Collections"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["A/R Aging Hub", "/collections", "FULL — KEEP", "—"],
      ["Collections Queue", "/collections/tasks", "ENHANCE — propensity AI sort", "Sprint 8"],
      ["Recovery Insights", "/collections/recovery-insights", "ENHANCE", "Sprint 11"],
      ["Performance Analytics", "/collections/performance", "KEEP", "—"],
      ["Payment Portal", "/collections/portal", "KEEP", "—"],
      ["Account Details", "/collections/account/:id", "KEEP", "—"],
      ["Alert Queue", "/collections/alerts", "ENHANCE", "Sprint 11"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.9 Reconciliation"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["Revenue Reconciliation", "/finance/reconciliation", "KEEP", "—"],
      ["Advanced Reconciliation", "/finance/reconciliation-advanced", "ENHANCE", "Sprint 7"],
      ["Bank Reconciliation", "/reconciliation/bank-view", "ENHANCE", "Sprint 7"],
      ["A/R Balance Recon", "/reconciliation/ar-balance", "UPGRADE FROM STUB", "Sprint 4"],
      ["Audit Log", "/finance/audit-log", "KEEP", "—"],
      ["Transaction Ledger", "/finance/reconciliation/transaction/:id", "ENHANCE", "Sprint 7"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.10 EVV Home Health"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["EVV Dashboard", "/evv/dashboard", "ENHANCE", "Sprint 7"],
      ["Visit Details", "/evv/visit-details", "KEEP", "—"],
      ["Fraud Detection", "/evv/fraud-detection", "FULL BUILD", "Sprint 7"],
      ["State Mandates", "/evv/mandates", "BUILD", "Sprint 7"],
      ["EVV Billing Bridge", "/evv/billing-bridge", "UPGRADE FROM STUB", "Sprint 7"],
      ["EVV Auto-Retry Manager", "/automation/evv-retry", "KEEP", "—"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.11 AI Engine"),
  makeTable(
    ["Page", "Route", "Status", "Sprint"],
    [
      ["AI Performance Engine", "/ai-engine/performance", "FULL — KEEP", "—"],
      ["MCP Agent Hub", "/developer/mcp-agents", "FULL BUILD", "Sprint 9"],
      ["AI Model Monitor", "/developer/ai-monitor", "FULL BUILD", "Sprint 6"],
      ["Drift Logs", "/developer/ai-monitor/drift-logs", "BUILD", "Sprint 6"],
      ["Model Registry", "/developer/ai-monitor/registry", "BUILD", "Sprint 6"],
      ["Feature Importance", "/developer/ai-monitor/feature-importance", "BUILD", "Sprint 6"],
      ["PSI Distribution", "/developer/ai-monitor/psi", "BUILD", "Sprint 6"]
    ],
    [2400, 2800, 2400, 1760]
  ),
  spacer(),
  h2("3.12 Settings and Administration"),
  makeTable(
    ["Page", "Route", "Status", "Notes"],
    [
      ["User Management", "/settings/users", "KEEP", "All roles"],
      ["AI Configuration", "/settings/ai-config", "BUILD — Sprint 11", "All roles"],
      ["Billing Rules", "/settings/billing-rules", "BUILD — Sprint 11", "Admin + Billing"],
      ["Admin Dashboard", "/admin/dashboard", "ENHANCE — Sprint 11", "System Admin"],
      ["Integration Hub", "/admin/integrations", "BUILD — Sprint 10", "System Admin"],
      ["ETL Designer", "/admin/etl-designer", "BUILD — Sprint 10", "DATA ADMIN ONLY"],
      ["API Manager", "/admin/api-manager", "BUILD — Sprint 10", "System Admin"],
      ["Scheduler", "/admin/scheduler", "BUILD — Sprint 10", "System Admin"]
    ],
    [2400, 2800, 2000, 2160]
  ),
  spacer(),
  h2("3.13 Summary: Net-New vs Reused"),
  makeTable(
    ["Category", "Count", "Action"],
    [
      ["FULL — Keep as-is", "7 pages", "No work needed"],
      ["KEEP — Functional as-is", "30+ pages", "No work needed"],
      ["ENHANCE — Deepen functionality", "20+ pages", "Sprint-by-sprint enhancement"],
      ["UPGRADE FROM STUB — Full build", "5 pages", "Prioritised in Sprints 3-7"],
      ["FULL BUILD — New from scratch", "8 pages", "AI Engine + EVV Sprints 6-9"],
      ["NET NEW — Brand new pages", "2 pages", "Claim Readiness Hub + COB Manager UI"],
      ["BACKLOG — Out of scope", "2 items", "Patient Statements, LIDA Tier 3 Clinical"]
    ],
    [3000, 2000, 4360]
  ),
  pageBreak()
];

// ─── SECTION 4: WHAT'S REUSED ─────────────────────────────────────────────────
const section4 = [
  h1("4. Reused From Previous Build — Do Not Rebuild"),
  h2("4.1 Shared UI Components"),
  para("All components located in /frontend/src/components/ui/"),
  spacer(),
  makeTable(
    ["Component", "File", "What It Does"],
    [
      ["AIInsightCard", "AIInsightCard.jsx", "Confidence bar, impact badge, AI category label (Descriptive/Diagnostic/Predictive/Prescriptive), optional action button"],
      ["ConfidenceBar", "ConfidenceBar.jsx", "Color-coded progress bar: emerald >80%, amber 60-80%, red <60%. Tooltip with contributing factors"],
      ["FilterChip + FilterChipGroup", "FilterChip.jsx", "Removable filter tags in 5 color variants, Clear all link, flex-wrap row layout"],
      ["DateRangePicker", "DateRangePicker.jsx", "10 presets (Today, L7, L30, L90, MTD, QTD, YTD + custom). Click-outside close, align prop"],
      ["PrescriptiveAction", "PrescriptiveAction.jsx", "Purple AI-branded card, priority dots, effort badges, ROI values, View all N toggle"],
      ["RootCauseTree", "RootCauseTree.jsx", "Interactive tree: 5 L1 nodes, 14 L2 nodes, prescriptive touchpoints, navigate to claims, compact mode"]
    ],
    [1800, 2200, 5360]
  ),
  spacer(),
  h2("4.2 Theme System"),
  bullet("Dark/Light mode via ThemeContext — darkMode: class on html element"),
  bullet("CSS custom properties: text-th-heading, text-th-secondary, bg-th-surface-raised, border-th-border"),
  bullet("All 75+ pages respect theme toggle — no page rebuilds needed for theming"),
  spacer(),
  h2("4.3 Design System Tokens"),
  makeTable(
    ["Token", "Usage"],
    [
      ["border-l-[3px] + color", "Color-coded KPI card left accent — all metric tiles"],
      ["hover:-translate-y-0.5 hover:shadow-lg", "Card hover lift effect — all interactive tiles"],
      ["transition-all duration-200", "Animation transition — all hover interactions"],
      ["tabular-nums", "All numeric and financial values for alignment"],
      ["material-symbols-outlined", "Icon library — used throughout all 75+ pages"],
      ["Inline SVG charts", "All charts — no external chart library dependency"]
    ],
    [3200, 6160]
  ),
  spacer(),
  h2("4.4 Tech Stack (Locked)"),
  makeTable(
    ["Layer", "Technology", "Version"],
    [
      ["Frontend Framework", "React", "18.2.0"],
      ["Build Tool", "Vite", "5.1.5"],
      ["CSS Framework", "Tailwind CSS", "3.4.1"],
      ["Routing", "React Router DOM", "6.22.3"],
      ["Backend API", "FastAPI (Python)", "Latest"],
      ["Database", "PostgreSQL", "Latest"],
      ["Real-time", "WebSocket", "Native browser"],
      ["Charts", "Pure inline SVG", "No library — custom built"]
    ],
    [2400, 4000, 2960]
  ),
  pageBreak()
];

// ─── SECTION 5: OUT OF SCOPE ──────────────────────────────────────────────────
const section5 = [
  h1("5. Out of Scope — ARB Decisions"),
  para("The Architecture Review Board (ARB) reviewed the full platform scope in February 2026. The following features were removed, deferred, or permanently restricted:"),
  spacer(),
  makeTable(
    ["#", "Feature", "Original Ask", "ARB Decision", "Reason", "Status"],
    [
      ["1", "ML-powered CRS Sprint 1", "AI/ML model scoring every claim from day one", "Rules-based Sprint 1, ML model Sprint 5", "No training data available at Sprint 1", "DEFERRED"],
      ["2", "NLP Doc Compliance Sprint 1-4", "AI reads clinical notes for doc gaps", "Rule-based checklist Sprint 1-5, NLP Sprint 6", "No PHI pipeline approved yet", "DEFERRED"],
      ["3", "LIDA Tier 3 Clinical Chat", "Full natural language Q&A over patient PHI", "Aggregate data only — Tier 1 and 2", "HIPAA BAA + on-premises inference required", "DEFERRED Sprint 10+"],
      ["4", "AI Autonomous Claim Submission", "System submits claims to payer without human", "Human approval required — always", "FDA Software as Medical Device risk", "REMOVED — pending regulatory"],
      ["5", "Auto-Send Appeal Letters", "System sends finalized appeal letters", "AI drafts only — human must review and send", "False Claims Act liability", "PERMANENTLY RESTRICTED"],
      ["6", "Rules Auto-Submit Tier 2", "Rules-based auto-submit Sprint 11", "Conditional on regulatory assessment completing", "Regulatory timeline uncertain", "NOT CONFIRMED"],
      ["7", "COB UI Sprint 1", "Full COB sequencing visual builder in Sprint 1", "Backend service Sprint 1, UI Sprint 2", "Backend complexity requires service-first approach", "DEFERRED one sprint"],
      ["8", "Patient Statements Page", "Full statement generation and delivery management", "Moved to product backlog", "Client low priority for this program", "BACKLOG"]
    ],
    [400, 1800, 2000, 2000, 1800, 1360]
  ),
  pageBreak()
];

// ─── SECTION 6: FUNCTIONAL REQUIREMENTS ─────────────────────────────────────
const section6 = [
  h1("6. Functional Requirements"),
  h2("6.1 Prevention Layer (FR-P)"),
  makeTable(
    ["ID", "Requirement", "Priority"],
    [
      ["FR-P01", "Every claim must display a Claim Readiness Score (0-100) before it can be submitted", "P1 — Must Have"],
      ["FR-P02", "CRS checks 6 factors: Eligibility 25pts, Authorization 25pts, Coding 20pts, COB 10pts, Documentation 10pts, EVV 10pts", "P1 — Must Have"],
      ["FR-P03", "Failed CRS checks must block submission and surface specific, actionable fix instructions per failure reason", "P1 — Must Have"],
      ["FR-P04", "Real-time 270/271 eligibility ping must trigger on patient account creation and when a claim is opened", "P1 — Must Have"],
      ["FR-P05", "Coding Optimizer must flag unbundling, upcoding, missing modifiers, and wrong POA indicators before scrub", "P1 — Must Have"],
      ["FR-P06", "Pre-batch scrub engine must catch all EDI-level errors before 837 file generation", "P1 — Must Have"],
      ["FR-P07", "Claim Readiness Hub must display all claims with CRS below 80 that require attention in one unified view", "P1 — Must Have"]
    ],
    [1000, 6560, 1800]
  ),
  spacer(),
  h2("6.2 Analytics Layer (FR-A)"),
  makeTable(
    ["ID", "Requirement", "Priority"],
    [
      ["FR-A01", "Root Cause Tree must cover minimum 5 L1 denial categories with at least 2 L2 sub-nodes per category", "P1 — Must Have"],
      ["FR-A02", "Every AI insight on every page must be labelled with exactly one type: Descriptive, Diagnostic, Predictive, or Prescriptive", "P1 — Must Have"],
      ["FR-A03", "LIDA Chat must answer natural language questions over live RCM data with response time under 3 seconds", "P1 — Must Have"],
      ["FR-A04", "LIDA must generate exportable PDF and CSV reports and allow sharing via link with other platform users", "P1 — Must Have"],
      ["FR-A05", "MECE Report Builder must produce mutually exclusive, collectively exhaustive analysis of denial and revenue gap data", "P1 — Must Have"],
      ["FR-A06", "Revenue Forecast must cover a 90-day and 12-month forward view with payer-level and service-line breakdown", "P2 — Should Have"],
      ["FR-A07", "All dashboard KPIs must support DateRangePicker with presets: Today, L7, L30, L90, MTD, QTD, YTD, Custom", "P1 — Must Have"]
    ],
    [1000, 6560, 1800]
  ),
  spacer(),
  h2("6.3 Automation Layer (FR-AU)"),
  makeTable(
    ["ID", "Requirement", "Priority"],
    [
      ["FR-AU01", "System must auto-correct identified coding errors with ML suggestion and confidence score displayed to user", "P1 — Must Have"],
      ["FR-AU02", "System must auto-route denied claims to the correct specialist queue within 30 seconds of denial receipt", "P1 — Must Have"],
      ["FR-AU03", "AI must generate a complete appeal letter draft; human must click Approve then Send — no automated sending permitted", "P1 — Must Have"],
      ["FR-AU04", "Work queues must be sorted by composite AI score: AI confidence x financial impact x claim age", "P1 — Must Have"],
      ["FR-AU05", "Batch actions must allow selecting N claims, applying correction, and queuing all for human review before submission", "P2 — Should Have"],
      ["FR-AU06", "Live automation feed must display system-executed actions in real time via WebSocket on the AI Performance Engine page", "P2 — Should Have"],
      ["FR-AU07", "Every automated action must be logged with timestamp, AI confidence score, financial impact, and approving user identity", "P1 — Must Have"]
    ],
    [1000, 6560, 1800]
  ),
  pageBreak()
];

// ─── SECTION 7: NON-FUNCTIONAL REQUIREMENTS ──────────────────────────────────
const section7 = [
  h1("7. Non-Functional Requirements"),
  makeTable(
    ["Category", "Requirement", "Target"],
    [
      ["Performance", "Dashboard initial page load", "Under 2 seconds"],
      ["Performance", "LIDA query response time", "Under 3 seconds"],
      ["Performance", "All API endpoints p95 response", "Under 500ms at 100 concurrent users"],
      ["Performance", "Bundle size (gzipped)", "Under 500KB initial chunk"],
      ["Security", "Authentication and authorisation", "RBAC enforced — 7 roles, middleware on every route"],
      ["Security", "ETL Designer and Admin pages", "Data Admin role only — no exceptions"],
      ["Security", "Audit trail", "100% of user actions and AI automated actions logged"],
      ["Accessibility", "ARIA compliance", "All interactive elements have correct ARIA roles and labels"],
      ["Accessibility", "Keyboard navigation", "Full tab order coverage on all 75+ pages"],
      ["Accessibility", "Colour contrast", "WCAG AA minimum across dark and light themes"],
      ["Responsive", "Desktop minimum supported width", "1280px"],
      ["Responsive", "Tablet breakpoint", "768px — all core workflows functional"],
      ["Theme", "Dark mode coverage", "All 75+ pages render correctly in dark mode"],
      ["Theme", "Light mode coverage", "All 75+ pages render correctly in light mode"],
      ["Data", "Financial value display", "All monetary values use tabular-nums and currency format"],
      ["Compliance", "PHI handling", "No PHI in LIDA Tier 1-2 — aggregate data only until Sprint 10+"],
      ["Compliance", "Automated action boundary", "No autonomous submission to payer — human approval always required"]
    ],
    [2000, 4000, 3360]
  ),
  pageBreak()
];

// ─── SECTION 8: USER ROLES ────────────────────────────────────────────────────
const section8 = [
  h1("8. User Roles and Access Control"),
  para("7 RBAC roles are defined. ETL Designer and sensitive admin pages are gated to Data Admin and System Admin only — this is enforced at the API middleware level, not just frontend routing."),
  spacer(),
  makeTable(
    ["Role", "Key Pages Accessible", "Key Pages Restricted"],
    [
      ["Executive", "Command Center, Executive Dashboard, AI Engine, Reports, Revenue Forecast, LIDA Chat", "ETL Designer, API Manager, Billing Rules"],
      ["Revenue Analyst", "All analytics pages, LIDA Chat, MECE Builder, AI Engine, Reports", "ETL Designer, Admin Dashboard, User Management"],
      ["Billing Specialist", "Claims (all), Denials (all), Collections (all), Payments (all)", "AI Engine internals, ETL Designer, Coding pages"],
      ["Coder", "AI Coding Optimizer, Coding Audit, Compliance, Payer Rulebook, Claims Work Queue", "Collections, Reconciliation, Admin, ETL"],
      ["Patient Access", "Patient Access Hub, Eligibility, Prior Auth, Benefit Analytics, Verification History", "All billing, coding, collections, admin pages"],
      ["Data Admin", "ETL Designer, API Manager, Integration Hub, Scheduler, Data Schema Explorer", "Clinical pages, patient-identifiable data, financial posting"],
      ["System Admin", "All pages including admin, settings, ETL, integrations", "None — full platform access"]
    ],
    [1800, 3600, 3960]
  ),
  pageBreak()
];

// ─── SECTION 9: INTEGRATIONS ──────────────────────────────────────────────────
const section9 = [
  h1("9. Integration Touchpoints"),
  makeTable(
    ["System", "Integration Type", "Delivery Sprint", "Priority"],
    [
      ["Epic / Cerner / Athena EHR", "HL7 FHIR R4 + Direct DB", "Sprint 10", "P1"],
      ["Availity Clearinghouse", "EDI 837P/I, 835, 277CA, 999 Functional Ack", "Sprint 10", "P1"],
      ["Change Healthcare Clearinghouse", "EDI 837, 835 ERA processing", "Sprint 10", "P1"],
      ["CMS / Medicare", "REST API + EDI batch", "Sprint 10", "P1"],
      ["Aetna / BCBS / Cigna / UHC Payer APIs", "Payer REST APIs — auth, eligibility, claim status", "Sprint 10", "P1"],
      ["Banking / Lockbox", "ERA 835 + ACH remittance", "Sprint 10", "P2"],
      ["State EVV Aggregators", "State-specific EVV APIs (varies by state)", "Sprint 7", "P2"],
      ["Document Management (S3 / DMS)", "REST API + S3 SDK — clinical docs, attachments", "Sprint 3", "P2"]
    ],
    [2600, 3000, 1800, 1960]
  ),
  pageBreak()
];

// ─── SECTION 10: SUCCESS METRICS ──────────────────────────────────────────────
const section10 = [
  h1("10. Success Metrics and KPIs"),
  para("All KPIs are measured against the baseline captured at program kickoff. Targets represent the production-ready state at Sprint 13 go-live."),
  spacer(),
  makeTable(
    ["KPI", "Baseline", "Target", "Measurement Method"],
    [
      ["Clean Claim Rate", "78%", "Above 95%", "Claims passing CRS at first attempt"],
      ["First-Pass Resolution Rate", "71%", "Above 92%", "Claims paid without resubmission"],
      ["Denial Rate", "12%", "Below 5%", "Denied claims / total submitted"],
      ["Days in A/R", "52 days", "Below 35 days", "Average AR aging across all payers"],
      ["Appeal Win Rate", "44%", "Above 72%", "Appeals won / total appeals filed"],
      ["Coding Accuracy (AI-assisted)", "81%", "Above 97%", "Clean code rate from AI Coding Optimizer"],
      ["CRS Gate Threshold", "N/A", "Minimum 80 / 100", "Hard gate enforced in submission workflow"],
      ["LIDA Query Response Time", "N/A", "Under 3 seconds", "P95 response time measured in production"],
      ["Automation Coverage", "0%", "Above 60% of denials auto-routed", "Denied claims auto-routed / total denied"],
      ["False Positive CRS Blocks", "N/A", "Below 3%", "Valid claims incorrectly blocked by CRS"]
    ],
    [2800, 1600, 2000, 2960]
  ),
  pageBreak()
];

// ─── SECTION 11: REVISION HISTORY ────────────────────────────────────────────
const section11 = [
  h1("11. Document Revision History"),
  makeTable(
    ["Version", "Date", "Author", "Changes"],
    [
      ["v0.1", "January 2026", "BA Team", "Initial draft — 3-layer architecture defined, page inventory first pass"],
      ["v0.2", "February 2026", "PM + Chief Architect", "ARB review complete — scope restrictions added, deferred items documented"],
      ["v0.9", "March 2026", "PM + BA Team", "Post-demo client feedback incorporated — LIDA confirmed core, ETL role-gated, net-new pages finalised at 2"],
      ["v1.0", "March 2026", "BA + PM Team", "Final approved version — sprint plan aligned, ARB decisions locked"]
    ],
    [1000, 1600, 2400, 4360]
  )
];

// ─── BUILD DOCUMENT ───────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{
        level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
      }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: NAVY, font: "Arial" },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: TEAL, font: "Arial" },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: DARK_TEXT, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 15840, height: 12240 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY } },
        children: [
          new TextRun({ text: "NEXUS RCM INTELLIGENCE PLATFORM  |  Scope Document v1.0  |  CONFIDENTIAL", size: 18, color: MED_TEXT, font: "Arial" })
        ]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" } },
        children: [
          new TextRun({ text: "Nexus RCM Intelligence Platform  |  BA + PM Team  |  March 2026  |  Page ", size: 18, color: MED_TEXT, font: "Arial" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: MED_TEXT, font: "Arial" }),
          new TextRun({ text: " of ", size: 18, color: MED_TEXT, font: "Arial" }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: MED_TEXT, font: "Arial" })
        ]
      })] })
    },
    children: [
      ...coverPage,
      ...tocSection,
      ...section1,
      ...section2,
      ...section3,
      ...section4,
      ...section5,
      ...section6,
      ...section7,
      ...section8,
      ...section9,
      ...section10,
      ...section11
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/Users/prabakarannagarajan/RCM Pulse/planning/RCM_Nexus_Scope_Document.docx", buffer);
  console.log("SUCCESS: Written to /Users/prabakarannagarajan/RCM Pulse/planning/RCM_Nexus_Scope_Document.docx");
});
