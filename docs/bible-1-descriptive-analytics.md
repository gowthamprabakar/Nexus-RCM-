# NEXUS RCM BIBLE — DOCUMENT 1 OF 6
# DESCRIPTIVE ANALYTICS & STANDARD REPORTING
## "What happened? What is the current state?"

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME), Sarah Kim (BA), James Park (PM), Priya Sharma (ARCH)

---

## PURPOSE

This document lists EVERY metric, report, and descriptive analytic that NEXUS RCM
must surface across the platform. Descriptive analytics answer: "What happened?"
and "What is the current state?" — pure facts, no interpretation.

These are the building blocks. Root cause (Doc 2), diagnostics (Doc 3),
prediction (Doc 4), automation (Doc 5), and prevention (Doc 6) all depend
on these descriptive signals being accurate and real-time.

---

## 1. REVENUE DESCRIPTIVE ANALYTICS

### 1.1 Gross Revenue Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| R01 | Total Charges Billed | SUM(total_charges) by period | Daily/Weekly/Monthly | Claims |
| R02 | Charges by Service Line | SUM(total_charges) GROUP BY service_line | Monthly | Claims + Service Line mapping |
| R03 | Charges by Payer | SUM(total_charges) GROUP BY payer_id | Monthly | Claims + Payer |
| R04 | Charges by Provider/Physician | SUM(total_charges) GROUP BY provider_id | Monthly | Claims + Provider |
| R05 | Charges by Place of Service | SUM(total_charges) GROUP BY place_of_service | Monthly | Claims |
| R06 | Charges by CPT/Procedure Family | SUM(total_charges) GROUP BY cpt_family | Monthly | Claims + Procedure |
| R07 | Charges by DRG (Inpatient) | SUM(total_charges) GROUP BY drg_code | Monthly | Claims |
| R08 | Average Charge per Encounter | AVG(total_charges) by encounter type | Monthly | Claims |
| R09 | Charge Volume Trend | COUNT(claims) + SUM(charges) over rolling 12 months | Monthly | Claims |
| R10 | Case Mix Index (CMI) | AVG(drg_relative_weight) | Monthly | Claims + DRG weights |

### 1.2 Net Revenue Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| R11 | Net Collections | SUM(era_paid_amount) by period | Daily/Weekly/Monthly | ERA Payments |
| R12 | Net Collection Rate | SUM(collected) / SUM(expected_allowed) × 100 | Monthly | ERA + Claims |
| R13 | Gross Collection Rate | SUM(collected) / SUM(total_charges) × 100 | Monthly | ERA + Claims |
| R14 | Contractual Adjustments | SUM(contractual_adj) by payer | Monthly | ERA (CO-45 amounts) |
| R15 | Patient Responsibility | SUM(pr_deductible + pr_coinsurance + pr_copay) | Monthly | ERA (PR-1, PR-2, PR-3) |
| R16 | Write-off Amount | SUM(write_offs) by category | Monthly | Adjustments |
| R17 | Bad Debt | SUM(bad_debt_transfers) | Monthly | Patient AR |
| R18 | Charity Care | SUM(charity_adjustments) | Monthly | Adjustments |
| R19 | Revenue per RVU | Total collections / Total RVUs | Monthly | ERA + Procedure RVU table |
| R20 | Revenue per Encounter | Total collections / Total encounters | Monthly | ERA + Encounters |

### 1.3 Cash Flow Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| R21 | Daily Cash Receipts | SUM(bank_deposit_amount) per day | Daily | Bank Reconciliation |
| R22 | Weekly Cash Trend | SUM(bank_deposits) rolling 13 weeks | Weekly | Bank Reconciliation |
| R23 | Cash vs Forecast Variance | (Actual cash - Forecasted cash) / Forecasted × 100 | Weekly | Bank Recon + Forecast |
| R24 | Days Cash on Hand | Cash balance / (Operating expenses / 365) | Monthly | Finance |
| R25 | ERA-to-Bank Gap | SUM(era_paid) - SUM(bank_received) by batch | Per batch | ERA + Bank Recon |

---

## 2. CLAIMS DESCRIPTIVE ANALYTICS

### 2.1 Claims Volume & Status
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| C01 | Total Claims Submitted | COUNT(claims) WHERE submission_date IS NOT NULL | Daily/Weekly | Claims |
| C02 | Claims by Status | COUNT(claims) GROUP BY status | Real-time | Claims |
| C03 | Claims by Payer | COUNT(claims) GROUP BY payer_id | Monthly | Claims + Payer |
| C04 | Claims by Submission Method | COUNT GROUP BY submission_method (EDI/Paper/Portal) | Monthly | Claims |
| C05 | Claim Lag Days | AVG(submission_date - date_of_service) | Monthly | Claims |
| C06 | First Pass Rate | Claims paid on first submission / Total claims × 100 | Monthly | Claims + ERA |
| C07 | Clean Claim Rate | Claims passing all edits / Total claims × 100 | Monthly | Claims + CRS |
| C08 | Claim Rejection Rate (277CA) | Rejected claims / Total submitted × 100 | Weekly | Claims + Clearinghouse |
| C09 | Pending Claims Count | COUNT WHERE status = PENDING by aging bucket | Real-time | Claims |
| C10 | Claim Resubmission Rate | Resubmitted claims / Total claims × 100 | Monthly | Claims |

### 2.2 CRS (Claim Risk Score) Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| C11 | Average CRS Score | AVG(crs_score) | Daily | Claims |
| C12 | CRS Distribution | COUNT by CRS bucket (0-2, 3-4, 5-6, 7-8, 9-10) | Daily | Claims |
| C13 | CRS Pass Rate | COUNT(crs_passed=true) / COUNT(all) × 100 | Daily | Claims |
| C14 | CRS Score by Component | AVG of each: eligibility, auth, coding, cob, documentation, evv | Monthly | Claims |
| C15 | High-Risk Claims Volume | COUNT WHERE crs_score >= 7 | Real-time | Claims |

### 2.3 7-Stage RCM Pipeline Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| C16 | Stage 1: Charge Captured | COUNT + SUM(charges) all claims | Real-time | Claims |
| C17 | Stage 2: Coded | COUNT WHERE crs_score IS NOT NULL | Real-time | Claims |
| C18 | Stage 3: Scrubbed | COUNT WHERE crs_passed = true | Real-time | Claims |
| C19 | Stage 4: Submitted | COUNT WHERE submission_date IS NOT NULL | Real-time | Claims |
| C20 | Stage 5: Adjudicated | COUNT WHERE status IN (PAID, DENIED, PARTIAL) | Real-time | Claims |
| C21 | Stage 6: Payment Posted | COUNT with matching ERA | Real-time | ERA Payments |
| C22 | Stage 7: Reconciled | COUNT with bank reconciliation match | Real-time | Bank Reconciliation |
| C23 | Stage Drop-off Rate | (Stage N count - Stage N+1 count) / Stage N count × 100 | Real-time | Computed |
| C24 | Pipeline Dwell Time | AVG days spent in each stage | Weekly | Claims timestamps |

---

## 3. DENIAL DESCRIPTIVE ANALYTICS

### 3.1 Denial Volume & Rate
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| D01 | Total Denials | COUNT(denials) by period | Daily/Weekly/Monthly | Denials |
| D02 | Denial Rate | Denied claims / Total adjudicated × 100 | Monthly | Denials + Claims |
| D03 | Denial Amount ($) | SUM(denial_amount) | Monthly | Denials |
| D04 | Denial Rate Trend | Denial rate over rolling 12 months | Monthly | Denials + Claims |
| D05 | Initial Denial Rate | First-time denials / Total submitted × 100 | Monthly | Denials |
| D06 | Final Denial Rate | Denials remaining after all appeals / Total × 100 | Monthly | Denials + Appeals |

### 3.2 Denial Breakdown Dimensions
| # | Metric | Dimension | Grain | Source Tables |
|---|--------|-----------|-------|---------------|
| D07 | Denials by CARC Code | GROUP BY carc_code (CO-4, CO-16, CO-50, CO-197, etc.) | Monthly | Denials |
| D08 | Denials by RARC Code | GROUP BY rarc_code (N-codes, M-codes) | Monthly | Denials |
| D09 | Denials by Category | GROUP BY denial_category (CODING, ELIGIBILITY, AUTH, TIMELY, NON_COVERED, COB) | Monthly | Denials |
| D10 | Denials by Payer | GROUP BY payer_id + payer_name | Monthly | Denials + Payer |
| D11 | Denials by Provider/Physician | GROUP BY attending_npi | Monthly | Denials + Claims + Provider |
| D12 | Denials by Service Line | GROUP BY service_line | Monthly | Denials + Claims |
| D13 | Denials by Place of Service | GROUP BY place_of_service | Monthly | Denials + Claims |
| D14 | Denials by CPT/Procedure | GROUP BY cpt_code family | Monthly | Denials + Claims |
| D15 | Denials by DRG | GROUP BY drg_code | Monthly | Denials + Claims |
| D16 | Denials by Coder | GROUP BY coder_id | Monthly | Denials + Claims + Coder |
| D17 | Denials by Modifier | GROUP BY modifier_1, modifier_2 | Monthly | Denials + Claims |
| D18 | Denials by Day of Week | GROUP BY day_of_week(submission_date) | Monthly | Denials |
| D19 | Denials by Claim Age at Denial | Buckets: 0-14d, 15-30d, 31-60d, 61-90d, 90+ | Monthly | Denials |

### 3.3 Payer × Denial Matrix (Heatmap Data)
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| D20 | Payer × Denial Category Matrix | COUNT by (payer, denial_category) | Monthly | Denials + Payer |
| D21 | Payer × CARC Code Matrix | COUNT by (payer, carc_code) | Monthly | Denials + Payer |
| D22 | Payer × CPT Denial Matrix | COUNT by (payer, cpt_family) | Monthly | Denials + Claims + Payer |
| D23 | Payer × Provider Denial Matrix | COUNT by (payer, provider_id) | Monthly | Denials + Claims |

### 3.4 Appeal Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| D24 | Appeal Filed Rate | Appeals filed / Total denials × 100 | Monthly | Appeals + Denials |
| D25 | Appeal Win Rate (Level 1) | L1 wins / L1 appeals × 100 | Monthly | Appeals |
| D26 | Appeal Win Rate (Level 2) | L2 wins / L2 appeals × 100 | Monthly | Appeals |
| D27 | Peer-to-Peer Success Rate | P2P wins / P2P initiated × 100 | Monthly | Appeals |
| D28 | Appeal Recovery Amount | SUM(recovered_amount) from won appeals | Monthly | Appeals + ERA |
| D29 | Average Days to Appeal Resolution | AVG(resolution_date - appeal_filed_date) | Monthly | Appeals |
| D30 | Appeal Win Rate by CARC | Win rate GROUP BY original carc_code | Monthly | Appeals + Denials |
| D31 | Appeal Win Rate by Payer | Win rate GROUP BY payer | Monthly | Appeals + Payer |
| D32 | Appealable vs Non-Appealable Split | Categorization of denials by recoverability | Monthly | Denials |

---

## 4. ACCOUNTS RECEIVABLE DESCRIPTIVE ANALYTICS

### 4.1 AR Aging
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| A01 | Total AR Outstanding | SUM(outstanding_balance) | Real-time | AR Ledger |
| A02 | AR by Aging Bucket | SUM by 0-30, 31-60, 61-90, 91-120, 121-180, 180+ days | Real-time | AR Ledger |
| A03 | AR by Payer | SUM(outstanding) GROUP BY payer | Real-time | AR + Payer |
| A04 | AR by Service Line | SUM(outstanding) GROUP BY service_line | Monthly | AR + Claims |
| A05 | Days in AR (DAR) | Total AR / (Average daily net revenue) | Monthly | AR + Revenue |
| A06 | AR Over 90 Days % | AR > 90 days / Total AR × 100 | Monthly | AR |
| A07 | AR Over 120 Days % | AR > 120 days / Total AR × 100 | Monthly | AR |
| A08 | Payer AR vs Expected | AR balance vs expected collection by payer | Monthly | AR + Contracts |

### 4.2 Collections Metrics
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| A09 | Collections Work Queue Size | COUNT(open tasks) | Real-time | Collections Tasks |
| A10 | Tasks by Priority | COUNT GROUP BY priority | Real-time | Collections Tasks |
| A11 | Tasks by Collector | COUNT GROUP BY assigned_collector | Real-time | Collections Tasks |
| A12 | Promise-to-Pay Rate | Promises obtained / Calls made × 100 | Weekly | Collections Activity |
| A13 | Promise-to-Pay Kept Rate | Payments received / Promises made × 100 | Monthly | Collections Activity |
| A14 | Average Collection per Call | Total collected / Total calls | Weekly | Collections Activity |
| A15 | Patient Payment Rate | Patient payments / Patient responsibility × 100 | Monthly | Patient AR |
| A16 | Self-Pay Conversion Rate | Self-pay collected / Self-pay billed × 100 | Monthly | Patient AR |
| A17 | Average Patient Balance | AVG(patient_balance) | Monthly | Patient AR |

---

## 5. PAYMENT & ERA DESCRIPTIVE ANALYTICS

### 5.1 Payment Posting
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| P01 | Total ERA Payments Posted | SUM(era_paid_amount) | Daily/Weekly | ERA Payments |
| P02 | ERA Volume | COUNT(era_records) | Daily | ERA Payments |
| P03 | Payments by Payer | SUM(paid) GROUP BY payer | Weekly | ERA + Payer |
| P04 | Average Payment per Claim | AVG(paid_amount) | Monthly | ERA |
| P05 | Payment vs Expected Allowed | Paid / Expected Allowed ratio by payer | Monthly | ERA + Claims |
| P06 | Contractual Adjustment Rate | Contractual adj / Billed × 100 | Monthly | ERA |
| P07 | Patient Responsibility Amount | SUM(deductible + coinsurance + copay) | Monthly | ERA |
| P08 | Unapplied Payments | SUM(payments not matched to claims) | Real-time | Payment Posting |
| P09 | Payment Variance (ERA vs Contract) | (ERA paid - Contract rate) by CPT × payer | Monthly | ERA + Contracts |
| P10 | Underpayment Amount | SUM(contract_rate - paid) WHERE paid < contract | Monthly | ERA + Contracts |

### 5.2 ADTP (Average Days to Pay)
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| P11 | Overall ADTP | AVG(payment_date - date_of_service) | Monthly | ERA + Claims |
| P12 | ADTP by Payer | AVG by payer_id | Monthly | ERA + Claims + Payer |
| P13 | ADTP by Procedure Type | AVG by cpt_family | Monthly | ERA + Claims |
| P14 | ADTP by Place of Service | AVG by POS | Monthly | ERA + Claims |
| P15 | ADTP Trend (Rolling 90-day) | Rolling 90-day ADTP recalculated daily | Daily | ERA + Claims |
| P16 | ADTP vs Benchmark | Actual ADTP vs payer benchmark | Monthly | ERA + Benchmarks |

---

## 6. RECONCILIATION DESCRIPTIVE ANALYTICS

### 6.1 ERA-to-Bank Reconciliation
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| B01 | ERA Total vs Bank Total | SUM(era_paid) vs SUM(bank_deposit) per batch | Per batch | ERA + Bank |
| B02 | ERA-Bank Variance Amount | ERA total - Bank total | Per batch | ERA + Bank |
| B03 | ERA-Bank Variance % | (ERA - Bank) / ERA × 100 | Per batch | ERA + Bank |
| B04 | Unmatched ERA Records | ERA payments with no bank deposit match | Weekly | ERA + Bank |
| B05 | Unmatched Bank Deposits | Bank deposits with no ERA match (ghost payments) | Weekly | Bank + ERA |
| B06 | Float Days | AVG(bank_clear_date - era_date) by payer | Monthly | ERA + Bank |
| B07 | Reconciliation Completion Rate | Reconciled records / Total records × 100 | Weekly | Bank Recon |

### 6.2 Contract Reconciliation
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| B08 | Contract Compliance Rate | Payments at contract rate / Total payments × 100 | Monthly | ERA + Contracts |
| B09 | Underpayment Detection Count | Claims paid below contract rate | Monthly | ERA + Contracts |
| B10 | Underpayment Total $ | SUM(contract_rate - paid) WHERE paid < contract | Monthly | ERA + Contracts |
| B11 | Overpayment Detection Count | Claims paid above contract rate | Monthly | ERA + Contracts |
| B12 | Overpayment Total $ | SUM(paid - contract_rate) WHERE paid > contract | Monthly | ERA + Contracts |

---

## 7. PATIENT ACCESS DESCRIPTIVE ANALYTICS

### 7.1 Eligibility & Authorization
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| E01 | Eligibility Verification Rate | Verified / Total scheduled × 100 | Daily | Eligibility |
| E02 | Eligibility Verification Lag | AVG(verification_date - appointment_date) | Weekly | Eligibility |
| E03 | Prior Auth Obtained Rate | Auths obtained / Auths required × 100 | Weekly | Prior Auth |
| E04 | Prior Auth Denial Rate | Auth denied / Auth requested × 100 | Monthly | Prior Auth |
| E05 | Auth Turnaround Time | AVG(auth_response_date - auth_request_date) | Monthly | Prior Auth |
| E06 | Missing Auth at Submission | Claims submitted without required auth | Weekly | Claims + Auth rules |
| E07 | Insurance Discovery Rate | Secondary/tertiary coverage found / Total checked | Monthly | Eligibility |

### 7.2 Patient Demographics & Coverage
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| E08 | Payer Mix Distribution | Claim count/amount by payer type (Commercial/Medicare/Medicaid/Self-Pay) | Monthly | Claims + Payer |
| E09 | Self-Pay Percentage | Self-pay claims / Total claims × 100 | Monthly | Claims |
| E10 | Coverage Termination Rate | Coverage termed during treatment / Total | Monthly | Eligibility |
| E11 | COB (Coordination of Benefits) Volume | Claims with secondary+ payer | Monthly | Claims + Coverage |

---

## 8. CODING DESCRIPTIVE ANALYTICS

### 8.1 Coding Quality
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| CD01 | Coding Accuracy Rate | Clean-coded claims / Total coded × 100 | Monthly | Claims + Audit |
| CD02 | Coding Error Rate by Type | Upcoding / Downcoding / Unbundling / Modifier errors | Monthly | Audit |
| CD03 | Coding Error Rate by Coder | Error rate GROUP BY coder_id | Monthly | Claims + Audit |
| CD04 | Average Coding Turnaround | AVG(coded_date - date_of_service) | Weekly | Claims |
| CD05 | Coding Backlog | COUNT(uncoded encounters) | Real-time | Encounters |
| CD06 | DRG Mismatch Rate | Assigned DRG vs expected DRG discrepancies | Monthly | Claims + CDI |
| CD07 | Modifier Usage Rate | Modifier frequency by CPT | Monthly | Claims |
| CD08 | HCC Capture Rate | HCC codes captured vs expected | Monthly | Claims + Risk Adjustment |

---

## 9. OPERATIONAL DESCRIPTIVE ANALYTICS

### 9.1 Workforce & Productivity
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| O01 | Claims Processed per FTE | Total claims / FTE count by function | Monthly | Claims + HR |
| O02 | Denials Worked per FTE | Denials resolved / FTE in denial team | Monthly | Denials + HR |
| O03 | Collections Calls per FTE | Call count / Collector FTE | Weekly | Collections Activity |
| O04 | Payment Posting Lag | AVG(posted_date - era_received_date) | Weekly | ERA + Posting |
| O05 | Work Queue Aging | AVG days items sit in each work queue | Weekly | Work Queues |
| O06 | Touch Count per Claim | AVG number of times a claim is worked | Monthly | Claim Activity Log |
| O07 | Cost to Collect | Total RCM operating cost / Total collections | Monthly | Finance + Collections |

### 9.2 Compliance & Timely Filing
| # | Metric | Formula | Grain | Source Tables |
|---|--------|---------|-------|---------------|
| O08 | Timely Filing Risk Claims | Claims approaching payer filing deadline | Real-time | Claims + Payer rules |
| O09 | Timely Filing Violations | Claims denied for timely filing | Monthly | Denials (CO-29) |
| O10 | Appeal Timely Filing Risk | Appeals approaching deadline | Real-time | Appeals + Payer rules |
| O11 | Credentialing Expiration Alerts | Provider credentials expiring within 90 days | Real-time | Provider Enrollment |
| O12 | Compliance Audit Findings | Open findings by category | Monthly | Compliance |

---

## 10. STANDARD REPORTS (Pre-Built)

### 10.1 Daily Reports
| Report | Contents | Audience |
|--------|----------|----------|
| Daily Cash Report | R21, R25, P01-P03, B01-B03 | CFO, Controller |
| Daily Claims Status | C01-C02, C08, C15 | Billing Manager |
| Daily Denial Snapshot | D01-D03, D07 top 5 | Denial Manager |
| Daily AR Summary | A01-A02, O08 | AR Manager |

### 10.2 Weekly Reports
| Report | Contents | Audience |
|--------|----------|----------|
| Weekly Revenue Summary | R01-R05, R11-R14 | CFO, VP Rev Cycle |
| Weekly Denial Trend | D01-D06, D20, D24-D29 | Denial Team |
| Weekly Collections Performance | A09-A16 | Collections Manager |
| Weekly Pipeline Flow | C16-C24 | Operations Director |
| Weekly Payer Scorecard | P11-P16, D10, B01-B06 | Payer Relations |

### 10.3 Monthly Reports
| Report | Contents | Audience |
|--------|----------|----------|
| Monthly Executive Dashboard | R01-R20, D01-D06, A01-A08, P11-P16 | C-Suite |
| Monthly Payer Performance | All payer-level metrics | Contract Negotiation |
| Monthly Provider Scorecard | D11, CD01-CD08, O01-O06 | Medical Director |
| Monthly Compliance Report | O08-O12, E01-E06 | Compliance Officer |
| Monthly Financial Close | R11-R20, B01-B12 | Controller |

---

## TOTAL DESCRIPTIVE METRICS: 132

This is the foundation. Every metric listed here feeds into root cause (Doc 2),
diagnostics (Doc 3), prediction (Doc 4), automation (Doc 5), and prevention (Doc 6).

No interpretation. No "why." Just facts and numbers.
The intelligence layers built on top of these facts are in the subsequent documents.
