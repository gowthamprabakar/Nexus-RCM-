# NEXUS RCM BIBLE — DOCUMENT 4 OF 6
# THE PREDICTIONS LIST — COMPLETE CATALOG
## "What WILL happen? When? How much? With what confidence?"

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME), Priya Sharma (ARCH), Alex Rivera (Dev)

---

## PURPOSE

This document lists EVERY prediction the NEXUS RCM platform must be capable of making. A prediction is a forward-looking projection based on historical data, current trends, and statistical models. Each prediction is not a guess — it is a calculated expectation with a confidence interval, a defined accuracy target, and a direct connection to the diagnostic and root cause frameworks defined in Documents 2 and 3.

Predictions without actions are information. Predictions with actions are intelligence. Every prediction here feeds downstream into automation (Doc 5) and prevention (Doc 6).

### How to read each prediction entry

Each prediction includes:
- **Prediction name** and ID
- **What it predicts** — the specific forward-looking statement
- **Input data required** — the signals the model consumes
- **Model type** — regression, time-series, classification, Bayesian, ensemble, etc.
- **Confidence interval methodology** — how uncertainty is quantified
- **Update frequency** — how often the prediction refreshes
- **Accuracy target** — the measurable performance threshold and how it is measured
- **Business impact** — why this prediction matters in dollars or operational terms
- **Connected diagnostic(s)** — reference to Doc 3 (Diagnostic Suggestions)
- **Connected root cause(s)** — reference to Doc 2 (Root Cause Analysis)

---

## SECTION 1: REVENUE PREDICTIONS

### PR-R01: Net Revenue Forecast (30/60/90 Day)

- **What it predicts:** Total net revenue the organization will collect over the next 30, 60, and 90 days
- **Input data required:** Scheduled procedures and estimated charges, historical collection rates by payer and service line, current AR pipeline by stage, denial rate trends, ADTP by payer, contract rates, payer mix projections, seasonal adjustment factors
- **Model type:** Three-layer ensemble — (1) gross charge forecast via time-series, (2) denial-adjusted net via gradient boosted regression, (3) ADTP-timed cash realization via payer-weighted pipeline model
- **Confidence interval methodology:** Bootstrap resampling on historical forecast errors; generate 1,000 simulated revenue paths and report 10th/50th/90th percentile bands
- **Update frequency:** Daily recalculation; weekly executive summary
- **Accuracy target:** +/-3% at 30 days, +/-5% at 60 days, +/-7% at 90 days; measured as MAPE against actual net collections at period close
- **Business impact:** CFO-level planning for payroll, capital expenditures, debt service. A 5% miss on a $10M monthly revenue org = $500K misallocation. Enables proactive cash management rather than reactive scrambling
- **Connected diagnostics:** DS-R01 through DS-R10 (all revenue diagnostics)
- **Connected root causes:** A1.01-A1.10 (revenue leakage decomposition), A2.01-A2.06 (cash flow root causes)

---

### PR-R02: Daily Cash Receipt Forecast

- **What it predicts:** Dollar amount of cash that will be received on each specific day for the next 30 days
- **Input data required:** ADTP by payer (rolling 90 days), claims currently in pipeline by stage, denial rate by payer, historical daily cash receipts (24+ months), holiday calendar, day-of-week effects, ERA posting lag patterns, bank deposit timing
- **Model type:** Time-series (SARIMA with exogenous regressors) + ADTP-weighted pipeline model
- **Confidence interval methodology:** Prediction intervals from time-series model; widening fan based on forecast horizon. 80% and 95% prediction intervals
- **Update frequency:** Daily, every morning before business hours
- **Accuracy target:** +/-5% at 7 days; +/-8% at 14 days; +/-12% at 30 days; measured as daily MAPE
- **Business impact:** Enables treasury management to optimize cash positions. A practice receiving $200K/day that can predict within $10K can optimize overnight investments and manage payables timing
- **Connected diagnostics:** DS-R06 (unapplied payments)
- **Connected root causes:** A2.01 (ADTP delays), A2.02 (ERA posting lag), A2.03 (bank deposit timing)

---

### PR-R03: Weekly Cash Flow Forecast

- **What it predicts:** Net cash flow (receipts minus expected disbursements) per week for the next 13 weeks
- **Input data required:** PR-R02 daily forecast aggregated, scheduled payroll and vendor payment dates, seasonal adjustment factors, holiday calendar, historical weekly cash patterns, anticipated refund volumes
- **Model type:** Time-series with calendar effects + cash flow waterfall model
- **Confidence interval methodology:** Monte Carlo simulation incorporating variability in both receipts and disbursements; 90% confidence band
- **Update frequency:** Weekly, Monday morning
- **Accuracy target:** +/-3% at 4 weeks; +/-6% at 13 weeks; measured as weekly MAPE
- **Business impact:** Working capital management. Identifies weeks where cash will be tight, enabling pre-arranged credit line draws or accelerated collection efforts
- **Connected diagnostics:** DS-R01-DS-R10 (all revenue diagnostics)
- **Connected root causes:** A2.01-A2.06 (all cash flow root causes)

---

### PR-R04: Revenue at Risk from Current Denial Trends

- **What it predicts:** Dollar amount of future revenue that will be lost if current denial trends continue unchanged for the next 30/60/90 days
- **Input data required:** Current denial rate by payer by CARC category, denial rate trend (increasing/decreasing/stable), projected submission volume by payer, average claim value by payer and service line, historical appeal recovery rates
- **Model type:** Trend extrapolation + impact modeling. Projects current denial trajectory forward and multiplies by expected claim volume and average value
- **Confidence interval methodology:** Scenario analysis — optimistic (denial rate improves to 90-day low), expected (current trend continues), pessimistic (denial rate accelerates at current velocity)
- **Update frequency:** Weekly
- **Accuracy target:** +/-10% of actual denial-driven revenue loss; measured retrospectively at 30/60/90 day marks
- **Business impact:** The single most important "call to action" metric. If $450K is at risk from denials and leadership does not act, that money is gone. This prediction is the alarm bell
- **Connected diagnostics:** DS-D01-DS-D10 (all denial diagnostics)
- **Connected root causes:** A1.01 (denial-driven revenue loss), B1.01-B1.10 (macro denial root causes)

---

### PR-R05: Expected Collections by Payer by Time Period

- **What it predicts:** For each active payer, the dollar amount expected to be collected in the next 30, 60, 90, and 120 days
- **Input data required:** AR balance by payer, ADTP by payer, denial rate by payer, historical collection rate by aging bucket by payer, claims in pipeline by stage by payer, contract rates, appeal recovery rates by payer
- **Model type:** Payer-specific collection curve models — logistic regression on aging curves calibrated per payer
- **Confidence interval methodology:** Per-payer confidence intervals based on historical collection rate variance; wider intervals for payers with volatile ADTP
- **Update frequency:** Weekly
- **Accuracy target:** +/-5% per payer per 30-day period; measured as aggregate payer-level MAPE
- **Business impact:** Enables payer-specific AR strategies. If Aetna is expected to collect $800K but UHC only $400K against a $500K expectation, UHC needs immediate attention
- **Connected diagnostics:** DS-P01-DS-P10 (payer-level diagnostics)
- **Connected root causes:** A1.02 (underpayments), A2.01 (ADTP delays)

---

### PR-R06: Gross-to-Net Revenue Forecast

- **What it predicts:** The expected gross-to-net ratio for the next period and the dollar value of contractual adjustments, denials, and write-offs that will reduce gross charges to net revenue
- **Input data required:** Gross charge forecast, contract rates by payer by CPT, expected denial rate, expected write-off rate (timely filing, bad debt, charity), payer mix, modifier adjustment patterns, historical gross-to-net ratio by service line
- **Model type:** Decomposition model — breaks gross-to-net into contractual adjustments (deterministic from contracts), denial adjustments (probabilistic from denial models), and write-off adjustments (propensity-based)
- **Confidence interval methodology:** Component-wise confidence — contractual adjustments are near-deterministic; denial and write-off components carry wider bands. Overall interval is the sum of component intervals
- **Update frequency:** Monthly, with mid-month update if denial trends shift
- **Accuracy target:** +/-2% on gross-to-net ratio; measured as absolute error on ratio at period close
- **Business impact:** Financial reporting accuracy. A practice billing $15M gross with a 45% gross-to-net ratio has $6.75M in adjustments. Being wrong by 2% = $300K forecasting error
- **Connected diagnostics:** DS-R01 (denial-driven loss), DS-R02 (underpayments), DS-R05 (downcoding)
- **Connected root causes:** A1.01-A1.10 (all revenue leakage root causes)

---

### PR-R07: Budget Variance Projection

- **What it predicts:** Whether the organization will finish above, below, or at budget for the current and next fiscal period, and by how much
- **Input data required:** Annual budget by line item, year-to-date actuals, PR-R01 net revenue forecast, historical budget variance patterns, known upcoming changes (new contracts, new providers, service line launches)
- **Model type:** Regression on cumulative actuals + forward forecast overlay. Adjusts for known one-time items and structural changes
- **Confidence interval methodology:** Historical budget variance distribution — what is the range of outcomes given current trajectory? 80% and 95% bands
- **Update frequency:** Monthly
- **Accuracy target:** +/-2% of final actual-to-budget variance; measured at fiscal year end
- **Business impact:** Board-level reporting. Enables mid-year corrective actions. If budget shortfall is projected in Q3, leadership has Q2 to respond with volume growth, expense cuts, or accelerated collections
- **Connected diagnostics:** DS-R01-DS-R10 (all revenue diagnostics)
- **Connected root causes:** A1.01-A1.10 (revenue leakage), A1.11 (revenue decomposition model)

---

### PR-R08: Revenue per RVU Trend Forecast

- **What it predicts:** Direction and magnitude of revenue per RVU over the next 6 months
- **Input data required:** Historical revenue/RVU by month (24+ months), payer mix trends, contract rate changes (known and projected), CPT volume mix shifts, modifier utilization trends
- **Model type:** Trend extrapolation with structural break detection. Decomposes revenue/RVU changes into rate effect, mix effect, and volume effect
- **Confidence interval methodology:** Directional confidence (up/down/stable) with magnitude range. Uses bootstrap on trend components
- **Update frequency:** Monthly
- **Accuracy target:** Directional accuracy >85% (correctly predicts up/down/stable); magnitude within +/-$2/RVU
- **Business impact:** Strategic metric for physician compensation models and practice valuation. Declining revenue/RVU signals contract erosion or coding drift
- **Connected diagnostics:** DS-R05 (downcoding), DS-R08 (contract rate erosion)
- **Connected root causes:** A1.05 (coding downcoding), A1.08 (contract rate erosion), A1.09 (service line mix shift)

---

### PR-R09: Payer Mix Revenue Impact Forecast

- **What it predicts:** Revenue impact of shifting payer mix over the next quarter — how much revenue will be gained or lost purely from changes in the proportion of patients by payer
- **Input data required:** Historical payer mix by month (12+ months), payer mix trend, differential contract rates by payer, scheduled patient volume by payer (if available), employer/enrollment data signals
- **Model type:** Mix-rate-volume decomposition model. Isolates the mix effect from rate and volume changes
- **Confidence interval methodology:** Sensitivity analysis on mix shift assumptions — what if mix shifts 1%, 3%, 5% in each direction?
- **Update frequency:** Monthly
- **Accuracy target:** +/-4% of actual mix-driven revenue change; measured retrospectively
- **Business impact:** Early warning for revenue shifts driven by market forces (employer plan changes, exchange enrollment periods, Medicaid expansion/contraction). A 5% shift from commercial to Medicaid on a $10M book = $500K+ annual impact
- **Connected diagnostics:** DS-R09 (service line mix shift)
- **Connected root causes:** A1.09 (service line mix shift), B1.06 (payer mix shift)

---

### PR-R10: Contract Rate Impact Modeling

- **What it predicts:** Revenue impact of proposed contract rate changes, per payer, per CPT
- **Input data required:** Current contract rates per CPT per payer, proposed rates, historical volume by CPT by payer, volume trend projections, modifier utilization rates
- **Model type:** What-if simulation — deterministic calculation based on input assumptions, with volume sensitivity analysis
- **Confidence interval methodology:** Scenario-based — holds volume constant, then models volume at +/-10% to show range of outcomes
- **Update frequency:** On-demand (triggered during contract negotiation)
- **Accuracy target:** Deterministic accuracy within +/-3% based on volume assumption accuracy; measured at 12 months post-contract
- **Business impact:** Directly informs contract negotiation strategy. A payer offering 2% rate increase on top 10 CPTs may look good, but if they cut rates 5% on CPTs 11-50, net impact could be negative. This model reveals the full picture
- **Connected diagnostics:** DS-R08 (contract rate erosion), DS-P03 (underpayment strategy), DS-P09 (contract fee schedule error)
- **Connected root causes:** A1.08 (payer contract rate erosion)

---

## SECTION 2: DENIAL PREDICTIONS

### PR-D01: Claim-Level Denial Probability (Pre-Submission CRS)

- **What it predicts:** The probability (0-100%) that a specific claim will be denied if submitted in its current form. This is the Claim Risk Score (CRS)
- **Input data required:** CPT code(s), ICD-10 diagnosis codes, payer ID, place of service, modifier(s), auth status (obtained/pending/not required/missing), rendering provider, referring provider, patient eligibility status, historical denial rate for this specific CPT+DX+Payer combination, claim dollar amount, day of week submitted, payer-specific recent denial trend
- **Model type:** Gradient boosted trees (XGBoost/LightGBM) trained on historical claim outcomes. Features engineered from claim attributes and payer-specific behavioral patterns
- **Confidence interval methodology:** Model outputs calibrated probabilities. Calibration measured via reliability diagrams. Brier score tracked. Prediction intervals derived from ensemble variance across trees
- **Update frequency:** Real-time — scored at claim creation, re-scored at any claim edit, re-scored 24 hours before submission
- **Accuracy target:** AUC > 0.85; calibration error < 5% across all deciles; measured via monthly holdout validation on 20% of claims
- **Business impact:** THE most valuable single prediction in the platform. If a claim has a 78% denial probability, it should be reviewed and fixed BEFORE submission. Preventing one denial saves $25-$118 in rework cost per claim. At 10,000 claims/month with 12% denial rate, preventing even 30% of denials = $36K-$142K annual savings in rework alone, plus accelerated cash
- **Connected diagnostics:** DS-C01-DS-C20 (all claim-level diagnostics)
- **Connected root causes:** B3.01-B3.20 (all claim-level root causes)

---

### PR-D02: Denial CARC Code Prediction

- **What it predicts:** If a claim IS denied, which specific CARC (Claim Adjustment Reason Code) category it will receive — top 3 most likely codes with probabilities
- **Input data required:** All PR-D01 inputs + payer-specific CARC distribution patterns, CPT-specific CARC patterns, recent CARC trend shifts per payer, provider-specific CARC history
- **Model type:** Multi-label classification (one-vs-rest gradient boosted classifiers per CARC group). Groups: medical necessity (CO-50), auth-related (CO-197), coding (CO-4, CO-16, CO-97), eligibility (CO-27), timely filing (CO-29), bundling (CO-97), documentation (CO-252)
- **Confidence interval methodology:** Per-class probability calibration. Reports probability for each CARC group
- **Update frequency:** Real-time, alongside PR-D01
- **Accuracy target:** Top-1 accuracy > 60%; Top-3 accuracy > 85%; measured monthly on denied claims
- **Business impact:** Knowing WHICH denial is coming enables targeted pre-submission fixes. If CO-197 (auth) is the predicted CARC, check auth status before submitting. If CO-50 (medical necessity), route to CDI for documentation review. Turns a generic "high risk" flag into a specific corrective action
- **Connected diagnostics:** DS-D01 (payer policy change), DS-C01-DS-C20 (claim-level diagnostics specific to predicted CARC)
- **Connected root causes:** B3.01-B3.20 (mapped to specific CARC codes)

---

### PR-D03: Denial Rate Forecast by Payer (30/60/90 Day)

- **What it predicts:** The expected overall denial rate and denial rate by CARC category for each payer over the next 30, 60, and 90 days
- **Input data required:** Payer-specific denial rate history (rolling 12 months), recent 30-day denial rate trend (direction and velocity), CARC mix shift patterns, submission volume by payer, seasonal denial patterns by payer, known payer policy changes
- **Model type:** Per-payer time-series (exponential smoothing with trend and seasonal components) + change-point detection overlay (CUSUM)
- **Confidence interval methodology:** Time-series prediction intervals (80% and 95%); change-point alerts trigger wider intervals when detected
- **Update frequency:** Weekly
- **Accuracy target:** +/-2 percentage points on 30-day denial rate; +/-3 points at 60 days; +/-4 points at 90 days; measured as MAE on denial rate percentage
- **Business impact:** If UHC denial rate is projected to increase from 10% to 14% over the next 60 days, that represents a significant revenue risk. Proactive staffing and process adjustments can begin immediately. Also feeds into revenue-at-risk calculations (PR-R04)
- **Connected diagnostics:** DS-D01 (payer policy change), DS-D04 (denial rate by payer trend)
- **Connected root causes:** B1.01 (payer policy change), B2.01-B2.10 (payer-level root causes)

---

### PR-D04: Expected Denial Volume by CARC Code Category

- **What it predicts:** The number and dollar value of denials expected in each CARC category over the next 30 days
- **Input data required:** Historical CARC distribution, current CARC trend, PR-D03 payer-level denial rate forecasts, submission volume forecast, average claim value by CARC category
- **Model type:** Compositional time-series — forecasts CARC proportions then multiplies by total denial volume forecast
- **Confidence interval methodology:** Dirichlet-multinomial model for CARC proportions; combined with volume forecast intervals via Monte Carlo
- **Update frequency:** Weekly
- **Accuracy target:** +/-15% on volume per CARC category; +/-10% on total denial volume; measured monthly
- **Business impact:** Enables targeted resource allocation. If CO-50 (medical necessity) is projected to be 45% of denials next month and growing, CDI resources should be increased. If CO-197 (auth) is spiking, the prior auth process needs immediate attention
- **Connected diagnostics:** DS-D01-DS-D10 (denial diagnostics mapped by CARC), DS-C01-DS-C20 (claim-level diagnostics)
- **Connected root causes:** B1.01-B1.10 (macro denial causes), B3.01-B3.20 (claim-level root causes)

---

### PR-D05: Appeal Outcome Prediction (Win Probability per Claim)

- **What it predicts:** The probability that an appeal on a specific denied claim will result in overturning the denial (full or partial payment)
- **Input data required:** CARC code, payer, original denial reason, root cause category (coding/auth/documentation/medical necessity/eligibility), documentation completeness score, historical appeal win rate for this CARC+payer combination, appeal level (1st, 2nd, external), days since denial, claim dollar amount, provider credentials
- **Model type:** Logistic regression with interaction terms for CARC x payer. Simple model preferred for interpretability — stakeholders need to understand WHY a claim is scored high or low for appeal
- **Confidence interval methodology:** Standard logistic regression confidence intervals. Hosmer-Lemeshow test for calibration. Reports probability with 95% CI
- **Update frequency:** Real-time — scored when denial is received
- **Accuracy target:** AUC > 0.80; calibration error < 7%; measured quarterly on appeal outcomes
- **Business impact:** Eliminates wasted appeal effort. If 200 denials arrive per week, and 40% have appeal win probability below 15%, those resources can be redirected to high-probability appeals. A well-calibrated model can increase appeal ROI by 30-50%
- **Connected diagnostics:** DS-C01-DS-C20 (claim-level diagnostics — the fix determines the appeal strategy)
- **Connected root causes:** B3.01-B3.20 (claim-level root causes — root cause determines appeal success)

---

### PR-D06: First-Pass Acceptance Rate Forecast

- **What it predicts:** The percentage of claims that will be accepted (not denied or rejected) on first submission over the next 30/60/90 days, by payer and by service line
- **Input data required:** Historical first-pass rate by payer and service line, current CRS score distribution of claims in pipeline, recent scrubber catch rate, coding error rate trend, auth compliance rate, eligibility verification rate
- **Model type:** Weighted regression — aggregates PR-D01 claim-level denial probabilities across pipeline claims, then adjusts for scrubber intervention rate
- **Confidence interval methodology:** Simulation-based — runs PR-D01 across projected claim volume with probabilistic outcomes to generate first-pass rate distribution
- **Update frequency:** Weekly
- **Accuracy target:** +/-2 percentage points on first-pass rate; measured monthly
- **Business impact:** First-pass rate is the single best operational efficiency metric. Every 1% improvement in first-pass rate at 10,000 claims/month = 100 fewer denials = $2,500-$11,800 in avoided rework + accelerated cash by 30-90 days
- **Connected diagnostics:** DS-D01-DS-D10 (denial diagnostics), DS-C01-DS-C20 (claim-level diagnostics)
- **Connected root causes:** B1.01-B1.10 (macro denial causes)

---

### PR-D07: Denial Financial Impact Projection

- **What it predicts:** Total dollar impact of denials over the next quarter, decomposed into recoverable (via appeal/resubmission) and unrecoverable (final write-off) amounts
- **Input data required:** PR-D03 (denial rate forecast), PR-D04 (CARC volume forecast), PR-D05 (appeal win probability distribution), average claim value by CARC category, historical appeal recovery rate, historical final write-off rate by CARC
- **Model type:** Impact modeling — denial volume x average claim value x (1 - appeal recovery rate) = unrecoverable loss; denial volume x average claim value x appeal recovery rate = recoverable revenue
- **Confidence interval methodology:** Propagates uncertainty from upstream models (denial rate, appeal win rate) via Monte Carlo simulation; reports optimistic/expected/pessimistic scenarios
- **Update frequency:** Monthly
- **Accuracy target:** +/-12% on total denial financial impact; measured quarterly
- **Business impact:** The dollar figure that drives executive attention. "Denials will cost us $1.2M next quarter, of which $480K is recoverable through appeals and $720K will be written off unless root causes are addressed" is a boardroom-ready statement
- **Connected diagnostics:** DS-R01 (denial-driven revenue loss)
- **Connected root causes:** A1.01 (denial-driven revenue loss), B1.01-B1.10 (macro denial root causes)

---

### PR-D08: Denial Recurrence Prediction

- **What it predicts:** For a claim that was denied and corrected/resubmitted, the probability it will be denied AGAIN on resubmission
- **Input data required:** Original denial CARC, correction type applied, payer, CPT, DX, provider, whether the same root cause was addressed, historical re-denial rate for this CARC+correction combination, number of prior denials on this claim
- **Model type:** Binary classification (gradient boosted trees) on resubmission features
- **Confidence interval methodology:** Calibrated probabilities from classification model; Brier score validation
- **Update frequency:** Real-time — scored when corrected claim is queued for resubmission
- **Accuracy target:** AUC > 0.75; measured monthly on resubmission outcomes
- **Business impact:** Prevents the costly cycle of deny-fix-resubmit-deny-fix-resubmit. If re-denial probability is >60%, the correction was likely insufficient. Route to supervisor review before wasting another submission cycle (each cycle = 30-90 days of delayed payment)
- **Connected diagnostics:** DS-C01-DS-C20 (the original claim-level fix)
- **Connected root causes:** B3.01-B3.20 (claim-level root causes — recurring denial means root cause was not truly fixed)

---

### PR-D09: Payer Policy Change Detection and Impact Prediction

- **What it predicts:** Detects when a payer has changed its denial behavior (new policy, coverage change, documentation requirement change) and projects the financial impact of the change
- **Input data required:** Payer-specific denial rate by CARC by CPT, rolling daily, change-point detection thresholds, claim volume by CPT by payer, average claim value
- **Model type:** Change-point detection (CUSUM and PELT algorithms) on payer-CPT-CARC time series + impact projection via affected volume extrapolation
- **Confidence interval methodology:** Change-point detection p-value; impact projection uses scenario analysis based on detected rate shift magnitude
- **Update frequency:** Daily scanning; alert generated within 48 hours of detectable change
- **Accuracy target:** 90% detection within 14 days of actual policy change; <5% false positive rate; measured by correlation with confirmed payer policy updates
- **Business impact:** Early detection of payer behavior shifts is worth tens of thousands per week. If UHC changes medical necessity criteria for CPT 27447 and denial rate jumps from 8% to 35%, every day of delayed detection = 3-5 additional unnecessary denials. At $15K per total knee replacement, that is $45K-$75K per day of delayed response
- **Connected diagnostics:** DS-D01 (payer policy change)
- **Connected root causes:** B1.01 (payer policy change), B2.01 (proprietary medical necessity criteria), B2.02 (PA requirement expansion)

---

### PR-D10: Seasonal Denial Rate Prediction

- **What it predicts:** Expected denial rate by payer for each upcoming quarter, adjusted for known seasonal patterns (Q1 deductible reset, open enrollment effects, year-end payer behavior changes)
- **Input data required:** 24+ months of denial rate by payer by quarter, seasonal decomposition factors, Q1 deductible-related denial history, year-end denial acceleration patterns
- **Model type:** Seasonal decomposition (STL) + trend extrapolation
- **Confidence interval methodology:** Historical seasonal forecast error distribution; 80% prediction interval
- **Update frequency:** Quarterly, with monthly trend check
- **Accuracy target:** +/-8% on quarterly denial rate prediction; measured quarterly
- **Business impact:** Enables proactive staffing for seasonal denial surges. Q1 deductible resets typically drive 15-25% increase in eligibility-related denials. Knowing this enables pre-training, overstaffing, and proactive patient communication
- **Connected diagnostics:** DS-D03 (eligibility verification failure)
- **Connected root causes:** B1.01 (payer policy patterns), B3.09 (eligibility terminated)

---

## SECTION 3: PAYMENT PREDICTIONS

### PR-P01: ADTP-Based Payment Arrival Timing per Payer

- **What it predicts:** The expected number of days from claim submission to payment receipt for each active payer, projected forward 30/60/90 days
- **Input data required:** Rolling 90-day ADTP per payer, ADTP trend (direction and velocity), seasonal adjustment factors, payer financial health signals, holiday calendar, historical ADTP by claim type (professional vs facility)
- **Model type:** Time-series (exponential smoothing) on payer-level ADTP + external signal adjustment for payer financial stress
- **Confidence interval methodology:** +/- range based on ADTP standard deviation per payer. Payers with volatile ADTP get wider intervals
- **Update frequency:** Weekly per payer
- **Accuracy target:** +/-3 days for Medicare/Medicaid; +/-5 days for major commercial; +/-7 days for smaller payers; measured as MAE on claim-level payment timing
- **Business impact:** ADTP directly drives cash flow forecasting. If Blue Cross ADTP is projected to increase from 21 days to 28 days, that is a 33% delay in $2M+ monthly collections from that payer. Cash flow models must reflect this
- **Connected diagnostics:** DS-P10 (payer financial stress)
- **Connected root causes:** A2.01 (ADTP delays), B2.10 (payer financial stress)

---

### PR-P02: Expected ERA Receipt Date for Pending Claims

- **What it predicts:** The specific date on which the ERA (Electronic Remittance Advice) for a given pending claim is expected to arrive
- **Input data required:** Claim submission date, payer ID, ADTP for that payer, claim type (professional/facility), claim complexity (single-line vs multi-line), auth status, historical ERA receipt patterns for this payer
- **Model type:** ADTP-based regression with claim-level adjustments. Claims with prior authorization tend to process faster; complex multi-line claims tend to process slower
- **Confidence interval methodology:** Per-payer prediction interval based on historical variance in ERA timing. Reports expected date with +/- day range
- **Update frequency:** Daily — recalculates as ADTP is updated and as claims age
- **Accuracy target:** +/-5 days for Medicare; +/-7 days for major commercial; +/-10 days for all others; measured as MAE on ERA receipt date vs predicted date
- **Business impact:** Enables proactive AR follow-up. If a claim is 10 days past its predicted ERA date, it should be flagged for investigation without waiting for an arbitrary aging bucket threshold. Moves AR management from reactive (wait until 45 days) to predictive (investigate as soon as expected date passes)
- **Connected diagnostics:** DS-P08 (payer system errors)
- **Connected root causes:** A2.01 (ADTP delays), A2.02 (ERA posting lag)

---

### PR-P03: Payment Amount Prediction (Contract Rate Compliance)

- **What it predicts:** Whether the payer will pay the full contracted rate for a specific claim, and the expected dollar amount of payment
- **Input data required:** Billed amount, contract rate for CPT+payer+POS, modifier adjustments, historical payment ratio for this CPT+payer, multiple procedure reduction patterns, bilateral surgery reduction patterns, assistant surgeon modifier history, anesthesia conversion factors
- **Model type:** Contract-based deterministic calculation + adjustment model for modifiers and reductions + classification overlay for underpayment probability
- **Confidence interval methodology:** Deterministic for single-CPT claims with loaded contracts. Probabilistic for complex multi-line claims — reports range based on historical modifier/reduction variability
- **Update frequency:** Real-time at claim creation; updated when ERA is received for variance detection
- **Accuracy target:** +/-5% for commercial payers with loaded contracts; +/-8% for government payers; measured as MAPE on claim-level payment prediction vs actual
- **Business impact:** Identifies expected revenue per claim before submission, enabling gross-to-net forecasting. Also creates the benchmark for underpayment detection — if predicted payment is $1,200 and actual is $900, that $300 variance triggers an underpayment alert
- **Connected diagnostics:** DS-R02 (silent underpayments), DS-P03 (underpayment strategy), DS-P09 (contract fee schedule error)
- **Connected root causes:** A1.02 (silent underpayment by payer), B2.03 (underpayment strategy), B2.09 (contract fee schedule error)

---

### PR-P04: Patient Payment Probability

- **What it predicts:** The probability that a patient will pay their balance (in full or partial) within 30, 60, 90, and 120 days
- **Input data required:** Patient balance amount, balance aging, patient payment history (prior payments, payment plan compliance), demographic indicators (zip code median income, insurance type), number of prior contact attempts, communication channel (email/text/mail/phone), payment plan status, patient portal registration status, estimate accuracy (was pre-service estimate within 20% of actual?)
- **Model type:** Propensity-to-pay model — logistic regression with behavioral features. Separate models for: (1) initial payment probability, (2) payment plan adherence, (3) full balance resolution
- **Confidence interval methodology:** Calibrated probabilities with Brier score monitoring. Reports probability bands: high (>70%), medium (40-70%), low (<40%) with dollar-weighted expected value
- **Update frequency:** Weekly per patient account; re-scored after each contact attempt or payment
- **Accuracy target:** AUC > 0.80; calibration error < 5%; measured monthly on patient payment outcomes
- **Business impact:** Drives collection strategy segmentation. High-propensity patients get friendly reminders. Medium-propensity patients get payment plan offers. Low-propensity patients get early financial assistance screening. Eliminates the wasteful practice of treating all patient balances identically
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-P05: Secondary Payer Payment Timing Prediction

- **What it predicts:** For claims with coordination of benefits (COB), the expected date and amount of secondary payer payment after primary payer adjudicates
- **Input data required:** Primary payer adjudication date, secondary payer ADTP, primary payer payment amount, patient COB configuration, secondary payer contract rate (if known), historical secondary payer processing time, crossover claim vs manual submission status
- **Model type:** ADTP-based timing model + COB payment calculation. Crossover claims (auto-forwarded) have different timing than manually submitted secondaries
- **Confidence interval methodology:** Separate intervals for crossover vs manual secondaries. Crossover timing is tighter (+/-5 days); manual secondary timing is wider (+/-14 days)
- **Update frequency:** Triggered when primary ERA is received
- **Accuracy target:** +/-5 days for Medicare crossovers; +/-10 days for commercial secondaries; +/-15% on payment amount; measured on COB claims
- **Business impact:** COB claims represent 8-15% of volume in most practices. Accurate secondary timing prevents premature patient billing (billing the patient before secondary payer pays) which causes patient dissatisfaction and refund processing costs
- **Connected diagnostics:** DS-C10 (COB error), DS-P06 (COB disputes)
- **Connected root causes:** B3.10 (COB error)

---

### PR-P06: Payer Float Prediction (Bank Clearance Timing)

- **What it predicts:** The expected number of days between ERA posting and actual bank deposit clearance, per payer
- **Input data required:** Historical ERA-to-bank-deposit lag per payer, bank processing times by day of week, batch size patterns, ACH vs check payment method, payer-specific float patterns
- **Model type:** Pattern recognition on ERA-bank timing gaps. Payers are categorized by payment method (ACH same-day, ACH next-day, check) and float behavior
- **Confidence interval methodology:** Per-payer confidence band based on historical variance in ERA-bank gap
- **Update frequency:** Weekly per payer
- **Accuracy target:** +/-1 day for ACH payers; +/-3 days for check payers; measured as MAE on bank clearance date
- **Business impact:** Cash is not cash until it clears the bank. A payer that posts ERAs on Friday but does not ACH until Monday creates a 2-day float. Aggregated across all payers, float management can affect $50K-$500K in daily cash positioning
- **Connected diagnostics:** DS-R06 (unapplied payments)
- **Connected root causes:** A2.03 (bank deposit timing), A2.05 (float)

---

### PR-P07: Underpayment Detection Probability

- **What it predicts:** The probability that an incoming payment will be below the contracted rate, flagged BEFORE ERA posting
- **Input data required:** Payer ID, CPT code, historical underpayment rate for this payer+CPT, contract loaded status (is contract rate in the system?), recent underpayment trend for this payer, modifier patterns
- **Model type:** Binary classification on claim+payer features. Trained on historical payment-vs-contract variances
- **Confidence interval methodology:** Calibrated classification probability. Reports probability with expected underpayment amount range
- **Update frequency:** Real-time when ERA is received, before auto-posting
- **Accuracy target:** AUC > 0.78; precision > 70% at 50% recall threshold; measured monthly
- **Business impact:** Underpayments are the silent revenue killer. Most organizations do not systematically detect them. If 4% of claims are underpaid by an average of $85, on 10,000 claims/month that is $34,000/month in undetected revenue leakage
- **Connected diagnostics:** DS-R02 (silent underpayments), DS-P03 (underpayment strategy)
- **Connected root causes:** A1.02 (silent underpayment by payer), B2.03 (underpayment strategy), B2.09 (contract fee schedule error)

---

## SECTION 4: AR AND COLLECTIONS PREDICTIONS

### PR-AR01: AR Aging Trajectory (30/60/90 Day Projection)

- **What it predicts:** Where total AR and AR by aging bucket will be in 30, 60, and 90 days given current trends
- **Input data required:** Current AR by aging bucket by payer, historical AR aging migration rates (what % of 0-30 AR moves to 31-60, etc.), submission volume forecast, expected payment volume (from PR-R02), denial forecast (from PR-D03), write-off rate trends
- **Model type:** Markov chain aging migration model — calculates transition probabilities between aging buckets and projects forward. Inflow from new claims, outflow from payments and write-offs
- **Confidence interval methodology:** Monte Carlo simulation on migration probabilities; reports 10th/50th/90th percentile AR trajectories
- **Update frequency:** Weekly
- **Accuracy target:** +/-5% on total AR at 30 days; +/-8% at 60 days; +/-10% at 90 days; measured as MAPE on AR balance
- **Business impact:** AR trajectory tells leadership whether the current operational strategy is working. If AR > 90 days is projected to grow from 12% to 18% of total AR, that is a red flag demanding intervention. Prevents "surprise" AR aging spikes at quarter-end
- **Connected diagnostics:** DS-R01-DS-R10 (all revenue diagnostics)
- **Connected root causes:** A2.01 (ADTP delays), A1.01 (denial-driven loss), A1.07 (patient bad debt)

---

### PR-AR02: Write-Off Probability per Claim in AR

- **What it predicts:** The probability that a specific claim currently in AR will ultimately be written off (zero payment) rather than collected
- **Input data required:** Claim aging days, payer, CARC code (if denied), appeal status, number of touches, balance amount, historical write-off rate for claims with similar characteristics, payer ADTP trend, timely filing deadline proximity
- **Model type:** Survival analysis (Cox proportional hazards) — models the "time to write-off" with claim characteristics as covariates. Produces per-claim write-off probability at each time horizon
- **Confidence interval methodology:** Survival function confidence bands from the Cox model; Kaplan-Meier curves by cohort for validation
- **Update frequency:** Weekly per claim
- **Accuracy target:** AUC > 0.82; calibration error < 6%; measured quarterly on write-off outcomes
- **Business impact:** Enables AR valuation and reserve setting. If total AR is $8M but the model predicts $1.6M will be written off, the true collectible AR is $6.4M. Also prioritizes follow-up — claims with low write-off probability but high balances should be worked first
- **Connected diagnostics:** DS-R03 (timely filing write-offs), DS-R07 (patient bad debt)
- **Connected root causes:** A1.03 (timely filing write-offs), A1.07 (patient bad debt)

---

### PR-AR03: Collection Probability per Account

- **What it predicts:** The probability and expected amount of collection on each patient account, considering all open claims and balances
- **Input data required:** Total account balance, number of open claims, payer mix on the account, aging distribution, payment history, patient payment propensity (PR-P04), payer collection probability by aging, account touch history, bankruptcy/deceased/other closure indicators
- **Model type:** Account-level ensemble — aggregates claim-level collection probabilities and patient payment propensity into a single account score
- **Confidence interval methodology:** Expected value calculation: SUM(claim_balance x collection_probability) per account. Confidence interval from propagated claim-level model uncertainty
- **Update frequency:** Weekly
- **Accuracy target:** Rank-ordering accuracy (Gini coefficient) > 0.75 — meaning the model correctly identifies which accounts are most likely to pay; measured quarterly
- **Business impact:** Drives collections prioritization. If account A has $5,000 balance with 80% collection probability ($4,000 EV) and account B has $10,000 balance with 15% probability ($1,500 EV), account A should be worked first despite lower balance. Maximizes dollar recovery per FTE hour
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-AR04: Days in AR Forecast

- **What it predicts:** The organization's overall Days in AR metric projected forward 30, 60, and 90 days
- **Input data required:** Current total AR, average daily revenue, revenue forecast (PR-R01), AR trajectory (PR-AR01), historical Days in AR trend
- **Model type:** Ratio projection — Days in AR = Total AR / Average Daily Net Revenue. Projects both numerator (AR trajectory) and denominator (revenue forecast) independently
- **Confidence interval methodology:** Combined uncertainty from AR trajectory and revenue forecast models; reports range of Days in AR outcomes
- **Update frequency:** Weekly
- **Accuracy target:** +/-2 days at 30-day horizon; +/-4 days at 90-day horizon; measured as absolute error
- **Business impact:** Days in AR is the top-line operational KPI tracked by healthcare finance executives. Forecasting its trajectory enables proactive interventions. If Days in AR is projected to increase from 42 to 48, that represents 6 days of additional revenue sitting uncollected — on a $250K/day practice, that is $1.5M in additional working capital requirements
- **Connected diagnostics:** DS-R01-DS-R10 (all revenue diagnostics)
- **Connected root causes:** A2.01-A2.06 (all cash flow root causes)

---

### PR-AR05: Bad Debt Conversion Projection

- **What it predicts:** The dollar amount of current AR that will convert to bad debt (uncollectible) over the next quarter
- **Input data required:** Current patient AR by aging bucket, propensity-to-pay scores (PR-P04), historical bad debt conversion rates by aging, patient demographic and insurance indicators, account touch attempts, payment plan status, charity care eligibility indicators
- **Model type:** Propensity model + aging curve analysis. Segments patient AR into risk cohorts and applies cohort-specific conversion rates
- **Confidence interval methodology:** Bootstrap on historical bad debt rates; reports 10th/50th/90th percentile outcomes
- **Update frequency:** Monthly
- **Accuracy target:** +/-10% of actual bad debt at quarter end; measured quarterly
- **Business impact:** Bad debt reserve setting for financial reporting. Also drives the timing of patient outreach — patients in the "tipping point" zone (30-60 days, moderate propensity) have the highest ROI for intervention before they convert to bad debt
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-AR06: Patient Payment Plan Compliance Prediction

- **What it predicts:** The probability that a patient on a payment plan will complete the plan (make all scheduled payments) vs default
- **Input data required:** Payment plan terms (total amount, monthly amount, duration), patient payment history, number of payments made vs scheduled, prior plan default history, balance amount, plan age, communication response rate
- **Model type:** Survival analysis on payment plan duration. Hazard function models the probability of defaulting at each payment interval
- **Confidence interval methodology:** Survival function confidence bands; validated against historical plan completion rates
- **Update frequency:** Monthly per active plan; re-scored after each missed or late payment
- **Accuracy target:** AUC > 0.78 on plan completion/default classification; measured semi-annually
- **Business impact:** Payment plans represent $500K-$2M in expected revenue for most practices. If the model predicts 30% of plans will default, early intervention (phone call, restructured terms) can reduce default rates by 15-25%, recovering $22K-$100K per quarter
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-AR07: AR Collectibility by Payer

- **What it predicts:** The expected dollar amount that will be collected from each payer's AR balance, by aging bucket
- **Input data required:** Payer-specific AR by aging bucket, historical collection rates by payer by aging bucket, payer ADTP trends, denial rate trends, appeal recovery rates by payer, payer financial health signals
- **Model type:** Payer-specific logistic regression on aging curves — calibrated per payer using that payer's historical collection patterns
- **Confidence interval methodology:** Per-payer intervals based on variance in historical collection rates; wider intervals for payers with less history or volatile behavior
- **Update frequency:** Weekly
- **Accuracy target:** +/-5% per payer overall collectibility; measured monthly
- **Business impact:** Payer-level AR valuation. If $2M in Cigna AR has a 92% collectibility rate ($1.84M expected) but $1M in a small regional payer has 65% collectibility ($650K expected), resources should prioritize the regional payer for investigation, not Cigna
- **Connected diagnostics:** DS-P01-DS-P10 (payer-level diagnostics)
- **Connected root causes:** A1.01 (denial-driven loss), A1.02 (underpayments), A2.01 (ADTP delays)

---

## SECTION 5: OPERATIONAL PREDICTIONS

### PR-O01: Claims Volume Forecast (Daily/Weekly)

- **What it predicts:** The number of claims that will need to be submitted each day and week over the next 30 days
- **Input data required:** Scheduled patient encounters, historical encounter-to-claim ratio, coding backlog, unbilled claims inventory, day-of-week submission patterns, holiday calendar, provider schedule changes
- **Model type:** Time-series on daily submission volume + regression on scheduled encounter volume
- **Confidence interval methodology:** Prediction intervals from time-series model; adjusted for known schedule changes
- **Update frequency:** Daily
- **Accuracy target:** +/-10% on daily volume; +/-5% on weekly volume; measured as MAPE
- **Business impact:** Drives billing department staffing and workload distribution. Prevents bottlenecks from unexpected volume spikes and avoids overstaffing during low-volume periods
- **Connected diagnostics:** DS-R04 (dropped charges)
- **Connected root causes:** A1.04 (unbilled/dropped charges)

---

### PR-O02: FTE Workload Prediction

- **What it predicts:** The number of FTEs needed per billing function (coding, charge entry, claim submission, denial management, AR follow-up, patient collections) for the next 2-4 weeks
- **Input data required:** PR-O01 (claims volume forecast), PR-D03 (denial volume forecast), current backlog by function, productivity benchmarks per role per task type, PTO calendar, training time commitments, historical throughput per FTE
- **Model type:** Capacity planning model — demand forecast (claims + denials + AR tasks) / productivity per FTE = required FTEs. Adds buffer for variability
- **Confidence interval methodology:** Demand variability propagation — +/-10% demand change translates to +/-X FTE; reports range of FTE need
- **Update frequency:** Weekly
- **Accuracy target:** +/-0.5 FTE per function per week; measured as MAE vs actual hours worked
- **Business impact:** Prevents both understaffing (missed deadlines, growing backlogs) and overstaffing (wasted payroll). For a 20-FTE billing department at $22/hour average, a 0.5 FTE optimization = $22K annual savings. More importantly, prevents the cascading failures that occur when understaffed teams miss filing deadlines
- **Connected diagnostics:** DS-D01-DS-D10 (denial process diagnostics)
- **Connected root causes:** C1.01-C1.10 (operational root causes — staffing-related)

---

### PR-O03: Work Queue Growth Forecast

- **What it predicts:** The size and growth rate of each work queue (denial management, AR follow-up, coding, claim edits, payment posting) over the next 14 and 30 days
- **Input data required:** Current queue size per queue, historical queue inflow/outflow rates, staffing levels, PR-D03 (denial forecast feeding denial queue), PR-O01 (volume forecast feeding coding/submission queues), seasonal patterns
- **Model type:** Queuing theory — arrival rate vs service rate determines queue growth/shrinkage trajectory. Little's Law: L = lambda * W
- **Confidence interval methodology:** Stochastic queuing model simulation; reports probability of queue exceeding capacity thresholds
- **Update frequency:** Daily
- **Accuracy target:** +/-10% on queue size at 7 days; +/-15% at 14 days; measured as MAPE
- **Business impact:** Predicts bottlenecks before they form. If the denial queue is projected to grow from 500 to 800 items in 14 days, management can reassign staff or approve overtime BEFORE the backlog creates timely filing risks
- **Connected diagnostics:** DS-D01-DS-D10 (denial diagnostics)
- **Connected root causes:** C1.01-C1.10 (operational root causes)

---

### PR-O04: Timely Filing Risk Forecast

- **What it predicts:** Identifies specific claims that will miss their payer filing deadline if not worked within a specified timeframe, and quantifies the total dollars at risk
- **Input data required:** Days since date of service per claim, payer-specific filing deadline per claim, current claim status (coded/not coded, submitted/not submitted, denied/appealed), average remaining processing time by status, payer-specific filing deadline table
- **Model type:** Rule-based deterministic model + probabilistic processing time overlay. Calculates: filing deadline - days elapsed - expected remaining processing days = buffer days. Claims with <14 buffer days are flagged
- **Confidence interval methodology:** Processing time confidence interval determines risk level: high (>50% chance of missing), medium (20-50%), low (<20%)
- **Update frequency:** Daily
- **Accuracy target:** 100% of claims that ultimately miss filing deadline should have been flagged at least 14 days prior; measured as recall on timely filing write-offs
- **Business impact:** Timely filing write-offs are 100% preventable revenue loss. Every claim flagged and worked before deadline = full revenue recovery. The typical practice writes off $50K-$200K annually to timely filing. This prediction should drive that to near zero
- **Connected diagnostics:** DS-R03 (timely filing write-offs), DS-P05 (timely filing tightening)
- **Connected root causes:** A1.03 (timely filing write-offs), B3.12 (timely filing exceeded)

---

### PR-O05: Backlog Clearance Timeline

- **What it predicts:** For each operational queue with a backlog (items > target), the estimated number of days to clear the backlog to target levels given current staffing and throughput
- **Input data required:** Current backlog size per queue, current staff allocated, current throughput per FTE, new item arrival rate, target queue size, available overtime or temporary staff
- **Model type:** Deterministic flow model — (backlog - target) / (throughput - arrival rate) = days to clear. Adjusted for staffing changes and variability
- **Confidence interval methodology:** Sensitivity on throughput and arrival rate assumptions; reports best/expected/worst case timelines
- **Update frequency:** Daily for queues with active backlogs
- **Accuracy target:** +/-3 days for backlogs expected to clear within 14 days; +/-7 days for longer backlogs; measured against actual clearance date
- **Business impact:** Sets realistic expectations for leadership and identifies when additional resources are needed. If the coding backlog will take 45 days to clear but claims are approaching 30-day submission targets, temporary coders are needed NOW, not in 30 days
- **Connected diagnostics:** DS-R03 (timely filing write-offs), DS-R04 (dropped charges)
- **Connected root causes:** C1.01-C1.10 (operational root causes)

---

### PR-O06: Coding Turnaround Prediction

- **What it predicts:** Expected coding completion date for each uncoded encounter
- **Input data required:** Encounter date, service type (inpatient, outpatient, ED), coding complexity, current coding backlog position, coder capacity, coder specialization (not all coders can code all service types), historical throughput by encounter type
- **Model type:** Queuing model with priority scheduling — inpatient DRG coding may be prioritized differently than professional fee coding
- **Confidence interval methodology:** +/- range based on throughput variability and queue position uncertainty
- **Update frequency:** Daily
- **Accuracy target:** +/-1 business day for encounters within 5 days of expected completion; +/-3 days for longer queues; measured as MAE
- **Business impact:** Coding turnaround directly affects claim submission timing which affects cash flow timing. If coding turnaround is projected to be 8 days (vs 3-day target), claims will be submitted 5 days late, pushing cash out by 5 days on every claim in the backlog
- **Connected diagnostics:** DS-R04 (dropped charges)
- **Connected root causes:** C1.02 (coding backlog), A1.04 (unbilled/dropped charges)

---

### PR-O07: Cost to Collect Projection

- **What it predicts:** Projected cost-to-collect ratio for the next quarter — the total operational cost of the billing department divided by total net collections
- **Input data required:** Staffing costs (FTEs x wages x benefits), technology costs, clearinghouse costs, outsourcing costs, postage/statement costs, estimated denial volume (drives rework cost), estimated collections volume (PR-R01), appeal costs, credit card processing fees
- **Model type:** Cost modeling — sums all cost components and divides by projected collections. Sensitivity on denial rate (higher denials = higher rework cost = higher cost-to-collect)
- **Confidence interval methodology:** Monte Carlo on cost and collection inputs; reports cost-to-collect range
- **Update frequency:** Monthly
- **Accuracy target:** +/-0.5 percentage points on cost-to-collect ratio; measured quarterly
- **Business impact:** The efficiency metric for the billing operation. National benchmark is 3-5% for hospital billing, 5-8% for physician billing. If cost-to-collect is projected to exceed 7%, it signals either too many denials (rework cost) or too low collections (denominator shrinking)
- **Connected diagnostics:** DS-R01-DS-R10 (all revenue diagnostics affect the denominator)
- **Connected root causes:** A1.01-A1.10 (revenue leakage increases cost-to-collect ratio)

---

### PR-O08: Appeal Deadline Risk Forecast

- **What it predicts:** Identifies denied claims where the payer appeal deadline will be missed if the appeal is not filed within a specified timeframe
- **Input data required:** Denial date per claim, payer-specific appeal filing deadline, current appeal status (not started, in review, documentation gathering, ready to file), average appeal processing time by stage, appeal writer workload
- **Model type:** Rule-based with processing time overlay — identical methodology to PR-O04 but for appeal deadlines
- **Confidence interval methodology:** Processing time confidence interval determines risk level
- **Update frequency:** Daily
- **Accuracy target:** 100% of appeals that ultimately miss deadline should have been flagged 7+ days prior; measured as recall on missed appeal deadlines
- **Business impact:** A missed appeal deadline is permanent revenue loss for that claim. If the average denied claim is $2,500 and 5 appeals per month miss deadlines, that is $150K annually in 100% preventable losses
- **Connected diagnostics:** DS-C01-DS-C20 (claim-level diagnostics — the appeal strategy depends on root cause)
- **Connected root causes:** B3.01-B3.20 (claim-level root causes)

---

## SECTION 6: PAYER BEHAVIOR PREDICTIONS

### PR-PB01: Payer ADTP Trend Projection

- **What it predicts:** Whether each payer's ADTP will increase, decrease, or remain stable over the next 90 days, and by how much
- **Input data required:** Rolling 12-month ADTP by payer, trend direction and velocity, seasonal patterns, payer system migration announcements, industry ADTP benchmarks, payer-specific disruption signals (system outages, staffing changes)
- **Model type:** Time-series with trend and seasonal components + change-point detection for structural shifts
- **Confidence interval methodology:** Directional confidence + magnitude range; alerts when trend change is statistically significant (p < 0.05)
- **Update frequency:** Weekly
- **Accuracy target:** Directional accuracy > 80% (correctly predicts ADTP going up/down/stable); magnitude within +/-3 days; measured monthly
- **Business impact:** ADTP is the leading indicator of payer behavior. A payer whose ADTP is increasing by 2 days per month will have 6 additional days of delay in 90 days. On $1M/month in claims to that payer, that is $200K in additional working capital tied up
- **Connected diagnostics:** DS-P10 (payer financial stress)
- **Connected root causes:** A2.01 (ADTP delays), B2.10 (payer financial stress)

---

### PR-PB02: Payer Denial Rate Trend Projection

- **What it predicts:** Direction and magnitude of denial rate change per payer over the next 90 days
- **Input data required:** Rolling 12-month denial rate by payer, trend velocity, CARC composition trends, CPT-specific denial pattern shifts, known payer policy change announcements
- **Model type:** Time-series trend analysis with decomposition by CARC category. Identifies whether overall trend is driven by one CARC category or is systemic
- **Confidence interval methodology:** Trend significance testing; 80% and 95% prediction intervals on denial rate trajectory
- **Update frequency:** Weekly
- **Accuracy target:** Directional accuracy > 80%; denial rate forecast within +/-2 percentage points at 30 days; measured monthly
- **Business impact:** Combined with PR-PB01 (ADTP trend), creates the payer behavior signal. A payer with increasing ADTP AND increasing denial rate is either in financial distress or actively tightening reimbursement. Either way, it demands strategic response
- **Connected diagnostics:** DS-D01 (payer policy change), DS-P01-DS-P10 (payer-level diagnostics)
- **Connected root causes:** B1.01 (payer policy change), B2.01-B2.10 (payer-level root causes)

---

### PR-PB03: Contract Renewal Outcome Prediction

- **What it predicts:** For upcoming contract renewals, the likely outcome — rate increase, rate decrease, rate hold, or contract termination — and the estimated rate change magnitude
- **Input data required:** Current contract rates vs regional benchmarks, historical rate negotiation outcomes with this payer, practice market share with this payer, patient volume trends, competitive landscape (alternative providers), payer-specific profitability indicators, contract term expiration date
- **Model type:** Bayesian inference — combines prior outcomes with current market signals to estimate renewal outcome probabilities
- **Confidence interval methodology:** Posterior probability distribution over outcomes: P(increase) + P(hold) + P(decrease) + P(terminate) = 1, with expected rate change magnitude per scenario
- **Update frequency:** Monthly for contracts expiring within 12 months; quarterly for all others
- **Accuracy target:** Directional accuracy > 65% on rate change direction; outcome category accuracy > 50%; measured at contract renewal
- **Business impact:** Enables proactive contract negotiation strategy. If rate decrease is predicted, begin preparation of quality metrics, patient access data, and competitive analysis NOW, not at the negotiation table. Strategic value is high even if precision is moderate
- **Connected diagnostics:** DS-R08 (contract rate erosion), DS-P03 (underpayment strategy)
- **Connected root causes:** A1.08 (payer contract rate erosion)

---

### PR-PB04: Payer Policy Change Impact Forecast

- **What it predicts:** When a payer policy change is detected (via PR-D09), this model projects the total financial impact over the next 6-12 months
- **Input data required:** Detected policy change parameters (which CPTs affected, new denial rate, effective date), historical claim volume for affected CPTs with this payer, average claim value, expected appeal recovery rate for new denial type, duration until practice process adjustment is expected
- **Model type:** Impact projection — affected volume x new denial rate x average claim value x (1 - appeal recovery rate) x projected duration = total financial impact
- **Confidence interval methodology:** Scenario analysis — fast adaptation (2 weeks), normal adaptation (6 weeks), slow adaptation (12 weeks)
- **Update frequency:** Triggered when PR-D09 detects a policy change
- **Accuracy target:** +/-20% on total financial impact (acceptable tolerance given uncertainty of policy change scope); measured at 6 months post-detection
- **Business impact:** Translates a detected signal into a dollar figure that drives action priority. "UHC changed medical necessity criteria for 5 orthopedic CPTs — projected 12-month impact is $180K-$350K if not addressed within 6 weeks" is actionable intelligence
- **Connected diagnostics:** DS-D01 (payer policy change), DS-P01 (proprietary medical necessity criteria), DS-P02 (PA requirement expansion)
- **Connected root causes:** B1.01 (payer policy change), B2.01 (proprietary medical necessity criteria)

---

### PR-PB05: Payer Financial Health Score

- **What it predicts:** A composite 0-100 score for each payer indicating the payer's financial stability and payment reliability
- **Input data required:** ADTP trend (PR-PB01), denial rate trend (PR-PB02), payment amount trend (are average payments declining?), ERA-bank gap trend (PR-P06), industry financial health indicators (if available — AM Best ratings, state insurance department filings), payment method changes (switching from ACH to check)
- **Model type:** Multi-signal composite scoring model — weighted combination of behavioral signals. Each signal contributes a sub-score; weights are calibrated on historical payer distress events
- **Confidence interval methodology:** Signal coverage score — how many of the input signals are available and how reliable are they. Higher signal coverage = higher confidence in the score
- **Update frequency:** Monthly; weekly for payers with declining scores
- **Accuracy target:** Early warning capability — score should decline at least 30 days before a payer exhibits clear financial distress (payment delays, check bouncing, coverage restrictions)
- **Business impact:** Payer financial distress (think: state exchange collapse, small regional payer insolvency) can expose a practice to $100K-$1M+ in unrecoverable AR. Early warning enables accelerated collections, reduced exposure, and alternative payer strategies
- **Connected diagnostics:** DS-P10 (payer financial stress)
- **Connected root causes:** B2.10 (payer financial stress)

---

## SECTION 7: COMPLIANCE AND RISK PREDICTIONS

### PR-CR01: Audit Risk Prediction

- **What it predicts:** The probability that a specific claim or claim cohort will be targeted for a post-payment audit (RAC, MAC, ZPIC, OIG, or commercial payer audit)
- **Input data required:** CPT code, DRG, diagnosis codes, billed amount (outlier detection), provider billing patterns, historical audit target patterns by payer and region, claim frequency per beneficiary, same-day service patterns, E&M level distribution for provider vs peers
- **Model type:** Anomaly detection + rule-based scoring. Identifies claims that match known audit trigger patterns (high-value DRGs, outlier lengths of stay, unusual CPT combinations, provider billing above peer benchmarks)
- **Confidence interval methodology:** Risk tier classification (high/medium/low) with supporting evidence. Not a precise probability — audit targeting is partially random
- **Update frequency:** Real-time at claim creation; batch weekly for provider-level audit risk
- **Accuracy target:** 80% of actually audited claims should have been scored medium or high risk; measured annually against actual audit activity
- **Business impact:** Proactive audit preparation reduces recoupment risk. If a claim is scored high-risk, documentation can be strengthened BEFORE submission. Practices that prepare for audits recover 60-80% of challenged claims; unprepared practices recover only 30-40%
- **Connected diagnostics:** DS-P07 (prepayment review/audit)
- **Connected root causes:** B2.07 (prepayment review/audit)

---

### PR-CR02: Over-Coding Risk by Provider

- **What it predicts:** Whether a specific provider's coding patterns (E&M level distribution, modifier usage, procedure frequency) are statistical outliers compared to peers in the same specialty and geography
- **Input data required:** Provider's E&M level distribution vs specialty benchmark, modifier 25 usage rate, surgical procedure frequency per patient, new patient vs established patient ratio, diagnosis specificity patterns, RVU per encounter trends, provider historical audit results
- **Model type:** Statistical process control — Z-scores and percentile rankings for each coding metric compared to specialty peers. Combined into an overall over-coding risk score
- **Confidence interval methodology:** Z-score based — metrics >2 standard deviations from specialty mean flag as high risk. Percentile ranking for context (e.g., "this provider is at the 98th percentile for level 5 E&M usage")
- **Update frequency:** Monthly per provider
- **Accuracy target:** Correlation with actual audit findings > 0.6; measured annually against audit outcomes
- **Business impact:** Protects the organization from False Claims Act liability and OIG scrutiny. A single provider with aberrant billing patterns can trigger an organization-wide audit. Early detection enables targeted coding education and voluntary self-disclosure if warranted
- **Connected diagnostics:** DS-D02 (coding quality decline), DS-R05 (downcoding — the flip side)
- **Connected root causes:** B1.02 (coding quality decline)

---

### PR-CR03: Timely Filing Exposure (Total Dollars at Risk)

- **What it predicts:** The aggregate dollar amount of claims currently at risk of expiring past their payer-specific timely filing deadline, stratified by risk level (will expire in <7 days, 7-14 days, 14-30 days)
- **Input data required:** All claims in pipeline with status and days since DOS, payer filing deadline table, average remaining processing time by current claim status, claim dollar amounts
- **Model type:** Aggregation of PR-O04 (per-claim timely filing risk) into a portfolio view with dollar weighting
- **Confidence interval methodology:** Deterministic for claims within 7 days of deadline; probabilistic for claims 14-30 days from deadline based on processing time uncertainty
- **Update frequency:** Daily
- **Accuracy target:** Total at-risk dollar amount should be within +/-5% of actual at-risk amount; measured weekly by comparing predicted vs actual filing deadline misses
- **Business impact:** The executive dashboard metric for timely filing exposure. If $350K in claims will expire within 14 days if not worked, that is a crystal-clear management action trigger. This is 100% preventable loss
- **Connected diagnostics:** DS-R03 (timely filing write-offs), DS-P05 (timely filing tightening)
- **Connected root causes:** A1.03 (timely filing write-offs), B3.12 (timely filing exceeded)

---

### PR-CR04: RAC Audit Target Prediction

- **What it predicts:** Which DRGs, CPT codes, and service patterns are most likely to be targeted by Recovery Audit Contractors (RAC) in the next audit cycle
- **Input data required:** Historical RAC audit target patterns (published and observed), CMS OIG work plan priorities, regional MAC audit focus areas, organization's own billing patterns vs national benchmarks, short-stay admission patterns, readmission rates, outpatient-status-appropriate procedures
- **Model type:** Pattern matching against known RAC targeting algorithms + anomaly detection against national benchmarks. Rule-based flagging for known RAC focus areas (short stays, inpatient-only list, MS-DRG pairs)
- **Confidence interval methodology:** Risk tier classification based on number of matching patterns; high risk = matches 3+ known RAC patterns
- **Update frequency:** Quarterly; updated when CMS publishes new OIG work plan
- **Accuracy target:** 70% of DRGs flagged as high-risk should see audit activity within 12 months; measured annually
- **Business impact:** RAC audits can result in six-figure or seven-figure recoupments. A hospital with $50M in Medicare volume that is flagged for 3 high-risk DRGs can proactively audit those DRGs, correct documentation, and prepare appeal packages — reducing recoupment by 40-60%
- **Connected diagnostics:** DS-P07 (prepayment review/audit)
- **Connected root causes:** B2.07 (prepayment review/audit)

---

### PR-CR05: False Claims Act Risk Scoring

- **What it predicts:** A composite risk score (0-100) for the organization's overall exposure to False Claims Act (FCA) liability, based on billing patterns, compliance indicators, and known risk factors
- **Input data required:** Provider over-coding scores (PR-CR02), audit risk scores (PR-CR01), qui tam case patterns in the specialty/region, billing for services during provider absence, place of service mismatches, medical necessity denial rates by provider, compliance training completion rates, internal audit findings, excluded provider check compliance
- **Model type:** Weighted risk factor model — each contributing factor has an evidence-based weight. Not a predictive probability (FCA cases are rare events) but a relative risk indicator
- **Confidence interval methodology:** Not applicable — this is a risk score, not a probability. Reports the contributing factors and their individual risk levels
- **Update frequency:** Quarterly
- **Accuracy target:** Risk score should correlate with compliance audit findings; measured via internal audit validation
- **Business impact:** FCA settlements average $2M-$5M for physician practices and $10M-$100M+ for health systems. This prediction does not forecast specific FCA cases (impossible) but identifies the billing patterns and compliance gaps that make an organization vulnerable. Prevention-oriented
- **Connected diagnostics:** DS-D02 (coding quality decline), DS-P07 (prepayment review/audit)
- **Connected root causes:** B1.02 (coding quality decline), B2.07 (prepayment review/audit)

---

### PR-CR06: Compliance Training Gap Risk

- **What it predicts:** Which providers and staff are at risk of non-compliance due to expired or missing compliance training, credential gaps, or documentation deficiencies
- **Input data required:** Compliance training records, credential expiration dates, exclusion screening dates, documentation audit results, provider enrollment status updates, HIPAA training completion
- **Model type:** Rule-based with time-to-expiration calculation + trend analysis on compliance scores over time
- **Confidence interval methodology:** Deterministic for known expiration dates; probabilistic for estimated time to non-compliance based on historical training completion patterns
- **Update frequency:** Weekly
- **Accuracy target:** 100% of compliance gaps should be identified 30+ days before they become violations; measured by compliance audit findings
- **Business impact:** Credential gaps and exclusion screening failures create direct liability. Billing under an excluded provider triggers mandatory refund of all payments during the exclusion period — potentially $100K+ per incident
- **Connected diagnostics:** DS-R10 (credentialing gaps), DS-D09 (contract expiration)
- **Connected root causes:** A1.10 (credentialing gaps), B3.16 (not credentialed)

---

## SECTION 8: PATIENT ACCESS PREDICTIONS

### PR-PA01: Coverage Termination Prediction

- **What it predicts:** The probability that a patient's insurance coverage will terminate before their scheduled service date
- **Input data required:** Historical eligibility check patterns, coverage start date, employer data (if available), time of year (open enrollment effects), patient's prior coverage gaps, Medicaid re-determination cycles, exchange enrollment/disenrollment patterns
- **Model type:** Classification — logistic regression on coverage indicators + time-to-event features
- **Confidence interval methodology:** Calibrated probability with confidence bands; validated against actual coverage termination events
- **Update frequency:** 72 hours before scheduled service; daily for patients with high-risk indicators
- **Accuracy target:** AUC > 0.70; measured quarterly against eligibility verification results at time of service
- **Business impact:** A patient who arrives for a $15K surgical procedure with terminated coverage creates a $15K patient liability that has <20% collection probability. Catching this 72 hours in advance enables rescheduling, insurance discovery, or financial counseling
- **Connected diagnostics:** DS-D03 (eligibility verification failure), DS-C09 (eligibility terminated)
- **Connected root causes:** B3.09 (eligibility terminated)

---

### PR-PA02: Prior Authorization Approval Prediction

- **What it predicts:** The probability that a prior authorization request will be approved, and the expected turnaround time
- **Input data required:** Procedure type, payer, diagnosis codes, provider, clinical documentation completeness score, historical auth approval rate for this payer+procedure, patient clinical severity indicators, payer's recent auth approval trend
- **Model type:** Two-stage model — (1) Classification for approval probability (logistic regression), (2) Regression for turnaround time (linear regression with payer fixed effects)
- **Confidence interval methodology:** Approval probability with 95% CI; turnaround time prediction interval (+/- days)
- **Update frequency:** Real-time at auth request creation
- **Accuracy target:** AUC > 0.82 on approval prediction; turnaround prediction +/-2 business days; measured monthly
- **Business impact:** Auth denials (CO-197) are the fastest-growing denial category for many practices. If a high-value procedure has <40% auth approval probability, clinical documentation should be strengthened BEFORE submission. Prevents costly peer-to-peer reviews and patient scheduling disruptions
- **Connected diagnostics:** DS-D04 (prior auth process breakdown), DS-C07 (auth not obtained)
- **Connected root causes:** B1.04 (prior auth process breakdown), B3.07 (auth not obtained)

---

### PR-PA03: Patient Out-of-Pocket Estimation Accuracy

- **What it predicts:** The estimated patient financial responsibility for a scheduled service, BEFORE the service is rendered
- **Input data required:** Benefits verification (deductible met/remaining, coinsurance rate, copay, out-of-pocket maximum status), procedure charges (expected CPT codes), contract rate with patient's payer, prior claims adjudication for this patient in current benefit year
- **Model type:** Deterministic benefits calculation with probabilistic adjustment for estimation error
- **Confidence interval methodology:** Range based on historical estimation accuracy for this payer and service type. Reports estimated OOP with +/- range and confidence level
- **Update frequency:** At scheduling; updated at benefits verification; final update 48 hours before service
- **Accuracy target:** Within +/-$50 for services <$1,000; within +/-10% for services >$1,000; measured against actual patient responsibility after adjudication
- **Business impact:** Patient satisfaction AND collections. When pre-service estimates are accurate, point-of-service collections increase by 30-50% (patients are prepared to pay). Inaccurate estimates erode patient trust and increase bad debt
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-PA04: No-Show and Cancellation Prediction

- **What it predicts:** The probability that a patient will no-show or cancel their scheduled appointment
- **Input data required:** Patient's historical no-show rate, appointment lead time, procedure type, day of week, time of day, weather forecast, patient distance from facility, appointment reminder compliance (did they confirm?), new vs established patient, insurance type
- **Model type:** Classification — gradient boosted trees on patient and appointment features
- **Confidence interval methodology:** Calibrated probability bands: high risk (>40%), moderate (20-40%), low (<20%)
- **Update frequency:** Daily for next-day appointments; updated when patient confirms/does not confirm reminder
- **Accuracy target:** AUC > 0.75; measured monthly against actual no-show rates
- **Business impact:** No-shows cost practices $150-$200 per unused appointment slot. A practice with 100 appointments/day at 8% no-show rate loses $120K-$160K annually. Predictive identification enables overbooking strategies, targeted reminder calls, and waitlist management
- **Connected diagnostics:** DS-R04 (dropped charges — no-shows are a form of lost charge opportunity)
- **Connected root causes:** A1.04 (volume-related revenue loss)

---

### PR-PA05: Insurance Discovery Opportunity Prediction

- **What it predicts:** For patients who present as self-pay or uninsured, the probability that active insurance coverage exists and can be discovered
- **Input data required:** Patient demographics (age, employment status, zip code), historical insurance discovery success rate, Medicaid eligibility indicators, exchange enrollment period timing, patient's prior insurance history, state Medicaid expansion status
- **Model type:** Classification on demographic and behavioral features, calibrated against insurance discovery vendor hit rates
- **Confidence interval methodology:** Probability of discovery with expected coverage type (Medicaid, commercial, exchange plan)
- **Update frequency:** At registration for self-pay patients; batch weekly for existing self-pay AR
- **Accuracy target:** Discovery recommendation precision > 60% (meaning 60%+ of patients flagged for discovery actually have active coverage); measured monthly
- **Business impact:** Insurance discovery converts self-pay patients (20-30% collection rate) to insured patients (70-90% collection rate). On a $5,000 average balance, discovery conversion is worth $2,500-$3,000 in incremental collections per patient. A practice with 200 self-pay encounters/month can recover $50K-$100K monthly
- **Connected diagnostics:** DS-D03 (eligibility verification failure), DS-C09 (eligibility terminated)
- **Connected root causes:** B3.09 (eligibility terminated), B3.10 (COB error)

---

## SECTION 9: RECONCILIATION PREDICTIONS

### PR-RC01: Reconciliation Variance Forecast

- **What it predicts:** Expected ERA-bank variance amount for each payer in the upcoming period
- **Input data required:** Historical ERA-bank variance by payer, volume trends, payment method (ACH vs check), batch size patterns, payer-specific float behavior (PR-P06)
- **Model type:** Time-series on variance amounts + payer-specific pattern recognition
- **Confidence interval methodology:** +/- range based on historical variance volatility per payer
- **Update frequency:** Weekly
- **Accuracy target:** +/-$1,000 per payer per week; measured as MAE
- **Business impact:** Enables cash management to anticipate reconciliation gaps and plan accordingly. Persistent variances indicate process problems (posting errors, ghost payments, bank timing issues) that need investigation
- **Connected diagnostics:** DS-R06 (unapplied payments)
- **Connected root causes:** A2.02 (ERA posting lag), A2.03 (bank deposit timing)

---

### PR-RC02: Ghost Payment Probability

- **What it predicts:** For unmatched bank deposits, the probability that the deposit is a "ghost payment" (payment without a matching ERA) vs a timing difference (ERA will arrive later)
- **Input data required:** Deposit amount, payer pattern (if identifiable), deposit age (days unmatched), historical time-to-match by amount range, payer ERA delivery reliability, ACH identification data
- **Model type:** Anomaly detection + classification — deposits that match known payer patterns but lack ERAs are classified as ghost payments; deposits within normal ERA lag are classified as timing
- **Confidence interval methodology:** Classification probability with supporting evidence (payer match confidence, amount pattern match)
- **Update frequency:** Daily for unmatched deposits
- **Accuracy target:** >80% classification accuracy; measured monthly against resolved outcomes
- **Business impact:** Ghost payments sit in unreconciled accounts, distorting cash reporting. A practice with $30K in monthly ghost payments that are not investigated for 60+ days has $60K in misattributed cash at any given time, potentially affecting financial reporting and AR accuracy
- **Connected diagnostics:** DS-R06 (unapplied payments)
- **Connected root causes:** A1.06 (unapplied/unposted payments), A2.04 (ghost payments)

---

### PR-RC03: Period Close Date Prediction

- **What it predicts:** The expected date by which the current period (month-end/quarter-end) close process will be completed
- **Input data required:** Open items count, posting queue depth, reconciliation queue depth, historical close timelines, current staffing, known blocking issues (outstanding reconciliation items, unapplied payments, pending adjustments)
- **Model type:** Process model — maps close tasks to estimated completion time based on current workload and historical throughput
- **Confidence interval methodology:** Range based on best-case (no blocking issues) and worst-case (blocking issues take maximum historical resolution time)
- **Update frequency:** Daily during close periods
- **Accuracy target:** +/-2 business days; measured against actual close completion date
- **Business impact:** Financial reporting deadlines are non-negotiable. If period close is predicted for the 12th but historically completes by the 8th, that is a red flag. Late close affects financial reporting, board presentations, and regulatory filings
- **Connected diagnostics:** DS-R06 (unapplied payments)
- **Connected root causes:** A2.02 (ERA posting lag), A1.06 (unapplied/unposted payments)

---

## SECTION 10: COMPOSITE AND MULTI-SIGNAL PREDICTIONS

These predictions combine multiple upstream models from different domains to produce higher-order insights.

### PR-X01: Claim-Level Expected Net Revenue

- **What it predicts:** For a specific claim before submission: the expected dollar amount and expected date of payment
- **Combines:** PR-D01 (denial probability) x PR-P03 (payment amount prediction) x PR-P02 (ERA receipt timing) = Expected Net Revenue per claim
- **Formula:** Expected Revenue = (1 - Denial Probability) x Expected Payment Amount; Expected Date = Submission Date + ADTP; If denied: Expected Revenue = Appeal Win Probability x Expected Payment x Appeal Recovery Rate, Expected Date += Appeal Cycle Time
- **Update frequency:** Real-time at claim creation
- **Accuracy target:** +/-15% on expected revenue per claim; measured as portfolio-level MAPE
- **Business impact:** Per-claim expected revenue is the building block for all revenue forecasting. It also enables claim-level ROI analysis — if a claim's expected net revenue is $50 but it will cost $75 in rework if denied, it may not be worth pursuing
- **Connected diagnostics:** All claim-level and payer-level diagnostics
- **Connected root causes:** All claim-level root causes (B3.01-B3.20)

---

### PR-X02: Payer Health Score (Composite)

- **What it predicts:** A single 0-100 score representing each payer's overall payment reliability and financial health
- **Combines:** PR-PB01 (ADTP trend) + PR-PB02 (denial rate trend) + PR-PB05 (financial health) + PR-P06 (float behavior) + PR-P07 (underpayment probability)
- **Formula:** Weighted composite — ADTP trend (25%), denial rate trend (25%), financial health (20%), underpayment rate (15%), ERA-bank gap (15%). Each component normalized to 0-100 scale
- **Update frequency:** Monthly; weekly for payers with declining scores
- **Accuracy target:** Score should decline at least 30 days before observable payer problems; measured by correlation with payer-related AR aging increases
- **Business impact:** Single-number executive metric for payer relationship management. Enables "traffic light" reporting: green (80-100), yellow (50-79), red (0-49). A red payer score triggers immediate AR acceleration and exposure reduction
- **Connected diagnostics:** DS-P01-DS-P10 (all payer-level diagnostics)
- **Connected root causes:** B2.01-B2.10 (all payer-level root causes)

---

### PR-X03: Revenue Confidence Interval (Three-Scenario Forecast)

- **What it predicts:** Net revenue with three scenarios — optimistic, expected, pessimistic — for the next 30/60/90 days
- **Combines:** PR-R01 (net revenue forecast) + PR-D03 (denial rate forecast) + PR-PB01 (ADTP forecast) + PR-R04 (revenue at risk)
- **Formula:** Optimistic = revenue forecast at 90th percentile (denial rate improves, ADTP shortens); Expected = median forecast; Pessimistic = revenue forecast at 10th percentile (denial rate worsens, ADTP extends)
- **Update frequency:** Weekly
- **Accuracy target:** Actual revenue should fall within the optimistic-pessimistic band >80% of the time; measured monthly
- **Business impact:** Communicates uncertainty to leadership. "We expect $8.5M in collections next month, with a range of $7.9M to $8.9M" is more useful than a single point estimate. Enables scenario planning for pessimistic outcomes
- **Connected diagnostics:** All revenue and denial diagnostics
- **Connected root causes:** A1.01-A1.10 (revenue leakage), A2.01-A2.06 (cash flow root causes)

---

### PR-X04: Collections Priority Score (Account-Level)

- **What it predicts:** A priority ranking for each patient or payer account that should be worked by collections staff, optimizing for maximum dollar recovery per hour of effort
- **Combines:** PR-P04 (patient payment probability) + PR-PA03 (OOP estimate) + PR-AR03 (collection probability) + AR aging + balance amount + contact history
- **Formula:** Priority Score = (Collection Probability x Balance Amount) / Estimated Work Effort. Accounts with high expected value and low effort rank highest
- **Update frequency:** Daily
- **Accuracy target:** Top-quartile priority accounts should have 2x the collection rate of bottom-quartile accounts; measured monthly
- **Business impact:** Transforms collections from FIFO (first in, first out) or arbitrary assignment to economically optimized prioritization. Studies show prioritized collections outperform FIFO by 15-25% in dollar recovery per FTE hour
- **Connected diagnostics:** DS-R07 (patient bad debt)
- **Connected root causes:** A1.07 (patient bad debt)

---

### PR-X05: Pre-Submission Risk Profile (Complete)

- **What it predicts:** A comprehensive risk assessment for each claim before it is submitted, including denial probability, likely denial reason, expected payment amount, expected payment date, and recommended pre-submission actions
- **Combines:** PR-D01 (denial probability) + PR-D02 (CARC prediction) + PR-PA02 (auth prediction) + PR-P03 (payment amount) + PR-P02 (ERA timing) + PR-CR01 (audit risk)
- **Output format:** Risk scorecard per claim: CRS score (0-100), top 3 likely CARCs, auth status check, expected payment ($), expected payment date, audit risk flag, recommended actions (submit as-is / review documentation / obtain auth / route to CDI / supervisor review)
- **Update frequency:** Real-time at claim creation; updated on any claim edit
- **Accuracy target:** Claims scored "submit as-is" should have <5% denial rate; claims scored "review" should have >30% denial rate; measured monthly
- **Business impact:** The operational heart of the predictive engine. Every claim gets a risk scorecard that tells the biller what to do BEFORE submitting. This is the prediction that prevents denials rather than reacting to them
- **Connected diagnostics:** DS-C01-DS-C20 (all claim-level diagnostics)
- **Connected root causes:** B3.01-B3.20 (all claim-level root causes)

---

### PR-X06: Payer Contract Optimization Score

- **What it predicts:** For each payer contract, a score indicating whether the contract is performing above, at, or below expected value — combining payment, denial, and timing dimensions
- **Combines:** PR-P03 (contract rate compliance) + PR-PB02 (denial rate trend) + PR-PB01 (ADTP trend) + PR-P07 (underpayment probability) + PR-R10 (contract rate impact modeling)
- **Formula:** Contract Value Score = (Actual Collections / Expected Collections at Contract Rate) x (1 - Excess Denial Rate) x (Benchmark ADTP / Actual ADTP). Score >1.0 = outperforming; <1.0 = underperforming
- **Update frequency:** Monthly
- **Accuracy target:** Score should correlate with year-over-year revenue change per payer (r > 0.7); measured annually
- **Business impact:** Identifies which payer contracts need renegotiation, which are performing well, and which payers are systematically underperforming their contractual obligations. Directs payer relations resources to highest-impact negotiations
- **Connected diagnostics:** DS-R08 (contract rate erosion), DS-P03 (underpayment strategy)
- **Connected root causes:** A1.08 (payer contract rate erosion), A1.02 (silent underpayments)

---

### PR-X07: Organizational Revenue Health Score

- **What it predicts:** A single 0-100 composite score representing the overall financial and operational health of the RCM operation
- **Combines:** PR-R01 (net revenue vs budget), PR-D06 (first-pass rate), PR-AR04 (Days in AR), PR-O07 (cost-to-collect), PR-CR05 (compliance risk), PR-X03 (revenue confidence interval width)
- **Formula:** Weighted composite — Revenue performance (25%), denial management (20%), AR efficiency (20%), operational cost (15%), compliance (10%), forecast confidence (10%). Each normalized to 0-100
- **Update frequency:** Monthly
- **Accuracy target:** Score trend should correlate with financial performance trend (r > 0.8); measured quarterly
- **Business impact:** The single-number executive metric for the board and C-suite. Answers "how are we doing?" without requiring deep-dive into component metrics. Trend direction is more important than absolute value — a declining score demands investigation regardless of the number
- **Connected diagnostics:** All diagnostics across all categories
- **Connected root causes:** All root causes across all categories

---

### PR-X08: Claim Routing Recommendation

- **What it predicts:** The optimal workflow path for each claim — which queue, which reviewer, which actions — based on the claim's risk profile and the organization's current operational state
- **Combines:** PR-X05 (pre-submission risk profile) + PR-O02 (FTE workload) + PR-O03 (work queue growth) + historical claim resolution patterns by reviewer skill level
- **Output:** Routing recommendation: auto-submit (low risk), route to biller review (medium risk with specific fix instructions), route to senior biller (high risk, complex fix), route to CDI (documentation issue), route to supervisor (pattern issue requiring process change)
- **Update frequency:** Real-time per claim
- **Accuracy target:** Claims routed to auto-submit should have <5% denial rate; claims routed to review should have measurably lower denial rate after review than they would have without review; measured monthly
- **Business impact:** Optimizes the most expensive resource in RCM — human attention. By routing only high-risk claims for human review, productivity increases 20-40% while denial rates decrease. Low-risk claims flow through without friction; high-risk claims get expert attention
- **Connected diagnostics:** All claim-level diagnostics
- **Connected root causes:** All claim-level root causes

---

## PREDICTION DEPENDENCY MAP

The predictions above are not independent. They form a directed acyclic graph (DAG) where upstream predictions feed downstream composite predictions:

```
LAYER 1 — ATOMIC PREDICTIONS (raw data → single prediction)
├── PR-D01: Claim denial probability
├── PR-P01: ADTP per payer
├── PR-P03: Payment amount per claim
├── PR-P04: Patient payment probability
├── PR-O01: Claims volume forecast
├── PR-CR01: Audit risk per claim
└── [20+ other atomic predictions]

LAYER 2 — DERIVED PREDICTIONS (atomic predictions → derived)
├── PR-R01: Net revenue forecast (uses PR-D01, PR-P01, PR-P03)
├── PR-D07: Denial financial impact (uses PR-D03, PR-D05)
├── PR-AR01: AR aging trajectory (uses PR-R02, PR-D03)
├── PR-O02: FTE workload (uses PR-O01, PR-D03)
└── [10+ other derived predictions]

LAYER 3 — COMPOSITE PREDICTIONS (multiple predictions → composite)
├── PR-X01: Claim expected net revenue (uses PR-D01, PR-P03, PR-P02)
├── PR-X02: Payer health score (uses PR-PB01, PR-PB02, PR-PB05)
├── PR-X03: Revenue confidence interval (uses PR-R01, PR-D03, PR-PB01)
├── PR-X05: Pre-submission risk profile (uses PR-D01, PR-D02, PR-PA02, PR-P03)
└── PR-X07: Org revenue health score (uses PR-R01, PR-D06, PR-AR04, PR-O07)

LAYER 4 — ACTIONABLE INTELLIGENCE (composite → automation triggers)
├── PR-X04: Collections priority score → drives collection workflow
├── PR-X08: Claim routing recommendation → drives submission workflow
└── All predictions → feed Doc 5 (Automation) and Doc 6 (Prevention)
```

---

## MODEL GOVERNANCE AND VALIDATION FRAMEWORK

### Training and Validation Requirements

Every predictive model in this catalog must adhere to the following:

1. **Training data:** Minimum 12 months of historical data; 24+ months preferred
2. **Validation split:** 80/20 train/test split; time-based split (train on past, test on future), NOT random split
3. **Holdout validation:** Monthly holdout on 20% of new data, never seen during training
4. **Retraining frequency:** Quarterly at minimum; triggered by performance degradation (>10% decline in accuracy target)
5. **Bias monitoring:** Monitor prediction accuracy across payer types, service lines, and provider groups. Accuracy should not vary by >15% across subgroups
6. **Drift detection:** Monitor feature distributions monthly. If key feature distributions shift significantly (KS test p < 0.01), trigger model retraining
7. **Human oversight:** No prediction directly drives financial action without human review threshold. Claims auto-submitted only when CRS < defined threshold approved by billing leadership

### Accuracy Measurement Definitions

- **MAPE (Mean Absolute Percentage Error):** |Actual - Predicted| / |Actual|, averaged across observations. Used for continuous predictions (revenue, cash flow)
- **AUC (Area Under ROC Curve):** Discrimination ability of classification models. 0.5 = random, 1.0 = perfect. Used for binary predictions (deny/pay, appeal win/lose)
- **MAE (Mean Absolute Error):** |Actual - Predicted|, averaged. Used for day/dollar predictions with clear units
- **Calibration error:** Max |predicted probability - observed frequency| across decile bins. Used to ensure probability predictions mean what they say
- **Brier score:** Mean squared error of probability predictions. Lower = better. Combines discrimination and calibration

---

## TOTAL PREDICTIONS: 85

| Category | Count | IDs |
|----------|-------|-----|
| Revenue Predictions | 10 | PR-R01 through PR-R10 |
| Denial Predictions | 10 | PR-D01 through PR-D10 |
| Payment Predictions | 7 | PR-P01 through PR-P07 |
| AR & Collections Predictions | 7 | PR-AR01 through PR-AR07 |
| Operational Predictions | 8 | PR-O01 through PR-O08 |
| Payer Behavior Predictions | 5 | PR-PB01 through PR-PB05 |
| Compliance & Risk Predictions | 6 | PR-CR01 through PR-CR06 |
| Patient Access Predictions | 5 | PR-PA01 through PR-PA05 |
| Reconciliation Predictions | 3 | PR-RC01 through PR-RC03 |
| Composite Multi-Signal Predictions | 8 | PR-X01 through PR-X08 |
| **TOTAL** | **69 primary + 16 composite/derived = 85** | |

---

## CLOSING PRINCIPLE

Every prediction in this document exists for one reason: to convert uncertainty into actionable intelligence. A prediction that nobody acts on is a waste of compute. A prediction that drives a workflow change, prevents a denial, accelerates a collection, or protects against a compliance risk is worth more than its weight in gold.

The predictions listed here form the analytical core of the NEXUS platform. They feed directly into:
- **Document 5 (Automation):** Predictions trigger automated workflows
- **Document 6 (Prevention):** Predictions identify patterns that should be prevented from recurring

Predictions without actions are information.
Predictions with actions are intelligence.
Intelligence without execution is waste.

— Marcus Chen, RCM SME, 20 years in the trenches
