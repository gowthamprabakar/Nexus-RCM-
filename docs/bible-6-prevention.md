# NEXUS RCM BIBLE — DOCUMENT 6 OF 6
# PREVENTION LAYER
## "How do we STOP the problem from happening in the first place?"

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME), Sarah Kim (BA), James Park (PM)

---

## PURPOSE

Prevention is the highest-value layer. Every dollar of prevention
saves $4-$8 in downstream denial management, appeals, and collections.

This document maps every preventable failure across the RCM cycle,
the prevention mechanism, and which root causes (Doc 2) it eliminates.

---

## THE PREVENTION PRINCIPLE

```
WITHOUT PREVENTION:
  Claim submitted → Denied → Root cause found → Appeal filed →
  Maybe recovered (60%) → 47 days lost → $180 cost per denial worked

WITH PREVENTION:
  Claim about to submit → Risk detected → Corrected before submission →
  Paid on first pass → 0 days lost → $0 denial cost

Prevention ROI: $1 spent on prevention = $4-$8 saved on remediation
```

---

## SECTION 1: FRONT-END PREVENTIONS (Before Claim Exists)

### Patient Access & Registration

| # | What We Prevent | Prevention Mechanism | Root Causes Eliminated (Doc 2) | Revenue Saved |
|---|----------------|---------------------|-------------------------------|---------------|
| PV-F01 | **Eligibility-related denials** | Real-time 270/271 at scheduling + 24hr pre-service re-check + insurance discovery for uninsured | B3.09, B6.01 | $2.10 per $1 spent |
| PV-F02 | **Authorization denials** | Auto-PA trigger at procedure scheduling; PA requirement database synced with every payer quarterly; 72-hour lead time requirement | B3.07, B3.08, B6.02 | $3.40 per $1 spent |
| PV-F03 | **COB / wrong payer order denials** | Insurance discovery + COB verification at registration; primary/secondary confirmation with patient | B3.10, B6.01 | $1.80 per $1 spent |
| PV-F04 | **Non-covered service denials** | Benefits verification for specific CPT before scheduling; ABN (Advance Beneficiary Notice) for Medicare; financial counseling for patient | B3.13, B3.19 | $1.20 per $1 (prevents bad debt, not denial) |
| PV-F05 | **Demographics/registration errors** | Real-time eligibility check validates demographics (DOB, member ID, group number) against payer database at check-in | B3.22, B6.07 | $2.80 per $1 spent |
| PV-F06 | **Credentialing denials** | 120/90/60/30-day credential expiry alerts; auto-hold scheduling for non-credentialed providers; pre-service credential verification | B3.16, B6.06, A1.10 | $4.20 per $1 spent |
| PV-F07 | **Referral requirement denials** | HMO referral check at scheduling; auto-initiate referral request from PCP office | B3.18 | $2.10 per $1 spent |
| PV-F08 | **Coverage termination during treatment** | Weekly eligibility re-verification for patients in active treatment episodes (PT, chemo, dialysis) | B3.09 | $1.60 per $1 spent |

---

## SECTION 2: MID-CYCLE PREVENTIONS (Coding & Documentation)

### Clinical Documentation & Coding

| # | What We Prevent | Prevention Mechanism | Root Causes Eliminated (Doc 2) | Revenue Saved |
|---|----------------|---------------------|-------------------------------|---------------|
| PV-M01 | **Medical necessity denials** | Concurrent CDI review: real-time documentation alerts while patient is still in-house; physician query within 24 hours of admission for high-risk DRGs | B3.05, B3.06, B3.17, B6.03 | $5.80 per $1 spent |
| PV-M02 | **Coding accuracy denials** | Pre-bill coding audit on high-risk claims (CRS > 5); automated code-diagnosis crosswalk validation; NCCI edit check before submission | B3.01, B3.02, B3.03, B3.04, B3.15 | $3.20 per $1 spent |
| PV-M03 | **DRG misassignment** | Concurrent CDI DRG validation; expected vs assigned DRG comparison; clinical indicator checklist for top 20 DRGs | B3.03, A1.05 | $4.10 per $1 spent |
| PV-M04 | **Modifier errors** | Payer-specific modifier rule engine: CPT × POS × payer → required/prohibited modifiers validated pre-submission | B3.02 | $2.40 per $1 spent |
| PV-M05 | **Unbundling/NCCI edit failures** | Real-time NCCI edit validation in coding workflow; alert before code submission, not after | B3.15, B1.10 | $2.80 per $1 spent |
| PV-M06 | **Downcoding / revenue leakage** | CDI-driven documentation improvement: E&M level optimization, DRG capture, HCC coding completeness; compare documentation to coding level potential | A1.05, B3.03 | $3.60 per $1 spent |
| PV-M07 | **Charge capture gaps** | Real-time encounter-to-charge reconciliation: if encounter exists but no charge within 48 hours → alert department; daily charge capture dashboards by department | A1.04, B6.08 | $2.90 per $1 spent |
| PV-M08 | **Payer-specific documentation requirements** | Payer documentation template library: CDI applies payer-specific checklists (e.g., UHC requires TIMI score for cardiac > 3 days); updated when payer policy changes detected (PR-D08) | B2.01, B2.04, B3.06 | $4.70 per $1 spent |

---

## SECTION 3: PRE-SUBMISSION PREVENTIONS (Claim Scrubbing)

### CRS-Driven Claim Risk Prevention

| # | What We Prevent | Prevention Mechanism | Root Causes Eliminated (Doc 2) | Revenue Saved |
|---|----------------|---------------------|-------------------------------|---------------|
| PV-S01 | **High-risk claim submission** | CRS score > 7.0 → auto-hold for manual review before submission; surface specific risk factors with remediation steps | All B3.* where detectable pre-submission | $6.20 per $1 spent |
| PV-S02 | **Payer-specific billing rule violations** | Payer rule engine: 500+ rules per major payer covering auth requirements, documentation, modifiers, frequency limits, site-of-service; updated quarterly or on policy change detection | B2.01-B2.05, B3.* | $4.80 per $1 spent |
| PV-S03 | **Missing information on claim** | Pre-submission completeness check: all required fields populated, auth number present, referring physician NPI valid, diagnosis pointers correct | B3.08, B3.14, B3.22 | $3.10 per $1 spent |
| PV-S04 | **Frequency/benefit limit violations** | Patient benefit tracking: monitor utilization vs benefit limits per CPT per patient per payer; alert when approaching limit (80%) and block when exceeded | B3.19, B3.20 | $1.80 per $1 spent |
| PV-S05 | **Gender/age edit failures** | Demographic-procedure crosswalk validation: flag impossible combinations before submission | B3.21 | $2.20 per $1 spent |
| PV-S06 | **Duplicate claim submission** | Claim deduplication engine: same patient + same DOS + same CPT + same payer = potential duplicate; hold for review | B3.11 | $1.40 per $1 spent |
| PV-S07 | **Timely filing risk** | Claims approaching payer filing deadline → priority escalation; internal deadline = payer deadline minus 14 days; daily countdown dashboard | B3.12, A1.03, B6.04 | $7.10 per $1 spent (saves 100% of the claim) |

---

## SECTION 4: POST-SUBMISSION PREVENTIONS (Monitoring & Early Detection)

| # | What We Prevent | Prevention Mechanism | Root Causes Eliminated (Doc 2) | Revenue Saved |
|---|----------------|---------------------|-------------------------------|---------------|
| PV-P01 | **Lost claims (submitted but no response)** | Auto-monitor for payer acknowledgment (277CA) within 48 hours; auto-resubmit if no acknowledgment received | B1.08 | $3.40 per $1 spent |
| PV-P02 | **ADTP anomaly becoming AR aging problem** | ADTP-based anomaly detection: claim age > ADTP + 1.5σ → flag for follow-up before it ages into 90+ bucket | A2.01, A2.03 | $2.60 per $1 spent |
| PV-P03 | **Denial pattern becoming systemic** | Denial trend monitoring: if denial rate for any payer × CARC × CPT exceeds 2σ → alert within 14 days of pattern start | B1.01-B1.10 | $5.10 per $1 spent (prevents pattern from spreading) |
| PV-P04 | **Appeal deadline expiration** | Appeal deadline countdown from denial date; auto-escalate at 14/7/3 days remaining; auto-file appeal draft if deadline imminent | B6.09 | $6.80 per $1 spent |
| PV-P05 | **Silent underpayment accumulation** | Contract-vs-paid validation on every ERA posting; cumulative underpayment tracker per payer per CPT; alert when cumulative exceeds $5,000 | A1.02, B2.03 | $3.90 per $1 spent |
| PV-P06 | **Payer policy change going undetected** | Change point detection on payer denial patterns (PR-D08); when detected, auto-alert + auto-review denied claims in window for retroactive appeal | B1.01, B2.01-B2.05 | $4.20 per $1 spent |
| PV-P07 | **Reconciliation errors compounding** | Daily claim-level ERA-to-bank matching (not batch); flag discrepancies same day | A1.06, A2.02 | $2.30 per $1 spent |

---

## SECTION 5: SYSTEMIC PREVENTIONS (Organizational)

| # | What We Prevent | Prevention Mechanism | Root Causes Eliminated (Doc 2) |
|---|----------------|---------------------|-------------------------------|
| PV-O01 | **Root cause recurrence** | Monthly root cause report: top 5 root causes → specific process changes assigned → tracked to completion → re-measured | B6.15 — the feedback loop |
| PV-O02 | **Knowledge decay** | Payer rule library maintained and versioned; quarterly review cycle; automated update when policy change detected | B6.05 |
| PV-O03 | **Coder skill gaps** | Denial-driven training: coder-specific denial patterns → targeted education; monthly coding accuracy scorecards | B1.02, B6.04 |
| PV-O04 | **CDI program gaps** | CDI effectiveness dashboard: query rate, response rate, DRG change rate, denial prevention rate; benchmarked against industry | B1.05, B6.03 |
| PV-O05 | **New payer/service launch risk** | Pre-launch billing readiness checklist: CPT mapping, payer coverage, PA requirements, expected denial rate, scrubber rules configured | B1.07 |
| PV-O06 | **Contract rate staleness** | Annual contract rate refresh; new CPT rate loading within 30 days of AMA release; contract rate table completeness dashboard | B6.11, A1.08 |
| PV-O07 | **Regulatory change lag** | Automated CMS/state regulatory update monitoring; NCCI edit updates loaded within 48 hours; LCD/NCD change alerts to coding/CDI | B1.10 |
| PV-O08 | **Process bottleneck formation** | Pipeline stage dwell time monitoring: if any stage average exceeds baseline + 2 days → alert operations; bottleneck root cause auto-analysis | B6.04, B6.10 |
| PV-O09 | **Payer behavior shift undetected** | Payer health score (PR-X02) updated weekly; composite of: ADTP trend + denial rate trend + underpayment rate + ERA-bank gap; alert on score decline | B2.10, A2.01 |
| PV-O10 | **Missed revenue optimization** | Quarterly revenue opportunity analysis: downcoding gaps, missed charges, under-utilized CDI, unworked denials, unrecovered underpayments; prioritized by $ impact | A1.01-A1.10 |

---

## PREVENTION IMPACT MATRIX

### Prevention Investment vs. Downstream Cost Avoided

```
PREVENTION CATEGORY           INVEST    SAVE     ROI
────────────────────────────────────────────────────
Front-end (eligibility/auth)  $1.00  →  $2.76    2.76×
CDI / documentation           $1.00  →  $4.53    4.53×
Pre-submission scrubbing      $1.00  →  $3.94    3.94×
Post-submission monitoring    $1.00  →  $3.76    3.76×
Systemic / organizational     $1.00  →  $2.12    2.12×

OVERALL PREVENTION ROI:       $1.00  →  $3.42    3.42× average
```

### For a $50M Practice:

```
SCENARIO                    ANNUAL DENIAL $    WITH PREVENTION    SAVED
────────────────────────────────────────────────────────────────────────
Current (no prevention):    $6,150,000         —                 —
Front-end only:             $4,920,000         $1,230,000        20%
+ CDI/documentation:        $3,444,000         $2,706,000        44%
+ Pre-submission scrub:     $2,460,000         $3,690,000        60%
+ Post-submission monitor:  $1,845,000         $4,305,000        70%
+ Systemic/organizational:  $1,537,500         $4,612,500        75%

NET: Prevention reduces denials from $6.15M to $1.54M
     $4.61M annually saved
     At prevention investment of ~$1.35M
     NET ROI: $3.26M annually
```

---

## PREVENTION PRIORITY MATRIX

### Sorted by (Revenue Impact × Ease of Implementation)

| Priority | Prevention | Revenue Impact | Ease | Start Sprint |
|----------|-----------|---------------|------|-------------|
| 1 | PV-S07 Timely filing countdown | ★★★★★ | Easy | Sprint 5 |
| 2 | PV-F01 Real-time eligibility | ★★★★★ | Medium | Sprint 5 |
| 3 | PV-F02 Auto-PA trigger | ★★★★★ | Medium | Sprint 5 |
| 4 | PV-S01 CRS auto-hold | ★★★★★ | Medium (exists partially) | Sprint 5 |
| 5 | PV-M01 Concurrent CDI alerts | ★★★★★ | Hard | Sprint 6 |
| 6 | PV-P03 Denial trend detection | ★★★★ | Medium | Sprint 5 |
| 7 | PV-P04 Appeal deadline countdown | ★★★★ | Easy | Sprint 5 |
| 8 | PV-M02 Pre-bill coding audit | ★★★★ | Medium | Sprint 6 |
| 9 | PV-P05 Silent underpayment detection | ★★★★ | Medium | Sprint 6 |
| 10 | PV-S02 Payer rule engine | ★★★★ | Hard | Sprint 6-7 |

---

## HOW PREVENTION CONNECTS TO THE FULL PIPELINE

```
Doc 1 (Descriptive) → tells you WHAT is happening today
    ↓
Doc 2 (Root Cause) → tells you WHY it happened
    ↓
Doc 3 (Diagnostic) → tells you WHAT TO DO about it
    ↓
Doc 4 (Predictive) → tells you what WILL happen next
    ↓
Doc 5 (Automation) → DOES the fix automatically
    ↓
Doc 6 (Prevention) → STOPS IT FROM HAPPENING AGAIN ← YOU ARE HERE
    ↓
    └──→ Feeds back to Doc 1: descriptive metrics improve
         → Denial rate drops
         → Revenue increases
         → Cash flow stabilizes
         → Cost to collect decreases
         → THE CYCLE CONTINUES
```

---

## TOTAL PREVENTION ITEMS: 40

- Front-end preventions: 8
- Mid-cycle (CDI/coding) preventions: 8
- Pre-submission preventions: 7
- Post-submission preventions: 7
- Systemic/organizational preventions: 10

Combined with Doc 5 (56 automations), the platform has 96 active
mechanisms working to maximize revenue and minimize loss.

---

## END OF NEXUS RCM BIBLE (6 DOCUMENTS)

### Document Index:
1. **bible-1-descriptive-analytics.md** — 132 metrics (What happened?)
2. **bible-2-root-cause-analysis.md** — 73 root causes (Why did it happen?)
3. **bible-3-diagnostic-suggestions.md** — 70 diagnostic actions (What should we do?)
4. **bible-4-predictive-analytics.md** — 47 predictions (What will happen?)
5. **bible-5-automation.md** — 56 automations (What can the system do?)
6. **bible-6-prevention.md** — 40 preventions (How do we stop it from happening?)

### TOTAL: 418 discrete capabilities mapped across the full RCM intelligence cycle.
