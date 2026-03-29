# NEXUS RCM BIBLE — DOCUMENT 3 OF 6
# DIAGNOSTIC SUGGESTIONS
## "What is CURRENTLY WRONG and what do we DO ABOUT IT?"

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME), Sarah Kim (BA)
> REVISION NOTE: Complete rewrite per client feedback. Previous version mapped
> diagnostics to root causes only. This version stands on its own as an
> actionable diagnostic framework connected to revenue outcomes, denial patterns,
> descriptive metrics (Doc 1), AND root causes (Doc 2).

---

## PURPOSE

A DIAGNOSTIC SUGGESTION is fundamentally different from a root cause.

- **Root Cause (Doc 2):** Tells you WHY something happened. Backward-looking. Explanatory.
- **Diagnostic Suggestion (this document):** Tells you WHAT IS CURRENTLY WRONG and WHAT TO DO ABOUT IT. Present-state. Actionable.

A diagnostic is a finding that an algorithm detects in current data, paired with a
specific recommendation. It does not require you to understand the cause chain first.
It says: "This number is abnormal. Here is what you should do right now."

Every diagnostic in this document includes:
1. **What it detects** — the specific anomaly or condition
2. **Detection methodology** — the algorithm, threshold, or comparison that fires it
3. **Severity** — Critical / Warning / Info
4. **Recommended action** — specific, not generic
5. **Revenue impact if unaddressed** — what happens if you ignore it
6. **Connected root cause(s)** — link back to Doc 2
7. **Connected metric(s)** — link back to Doc 1

---

## 1. REVENUE HEALTH DIAGNOSTICS

### RH-01: Revenue Trend Deviation from Budget

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue Trend Deviation from Budget |
| **What It Detects** | Monthly net collections deviating from budget/forecast by more than threshold, indicating a systemic revenue problem rather than normal variance |
| **Detection Methodology** | Compare rolling 3-month actual net collections to budget. Fire if actual < budget by >5% for 1 month (Warning) or >5% for 2 consecutive months (Critical). Use z-score against 12-month trailing variance to separate signal from noise. |
| **Severity** | **Critical** if deviation >5% for 2+ months; **Warning** if >5% for 1 month; **Info** if >3% for 1 month |
| **Recommended Action** | Run revenue shortfall decomposition (Doc 2, A1.11) to identify the top 3 contributors. Convene revenue recovery task force within 48 hours. Prioritize interventions by recoverable dollar amount: denial appeals first, then underpayment disputes, then charge capture audit. |
| **Revenue Impact if Unaddressed** | A 5% revenue deviation on $8M monthly revenue = $400K/month. If sustained 6 months without action, cumulative loss = $2.4M+ with compounding AR aging effects. |
| **Connected Root Cause(s)** | A1.01 through A1.10 (revenue leakage causes) |
| **Connected Metric(s)** | R11 Net Collections, R12 Net Collection Rate, R23 Cash vs Forecast Variance |

---

### RH-02: Payer Mix Shift Impact on Margins

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Mix Shift Impact on Margins |
| **What It Detects** | The proportion of claims by payer type (Commercial, Medicare, Medicaid, Self-Pay) has shifted in a direction that reduces blended reimbursement rate |
| **Detection Methodology** | Calculate blended reimbursement rate = total collections / total charges by payer type. Compare current month payer mix percentages to trailing 6-month average. Fire if Commercial share drops >3 percentage points OR Medicaid/Self-Pay share increases >3 points. Compute margin impact = (new_mix_rate - old_mix_rate) x total_volume. |
| **Severity** | **Critical** if margin impact >$200K/month; **Warning** if >$50K/month; **Info** if any measurable shift detected |
| **Recommended Action** | Report to CFO and strategy team with quantified margin impact. Adjust revenue forecast downward for the shift. Review payer contract terms for the growing payer segments. If self-pay is growing, strengthen financial counseling and charity care screening at point of access. If Medicaid is growing, verify all Medicaid fee schedule rates are loaded. |
| **Revenue Impact if Unaddressed** | A 5% shift from Commercial (avg 80% of charges) to Medicaid (avg 40% of charges) on $10M monthly charges = $200K/month margin compression. |
| **Connected Root Cause(s)** | A1.09 Service line mix shift, B1.06 Payer mix shift |
| **Connected Metric(s)** | E08 Payer Mix Distribution, R12 Net Collection Rate, R13 Gross Collection Rate |

---

### RH-03: CMI (Case Mix Index) Erosion

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | CMI Erosion Detection |
| **What It Detects** | Case Mix Index declining without a corresponding change in patient acuity, indicating documentation or coding deficiency rather than actual clinical change |
| **Detection Methodology** | Compare monthly CMI to trailing 12-month average. Fire if CMI drops >0.05 for 2 consecutive months. Cross-reference with patient acuity indicators (ICU days, OR minutes, complication rates). If acuity stable but CMI declining, the problem is documentation/coding, not clinical. |
| **Severity** | **Critical** if CMI drop >0.10 with stable acuity; **Warning** if >0.05; **Info** if any downward trend for 3+ months |
| **Recommended Action** | Initiate CDI-focused review on top 10 DRGs by volume. Compare DRG assignment to expected DRG based on clinical indicators. Identify physicians with the largest CMI drops for targeted documentation education. Review CC/MCC capture rate — if declining, CDI queries are missing comorbidity documentation. |
| **Revenue Impact if Unaddressed** | Each 0.01 CMI point = approximately $50K-$150K annual revenue depending on volume. A 0.10 CMI drop = $500K-$1.5M annual revenue loss. |
| **Connected Root Cause(s)** | A1.05 Coding downcoding, B6.03 CDI query unanswered |
| **Connected Metric(s)** | R10 Case Mix Index, CD06 DRG Mismatch Rate, R19 Revenue per RVU |

---

### RH-04: Charge Capture Completeness Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Charge Capture Completeness Gap |
| **What It Detects** | Encounters generating fewer charges than expected, indicating dropped charges — revenue that was earned but never billed |
| **Detection Methodology** | Calculate encounter-to-claim ratio by department. Compare to historical baseline (trailing 12-month average). Fire if ratio drops below 95% for any department. Also compare charges per encounter to benchmark by encounter type. Flag departments where charges/encounter decline >10% with stable volume. |
| **Severity** | **Critical** if encounter-to-claim ratio <90% for any department; **Warning** if <95%; **Info** if declining trend for 3+ months |
| **Recommended Action** | Audit the specific department with the gap. Identify which charge types are missing (ancillary, supply, professional, facility). Implement daily encounter-to-charge reconciliation report for the department. Cross-reference with EHR order entry — are orders being placed but charges not dropping? Deploy charge capture reconciliation tool at shift end. |
| **Revenue Impact if Unaddressed** | Each 1% charge capture gap on $5M monthly charges = $50K/month unbilled. A 5% gap = $250K/month = $3M annually. |
| **Connected Root Cause(s)** | A1.04 Unbilled/dropped charges, B6.08 Charge capture gaps |
| **Connected Metric(s)** | R01 Total Charges Billed, R08 Average Charge per Encounter, R09 Charge Volume Trend |

---

### RH-05: Gross-to-Net Ratio Degradation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Gross-to-Net Ratio Degradation |
| **What It Detects** | The ratio of net collections to gross charges is worsening, meaning more of every billed dollar is being lost to contractual adjustments, denials, write-offs, or bad debt |
| **Detection Methodology** | Calculate gross-to-net ratio = Net Collections / Gross Charges. Compare to trailing 12-month average. Fire if ratio drops >2 percentage points. Decompose the degradation: is it contractual adjustments growing (contract issue), denial write-offs growing (denial issue), or bad debt growing (collections issue)? |
| **Severity** | **Critical** if ratio drops >3 points; **Warning** if >2 points; **Info** if >1 point with downward trend |
| **Recommended Action** | Decompose the gap into its components: (1) If contractual adjustments grew — audit contract rate compliance. (2) If denial write-offs grew — see Denial Pattern Diagnostics. (3) If bad debt grew — see AR Collections Diagnostics. (4) If charity/uncompensated care grew — verify financial assistance screening. Address the largest component first. |
| **Revenue Impact if Unaddressed** | Each 1% gross-to-net degradation on $15M gross charges = $150K/month net revenue loss. |
| **Connected Root Cause(s)** | A1.01 Denial-driven loss, A1.02 Silent underpayment, A1.07 Patient bad debt |
| **Connected Metric(s)** | R12 Net Collection Rate, R13 Gross Collection Rate, R14 Contractual Adjustments, R16 Write-off Amount |

---

### RH-06: Cost-to-Collect Efficiency Decline

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Cost-to-Collect Efficiency Decline |
| **What It Detects** | The cost of collecting revenue is increasing relative to the revenue collected, indicating operational inefficiency |
| **Detection Methodology** | Calculate cost-to-collect = Total RCM operating cost / Total net collections. Compare to prior period and industry benchmark (target: <4% for hospitals, <6% for physician practices). Fire if cost-to-collect increases >0.5 percentage points quarter-over-quarter. |
| **Severity** | **Critical** if cost-to-collect >6% (hospital) or >8% (physician); **Warning** if increasing trend for 2 consecutive quarters; **Info** if approaching benchmark ceiling |
| **Recommended Action** | Identify the cost driver: Is it FTE headcount increase without proportional revenue increase? High denial rework costs? Outsourced AR follow-up expenses? Analyze claims-per-FTE productivity. If productivity is declining, assess workflow bottlenecks and automation opportunities. If denial rework is the cost driver, invest in upstream denial prevention. |
| **Revenue Impact if Unaddressed** | A 1% cost-to-collect increase on $100M annual collections = $1M additional operating cost, directly reducing margin. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | O07 Cost to Collect, O01 Claims Processed per FTE, O02 Denials Worked per FTE |

---

### RH-07: Revenue per RVU Decline

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue per RVU Decline |
| **What It Detects** | Declining revenue per relative value unit, indicating that reimbursement rates are dropping relative to the work being performed |
| **Detection Methodology** | Calculate revenue per RVU = total net collections / total work RVUs. Compare to trailing 12-month average and to MGMA/benchmark. Fire if revenue per RVU declines >5% year-over-year. Decompose by payer to identify which payers are driving the decline. |
| **Severity** | **Critical** if decline >8% YOY; **Warning** if >5%; **Info** if >3% or downward trend for 3 quarters |
| **Recommended Action** | If payer-driven: review contract rates vs Medicare conversion factor trend. Prepare renegotiation data showing RVU-adjusted reimbursement decline. If volume-driven: verify RVU assignment accuracy (are new CPT codes mapped to correct RVUs?). If specialty-driven: evaluate service line profitability. Present finding to CFO with payer-specific revenue per RVU trends for contract negotiation leverage. |
| **Revenue Impact if Unaddressed** | A 5% decline in revenue per RVU on 500,000 annual RVUs at $50/RVU baseline = $1.25M annual revenue decline. |
| **Connected Root Cause(s)** | A1.08 Contract rate erosion, A1.05 Coding downcoding |
| **Connected Metric(s)** | R19 Revenue per RVU, R12 Net Collection Rate |

---

### RH-08: Contractual Adjustment Rate Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Contractual Adjustment Rate Spike |
| **What It Detects** | The contractual adjustment rate (amount written off as contractual) is increasing beyond what contract terms justify, indicating either incorrect adjustments or contract rate decreases |
| **Detection Methodology** | Calculate contractual adjustment rate = contractual adjustments / gross charges by payer. Compare to expected rate based on contract fee schedules. Fire if actual contractual rate exceeds expected by >3 percentage points for any payer. Also fire if blended contractual rate increases >2 points month-over-month. |
| **Severity** | **Critical** if contractual rate variance >5% for a major payer; **Warning** if >3%; **Info** if increasing trend |
| **Recommended Action** | Audit contractual adjustment posting logic. Common issues: (1) Incorrect fee schedule loaded — wrong effective date or wrong contract version. (2) Auto-adjustment writing off legitimate underpayments as contractual. (3) Contract carve-outs not properly configured. For each flagged payer: compare ERA adjustments to contract terms line by line. If adjustments are incorrect: reverse and repost. If contract rates actually decreased: escalate to payer relations. |
| **Revenue Impact if Unaddressed** | If $500K/month in contractual adjustments includes $50K in incorrect write-offs, that is $50K/month in revenue being given away. Over 12 months = $600K. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment, B6.11 No contract rates loaded |
| **Connected Metric(s)** | R14 Contractual Adjustments, P06 Contractual Adjustment Rate, B08 Contract Compliance Rate |

---

### RH-09: Uncompensated Care Trend

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Uncompensated Care Rate Escalation |
| **What It Detects** | The total of charity care plus bad debt as a percentage of gross revenue is increasing, indicating either a population coverage shift or inadequate financial screening |
| **Detection Methodology** | Calculate uncompensated care rate = (charity care + bad debt) / gross charges. Compare to trailing 12-month average. Fire if rate increases >1 percentage point quarter-over-quarter. Decompose: is charity increasing (coverage issue) or bad debt increasing (collection issue)? |
| **Severity** | **Critical** if uncompensated care rate >10% or increasing >2 points; **Warning** if >7% or increasing >1 point; **Info** if upward trend |
| **Recommended Action** | If charity care growing: (1) Verify financial assistance screening is comprehensive. (2) Check if Medicaid expansion or exchange enrollment changes are affecting coverage. (3) Ensure presumptive charity care policies are applied. If bad debt growing: (4) See AC-06 Bad Debt Conversion diagnostics. (5) Review patient financial counseling at point of access. (6) Implement propensity-to-pay screening pre-service. |
| **Revenue Impact if Unaddressed** | Each 1% increase in uncompensated care on $120M gross charges = $1.2M annually in forgone revenue. While charity care may be mission-appropriate, bad debt is pure loss. |
| **Connected Root Cause(s)** | A1.07 Patient bad debt |
| **Connected Metric(s)** | R17 Bad Debt, R18 Charity Care, E09 Self-Pay Percentage |

---

### RH-10: Service Line Margin Compression

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Service Line Margin Compression |
| **What It Detects** | Specific service lines where the gap between charges and collections is widening faster than expected, indicating margin compression from denial increases, underpayments, or payer mix shifts within that service line |
| **Detection Methodology** | Calculate net collection rate by service line. Compare each service line to its trailing 12-month average. Fire if any service line's collection rate drops >3 percentage points. Cross-reference with denial rate by service line and payer mix by service line to identify the cause. |
| **Severity** | **Critical** if high-volume service line margin compresses >5%; **Warning** if >3%; **Info** if any service line declining for 3 consecutive months |
| **Recommended Action** | Decompose the margin compression: (1) If denial-driven: deploy service-line-specific denial management focus. (2) If underpayment-driven: audit contract rates for the service line's key CPTs. (3) If payer-mix-driven: inform strategic planning. (4) If volume-driven (fixed costs spreading over lower volume): operational rather than RCM issue. Present service line profitability dashboard to leadership with trend and root cause. |
| **Revenue Impact if Unaddressed** | Service line margin compression of 5% on a $3M/month service line = $150K/month. |
| **Connected Root Cause(s)** | A1.09 Service line mix shift, A1.01 Denial-driven loss |
| **Connected Metric(s)** | R02 Charges by Service Line, R12 Net Collection Rate, D12 Denials by Service Line |

---

## 2. DENIAL PATTERN DIAGNOSTICS

### DP-01: Denial Rate Spike by Payer

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer-Level Denial Rate Spike |
| **What It Detects** | A specific payer's denial rate has increased beyond normal variance, indicating a payer behavior change or systematic billing issue with that payer |
| **Detection Methodology** | For each payer, calculate weekly denial rate (denied / adjudicated). Compare to that payer's trailing 90-day average. Fire if current rate exceeds average by >2 standard deviations for 2 consecutive weeks. Also fire if absolute denial rate exceeds 15% for any payer. |
| **Severity** | **Critical** if spike >50% above baseline for a top-5 payer by volume; **Warning** if >30% above baseline; **Info** if >20% above baseline |
| **Recommended Action** | Immediately pull denial detail for this payer for the spike period. Categorize by CARC code to identify the dominant denial reason. Check payer bulletins for policy changes effective in the spike window. If CARC is concentrated (>40% one code), treat as a single-cause spike and deploy targeted fix. If distributed, treat as multi-cause and investigate each CARC cluster. |
| **Revenue Impact if Unaddressed** | A 5% denial rate increase for a payer representing $2M/month = $100K/month in new denials, with 40-60% likely becoming permanent losses if not addressed within 30 days. |
| **Connected Root Cause(s)** | B1.01 Payer policy change, B2.01-B2.10 Payer-level causes |
| **Connected Metric(s)** | D02 Denial Rate, D10 Denials by Payer, D04 Denial Rate Trend |

---

### DP-02: Denial Rate Spike by CPT Family

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | CPT-Level Denial Rate Spike |
| **What It Detects** | A specific CPT code or procedure family is experiencing abnormally high denials across payers, indicating a coding, documentation, or coverage issue specific to that service |
| **Detection Methodology** | For each CPT family (grouped by first 3 digits), calculate monthly denial rate. Compare to trailing 6-month average. Fire if denial rate increases >5 percentage points or exceeds 20% absolute. Cross-check: is the spike across all payers (coding issue) or payer-specific (payer issue)? |
| **Severity** | **Critical** if high-volume CPT (>100 claims/month) with >20% denial rate; **Warning** if >15%; **Info** if >10% |
| **Recommended Action** | If cross-payer: Audit coding accuracy for this CPT family. Review modifier usage. Check NCCI edits for new bundling rules. If payer-specific: Check that payer's medical policy for this CPT. Verify prior auth requirements. Review documentation requirements specific to this payer for this service. |
| **Revenue Impact if Unaddressed** | Depends on CPT volume and average reimbursement. A high-volume CPT with 100 claims/month at $500 average and 20% denial rate = $10K/month at risk. |
| **Connected Root Cause(s)** | B3.01 Incorrect CPT, B3.02 Incorrect modifier, B1.10 Regulatory change |
| **Connected Metric(s)** | D14 Denials by CPT/Procedure, D07 Denials by CARC Code |

---

### DP-03: Denial Rate Spike by Provider

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Provider-Level Denial Concentration |
| **What It Detects** | A specific physician or provider group is generating disproportionately high denials compared to peers, indicating documentation, coding, or ordering pattern issues |
| **Detection Methodology** | Calculate denial rate by rendering provider NPI. Compare each provider to peer group average (same specialty, same facility). Fire if provider denial rate exceeds peer average by >2 standard deviations. Also flag if a single provider accounts for >20% of total denial volume in their department. |
| **Severity** | **Critical** if provider denial rate is 2x peer average; **Warning** if 1.5x; **Info** if 1.25x |
| **Recommended Action** | Pull denial detail for this provider. Categorize by CARC. If documentation-related (CO-50): Schedule CDI education session. If coding-related: Review whether coding is accurate to documentation or documentation is insufficient. If auth-related: Check if provider is ordering non-covered services without pre-authorization. Pair provider with CDI specialist for 30-day concurrent review. |
| **Revenue Impact if Unaddressed** | A high-volume provider generating 30% denial rate vs 10% peer average, with 200 claims/month at $800 avg = $32K/month excess denials from one provider. |
| **Connected Root Cause(s)** | B3.05 Medical necessity not documented, B3.06 Missing risk score, B6.03 CDI query unanswered |
| **Connected Metric(s)** | D11 Denials by Provider/Physician, D23 Payer x Provider Denial Matrix |

---

### DP-04: Denial Rate Spike by Facility/Place of Service

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Facility-Level Denial Rate Anomaly |
| **What It Detects** | A specific facility or place of service is experiencing higher denial rates than sister facilities, indicating site-specific process breakdowns |
| **Detection Methodology** | Calculate denial rate by facility/POS code. Compare across facilities within the same system. Fire if one facility's denial rate exceeds the system average by >3 percentage points. Also compare each facility to its own trailing 6-month baseline. |
| **Severity** | **Critical** if facility denial rate >20%; **Warning** if >15% or >5 points above system average; **Info** if trending upward for 3 consecutive months |
| **Recommended Action** | Investigate facility-specific processes: registration accuracy, eligibility verification compliance, charge capture workflow, coding resources assigned. Compare staffing ratios to higher-performing facilities. Check if new payer contracts or credentialing gaps are facility-specific. Deploy process audit team to the facility for 1-week on-site review. |
| **Revenue Impact if Unaddressed** | Facility-specific. A mid-size facility with $3M/month charges and 5% excess denial rate = $150K/month. |
| **Connected Root Cause(s)** | B6.01 Eligibility not checked, B6.07 Registration errors, B3.14 POS mismatch |
| **Connected Metric(s)** | D13 Denials by Place of Service, R05 Charges by Place of Service |

---

### DP-05: Denial Cluster Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Denial Cluster Detection (Same Root Cause Across Multiple Claims) |
| **What It Detects** | A group of denials sharing the same CARC code + payer + CPT family + time window, indicating a systematic issue rather than random individual claim problems |
| **Detection Methodology** | Cluster denials by (CARC, payer, CPT_family, week). Fire if any cluster contains >10 claims in a single week. Weight by dollar value. Rank clusters by total denied amount. A cluster indicates a single fix can resolve multiple denials simultaneously. |
| **Severity** | **Critical** if cluster >50 claims or >$100K; **Warning** if >20 claims or >$25K; **Info** if >10 claims |
| **Recommended Action** | Treat the cluster as a single problem, not individual claims. Identify the common element. If same payer + same CARC: payer policy issue — contact payer provider relations. If same CARC across payers: internal coding/documentation issue — audit and retrain. If same CPT: check NCCI edits, LCD/NCD changes, or modifier requirements. Fix the root, then bulk-resubmit the cluster. |
| **Revenue Impact if Unaddressed** | Clusters compound: 50 claims x $1,200 avg = $60K from one cluster. Organizations typically have 5-15 active clusters at any time = $300K-$900K total. |
| **Connected Root Cause(s)** | B1.01 Payer policy change, B1.02 Coding quality decline, B1.10 Regulatory change |
| **Connected Metric(s)** | D07 Denials by CARC Code, D20 Payer x Denial Category Matrix, D21 Payer x CARC Code Matrix |

---

### DP-06: Payer Behavior Change Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Behavior Change Detection |
| **What It Detects** | A payer has changed its adjudication behavior — new denial patterns, new documentation requirements, new prior auth rules, or new payment policies — before the payer formally announces the change |
| **Detection Methodology** | For each payer, monitor weekly: denial rate by CARC, ADTP, payment variance from contract, new RARC codes appearing. Fire if any metric shifts >2 standard deviations from 90-day baseline. Correlate across metrics: if denial rate AND ADTP both shift simultaneously, confidence is high. Check for new RARC codes never seen before from this payer. |
| **Severity** | **Critical** if multiple metrics shift simultaneously for a top-5 payer; **Warning** if single metric shift; **Info** if new RARC codes appear |
| **Recommended Action** | Contact payer provider relations to confirm policy change. Pull the payer's latest provider bulletin. Update claim scrubber rules to match new requirements. If new auth requirements: update PA-required procedure list immediately. If new documentation requirements: update CDI checklists. Retroactively review claims denied under the new behavior for appeal eligibility. |
| **Revenue Impact if Unaddressed** | Undetected payer behavior changes typically affect 3-8% of that payer's claims. For a payer with $1M/month volume, that is $30K-$80K/month in preventable denials. |
| **Connected Root Cause(s)** | B2.01 Payer proprietary criteria, B2.02 PA requirement expansion, B2.04 Documentation threshold change |
| **Connected Metric(s)** | D10 Denials by Payer, D21 Payer x CARC Code Matrix, P12 ADTP by Payer |

---

### DP-07: Provider-Specific Denial Concentration

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Provider Denial Concentration Index |
| **What It Detects** | A disproportionate share of total denial dollars is concentrated in a small number of providers, indicating high-impact targets for denial reduction |
| **Detection Methodology** | Rank providers by total denial dollars. Calculate concentration: if top 10% of providers account for >40% of total denial dollars, fire diagnostic. Calculate each provider's denial rate vs peer benchmark. The intersection of high volume AND high denial rate identifies maximum-impact providers. |
| **Severity** | **Critical** if top 5 providers account for >30% of all denial dollars; **Warning** if >20%; **Info** if any provider's denial rate is >2x specialty average |
| **Recommended Action** | Create provider-specific denial scorecards for the top 5 denial-generating providers. Schedule 1:1 review with each provider and their department chair. Identify the dominant CARC for each provider. Deploy targeted CDI resources to these providers. Implement real-time documentation alerts for these providers' encounters. Track monthly improvement. |
| **Revenue Impact if Unaddressed** | If top 5 providers generate $500K/month in denials and intervention can reduce their denial rate by 50%, recovery = $250K/month = $3M annually. |
| **Connected Root Cause(s)** | B3.05 Medical necessity not documented, B3.17 Documentation insufficient, B6.03 CDI query unanswered |
| **Connected Metric(s)** | D11 Denials by Provider/Physician, D23 Payer x Provider Denial Matrix |

---

### DP-08: Modifier-Driven Denial Patterns

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Modifier-Driven Denial Pattern |
| **What It Detects** | Denials caused by missing, incorrect, or inappropriate modifier usage — a common and preventable denial category |
| **Detection Methodology** | Filter denials where CARC indicates modifier issue (CO-4, CO-59, CO-97). Group by modifier (25, 26, TC, 59, XE, XS, XP, XU, 76, 77). Calculate denial rate per modifier per CPT per payer. Fire if any modifier+CPT+payer combination has denial rate >15%. Also detect: modifier used where not required, modifier missing where required. |
| **Severity** | **Critical** if modifier denials >$50K/month; **Warning** if >$20K/month; **Info** if modifier denial rate >10% for any combination |
| **Recommended Action** | Build payer-specific modifier requirement matrix (payer x CPT x modifier). Update claim scrubber to enforce modifier rules pre-submission. Common fixes: (1) Modifier 25 required with E&M + procedure for specific payers — add scrubber rule. (2) Modifier 59 vs XE/XS/XP/XU — some payers require specific X-modifiers. (3) TC/26 split billing rules. Train coders on payer-specific modifier requirements. |
| **Revenue Impact if Unaddressed** | Modifier denials are typically 5-8% of all denials. On $500K total monthly denials = $25K-$40K/month, of which 80%+ is recoverable with correct modifier application. |
| **Connected Root Cause(s)** | B3.02 Incorrect/missing modifier, B6.05 Payer rules not updated |
| **Connected Metric(s)** | D17 Denials by Modifier, CD07 Modifier Usage Rate |

---

### DP-09: Place of Service Denial Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Place of Service Denial Anomaly |
| **What It Detects** | Denials driven by place of service (POS) mismatches — claims billed with incorrect POS code, or payer requiring a different site of service |
| **Detection Methodology** | Filter denials with CARC CO-4/CO-58 where RARC indicates POS issue. Group by POS code. Calculate denial rate by POS. Fire if any POS code has denial rate >10% or if POS-related denials are increasing month-over-month. Cross-reference with actual service location from EHR encounter data. |
| **Severity** | **Critical** if POS denials >$30K/month; **Warning** if >$10K/month; **Info** if POS denial rate trending upward |
| **Recommended Action** | Audit POS assignment workflow. Common issues: (1) Telehealth visits billed with wrong POS (should be POS 02 or 10). (2) Hospital-based clinic visits using POS 11 instead of POS 22. (3) ASC vs office distinction. Update registration system POS defaults. Add POS validation to claim scrubber. Educate front desk on POS selection for multi-site organizations. |
| **Revenue Impact if Unaddressed** | POS mismatches affect reimbursement rates even when not denied — wrong POS can result in lower payment. Combined denial + underpayment impact typically $20K-$80K/month. |
| **Connected Root Cause(s)** | B3.14 Place of service mismatch, B3.24 Site of service denial |
| **Connected Metric(s)** | D13 Denials by Place of Service, R05 Charges by Place of Service |

---

### DP-10: DRG-Level Denial Diagnostics (Inpatient)

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | DRG-Level Denial Pattern Detection |
| **What It Detects** | Specific DRGs experiencing disproportionate denials — indicating clinical documentation, medical necessity, or utilization review issues for those case types |
| **Detection Methodology** | Calculate denial rate by DRG code. Compare to national benchmark denial rates by DRG. Fire if denial rate exceeds benchmark by >5 percentage points. Also fire if DRG denial rate exceeds organization average by >2x. Weight by DRG relative weight to prioritize high-value DRGs. |
| **Severity** | **Critical** if high-weight DRG (RW >2.0) with >20% denial rate; **Warning** if any DRG with >15% denial rate; **Info** if DRG denial rate trending upward |
| **Recommended Action** | For each flagged DRG: (1) Pull denial detail — is it medical necessity (CO-50), DRG mismatch (CO-4/CO-6), or clinical validation? (2) If medical necessity: Review documentation templates for this DRG's principal diagnosis. (3) If DRG mismatch: Audit DRG assignment accuracy. (4) If clinical validation: Prepare peer-to-peer review package. Deploy concurrent CDI review for flagged DRGs. Implement clinical validation documentation checklists. |
| **Revenue Impact if Unaddressed** | High-weight DRGs can have $15K-$50K reimbursement. A 20% denial rate on 50 cases/month of a $20K DRG = $200K/month at risk. |
| **Connected Root Cause(s)** | B3.03 Incorrect DRG, B3.05 Medical necessity, B3.25 Retrospective review |
| **Connected Metric(s)** | D15 Denials by DRG, R07 Charges by DRG, R10 Case Mix Index |

---

### DP-11: Denial Recurrence Pattern

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Denial Recurrence for Previously Resolved Root Causes |
| **What It Detects** | A denial pattern that was previously identified and "fixed" has returned, indicating the fix did not hold or a new variant of the same issue has emerged |
| **Detection Methodology** | Track denial clusters over time. If a cluster was identified, action was taken, denial rate improved, then denial rate regressed to pre-intervention levels within 90 days, fire this diagnostic. Compare CARC+payer+CPT combinations to historical resolved clusters. |
| **Severity** | **Critical** if recurrence is within 60 days of intervention; **Warning** if within 90 days; **Info** if within 180 days |
| **Recommended Action** | The previous fix was insufficient. Investigate why: (1) Was the scrubber rule removed or overridden? (2) Did new staff not receive the training? (3) Did the payer change criteria again? Implement a permanent fix with monitoring alert. Add this pattern to the compliance audit checklist. Assign permanent ownership of this denial category. |
| **Revenue Impact if Unaddressed** | Recurrent denials represent permanent revenue leakage. If the original cluster was $50K/month, recurrence means re-losing that $50K/month plus the cost of the failed intervention. |
| **Connected Root Cause(s)** | B6.15 No feedback loop from denials to front-end |
| **Connected Metric(s)** | D04 Denial Rate Trend, D07 Denials by CARC Code |

---

### DP-12: First-Pass Denial Rate Deterioration

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | First-Pass Denial Rate Deterioration |
| **What It Detects** | The percentage of claims denied on first submission is increasing, indicating degradation in pre-submission quality controls |
| **Detection Methodology** | Calculate first-pass denial rate = claims denied on initial submission / total claims adjudicated. Compare to trailing 6-month average. Fire if rate increases >2 percentage points. Break down by denial category to identify which category is driving the increase. |
| **Severity** | **Critical** if first-pass denial rate >12%; **Warning** if >10% or increasing >2 points; **Info** if >8% |
| **Recommended Action** | Audit the claim scrubber: are all rules current? Review CRS (Claim Risk Score) thresholds: are high-risk claims being held for review? Check if coding accuracy has declined (see DP-03). Verify eligibility verification rates. The first-pass rate is the most comprehensive upstream quality indicator — its deterioration means something in the pre-submission process is broken. |
| **Revenue Impact if Unaddressed** | Each 1% increase in first-pass denial rate on 5,000 claims/month at $1,200 avg = $60K/month in rework, delays, and unrecovered denials. |
| **Connected Root Cause(s)** | B1.02 Coding quality decline, B6.05 Payer rules stale, B1.03 Eligibility verification failure |
| **Connected Metric(s)** | D05 Initial Denial Rate, C06 First Pass Rate, C07 Clean Claim Rate |

---

### DP-13: Denial Category Distribution Shift

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Denial Category Mix Shift |
| **What It Detects** | The relative distribution of denials across categories (coding, eligibility, auth, medical necessity, timely filing, COB) has shifted, indicating a change in the type of problems occurring even if the total denial rate is stable |
| **Detection Methodology** | Calculate denial category distribution (% of total denials by category). Compare month-over-month. Fire if any category's share increases >5 percentage points. A shift means the intervention strategy must change — resources deployed against the old dominant category may be misallocated. |
| **Severity** | **Critical** if a previously minor category becomes dominant (>30% share); **Warning** if any category shifts >5 points; **Info** if any shift >3 points |
| **Recommended Action** | Reallocate denial management resources to match the new distribution. If medical necessity is growing: increase CDI investment. If eligibility is growing: strengthen pre-service verification. If auth is growing: update PA workflows. If coding is growing: audit coding quality. The denial category mix is the most important strategic signal for denial management resource allocation. |
| **Revenue Impact if Unaddressed** | Misallocated denial management resources waste effort on categories that are improving while ignoring categories that are growing. Typical impact: 10-20% reduction in denial management effectiveness. |
| **Connected Root Cause(s)** | B1.01 through B1.10 (macro denial causes) |
| **Connected Metric(s)** | D09 Denials by Category, D07 Denials by CARC Code |

---

### DP-14: Weekend/Off-Hours Denial Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Day-of-Week and Time-of-Day Denial Pattern |
| **What It Detects** | Claims from weekend or off-hours services experiencing higher denial rates, indicating process gaps when reduced staffing is present (eligibility not checked, auth not obtained, registration errors) |
| **Detection Methodology** | Calculate denial rate by day-of-week and shift (day/evening/night/weekend). Compare weekend/off-hours denial rate to weekday/day-shift baseline. Fire if weekend denial rate exceeds weekday by >5 percentage points. Decompose by CARC to identify which denial types increase during off-hours. |
| **Severity** | **Critical** if weekend denial rate >2x weekday; **Warning** if >1.5x; **Info** if statistically significant difference |
| **Recommended Action** | Common off-hours gaps: (1) Eligibility verification not performed for ED/urgent visits — implement real-time verification at triage. (2) Prior auth not obtainable after hours — implement retrospective auth workflow for off-hours procedures. (3) Registration accuracy declines with reduced staffing — implement additional validation checks for off-hours registrations. (4) Coding for off-hours encounters may be delayed — ensure coding coverage matches encounter patterns. |
| **Revenue Impact if Unaddressed** | If 20% of volume is off-hours/weekend with a 15% denial rate vs 8% weekday, the excess 7% on 20% of volume = 1.4% additional overall denial rate. On $5M monthly, that is $70K/month. |
| **Connected Root Cause(s)** | B6.01 Eligibility not checked, B6.07 Registration errors |
| **Connected Metric(s)** | D18 Denials by Day of Week, D09 Denials by Category |

---

### DP-15: Denial Aging Without Appeal

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Aging Denials Without Appeal Action |
| **What It Detects** | Denied claims that are aging in the denial queue without an appeal being filed, an adjustment being posted, or any resolution activity — representing stagnant revenue at risk |
| **Detection Methodology** | For each denied claim, calculate days_since_denial. Cross-reference with appeal status and activity log. Fire if any denied claim has days_since_denial >14 with no appeal filed, no corrected claim submitted, and no adjustment posted. Aggregate by payer and CARC for pattern identification. Compare to payer-specific appeal deadlines. |
| **Severity** | **Critical** if aging denials >$200K or any approaching appeal deadline; **Warning** if >$100K or aging >30 days; **Info** if >$50K or aging >14 days |
| **Recommended Action** | Immediately triage all aging denials: (1) Appealable? File appeal now. (2) Correctable and resubmittable? Fix and resubmit. (3) Non-recoverable? Post adjustment and close. The goal is zero denials sitting idle >14 days. Implement daily denial triage: every new denial assessed within 48 hours for action path. Auto-queue appealable denials with deadline countdown. |
| **Revenue Impact if Unaddressed** | Idle denials are decaying assets. Appeal win rates decline with time (50% at 30 days vs 30% at 90 days vs 15% at 180 days). $200K in aging denials losing 20% recovery probability = $40K permanently lost to delay. |
| **Connected Root Cause(s)** | B6.09 Appeal not filed, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | D19 Denials by Claim Age at Denial, D24 Appeal Filed Rate, D29 Average Days to Appeal Resolution |

---

### DP-16: Partial Payment Denial Pattern

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Partial Payment with Residual Denial |
| **What It Detects** | Claims where the payer paid a portion but denied a portion — the denied portion may be appealable or may indicate a systematic underpayment pattern disguised as partial denial |
| **Detection Methodology** | Identify claims with CARC indicating partial payment (CO-45 with remaining balance not fully explained by patient responsibility). Calculate the denied portion as a percentage of expected allowed. Fire if partial denial rate >10% of claims or if denied portions are concentrated in specific CPTs or payers. |
| **Severity** | **Critical** if partial denials represent >$100K/month in under-collection; **Warning** if >$50K; **Info** if pattern is systematic |
| **Recommended Action** | Analyze partial payment patterns: (1) If payer is paying a fraction of the fee schedule — this is a contract compliance issue (see PF-08). (2) If payer is denying specific line items on multi-line claims — check bundling rules and modifier requirements. (3) If payer is reducing payment citing "usual and customary" — verify fee schedule terms in contract. For each pattern: file underpayment dispute or appeal for the denied portion. |
| **Revenue Impact if Unaddressed** | Partial denials are often overlooked because the claim "was paid." But if 1,000 claims/month have an average $75 underpayment disguised as partial denial, that is $75K/month in silent leakage. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment, B2.03 Payer underpayment strategy |
| **Connected Metric(s)** | P09 Payment Variance, P10 Underpayment Amount, D03 Denial Amount |

---

### DP-17: New CARC/RARC Code Emergence

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | New Denial Reason Code Detection |
| **What It Detects** | CARC or RARC codes appearing in ERA data that have not been seen before from a specific payer, or that are appearing with significantly increased frequency — indicating a new payer behavior |
| **Detection Methodology** | Maintain a rolling inventory of CARC/RARC codes by payer. Flag any code that appears for the first time or whose volume increases >3x from the prior 90-day average. Cross-reference new codes with CARC/RARC taxonomy to determine meaning and required response. |
| **Severity** | **Critical** if new code affects >50 claims in first 30 days; **Warning** if >20 claims; **Info** if any new code appears |
| **Recommended Action** | Research the new code: (1) What does it mean per ASC X12N taxonomy? (2) Is there a corresponding payer bulletin? (3) What action is required (documentation, coding change, auth change)? Build a response playbook for the new code within 5 business days. Update claim scrubber to prevent future occurrences. Retroactively review affected claims for appeal eligibility. |
| **Revenue Impact if Unaddressed** | New codes often signal policy changes that will affect growing volumes of claims. Early detection (first 2 weeks) vs late detection (after 90 days) can be the difference between $25K and $250K in affected claims. |
| **Connected Root Cause(s)** | B1.01 Payer policy change, B2.01 Payer proprietary criteria |
| **Connected Metric(s)** | D07 Denials by CARC Code, D08 Denials by RARC Code |

---

### DP-18: Medical Necessity Denial Surge

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Medical Necessity Denial Volume Surge |
| **What It Detects** | CO-50 (medical necessity) denials increasing beyond baseline, indicating either payer criteria tightening, documentation quality decline, or utilization review changes |
| **Detection Methodology** | Track CO-50 denial count and dollar amount weekly. Compare to trailing 90-day average. Fire if CO-50 denials increase >25% in volume or >$50K in dollars. Decompose by payer, by DRG/CPT, and by physician to localize the source. |
| **Severity** | **Critical** if CO-50 surge >50% or >$100K; **Warning** if >25% or >$50K; **Info** if upward trend for 4 weeks |
| **Recommended Action** | Determine if payer-driven or provider-driven: (1) If concentrated in one payer: check for payer criteria changes, new utilization management vendor, new medical director. Contact payer for clinical criteria. (2) If concentrated in one physician: CDI intervention for that provider. (3) If spread across payers and providers: systemic documentation quality issue — CDI program needs strengthening. For all CO-50 denials: peer-to-peer review is the most effective appeal strategy. |
| **Revenue Impact if Unaddressed** | CO-50 denials are typically high-value (inpatient stays, complex procedures). Average CO-50 denial value is $5K-$25K. A 50% surge of 50 additional CO-50 denials/month at $10K avg = $500K/month at risk, with 40-50% appeal win rate. |
| **Connected Root Cause(s)** | B3.05 Medical necessity not documented, B2.01 Payer proprietary criteria, B1.05 CDI weakness |
| **Connected Metric(s)** | D07 Denials by CARC Code (CO-50), D10 Denials by Payer, D15 Denials by DRG |

---

### DP-19: Eligibility-Related Denial Surge

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Eligibility Denial Category Spike |
| **What It Detects** | Denials for eligibility-related reasons (CO-27, CO-29, CO-39, CO-197 for coverage termination) surging beyond baseline, indicating pre-service verification failures |
| **Detection Methodology** | Track eligibility CARC codes weekly. Compare to trailing 90-day average. Fire if eligibility denials increase >30% or exceed 10% of total denials. Decompose by: (1) Coverage terminated before service. (2) Coverage terminated during service. (3) Never had coverage. (4) Wrong payer on file. |
| **Severity** | **Critical** if eligibility denials >15% of total; **Warning** if >10% or surging >30%; **Info** if >8% or trending upward |
| **Recommended Action** | Audit eligibility verification workflow: (1) What percentage of patients are verified before service? (2) How far in advance? (3) Is re-verification performed for recurring patients? For coverage terminations: implement 24-hour pre-service re-check. For wrong payer: improve registration data capture. For never-covered: implement insurance discovery. Target: zero eligibility denials from preventable causes. |
| **Revenue Impact if Unaddressed** | Eligibility denials have low appeal success (<20%). $75K/month in eligibility denials = $60K+ in permanent losses. Prevention ROI is extremely high. |
| **Connected Root Cause(s)** | B1.03 Eligibility verification failure, B3.09 Eligibility terminated, B6.01 Eligibility not checked |
| **Connected Metric(s)** | D09 Denials by Category (Eligibility), E01 Eligibility Verification Rate, E10 Coverage Termination Rate |

---

### DP-20: Appeal Overturn Rate by Denial Type

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Denial Type Appeal ROI Assessment |
| **What It Detects** | Which denial types (CARC categories) have high appeal success rates (worth investing in appeals) vs low rates (better to invest in prevention) — enabling data-driven appeal resource allocation |
| **Detection Methodology** | Calculate appeal win rate by CARC code. Rank CARC codes by: (win_rate x avg_denial_amount x volume) = expected appeal revenue per CARC. Fire if any high-win-rate CARC (>50%) has <80% appeal filing rate (money being left on table). Also fire if resources are being spent on low-win-rate (<20%) appeals. |
| **Severity** | **Critical** if >$100K/month in high-win-rate denials not being appealed; **Warning** if >$50K; **Info** if any misallocation detected |
| **Recommended Action** | Restructure appeal strategy by CARC: (1) High win rate (>50%): appeal 100% — assign dedicated staff. (2) Medium win rate (25-50%): appeal if dollar value justifies cost. (3) Low win rate (<25%): invest in prevention rather than appeal — redirect resources to upstream fix. Publish quarterly appeal ROI report by CARC to guide staffing. Common high-win CARCs: CO-4 (coding, 65-75% win), CO-50 with peer-to-peer (45-55% win). Common low-win CARCs: CO-29 timely filing (<10% win), CO-27 eligibility (<15% win). |
| **Revenue Impact if Unaddressed** | Misallocated appeal effort wastes 30-40% of appeal team productivity on low-return appeals while forgoing high-return opportunities. Typical reallocation impact: $50K-$150K/month in additional appeal recovery. |
| **Connected Root Cause(s)** | B6.09 Appeal not filed |
| **Connected Metric(s)** | D25 Appeal Win Rate L1, D30 Appeal Win Rate by CARC, D28 Appeal Recovery Amount, D32 Appealable vs Non-Appealable Split |

---

### DP-21: Service Line Denial Rate Disparity

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Service Line Denial Rate Outlier |
| **What It Detects** | Specific service lines experiencing denial rates significantly above the organizational average — indicating service-line-specific billing, coding, or documentation problems |
| **Detection Methodology** | Calculate denial rate by service line. Compare each to organizational average. Fire if any service line's denial rate exceeds org average by >5 percentage points or exceeds 15% absolute. Weight by dollar impact (high-revenue service lines with high denial rates are highest priority). |
| **Severity** | **Critical** if high-revenue service line denial rate >20%; **Warning** if >15% or >5 points above average; **Info** if any service line above average for 3 months |
| **Recommended Action** | Deep-dive the flagged service line: (1) Is it a new service line without established billing rules? Deploy pre-launch billing checklist. (2) Is it a surgical service with complex coding? Add coding specialist or second-level review. (3) Is it a service line with high prior auth requirements? Verify PA workflow. (4) Are specific payers driving the service line's denials? Target payer-specific fixes. Create service-line-specific denial reduction plan with measurable targets. |
| **Revenue Impact if Unaddressed** | A service line with $2M/month charges and 20% denial rate vs 10% org average = $200K/month excess denials. Even with 50% recovery, $100K/month is permanently lost. |
| **Connected Root Cause(s)** | B1.07 New service lines, A1.01 Denial-driven revenue loss |
| **Connected Metric(s)** | D12 Denials by Service Line, R02 Charges by Service Line |

---

## 3. PAYMENT FLOW DIAGNOSTICS

### PF-01: ERA-to-Bank Discrepancy Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | ERA-to-Bank Reconciliation Discrepancy |
| **What It Detects** | The total amount reported on ERAs (835 files) does not match the actual bank deposit amount, indicating missing payments, payer processing errors, or recoupments |
| **Detection Methodology** | For each ERA batch, compare SUM(era_paid_amount) to corresponding bank deposit. Fire if absolute variance exceeds $500 or 1% of batch total. Track variance direction: if ERA > bank consistently, payer may be recouping or withholding. If bank > ERA, there are unposted payments. |
| **Severity** | **Critical** if cumulative monthly variance >$50K; **Warning** if any single batch variance >$5K; **Info** if variance pattern is systematic (same direction, same payer) |
| **Recommended Action** | For ERA > bank: Check for payer recoupments (PLB segments in 835). Check for offset adjustments. Contact payer for explanation of withheld amounts. For bank > ERA: Check for missing ERA files. Check for manual checks not yet posted. Contact payer for ERA reissue. Implement claim-level reconciliation (not just batch-level). |
| **Revenue Impact if Unaddressed** | Unreconciled ERA-to-bank gaps are direct cash leakage. A 2% variance on $5M monthly collections = $100K/month that cannot be accounted for. |
| **Connected Root Cause(s)** | A1.06 Unapplied/unposted payments, A2.02 Payer float manipulation, B6.14 Batch-level reconciliation only |
| **Connected Metric(s)** | B01 ERA Total vs Bank Total, B02 ERA-Bank Variance Amount, B03 ERA-Bank Variance % |

---

### PF-02: Silent Underpayment Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Silent Underpayment Detection |
| **What It Detects** | Claims paid by the payer but at an amount below the contracted rate — these are "silent" because they show as paid (not denied) and are often missed unless contract rates are systematically compared |
| **Detection Methodology** | For every paid claim, compare ERA paid amount to expected allowed amount from contract rate table. Fire if paid < expected by >$5 per claim. Aggregate by payer and CPT to identify systematic patterns. Exclude claims with patient responsibility adjustments (PR-1, PR-2, PR-3) from the comparison. Calculate: underpayment_amount = contract_rate - paid - patient_responsibility. |
| **Severity** | **Critical** if total underpayment >$100K/month across all payers; **Warning** if any single payer underpaying >$25K/month; **Info** if systematic underpayment detected for any payer |
| **Recommended Action** | File underpayment appeal/dispute with each underpaying payer. Include ERA evidence and contract rate documentation. For high-volume systematic underpayments: escalate to payer provider relations with aggregate report. Document pattern for contract renegotiation leverage. If payer does not resolve within 60 days: consider filing with state insurance commissioner. Set up automated underpayment detection to catch future occurrences. |
| **Revenue Impact if Unaddressed** | Silent underpayments are the second-largest source of revenue leakage (typically 10-25% of total shortfall). $100K/month = $1.2M/year in lost revenue that was contractually owed. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment, B2.03 Payer underpayment strategy, B2.09 Contract fee schedule error |
| **Connected Metric(s)** | P09 Payment Variance, P10 Underpayment Amount, B08 Contract Compliance Rate, B09 Underpayment Detection Count |

---

### PF-03: ADTP Trend Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Average Days to Pay (ADTP) Trend Anomaly |
| **What It Detects** | One or more payers are taking significantly longer to pay claims than their historical baseline, indicating payer processing delays, system issues, or deliberate float manipulation |
| **Detection Methodology** | Calculate ADTP by payer on a rolling 30-day basis. Compare to trailing 90-day baseline. Fire if ADTP increases by >5 days for any payer. Also fire if overall ADTP increases by >3 days. Cross-reference with denial rate: if ADTP up AND denial rate up, payer may be using denials to delay payment. |
| **Severity** | **Critical** if ADTP increase >10 days for a top-5 payer; **Warning** if >5 days; **Info** if upward trend for 4+ consecutive weeks |
| **Recommended Action** | Contact payer provider relations to inquire about processing delays. Check if the payer has system outages or claims backlogs. If ADTP increase is accompanied by denial rate increase, investigate whether payer is denying claims to manage cash flow (B2.10). Adjust cash flow forecast for the slower payment cycle. If persistent (>60 days), escalate to payer executive contacts and consider contractual remedies (prompt pay requirements). |
| **Revenue Impact if Unaddressed** | Each 1-day ADTP increase across $5M monthly collections = approximately $167K in delayed cash. A 10-day increase = $1.67M in working capital impact. Interest cost at 5% = $83K/year per day of delay. |
| **Connected Root Cause(s)** | A2.01 ADTP increase by payer, A2.02 Payer float manipulation, A2.07 Payer system outage |
| **Connected Metric(s)** | P11 Overall ADTP, P12 ADTP by Payer, P15 ADTP Trend, P16 ADTP vs Benchmark |

---

### PF-04: Payer Float Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Float Detection |
| **What It Detects** | The gap between ERA issuance date and bank deposit clearing date is increasing, indicating the payer is holding funds after reporting payment — earning float at the provider's expense |
| **Detection Methodology** | Calculate float_days = bank_clear_date - era_issuance_date by payer. Compare to payer baseline. Fire if float_days increase by >3 days. Also fire if float_days exceed 5 business days for any EFT payment (industry standard is 1-3 days for EFT). |
| **Severity** | **Critical** if float >7 business days for any payer; **Warning** if >5 days; **Info** if increasing trend |
| **Recommended Action** | Contact payer to demand compliance with prompt pay regulations (most states require payment within 30-45 days of clean claim receipt). If float is on EFT payments, verify EFT enrollment and banking information. If payer is issuing virtual credit cards instead of EFT, negotiate return to EFT (VCC processing delays are common). Document float patterns for contract renegotiation. |
| **Revenue Impact if Unaddressed** | Float directly impacts working capital. 5 extra float days on $5M monthly collections = $833K in delayed cash. Annual interest cost at 5% = $42K. |
| **Connected Root Cause(s)** | A2.02 Payer float manipulation |
| **Connected Metric(s)** | B06 Float Days, R21 Daily Cash Receipts |

---

### PF-05: Ghost Payment Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Ghost Payment Detection |
| **What It Detects** | Bank deposits that have no matching ERA record — money arrived but there is no explanation of what it pays for, making it impossible to post to patient accounts |
| **Detection Methodology** | Match bank deposits to ERA files by payer + amount (within 2%) + date (within 7 days). Flag deposits with no ERA match after 14 days. Also flag ERA records with no matching bank deposit. Group ghost payments by payer to identify systematic issues. |
| **Severity** | **Critical** if ghost payments >$50K unmatched for >30 days; **Warning** if >$10K for >14 days; **Info** if any ghost payment exists |
| **Recommended Action** | For deposits without ERA: Contact payer for ERA reissue or payment explanation. Check if ERA was sent to a different clearinghouse or TIN. Check if deposit is a refund, settlement, or incentive payment. For ERA without deposit: Verify EFT enrollment. Check if payment was sent as a paper check. Contact payer to confirm payment was issued. Post matched payments immediately; escalate unmatched items weekly. |
| **Revenue Impact if Unaddressed** | Ghost payments cannot be posted to patient accounts, leaving AR incorrectly aged. They also prevent accurate patient billing. Typical ghost payment backlog = $50K-$200K in any given month. |
| **Connected Root Cause(s)** | A1.06 Unapplied/unposted payments, B6.10 Payment posting delay |
| **Connected Metric(s)** | B04 Unmatched ERA Records, B05 Unmatched Bank Deposits, P08 Unapplied Payments |

---

### PF-06: Claim Washing Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Washing Detection |
| **What It Detects** | Payer denying a claim, provider correcting and resubmitting, payer denying again with a different reason — cycling the claim through multiple denial-resubmit loops without ever paying it, effectively running out the timely filing clock |
| **Detection Methodology** | Track claims through denial-resubmit cycles. Flag claims on their 3rd+ submission. Calculate total cycle time from first submission to current status. Fire if claim has been denied 3+ times with different CARC codes each time. Fire if cycle time is approaching timely filing deadline. |
| **Severity** | **Critical** if >100 claims in active washing cycle or total dollars >$200K; **Warning** if >25 claims or >$50K; **Info** if any claims on 3rd+ submission |
| **Recommended Action** | Escalate washed claims to payer provider relations immediately — claim washing is a bad-faith practice. Document the denial history showing different CARC codes on each denial. File formal complaint with state insurance commissioner if pattern is systematic. Request timely filing extension based on payer's denial cycling. Consider engaging a payer disputes attorney if dollars warrant. |
| **Revenue Impact if Unaddressed** | Washed claims almost always result in timely filing write-offs if not escalated. If 100 claims at $1,500 avg are being washed, $150K is at risk of permanent loss. |
| **Connected Root Cause(s)** | A2.06 Claim resubmission cycle, A1.03 Timely filing write-offs, B2.10 Payer financial stress |
| **Connected Metric(s)** | C10 Claim Resubmission Rate, O08 Timely Filing Risk Claims, D04 Denial Rate Trend |

---

### PF-07: COB Payment Gap Analysis

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Coordination of Benefits Payment Gap |
| **What It Detects** | Claims involving multiple payers (primary + secondary) where the combined payment is less than expected, either because secondary was never billed, secondary denied, or COB coordination failed |
| **Detection Methodology** | For claims with known secondary coverage: compare primary_paid + secondary_paid to expected_allowed. Fire if gap >$50 per claim. Also flag claims where primary paid and COB adjustment was taken but no secondary claim was submitted within 30 days. Track secondary denial rate separately. |
| **Severity** | **Critical** if COB gap >$75K/month; **Warning** if >$25K/month; **Info** if secondary billing lag >30 days |
| **Recommended Action** | Audit secondary billing workflow. Are secondary claims being generated automatically after primary payment posts? If secondary is denying: verify COB order with both payers. Run insurance discovery on patients with COB denials to verify coverage. If systematic: implement automated secondary claim generation triggered by primary ERA posting. Common issue: patient has Medicare + supplemental but supplemental is not on file. |
| **Revenue Impact if Unaddressed** | Secondary payer revenue is often 15-25% of total allowed for dual-coverage patients. If 500 claims/month have COB gaps averaging $200, that is $100K/month in uncollected secondary revenue. |
| **Connected Root Cause(s)** | B3.10 COB error, B2.06 COB disputes |
| **Connected Metric(s)** | E11 COB Volume, D09 Denials by Category (COB) |

---

### PF-08: Contract Rate Compliance Diagnostics

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Contract Rate Compliance Check |
| **What It Detects** | Payments that deviate from contracted rates — either underpayments (payer paying less than contract) or overpayments (payer paying more, creating recoupment risk) |
| **Detection Methodology** | For each claim, compare ERA paid to contract rate for that CPT+payer+POS combination. Calculate compliance_rate = claims_paid_at_contract / total_claims. Fire if compliance rate <95% for any payer. Track variance direction and magnitude. Flag both under and over-payments. |
| **Severity** | **Critical** if contract compliance <90% for any payer; **Warning** if <95%; **Info** if trending downward |
| **Recommended Action** | For underpayments: File underpayment disputes with contract documentation. For overpayments: Set aside reserve for potential recoupment — do NOT spend overpayment amounts. For both: Verify contract rate table is current (effective dates, fee schedule updates, carve-outs). If compliance is systematically low for a payer: schedule contract review meeting. If new CPT codes are not in the contract: negotiate rates or verify default pricing applies. |
| **Revenue Impact if Unaddressed** | A 5% non-compliance rate on $3M/month payer volume = $150K/month in payment variance. Underpayments are lost revenue; overpayments create recoupment liability. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment, A1.08 Contract rate erosion, B2.09 Contract fee schedule error |
| **Connected Metric(s)** | B08 Contract Compliance Rate, B09 Underpayment Detection Count, B10 Underpayment Total $, B11 Overpayment Detection Count |

---

### PF-09: Zero-Pay Remittance Analysis

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Zero-Pay ERA Pattern Detection |
| **What It Detects** | ERAs received with $0 payment where the claim was expected to be paid — not denials with a CARC, but adjudicated as paid-at-zero, often indicating processing errors or incorrect adjustments |
| **Detection Methodology** | Filter ERA records where paid_amount = $0 AND no denial CARC is present AND patient responsibility codes do not explain the full billed amount. Count occurrences by payer. Fire if zero-pay rate exceeds 2% for any payer or if zero-pay dollar volume (at billed rates) exceeds $25K/month. |
| **Severity** | **Critical** if zero-pay volume >$100K/month at billed rates; **Warning** if >$25K; **Info** if any systematic zero-pay pattern |
| **Recommended Action** | Contact payer for explanation of each zero-pay ERA. Common causes: (1) Payer processed claim but payment went to a different TIN or NPI. (2) Payer applied full amount to patient responsibility incorrectly. (3) Payer system error. (4) Offset against a recoupment not properly documented. Request reprocessing for each zero-pay claim. |
| **Revenue Impact if Unaddressed** | Zero-pay claims are 100% revenue loss unless investigated. If 50 claims/month are zero-paid at $2,000 avg expected payment, $100K/month is at stake. |
| **Connected Root Cause(s)** | B2.08 Payer system errors, A1.02 Silent underpayment |
| **Connected Metric(s)** | P04 Average Payment per Claim, P05 Payment vs Expected Allowed |

---

### PF-10: Virtual Credit Card Payment Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Virtual Credit Card Payment Volume |
| **What It Detects** | Payers sending payments via virtual credit cards (VCC) instead of EFT, which incur processing fees (typically 2-3%) that reduce net revenue |
| **Detection Methodology** | Track payment method by payer. Flag payers sending >20% of payments via VCC. Calculate VCC processing fee amount per payer. Fire if VCC fees exceed $5K/month total or if a payer switches from EFT to VCC. |
| **Severity** | **Critical** if VCC processing fees >$20K/month; **Warning** if >$5K; **Info** if any VCC payments from payers enrolled in EFT |
| **Recommended Action** | Contact each payer sending VCC payments and request switch to EFT. Many payers default to VCC because they earn interchange fees. If payer refuses: (1) Negotiate VCC fee offset in contract. (2) Evaluate whether to decline VCC and request paper check (slower but no fee). (3) Use VCC-to-EFT conversion services. Ensure all payer EFT enrollments are current and bank info is up to date. |
| **Revenue Impact if Unaddressed** | VCC processing fees of 2.5% on $1M/month in VCC payments = $25K/month = $300K/year in unnecessary processing fees. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment (fees reduce net), A2.02 Payer float manipulation |
| **Connected Metric(s)** | R11 Net Collections, R21 Daily Cash Receipts |

---

### PF-11: Payment Recoupment Without Notice

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Unauthorized Payer Recoupment Detection |
| **What It Detects** | Payers offsetting current payments against alleged overpayments from prior periods without providing proper notice or opportunity to dispute, violating contractual and regulatory requirements |
| **Detection Methodology** | Monitor PLB (Provider Level Balance) adjustments in 835 files. Track negative adjustments. For each recoupment: verify that a formal recoupment notice was received at least 30 days prior (per most state regulations). Fire if any recoupment >$500 lacks a corresponding notice. Aggregate by payer. |
| **Severity** | **Critical** if unauthorized recoupments >$50K/month; **Warning** if >$10K; **Info** if any unauthorized recoupment detected |
| **Recommended Action** | For each unauthorized recoupment: (1) Demand written explanation with supporting documentation. (2) If no notice was provided: formally dispute the recoupment citing state prompt pay and recoupment notice requirements. (3) Request repayment of recouped amounts pending proper dispute process. (4) Document pattern for state insurance commissioner complaint if systematic. Most state laws require 30-45 day advance notice before recoupment. |
| **Revenue Impact if Unaddressed** | Unauthorized recoupments are direct revenue loss. Organizations that do not monitor for unauthorized recoupments typically lose $50K-$200K annually to improper offsets. |
| **Connected Root Cause(s)** | B2.07 Prepayment review/audit, B2.03 Payer underpayment strategy |
| **Connected Metric(s)** | B02 ERA-Bank Variance Amount, P01 Total ERA Payments Posted |

---

### PF-12: Duplicate Payment Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Duplicate Payer Payment Detection |
| **What It Detects** | Claims paid more than once by the same payer — creating overpayment liability that the payer will eventually recoup, often with interest |
| **Detection Methodology** | Match ERA records by patient_id + date_of_service + CPT + payer. Flag any combination with >1 paid ERA. Verify that duplicate payment was actually deposited (not just an ERA correction). Calculate total overpayment liability. |
| **Severity** | **Critical** if duplicate payments >$50K outstanding; **Warning** if >$10K; **Info** if any detected |
| **Recommended Action** | For each confirmed duplicate payment: (1) Set aside the duplicate amount in a reserve account — do NOT spend it. (2) Proactively refund the duplicate to the payer with explanation. (3) Document the refund for audit trail. Proactive refund is better than waiting for payer to discover and recoup (which may include interest or penalties). Investigate root cause: is the payer processing the same claim twice, or is the organization submitting duplicates? |
| **Revenue Impact if Unaddressed** | Duplicate payments are a liability, not revenue. If not refunded proactively, payers will recoup with potential interest. More importantly, retaining known overpayments creates compliance risk under False Claims Act anti-retention provisions. |
| **Connected Root Cause(s)** | B2.08 Payer system errors, B3.11 Duplicate claim |
| **Connected Metric(s)** | B11 Overpayment Detection Count, B12 Overpayment Total $ |

---

## 4. AR & COLLECTIONS DIAGNOSTICS

### AC-01: AR Aging Acceleration

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | AR Aging Bucket Acceleration |
| **What It Detects** | Specific AR aging buckets are growing disproportionately — claims are not progressing through the revenue cycle, accumulating in older buckets |
| **Detection Methodology** | Track AR by aging bucket (0-30, 31-60, 61-90, 91-120, 121-180, 180+) as a percentage of total AR. Fire if any bucket's share increases >3 percentage points month-over-month. Identify which bucket is growing and decompose by payer. Compare payer-specific AR aging to payer ADTP — if AR aging is growing faster than ADTP explains, there is an operational bottleneck. |
| **Severity** | **Critical** if AR >90 days exceeds 25% of total AR; **Warning** if >20% or any bucket growing >5 points; **Info** if >15% or upward trend for 3 months |
| **Recommended Action** | Decompose the growing bucket by payer. For each payer contributing to growth: (1) Check denial rate — are denials accumulating without follow-up? (2) Check ADTP — is the payer simply paying slower? (3) Check touch count — are claims being worked? If denials not followed up: reallocate denial management resources. If ADTP slower: contact payer. If not being worked: review work queue prioritization and staffing. |
| **Revenue Impact if Unaddressed** | AR >120 days has a collection probability of <50%. AR >180 days has <25% collection probability. Each $100K that ages from 0-30 to 180+ loses approximately $75K in expected collectability. |
| **Connected Root Cause(s)** | A2.03 AR aging acceleration, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | A01 Total AR Outstanding, A02 AR by Aging Bucket, A05 Days in AR, A06 AR Over 90 Days % |

---

### AC-02: Stale AR Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Stale AR — Claims Past ADTP with No Activity |
| **What It Detects** | Claims that have exceeded the expected ADTP for their payer but have no recent activity (no payment, no denial, no follow-up touch) — these are "forgotten" claims |
| **Detection Methodology** | For each open claim, compare days_outstanding to payer-specific ADTP benchmark. If days_outstanding > ADTP x 1.5 AND no activity in last 30 days, flag as stale. Calculate total stale AR by payer. Rank by dollar amount. |
| **Severity** | **Critical** if stale AR >$500K; **Warning** if >$200K; **Info** if >$50K or stale count increasing |
| **Recommended Action** | Immediately pull stale claims into a priority work queue. Check claim status with payer (was it received? is it in review? was it denied and we missed the ERA?). For claims approaching timely filing: escalate to urgent status. For claims past filing deadline: evaluate appeal options (proof of timely original submission). Implement automated "stale claim" alert at ADTP + 14 days. |
| **Revenue Impact if Unaddressed** | Stale claims have a 30-50% chance of becoming timely filing write-offs. $500K in stale AR = $150K-$250K at risk of permanent loss. |
| **Connected Root Cause(s)** | A2.01 ADTP increase, B6.12 AR follow-up not prioritized, A1.03 Timely filing write-offs |
| **Connected Metric(s)** | A02 AR by Aging Bucket, O05 Work Queue Aging, P12 ADTP by Payer |

---

### AC-03: Write-Off Pattern Diagnostics

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Recoverable Write-Off Detection |
| **What It Detects** | Claims being written off that may actually be recoverable — either through appeal, resubmission, or corrected billing |
| **Detection Methodology** | Analyze all write-offs by category (timely filing, denial, bad debt, small balance, contractual). For denial write-offs: compare CARC to appeal win rate for that CARC — if win rate >40%, these should be appealed, not written off. For timely filing: check if original submission was timely (proof of filing). For small balance: check if aggregated by payer, total is substantial. Flag write-offs where recovery probability >30%. |
| **Severity** | **Critical** if estimated recoverable write-offs >$100K/month; **Warning** if >$50K; **Info** if >$25K or write-off rate increasing |
| **Recommended Action** | Implement write-off review committee: no write-off >$500 without supervisor approval. For denial write-offs with high appeal win rate: reverse write-off and file appeal. For timely filing write-offs: gather proof of original submission and appeal. For small balance write-offs: aggregate by payer and file bulk adjustment dispute. Set minimum balance thresholds by payer based on cost-to-collect analysis. |
| **Revenue Impact if Unaddressed** | Organizations typically write off 3-5% of gross revenue. If 20% of write-offs are recoverable, that is 0.6-1% of gross revenue — on $100M, that is $600K-$1M annually. |
| **Connected Root Cause(s)** | A1.03 Timely filing write-offs, B6.09 Appeal not filed |
| **Connected Metric(s)** | R16 Write-off Amount, D06 Final Denial Rate, D24 Appeal Filed Rate |

---

### AC-04: Patient Balance Collectability Assessment

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Patient Balance Collectability Score |
| **What It Detects** | Patient balances with low probability of collection that are consuming collection resources without return, AND patient balances with high probability that are not being pursued |
| **Detection Methodology** | Score each patient balance on propensity-to-pay using: balance amount, patient age, zip code (income proxy), prior payment history, insurance status, balance age. Segment into tiers: High (>70% collectability), Medium (40-70%), Low (<40%). Fire if: High-propensity balances are not contacted within 14 days, OR >30% of collection effort is spent on Low-propensity accounts. |
| **Severity** | **Critical** if >$200K in high-propensity balances not contacted within 30 days; **Warning** if >$100K; **Info** if collection effort misallocated to low-propensity |
| **Recommended Action** | Reorder collection work queue by propensity score, not by balance age. High propensity: immediate phone outreach with payment plan offer. Medium propensity: digital-first (email, text, portal) with escalation to phone at 30 days. Low propensity: screen for financial assistance/charity care eligibility. If eligible: process financial assistance. If not eligible and no contact after 90 days: evaluate early placement with collection agency to maximize recovery. |
| **Revenue Impact if Unaddressed** | Misallocated collection effort wastes FTE time and misses high-value opportunities. Organizations that implement propensity-based collections see 15-25% improvement in patient collection rates. On $2M patient AR, that is $300K-$500K incremental annually. |
| **Connected Root Cause(s)** | A1.07 Patient bad debt, B6.13 Collections not targeting high-propensity |
| **Connected Metric(s)** | A15 Patient Payment Rate, A16 Self-Pay Conversion Rate, A17 Average Patient Balance, R17 Bad Debt |

---

### AC-05: Collection Velocity by Payer

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Collection Velocity Degradation |
| **What It Detects** | The speed at which AR is converted to cash for a specific payer is slowing, even if denial rate and ADTP appear stable — indicating subtle bottlenecks in the collection process |
| **Detection Methodology** | Calculate collection velocity = (AR resolved this month / AR beginning of month) by payer. Compare to trailing 6-month average. Fire if velocity drops >10% for any payer. Also calculate: AR turnover = Net collections / Average AR by payer. Fire if AR turnover declines. |
| **Severity** | **Critical** if collection velocity drops >20% for a top-5 payer; **Warning** if >10%; **Info** if declining trend for 3 months |
| **Recommended Action** | Investigate payer-specific bottlenecks: (1) Are follow-up calls being made? Check touch count for this payer. (2) Is the payer's portal/phone system creating access barriers? (3) Are corrected claims being resubmitted promptly? (4) Is the payer's appeal process delaying resolution? If velocity decline is staffing-related: reallocate FTEs from faster payers. If payer-related: escalate to payer provider relations. |
| **Revenue Impact if Unaddressed** | A 10% velocity decline on $1M payer AR = $100K in delayed collections per month. Compounding effect: slower velocity means larger AR base, which further slows velocity. |
| **Connected Root Cause(s)** | A2.01 ADTP increase, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | A03 AR by Payer, A05 Days in AR, P12 ADTP by Payer |

---

### AC-06: Bad Debt Conversion Rate Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Bad Debt Conversion Rate Spike |
| **What It Detects** | The rate at which patient AR is converting to bad debt is increasing, indicating either declining patient collectability, inadequate collection effort, or inappropriate balance transfers |
| **Detection Methodology** | Calculate bad debt conversion rate = bad debt transfers / patient AR beginning of period. Compare to trailing 12-month average. Fire if rate increases >2 percentage points or exceeds 5% of patient AR. Decompose by: insurance status at time of service, balance amount tier, service type. |
| **Severity** | **Critical** if bad debt conversion rate >5%; **Warning** if >3% or increasing >1 point; **Info** if upward trend for 3 months |
| **Recommended Action** | Audit bad debt transfers: are accounts being transferred too early (before adequate collection effort) or too late (after recovery probability has dropped)? Review financial assistance screening: are patients who qualify for charity care being sent to bad debt instead? Verify patient demographic data quality: incorrect addresses/phone numbers prevent contact. Implement pre-bad-debt review: every account reviewed for appeal, resubmission, or financial assistance eligibility before bad debt transfer. |
| **Revenue Impact if Unaddressed** | Each 1% increase in bad debt conversion on $3M patient AR = $30K/month in additional write-offs. Bad debt also increases cost-to-collect (agency fees typically 25-40% of recovered amount). |
| **Connected Root Cause(s)** | A1.07 Patient bad debt, A2.05 Payment plan defaults, B6.13 Collections not targeting high-propensity |
| **Connected Metric(s)** | R17 Bad Debt, A15 Patient Payment Rate, A16 Self-Pay Conversion Rate |

---

### AC-07: Payment Plan Default Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Patient Payment Plan Default Pattern |
| **What It Detects** | Patients on payment plans who have missed installments, indicating the payment plan terms may be unaffordable or the payment method has failed |
| **Detection Methodology** | Track payment plan adherence: payments_received / payments_scheduled. Fire if default rate (missed payment / total scheduled) exceeds 20% across all plans. For individual plans: flag after 2 consecutive missed payments. Group defaults by plan amount tier — if high-amount plans default more, terms are too aggressive. |
| **Severity** | **Critical** if default rate >30%; **Warning** if >20%; **Info** if >15% or increasing |
| **Recommended Action** | For individual defaults: automated outreach within 48 hours of missed payment. Offer plan restructuring (lower monthly amount, extended term). Update payment method if card declined. For systematic defaults: review plan term-setting process — are monthly amounts calibrated to patient income/ability to pay? Consider implementing income-based plan amounts. For chronic defaulters: evaluate for financial assistance eligibility before sending to collections. |
| **Revenue Impact if Unaddressed** | Payment plans typically represent $500K-$2M in patient AR. A 30% default rate = $150K-$600K at risk, with significant portion converting to bad debt. |
| **Connected Root Cause(s)** | A2.05 Payment plan defaults, A1.07 Patient bad debt |
| **Connected Metric(s)** | A12 Promise-to-Pay Rate, A13 Promise-to-Pay Kept Rate |

---

### AC-08: Days in AR Trend Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Days in AR (DAR) Trend Deviation |
| **What It Detects** | Overall Days in AR increasing, indicating the revenue cycle is slowing and cash conversion is deteriorating |
| **Detection Methodology** | Calculate DAR = Total AR / Average daily net revenue. Compare to trailing 12-month average and industry benchmark (target: 30-40 days for hospitals, 25-35 for physician groups). Fire if DAR increases >3 days month-over-month or exceeds benchmark by >10 days. Decompose by payer to identify which payers are driving DAR increase. |
| **Severity** | **Critical** if DAR >50 days (hospital) or >45 days (physician); **Warning** if >40 or increasing >5 days; **Info** if >35 or upward trend |
| **Recommended Action** | Identify the DAR driver: (1) Is it new AR (claims not being submitted fast enough)? Address claim lag. (2) Is it mid-cycle AR (claims pending with payers)? Contact payers for status. (3) Is it old AR (claims not being followed up)? Strengthen AR follow-up. Calculate DAR by payer — the payer with the largest DAR contribution is the intervention target. Implement payer-specific AR reduction plan. |
| **Revenue Impact if Unaddressed** | Each day of DAR increase on $100M annual revenue = approximately $274K in additional working capital required. A 10-day increase = $2.74M in cash tied up. |
| **Connected Root Cause(s)** | A2.03 AR aging acceleration, A2.01 ADTP increase |
| **Connected Metric(s)** | A05 Days in AR, A01 Total AR Outstanding, A03 AR by Payer |

---

### AC-09: Payer AR Concentration Risk

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | AR Concentration by Payer |
| **What It Detects** | A disproportionate share of total AR is concentrated in a small number of payers, creating cash flow concentration risk |
| **Detection Methodology** | Calculate each payer's share of total AR vs their share of total charges. Fire if any payer's AR share exceeds their charge share by >50% (meaning AR is building faster than charges for that payer). Also fire if top 3 payers account for >60% of total AR. |
| **Severity** | **Critical** if any payer's AR share is >2x charge share; **Warning** if >1.5x; **Info** if any payer AR growing disproportionately |
| **Recommended Action** | For payers with disproportionate AR: (1) Check ADTP — is the payer simply slow? (2) Check denial rate — are denials accumulating without resolution? (3) Check follow-up activity — are we working this payer's AR? (4) If payer is slow: escalate to payer and adjust cash forecast. (5) If denials accumulating: deploy dedicated denial team for this payer. Diversify payer mix where strategically possible to reduce concentration risk. |
| **Revenue Impact if Unaddressed** | Payer AR concentration creates a single point of failure. If a payer representing 40% of AR slows payment by 15 days, it impacts overall DAR by 6 days and delays $400K+ in cash. |
| **Connected Root Cause(s)** | A2.01 ADTP increase, B2.10 Payer financial stress |
| **Connected Metric(s)** | A03 AR by Payer, A05 Days in AR |

---

### AC-10: Self-Pay AR Aging Escalation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Self-Pay AR Aging Escalation |
| **What It Detects** | Patient self-pay balances aging faster than collection efforts can address, indicating either insufficient patient outreach or patient inability to pay |
| **Detection Methodology** | Track self-pay AR by aging bucket separately from payer AR. Calculate self-pay collection velocity = self-pay collections / self-pay AR beginning of period. Fire if self-pay AR >90 days exceeds 40% of total self-pay AR or if velocity declines >10%. |
| **Severity** | **Critical** if self-pay AR >90 days exceeds 50%; **Warning** if >40%; **Info** if >30% or growing |
| **Recommended Action** | Segment self-pay AR by source: (1) True self-pay (no insurance) — financial assistance screening, payment plan, charity. (2) Patient responsibility after insurance (copay, deductible, coinsurance) — statement cycle, digital outreach, payment portal. (3) Denied claims converted to patient responsibility — verify denial was appropriate before billing patient. For aging self-pay: accelerate agency placement timing for accounts with low propensity scores. Implement text-to-pay and online payment options. |
| **Revenue Impact if Unaddressed** | Self-pay AR >120 days has <20% collection probability. If $500K in self-pay AR ages past 120 days, expected recovery drops from $200K (at 0-30 days) to $100K — a $100K deterioration. |
| **Connected Root Cause(s)** | A1.07 Patient bad debt, B6.13 Collections not targeting high-propensity |
| **Connected Metric(s)** | A15 Patient Payment Rate, A16 Self-Pay Conversion Rate, A17 Average Patient Balance |

---

### AC-11: Small Balance Write-Off Accumulation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Small Balance Write-Off Aggregate Impact |
| **What It Detects** | Small individual claim balances (<$50) being written off as "too small to pursue" but aggregating to a material total when viewed across all claims |
| **Detection Methodology** | Calculate total small-balance write-offs by payer and by CARC. Fire if aggregate small-balance write-offs exceed $25K/month. Also detect: are small balances actually contract underpayments being incorrectly written off instead of disputed? Compare small-balance patterns to contract rates. |
| **Severity** | **Critical** if small-balance write-offs >$50K/month; **Warning** if >$25K; **Info** if >$10K or trending upward |
| **Recommended Action** | Review small-balance write-off policy: (1) Are these true small balances (patient copay/coinsurance) or underpayments disguised as small balances? (2) If underpayments: aggregate by payer and file bulk dispute. (3) If patient balances: implement automated patient balance billing for all balances >$5 via digital statements (near-zero marginal cost). (4) Set small-balance threshold based on actual cost-to-collect analysis. Many organizations set thresholds too high and write off recoverable revenue. |
| **Revenue Impact if Unaddressed** | $50K/month in small-balance write-offs = $600K/year. If 30% are actually recoverable (underpayments or collectible patient balances), $180K/year is forfeited. |
| **Connected Root Cause(s)** | A1.02 Silent underpayment, A1.07 Patient bad debt |
| **Connected Metric(s)** | R16 Write-off Amount, P10 Underpayment Amount |

---

### AC-12: Credit Balance Accumulation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Credit Balance Accumulation and Refund Risk |
| **What It Detects** | Patient or payer credit balances accumulating on accounts — overpayments that need to be refunded, creating compliance liability if not addressed timely |
| **Detection Methodology** | Track total credit balances by age and by source (patient overpayment, payer overpayment, duplicate payment). Fire if total credit balances >$100K or if any credit balance ages >60 days without resolution. Many states require refund of patient overpayments within 30-60 days. |
| **Severity** | **Critical** if credit balances >$200K or any >90 days old; **Warning** if >$100K or >60 days; **Info** if >$50K |
| **Recommended Action** | For patient credit balances: refund within state-required timeframe (typically 30-60 days). For payer credit balances: verify overpayment before refunding (ensure it is not a legitimate secondary payment or balance due). Implement automated credit balance detection and refund processing. Track credit balance aging with same rigor as AR aging. Regulatory compliance: most states and CMS require timely refund of overpayments. |
| **Revenue Impact if Unaddressed** | Credit balances are a liability, not revenue — but failure to refund creates regulatory and legal exposure. CMS requires Medicare overpayments to be refunded within 60 days of identification or face False Claims Act liability. State AG actions for patient overpayment hoarding carry penalties. |
| **Connected Root Cause(s)** | B2.08 Payer system errors, B3.11 Duplicate claim |
| **Connected Metric(s)** | P08 Unapplied Payments, B12 Overpayment Total $ |

---

## 5. CLAIMS PIPELINE DIAGNOSTICS

### CP-01: Pre-Submission Risk Concentration

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Pre-Submission Risk Concentration |
| **What It Detects** | An abnormally high percentage of claims in the pre-submission pipeline have high CRS (Claim Risk Scores), indicating systemic quality issues that will result in denials if submitted |
| **Detection Methodology** | Calculate percentage of pipeline with CRS >= 7 (high risk). Fire if >15% of pending claims are high-risk. Also calculate: total dollar value of high-risk claims. Compare to trailing 30-day average. Decompose high-risk claims by CRS component (eligibility, auth, coding, COB, documentation) to identify the dominant risk factor. |
| **Severity** | **Critical** if >25% of pipeline is high-risk or high-risk claims >$500K; **Warning** if >15% or >$200K; **Info** if >10% or trending upward |
| **Recommended Action** | Hold high-risk claims from submission. Route to manual review queue sorted by CRS score (highest first). Address each CRS component: (1) Eligibility risk: re-verify coverage before submission. (2) Auth risk: verify auth status. (3) Coding risk: coding review. (4) Documentation risk: CDI review. Target: reduce pipeline risk concentration to <10% before batch submission. This prevents denials rather than fixing them after the fact. |
| **Revenue Impact if Unaddressed** | High-risk claims (CRS >= 7) have a 40-60% denial probability. If $500K in high-risk claims is submitted without intervention, $200K-$300K will be denied, of which 40% ($80K-$120K) will be permanently lost. |
| **Connected Root Cause(s)** | B1.02 Coding quality, B1.03 Eligibility failure, B1.04 Auth breakdown |
| **Connected Metric(s)** | C11 Average CRS Score, C12 CRS Distribution, C15 High-Risk Claims Volume |

---

### CP-02: Clean Claim Rate Degradation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Clean Claim Rate Degradation |
| **What It Detects** | The percentage of claims passing all pre-submission edits (scrubber, NCCI, payer-specific rules) is declining, indicating upstream quality problems |
| **Detection Methodology** | Calculate clean claim rate = claims passing all edits / total claims submitted. Compare to trailing 90-day average. Fire if rate drops >2 percentage points. Decompose by edit type: which edits are failing more? Also calculate by coder, by department, by payer to localize the problem. |
| **Severity** | **Critical** if clean claim rate <90%; **Warning** if <93% or declining >2 points; **Info** if <95% or declining trend |
| **Recommended Action** | Identify the top 5 failing edits. For each: (1) Is the edit rule correct and current? (2) Is the failure a data quality issue or a coding issue? (3) Can the edit be enforced earlier in the workflow (at coding rather than at submission)? Update claim scrubber rules. Provide coder-specific feedback on failing edits. If a single department or coder is driving the decline, deploy targeted training. |
| **Revenue Impact if Unaddressed** | Each 1% decline in clean claim rate adds rework time (avg 15 min/claim) and delays submission. On 5,000 claims/month, 1% = 50 claims x 15 min = 12.5 FTE hours/month. Delayed submission increases timely filing risk. |
| **Connected Root Cause(s)** | B1.02 Coding quality decline, B6.05 Payer rules stale |
| **Connected Metric(s)** | C07 Clean Claim Rate, C06 First Pass Rate, C13 CRS Pass Rate |

---

### CP-03: Rejection Pattern Analysis

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Clearinghouse vs Payer Rejection Pattern |
| **What It Detects** | Claims rejected at the clearinghouse level (277CA rejections) vs at the payer level, and patterns within each — different rejection points require different fixes |
| **Detection Methodology** | Categorize rejections by point of failure: clearinghouse (format, connectivity, enrollment) vs payer (data validation, eligibility, auth). Calculate rejection rate at each point. Fire if total rejection rate >3% or if either clearinghouse or payer rejection rate increases >1 percentage point. Identify top rejection codes at each level. |
| **Severity** | **Critical** if rejection rate >5%; **Warning** if >3% or increasing; **Info** if >2% |
| **Recommended Action** | For clearinghouse rejections: (1) Format errors: fix 837 mapping. (2) Connectivity: escalate to clearinghouse vendor. (3) Enrollment: verify payer enrollment at clearinghouse. Target: resubmit within 24 hours. For payer rejections: (1) Data validation: fix demographics, NPI, TIN. (2) Eligibility: re-verify and correct. (3) Auth: add auth number. Track rejection-to-resubmission turnaround time — target same day. |
| **Revenue Impact if Unaddressed** | Rejections delay payment by the rejection-correction-resubmission cycle (avg 7-14 days). If 5% of claims are rejected, 5% of revenue is delayed 7-14 days. More critically, some rejections lead to timely filing write-offs if not corrected promptly. |
| **Connected Root Cause(s)** | B1.08 Clearinghouse/EDI errors, B6.07 Registration errors |
| **Connected Metric(s)** | C08 Claim Rejection Rate, C10 Claim Resubmission Rate |

---

### CP-04: Timely Filing Risk — Claims Approaching Deadline

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Timely Filing Deadline Risk |
| **What It Detects** | Claims approaching their payer-specific filing deadline without having been submitted or with pending denials that need resubmission |
| **Detection Methodology** | For each open claim, calculate days_remaining = payer_filing_deadline - today. Fire if days_remaining < 30 AND claim status is not submitted. Also fire if claim was denied and needs resubmission with days_remaining < 30. Tier by urgency: <7 days (emergency), 7-14 days (urgent), 14-30 days (at risk). |
| **Severity** | **Critical** if any claim <7 days to deadline; **Warning** if <14 days; **Info** if <30 days |
| **Recommended Action** | Emergency (<7 days): Submit immediately, even if imperfect — a denied claim can be appealed, an unfiled claim cannot. Urgent (7-14 days): Prioritize coding/scrubbing for these claims above all others. At risk (14-30 days): Add to priority work queue with daily monitoring. Prevention: Implement internal filing deadline = payer deadline minus 14 days. Add countdown timer to work queue display. |
| **Revenue Impact if Unaddressed** | Timely filing write-offs are 100% permanent losses — there is no appeal or recovery path. Each timely filing write-off at average claim value of $1,500 is $1,500 permanently lost. |
| **Connected Root Cause(s)** | A1.03 Timely filing write-offs, B3.12 Timely filing exceeded, B6.04 Coding backlog |
| **Connected Metric(s)** | O08 Timely Filing Risk Claims, O09 Timely Filing Violations, C05 Claim Lag Days |

---

### CP-05: Duplicate Claim Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Duplicate Claim Submission Detection |
| **What It Detects** | Claims submitted more than once for the same patient, same date of service, same procedure — resulting in CO-18 denials, wasted rework, and potential compliance risk |
| **Detection Methodology** | Match claims on: patient_id + date_of_service + cpt_code + rendering_provider. Flag exact matches. Also flag near-duplicates: same patient + same DOS + different CPT (possible unbundling issue vs legitimate multiple procedures). Calculate duplicate rate = duplicate submissions / total submissions. Fire if rate >2%. |
| **Severity** | **Critical** if duplicate rate >5% or compliance risk identified; **Warning** if >3%; **Info** if >2% |
| **Recommended Action** | Implement pre-submission duplicate detection in claim scrubber. For detected duplicates: void the duplicate before submission. If already submitted: void and monitor for payer processing. Investigate root cause: Is it a system issue (auto-resubmission without checks)? User error (manual rebilling)? Workflow issue (claim corrections creating new claims instead of replacing)? If compliance concern: self-audit for patterns that could appear fraudulent. |
| **Revenue Impact if Unaddressed** | Duplicate denials waste an average of 20 minutes of rework per claim. At $30/hour, 100 duplicates/month = $1,000/month in direct labor cost plus denial management overhead. Compliance risk if pattern appears intentional. |
| **Connected Root Cause(s)** | B3.11 Duplicate claim |
| **Connected Metric(s)** | C10 Claim Resubmission Rate, D09 Denials by Category |

---

### CP-06: Missing Information Pattern Analysis

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Missing Information Pattern on Claims |
| **What It Detects** | Systematic patterns of missing data elements on claims — specific fields that are consistently blank or invalid, causing rejections or denials |
| **Detection Methodology** | Analyze claim rejections and denials for missing/invalid data. Categorize by missing element: demographics (DOB, gender, member ID), clinical (DX codes, POS, referring NPI), financial (auth number, group number, subscriber ID). Calculate frequency of each missing element. Fire if any single missing element accounts for >5% of rejections or >20 claims/month. |
| **Severity** | **Critical** if missing data causing >$50K/month in denials; **Warning** if >$20K; **Info** if any systematic pattern detected |
| **Recommended Action** | For each identified missing element: (1) Trace where in the workflow it should be captured. (2) Determine why it is missing: system issue (field not mapped)? Process issue (step being skipped)? Data issue (source system incomplete)? (3) Implement validation rule at point of entry. (4) Add hard stop in billing system requiring the field before claim generation. Map missing elements to upstream processes for permanent fix. |
| **Revenue Impact if Unaddressed** | Missing information denials are nearly 100% preventable. If 200 claims/month are denied for missing info at $1,200 avg, that is $240K/month in delayed or lost revenue, of which 90%+ is recoverable but at significant rework cost. |
| **Connected Root Cause(s)** | B3.22 Missing/invalid demographics, B6.07 Registration errors |
| **Connected Metric(s)** | C08 Claim Rejection Rate, C07 Clean Claim Rate |

---

### CP-07: Claim Submission Lag Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Submission Lag Anomaly |
| **What It Detects** | The time between date of service and claim submission is increasing, indicating bottlenecks in charge capture, coding, or billing workflow |
| **Detection Methodology** | Calculate claim lag = submission_date - date_of_service. Compare to trailing 90-day average by department and claim type. Fire if average lag increases >3 days or if lag exceeds 14 days for any claim type. Decompose lag by stage: charge capture time, coding time, scrubbing time, submission time. |
| **Severity** | **Critical** if average lag >21 days; **Warning** if >14 days or increasing >3 days; **Info** if >7 days |
| **Recommended Action** | Identify the bottleneck stage. If charge capture: address with department managers. If coding: evaluate coding staffing and workload distribution. If scrubbing: check for scrubber rule issues creating excessive holds. If submission: check clearinghouse connectivity. Set targets: charge capture within 24 hours, coding within 3 business days, submission within 5 business days of DOS. |
| **Revenue Impact if Unaddressed** | Each day of submission lag delays payment by 1 day. On $5M monthly charges, each day of lag = $167K in delayed cash. Also increases timely filing risk for all claims. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B6.08 Charge capture gaps |
| **Connected Metric(s)** | C05 Claim Lag Days, C24 Pipeline Dwell Time, CD04 Average Coding Turnaround |

---

### CP-08: Claim Scrubber Effectiveness Audit

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Scrubber Effectiveness |
| **What It Detects** | Denials for issues that the claim scrubber should have caught — indicating scrubber rules are missing, outdated, or not being enforced |
| **Detection Methodology** | For each denial, evaluate: could this have been caught pre-submission by a scrubber rule? Categorize denials as "scrubber-preventable" vs "not scrubber-preventable." Calculate scrubber miss rate = scrubber-preventable denials / total denials. Fire if scrubber miss rate >30%. Identify specific missing rules. |
| **Severity** | **Critical** if scrubber miss rate >40%; **Warning** if >30%; **Info** if >20% |
| **Recommended Action** | Build scrubber rules for every scrubber-preventable denial pattern. Prioritize by denial volume and dollar impact. For each rule: (1) Define the condition (CPT + payer + modifier + POS logic). (2) Define the action (hold for review, auto-correct, or flag). (3) Test against historical claims. (4) Deploy and monitor false positive rate. Target: reduce scrubber-preventable denials by 80% within 90 days. |
| **Revenue Impact if Unaddressed** | If scrubber-preventable denials = 30% of total denials, and total denials = $500K/month, then $150K/month in denials could have been prevented with better scrubber rules. |
| **Connected Root Cause(s)** | B6.05 Payer rules stale, B1.02 Coding quality decline |
| **Connected Metric(s)** | C07 Clean Claim Rate, C06 First Pass Rate, C13 CRS Pass Rate |

---

### CP-09: Claim Drop-Off Between Pipeline Stages

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Pipeline Stage Drop-Off Rate Anomaly |
| **What It Detects** | An abnormal number of claims disappearing or stalling between pipeline stages — claims that enter one stage but never progress to the next |
| **Detection Methodology** | Calculate drop-off rate between each consecutive stage pair (Charge Captured > Coded > Scrubbed > Submitted > Adjudicated > Posted > Reconciled). Fire if drop-off rate exceeds 5% between any stage pair or increases >2 percentage points from baseline. Investigate: are claims truly lost, or are they stuck in a hold status? |
| **Severity** | **Critical** if drop-off >10% at any stage; **Warning** if >5%; **Info** if >3% or increasing |
| **Recommended Action** | For each stage with high drop-off: (1) Charge to Coded: encounters not reaching coding — check charge capture workflow. (2) Coded to Scrubbed: coding errors causing scrubber holds — review hold reasons. (3) Scrubbed to Submitted: submission failures — check clearinghouse. (4) Submitted to Adjudicated: claims lost in payer processing — check 277CA status. (5) Adjudicated to Posted: ERA not being processed — check posting workflow. Implement daily pipeline reconciliation to catch drop-offs within 24 hours. |
| **Revenue Impact if Unaddressed** | Each claim that drops off the pipeline is delayed revenue. If 3% of 5,000 monthly claims drop off at $1,500 avg, $225K/month is stalled in the pipeline. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B1.08 EDI errors, B6.10 Payment posting delay |
| **Connected Metric(s)** | C23 Stage Drop-off Rate, C16-C22 Stage Metrics |

---

### CP-10: Clearinghouse Enrollment Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Clearinghouse Payer Enrollment Gap |
| **What It Detects** | Claims being rejected because the organization is not enrolled with the payer through the clearinghouse — a setup issue, not a claim content issue |
| **Detection Methodology** | Filter 277CA rejections with enrollment-related rejection codes. Track by payer. Fire if enrollment rejections appear for any payer where claims were previously accepted. Also detect new payers where enrollment was never set up. Calculate rejection rate by payer for enrollment-specific codes. |
| **Severity** | **Critical** if enrollment gap affects a top-10 payer or >100 claims; **Warning** if >25 claims; **Info** if any enrollment rejection detected |
| **Recommended Action** | Contact clearinghouse to initiate payer enrollment. Typical enrollment takes 5-15 business days. In the interim: submit claims directly through payer portal if available. If enrollment was previously active and is now rejected: verify that TIN/NPI changes, clearinghouse migrations, or payer system changes have not disrupted enrollment. Maintain a payer enrollment status dashboard. |
| **Revenue Impact if Unaddressed** | Enrollment gaps prevent all claims for that payer from being submitted electronically, adding 2-4 weeks of delay. If 200 claims are affected at $1,500 avg, $300K in revenue is delayed until enrollment is resolved. |
| **Connected Root Cause(s)** | B1.08 Clearinghouse/EDI errors, B1.09 Contract expiration |
| **Connected Metric(s)** | C08 Claim Rejection Rate, C04 Claims by Submission Method |

---

### CP-11: Suspended Claim Accumulation

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Suspended/Held Claim Accumulation |
| **What It Detects** | Claims in a suspended or held status that are accumulating without resolution — neither submitted nor corrected, sitting in limbo |
| **Detection Methodology** | Count claims in hold/suspended status by duration. Fire if >5% of total claim volume is in suspended status or if any claim has been suspended >14 days. Categorize by hold reason: coding query, missing auth, eligibility issue, scrubber fail, manual review required. |
| **Severity** | **Critical** if suspended claims >$500K in charges or >500 claims; **Warning** if >$200K or >200 claims; **Info** if >100 claims or growing |
| **Recommended Action** | Triage suspended claims daily. For each: (1) Is the hold reason still valid? If resolved, release. (2) Does it need manual intervention? Assign to appropriate team. (3) Is it approaching timely filing? Escalate to urgent. Implement a daily suspended claim report with aging. Set SLA: no claim suspended >7 days without action. Auto-escalate at 10 days. Consider whether hold rules are too aggressive (high false positive rate). |
| **Revenue Impact if Unaddressed** | Every day a claim is suspended delays revenue by one day. $500K in suspended claims ages out of optimal filing windows. If any cross timely filing deadlines, revenue is permanently lost. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B1.04 Prior auth breakdown |
| **Connected Metric(s)** | C09 Pending Claims Count, C24 Pipeline Dwell Time |

---

### CP-12: EDI 277CA Status Monitoring Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Acknowledgment Status Monitoring |
| **What It Detects** | Claims submitted to payers that have not received a 277CA acknowledgment within expected timeframes — claims that may have been lost in transit |
| **Detection Methodology** | Track 277CA receipt for every submitted claim. Fire if any claim has no 277CA response within 5 business days of submission. Aggregate by payer and clearinghouse. If multiple claims to the same payer have no acknowledgment, payer may have a processing issue. |
| **Severity** | **Critical** if >100 claims without 277CA acknowledgment for >7 days; **Warning** if >50 or >5 days; **Info** if any unacknowledged claims |
| **Recommended Action** | For unacknowledged claims: (1) Check clearinghouse transmission log — was the claim successfully transmitted? (2) If transmitted: contact payer to confirm receipt. (3) If not transmitted: resubmit. (4) If payer has no record: resubmit with proof of original transmission for timely filing protection. Implement daily 277CA reconciliation: every submitted claim must have a corresponding 277CA. |
| **Revenue Impact if Unaddressed** | Lost-in-transit claims are not discovered until timely filing approaches. If 100 claims at $1,500 avg are lost without detection for 60 days, $150K is at risk, with some potentially crossing filing deadlines. |
| **Connected Root Cause(s)** | B1.08 Clearinghouse/EDI errors |
| **Connected Metric(s)** | C08 Claim Rejection Rate, C04 Claims by Submission Method |

---

### CP-13: Multi-Line Claim Edit Failure

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Multi-Line Claim Component Interaction Errors |
| **What It Detects** | Claims with multiple line items where the interaction between lines causes denials — bundling, duplicate line, or mutually exclusive procedure edits |
| **Detection Methodology** | For multi-line claims (>3 line items), calculate denial rate vs single-line claims. If multi-line denial rate exceeds single-line by >5 percentage points, investigate. Identify specific line-item interactions causing denials: NCCI edits between lines, MUE (Medically Unlikely Edit) violations, or modifier requirements for multiple procedures. |
| **Severity** | **Critical** if multi-line claim denial rate >20%; **Warning** if >15% or >5 points above single-line; **Info** if any systematic interaction pattern |
| **Recommended Action** | Enhance claim scrubber to validate line-item interactions: (1) NCCI column 1/column 2 edits between all line pairs. (2) MUE units per line item. (3) Modifier requirements (59, XE/XS/XP/XU) for distinct procedures. (4) Multiple procedure payment reduction (MPPR) rules. (5) Bilateral procedure rules. For surgical claims: implement operative report review to validate distinct procedures. |
| **Revenue Impact if Unaddressed** | Multi-line claims are typically higher dollar value ($2K-$10K). A 5% excess denial rate on 300 multi-line claims/month at $5K avg = $75K/month. |
| **Connected Root Cause(s)** | B3.15 Unbundling edit failure, B3.02 Incorrect modifier |
| **Connected Metric(s)** | C07 Clean Claim Rate, CD07 Modifier Usage Rate |

---

## 6. CODING & DOCUMENTATION DIAGNOSTICS

### CD-01: Coding Accuracy by Coder

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Coder-Level Accuracy Tracking |
| **What It Detects** | Individual coders whose error rates exceed acceptable thresholds — enabling targeted coaching rather than broad retraining |
| **Detection Methodology** | Calculate denial rate attributable to coding errors (CARC CO-4, CO-6, CO-16, CO-97, CO-181) by coder. Compare each coder to team average. Fire if any coder's coding-related denial rate exceeds team average by >2 standard deviations. Also track: error type distribution per coder (CPT selection, modifier, DX specificity, unbundling). |
| **Severity** | **Critical** if coder error rate >10%; **Warning** if >5% or >2 SD above average; **Info** if >3% |
| **Recommended Action** | For coders exceeding threshold: (1) Pull their top 10 denied claims for review. (2) Identify error pattern (is it always the same type of error?). (3) Provide 1:1 coaching focused on the specific error pattern. (4) Implement 30-day focused audit (100% review of their claims). (5) Recheck after 30 days. If no improvement, consider reassignment or additional formal training. Do NOT broad-retrain the entire team — target the specific coders with specific error patterns. |
| **Revenue Impact if Unaddressed** | A single coder processing 200 claims/month with a 10% error rate = 20 coding denials/month at $1,200 avg = $24K/month from one coder. |
| **Connected Root Cause(s)** | B1.02 Coding team quality decline, B3.01 Incorrect CPT, B3.02 Incorrect modifier |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, CD02 Coding Error Rate by Type, CD03 Coding Error Rate by Coder |

---

### CD-02: Under-Coding Detection (Revenue Left on Table)

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Under-Coding Revenue Leakage |
| **What It Detects** | Services coded at lower levels than the documentation supports — revenue that was earned and documented but not captured because of conservative coding |
| **Detection Methodology** | Compare E&M level distribution to national benchmarks by specialty. Flag if Level 3 (99213/99214) exceeds 60% of E&M mix (typical national average is 45-50%). Compare DRG assignment to clinical indicators: if clinical acuity suggests higher-weight DRG, flag potential under-coding. Calculate estimated revenue gap = (expected level distribution x rates) - (actual level distribution x rates). |
| **Severity** | **Critical** if estimated under-coding gap >$200K/year; **Warning** if >$100K; **Info** if E&M distribution skews >10% from benchmark |
| **Recommended Action** | CDI-driven review of under-coded claims. For E&M under-coding: (1) Are providers documenting at higher levels but coders coding conservatively? Train coders on 2021 E&M guidelines (medical decision-making based). (2) Are providers under-documenting? Physician education on documentation requirements. For DRG under-coding: (1) Are CC/MCC conditions present but not coded? CDI concurrent review focus on comorbidity capture. (2) Are procedures under-reported? Operative report review. |
| **Revenue Impact if Unaddressed** | Under-coding typically represents 2-5% of potential revenue. On $100M annual revenue, under-coding leaves $2M-$5M on the table. E&M under-coding alone can be $500K-$1.5M annually for a mid-size practice. |
| **Connected Root Cause(s)** | A1.05 Coding downcoding, B6.03 CDI query unanswered |
| **Connected Metric(s)** | R10 Case Mix Index, R19 Revenue per RVU, CD06 DRG Mismatch Rate |

---

### CD-03: Over-Coding Risk Assessment

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Over-Coding Compliance Risk |
| **What It Detects** | Services coded at higher levels than documentation supports — creating compliance risk, audit exposure, and potential False Claims Act liability |
| **Detection Methodology** | Compare E&M level distribution to specialty benchmarks. Flag if Level 4/5 (99215/99205) usage exceeds 75th percentile nationally for the specialty. Compare individual provider coding patterns to peers. Flag providers whose E&M distribution is >2 SD above specialty mean. Also monitor for OIG Work Plan targeted CPT codes. |
| **Severity** | **Critical** if over-coding pattern detected with compliance risk exposure; **Warning** if E&M distribution skews high for >3 consecutive months; **Info** if any provider exceeds 90th percentile for high-level E&M |
| **Recommended Action** | Conduct pre-billing audit on flagged providers: pull 20 random charts and compare documentation to coded level. If documentation supports the codes: no action needed (providers are simply sicker patients or better documenters). If documentation does NOT support: (1) Immediate provider education. (2) Prospective audit for 60 days. (3) Consider voluntary self-disclosure if pattern is systematic and historical. Engage compliance officer for risk assessment. |
| **Revenue Impact if Unaddressed** | Over-coding exposure is NOT a revenue gain — it is a liability. RAC/ZPIC audits can result in recoupment of 3 years of overpayments plus penalties. A $50K/month over-coding pattern = $1.8M in 3-year recoupment exposure, plus potential treble damages under False Claims Act. |
| **Connected Root Cause(s)** | B1.02 Coding quality decline (in the upward direction) |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, CD02 Coding Error Rate by Type, O12 Compliance Audit Findings |

---

### CD-04: Documentation Insufficiency by Physician

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Physician Documentation Insufficiency Pattern |
| **What It Detects** | Specific physicians whose documentation consistently fails to meet payer requirements, resulting in denials that are attributable to documentation quality rather than coding or billing |
| **Detection Methodology** | Filter denials with documentation-related CARC/RARC (CO-50, N347, N386, N657). Group by attending/rendering physician. Calculate documentation denial rate per physician. Compare to peer group (same specialty). Fire if physician's documentation denial rate exceeds peer average by >2x. Identify specific missing documentation elements per physician. |
| **Severity** | **Critical** if physician documentation denials >$30K/month; **Warning** if >$15K or >3x peer average; **Info** if >1.5x peer average |
| **Recommended Action** | Create physician-specific documentation gap report showing: (1) Which elements are missing (history of conservative treatment, functional impact scores, medical necessity rationale, risk stratification). (2) Which payers are denying (payer-specific documentation requirements). (3) Dollar impact per month. Schedule 1:1 education session with CDI specialist. Implement smart phrases / documentation templates targeting the physician's specific gaps. Deploy concurrent CDI review for this physician for 60 days. |
| **Revenue Impact if Unaddressed** | A high-volume physician generating $30K/month in documentation denials = $360K/year from one provider. Across 5 problematic physicians = $1.5M+ annually. |
| **Connected Root Cause(s)** | B3.05 Medical necessity not documented, B3.17 Documentation insufficient, B3.06 Missing risk score |
| **Connected Metric(s)** | D11 Denials by Provider/Physician, CD01 Coding Accuracy Rate |

---

### CD-05: CDI Opportunity Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | CDI Program Opportunity Detection |
| **What It Detects** | Areas where the CDI program is under-performing or missing opportunities — DRGs with high denial rates, low CC/MCC capture, or low query response rates |
| **Detection Methodology** | Calculate: (1) CDI query rate = queries issued / total discharges (target: 15-20%). (2) Query response rate = responses / queries (target: >90% within 48 hours). (3) Query agreement rate = physician agreeing with query / total queries. (4) CC/MCC capture rate = claims with CC/MCC / total inpatient claims. Fire if any metric is below target. Also identify DRGs where CDI review could improve reimbursement. |
| **Severity** | **Critical** if CDI query rate <10% or query response rate <70%; **Warning** if query rate <15% or response rate <80%; **Info** if any metric below target |
| **Recommended Action** | If query rate low: CDI team is not reviewing enough charts. Add CDI FTEs or implement technology-assisted CDI (NLP-based documentation review). If response rate low: implement physician escalation workflow (query > 24hr reminder > 48hr department chair escalation). If agreement rate low: CDI queries may be poorly worded or clinically inappropriate — CDI education needed. If CC/MCC capture low: target specific conditions (malnutrition, acute kidney injury, encephalopathy) known to be under-documented. |
| **Revenue Impact if Unaddressed** | CDI programs typically generate $1,500-$3,000 per query that results in DRG upgrade. If CDI is issuing 100 queries/month with 60% agreement rate and $2,000 avg impact, CDI generates $120K/month. Under-performing CDI leaves this on the table. |
| **Connected Root Cause(s)** | B1.05 CDI program weakness, B6.03 CDI query unanswered, A1.05 Coding downcoding |
| **Connected Metric(s)** | CD06 DRG Mismatch Rate, CD08 HCC Capture Rate, R10 Case Mix Index |

---

### CD-06: E&M Level Distribution Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | E&M Level Distribution Anomaly by Provider |
| **What It Detects** | Individual providers whose E&M coding level distribution deviates significantly from specialty norms — indicating either under-coding (conservative), over-coding (compliance risk), or documentation gaps |
| **Detection Methodology** | For each provider, calculate E&M level distribution (% Level 1-5 for new and established patients). Compare to national CMS data for that specialty. Calculate chi-square test statistic against expected distribution. Fire if p-value < 0.01 (distribution is statistically significantly different from expected). |
| **Severity** | **Critical** if provider distribution is statistically anomalous AND dollar impact >$50K/year; **Warning** if statistically anomalous; **Info** if trending away from benchmark |
| **Recommended Action** | Chart review of 20 random encounters for flagged providers. (1) If documentation supports actual codes: provider's patient population may genuinely differ — document rationale and monitor. (2) If under-coding: provider education on 2021 E&M documentation requirements (time-based vs MDM-based). (3) If over-coding: compliance audit and provider education. Track distribution monthly for flagged providers until normalized. |
| **Revenue Impact if Unaddressed** | Under-coding: each E&M level step = approximately $30-$80 per encounter. A provider with 500 encounters/month under-coded by one level = $15K-$40K/month. Over-coding: compliance liability as described in CD-03. |
| **Connected Root Cause(s)** | A1.05 Coding downcoding, B1.02 Coding quality decline |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, CD02 Coding Error Rate by Type, R19 Revenue per RVU |

---

### CD-07: HCC Capture Rate Deficiency

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | HCC (Hierarchical Condition Category) Capture Deficiency |
| **What It Detects** | Chronic conditions documented in clinical records but not captured as diagnosis codes on claims, resulting in lower risk adjustment scores and reduced Medicare Advantage/ACA reimbursement |
| **Detection Methodology** | Compare HCC conditions documented in EHR problem lists to diagnosis codes submitted on claims. Calculate HCC capture rate = HCC codes on claims / HCC conditions in clinical records. Fire if capture rate <85%. Identify specific HCC categories with lowest capture rates. Cross-reference with RAF score impact. |
| **Severity** | **Critical** if HCC capture rate <75%; **Warning** if <85%; **Info** if declining trend |
| **Recommended Action** | Implement HCC-focused coding review for Medicare Advantage and ACA marketplace patients. Deploy suspect condition lists to providers before annual wellness visits. Common under-captured HCCs: malnutrition (HCC 21), chronic kidney disease (HCC 138), major depression (HCC 59), diabetes with complications (HCC 18). CDI team to add HCC capture to concurrent review workflow. Provider education on annual revalidation of chronic conditions. |
| **Revenue Impact if Unaddressed** | Each HCC condition captured increases the patient's RAF score, which increases capitated payment. Average HCC capture increases revenue by $1,500-$3,000 per member per year. If 500 patients have missed HCC codes, that is $750K-$1.5M in annual risk-adjusted revenue. |
| **Connected Root Cause(s)** | A1.05 Coding downcoding, B1.05 CDI program weakness |
| **Connected Metric(s)** | CD08 HCC Capture Rate, R10 Case Mix Index |

---

### CD-08: Coding Backlog Impact Assessment

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Coding Backlog Revenue Delay |
| **What It Detects** | Uncoded encounters that are delaying claim submission, creating timely filing risk and cash flow delays |
| **Detection Methodology** | Count uncoded encounters by age (days since DOS). Calculate coding turnaround time. Fire if backlog >3 business days or if any encounter is uncoded >7 days. Cross-reference with payer timely filing deadlines: flag encounters where coding delay + expected billing time approaches filing deadline. |
| **Severity** | **Critical** if any encounters uncoded >14 days or approaching filing deadline; **Warning** if backlog >5 days; **Info** if >3 days |
| **Recommended Action** | Prioritize uncoded encounters by timely filing deadline (shortest deadline first, not oldest encounter first). If backlog is structural (consistent >3 days): evaluate coding staffing. Calculate claims per coder vs benchmark. If understaffed: hire or outsource. If productivity issue: investigate workflow bottlenecks (system access, documentation availability, query turnaround). If temporary spike: authorize overtime or temporary coding support. |
| **Revenue Impact if Unaddressed** | Coding backlog delays all downstream revenue. If 500 encounters are backlogged at $1,500 avg charges, $750K in potential revenue is delayed. Extended backlogs create timely filing risk for the entire backlog. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, A1.03 Timely filing write-offs |
| **Connected Metric(s)** | CD04 Average Coding Turnaround, CD05 Coding Backlog, C05 Claim Lag Days |

---

### CD-09: NCCI Edit Compliance Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | NCCI Edit Violation Pattern |
| **What It Detects** | Claims being denied for NCCI (National Correct Coding Initiative) edit violations — unbundling errors where component codes are billed separately from comprehensive codes |
| **Detection Methodology** | Filter denials with CARC CO-97 and CO-236 (bundling edits). Group by CPT pair (comprehensive + component). Calculate NCCI denial rate by CPT pair. Fire if any CPT pair has >10 NCCI denials/month or if total NCCI denials increase >20%. Cross-reference with quarterly CMS NCCI edit updates. |
| **Severity** | **Critical** if NCCI denials >$50K/month or compliance exposure; **Warning** if >$20K; **Info** if any NCCI edit pattern detected |
| **Recommended Action** | (1) Update claim scrubber with current NCCI edit table (quarterly CMS updates). (2) For each denied CPT pair: determine if the services were truly separate and distinct (modifier 59/X-modifier appropriate) or if unbundling was incorrect. (3) If modifier appropriate: resubmit with correct modifier and documentation supporting separate service. (4) If unbundling was incorrect: educate coder. (5) Add NCCI edit check to pre-submission workflow. NCCI violations can trigger OIG scrutiny — treat as compliance priority. |
| **Revenue Impact if Unaddressed** | NCCI denials are typically $25K-$100K/month for mid-size organizations. More critically, systematic NCCI violations can trigger RAC audits and compliance investigations. |
| **Connected Root Cause(s)** | B3.15 Unbundling edit failure, B1.10 Regulatory change |
| **Connected Metric(s)** | D07 Denials by CARC Code (CO-97), CD01 Coding Accuracy Rate |

---

### CD-10: Diagnosis Code Specificity Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | ICD-10 Specificity Deficiency |
| **What It Detects** | Claims coded with non-specific ICD-10 codes (truncated codes, unspecified laterality, unspecified type) when more specific codes are available and clinically indicated |
| **Detection Methodology** | Analyze ICD-10 codes on submitted claims. Flag codes ending in unspecified digits when the clinical documentation contains specificity information. Calculate specificity rate = claims with highest-specificity ICD-10 / total claims. Fire if specificity rate <90%. Track by coder and by ICD-10 chapter. |
| **Severity** | **Critical** if specificity rate <80% or causing >$30K/month in denials; **Warning** if <85%; **Info** if <90% |
| **Recommended Action** | Train coders on ICD-10 specificity requirements, focusing on: (1) Laterality (left/right/bilateral). (2) Type specification (Type 1 vs Type 2 diabetes). (3) Episode of care (initial, subsequent, sequela). (4) Severity/stage. Common offenders: unspecified diabetes (E11.9 vs specific manifestation codes), unspecified pneumonia (J18.9 vs organism-specific), unspecified fracture site. Many payers now deny for insufficient specificity. |
| **Revenue Impact if Unaddressed** | Specificity-related denials are typically $15K-$50K/month. Additionally, non-specific codes result in lower DRG weights for inpatient claims, compounding with CMI erosion (see RH-03). |
| **Connected Root Cause(s)** | B3.04 Diagnosis code specificity insufficient, B1.02 Coding quality decline |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, D07 Denials by CARC Code (CO-4, CO-16) |

---

### CD-11: Coding Consistency Across Coders

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Inter-Coder Consistency Variance |
| **What It Detects** | Significant variance in how different coders code the same types of encounters — indicating lack of coding standardization and potential accuracy issues |
| **Detection Methodology** | For the same encounter type (same CPT family, same department, same provider), compare coding outcomes across coders. Calculate inter-coder agreement rate for: E&M level, modifier usage, DX code selection, DRG assignment. Fire if agreement rate <80% for any encounter type or if any coder's outcomes differ from consensus by >15%. |
| **Severity** | **Critical** if inter-coder agreement <70%; **Warning** if <80%; **Info** if <85% |
| **Recommended Action** | Conduct inter-coder reliability audits: have 3 coders code the same 20 charts, compare results. Identify specific areas of disagreement. Develop coding guidelines and decision trees for areas with low consistency. Hold monthly coding consensus meetings for complex cases. If one coder is an outlier: compare their outcomes to denial rates — if their patients have lower denial rates, they may be the accurate one. |
| **Revenue Impact if Unaddressed** | Inconsistent coding creates unpredictable denial patterns and prevents effective scrubber rule development. Revenue impact is indirect but compounds: estimated $50K-$150K/year in denial variability attributable to coding inconsistency. |
| **Connected Root Cause(s)** | B1.02 Coding quality decline |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, CD03 Coding Error Rate by Coder |

---

### CD-12: Procedure-to-Diagnosis Mismatch

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Procedure-Diagnosis Linkage Error |
| **What It Detects** | Claims where the CPT procedure code is not supported by the submitted diagnosis codes — a medical necessity and coding accuracy issue |
| **Detection Methodology** | For each claim, evaluate CPT-to-ICD-10 linkage against LCD/NCD coverage determinations and payer-specific diagnosis-procedure matrices. Flag claims where the primary diagnosis does not support the procedure. Calculate mismatch rate by CPT family. Fire if mismatch rate >5% for any CPT family. |
| **Severity** | **Critical** if mismatch rate >10% for high-volume CPTs; **Warning** if >5%; **Info** if any systematic mismatch pattern |
| **Recommended Action** | Build CPT-to-ICD-10 mapping reference for high-volume procedures. Implement scrubber rule: validate diagnosis supports procedure before submission. Common issues: (1) Screening diagnosis used when diagnostic diagnosis was documented. (2) Symptom code used when definitive diagnosis is available. (3) Laterality mismatch between DX and CPT. Train coders on medical necessity diagnosis selection. |
| **Revenue Impact if Unaddressed** | Procedure-diagnosis mismatches result in medical necessity denials (CO-50). Mismatch rate of 5% on 2,000 procedure claims/month at $1,000 avg = $100K/month in denials. |
| **Connected Root Cause(s)** | B3.01 Incorrect CPT, B3.05 Medical necessity |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, D07 Denials by CARC Code (CO-50) |

---

## 7. PAYER RELATIONSHIP DIAGNOSTICS

### PR-01: Payer Contract Compliance Score

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Contract Compliance Scorecard |
| **What It Detects** | Overall compliance of each payer with their contracted terms — encompassing payment rates, timely payment, denial rates, and administrative burden |
| **Detection Methodology** | Calculate composite score for each payer: (1) Rate compliance = % claims paid at contracted rate. (2) Timely payment = % claims paid within ADTP benchmark. (3) Denial rate = compared to contract-implied denial rate. (4) Administrative burden = appeals required, reconsiderations, phone calls per claim. Score each 0-100 and weight equally. Fire if composite score <70 for any payer. |
| **Severity** | **Critical** if composite score <60 for a top-10 payer; **Warning** if <70; **Info** if declining >10 points quarter-over-quarter |
| **Recommended Action** | For low-scoring payers: (1) Prepare payer performance report with specific metrics. (2) Schedule Joint Operating Committee (JOC) meeting with payer. (3) Present data-driven case for process improvements. (4) Negotiate contract amendments for problem areas. (5) If payer is non-responsive: evaluate network participation (is the contract worth maintaining?). Use compliance score trend in contract renegotiation as leverage. |
| **Revenue Impact if Unaddressed** | A payer with a compliance score of 60 (vs target 90) is likely costing the organization 3-5% of that payer's revenue in underpayments, delayed payments, and excess denials. For a $2M/month payer, that is $60K-$100K/month. |
| **Connected Root Cause(s)** | B2.01-B2.10 (all payer-level root causes), A1.08 Contract rate erosion |
| **Connected Metric(s)** | B08 Contract Compliance Rate, P12 ADTP by Payer, D10 Denials by Payer |

---

### PR-02: Payer Behavior Deviation from Contract Terms

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Contract Term Violation Detection |
| **What It Detects** | Specific payer behaviors that violate contract terms — such as paying below contracted rates, exceeding prompt pay timelines, or applying unauthorized edits |
| **Detection Methodology** | For each contract term: (1) Rate terms: compare paid to contracted rate per CPT. (2) Prompt pay: compare ADTP to contractual prompt pay requirement. (3) Edit terms: identify payer-applied edits not in contract (bundling edits, modifier requirements). (4) Appeal terms: verify payer is complying with contractual appeal timeframes. Fire if any term is systematically violated (>5% of claims affected). |
| **Severity** | **Critical** if contract violation is systematic and >$50K/month impact; **Warning** if >$20K; **Info** if any violation pattern detected |
| **Recommended Action** | Document violations with specific claim examples. File formal contract dispute with payer citing contract language. If prompt pay violation: calculate interest owed under state prompt pay laws and include in dispute. If unauthorized edits: demand written policy basis for each edit. If rate violation: file underpayment appeals for all affected claims. Escalate to payer's VP of Provider Relations if initial dispute is unresolved within 30 days. |
| **Revenue Impact if Unaddressed** | Contract violations are recoverable revenue. A systematic $20/claim underpayment on 2,000 claims/month = $40K/month = $480K/year that the payer owes but is not paying. |
| **Connected Root Cause(s)** | B2.03 Payer underpayment strategy, B2.09 Contract fee schedule error |
| **Connected Metric(s)** | B08 Contract Compliance Rate, B10 Underpayment Total $, P09 Payment Variance |

---

### PR-03: Payer-Specific Process Bottleneck

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer-Specific Operational Bottleneck |
| **What It Detects** | A specific payer requiring disproportionate operational effort — more follow-up calls, more appeals, more rework — indicating the payer's processes are creating drag on the organization's operations |
| **Detection Methodology** | Calculate cost-to-collect by payer = (FTE hours spent on payer / total FTE hours) vs (payer revenue / total revenue). If payer consumes >1.5x its revenue share in FTE effort, it is a bottleneck. Also track: avg touch count per claim by payer, avg days to resolve denial by payer, portal/phone hold times by payer. |
| **Severity** | **Critical** if payer cost-to-collect is >2x its revenue share; **Warning** if >1.5x; **Info** if >1.2x |
| **Recommended Action** | Quantify the excess cost of doing business with this payer. Present to payer in JOC meeting. Common bottlenecks: (1) Payer portal is slow/unreliable — escalate to payer IT. (2) Phone hold times >30 minutes — request dedicated provider line. (3) Appeal process requires paper/fax — negotiate electronic appeal submission. (4) Payer requires excessive documentation for standard procedures — negotiate documentation simplification. If payer is unresponsive: factor excess cost into contract renegotiation (demand higher rates to cover operational burden). |
| **Revenue Impact if Unaddressed** | Excess FTE effort is a direct cost. If a payer consumes 2x its revenue share of FTE time, the excess represents wasted capacity that could be deployed to higher-value activities. For a payer representing $1M/month revenue consuming $100K/month in operational cost (vs $50K expected), the excess is $50K/month. |
| **Connected Root Cause(s)** | B6.12 AR follow-up not prioritized, A2.01 ADTP increase |
| **Connected Metric(s)** | O07 Cost to Collect, O06 Touch Count per Claim, O05 Work Queue Aging |

---

### PR-04: Prior Auth Denial Rate by Payer

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Prior Authorization Process Effectiveness by Payer |
| **What It Detects** | Payers where the prior authorization process is failing — either auth is not being obtained, auth is being obtained but denied at the auth level, or auth is obtained but claims are still denied |
| **Detection Methodology** | For each payer, calculate: (1) Auth request rate = auths requested / auths required. (2) Auth approval rate = auths approved / auths requested. (3) Post-auth denial rate = claims denied despite having approved auth. Fire if auth request rate <95% or auth approval rate <80% or post-auth denial rate >5% for any payer. |
| **Severity** | **Critical** if auth-related denials >$100K/month for any payer; **Warning** if >$30K; **Info** if any auth metric below target |
| **Recommended Action** | If auth request rate low: update PA-required procedure list for this payer. Implement auto-check at scheduling. If auth approval rate low: review clinical information submitted with auth requests — is it sufficient? Implement peer-to-peer review for denied auths. If post-auth denial rate high: verify auth numbers are being placed on claims (EDI mapping issue). Check if payer is denying for reasons beyond auth (medical necessity on top of auth). |
| **Revenue Impact if Unaddressed** | Auth-related denials (CO-197) typically have low overturn rates (<40% on appeal). $100K/month in auth denials = $60K+/month in permanent losses. Prevention (getting the auth right) is far more effective than appeal. |
| **Connected Root Cause(s)** | B1.04 Prior auth process breakdown, B3.07 Auth not obtained, B3.08 Auth not on claim, B6.02 Late auth request |
| **Connected Metric(s)** | E03 Prior Auth Obtained Rate, E04 Prior Auth Denial Rate, E05 Auth Turnaround Time, E06 Missing Auth at Submission |

---

### PR-05: Appeal Success Rate Changes by Payer

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Appeal Success Rate Trend by Payer |
| **What It Detects** | Changes in appeal win rates for specific payers — indicating whether the payer has changed its appeal review criteria or whether appeal strategy needs adjustment |
| **Detection Methodology** | Calculate appeal win rate by payer and by CARC code. Compare to trailing 6-month average. Fire if win rate drops >10 percentage points for any payer. Also fire if a previously high-win-rate denial category suddenly has low win rates. Track by appeal level (L1, L2, external). |
| **Severity** | **Critical** if appeal win rate drops >20 points for a top-5 payer; **Warning** if >10 points; **Info** if declining trend for 3 months |
| **Recommended Action** | If win rate declining for a specific payer: (1) Review recent appeal decisions — what reason is the payer giving for upholding denials? (2) Are new documentation requirements being cited? Update appeal letter templates. (3) Is the payer applying new clinical criteria? Update CDI checklists. (4) Consider shifting to Level 2 or external review if Level 1 win rate is low. If win rate low across all payers for a specific CARC: the underlying documentation or coding issue may need to be addressed (denials may not be appealable). |
| **Revenue Impact if Unaddressed** | Each 10% decline in appeal win rate on 200 appeals/month at $2,000 avg = $40K/month in appeals that would have been won but are now lost. |
| **Connected Root Cause(s)** | B2.01 Payer proprietary criteria, B6.09 Appeal not filed |
| **Connected Metric(s)** | D25 Appeal Win Rate L1, D26 Appeal Win Rate L2, D30 Appeal Win Rate by CARC, D31 Appeal Win Rate by Payer |

---

### PR-06: Payer Recoupment Activity Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Recoupment/Takeback Detection |
| **What It Detects** | Payers clawing back previously paid claims — whether through post-payment audits, RAC/MAC activity, or unilateral recoupments — reducing previously recognized revenue |
| **Detection Methodology** | Monitor PLB (Provider Level Balance) segments in 835 ERA files. Track negative adjustments by payer. Calculate monthly recoupment amount. Fire if recoupments exceed $10K/month for any payer or if recoupment rate exceeds 0.5% of payer revenue. Categorize by reason: audit-driven, COB recovery, duplicate payment recovery, fee schedule correction. |
| **Severity** | **Critical** if recoupments >$50K/month or RAC/MAC audit in progress; **Warning** if >$20K; **Info** if any recoupment activity increasing |
| **Recommended Action** | For each recoupment: verify legitimacy. Was the original payment correct? If so, dispute the recoupment with documentation. If recoupment is from an audit: engage coding audit team to review. Check if recoupment is within contractual/regulatory timeframe (most states limit lookback to 12-24 months). If systematic COB recoupments: verify insurance discovery is catching secondary coverage at registration. Set aside reserve for expected recoupment liability from active audits. |
| **Revenue Impact if Unaddressed** | Recoupments are direct revenue reversals. An active RAC audit can result in $100K-$1M in recoupments over 6-12 months. Uncontested recoupments become permanent losses. |
| **Connected Root Cause(s)** | B2.07 Prepayment review/audit, B2.03 Payer underpayment strategy |
| **Connected Metric(s)** | B02 ERA-Bank Variance Amount, P01 Total ERA Payments Posted |

---

### PR-07: Payer Financial Health Indicator

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Financial Stress Detection |
| **What It Detects** | Early warning signs that a payer may be under financial stress — which predicts slower payments, higher denials, and potential insolvency risk |
| **Detection Methodology** | Monitor multi-signal pattern: (1) ADTP increasing for this payer. (2) Denial rate increasing. (3) Payment amounts decreasing. (4) Float days increasing. (5) Recoupment activity increasing. If 3 or more signals are simultaneously trending negative, flag payer financial stress. Cross-reference with public financial data if available (for publicly traded payers). |
| **Severity** | **Critical** if 4+ signals trending negative simultaneously; **Warning** if 3 signals; **Info** if 2 signals |
| **Recommended Action** | Limit financial exposure: accelerate AR follow-up for this payer. Reduce new patient scheduling with this payer if possible. Increase monitoring frequency to weekly. Verify that contract has adequate termination provisions. If payer insolvency is possible: file all outstanding claims immediately, accelerate appeals, and consult with legal on creditor protection. |
| **Revenue Impact if Unaddressed** | Payer insolvency can result in total loss of outstanding AR. If $500K is owed by a financially stressed payer, all $500K is at risk. Even short of insolvency, financial stress adds 15-30 days to ADTP. |
| **Connected Root Cause(s)** | B2.10 Payer financial stress, A2.01 ADTP increase |
| **Connected Metric(s)** | P12 ADTP by Payer, D10 Denials by Payer, B06 Float Days |

---

### PR-08: Payer Credentialing Status Risk

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer-Specific Credentialing Gap |
| **What It Detects** | Providers not credentialed with specific payers who are receiving referrals or appointments from patients covered by those payers — guaranteeing denials |
| **Detection Methodology** | Cross-reference scheduled appointments (payer on file) with provider credentialing database (payers credentialed). Fire if any appointment is scheduled where the rendering provider is not credentialed with the patient's payer. Calculate volume and dollar exposure. |
| **Severity** | **Critical** if >50 appointments/week at risk; **Warning** if >20; **Info** if any mismatch detected |
| **Recommended Action** | Immediate: notify scheduling to redirect affected patients to credentialed providers. Short-term: expedite credentialing application for the provider with the affected payer. Long-term: integrate credentialing database with scheduling system to prevent mismatch at booking. For new providers: begin credentialing 90+ days before start date. Track: list of payers each provider is credentialed with, visible in scheduling system. |
| **Revenue Impact if Unaddressed** | Each non-credentialed visit results in a guaranteed denial. If 50 visits/week at $300 avg = $15K/week = $780K/year in fully preventable denials. |
| **Connected Root Cause(s)** | B3.16 Provider not credentialed, A1.10 Credentialing gaps, B6.06 Credentialing lapsed |
| **Connected Metric(s)** | O11 Credentialing Expiration Alerts, D09 Denials by Category |

---

### PR-09: Payer Mix Profitability Ranking

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Profitability Ranking Shift |
| **What It Detects** | Changes in the relative profitability of each payer — factoring in reimbursement rates, denial rates, ADTP, and administrative burden — identifying payers becoming less profitable |
| **Detection Methodology** | Calculate payer profitability index = (net collections - cost to collect) / gross charges by payer. Rank payers quarterly. Fire if any payer's profitability index drops >10% quarter-over-quarter or if any payer's profitability index turns negative (collecting less than the cost of managing their claims). |
| **Severity** | **Critical** if any payer profitability is negative; **Warning** if declining >10%; **Info** if declining >5% |
| **Recommended Action** | For declining profitability payers: (1) Decompose the cause — is it rates, denials, administrative burden, or a combination? (2) Present data to payer in contract renegotiation. (3) If payer is unresponsive to improvement requests: evaluate whether to remain in-network. (4) For negative-profitability payers: this is a strategic decision for leadership — maintaining access vs. financial viability. Include in annual payer strategy review. |
| **Revenue Impact if Unaddressed** | Operating below cost for a payer is a direct margin drain. If a payer with $1M/month volume has a -2% profitability index, the organization is losing $20K/month to serve that payer's patients. |
| **Connected Root Cause(s)** | A1.08 Contract rate erosion, B2.03 Payer underpayment strategy |
| **Connected Metric(s)** | R12 Net Collection Rate, O07 Cost to Collect, P12 ADTP by Payer |

---

### PR-10: Payer Audit Exposure Assessment

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Audit Exposure Risk Score |
| **What It Detects** | Claims patterns that are likely to trigger payer audits (RAC, MAC, ZPIC, commercial payer post-payment audits) based on known audit target profiles |
| **Detection Methodology** | Compare organization's billing patterns to known audit triggers: (1) High-level E&M usage above 90th percentile. (2) DRG mix with high CC/MCC rates above benchmark. (3) Short inpatient stays with high DRG weights. (4) High modifier 25 usage. (5) Procedure volume spikes. Calculate audit risk score 0-100. Fire if score >70. |
| **Severity** | **Critical** if audit risk score >80 or active audit notice received; **Warning** if >70; **Info** if >60 or any metric in audit-trigger zone |
| **Recommended Action** | Conduct pre-audit self-assessment: (1) Pull sample of high-risk claims and audit coding accuracy. (2) If coding is accurate: prepare documentation to defend. (3) If coding errors found: voluntary self-disclosure may be appropriate (consult compliance counsel). (4) Implement prospective audit targeting high-risk patterns before payers identify them. (5) Maintain audit-ready documentation packages for high-volume DRGs and CPTs. |
| **Revenue Impact if Unaddressed** | RAC/ZPIC audits typically result in $100K-$2M in recoupments. Beyond direct financial impact, audits consume significant staff time (estimated $50K-$100K in labor per audit). Voluntary self-disclosure before audit reduces penalties. |
| **Connected Root Cause(s)** | B2.07 Prepayment review/audit |
| **Connected Metric(s)** | CD01 Coding Accuracy Rate, CD02 Coding Error Rate by Type, O12 Compliance Audit Findings |

---

### PR-11: Payer Response Time to Appeals

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Appeal Response Time Monitoring |
| **What It Detects** | Payers taking longer than contractually or regulatory required timeframes to respond to appeals, delaying revenue recovery |
| **Detection Methodology** | Track appeal submission date to appeal decision date by payer. Compare to contractual and regulatory requirements (typically 30 days for commercial, 60 days for government). Fire if any payer's average appeal response time exceeds requirement by >10 days or if >20% of appeals exceed the deadline. |
| **Severity** | **Critical** if >30% of appeals exceed regulatory deadline; **Warning** if >20% or average exceeds deadline; **Info** if >10% |
| **Recommended Action** | For overdue appeals: (1) File formal complaint with payer citing contractual/regulatory response timeframes. (2) If commercial payer: reference state prompt pay/appeal response laws. (3) If Medicare/Medicaid: escalate through appropriate administrative channels. (4) Document pattern for potential state insurance commissioner complaint. (5) If systematic: demand automatic approval for appeals not responded to within regulatory timeframe (some states require this). |
| **Revenue Impact if Unaddressed** | Slow appeal responses delay revenue recovery. If 200 appeals/month are delayed an average of 30 extra days at $2,000 avg, $400K in revenue is delayed. Interest cost: $400K x 5% / 12 = $1,667/month. |
| **Connected Root Cause(s)** | B2.10 Payer financial stress |
| **Connected Metric(s)** | D29 Average Days to Appeal Resolution, D31 Appeal Win Rate by Payer |

---

### PR-12: Payer EDI Enrollment Compliance

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer EDI Enrollment and Connectivity Status |
| **What It Detects** | Gaps in electronic connectivity with payers — claims still being submitted on paper or through portals when EDI should be available, increasing cost and reducing processing speed |
| **Detection Methodology** | Calculate electronic submission rate by payer. Fire if any payer with >50 claims/month has an electronic submission rate <95%. Track payers where claims are submitted via portal or paper. Calculate cost premium of non-electronic submission. |
| **Severity** | **Critical** if electronic rate <80% for any top-20 payer; **Warning** if <90%; **Info** if <95% |
| **Recommended Action** | For each non-electronic payer: (1) Determine if EDI enrollment is available and initiate enrollment. (2) If enrolled but not working: troubleshoot with clearinghouse. (3) If payer does not accept EDI: evaluate portal submission automation. (4) For paper submissions: batch and prioritize by dollar value. Each manual submission costs $5-$15 in labor vs $0.50-$1.00 for EDI. |
| **Revenue Impact if Unaddressed** | Non-electronic submissions cost 10-15x more per claim and add 5-10 days to cycle time. 500 manual submissions/month at $10 excess cost = $5K/month in direct cost plus $250K-$500K in delayed revenue (cycle time impact). |
| **Connected Root Cause(s)** | B1.08 Clearinghouse/EDI errors |
| **Connected Metric(s)** | C04 Claims by Submission Method, C05 Claim Lag Days |

---

### PR-13: Payer-Specific Timely Filing Deadline Tracking

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Filing Deadline Currency |
| **What It Detects** | Payer-specific timely filing deadlines that have changed or are not accurately reflected in the billing system, creating silent timely filing risk |
| **Detection Methodology** | Compare system-stored filing deadlines against actual payer requirements (contract terms, payer websites). Fire if any discrepancy is found. Also fire if any payer's filing deadline is not stored in the system at all. Track CO-29 denials and correlate with deadline accuracy. |
| **Severity** | **Critical** if filing deadline is incorrect for any top-10 payer; **Warning** if incorrect for any payer or missing for any active payer; **Info** if deadline accuracy has not been verified in >12 months |
| **Recommended Action** | Annual payer filing deadline audit: verify every active payer's filing deadline against current contract terms. Update system immediately for any discrepancies. Implement internal filing deadline = payer deadline minus 14 days as buffer. Common filing windows: Medicare 12 months, Medicaid varies by state (90 days to 12 months), Commercial 90-365 days depending on payer. Post-contract-renegotiation: verify filing deadlines did not change. |
| **Revenue Impact if Unaddressed** | A single incorrect filing deadline can cause timely filing write-offs for an entire claim cohort. If 200 claims/month for a payer have a 90-day deadline but the system shows 180 days, claims may not be prioritized until too late. At $1,500 avg = $300K at risk. |
| **Connected Root Cause(s)** | B2.05 Payer timely filing tightening, A1.03 Timely filing write-offs |
| **Connected Metric(s)** | O08 Timely Filing Risk Claims, O09 Timely Filing Violations |

---

## 8. OPERATIONAL DIAGNOSTICS

### OP-01: FTE Productivity Bottleneck Identification

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | FTE Productivity Bottleneck |
| **What It Detects** | Revenue cycle functions where FTE productivity is below benchmark, creating throughput constraints |
| **Detection Methodology** | Calculate claims per FTE by function (coding, billing, denial management, collections, payment posting). Compare to industry benchmarks. Fire if any function is >20% below benchmark. Also calculate: revenue per FTE and cost per claim by function. Identify functions where adding 1 FTE would have the highest revenue impact. |
| **Severity** | **Critical** if any function is >30% below benchmark; **Warning** if >20%; **Info** if >10% or declining trend |
| **Recommended Action** | For each below-benchmark function: (1) Is it understaffed? Calculate staffing ratio vs volume. (2) Is it a training issue? Compare individual FTE productivity within the function. (3) Is it a system/tool issue? Audit workflow for unnecessary steps, system wait times, manual processes that could be automated. (4) Is it a management issue? Review queue management, task assignment, and accountability mechanisms. Prioritize by revenue impact: fix the function where improvement generates the most revenue per dollar invested. |
| **Revenue Impact if Unaddressed** | Below-benchmark productivity directly increases cost-to-collect and delays revenue. If coding is 30% below benchmark, it takes 30% more coders (or 30% more time) to process the same volume, delaying all downstream revenue. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | O01 Claims Processed per FTE, O02 Denials Worked per FTE, O03 Collections Calls per FTE |

---

### OP-02: Process Cycle Time Anomaly

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue Cycle Stage Dwell Time Anomaly |
| **What It Detects** | Specific stages in the 7-stage revenue cycle pipeline where claims are dwelling longer than normal, indicating a process bottleneck |
| **Detection Methodology** | For each pipeline stage (Charge Captured > Coded > Scrubbed > Submitted > Adjudicated > Payment Posted > Reconciled), calculate average dwell time. Compare to target and to trailing 90-day average. Fire if any stage dwell time exceeds target by >50% or increases by >2 days. |
| **Severity** | **Critical** if any stage dwell time >3x target; **Warning** if >2x target or increasing >50%; **Info** if >1.5x target |
| **Recommended Action** | Identify the specific bottleneck stage. Common issues by stage: (1) Charge Capture: department not entering charges timely. (2) Coding: staffing, complexity, or query delays. (3) Scrubbing: scrubber hold rate too high, rules too restrictive. (4) Submission: clearinghouse delays, enrollment issues. (5) Adjudication: payer processing delays (not controllable). (6) Posting: posting backlog, manual posting. (7) Reconciliation: bank matching delays. For each: identify root cause and deploy targeted fix. |
| **Revenue Impact if Unaddressed** | Each day of cycle time delay = 1 day of delayed cash. Across the entire pipeline, a 5-day increase in total cycle time on $5M monthly revenue = $833K in additional working capital requirement. |
| **Connected Root Cause(s)** | B6.04 Coding backlog, B6.10 Payment posting delay, A2.01 ADTP increase |
| **Connected Metric(s)** | C24 Pipeline Dwell Time, C23 Stage Drop-off Rate, C16-C22 Stage Metrics |

---

### OP-03: Touch Count Diagnostics

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Excessive Claim Touch Count |
| **What It Detects** | Claims requiring more than 3 manual touches (interventions) before resolution — indicating process inefficiency and excessive rework |
| **Detection Methodology** | Count manual touches per claim (phone calls, status checks, resubmissions, appeals, corrections). Calculate distribution: what percentage of claims require >3 touches? Fire if >15% of claims require >3 touches. Identify common characteristics of high-touch claims (payer, denial type, CPT, facility). |
| **Severity** | **Critical** if >25% of claims require >3 touches; **Warning** if >15%; **Info** if >10% or increasing |
| **Recommended Action** | Analyze high-touch claims for patterns. Common findings: (1) Specific payer requires multiple follow-ups due to slow processing — escalate to payer. (2) Specific denial type cycles through correction-resubmission-denial loops — deploy root cause fix. (3) System-generated work queue items that don't require action — remove false positives. (4) Claims requiring both billing and clinical correction — create joint workflow. Target: resolve 80% of claims in <=2 touches. |
| **Revenue Impact if Unaddressed** | Each touch costs approximately $8-$15 in labor. If 1,000 claims/month require 5+ touches (vs target of 2), excess touches = 3,000 x $10 = $30K/month in wasted labor. |
| **Connected Root Cause(s)** | B6.15 No feedback loop, A2.06 Claim resubmission cycle |
| **Connected Metric(s)** | O06 Touch Count per Claim, O01 Claims Processed per FTE |

---

### OP-04: Queue Aging Diagnostics

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Work Queue Item Aging |
| **What It Detects** | Work queue items (denial follow-ups, AR tasks, posting items) that are not being worked within target timeframes — indicating staffing gaps, misallocation, or accountability issues |
| **Detection Methodology** | For each work queue, calculate average age of unworked items. Track items by age tier: 0-7 days, 8-14, 15-30, 31-60, 60+. Fire if any queue has >20% items aged >14 days or if any items are aged >30 days. Compare queue aging across team members to identify individual workload imbalances. |
| **Severity** | **Critical** if any queue has items >60 days old; **Warning** if >30 days; **Info** if >14 days or aging trend increasing |
| **Recommended Action** | Immediately reassign aged items to available team members. Review queue prioritization logic: are items sorted by dollar value x time sensitivity? If entire queue is aging: staffing is insufficient — either reallocate from lower-priority queues or add temporary staff. If specific team members' items are aging: check individual workload and productivity. If specific item types are aging: the required action may be unclear — provide decision support or escalation paths. |
| **Revenue Impact if Unaddressed** | Unworked queue items represent delayed revenue at minimum, lost revenue at worst. If 500 items aged >30 days at $1,500 avg = $750K in AR not being actively pursued, with collection probability declining daily. |
| **Connected Root Cause(s)** | B6.12 AR follow-up not prioritized, B6.09 Appeal not filed |
| **Connected Metric(s)** | O05 Work Queue Aging, A09 Collections Work Queue Size, A10 Tasks by Priority |

---

### OP-05: System Throughput Bottleneck

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | System Throughput Capacity Issue |
| **What It Detects** | Technology system limitations that are constraining revenue cycle throughput — slow claim processing, batch size limitations, interface failures, or system downtime |
| **Detection Methodology** | Monitor: (1) Claim processing time per batch. (2) System uptime/availability. (3) Interface (HL7/FHIR) message processing lag. (4) Clearinghouse submission success rate. (5) ERA processing throughput. Fire if any system metric degrades >20% from baseline or if downtime exceeds 2 hours/week. |
| **Severity** | **Critical** if system outage >4 hours or interface failure affecting claim submission; **Warning** if processing time >2x baseline; **Info** if any degradation trend |
| **Recommended Action** | For processing speed issues: check database performance, server capacity, and batch scheduling. For interface failures: check connectivity, validate message formats, escalate to vendor. For clearinghouse issues: escalate to clearinghouse and implement backup submission path. For ERA processing: verify file format compliance and auto-posting rules. Document SLA violations for vendor accountability. Plan capacity upgrades if growth is causing throughput constraints. |
| **Revenue Impact if Unaddressed** | System downtime directly delays claim submission and payment posting. A 1-day system outage delays all claims by 1+ days. Chronic throughput constraints create backlogs that compound over time. |
| **Connected Root Cause(s)** | B1.08 Clearinghouse/EDI errors, B6.10 Payment posting delay |
| **Connected Metric(s)** | C24 Pipeline Dwell Time, O04 Payment Posting Lag |

---

### OP-06: Eligibility Verification Compliance

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Eligibility Verification Rate Gap |
| **What It Detects** | Patients being seen without prior eligibility verification, creating downstream denial risk for eligibility-related reasons |
| **Detection Methodology** | Calculate eligibility verification rate = patients verified / patients scheduled. Target: 100% at 48 hours pre-service. Fire if rate drops below 95%. Also calculate verification timing: what percentage are verified >48 hours before appointment vs <24 hours vs day-of. Track by facility/location. |
| **Severity** | **Critical** if verification rate <90%; **Warning** if <95%; **Info** if <98% or declining |
| **Recommended Action** | If rate is low: (1) Check if automated batch eligibility check is running (should fire 48 hours pre-appointment). (2) If manual: add eligibility checkpoint to scheduling workflow — appointment cannot be confirmed without eligibility verification. (3) Implement real-time eligibility check at registration as backup. (4) For same-day/walk-in patients: real-time check at registration is mandatory. For patients with failed eligibility: insurance discovery workflow before billing. |
| **Revenue Impact if Unaddressed** | Eligibility-related denials (CO-27, CO-29, CO-39) are typically 8-12% of all denials. If total denials are $500K/month, eligibility denials = $40K-$60K/month. 90%+ are preventable with pre-service verification. |
| **Connected Root Cause(s)** | B1.03 Eligibility verification failure, B3.09 Eligibility terminated, B6.01 Eligibility not checked |
| **Connected Metric(s)** | E01 Eligibility Verification Rate, E02 Eligibility Verification Lag, D09 Denials by Category (Eligibility) |

---

### OP-07: Registration Accuracy Diagnostic

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Patient Registration Error Rate |
| **What It Detects** | Errors in patient demographic and insurance data entered at registration, causing downstream claim rejections and denials |
| **Detection Methodology** | Calculate registration error rate = claims rejected/denied for demographic/insurance data issues / total claims. Categorize errors: wrong member ID, wrong DOB, wrong subscriber name, wrong group number, wrong payer selected. Fire if registration error rate >2%. Track by registrar to identify training needs. |
| **Severity** | **Critical** if error rate >5%; **Warning** if >3%; **Info** if >2% |
| **Recommended Action** | Implement real-time validation at registration: (1) Eligibility response validates member ID + DOB before registration is complete. (2) Insurance card scanning with OCR to reduce manual entry. (3) Address verification. (4) Prior visit data pre-population. For high-error registrars: 1:1 coaching and accuracy monitoring. Implement registration accuracy scorecard with monthly reporting. 10% random sample audit weekly. |
| **Revenue Impact if Unaddressed** | Each registration error results in a rejection (avg 10-day delay) or denial (avg 30+ day delay). 3% error rate on 5,000 claims/month = 150 claims delayed or denied. At $1,200 avg, $180K/month in delayed revenue, with 10-20% at risk of permanent loss. |
| **Connected Root Cause(s)** | B6.07 Registration errors, B3.22 Missing/invalid demographics |
| **Connected Metric(s)** | C08 Claim Rejection Rate, D09 Denials by Category |

---

### OP-08: Payment Posting Timeliness

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payment Posting Lag |
| **What It Detects** | Delays between receiving ERA files and posting payments to patient accounts, causing inaccurate AR reporting and delayed patient billing |
| **Detection Methodology** | Calculate posting lag = posted_date - era_received_date. Target: same-day for electronic ERA, 48 hours for manual/paper. Fire if average posting lag >2 days for electronic or >5 days for manual. Track by poster to identify individual bottlenecks. |
| **Severity** | **Critical** if posting lag >5 days for electronic ERA; **Warning** if >2 days; **Info** if >1 day or increasing |
| **Recommended Action** | If lag is electronic posting: (1) Check auto-posting rate — what percentage of ERAs are auto-posting vs requiring manual intervention? Target: >80% auto-post. (2) For ERAs requiring manual posting: identify why (unmatched claims, contractual adjustment discrepancies, denied claim posting rules). (3) Increase auto-posting threshold or add auto-posting rules. If lag is manual: (1) Check paper check volume — are payers sending checks when EFT is enrolled? (2) Evaluate outsourcing manual posting. |
| **Revenue Impact if Unaddressed** | Posting lag creates inaccurate AR. If payments are not posted, AR appears larger than it is, leading to incorrect follow-up on already-paid claims (wasted effort). Also delays patient balance billing by the posting lag duration, reducing patient collection probability. |
| **Connected Root Cause(s)** | B6.10 Payment posting delay, A1.06 Unapplied payments |
| **Connected Metric(s)** | O04 Payment Posting Lag, P08 Unapplied Payments |

---

### OP-09: Appeal Filing Timeliness

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Appeal Filing Rate and Timeliness |
| **What It Detects** | Appealable denials that are not being appealed, or appeals that are being filed too late in the appeal window |
| **Detection Methodology** | Calculate appeal filing rate = appeals filed / total appealable denials. Identify appealable denials: exclude non-recoverable denials (patient responsibility, frequency limits, non-covered services). Fire if appeal filing rate <90% for appealable denials. Also calculate: average days from denial to appeal filing vs payer appeal deadline. Fire if any appeals are filed in the last 25% of the appeal window. |
| **Severity** | **Critical** if appeal filing rate <80% or any appeals past deadline; **Warning** if <90% or appeals clustered near deadline; **Info** if <95% |
| **Recommended Action** | Implement automated appeal queue: every denial assessed for appealability within 48 hours. Auto-queue appealable denials with countdown timer to payer appeal deadline. Prioritize by: dollar amount x win probability. Staff appeals by volume: if 200 appeals/month need filing and each takes 30 min, that is 100 FTE hours/month = 0.6 FTE dedicated to appeals. Ensure appeal templates are current for each payer and denial type. |
| **Revenue Impact if Unaddressed** | Every unfiled appeal is a missed recovery opportunity. If 100 appealable denials/month are not filed at $2,000 avg with 50% win rate, that is $100K/month in forfeited revenue. |
| **Connected Root Cause(s)** | B6.09 Appeal not filed, D24 Appeal Filed Rate |
| **Connected Metric(s)** | D24 Appeal Filed Rate, D25 Appeal Win Rate L1, D28 Appeal Recovery Amount |

---

### OP-10: Credentialing Expiration Risk

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Provider Credentialing Expiration Risk |
| **What It Detects** | Provider credentials, enrollments, or licenses approaching expiration — which will cause claim denials if not renewed before expiry |
| **Detection Methodology** | Track all provider credential expiration dates: state license, DEA, payer enrollments, hospital privileges, malpractice insurance. Fire at 120/90/60/30 day intervals before expiration. Also detect: providers whose enrollment has already lapsed (claims will be denied). Cross-reference with claims in pipeline for at-risk providers. |
| **Severity** | **Critical** if any credential expires within 30 days with no renewal in progress; **Warning** if within 60 days; **Info** if within 120 days |
| **Recommended Action** | 120 days: Initiate renewal application. 90 days: Verify application received by credentialing body. 60 days: Follow up on pending applications. 30 days: Escalate to department chair and compliance officer. If expired: immediately stop billing under this provider — route to supervising provider if allowable. File retroactive enrollment if payer allows. For already-denied claims: resubmit under credentialed provider or appeal with evidence of retroactive enrollment. |
| **Revenue Impact if Unaddressed** | A lapsed credential results in 100% denial of that provider's claims. A provider billing $200K/month with a lapsed credential = $200K/month in denials until resolved. Retroactive enrollment, where allowed, recovers 60-80%. |
| **Connected Root Cause(s)** | A1.10 Credentialing gaps, B3.16 Provider not credentialed, B6.06 Credentialing lapsed |
| **Connected Metric(s)** | O11 Credentialing Expiration Alerts, D09 Denials by Category |

---

### OP-11: Denial-to-Front-End Feedback Loop

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Missing Denial Prevention Feedback Loop |
| **What It Detects** | Denial patterns that are repeating because the root cause information is not being communicated back to the front-end processes (scheduling, registration, auth, coding) that could prevent them |
| **Detection Methodology** | Track denial root causes month over month. If the same root cause (same CARC + payer combination) appears in the top 10 for 3 consecutive months without a declining trend, the feedback loop is broken. Calculate: recurrence rate = (root causes in top 10 this month that were also top 10 last month) / total top 10. Fire if recurrence rate >70%. |
| **Severity** | **Critical** if recurrence rate >80% (nothing is improving); **Warning** if >60%; **Info** if >50% |
| **Recommended Action** | Establish monthly denial root cause meeting with representatives from: Patient Access, Coding, CDI, Billing, Denial Management. Format: (1) Top 10 root causes with dollar impact. (2) For each: who owns the fix? What is the deadline? (3) Status of prior month's action items. Create a denial prevention scorecard tracking: root cause identification > action assigned > action completed > denial rate impact measured. The feedback loop is the most important single process improvement in denial management. |
| **Revenue Impact if Unaddressed** | Without a feedback loop, the organization is perpetually fighting the same denials. If top 10 recurring root causes represent $300K/month in denials, and 60% are preventable with upstream fixes, $180K/month is being lost to organizational inertia. |
| **Connected Root Cause(s)** | B6.15 No feedback loop from denials to front-end |
| **Connected Metric(s)** | D04 Denial Rate Trend, D02 Denial Rate, D07 Denials by CARC Code |

---

### OP-12: Charge Reconciliation Diagnostic

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Daily Charge Reconciliation Gap |
| **What It Detects** | Discrepancies between the number of patient encounters and the number of charges captured, by department, indicating systematic charge leakage |
| **Detection Methodology** | Daily: compare encounter count from scheduling/EHR to charge count from billing system by department. Calculate capture ratio = charges / encounters. Fire if ratio <95% for any department. Also compare: ancillary charges per encounter to benchmark — are ancillary services (lab, imaging, supplies) being captured? |
| **Severity** | **Critical** if capture ratio <90% for any high-volume department; **Warning** if <95%; **Info** if declining trend |
| **Recommended Action** | For departments with gaps: (1) Identify which encounter types are missing charges. (2) Check CDM (charge description master) for the department — are all services mapped? (3) Implement end-of-shift charge reconciliation with department supervisor sign-off. (4) Check EHR order entry: are orders being placed but charges not generating? (5) If ancillary charges are low: check supply charge capture and implant tracking. Daily charge reconciliation report should be the first report every department manager reviews each morning. |
| **Revenue Impact if Unaddressed** | See RH-04. Charge capture gaps are pure revenue loss — services were rendered but never billed. |
| **Connected Root Cause(s)** | A1.04 Unbilled/dropped charges, B6.08 Charge capture gaps |
| **Connected Metric(s)** | R01 Total Charges Billed, R08 Average Charge per Encounter |

---

### OP-13: Payer Rule Currency Diagnostic

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Scrubber Payer Rule Staleness |
| **What It Detects** | Payer-specific rules in the claim scrubber that have not been updated recently, creating risk that new payer requirements are not being enforced pre-submission |
| **Detection Methodology** | Track last_update_date for each payer's scrubber rules. Fire if any top-20 payer's rules have not been updated in >90 days. Also fire if a payer policy bulletin has been published but scrubber rules have not been updated within 5 business days. Cross-reference with denial spikes by payer — correlate rule staleness with denial rate changes. |
| **Severity** | **Critical** if top-5 payer rules >180 days stale AND denial rate increasing; **Warning** if >90 days stale; **Info** if >60 days |
| **Recommended Action** | Assign a payer rule owner for each top-20 payer. Payer rule owner responsibilities: (1) Monitor payer bulletins weekly. (2) Update scrubber rules within 5 business days of policy change. (3) Quarterly comprehensive rule review (even without known changes). (4) Test rule changes against recent claims before deploying. Implement automated payer bulletin monitoring where payer portals support it. |
| **Revenue Impact if Unaddressed** | Stale rules lead directly to preventable denials. If a payer changes a requirement and rules are not updated for 90 days, 90 days of claims are submitted incorrectly. At 200 claims/month per payer, that is 600 claims potentially affected. |
| **Connected Root Cause(s)** | B6.05 Payer rules not updated, B1.01 Payer policy change |
| **Connected Metric(s)** | C07 Clean Claim Rate, D10 Denials by Payer |

---

### OP-14: Collections Effort Allocation Diagnostic

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Collections Resource Misallocation |
| **What It Detects** | Collection effort (phone calls, letters, portal messages) being disproportionately allocated to low-value or low-probability accounts while high-value/high-probability accounts receive insufficient attention |
| **Detection Methodology** | Calculate: for each collector, revenue recovered per hour worked. Compare across collectors and account types. Calculate effort allocation = time spent on each AR segment (payer AR, patient AR high propensity, patient AR low propensity). Fire if >30% of collection effort is spent on accounts with <20% recovery probability. Fire if high-propensity accounts are not contacted within 14 days. |
| **Severity** | **Critical** if >40% of effort on low-probability accounts; **Warning** if >30%; **Info** if any misallocation detected |
| **Recommended Action** | Restructure work queue sorting: (1) Payer AR: sort by dollar amount x days to deadline. (2) Patient AR: sort by propensity-to-pay score x balance amount. (3) Remove accounts below cost-to-collect threshold from active work queue (auto-route to digital outreach or agency placement). (4) Set daily targets by recovery tier. (5) Track collection yield per FTE hour — this is the ultimate productivity metric. |
| **Revenue Impact if Unaddressed** | Misallocated collection effort wastes 25-40% of collection team productivity. If collection team costs $200K/month and 30% is misallocated, $60K/month is wasted. More importantly, high-value accounts not contacted timely have declining recovery probability. |
| **Connected Root Cause(s)** | B6.13 Collections not targeting high-propensity, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | A14 Average Collection per Call, O03 Collections Calls per FTE, A15 Patient Payment Rate |

---

### OP-15: Insurance Discovery Opportunity

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Insurance Discovery Opportunity Detection |
| **What It Detects** | Patients billed as self-pay or with single coverage who may have undiscovered insurance coverage — representing revenue that could be billed to a payer instead of the patient |
| **Detection Methodology** | Flag self-pay patients with: (1) Services >$5,000 (high-cost services often have coverage). (2) Age >65 without Medicare (may be eligible). (3) Prior visits with insurance now showing self-pay. (4) COB denials suggesting unknown primary. Run insurance discovery tool on flagged patients. Fire if insurance discovery rate (coverage found / patients checked) drops below historical average. |
| **Severity** | **Critical** if self-pay AR >$500K without insurance discovery screening; **Warning** if >$200K; **Info** if discovery rate declining |
| **Recommended Action** | Implement systematic insurance discovery at: (1) Registration — for all self-pay patients. (2) Post-service — for all self-pay balances >$500. (3) Pre-collections — before sending to bad debt. Use insurance discovery vendor/tool to search for coverage. Common findings: Medicaid coverage not disclosed, employer coverage not updated, Medicare eligibility not verified. For discovered coverage: bill payer retroactively. |
| **Revenue Impact if Unaddressed** | Insurance discovery typically finds coverage for 5-15% of self-pay patients. If self-pay AR = $1M and discovery finds coverage for 10%, that is $100K in AR that can be billed to payers at much higher collection rates than self-pay. |
| **Connected Root Cause(s)** | B3.09 Eligibility terminated, B6.01 Eligibility not checked |
| **Connected Metric(s)** | E07 Insurance Discovery Rate, E09 Self-Pay Percentage, A16 Self-Pay Conversion Rate |

---

### OP-16: Prior Authorization Workflow Efficiency

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Prior Auth Workflow Timeliness |
| **What It Detects** | Prior authorization requests being submitted too late relative to the scheduled service date, resulting in either auth denials or service delays |
| **Detection Methodology** | Calculate auth lead time = auth_request_date - scheduled_service_date (in days). Target: auth request submitted >7 business days before service. Fire if average lead time <5 business days or if >20% of auths are requested <3 business days before service. Track by department and scheduler. |
| **Severity** | **Critical** if >30% of auths requested <3 days before service; **Warning** if >20%; **Info** if average lead time <5 days |
| **Recommended Action** | Implement auto-trigger: when a PA-required procedure is scheduled, auto-generate PA request. Map payer PA-required procedure lists to CPT codes. For urgent/emergent cases: implement concurrent auth process. Train schedulers on PA requirements. Implement scheduling system validation: procedure scheduled > PA required? > PA on file? > If no, auto-trigger request. Track auth turnaround by payer to set appropriate lead times. |
| **Revenue Impact if Unaddressed** | Late auth requests result in either: (1) Service delay (patient rescheduled, possible no-show). (2) Service rendered without auth (auth denial, 60%+ permanent loss). A 20% late auth rate on 200 PA-required services/month = 40 at-risk claims. |
| **Connected Root Cause(s)** | B6.02 Auth request submitted late, B3.07 Auth not obtained |
| **Connected Metric(s)** | E03 Prior Auth Obtained Rate, E05 Auth Turnaround Time, E06 Missing Auth at Submission |

---

### OP-17: Denial Management FTE Capacity

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Denial Management Staffing Gap |
| **What It Detects** | The denial management team does not have sufficient FTE capacity to work all incoming denials within target timeframes, resulting in aging denials and missed appeal deadlines |
| **Detection Methodology** | Calculate: denials received per month / denials worked per FTE per month. If ratio indicates >100% FTE utilization (incoming exceeds capacity), fire. Also calculate: average time to first touch on a denial. If >7 days, capacity is insufficient. Track denial backlog (unworked denials) trend. |
| **Severity** | **Critical** if denial backlog >500 or growing >20%/month; **Warning** if backlog >200 or growing; **Info** if any capacity gap detected |
| **Recommended Action** | Short-term: authorize overtime or temporary staffing. Prioritize by dollar value x appeal deadline proximity. Mid-term: evaluate whether denial volume can be reduced through upstream prevention (more cost-effective than hiring to manage denials). Long-term: staff denial team to handle peak volumes, not average volumes. Benchmark: 25-35 denial resolutions per FTE per day, depending on complexity. Consider outsourcing low-complexity/high-volume denials. |
| **Revenue Impact if Unaddressed** | Each unworked denial ages, reducing recovery probability. If backlog of 500 denials at $2,000 avg ages 30 days, recovery probability drops 15-20%, representing $150K-$200K in lost recovery opportunity. |
| **Connected Root Cause(s)** | B6.09 Appeal not filed, B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | O02 Denials Worked per FTE, O05 Work Queue Aging, D24 Appeal Filed Rate |

---

### OP-18: Automation Opportunity Detection

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Manual Process Automation Opportunity |
| **What It Detects** | Revenue cycle tasks that are being performed manually but could be automated — reducing cost, increasing speed, and improving accuracy |
| **Detection Methodology** | Analyze task types by: volume, time per task, error rate, and automation feasibility. Flag tasks that are high-volume (>50/day), low-complexity, and rule-based. Common automation candidates: eligibility verification, claim status inquiry, payment posting, denial categorization, patient statement generation. Calculate automation ROI = (current FTE cost) - (automation cost) for each candidate. |
| **Severity** | **Critical** if automation could save >$100K/year; **Warning** if >$50K; **Info** if any automation opportunity identified |
| **Recommended Action** | Prioritize automation opportunities by ROI and implementation complexity. Quick wins: (1) Batch eligibility verification (automate 100% pre-service checking). (2) Auto-posting of clean ERAs (target >80% auto-post rate). (3) Automated claim status checking (replace manual portal lookups). (4) Automated denial categorization and routing. Build business case for each opportunity with projected ROI and implementation timeline. |
| **Revenue Impact if Unaddressed** | Manual processes cost 3-5x more than automated equivalents. If $300K/year in manual labor can be automated for $50K/year, the net savings of $250K/year is the opportunity cost of not automating. |
| **Connected Root Cause(s)** | B6.10 Payment posting delay, B6.01 Eligibility not checked |
| **Connected Metric(s)** | O01 Claims Processed per FTE, O07 Cost to Collect |

---

### OP-19: Staff Turnover Impact on Revenue Cycle

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue Cycle Staff Turnover Impact |
| **What It Detects** | Correlation between staff turnover events and degradation in revenue cycle metrics — new staff producing more errors, slower throughput, and higher denial rates during ramp-up |
| **Detection Methodology** | Track new hire start dates and departed employee exit dates. Correlate with: denial rate changes, clean claim rate changes, posting lag changes, and productivity changes in the 90 days following turnover. Fire if any metric degrades >10% coinciding with turnover event. Calculate ramp-up time for new hires to reach team average productivity. |
| **Severity** | **Critical** if >30% of team is in <90-day ramp-up simultaneously; **Warning** if >20%; **Info** if any correlation detected |
| **Recommended Action** | For active turnover impact: (1) Increase QA review for new hires (100% review for first 30 days, 50% for days 31-60, 25% for days 61-90). (2) Assign mentor/buddy from experienced staff. (3) Provide structured training curriculum rather than on-the-job learning only. For turnover prevention: (4) Benchmark compensation to market. (5) Implement career progression paths. (6) Monitor engagement indicators. Cost of turnover in RCM: typically $15K-$30K per position in recruitment + ramp-up productivity loss. |
| **Revenue Impact if Unaddressed** | Each new hire in ramp-up produces approximately 20-40% lower throughput and 2-3x higher error rates for 60-90 days. If 5 new coders are ramping simultaneously, coding throughput drops approximately 15%, delaying $200K-$500K/month in claim submissions. |
| **Connected Root Cause(s)** | B1.02 Coding quality decline, B6.04 Coding backlog |
| **Connected Metric(s)** | O01 Claims Processed per FTE, CD01 Coding Accuracy Rate, CD03 Coding Error Rate by Coder |

---

### OP-20: End-to-End Revenue Cycle Velocity

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | End-to-End Revenue Cycle Velocity Monitor |
| **What It Detects** | The total time from date of service to cash in bank is lengthening, even if individual stage metrics appear acceptable — the compound effect of small delays at each stage |
| **Detection Methodology** | Calculate end-to-end cycle time = bank_deposit_date - date_of_service for each paid claim. Compare to trailing 12-month average. Fire if average cycle time increases >5 days. Decompose by stage to identify which stages are contributing to the elongation. Also calculate: what percentage of revenue is collected within 30/60/90/120 days of DOS. |
| **Severity** | **Critical** if average cycle time >60 days; **Warning** if >45 days or increasing >5 days; **Info** if >35 days or any upward trend |
| **Recommended Action** | This is a composite diagnostic. If it fires, check each stage diagnostic (OP-02) for the specific bottleneck. If no single stage explains the lengthening: the compound effect of small delays across multiple stages is the cause. Set target cycle times for each stage and manage to them. Implement a revenue cycle velocity dashboard showing real-time stage-by-stage performance with red/yellow/green indicators. |
| **Revenue Impact if Unaddressed** | Each day of end-to-end cycle time increase delays all revenue by one day. On $100M annual revenue, each day = $274K in additional working capital required. A 10-day increase = $2.74M in cash flow impact. |
| **Connected Root Cause(s)** | All operational root causes (B6.01-B6.15), A2.01 ADTP increase |
| **Connected Metric(s)** | C05 Claim Lag Days, P11 Overall ADTP, A05 Days in AR, C24 Pipeline Dwell Time |

---

### OP-21: Patient Statement Effectiveness

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Patient Statement Response Rate Decline |
| **What It Detects** | The rate at which patients respond to (pay or contact about) balance statements is declining, indicating statement format, timing, or channel may be ineffective |
| **Detection Methodology** | Calculate statement response rate = (payments received + contacts made within 30 days of statement) / statements sent. Compare to trailing 6-month average. Fire if response rate drops >5 percentage points or falls below 15%. Track by statement channel (paper, email, text, portal). |
| **Severity** | **Critical** if response rate <10%; **Warning** if <15% or declining >5 points; **Info** if <20% |
| **Recommended Action** | Test statement format and channel effectiveness: (1) Add QR code for mobile payment. (2) Add text/email reminders in addition to paper. (3) Simplify statement language (reading level, clear balance due, clear due date). (4) Offer payment plan prominently on statement. (5) Test timing: statements sent within 7 days of ERA posting vs 30 days. (6) Include online payment portal link. Patients who do not respond to 3 statements should be escalated to phone outreach or collections. |
| **Revenue Impact if Unaddressed** | Each 5% decline in statement response rate on $2M in patient AR = $100K in additional self-pay aging toward bad debt. Digital statements cost $0.25-$0.50 vs $1.50-$3.00 for paper — also a cost optimization opportunity. |
| **Connected Root Cause(s)** | A1.07 Patient bad debt, B6.13 Collections not targeting high-propensity |
| **Connected Metric(s)** | A15 Patient Payment Rate, A17 Average Patient Balance |

---

### OP-22: Claim Status Inquiry Efficiency

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Claim Status Inquiry Volume and Efficiency |
| **What It Detects** | Excessive manual claim status inquiries — staff spending time checking claim status on payer portals or phone lines when this should be automated |
| **Detection Methodology** | Track claim status inquiry volume (276/277 transactions + manual portal checks + phone calls). Calculate status inquiries per claim. Fire if average exceeds 1.5 inquiries per claim or if manual inquiry volume exceeds automated inquiry volume. Calculate FTE hours consumed by status checking. |
| **Severity** | **Critical** if status inquiry consumes >2 FTE equivalents; **Warning** if >1 FTE; **Info** if manual exceeds automated |
| **Recommended Action** | Implement automated batch claim status inquiry (276/277 transactions) for all payers that support it. Schedule daily automated status checks for claims >14 days after submission. Eliminate manual portal checking for routine status — reserve manual inquiry for escalated claims only. Expected reduction: 70-80% of manual status inquiries can be automated. Calculate ROI: each manual status check = 5-15 minutes of staff time. |
| **Revenue Impact if Unaddressed** | Manual status checking is pure overhead — it does not accelerate payment, only informs. If 2 FTEs spend full time on status checking at $40K/year each, $80K/year is spent on a task that can be largely automated. Redirecting that FTE time to denial management or collections generates incremental revenue. |
| **Connected Root Cause(s)** | B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | O06 Touch Count per Claim, O01 Claims Processed per FTE |

---

### OP-23: Referral and Authorization Coordination Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Referral-to-Authorization Coordination Failure |
| **What It Detects** | Patients referred for specialty or procedural services where the referring provider's referral does not align with the authorization requirements, resulting in denials at the specialty level |
| **Detection Methodology** | Track referral receipt to auth status at the time of specialist visit. Fire if >10% of referred patients arrive without a valid referral on file or without required authorization. Calculate denial rate for referred patients vs self-referred. |
| **Severity** | **Critical** if referral/auth gap rate >15%; **Warning** if >10%; **Info** if >5% |
| **Recommended Action** | Implement referral-to-auth workflow: (1) When referral is received, auto-check if PA is required for the referred service + payer. (2) If PA required: initiate auth request immediately upon referral receipt. (3) If referral missing for HMO patient: contact PCP for referral before scheduling. (4) At scheduling confirmation: verify both referral and auth are on file. (5) Day before appointment: re-verify auth status. |
| **Revenue Impact if Unaddressed** | Referral/auth denials for specialist visits average $200-$500 per visit. If 100 visits/month are denied for missing referral/auth, $20K-$50K/month is at risk, with low appeal success rate (<25%). |
| **Connected Root Cause(s)** | B3.18 Missing referral, B3.07 Auth not obtained |
| **Connected Metric(s)** | E03 Prior Auth Obtained Rate, E04 Prior Auth Denial Rate |

---

### OP-24: Compliance Monitoring Dashboard

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue Cycle Compliance Risk Score |
| **What It Detects** | Aggregate compliance risk across the revenue cycle — combining over-coding risk, audit exposure, credit balance liability, timely refund compliance, and credentialing gaps into a single risk score |
| **Detection Methodology** | Calculate composite compliance score from: (1) Over-coding risk (CD-03). (2) Audit exposure (PR-10). (3) Credit balance aging (AC-12). (4) Timely refund compliance. (5) Credentialing currency (OP-10). (6) OIG Work Plan exposure. Score 0-100 (100 = highest risk). Fire if score >70. |
| **Severity** | **Critical** if compliance score >80; **Warning** if >60; **Info** if >40 |
| **Recommended Action** | For each contributing risk factor: deploy the specific diagnostic's recommended action. Conduct quarterly compliance review with compliance officer and legal counsel. Maintain audit-ready documentation. Implement self-audit program targeting high-risk areas. Track compliance score monthly — it should be trending downward. If upward: investigate which factors are driving the increase. |
| **Revenue Impact if Unaddressed** | Compliance failures result in recoupments ($100K-$2M per audit), penalties (up to $11K per false claim under FCA), exclusion risk, and corporate integrity agreement costs ($1M-$5M). Prevention cost is a fraction of enforcement cost. |
| **Connected Root Cause(s)** | B2.07 Prepayment review/audit |
| **Connected Metric(s)** | O12 Compliance Audit Findings, CD02 Coding Error Rate by Type |

---

### OP-25: Financial Assistance Screening Gap

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Financial Assistance Program Under-Utilization |
| **What It Detects** | Patients who likely qualify for financial assistance or charity care but are not being screened, resulting in bad debt that should be charity care (with potential 501(r) compliance implications for non-profit hospitals) |
| **Detection Methodology** | Cross-reference self-pay patients and patients with large balances against: zip code median income, eligibility for government programs, prior financial assistance approvals. Fire if financial assistance screening rate <90% for uninsured patients or if bad-debt-to-charity-care ratio exceeds 2:1. |
| **Severity** | **Critical** if screening rate <70% or 501(r) compliance risk for non-profit; **Warning** if <80%; **Info** if <90% |
| **Recommended Action** | Implement presumptive financial assistance screening using demographic and socioeconomic data. Train financial counselors on all available programs: Medicaid, marketplace, hospital charity care, community assistance. Screen every uninsured patient before service or within 30 days of discharge. For non-profit hospitals: 501(r) requires reasonable efforts to determine financial assistance eligibility before extraordinary collection actions. Document all screening activities. |
| **Revenue Impact if Unaddressed** | Financial assistance does not generate revenue — but improper bad debt collection from charity-eligible patients creates legal and regulatory exposure. For non-profits, 501(r) violations can jeopardize tax-exempt status. Converting bad debt to charity care also improves community benefit reporting. |
| **Connected Root Cause(s)** | A1.07 Patient bad debt |
| **Connected Metric(s)** | R17 Bad Debt, R18 Charity Care, E09 Self-Pay Percentage |

---

### OP-26: Cross-Departmental Handoff Failure

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Revenue Cycle Handoff Point Failure |
| **What It Detects** | Breakdowns at handoff points between departments (scheduling to registration, registration to clinical, clinical to coding, coding to billing, billing to collections) where information is lost or delayed |
| **Detection Methodology** | Track claim attributes at each handoff point. Calculate: (1) Information completeness at each handoff (are all required fields populated?). (2) Handoff timing (is the receiving department getting claims within SLA?). (3) Return rate (are items being sent back to the prior department for correction?). Fire if return rate >10% at any handoff or if information completeness <95%. |
| **Severity** | **Critical** if any handoff return rate >20%; **Warning** if >10%; **Info** if >5% or completeness <95% |
| **Recommended Action** | For each handoff with high return/error rates: (1) Define a handoff checklist — what must be complete before handoff. (2) Implement hard stops — the sending system cannot advance the claim until required elements are present. (3) Assign handoff accountability — one person owns each handoff point. (4) Measure and report handoff quality weekly. (5) Hold monthly cross-departmental meetings to address chronic handoff issues. |
| **Revenue Impact if Unaddressed** | Each handoff failure adds 3-7 days to claim cycle time and increases error risk. If 10% of 5,000 monthly claims have handoff failures adding 5 days each, the aggregate delay impact is $125K+ in working capital. |
| **Connected Root Cause(s)** | B6.15 No feedback loop, B6.07 Registration errors, B6.08 Charge capture gaps |
| **Connected Metric(s)** | C24 Pipeline Dwell Time, C23 Stage Drop-off Rate |

---

### OP-27: ABN (Advance Beneficiary Notice) Compliance

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | ABN Issuance Compliance for Medicare Patients |
| **What It Detects** | Medicare patients receiving non-covered services without a properly executed ABN, resulting in inability to bill the patient for the non-covered amount |
| **Detection Methodology** | Track Medicare denials for non-covered services (CO-96, CO-204). Cross-reference with ABN database. Fire if any Medicare non-covered denial lacks a signed ABN on file. Calculate: percentage of non-covered service encounters with proper ABN. Target: 100% for known non-covered services. |
| **Severity** | **Critical** if ABN compliance <80% or repeated non-covered denials without ABN; **Warning** if <90%; **Info** if <95% |
| **Recommended Action** | Implement ABN workflow: (1) Identify services likely to be non-covered before they are rendered (LCD/NCD screening). (2) Issue ABN with specific cost estimate and coverage determination. (3) Obtain patient signature. (4) Document in billing system so claim is submitted with GA modifier. (5) Train front desk and clinical staff on ABN requirements. Without ABN: provider absorbs the cost. With ABN: patient is responsible. |
| **Revenue Impact if Unaddressed** | Every non-covered Medicare service without an ABN is a 100% write-off. If 50 services/month at $300 avg lack ABNs = $15K/month in unrecoverable revenue. |
| **Connected Root Cause(s)** | B3.13 Non-covered service |
| **Connected Metric(s)** | D09 Denials by Category (Non-covered), R16 Write-off Amount |

---

### OP-28: Payer Portal Access and Utilization

| Field | Detail |
|-------|--------|
| **Diagnostic Name** | Payer Portal Access Monitoring |
| **What It Detects** | Staff unable to access payer portals due to expired credentials, locked accounts, or portal changes — creating delays in claim status checking, appeal filing, and auth requests |
| **Detection Methodology** | Track payer portal access attempts and failures. Fire if any top-20 payer portal is inaccessible for >24 hours or if failed login rate >10%. Also track: are all staff who need portal access properly credentialed? How many staff share login credentials (security and audit risk)? |
| **Severity** | **Critical** if any top-5 payer portal inaccessible >48 hours; **Warning** if >24 hours or shared credentials detected; **Info** if any access issue |
| **Recommended Action** | Maintain payer portal credential inventory: (1) Assign individual credentials for each staff member (no sharing). (2) Set calendar reminders for credential renewal. (3) When portal URL or login process changes: update documentation within 24 hours. (4) Maintain backup access method (phone, fax) for each payer. (5) If portal is down: contact payer IT and document for timely filing protection if claims are delayed. |
| **Revenue Impact if Unaddressed** | Portal inaccessibility delays auth requests, claim status checks, appeal filings, and eligibility verifications. A 48-hour portal outage for a major payer delays all active work for that payer, potentially affecting hundreds of claims. |
| **Connected Root Cause(s)** | B6.12 AR follow-up not prioritized |
| **Connected Metric(s)** | O05 Work Queue Aging, E05 Auth Turnaround Time |

---

## SUMMARY & CROSS-REFERENCE INDEX

### Total Diagnostic Items: 121

| Category | Count | Diagnostic IDs |
|----------|-------|----------------|
| 1. Revenue Health Diagnostics | 10 | RH-01 through RH-10 |
| 2. Denial Pattern Diagnostics | 21 | DP-01 through DP-21 |
| 3. Payment Flow Diagnostics | 12 | PF-01 through PF-12 |
| 4. AR & Collections Diagnostics | 12 | AC-01 through AC-12 |
| 5. Claims Pipeline Diagnostics | 13 | CP-01 through CP-13 |
| 6. Coding & Documentation Diagnostics | 12 | CD-01 through CD-12 |
| 7. Payer Relationship Diagnostics | 13 | PR-01 through PR-13 |
| 8. Operational Diagnostics | 28 | OP-01 through OP-28 |
| **TOTAL** | **121** | |

---

## APPENDIX A: SEVERITY MATRIX

| Severity | Definition | Response Time | Escalation |
|----------|-----------|---------------|------------|
| **Critical** | Active revenue loss >$50K/month or compliance risk or system failure | Within 24 hours | VP Revenue Cycle + CFO |
| **Warning** | Potential revenue risk >$20K/month or process degradation detected | Within 1 week | Director Revenue Cycle |
| **Info** | Trend detected, monitoring recommended, early warning | Monthly review | Manager-level awareness |

---

## APPENDIX B: DIAGNOSTIC-TO-ROOT-CAUSE CROSS-REFERENCE

Every diagnostic in this document connects to one or more root causes in Doc 2.
This cross-reference enables: "We detected this diagnostic. Here is WHY it is happening."

| Root Cause (Doc 2) | Diagnostics That Detect It |
|--------------------|-----------------------------|
| A1.01 Denial-driven revenue loss | RH-01, RH-05, RH-10, DP-01 through DP-21 |
| A1.02 Silent underpayment | RH-05, RH-08, PF-02, PF-08, PF-09, PF-10, PR-02, AC-11, DP-16 |
| A1.03 Timely filing write-offs | AC-03, CP-04, CP-07, CD-08, PR-13 |
| A1.04 Dropped charges | RH-04, OP-12 |
| A1.05 Coding downcoding | RH-03, RH-07, CD-02, CD-05, CD-06, CD-07 |
| A1.06 Unapplied payments | PF-01, PF-05, OP-08 |
| A1.07 Patient bad debt | RH-09, AC-04, AC-06, AC-07, AC-10, AC-11, OP-21, OP-25 |
| A1.08 Contract rate erosion | RH-07, PF-08, PR-01, PR-02, PR-09 |
| A1.09 Service line mix shift | RH-02, RH-10 |
| A1.10 Credentialing gaps | OP-10, PR-08 |
| A2.01 ADTP increase | PF-03, AC-02, AC-05, AC-08, AC-09, PR-07, OP-20 |
| A2.02 Payer float | PF-04, PF-10 |
| A2.03 AR aging acceleration | AC-01, AC-08 |
| A2.05 Payment plan defaults | AC-07 |
| A2.06 Claim resubmission cycle | PF-06, OP-03 |
| B1.01 Payer policy change | DP-05, DP-06, DP-17, OP-13 |
| B1.02 Coding quality decline | DP-02, DP-12, CD-01, CD-03, CD-06, CD-10, CD-11, CP-02, OP-19 |
| B1.03 Eligibility failure | DP-12, DP-19, OP-06 |
| B1.04 Auth breakdown | PR-04, OP-16, CP-11 |
| B1.05 CDI weakness | CD-05, DP-18 |
| B1.07 New service lines | DP-21 |
| B1.08 EDI errors | CP-03, CP-10, CP-12, OP-05, PR-12 |
| B1.10 Regulatory change | DP-02, DP-05, CD-09 |
| B2.01-B2.10 Payer-level causes | DP-01, DP-06, DP-17, DP-18, PR-01 through PR-13 |
| B3.01-B3.25 Claim-level causes | DP-02, DP-08, DP-09, DP-10, CP-05, CP-06, CP-13, CD-09, CD-10, CD-12 |
| B6.01-B6.15 Operational causes | OP-01 through OP-28 |

---

## APPENDIX C: DIAGNOSTIC-TO-METRIC CROSS-REFERENCE

Every diagnostic connects to one or more descriptive metrics from Doc 1.
This cross-reference enables: "This metric is abnormal. Here is the diagnostic."

| Metric (Doc 1) | Diagnostics That Use It |
|----------------|-----------------------------|
| R01-R09 Revenue metrics | RH-01, RH-02, RH-04, RH-07, RH-10, OP-12 |
| R10 CMI | RH-03, CD-02, CD-05, CD-07 |
| R11-R13 Collection rates | RH-01, RH-02, RH-05, RH-07, PF-10, PR-09 |
| R14-R18 Adjustments/Write-offs | RH-05, RH-08, RH-09, AC-03, AC-06, AC-11, OP-25, OP-27 |
| R19-R20 Revenue per RVU/encounter | RH-03, RH-07, CD-02, CD-06 |
| R21-R25 Cash flow | PF-01, PF-04, PF-10 |
| C01-C10 Claims status | CP-01 through CP-13, PR-12 |
| C11-C15 CRS metrics | CP-01, CP-02 |
| C16-C24 Pipeline metrics | OP-02, OP-20, OP-26, CP-07, CP-09 |
| D01-D06 Denial rates | DP-01 through DP-21 |
| D07-D19 Denial dimensions | DP-01 through DP-21, CD-09, CD-10, CD-12 |
| D20-D23 Denial matrices | DP-05, DP-06, DP-07 |
| D24-D32 Appeal metrics | PR-05, PR-11, DP-15, DP-20, OP-09, OP-17 |
| A01-A08 AR aging | AC-01, AC-02, AC-05, AC-08, AC-09 |
| A09-A17 Collections metrics | AC-04, AC-06, AC-10, OP-14, OP-21 |
| P01-P10 Payment metrics | PF-01 through PF-12, PR-06 |
| P11-P16 ADTP metrics | PF-03, PF-04, PR-07, AC-08 |
| B01-B12 Reconciliation | PF-01, PF-02, PF-08, PF-11, PF-12, PR-06, AC-12 |
| E01-E11 Patient access | OP-06, OP-07, OP-15, OP-16, OP-23, PR-04, DP-19 |
| CD01-CD08 Coding metrics | CD-01 through CD-12, CP-02, CP-13 |
| O01-O12 Operational metrics | OP-01 through OP-28, RH-06 |

---

## HOW TO USE THIS DOCUMENT

1. **Real-time monitoring:** Configure the NEXUS engine to run all 121 diagnostics on a scheduled basis (daily for Critical-capable diagnostics, weekly for Warning-capable, monthly for Info-only).

2. **Alert routing:** When a diagnostic fires, route the alert to the appropriate owner based on the recommended action.

3. **Prioritization:** When multiple diagnostics fire simultaneously, prioritize by: (a) Severity level (Critical first), (b) Revenue impact if unaddressed, (c) Speed to resolution (quick wins first for same-severity items).

4. **Root cause connection:** Use Appendix B to connect diagnostics to root causes (Doc 2) for deeper investigation.

5. **Metric connection:** Use Appendix C to connect diagnostics to descriptive metrics (Doc 1) for data validation.

6. **Continuous improvement:** Track diagnostic resolution rates monthly. A diagnostic that fires repeatedly without resolution indicates a systemic process failure — escalate to leadership.

---

*This document contains 121 diagnostic items across 8 categories. Each diagnostic includes detection methodology, severity classification, specific recommended action, revenue impact quantification, and cross-references to both root causes (Doc 2) and descriptive metrics (Doc 1). This is the actionable layer between "what happened" (Doc 1) and "why it happened" (Doc 2) — it tells you "what is currently wrong and what to do about it."*
