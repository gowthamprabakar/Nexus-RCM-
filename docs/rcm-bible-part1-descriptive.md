# RCM BIBLE -- PART 1: DESCRIPTIVE ANALYTICS & STANDARD REPORTING
## The Definitive "What Happened" Layer for US Healthcare Revenue Cycle Management

> **Author:** Marcus Chen, 20-year US RCM veteran
> **Last updated:** 2026-03-22
> **Platform:** RCM Pulse (Nexus RCM Intelligence Platform)
> **Total metrics:** 187

---

## PURPOSE

This document is the exhaustive, canonical reference for every metric, KPI, and standard report that RCM Pulse must surface. Descriptive analytics answer two questions: **"What happened?"** and **"What is the current state?"** -- pure facts, no root cause, no prediction.

Every metric in this document feeds upstream into root cause analysis (Part 2), diagnostic suggestions (Part 3), predictive analytics (Part 4), automation (Part 5), and prevention (Part 6).

---

## HOW TO READ EACH METRIC

| Field | Description |
|-------|-------------|
| **Metric Name** | Canonical name used in dashboards and reports |
| **Definition** | One-line plain-English explanation |
| **Formula** | Exact calculation, referencing table columns where applicable |
| **Industry Benchmark** | Real US healthcare benchmarks (MGMA, HFMA, AAHAM, CMS sources) |
| **Data Source Tables** | Tables in our `schema.sql` that feed this metric |
| **Reporting Frequency** | How often this metric should be refreshed |

---

# 1. PATIENT ACCESS & REGISTRATION

## 1.1 Eligibility Verification

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PA-01 | Eligibility Verification Rate | Percentage of scheduled patients whose insurance eligibility is verified before the encounter | `COUNT(elig_id WHERE subscriber_status = 'ACTIVE') / COUNT(DISTINCT patient_id with scheduled encounter) * 100` | >= 98% pre-service | `eligibility_271`, `claims` | Daily |
| PA-02 | Eligibility Verification Lag (Days) | Average number of days before the appointment that eligibility is checked | `AVG(date_of_service - inquiry_date)` | >= 3 days before DOS | `eligibility_271`, `claims` | Weekly |
| PA-03 | Real-Time Eligibility (RTE) Success Rate | Percentage of 270/271 transactions that return a valid response (not AAA reject) | `COUNT(response_code = 'EB') / COUNT(*) * 100` | >= 95% | `eligibility_271` | Daily |
| PA-04 | RTE Rejection Rate | Percentage of eligibility inquiries rejected by payer | `COUNT(response_code = 'AAA') / COUNT(*) * 100` | < 5% | `eligibility_271` | Daily |
| PA-05 | Coverage Termination Rate | Percentage of patients whose coverage terminates during active treatment | `COUNT(coverage_id WHERE term_date BETWEEN effective_date AND dos_through) / COUNT(*) * 100` | < 2% | `insurance_coverage`, `claims` | Monthly |
| PA-06 | Insurance Discovery Rate | Percentage of patients where secondary or tertiary coverage is identified | `COUNT(coverage_type IN ('SECONDARY','TERTIARY')) / COUNT(DISTINCT patient_id) * 100` | 1-3% discovery yield | `insurance_coverage` | Monthly |
| PA-07 | Network Status Verification Rate | Percentage of encounters verified as in-network before service | `COUNT(network_status = 'IN') / COUNT(*) * 100` | >= 95% | `eligibility_271` | Weekly |
| PA-08 | Deductible Remaining at DOS | Average remaining deductible at time of service | `AVG(deductible_remaining)` | Varies by Q1-Q4 (highest Q1) | `eligibility_271` | Monthly |
| PA-09 | OOP Max Remaining at DOS | Average out-of-pocket max remaining at time of service | `AVG(oop_remaining)` | Varies by plan type | `eligibility_271` | Monthly |
| PA-10 | Plan Type Distribution | Breakdown of patient encounters by insurance plan type | `COUNT(*) GROUP BY plan_type (HMO/PPO/EPO/POS/HDHP)` | Varies by region | `eligibility_271` | Monthly |

## 1.2 Prior Authorization

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PA-11 | Prior Auth Submission Rate | Percentage of encounters requiring auth that have an auth submitted | `COUNT(auth_id WHERE status != 'PENDING') / COUNT(claim_id WHERE prior_auth_required = TRUE) * 100` | >= 98% | `prior_auth`, `eligibility_271`, `claims` | Weekly |
| PA-12 | Prior Auth Approval Rate | Percentage of submitted prior authorizations that are approved | `COUNT(status = 'APPROVED') / COUNT(*) * 100` | 85-90% | `prior_auth` | Weekly |
| PA-13 | Prior Auth Denial Rate | Percentage of submitted authorizations that are denied | `COUNT(status = 'DENIED') / COUNT(*) * 100` | 5-10% | `prior_auth` | Weekly |
| PA-14 | Prior Auth Pending Rate | Percentage of authorizations still awaiting payer response | `COUNT(status = 'PENDING') / COUNT(*) * 100` | < 5% at any point | `prior_auth` | Daily |
| PA-15 | Auth Turnaround Time (Days) | Average days from auth request to payer response | `AVG(approved_date - requested_date)` | Urgent: 1 day; Standard: 5-7 days | `prior_auth` | Monthly |
| PA-16 | Auth Expiry Rate | Percentage of authorizations that expire before the service is rendered | `COUNT(status = 'EXPIRED') / COUNT(*) * 100` | < 3% | `prior_auth` | Monthly |
| PA-17 | Missing Auth at Submission | Count of claims submitted without a required prior authorization | `COUNT(claims WHERE crs_auth_pts = 0 AND prior_auth_required = TRUE)` | 0 target | `claims`, `prior_auth`, `eligibility_271` | Weekly |
| PA-18 | Auth Units Utilization Rate | Percentage of approved auth units actually consumed | `SUM(units used) / SUM(approved_units) * 100` | 80-95% | `prior_auth`, `claim_lines` | Monthly |
| PA-19 | Retrospective Auth Rate | Percentage of auths filed retrospectively (after service) | `COUNT(auth_type = 'RETROSPECTIVE') / COUNT(*) * 100` | < 5% | `prior_auth` | Monthly |

## 1.3 Patient Demographics & Coverage

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PA-20 | Payer Mix by Volume | Distribution of claims by payer group | `COUNT(claim_id) GROUP BY payer_group` | Varies by org type | `claims`, `payer_master` | Monthly |
| PA-21 | Payer Mix by Revenue | Distribution of charges/collections by payer group | `SUM(total_charges) GROUP BY payer_group` | Varies by org type | `claims`, `payer_master` | Monthly |
| PA-22 | Self-Pay Percentage | Percentage of encounters with no insurance coverage | `COUNT(payer_group = 'G8_SELF_PAY_SECONDARY') / COUNT(*) * 100` | 5-10% typical | `claims`, `payer_master` | Monthly |
| PA-23 | COB (Coordination of Benefits) Volume | Count of claims with secondary or tertiary coverage | `COUNT(DISTINCT claim_id) WHERE coverage_type IN ('SECONDARY','TERTIARY')` | 8-15% of claims | `insurance_coverage`, `claims` | Monthly |
| PA-24 | Referral Required Rate | Percentage of encounters requiring a referral | `COUNT(referral_required = TRUE) / COUNT(*) * 100` | 15-25% (HMO heavy) | `eligibility_271` | Monthly |
| PA-25 | Patient Registration Error Rate | Percentage of claims with demographic/coverage data errors caught by scrubbing | `COUNT(claims WHERE crs_eligibility_pts = 0) / COUNT(*) * 100` | < 3% | `claims` | Weekly |

---

# 2. CODING & CHARGE CAPTURE

## 2.1 Coding Quality & Accuracy

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CC-01 | Coding Accuracy Rate | Percentage of claims coded correctly without post-submission correction | `COUNT(claims WHERE crs_coding_pts = max) / COUNT(*) * 100` | >= 95% | `claims` | Monthly |
| CC-02 | Clean Claim Rate | Percentage of claims passing all edits (CRS, NCCI, payer-specific) on first pass | `COUNT(crs_passed = TRUE) / COUNT(*) * 100` | >= 95%; best-in-class >= 98% | `claims` | Weekly |
| CC-03 | Coding Error Rate by Type | Breakdown of coding errors: upcoding, downcoding, unbundling, modifier, dx mismatch | `COUNT by error_type / COUNT(audited) * 100` | < 5% total error rate | `claims`, `denials` (CO-11, CO-16 denials) | Monthly |
| CC-04 | Case Mix Index (CMI) | Average DRG relative weight across all inpatient discharges | `AVG(drg_relative_weight)` | Community hospital: 1.4-1.6; Academic: 1.8-2.2 | `claims`, `claim_lines` | Monthly |
| CC-05 | CMI Trend (Rolling 12-Month) | Month-over-month CMI to detect coding drift | `AVG(drg_relative_weight) by month, rolling 12` | Stable +/- 3% | `claims` | Monthly |
| CC-06 | HCC Capture Rate | Percentage of expected Hierarchical Condition Category codes actually documented | `HCC codes captured / HCC codes expected * 100` | >= 85% | `claim_lines` | Monthly |
| CC-07 | Modifier Usage Rate | Frequency of modifiers (25, 59, XE, XS, XP, XU, LT, RT) per CPT family | `COUNT(modifier_1 or modifier_2) GROUP BY modifier, cpt_family` | Varies by specialty | `claim_lines` | Monthly |
| CC-08 | E/M Level Distribution | Distribution of E/M codes (99211-99215 / 99281-99285) by provider | `COUNT(*) GROUP BY cpt_code, provider_id` | Bell curve centered at 99213-99214 | `claim_lines`, `claims` | Monthly |

## 2.2 Charge Capture & Lag

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CC-09 | Charge Lag (Days) | Average days between date of service and charge entry | `AVG(created_at::date - date_of_service)` | <= 2 days; best-in-class <= 1 day | `claims` | Weekly |
| CC-10 | Charge Lag Distribution | Percentage of charges captured same day, next day, 2+ days | `COUNT by bucket (0d, 1d, 2d, 3-5d, 6+ d) / COUNT(*) * 100` | >= 90% within 2 days | `claims` | Weekly |
| CC-11 | Coding Turnaround Time | Average days from date of service to coding completion | `AVG(coded_date - date_of_service)` | Professional: 1-2 days; Facility: 3-5 days | `claims` | Weekly |
| CC-12 | Coding Backlog Volume | Count of encounters awaiting coding | `COUNT(claims WHERE status = 'DRAFT' AND date_of_service < TODAY - 2)` | 0 at end of each week | `claims` | Daily |
| CC-13 | Charge per Encounter | Average total charges per encounter by service type | `AVG(total_charges) GROUP BY claim_type, place_of_service` | Varies by specialty and POS | `claims` | Monthly |
| CC-14 | CPT Frequency Distribution | Top CPT codes by volume and revenue contribution | `COUNT(*), SUM(charge_amount) GROUP BY cpt_code ORDER BY COUNT DESC` | Varies by specialty | `claim_lines` | Monthly |
| CC-15 | Revenue Code Distribution (Institutional) | Breakdown of revenue codes for facility claims | `COUNT(*), SUM(charge_amount) GROUP BY revenue_code` | Varies by facility type | `claim_lines` | Monthly |
| CC-16 | Diagnosis Specificity Rate | Percentage of claims using specific (non-unspecified) ICD-10 codes | `COUNT(icd10 NOT LIKE '%.9') / COUNT(*) * 100` | >= 90% | `claim_lines` | Monthly |
| CC-17 | Unbundling Detection Rate | Percentage of claims flagged for potential unbundling (NCCI edits) | `COUNT(flagged for unbundling) / COUNT(*) * 100` | < 2% | `claims`, `claim_lines` | Monthly |
| CC-18 | DRG Mismatch Rate | Percentage of assigned DRGs that differ from expected DRG based on documentation | `COUNT(assigned_drg != expected_drg) / COUNT(inpatient claims) * 100` | < 5% | `claims` | Monthly |

---

# 3. CLAIMS SUBMISSION

## 3.1 Claims Volume & Status

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CS-01 | Total Claims Submitted | Count of claims transmitted to payers in a period | `COUNT(claim_id WHERE submission_date IS NOT NULL) by period` | N/A (volume metric) | `claims` | Daily |
| CS-02 | Claims by Current Status | Distribution of claims across lifecycle stages | `COUNT(claim_id) GROUP BY status` | No more than 10% in any non-terminal status | `claims` | Real-time |
| CS-03 | Claims Submission Volume by Payer | Count of claims submitted grouped by payer | `COUNT(claim_id) GROUP BY payer_id` | N/A (volume metric) | `claims`, `payer_master` | Weekly |
| CS-04 | Claims by Submission Method | Distribution across EDI, paper, and portal submissions | `COUNT(claim_id) GROUP BY submission_method` | >= 95% EDI | `claims` | Monthly |
| CS-05 | Claims by Type (Prof vs Institutional) | Split between 837P and 837I claim types | `COUNT(claim_id) GROUP BY claim_type` | Varies by org | `claims` | Monthly |
| CS-06 | Submission Lag (Days) | Average days from date of service to claim submission | `AVG(submission_date - date_of_service)` | <= 5 days; best-in-class <= 3 days | `claims` | Weekly |
| CS-07 | Submission Lag Distribution | Percentage of claims submitted within 0-3d, 4-7d, 8-14d, 15-30d, 30+d of DOS | `COUNT by lag bucket / COUNT(*) * 100` | >= 80% within 7 days | `claims` | Weekly |

## 3.2 First-Pass & Clean Claim Rates

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CS-08 | First-Pass Acceptance Rate | Percentage of claims accepted by payer on first submission without rejection | `COUNT(claims never in 277CA reject) / COUNT(submitted) * 100` | >= 95%; best-in-class >= 98% | `claims`, `denials` | Monthly |
| CS-09 | First-Pass Payment Rate | Percentage of claims paid without any rework, resubmission, or appeal | `COUNT(status = 'PAID' AND no denial/appeal) / COUNT(submitted) * 100` | >= 85%; best-in-class >= 90% | `claims`, `denials`, `appeals` | Monthly |
| CS-10 | 277CA Rejection Rate | Percentage of submitted claims rejected at clearinghouse or payer front-end | `COUNT(denial_source = '277CA') / COUNT(submitted) * 100` | < 5% | `claims`, `denials` | Weekly |
| CS-11 | 277CA Rejection Volume by Reason | Count of front-end rejections grouped by rejection reason code | `COUNT(*) GROUP BY carc_code WHERE denial_source = '277CA'` | N/A (drill-down) | `denials` | Weekly |
| CS-12 | Claim Resubmission Rate | Percentage of claims that require resubmission after initial rejection | `COUNT(resubmitted claims) / COUNT(submitted) * 100` | < 8% | `claims` | Monthly |
| CS-13 | Average Resubmission Turnaround (Days) | Average days to resubmit a rejected claim | `AVG(resubmission_date - rejection_date)` | <= 5 days | `claims`, `denials` | Monthly |

## 3.3 CRS (Claim Risk Score) Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CS-14 | Average CRS Score | Mean Claim Risk Score across all claims in period | `AVG(crs_score)` | >= 85 out of 100 | `claims` | Daily |
| CS-15 | CRS Score Distribution | Count of claims in CRS buckets: 0-40, 41-60, 61-79, 80-89, 90-100 | `COUNT(*) GROUP BY CASE bucket` | >= 80% scoring 80+ | `claims` | Daily |
| CS-16 | CRS Pass Rate | Percentage of claims meeting CRS threshold (>= 80) | `COUNT(crs_passed = TRUE) / COUNT(*) * 100` | >= 90% | `claims` | Daily |
| CS-17 | CRS Component Score Breakdown | Average score for each CRS sub-component | `AVG(crs_eligibility_pts), AVG(crs_auth_pts), AVG(crs_coding_pts), AVG(crs_cob_pts), AVG(crs_documentation_pts), AVG(crs_evv_pts)` | Each component near max | `claims` | Weekly |
| CS-18 | High-Risk Claims Volume (CRS < 60) | Count of claims with CRS below 60 requiring intervention | `COUNT(crs_score < 60)` | < 5% of total | `claims` | Real-time |
| CS-19 | CRS Failure Reason Distribution | Which CRS components most often cause failure | `COUNT WHERE each component = 0, GROUP BY component` | Eligibility is #1 cause industry-wide | `claims` | Weekly |

## 3.4 Pipeline Stage Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| CS-20 | Stage 1: Charges Captured | Volume and dollar value of charges entered | `COUNT(*), SUM(total_charges)` | N/A | `claims` | Real-time |
| CS-21 | Stage 2: Coded & Scored | Claims with CRS score assigned | `COUNT(crs_score IS NOT NULL)` | N/A | `claims` | Real-time |
| CS-22 | Stage 3: Scrubbed & Passed | Claims passing CRS threshold | `COUNT(crs_passed = TRUE)` | N/A | `claims` | Real-time |
| CS-23 | Stage 4: Submitted to Payer | Claims with submission_date populated | `COUNT(submission_date IS NOT NULL)` | N/A | `claims` | Real-time |
| CS-24 | Stage 5: Adjudicated | Claims with terminal payer response | `COUNT(status IN ('PAID','DENIED','APPEALED'))` | N/A | `claims` | Real-time |
| CS-25 | Stage 6: Payment Posted | Claims with ERA payment matched | `COUNT(era_payments matched to claim_id)` | N/A | `claims`, `era_payments` | Real-time |
| CS-26 | Stage 7: Reconciled | Claims with bank reconciliation confirmed | `COUNT(bank_reconciliation matched)` | N/A | `bank_reconciliation` | Real-time |
| CS-27 | Stage Drop-Off Rate | Percentage of claims lost between consecutive pipeline stages | `(Stage_N - Stage_N+1) / Stage_N * 100` | < 5% drop per stage | Computed | Real-time |
| CS-28 | Pipeline Dwell Time by Stage | Average days a claim spends in each pipeline stage | `AVG(next_stage_timestamp - current_stage_timestamp)` | Varies by stage (submission-to-payment: 14-45 days) | `claims` (timestamp deltas) | Weekly |

---

# 4. DENIAL MANAGEMENT

## 4.1 Denial Volume & Rates

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| DM-01 | Total Denial Count | Number of denied claims in period | `COUNT(denial_id) by period` | N/A (volume) | `denials` | Daily |
| DM-02 | Total Denial Dollars | Dollar value of all denied claims | `SUM(denial_amount) by period` | N/A (volume) | `denials` | Daily |
| DM-03 | Initial Denial Rate (by count) | Percentage of adjudicated claims denied on first pass | `COUNT(denied) / COUNT(adjudicated) * 100` | 5-10%; best-in-class < 5% | `denials`, `claims` | Monthly |
| DM-04 | Initial Denial Rate (by dollars) | Percentage of billed charges denied on first pass | `SUM(denial_amount) / SUM(total_charges adjudicated) * 100` | < 4% of gross revenue | `denials`, `claims` | Monthly |
| DM-05 | Final Denial Rate | Percentage of claims remaining denied after all appeal levels | `COUNT(denials without successful appeal) / COUNT(adjudicated) * 100` | < 4%; best-in-class < 2% | `denials`, `appeals` | Monthly |
| DM-06 | Denial Rate Trend (12-Month Rolling) | Monthly denial rate plotted over 12 months | `Denial rate by month, rolling 12` | Declining trend target | `denials`, `claims` | Monthly |
| DM-07 | Avoidable Denial Rate | Percentage of denials in preventable categories (eligibility, auth, timely filing) | `COUNT(denial_category IN ('ELIGIBILITY','AUTHORIZATION','TIMELY_FILING')) / COUNT(denials) * 100` | Target: < 50% of all denials | `denials` | Monthly |

## 4.2 Denial Breakdown Dimensions

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| DM-08 | Denials by CARC Code | Denial count and dollars grouped by Claim Adjustment Reason Code | `COUNT(*), SUM(denial_amount) GROUP BY carc_code` | CO-16, CO-4, CO-29 are top 3 industry-wide | `denials` | Monthly |
| DM-09 | Denials by RARC Code | Denial count grouped by Remittance Advice Remark Code | `COUNT(*) GROUP BY rarc_code` | N30, N58, MA13 are common | `denials` | Monthly |
| DM-10 | Denials by Category | Denial count grouped by high-level category | `COUNT(*), SUM(denial_amount) GROUP BY denial_category` | Auth + Eligibility typically 40-50% | `denials` | Monthly |
| DM-11 | Denials by Payer | Denial volume and rate per payer | `COUNT(*), denial_rate GROUP BY payer_id` | Varies; Medicaid typically highest | `denials`, `claims`, `payer_master` | Monthly |
| DM-12 | Denials by Provider/Physician | Denial volume and rate per rendering or attending provider | `COUNT(*) GROUP BY rendering_npi via claim_id join` | Varies; outlier detection at > 2 SD | `denials`, `claims`, `providers` | Monthly |
| DM-13 | Denials by CPT/Procedure Family | Denial count grouped by CPT code or procedure family | `COUNT(*) GROUP BY cpt_code via claim_lines join` | N/A (drill-down) | `denials`, `claims`, `claim_lines` | Monthly |
| DM-14 | Denials by Service Line | Denial volume grouped by clinical service line | `COUNT(*) GROUP BY service_line derived from place_of_service + claim_type` | N/A (drill-down) | `denials`, `claims` | Monthly |
| DM-15 | Denials by Place of Service | Denial volume grouped by POS code | `COUNT(*) GROUP BY place_of_service via claim_id` | N/A (drill-down) | `denials`, `claims` | Monthly |
| DM-16 | Denials by DRG (Inpatient) | Denial volume and rate per DRG code | `COUNT(*) GROUP BY drg_code` | N/A (drill-down) | `denials`, `claims` | Monthly |
| DM-17 | Denials by Modifier | Denial volume where a modifier was present on the denied line | `COUNT(*) GROUP BY modifier_1, modifier_2` | Modifier 25, 59 denials are common | `denials`, `claim_lines` | Monthly |
| DM-18 | Denials by Adjustment Type | Distribution across CO (contractual), PR (patient), OA (other), PI (payer initiated) | `COUNT(*) GROUP BY adjustment_type` | CO typically 60-70% | `denials` | Monthly |
| DM-19 | Denials by Day of Week (Submission) | Denial count by the day the original claim was submitted | `COUNT(*) GROUP BY EXTRACT(DOW FROM submission_date)` | Monday submissions may have higher rate | `denials`, `claims` | Monthly |
| DM-20 | Denial Aging at Time of Denial | How old the claim was when it was denied | `AVG(denial_date - date_of_service), bucketed 0-14d, 15-30d, 31-60d, 61-90d, 90+d` | Most denials within 30 days of submission | `denials`, `claims` | Monthly |
| DM-21 | Repeat Denial Rate (Same CARC, 30-Day) | Count of similar denials within 30 days (pattern detection) | `AVG(similar_denial_30d)` | Declining trend indicates learning | `denials` | Monthly |

## 4.3 Payer-Denial Cross-Dimension Matrices

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| DM-22 | Payer x Denial Category Heatmap | Matrix of denial counts by payer and denial category | `COUNT(*) GROUP BY payer_id, denial_category` | Used for targeted payer action plans | `denials`, `payer_master` | Monthly |
| DM-23 | Payer x CARC Code Matrix | Matrix of denial counts by payer and CARC code | `COUNT(*) GROUP BY payer_id, carc_code` | Identifies payer-specific denial patterns | `denials`, `payer_master` | Monthly |
| DM-24 | Payer x CPT Denial Matrix | Matrix of denials by payer and CPT family | `COUNT(*) GROUP BY payer_id, cpt_family` | Identifies procedure-payer conflicts | `denials`, `claims`, `claim_lines`, `payer_master` | Monthly |
| DM-25 | Provider x Denial Category Matrix | Matrix of denial counts by provider and denial category | `COUNT(*) GROUP BY provider_id, denial_category` | Identifies provider training needs | `denials`, `claims`, `providers` | Monthly |

## 4.4 Appeal Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| DM-26 | Appeal Filed Rate | Percentage of denials for which an appeal is submitted | `COUNT(appeal_id) / COUNT(denial_id) * 100` | >= 65% of denials should be appealed | `appeals`, `denials` | Monthly |
| DM-27 | Appeal Win Rate -- Level 1 | Percentage of first-level appeals with outcome = WON or PARTIAL | `COUNT(outcome IN ('WON','PARTIAL') WHERE appeal_type = 'FIRST_LEVEL') / COUNT(FIRST_LEVEL) * 100` | 50-60% | `appeals` | Monthly |
| DM-28 | Appeal Win Rate -- Level 2 | Percentage of second-level appeals with outcome = WON or PARTIAL | `COUNT(outcome IN ('WON','PARTIAL') WHERE appeal_type = 'SECOND_LEVEL') / COUNT(SECOND_LEVEL) * 100` | 40-50% | `appeals` | Monthly |
| DM-29 | Peer-to-Peer Review Success Rate | Percentage of P2P reviews resulting in overturn | `COUNT(outcome = 'WON' WHERE appeal_type = 'PEER_TO_PEER') / COUNT(PEER_TO_PEER) * 100` | 50-70% | `appeals` | Monthly |
| DM-30 | External Review Win Rate | Percentage of external/independent reviews won | `COUNT(outcome = 'WON' WHERE appeal_type = 'EXTERNAL_REVIEW') / COUNT(EXTERNAL_REVIEW) * 100` | 40-55% | `appeals` | Monthly |
| DM-31 | Overall Appeal Overturn Rate | Percentage of all appeals resulting in full or partial payment | `COUNT(outcome IN ('WON','PARTIAL')) / COUNT(appeals with outcome) * 100` | 45-55% | `appeals` | Monthly |
| DM-32 | Appeal Recovery Dollars | Total dollars recovered through successful appeals | `SUM(recovered_amount WHERE outcome IN ('WON','PARTIAL'))` | Track as % of total denial dollars | `appeals` | Monthly |
| DM-33 | Appeal Recovery Rate | Percentage of denied dollars recovered through appeals | `SUM(recovered_amount) / SUM(denial_amount for appealed denials) * 100` | 35-45% | `appeals`, `denials` | Monthly |
| DM-34 | Average Appeal Resolution Time (Days) | Average days from appeal submission to outcome | `AVG(outcome_date - submitted_date)` | 30-45 days | `appeals` | Monthly |
| DM-35 | Appeal Win Rate by CARC Code | Overturn rate grouped by original denial reason code | `Win rate GROUP BY carc_code via denial_id` | Auth denials: 60-70% win; Coding: 40-50% win | `appeals`, `denials` | Monthly |
| DM-36 | Appeal Win Rate by Payer | Overturn rate grouped by payer | `Win rate GROUP BY payer_id via claim_id` | Government payers often lower win rate | `appeals`, `denials`, `claims`, `payer_master` | Monthly |
| DM-37 | Appealable vs Non-Appealable Split | Percentage of denials that are eligible for appeal vs contractual/patient responsibility | `COUNT(adjustment_type = 'CO' AND appealable) vs COUNT(adjustment_type IN ('PR','OA'))` | 50-65% appealable | `denials` | Monthly |
| DM-38 | Appeal Deadline Compliance Rate | Percentage of appeals filed before the payer's appeal deadline | `COUNT(submitted_date <= appeal_deadline) / COUNT(appeals) * 100` | >= 99% | `appeals`, `denials` | Monthly |
| DM-39 | AI-Generated Appeal Rate | Percentage of appeals generated by AI vs manual | `COUNT(ai_generated = TRUE) / COUNT(*) * 100` | Platform-specific | `appeals` | Monthly |
| DM-40 | Appeal Quality Score Average | Mean AI-assessed appeal letter quality score | `AVG(appeal_quality_score)` | >= 7 out of 10 | `appeals` | Monthly |

---

# 5. PAYMENTS & POSTING

## 5.1 Payment Volumes & Posting

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PP-01 | Total ERA Payments Received | Dollar value of all ERA payments in period | `SUM(payment_amount) by period` | N/A (volume) | `era_payments` | Daily |
| PP-02 | ERA Transaction Volume | Count of ERA payment records processed | `COUNT(era_id) by period` | N/A (volume) | `era_payments` | Daily |
| PP-03 | Payments by Payer | Dollar value of payments grouped by payer | `SUM(payment_amount) GROUP BY payer_id` | N/A (mix metric) | `era_payments`, `payer_master` | Weekly |
| PP-04 | Payments by Method (EFT vs Check) | Split between electronic and paper payment methods | `SUM(payment_amount) GROUP BY payment_method` | >= 90% EFT | `era_payments` | Monthly |
| PP-05 | Average Payment per Claim | Mean payment amount per claim | `AVG(payment_amount)` | Varies by specialty and payer | `era_payments` | Monthly |
| PP-06 | Payment Posting Lag (Days) | Average days from ERA receipt to posting in system | `AVG(posted_date - payment_date)` | Same day for auto-post; <= 2 days manual | `era_payments` | Weekly |
| PP-07 | Auto-Post Rate | Percentage of ERA payments auto-posted without manual intervention | Auto-posted ERA count / Total ERA count * 100 | >= 85%; best-in-class >= 95% | `era_payments` | Monthly |
| PP-08 | Unapplied Payments | Dollar value of payments received but not matched to a claim | `SUM(payment_amount WHERE claim match = NULL)` | < 1% of total payments | `era_payments` | Real-time |
| PP-09 | Zero-Pay ERA Rate | Percentage of ERA records with $0 payment (denial EOBs) | `COUNT(payment_amount = 0) / COUNT(*) * 100` | < 10% | `era_payments` | Monthly |

## 5.2 Contractual Adjustments & Variances

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PP-10 | Contractual Adjustment Amount | Total CO (contractual obligation) adjustments | `SUM(co_amount)` | Typically 40-60% of charges | `era_payments` | Monthly |
| PP-11 | Contractual Adjustment Rate | Percentage of billed charges written off as contractual | `SUM(co_amount) / SUM(total_charges) * 100` | 40-60% depending on payer mix | `era_payments`, `claims` | Monthly |
| PP-12 | Payment vs Allowed Amount | Ratio of actual payment to allowed amount per payer | `SUM(payment_amount) / SUM(allowed_amount) * 100` | >= 95% of allowed | `era_payments` | Monthly |
| PP-13 | Underpayment Count | Number of claims paid below contracted/expected rate | `COUNT(payment_amount < expected_allowed * 0.95)` | < 5% of paid claims | `era_payments`, `claims` | Monthly |
| PP-14 | Underpayment Dollar Amount | Total dollar variance on underpaid claims | `SUM(expected_allowed - payment_amount) WHERE payment < expected * 0.95` | Track for recovery | `era_payments`, `claims` | Monthly |
| PP-15 | Overpayment Count | Number of claims paid above contracted/expected rate | `COUNT(payment_amount > expected_allowed * 1.05)` | < 2% | `era_payments`, `claims` | Monthly |
| PP-16 | Overpayment Dollar Amount | Total dollar variance on overpaid claims (refund liability) | `SUM(payment_amount - expected_allowed) WHERE payment > expected * 1.05` | Track for compliance | `era_payments`, `claims` | Monthly |

## 5.3 Patient Responsibility

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PP-17 | Total Patient Responsibility | Dollar value shifted to patient via ERA (deductible + coinsurance + copay) | `SUM(pr_amount)` | 20-35% of allowed in HDHP-heavy populations | `era_payments` | Monthly |
| PP-18 | PR Breakdown: Deductible vs Coinsurance vs Copay | Split of patient responsibility by type from ERA PR reason codes | `SUM by PR-1, PR-2, PR-3 reason codes` | Deductible highest in Q1 | `era_payments`, `denials` (PR adj types) | Monthly |
| PP-19 | Average Patient Balance per Encounter | Mean patient out-of-pocket amount per encounter | `AVG(pr_amount)` | $200-$500 depending on plan type | `era_payments` | Monthly |
| PP-20 | Expected Patient Liability Accuracy | Comparison of pre-service patient liability estimate to actual ERA PR amount | `AVG(ABS(expected_patient_liability - pr_amount) / expected_patient_liability) * 100` | Estimate within 10% of actual | `claims`, `era_payments` | Monthly |

## 5.4 Payment Velocity (ADTP)

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| PP-21 | Overall Average Days to Pay (ADTP) | Average days from date of service to payment receipt | `AVG(payment_date - date_of_service)` | 30-45 days overall | `era_payments`, `claims` | Monthly |
| PP-22 | ADTP by Payer | Average days to pay grouped by payer | `AVG(payment_date - date_of_service) GROUP BY payer_id` | Medicare: 14-18d; Commercial: 21-30d; Medicaid: 30-45d | `era_payments`, `claims`, `payer_master` | Monthly |
| PP-23 | ADTP by Payer Group | Average days to pay by payer classification | `AVG GROUP BY payer_group` | Federal: 14d; Commercial: 25d; Medicaid MCO: 35d | `era_payments`, `claims`, `payer_master` | Monthly |
| PP-24 | ADTP by Procedure Type | Average days to pay by CPT family | `AVG GROUP BY cpt_family` | N/A (internal benchmark) | `era_payments`, `claims`, `claim_lines` | Monthly |
| PP-25 | ADTP by Place of Service | Average days to pay by POS code | `AVG GROUP BY place_of_service` | Inpatient slower than outpatient typically | `era_payments`, `claims` | Monthly |
| PP-26 | ADTP Trend (90-Day Rolling) | Rolling 90-day ADTP recalculated daily | `Rolling AVG over 90 days` | Stable or declining | `era_payments`, `claims` | Daily |
| PP-27 | ADTP vs Payer Benchmark | Comparison of actual ADTP vs payer's stated/contracted ADTP | `Actual ADTP - payer_master.adtp_days` | Within +/- 3 days of benchmark | `era_payments`, `claims`, `payer_master` | Monthly |
| PP-28 | Payment Cycle Hit Rate | Percentage of claims paid within the payer's expected ADTP cycle | `COUNT(paid within expected_payment_date +/- 7d) / COUNT(paid) * 100` | >= 80% | `era_payments`, `claims` | Monthly |

---

# 6. COLLECTIONS & ACCOUNTS RECEIVABLE

## 6.1 AR Aging

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| AR-01 | Total AR Outstanding | Total dollar value of all unpaid claims | `SUM(total_charges - paid_to_date) WHERE status NOT IN ('PAID','WRITTEN_OFF','VOIDED')` | N/A (balance metric) | `claims`, `era_payments` | Real-time |
| AR-02 | AR by Aging Bucket | Dollar value in 0-30, 31-60, 61-90, 91-120, 121-180, 181-365, 365+ day buckets | `SUM by DATEDIFF bucket from date_of_service` | >= 70% in 0-60 days; < 15% over 120 days | `claims`, `era_payments` | Real-time |
| AR-03 | AR by Payer | Outstanding balance grouped by payer | `SUM(outstanding) GROUP BY payer_id` | N/A (drill-down) | `claims`, `era_payments`, `payer_master` | Weekly |
| AR-04 | AR by Payer Group | Outstanding balance grouped by payer classification | `SUM(outstanding) GROUP BY payer_group` | N/A (drill-down) | `claims`, `payer_master` | Weekly |
| AR-05 | AR by Provider | Outstanding balance grouped by rendering/billing provider | `SUM(outstanding) GROUP BY provider_id` | N/A (drill-down) | `claims`, `providers` | Monthly |
| AR-06 | AR by Service Line | Outstanding balance by clinical service line | `SUM(outstanding) GROUP BY derived service_line` | N/A (drill-down) | `claims` | Monthly |
| AR-07 | Days in AR (DAR) | Average number of days revenue remains in accounts receivable | `Total AR / (Net Revenue / Days in Period)` | 30-40 days; best-in-class < 30 days | `claims`, `era_payments` | Monthly |
| AR-08 | Gross Days in AR | DAR calculated using gross charges instead of net revenue | `Total AR / (Gross Charges / Days in Period)` | 40-50 days | `claims` | Monthly |
| AR-09 | AR Over 90 Days Percentage | Percentage of total AR older than 90 days | `AR(>90d) / Total AR * 100` | < 20%; best-in-class < 12% | `claims`, `era_payments` | Monthly |
| AR-10 | AR Over 120 Days Percentage | Percentage of total AR older than 120 days | `AR(>120d) / Total AR * 100` | < 15%; best-in-class < 8% | `claims`, `era_payments` | Monthly |
| AR-11 | AR Growth Rate | Month-over-month change in total AR | `(Current Month AR - Prior Month AR) / Prior Month AR * 100` | Stable or declining | `claims` | Monthly |

## 6.2 Collection Rates

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| AR-12 | Gross Collection Rate | Percentage of total billed charges collected | `SUM(collected) / SUM(total_charges) * 100` | 30-40% (due to contractual adjustments) | `era_payments`, `claims` | Monthly |
| AR-13 | Net Collection Rate | Percentage of expected (allowed) revenue collected | `SUM(collected) / SUM(expected_allowed) * 100` | >= 95%; best-in-class >= 98% | `era_payments`, `claims` | Monthly |
| AR-14 | Adjusted Collection Rate | Collections as percentage of charges minus contractuals | `SUM(collected) / (SUM(charges) - SUM(contractual_adj)) * 100` | >= 95% | `era_payments`, `claims` | Monthly |
| AR-15 | Patient Collection Rate | Percentage of patient responsibility actually collected | `SUM(patient_payments) / SUM(pr_amount) * 100` | 50-70%; best-in-class >= 75% | `era_payments` (patient payments tracked) | Monthly |
| AR-16 | Self-Pay Collection Rate | Percentage of self-pay balances collected | `SUM(self_pay_collected) / SUM(self_pay_billed) * 100` | 20-40% | `claims`, `era_payments` | Monthly |
| AR-17 | Collection Rate by Payer | Net collection rate segmented by payer | `Net collection rate GROUP BY payer_id` | Medicare >= 98%; Commercial >= 95%; Medicaid >= 90% | `era_payments`, `claims`, `payer_master` | Monthly |

## 6.3 Write-Offs & Bad Debt

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| AR-18 | Total Write-Off Amount | Dollar value of all write-offs in period | `SUM(total_charges WHERE status = 'WRITTEN_OFF')` | N/A (minimize) | `claims` | Monthly |
| AR-19 | Write-Off Rate | Percentage of charges written off | `SUM(write_offs) / SUM(total_charges) * 100` | < 3-4% of net revenue | `claims` | Monthly |
| AR-20 | Write-Off by Category | Breakdown: timely filing, small balance, bad debt, charity, admin | `SUM GROUP BY write_off_category` | Timely filing write-offs should be near zero | `claims` | Monthly |
| AR-21 | Bad Debt Amount | Dollar value transferred to bad debt / collection agency | `SUM(bad_debt_transfers)` | 3-5% of net patient revenue | `claims` | Monthly |
| AR-22 | Bad Debt Rate | Percentage of patient responsibility sent to bad debt | `SUM(bad_debt) / SUM(patient_responsibility) * 100` | < 10% of patient AR | `claims` | Monthly |
| AR-23 | Charity Care Amount | Dollar value of charity care adjustments | `SUM(charity_adjustments)` | Varies by org mission (1-5% of gross revenue for non-profits) | `claims` | Monthly |
| AR-24 | Small Balance Write-Off Volume | Count and dollars of balances below threshold written off | `COUNT, SUM WHERE balance < threshold (e.g., $10)` | < 1% of revenue | `claims` | Monthly |
| AR-25 | Timely Filing Write-Off Amount | Dollars lost due to claims exceeding payer filing deadlines | `SUM(denial_amount WHERE carc_code = 'CO-29' AND no successful appeal)` | $0 target | `denials`, `appeals` | Monthly |

---

# 7. RECONCILIATION

## 7.1 ERA-to-Bank Reconciliation

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RC-01 | ERA vs Bank Deposit Total | Comparison of ERA payment sum vs bank deposit for each batch/payer/week | `SUM(era_received_amount) vs SUM(bank_deposit_amount) per week per payer` | Should match within $0.01 | `bank_reconciliation` | Per batch |
| RC-02 | ERA-Bank Variance Amount | Dollar difference between ERA total and bank deposit | `era_received_amount - bank_deposit_amount` per record | $0 variance target | `bank_reconciliation` | Per batch |
| RC-03 | ERA-Bank Variance Percentage | Percentage variance between ERA and bank | `era_bank_variance / era_received_amount * 100` | < 0.5% | `bank_reconciliation` | Per batch |
| RC-04 | Reconciliation Completion Rate | Percentage of payment batches fully reconciled | `COUNT(reconciliation_status = 'RECONCILED') / COUNT(*) * 100` | >= 98% within 5 business days | `bank_reconciliation` | Weekly |
| RC-05 | Unmatched ERA Records | ERA payments with no corresponding bank deposit | `COUNT(bank_deposit_amount IS NULL)` | < 2% of ERA records | `bank_reconciliation` | Weekly |
| RC-06 | Unmatched Bank Deposits (Ghost Payments) | Bank deposits with no matching ERA record | `COUNT(era_received_amount IS NULL AND bank_deposit_amount > 0)` | < 1% of deposits | `bank_reconciliation` | Weekly |
| RC-07 | Float Days | Average days between ERA payment date and bank clearing date | `AVG(bank_clear_date - era_payment_date) GROUP BY payer` | EFT: 1-2 days; Check: 5-10 days | `bank_reconciliation`, `era_payments` | Monthly |
| RC-08 | Reconciliation Aging | Payment batches pending reconciliation by age | `COUNT GROUP BY DATEDIFF bucket` | 0 over 10 business days | `bank_reconciliation` | Weekly |
| RC-09 | Escalated Variance Count | Number of reconciliation records in ESCALATED status | `COUNT(reconciliation_status = 'ESCALATED')` | Minimize | `bank_reconciliation` | Weekly |

## 7.2 Forecast-to-Actual Reconciliation

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RC-10 | Forecast vs Actual ERA Variance | Difference between forecasted and actual ERA payments by payer per week | `era_received_amount - forecasted_amount` | Within +/- 10% | `bank_reconciliation` | Weekly |
| RC-11 | Forecast Variance Percentage | Percentage deviation of actual from forecast | `forecast_variance_pct = (era_received - forecasted) / forecasted * 100` | +/- 10% | `bank_reconciliation` | Weekly |
| RC-12 | Forecast Accuracy Rate | Percentage of payer-weeks where actual falls within forecast confidence interval | `COUNT(actual BETWEEN forecast_range_low AND forecast_range_high) / COUNT(*) * 100` | >= 75% within P25-P75 range | `bank_reconciliation`, `payment_forecast` | Monthly |
| RC-13 | Model Confidence Score Average | Mean confidence score of the forecast model | `AVG(model_confidence)` | >= 0.80 | `payment_forecast` | Weekly |
| RC-14 | ADTP Cycle Hit Accuracy | Percentage of payers whose payment cycle hit as predicted | `COUNT(adtp_cycle_hits = TRUE AND era_received > 0) / COUNT(adtp_cycle_hits = TRUE) * 100` | >= 90% | `payment_forecast`, `bank_reconciliation` | Weekly |
| RC-15 | Forecast Feedback Loop Rate | Percentage of reconciliation records fed back to ML model | `COUNT(fed_back_to_model = TRUE) / COUNT(reconciled) * 100` | 100% target | `bank_reconciliation` | Monthly |

---

# 8. REVENUE & FINANCIAL

## 8.1 Gross Revenue Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RF-01 | Total Charges Billed | Sum of all charges submitted in period | `SUM(total_charges) by period` | N/A (volume) | `claims` | Daily/Monthly |
| RF-02 | Charges by Payer | Charges grouped by payer | `SUM(total_charges) GROUP BY payer_id` | Align with payer mix targets | `claims`, `payer_master` | Monthly |
| RF-03 | Charges by Provider | Charges grouped by billing/rendering provider | `SUM(total_charges) GROUP BY provider_id` | N/A (internal) | `claims`, `providers` | Monthly |
| RF-04 | Charges by Place of Service | Charges grouped by POS code | `SUM(total_charges) GROUP BY place_of_service` | N/A (mix metric) | `claims` | Monthly |
| RF-05 | Charges by CPT/HCPCS Family | Charges grouped by procedure code family | `SUM(charge_amount) GROUP BY LEFT(cpt_code,3)` | N/A (mix metric) | `claim_lines` | Monthly |
| RF-06 | Charges by DRG (Inpatient) | Charges grouped by DRG code for facility claims | `SUM(total_charges) GROUP BY drg_code` | N/A (mix metric) | `claims` | Monthly |
| RF-07 | Average Charge per Encounter | Mean charge per claim by encounter type | `AVG(total_charges) GROUP BY claim_type, place_of_service` | Varies by specialty | `claims` | Monthly |
| RF-08 | Charge Volume Trend | Monthly claim count and charge total over rolling 12 months | `COUNT(claim_id), SUM(total_charges) by month, rolling 12` | Stable or growing | `claims` | Monthly |

## 8.2 Net Revenue & Profitability

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RF-09 | Net Revenue (Collections) | Total cash collected from all payers and patients | `SUM(payment_amount) from era_payments by period` | N/A (target metric) | `era_payments` | Monthly |
| RF-10 | Net-to-Gross Ratio | Percentage of billed charges actually collected | `SUM(collected) / SUM(total_charges) * 100` | 30-40% (same as gross collection rate) | `era_payments`, `claims` | Monthly |
| RF-11 | Revenue per RVU | Collections divided by total relative value units | `SUM(collected) / SUM(rvu)` | $45-$65 per wRVU depending on specialty | `era_payments`, `claim_lines` | Monthly |
| RF-12 | Revenue per Encounter | Average collections per patient encounter | `SUM(collected) / COUNT(DISTINCT claim_id with payment)` | Varies by specialty | `era_payments`, `claims` | Monthly |
| RF-13 | Revenue per Provider | Collections attributed to each provider | `SUM(collected) GROUP BY provider_id` | N/A (productivity metric) | `era_payments`, `claims`, `providers` | Monthly |
| RF-14 | Revenue Leakage Estimate | Total dollar value lost to avoidable denials, write-offs, and underpayments | `SUM(avoidable denial $) + SUM(timely filing write-offs) + SUM(underpayments)` | < 2% of net revenue | `denials`, `appeals`, `era_payments`, `claims` | Monthly |

## 8.3 Cash Flow Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RF-15 | Daily Cash Receipts | Total bank deposits received per day | `SUM(bank_deposit_amount) per day` | N/A (track trend) | `bank_reconciliation` | Daily |
| RF-16 | Weekly Cash Trend | Rolling 13-week bank deposit totals | `SUM(bank_deposit_amount) by week, rolling 13` | Stable or growing | `bank_reconciliation` | Weekly |
| RF-17 | Cash vs Forecast Variance | Actual cash received vs forecasted cash for the period | `(SUM(bank_deposit_amount) - SUM(forecasted_amount)) / SUM(forecasted_amount) * 100` | Within +/- 10% | `bank_reconciliation` | Weekly |
| RF-18 | Cash Acceleration Index | Ratio of current month collections to prior month, adjusted for volume | `(This month collections / This month charges) / (Prior month collections / Prior month charges)` | >= 1.0 (improving) | `era_payments`, `claims` | Monthly |

## 8.4 Cost Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| RF-19 | Cost to Collect | Total RCM operating cost as a percentage of net collections | `Total RCM OpEx / SUM(collected) * 100` | 3-5% of collections; best-in-class < 3% | External (finance system), `era_payments` | Monthly |
| RF-20 | Cost per Claim | Average cost to process a single claim through the entire revenue cycle | `Total RCM OpEx / COUNT(claims processed)` | $5-$10 per claim | External (finance system), `claims` | Monthly |
| RF-21 | Cost per Denial Worked | Average cost to work a single denial (staff time + overhead) | `Denial team OpEx / COUNT(denials worked)` | $25-$50 per denial | External, `denials` | Monthly |
| RF-22 | Cost per Appeal | Average cost to prepare and submit an appeal | `Appeal team OpEx / COUNT(appeals submitted)` | $50-$100 per appeal | External, `appeals` | Monthly |
| RF-23 | Revenue per FTE | Total collections divided by billing/collections FTE count | `SUM(collected) / FTE count` | $400K-$600K per FTE annually | External (HR), `era_payments` | Monthly |

---

# 9. OPERATIONAL

## 9.1 Workforce Productivity

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| OP-01 | Claims Processed per FTE per Day | Average claims worked per billing FTE per day | `COUNT(claims touched) / FTE count / Working days` | 25-40 claims/FTE/day | `claims`, External (HR) | Weekly |
| OP-02 | Denials Worked per FTE per Day | Average denials resolved per denial specialist per day | `COUNT(denials resolved) / Denial FTE / Working days` | 15-25 denials/FTE/day | `denials`, External (HR) | Weekly |
| OP-03 | Appeals Prepared per FTE per Day | Average appeals submitted per appeal specialist per day | `COUNT(appeals submitted) / Appeal FTE / Working days` | 3-5 appeals/FTE/day | `appeals`, External (HR) | Weekly |
| OP-04 | Payments Posted per FTE per Day | Average ERA records posted per payment poster per day | `COUNT(era posted) / Posting FTE / Working days` | 100-200 ERAs/FTE/day | `era_payments`, External (HR) | Weekly |
| OP-05 | Collections Calls per FTE per Day | Average outbound collection calls per collector per day | `COUNT(calls) / Collector FTE / Working days` | 40-80 calls/FTE/day | External (phone system) | Weekly |
| OP-06 | Patient Statements Sent | Volume of patient statements generated and mailed/emailed | `COUNT(statements) by period` | N/A (volume) | External (statement vendor) | Monthly |
| OP-07 | Authorization Requests per FTE per Day | Average auth requests processed per auth specialist per day | `COUNT(auth requests) / Auth FTE / Working days` | 10-20 auths/FTE/day | `prior_auth`, External (HR) | Weekly |

## 9.2 Claim Touches & Resolution Time

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| OP-08 | Average Touches per Claim | Mean number of times a claim is manually handled before final resolution | `AVG(touch_count per claim)` | < 2 touches; best-in-class < 1.5 | `claims` (activity log) | Monthly |
| OP-09 | Average Time to Resolution (Days) | Mean days from claim creation to final status (paid, written off, voided) | `AVG(final_date - created_at)` | 30-45 days | `claims` | Monthly |
| OP-10 | First-Contact Resolution Rate | Percentage of claims resolved (paid) with no rework | Same as First-Pass Payment Rate (CS-09) | >= 85% | `claims`, `denials` | Monthly |
| OP-11 | Rework Rate | Percentage of claims requiring resubmission, appeal, or manual follow-up | `COUNT(claims with rework) / COUNT(submitted) * 100` | < 15% | `claims`, `denials`, `appeals` | Monthly |
| OP-12 | Average Days from Denial to Appeal Submission | Mean lag between receiving a denial and filing the appeal | `AVG(appeal.submitted_date - denial.denial_date)` | < 10 days | `appeals`, `denials` | Monthly |
| OP-13 | Average Days from Appeal to Resolution | Mean lag between filing appeal and getting outcome | Same as DM-34 | 30-45 days | `appeals` | Monthly |

## 9.3 Work Queue Metrics

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| OP-14 | Total Open Work Queue Items | Count of all open/unresolved items across all queues | `COUNT(open items)` | Declining trend target | `claims`, `denials`, `appeals` | Real-time |
| OP-15 | Work Queue Volume by Type | Distribution of open items by queue type (billing, denials, appeals, collections, auth) | `COUNT GROUP BY queue_type` | N/A (operational) | Derived from status across tables | Real-time |
| OP-16 | Work Queue Aging | Average age of items in each work queue | `AVG(TODAY - item_created_date) GROUP BY queue` | < 14 days average | Derived | Weekly |
| OP-17 | Work Queue Throughput Rate | Items resolved per day vs items added per day | `COUNT(resolved today) / COUNT(added today)` | >= 1.0 (clearing faster than accruing) | Derived | Daily |

## 9.4 Compliance & Timely Filing

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| OP-18 | Claims at Timely Filing Risk | Count of claims approaching payer-specific filing deadline | `COUNT(claims WHERE (payer_filing_deadline - TODAY) < 14 days)` | 0 target | `claims`, `payer_master` | Real-time |
| OP-19 | Timely Filing Violations | Count of claims denied for timely filing (CARC CO-29) | `COUNT(denials WHERE carc_code IN ('CO-29','CO-4'))` | 0 target | `denials` | Monthly |
| OP-20 | Timely Filing Write-Off Dollars | Dollars lost to timely filing denials that could not be overturned | Same as AR-25 | $0 target | `denials`, `appeals` | Monthly |
| OP-21 | Appeal Deadline Compliance | Percentage of appeals filed before payer deadline | Same as DM-38 | >= 99% | `appeals`, `denials` | Monthly |
| OP-22 | Credentialing Expiration Alerts | Count of provider credentials expiring within 90 days | `COUNT(providers WHERE credential_expiry < TODAY + 90)` | 0 expired at any time | `providers` | Real-time |
| OP-23 | ERA Enrollment Rate | Percentage of payers with active ERA (835) enrollment | `COUNT(era_enrolled = TRUE) / COUNT(*) * 100` | >= 95% | `payer_master` | Monthly |

## 9.5 EVV Operational Metrics (Home Health)

| # | Metric Name | Definition | Formula | Industry Benchmark | Data Source Tables | Frequency |
|---|------------|------------|---------|--------------------|--------------------|-----------|
| OP-24 | EVV Verification Rate | Percentage of home health visits fully verified by EVV | `COUNT(evv_status = 'VERIFIED') / COUNT(*) * 100` | >= 95% | `evv_visits` | Daily |
| OP-25 | EVV Exception Rate | Percentage of visits with EVV exceptions | `COUNT(evv_status = 'EXCEPTION') / COUNT(*) * 100` | < 5% | `evv_visits` | Daily |
| OP-26 | EVV Denial Rate | Percentage of visits denied by EVV system | `COUNT(evv_status = 'DENIED') / COUNT(*) * 100` | < 2% | `evv_visits` | Weekly |
| OP-27 | EVV Denial by Reason Code | Distribution of EVV denials by reason | `COUNT(*) GROUP BY evv_denial_code` | GPS mismatch (EVV-001) is most common | `evv_visits` | Weekly |
| OP-28 | GPS Verification Rate | Percentage of visits with GPS confirmation at clock-in | `COUNT(gps_verified = TRUE) / COUNT(*) * 100` | >= 95% | `evv_visits` | Weekly |
| OP-29 | Billable Visit Rate | Percentage of EVV visits cleared for billing | `COUNT(billable = TRUE) / COUNT(*) * 100` | >= 93% | `evv_visits` | Weekly |
| OP-30 | EVV Time Discrepancy Rate | Percentage of visits with >15 min variance between scheduled and actual | `COUNT(ABS(actual_duration_min - scheduled_duration_min) > 15) / COUNT(*) * 100` | < 10% | `evv_visits` | Weekly |
| OP-31 | EVV Units Variance | Difference between scheduled and verified units | `SUM(units_scheduled - units_verified)` | < 5% variance | `evv_visits` | Weekly |
| OP-32 | Visits by Clock-In Method | Distribution of visits by verification method | `COUNT(*) GROUP BY clock_in_method` | Mobile app should be >= 80% | `evv_visits` | Monthly |
| OP-33 | Visit Signature Compliance Rate | Percentage of visits with both caregiver and patient signatures | `COUNT(caregiver_signature = TRUE AND patient_signature = TRUE) / COUNT(*) * 100` | >= 98% | `evv_visits` | Weekly |

---

# 10. STANDARD REPORTS (Pre-Built)

## 10.1 Daily Reports

| Report Name | Key Metrics Included | Primary Audience | Delivery |
|-------------|---------------------|------------------|----------|
| Daily Cash Report | RF-15, RC-01, RC-02, PP-01, PP-03 | CFO, Controller | Auto-email 7:00 AM |
| Daily Claims Status Dashboard | CS-01, CS-02, CS-14, CS-16, CS-18 | Billing Manager | Dashboard refresh |
| Daily Denial Snapshot | DM-01, DM-02, DM-08 (top 5), DM-10 | Denial Manager | Auto-email 8:00 AM |
| Daily AR Summary | AR-01, AR-02, OP-18 | AR Manager | Dashboard refresh |
| Daily EVV Exception Report | OP-24, OP-25, OP-27 | Home Health Director | Auto-email 6:00 AM |
| Daily CRS Alert Report | CS-18, CS-19 (high-risk claims) | Billing Supervisor | Dashboard alert |
| Daily Payment Posting Summary | PP-01, PP-02, PP-06, PP-08 | Payment Posting Lead | Dashboard refresh |

## 10.2 Weekly Reports

| Report Name | Key Metrics Included | Primary Audience | Delivery |
|-------------|---------------------|------------------|----------|
| Weekly Revenue Summary | RF-01, RF-08, RF-09, RF-15, RF-16 | CFO, VP Revenue Cycle | Email Monday AM |
| Weekly Denial Trend Report | DM-01 thru DM-06, DM-22, DM-26 thru DM-34 | Denial Team Lead | Email Monday AM |
| Weekly Collections Performance | AR-01 thru AR-06, AR-12 thru AR-17 | Collections Manager | Email Monday AM |
| Weekly Pipeline Flow Report | CS-20 thru CS-28 | Operations Director | Email Monday AM |
| Weekly Payer Scorecard | PP-21 thru PP-28, DM-11, RC-01 thru RC-06 | Payer Relations / Contract Team | Email Monday AM |
| Weekly Forecast vs Actual | RC-10 thru RC-14, RF-17 | CFO, Finance Team | Email Monday AM |
| Weekly Reconciliation Status | RC-01 thru RC-09 | Controller | Email Monday AM |
| Weekly Work Queue Report | OP-14 thru OP-17 | Operations Director | Email Monday AM |

## 10.3 Monthly Reports

| Report Name | Key Metrics Included | Primary Audience | Delivery |
|-------------|---------------------|------------------|----------|
| Monthly Executive Dashboard | RF-01 thru RF-23, DM-01 thru DM-07, AR-07 thru AR-13, PP-21 thru PP-27 | C-Suite | 5th business day |
| Monthly Payer Performance Report | All payer-segmented metrics across all sections | Contract Negotiation Team | 5th business day |
| Monthly Provider Scorecard | DM-12, DM-25, CC-01 thru CC-08, OP-01 thru OP-03 | Medical Director, CMO | 10th business day |
| Monthly Compliance Report | OP-18 thru OP-23, PA-01 thru PA-19, DM-38 | Compliance Officer | 5th business day |
| Monthly Financial Close Package | RF-01 thru RF-23, AR-18 thru AR-25, RC-01 thru RC-15 | Controller, CFO | Last business day |
| Monthly Coding Quality Report | CC-01 thru CC-18 | HIM Director, Coding Manager | 10th business day |
| Monthly Patient Access Report | PA-01 thru PA-25 | Patient Access Director | 5th business day |
| Monthly Denial Deep Dive | DM-01 thru DM-40 (all denial metrics) | VP Revenue Cycle | 5th business day |
| Monthly EVV Compliance Report | OP-24 thru OP-33 | Home Health Director | 5th business day |
| Monthly Cost-to-Collect Report | RF-19 thru RF-23 | CFO | 5th business day |

## 10.4 Quarterly / Annual Reports

| Report Name | Key Metrics Included | Primary Audience | Delivery |
|-------------|---------------------|------------------|----------|
| Quarterly Payer Contract Review | PP-12 thru PP-16, DM-11, DM-23, AR-17 | VP Revenue Cycle, Legal | End of quarter |
| Quarterly CMI & Coding Trend | CC-04, CC-05, CC-06, CC-08 | CMO, HIM Director | End of quarter |
| Annual Revenue Cycle Scorecard | All benchmark metrics vs prior year | Board, C-Suite | January |
| Annual Payer Mix Analysis | PA-20, PA-21, PA-22, RF-02 | Strategic Planning | January |

---

# METRIC SUMMARY

| Section | Metric Range | Count |
|---------|-------------|-------|
| 1. Patient Access & Registration | PA-01 through PA-25 | 25 |
| 2. Coding & Charge Capture | CC-01 through CC-18 | 18 |
| 3. Claims Submission | CS-01 through CS-28 | 28 |
| 4. Denial Management | DM-01 through DM-40 | 40 |
| 5. Payments & Posting | PP-01 through PP-28 | 28 |
| 6. Collections & AR | AR-01 through AR-25 | 25 |
| 7. Reconciliation | RC-01 through RC-15 | 15 |
| 8. Revenue & Financial | RF-01 through RF-23 | 23 |
| 9. Operational | OP-01 through OP-33 | 33 |
| **TOTAL UNIQUE METRICS** | | **235** |
| Standard Reports (Pre-Built) | Daily: 7, Weekly: 8, Monthly: 10, Quarterly/Annual: 4 | **29 reports** |

---

# DATA SOURCE TABLE REFERENCE

| Table Name | Record Volume (Synthetic) | Source System | Primary Metrics Fed |
|------------|--------------------------|---------------|---------------------|
| `payer_master` | 50 | Internal / CMS | PA-20 thru PA-24, PP-22 thru PP-28, DM-11, AR-17 |
| `providers` | 200 | EHR | RF-03, RF-13, DM-12, AR-05, OP-22 |
| `patients` | 50,000 | EHR | PA-08, PA-09 |
| `insurance_coverage` | 85,000 | EHR + Payer API | PA-05, PA-06, PA-23 |
| `claims` | 500,000 | EHR via Waystar 837 | CS-*, CC-*, RF-01 thru RF-08, AR-01 thru AR-11, DM (via join) |
| `claim_lines` | 1,500,000 | EHR | CC-07, CC-08, CC-14 thru CC-17, RF-05, RF-11 |
| `prior_auth` | 120,000 | EHR + Payer Portal | PA-11 thru PA-19 |
| `eligibility_271` | 200,000 | Payer API (270/271) | PA-01 thru PA-04, PA-07 thru PA-10, PA-24 |
| `denials` | 62,000 | Waystar ERA 835 + 277CA | DM-01 thru DM-25, OP-19, AR-25 |
| `appeals` | 27,000 | Internal + Waystar | DM-26 thru DM-40, OP-12, OP-13 |
| `era_payments` | 430,000 | Waystar ERA 835 | PP-01 thru PP-28, RF-09 thru RF-18, AR-12 thru AR-17 |
| `payment_forecast` | 7,800 | Internal ML Model | RC-12 thru RC-14, RF-17 |
| `bank_reconciliation` | 7,800 | Internal (closes cycle) | RC-01 thru RC-15, RF-15 thru RF-17 |
| `evv_visits` | 80,000 | State EVV Aggregators | OP-24 thru OP-33 |

---

# NOTES

1. **No interpretation in this document.** This is the "what happened" layer. Root cause analysis ("why it happened") is in Part 2. Diagnostic suggestions ("what to do about it") are in Part 3.

2. **Industry benchmarks** are sourced from MGMA, HFMA, AAHAM, Advisory Board, and CMS published data. Benchmarks vary significantly by organization type (academic medical center vs community hospital vs physician group vs home health agency). The values listed represent general US healthcare industry medians.

3. **Reporting frequency** indicates the minimum refresh cadence. Real-time metrics are available on-demand via the Command Center dashboard. Daily/weekly/monthly metrics are delivered via scheduled reports and also available interactively.

4. **Every metric is drill-through enabled.** Clicking any metric in the Command Center navigates to the relevant module with filters pre-applied. Aggregates drill to line-item detail.

5. **CRS (Claim Risk Score)** is a proprietary composite score unique to RCM Pulse. It is calculated pre-submission to prevent denials before they happen. CRS metrics appear in Section 3 (Claims Submission) because they are evaluated at submission time.

6. **ADTP (Average Days to Pay)** is payer-specific and cycle-driven, not random. It is the backbone of the payment forecasting engine. ADTP metrics appear in Section 5 (Payments & Posting) because they measure payment velocity.
