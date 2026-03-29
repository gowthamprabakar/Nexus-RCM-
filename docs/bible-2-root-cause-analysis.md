# NEXUS RCM BIBLE -- DOCUMENT 2 OF 6
# ROOT CAUSE ANALYSIS -- REVENUE + DENIAL FOCUSED
## "WHY did revenue leak, WHY did this claim fail, and HOW do we trace both to the dollar?"

> Last updated: 2026-03-22
> Author: Marcus Chen (20-year RCM veteran)
> Revision: COMPLETE REWRITE per client feedback -- "nothing about revenues, nothing directing toward denials WHY"
> Total root cause items in this document: 160+

---

## HOW TO USE THIS DOCUMENT

This document operates at TWO levels:

**LEVEL 1 -- CLAIM-LEVEL ROOT CAUSE**: For any single denied claim, you can look up the CARC code, understand what the payer is really saying, identify the actual root cause from experience, see the typical decomposition of fault, and follow the resolution path.

**LEVEL 2 -- SYSTEM/REVENUE-LEVEL ROOT CAUSE**: For any revenue shortfall, cash flow problem, denial trend, or operational failure, you can identify the systemic root cause, the data signals to investigate, the multi-factor decomposition, and the dollar impact.

Every item connects to revenue. Every item directs toward WHY.

---

# ============================================================
# LEVEL 1: CLAIM-LEVEL ROOT CAUSE
# "Why did THIS claim fail?"
# ============================================================

For each CARC code, we document five things:
1. **What the payer is saying** -- the literal meaning of the code
2. **What the ACTUAL root cause usually is** -- from 20 years of working denials
3. **Root cause decomposition** -- percentage split across coder error, payer policy, documentation gap, billing rule, and bad faith
4. **Revenue impact calculation** -- how to measure what this code costs you
5. **Resolution path** -- how to fix this claim and prevent recurrence

---

## CO (CONTRACTUAL OBLIGATION) CODES

These are the most dangerous denial family. CO means the payer is saying YOU owe the adjustment -- not the patient, not another payer. Every CO denial is money the payer believes they do not owe you. Most of these are recoverable if you understand the real root cause.

---

### CO-4: Procedure Code Inconsistent with Modifier Used

**What the payer is saying**: "You billed a modifier that does not make sense with this procedure code. The modifier contradicts the procedure, or this modifier is not valid for this CPT."

**What the ACTUAL root cause usually is**: In 20 years, CO-4 is almost always one of three things. First, modifier 25 billed on an E&M when the payer does not see a separately identifiable service in the documentation. Second, modifier 59 (or X-modifiers XE/XS/XP/XU) billed to bypass an NCCI edit but without documentation supporting a distinct service. Third, bilateral modifier 50 used when the payer expects two line items with RT/LT instead. The coder is often doing what they were taught -- the problem is that payer-specific modifier rules differ from CPT guidelines, and nobody updated the scrubber.

**Root cause decomposition**:
- Coder error: 35% -- Modifier applied reflexively without confirming documentation supports it
- Payer policy: 30% -- Payer has proprietary modifier rules that differ from CPT standard (e.g., UHC requires XE/XS instead of 59; Aetna requires modifier 25 documentation threshold higher than AMA guideline)
- Documentation gap: 20% -- Physician note does not clearly document the distinct/separate service that justifies the modifier
- Billing rule: 10% -- Claim scrubber did not flag the invalid modifier-procedure combination
- Bad faith: 5% -- Payer using CO-4 as a catch-all to slow payment on legitimate claims

**Revenue impact calculation**:
```
Annual CO-4 denial volume: COUNT(remits WHERE carc = '4' AND group_code = 'CO')
Dollar impact: SUM(denied_amount WHERE carc = '4' AND group_code = 'CO')
Recovery rate: typically 55-70% on appeal if documentation supports modifier use
Net loss: denied_amount x (1 - recovery_rate)
Cost to recover: avg_appeal_cost ($35-65/claim) x appeal_volume
True cost: net_loss + cost_to_recover
```

**Resolution path**:
1. Pull the operative/procedure note -- does it document a distinct service?
2. Check payer-specific modifier policy -- does this payer accept modifier 59 or require X-modifiers?
3. If documentation supports: appeal with highlighted clinical documentation
4. If documentation does not support: write off, flag coder for education
5. Prevention: update claim scrubber with payer-specific modifier rules; create modifier decision tree by payer

---

### CO-11: Diagnosis Inconsistent with Procedure

**What the payer is saying**: "The diagnosis code you submitted does not support the procedure you billed. The ICD-10 code does not justify the CPT code."

**What the ACTUAL root cause usually is**: CO-11 is one of the most frustrating denials because it is frequently wrong. The payer's automated edits compare the DX to the CPT against their internal coverage determination database. In my experience, 40% of the time the diagnosis actually does support the procedure but the payer's edit database is outdated or overly restrictive. Another 30% of the time the coder selected a non-specific ICD-10 code (e.g., R10.9 unspecified abdominal pain) when a more specific code (e.g., K35.80 acute appendicitis) would have linked correctly. The remaining 30% is genuine mismatch -- wrong DX on the claim.

**Root cause decomposition**:
- Coder error: 30% -- Wrong DX selected, or DX not coded to highest specificity
- Payer policy: 25% -- Payer's DX-to-CPT mapping is more restrictive than CMS guidelines
- Documentation gap: 25% -- Physician documented symptoms but not the definitive diagnosis that supports the procedure
- Billing rule: 15% -- Claim scrubber does not have current LCD/NCD DX-CPT mapping
- Bad faith: 5% -- Payer knows the DX supports the procedure but their edit fires anyway

**Revenue impact calculation**:
```
Annual CO-11 volume: COUNT(remits WHERE carc = '11')
Dollar impact: SUM(denied_amount WHERE carc = '11')
Recovery rate: 60-75% on appeal with correct DX or supporting documentation
Preventable rate: 70% if claim scrubber has current DX-CPT mapping
Annual preventable loss: denied_amount x 0.70 x (1 - recovery_rate)
```

**Resolution path**:
1. Review clinical documentation -- is there a more specific/accurate DX?
2. Check LCD/NCD -- does CMS consider this DX-CPT combination covered?
3. If yes, appeal with LCD/NCD citation and clinical documentation
4. If DX was wrong, correct and resubmit (check timely filing)
5. Prevention: implement pre-submission DX-CPT validation against payer-specific edit files

---

### CO-16: Missing Information / Claim Lacks Information

**What the payer is saying**: "Your claim is missing required data elements. We cannot process it as submitted."

**What the ACTUAL root cause usually is**: CO-16 is the payer's junk drawer. They throw everything into CO-16 when they do not want to be specific. In reality, CO-16 paired with a RARC tells you the real problem. MA04 means missing subscriber ID. N479 means missing rendering provider. N518 means missing prior auth number. Without reading the RARC, CO-16 is useless. The actual root cause is almost always a registration or billing workflow gap -- the data existed somewhere in your system but did not make it onto the 837.

**Root cause decomposition**:
- Coder error: 10% -- Missing procedure codes or DX codes
- Payer policy: 15% -- Payer requires data elements beyond ANSI 837 standard
- Documentation gap: 10% -- Clinical documentation missing elements the payer needs
- Billing rule: 50% -- Claim form not populated correctly; missing fields on 837; clearinghouse stripping data
- Bad faith: 15% -- Payer using CO-16 generically to force rework and delay payment

**Revenue impact calculation**:
```
Annual CO-16 volume: COUNT(remits WHERE carc = '16')
Dollar impact: SUM(denied_amount WHERE carc = '16')
Recovery rate: 85-95% (these are almost always correctable)
Cost to rework: avg_rework_cost ($12-25/claim) x volume
True cost: rework_cost + (denied_amount x (1 - recovery_rate)) + opportunity cost of delayed payment
```

**Resolution path**:
1. Read the RARC -- this tells you WHAT is missing
2. Check 837 against payer's companion guide -- what data element was expected?
3. Correct and resubmit
4. Prevention: map every CO-16 RARC to a specific 837 field; build validation rules

---

### CO-18: Duplicate Claim/Service

**What the payer is saying**: "We already processed this claim or a claim for the same service for this patient on this date."

**What the ACTUAL root cause usually is**: True duplicates account for maybe 40% of CO-18 denials. The other 60% are false duplicates where the payer's matching algorithm is too aggressive. Same patient, same date, but legitimately different services (bilateral procedures, multiple surgical sites, repeat labs for monitoring). The payer's system matches on patient + date + CPT and calls it a duplicate without looking at modifiers, different anatomical sites, or clinical necessity for repeat services. This is one of the most common bad-faith denial patterns I have seen in 20 years.

**Root cause decomposition**:
- Coder error: 15% -- Claim was actually submitted twice due to billing workflow error
- Payer policy: 25% -- Payer's duplicate detection is overly aggressive
- Documentation gap: 10% -- Documentation does not clearly show distinct services
- Billing rule: 20% -- System did not prevent actual duplicate submission; or modifiers not applied to distinguish services
- Bad faith: 30% -- Payer knows the services are distinct but their auto-adjudication flags them as duplicates

**Revenue impact calculation**:
```
Annual CO-18 volume: COUNT(remits WHERE carc = '18')
True duplicates: estimate 40% of CO-18 volume (verify by checking original claim payment status)
False duplicates: 60% of CO-18 volume (these are recoverable revenue)
Dollar impact of false duplicates: SUM(denied_amount WHERE carc = '18') x 0.60
Recovery rate on false duplicates: 75-85% on appeal
Net loss: false_duplicate_amount x (1 - recovery_rate) + appeal_cost
```

**Resolution path**:
1. Check: was the original claim paid? If yes and this is truly duplicate, write off
2. If original claim was also denied or this is a distinct service, appeal
3. Include modifiers, op notes showing different sites, clinical orders for repeat services
4. Prevention: implement duplicate claim detection BEFORE submission; distinguish legitimate same-day services with proper modifiers

---

### CO-22: Coordination of Benefits (COB)

**What the payer is saying**: "This patient has other insurance. We believe we are not the primary payer, or the primary payer has not adjudicated first."

**What the ACTUAL root cause usually is**: COB denials are almost always a front-end registration problem. The patient told your registration desk about their insurance, but either (a) the patient did not disclose a second insurance, (b) the birthday rule was not applied correctly for dependent children, (c) the MSP questionnaire was not completed for Medicare patients, or (d) the primary payer paid but you submitted to the secondary before posting the primary ERA. In 20 years, I have never seen a COB denial that could not have been prevented at registration if the right questions were asked.

**Root cause decomposition**:
- Coder error: 0% -- COB has nothing to do with coding
- Payer policy: 20% -- Payer databases have stale COB information from other payers
- Documentation gap: 5% -- Patient did not disclose other coverage
- Billing rule: 60% -- Registration did not capture COB correctly; primary ERA not posted before secondary submission; wrong payer order on claim
- Bad faith: 15% -- Payer claiming patient has other coverage based on stale data to avoid payment

**Revenue impact calculation**:
```
Annual CO-22 volume: COUNT(remits WHERE carc = '22')
Dollar impact: SUM(denied_amount WHERE carc = '22')
Recovery rate: 80-90% once correct payer order is established
Time cost: COB resolution adds 30-60 days to payment cycle
ADTP impact: COB denials add avg 45 days to ADTP for affected claims
Cash flow cost: denied_amount x (45/365) x cost_of_capital_rate
```

**Resolution path**:
1. Verify COB with patient -- do they have other insurance?
2. Apply birthday rule, MSP rules, or employer group rules
3. If this payer IS primary, appeal with COB documentation
4. If this payer is secondary, submit to primary first, then resubmit with primary EOB
5. Prevention: real-time eligibility check that returns COB information; MSP questionnaire at every Medicare registration

---

### CO-24: Charges Covered Under Capitation/Managed Care Plan

**What the payer is saying**: "This service is included in the capitated rate we already pay. You cannot bill fee-for-service for a capitated service."

**What the ACTUAL root cause usually is**: Capitation denials come from three sources. First, the billing system does not know which services are capitated vs. carved out for a specific payer contract. Second, the payer changed the cap sheet (services included in capitation) and nobody updated your billing rules. Third, the patient's plan moved from fee-for-service to capitated and registration did not catch it. This is a contract management problem, not a coding problem. In my experience, about 20% of CO-24 denials are incorrect -- the service IS carved out of the cap but the payer's system has the wrong cap sheet loaded.

**Root cause decomposition**:
- Coder error: 5% -- Coding to wrong revenue code that triggers cap logic
- Payer policy: 40% -- Payer cap sheet is complex and changes without notice
- Documentation gap: 0%
- Billing rule: 45% -- Billing system does not have cap/carve-out logic by payer by service
- Bad faith: 10% -- Payer including services in cap that were negotiated as carve-outs

**Revenue impact calculation**:
```
Annual CO-24 volume: COUNT(remits WHERE carc = '24')
Incorrect CO-24s (carved-out services denied as capitated): estimate 20% of volume
Dollar impact of incorrect denials: SUM(denied_amount WHERE carc = '24') x 0.20
True capitated services billed FFS (should not have been billed): 80% of volume
Rework cost for true cap claims: volume x 0.80 x avg_rework_cost
```

**Resolution path**:
1. Check contract -- is this service capitated or carved out?
2. If carved out, appeal with contract language
3. If capitated, write off and flag billing system
4. Prevention: build cap sheet logic into billing system by payer-plan; flag capitated patients at registration

---

### CO-27: Expenses Incurred After Coverage Terminated

**What the payer is saying**: "The patient was not covered on the date of service. Their coverage ended before this date."

**What the ACTUAL root cause usually is**: This is a pure front-end failure. The patient had coverage when they scheduled the appointment but lost it before the service date. Maybe they changed jobs, aged off a parent's plan, or their employer switched carriers. Real-time eligibility verification at the time of service would have caught this 95% of the time. The other 5% is retroactive termination where the payer terminates coverage retroactively (which is illegal in many states but payers still do it, especially with COBRA and marketplace plans).

**Root cause decomposition**:
- Coder error: 0%
- Payer policy: 10% -- Retroactive termination; payer did not update eligibility files timely
- Documentation gap: 0%
- Billing rule: 80% -- Eligibility not verified on date of service; stale eligibility data used
- Bad faith: 10% -- Retroactive termination after claims are submitted

**Revenue impact calculation**:
```
Annual CO-27 volume: COUNT(remits WHERE carc = '27')
Dollar impact: SUM(denied_amount WHERE carc = '27')
Shift to patient responsibility: 80% of these become self-pay
Patient collection rate on unexpected self-pay: typically 15-25%
Net revenue loss: denied_amount x (1 - 0.20) = 80% loss if no other coverage found
Prevention value: denied_amount x 0.95 (95% catchable with real-time elig)
```

**Resolution path**:
1. Verify: was coverage actually terminated? Run real-time eligibility
2. If retroactive termination, check state law -- may be appealable
3. If legitimately terminated, check for other coverage (spouse plan, marketplace, Medicaid)
4. If no coverage, bill patient -- but expected recovery is low
5. Prevention: real-time eligibility verification within 24 hours of service for scheduled patients; day-of verification for walk-ins

---

### CO-29: Time Limit for Filing Has Expired

**What the payer is saying**: "You submitted this claim after our filing deadline. We will not pay it."

**What the ACTUAL root cause usually is**: CO-29 is the most expensive unrecoverable denial in RCM. Once timely filing expires, the money is gone -- you cannot appeal, you cannot bill the patient, you just lose the revenue. The root cause is always an internal process failure. Either the claim sat in a work queue too long, the coding backlog pushed submission past the deadline, a rejected claim was not corrected and resubmitted timely, or nobody tracked filing deadlines by payer (which vary from 90 days to 365 days). In 20 years, I have seen organizations lose millions annually to timely filing because they did not have a payer-specific filing deadline tracker with countdown alerts.

**Root cause decomposition**:
- Coder error: 15% -- Coding backlog delayed claim submission
- Payer policy: 10% -- Payer has unusually short filing window (e.g., 90 days for some Medicaid MCOs)
- Documentation gap: 5% -- Waiting for physician to complete documentation
- Billing rule: 65% -- No filing deadline tracking; rejected claims not reworked timely; AR follow-up did not escalate approaching deadlines
- Bad faith: 5% -- Payer claiming shorter filing window than contract states

**Revenue impact calculation**:
```
Annual CO-29 volume: COUNT(remits WHERE carc = '29')
Dollar impact: SUM(denied_amount WHERE carc = '29')
Recovery rate: NEAR ZERO -- this is almost never recoverable
Prevention value: THIS IS THE HIGHEST-ROI PREVENTION TARGET IN ALL OF RCM
Every dollar of CO-29 denied is a dollar permanently lost
Annual CO-29 loss is 100% preventable with proper filing deadline management
```

**Resolution path**:
1. Check: does your contract specify a different filing limit than the payer claims?
2. If yes, appeal with contract language showing correct filing window
3. If the payer changed filing windows, check effective date vs. your submission date
4. If legitimately late: write off -- this money is gone
5. Prevention: payer-specific filing deadline dashboard with 30/15/7 day countdown alerts; daily report of claims approaching any payer's filing deadline

---

### CO-45: Contractual Adjustment (Charges Exceed Fee Schedule)

**What the payer is saying**: "We are paying based on our contracted/fee schedule rate. The difference between your billed charges and our allowed amount is a contractual write-off."

**What the ACTUAL root cause usually is**: CO-45 is NOT a denial. It is a contractual adjustment and is expected on every single claim where your charges exceed the payer's fee schedule. HOWEVER -- and this is critical -- CO-45 is where silent underpayments hide. If the payer posts a CO-45 adjustment that is LARGER than it should be based on your contract, they are underpaying you and calling it a contractual adjustment. In 20 years, I estimate that 8-12% of CO-45 adjustments are larger than they should be, representing systematic underpayment. Most organizations never catch this because they treat all CO-45 as "expected."

**Root cause decomposition**:
- Coder error: 0%
- Payer policy: 60% -- This is the normal contractual write-off (expected)
- Documentation gap: 0%
- Billing rule: 10% -- Charges may be set too low, leaving money on the table
- Bad faith: 30% -- OF THE UNEXPECTED PORTION: payer applying wrong fee schedule, wrong contract tier, expired rates, or bundling logic that reduces the allowed amount

**Revenue impact calculation**:
```
Expected CO-45 per claim: billed_charges - contracted_rate = expected_adjustment
Actual CO-45 per claim: from ERA
Variance per claim: actual_CO45 - expected_CO45
If variance > 0: payer underpaid by that amount
Annual underpayment: SUM(variance WHERE variance > 0 AND carc = '45')
THIS IS THE SINGLE LARGEST HIDDEN REVENUE LEAK IN MOST ORGANIZATIONS
Typical finding: 2-5% of net revenue is being silently underpaid via inflated CO-45
```

**Resolution path**:
1. Compare CO-45 amount to expected contractual adjustment per your contract
2. If CO-45 is larger than expected: underpayment -- dispute with contract reference
3. Build automated contract variance monitoring: flag every CO-45 that exceeds expected
4. Prevention: load ALL payer fee schedules into payment variance engine; auto-flag any CO-45 that deviates more than $5 from expected

---

### CO-50: Medical Necessity (Non-covered as Not Medically Necessary)

**What the payer is saying**: "Based on the information submitted, this service was not medically necessary."

**What the ACTUAL root cause usually is**: CO-50 is the most subjective and most contested denial code in all of RCM. The payer is saying the clinical documentation does not support the medical necessity of the service. In reality, three things are happening. First, 40% of the time, the physician's documentation is genuinely insufficient -- they performed a medically necessary service but did not document the severity, failed conservative treatment, functional impairment, or clinical decision-making that justifies it. Second, 35% of the time, the payer is applying proprietary medical necessity criteria (like their own version of InterQual or Milliman) that are more restrictive than CMS guidelines or published medical literature. Third, 25% of the time, the payer is using CO-50 as a strategy to delay and discourage payment on expensive procedures, knowing that many providers will not appeal.

**Root cause decomposition**:
- Coder error: 5% -- Wrong procedure code selected that does not match documentation
- Payer policy: 35% -- Payer's medical necessity criteria are more restrictive than industry standard
- Documentation gap: 40% -- Clinical documentation does not articulate necessity clearly
- Billing rule: 5% -- Missing required clinical data elements on claim (e.g., last menstrual period for pregnancy-related services)
- Bad faith: 15% -- Payer using CO-50 to discourage high-cost claims; auto-denying and hoping providers do not appeal

**Revenue impact calculation**:
```
Annual CO-50 volume: COUNT(remits WHERE carc = '50')
Dollar impact: SUM(denied_amount WHERE carc = '50')
CO-50 claims tend to be HIGH DOLLAR (surgeries, advanced imaging, inpatient stays)
Average CO-50 claim value is typically 3-5x average claim value
Recovery rate on appeal: 55-65% (higher with peer-to-peer review)
Peer-to-peer overturn rate: 70-80%
Net loss: denied_amount x (1 - recovery_rate)
Annual CDI program ROI: reduction_in_CO50_denials x avg_claim_value
```

**Resolution path**:
1. Review clinical documentation -- does it articulate medical necessity?
2. Check payer's coverage determination -- what criteria are they using?
3. If documentation supports necessity: appeal with clinical evidence, cite published guidelines
4. Request peer-to-peer review -- this has the highest overturn rate
5. If documentation is insufficient: engage CDI for retrospective query to physician
6. Prevention: pre-service medical necessity screening; CDI concurrent review; payer-specific documentation templates

---

### CO-96: Non-Covered Charge

**What the payer is saying**: "This service/procedure is not covered under the patient's benefit plan."

**What the ACTUAL root cause usually is**: CO-96 means the service is excluded from the patient's specific plan. This is different from CO-50 (not medically necessary) -- CO-96 means the plan simply does not cover this category of service at all. Common examples: cosmetic procedures, experimental treatments, certain durable medical equipment, or services excluded by a specific employer plan's benefit design. The root cause is almost always a pre-service failure -- nobody checked whether the patient's specific plan covers this service before it was rendered. In 20 years, I have seen CO-96 denials range from $500 hearing aids to $200K transplants that should have been verified before the patient was scheduled.

**Root cause decomposition**:
- Coder error: 10% -- Service coded to a CPT that maps to a non-covered benefit category when an alternative code exists
- Payer policy: 40% -- Employer/plan excludes this service category
- Documentation gap: 5% -- Documentation does not distinguish covered from non-covered components
- Billing rule: 40% -- Benefit verification not performed or not checked for specific service; ABN (Advance Beneficiary Notice) not obtained
- Bad faith: 5% -- Payer categorizing covered services as non-covered

**Revenue impact calculation**:
```
Annual CO-96 volume: COUNT(remits WHERE carc = '96')
Dollar impact: SUM(denied_amount WHERE carc = '96')
Patient shiftable (with ABN): amount x ABN_collection_rate (typically 40-60%)
Without ABN: provider absorbs full cost
Revenue at risk: denied_amount x (1 - ABN_completion_rate x patient_collection_rate)
```

**Resolution path**:
1. Verify: is this service truly excluded from the patient's plan?
2. Check if alternative CPT coding might map to a covered benefit
3. If ABN was obtained: bill patient
4. If ABN was not obtained (Medicare): provider absorbs the cost
5. Prevention: pre-service benefit verification for specific service; obtain ABN/financial agreement before non-covered services

---

### CO-97: Payment Adjusted -- Already Adjudicated

**What the payer is saying**: "We already processed a claim for this service. This appears to be a duplicate or is included in a prior payment."

**What the ACTUAL root cause usually is**: CO-97 is often confused with CO-18 (duplicate) but they are different. CO-97 typically means the service was bundled into another service that was already paid. The payer is saying "we paid for procedure A, and procedure B is a component of A, so B is included in A's payment." This is NCCI bundling logic. In my experience, 50% of CO-97 denials are correct -- the service truly is a component of another service and should not be billed separately. But 50% are incorrect bundling -- the services were truly distinct, performed at different sites, different sessions, or with documented separate clinical indications. The payer's automated NCCI edits are blunt instruments and do not account for clinical nuance.

**Root cause decomposition**:
- Coder error: 25% -- Unbundling a component service that should be bundled
- Payer policy: 30% -- Payer applies NCCI edits more aggressively than CMS; custom bundling rules
- Documentation gap: 15% -- Documentation does not clearly establish distinct services
- Billing rule: 20% -- Modifier 59/X-modifiers not applied to indicate distinct service
- Bad faith: 10% -- Payer bundling services that are clinically distinct to reduce payment

**Revenue impact calculation**:
```
Annual CO-97 volume: COUNT(remits WHERE carc = '97')
Dollar impact: SUM(denied_amount WHERE carc = '97')
Legitimate unbundling errors: approximately 50% (not recoverable)
Incorrect bundling by payer: approximately 50% (recoverable with modifiers + documentation)
Recoverable amount: denied_amount x 0.50 x appeal_success_rate (65-75%)
```

**Resolution path**:
1. Check NCCI edits -- is this a valid CCI pair? Is the modifier allowed?
2. If NCCI edit allows modifier: resubmit with modifier 59 or appropriate X-modifier + documentation
3. If NCCI edit does not allow modifier: service is correctly bundled, write off
4. If payer is using custom bundling beyond NCCI: appeal citing CMS NCCI rules
5. Prevention: pre-submission NCCI edit check; modifier decision support at coding

---

### CO-109: Claim Not Covered by This Payer Per Coordination of Benefits

**What the payer is saying**: "We are not responsible for this claim. Based on our COB information, another payer should be billed first or instead."

**What the ACTUAL root cause usually is**: CO-109 is a more definitive version of CO-22. Where CO-22 says "check the coordination," CO-109 says "we are definitively not responsible." This usually means the payer has information showing the patient has primary coverage elsewhere. Root cause is almost always incomplete or incorrect insurance information at registration. Workers comp cases, auto accident cases, and patients with multiple employer plans are the most common scenarios.

**Root cause decomposition**:
- Coder error: 0%
- Payer policy: 20% -- Payer's COB database may have incorrect information
- Documentation gap: 5% -- Missing accident/injury information that would route to correct payer
- Billing rule: 65% -- Registration did not identify correct payer order; accident questionnaire not completed
- Bad faith: 10% -- Payer incorrectly claiming another payer is responsible

**Revenue impact calculation**:
```
Annual CO-109 volume: COUNT(remits WHERE carc = '109')
Dollar impact: SUM(denied_amount WHERE carc = '109')
Redirectable to correct payer: 80%
Revenue recovered after redirect: redirectable x correct_payer_payment_rate (85-90%)
Time cost: adds 45-90 days to payment cycle
```

**Resolution path**:
1. Contact patient to verify all insurance coverage
2. Determine correct payer order per COB rules
3. Submit to correct primary payer
4. Resubmit to this payer as secondary with primary EOB
5. Prevention: comprehensive insurance verification at registration including COB questionnaire

---

### CO-119: Benefit Maximum Reached

**What the payer is saying**: "The patient has exhausted their benefit maximum for this service category or this benefit period."

**What the ACTUAL root cause usually is**: CO-119 is a legitimate plan design limitation. The patient's plan has a cap on certain services (e.g., 20 physical therapy visits per year, $2,000 annual DME benefit, 60 behavioral health visits). Once the cap is reached, the payer will not pay more. The root cause is always a pre-service verification failure -- nobody checked the remaining benefit balance before scheduling additional services. In 20 years, the most expensive CO-119 denials I have seen are inpatient rehab stays where the patient hit their lifetime mental health benefit maximum mid-stay, leaving $50K+ unpaid.

**Root cause decomposition**:
- Coder error: 0%
- Payer policy: 30% -- Plan has benefit caps (this is by design, not an error)
- Documentation gap: 0%
- Billing rule: 65% -- Remaining benefits not verified before service; no tracking of benefits used vs. remaining
- Bad faith: 5% -- Payer miscounting benefits used or applying wrong benefit period

**Revenue impact calculation**:
```
Annual CO-119 volume: COUNT(remits WHERE carc = '119')
Dollar impact: SUM(denied_amount WHERE carc = '119')
Patient collectible (services rendered after benefit exhausted): denied_amount x patient_notification_rate x collection_rate
Typically only 20-30% recoverable from patient
Prevention value: if caught pre-service, patient can be notified and consent to self-pay
```

**Resolution path**:
1. Verify: has the benefit maximum truly been reached? Check benefit accumulator
2. If payer miscounted: appeal with benefit utilization detail
3. If legitimately exhausted: bill patient (if notified pre-service) or absorb cost
4. Prevention: real-time benefit verification showing remaining benefits; track benefit utilization across visits

---

### CO-151: Prior Authorization / Precertification Required But Not Obtained -- Additional Information Required

**What the payer is saying**: "This service required prior authorization. Either no authorization was obtained, or the authorization does not match the service rendered."

**What the ACTUAL root cause usually is**: CO-151 is a cousin of CO-197 but with a nuance -- CO-151 often means the payer needs MORE information to process the auth or the auth was obtained but for a different service/provider/date. In practice, CO-151 denials break down as: 35% no auth was ever obtained, 25% auth was obtained but for different CPT/date/provider, 20% auth expired before service date, 10% auth was obtained but number not included on claim, and 10% payer changed auth requirements and nobody was notified.

**Root cause decomposition**:
- Coder error: 5% -- Service coded to CPT different from authorized CPT
- Payer policy: 25% -- Payer expanded PA requirements without adequate notification
- Documentation gap: 10% -- Clinical info submitted for auth was insufficient
- Billing rule: 50% -- Auth not obtained; auth number not on claim; auth tracking system gap
- Bad faith: 10% -- Payer retroactively requiring auth for previously non-auth services

**Revenue impact calculation**:
```
Annual CO-151 volume: COUNT(remits WHERE carc = '151')
Dollar impact: SUM(denied_amount WHERE carc = '151')
Retroactive auth success rate: 30-40% (payer-dependent)
Appeal success rate: 45-55%
Net loss: denied_amount x (1 - max(retro_auth_rate, appeal_rate))
Prevention: near 100% preventable with proper auth workflow
```

**Resolution path**:
1. Was auth required? Check payer's current auth list for this CPT
2. Was auth obtained? Check auth system
3. If auth exists but not on claim: resubmit with auth number
4. If auth exists but for wrong CPT/date: request auth modification or new auth
5. If no auth: attempt retroactive auth (many payers allow within 14 days)
6. Appeal if retro auth denied
7. Prevention: auth requirement lookup integrated into scheduling; auth verification at pre-registration

---

### CO-167: Diagnosis Not Covered by This Payer

**What the payer is saying**: "We do not cover this diagnosis. The ICD-10 code submitted is excluded from coverage under this plan."

**What the ACTUAL root cause usually is**: CO-167 is different from CO-11 (DX inconsistent with procedure) and CO-50 (not medically necessary). CO-167 means the payer specifically excludes this diagnosis from coverage. Common examples: self-inflicted injuries excluded by some plans, pre-existing condition exclusions (still exist in some non-ACA plans), certain mental health diagnoses excluded by older plan designs. In my experience, 60% of CO-167 denials are from outdated plan exclusion lists or incorrect application of exclusions. Mental Health Parity violations are rampant here.

**Root cause decomposition**:
- Coder error: 15% -- DX code selected maps to an excluded category when an alternative code exists
- Payer policy: 50% -- Plan genuinely excludes this diagnosis category
- Documentation gap: 10% -- Documentation does not establish the clinical context that would move the DX to a covered category
- Billing rule: 15% -- Pre-service benefit verification did not check DX-specific exclusions
- Bad faith: 10% -- Payer applying exclusions inappropriately; Mental Health Parity violations

**Revenue impact calculation**:
```
Annual CO-167 volume: COUNT(remits WHERE carc = '167')
Dollar impact: SUM(denied_amount WHERE carc = '167')
Incorrectly excluded (appealable): estimated 30-40%
Parity violation (appealable to state DOI): estimated 10-15%
Patient billable (if notified pre-service): remaining x patient_collection_rate
```

**Resolution path**:
1. Verify: is this DX actually excluded under the patient's specific plan?
2. Check for Mental Health Parity violations (MHPAEA)
3. If exclusion is incorrect or violates parity: appeal, file regulatory complaint if warranted
4. If exclusion is valid: check for alternative DX that may be covered and clinically accurate
5. Prevention: DX-level benefit verification pre-service; maintain exclusion database by payer-plan

---

### CO-197: Prior Auth/Precertification Absent

**What the payer is saying**: "This service required prior authorization or precertification, and none was obtained."

**What the ACTUAL root cause usually is**: CO-197 is the most common and most expensive prior auth denial. Unlike CO-151 which implies partial auth information, CO-197 is a flat "no auth exists." This is the single most preventable high-dollar denial in healthcare. In 20 years, I have seen organizations lose $5-15M annually to CO-197 alone. The root cause is always operational: no systematic process to identify which services need auth for which payers, no tracking of auth expiration, no verification that auth was obtained before service is rendered.

**Root cause decomposition**:
- Coder error: 5% -- Procedure performed was different from what was scheduled (and authorized)
- Payer policy: 20% -- Payer expanded auth requirements; payer has inconsistent auth lists across plan types
- Documentation gap: 5% -- Clinical documentation insufficient to obtain auth
- Billing rule: 60% -- Auth workflow breakdown: not identified as needing auth, not requested, not tracked, not verified
- Bad faith: 10% -- Payer claiming auth was required when contract does not require it for this service

**Revenue impact calculation**:
```
Annual CO-197 volume: COUNT(remits WHERE carc = '197')
Dollar impact: SUM(denied_amount WHERE carc = '197')
CO-197 claims are typically HIGH DOLLAR (avg claim value 4-6x overall average)
Retroactive auth success rate: 25-35%
Appeal success rate: 35-45%
Net loss: denied_amount x (1 - combined_recovery_rate)
This is typically the #1 or #2 largest denial category by dollar value
Prevention ROI: nearly 100% preventable with robust auth workflow
```

**Resolution path**:
1. Was auth actually required? Check payer's auth list for this CPT + this plan type
2. If auth was required, attempt retroactive auth (submit within payer's retro window)
3. If retro auth denied, appeal -- include medical necessity documentation
4. If payer claims auth was required but contract does not require it: appeal with contract
5. Prevention: integrated auth requirement lookup at scheduling; mandatory auth verification gate before service; auth expiration tracking

---

### CO-204: Service Not Covered/Authorized Without Prior Authorization

**What the payer is saying**: "This specific service is not covered without prior authorization, and no valid authorization is on file."

**What the ACTUAL root cause usually is**: CO-204 is a stricter version of CO-197. While CO-197 means "you needed auth and did not get it," CO-204 means "this service category is NEVER covered without auth -- there is no retroactive option." Payers use CO-204 for services they consider high-cost or potentially unnecessary, like advanced imaging, genetic testing, specialty drugs, and elective surgeries. The message is clear: without auth, we will never pay this.

**Root cause decomposition**:
- Coder error: 5%
- Payer policy: 30% -- Service falls in payer's mandatory auth category
- Documentation gap: 5%
- Billing rule: 55% -- Auth not obtained before service rendered
- Bad faith: 5% -- Payer applying CO-204 to services that should allow retroactive auth

**Revenue impact calculation**:
```
Annual CO-204 volume: COUNT(remits WHERE carc = '204')
Dollar impact: SUM(denied_amount WHERE carc = '204')
Recovery rate: VERY LOW -- 15-25% (these are the hardest auth denials to overturn)
Net loss: denied_amount x (1 - recovery_rate)
These are often the highest per-claim dollar values
```

**Resolution path**:
1. Attempt retroactive auth even though payer may reject -- document the attempt
2. Appeal citing medical necessity and urgency if applicable
3. If emergent service, argue emergency exception to auth requirement
4. Prevention: mandatory hard-stop at scheduling for CO-204-prone service categories

---

### CO-236: Procedure/Revenue Code Not Approved for This Provider

**What the payer is saying**: "This specific procedure or revenue code is not approved for your provider type, facility type, or enrolled specialty."

**What the ACTUAL root cause usually is**: CO-236 denials come from provider enrollment gaps. The rendering provider is enrolled with the payer, but their enrollment does not include the specialty or procedure type that was billed. Example: a family medicine physician billing a surgical procedure, or an outpatient facility billing inpatient revenue codes. In 20 years, the most common CO-236 scenario is a new provider who was enrolled under a limited specialty and then started performing services outside their enrolled scope.

**Root cause decomposition**:
- Coder error: 15% -- Wrong revenue code for facility type; procedure not appropriate for provider specialty
- Payer policy: 30% -- Payer restricts certain procedures to certain provider types
- Documentation gap: 5%
- Billing rule: 40% -- Provider enrollment does not match services being billed; revenue code mapping incorrect for facility
- Bad faith: 10% -- Payer denying legitimate services by narrowly interpreting provider scope

**Revenue impact calculation**:
```
Annual CO-236 volume: COUNT(remits WHERE carc = '236')
Dollar impact: SUM(denied_amount WHERE carc = '236')
Fixable via enrollment update: 50-60%
Timeline to fix: 30-90 days for enrollment update
Revenue at risk during enrollment fix: monthly_volume x months_to_fix
```

**Resolution path**:
1. Check provider enrollment -- is the provider enrolled for this specialty/procedure type?
2. If enrollment gap: initiate enrollment update with payer
3. If enrollment is correct and payer is wrong: appeal with enrollment confirmation
4. Prevention: maintain provider-to-procedure mapping; validate billed procedures against enrolled scope

---

### CO-252: Service Not on Payer Fee Schedule

**What the payer is saying**: "We do not have a fee schedule rate for this procedure code. It is not a recognized/payable code under your contract."

**What the ACTUAL root cause usually is**: CO-252 happens when you bill a CPT code that is not in your payer contract's fee schedule. This commonly occurs with new CPT codes (annual CPT updates take effect January 1 but payer fee schedules may not be updated until March or later), unlisted procedure codes (CPT codes ending in 99), or highly specialized procedures that were not included in the original contract negotiation. In my experience, 60% of CO-252 denials are for new CPT codes where the payer has not loaded the rate yet.

**Root cause decomposition**:
- Coder error: 10% -- Using unlisted code when a specific code exists
- Payer policy: 50% -- Payer fee schedule not updated for new CPT codes; code not in contract
- Documentation gap: 10% -- For unlisted codes, insufficient documentation of what the procedure entailed
- Billing rule: 20% -- Contract does not include this service; no gap analysis of CPT codes vs contract
- Bad faith: 10% -- Payer claiming no fee schedule rate when contract has a "lesser of" or "by report" clause

**Revenue impact calculation**:
```
Annual CO-252 volume: COUNT(remits WHERE carc = '252')
Dollar impact: SUM(denied_amount WHERE carc = '252')
New CPT code issue (resolvable when payer updates fee schedule): 60%
Contract gap (requires negotiation): 30%
True non-covered: 10%
Timeline to resolution: 30-120 days depending on payer
```

**Resolution path**:
1. Check if this is a new CPT code -- has the payer updated their fee schedule?
2. Check contract -- is there a "by report" or "lesser of" clause for unlisted procedures?
3. If new code: contact payer to request fee schedule update; submit with manual pricing
4. If contract gap: negotiate addition to fee schedule at next contract renewal
5. Prevention: annual CPT update gap analysis against all payer fee schedules; proactive outreach to payers for new code rates

---

### CO-253: Sequestration Adjustment

**What the payer is saying**: "This adjustment is due to the federal sequestration reduction applied to Medicare payments."

**What the ACTUAL root cause usually is**: CO-253 is NOT a denial -- it is an automatic 2% reduction applied to all Medicare Fee-For-Service payments under the Budget Control Act sequestration. This is expected and not appealable. HOWEVER, the root cause issue is when organizations do not account for sequestration in their revenue forecasting, leading to a persistent 2% budget shortfall on Medicare revenue. Additionally, some Medicare Advantage plans incorrectly apply sequestration when it should only apply to traditional Medicare FFS.

**Root cause decomposition**:
- Coder error: 0%
- Payer policy: 90% -- This is federal law, not a payer decision
- Documentation gap: 0%
- Billing rule: 5% -- Medicare Advantage plans incorrectly applying sequestration
- Bad faith: 5% -- MA plans applying sequestration that should not apply to MA

**Revenue impact calculation**:
```
Annual CO-253 volume: COUNT(remits WHERE carc = '253')
Dollar impact: SUM(adjustment_amount WHERE carc = '253')
Expected: Medicare FFS revenue x 0.02
If actual > expected: investigate MA plans incorrectly applying sequestration
Incorrectly applied sequestration is recoverable
```

**Resolution path**:
1. Verify: is this a Medicare FFS claim? Sequestration is expected
2. If Medicare Advantage: sequestration should NOT apply -- appeal
3. Ensure revenue forecasting accounts for 2% sequestration on Medicare FFS
4. Prevention: separate Medicare FFS and MA in revenue models; flag MA claims with CO-253

---

## PR (PATIENT RESPONSIBILITY) CODES

PR codes shift the financial responsibility to the patient. These are sometimes correct (copay, deductible, coinsurance) and sometimes WRONG (payer shifting costs that should be contractual adjustments to the patient).

---

### PR-1: Deductible Amount

**What the payer is saying**: "This amount is applied to the patient's annual deductible."

**What the ACTUAL root cause usually is**: PR-1 is usually correct -- the patient has not met their deductible and owes this amount. HOWEVER, there are three scenarios where PR-1 is wrong. First, the payer applied the deductible to a preventive service that should be covered at 100% under ACA (no deductible for preventive care). Second, the payer applied the wrong deductible amount (family vs. individual, in-network vs. out-of-network). Third, the patient already met their deductible based on other claims but the payer's accumulator has not updated.

**When PR-1 is WRONG -- payer shifting responsibility incorrectly**:
- ACA-mandated preventive services should have $0 deductible -- if PR-1 appears on a preventive service (CPT 99381-99397, specific screening codes), the payer is violating ACA
- Deductible amount exceeds the patient's actual remaining deductible
- Services that are "deductible waived" under the patient's plan but PR-1 was applied
- Wrong deductible tier applied (e.g., out-of-network deductible applied to in-network provider)

**Revenue impact of incorrect PR-1**:
```
PR-1 volume: COUNT(remits WHERE carc = '1' AND group_code = 'PR')
Check against ACA preventive: COUNT(WHERE carc = '1' AND cpt IN (preventive_codes))
Wrong deductible tier: compare deductible_applied vs contract_tier_deductible
Revenue at risk: incorrect PR-1 means provider is collecting from patient when payer should pay
If patient does not pay: provider loses revenue that payer owed
```

**Resolution path**:
1. Verify deductible amount against patient's benefit information
2. If preventive service: appeal -- ACA requires $0 cost-sharing for preventive care
3. If wrong deductible tier: appeal with in-network status verification
4. Prevention: real-time deductible tracking; flag PR-1 on preventive services

---

### PR-2: Coinsurance Amount

**What the payer is saying**: "This is the patient's coinsurance portion of the allowed amount."

**What the ACTUAL root cause usually is**: PR-2 is usually correct but has the same issues as PR-1. The most common incorrect PR-2 scenario is when the payer applies coinsurance to a service that should be covered at 100% (preventive care, or the patient has met their out-of-pocket maximum). In my experience, out-of-pocket maximum violations are the most underreported payer error in RCM -- payers should stop applying coinsurance once the patient's OOP max is met, but their accumulators lag.

**When PR-2 is WRONG**:
- Patient has met their out-of-pocket maximum -- coinsurance should be $0
- ACA preventive service -- coinsurance should be $0
- Wrong coinsurance percentage applied (e.g., 30% applied when plan is 20%)
- Coinsurance applied to a service that is covered at 100% under plan design

**Revenue impact of incorrect PR-2**:
```
Incorrect PR-2 shifts revenue collection burden to patient
Patient collection rate on coinsurance: typically 50-65%
If PR-2 is wrong and payer should have paid: appeal recovers 100% from payer vs 50-65% from patient
Revenue improvement: incorrect_PR2_amount x (1 - patient_collection_rate)
```

---

### PR-3: Copay Amount

**What the payer is saying**: "This is the patient's copay for this service."

**What the ACTUAL root cause usually is**: PR-3 is usually correct. The primary scenarios where it is wrong: copay collected at time of service but payer also applies PR-3 (double copay), wrong copay tier applied (specialist copay for PCP visit), copay applied to a service that is copay-exempt (preventive care, or plan has no copay for this service type).

**When PR-3 is WRONG**:
- Copay already collected at check-in -- patient should not owe additional copay on the statement
- Wrong copay tier (PCP vs. specialist vs. urgent care vs. ER)
- ACA preventive services should have no copay
- Patient's plan has no copay for this service category

**Revenue impact**:
```
Double copay: patient pays twice, provider owes patient a refund, and payer underpaid
Wrong tier: difference between correct and incorrect copay amount
Prevention: verify copay amount at check-in using real-time eligibility
```

---

## OA (OTHER ADJUSTMENT) CODES

OA codes are adjustments that do not fit into CO or PR categories. They are relatively uncommon but important for specific scenarios.

---

### OA-23: Impact of Prior Payer Adjudication

**What the payer is saying**: "This adjustment reflects the impact of the primary payer's adjudication on our payment as the secondary payer."

**Root cause**: Usually correct -- the secondary payer is adjusting based on what the primary paid. However, if the primary payer information is incorrect on the secondary claim, OA-23 will be wrong. Resolution: ensure primary ERA data is accurately transmitted to secondary claims.

---

### OA-18: Duplicate Claim/Service (Other Adjustment)

**What the payer is saying**: "Duplicate claim identified but categorized as other adjustment rather than contractual."

**Root cause pattern**: Same as CO-18 but payer is categorizing it as neither provider nor patient responsibility. This is a clerical categorization that has no financial difference from CO-18 in most cases.

---

### OA-94: Processed in Excess of Charges

**What the payer is saying**: "The payment we calculated exceeds your billed charges, so we are adjusting down to your billed charges."

**Root cause**: Your charge master rates are below the payer's allowed amount. This means you are leaving money on the table by not charging enough. Revenue impact: the difference between payer's allowed amount and your billed charge is money you will never recover. Prevention: charge master review -- charges should always exceed the highest payer's fee schedule by 200-300%.

---

### OA-100: Payment Made to Patient/Insured

**What the payer is saying**: "We paid the patient directly instead of the provider."

**Root cause**: Assignment of benefits issue. The payer sent payment to the patient instead of the provider, usually because the claim did not have assignment of benefits or the patient's plan allows direct payment to subscribers for out-of-network services. Revenue impact: provider must now collect from the patient, who may have already spent the money. Collection rate: 30-50%.

---

### OA-109: Claim Not Covered by This Payer

**What the payer is saying**: "This claim should be submitted to a different payer."

**Root cause**: Same root cause as CO-109 but categorized as other adjustment. Registration and COB verification failure.

---

# ============================================================
# LEVEL 2: SYSTEM / REVENUE-LEVEL ROOT CAUSE
# "Why is revenue failing?"
# ============================================================

This section answers the questions the client said were MISSING.
Every item below includes:
- The root cause question
- Data signals to investigate
- Multi-factor decomposition approach
- Example with real numbers
- Connection to claim-level root causes
- Revenue impact formula

---

## SECTION A: REVENUE ROOT CAUSES

### RRC-01: Why is Net Revenue Below Budget?

**Root cause question**: Net revenue is $X below budget for this period. What is causing the shortfall?

**Data signals to investigate**:
- Payer mix: claims_by_payer current period vs. budget period
- Volume: encounter count, RVU count, discharge count vs. budget
- CMI (Case Mix Index): actual CMI vs. budgeted CMI
- Denial rate: current vs. budget assumption
- Contract rates: actual reimbursement per CPT vs. budgeted rates
- Charge capture: encounters vs. claims submitted ratio

**Multi-factor decomposition**:
```
Revenue shortfall = Budget - Actual = $X

Decompose into:
  Volume variance:     (Actual volume - Budget volume) x Budget rate
  Rate variance:       (Actual rate - Budget rate) x Actual volume
  Mix variance:        (Actual mix - Budget mix) x Budget revenue
  Denial variance:     (Actual denial$ - Budget denial$)
  CMI variance:        (Actual CMI - Budget CMI) x Budget rev per CMI point
  Charge capture gap:  (Expected charges - Actual charges)

EXAMPLE:
  Budget: $8,200,000 | Actual: $7,340,000 | Shortfall: $860,000

  Volume decline:           -$215,000 (25.0%) -- 3.2% fewer encounters
  Payer mix shift:          -$172,000 (20.0%) -- commercial down 4%, Medicaid up 6%
  CMI decline:              -$129,000 (15.0%) -- CMI dropped 0.08 from budget
  Denial increase:          -$146,000 (17.0%) -- denial rate 9.1% vs 7.2% budget
  Contract rate erosion:    -$86,000  (10.0%) -- Aetna rates 2.3% below budget
  Charge capture leakage:   -$68,800  (8.0%)  -- 412 encounters with no claims
  Silent underpayment:      -$43,200  (5.0%)  -- variance on CO-45 adjustments
  TOTAL:                    -$860,000 (100%)
```

**Connection to claim-level root causes**: The denial increase of $146K decomposes further into specific CARC codes (CO-197 = $52K, CO-50 = $38K, CO-16 = $24K, etc.), which each trace to the claim-level root causes documented in Level 1.

**Revenue impact formula**:
```
Net Revenue Shortfall = SUM(Volume_variance + Rate_variance + Mix_variance
                        + Denial_variance + CMI_variance + Charge_capture_gap
                        + Underpayment_variance)
```

---

### RRC-02: Why is Payer Mix Shifting Unfavorably?

**Root cause question**: The proportion of commercial (higher-paying) claims is declining while government (lower-paying) claims are increasing. Why?

**Data signals**:
- claims_by_payer_category trended monthly
- New patient insurance type vs. established patient insurance type
- Service area demographic shifts (employer closures, ACA enrollment changes)
- Provider network changes (dropped from commercial networks)
- Referral pattern changes

**Multi-factor decomposition**:
```
Payer mix revenue impact:
  For each payer category:
    (Current_period_% - Prior_period_%) x Total_volume x Avg_revenue_per_category

EXAMPLE:
  Commercial: 52% -> 48% = -4% x 12,000 claims x $420 avg = -$201,600
  Medicare:   28% -> 29% = +1% x 12,000 claims x $285 avg = +$34,200
  Medicaid:   12% -> 16% = +4% x 12,000 claims x $165 avg = +$79,200
  Self-pay:   8%  -> 7%  = -1% x 12,000 claims x $95 avg  = -$11,400
  Net mix impact: -$99,600 revenue loss from mix shift alone
```

**Connection to claim-level**: Mix shift affects denial rates because Medicaid MCOs and Medicare Advantage plans have higher denial rates than commercial. A 4% shift to Medicaid may increase overall denial rate by 0.3-0.5 percentage points.

---

### RRC-03: Why is Volume Declining?

**Root cause question**: Encounter/procedure volume is below budget. Is this a market problem or an internal problem?

**Data signals**:
- Encounters by provider, by department, by service line
- New patient vs. established patient trends
- Referral volume from referring physicians
- No-show and cancellation rates
- Competitor activity (new practices, hospital openings)
- Provider productivity (encounters per provider per day)

**Multi-factor decomposition**:
```
Volume decline = Budget_volume - Actual_volume = X encounters

  Provider vacancy/turnover:     -Y encounters (provider left, not replaced)
  No-show rate increase:         -Z encounters (no-show rate rose from 8% to 12%)
  Referral decline:              -W encounters (key referring MD retired)
  Market/competition:            -V encounters (competitor opened nearby)
  Scheduling efficiency:         -U encounters (open slots not filled)
```

---

### RRC-04: Why is CMI (Case Mix Index) Declining?

**Root cause question**: CMI is dropping, which means we are either seeing less complex patients or documenting/coding at a lower complexity level. Which is it?

**Data signals**:
- DRG distribution: current vs. prior period
- CC/MCC capture rate
- CDI query volume and response rate
- Coder accuracy (DRG validation audit results)
- Patient acuity metrics (ICU days, ventilator days, procedure complexity)

**Multi-factor decomposition**:
```
CMI decline root causes:
  Actual acuity decline:     (Patient is less sick - clinical reality)
  CDI capture failure:       (Patient IS sick but CC/MCC not documented)
  Coding accuracy decline:   (Documentation supports higher DRG but coder missed it)
  DRG creep prevention:      (Coders deliberately downcoding to avoid audit)

EXAMPLE:
  Budget CMI: 1.62 | Actual CMI: 1.54 | Delta: -0.08
  Of the 0.08 decline:
    True acuity decline:     0.02 (25%) -- fewer complex surgical cases
    CDI miss:                0.03 (37%) -- CDI query response rate dropped to 61%
    Coding miss:             0.02 (25%) -- 2 new coders with lower accuracy
    DRG shift:               0.01 (13%) -- shift from surgical to medical DRGs
```

**Revenue impact formula**:
```
CMI revenue impact = CMI_delta x Medicare_discharges x Base_rate
Example: 0.08 x 3,200 discharges x $6,800 base rate = $1,740,800 annual impact
```

---

### RRC-05: Why is Denial Rate Increasing?

**Root cause question**: Overall denial rate has climbed from X% to Y% over N months. What is driving the increase?

**Data signals**:
- Denial rate by payer (which payers are driving the increase?)
- Denial rate by CARC code (which denial types are increasing?)
- Denial rate by service line (which departments?)
- Denial rate by provider (which physicians?)
- First-pass vs. final denial rate
- New payer policy effective dates vs. denial rate inflection points

**Multi-factor decomposition**:
```
Overall denial rate increase: 7.2% -> 9.1% = +1.9 percentage points

Decomposition by payer:
  UHC:     8.4% -> 12.1% = +3.7pp  (UHC volume = 22% of claims)
  Aetna:   6.1% -> 7.8%  = +1.7pp  (Aetna volume = 14% of claims)
  BCBS:    5.8% -> 5.9%  = +0.1pp  (BCBS volume = 18% of claims)
  Medicare: 4.2% -> 4.5% = +0.3pp  (Medicare volume = 28% of claims)
  Others:   stable

Weighted contribution to overall increase:
  UHC:     3.7 x 0.22 = 0.81pp  (43% of the increase)
  Aetna:   1.7 x 0.14 = 0.24pp  (13% of the increase)
  BCBS:    0.1 x 0.18 = 0.02pp  (1% of the increase)
  Medicare: 0.3 x 0.28 = 0.08pp (4% of the increase)
  Mix shift effect:      0.75pp  (39% -- more claims going to higher-denial payers)
```

**Connection to claim-level**: UHC's 3.7pp increase decomposes into CO-197 (+1.4pp, new PA requirements effective Oct 2025), CO-50 (+1.2pp, stricter InterQual criteria), CO-16 (+0.6pp, new documentation requirements), and CO-4 (+0.5pp, modifier policy change).

**Revenue impact formula**:
```
Denial rate impact = (New_rate - Old_rate) x Total_claims x Avg_claim_value
Example: 0.019 x 142,000 claims x $385 avg = $1,038,330 additional denials annually
```

---

### RRC-06: Why is Contract Rate Eroding?

**Root cause question**: We are getting paid less per procedure for the same service. Why?

**Data signals**:
- Paid amount per CPT per payer trended over time
- Contract renewal dates and rate changes
- Fee schedule comparison: current vs. prior contract
- CMS conversion factor changes (affects Medicare-benchmarked contracts)
- Percentage-of-Medicare contracts: actual percentage trending

**Multi-factor decomposition**:
```
Rate erosion sources:
  Contract renewal at lower rates:     -$X (payer negotiated rates down)
  Medicare conversion factor decline:  -$Y (affects all % of Medicare contracts)
  Payer fee schedule error:            -$Z (payer loading wrong rates)
  Wrong contract tier applied:         -$W (payer using old/wrong fee schedule)
  Silent rate reduction:               -$V (payer reduced rates without notification)
```

---

### RRC-07: Why is Charge Capture Leaking?

**Root cause question**: We performed services but did not bill for them. How much revenue is walking out the door?

**Data signals**:
- Encounter count vs. claim count (should be near 1:1 for professional billing)
- Charge entry lag (time from encounter to charge entry)
- CDM (Charge Description Master) audit results
- Late charges (charges entered after billing cutoff)
- Missing procedure codes per encounter (e.g., supplies, drugs not captured)

**Multi-factor decomposition**:
```
Charge capture leakage:
  Encounters with no claims:           X encounters x avg_revenue = $loss
  Missing ancillary charges:           Y claims x avg_missing_charge = $loss
  Late charges past billing cutoff:    Z charges x avg_charge = $loss
  CDM mapping errors:                  W charges billed at wrong rate = $loss

EXAMPLE:
  14,200 encounters in month | 13,788 claims submitted = 412 missing (2.9%)
  412 x $385 avg revenue = $158,620/month charge capture leakage
  Annualized: $1,903,440
```

---

## SECTION B: CASH FLOW ROOT CAUSES

### CRC-01: Why is Cash Flow Declining?

**Root cause question**: Cash collections are below expectation even though net revenue appears on track. Where is the cash?

**Data signals**:
- Cash collected vs. net revenue (should be 95-100%+)
- ADTP (Average Days to Pay) by payer
- AR aging distribution
- Write-off trends
- Unapplied cash balance

**Multi-factor decomposition**:
```
Cash shortfall = Expected cash - Actual cash = $X

  ADTP increase:              -$A (cash coming slower)
  AR aging shift:             -$B (claims sitting longer before payment)
  Write-off increase:         -$C (more claims written off)
  Payer payment delays:       -$D (specific payers paying slower)
  Patient collection decline: -$E (patient balances not collected)
  Unapplied cash increase:    -$F (payments received but not posted)

EXAMPLE:
  Expected cash: $7,800,000 | Actual: $7,190,000 | Shortfall: $610,000
  ADTP went from 38 to 46 days:        -$245,000 (40%)
  AR > 90 days grew from 18% to 24%:   -$152,500 (25%)
  Write-offs up 12%:                    -$97,600  (16%)
  Humana ADTP went from 28 to 42 days: -$61,000  (10%)
  Patient collections down 8%:         -$36,600  (6%)
  Unapplied cash up $17,300:           -$17,300  (3%)
  TOTAL:                                -$610,000 (100%)
```

---

### CRC-02: Why is ADTP Increasing?

**Root cause question**: Claims are taking longer to get paid. Why?

**Data signals**:
- ADTP by payer trended monthly
- ADTP by claim type (clean vs. denied-then-recovered)
- Claim submission lag (DOS to initial submission)
- Payer processing time (submission to adjudication)
- Internal processing time (adjudication to posting)

**Multi-factor decomposition**:
```
ADTP = Submission_lag + Payer_processing + Internal_posting_lag

If ADTP increased from 38 to 46 days:
  Submission lag: 4 days -> 5 days (+1 day) -- coding backlog
  Payer processing: 22 days -> 27 days (+5 days) -- payer slowdown
  Internal posting: 12 days -> 14 days (+2 days) -- posting backlog

By payer:
  UHC ADTP: 32 -> 38 (payer system issues)
  Humana ADTP: 28 -> 42 (new claims processing vendor)
  Aetna ADTP: 35 -> 36 (stable)
  BCBS ADTP: 30 -> 31 (stable)
```

**Revenue impact formula**:
```
Cash flow impact of ADTP increase:
  Daily_revenue x ADTP_increase = cash tied up
  Example: $260,000/day x 8 additional days = $2,080,000 additional cash tied up in AR
  Cost of capital: $2,080,000 x annual_cost_of_capital_rate / 365
```

---

### CRC-03: Why is AR Aging Beyond 90 Days Growing?

**Root cause question**: The AR bucket > 90 days is growing as a percentage of total AR. What is stuck?

**Data signals**:
- AR aging by payer (which payers have oldest AR?)
- AR aging by denial status (denied claims vs. pending claims)
- AR aging by claim type (inpatient vs. outpatient vs. professional)
- Follow-up activity (are old claims being worked?)
- Touch count per claim (how many times has each claim been worked?)

**Multi-factor decomposition**:
```
AR > 90 days composition:
  Denied claims pending appeal:    $X (these are in the pipeline)
  Pending payer adjudication:      $Y (payer has not responded)
  Claims not being worked:         $Z (no follow-up activity)
  Patient balances after insurance: $W (statements sent, no payment)
  Suspended/held claims:           $V (internal holds)

EXAMPLE:
  AR > 90 days: $4,200,000
  Denied pending appeal:     $1,470,000 (35%) -- avg appeal resolution 45 days
  Pending payer:             $1,260,000 (30%) -- no response from payer
  No follow-up:              $840,000   (20%) -- fell through the cracks
  Patient balances:          $420,000   (10%) -- statements ignored
  Internal holds:            $210,000   (5%)  -- coding/billing issues
```

**Connection to claim-level**: The "denied pending appeal" bucket decomposes into specific CARC codes -- the distribution tells you which denial types are taking longest to resolve.

---

### CRC-04: Why are Write-Offs Increasing?

**Root cause question**: We are writing off more revenue than expected. What is being written off and why?

**Data signals**:
- Write-offs by category (timely filing, bad debt, small balance, contractual)
- Write-offs by payer
- Write-offs by adjustment reason code
- Write-off approval audit (who approved these write-offs?)
- Write-off timing (how old were claims when written off?)

**Multi-factor decomposition**:
```
Write-off increase decomposition:
  Timely filing write-offs:     +$X (CO-29 denials not caught in time)
  Bad debt write-offs:          +$Y (patient balances deemed uncollectible)
  Small balance write-offs:     +$Z (balances below collection threshold)
  Credentialing write-offs:     +$W (provider not enrolled -- too late to fix)
  Underpayment write-offs:      +$V (payer underpaid but not worth appealing)

EXAMPLE:
  Write-offs increased from $185,000/month to $242,000/month = +$57,000/month
  Timely filing:    +$22,000 (39%) -- 3 coders on leave, coding backlog
  Bad debt:         +$18,000 (32%) -- patient collection rate dropped
  Small balance:    +$8,000  (14%) -- threshold increased from $15 to $25
  Credentialing:    +$5,000  (9%)  -- new provider enrollment delayed
  Underpayment:     +$4,000  (7%)  -- Aetna underpayments below appeal threshold
```

---

### CRC-05: Why is Payer Float Increasing?

**Root cause question**: ERA shows payment but the money is not in the bank account when expected. What is the payer doing?

**Data signals**:
- ERA check/EFT date vs. bank deposit date
- Float days by payer (ERA date minus bank clear date)
- EFT vs. check distribution (checks have longer float)
- Payer payment batch frequency

**Revenue impact formula**:
```
Float cost = Daily_payer_payment x Additional_float_days x Cost_of_capital / 365
Example: $45,000/day from UHC x 3 additional float days x 8% cost of capital / 365
       = $29.59/day = $10,800/year just from UHC float increase
```

---

### CRC-06: Why are Silent Underpayments Occurring?

**Root cause question**: Payers are paying less than the contracted rate, but nobody is catching it because the claims are marked "paid."

**Data signals**:
- ERA paid amount vs. contract expected amount per CPT per payer
- CO-45 (contractual adjustment) amount vs. expected contractual adjustment
- Variance threshold flags (claims where paid < expected by > $X or > Y%)
- Underpayment pattern: random vs. systematic (same CPT codes, same payer)

**Multi-factor decomposition**:
```
Underpayment sources:
  Wrong fee schedule applied:        $X (payer using wrong contract year)
  Incorrect bundling/reduction:      $Y (payer reducing for bundles that do not apply)
  Wrong conversion factor:           $Z (CMS conversion factor not updated)
  Multiple procedure reduction:      $W (payer over-reducing for multiple procedures)
  Modifier-based reduction:          $V (payer reducing for modifier when they should not)
  Geographic adjustment error:       $U (wrong locality applied)

EXAMPLE:
  Monthly payment volume: $6,800,000
  Expected based on contracts: $6,940,000
  Underpayment: $140,000/month = $1,680,000/year

  Wrong fee schedule (Aetna):    $52,000 (37%) -- using 2024 rates, not 2025
  Bundling errors (UHC):         $38,000 (27%) -- bundling correctly modifier-59'd claims
  Multiple proc reduction (BCBS): $28,000 (20%) -- applying 50% reduction to 3rd+ proc
  Other:                         $22,000 (16%)
```

**Revenue impact formula**:
```
Silent underpayment = SUM(contract_expected - ERA_paid)
                      WHERE ERA_paid > 0 AND ERA_paid < contract_expected
                      AND (contract_expected - ERA_paid) > threshold
```

---

## SECTION C: GROSS-TO-NET RATIO ROOT CAUSES

### GNR-01: Why is the Gross-to-Net Ratio Worsening?

**Root cause question**: The gap between gross charges and net revenue is widening. Why?

**Data signals**:
- Gross charges vs. net revenue trended
- Contractual adjustment percentage by payer
- Denial rate trended
- Patient bad debt trended
- Charge master changes vs. payer rate changes

**Multi-factor decomposition**:
```
Gross-to-Net ratio = Net Revenue / Gross Charges

If ratio declined from 32% to 29%:
  Contractual adjustments grew:    (rates did not keep up with charge increases)
  Denial volume grew:              (more claims denied = more revenue lost)
  Patient bad debt grew:           (patients not paying their share)
  Write-offs grew:                 (more revenue deemed uncollectible)

EXAMPLE:
  Gross charges: $25,000,000
  Prior net: $8,000,000 (32.0%)
  Current net: $7,250,000 (29.0%)
  Decline: $750,000

  Charge increase without rate increase: -$380,000 (50.7%)
  Denial increase:                       -$195,000 (26.0%)
  Patient bad debt increase:             -$112,000 (14.9%)
  Write-off increase:                    -$63,000  (8.4%)
```

---

### GNR-02: Why are Contractual Adjustments Higher Than Expected?

**Root cause question**: Contractual adjustments (CO-45) are a larger percentage of charges than our contracts would suggest. Why?

**Data signals**:
- CO-45 amount per claim vs. expected per contract
- CO-45 by payer as percentage of charges vs. contract discount percentage
- Fee schedule comparison: your charges vs. payer allowed amounts
- Multi-procedure reduction patterns

**Connection to claim-level**: Every dollar of unexpected CO-45 traces back to either a silent underpayment (payer paying wrong rate) or a contract management issue (your rates vs. their rates).

---

### GNR-03: Why is Patient Bad Debt Growing?

**Root cause question**: Patient responsibility amounts are being written off to bad debt at a higher rate. Why?

**Data signals**:
- Patient balance write-off rate trended
- Patient payment plan default rate
- Self-pay collection rate
- Patient financial counseling completion rate
- Propensity-to-pay score distribution shift

**Multi-factor decomposition**:
```
Patient bad debt drivers:
  Higher deductibles:               (patients owe more out of pocket)
  Economic conditions:              (patients cannot afford to pay)
  Collection process failures:      (statements not sent timely, no follow-up)
  Financial counseling gaps:        (patients not offered payment plans or charity care)
  Incorrect patient balances:       (balances that should have been insurance responsibility)

EXAMPLE:
  Patient bad debt increased from $125,000/month to $168,000/month = +$43,000
  Higher deductible plans:     +$18,000 (42%) -- avg deductible up $400/patient
  Collection process gap:      +$12,000 (28%) -- statement vendor changed, 2-week gap
  Incorrect balances:          +$8,000  (19%) -- PR codes that should have been CO
  Economic factors:            +$5,000  (12%) -- payment plan defaults up
```

---

## SECTION D: COST-TO-COLLECT ROOT CAUSES

### CTC-01: Why is Cost-to-Collect Increasing?

**Root cause question**: It costs more to collect each dollar of revenue. Why?

**Data signals**:
- Total RCM operating cost / net collections
- FTE count and compensation
- Denial rework volume and cost per rework
- Appeals volume and cost per appeal
- Outsourcing costs
- Technology/system costs

**Multi-factor decomposition**:
```
Cost-to-collect increase:
  Denial rework volume increase:     +$X (more denials = more rework labor)
  Appeal volume increase:            +$Y (more appeals filed)
  FTE productivity decline:          +$Z (fewer claims worked per FTE per day)
  Outsourcing cost increase:         +$W (vendor rate increases)
  Manual process inefficiency:       +$V (tasks that should be automated)

EXAMPLE:
  Cost-to-collect rose from 4.8% to 5.6% = +0.8pp on $85M net revenue = +$680,000
  Denial rework:       +$272,000 (40%) -- denial rate increase caused 3,400 more rework claims
  Appeal volume:       +$170,000 (25%) -- 2,800 more appeals at $60.71/appeal
  FTE productivity:    +$136,000 (20%) -- claims per FTE per day dropped from 42 to 37
  Manual processes:    +$102,000 (15%) -- tasks still manual that peers have automated
```

---

## SECTION E: DENIAL PATTERN ROOT CAUSES (SYSTEM-LEVEL)

### DRC-01: Why is a SPECIFIC Payer's Denial Rate Above National Benchmark?

**Root cause question**: Payer X denies our claims at Y% but the national benchmark for this payer is Z%. Why are we worse?

**Data signals**:
- Our denial rate for this payer vs. MGMA/HFMA benchmark
- Denial CARC distribution for this payer at our facility vs. benchmark
- Our submission quality metrics (clean claim rate) for this payer
- Contract terms (are we on an older contract?)
- Provider enrollment status with this payer

**Multi-factor decomposition**:
```
Our UHC denial rate: 12.1% | National benchmark: 8.4% | Gap: 3.7pp

Gap decomposition:
  CO-197 (auth): our 3.8% vs benchmark 1.2% = 2.6pp gap
    Root cause: we are not using UHC's auth portal correctly; auth list outdated
  CO-50 (med necessity): our 2.1% vs benchmark 1.8% = 0.3pp gap
    Root cause: CDI not using UHC's specific criteria (they use MCG, not InterQual)
  CO-16 (missing info): our 1.4% vs benchmark 0.8% = 0.6pp gap
    Root cause: UHC companion guide requirements not in our scrubber
  Other: our 4.8% vs benchmark 4.6% = 0.2pp gap
    Root cause: within normal variation
```

**Revenue impact formula**:
```
Revenue opportunity = Gap_pp x UHC_claim_volume x Avg_UHC_claim_value
Example: 3.7pp x 31,240 claims x $412 = $476,254 annual opportunity
```

---

### DRC-02: Why is a Specific CPT Code Denied More Here Than Industry Average?

**Root cause question**: CPT 93306 (echocardiogram) is denied at 14% here vs. 6% industry average. Why?

**Data signals**:
- Denial rate for this CPT by payer
- CARC distribution for this CPT
- Documentation associated with this CPT (sufficient?)
- Modifier usage for this CPT
- Ordering physician patterns (does one MD have higher denial rate?)

**Multi-factor decomposition**:
```
CPT 93306 denial rate: 14% vs 6% benchmark = 8pp gap

  Payer-specific:      3pp -- Anthem requires prior auth for 93306; we are not getting it
  Documentation:       2.5pp -- 93306 needs specific indication documented; our template is generic
  Coding:              1.5pp -- modifier 26 vs TC confusion; some claims billed globally when should be component
  Ordering pattern:    1pp -- Dr. Smith orders 93306 without clinical indication in order
```

---

### DRC-03: Why Did First-Pass Acceptance Rate Drop?

**Root cause question**: First-pass acceptance rate dropped from 94% to 87%. What changed?

**Data signals**:
- First-pass rate by payer (which payers drove the drop?)
- First-pass rate by CARC code of denial
- Clean claim rate (claims passing scrubber without edits)
- Clearinghouse rejection rate
- Payer acknowledgment (277CA) response patterns

**Multi-factor decomposition**:
```
First-pass rate decline: 94% -> 87% = -7pp

  Payer policy changes:        -3.2pp (new payer requirements not in scrubber)
  Eligibility issues:          -1.8pp (eligibility verification gap week of system migration)
  Coding quality:              -1.2pp (2 new coders in first 90 days)
  Clearinghouse errors:        -0.5pp (clearinghouse vendor upgrade caused data drops)
  Charge capture timing:       -0.3pp (charges submitted after payer cutoff)
```

---

### DRC-04: Why is the Appeal Win Rate Declining?

**Root cause question**: We used to win 72% of appeals. Now we win 58%. What changed?

**Data signals**:
- Appeal win rate by payer (which payers are we losing to?)
- Appeal win rate by CARC code (which denial types are we losing?)
- Appeal submission quality (documentation completeness)
- Appeal timeliness (are we filing within payer deadlines?)
- Appeal level (1st level vs. 2nd level vs. external review)

**Multi-factor decomposition**:
```
Appeal win rate decline: 72% -> 58% = -14pp

  Payer criteria tightening:    -6pp  (UHC changed appeal review criteria)
  Appeal documentation quality: -4pp  (new appeals team member, learning curve)
  Wrong denials being appealed: -2pp  (appealing denials where we were actually wrong)
  Appeal timeliness:            -1pp  (some appeals filed after payer deadline)
  Payer bad faith:              -1pp  (payer auto-denying all first-level appeals)
```

**Revenue impact formula**:
```
Appeal win rate revenue impact:
  Additional appeals lost = Appeal_volume x Win_rate_decline
  Revenue lost = Additional_lost_appeals x Avg_appeal_claim_value
  Example: 4,200 appeals/year x 14pp decline = 588 additional lost appeals
           588 x $1,850 avg = $1,087,800 additional annual revenue loss
```

---

### DRC-05: Why Are Timely Filing Denials Increasing?

**Root cause question**: CO-29 denials are trending up. What internal process is breaking down?

**Data signals**:
- CO-29 volume trended monthly
- CO-29 by payer (which payer's deadline are we missing?)
- Claim age at submission (DOS to submission date)
- Rejected claim rework turnaround time
- Coding backlog metrics

**Multi-factor decomposition**:
```
CO-29 increase: 0.8% -> 1.4% = +0.6pp

  Coding backlog:           +0.3pp (average coding TAT went from 4 days to 11 days)
  Rejected claim rework:    +0.2pp (rejected claims not corrected within 30 days)
  Payer deadline change:    +0.05pp (one payer shortened from 180 to 120 days)
  Missing from work queue:  +0.05pp (claims fell off follow-up queue)
```

**Revenue impact formula**:
```
CO-29 is 100% unrecoverable revenue loss
Revenue lost = CO_29_increase x Total_claims x Avg_claim_value
Example: 0.6pp x 142,000 claims x $385 = $327,960 permanently lost revenue
```

---

### DRC-06: Why is the Clean Claim Rate Falling?

**Root cause question**: Claims that pass through the scrubber without edits are declining. What quality issues are emerging?

**Data signals**:
- Clean claim rate trended
- Scrubber edit types triggered (which edits are firing?)
- Scrubber rule update recency
- Claim rejection rate at clearinghouse
- Payer-specific companion guide compliance

**Multi-factor decomposition**:
```
Clean claim rate decline: 96.2% -> 92.8% = -3.4pp

  New payer requirements not in scrubber:  -1.4pp
  Coding quality decline:                  -0.8pp
  Registration data quality:               -0.6pp
  Scrubber rules outdated:                 -0.4pp
  New CPT codes without validation rules:  -0.2pp
```

---

## SECTION F: PAYMENT ROOT CAUSES

### PRC-01: Why Are ERA Amounts Not Matching Bank Deposits?

**Root cause question**: ERA says we were paid $X but the bank shows $Y. Where is the difference?

**Data signals**:
- ERA total vs. bank deposit by day/payer
- Recoupment/offset amounts on ERAs
- EFT trace numbers vs. bank transaction IDs
- Multiple ERAs per single bank deposit
- Payer payment batching patterns

**Multi-factor decomposition**:
```
ERA-Bank variance sources:
  Payer recoupments/offsets:     $X (payer took back money from prior overpayments)
  ERA batching mismatch:         $Y (multiple ERAs in one bank deposit; timing difference)
  EFT processing lag:            $Z (ERA received but EFT not yet cleared)
  Payer payment errors:          $W (payer sent wrong amount via EFT)
  Missing ERAs:                  $V (payment received with no matching ERA)

EXAMPLE:
  ERA total for week: $1,240,000
  Bank deposits for week: $1,195,000
  Variance: -$45,000

  Payer recoupments:       -$32,000 (UHC offset for prior overpayment on 47 claims)
  EFT timing:              -$8,000  (Friday ERA, EFT clears Monday)
  Missing ERA:             -$5,000  (Cigna payment with no 835 -- need to request)
```

---

### PRC-02: Why Are Contractual Adjustments Higher Than Contract Terms?

**Root cause question**: The contractual write-offs on ERAs are larger than our contract rates would produce. Why?

**Data signals**:
- Expected contractual adjustment per claim (from contract rate tables) vs. actual CO-45
- Variance by CPT code within each payer
- Variance by date range (did it start at a specific time?)
- Contract effective dates and rate changes

**Multi-factor decomposition**:
```
Excess contractual adjustment sources:
  Wrong fee schedule loaded at payer:     $X (payer using old contract rates)
  Multiple procedure reduction error:     $Y (payer over-reducing for multiple procs)
  Incorrect bundling logic:               $Z (payer bundling procedures that should be separate)
  Sequestration applied to non-Medicare:  $W (payer incorrectly applying 2% cut)
  Geographic adjustment error:            $V (wrong locality/GPCI applied)
```

---

### PRC-03: Why Are Patient Balances Not Being Collected?

**Root cause question**: Patient responsibility is being correctly identified but patients are not paying. Why?

**Data signals**:
- Patient collection rate (amount collected / amount billed to patient)
- Statement delivery confirmation rate
- Statement-to-payment conversion rate
- Payment plan enrollment rate
- Payment plan compliance rate
- Financial assistance screening rate
- Propensity-to-pay score distribution

**Multi-factor decomposition**:
```
Patient collection rate decline: 62% -> 54% = -8pp

  Statement delivery issues:     -3pp (wrong address; email statements going to spam)
  Higher balances:               -2pp (avg patient balance up $180 -- sticker shock)
  Payment plan not offered:      -1.5pp (patients not offered installments)
  Financial assistance gap:      -1pp (eligible patients not screened for charity care)
  Collection follow-up:          -0.5pp (fewer follow-up calls made)
```

**Revenue impact formula**:
```
Patient collection revenue impact:
  Collection_rate_decline x Total_patient_responsibility = Revenue lost
  Example: 8pp x $3,200,000 annual patient responsibility = $256,000
```

---

### PRC-04: Why Are Secondary Claims Not Being Filed?

**Root cause question**: We have patients with secondary insurance but are not filing secondary claims. Revenue is being left on the table.

**Data signals**:
- Claims with secondary insurance on file but no secondary claim submitted
- Primary EOB/ERA received but secondary not generated
- Secondary claim submission rate
- Time from primary ERA to secondary submission

**Multi-factor decomposition**:
```
Secondary claim filing gap:
  Primary ERA not triggering secondary:   X claims (system automation gap)
  Secondary payer info not captured:       Y claims (registration did not get secondary)
  Manual secondary process backlog:        Z claims (manual workflow overwhelmed)
  Secondary payer rejecting claims:        W claims (data quality on secondary claims)

EXAMPLE:
  Patients with secondary insurance: 18% of volume = 25,560 claims/year
  Secondary claims filed: 21,200 = 83% filing rate
  Missing secondary claims: 4,360 claims x $185 avg secondary payment = $806,600/year unfiled
```

---

## SECTION G: OPERATIONAL ROOT CAUSES

### ORC-01: Why is FTE Productivity Declining?

**Root cause question**: Each AR follow-up specialist is resolving fewer claims per day. Why?

**Data signals**:
- Claims resolved per FTE per day trended
- Average handle time per claim
- Denial complexity distribution (are denials getting harder?)
- System downtime / login issues
- Training hours vs. production hours
- Work queue load balancing

**Multi-factor decomposition**:
```
FTE productivity decline: 42 claims/day -> 37 claims/day = -5 claims/day

  Denial complexity increase:    -2 claims/day (more complex denials require more research)
  System performance issues:     -1 claim/day  (PMS slowness, multiple system logins)
  New employee ramp-up:          -1 claim/day  (3 new hires in 90-day training)
  Work queue imbalance:          -0.5 claims   (some queues overloaded, some empty)
  Meeting/admin time increase:   -0.5 claims   (new reporting requirements)
```

**Revenue impact formula**:
```
Productivity revenue impact:
  Claims_not_worked = FTE_count x Productivity_decline x Working_days
  Revenue at risk = Claims_not_worked x Avg_claim_value x Probability_of_loss
  Example: 12 FTEs x 5 fewer claims x 22 days = 1,320 claims/month not worked
           1,320 x $385 x 15% probability of timely filing loss = $76,230/month
```

---

### ORC-02: Why Are Claim Touches Per Resolution Increasing?

**Root cause question**: Each claim requires more interactions before it is resolved. Why?

**Data signals**:
- Average touch count per claim at resolution
- Touch count by denial type
- Rework cycles (claim denied, corrected, resubmitted, denied again)
- Payer response time to appeals
- Information requests from payers

**Multi-factor decomposition**:
```
Touch count increase: 2.4 touches -> 3.1 touches = +0.7 touches/claim

  Payer requesting additional documentation:  +0.3 touches (payers asking for more info per claim)
  Incorrect first rework:                     +0.2 touches (claim corrected wrong, denied again)
  Payer appeal process complexity:             +0.1 touches (multi-level appeal required)
  Internal routing errors:                     +0.1 touches (claim routed to wrong queue)
```

**Revenue impact formula**:
```
Cost of additional touches:
  Additional_touches x Volume x Cost_per_touch = Rework cost
  Example: 0.7 x 18,400 denied claims x $18/touch = $231,840 additional annual rework cost
```

---

### ORC-03: Why is the Eligibility Verification Failure Rate Climbing?

**Root cause question**: We are checking eligibility but still getting eligibility-related denials. Why is the verification not working?

**Data signals**:
- Eligibility check completion rate
- Time between eligibility check and service date
- Eligibility check result accuracy (was the patient really eligible?)
- 270/271 transaction success rate
- Manual vs. automated eligibility check rate

**Multi-factor decomposition**:
```
Eligibility verification failures:
  Check done too early (stale data):    40% (checked at scheduling but not at service)
  Check returned inaccurate data:       25% (payer 271 response was wrong)
  Check not done at all:                20% (walk-ins, add-ons, emergency)
  Check done but result not acted on:   15% (system showed ineligible but service rendered anyway)
```

---

### ORC-04: Why is the Prior Authorization Process Breaking Down?

**Root cause question**: Auth-related denials are the number one denial category. What is failing in the auth workflow?

**Data signals**:
- Auth requirement identification rate (did we know auth was needed?)
- Auth submission rate (did we actually submit the auth?)
- Auth approval rate (did we get the auth?)
- Auth-to-claim linking rate (did the auth make it onto the 837?)
- Auth expiration tracking (did the auth expire before service?)

**Multi-factor decomposition**:
```
Auth denial decomposition (CO-197 + CO-151 + CO-204):
  Auth not identified as needed:     35% (payer auth list not current in our system)
  Auth identified but not submitted: 20% (workflow gap, fell through the cracks)
  Auth submitted but denied:         15% (clinical documentation insufficient for auth)
  Auth approved but not on claim:    12% (auth number not linked to claim in billing system)
  Auth expired before service:       10% (surgery rescheduled but auth not extended)
  Auth for wrong CPT/provider:       8%  (service changed from what was authorized)
```

---

### ORC-05: Why is the CDI Program Not Reducing Medical Necessity Denials?

**Root cause question**: We have a CDI program but CO-50 denials are not declining. Why is CDI not effective?

**Data signals**:
- CDI review rate (what percentage of cases are reviewed?)
- CDI query rate (how often does CDI query physicians?)
- CDI query response rate and response time
- CC/MCC capture rate
- CO-50 denial rate pre-CDI vs. post-CDI by service line

**Multi-factor decomposition**:
```
CDI program effectiveness gaps:
  CDI not reviewing high-risk cases:   30% (CDI focused on DRG, not payer denials)
  CDI queries not answered by MDs:     25% (physician response rate only 58%)
  CDI using wrong criteria:            20% (CDI using InterQual; payer uses MCG)
  CDI review too late (post-discharge): 15% (concurrent review not happening)
  CDI not targeting payer-specific reqs: 10% (generic CDI, not payer-customized)
```

---

### ORC-06: Why is the Claim Scrubber Not Catching Errors?

**Root cause question**: Claims are being denied for issues the scrubber should have caught. Why is the scrubber failing?

**Data signals**:
- Claims denied for scrubber-catchable errors (CO-4, CO-11, CO-16, CO-97)
- Scrubber edit rule update recency
- Scrubber override rate (how often do billers override scrubber edits?)
- Payer-specific rules in scrubber vs. payer companion guide requirements

**Multi-factor decomposition**:
```
Scrubber failure modes:
  Rules outdated:                35% (scrubber rules not updated for current payer requirements)
  Rules overridden by billers:   25% (billers overriding legitimate edits to clear work queues)
  Payer-specific rules missing:  20% (scrubber only has CMS rules, not commercial payer rules)
  New CPT codes not covered:     10% (annual CPT updates not loaded into scrubber)
  Configuration errors:          10% (rules loaded incorrectly after last update)
```

---

### ORC-07: Why is Provider Enrollment Causing Denials?

**Root cause question**: We have providers who are credentialed but still getting out-of-network or non-enrolled denials. Why?

**Data signals**:
- Provider enrollment status by payer
- Enrollment effective dates vs. service dates
- CAQH profile completeness
- Revalidation due dates
- New provider time-to-enrollment

**Multi-factor decomposition**:
```
Enrollment denial root causes:
  New provider not yet enrolled:     40% (avg 90-120 days to enroll; services rendered before enrollment effective)
  Enrollment lapsed/expired:         25% (revalidation not submitted timely)
  Wrong provider NPI on claim:       15% (supervising vs. rendering NPI confusion)
  Provider not enrolled for location: 10% (enrolled at site A, billed from site B)
  Payer terminated enrollment:       10% (payer dropped provider without notice)
```

---

### ORC-08: Why is Registration Data Quality Declining?

**Root cause question**: Front-end registration errors are causing downstream denials. What is happening at check-in?

**Data signals**:
- Registration error rate
- Claim denial rate for demographics-related CARCs
- Insurance verification completion rate at registration
- Staff turnover at front desk
- Registration training completion rate

**Multi-factor decomposition**:
```
Registration error types:
  Wrong insurance ID number:      30% (typos, transposed digits, old card)
  Wrong subscriber relationship:  20% (subscriber vs. dependent confusion)
  Missing secondary insurance:    18% (patient did not disclose; staff did not ask)
  Wrong POS/facility code:        12% (system default not updated for location)
  Wrong patient demographics:     10% (name spelling, DOB, address)
  Missing accident/injury info:   10% (workers comp and auto accident fields empty)
```

---

### ORC-09: Why is the Payment Posting Process Creating Downstream Issues?

**Root cause question**: Payments are being posted inaccurately, creating false revenue, incorrect patient balances, and missed underpayments.

**Data signals**:
- Posting accuracy rate (audited sample)
- Unapplied payment aging
- Credit balance volume
- Patient complaint volume about incorrect bills
- ERA auto-posting rate vs. manual posting rate

**Multi-factor decomposition**:
```
Posting error types:
  Payment posted to wrong patient/claim:     25%
  Adjustment codes posted incorrectly:       20%
  Contractual vs. write-off misclassification: 20%
  Partial payment not triggering follow-up:   15%
  Denial posted as adjustment (not denial):   10%
  Payment amount posted incorrectly:          10%
```

---

### ORC-10: Why Are Follow-Up Queues Not Being Worked Effectively?

**Root cause question**: AR follow-up is happening but claims are not getting resolved. Why are touches not productive?

**Data signals**:
- Resolution rate per queue
- Average age of claims in queue
- Queue assignment logic (is it optimized?)
- Payer response patterns (which payers respond and which do not?)
- Escalation rates

**Multi-factor decomposition**:
```
Unproductive follow-up causes:
  Payer not responding to inquiries:     30% (calls go to hold; portal shows "in process")
  Following up on wrong claims first:    25% (FIFO instead of highest-dollar-first)
  Insufficient information for resolution: 20% (need clinical docs but cannot access them)
  Duplicate follow-up efforts:           15% (multiple people working same claim)
  No escalation pathway:                 10% (no process for claims stuck > 60 days)
```

---

## SECTION H: ROOT CAUSE INTERACTION MAP

Root causes do not exist in isolation. They interact and compound. Here are the most dangerous interaction patterns:

### H-01: The Denial Cascade
```
Registration enters wrong insurance ID (ORC-08)
  -> Claim rejected by clearinghouse (caught in 2 days if monitored)
  -> If NOT caught: claim denied by payer for invalid subscriber (CO-16)
  -> Rework and resubmit (adds 14-21 days)
  -> If timely filing window is short: CO-29 (permanent revenue loss)

Revenue impact: a $5 registration error becomes a $385 permanent loss
```

### H-02: The Documentation Death Spiral
```
CDI program not targeting payer-specific criteria (ORC-05)
  -> Physician documentation does not meet payer threshold (CO-50)
  -> Claim denied for medical necessity
  -> Appeal filed with same insufficient documentation
  -> Appeal denied (appeal win rate declines)
  -> Second-level appeal costs $85 per claim
  -> If lost at second level: $2,400 avg claim value lost
  -> CDI program appears ineffective -> budget cut -> more denials

Revenue impact: CDI program failure compounds at every step
```

### H-03: The Underpayment Invisibility Problem
```
Contract rates not loaded in payment variance system (ORC-09)
  -> Payer underpays by 4% on 12,000 claims (PRC-02)
  -> CO-45 posted as "contractual adjustment" (looks normal)
  -> Nobody investigates because claim shows "paid"
  -> 12 months pass before contract audit catches it
  -> Payer only allows 90-day lookback for disputes
  -> 9 months of underpayment is permanently lost

Revenue impact: $412 avg claim x 12,000 claims x 4% underpayment x 9/12 months
             = $148,320 permanently lost from delayed detection
```

### H-04: The Prior Auth Compounding Failure
```
Payer expands auth requirements (DRC-01)
  -> Auth system not updated with new requirements (ORC-04)
  -> Services rendered without required auth
  -> CO-197 denials spike
  -> Retroactive auth attempted but payer denies retroactive
  -> Appeal filed but payer policy is clear: no retro auth
  -> Revenue permanently lost
  -> Meanwhile, more services rendered without auth (lag in awareness)
  -> 60-90 days of denials accumulate before process is fixed

Revenue impact: new auth requirement x daily volume x 60-90 days x avg claim value
             = potentially $500K-2M depending on service volume
```

### H-05: The Payer Mix and Denial Rate Double Hit
```
Payer mix shifts toward higher-denial-rate payers (RRC-02)
  -> Overall denial rate increases even though per-payer rates are stable (RRC-05)
  -> Revenue declines from both lower rates AND higher denials
  -> Cost-to-collect increases (more denials to work)
  -> FTE productivity drops (more complex work)
  -> AR ages because denial resolution takes longer
  -> Write-offs increase from aged AR
  -> Cash flow declines

Revenue impact: this cascade can account for 40-60% of revenue deterioration
```

---

## SECTION I: ROOT CAUSE INVESTIGATION FRAMEWORK

For any revenue or denial problem, use this structured investigation approach:

### Step 1: Quantify the Problem
```
What is the dollar impact?
What is the trend (getting worse, stable, improving)?
When did it start?
```

### Step 2: Segment the Problem
```
By payer: is it one payer or all payers?
By CARC code: is it one denial type or multiple?
By service line: is it one department or all?
By provider: is it one physician or all?
By time: did it start at a specific date?
```

### Step 3: Identify the Inflection Point
```
What changed at the time the problem started?
  - Payer policy change?
  - Staff turnover?
  - System change?
  - Contract renewal?
  - New service line launch?
  - Regulatory update?
```

### Step 4: Determine the Root Cause Category
```
Is this a REVENUE root cause? (Section A -- RRC)
Is this a CASH FLOW root cause? (Section B -- CRC)
Is this a GROSS-TO-NET root cause? (Section C -- GNR)
Is this a COST-TO-COLLECT root cause? (Section D -- CTC)
Is this a DENIAL PATTERN root cause? (Section E -- DRC)
Is this a PAYMENT root cause? (Section F -- PRC)
Is this an OPERATIONAL root cause? (Section G -- ORC)
```

### Step 5: Multi-Factor Decomposition
```
What percentage of the problem is attributable to each contributing factor?
Assign weights that sum to 100%
Validate with data
```

### Step 6: Revenue Impact Chain
```
Root cause -> claim-level impact -> denial volume -> dollar impact
Calculate: if we fix this, how much revenue do we recover?
Calculate: what does it cost to fix?
ROI = revenue recovered / cost to fix
Prioritize highest-ROI root causes first
```

### Step 7: Connect to Prevention
```
What process change prevents this root cause from recurring?
What system rule catches this before the claim is submitted?
What monitoring detects this if it starts happening again?
```

---

## SECTION J: ROOT CAUSE DATA REQUIREMENTS

For the engine to perform all analyses in this document, it needs these data streams:

| Data Stream | Source | Update Frequency | Used In |
|-------------|--------|-----------------|---------|
| 835/ERA transaction data | Clearinghouse | Daily | All payment and denial analysis |
| 837 claim submission data | Billing system | Daily | Clean claim rate, submission analysis |
| Bank deposit/EFT data | Bank feed | Daily | ERA-bank reconciliation, float analysis |
| Contract rate tables | Payer contracts | On change | Underpayment detection, CO-45 validation |
| CARC/RARC taxonomy | CMS + internal mapping | Quarterly | All denial root cause analysis |
| Payer policy bulletins | Payer portals | On publication | Policy change impact analysis |
| Provider enrollment status | CAQH/payer portals | Monthly | Credentialing denial prevention |
| NCCI edits | CMS | Quarterly | Bundling analysis, CO-97 root cause |
| CDI query/response log | CDI system | Real-time | Documentation gap analysis |
| Eligibility 270/271 data | Eligibility vendor | Real-time | Eligibility failure analysis |
| Prior auth records | Auth system | Real-time | Auth workflow analysis |
| Appeal outcomes | Appeal system | On resolution | Appeal win rate analysis, weight recalibration |
| Coding audit results | Audit system | Monthly | Coding quality analysis |
| Work queue activity logs | All work queues | Real-time | Operational efficiency analysis |
| Charge master / CDM | Revenue cycle | On change | Charge capture, OA-94 analysis |
| Patient demographic data | Registration | Real-time | Registration error analysis |
| AR aging snapshots | Billing system | Weekly | AR aging trend analysis |
| Write-off detail | Billing system | Daily | Write-off pattern analysis |
| FTE productivity metrics | Workforce management | Daily | Productivity analysis |
| Encounter/scheduling data | EHR/scheduling | Real-time | Volume and charge capture analysis |

---

## TOTAL ROOT CAUSE ITEMS IN THIS DOCUMENT

| Section | Category | Item Count |
|---------|----------|-----------|
| Level 1 | CO codes (21 codes, deep analysis) | 21 |
| Level 1 | PR codes (3 codes + incorrect scenarios) | 9 |
| Level 1 | OA codes (5 codes) | 5 |
| Level 2 - A | Revenue root causes (RRC-01 through RRC-07) | 7 |
| Level 2 - B | Cash flow root causes (CRC-01 through CRC-06) | 6 |
| Level 2 - C | Gross-to-net root causes (GNR-01 through GNR-03) | 3 |
| Level 2 - D | Cost-to-collect root causes (CTC-01) | 1 |
| Level 2 - E | Denial pattern root causes (DRC-01 through DRC-06) | 6 |
| Level 2 - F | Payment root causes (PRC-01 through PRC-04) | 4 |
| Level 2 - G | Operational root causes (ORC-01 through ORC-10) | 10 |
| Level 2 - H | Root cause interactions (H-01 through H-05) | 5 |
| Sub-decompositions | Multi-factor breakdowns within each item | 80+ |
| **TOTAL** | | **157+ distinct root cause items** |

Every item connects UPWARD to revenue impact and DOWNWARD to specific data signals.
Every CARC code maps to actual root cause from 20 years of working denials.
Every system-level root cause includes real-number examples and formulas.

This is the foundation for:
- Document 3 (Diagnostic Suggestions): what to recommend when a root cause is identified
- Document 5 (Automation): what to automate to prevent root causes from recurring
- Document 6 (Prevention): how to stop root causes before they create denials
