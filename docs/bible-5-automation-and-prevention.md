# NEXUS RCM BIBLE — DOCUMENT 5 OF 6 (REVISED)
# AUTOMATION & PREVENTION
## "Fix it automatically. Stop it before it happens."

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME, 20-year veteran), James Park (PM), Priya Sharma (ARCH), Sarah Kim (BA)
> NOTE: This document supersedes the separate Doc 5 (Automation) and Doc 6 (Prevention) documents.
> Every item now carries full traceability back through the entire Bible chain.

---

## PURPOSE

This document lists EVERY automation and prevention capability the NEXUS RCM platform must have. It is split into two halves:

- **PART A: AUTOMATION** — The system takes action without manual intervention (with appropriate human-in-the-loop guardrails). Automation fixes known problems faster than humans can.
- **PART B: PREVENTION** — The system identifies risk BEFORE a negative outcome occurs and intervenes. Prevention eliminates the problem before it exists.

Together, these represent the action layer of the NEXUS platform — where analytics (Docs 1-4) become revenue.

```
THE VALUE HIERARCHY:

  Prevention:  $1 invested → $3.42 saved (stop the problem)
  Automation:  $1 invested → $2.10 saved (fix the problem faster)
  Manual:      $1 invested → $0.60 saved (human does everything)

  A platform without automation is a dashboard.
  A platform without prevention is a fire truck.
  NEXUS is neither. NEXUS is the building code AND the sprinkler system.
```

---

## AUTOMATION TIERS (Applies to Part A)

| Tier | Description | Human Involvement | Examples |
|------|------------|-------------------|---------|
| **Tier 1: Full Auto** | System acts without human input | None — logged for audit | Eligibility re-check, scrubber edits, queue prioritization |
| **Tier 2: Auto-Draft + Approve** | System prepares action, human clicks approve | 1-click approval | Appeal letters, claim corrections, resubmissions |
| **Tier 3: Auto-Alert + Decide** | System alerts human with recommendation | Human makes decision | Payer escalation, contract disputes, write-off decisions |
| **Tier 4: Human-Only** | System surfaces information, human acts entirely | Full human action | Peer-to-peer calls, legal action, contract negotiations |

### Human-in-the-Loop Ramp Schedule

For Tier 1 and Tier 2 automations, the human-in-the-loop requirement follows a ramp:

| Phase | Duration | Behavior |
|-------|----------|----------|
| **Learning** | First 30 days | All actions require human approval (behaves as Tier 2/3) |
| **Supervised** | Days 31-90 | Low-risk actions auto-execute; high-risk still require approval |
| **Autonomous** | Day 91+ | All actions within confidence threshold auto-execute |

---

# ============================================================
# PART A: AUTOMATION
# "Fix it automatically."
# ============================================================

---

## A1. CLAIMS AUTOMATION

### A1.1 Auto-Scrub Before Submission

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-01 |
| **Item Name** | Pre-Submission Auto-Scrub |
| **What It Does** | Applies NCCI edits, modifier validation, diagnosis-procedure crosswalk, payer-specific billing rules, and demographic validation to every claim before it enters the submission queue. Corrects auto-fixable errors (e.g., missing modifier, incorrect POS) and flags non-auto-fixable issues for human review. |
| **Trigger Condition** | Claim enters scrub queue after coding completion |
| **Required Data Inputs** | Claim data (CPT, ICD-10, modifiers, POS, provider NPI), payer-specific rule database, NCCI edit tables, LCD/NCD criteria, payer fee schedules |
| **Human-in-the-Loop** | First 30 days: all corrections reviewed. After: auto-fix for deterministic rule violations; flag for human on ambiguous edits |
| **Confidence Threshold** | N/A for deterministic rules; 95% for AI-suggested corrections |
| **Revenue Impact** | $180K-$240K/year (prevents 40-60% of technical denials on a $50M practice) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability), PR-D02 (Denial CARC Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality decline), DS-D10 (Regulatory changes) |
| **Connected Root Causes (Doc 2)** | B3.01 (Wrong CPT), B3.02 (Wrong modifier), B3.04 (Unbundling), B3.15 (NCCI edit failure) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A1.2 Auto-Fix Known Billing Rule Errors

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-02 |
| **Item Name** | Deterministic Billing Error Auto-Correction |
| **What It Does** | Automatically corrects claims that violate deterministic billing rules: wrong POS code for telehealth, missing -25 modifier on E&M with procedure, incorrect taxonomy code, missing supervising provider NPI for incident-to billing. Logs every correction for audit trail. |
| **Trigger Condition** | Scrubber identifies a rule violation where the correct value is deterministic |
| **Required Data Inputs** | Payer billing rule database, CPT-modifier matrix, POS-procedure crosswalk, provider enrollment data |
| **Human-in-the-Loop** | First 30 days: all. After: never for corrections with >98% historical accuracy; human review for new rule types |
| **Confidence Threshold** | 98% — correction must have >98% historical success rate |
| **Revenue Impact** | $85K-$120K/year (eliminates 15-20% of correctable rejections) |
| **Connected Predictions (Doc 4)** | PR-D01, PR-D02 |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change), DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B3.02 (Wrong modifier), B3.14 (Missing information), B3.22 (Demographics error) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A1.3 Auto-Hold High-Risk Claims for Review

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-03 |
| **Item Name** | CRS-Driven Auto-Hold |
| **What It Does** | Claims scoring above CRS threshold (default 7.0, configurable per payer) are automatically withheld from batch submission and routed to a manual review queue. The review screen surfaces the specific risk factors contributing to the CRS score with recommended corrections. |
| **Trigger Condition** | CRS score > 7.0 (or payer-specific threshold) |
| **Required Data Inputs** | CRS model output, claim features, payer denial history, historical denial patterns for similar claims |
| **Human-in-the-Loop** | Always — this IS the human-in-the-loop mechanism for high-risk claims |
| **Confidence Threshold** | CRS model AUC > 0.85 |
| **Revenue Impact** | $310K-$480K/year (prevents submission of claims with >70% denial probability) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability), PR-D02 (Denial CARC Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R01 (Denial-driven loss decomposition) |
| **Connected Root Causes (Doc 2)** | All B3.* root causes detectable pre-submission |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A1.4 Auto-Resubmit Rejected Claims After Correction

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-04 |
| **Item Name** | Correctable Rejection Auto-Resubmission |
| **What It Does** | When a 277CA rejection returns with a correctable error code (format errors, missing fields, invalid member ID format), the system auto-corrects the claim and resubmits within 24 hours without human intervention. Non-correctable rejections route to the appropriate work queue. |
| **Trigger Condition** | 277CA rejection received with error code in auto-correctable list |
| **Required Data Inputs** | 277CA rejection data, correctable error code library, original claim data, patient demographics |
| **Human-in-the-Loop** | First 30 days: all. After: never for corrections with >90% historical success rate |
| **Confidence Threshold** | 90% historical success rate for that error type |
| **Revenue Impact** | $45K-$75K/year (eliminates 2-5 day delay per correctable rejection; prevents timely filing risk) |
| **Connected Predictions (Doc 4)** | PR-O03 (Timely Filing Risk Score) |
| **Connected Diagnostics (Doc 3)** | DS-D08 (EDI/clearinghouse errors) |
| **Connected Root Causes (Doc 2)** | B1.08 (EDI/clearinghouse errors), B3.14 (Missing information), B3.22 (Demographics error) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A1.5 Auto-Attach Required Documentation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-05 |
| **Item Name** | Documentation Auto-Attachment |
| **What It Does** | Automatically pulls and attaches required supporting documentation to claims based on payer requirements: operative reports for surgical claims, medical necessity letters for high-cost procedures, prior authorization numbers, referring physician orders, ABN forms for Medicare non-covered services. |
| **Trigger Condition** | Claim for procedure type that requires documentation attachment per payer rules |
| **Required Data Inputs** | Payer documentation requirement matrix, EHR clinical documents, auth system data, referring provider data, ABN repository |
| **Human-in-the-Loop** | First 30 days: all. After: auto-attach for standard documents; human review for clinical narrative summaries |
| **Confidence Threshold** | 95% — document must match claim with >95% confidence |
| **Revenue Impact** | $60K-$90K/year (prevents 30-40% of "additional information required" denials) |
| **Connected Predictions (Doc 4)** | PR-D01, PR-A02 (Prior Auth Approval Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D04 (Prior auth process breakdown), DS-P01 (Proprietary medical necessity criteria) |
| **Connected Root Causes (Doc 2)** | B3.06 (Insufficient documentation), B3.08 (Missing auth), B3.17 (Medical necessity) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### A1.6 Auto-Split/Combine Claims Per Payer Rules

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-06 |
| **Item Name** | Claim Split/Combine Optimization |
| **What It Does** | Automatically splits or combines claim lines based on payer-specific requirements: some payers require separate claims for professional and technical components; some require combining certain procedure groups into single claims; handles institutional vs professional claim type routing. |
| **Trigger Condition** | Claim contains line items that require splitting per payer rules, or multiple claims that should be combined |
| **Required Data Inputs** | Payer claim submission rules, CPT global/professional/technical component rules, payer-specific split/combine requirements |
| **Human-in-the-Loop** | First 30 days: all. After: auto for deterministic rules; human for ambiguous cases |
| **Confidence Threshold** | N/A — deterministic rules |
| **Revenue Impact** | $25K-$40K/year (prevents claim-level rejections from incorrect format) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change) |
| **Connected Root Causes (Doc 2)** | B3.14 (Missing/incorrect claim information), B2.01 (Proprietary payer criteria) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A1.7 Duplicate Claim Prevention

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CL-07 |
| **Item Name** | Duplicate Claim Detection and Prevention |
| **What It Does** | Scans outgoing claim batch against all claims submitted in the prior 180 days. Matches on patient + DOS + CPT + payer. Exact matches are blocked. Near-matches (same patient + DOS + different modifier or CPT in same family) are flagged for human review. Prevents duplicate submission penalties and payer audit triggers. |
| **Trigger Condition** | Claim enters submission batch |
| **Required Data Inputs** | Claims history (180 days), claim matching algorithms, payer duplicate claim rules |
| **Human-in-the-Loop** | Never for exact duplicates (auto-block). Always for near-matches. |
| **Confidence Threshold** | 99% for exact match block; 80% for near-match flag |
| **Revenue Impact** | $15K-$25K/year (prevents duplicate claim penalties + reduces payer audit risk) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality) |
| **Connected Root Causes (Doc 2)** | B3.11 (Duplicate claim) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

## A2. DENIAL AUTOMATION

### A2.1 Auto-Appeal Generation for High-Confidence Root Causes

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-01 |
| **Item Name** | AI-Driven Appeal Letter Generation |
| **What It Does** | For denials where the appeal win probability exceeds threshold and the root cause is clearly identified, the system auto-generates a payer-specific appeal letter. The letter includes: patient demographics, claim details, clinical evidence summary, specific payer policy citations, precedent reference, and corrective documentation. Letters are templated per payer per CARC with AI-personalized clinical narrative. |
| **Trigger Condition** | Denial received + PR-D05 win probability > 60% + root cause identified with >80% confidence |
| **Required Data Inputs** | Denial data (CARC/RARC), clinical documentation, payer policy database, appeal template library, historical appeal outcomes, PR-D05 model output |
| **Human-in-the-Loop** | First 30 days: all. After: 1-click approval for standard appeals; always for clinical appeals requiring physician attestation |
| **Confidence Threshold** | 80% root cause confidence + 60% appeal win probability |
| **Revenue Impact** | $220K-$380K/year (increases appeal volume 3x while reducing time-per-appeal from 45 min to 5 min) |
| **Connected Predictions (Doc 4)** | PR-D05 (Appeal Win Probability), PR-D06 (Appeal Recovery Amount) |
| **Connected Diagnostics (Doc 3)** | DS-R01 (Denial-driven loss), DS-D01-DS-D10 (all denial diagnostics) |
| **Connected Root Causes (Doc 2)** | All B3.* claim-level root causes |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### A2.2 Auto-Categorization of Denials by Root Cause

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-02 |
| **Item Name** | 7-Layer Root Cause Auto-Attribution |
| **What It Does** | Every incoming denial is automatically run through the 7-step root cause traversal (Doc 2, B3). The system assigns primary, secondary, and tertiary root causes with confidence weights. This replaces the manual process of denial analysts reading each remittance and categorizing by hand. |
| **Trigger Condition** | New denial (835 with non-zero adjustment) received |
| **Required Data Inputs** | CARC/RARC codes, claim history, payer denial patterns, auth status, eligibility history, coding audit flags, documentation completeness score |
| **Human-in-the-Loop** | Never for Tier 1 categorization. Human review when confidence < 70% on primary root cause. |
| **Confidence Threshold** | 70% for auto-assignment; below 70% routes to human review |
| **Revenue Impact** | $35K-$50K/year in labor savings (eliminates 2-3 FTE hours/day of manual categorization) |
| **Connected Predictions (Doc 4)** | PR-D02 (Denial CARC Prediction), PR-D09 (Denial $ Impact per Root Cause) |
| **Connected Diagnostics (Doc 3)** | All Section 2 diagnostics |
| **Connected Root Causes (Doc 2)** | All B1.*, B2.*, B3.* root causes (this IS the root cause engine) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 5 |

---

### A2.3 Auto-Routing to Correct Work Queue Based on Root Cause

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-03 |
| **Item Name** | Denial Smart-Routing |
| **What It Does** | After root cause attribution (AU-DN-02), denials are automatically routed to the correct work queue: coding errors to coding queue, auth issues to auth queue, eligibility to eligibility queue, clinical/medical necessity to CDI queue, payer errors to payer relations queue. Routing includes priority scoring. |
| **Trigger Condition** | Root cause assigned to denial |
| **Required Data Inputs** | Root cause category, work queue definitions, staff skill assignments, queue current depth, SLA timers |
| **Human-in-the-Loop** | Never — deterministic routing based on root cause |
| **Confidence Threshold** | N/A — follows root cause assignment |
| **Revenue Impact** | $28K-$42K/year (reduces denial resolution time by 3-5 days through elimination of manual triage) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R01 (Denial-driven loss) |
| **Connected Root Causes (Doc 2)** | All B3.* (routing destination determined by root cause category) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A2.4 Auto-Escalation When SLA Breached

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-04 |
| **Item Name** | SLA Breach Auto-Escalation |
| **What It Does** | Monitors denial resolution SLAs (e.g., initial review within 48 hours, appeal filed within 14 days, follow-up within 7 days of appeal). When SLA is breached or predicted to breach, auto-escalates to supervisor queue with: account details, time in queue, reason for delay, appeal deadline countdown. |
| **Trigger Condition** | Denial exceeds SLA threshold OR PR-O01 predicts breach within 24 hours |
| **Required Data Inputs** | Denial queue timestamps, SLA definitions per denial type, appeal deadlines, staff assignment, PR-O01 forecast |
| **Human-in-the-Loop** | Never — auto-escalation is alerting, not action-taking |
| **Confidence Threshold** | N/A — deterministic SLA calculation |
| **Revenue Impact** | $55K-$85K/year (prevents 15-20% of missed appeal deadlines worth $300K+) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume), PR-O04 (Appeal Deadline Risk) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.09 (Appeal deadline management) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A2.5 Batch Appeal Generation for Same-Root-Cause Clusters

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-05 |
| **Item Name** | Cluster Appeal Batch Generation |
| **What It Does** | Identifies clusters of denials sharing the same root cause (e.g., same payer + same CARC + same CPT family + same time window). Generates batch appeal packages with a cover letter explaining the systemic issue plus individual claim detail sheets. Enables filing 50-100 appeals in the time it takes to file 1 manually. |
| **Trigger Condition** | 5+ denials from same payer with same CARC within 30-day window |
| **Required Data Inputs** | Denial cluster analysis, root cause attribution, appeal template library, claim details for each denial in cluster |
| **Human-in-the-Loop** | Always — batch appeals require review before submission due to high dollar value |
| **Confidence Threshold** | 85% cluster confidence (root causes genuinely share same underlying cause) |
| **Revenue Impact** | $140K-$220K/year (unlocks appeals for low-dollar claims that are uneconomical individually but viable in batch) |
| **Connected Predictions (Doc 4)** | PR-D05 (Appeal Win Probability), PR-D08 (Payer Policy Change Detection) |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change), DS-P08 (Payer system errors) |
| **Connected Root Causes (Doc 2)** | B1.01 (Payer policy change), B2.08 (Payer system errors), any root cause producing clusters |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### A2.6 Auto-Close Denied Claims When Payment Received (Claim Washing Detection)

| Field | Detail |
|-------|--------|
| **Item ID** | AU-DN-06 |
| **Item Name** | Claim Washing Detection and Auto-Close |
| **What It Does** | Detects when a payer initially denies a claim but subsequently pays it (often without notifying the provider). Cross-references denial work queue against incoming ERAs. When payment is received for a claim currently in the denial queue, auto-closes the denial, posts the payment, and flags the payer behavior pattern for trend tracking. |
| **Trigger Condition** | ERA payment received for a claim currently in denial work queue |
| **Required Data Inputs** | Denial work queue, incoming ERA data, claim matching engine |
| **Human-in-the-Loop** | Never for auto-close when payment matches. Always when partial payment received (underpayment check needed). |
| **Confidence Threshold** | 98% claim match confidence |
| **Revenue Impact** | $18K-$30K/year (eliminates wasted appeal effort on 5-8% of denials that self-resolve; tracks payer behavior) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-P08 (Payer system errors) |
| **Connected Root Causes (Doc 2)** | B2.08 (Payer system errors) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

## A3. PAYMENT AUTOMATION

### A3.1 Auto-Post ERA Payments

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-01 |
| **Item Name** | ERA/835 Auto-Posting |
| **What It Does** | Parses incoming ERA/835 files, matches each payment line to the corresponding claim, posts payment amount, contractual adjustments, patient responsibility, and denial codes. Handles split payments, bundled adjustments, and multi-claim ERAs. Logs every posting for audit. |
| **Trigger Condition** | ERA/835 file received from clearinghouse |
| **Required Data Inputs** | ERA/835 data, open claims database, patient accounts, adjustment reason codes |
| **Human-in-the-Loop** | Never for matched payments (>98% match confidence). Human review for unmatched lines or unusual adjustments. |
| **Confidence Threshold** | 98% claim match confidence for auto-post |
| **Revenue Impact** | $65K-$95K/year in labor savings (eliminates 1-2 FTE of manual posting; reduces posting lag from 3-5 days to same-day) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction), PR-P05 (Payment Date Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A3.2 Auto-Match ERA to Bank Deposits

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-02 |
| **Item Name** | ERA-Bank Deposit Auto-Reconciliation |
| **What It Does** | Matches EFT deposits in bank account to corresponding ERA files using trace number (primary match), then amount + date (secondary match). Identifies matched, partially matched, and unmatched deposits. Flags variances exceeding threshold. |
| **Trigger Condition** | Bank deposit file received (daily) |
| **Required Data Inputs** | Bank deposit data (BAI2/OFX), ERA/835 trace numbers, EFT amounts, deposit dates |
| **Human-in-the-Loop** | Never for trace-number-matched deposits. Human review for fuzzy-matched or unmatched. |
| **Confidence Threshold** | 99% for trace number match; 95% for fuzzy match |
| **Revenue Impact** | $22K-$35K/year in labor savings (reduces reconciliation from 4 hours/day to 30 min/day) |
| **Connected Predictions (Doc 4)** | PR-B01 (Reconciliation Variance Forecast), PR-P06 (ERA-Bank Variance Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A3.3 Auto-Flag Silent Underpayments

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-03 |
| **Item Name** | Contract-vs-Paid Underpayment Detection |
| **What It Does** | Compares every ERA payment line against the contracted rate for that CPT + payer + POS combination. When paid amount is below contracted rate (beyond tolerance threshold), flags the claim for underpayment appeal. Tracks cumulative underpayment per payer per CPT for contract renegotiation evidence. |
| **Trigger Condition** | ERA payment posted AND contract rate loaded for that CPT-payer combination |
| **Required Data Inputs** | ERA payment data, contract rate tables, CPT-payer-POS fee schedules, tolerance thresholds |
| **Human-in-the-Loop** | Never for flagging. Human approval for filing underpayment appeals. |
| **Confidence Threshold** | N/A — deterministic comparison (requires contract rates loaded) |
| **Revenue Impact** | $183K-$275K/year (recovers 70-90% of silent underpayments; A1.02 is typically 21% of revenue shortfall) |
| **Connected Predictions (Doc 4)** | PR-P03 (Underpayment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R02 (Silent underpayments), DS-P03 (Underpayment strategy), DS-P09 (Contract fee schedule error) |
| **Connected Root Causes (Doc 2)** | A1.02 (Silent underpayment), B2.03 (Underpayment strategy), B2.09 (Contract fee schedule error) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A3.4 Auto-Generate Secondary Claims from Primary ERA

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-04 |
| **Item Name** | Secondary Claim Auto-Generation |
| **What It Does** | When primary ERA is posted and patient has secondary insurance on file, automatically generates and submits secondary claim with primary ERA attached as required by secondary payer. Handles coordination of benefits logic, applies secondary payer billing rules. |
| **Trigger Condition** | Primary ERA posted + secondary insurance active on patient account |
| **Required Data Inputs** | Primary ERA data, secondary insurance eligibility, COB rules, secondary payer submission requirements |
| **Human-in-the-Loop** | First 30 days: all. After: auto for standard COB; human review when primary denial or unusual adjustments present |
| **Confidence Threshold** | 95% secondary eligibility confirmed |
| **Revenue Impact** | $45K-$75K/year (captures 15-25% of secondary billing that is currently missed or delayed) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-P06 (COB disputes) |
| **Connected Root Causes (Doc 2)** | B3.10 (COB/wrong payer order), A1.04 (Dropped charges — secondary counts as dropped revenue if not billed) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A3.5 Auto-Patient Statement Generation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-05 |
| **Item Name** | Patient Statement Auto-Generation and Delivery |
| **What It Does** | After ERA posting determines patient responsibility, automatically generates patient statement with: service details, insurance paid amount, patient owes, payment options (online portal, payment plan, phone). Delivers via patient's preferred channel (email, portal, mail). Compliant with No Surprises Act and state billing regulations. |
| **Trigger Condition** | ERA posted + patient responsibility > $0 + all insurance adjudication complete |
| **Required Data Inputs** | ERA data, patient responsibility amount, patient contact preferences, payment portal URL, Good Faith Estimate data (if applicable) |
| **Human-in-the-Loop** | Never for standard statements. Human review for balances > $5,000 or disputed accounts. |
| **Confidence Threshold** | N/A — deterministic (triggered by ERA posting completion) |
| **Revenue Impact** | $32K-$48K/year (accelerates patient collection cycle by 10-15 days; reduces statement generation labor) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability), PR-A04 (Patient Out-of-Pocket Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A3.6 Auto-Refund Detection for Overpayments

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-06 |
| **Item Name** | Overpayment Detection and Refund Alert |
| **What It Does** | Monitors for overpayment scenarios: duplicate payments from same payer, payment exceeding billed amount, payment on denied-then-paid claims, recoupment notices without corresponding refund. Calculates refund amount and generates refund recommendation. Tracks refund obligations for compliance. |
| **Trigger Condition** | Payment posted that creates credit balance on account OR payer recoupment notice received |
| **Required Data Inputs** | Payment history per claim, billed amounts, payer credit balance reports, recoupment notices |
| **Human-in-the-Loop** | Always — refund decisions require financial authority approval |
| **Confidence Threshold** | 95% overpayment confirmed before generating refund recommendation |
| **Revenue Impact** | $12K-$20K/year in compliance risk avoidance (False Claims Act exposure for retaining overpayments) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied payments — overpayments are a subset) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A3.7 Auto-Contractual Adjustment Validation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-PM-07 |
| **Item Name** | Contractual Adjustment Reasonableness Check |
| **What It Does** | Validates that contractual adjustments on ERA match expected adjustments based on contract terms. Flags adjustments that are larger than expected (potential underpayment disguised as contractual), adjustments on non-contracted CPTs, and adjustments using incorrect group codes. |
| **Trigger Condition** | ERA posted with contractual adjustment (CO-45, CO-253) |
| **Required Data Inputs** | ERA adjustment data, contract rate tables, expected adjustment calculations, group code rules |
| **Human-in-the-Loop** | Never for flagging. Human decision on whether to dispute. |
| **Confidence Threshold** | N/A — deterministic comparison |
| **Revenue Impact** | $40K-$65K/year (catches 5-10% of contractual adjustments that are actually underpayments) |
| **Connected Predictions (Doc 4)** | PR-P03 (Underpayment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R02 (Silent underpayments), DS-P09 (Contract fee schedule error) |
| **Connected Root Causes (Doc 2)** | A1.02 (Silent underpayment), B2.09 (Contract fee schedule error) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

## A4. COLLECTIONS AUTOMATION

### A4.1 Auto-Prioritize Collection Queue by Propensity x Dollar Value

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-01 |
| **Item Name** | Propensity-Weighted Collection Queue Prioritization |
| **What It Does** | Scores every patient account in the collection queue by: (propensity-to-pay score x balance amount x aging factor x payer type weight). Reorders queue daily so collectors work highest-expected-value accounts first. Accounts with high balance but low propensity are flagged for financial assistance screening, not aggressive collection. |
| **Trigger Condition** | Daily queue refresh (6:00 AM) |
| **Required Data Inputs** | Patient balances, PR-P04 propensity scores, aging buckets, payer type, payment history, contact history |
| **Human-in-the-Loop** | Never — prioritization is advisory, not action-taking |
| **Confidence Threshold** | PR-P04 AUC > 0.80 |
| **Revenue Impact** | $85K-$130K/year (increases collector efficiency 25-40% by working highest-value accounts first) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability), PR-R05 (Bad Debt Projection) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A4.2 Auto-Escalation Rules Based on ADTP

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-02 |
| **Item Name** | ADTP-Driven Payer Follow-Up Escalation |
| **What It Does** | Monitors claim age against payer-specific ADTP. When a claim exceeds ADTP + 1.5 standard deviations without payment, auto-escalates to payer follow-up queue. Generates payer call script with claim details, submission date, expected payment date (per ADTP), and days overdue. |
| **Trigger Condition** | Claim age > payer ADTP + 1.5 sigma |
| **Required Data Inputs** | Claim submission dates, payer ADTP calculations, claim status, payment history |
| **Human-in-the-Loop** | Never for escalation. Human performs the payer follow-up call. |
| **Confidence Threshold** | N/A — statistical threshold |
| **Revenue Impact** | $55K-$80K/year (accelerates collection on slow-paying claims by 10-20 days) |
| **Connected Predictions (Doc 4)** | PR-P01 (ADTP Forecast by Payer), PR-P05 (Payment Date Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs), DS-P10 (Payer financial stress) |
| **Connected Root Causes (Doc 2)** | A2.01 (ADTP anomaly), B2.10 (Payer financial stress) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A4.3 Auto-Payment Plan Setup for Qualifying Patients

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-03 |
| **Item Name** | Pre-Approved Payment Plan Auto-Offer |
| **What It Does** | For patients with balances above threshold and propensity score in the "willing but unable to pay full" range (40-70%), automatically generates a pre-approved payment plan offer via patient portal or email. Plan terms calculated based on balance amount, propensity score, and organizational payment plan policies. |
| **Trigger Condition** | Patient balance > $500 + propensity score 40-70% + no existing payment plan |
| **Required Data Inputs** | Patient balance, propensity score, payment plan policy rules, patient contact info, portal access |
| **Human-in-the-Loop** | First 30 days: all. After: auto-offer for standard plans within policy limits; human for custom terms. |
| **Confidence Threshold** | PR-P04 propensity model validated |
| **Revenue Impact** | $42K-$65K/year (converts 20-30% of accounts that would otherwise go to bad debt into payment plans) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability), PR-R05 (Bad Debt Projection) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A4.4 Auto-Statement Generation and Delivery

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-04 |
| **Item Name** | Automated Statement Cycle Management |
| **What It Does** | Manages the full patient statement cycle: initial statement at 0 days, reminder at 30 days, final notice at 60 days, pre-collection notice at 90 days. Each statement escalates in urgency and includes updated balance, payment options, and financial assistance information. Delivery channel optimized per patient preference and engagement data. |
| **Trigger Condition** | Patient balance aging milestones (0/30/60/90 days) |
| **Required Data Inputs** | Patient balance, aging, payment history, contact preferences, statement templates, financial assistance eligibility criteria |
| **Human-in-the-Loop** | Never for standard cycle. Human review before pre-collection (90-day) notice. |
| **Confidence Threshold** | N/A — deterministic cycle |
| **Revenue Impact** | $28K-$42K/year (increases patient self-pay collection rate by 8-12%) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A4.5 Auto-Follow-Up Scheduling

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-05 |
| **Item Name** | Intelligent Follow-Up Auto-Scheduling |
| **What It Does** | After every collection activity (call, letter, portal message), auto-schedules the next follow-up based on: outcome of current activity, patient response pattern, propensity score, and optimal contact timing model. Broken promises-to-pay automatically accelerate follow-up. |
| **Trigger Condition** | Collection activity completed OR promise-to-pay deadline passed without payment |
| **Required Data Inputs** | Collection activity log, patient response history, propensity score, promise-to-pay records, optimal timing model |
| **Human-in-the-Loop** | Never — scheduling is advisory |
| **Confidence Threshold** | N/A — rule-based with propensity weighting |
| **Revenue Impact** | $18K-$28K/year (reduces missed follow-ups by 60%; optimizes collector time allocation) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt), B6.04 (Process delays) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 6 |

---

### A4.6 Auto-Write-Off Recommendation for Uncollectable Balances

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CO-06 |
| **Item Name** | Uncollectable Balance Write-Off Recommendation |
| **What It Does** | Identifies patient accounts meeting write-off criteria: balance aging > 180 days + propensity < 15% + 3+ failed contact attempts + no payment plan + not eligible for financial assistance. Generates write-off recommendation with supporting evidence for financial authority approval. Calculates tax implication of charity care vs bad debt classification. |
| **Trigger Condition** | Account meets all write-off criteria thresholds |
| **Required Data Inputs** | Account aging, propensity score, contact history, financial assistance screening results, write-off policy, IRS 501(r) requirements |
| **Human-in-the-Loop** | Always — write-off requires financial authority approval |
| **Confidence Threshold** | 90% confidence that balance is uncollectable |
| **Revenue Impact** | $15K-$25K/year in operational savings (stops spending $180+ per account working uncollectable balances) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability), PR-R05 (Bad Debt Projection) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

## A5. ELIGIBILITY & ACCESS AUTOMATION

### A5.1 Auto-Eligibility Verification (Batch and Real-Time)

| Field | Detail |
|-------|--------|
| **Item ID** | AU-EA-01 |
| **Item Name** | Dual-Mode Eligibility Verification |
| **What It Does** | Runs eligibility checks in two modes: (1) Batch mode: nightly 270/271 for all patients with appointments in the next 72 hours. (2) Real-time mode: instant 270/271 at registration/check-in. Flags inactive coverage, terminated plans, changed benefits, exhausted benefits, and incorrect member IDs. Auto-updates patient insurance record with verified data. |
| **Trigger Condition** | Batch: nightly at 2:00 AM for appointments in next 72 hours. Real-time: patient check-in event. |
| **Required Data Inputs** | Patient demographics, insurance on file, appointment schedule, payer 270/271 endpoints |
| **Human-in-the-Loop** | Never for verification. Human intervention when coverage is terminated or unverifiable. |
| **Confidence Threshold** | N/A — payer response is deterministic |
| **Revenue Impact** | $120K-$180K/year (prevents 60-80% of eligibility denials; CO-27 is typically 8-12% of total denials) |
| **Connected Predictions (Doc 4)** | PR-A01 (Coverage Termination Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D03 (Eligibility verification failure) |
| **Connected Root Causes (Doc 2)** | B3.09 (Inactive coverage), B6.01 (Eligibility verification failure) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A5.2 Auto-Prior Authorization Submission

| Field | Detail |
|-------|--------|
| **Item ID** | AU-EA-02 |
| **Item Name** | Prior Authorization Auto-Initiation |
| **What It Does** | When a procedure requiring prior authorization is scheduled, auto-initiates the PA request. Populates the request with: patient demographics, insurance data, procedure details, clinical indications from EHR, supporting documentation. Submits via payer portal (API or RPA). Tracks authorization status and alerts when approved or denied. |
| **Trigger Condition** | Procedure scheduled + CPT appears on payer PA-required list |
| **Required Data Inputs** | Payer PA-required procedure lists (updated quarterly), clinical documentation, patient insurance data, procedure details, payer PA submission endpoints |
| **Human-in-the-Loop** | First 30 days: all. After: auto-submit for standard procedures; human review for complex/high-cost procedures or when clinical narrative required. |
| **Confidence Threshold** | 95% PA requirement match confirmation |
| **Revenue Impact** | $95K-$150K/year (prevents 70-85% of auth-related denials; reduces PA turnaround from 5 days to 2 days) |
| **Connected Predictions (Doc 4)** | PR-A02 (Prior Auth Approval Prediction), PR-A03 (Auth Turnaround Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D04 (Prior auth process breakdown), DS-P02 (PA requirement expansion) |
| **Connected Root Causes (Doc 2)** | B3.07 (No prior auth obtained), B3.08 (Auth expired/insufficient), B1.04 (Prior auth process breakdown) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### A5.3 Auto-Coverage Discovery

| Field | Detail |
|-------|--------|
| **Item ID** | AU-EA-03 |
| **Item Name** | Insurance Coverage Auto-Discovery |
| **What It Does** | For patients registering as self-pay or with terminated coverage, automatically searches payer databases and coverage discovery services to identify active insurance. When coverage found, auto-updates patient record and routes to registration for confirmation. Reduces self-pay write-offs and improves payer mix. |
| **Trigger Condition** | Patient registers as self-pay OR eligibility check returns terminated/inactive |
| **Required Data Inputs** | Patient demographics (name, DOB, SSN last 4), coverage discovery service endpoints, Medicaid eligibility databases |
| **Human-in-the-Loop** | Always — discovered coverage must be confirmed with patient before claim submission |
| **Confidence Threshold** | 85% match confidence for coverage discovery |
| **Revenue Impact** | $65K-$110K/year (converts 10-15% of self-pay patients to insured; avg claim value increase of $2,800 per conversion) |
| **Connected Predictions (Doc 4)** | PR-A01 (Coverage Termination Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D03 (Eligibility verification failure), DS-P06 (COB disputes) |
| **Connected Root Causes (Doc 2)** | B3.09 (Inactive coverage), B6.01 (Eligibility verification failure) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A5.4 Auto-COB Detection and Claim Routing

| Field | Detail |
|-------|--------|
| **Item ID** | AU-EA-04 |
| **Item Name** | Coordination of Benefits Auto-Detection |
| **What It Does** | Identifies patients with multiple active insurance coverages during eligibility verification. Determines correct primary/secondary/tertiary order using COB rules (birthday rule, gender rule, COBRA, Medicare Secondary Payer). Auto-routes claims to correct payer in correct order. Flags conflicting COB information for human resolution. |
| **Trigger Condition** | Eligibility verification returns multiple active coverages OR patient reports additional insurance |
| **Required Data Inputs** | Eligibility responses from all payers, COB determination rules, patient-reported insurance data, Medicare Secondary Payer questionnaire |
| **Human-in-the-Loop** | Auto for standard COB (birthday rule). Human for ambiguous situations (divorce, custody, COBRA). |
| **Confidence Threshold** | 90% COB order determination confidence |
| **Revenue Impact** | $35K-$55K/year (prevents 40-60% of COB denials and ensures maximum collection across multiple payers) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-P06 (COB disputes) |
| **Connected Root Causes (Doc 2)** | B3.10 (COB/wrong payer order) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A5.5 Auto-Patient Responsibility Estimation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-EA-05 |
| **Item Name** | Real-Time Patient Cost Estimate |
| **What It Does** | At the time of scheduling or registration, calculates the patient's estimated out-of-pocket cost based on: verified benefits, deductible status (met/remaining), coinsurance rate, copay amount, contracted rate for scheduled procedures, and any applicable caps. Presents estimate to patient for upfront collection and No Surprises Act compliance. |
| **Trigger Condition** | Appointment scheduled + eligibility verified + benefits loaded |
| **Required Data Inputs** | Verified benefits (270/271), deductible accumulator, contracted rates, scheduled CPT codes, patient cost-sharing structure |
| **Human-in-the-Loop** | Never for standard estimates. Human review for complex multi-day stays or bundled procedures. |
| **Confidence Threshold** | Target: within $50 of actual for 80% of estimates |
| **Revenue Impact** | $55K-$85K/year (increases point-of-service collection by 20-35%; reduces bad debt; NSA compliance) |
| **Connected Predictions (Doc 4)** | PR-A04 (Patient Out-of-Pocket Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

## A6. CODING AUTOMATION

### A6.1 Auto-Code Suggestion Based on Clinical Documentation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CD-01 |
| **Item Name** | NLP-Driven Code Suggestion Engine |
| **What It Does** | Analyzes clinical documentation (operative reports, H&P, discharge summaries) using NLP to suggest: primary and secondary ICD-10 codes, CPT/HCPCS codes, DRG assignment. Presents suggestions to coder as a starting point, not final assignment. Highlights documentation excerpts supporting each suggested code. |
| **Trigger Condition** | Clinical documentation available for coding |
| **Required Data Inputs** | Clinical documentation (free text), procedure notes, discharge summaries, ICD-10/CPT code databases, encoder logic |
| **Human-in-the-Loop** | Always — coder must review and approve/modify all code suggestions (regulatory requirement) |
| **Confidence Threshold** | 85% for suggestion display; confidence shown to coder for each suggestion |
| **Revenue Impact** | $48K-$72K/year (increases coder productivity 20-30%; reduces coding turnaround by 1-2 days) |
| **Connected Predictions (Doc 4)** | PR-O05 (Coding Turnaround Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R05 (Downcoding), DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | A1.05 (Coding downcoding), B3.01 (Wrong CPT), B3.03 (Wrong DRG) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### A6.2 Auto-Modifier Assignment Based on Payer Rules

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CD-02 |
| **Item Name** | Payer-Specific Modifier Auto-Assignment |
| **What It Does** | Applies required modifiers based on payer-specific rules: -25 for significant E&M with procedure, -59/-XE/-XP/-XS/-XU for distinct procedural service per NCCI, -TC/-26 for professional/technical component split, bilateral modifiers, ASC modifiers. Validates modifier combinations and flags conflicts. |
| **Trigger Condition** | Claim coded + payer identified |
| **Required Data Inputs** | CPT codes on claim, payer modifier rules, NCCI modifier indicators, POS, provider type |
| **Human-in-the-Loop** | First 30 days: all. After: auto for deterministic rules (modifier indicators 0, 1, 9); human for clinical judgment modifiers (-25, -59). |
| **Confidence Threshold** | N/A for deterministic modifiers; 90% for AI-suggested modifiers |
| **Revenue Impact** | $35K-$55K/year (prevents 25-35% of modifier-related denials) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability) |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B3.02 (Wrong modifier), B3.15 (NCCI edit failure) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A6.3 Auto-DRG Optimization

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CD-03 |
| **Item Name** | DRG Assignment Optimization |
| **What It Does** | For inpatient claims, compares assigned DRG to the optimal DRG supported by clinical documentation. Identifies when documentation supports a higher-weighted DRG (with complication/comorbidity or major complication/comorbidity) that was not captured. Generates CDI query to attending physician when documentation could support higher DRG. |
| **Trigger Condition** | Inpatient claim coded + DRG assigned |
| **Required Data Inputs** | ICD-10 codes, DRG grouper output, clinical documentation, CC/MCC capture rates, expected DRG based on clinical indicators |
| **Human-in-the-Loop** | Always — CDI specialist and physician must validate; coder makes final code assignment |
| **Confidence Threshold** | 80% that documentation supports higher DRG |
| **Revenue Impact** | $120K-$200K/year (increases CMI capture by 0.02-0.05 points; avg DRG uplift = $2,400 per optimized case) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R05 (Downcoding), DS-D05 (CDI program weakness) |
| **Connected Root Causes (Doc 2)** | A1.05 (Coding downcoding), B3.03 (Wrong DRG), B1.05 (CDI program weakness) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### A6.4 Auto-Charge Capture from Procedure Documentation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CD-04 |
| **Item Name** | Procedure-to-Charge Auto-Capture |
| **What It Does** | Monitors EHR procedure documentation and automatically generates charges when procedures are documented but no corresponding charge exists within 48 hours. Covers: surgical procedures, infusion therapy, imaging, lab orders, injections, and supplies. Compares encounter count to charge count by department daily. |
| **Trigger Condition** | Procedure documented in EHR + no corresponding charge within 48 hours |
| **Required Data Inputs** | EHR procedure documentation, charge capture system, CDM (Charge Description Master), department-level encounter-to-charge ratios |
| **Human-in-the-Loop** | Always — charge must be confirmed by department before posting |
| **Confidence Threshold** | 90% procedure-to-CPT match confidence |
| **Revenue Impact** | $78K-$120K/year (captures 80-95% of dropped charges; A1.04 is typically $78K on a $50M practice) |
| **Connected Predictions (Doc 4)** | PR-R03 (Monthly Net Revenue Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R04 (Dropped charges) |
| **Connected Root Causes (Doc 2)** | A1.04 (Unbilled/dropped charges), B6.08 (Charge capture gaps) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### A6.5 Auto-CDI Query Generation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-CD-05 |
| **Item Name** | AI-Driven CDI Query Generation |
| **What It Does** | Analyzes clinical documentation in real-time during patient stay to identify documentation gaps that affect coding accuracy and revenue capture. Auto-generates physician queries for: missing specificity (e.g., acute vs chronic), missing severity (CC/MCC indicators), missing linkage between conditions and treatments, opportunities for more specific diagnosis coding. |
| **Trigger Condition** | Concurrent review trigger: admission for high-risk DRGs, documentation gap detected by NLP, clinical indicators present without corresponding documentation |
| **Required Data Inputs** | Clinical documentation, lab results, medication administration records, DRG target list, CDI query templates, physician response history |
| **Human-in-the-Loop** | Always — CDI specialist reviews query before sending to physician |
| **Confidence Threshold** | 80% documentation gap confidence |
| **Revenue Impact** | $95K-$160K/year (increases query rate by 30-50%; CDI program ROI improves from 3:1 to 5:1) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R05 (Downcoding), DS-D05 (CDI program weakness) |
| **Connected Root Causes (Doc 2)** | A1.05 (Coding downcoding), B1.05 (CDI program weakness), B3.05 (Missing specificity) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 8 |

---

## A7. RECONCILIATION AUTOMATION

### A7.1 Auto-ERA-Bank Matching

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RC-01 |
| **Item Name** | Multi-Layer ERA-Bank Reconciliation |
| **What It Does** | Performs daily automated reconciliation between ERA payments and bank deposits using a 3-layer matching approach: Layer 1 (trace number exact match), Layer 2 (amount + date + payer fuzzy match), Layer 3 (pattern-based match using historical payer deposit patterns). Reports match rate, variance, and unmatched items daily. |
| **Trigger Condition** | Bank deposit file received (daily) + ERA files available |
| **Required Data Inputs** | Bank deposit data (BAI2/OFX), ERA/835 files, payer EFT trace numbers, historical deposit patterns |
| **Human-in-the-Loop** | Never for Layer 1 matches. Human review for Layer 2/3 matches and all unmatched items. |
| **Confidence Threshold** | 99% Layer 1; 95% Layer 2; 85% Layer 3 |
| **Revenue Impact** | $22K-$35K/year in labor savings (see AU-PM-02 — same function, listed here for reconciliation context) |
| **Connected Predictions (Doc 4)** | PR-B01 (Reconciliation Variance Forecast), PR-B02 (Ghost Payment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A7.2 Auto-Variance Identification

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RC-02 |
| **Item Name** | Reconciliation Variance Auto-Detection |
| **What It Does** | Identifies and categorizes all variances between ERA-stated amounts and bank-deposited amounts. Categories: float variances (timing), payer withhold variances, processing fee deductions, recoupment offsets, and true discrepancies. Each variance type has a different resolution workflow. |
| **Trigger Condition** | ERA-bank match completed with variance > $50 |
| **Required Data Inputs** | Matched ERA-bank data, variance thresholds, payer float patterns, known withhold schedules |
| **Human-in-the-Loop** | Never for categorization. Human decision for resolution of true discrepancies. |
| **Confidence Threshold** | 85% variance categorization confidence |
| **Revenue Impact** | $15K-$25K/year (identifies and resolves variances 5-10 days faster; prevents month-end reconciliation surprises) |
| **Connected Predictions (Doc 4)** | PR-B01 (Reconciliation Variance Forecast), PR-P06 (ERA-Bank Variance Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A7.3 Auto-Posting of Matched Transactions

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RC-03 |
| **Item Name** | Reconciled Transaction Auto-Posting |
| **What It Does** | When ERA-bank match is confirmed (Layer 1 match), automatically posts the reconciled transaction to the general ledger. Creates journal entries for: payment revenue, contractual adjustments, patient responsibility transfers, and withhold reserves. |
| **Trigger Condition** | ERA-bank Layer 1 match confirmed |
| **Required Data Inputs** | Matched transaction data, GL account mapping, posting rules, period status (open/closed) |
| **Human-in-the-Loop** | Never for standard posting. Human approval for posting to closed periods or posting amounts > $50K. |
| **Confidence Threshold** | 99% match confidence for auto-post |
| **Revenue Impact** | $12K-$18K/year in labor savings (eliminates manual GL posting for 85-90% of transactions) |
| **Connected Predictions (Doc 4)** | PR-B03 (Period Close Date Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A7.4 Auto-Flag Unmatched Deposits

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RC-04 |
| **Item Name** | Ghost Payment / Unmatched Deposit Alert |
| **What It Does** | When bank deposits cannot be matched to any ERA within 72 hours, flags them as potential ghost payments. Generates investigation packet: deposit amount, date, depositing entity (if available), possible ERA matches with low confidence, and payer contact information for ERA reissue request. |
| **Trigger Condition** | Bank deposit unmatched after 72 hours |
| **Required Data Inputs** | Unmatched bank deposits, ERA inventory, payer deposit patterns, contact information for ERA reissue |
| **Human-in-the-Loop** | Always — ghost payment resolution requires payer contact and investigation |
| **Confidence Threshold** | N/A — absence of match triggers flag |
| **Revenue Impact** | $18K-$30K/year (resolves 85-95% of ghost payments that would otherwise sit in unapplied for 90+ days) |
| **Connected Predictions (Doc 4)** | PR-B02 (Ghost Payment Probability) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A7.5 Auto-Close Reconciled Periods

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RC-05 |
| **Item Name** | Period Close Auto-Completion |
| **What It Does** | Monitors reconciliation completeness for each accounting period. When all criteria are met (all ERAs posted, all bank deposits matched, all variances resolved or documented, all GL entries posted), automatically marks the period as reconciled. Generates period close summary report with key metrics. |
| **Trigger Condition** | All reconciliation criteria met for a given period |
| **Required Data Inputs** | Period reconciliation checklist status, open items count, unresolved variances, GL posting status |
| **Human-in-the-Loop** | Always — CFO/controller must approve period close |
| **Confidence Threshold** | 100% — all criteria must be met (deterministic) |
| **Revenue Impact** | $8K-$12K/year in labor savings (reduces month-end close by 1-2 days) |
| **Connected Predictions (Doc 4)** | PR-B03 (Period Close Date Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R06 (Unapplied payments) |
| **Connected Root Causes (Doc 2)** | A1.06 (Unapplied/unposted payments) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 7 |

---

## A8. REPORTING & COMPLIANCE AUTOMATION

### A8.1 Auto-Report Generation and Distribution

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-01 |
| **Item Name** | Scheduled Report Auto-Generation |
| **What It Does** | Generates and distributes all standard RCM reports on schedule: daily cash reports, weekly denial trending, monthly financial summaries, quarterly payer performance reviews, annual benchmarking reports. Each report auto-populates with current data and distributes to configured recipients via email/portal. |
| **Trigger Condition** | Report schedule triggers (daily/weekly/monthly/quarterly/annual) |
| **Required Data Inputs** | All NEXUS data warehoused metrics, report templates, distribution lists, delivery preferences |
| **Human-in-the-Loop** | Never for standard reports. Human configuration for new report types. |
| **Confidence Threshold** | N/A — data-driven reporting |
| **Revenue Impact** | $15K-$22K/year in labor savings (eliminates 8-12 hours/week of manual report generation) |
| **Connected Predictions (Doc 4)** | All PR-* predictions feed reports |
| **Connected Diagnostics (Doc 3)** | All DS-* diagnostics feed reports |
| **Connected Root Causes (Doc 2)** | All root causes surfaced in reports |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A8.2 Auto-Compliance Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-02 |
| **Item Name** | Compliance Risk Auto-Monitoring |
| **What It Does** | Continuously monitors for compliance risk indicators: upcoding patterns exceeding specialty benchmarks, unbundling patterns matching OIG work plan targets, billing patterns matching known FCA risk profiles, HIPAA breach indicators in claim data, No Surprises Act violation risks. Generates real-time alerts to compliance officer. |
| **Trigger Condition** | Any compliance risk indicator exceeds threshold |
| **Required Data Inputs** | Coding patterns by provider/specialty, OIG work plan targets, national benchmarks, billing pattern analysis, GFE/NSA compliance data |
| **Human-in-the-Loop** | Always — compliance decisions require human judgment and legal counsel |
| **Confidence Threshold** | 75% risk confidence for alert generation |
| **Revenue Impact** | $50K-$500K/year in compliance risk avoidance (FCA penalties average $11K-$23K per claim) |
| **Connected Predictions (Doc 4)** | PR-D01 (patterns that could indicate compliance risk) |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B3.01 (Wrong CPT), B3.04 (Unbundling), B1.02 (Coding quality decline) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### A8.3 Auto-Audit Trail Logging

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-03 |
| **Item Name** | Comprehensive Automation Audit Trail |
| **What It Does** | Every automated action across the platform is logged with: timestamp, action taken, triggering event, data inputs used, confidence score at time of action, outcome, user who approved (if applicable). Audit trail is immutable, tamper-evident, and queryable. Supports RAC audit defense, compliance investigations, and process improvement. |
| **Trigger Condition** | Any automated action occurs |
| **Required Data Inputs** | Action metadata, user context, system state at time of action |
| **Human-in-the-Loop** | Never — logging is passive observation |
| **Confidence Threshold** | N/A — all actions logged regardless of confidence |
| **Revenue Impact** | $25K-$40K/year in audit defense value (reduces RAC audit response time from weeks to hours) |
| **Connected Predictions (Doc 4)** | All — every prediction action is logged |
| **Connected Diagnostics (Doc 3)** | All — every diagnostic action is logged |
| **Connected Root Causes (Doc 2)** | All — every root cause assignment is logged |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A8.4 Auto-Regulatory Filing Preparation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-04 |
| **Item Name** | Regulatory Filing Auto-Preparation |
| **What It Does** | Prepares data packages for required regulatory filings: Medicare cost reports, Medicaid reporting, state-specific reporting requirements, DSH (Disproportionate Share Hospital) calculations, 340B program reporting. Gathers required data elements, validates completeness, and generates draft filings for human review. |
| **Trigger Condition** | Regulatory filing deadline approaching (90/60/30 days) |
| **Required Data Inputs** | Claims data, cost accounting data, patient demographics, payer mix data, regulatory filing templates, historical filings |
| **Human-in-the-Loop** | Always — regulatory filings require expert review and attestation |
| **Confidence Threshold** | N/A — data compilation is deterministic |
| **Revenue Impact** | $20K-$35K/year in labor savings and compliance risk avoidance |
| **Connected Predictions (Doc 4)** | PR-R03 (Monthly Net Revenue Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R09 (Service line mix shift — informs cost report) |
| **Connected Root Causes (Doc 2)** | A1.09 (Service line mix shift — regulatory reporting connection) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 8 |

---

### A8.5 Auto-Payer Rule Update Notification

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-05 |
| **Item Name** | Payer Policy Change Auto-Detection and Distribution |
| **What It Does** | Monitors denial patterns for sudden shifts indicating payer policy changes (PR-D08). When detected, auto-generates notification to billing, coding, and CDI teams with: what changed, which CPTs/DRGs affected, effective date estimate, recommended scrubber rule updates, and retroactive appeal opportunity for claims denied since change. |
| **Trigger Condition** | PR-D08 detects change point in payer denial patterns |
| **Required Data Inputs** | Payer denial trend data, change point detection output, affected claim inventory, scrubber rule database |
| **Human-in-the-Loop** | Auto-notification is automatic. Human decision on scrubber rule update and retroactive appeal campaign. |
| **Confidence Threshold** | 90% change point detection confidence |
| **Revenue Impact** | $45K-$75K/year (detects policy changes 2-4 weeks faster than manual monitoring; prevents 200-500 denials during detection gap) |
| **Connected Predictions (Doc 4)** | PR-D08 (Payer Policy Change Detection) |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change) |
| **Connected Root Causes (Doc 2)** | B1.01 (Payer policy change), B2.01-B2.05 (All payer-level root causes) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A8.6 Auto-Feedback Loop Update

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-06 |
| **Item Name** | Model Feedback Loop Auto-Processing |
| **What It Does** | When any prediction outcome is known (appeal resolved, payment received, denial overturned), automatically feeds the result back into all relevant models: CRS score recalibration, appeal win rate update, ADTP recalculation, root cause weight adjustment, payer fingerprint update. This is the learning engine that makes NEXUS smarter over time. |
| **Trigger Condition** | Outcome data received for any prediction (ERA, appeal decision, denial resolution) |
| **Required Data Inputs** | Prediction that was made, actual outcome, delta between prediction and actual, feature values at time of prediction |
| **Human-in-the-Loop** | Never — continuous learning is fully automated |
| **Confidence Threshold** | N/A — all outcomes feed back regardless |
| **Revenue Impact** | $80K-$130K/year (continuous model improvement drives 1-3% better prediction accuracy per quarter; compounds) |
| **Connected Predictions (Doc 4)** | All PR-* predictions (this IS the feedback mechanism) |
| **Connected Diagnostics (Doc 3)** | All — improved predictions improve diagnostics |
| **Connected Root Causes (Doc 2)** | All — improved root cause attribution improves everything downstream |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### A8.7 Auto-Prevention Rule Generation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-RP-07 |
| **Item Name** | Recurrence-Based Prevention Rule Proposal |
| **What It Does** | When the same root cause is identified 3+ times for the same payer + CARC + CPT combination, auto-generates a proposed prevention rule: "Add pre-submission check for [specific condition] on [payer] claims with [CPT]." Prevention rule is drafted with logic, affected claim volume, and projected denial prevention value. |
| **Trigger Condition** | Root cause B3.* identified >= 3 times for same payer + CARC + CPT within 90 days |
| **Required Data Inputs** | Root cause history, denial patterns, claim characteristics, scrubber rule database |
| **Human-in-the-Loop** | Always — new prevention rules must be approved before activation |
| **Confidence Threshold** | 85% recurrence pattern confidence |
| **Revenue Impact** | $35K-$55K/year (each new prevention rule prevents 10-50 denials/quarter; value compounds as rule library grows) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability — improved by new rules) |
| **Connected Diagnostics (Doc 3)** | DS-D01-DS-D10 (all denial diagnostics feed rule generation) |
| **Connected Root Causes (Doc 2)** | All B3.* root causes (recurrence drives rule creation) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

## A9. OPERATIONAL AUTOMATION

### A9.1 Auto-Work-Queue Load Balancing

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-01 |
| **Item Name** | Dynamic Work Queue Rebalancing |
| **What It Does** | Monitors work queue depth across all staff and automatically redistributes tasks when imbalances detected. Considers: staff skill level (don't assign surgical coding to a coder without surgical experience), current queue depth, task priority, SLA urgency, and staff PTO calendar. Rebalances in real-time as new work enters queues. |
| **Trigger Condition** | Queue imbalance detected (any queue > 1.5x team average) OR staff capacity change (PTO, login/logout) |
| **Required Data Inputs** | Queue depths, staff skill matrices, task complexity ratings, SLA timers, PTO calendar, PR-O02 capacity forecast |
| **Human-in-the-Loop** | Never — rebalancing is advisory optimization |
| **Confidence Threshold** | N/A — deterministic rules with capacity model |
| **Revenue Impact** | $22K-$35K/year (reduces SLA breaches by 30-40%; improves staff utilization by 15-20%) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume), PR-O02 (Staffing Needs) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing — queue delays are a common cause) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.10 (Process bottleneck) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A9.2 Auto-Credential Expiration Alert

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-02 |
| **Item Name** | Provider Credential Expiration Auto-Monitoring |
| **What It Does** | Tracks all provider credentials across all payers. Generates escalating alerts at 120/90/60/30/14/7 days before expiration. Auto-initiates renewal paperwork when templates are available. Calculates revenue at risk if credential expires (scheduled claims x average reimbursement). Auto-holds scheduling for non-credentialed providers when credential expires. |
| **Trigger Condition** | Credential expiration date within 120 days |
| **Required Data Inputs** | Provider enrollment database, credential expiration dates, payer credentialing requirements, scheduled patient volume per provider, average reimbursement per provider |
| **Human-in-the-Loop** | Auto-alert and auto-initiate renewal paperwork. Human completes credential renewal. |
| **Confidence Threshold** | N/A — deterministic date tracking |
| **Revenue Impact** | $15K-$30K/year (prevents credentialing gap denials; A1.10 is typically $3K in denials but prevention saves 100%) |
| **Connected Predictions (Doc 4)** | PR-O06 (Credential Expiration Impact) |
| **Connected Diagnostics (Doc 3)** | DS-R10 (Credentialing gaps) |
| **Connected Root Causes (Doc 2)** | A1.10 (Credentialing gaps), B3.16 (Non-credentialed provider) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A9.3 Auto-Denial Trend Alert

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-03 |
| **Item Name** | Real-Time Denial Trend Anomaly Alert |
| **What It Does** | Monitors denial rates across all dimensions (payer x CARC x CPT x provider x POS). When any combination exceeds 2 standard deviations from its 90-day baseline, generates alert with: metric name, current rate, baseline, deviation, possible root causes, recommended immediate actions. |
| **Trigger Condition** | Any denial dimension exceeds baseline + 2 sigma |
| **Required Data Inputs** | Denial data in real-time, 90-day rolling baselines per dimension, statistical thresholds |
| **Human-in-the-Loop** | Never for alerting. Human decides on response action. |
| **Confidence Threshold** | Statistical — 2 sigma threshold (95.4% confidence the change is real) |
| **Revenue Impact** | $55K-$90K/year (detects denial spikes 2-4 weeks earlier; prevents 200-500 denials per detected spike) |
| **Connected Predictions (Doc 4)** | PR-D04 (Denial Rate by Payer Trend), PR-D08 (Payer Policy Change Detection), PR-D10 (Seasonal Denial Rate) |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change), DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B1.01-B1.10 (All macro-level denial root causes) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A9.4 Auto-Coding Queue Prioritization

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-04 |
| **Item Name** | Timely-Filing-Aware Coding Queue Prioritization |
| **What It Does** | Reorders the coding queue based on: (1) days remaining to payer filing deadline, (2) expected claim value, (3) coding complexity. Claims within 14 days of filing deadline are auto-escalated to top priority regardless of other factors. Dashboard shows filing deadline countdown for every claim in queue. |
| **Trigger Condition** | Daily queue refresh + any claim approaching filing deadline |
| **Required Data Inputs** | Coding queue, claim DOS dates, payer filing deadlines, expected claim values, coding complexity indicators |
| **Human-in-the-Loop** | Never — prioritization is advisory |
| **Confidence Threshold** | N/A — deterministic deadline calculation |
| **Revenue Impact** | $94K-$140K/year (prevents 60-80% of timely filing write-offs; A1.03 is typically $94K on $50M practice) |
| **Connected Predictions (Doc 4)** | PR-O03 (Timely Filing Risk Score), PR-O05 (Coding Turnaround Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs) |
| **Connected Root Causes (Doc 2)** | A1.03 (Timely filing write-offs), B3.12 (Timely filing exceeded), B6.04 (Process delays) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### A9.5 Auto-Root Cause Report Generation

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-05 |
| **Item Name** | Monthly Root Cause Decomposition Report |
| **What It Does** | Generates the full revenue shortfall decomposition (Doc 2, A1.11) automatically each month: revenue target vs actual, weighted contribution of each root cause, trend vs prior month, recommended priority actions, and projected impact of fixing each root cause. Distributes to executive team. |
| **Trigger Condition** | Monthly cycle (first business day of month) + on-demand |
| **Required Data Inputs** | All revenue data, denial data, payment data, root cause attributions from AU-DN-02, prior month comparisons |
| **Human-in-the-Loop** | Never for generation. Human action on recommendations. |
| **Confidence Threshold** | N/A — aggregation of already-validated data |
| **Revenue Impact** | $8K-$12K/year in labor savings + strategic value of timely root cause visibility |
| **Connected Predictions (Doc 4)** | PR-R03 (Monthly Net Revenue Forecast), PR-D09 (Denial $ Impact per Root Cause) |
| **Connected Diagnostics (Doc 3)** | DS-R01-DS-R10 (All revenue diagnostics) |
| **Connected Root Causes (Doc 2)** | A1.01-A1.10 (All revenue root causes) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### A9.6 Auto-Dashboard Refresh

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-06 |
| **Item Name** | Real-Time Dashboard Data Pipeline |
| **What It Does** | All descriptive metrics (Doc 1) refresh in near-real-time as new data is posted or reconciled. Includes: net collection rate, denial rate, ADTP, AR aging, cash collections, payer mix, and all derived KPIs. Data pipeline processes new transactions within 15 minutes of posting. |
| **Trigger Condition** | New data posted/reconciled (continuous) |
| **Required Data Inputs** | All transactional data from claims, payments, denials, collections |
| **Human-in-the-Loop** | Never — passive data pipeline |
| **Confidence Threshold** | N/A — data aggregation |
| **Revenue Impact** | $5K-$8K/year in decision speed improvement (enables same-day response to emerging issues) |
| **Connected Predictions (Doc 4)** | All PR-* predictions display on dashboards |
| **Connected Diagnostics (Doc 3)** | All diagnostics surface through dashboards |
| **Connected Root Causes (Doc 2)** | All root causes visible through dashboards |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### A9.7 Auto-Forecast Recalibration

| Field | Detail |
|-------|--------|
| **Item ID** | AU-OP-07 |
| **Item Name** | Weekly Predictive Model Recalibration |
| **What It Does** | Every week, recalculates all predictive models (PR-R01 through PR-B03) with the latest actual data. Compares prediction vs actual for the prior week. If prediction error exceeds acceptable threshold, flags the model for review and adjusts weights. Publishes updated forecasts to all downstream consumers. |
| **Trigger Condition** | Weekly (Sunday night) + manual trigger |
| **Required Data Inputs** | Latest week of actual data, prior predictions, model parameters, error thresholds |
| **Human-in-the-Loop** | Never for recalibration. Human review when model error exceeds 2x acceptable threshold. |
| **Confidence Threshold** | N/A — continuous improvement process |
| **Revenue Impact** | $15K-$25K/year (improves forecast accuracy 1-2% per quarter; enables better cash management and staffing) |
| **Connected Predictions (Doc 4)** | All PR-* predictions (this IS the recalibration mechanism) |
| **Connected Diagnostics (Doc 3)** | Improved predictions improve diagnostic accuracy |
| **Connected Root Causes (Doc 2)** | Better models improve root cause attribution |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

## PART A SUMMARY

**Total Automation Items: 52**

| Category | Count | Annual Revenue Impact (Low-High) |
|----------|-------|----------------------------------|
| Claims Automation (A1) | 7 | $700K - $1,070K |
| Denial Automation (A2) | 6 | $496K - $807K |
| Payment Automation (A3) | 7 | $397K - $613K |
| Collections Automation (A4) | 6 | $273K - $420K |
| Eligibility & Access (A5) | 5 | $370K - $580K |
| Coding Automation (A6) | 5 | $333K - $547K |
| Reconciliation (A7) | 5 | $75K - $120K |
| Reporting & Compliance (A8) | 7 | $250K - $760K |
| Operational (A9) | 7 | $214K - $340K |
| **TOTAL** | **52** | **$3.11M - $5.26M** |

---

# ============================================================
# PART B: PREVENTION
# "Stop it before it happens."
# ============================================================

## THE PREVENTION PRINCIPLE

```
WITHOUT PREVENTION:
  Claim submitted -> Denied -> Root cause found -> Appeal filed ->
  Maybe recovered (60%) -> 47 days lost -> $180 cost per denial worked

WITH PREVENTION:
  Claim about to submit -> Risk detected -> Corrected before submission ->
  Paid on first pass -> 0 days lost -> $0 denial cost

Prevention ROI: $1 spent on prevention = $3.42 saved on remediation
```

---

## B1. DENIAL PREVENTION

### B1.1 Pre-Submission Risk Scoring (CRS)

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-01 |
| **Item Name** | Claim Risk Score (CRS) Pre-Submission Gating |
| **What It Does** | Every claim is scored 0-10 before submission based on: CPT x DX x payer x modifier x POS x auth status x provider x historical denial rate for this combination. Claims scoring above threshold (default 7.0) are held for review. Claims scoring 5.0-6.9 get specific risk factor warnings but proceed. Claims below 5.0 auto-release. CRS is the single most important prevention mechanism in the platform. |
| **Trigger Condition** | Claim enters pre-submission queue |
| **Required Data Inputs** | All claim features, historical denial data (min 10K claims for initial training), payer denial patterns, PR-D01 model output |
| **Human-in-the-Loop** | Always for held claims (CRS > 7.0). Never for auto-release (CRS < 5.0). |
| **Confidence Threshold** | CRS model AUC > 0.85 |
| **Revenue Impact** | $310K-$480K/year (prevents 45-65% of avoidable denials on first-pass) |
| **Connected Predictions (Doc 4)** | PR-D01 (Claim-Level Denial Probability), PR-D02 (Denial CARC Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R01 (Denial-driven loss) |
| **Connected Root Causes (Doc 2)** | All B3.* claim-level root causes |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 5 |

---

### B1.2 Payer-Specific Documentation Checklist Enforcement

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-02 |
| **Item Name** | Payer Documentation Requirement Validation |
| **What It Does** | Maintains a payer-specific documentation checklist for high-denial-risk procedures. Before claim submission, validates that all required documentation elements are present: operative report for surgical claims, medical necessity letter for high-cost imaging, TIMI score for cardiac stays >3 days (UHC), functional status for PT claims, etc. Missing elements block submission and generate CDI/coding alert. |
| **Trigger Condition** | Claim for procedure type flagged in payer documentation matrix |
| **Required Data Inputs** | Payer documentation requirement matrix (500+ rules across major payers), EHR documentation inventory, CDI documentation scoring |
| **Human-in-the-Loop** | Auto-block when required documentation missing. Human (CDI/coder) resolves the gap. |
| **Confidence Threshold** | N/A — rule-based checklist |
| **Revenue Impact** | $95K-$150K/year (prevents 50-70% of documentation-related denials per payer) |
| **Connected Predictions (Doc 4)** | PR-D01, PR-D02 |
| **Connected Diagnostics (Doc 3)** | DS-P01 (Proprietary medical necessity criteria), DS-P04 (Documentation threshold change) |
| **Connected Root Causes (Doc 2)** | B2.01 (Proprietary medical necessity criteria), B2.04 (Documentation threshold change), B3.06 (Insufficient documentation), B3.17 (Medical necessity not documented) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### B1.3 Prior Authorization Requirement Prediction

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-03 |
| **Item Name** | PA Requirement Prediction and Pre-Emptive Initiation |
| **What It Does** | Predicts whether a scheduled procedure will require prior authorization based on: payer PA-required list, historical PA requirement patterns (payer may require PA for procedures not on published list), and emerging PA requirement trends. Triggers PA initiation 72+ hours before service to ensure auth is in place. Catches payer PA expansions before they appear on official lists. |
| **Trigger Condition** | Procedure scheduled for a date 72+ hours in the future |
| **Required Data Inputs** | Payer PA-required lists, historical PA denial patterns (CO-197), procedure schedule, PR-A02 model output |
| **Human-in-the-Loop** | Auto-initiate PA for procedures on published PA list. Human review for predicted (not published) PA requirements. |
| **Confidence Threshold** | N/A for published list; 80% for predicted requirements |
| **Revenue Impact** | $95K-$150K/year (prevents 70-85% of auth-related denials) |
| **Connected Predictions (Doc 4)** | PR-A02 (Prior Auth Approval Prediction), PR-A03 (Auth Turnaround Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D04 (Prior auth process breakdown), DS-P02 (PA requirement expansion) |
| **Connected Root Causes (Doc 2)** | B3.07 (No prior auth obtained), B3.08 (Auth expired/insufficient), B1.04 (Prior auth process breakdown) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B1.4 Medical Necessity Documentation Validation

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-04 |
| **Item Name** | Medical Necessity Pre-Submission Validation |
| **What It Does** | For procedures with high medical necessity denial rates, validates that clinical documentation contains the elements required to establish medical necessity per payer criteria (LCD/NCD for Medicare, proprietary criteria for commercial). Uses NLP to scan documentation for required clinical indicators, test results, failed conservative treatments, and clinical decision-making narrative. |
| **Trigger Condition** | Claim for procedure with >15% historical medical necessity denial rate for that payer |
| **Required Data Inputs** | Clinical documentation, payer medical necessity criteria (LCD/NCD, InterQual, MCG), procedure-specific documentation requirements, NLP model |
| **Human-in-the-Loop** | Auto-flag when documentation gaps detected. CDI specialist intervenes to obtain documentation before submission. |
| **Confidence Threshold** | 80% documentation completeness scoring |
| **Revenue Impact** | $85K-$140K/year (prevents 40-60% of CO-50 medical necessity denials) |
| **Connected Predictions (Doc 4)** | PR-D01, PR-D02, PR-A02 |
| **Connected Diagnostics (Doc 3)** | DS-P01 (Proprietary medical necessity criteria), DS-D05 (CDI program weakness) |
| **Connected Root Causes (Doc 2)** | B3.05 (Missing specificity), B3.06 (Insufficient documentation), B3.17 (Medical necessity), B1.05 (CDI program weakness) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### B1.5 Modifier Appropriateness Check

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-05 |
| **Item Name** | Pre-Submission Modifier Validation Engine |
| **What It Does** | Validates modifier usage before claim submission against three layers: (1) NCCI modifier indicators (deterministic), (2) payer-specific modifier rules (rule-based), (3) historical modifier denial patterns (statistical). Catches: missing required modifiers, prohibited modifiers, incorrect modifier combinations, and modifiers that trigger high denial rates for specific payers. |
| **Trigger Condition** | Claim coded with or without modifiers enters pre-submission queue |
| **Required Data Inputs** | Claim CPT codes, modifiers assigned, NCCI modifier indicator table, payer-specific modifier rules, historical modifier denial rates per payer |
| **Human-in-the-Loop** | Auto-fix for deterministic modifier rules. Human review for clinical judgment modifiers (-25, -59). |
| **Confidence Threshold** | N/A for NCCI rules; 85% for statistical modifier risk |
| **Revenue Impact** | $35K-$55K/year (prevents 25-35% of modifier-related denials) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B3.02 (Wrong modifier), B3.15 (NCCI edit failure) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### B1.6 Timely Filing Countdown Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-06 |
| **Item Name** | Multi-Stage Timely Filing Countdown |
| **What It Does** | Tracks every unbilled and unpaid claim against payer-specific filing deadlines. Generates escalating alerts at 30/15/7 days before deadline. At 7 days, auto-escalates to supervisor. At 3 days, auto-escalates to director level. Maintains internal deadline that is 14 days before actual payer deadline to provide buffer. Dashboard shows countdown timers for all at-risk claims. |
| **Trigger Condition** | Claim age reaches filing deadline minus 30/15/7/3 days |
| **Required Data Inputs** | Claim DOS dates, payer filing deadlines (varies by payer: Medicare 365 days, most commercial 90-180 days), claim current status, processing bottleneck analysis |
| **Human-in-the-Loop** | Never for alerts. Human resolves the claim. |
| **Confidence Threshold** | N/A — deterministic countdown |
| **Revenue Impact** | $94K-$140K/year (prevents 60-80% of timely filing write-offs; saves 100% of each prevented write-off) |
| **Connected Predictions (Doc 4)** | PR-O03 (Timely Filing Risk Score) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs) |
| **Connected Root Causes (Doc 2)** | A1.03 (Timely filing write-offs), B3.12 (Timely filing exceeded), B6.04 (Process delays) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### B1.7 Duplicate Claim Prevention

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-07 |
| **Item Name** | Pre-Submission Duplicate Detection |
| **What It Does** | Scans every outgoing claim against submitted claims history (180 days). Uses multi-factor matching: exact match (same patient + DOS + CPT + payer = block), near match (same patient + DOS + similar CPT = flag), cross-payer match (same patient + DOS + same CPT + different payer = verify COB). Prevents duplicate submission penalties and payer audit triggers. |
| **Trigger Condition** | Claim enters submission batch |
| **Required Data Inputs** | Claims history (180 days), matching algorithm, payer duplicate rules |
| **Human-in-the-Loop** | Never for exact duplicates. Always for near-matches. |
| **Confidence Threshold** | 99% exact match; 80% near match |
| **Revenue Impact** | $15K-$25K/year (prevents duplicate penalties; reduces audit risk) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality) |
| **Connected Root Causes (Doc 2)** | B3.11 (Duplicate claim) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### B1.8 Coverage Gap Detection Before Submission

| Field | Detail |
|-------|--------|
| **Item ID** | PV-DN-08 |
| **Item Name** | Pre-Submission Coverage Verification |
| **What It Does** | Before any claim is submitted, verifies that the patient had active coverage on the date of service. Cross-references claim DOS against most recent eligibility verification. If verification is stale (>7 days old), triggers real-time re-verification. Catches retroactive terminations, coverage lapses, and benefit exhaustion that occurred between scheduling and service date. |
| **Trigger Condition** | Claim enters pre-submission queue + last eligibility check >7 days ago |
| **Required Data Inputs** | Claim DOS, most recent eligibility verification date and result, 270/271 endpoints, patient insurance record |
| **Human-in-the-Loop** | Auto-verify. Human intervention when coverage gap confirmed (insurance discovery, patient contact). |
| **Confidence Threshold** | N/A — deterministic verification |
| **Revenue Impact** | $45K-$70K/year (prevents 30-50% of post-service eligibility denials from retroactive terminations) |
| **Connected Predictions (Doc 4)** | PR-A01 (Coverage Termination Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-D03 (Eligibility verification failure) |
| **Connected Root Causes (Doc 2)** | B3.09 (Inactive coverage), B6.01 (Eligibility verification failure) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

## B2. REVENUE LEAKAGE PREVENTION

### B2.1 Charge Capture Completeness Verification

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-01 |
| **Item Name** | Encounter-to-Charge Reconciliation Engine |
| **What It Does** | Compares encounter volume to charge volume by department daily. Any department with encounter-to-charge ratio below 95% receives an alert. Identifies specific encounters without corresponding charges. Monitors for systematic patterns: certain procedure types consistently missing, specific providers with low capture rates, time-of-day patterns (end-of-day procedures more likely to be missed). |
| **Trigger Condition** | Daily reconciliation (6:00 AM) + real-time alert when encounter ages 48 hours without charge |
| **Required Data Inputs** | EHR encounter data, charge capture system, department benchmarks, CDM mapping, provider charge patterns |
| **Human-in-the-Loop** | Auto-alert. Department manager confirms and enters missing charge. |
| **Confidence Threshold** | N/A — deterministic comparison |
| **Revenue Impact** | $78K-$120K/year (captures 80-95% of dropped charges) |
| **Connected Predictions (Doc 4)** | PR-R03 (Monthly Net Revenue Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R04 (Dropped charges) |
| **Connected Root Causes (Doc 2)** | A1.04 (Unbilled/dropped charges), B6.08 (Charge capture gaps) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### B2.2 Under-Coding Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-02 |
| **Item Name** | Documentation-vs-Coding Level Analysis |
| **What It Does** | Compares coded level (E&M level, DRG) against documentation potential. Identifies providers whose E&M distribution skews low compared to specialty benchmarks (e.g., >60% Level 3 when specialty benchmark is 45%). Compares assigned DRG CMI against expected CMI for case mix. Generates provider-specific reports showing potential revenue uplift from coding to documentation level. |
| **Trigger Condition** | Monthly analysis by provider + real-time flag when coding level appears below documentation support |
| **Required Data Inputs** | Coded E&M levels by provider, specialty benchmarks (CMS utilization data), clinical documentation complexity indicators, DRG assignments, expected CMI for case mix |
| **Human-in-the-Loop** | Always — coding changes require coder judgment based on documentation |
| **Confidence Threshold** | Statistical — provider deviation from benchmark > 1 sigma |
| **Revenue Impact** | $67K-$100K/year (A1.05 is typically $67K; captures 50-75% through CDI/education) |
| **Connected Predictions (Doc 4)** | PR-R07 (Revenue per RVU Trend) |
| **Connected Diagnostics (Doc 3)** | DS-R05 (Downcoding) |
| **Connected Root Causes (Doc 2)** | A1.05 (Coding downcoding), B3.03 (Wrong DRG), B1.05 (CDI program weakness) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B2.3 Missing Charge Identification

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-03 |
| **Item Name** | Ancillary and Supply Charge Gap Detection |
| **What It Does** | Identifies missing ancillary charges that commonly accompany primary procedures but were not captured: drug administration charges with chemotherapy, supply charges with surgical procedures, room charges with observation stays, interpretation charges with imaging studies. Uses procedure-to-ancillary mapping to detect expected but absent charges. |
| **Trigger Condition** | Primary procedure charge posted without expected ancillary charges within 48 hours |
| **Required Data Inputs** | CDM, procedure-to-ancillary charge mapping, supply chain data, pharmacy administration records, historical charge bundles per procedure |
| **Human-in-the-Loop** | Auto-alert. Department confirms and enters missing charge. |
| **Confidence Threshold** | 85% that ancillary charge is expected based on procedure type |
| **Revenue Impact** | $32K-$50K/year (ancillary charges average $150-$400 per missed charge; 200-300 missed/month typical) |
| **Connected Predictions (Doc 4)** | PR-R03 (Monthly Net Revenue Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R04 (Dropped charges) |
| **Connected Root Causes (Doc 2)** | A1.04 (Unbilled/dropped charges) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B2.4 Contract Rate Compliance Pre-Check

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-04 |
| **Item Name** | Pre-Submission Contract Rate Verification |
| **What It Does** | Before claim submission, verifies that the billed amount and expected reimbursement align with the contracted rate for that payer-CPT combination. Identifies situations where billed amount is below contracted rate (leaving money on the table), contract rate is not loaded (underpayment will go undetected), or contract has expired (claims may process at out-of-network rates). |
| **Trigger Condition** | Claim enters pre-submission queue |
| **Required Data Inputs** | Claim data, contract rate tables, contract effective/expiration dates, fee schedule completeness status |
| **Human-in-the-Loop** | Auto-flag. Human reviews contract rate discrepancies. |
| **Confidence Threshold** | N/A — deterministic comparison |
| **Revenue Impact** | $41K-$65K/year (prevents contract rate erosion; A1.08 is typically $41K) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction), PR-R06 (Contract Rate Impact Modeling) |
| **Connected Diagnostics (Doc 3)** | DS-R08 (Contract rate erosion), DS-P09 (Contract fee schedule error) |
| **Connected Root Causes (Doc 2)** | A1.08 (Payer contract rate erosion), B2.09 (Contract fee schedule error) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B2.5 COB Opportunity Identification

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-05 |
| **Item Name** | Secondary Insurance Discovery for Revenue Maximization |
| **What It Does** | Proactively identifies patients who may have unreported secondary insurance by analyzing: employer group patterns (large employers typically offer spouse/dependent coverage), Medicare patients likely to have Medigap or Medicare Advantage, Medicaid-eligible patients, workers compensation potential for injury-related services. Runs insurance discovery for identified patients. |
| **Trigger Condition** | New patient registration with single insurance OR claim paid with patient responsibility > $500 |
| **Required Data Inputs** | Patient demographics, insurance on file, employer data, coverage discovery services, Medicare eligibility databases |
| **Human-in-the-Loop** | Auto-discovery search. Human confirms with patient before billing secondary. |
| **Confidence Threshold** | 70% likelihood of additional coverage for search trigger |
| **Revenue Impact** | $45K-$75K/year (identifies secondary coverage for 5-8% of patients; average additional collection $1,200 per identified secondary) |
| **Connected Predictions (Doc 4)** | PR-A01 (Coverage Termination Prediction), PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-P06 (COB disputes) |
| **Connected Root Causes (Doc 2)** | B3.10 (COB/wrong payer order) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B2.6 Secondary Billing Opportunity Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-RL-06 |
| **Item Name** | Missed Secondary Billing Alert |
| **What It Does** | After primary ERA posts, checks whether the patient has secondary insurance and whether a secondary claim was generated. Identifies cases where secondary billing was missed: secondary insurance added after primary submission, COB status changed, primary denial created secondary billing opportunity. Generates secondary claim automatically (see AU-PM-04) or alerts billing team. |
| **Trigger Condition** | Primary ERA posted + secondary insurance on file + no secondary claim generated within 5 business days |
| **Required Data Inputs** | Primary ERA, patient insurance record (all coverages), secondary claim submission log, COB status |
| **Human-in-the-Loop** | Auto-alert. Human confirms secondary billing is appropriate. |
| **Confidence Threshold** | 95% secondary eligibility confirmed |
| **Revenue Impact** | $35K-$55K/year (captures 15-25% of secondary billing that is currently missed) |
| **Connected Predictions (Doc 4)** | PR-P02 (Payment Amount Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-P06 (COB disputes) |
| **Connected Root Causes (Doc 2)** | B3.10 (COB/wrong payer order), A1.04 (Dropped charges — missed secondary is revenue leakage) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 6 |

---

## B3. COMPLIANCE PREVENTION

### B3.1 Over-Coding Risk Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-01 |
| **Item Name** | Provider Over-Coding Pattern Detection |
| **What It Does** | Monitors coding patterns by provider and compares to specialty-specific national benchmarks. Flags providers whose E&M distribution, modifier usage, or procedure frequency significantly exceeds benchmarks (e.g., >30% Level 5 E&M when national average is 12% for that specialty). Generates compliance alert with specific pattern description and recommended audit scope. |
| **Trigger Condition** | Provider coding pattern exceeds national benchmark + 2 sigma for any metric |
| **Required Data Inputs** | Provider coding patterns, CMS utilization data by specialty, OIG work plan targets, PEPPER data, national benchmarking databases |
| **Human-in-the-Loop** | Always — compliance review requires human judgment and may involve legal counsel |
| **Confidence Threshold** | Statistical — 2 sigma deviation from benchmark |
| **Revenue Impact** | $50K-$500K/year in compliance risk avoidance (FCA penalties: $11K-$23K per false claim) |
| **Connected Predictions (Doc 4)** | PR-D01 (patterns that inversely indicate compliance risk) |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality decline) |
| **Connected Root Causes (Doc 2)** | B1.02 (Coding quality decline — overcoding is the inverse of undercoding) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

### B3.2 Audit Target Pattern Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-02 |
| **Item Name** | OIG/RAC Audit Target Early Warning |
| **What It Does** | Monitors billing patterns against known OIG Work Plan targets and RAC audit focus areas. Identifies when organizational billing patterns match audit target profiles: high-volume procedures under review, DRG pairs flagged for upcoding, services with high error rates nationally. Generates pre-audit preparation recommendations. |
| **Trigger Condition** | Annual OIG Work Plan release + quarterly PEPPER data analysis + continuous billing pattern monitoring |
| **Required Data Inputs** | OIG Work Plan (annual), PEPPER reports, RAC audit focus areas, organizational billing data, national error rate data |
| **Human-in-the-Loop** | Always — audit preparation requires compliance team and legal counsel |
| **Confidence Threshold** | N/A — comparison to published audit targets |
| **Revenue Impact** | $100K-$750K/year in audit risk avoidance (average RAC audit extrapolation is $250K-$2M; prevention avoids 40-60%) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality), DS-P07 (Prepayment review/audit) |
| **Connected Root Causes (Doc 2)** | B1.02 (Coding quality decline), B1.10 (Regulatory changes) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

### B3.3 False Claims Act Risk Scoring

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-03 |
| **Item Name** | FCA Risk Composite Score |
| **What It Does** | Calculates a composite False Claims Act risk score based on multiple indicators: over-coding patterns, upcoding trends, unbundling frequency, services billed without documentation, patterns of billing for services not rendered (scheduling data vs claim data), and referral pattern anomalies. Score ranges 0-100 with escalating alert thresholds at 50/70/90. |
| **Trigger Condition** | Monthly FCA risk recalculation + real-time alert when any individual indicator spikes |
| **Required Data Inputs** | All coding patterns, scheduling vs billing comparison, documentation completeness, referral patterns, provider ordering patterns, national benchmarks |
| **Human-in-the-Loop** | Always — FCA review requires legal counsel involvement |
| **Confidence Threshold** | Multi-factor composite — alerting thresholds set by compliance committee |
| **Revenue Impact** | $200K-$2M/year in FCA risk avoidance (FCA settlements average $500K-$50M; even investigation costs $100K+) |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality) |
| **Connected Root Causes (Doc 2)** | B1.02 (Coding quality), B3.01 (Wrong CPT), B3.04 (Unbundling) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 8 |

---

### B3.4 Unbundling Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-04 |
| **Item Name** | Pre-Submission Unbundling Detection |
| **What It Does** | Validates every claim against NCCI Correct Coding Initiative edits before submission. Detects when component codes are billed separately instead of the appropriate bundled code. Checks both Column 1/Column 2 edits and Mutually Exclusive edits. When unbundling detected, either auto-corrects (bundles to correct code) or flags for coder review when clinical distinction modifier may be appropriate. |
| **Trigger Condition** | Claim with multiple CPT codes enters pre-submission queue |
| **Required Data Inputs** | NCCI Column 1/Column 2 edit tables, Mutually Exclusive edit tables, modifier indicators, claim CPT combinations |
| **Human-in-the-Loop** | Auto-correct for clear bundles (indicator 0). Human review when modifier may distinguish services (indicator 1). |
| **Confidence Threshold** | N/A — deterministic NCCI rules |
| **Revenue Impact** | $25K-$40K/year in denial prevention + compliance risk avoidance |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality), DS-D10 (Regulatory changes — NCCI updates) |
| **Connected Root Causes (Doc 2)** | B3.04 (Unbundling), B3.15 (NCCI edit failure), B1.10 (Regulatory changes) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### B3.5 Modifier Misuse Prevention

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-05 |
| **Item Name** | Modifier Compliance Monitoring |
| **What It Does** | Monitors modifier usage patterns for compliance risk indicators: excessive -25 modifier usage (separate E&M with procedure), -59 modifier usage rates above specialty benchmarks, systematic modifier patterns that could indicate gaming. Distinct from B1.5 (which prevents denials) — this prevents compliance risk. Generates compliance alerts when modifier usage exceeds safe thresholds. |
| **Trigger Condition** | Monthly modifier usage analysis by provider + real-time flag when modifier usage pattern reaches compliance risk threshold |
| **Required Data Inputs** | Modifier usage by provider, specialty benchmarks, OIG guidance on modifier usage, historical audit findings for modifier-related compliance issues |
| **Human-in-the-Loop** | Always — compliance determination requires human judgment |
| **Confidence Threshold** | Statistical — usage exceeding benchmark + 2 sigma |
| **Revenue Impact** | $30K-$80K/year in compliance risk avoidance |
| **Connected Predictions (Doc 4)** | PR-D01 |
| **Connected Diagnostics (Doc 3)** | DS-D02 (Coding quality) |
| **Connected Root Causes (Doc 2)** | B3.02 (Wrong modifier), B1.02 (Coding quality decline) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

### B3.6 Medical Necessity Documentation Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CP-06 |
| **Item Name** | Concurrent Medical Necessity Documentation Monitoring |
| **What It Does** | During patient stay (inpatient) or at time of order (outpatient), monitors clinical documentation for medical necessity support. Generates real-time alerts when: ordered services lack documented medical necessity, continued stay lacks updated clinical justification, LCD/NCD criteria not documented, clinical indicators present but not documented. CDI team responds to alerts within 24 hours. |
| **Trigger Condition** | Service ordered/performed + documentation gap detected by NLP analysis |
| **Required Data Inputs** | Real-time clinical documentation, LCD/NCD criteria, InterQual/MCG criteria, payer-specific medical necessity requirements, NLP documentation analysis |
| **Human-in-the-Loop** | Auto-alert to CDI. Physician must provide documentation. |
| **Confidence Threshold** | 80% documentation gap confidence |
| **Revenue Impact** | $85K-$140K/year (prevents 40-60% of medical necessity denials; highest ROI prevention at $5.80 per $1 spent) |
| **Connected Predictions (Doc 4)** | PR-D01, PR-A02 |
| **Connected Diagnostics (Doc 3)** | DS-P01 (Proprietary medical necessity), DS-D05 (CDI program weakness) |
| **Connected Root Causes (Doc 2)** | B3.05 (Missing specificity), B3.06 (Insufficient documentation), B3.17 (Medical necessity), B1.05 (CDI program weakness) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

## B4. CASH FLOW PREVENTION

### B4.1 ADTP Anomaly Early Warning

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CF-01 |
| **Item Name** | ADTP Trend Anomaly Detection |
| **What It Does** | Monitors ADTP (Average Days to Payment) for every payer continuously. When ADTP exceeds the 90-day baseline by 1.5 standard deviations, generates early warning alert. Includes: current ADTP, baseline ADTP, trend direction, claims affected, cash flow impact projection, and recommended actions (accelerate AR follow-up, contact payer representative). |
| **Trigger Condition** | Payer ADTP exceeds baseline + 1.5 sigma |
| **Required Data Inputs** | ADTP calculations per payer (rolling 90-day), baseline statistics, claims in pipeline by payer, cash flow projections |
| **Human-in-the-Loop** | Never for alerting. Human decides on payer outreach and AR strategy adjustment. |
| **Confidence Threshold** | Statistical — 1.5 sigma threshold (86.6% confidence change is real) |
| **Revenue Impact** | $55K-$85K/year (early detection enables 10-20 day faster response; prevents AR aging deterioration) |
| **Connected Predictions (Doc 4)** | PR-P01 (ADTP Forecast by Payer), PR-P07 (Payer Financial Stress Signal) |
| **Connected Diagnostics (Doc 3)** | DS-P10 (Payer financial stress) |
| **Connected Root Causes (Doc 2)** | A2.01 (ADTP anomaly), B2.10 (Payer financial stress) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 5 |

---

### B4.2 Payer Financial Health Monitoring

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CF-02 |
| **Item Name** | Payer Financial Health Composite Score |
| **What It Does** | Tracks a composite health score for each payer based on: ADTP trend, denial rate trend, underpayment rate, ERA-bank gap, payment amount consistency, and available external signals (news, regulatory actions, AM Best ratings for insurers). Score declines trigger graduated response: monitoring -> accelerated AR -> limit new scheduling -> negotiate single-case agreements. |
| **Trigger Condition** | Weekly recalculation + real-time alert when score drops below threshold |
| **Required Data Inputs** | Payer ADTP, denial rates, underpayment rates, ERA-bank gaps, external financial data, state insurance department filings |
| **Human-in-the-Loop** | Auto-monitoring and alerting. Human decision on exposure reduction strategy. |
| **Confidence Threshold** | Composite score — thresholds set by CFO |
| **Revenue Impact** | $30K-$100K/year (early detection of payer financial stress prevents exposure buildup; rare but catastrophic risk) |
| **Connected Predictions (Doc 4)** | PR-P07 (Payer Financial Stress Signal), PR-P01 (ADTP Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-P10 (Payer financial stress) |
| **Connected Root Causes (Doc 2)** | B2.10 (Payer financial stress) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### B4.3 Timely Filing Expiration Alerts (30/15/7 Day Countdown)

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CF-03 |
| **Item Name** | Appeal and Corrected Claim Filing Deadline Tracker |
| **What It Does** | Distinct from B1.6 (which covers initial claim filing deadlines), this tracks secondary deadlines: appeal filing deadlines (typically 60-180 days from denial), corrected claim resubmission deadlines, underpayment dispute deadlines, and reconsideration request deadlines. Each deadline type has its own countdown with 30/15/7 day alerts. |
| **Trigger Condition** | Denial received (starts appeal deadline clock) OR corrected claim queued (starts refiling deadline clock) |
| **Required Data Inputs** | Denial dates, payer-specific appeal deadlines, corrected claim deadlines, reconsideration deadlines, current work queue status |
| **Human-in-the-Loop** | Never for alerts. Human files the appeal/corrected claim. |
| **Confidence Threshold** | N/A — deterministic countdown |
| **Revenue Impact** | $45K-$70K/year (prevents 20-30% of missed appeal deadlines; each missed deadline = 100% claim loss) |
| **Connected Predictions (Doc 4)** | PR-O04 (Appeal Deadline Risk) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs) |
| **Connected Root Causes (Doc 2)** | B6.09 (Appeal deadline management), B3.12 (Timely filing exceeded) |
| **Implementation Complexity** | Low |
| **Sprint Target** | Sprint 5 |

---

### B4.4 AR Aging Acceleration Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CF-04 |
| **Item Name** | AR Aging Bucket Migration Early Warning |
| **What It Does** | Monitors the rate at which claims are migrating from younger to older aging buckets. When the migration rate accelerates beyond baseline (more claims aging into 60+ or 90+ days than historical average), generates early warning. Identifies specific payers, service lines, and claim types driving the acceleration. Enables proactive intervention before AR aging ratio deteriorates. |
| **Trigger Condition** | Weekly AR aging analysis shows migration rate > baseline + 1.5 sigma for any bucket transition |
| **Required Data Inputs** | AR aging data (current and historical), bucket migration rates, payer-specific aging patterns, claim status data |
| **Human-in-the-Loop** | Never for alerting. Human decides on intervention strategy. |
| **Confidence Threshold** | Statistical — 1.5 sigma acceleration threshold |
| **Revenue Impact** | $35K-$55K/year (prevents 10-15% of AR from aging into uncollectable status; each dollar in 90+ bucket has 40% lower collection probability than 30-day bucket) |
| **Connected Predictions (Doc 4)** | PR-R04 (AR Collectibility Forecast), PR-P01 (ADTP Forecast) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing), DS-P10 (Payer financial stress) |
| **Connected Root Causes (Doc 2)** | A2.01 (ADTP anomaly), A2.03 (AR aging), B6.04 (Process delays) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B4.5 Patient Bad Debt Risk Scoring

| Field | Detail |
|-------|--------|
| **Item ID** | PV-CF-05 |
| **Item Name** | Patient Propensity-to-Pay Risk Stratification |
| **What It Does** | Scores every patient account for bad debt risk using: payment history, balance amount, insurance status, demographic indicators, engagement signals (portal usage, statement response, phone responsiveness). Stratifies into risk tiers: low risk (>70% propensity — standard collections), medium risk (40-70% — payment plan offer), high risk (<40% — financial assistance screening), and very high risk (<15% — write-off candidate). Enables targeted intervention per tier. |
| **Trigger Condition** | Patient balance generated + 30-day recalculation cycle |
| **Required Data Inputs** | Patient payment history, balance, aging, insurance status, portal engagement, contact response rates, demographic data, financial assistance criteria |
| **Human-in-the-Loop** | Never for scoring. Human intervention per tier-specific protocol. |
| **Confidence Threshold** | PR-P04 AUC > 0.80 |
| **Revenue Impact** | $52K-$80K/year (A1.07 is typically $52K; targeted intervention recovers 20-35% more than undifferentiated approach) |
| **Connected Predictions (Doc 4)** | PR-P04 (Patient Payment Probability), PR-R05 (Bad Debt Projection) |
| **Connected Diagnostics (Doc 3)** | DS-R07 (Patient bad debt) |
| **Connected Root Causes (Doc 2)** | A1.07 (Patient bad debt) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

## B5. OPERATIONAL PREVENTION

### B5.1 Work Queue Overflow Prediction

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-01 |
| **Item Name** | Work Queue Volume Forecasting and Overflow Alert |
| **What It Does** | Forecasts work queue volumes for the next 7/14/30 days based on: historical inflow patterns, seasonal trends, denial trend predictions, staffing changes, and pipeline data. When forecast predicts queue overflow (volume exceeding capacity by >20%), generates early warning with: affected queue, predicted overflow date, recommended staffing adjustment, and option to redistribute work. |
| **Trigger Condition** | Daily forecast recalculation + alert when predicted overflow within 7 days |
| **Required Data Inputs** | Historical queue volumes, current inflow rates, PR-D03 denial volume forecast, staffing calendar, productivity benchmarks, PR-O01 model output |
| **Human-in-the-Loop** | Never for prediction. Human decides on staffing adjustment. |
| **Confidence Threshold** | PR-O01 forecast ±10% |
| **Revenue Impact** | $22K-$35K/year (prevents SLA breaches from overflow; prevents timely filing write-offs from queue backlogs) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume Forecast), PR-O02 (Staffing Needs Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing — overflow causes delays) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.10 (Process bottleneck) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B5.2 SLA Breach Prediction

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-02 |
| **Item Name** | Proactive SLA Breach Prevention |
| **What It Does** | Predicts which specific claims/denials/tasks are likely to breach their SLA based on: current queue position, average processing time for this task type, staff available for this queue, and remaining SLA time. Generates "predicted breach" alerts 24-48 hours before breach occurs, enabling proactive re-prioritization. |
| **Trigger Condition** | Predicted SLA breach within 48 hours |
| **Required Data Inputs** | Task queue positions, SLA definitions, processing time averages by task type, staff availability, current workload |
| **Human-in-the-Loop** | Never for prediction and alert. Human re-prioritizes or reassigns work. |
| **Confidence Threshold** | 80% breach prediction accuracy |
| **Revenue Impact** | $35K-$55K/year (prevents 40-60% of SLA breaches; prevents downstream timely filing and appeal deadline issues) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume), PR-O04 (Appeal Deadline Risk) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing — SLA breach prevention protects timely filing) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.09 (Appeal deadline management) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B5.3 Staff Capacity Alerts

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-03 |
| **Item Name** | Staffing Capacity Gap Detection |
| **What It Does** | Compares actual available staff capacity against predicted work volume (PR-O02). Accounts for: PTO, training time, meetings, and productivity variation by experience level. Generates alerts when gap between available capacity and predicted workload exceeds 15%. Recommends: cross-training deployment, overtime, temp staffing, or work redistribution. |
| **Trigger Condition** | Capacity gap exceeds 15% for any functional area, looking 7 days ahead |
| **Required Data Inputs** | Staff roster, PTO calendar, productivity benchmarks by role, work volume forecast, cross-training matrix |
| **Human-in-the-Loop** | Never for alerting. Human makes staffing decisions. |
| **Confidence Threshold** | PR-O02 forecast ±0.5 FTE |
| **Revenue Impact** | $18K-$28K/year (prevents revenue loss from understaffed functions; reduces overtime costs through proactive planning) |
| **Connected Predictions (Doc 4)** | PR-O02 (Staffing Needs Prediction), PR-O01 (Work Queue Volume) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing — understaffing causes delays) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.10 (Process bottleneck) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

### B5.4 System Bottleneck Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-04 |
| **Item Name** | Pipeline Stage Dwell Time Bottleneck Detection |
| **What It Does** | Monitors average dwell time at each stage of the RCM pipeline (registration -> coding -> charge posting -> scrubbing -> submission -> adjudication -> posting -> reconciliation). When any stage's average dwell time exceeds baseline + 2 days, generates bottleneck alert with: affected stage, current dwell time, baseline, claims impacted, and root cause analysis (staffing, system, process, payer). Enables targeted intervention at the specific bottleneck point. |
| **Trigger Condition** | Any pipeline stage average dwell time exceeds baseline + 2 days |
| **Required Data Inputs** | Claim timestamps at each pipeline stage, baseline dwell times, current volumes per stage, staffing data, system uptime data |
| **Human-in-the-Loop** | Never for detection. Human decides on bottleneck resolution. |
| **Confidence Threshold** | N/A — deterministic dwell time measurement |
| **Revenue Impact** | $25K-$40K/year (prevents cascading delays; each day of pipeline delay costs $0.50-$2.00 per claim in ADTP impact) |
| **Connected Predictions (Doc 4)** | PR-O01 (Work Queue Volume), PR-P05 (Payment Date Prediction) |
| **Connected Diagnostics (Doc 3)** | DS-R03 (Timely filing write-offs) |
| **Connected Root Causes (Doc 2)** | B6.04 (Process delays), B6.10 (Process bottleneck), B6.15 (Root cause recurrence — systemic bottlenecks) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

### B5.5 Payer Behavior Shift Detection

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-05 |
| **Item Name** | Payer Behavior Fingerprint Change Detection |
| **What It Does** | Maintains a multi-dimensional "fingerprint" for each payer: denial rate by CARC, ADTP, underpayment rate, payment variance patterns, ERA-bank gap, appeal success rate. When any fingerprint dimension shifts beyond threshold, generates alert with: what changed, when, likely cause, and recommended response. This is the early warning system for payer behavior changes that would otherwise take 60-90 days to notice manually. |
| **Trigger Condition** | Weekly payer fingerprint recalculation + real-time alert when any dimension exceeds 2 sigma |
| **Required Data Inputs** | All payer performance data, 90-day rolling baselines, change point detection algorithms (CUSUM, PELT) |
| **Human-in-the-Loop** | Never for detection. Human investigates and responds. |
| **Confidence Threshold** | 90% change point detection confidence |
| **Revenue Impact** | $45K-$75K/year (detects payer changes 2-4 weeks earlier; prevents 200-500 denials during detection gap) |
| **Connected Predictions (Doc 4)** | PR-D08 (Payer Policy Change Detection), PR-P07 (Payer Financial Stress Signal) |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change), DS-P10 (Payer financial stress) |
| **Connected Root Causes (Doc 2)** | B1.01 (Payer policy change), B2.01-B2.10 (All payer-level root causes) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 6 |

---

### B5.6 Regulatory Change Monitoring

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-06 |
| **Item Name** | Automated Regulatory Update Tracking |
| **What It Does** | Monitors CMS, state Medicaid, and commercial payer regulatory updates: NCCI edit table updates (quarterly), LCD/NCD changes, CPT/ICD-10 annual updates, No Surprises Act changes, state balance billing laws. Automatically updates scrubber rules within 48 hours of effective date. Generates impact analysis: which claims in pipeline are affected by the change, and which current billing practices need modification. |
| **Trigger Condition** | Regulatory update detected OR scheduled regulatory effective date |
| **Required Data Inputs** | CMS HPMS feeds, state Medicaid bulletins, NCCI edit tables, LCD/NCD database, CPT/ICD-10 update files, payer policy bulletins |
| **Human-in-the-Loop** | Auto-detection and scrubber rule update for deterministic changes. Human review for interpretive changes. |
| **Confidence Threshold** | N/A for published regulatory changes; 80% for interpreted impact |
| **Revenue Impact** | $25K-$40K/year (prevents claims submitted under outdated rules; reduces 2-4 week lag in rule adoption) |
| **Connected Predictions (Doc 4)** | PR-D08 (Payer Policy Change Detection) |
| **Connected Diagnostics (Doc 3)** | DS-D10 (Regulatory changes) |
| **Connected Root Causes (Doc 2)** | B1.10 (Regulatory changes) |
| **Implementation Complexity** | High |
| **Sprint Target** | Sprint 7 |

---

### B5.7 Root Cause Recurrence Prevention

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-07 |
| **Item Name** | Closed-Loop Root Cause Recurrence Monitoring |
| **What It Does** | After a root cause is identified and a diagnostic intervention is implemented (Doc 3), monitors whether the root cause recurs. Tracks: (1) denial rate for the specific root cause post-intervention, (2) new claims exhibiting the same risk factors, (3) process changes that were implemented — are they being followed? If root cause recurs within 90 days of intervention, generates alert with recurrence details and recommendation to strengthen the intervention. |
| **Trigger Condition** | Root cause recurrence detected (same B3.* root cause for same payer + CARC + CPT combination after intervention implemented) |
| **Required Data Inputs** | Root cause history, intervention implementation dates, post-intervention denial rates, process compliance monitoring data |
| **Human-in-the-Loop** | Auto-alert. Human reviews intervention effectiveness and adjusts. |
| **Confidence Threshold** | 85% recurrence pattern confirmed |
| **Revenue Impact** | $35K-$55K/year (prevents regression to pre-intervention denial rates; protects ROI of diagnostic interventions) |
| **Connected Predictions (Doc 4)** | PR-D07 (Denial Recurrence Prediction) |
| **Connected Diagnostics (Doc 3)** | All DS-* diagnostics (this monitors their effectiveness) |
| **Connected Root Causes (Doc 2)** | B6.15 (Root cause recurrence — this IS the recurrence monitor) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 7 |

---

### B5.8 Knowledge Decay Prevention

| Field | Detail |
|-------|--------|
| **Item ID** | PV-OP-08 |
| **Item Name** | Payer Rule Library Maintenance and Versioning |
| **What It Does** | Maintains a versioned, searchable library of payer-specific billing rules, documentation requirements, and policy interpretations. Each rule has an effective date, source citation, last verified date, and expiration/review date. Rules not reviewed within 90 days are flagged for revalidation. When policy changes are detected (AU-RP-05), corresponding rules are auto-flagged for update. Prevents billing teams from using outdated information. |
| **Trigger Condition** | Rule expiration/review date reached + payer policy change detected + quarterly review cycle |
| **Required Data Inputs** | Payer rule database, policy change detection output, rule usage frequency, rule accuracy (denial rate when rule was followed) |
| **Human-in-the-Loop** | Auto-flag for review. Human (billing specialist or compliance) validates and updates rules. |
| **Confidence Threshold** | N/A — maintenance process |
| **Revenue Impact** | $20K-$35K/year (prevents denials from outdated rule application; supports AU-CL-01 scrubber accuracy) |
| **Connected Predictions (Doc 4)** | PR-D08 (Payer Policy Change Detection) |
| **Connected Diagnostics (Doc 3)** | DS-D01 (Payer policy change) |
| **Connected Root Causes (Doc 2)** | B6.05 (Knowledge decay) |
| **Implementation Complexity** | Medium |
| **Sprint Target** | Sprint 6 |

---

## PART B SUMMARY

**Total Prevention Items: 27**

| Category | Count | Annual Revenue Impact (Low-High) |
|----------|-------|----------------------------------|
| Denial Prevention (B1) | 8 | $775K - $1,210K |
| Revenue Leakage Prevention (B2) | 6 | $298K - $465K |
| Compliance Prevention (B3) | 6 | $430K - $1,410K |
| Cash Flow Prevention (B4) | 5 | $217K - $390K |
| Operational Prevention (B5) | 8 | $225K - $383K |
| **TOTAL** | **27** | **$1.95M - $3.86M** |

---

# ============================================================
# COMBINED IMPACT MODEL
# ============================================================

## Total Item Count: 79 Automation + Prevention Items

```
AUTOMATION (Part A):    52 items    $3.11M - $5.26M annual impact
PREVENTION (Part B):    27 items    $1.95M - $3.86M annual impact
                        ─────────   ────────────────────────────
COMBINED:               79 items    $5.06M - $9.12M annual impact
                                    (for a $50M practice)

Overlap adjustment (-15% for items that address same root cause):
ADJUSTED COMBINED:                  $4.30M - $7.75M annually

At implementation cost of ~$1.8M (Year 1):
NET ROI: $2.50M - $5.95M annually (Year 2+)
ROI Multiple: 2.4x - 4.3x
```

---

## WHAT MUST NEVER BE AUTOMATED (Human-Only Activities)

| # | Activity | Why It Cannot Be Automated |
|---|---------|---------------------------|
| NA-01 | **Peer-to-peer clinical calls** | Requires physician judgment, real-time clinical argumentation |
| NA-02 | **Contract negotiations** | Strategic, relationship-based, involves business judgment |
| NA-03 | **Legal action decisions** | Compliance, legal risk, fiduciary duty |
| NA-04 | **Write-off approval > $5,000** | Financial authority, audit trail requirement |
| NA-05 | **Patient financial hardship determination** | Empathy, judgment, regulatory requirements (501(r)) |
| NA-06 | **Clinical documentation authorship** | Physician must author/attest clinical documentation |
| NA-07 | **Fraud/abuse reporting** | Legal obligation, whistleblower protections |
| NA-08 | **New payer contract decisions** | Strategic, involves network adequacy and market positioning |
| NA-09 | **Staffing decisions** | HR implications, cannot be algorithmic |
| NA-10 | **Compliance audit responses** | Legal review required, cannot be automated |

---

## SPRINT ROADMAP

### Sprint 5 (Foundation Automations — Highest ROI, Lowest Complexity)

| ID | Item | Category | Impact |
|----|------|----------|--------|
| AU-CL-01 | Pre-Submission Auto-Scrub | Claims Automation | $180K-$240K |
| AU-CL-02 | Deterministic Billing Error Auto-Correction | Claims Automation | $85K-$120K |
| AU-CL-03 | CRS-Driven Auto-Hold | Claims Automation | $310K-$480K |
| AU-CL-04 | Correctable Rejection Auto-Resubmission | Claims Automation | $45K-$75K |
| AU-CL-07 | Duplicate Claim Prevention | Claims Automation | $15K-$25K |
| AU-DN-02 | 7-Layer Root Cause Auto-Attribution | Denial Automation | $35K-$50K |
| AU-DN-03 | Denial Smart-Routing | Denial Automation | $28K-$42K |
| AU-DN-04 | SLA Breach Auto-Escalation | Denial Automation | $55K-$85K |
| AU-DN-06 | Claim Washing Detection | Denial Automation | $18K-$30K |
| AU-PM-01 | ERA/835 Auto-Posting | Payment Automation | $65K-$95K |
| AU-PM-02 | ERA-Bank Deposit Auto-Reconciliation | Payment Automation | $22K-$35K |
| AU-PM-03 | Contract-vs-Paid Underpayment Detection | Payment Automation | $183K-$275K |
| AU-PM-05 | Patient Statement Auto-Generation | Payment Automation | $32K-$48K |
| AU-CO-02 | ADTP-Driven Payer Follow-Up Escalation | Collections | $55K-$80K |
| AU-CO-04 | Automated Statement Cycle Management | Collections | $28K-$42K |
| AU-EA-01 | Dual-Mode Eligibility Verification | Eligibility | $120K-$180K |
| AU-RC-01 | Multi-Layer ERA-Bank Reconciliation | Reconciliation | $22K-$35K |
| AU-RC-04 | Ghost Payment Alert | Reconciliation | $18K-$30K |
| AU-RP-01 | Scheduled Report Auto-Generation | Reporting | $15K-$22K |
| AU-RP-03 | Comprehensive Automation Audit Trail | Reporting | $25K-$40K |
| AU-OP-02 | Provider Credential Expiration Alert | Operational | $15K-$30K |
| AU-OP-03 | Real-Time Denial Trend Anomaly Alert | Operational | $55K-$90K |
| AU-OP-04 | Coding Queue Prioritization | Operational | $94K-$140K |
| AU-OP-06 | Real-Time Dashboard Data Pipeline | Operational | $5K-$8K |
| PV-DN-01 | CRS Pre-Submission Gating | Denial Prevention | $310K-$480K |
| PV-DN-05 | Modifier Appropriateness Check | Denial Prevention | $35K-$55K |
| PV-DN-06 | Timely Filing Countdown Alerts | Denial Prevention | $94K-$140K |
| PV-DN-07 | Duplicate Claim Prevention | Denial Prevention | $15K-$25K |
| PV-DN-08 | Coverage Gap Detection | Denial Prevention | $45K-$70K |
| PV-RL-01 | Encounter-to-Charge Reconciliation | Revenue Leakage | $78K-$120K |
| PV-CF-01 | ADTP Anomaly Early Warning | Cash Flow | $55K-$85K |
| PV-CF-03 | Appeal Filing Deadline Tracker | Cash Flow | $45K-$70K |
| PV-CP-04 | Unbundling Detection | Compliance | $25K-$40K |
| **Sprint 5 Total** | **33 items** | | **$2,373K - $3,617K** |

---

### Sprint 6 (Advanced Automation + Core Prevention)

| ID | Item | Category | Impact |
|----|------|----------|--------|
| AU-CL-05 | Documentation Auto-Attachment | Claims | $60K-$90K |
| AU-CL-06 | Claim Split/Combine Optimization | Claims | $25K-$40K |
| AU-DN-01 | AI-Driven Appeal Letter Generation | Denial | $220K-$380K |
| AU-PM-04 | Secondary Claim Auto-Generation | Payment | $45K-$75K |
| AU-PM-06 | Overpayment Detection | Payment | $12K-$20K |
| AU-PM-07 | Contractual Adjustment Validation | Payment | $40K-$65K |
| AU-CO-01 | Collection Queue Prioritization | Collections | $85K-$130K |
| AU-CO-03 | Payment Plan Auto-Offer | Collections | $42K-$65K |
| AU-CO-05 | Follow-Up Auto-Scheduling | Collections | $18K-$28K |
| AU-EA-02 | Prior Auth Auto-Initiation | Eligibility | $95K-$150K |
| AU-EA-03 | Insurance Coverage Auto-Discovery | Eligibility | $65K-$110K |
| AU-EA-04 | COB Auto-Detection | Eligibility | $35K-$55K |
| AU-EA-05 | Patient Cost Estimate | Eligibility | $55K-$85K |
| AU-CD-02 | Payer-Specific Modifier Auto-Assignment | Coding | $35K-$55K |
| AU-RC-02 | Variance Auto-Detection | Reconciliation | $15K-$25K |
| AU-RC-03 | Reconciled Transaction Auto-Posting | Reconciliation | $12K-$18K |
| AU-RP-05 | Payer Policy Change Auto-Detection | Reporting | $45K-$75K |
| AU-RP-06 | Model Feedback Loop | Reporting | $80K-$130K |
| AU-OP-01 | Work Queue Load Balancing | Operational | $22K-$35K |
| AU-OP-05 | Monthly Root Cause Report | Operational | $8K-$12K |
| AU-OP-07 | Weekly Forecast Recalibration | Operational | $15K-$25K |
| PV-DN-02 | Payer Documentation Checklist Enforcement | Denial Prevention | $95K-$150K |
| PV-DN-03 | PA Requirement Prediction | Denial Prevention | $95K-$150K |
| PV-RL-02 | Under-Coding Detection | Revenue Leakage | $67K-$100K |
| PV-RL-03 | Missing Charge Identification | Revenue Leakage | $32K-$50K |
| PV-RL-04 | Contract Rate Compliance Pre-Check | Revenue Leakage | $41K-$65K |
| PV-RL-05 | COB Opportunity Identification | Revenue Leakage | $45K-$75K |
| PV-RL-06 | Secondary Billing Opportunity Detection | Revenue Leakage | $35K-$55K |
| PV-CF-04 | AR Aging Acceleration Alerts | Cash Flow | $35K-$55K |
| PV-CF-05 | Patient Bad Debt Risk Scoring | Cash Flow | $52K-$80K |
| PV-OP-01 | Work Queue Overflow Prediction | Operational Prevention | $22K-$35K |
| PV-OP-02 | SLA Breach Prediction | Operational Prevention | $35K-$55K |
| PV-OP-04 | Pipeline Bottleneck Detection | Operational Prevention | $25K-$40K |
| PV-OP-05 | Payer Behavior Shift Detection | Operational Prevention | $45K-$75K |
| PV-OP-08 | Knowledge Decay Prevention | Operational Prevention | $20K-$35K |
| **Sprint 6 Total** | **35 items** | | **$1,839K - $2,873K** |

---

### Sprint 7 (AI-Driven + Compliance)

| ID | Item | Category | Impact |
|----|------|----------|--------|
| AU-DN-05 | Batch Appeal Generation | Denial | $140K-$220K |
| AU-CD-01 | NLP Code Suggestion Engine | Coding | $48K-$72K |
| AU-CD-03 | DRG Optimization | Coding | $120K-$200K |
| AU-RC-05 | Period Close Auto-Completion | Reconciliation | $8K-$12K |
| AU-RP-02 | Compliance Risk Auto-Monitoring | Reporting | $50K-$500K |
| AU-RP-07 | Prevention Rule Proposal | Reporting | $35K-$55K |
| AU-CO-06 | Write-Off Recommendation | Collections | $15K-$25K |
| PV-DN-04 | Medical Necessity Documentation Validation | Denial Prevention | $85K-$140K |
| PV-CP-01 | Over-Coding Risk Alerts | Compliance | $50K-$500K |
| PV-CP-02 | OIG/RAC Audit Target Detection | Compliance | $100K-$750K |
| PV-CP-05 | Modifier Misuse Prevention | Compliance | $30K-$80K |
| PV-CF-02 | Payer Financial Health Monitoring | Cash Flow | $30K-$100K |
| PV-OP-03 | Staff Capacity Alerts | Operational Prevention | $18K-$28K |
| PV-OP-06 | Regulatory Change Monitoring | Operational Prevention | $25K-$40K |
| PV-OP-07 | Root Cause Recurrence Prevention | Operational Prevention | $35K-$55K |
| **Sprint 7 Total** | **15 items** | | **$789K - $2,777K** |

---

### Sprint 8 (Advanced AI + Full Platform)

| ID | Item | Category | Impact |
|----|------|----------|--------|
| AU-CD-04 | Procedure-to-Charge Auto-Capture | Coding | $78K-$120K |
| AU-CD-05 | AI-Driven CDI Query Generation | Coding | $95K-$160K |
| AU-RP-04 | Regulatory Filing Preparation | Reporting | $20K-$35K |
| PV-DN-06 (enhanced) | Medical Necessity NLP (full deployment) | Denial Prevention | $85K-$140K |
| PV-CP-03 | FCA Risk Composite Score | Compliance | $200K-$2,000K |
| **Sprint 8 Total** | **5 items** | | **$478K - $2,455K** |

---

## HOW AUTOMATION & PREVENTION CONNECT TO THE FULL PIPELINE

```
Doc 1 (Descriptive)  --> tells you WHAT is happening today
    |
Doc 2 (Root Cause)   --> tells you WHY it happened
    |
Doc 3 (Diagnostic)   --> tells you WHAT TO DO about it
    |
Doc 4 (Predictive)   --> tells you what WILL happen next
    |
Doc 5 (THIS DOCUMENT)--> Part A: DOES the fix automatically
                     --> Part B: STOPS IT FROM HAPPENING AGAIN
    |
    +---> Feeds back to Doc 1: descriptive metrics improve
          --> Denial rate drops
          --> Revenue increases
          --> Cash flow stabilizes
          --> Cost to collect decreases
          --> THE CYCLE CONTINUES, AND THE PLATFORM GETS SMARTER

EVERY automation references:
  - Which prediction triggers it (Doc 4)
  - Which diagnostic it implements (Doc 3)
  - Which root cause it addresses (Doc 2)
  - Which metric it improves (Doc 1)

EVERY prevention references:
  - Which prediction identifies the risk (Doc 4)
  - Which root cause it eliminates (Doc 2)
  - Which metric it protects (Doc 1)
```

---

## CURRENT STATE vs TARGET STATE

```
METRIC                          CURRENT (Manual)    TARGET (Automated + Prevention)
─────────────────────────────────────────────────────────────────────────────────────
Cost to collect:                4.8%                2.8%  (reduction: 42%)
Claims per FTE per day:         45                  85    (increase: 89%)
Avg denial resolution time:     47 days             14 days (reduction: 70%)
First-pass denial rate:         12.3%               5.2%  (reduction: 58%)
AR > 90 days:                   24%                 9%    (reduction: 63%)
Net collection rate:            93.2%               97.1% (increase: 3.9 pts)
Timely filing write-offs:       $94K/year           $12K/year (reduction: 87%)
Silent underpayment leakage:    $183K/year          $22K/year (reduction: 88%)
Appeal volume capacity:         120/month           450/month (increase: 275%)
Appeal success rate:            55%                 68%   (increase: 13 pts)
Patient self-pay collection:    42%                 61%   (increase: 19 pts)
Reconciliation time:            4 hours/day         30 min/day (reduction: 87%)
```

---

## TOTAL ITEMS: 79 Automation + 10 Never-Automate = 89 Items

| Category | Automation | Prevention | Total |
|----------|-----------|------------|-------|
| Claims | 7 | — | 7 |
| Denials | 6 | 8 | 14 |
| Payments | 7 | — | 7 |
| Collections | 6 | — | 6 |
| Eligibility & Access | 5 | — | 5 |
| Coding | 5 | — | 5 |
| Reconciliation | 5 | — | 5 |
| Reporting & Compliance | 7 | 6 | 13 |
| Operational | 7 | 8 | 15 |
| Revenue Leakage | — | 6 | 6 |
| Cash Flow | — | 5 | 5 |
| Never Automate | 10 | — | 10 |
| **TOTAL** | **65** | **33** | **98** |

---

*This document is the action layer of NEXUS. Without it, the platform produces insights. With it, the platform produces revenue.*

*— Marcus Chen, RCM SME, 20 years in the trenches*
