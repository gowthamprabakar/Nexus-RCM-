<!-- Sync Impact Report
Version: 0.0.0 → 1.0.0 (MAJOR: Initial ratification)
Added principles: I through VII (all new)
Added sections: Technology Stack, Development Workflow
Templates requiring updates: ✅ constitution updated
-->

# NEXUS RCM (RCM Pulse) Constitution

## Core Principles

### I. Claim-Level Truth (NON-NEGOTIABLE)
All computation MUST work from claim-level data upward. The root cause engine discovers patterns by examining independent data points (eligibility status, auth timeline, coding complexity, payer history, submission gaps) — it MUST NOT confirm labels derived from denial categories. If the payer says "ELIGIBILITY" but the eligibility record shows ACTIVE, the engine MUST disagree with the payer and find the actual root cause. Every KPI, every diagnostic, every automation traces back to individual claims in PostgreSQL.

### II. Three-Layer Architecture
Every feature MUST map to exactly one of three layers:
- **Analytics** (Layer 1): What happened and why — descriptive KPIs, root cause analysis, diagnostic findings
- **Automation** (Layer 2): Fix it — rule-based actions triggered by diagnostics, human-in-the-loop approval
- **Prevention** (Layer 3): Stop it before it happens — pre-submission CRS scoring, timely filing alerts, eligibility re-verification
No feature spans multiple layers. Each layer feeds the next: Analytics discovers → Automation acts → Prevention learns.

### III. Graph Connectivity
Every entity in the system connects through `claim_id` as the primary key. The drill-down path Revenue ($205M) → Payer (Humana $6.6M) → Denial Category (CODING 375) → Root Cause (CODING_MISMATCH) → Individual Claim (CLM0318619) → Full Context (denial + 7-step RCA + ERA + eligibility + auth + CPT lines) MUST be traversable via real SQL JOINs, not aggregated summaries displayed in sequence. Every click goes deeper, never sideways.

### IV. AI With Evidence
AI-generated descriptions (via Ollama llama3) MUST be backed by real database statistics injected into the prompt. The LLM writes narrative text only — it MUST NOT fabricate numbers, percentages, or dollar amounts. The MECE badge system (Descriptive/Diagnostic/Predictive/Prescriptive) MUST be earned by the backing computation engine:
- DESCRIPTIVE: Requires SQL aggregation returning the stated numbers
- DIAGNOSTIC: Requires root cause engine analysis with confidence score
- PREDICTIVE: Requires statistical model with confidence interval
- PRESCRIPTIVE: Requires automation rule with defined action and threshold
A badge slapped on without a backing engine is fraud. Remove it.

### V. One Voice Per Page
Each page MUST have maximum ONE AI insight section. No competing Descriptive/Diagnostic/Predictive/Prescriptive badges fighting for attention. The user MUST never ask "which one do I follow?" If a page has a KPI section, a data section, and an AI section, that is the correct structure. Two AI sections on one page violates this principle.

### VI. Contextual Investigation, Not Page Navigation
Root cause analysis, investigation panels, and drill-downs are contextual overlays that open FROM the page the user is on. They are NOT standalone pages in the sidebar. A user investigating "why is denial rate up?" should click the KPI → investigation panel opens in context → drill down through the graph → reach individual claims. They should NEVER navigate to a separate "Root Cause Page" disconnected from their workflow.

### VII. Real Data Only (NON-NEGOTIABLE)
No mock data in production code paths. The frontend rendering pipeline is: Loading skeleton → Real API data → Static fallback (only if backend unreachable). Hardcoded arrays of fake patient names, fake dollar amounts, or fake percentages MUST NOT exist in any component that renders in production. Static fallback constants MUST be clearly named `FALLBACK_*` or `STATIC_FALLBACK_*` and used only in catch blocks.

## Technology Stack

- **Backend**: Python 3.14, FastAPI, SQLAlchemy async, PostgreSQL
- **Frontend**: React 18, Vite, Tailwind CSS (dark theme with `th-*` design tokens)
- **AI Engine**: Ollama local LLM (llama3 8B, mistral 7B) at localhost:11434
- **Database**: 500K claims, 56K denials, 315K ERA payments, 50 payers, 200 providers, 800 contract rates
- **Root Cause Engine**: Zero-prior 7-step evidence chain (eligibility → auth → coding → payer history → timeline → contract → provider)
- **Automation Engine**: 7 rules with diagnostic-triggered evaluation, approve/reject workflow, audit trail
- **Graph Query Service**: 5-level drill-down via claim_id JOINs

## Development Workflow

- **Spec-Driven**: All features begin with specification (what/why) before implementation (how)
- **Agent-Based**: Parallel agents for backend, frontend, data, AI — each with clear scope
- **Verify Before Ship**: Every change is verified with real API calls and screenshots, not assumed working
- **Page-by-Page QA**: After any change, verify the affected page renders with real data, no $0 or NaN or empty states
- **RCM Bible**: Five reference documents (Descriptive 235 metrics, Root Cause 157 items, Diagnostics 121 items, Predictions 85 items, Automation 98 items) serve as the source of truth for what the platform covers
- **SME Validation**: Marcus Chen (20-year RCM veteran) validates all RCM domain decisions

## Governance

This constitution supersedes all other development practices for NEXUS RCM. Every PR, every agent task, every sprint plan MUST verify compliance with these seven principles. Violations discovered in review MUST be fixed before merge — not deferred to "next sprint."

Amendments to this constitution require:
1. Written justification for the change
2. Impact analysis on existing features
3. Client approval
4. Version increment (MAJOR for principle changes, MINOR for additions, PATCH for clarifications)

**Version**: 1.0.0 | **Ratified**: 2026-03-26 | **Last Amended**: 2026-03-26
