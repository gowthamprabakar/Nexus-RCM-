# NEXUS RCM BIBLE — DOCUMENT 5 OF 6
# AUTOMATION POSSIBILITIES
## "What can the system DO without human intervention — and what MUST stay human?"

> Last updated: 2026-03-22
> Authors: Marcus Chen (RCM SME), James Park (PM), Priya Sharma (ARCH)

---

## PURPOSE

This document lists EVERY automation the NEXUS RCM platform can implement.
Each automation is classified by:
- **Trigger**: What prediction or event fires it (references Doc 2-4)
- **Action**: What the system does
- **Confidence threshold**: Minimum confidence before automation fires
- **Human-in-the-loop**: Whether human approval is required
- **Risk level**: What happens if the automation is wrong

---

## AUTOMATION TIERS

| Tier | Description | Human Involvement | Examples |
|------|------------|-------------------|---------|
| **Tier 1: Full Auto** | System acts without human input | None — logged for audit | Eligibility re-check, scrubber edits, queue prioritization |
| **Tier 2: Auto-Draft + Approve** | System prepares action, human clicks approve | 1-click approval | Appeal letters, claim corrections, resubmissions |
| **Tier 3: Auto-Alert + Decide** | System alerts human with recommendation | Human makes decision | Payer escalation, contract disputes, write-off decisions |
| **Tier 4: Human-Only** | System surfaces information, human acts entirely | Full human action | Peer-to-peer calls, legal action, contract negotiations |

---

## SECTION 1: CLAIM LIFECYCLE AUTOMATIONS

### 1.1 Pre-Submission Automations

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-C01 | **Auto-eligibility verification** | Appointment scheduled | Run 270/271 eligibility check; flag if inactive/termed | Tier 1 | N/A — deterministic |
| AU-C02 | **Auto re-verify eligibility 24hr pre-service** | 24 hours before appointment | Re-run 270/271; alert if coverage changed | Tier 1 | N/A — deterministic |
| AU-C03 | **Auto-trigger prior auth request** | Procedure scheduled + payer PA list match | Initiate PA request with clinical summary auto-populated | Tier 2 | Match confirmed |
| AU-C04 | **Auto-insurance discovery** | Self-pay or coverage terminated | Run insurance discovery search across payer databases | Tier 1 | N/A — search, not action |
| AU-C05 | **CRS auto-hold** | CRS score > 7.0 | Hold claim from batch submission; route to manual review queue | Tier 1 | CRS model AUC > 0.85 |
| AU-C06 | **Auto-scrubber rule application** | Claim enters scrub queue | Apply NCCI edits, modifier validation, diagnosis-procedure crosswalk, payer-specific rules | Tier 1 | Rules deterministic |
| AU-C07 | **Auto-populate auth on claim** | Claim for authorized procedure | Pull auth number from auth system, attach to claim 837 | Tier 1 | Auth record match |
| AU-C08 | **Auto-patient cost estimate** | Appointment scheduled + benefits verified | Calculate estimated OOP based on benefits, deductible status, contracted rates | Tier 1 | ±$50 target |
| AU-C09 | **Pre-submission payer rule check** | Claim ready for submission | Validate claim against payer-specific billing rules (documentation, auth, COB) | Tier 1 | Rules deterministic |
| AU-C10 | **Auto-flag high-denial-risk claims** | PR-D01 denial probability > 40% | Flag claim, surface specific risk factors, recommend corrections before submission | Tier 2 | PR-D01 AUC > 0.85 |

### 1.2 Submission Automations

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-C11 | **Auto-batch and transmit clean claims** | CRS ≤ 5.0 + all edits passed | Auto-release to clearinghouse in nightly batch | Tier 1 | CRS model validated |
| AU-C12 | **Auto-monitor 277CA acknowledgments** | Claim submitted | Check for payer acknowledgment within 48 hours; alert if none received | Tier 1 | Deterministic |
| AU-C13 | **Auto-resubmit rejected claims** | 277CA rejection with correctable error | Auto-correct (e.g., format, missing field) and resubmit within 24 hours | Tier 2 | Error type = auto-correctable |
| AU-C14 | **Timely filing countdown** | Claim submitted | Track days remaining to filing deadline; escalate at 30/14/7 days remaining | Tier 1 | Deterministic |

### 1.3 Post-Adjudication Automations

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-C15 | **Auto-post ERA payments** | ERA/835 received | Parse ERA, match to claims, post payments, adjustments, patient responsibility | Tier 1 | Match confidence > 98% |
| AU-C16 | **Auto-flag underpayments** | Payment posted < contract rate | Alert contract team with: claim, paid amount, contract rate, variance | Tier 1 | Contract rate loaded |
| AU-C17 | **Auto-route denial to correct queue** | Denial received with CARC | Route to: coding queue (CO-4/16/97), auth queue (CO-197), eligibility queue (CO-27/29), clinical queue (CO-50) | Tier 1 | CARC mapping deterministic |
| AU-C18 | **Auto-prioritize denial work queue** | Denials in queue | Sort by: ($ amount × appeal win probability × days remaining to deadline) | Tier 1 | PR-D05 model |
| AU-C19 | **Auto-draft appeal letter** | Denial with PR-D05 win probability > 50% | Generate appeal letter with: patient info, claim info, clinical evidence summary, specific payer criteria addressed | Tier 2 | PR-D05 AUC > 0.80 |
| AU-C20 | **Auto-resubmit correctable denials** | Denial CARC indicates correctable error (demographics, modifier, POS) | Auto-correct claim + resubmit without human review | Tier 1 | Error type confirmed correctable + historical success > 90% |
| AU-C21 | **Auto-escalate to peer-to-peer** | CO-50 denial + historical P2P success > 65% for this payer+DRG | Generate P2P request with: scheduling instructions, talking points, clinical summary | Tier 2 | Historical P2P data available |

---

## SECTION 2: PAYMENT & RECONCILIATION AUTOMATIONS

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-P01 | **Auto-ERA-to-bank matching** | Bank deposit received | Match EFT to ERA using trace number (primary) + amount/date (secondary) | Tier 1 | Trace number match or fuzzy match confidence > 95% |
| AU-P02 | **Auto-flag ghost payments** | Bank deposit with no ERA match within 72 hours | Alert cash management: unmatched deposit, possible overpayment/compliance risk | Tier 3 | No match found |
| AU-P03 | **Auto-flag ERA-bank variance** | ERA-bank gap > $50 per batch | Alert with: batch details, variance amount, variance %, payer float days | Tier 3 | Deterministic |
| AU-P04 | **Auto-calculate ADTP** | Payment posted | Update rolling 90-day ADTP per payer × procedure type × POS | Tier 1 | Deterministic calculation |
| AU-P05 | **Auto-ADTP anomaly alert** | ADTP exceeds baseline + 1.5σ for any payer | Alert: "Humana ADTP increased from 32 to 41 days — investigate" | Tier 3 | Statistical threshold |
| AU-P06 | **Auto-contract variance report** | Monthly cycle | Generate per-payer: CPTs with paid < contract, total underpayment $, trend | Tier 1 | Contract rates loaded |
| AU-P07 | **Auto-underpayment appeal filing** | Contract variance confirmed + amount > $100 per claim | Generate underpayment appeal with: claim, ERA evidence, contract rate, variance | Tier 2 | Contract rate confirmed |
| AU-P08 | **Auto-unapplied payment matching** | Unapplied payment aging > 14 days | Attempt match: payer + amount ± 5% + date ± 14 days against open claims | Tier 2 | Match confidence > 90% |
| AU-P09 | **Auto-patient statement generation** | ERA posted + patient responsibility determined | Generate patient statement with: service details, insurance paid, patient owes, payment options | Tier 1 | ERA posted successfully |
| AU-P10 | **Auto-payment plan setup** | Patient balance > $500 + propensity score > 60% | Offer pre-approved payment plan via patient portal; terms based on balance and propensity | Tier 2 | Propensity model validated |

---

## SECTION 3: COLLECTIONS AUTOMATIONS

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-K01 | **Auto-prioritize collections queue** | Daily queue refresh | Sort by: propensity-to-pay score × balance × aging × payer type | Tier 1 | PR-P04 model |
| AU-K02 | **Auto-generate payer call script** | Collector opens account | Generate payer-specific script with: account details, claim history, payer behavior patterns, negotiation points | Tier 1 | Account data complete |
| AU-K03 | **Auto-send patient balance reminders** | Patient balance > $50 + no payment in 30 days | SMS/email reminder with balance, portal link, payment plan option | Tier 1 | Patient contact info + consent |
| AU-K04 | **Auto-escalate aging accounts** | AR > 90 days + no response to 3 outreach attempts | Escalate to supervisor queue; recommend next action: final notice, collections agency, write-off review | Tier 3 | Contact history documented |
| AU-K05 | **Auto-charity care screening** | Patient balance > $1,000 + propensity < 20% + no insurance | Screen against charity care income thresholds; auto-populate application if eligible | Tier 2 | Financial data available |
| AU-K06 | **Auto-document collection activities** | Call completed / letter sent / portal interaction | Log activity with: date, method, outcome, next step, follow-up date | Tier 1 | Activity capture |
| AU-K07 | **Auto-promise-to-pay tracking** | Patient makes payment promise | Set follow-up date, auto-check if payment received by date, escalate if broken promise | Tier 1 | Promise recorded |

---

## SECTION 4: OPERATIONAL AUTOMATIONS

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-O01 | **Auto-work-queue load balancing** | Work queue imbalanced across staff | Redistribute tasks based on: staff capacity, skill level, task complexity | Tier 1 | Capacity model |
| AU-O02 | **Auto-credential expiration alert** | Provider credential approaching 120/90/60/30 day expiry | Alert credentialing team; auto-initiate renewal paperwork if template available | Tier 1 | Deterministic |
| AU-O03 | **Auto-payer rule update notification** | Payer policy bulletin detected or denial pattern shift detected (PR-D08) | Alert: billing team, coding team, CDI team with: what changed, which CPTs affected, effective date | Tier 2 | PR-D08 detection confidence > 90% |
| AU-O04 | **Auto-coding queue prioritization** | Coding backlog + claims approaching filing deadline | Re-prioritize coding queue: claims within 14 days of filing deadline → top priority | Tier 1 | Deterministic |
| AU-O05 | **Auto-generate root cause report** | Monthly cycle or on-demand | Generate root cause decomposition: revenue shortfall → contributing factors → % weights → recommended actions | Tier 1 | Doc 2 methodology |
| AU-O06 | **Auto-denial trend alert** | Denial rate for any payer × CARC × CPT exceeds 2σ from baseline | Real-time alert to denial manager with: metric, current rate, baseline, deviation, possible causes | Tier 1 | Statistical threshold |
| AU-O07 | **Auto-forecast recalibration** | New week of data available | Recalculate all forecasts (PR-R01 through PR-R08) with updated actuals | Tier 1 | Automated |
| AU-O08 | **Auto-dashboard refresh** | New data posted/reconciled | All descriptive metrics (Doc 1) refresh in real-time or near-real-time | Tier 1 | Data pipeline |

---

## SECTION 5: INTELLIGENCE AUTOMATIONS (AI-Driven)

| # | Automation | Trigger | Action | Tier | Confidence Req |
|---|-----------|---------|--------|------|---------------|
| AU-I01 | **Auto-root-cause attribution** | New denial received | Run 7-step root cause traversal (Doc 2, B3); assign primary/secondary/tertiary with weights | Tier 1 | Engine validated on 10K+ claims |
| AU-I02 | **Auto-payer behavior fingerprint update** | New ERA/denial data received | Update per-payer: denial rate by CPT, ADTP, underpayment rate, float days, appeal success rate | Tier 1 | Continuous learning |
| AU-I03 | **Auto-anomaly explanation** | Any metric exceeds 2σ threshold | Generate plain-English explanation: what changed, when, likely cause, recommended action | Tier 2 | Root cause engine + LLM |
| AU-I04 | **Auto-feedback loop update** | Appeal resolved (win or loss) | Update root cause weights, appeal win rate model, CRS components, payer fingerprint | Tier 1 | Outcome data |
| AU-I05 | **Auto-prevention rule generation** | Root cause identified 3+ times for same payer × CARC × CPT | Propose new prevention rule: "Add pre-submission check for [specific condition]" | Tier 2 | Recurrence pattern confirmed |
| AU-I06 | **Auto-claim scoring (CRS) update** | New denial/payment data | Retrain CRS model weekly with latest outcome data | Tier 1 | Model performance monitored |

---

## SECTION 6: WHAT MUST STAY HUMAN (NEVER AUTOMATE)

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

## AUTOMATION IMPACT MODEL

```
CURRENT STATE (Manual):
  Cost to collect:                    4.8%
  Claims per FTE per day:             45
  Average denial resolution time:     47 days
  First-pass denial rate:             12.3%
  AR > 90 days:                       24%

TARGET STATE (With Automation Tiers 1-2):
  Cost to collect:                    3.1%  (↓35%)
  Claims per FTE per day:             78    (↑73%)
  Average denial resolution time:     18 days (↓62%)
  First-pass denial rate:             6.8%  (↓45%)
  AR > 90 days:                       11%   (↓54%)

Estimated annual impact for $50M practice:
  Revenue recovered through automation:    $2.4M - $3.8M
  Operational cost reduction:              $840K - $1.2M
  Total value:                             $3.2M - $5.0M annually
```

---

## TOTAL AUTOMATIONS: 56 (+ 10 never-automate items)

- Claim lifecycle: 21
- Payment & reconciliation: 10
- Collections: 7
- Operational: 8
- Intelligence/AI: 6
- Never automate: 10
