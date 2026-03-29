# NEXUS RCM — Market Research & Competitor Analysis

**Date:** 2026-03-29
**Sources:** Waystar, FinThrive, Experian Health, Black Book Research, HFMA 2025

---

## COMPETITOR LANDSCAPE

### Key Players

| Vendor | Strengths | AI Approach | Market Position |
|--------|-----------|-------------|-----------------|
| **Waystar** | Autonomous coding (90%+ auto), pre-submission blocking, appeal portal submission | ML + rules hybrid | Market leader in AI-RCM |
| **FinThrive** | Agentic AI (announced HFMA 2025), clinical complexity scoring, provider risk | Agentic AI + NLP | Innovation leader |
| **Experian Health** | Real-time eligibility (270/271), payer behavior change detection, propensity scoring | Statistical ML + data network | Data advantage (payer network) |

---

## COMPETITOR CAPABILITY MATRIX vs NEXUS RCM

### Status as of 2026-03-29 (POST Sprint 10-15 builds)

| Capability | Waystar | FinThrive | Experian | NEXUS RCM | Status |
|-----------|---------|-----------|----------|-----------|--------|
| **Autonomous coding** (90%+ auto) | YES | YES | YES | NO | NOT BUILT — no NLP coding service |
| **Auto-submit appeals to payer portal** | YES | YES | YES | NO | Appeals created locally only, no portal submission |
| **Agentic AI for denials** | YES | YES | YES | PARTIAL | MiroFish exists but NOT wired into core services |
| **Pre-submission claim blocking** | YES | YES | YES | PARTIAL | 5 prevention rules generate alerts, don't block |
| **Auto-post ERA payments** | YES | YES | YES | **YES** | FIXED — AUTO-003 handler creates EraPayment records |
| **Auto-generate dispute letters** | YES | YES | YES | NO | AUTO-014 logs only, no letter generation |
| **Collection auto-outreach** (IVR/SMS/email) | YES | YES | PARTIAL | NO | Queue display only, no outreach |
| **Payer behavior anomaly alerts** | YES | YES | YES | **YES** | FIXED — AUTO-007 fires 10 payer spike alerts |
| **NLP documentation analysis** | YES | YES | YES | NO | No NLP/document analysis service |
| **Real-time eligibility re-verification** | YES | YES | YES | NO | AUTO-011 is stub, no 270/271 execution |
| **Per-claim denial probability ML** | YES | YES | YES | **YES** | FIXED — DenialProbabilityModel (GBM, 25 features, AUC 0.71) |
| **Appeal success probability** | YES | YES | - | **YES** | FIXED — AppealSuccessModel (GBM, 11 features) |
| **Neo4j/Graph-based investigation** | - | YES | - | **YES** | FIXED — Step 9.5 GRAPH_PATTERN_SYNTHESIS |
| **Feedback loop / outcome tracking** | YES | YES | YES | **PARTIAL** | Outcomes tracked, Neo4j updated, no model retraining |
| **Payment delay prediction** | YES | YES | YES | NO | Prophet forecasts exist but no per-payer ML |
| **Provider risk scoring** | - | YES | - | NO | No composite provider score |
| **Payer behavior change detection** | - | - | YES | NO | No CUSUM/PELT change-point detection |
| **Clinical complexity scoring** | - | YES | - | NO | No clinical complexity model |
| **Collection propensity ML** | YES | YES | YES | NO | Heuristic only, no trained model |
| **Seasonal denial pattern detection** | YES | - | - | NO | No seasonal decomposition |
| **Eligibility prediction** | - | - | YES | NO | No coverage termination prediction |

---

## WHAT WE FIXED SINCE THE ANALYSIS

| Original Finding | Fix Applied | Sprint |
|-----------------|-------------|--------|
| execute_action() is a STUB | Built action_executor.py with 5 real handlers (AUTO-001/002/003/008/014) | Sprint 12 |
| No per-claim denial probability | Built DenialProbabilityModel (GBM, 25 features, AUC 0.71) | Sprint 11 |
| No appeal success probability | Built AppealSuccessModel (GBM, 11 features) | Sprint 11 |
| Neo4j NOT connected to RCA | Added Step 9.5 GRAPH_PATTERN_SYNTHESIS calling get_all_graph_evidence() | Sprint 10 |
| No feedback loop | Built outcome_tracker.py + feedback_neo4j.py | Sprint 14 |
| Auto-post ERA payments — NO | Built _handle_payment_posting() creating EraPayment + updating claim to PAID | Sprint 12 |
| Investigation is SQL-only | Now SQL + Neo4j (investigation_service.py combines both) | Sprint 14 |
| Payer behavior alerts — NO | AUTO-007 fires 10 payer denial spike alerts from diagnostics | Sprint 12 |

---

## WHAT'S STILL MISSING (Competitive Gaps)

### CRITICAL — Competitors ALL have these

| Gap | Revenue Impact | Complexity | Priority |
|-----|---------------|------------|----------|
| Pre-submission claim BLOCKING (not just alerts) | $310K-$480K | Medium | P1 |
| Auto-submit appeals to payer portals | $220K-$380K | High | P1 |
| Collection propensity ML model | $85K-$130K | Medium | P1 |
| Payment delay prediction per payer | $55K-$80K | Medium | P1 |
| Real-time eligibility re-verification (270/271) | $120K-$180K | Medium | P1 |
| MiroFish wired into core pipeline | Differentiator | High | P1 |

### HIGH — Most competitors have these

| Gap | Revenue Impact | Complexity | Priority |
|-----|---------------|------------|----------|
| Dispute letter auto-generation | $183K-$275K | Medium | P2 |
| NLP clinical documentation analysis | $48K-$72K | High | P2 |
| Payer behavior change detection (CUSUM/PELT) | $45K-$75K | Medium | P2 |
| Provider risk scoring composite | $15K-$30K | Medium | P2 |
| Autonomous coding suggestions | $48K-$72K | High | P2 |
| Model retraining / closed feedback loop | Accuracy | Medium | P2 |

### MEDIUM — Differentiators some competitors have

| Gap | Revenue Impact | Complexity | Priority |
|-----|---------------|------------|----------|
| Collection auto-outreach (IVR/SMS/email) | $28K-$42K | High | P3 |
| Clinical complexity scoring | est. $40K-$60K | High | P3 |
| Seasonal denial pattern detection | est. $30K-$50K | Medium | P3 |
| Coverage termination prediction | est. $15K-$30K | Medium | P3 |

---

## NEXUS RCM COMPETITIVE ADVANTAGES

| Advantage | Competitors Lack | Status |
|-----------|-----------------|--------|
| **Neo4j knowledge graph** for RCM ontology | Most use flat relational only | BUILT (425 nodes, 2507 rels) |
| **MiroFish multi-agent simulation** | No competitor has agent-based what-if | BUILT (not wired) |
| **11-step Bayesian RCA** with graph synthesis | Most use 3-4 step rule-based | BUILT |
| **Full audit trail** per automation action | Varies | BUILT |
| **Temporal knowledge graph** (Graphiti) | Unique | BUILT (not wired) |
| **Open-source LLM** (Ollama/Qwen) — no vendor lock-in | All use proprietary AI | BUILT |

---

## MARKET INTELLIGENCE

### Industry Trends (2025-2026)

1. **Agentic AI is the new battleground** — FinThrive announced agentic AI at HFMA 2025. Waystar investing heavily. The market expects autonomous agents, not just ML predictions.

2. **Prevention > Correction** — ROI data shows $1 spent on prevention saves $3.42 vs $2.10 for automation. Leading vendors are shifting upstream.

3. **Pre-submission blocking is table stakes** — Every major vendor blocks high-risk claims before submission. Alert-only is no longer competitive.

4. **Real-time eligibility is expected** — 270/271 transactions are standard. Not having real-time eligibility is a significant gap.

5. **Closed-loop learning differentiates** — Vendors that retrain models on outcomes outperform static-model competitors by 15-25% accuracy within 6 months.

### Revenue Impact Benchmarks

| Metric | Industry Average | Top Performers |
|--------|-----------------|----------------|
| Denial rate reduction | 15-25% | 35-45% |
| Days in AR improvement | 5-10 days | 15-20 days |
| Collection rate improvement | 3-5% | 8-12% |
| Cost-to-collect reduction | 0.5-1.0% | 1.5-2.5% |
| FTE productivity gain | 15-25% | 30-45% |

---

*Market research conducted via competitive analysis of Waystar, FinThrive, Experian Health. Sources: HFMA 2025, Black Book Research AI-RCM evaluation, company press releases and product documentation.*
