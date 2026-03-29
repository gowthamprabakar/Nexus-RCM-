const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TableOfContents
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  coverBg:     '1A2B4A',   // dark navy
  coverText:   'FFFFFF',
  layer1:      '1B6B35',   // green  – Prevention
  layer1Bg:    'E8F5E1',
  layer2:      '1565C0',   // blue   – Analytics
  layer2Bg:    'E3EFFE',
  layer3:      '6A1B9A',   // purple – Automation
  layer3Bg:    'F3E5F5',
  hardening:   '546E7A',   // grey   – Hardening / Launch
  hardeningBg: 'ECEFF1',
  tableHdr:    '2E4057',
  tableHdrTxt: 'FFFFFF',
  tableAlt:    'F5F7FA',
  border:      'CCCCCC',
  black:       '000000',
  white:       'FFFFFF',
  muted:       '5A6A7E',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const border = (color = COLORS.border) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const allBorders = (color) => ({ top: border(color), bottom: border(color), left: border(color), right: border(color) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function para(children, opts = {}) {
  return new Paragraph({ children, ...opts });
}
function run(text, opts = {}) {
  return new TextRun({ text, font: 'Arial', ...opts });
}
function boldRun(text, opts = {}) {
  return run(text, { bold: true, ...opts });
}

// Checkbox bullet item
function checkItem(text) {
  return new Paragraph({
    numbering: { reference: 'checks', level: 0 },
    children: [run(text, { size: 20 })],
    spacing: { before: 40, after: 40 },
  });
}

// Sprint header paragraph with colored background via shading on a full-width table cell
function sprintHeaderPara(label, weekRange, color, bgColor) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders(),
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label, bold: true, size: 28, color, font: 'Arial' }),
                  new TextRun({ text: '     ', font: 'Arial', size: 28 }),
                  new TextRun({ text: weekRange, size: 22, color: COLORS.muted, font: 'Arial' }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function metaRow(label, value) {
  return new Paragraph({
    children: [
      boldRun(label + ': ', { size: 20 }),
      run(value, { size: 20 }),
    ],
    spacing: { before: 60, after: 60 },
  });
}

function sectionLabel(text) {
  return new Paragraph({
    children: [boldRun(text, { size: 20, color: COLORS.muted })],
    spacing: { before: 120, after: 60 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: 'Arial', color: COLORS.coverBg })],
    spacing: { before: 320, after: 120 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: 'Arial' })],
    spacing: { before: 200, after: 80 },
  });
}

// ── Table builder ──────────────────────────────────────────────────────────
function buildTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const hdrRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: allBorders(COLORS.tableHdr),
        shading: { fill: COLORS.tableHdr, type: ShadingType.CLEAR },
        width: { size: colWidths[i], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, color: COLORS.tableHdrTxt, font: 'Arial', size: 18 })],
          alignment: AlignmentType.CENTER,
        })],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          borders: allBorders(COLORS.border),
          shading: { fill: ri % 2 === 0 ? COLORS.white : COLORS.tableAlt, type: ShadingType.CLEAR },
          width: { size: colWidths[ci], type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({
            children: [new TextRun({ text: cell, font: 'Arial', size: 18 })],
          })],
        })
      ),
    })
  );

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [hdrRow, ...dataRows],
  });
}

// ── Sprint section builder ─────────────────────────────────────────────────
function sprintSection(num, title, weekRange, goal, team, deliverables, exitCriteria, color, bgColor) {
  const items = [
    new Paragraph({ children: [new PageBreak()] }),
    sprintHeaderPara(`SPRINT ${num} — ${title}`, weekRange, color, bgColor),
    new Paragraph({ children: [], spacing: { before: 60, after: 0 } }),
    metaRow('Goal', goal),
    metaRow('Team', team),
    sectionLabel('Deliverables'),
    ...deliverables.map(d => checkItem(d)),
    sectionLabel('Exit Criteria'),
    new Paragraph({
      children: [run(exitCriteria, { size: 20 })],
      spacing: { before: 40, after: 120 },
    }),
  ];
  return items;
}

// ── Main document build ────────────────────────────────────────────────────
const G = COLORS;

// --- SPRINT DATA ---
const sprints = [
  {
    num: '0', title: 'Foundation & Data Infrastructure', weeks: 'Weeks 1–2',
    color: G.hardening, bg: G.hardeningBg,
    goal: 'Establish data contracts, backend APIs, design tokens finalization, ETL skeleton',
    team: 'Architect + Backend + Data + UI/UX',
    deliverables: [
      'Data schema finalized for all 7 RCM stages (Charge → Reconciled)',
      'API contract document published (REST + WebSocket endpoints)',
      'ETL skeleton: EHR connector (Epic/Cerner mock), Clearinghouse connector (Availity mock)',
      'RBAC roles defined and middleware scaffolded (Executive, Analyst, Billing, Coder, Patient Access, Data Admin, System Admin)',
      'Design tokens locked: spacing, color palette, typography for dark + light',
      'Dev environment setup: Docker Compose, Vite dev server, FastAPI backend, mock data layer',
      'CI/CD pipeline: GitHub Actions → build → lint → test → deploy preview',
      'Planning folder and architecture decision records (ADRs) committed to repo',
    ],
    exit: 'All devs can run app locally, API mocks respond, RBAC enforced on test routes',
  },
  {
    num: '1', title: 'Prevention Layer: Claim Readiness Core', weeks: 'Weeks 3–4',
    color: G.layer1, bg: G.layer1Bg,
    goal: 'Build the Claim Readiness Score (CRS) engine and unified Claim Readiness Hub',
    team: 'Backend + Frontend + QA',
    deliverables: [
      'CRS algorithm v1 (rules-based): 6 checks → weighted score 0–100',
      '  · Eligibility verified (weight: 25)',
      '  · Authorization present (weight: 25)',
      '  · Coding clean (weight: 20)',
      '  · COB sequencing correct (weight: 10)',
      '  · Documentation complete (weight: 10)',
      '  · EVV verified if home health (weight: 10)',
      'NEW PAGE: Claim Readiness Hub (/claims/readiness) — shows all claims with CRS, pending checks, fix actions',
      'CRS badge injected into: Claims Overview, Work Queue, Validation Queue (reusing existing pages)',
      'Claims blocked from submission if CRS < 80 (hard gate)',
      'Fix instructions surfaced inline per failed check',
      'Real-time 270/271 eligibility ping on patient save (enhance existing InsuranceVerification page)',
      'Unit tests for CRS engine (>90% coverage)',
    ],
    exit: 'CRS displays on all claim cards, sub-80 claims blocked, fix instructions shown',
  },
  {
    num: '2', title: 'Prevention Layer: Auth, Coding & COB Pre-Checks', weeks: 'Weeks 5–6',
    color: G.layer1, bg: G.layer1Bg,
    goal: 'Deepen prevention checks — Authorization pre-validation, Coding pre-screen, COB sequencing',
    team: 'Backend + ML (rules) + Frontend',
    deliverables: [
      'Prior Auth pre-check: validates auth number against payer rules before claim submission (enhance PriorAuthManager page)',
      'Auth expiry alerts: 7-day warning before auth expires on active claims',
      'Coding pre-screen: flags top 20 denial-causing codes (unbundling, missing modifier, wrong POA) — enhance CodingOptimizer',
      'COB Manager NEW PAGE (/automation/cob-manager): UI for COB sequencing — primary/secondary/tertiary payer order validation',
      'Payer Rulebook enhancement: load payer-specific billing rules that feed into CRS coding check',
      'Pre-Batch Scrub Auto-Fix enhancements: auto-correct simple coding issues (wrong DX order, missing modifier)',
      'EVV pre-validation: visit must have GPS + caregiver signature before billing — enhance EVVDashboard',
      'Integration tests: end-to-end claim → CRS check → block/pass',
    ],
    exit: 'Auth, Coding, COB checks integrated into CRS score; Auto-Fix handles top 5 error types',
  },
  {
    num: '3', title: 'Prevention Layer: Documentation & Submission Hardening', weeks: 'Weeks 7–8',
    color: G.layer1, bg: G.layer1Bg,
    goal: 'Documentation completeness checker, submission tracking, acknowledgment handling',
    team: 'Backend + Frontend + NLP (checklist phase)',
    deliverables: [
      'Documentation checklist: required docs per claim type (surgical auth, home health plan of care, DME scripts) — rule-based checklist',
      'Missing doc alerts injected into Claim Readiness Hub and Work Queue',
      'Submission Tracking UPGRADE from stub: live EDI 837 batch status, clearinghouse tracking, 277CA acknowledgment display',
      'Payer Acknowledgments UPGRADE from stub: acceptance/rejection parsing, auto-route rejections to fix queue',
      'EDI 999 functional acknowledgment parser',
      'Submission audit trail: timestamp, batch ID, clearinghouse response, claim status',
      'Claim Readiness Hub v2: full 6-check dashboard with trend over time',
    ],
    exit: 'Submission tracking live, acknowledgments parsed and routed, doc checklist in CRS',
  },
  {
    num: '4', title: 'Analytics Layer: Core Intelligence Upgrade', weeks: 'Weeks 9–10',
    color: G.layer2, bg: G.layer2Bg,
    goal: 'Strengthen analytics intelligence across all 7 RCM stages, upgrade Command Center + Executive Dashboard',
    team: 'Frontend + Data + ML',
    deliverables: [
      'Command Center enhancement: 7-stage RCM pipeline visualization with live stage-by-stage metrics',
      'Executive Dashboard: MECE-structured KPI panels (Descriptive/Diagnostic/Predictive/Prescriptive badges on every insight)',
      'All 75+ existing pages: verify DateRangePicker + FilterChipGroup functional on every analytics page',
      'RootCauseTree: add 2 more L1 nodes (Timely Filing detail sub-tree, COB Errors sub-tree)',
      'Denial Analytics enhancement: payer × denial code matrix, appeal win probability by denial reason',
      'Payer Performance enhancement: contract variance analysis, expected vs actual payment waterfall chart',
      'Collections Hub enhancement: propensity-to-pay score per account, recovery probability by aging bucket',
      'A/R Balance Recon UPGRADE from stub: AR balance tracking across full payment lifecycle',
    ],
    exit: 'All major analytics pages show all 4 AI insight types; RootCauseTree has 7 L1 nodes',
  },
  {
    num: '5', title: 'Analytics Layer: Predictive Models + LIDA Enhancement', weeks: 'Weeks 11–12',
    color: G.layer2, bg: G.layer2Bg,
    goal: 'ML-powered CRS v2, predictive revenue forecasting, denial prediction, LIDA deep Q&A',
    team: 'ML + Backend + Frontend',
    deliverables: [
      'CRS v2: ML model trained on historical claim + denial data — replaces rules-based heuristic',
      'Denial Prediction Model: claim-level probability of denial (0–100%) before submission',
      'Revenue Forecast enhancement: 90-day + 12-month forecast by payer, service line, provider',
      'Payment Propensity Model: probability patient pays within 30/60/90 days',
      'LIDA Chat v2 enhancement: expanded query understanding (denial patterns, AR aging, payer trends)',
      'LIDA Chat v2: inline data viz in chat (bar charts, trend lines per answer)',
      'LIDA Chat v2: follow-up question chaining + citation with source data',
      'LIDA report export: PDF + CSV export of generated insights',
      'LIDA report sharing: share generated report link with other platform users',
      'Model accuracy display in AI Performance Engine',
    ],
    exit: 'ML CRS live, denial prediction on work queue, LIDA answers 20+ query types with inline charts',
  },
  {
    num: '6', title: 'Analytics Layer: MECE Framework + NLP Documentation', weeks: 'Weeks 13–14',
    color: G.layer2, bg: G.layer2Bg,
    goal: 'MECE Analysis framework complete, NLP documentation compliance, AI Performance Engine full build',
    team: 'ML + NLP + Frontend',
    deliverables: [
      'MECE Report Builder (/lida/reports) — Framework: defines mutually exclusive denial categories + collectively exhaustive coverage check',
      'MECE Report Builder — Auto-generates MECE report from current denial + AR data',
      'MECE Report Builder — Export as PDF or share via link',
      'NLP Documentation Compliance v1: reads clinical note fields, detects missing medical necessity language',
      'AI Performance Engine enhancements: full model performance dashboard, ROI by model, drift monitoring',
      'AI Model Monitor pages: Drift Logs, Model Registry, Feature Importance, PSI Distribution — all fully functional',
      'Prescriptive Action quality upgrade: confidence scores, effort estimates, ROI projections on every recommended action',
      'AI Insight cards: all pages — verify all 4 analytics types represented (no page has 0 AI insights)',
    ],
    exit: 'MECE report builder functional, NLP doc check in CRS, AI Performance Engine complete',
  },
  {
    num: '7', title: 'Analytics Layer: EVV + Reconciliation Intelligence', weeks: 'Weeks 15–16',
    color: G.layer2, bg: G.layer2Bg,
    goal: 'Complete EVV module intelligence, Reconciliation analytics, Fraud detection',
    team: 'Backend + Frontend + ML',
    deliverables: [
      'EVV Fraud Detection full build: GPS anomaly detection, time-band violations, caregiver pattern analysis',
      'EVV State Mandates: state-specific EVV compliance rules and compliance score per state',
      'EVV Billing Bridge UPGRADE from stub: verified visit → claim generation pipeline',
      'Revenue Reconciliation enhancement: GL reconciliation, revenue recognition rules, variance alerting',
      'Advanced Reconciliation: multi-payer ERA matching, unapplied cash identification, write-off analysis',
      'Bank Reconciliation enhancement: lockbox matching, remittance aggregation',
      'Transaction Ledger detail page: full audit trail per financial transaction',
      'Collections Timeline page: full recovery timeline per account with predicted resolution date',
    ],
    exit: 'EVV module production-ready, reconciliation pages fully functional',
  },
  {
    num: '8', title: 'Automation Layer: Auto-Routing & Work Queue Intelligence', weeks: 'Weeks 17–18',
    color: G.layer3, bg: G.layer3Bg,
    goal: 'Build the automation engine — auto-route denied claims, intelligent work queue prioritization',
    team: 'Backend + ML + Frontend',
    deliverables: [
      'Denial auto-routing engine: denied claim → classify reason → route to correct specialist queue automatically',
      'Work Queue AI prioritization: sort by (AI confidence × financial impact × age) scoring',
      'Batch Actions enhancement (/claims/batch): select N claims → apply correction → batch submit for review',
      'Mass Scrub enhancement (/claims/mass-scrub): bulk coding correction with ML suggestions',
      'Auto-Fix Center v2: expanded auto-fix rules (top 25 error types auto-correctable)',
      'Collections Queue AI enhancement: auto-prioritize by propensity score × balance amount',
      'Denial Work Queue AI: appeal win probability per claim, auto-suggest appeal template',
      'Automation audit log: every auto-action logged with timestamp, AI confidence, financial impact',
    ],
    exit: 'Denied claims auto-routed in < 30 seconds, work queues sorted by AI score',
  },
  {
    num: '9', title: 'Automation Layer: Appeal Automation + Human-in-Loop', weeks: 'Weeks 19–20',
    color: G.layer3, bg: G.layer3Bg,
    goal: 'AI Appeals Generator production-ready, human-in-loop workflows, batch appeal processing',
    team: 'NLP + Backend + Frontend',
    deliverables: [
      'AI Appeals Generator (/denials/appeal) — Auto-generates appeal letter from denial reason + clinical data',
      'AI Appeals Generator — Fills CARC/RARC code context automatically',
      'AI Appeals Generator — Medical necessity language from NLP doc compliance',
      'AI Appeals Generator — Human review panel: diff view showing AI changes',
      'AI Appeals Generator — Human must click Approve → Send (no auto-send — compliance boundary)',
      'AI Appeals Generator — Win probability confidence bar per appeal',
      'Batch appeal: generate appeals for N similar denials simultaneously',
      'Appeal tracking: status (draft/submitted/won/lost) + response time by payer',
      'Appeal win rate analytics integrated into Denial Analytics page',
      'Patient Statements page build: statement generation, delivery tracking, payment plan management',
      'MCP Agent Hub (/developer/mcp-agents) full build: agent registry, agent status, agent task log',
    ],
    exit: 'AI appeal generated in < 10 seconds, human approval required before send, batch appeal for 50+ claims',
  },
  {
    num: '10', title: 'Automation Layer: ETL & Integration Hub', weeks: 'Weeks 21–22',
    color: G.layer3, bg: G.layer3Bg,
    goal: 'ETL Designer production-ready (Data Admin only), Integration Hub, API Manager, live data feeds',
    team: 'Backend + Data + DevOps',
    deliverables: [
      'ETL Designer (/admin/etl-designer): full UI for Data Admin role only — EHR connector (Epic/Cerner/Athena) configuration',
      'ETL Designer — Clearinghouse connector (Availity/Change Healthcare) setup',
      'ETL Designer — Payer API connector (CMS/Aetna/BCBS/Cigna/UHC)',
      'ETL Designer — Transformation rules builder',
      'ETL Designer — Pipeline schedule management',
      'ETL Designer — Pipeline health monitoring with error alerting',
      'Integration Hub (/admin/integrations): all connected systems status dashboard',
      'API Manager (/admin/api-manager): API keys, rate limits, endpoint documentation',
      'Scheduler (/admin/scheduler): automated job scheduling for eligibility batch, ERA download, reports',
      'RBAC enforcement audit: verify all 7 roles have correct page access restrictions',
      'Data freshness indicators on all dashboard pages (last sync timestamp)',
    ],
    exit: 'ETL Designer functional for mock EHR + clearinghouse, RBAC enforced on ETL pages',
  },
  {
    num: '11', title: 'Automation Layer: Live Feeds & Operational Intelligence', weeks: 'Weeks 23–24',
    color: G.layer3, bg: G.layer3Bg,
    goal: 'Real-time automation feeds, operational alerts, complete AI Performance Engine',
    team: 'Backend (WebSocket) + Frontend + ML',
    deliverables: [
      'Live automation feed (WebSocket): real-time stream of system-executed actions on AI Performance Engine',
      'Operational alerts engine: threshold-based + ML anomaly alerts (A/R spike, denial surge, coding error rate jump)',
      'Alert queue page (/collections/alerts): all active alerts with priority, owner assignment, resolution tracking',
      'Action Tracker full build: tracks every recommended prescriptive action — pending/in-progress/completed/ROI realized',
      'Admin Dashboard enhancement: system health monitoring, active user sessions, API latency, ETL pipeline status',
      'AI Configuration (/settings/ai-config): tune model thresholds, confidence cutoffs, auto-routing rules',
      'Billing Rules (/settings/billing-rules): manage payer-specific billing rules, modifier rules, place-of-service rules',
      'Recovery Insights full build: recovery scenario modeling, what-if analysis per denial cohort',
    ],
    exit: 'Live feed streams in real time, all alert types firing, Action Tracker tracking ROI',
  },
  {
    num: '12', title: 'Hardening: Performance, Accessibility & Security', weeks: 'Weeks 25–26',
    color: G.hardening, bg: G.hardeningBg,
    goal: 'Production hardening — performance, security, accessibility, cross-browser testing',
    team: 'Full team',
    deliverables: [
      'Lighthouse audit: all pages ≥ 90 performance score',
      'Bundle splitting: code-split heavy pages (AI Engine, Analytics, ETL) to reduce initial load',
      'ARIA audit: all interactive elements have correct ARIA roles and labels',
      'Keyboard navigation: full tab order on all pages',
      'Dark/Light mode: verify all 75+ pages render correctly in both modes',
      'Cross-browser: Chrome, Edge, Safari, Firefox — all pages verified',
      'Penetration test: OWASP top 10 scan, fix all P1/P2 findings',
      'RBAC penetration: verify no role can access pages above their permission level',
      'Load test: 100 concurrent users, all API endpoints < 500ms p95',
      'Data validation: all financial figures correct, all percentage calculations verified',
    ],
    exit: 'All pages pass Lighthouse ≥ 90, zero P1 security findings, RBAC verified',
  },
  {
    num: '13', title: 'Launch Prep: UAT, Training & Go-Live', weeks: 'Weeks 27–28',
    color: G.hardening, bg: G.hardeningBg,
    goal: 'User Acceptance Testing, client training, production deployment',
    team: 'PM + QA + DevOps + Client',
    deliverables: [
      'UAT test plan: 200+ test cases covering all 3 layers',
      'UAT with client super-users: 5 days of structured testing',
      'Bug bash: all P1 bugs fixed, P2 bugs triaged',
      'User training materials: role-specific guides (Billing Specialist, Analyst, Executive, Admin)',
      'LIDA user guide: how to ask questions, interpret results, share reports',
      'Production deployment: AWS/Azure/GCP — blue/green deployment',
      'Monitoring setup: Datadog/CloudWatch — dashboards for API health, error rates, user activity',
      'Hypercare period: 2 weeks post-launch with daily stand-ups with client',
      'Go-live sign-off from client stakeholders',
    ],
    exit: 'UAT passed with client sign-off, production deployed, monitoring active, go-live confirmed',
  },
];

// ── Team Structure table ───────────────────────────────────────────────────
const teamHeaders = ['Role', 'Sprint Involvement'];
const teamRows = [
  ['Chief Architect', 'Sprint 0, Sprint 12 reviews, ADR sign-off'],
  ['Product Manager', 'All sprints — owns scope, acceptance criteria'],
  ['Business Analyst', 'Sprints 0–3 (requirements), Sprints 12–13 (UAT)'],
  ['Frontend (React)', 'Sprints 1–11'],
  ['Backend (FastAPI/Python)', 'Sprints 0–11'],
  ['ML Engineer', 'Sprints 4–9'],
  ['NLP Engineer', 'Sprints 6, 9'],
  ['Data Engineer', 'Sprints 0, 10'],
  ['QA Engineer', 'Sprints 3–13'],
  ['DevOps', 'Sprint 0, 10, 12, 13'],
  ['UI/UX Designer', 'Sprints 0–2 (design), Sprints 8–9 (review)'],
];
const teamColWidths = [3200, 6160];

// ── Risk Register table ────────────────────────────────────────────────────
const riskHeaders = ['Risk', 'Probability', 'Impact', 'Mitigation'];
const riskRows = [
  ['EHR API access delayed', 'High', 'High', 'Use mock data layer, defer live integration to Sprint 10'],
  ['ML training data insufficient for CRS v2', 'Medium', 'High', 'Rules-based CRS in Sprint 1 continues as fallback'],
  ['FDA SaMD assessment triggers auto-submit restriction', 'Low', 'Medium', 'Human-in-loop already built as compliance boundary'],
  ['NLP doc compliance requires PHI access', 'Medium', 'High', 'Rule-based checklist as fallback, NLP when PHI pipeline approved'],
  ['LIDA Tier 3 (PHI queries) HIPAA compliance', 'High', 'High', 'Scope locked at Tier 2 (aggregate data only)'],
  ['Client scope creep during UAT', 'Medium', 'Medium', 'Change control board, sprint scope locked 1 week before sprint start'],
];
const riskColWidths = [2200, 1400, 1200, 4560];

// ── Philosophy boxes ───────────────────────────────────────────────────────
function philosophyRow(label, sprints, color, bg) {
  return new TableRow({
    children: [
      new TableCell({
        borders: allBorders(color),
        shading: { fill: bg, type: ShadingType.CLEAR },
        width: { size: 2000, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color, font: 'Arial', size: 20 })] })],
      }),
      new TableCell({
        borders: allBorders(color),
        shading: { fill: bg, type: ShadingType.CLEAR },
        width: { size: 7360, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: sprints, font: 'Arial', size: 20 })] })],
      }),
    ],
  });
}

// ── Build the document ─────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'checks',
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: '\u2610',  // ballot box checkbox
          alignment: AlignmentType.LEFT,
          style: {
            paragraph: { indent: { left: 480, hanging: 360 } },
            run: { font: 'Arial', size: 20 },
          },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 40, bold: true, font: 'Arial', color: COLORS.coverBg },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: 'Arial', color: COLORS.coverBg },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial' },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [
    // ── SECTION 1: Cover Page ──────────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
        },
      },
      children: [
        new Table({
          width: { size: 12240, type: WidthType.DXA },
          columnWidths: [12240],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: noBorders(),
                  shading: { fill: G.coverBg, type: ShadingType.CLEAR },
                  width: { size: 12240, type: WidthType.DXA },
                  margins: { top: 2880, bottom: 2880, left: 1440, right: 1440 },
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'NEXUS RCM INTELLIGENCE PLATFORM', bold: true, size: 52, color: G.coverText, font: 'Arial' })],
                      spacing: { before: 0, after: 200 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'Master Sprint Plan', size: 40, color: 'A0C4FF', font: 'Arial' })],
                      spacing: { before: 0, after: 160 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'v1.0', size: 32, color: 'A0C4FF', font: 'Arial' })],
                      spacing: { before: 0, after: 600 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: '─'.repeat(40), color: '3A5A8A', font: 'Arial', size: 22 })],
                      spacing: { before: 0, after: 400 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'PM + Scrum Master', size: 26, color: 'C8D8F0', font: 'Arial' })],
                      spacing: { before: 0, after: 120 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: 'March 2026', size: 26, color: 'C8D8F0', font: 'Arial' })],
                      spacing: { before: 0, after: 120 },
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: '13 Sprints \u00D7 2 Weeks = 26 Weeks', size: 26, color: 'C8D8F0', font: 'Arial' })],
                      spacing: { before: 0, after: 0 },
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },

    // ── SECTION 2: TOC + Content ───────────────────────────────────────────
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'NEXUS RCM INTELLIGENCE PLATFORM  |  Master Sprint Plan v1.0', font: 'Arial', size: 16, color: G.muted }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: G.layer2, space: 1 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'Confidential — Nexus RCM Intelligence Platform  |  v1.0  |  March 2026     Page ', font: 'Arial', size: 16, color: G.muted }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: G.muted }),
                new TextRun({ text: ' of ', font: 'Arial', size: 16, color: G.muted }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 16, color: G.muted }),
              ],
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: G.layer2, space: 1 } },
            }),
          ],
        }),
      },
      children: [
        // TOC
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Table of Contents', bold: true, size: 40, font: 'Arial', color: G.coverBg })],
          spacing: { before: 0, after: 200 },
        }),
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3',
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // SPRINT PHILOSOPHY
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Sprint Philosophy', bold: true, size: 40, font: 'Arial', color: G.coverBg })],
          spacing: { before: 0, after: 200 },
        }),
        new Paragraph({
          children: [boldRun('Three-Layer Delivery Model', { size: 22 })],
          spacing: { before: 0, after: 120 },
        }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [2000, 7360],
          rows: [
            philosophyRow('Layer 1 — Prevention', 'Sprints 0–3: Claim readiness, auth/coding pre-checks, submission hardening', G.layer1, G.layer1Bg),
            philosophyRow('Layer 2 — Analytics', 'Sprints 4–7: Core intelligence, predictive models, LIDA, MECE framework, EVV & reconciliation', G.layer2, G.layer2Bg),
            philosophyRow('Layer 3 — Automation', 'Sprints 8–11: Auto-routing, appeal automation, ETL & integration, live operational feeds', G.layer3, G.layer3Bg),
            philosophyRow('Hardening & Launch', 'Sprints 12–13: Performance, security, accessibility, UAT, training, go-live', G.hardening, G.hardeningBg),
          ],
        }),
        new Paragraph({ children: [], spacing: { before: 240, after: 0 } }),
        new Paragraph({
          children: [boldRun('Reuse Policy: ', { size: 20 }), run('All shared UI components (AIInsightCard, ConfidenceBar, FilterChipGroup, DateRangePicker, PrescriptiveAction, RootCauseTree), theme system (dark/light), design tokens, navigation structure, and 75+ existing pages ARE ALREADY BUILT and carry forward. Only enhancements and net-new features are planned in sprints below.', { size: 20 })],
          spacing: { before: 120, after: 240 },
        }),

        // ── ALL SPRINTS ──
        ...sprints.flatMap(s =>
          sprintSection(
            s.num, s.title, s.weeks,
            s.goal, s.team, s.deliverables, s.exit,
            s.color, s.bg
          )
        ),

        // ── TEAM STRUCTURE ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Team Structure', bold: true, size: 40, font: 'Arial', color: G.coverBg })],
          spacing: { before: 0, after: 200 },
        }),
        buildTable(teamHeaders, teamRows, teamColWidths),
        new Paragraph({ children: [], spacing: { before: 240, after: 0 } }),

        // ── RISK REGISTER ──
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: 'Risk Register', bold: true, size: 40, font: 'Arial', color: G.coverBg })],
          spacing: { before: 0, after: 200 },
        }),
        buildTable(riskHeaders, riskRows, riskColWidths),
        new Paragraph({ children: [], spacing: { before: 240, after: 0 } }),
      ],
    },
  ],
});

// ── Write file ─────────────────────────────────────────────────────────────
const outDir = path.join(__dirname);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(outDir, 'RCM_Nexus_Sprint_Plan.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('SUCCESS: Written to', outPath);
}).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
