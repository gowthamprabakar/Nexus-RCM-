import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { AIInsightCard, ConfidenceBar, DateRangePicker, FilterChip, FilterChipGroup, RootCauseInvestigationPanel } from '../../../components/ui';
import { AppealSuccessBadge } from '../../../components/predictions';
import AppealWorkbench from './AppealPipelineTracker';
import { cn } from '../../../lib/utils';

// ── Shared currency formatter ───────────────────────────────────────────────
function fmtCurrency(amount) {
 if (amount == null) return '$0';
 const abs = Math.abs(amount);
 if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
 if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
 return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// ── Heatmap fallback data (replaced by API at runtime) ──────────────────────
const FALLBACK_HEATMAP_PAYERS = ['Medicare', 'UHC', 'Aetna', 'Cigna'];
const FALLBACK_HEATMAP_DEPTS = ['Radiology', 'Cardiology', 'Emergency', 'Oncology', 'Surgery'];
const FALLBACK_HEATMAP_DATA = {
 Medicare: [12, 68, 41, 89, 15],
 UHC: [82, 38, 10, 55, 33],
 Aetna: [35, 14, 78, 29, 62],
 Cigna: [8, 52, 30, 11, 9],
};

function heatmapColor(value) {
 if (value >= 75) return 'bg-th-danger';
 if (value >= 60) return 'bg-th-danger/80';
 if (value >= 45) return 'bg-th-warning';
 if (value >= 30) return 'bg-th-warning/70';
 if (value >= 15) return 'bg-th-success/70';
 return 'bg-th-success';
}
function heatmapText(value) {
 if (value >= 60) return 'text-th-heading';
 return 'text-th-heading';
}

// ── Root cause fallback data (replaced by API at runtime) ────────────────────
const FALLBACK_ROOT_CAUSES = [
 { label: 'Eligibility', pct: 22, color: 'rgb(var(--color-info))' },
 { label: 'Authorization', pct: 18, color: 'rgb(var(--color-primary))' },
 { label: 'Coding/Bundling', pct: 16, color: 'rgb(var(--color-info) / 0.7)' },
 { label: 'Medical Necessity', pct: 14, color: 'rgb(var(--color-warning))' },
 { label: 'Non-Covered', pct: 8, color: 'rgb(var(--color-success))' },
 { label: 'Missing Info', pct: 7, color: 'rgb(var(--color-text-secondary))' },
 { label: 'Duplicate', pct: 5, color: 'rgb(var(--color-danger))' },
 { label: 'Timely Filing', pct: 4, color: 'rgb(var(--color-warning) / 0.8)' },
 { label: 'COB', pct: 3, color: 'rgb(var(--color-info) / 0.5)' },
 { label: 'Contractual', pct: 3, color: 'rgb(var(--color-text-muted))' },
];

// Color palette for root-cause categories from API
const ROOT_CAUSE_COLORS = [
  'rgb(var(--color-info))', 'rgb(var(--color-primary))', 'rgb(var(--color-info) / 0.7)',
  'rgb(var(--color-warning))', 'rgb(var(--color-success))', 'rgb(var(--color-text-secondary))',
  'rgb(var(--color-danger))', 'rgb(var(--color-warning) / 0.8)', 'rgb(var(--color-info) / 0.5)',
  'rgb(var(--color-text-muted))',
];

function DonutChart({ data, size = 180, stroke = 28 }) {
 const radius = (size - stroke) / 2;
 const circumference = 2 * Math.PI * radius;
 let cumulative = 0;

 return (
 <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
 {data.map((slice, i) => {
 const dashLen = (slice.pct / 100) * circumference;
 const dashOffset = -(cumulative / 100) * circumference;
 cumulative += slice.pct;
 return (
 <circle
 key={i}
 cx={size / 2}
 cy={size / 2}
 r={radius}
 fill="none"
 stroke={slice.color}
 strokeWidth={stroke}
 strokeDasharray={`${dashLen} ${circumference - dashLen}`}
 strokeDashoffset={dashOffset}
 strokeLinecap="butt"
 />
 );
 })}
 </svg>
 );
}

// MOCK_APPEALS removed — denial rows now come entirely from api.denials.list()

const PAGE_SIZE = 5;

// Per-claim AI intelligence data — matches wireframe cfNodes + rcCallout per claim
const CLAIM_DETAIL = {
  'CLM-8821': {
    dos:'2024-01-15', denied:'2024-01-22', daysOut:72, daysLeft:102,
    rcCallout:'Root cause: Prior auth PA-2024-8821 exists and is valid but was not electronically attached at submission. Highly recoverable — administrative error, not clinical.',
    rcSentiment:'warn',
    rca: {
      descriptive:'Medicare denied CLM-8821 for missing prior authorization (CO-16). DOS 2024-01-15, CPT 99215 × 1 unit, Billed $4,200. Provider: Dr. Martinez. Patient: Sarah Johnson MRN-10284.',
      graphEv:'Graph trace: Patient Access → Auth check skipped → Claim submitted without PA-2024-8821 attachment. Auth exists and valid. 847 historical CO-16 matches — 67% admin error.',
      graphConf:'89pts confidence · HISTORICALLY_DENIES edge: Medicare→AUTH_MISSING (weight 0.67) · 4 hops',
      denialProb:23, appealSuccess:87, writeOff:8, carcPred:'CO-16', payDelay:'+3d', claimValue:82,
      agents:[{name:'Denial Validator',pct:89},{name:'Auth Checker',pct:95},{name:'Code Reviewer',pct:82},{name:'Appeal Assessor',pct:87},{name:'Payer Behaviour',pct:91},{name:'Historical Match',pct:88}],
      mfVerdict:'CONFIRMED: Auth PA-2024-8821 is valid for DOS. Administrative error at submission — not a clinical denial. Appeal recommended with auth documentation attached.',
      mfConf:87, agentCount:47, simCount:203,
      resolution:'Submit appeal with: (1) Auth PA-2024-8821 copy, (2) PAR letter, (3) Clinical notes DOS 2024-01-15. AI letter drafted at 91% confidence. Est. recovery $4,200 in 14–21 days.',
      appealDrafted:true,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'warn',icon:'🔑',name:'Prior Auth',status:'⚠ Skipped!'},
      {type:'ok',icon:'🔍',name:'CRS Scrub',status:'✓ Score: 78'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-16'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✓ CONF 87%'},
      {type:'ok',icon:'📄',name:'AI Appeal',status:'87% win'},
    ],
  },
  'CLM-9041': {
    dos:'2024-01-20', denied:'2024-01-28', daysOut:65, daysLeft:107,
    rcCallout:'Root cause: CPT 99215 does not match diagnosis M54.5 under BCBS TX coding policy. This is a genuine coding error — correct before submitting.',
    rcSentiment:'danger',
    rca: {
      descriptive:'BCBS TX denied CLM-9041 for coding error (CO-4). DOS 2024-01-20, CPT 99215 billed, diagnosis mismatch flagged. Billed $12,400. Provider: Dr. Martinez.',
      graphEv:'Graph trace: Coding → CPT 99215 diagnosis mismatch → BCBS TX policy requires ICD-10 Z00.00 for preventive visit CPT. Used M54.5 — mismatch triggers CO-4.',
      graphConf:'81pts confidence · DENIES_FOR edge: BCBS_TX→CPT_DX_MISMATCH (weight 0.81) · 3 hops',
      denialProb:91, appealSuccess:34, writeOff:67, carcPred:'CO-4', payDelay:'+8d', claimValue:44,
      agents:[{name:'Denial Validator',pct:93},{name:'Auth Checker',pct:72},{name:'Code Reviewer',pct:95},{name:'Appeal Assessor',pct:38},{name:'Payer Behaviour',pct:88},{name:'Historical Match',pct:91}],
      mfVerdict:'DISPUTED: CPT 99215 coding does not align with diagnosis M54.5 for BCBS TX policy. Coding correction recommended before appeal.',
      mfConf:61, agentCount:47, simCount:203,
      resolution:'CODING REVIEW REQUIRED before appeal. Correct CPT or update diagnosis code. Consult Dr. Martinez. After coding fix: resubmit, do not appeal current denial.',
      appealDrafted:false,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ Not needed'},
      {type:'fail',icon:'🔍',name:'CRS Scrub',status:'⚠ Score: 54'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-4'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✗ DISP 61%'},
      {type:'neutral',icon:'📝',name:'Code Review',status:'Needed'},
    ],
  },
  'CLM-7788': {
    dos:'2024-02-01', denied:'2024-02-09', daysOut:58, daysLeft:119,
    rcCallout:'Root cause: Billing system migration Jan 2024 triggered duplicate submission. System error — original claim paid. Recoverable via appeal.',
    rcSentiment:'warn',
    rca: {
      descriptive:'Aetna denied CLM-7788 as duplicate claim (CO-97). DOS 2024-02-01, CPT 99213, $8,400. Same DOS + CPT submitted twice due to billing system migration.',
      graphEv:'Graph trace: Billing system migration → duplicate submission pathway → auto-submit triggered same claim twice. Second denied CO-97.',
      graphConf:'94pts confidence · DUPLICATE_PATH edge: Billing→Migration_Error (weight 0.94) · 2 hops',
      denialProb:62, appealSuccess:74, writeOff:18, carcPred:'CO-97', payDelay:'+2d', claimValue:68,
      agents:[{name:'Denial Validator',pct:78},{name:'Auth Checker',pct:88},{name:'Code Reviewer',pct:76},{name:'Appeal Assessor',pct:74},{name:'Payer Behaviour',pct:82},{name:'Historical Match',pct:80}],
      mfVerdict:'CONFIRMED: Duplicate is a system error from billing migration. Original claim paid. Appeal with migration evidence will be upheld.',
      mfConf:74, agentCount:47, simCount:203,
      resolution:'Submit appeal with: (1) Evidence of original payment CLM-7781, (2) EHR migration documentation. 74% win rate.',
      appealDrafted:true,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ Not needed'},
      {type:'ok',icon:'🔍',name:'CRS Scrub',status:'✓ Score: 74'},
      {type:'warn',icon:'📤',name:'Submitted',status:'⚠ 2x sent!'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-97 Dup'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✓ CONF 74%'},
      {type:'ok',icon:'📄',name:'AI Appeal',status:'74% win'},
    ],
  },
  'CLM-7204': {
    dos:'2024-02-10', denied:'2024-02-20', daysOut:50, daysLeft:128,
    rcCallout:'Root cause: Modifier -GP missing from CPT 97110 under UHC policy. Await MiroFish for final recommendation.',
    rcSentiment:'warn',
    rca: {
      descriptive:'UHC denied CLM-7204 for medical necessity (PR-50). DOS 2024-02-10, CPT 97110, $2,800. Missing modifier.',
      graphEv:'Graph trace: CPT 97110 → UHC policy requires modifier -GP or -GN → modifier absent → auto-deny PR-50.',
      graphConf:'71pts confidence · MED_NECESSITY edge: UHC→MODIFIER_MISSING (weight 0.71) · 3 hops',
      denialProb:78, appealSuccess:52, writeOff:35, carcPred:'PR-50', payDelay:'+6d', claimValue:55,
      agents:[{name:'Denial Validator',pct:78},{name:'Auth Checker',pct:66},{name:'Code Reviewer',pct:82},{name:'Appeal Assessor',pct:51},{name:'Payer Behaviour',pct:74},{name:'Historical Match',pct:68}],
      mfVerdict:'PENDING — swarm simulation running. Preliminary: modifier -GP appears appropriate. 52% appeal success estimated.',
      mfConf:0, agentCount:47, simCount:0,
      resolution:'Await MiroFish swarm completion. Add modifier -GP to CPT 97110, attach clinical documentation. 52% win rate estimated.',
      appealDrafted:false,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ On file'},
      {type:'warn',icon:'🔍',name:'CRS Scrub',status:'⚠ Score: 71'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'PR-50'},
      {type:'neutral',icon:'⏳',name:'MiroFish',status:'Running...'},
      {type:'neutral',icon:'📝',name:'Pending',status:'Await result'},
    ],
  },
  'CLM-6632': {
    dos:'2024-02-15', denied:'2024-02-23', daysOut:44, daysLeft:133,
    rcCallout:'Root cause: Prior auth expired 5 days before DOS. Retroactive auth appeal — 81% success under Cigna policy.',
    rcSentiment:'warn',
    rca: {
      descriptive:'Cigna denied CLM-6632 for auth expired (CO-16). DOS 2024-02-15, CPT 90837, $3,900. Auth expired 2024-02-10.',
      graphEv:'Graph trace: Auth PA-2024-0112 expired 2024-02-10 → claim DOS 5 days post-expiry → Cigna CO-16 auto-denial.',
      graphConf:'86pts confidence · AUTH_EXPIRED edge: Cigna→EXPIRED_AUTH (weight 0.86) · 3 hops',
      denialProb:42, appealSuccess:81, writeOff:12, carcPred:'CO-16', payDelay:'+4d', claimValue:74,
      agents:[{name:'Denial Validator',pct:84},{name:'Auth Checker',pct:92},{name:'Code Reviewer',pct:79},{name:'Appeal Assessor',pct:81},{name:'Payer Behaviour',pct:88},{name:'Historical Match',pct:83}],
      mfVerdict:'CONFIRMED: Renewal request initiated before DOS but not confirmed. Cigna allows retroactive auth in renewal delay cases. 81% win.',
      mfConf:81, agentCount:47, simCount:203,
      resolution:'Appeal with: (1) Auth renewal request dated 2024-02-08, (2) Clinical notes, (3) Cigna retroactive auth policy citation. 81% win rate.',
      appealDrafted:true,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'warn',icon:'🔑',name:'Prior Auth',status:'⚠ Expired!'},
      {type:'ok',icon:'🔍',name:'CRS Scrub',status:'✓ Score: 74'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-16'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✓ CONF 81%'},
      {type:'ok',icon:'📄',name:'AI Appeal',status:'81% win'},
    ],
  },
  'CLM-5510': {
    dos:'2024-01-25', denied:'2024-02-01', daysOut:68, daysLeft:112,
    rcCallout:'Root cause: CPT 99215 requires 5-component exam — only 3 documented. Downcode to 99214 and resubmit.',
    rcSentiment:'danger',
    rca: {
      descriptive:'Medicare denied CLM-5510 CO-4. DOS 2024-01-25, CPT 99215, $6,100. Documentation insufficient for complexity level.',
      graphEv:'Graph trace: CPT 99215 → Medicare 5-component requirement → only 3 documented → complexity mismatch → CO-4.',
      graphConf:'77pts confidence · CODING_AUDIT edge: Medicare→COMPLEXITY_INSUFFICIENT (weight 0.77) · 4 hops',
      denialProb:84, appealSuccess:28, writeOff:41, carcPred:'CO-4', payDelay:'+7d', claimValue:38,
      agents:[{name:'Denial Validator',pct:88},{name:'Auth Checker',pct:71},{name:'Code Reviewer',pct:93},{name:'Appeal Assessor',pct:29},{name:'Payer Behaviour',pct:81},{name:'Historical Match',pct:84}],
      mfVerdict:'DISPUTED: Documentation only supports CPT 99214. Downcoding and resubmission recommended over appeal.',
      mfConf:68, agentCount:47, simCount:203,
      resolution:'DO NOT APPEAL — downcode to CPT 99214 and resubmit. 28% win rate only if appealed as-is.',
      appealDrafted:false,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ Not needed'},
      {type:'warn',icon:'🔍',name:'CRS Scrub',status:'⚠ Score: 62'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-4'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✗ DISP 68%'},
      {type:'neutral',icon:'📝',name:'Recode',status:'99214 rec.'},
    ],
  },
  'CLM-4821': {
    dos:'2024-02-05', denied:'2024-02-14', daysOut:55, daysLeft:123,
    rcCallout:'Root cause: Modifier-25 missing from same-day E&M. Correctable via appeal — 71% success rate.',
    rcSentiment:'warn',
    rca: {
      descriptive:'BCBS TX denied CLM-4821 CO-4. DOS 2024-02-05, CPT 99213, Modifier-25 missing for same-day procedure. $4,800.',
      graphEv:'Graph trace: Same-day E&M + procedure → BCBS TX requires Modifier-25 → absent → CO-4.',
      graphConf:'88pts confidence · MODIFIER_REQUIRED edge: BCBS_TX→MOD25_MISSING (weight 0.88) · 3 hops',
      denialProb:55, appealSuccess:71, writeOff:22, carcPred:'CO-4', payDelay:'+3d', claimValue:66,
      agents:[{name:'Denial Validator',pct:78},{name:'Auth Checker',pct:82},{name:'Code Reviewer',pct:91},{name:'Appeal Assessor',pct:71},{name:'Payer Behaviour',pct:86},{name:'Historical Match',pct:79}],
      mfVerdict:'CONFIRMED: Modifier-25 required for same-day E&M + procedure. Clinical documentation supports separate evaluation. Appeal appropriate.',
      mfConf:71, agentCount:47, simCount:203,
      resolution:'Appeal with Modifier-25 added to CPT 99213 plus documentation showing separate significant evaluation. 71% win rate.',
      appealDrafted:true,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ Not needed'},
      {type:'warn',icon:'🔍',name:'CRS Scrub',status:'⚠ Score: 66'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-4'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✓ CONF 71%'},
      {type:'ok',icon:'📄',name:'Appeal',status:'71% win'},
    ],
  },
  'CLM-3301': {
    dos:'2023-11-01', denied:'2024-02-15', daysOut:124, daysLeft:27,
    rcCallout:'Root cause: Timely filing exceeded by 17 days. Only 22% appeal success. Decide now — 27 days remaining.',
    rcSentiment:'danger',
    rca: {
      descriptive:'Humana denied CLM-3301 CO-29. DOS 2023-11-01, $9,800. Filed 107 days from DOS — Humana 90-day limit exceeded by 17 days.',
      graphEv:'Graph trace: DOS 2023-11-01 → 90-day limit → filed 107 days → 17 days past → CO-29. No extension on file.',
      graphConf:'91pts confidence · TIMELY_FILING edge: Humana→EXCEEDED_LIMIT (weight 0.91) · 2 hops',
      denialProb:68, appealSuccess:22, writeOff:72, carcPred:'CO-29', payDelay:'+14d', claimValue:28,
      agents:[{name:'Denial Validator',pct:91},{name:'Auth Checker',pct:74},{name:'Code Reviewer',pct:68},{name:'Appeal Assessor',pct:22},{name:'Payer Behaviour',pct:78},{name:'Historical Match',pct:88}],
      mfVerdict:'DISPUTED: Timely filing exceeded. No extension identified. 22% appeal success. Consider write-off unless system delay documentation exists.',
      mfConf:61, agentCount:47, simCount:203,
      resolution:'URGENT — 27 days remaining. LOW PROBABILITY (22%). Appeal only if billing system delay documentation exists. Otherwise recommend write-off review.',
      appealDrafted:false,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ On file'},
      {type:'ok',icon:'🔍',name:'CRS Scrub',status:'✓ Score: 74'},
      {type:'fail',icon:'📤',name:'Filed Late',status:'107 days!'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-29'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✗ DISP 61%'},
      {type:'neutral',icon:'⚠️',name:'27d Left',status:'Decide now'},
    ],
  },
  'CLM-2910': {
    dos:'2024-02-18', denied:'2024-02-28', daysOut:35, daysLeft:136,
    rcCallout:'Root cause: CPT 99213 does not pair with Z12.11 screening diagnosis. Resubmit with G0202 — 79% success.',
    rcSentiment:'warn',
    rca: {
      descriptive:'Medicare denied CLM-2910 CO-11. DOS 2024-02-18, CPT 99213, $1,200. Diagnosis code mismatch with service.',
      graphEv:'Graph trace: Z12.11 → preventive screening → office visit CPT 99213 wrong pairing → Medicare requires G0202.',
      graphConf:'82pts confidence · DX_PROCEDURE_MISMATCH edge: Medicare→SCREEN_VS_EMM (weight 0.82) · 3 hops',
      denialProb:44, appealSuccess:79, writeOff:8, carcPred:'CO-11', payDelay:'+2d', claimValue:72,
      agents:[{name:'Denial Validator',pct:79},{name:'Auth Checker',pct:86},{name:'Code Reviewer',pct:88},{name:'Appeal Assessor',pct:79},{name:'Payer Behaviour',pct:82},{name:'Historical Match',pct:77}],
      mfVerdict:'CONFIRMED: CPT/diagnosis pairing error — use G0202 for mammogram screening. Resubmission preferred over appeal.',
      mfConf:79, agentCount:47, simCount:203,
      resolution:'Recode to G0202 + resubmit. Or appeal with corrected coding. 79% success. Low revenue ($1,200) — prioritise resubmission.',
      appealDrafted:false,
    },
    cfNodes:[
      {type:'ok',icon:'👤',name:'Patient Access',status:'✓ Elig OK'},
      {type:'ok',icon:'🔑',name:'Prior Auth',status:'✓ Not needed'},
      {type:'ok',icon:'🔍',name:'CRS Scrub',status:'✓ Score: 72'},
      {type:'ok',icon:'📤',name:'Submitted',status:'✓ Cleared'},
      {type:'fail',icon:'❌',name:'DENIED',status:'CO-11'},
      {type:'act',icon:'🌊',name:'MiroFish',status:'✓ CONF 79%'},
      {type:'ok',icon:'📄',name:'Recode',status:'G0202 rec.'},
    ],
  },
};

// Wireframe fallback data — shown when backend is offline
const FALLBACK_CLAIMS = [
  { id:'CLM-9041', claim_id:'CLM-9041', payer_id:'BCBS TX',      payer:'BCBS TX',      amount:12400, carc:'CO-4',  mf:'disputed',  mf_verdict:'disputed',  urg:'CRIT', urg_level:'CRIT', urgScore:96, denial_category:'Coding',         cat:'Coding',         appealSuccess:34, appealDrafted:false, patient_name:'Michael Chen',    days_remaining:107 },
  { id:'CLM-8821', claim_id:'CLM-8821', payer_id:'Medicare',     payer:'Medicare',     amount:4200,  carc:'CO-16', mf:'confirmed', mf_verdict:'confirmed', urg:'HIGH', urg_level:'HIGH', urgScore:84, denial_category:'Administrative', cat:'Administrative', appealSuccess:87, appealDrafted:true,  patient_name:'Sarah Johnson',   days_remaining:102 },
  { id:'CLM-5510', claim_id:'CLM-5510', payer_id:'Medicare',     payer:'Medicare',     amount:6100,  carc:'CO-4',  mf:'disputed',  mf_verdict:'disputed',  urg:'HIGH', urg_level:'HIGH', urgScore:81, denial_category:'Coding',         cat:'Coding',         appealSuccess:28, appealDrafted:false, patient_name:'Lisa Martinez',   days_remaining:112 },
  { id:'CLM-7788', claim_id:'CLM-7788', payer_id:'Aetna',        payer:'Aetna',        amount:8400,  carc:'CO-97', mf:'confirmed', mf_verdict:'confirmed', urg:'HIGH', urg_level:'HIGH', urgScore:78, denial_category:'Administrative', cat:'Administrative', appealSuccess:74, appealDrafted:true,  patient_name:'David Park',      days_remaining:119 },
  { id:'CLM-7204', claim_id:'CLM-7204', payer_id:'UnitedHealth', payer:'UnitedHealth', amount:2800,  carc:'PR-50', mf:'pending',   mf_verdict:'pending',   urg:'HIGH', urg_level:'HIGH', urgScore:75, denial_category:'Clinical',       cat:'Clinical',       appealSuccess:52, appealDrafted:false, patient_name:'Emily Davis',     days_remaining:128 },
  { id:'CLM-6632', claim_id:'CLM-6632', payer_id:'Cigna',        payer:'Cigna',        amount:3900,  carc:'CO-16', mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:68, denial_category:'Administrative', cat:'Administrative', appealSuccess:81, appealDrafted:true,  patient_name:'James Wilson',    days_remaining:133 },
  { id:'CLM-4821', claim_id:'CLM-4821', payer_id:'BCBS TX',      payer:'BCBS TX',      amount:4800,  carc:'CO-4',  mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:62, denial_category:'Coding',         cat:'Coding',         appealSuccess:71, appealDrafted:true,  patient_name:'Dr Kim Patient',  days_remaining:123 },
  { id:'CLM-3301', claim_id:'CLM-3301', payer_id:'Humana',       payer:'Humana',       amount:9800,  carc:'CO-29', mf:'disputed',  mf_verdict:'disputed',  urg:'MED',  urg_level:'MED',  urgScore:58, denial_category:'Administrative', cat:'Administrative', appealSuccess:22, appealDrafted:false, patient_name:'Robert Kim',      days_remaining:27  },
  { id:'CLM-2910', claim_id:'CLM-2910', payer_id:'Medicare',     payer:'Medicare',     amount:1200,  carc:'CO-11', mf:'confirmed', mf_verdict:'confirmed', urg:'MED',  urg_level:'MED',  urgScore:44, denial_category:'Clinical',       cat:'Clinical',       appealSuccess:79, appealDrafted:false, patient_name:'Anna Thompson',   days_remaining:136 },
];

export function DenialManagement() {
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 const urlRootCause = searchParams.get('root_cause');
 const urlStatus = searchParams.get('status');
 const urlNoEra = searchParams.get('no_era');
 const [showAIModal, setShowAIModal] = useState(false);
 const [showHeatmapModal, setShowHeatmapModal] = useState(false);
 const [activeTab, setActiveTab] = useState('queue');
 const [selectedClaim, setSelectedClaim] = useState('CLM-8821');
 const [openLayers, setOpenLayers] = useState([1, 2]);

 // Filter state
 const [mfFilter, setMfFilter] = useState('');
 const [urgFilter, setUrgFilter] = useState('');
 const [dateRange, setDateRange] = useState(null);
 const [payerFilter, setPayerFilter] = useState('');
 const [categoryFilter, setCategoryFilter] = useState('');
 const [carcFilter, setCarcFilter] = useState('');
 const [appealStatusFilter, setAppealStatusFilter] = useState('');
 const [statusFilter, setStatusFilter] = useState('');

 // Pagination
 const [currentPage, setCurrentPage] = useState(1);

 const [summary, setSummary] = useState({
 denied_revenue_at_risk: 0,
 successful_appeal_rate: 0,
 projected_recovery: 0,
 ai_prevention_impact: 0,
 });
 const [appeals, setAppeals] = useState([]);
 const [loading, setLoading] = useState(true);
 const [aiInsights, setAiInsights] = useState([]);
 const [aiLoading, setAiLoading] = useState(false);

 // Heatmap state (populated from API, falls back to inline defaults)
 const [heatmapPayers, setHeatmapPayers] = useState(FALLBACK_HEATMAP_PAYERS);
 const [heatmapDepts, setHeatmapDepts] = useState(FALLBACK_HEATMAP_DEPTS);
 const [heatmapData, setHeatmapData] = useState(FALLBACK_HEATMAP_DATA);

 // Root cause state
 const [rootCauses, setRootCauses] = useState(FALLBACK_ROOT_CAUSES);

 // Prevention alerts state
 const [rcaTree, setRcaTree] = useState(null);
  const [claimRCA, setClaimRCA] = useState({});
  const [rcaLoading, setRcaLoading] = useState(false);
 const [preventionAlerts, setPreventionAlerts] = useState(null);
 const [detectBriefing, setDetectBriefing] = useState(null);
 // Diagnostic findings state
 const [criticalFindings, setCriticalFindings] = useState(null);

 // Investigation panel state
 const [investigationOpen, setInvestigationOpen] = useState(false);
 const [investigationContext, setInvestigationContext] = useState(null);

 const openInvestigation = (metric, value, baseline, deviation, severity) => {
   setInvestigationContext({ metric, value, baseline, deviation, severity });
   setInvestigationOpen(true);
 };

 useEffect(() => {
 const loadDashboardData = async () => {
 setLoading(true);
 // Load AI insights in parallel (non-blocking)
 setAiLoading(true);
 api.ai.getInsights('denials').then(r => {
   setAiInsights(r?.insights || []);
   setAiLoading(false);
 });
 api.denials.getDetectBriefing().then(d => { if (d) setDetectBriefing(d); }).catch(() => {});
 try {
 const [sumData, denialsData, matrixData, rootCauseData, treeData] = await Promise.all([
   api.denials.getSummary().catch(() => ({})),
   api.denials.list({ page: 1, size: 200 }).catch(() => ({ items: [], total: 0 })),
   api.analytics.getDenialMatrix().catch(() => null),
   api.rootCause.getSummary().catch(() => null),
   api.rootCause.getTree().catch(() => null),
 ]);
 setSummary(sumData || {});

 // --- Heatmap from denial matrix API ---
 if (matrixData && matrixData.payers && (matrixData.categories || matrixData.departments) && matrixData.matrix) {
   setHeatmapPayers(matrixData.payers);
   setHeatmapDepts(matrixData.categories || matrixData.departments);
   // Normalize matrix: if rows are arrays, convert to {category: count} dicts
   const cats = matrixData.categories || matrixData.departments;
   const rawMatrix = matrixData.matrix;
   const normalizedMatrix = {};
   matrixData.payers.forEach(p => {
     if (Array.isArray(rawMatrix[p])) {
       const dict = {};
       rawMatrix[p].forEach((v, i) => { dict[cats[i]] = v; });
       normalizedMatrix[p] = dict;
     } else {
       normalizedMatrix[p] = rawMatrix[p] || {};
     }
   });
   setHeatmapData(normalizedMatrix);
 }

 // --- Root cause from API (by_root_cause array from /root-cause/summary) ---
 if (rootCauseData && Array.isArray(rootCauseData.by_root_cause) && rootCauseData.by_root_cause.length > 0) {
   setRootCauses(rootCauseData.by_root_cause.map((c, i) => ({
     label: (c.root_cause || '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
     pct: c.pct ?? Math.round(c.count / Math.max(rootCauseData.total_analyses, 1) * 100),
     color: ROOT_CAUSE_COLORS[i % ROOT_CAUSE_COLORS.length],
   })));
 } else if (rootCauseData && Array.isArray(rootCauseData.categories)) {
   setRootCauses(rootCauseData.categories.map((c, i) => ({
     label: c.label || c.category || c.name,
     pct: c.pct ?? c.percentage ?? c.count ?? 0,
     color: ROOT_CAUSE_COLORS[i % ROOT_CAUSE_COLORS.length],
   })));
 }

 // --- RCA tree from API ---
 if (treeData) {
   setRcaTree(treeData);
 }

 // Map enriched denial rows to the table format (no MOCK_APPEALS backfill)
 const items = (denialsData.items || []).map((d) => ({
   id:               d.denial_id,
   claim_id:         d.claim_id,
   payer_id:         d.payer_name || d.claim_id,
   amount:           d.denial_amount || 0,
   denial_category:  d.denial_category,
   status:           d.status || 'In Review',
   created_at:       d.denial_date,
   ai_confidence:    d.ai_confidence ?? d.appeal_win_probability ?? 75,
   group_code:       d.group_code || (d.carc_code?.startsWith('PR') ? 'PR' : d.carc_code?.startsWith('OA') ? 'OA' : 'CO'),
   carc:             d.carc_code,
   rarc:             d.rarc_code || '',
   patient_name:     d.patient_name,
   days_remaining:   d.days_remaining,
   recommended_action: d.recommended_action,
   // ML + MiroFish enrichment from RCA JOIN
   mf_verdict:       d.mf_verdict,
   mf:               d.mf_verdict,
   mf_confidence:    d.mf_confidence,
   urg_level:        d.urg_level,
   urg:              d.urg_level,
   urgScore:         d.urg_score,
   denial_probability: d.denial_probability,
   appealSuccess:    d.appeal_probability != null ? Math.round(d.appeal_probability * 100) : null,
   appeal_probability: d.appeal_probability,
   appealDrafted:    d.appeal_drafted ?? false,
   appeal_drafted:   d.appeal_drafted ?? false,
   write_off_risk:   d.write_off_risk,
   primary_root_cause: d.primary_root_cause,
   resolution_path:  d.resolution_path,
 }));
 setAppeals(items);
 } catch (err) {
 console.error("Failed to load denials dashboard:", err);
 setAppeals([]);
 } finally {
 setLoading(false);
 }

 // Load prevention alerts (non-blocking)
 api.prevention.scan(5).catch(() => null).then(data => {
   if (data) setPreventionAlerts(data);
 });

 // Load critical denial pattern findings (non-blocking)
 api.diagnostics.getFindings({ severity: 'critical', category: 'DENIAL_PATTERN' }).catch(() => null).then(data => {
   if (data) setCriticalFindings(data);
 });
 };
 loadDashboardData();
 }, []);

 // ── Fetch live RCA when selected claim changes ─────────────────────────────
  useEffect(() => {
    if (!selectedClaim) return;
    if (claimRCA[selectedClaim]) return;

    setRcaLoading(true);

    api.rootCause.getClaimAnalysis(selectedClaim)
      .then(res => {
        if (!res || res.status === 'ERROR') { setRcaLoading(false); return; }
        if (res.status === 'NOT_ANALYZED') {
          api.rootCause.validateClaim(selectedClaim).catch(() => {});
          setRcaLoading(false);
          return;
        }

        const a = res.analysis;
        if (!a) { setRcaLoading(false); return; }

        const STEP_MAP = {
          'CARC_RARC_DECODE':              { icon: '📋', name: 'CARC Decode' },
          'ELIGIBILITY_CHECK':             { icon: '👤', name: 'Patient Access' },
          'AUTH_TIMELINE_CHECK':           { icon: '🔑', name: 'Prior Auth' },
          'CODING_VALIDATION':             { icon: '💊', name: 'CRS Scrub' },
          'PAYER_HISTORY_MATCH':           { icon: '📊', name: 'Payer History' },
          'PROCESS_TIMELINE_CHECK':        { icon: '📤', name: 'Submitted' },
          'PROVIDER_PATTERN_CHECK':        { icon: '👨‍⚕️', name: 'Provider Check' },
          'CARC_SPECIFIC_DETECTION':       { icon: '❌', name: 'DENIED' },
          'DOCUMENTATION_ENROLLMENT_CHECK':{ icon: '📝', name: 'Doc Check' },
          'GRAPH_PATTERN_SYNTHESIS':       { icon: '🕸️', name: 'Graph Match' },
          'MIROFISH_AGENT_VALIDATION':     { icon: '🌊', name: 'MiroFish' },
          'EVIDENCE_SYNTHESIS':            { icon: '📄', name: 'Resolution' },
        };
        const STATUS_TYPE = { 'PASS':'ok', 'FAIL':'fail', 'WARNING':'warn', 'INCONCLUSIVE':'neutral' };

        const steps = a.steps || [];
        const PRIORITY = ['ELIGIBILITY_CHECK','AUTH_TIMELINE_CHECK','CODING_VALIDATION',
          'CARC_SPECIFIC_DETECTION','MIROFISH_AGENT_VALIDATION','EVIDENCE_SYNTHESIS'];
        const picked = [
          ...steps.filter(s => PRIORITY.includes(s.step_name)),
          ...steps.filter(s => !PRIORITY.includes(s.step_name)),
        ].slice(0, 7);

        const cfNodes = picked.map(s => {
          const meta = STEP_MAP[s.step_name] || { icon: '🔍', name: s.step_name };
          const type = s.step_name === 'MIROFISH_AGENT_VALIDATION' ? 'act' : (STATUS_TYPE[s.finding_status] || 'neutral');
          return { type, icon: meta.icon, name: meta.name, status: s.finding ? s.finding.substring(0, 22) : s.finding_status };
        });
        if (cfNodes.length < 5) {
          cfNodes.push({ type: 'fail', icon: '❌', name: 'DENIED', status: a.ml_predicted_carc || 'Denied' });
        }

        const mfStep = steps.find(s => s.step_name === 'MIROFISH_AGENT_VALIDATION');
        const mfFinding = mfStep?.finding || '';
        let mfVerdict = mfFinding.toLowerCase().includes('confirmed') ? `CONFIRMED: ${mfFinding}`
          : mfFinding.toLowerCase().includes('disputed') ? `DISPUTED: ${mfFinding}`
          : mfFinding || 'MiroFish analysis complete.';

        const agentSteps = ['ELIGIBILITY_CHECK','AUTH_TIMELINE_CHECK','CODING_VALIDATION',
          'PAYER_HISTORY_MATCH','PROVIDER_PATTERN_CHECK','MIROFISH_AGENT_VALIDATION'];
        const AGENT_LABELS = {
          'ELIGIBILITY_CHECK':'Denial Validator', 'AUTH_TIMELINE_CHECK':'Auth Checker',
          'CODING_VALIDATION':'Code Reviewer', 'PAYER_HISTORY_MATCH':'Payer Behaviour',
          'PROVIDER_PATTERN_CHECK':'Historical Match', 'MIROFISH_AGENT_VALIDATION':'MiroFish Agent',
        };
        const agents = agentSteps.map(sn => {
          const step = steps.find(s => s.step_name === sn);
          const rawPct = step ? Math.min(99, Math.max(1, Math.round(
            step.finding_status === 'PASS' ? 75 + (step.contribution_weight || 0) * 50
            : step.finding_status === 'WARNING' ? 55 + (step.contribution_weight || 0) * 30
            : step.finding_status === 'FAIL' ? 20 + (step.contribution_weight || 0) * 20 : 50
          ))) : 50;
          return { name: AGENT_LABELS[sn] || sn, pct: rawPct };
        });

        const rootCauseLabel = (a.primary_root_cause || '').replace(/_/g, ' ');
        const rcCallout = `Root cause: ${rootCauseLabel}. ${a.evidence_summary || ''}`;
        const rcSentiment = (a.ml_denial_probability || 0) >= 0.65 ? 'danger' : 'warn';

        const denialRow = (appeals.length > 0 ? appeals : FALLBACK_CLAIMS)
          .find(d => (d.claim_id || d.id) === selectedClaim);

        const mappedRCA = {
          descriptive: `${rootCauseLabel} identified for ${selectedClaim}. ${denialRow ? `Payer: ${denialRow.payer_name || denialRow.payer}. Amount: $${(denialRow.denial_amount || denialRow.amount || 0).toLocaleString()}.` : ''} ${a.evidence_summary || ''}`,
          graphEv: `Graph trace: ${a.primary_root_cause?.replace(/_/g, ' → ') || 'Denial cause identified'}. ${a.evidence_summary || ''}`,
          graphConf: `${a.confidence_score || 0}pts confidence · ${a.primary_root_cause || 'UNKNOWN'}`,
          denialProb: Math.round((a.ml_denial_probability || 0) * 100),
          appealSuccess: Math.round((1 - (a.ml_denial_probability || 0)) * (a.confidence_score || 50) / 100 * 100),
          writeOff: Math.round((a.ml_write_off_probability || 0) * 100),
          carcPred: a.ml_predicted_carc || denialRow?.carc_code || denialRow?.carc || '—',
          payDelay: (a.ml_denial_probability || 0) > 0.6 ? '+7d' : '+3d',
          claimValue: a.confidence_score || 60,
          agents, mfVerdict,
          mfConf: Math.min(99, a.confidence_score || 0),
          agentCount: 47, simCount: a.confidence_score ? Math.round(a.confidence_score * 2.3) : 0,
          resolution: a.resolution_path || 'Review denial and consult billing team.',
          appealDrafted: denialRow?.appeal_drafted || false,
        };

        setClaimRCA(prev => ({ ...prev, [selectedClaim]: {
          dos: denialRow?.date_of_service || '—',
          denied: denialRow?.denial_date ? String(denialRow.denial_date) : '—',
          daysOut: denialRow?.days_remaining || '—',
          daysLeft: denialRow?.days_remaining || '—',
          rcCallout, rcSentiment, cfNodes, rca: mappedRCA,
        }}));
        setRcaLoading(false);
      })
      .catch(() => setRcaLoading(false));
  }, [selectedClaim]);

 // Filtered appeals
 const filteredAppeals = useMemo(() => {
 let result = appeals;
 // Payer filter
 if (payerFilter) result = result.filter(a => (a.payer_id || a.payer) === payerFilter);
 // Category filter
 if (categoryFilter) result = result.filter(a => (a.denial_category || a.cat) === categoryFilter);
 // Status filter
 if (statusFilter) result = result.filter(a => a.status === statusFilter);
 // MiroFish verdict filter
 if (mfFilter) result = result.filter(a => (a.mf_verdict || a.mf) === mfFilter);
 // Urgency filter
 if (urgFilter) result = result.filter(a => (a.urg_level || a.urg) === urgFilter);
 // CARC code filter
 if (carcFilter) result = result.filter(a => (a.carc || a.carc_code) === carcFilter);
 // URL-based filters from AR Aging drill-down
 if (urlRootCause) result = result.filter(a => a.root_cause === urlRootCause || (a.denial_category || a.cat) === urlRootCause.replace('_MISMATCH','').replace('_LAPSE','').replace('_MISS','').replace('_MISSING',''));
 if (urlStatus) result = result.filter(a => a.status === urlStatus);
 return result;
 }, [appeals, payerFilter, categoryFilter, statusFilter, mfFilter, urgFilter, carcFilter, urlRootCause, urlStatus]);

 const totalPages = Math.max(1, Math.ceil(filteredAppeals.length / PAGE_SIZE));
 const paginatedAppeals = filteredAppeals.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

 // Reset page when filters change
 useEffect(() => { setCurrentPage(1); }, [payerFilter, categoryFilter, statusFilter, dateRange, carcFilter, appealStatusFilter]);

 const handleDrillDown = (path) => navigate(path);

 function confidenceColor(val) {
 if (val >= 85) return 'text-th-success';
 if (val >= 70) return 'text-th-warning';
 return 'text-th-danger';
 }
 function confidenceBarColor(val) {
 if (val >= 85) return 'bg-th-success';
 if (val >= 70) return 'bg-th-warning';
 return 'bg-th-danger';
 }

 function categoryBadgeStyle(cat) {
 const map = {
 'Medical Necessity': 'bg-th-danger/10 text-th-danger border-th-danger/20',
 'Authorization': 'bg-th-warning/10 text-th-warning border-th-warning/20',
 'Eligibility': 'bg-th-info/10 text-th-info border-th-info/20',
 'Coding/Bundling': 'bg-primary/10 text-primary border-primary/20',
 'Duplicate': 'bg-th-danger/10 text-th-danger border-th-danger/20',
 'Timely Filing': 'bg-th-warning/10 text-th-warning border-th-warning/20',
 'COB': 'bg-th-info/10 text-th-info border-th-info/20',
 'Missing Info': 'bg-th-info/10 text-th-info border-th-info/20',
 'Non-Covered': 'bg-th-success/10 text-th-success border-th-success/20',
 'Contractual': 'bg-th-surface-overlay text-th-secondary border-th-border',
 };
 return map[cat] || 'bg-th-surface-overlay text-th-heading border-th-border';
 }


 return (
    <div className="flex-1 flex flex-col min-h-0 bg-th-surface-base overflow-hidden">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-th-surface-raised border-b border-th-border shrink-0">
        <div>
          <h1 className="text-[15px] font-semibold text-th-heading tracking-tight">Denial Command + Intelligence</h1>
          <p className="text-[10px] text-th-muted font-mono mt-0.5">
            {summary.total_denials ?? '—'} active · AI urgency-sorted · MiroFish verdicts inline · 5-layer RCA per claim · click any row
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/analytics/prevention')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">shield</span>
            Fix Prevention Gap
          </button>
          <button onClick={() => navigate('/analytics/graph-explorer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">hub</span>
            Graph Explorer
          </button>
          <button onClick={() => navigate('/intelligence/lida/chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors">
            <span className="material-symbols-outlined text-[14px]">chat</span>
            Ask LIDA
          </button>
          <button onClick={() => navigate('/work/denials/appeals')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-[rgb(var(--color-primary))] text-white border border-[rgb(var(--color-primary))] hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[14px]">description</span>
            Appeal Workbench →
          </button>
        </div>
      </div>

      {/* ── STATS STRIP — 7 inline metrics ── */}
      <div className="flex items-stretch bg-th-surface-raised border-b border-th-border shrink-0">
        {[
          { val: summary.total_denials ?? '—',  label: 'Total Denials',       sub: '↑ +3 overnight',          valColor: 'text-[rgb(var(--color-danger))]',   subColor: 'text-[rgb(var(--color-danger))]' },
          { val: summary.denied_revenue_at_risk ? `$${(summary.denied_revenue_at_risk/1000).toFixed(0)}K` : '—', label: 'Revenue at Risk', sub: 'Action needed', valColor: 'text-[rgb(var(--color-warning))]', subColor: 'text-[rgb(var(--color-warning))]' },
          { val: summary.mirofish_confirmed ?? '—', label: 'MiroFish Confirmed', sub: 'Appeal recommended',     valColor: 'text-[rgb(var(--color-success))]',  subColor: 'text-[rgb(var(--color-success))]' },
          { val: summary.mirofish_disputed  ?? '—',  label: 'MiroFish Disputed',  sub: 'Coding review needed',   valColor: 'text-[rgb(var(--color-danger))]',   subColor: 'text-[rgb(var(--color-danger))]' },
          { val: summary.successful_appeal_rate != null ? `${summary.successful_appeal_rate}%` : '—', label: 'Appeal Win Rate', sub: '↑ +6% AI-assisted', valColor: 'text-[rgb(var(--color-success))]', subColor: 'text-[rgb(var(--color-success))]' },
          { val: summary.appeals_in_flight  ?? '—',  label: 'Appeals In-Flight',  sub: '$82K recovery',          valColor: 'text-purple-600 dark:text-purple-400', subColor: 'text-th-muted' },
          { val: summary.rca_confidence != null ? `${summary.rca_confidence}%` : '—', label: 'RCA Confidence',   sub: 'Neo4j + ML',             valColor: 'text-[rgb(var(--color-info))]',     subColor: 'text-[rgb(var(--color-success))]' },
        ].map((s, i) => (
          <div key={i} className="flex-1 px-3 py-2 text-center border-r border-th-border last:border-r-0">
            <p className={cn('text-[18px] font-black leading-none tabular-nums', s.valColor)}>{s.val}</p>
            <p className="text-[8px] text-th-muted font-mono uppercase tracking-wider mt-1">{s.label}</p>
            <p className={cn('text-[8px] font-semibold mt-0.5', s.subColor)}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TAB BAR ── */}
      <div className="flex items-center bg-th-surface-raised border-b border-th-border px-4 shrink-0 overflow-x-auto">
        {[
          { id: 'queue',  label: 'Denial Queue',           count: summary.total_denials ?? '—' },
          { id: 'appeal', label: 'Appeal Workbench',       count: summary.appeals_in_flight ?? '—' },
          { id: 'risk',   label: 'High Risk Claims',       count: detectBriefing?.kpis?.high_risk_count ?? 31 },
          { id: 'payer',  label: 'Payer Patterns + Heatmap', count: null },
          { id: 'rca',    label: 'RCA Tree',               count: 'Neo4j' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap shrink-0',
              activeTab === t.id
                ? 'border-[rgb(var(--color-danger))] text-[rgb(var(--color-danger))]'
                : 'border-transparent text-th-muted hover:text-th-secondary'
            )}>
            {t.label}
            {t.count !== null && (
              <span className={cn(
                'font-mono text-[9px] px-1.5 py-0.5 rounded',
                activeTab === t.id
                  ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]'
                  : 'bg-th-surface-overlay text-th-muted'
              )}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* TAB 1: DENIAL QUEUE — 3 column layout */}
        {activeTab === 'queue' && (
          <div className="grid grid-cols-[240px_1fr_300px] h-full overflow-hidden">

            {/* COL 1: FILTERS */}
            <div className="flex flex-col border-r border-th-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading">🎛 Filters</span>
                <button onClick={() => { setMfFilter(''); setUrgFilter(''); setPayerFilter(''); setCarcFilter(''); setCategoryFilter(''); }}
                  className="text-[10px] text-th-muted hover:text-th-heading transition-colors px-2 py-0.5 rounded border border-th-border bg-th-surface-raised">Reset</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-4">

                {/* MiroFish Verdict */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">MiroFish Verdict</p>
                  {(() => {
                    const mfFacets = detectBriefing?.filter_facets?.mf_verdicts || [];
                    const getMfCount = (val) => mfFacets.find(f => f.val === val)?.count ?? '—';
                    return [
                      { val: 'confirmed', label: '✓ CONFIRMED', count: getMfCount('confirmed'), color: 'success' },
                      { val: 'disputed',  label: '✗ DISPUTED',  count: getMfCount('disputed'),  color: 'danger'  },
                      { val: 'pending',   label: '⏳ Pending',   count: getMfCount('pending'),   color: 'warning' },
                    ];
                  })().map(f => (
                    <button key={f.val} onClick={() => setMfFilter(mfFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        mfFilter === f.val
                          ? f.color === 'success'
                            ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success))]'
                            : f.color === 'danger'
                            ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                            : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* AI Urgency */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">AI Urgency</p>
                  {(() => {
                    const urgFacets = detectBriefing?.filter_facets?.urgency || [];
                    const getUrgCount = (val) => urgFacets.find(f => f.val === val)?.count ?? '—';
                    return [
                      { val: 'CRIT', label: '🔥 Critical >85', count: getUrgCount('CRIT')  },
                      { val: 'HIGH', label: '⚠ High 60–85',    count: getUrgCount('HIGH') },
                      { val: 'MED',  label: '● Medium <60',    count: getUrgCount('MED') },
                    ];
                  })().map(f => (
                    <button key={f.val} onClick={() => setUrgFilter(urgFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        urgFilter === f.val
                          ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Payer */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">Payer</p>
                  {(detectBriefing?.filter_facets?.payers || [
                    { val: 'Medicare',     count: 12 },
                    { val: 'BCBS TX',      count: 9  },
                    { val: 'Aetna',        count: 8  },
                    { val: 'UnitedHealth', count: 7  },
                    { val: 'Cigna',        count: 5  },
                    { val: 'Humana',       count: 4  },
                  ]).map(f => (
                    <button key={f.val} onClick={() => setPayerFilter(payerFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        payerFilter === f.val
                          ? 'bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.val}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* CARC Code */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">CARC Code</p>
                  {(detectBriefing?.filter_facets?.carc_codes || [
                    { val: 'CO-16', label: 'CO-16 Auth',      count: 11 },
                    { val: 'CO-4',  label: 'CO-4 Coding',     count: 9  },
                    { val: 'CO-97', label: 'CO-97 Duplicate', count: 7  },
                    { val: 'PR-50', label: 'PR-50 Med Nec',   count: 6  },
                    { val: 'CO-11', label: 'CO-11 Diagnosis',  count: 5  },
                    { val: 'CO-29', label: 'CO-29 Timely',    count: 4  },
                  ]).map(f => (
                    <button key={f.val} onClick={() => setCarcFilter(carcFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        carcFilter === f.val
                          ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span className="font-mono">{f.label}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Denial Category */}
                <div>
                  <p className="text-[8.5px] font-semibold uppercase tracking-widest text-th-muted font-mono mb-2 pb-1.5 border-b border-th-border">Denial Category</p>
                  {(detectBriefing?.filter_facets?.categories || [
                    { val: 'Administrative', count: 18 },
                    { val: 'Clinical',       count: 14 },
                    { val: 'Coding',         label: 'Billing/Coding', count: 11 },
                    { val: 'Contractual',    count: 4  },
                  ]).map(f => (
                    <button key={f.val} onClick={() => setCategoryFilter(categoryFilter === f.val ? '' : f.val)}
                      className={cn(
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] mb-1 border-l-2 transition-colors',
                        categoryFilter === f.val
                          ? 'bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] border-[rgb(var(--color-primary))]'
                          : 'text-th-secondary border-transparent hover:bg-th-surface-overlay hover:text-th-heading'
                      )}>
                      <span>{f.label || f.val}</span>
                      <span className="font-mono text-[9px] text-th-muted">{f.count}</span>
                    </button>
                  ))}
                </div>

              </div>
            </div>

            {/* COL 2: DENIAL LIST */}
            <div className="flex flex-col border-r border-th-border overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading">
                  Denials <span className="text-th-muted font-normal text-[9px]">· urgency × revenue</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-th-muted font-mono">{filteredAppeals.length} shown</span>
                  <button className="text-[10px] text-th-muted hover:text-th-heading px-2 py-0.5 rounded border border-th-border bg-th-surface-raised transition-colors">Export</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredAppeals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-th-muted">
                    <span className="material-symbols-outlined text-2xl mb-2">search_off</span>
                    <p className="text-[11px]">No denials match current filters</p>
                  </div>
                ) : (
                  filteredAppeals.map((denial) => {
                    const claimId   = denial.claim_id || denial.id;
                    const payer     = denial.payer_id || denial.payer || '—';
                    const carc      = denial.carc || denial.carc_code || '—';
                    const mf        = denial.mf_verdict || denial.mf || 'pending';
                    const urg       = denial.urg_level  || denial.urg || 'MED';
                    const urgScore  = denial.urgScore || (urg === 'CRIT' ? 90 : urg === 'HIGH' ? 75 : 50);
                    const winPct    = denial.appealSuccess || denial.ai_confidence || 0;
                    const drafted   = denial.appealDrafted || false;
                    const patient   = denial.patient_name || '—';
                    const amt       = denial.amount || 0;
                    const isSelected = selectedClaim === claimId;

                    const rowBorder =
                      mf === 'confirmed' ? 'border-l-[rgb(var(--color-success))]' :
                      mf === 'disputed'  ? 'border-l-[rgb(var(--color-danger))]'  :
                                           'border-l-transparent';
                    const rowBg = isSelected
                      ? mf === 'confirmed' ? 'bg-[rgb(var(--color-success-bg))]'
                      : mf === 'disputed'  ? 'bg-[rgb(var(--color-danger-bg))]'
                      :                      'bg-[rgb(var(--color-primary-bg))]'
                      : 'hover:bg-th-surface-overlay';

                    const mfBadge =
                      mf === 'confirmed'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success)/0.3)]">✓ CONFIRMED</span>
                        : mf === 'disputed'
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border border-[rgb(var(--color-danger)/0.3)]">✗ DISPUTED</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border border-[rgb(var(--color-warning)/0.3)]">⏳ Pending</span>;

                    const urgColor =
                      urg === 'CRIT' ? 'text-[rgb(var(--color-danger))]' :
                      urg === 'HIGH' ? 'text-[rgb(var(--color-warning))]' :
                                       'text-th-muted';

                    const winBadge = winPct > 0 && (
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border',
                        winPct >= 75 ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' :
                        winPct >= 50 ? 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]' :
                                       'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]'
                      )}>{winPct}% win</span>
                    );

                    return (
                      <div
                        key={claimId}
                        onClick={() => setSelectedClaim(claimId)}
                        className={cn(
                          'relative px-3 py-2.5 border-b border-th-border cursor-pointer transition-colors border-l-2',
                          rowBorder, rowBg
                        )}
                      >
                        <span className={cn('absolute right-2.5 top-2.5 text-[8.5px] font-bold font-mono', urgColor)}>
                          {urg} {urgScore}
                        </span>

                        <div className="flex items-center justify-between mb-1 pr-14">
                          <span className="text-[10px] font-bold font-mono text-[rgb(var(--color-info))]">{claimId}</span>
                          <span className="text-[11px] font-bold font-mono text-th-heading">${amt.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          <span className="text-[10px] text-th-secondary">{payer}</span>
                          <span className="font-mono text-[8.5px] text-[rgb(var(--color-danger))] bg-[rgb(var(--color-danger-bg))] px-1.5 py-0.5 rounded border border-[rgb(var(--color-danger)/0.2)]">{carc}</span>
                          <span className="text-[9.5px] text-th-muted">{patient}</span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {mfBadge}
                          {winBadge}
                          {drafted && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border border-[rgb(var(--color-info)/0.3)]">
                              AI appeal drafted
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* COL 3: AI INTELLIGENCE */}
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-th-border bg-th-surface-overlay shrink-0">
                <span className="text-[11px] font-semibold text-th-heading flex items-center gap-2">
                  🧠 AI Intelligence ·{' '}
                  <span className="text-[rgb(var(--color-info))] font-mono">{selectedClaim || 'CLM-8821'}</span>
                  {rcaLoading && (
                    <span className="size-3 border border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
                  )}
                  {claimRCA[selectedClaim] && !rcaLoading && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success)/0.3)]">LIVE</span>
                  )}
                  {!claimRCA[selectedClaim] && !rcaLoading && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted border border-th-border">CACHED</span>
                  )}
                </span>
                <button onClick={() => navigate('/work/denials/appeals')}
                  className="text-[10px] text-th-muted hover:text-th-heading px-2 py-0.5 rounded border border-th-border bg-th-surface-raised transition-colors">Full RCA →</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {(() => {
                  const claimId = selectedClaim || 'CLM-8821';
                  const liveDetail = claimRCA[claimId];
                  const staticDetail = CLAIM_DETAIL[claimId];
                  const detail = liveDetail || staticDetail;

                  const fallback = (appeals.length > 0 ? appeals : FALLBACK_CLAIMS).find(
                    a => (a.claim_id || a.id) === claimId
                  );

                  if (rcaLoading && !detail) return (
                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                      <div className="size-6 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[11px] text-th-muted">Loading AI intelligence for {claimId}...</p>
                    </div>
                  );

                  if (!detail && !fallback) return (
                    <p className="text-[11px] text-th-muted italic text-center pt-8">
                      Click a denial row to load AI intelligence
                    </p>
                  );

                  const isLive = !!liveDetail;

                  const dos      = detail?.dos      || fallback?.date_of_service || '—';
                  const denied   = detail?.denied   || '—';
                  const daysOut  = detail?.daysOut  || fallback?.days_remaining || '—';
                  const daysLeft = detail?.daysLeft || fallback?.days_remaining || '—';
                  const cfNodes  = detail?.cfNodes  || [];
                  const rcCallout= detail?.rcCallout || '';
                  const rcSent   = detail?.rcSentiment || 'warn';

                  const dlColor = typeof daysLeft === 'number'
                    ? daysLeft < 30 ? 'text-[rgb(var(--color-danger))]'
                    : daysLeft < 90 ? 'text-[rgb(var(--color-warning))]'
                    :                 'text-[rgb(var(--color-success))]'
                    : 'text-th-muted';

                  const tlItems = [
                    { label:'DOS',      val: dos,                 type: 'ok'   },
                    { label:'Denied',   val: denied,              type: 'fail' },
                    { label:'Days Out', val: `${daysOut}d`,       type: 'warn' },
                    { label:'Deadline', val: `${daysLeft}d left`, type: typeof daysLeft === 'number' && daysLeft < 30 ? 'fail' : typeof daysLeft === 'number' && daysLeft < 90 ? 'warn' : 'ok' },
                  ];

                  const tlDot = {
                    ok:      'bg-[rgb(var(--color-success))] border-[rgb(var(--color-success))]',
                    fail:    'bg-[rgb(var(--color-danger))] border-[rgb(var(--color-danger))]',
                    warn:    'bg-[rgb(var(--color-warning))] border-[rgb(var(--color-warning))]',
                    neutral: 'bg-th-muted border-th-muted',
                  };

                  const cfColors = {
                    ok:      { circle:'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success))] text-[rgb(var(--color-success))]', name:'text-[rgb(var(--color-success))]', status:'text-[rgb(var(--color-success))]' },
                    warn:    { circle:'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning))] text-[rgb(var(--color-warning))]', name:'text-[rgb(var(--color-warning))]', status:'text-[rgb(var(--color-warning))]' },
                    fail:    { circle:'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger))] text-[rgb(var(--color-danger))]',   name:'text-[rgb(var(--color-danger))]',   status:'text-[rgb(var(--color-danger))]' },
                    act:     { circle:'bg-[rgb(var(--color-primary-bg))] border-[rgb(var(--color-info))] text-[rgb(var(--color-info))]',      name:'text-[rgb(var(--color-info))]',     status:'text-[rgb(var(--color-info))]' },
                    neutral: { circle:'bg-th-surface-overlay border-th-border text-th-muted',                                                 name:'text-th-muted',                     status:'text-th-muted' },
                  };

                  return (
                    <>
                      {/* ── CLAIM TIMELINE ── */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2">
                          Claim Timeline
                        </p>
                        <div className="flex border border-th-border rounded-lg overflow-hidden">
                          {tlItems.map((item, i) => (
                            <div key={i} className={cn(
                              'flex-1 text-center py-2 px-1 border-r border-th-border last:border-r-0',
                              i % 2 === 0 ? 'bg-th-surface-overlay' : 'bg-th-surface-raised'
                            )}>
                              <div className={cn(
                                'size-2 rounded-full mx-auto mb-1 border-[1.5px]',
                                tlDot[item.type] || tlDot.neutral
                              )} />
                              <p className="text-[7.5px] text-th-muted font-mono uppercase tracking-wider">{item.label}</p>
                              <p className={cn(
                                'text-[8.5px] font-semibold mt-0.5',
                                item.label === 'Deadline' ? dlColor : 'text-th-heading'
                              )}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── CONNECTING FACTORS ── */}
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2 pt-2 border-t border-th-border">
                          ⛓ Connecting Factors
                        </p>
                        <div className="overflow-x-auto pb-1">
                          <div className="flex items-center" style={{minWidth:'max-content',gap:0}}>
                            {cfNodes.map((node, i) => {
                              const colors = cfColors[node.type] || cfColors.neutral;
                              const nodeClick =
                                node.type === 'ok' && node.icon === '📄'
                                  ? () => navigate('/work/denials/appeals')
                                  : node.type === 'act' && node.icon === '🌊'
                                  ? () => navigate('/intelligence/simulation')
                                  : (node.icon === '👤' || node.icon === '🔑' || node.icon === '🔍')
                                  ? () => navigate('/analytics/prevention')
                                  : undefined;
                              return (
                                <React.Fragment key={i}>
                                  <div
                                    onClick={nodeClick}
                                    className={cn(
                                      'flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-md transition-colors',
                                      nodeClick ? 'cursor-pointer hover:bg-th-surface-overlay' : ''
                                    )}
                                    style={{minWidth:'58px'}}
                                  >
                                    <div className={cn(
                                      'size-9 rounded-full flex items-center justify-center text-[15px] border-[1.5px] transition-transform hover:scale-110',
                                      colors.circle
                                    )}>
                                      {node.icon}
                                    </div>
                                    <p className={cn('text-[8px] font-bold text-center leading-tight', colors.name)}>
                                      {node.name}
                                    </p>
                                    <p className={cn('text-[7px] font-mono text-center', colors.status)}>
                                      {node.status}
                                    </p>
                                  </div>
                                  {i < cfNodes.length - 1 && (
                                    <span className="text-th-muted text-[10px] shrink-0 mb-4 px-0.5">›</span>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>

                        {/* Root Cause Callout */}
                        {rcCallout && (
                          <div className={cn(
                            'mt-2 px-3 py-2 rounded-md text-[10px] leading-relaxed border',
                            rcSent === 'danger'
                              ? 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)] text-th-secondary'
                              : 'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning)/0.3)] text-th-secondary'
                          )}>
                            {rcCallout}
                          </div>
                        )}
                      </div>

                      {/* ── 5-LAYER RCA ACCORDION ── */}
                      {detail?.rca && (() => {
                        const r = detail.rca;
                        const mf = fallback?.mf_verdict || fallback?.mf || 'pending';
                        // openLayers + setOpenLayers from component-level state
                        const toggleLayer = (n) => setOpenLayers(prev =>
                          prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
                        );

                        const dpColor = r.denialProb < 40 ? 'text-[rgb(var(--color-success))]' : r.denialProb < 70 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-danger))]';
                        const asColor = r.appealSuccess >= 70 ? 'text-[rgb(var(--color-success))]' : r.appealSuccess >= 50 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-danger))]';
                        const woColor = r.writeOff < 25 ? 'text-[rgb(var(--color-success))]' : r.writeOff < 50 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-danger))]';

                        const layers = [
                          { n:1, name:'Descriptive', subtitle:'What happened', hBg:'bg-[#0d1628] border-[#1a3060]', numBg:'bg-[#1a3060] text-[#6088ff]', nameColor:'text-[#6088ff]', statusColor:'text-[#6088ff]',
                            body: <p className="text-[10.5px] text-th-secondary leading-relaxed">{r.descriptive}</p> },
                          { n:2, name:'Diagnostic · Neo4j Graph', subtitle:'Causal chain', hBg:'bg-[#050f1a] border-[#0a2a40]', numBg:'bg-[#0a2a40] text-[rgb(var(--color-info))]', nameColor:'text-[rgb(var(--color-info))]', statusColor:'text-[rgb(var(--color-info))]',
                            body: (<div><p className="text-[10.5px] text-th-secondary leading-relaxed mb-1">{r.graphEv}</p><p className="text-[9px] font-mono text-th-muted mb-2">{r.graphConf}</p><button onClick={() => navigate('/analytics/graph-explorer')} className="text-[9.5px] text-[rgb(var(--color-info))] hover:underline flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">hub</span>Graph Explorer →</button></div>) },
                          { n:3, name:'Predictive · 9 ML Models', subtitle:'Risk scores', hBg:'bg-[#0a0f1a] border-[#1a2050]', numBg:'bg-[#1a2050] text-purple-400', nameColor:'text-purple-400', statusColor:'text-purple-400',
                            body: (<div className="grid grid-cols-3 gap-1.5">{[
                              {label:'Denial Prob',val:`${r.denialProb}%`,color:dpColor,model:'Gradient Boost'},
                              {label:'Appeal Win',val:`${r.appealSuccess}%`,color:asColor,model:'Random Forest'},
                              {label:'Write-off',val:`${r.writeOff}%`,color:woColor,model:'XGBoost'},
                              {label:'CARC Pred',val:r.carcPred,color:'text-[rgb(var(--color-danger))]',model:'Multi-class'},
                              {label:'Pay Delay',val:r.payDelay,color:'text-[rgb(var(--color-warning))]',model:'Isolation Forest'},
                              {label:'Claim Value',val:String(r.claimValue),color:'text-[rgb(var(--color-info))]',model:'Composite (5)'},
                            ].map((s,i) => (<div key={i} className="bg-th-surface-overlay border border-th-border rounded px-2 py-1.5"><p className="text-[8px] text-th-muted font-mono mb-0.5">{s.label}</p><p className={cn('text-[15px] font-black leading-none',s.color)}>{s.val}</p><p className="text-[7.5px] text-th-muted font-mono mt-0.5">{s.model}</p></div>))}</div>) },
                          { n:4, name:'Prescriptive · MiroFish', subtitle:mf==='confirmed'?'✓ CONFIRMED':mf==='disputed'?'✗ DISPUTED':'⏳ Running', hBg:'bg-[#030f09] border-[#0a3d20]', numBg:'bg-[#0a3d20] text-[rgb(var(--color-success))]', nameColor:'text-[rgb(var(--color-success))]',
                            statusColor:mf==='confirmed'?'text-[rgb(var(--color-success))]':mf==='disputed'?'text-[rgb(var(--color-danger))]':'text-[rgb(var(--color-warning))]',
                            body: (<div>
                              <div className={cn('px-3 py-2 rounded border text-[10.5px] text-th-secondary leading-relaxed mb-3',mf==='confirmed'?'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success)/0.3)]':mf==='disputed'?'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)]':'bg-[rgb(var(--color-warning-bg))] border-[rgb(var(--color-warning)/0.3)]')}>
                                <p className={cn('text-[8px] font-mono font-bold uppercase tracking-wider mb-1',mf==='confirmed'?'text-[rgb(var(--color-success))]':mf==='disputed'?'text-[rgb(var(--color-danger))]':'text-[rgb(var(--color-warning))]')}>🌊 MiroFish {mf.toUpperCase()} · {r.mfConf}% · {r.agentCount} agents · {r.simCount} sims</p>
                                {r.mfVerdict}
                              </div>
                              <p className="text-[8px] font-mono font-bold text-th-muted uppercase tracking-wider mb-2">Agent Consensus · {r.agentCount} agents</p>
                              <div className="space-y-1">{r.agents.map((a,i) => (<div key={i} className="flex items-center gap-2"><span className="text-[9px] text-th-muted w-[110px] shrink-0 truncate">{a.name}</span><div className="flex-1 h-[3px] bg-th-surface-overlay rounded-full overflow-hidden"><div className={cn('h-full rounded-full',a.pct>=80?'bg-[rgb(var(--color-success))]':a.pct>=60?'bg-[rgb(var(--color-warning))]':'bg-[rgb(var(--color-danger))]')} style={{width:`${a.pct}%`}}/></div><span className={cn('text-[9.5px] font-bold font-mono w-8 text-right',a.pct>=80?'text-[rgb(var(--color-success))]':a.pct>=60?'text-[rgb(var(--color-warning))]':'text-[rgb(var(--color-danger))]')}>{a.pct}%</span></div>))}</div>
                            </div>) },
                          { n:5, name:'Resolution · Action', subtitle:`$${(fallback?.amount||0).toLocaleString()} recoverable`, hBg:'bg-[#0a0610] border-[#2a1040]', numBg:'bg-[#2a1040] text-purple-300', nameColor:'text-purple-300', statusColor:'text-purple-300',
                            body: (<div><p className="text-[10.5px] text-th-secondary leading-relaxed mb-3">{r.resolution}</p><div className="flex flex-wrap gap-2">{r.appealDrafted && <button onClick={() => navigate('/work/denials/appeals')} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold bg-[rgb(var(--color-primary))] text-white hover:opacity-90 transition-opacity"><span className="material-symbols-outlined text-[12px]">description</span>Review AI Appeal →</button>}<button onClick={() => navigate('/analytics/prevention')} className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-semibold bg-th-surface-overlay border border-th-border text-th-secondary hover:text-th-heading transition-colors"><span className="material-symbols-outlined text-[12px]">shield</span>Fix Prevention Gap →</button></div></div>) },
                        ];

                        return (
                          <div className="pt-2 border-t border-th-border">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-th-muted font-mono mb-2">🧠 5-Layer AI Intelligence</p>
                            <div className="space-y-1">
                              {layers.map(layer => {
                                const isOpen = openLayers.includes(layer.n);
                                return (
                                  <div key={layer.n} className={cn('border rounded-md overflow-hidden', layer.hBg)}>
                                    <button onClick={() => toggleLayer(layer.n)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-left', layer.hBg)}>
                                      <span className={cn('size-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono shrink-0', layer.numBg)}>{layer.n}</span>
                                      <span className={cn('text-[8.5px] font-bold uppercase tracking-wider font-mono flex-1', layer.nameColor)}>{layer.name}</span>
                                      <span className={cn('text-[9px] font-mono shrink-0', layer.statusColor)}>{layer.subtitle}</span>
                                      <span className={cn('material-symbols-outlined text-[12px] text-th-muted transition-transform shrink-0', isOpen ? 'rotate-90' : '')}>play_arrow</span>
                                    </button>
                                    {isOpen && <div className="px-3 pb-3 pt-1 border-t border-white/5">{layer.body}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: APPEAL WORKBENCH */}
        {activeTab === 'appeal' && (
          <AppealWorkbench />
        )}

        {/* TAB 3: HIGH RISK CLAIMS */}
        {activeTab === 'risk' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label:'High Risk (>70% denial)', val: detectBriefing?.kpis?.high_risk_count ?? '—', sub: detectBriefing?.kpis?.high_risk_amount ? '$' + Math.round(detectBriefing.kpis.high_risk_amount/1000) + 'K at risk' : '—', note:'Action needed today', accent:'border-t-[rgb(var(--color-danger))]', valColor:'text-[rgb(var(--color-danger))]' },
                { label:'CRS Below 60', val: detectBriefing?.kpis?.crs_below_60 ?? '—', sub:'AUTO-006 holds active', note:'Review before submission', accent:'border-t-[rgb(var(--color-warning))]', valColor:'text-[rgb(var(--color-warning))]' },
                { label:'Write-off Risk >50%', val: detectBriefing?.kpis?.write_off_high ?? '—', sub: detectBriefing?.kpis?.write_off_amount ? '$' + Math.round(detectBriefing.kpis.write_off_amount/1000) + 'K exposure' : '—', note:'Pre-write-off queue', accent:'border-t-[rgb(var(--color-warning))]', valColor:'text-[rgb(var(--color-warning))]' },
                { label:'Preventable (MiroFish)', val: detectBriefing?.kpis?.preventable_count ?? '—', sub:'Appeal recommended', note: detectBriefing?.kpis?.preventable_amount ? '$' + Math.round(detectBriefing.kpis.preventable_amount/1000) + 'K recovery est.' : '—', accent:'border-t-[rgb(var(--color-success))]', valColor:'text-[rgb(var(--color-success))]' },
              ].map((k, i) => (
                <div key={i} className={cn('bg-th-surface-raised border border-th-border border-t-2 rounded-lg p-4', k.accent)}>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-th-muted mb-2">{k.label}</p>
                  <p className={cn('text-[28px] font-black leading-none tabular-nums', k.valColor)}>{k.val}</p>
                  <p className="text-[10px] text-th-muted mt-1">{k.sub}</p>
                  <p className={cn('text-[9px] font-semibold mt-1', k.valColor)}>{k.note}</p>
                </div>
              ))}
            </div>
            <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                <h3 className="text-[11px] font-semibold text-th-heading">🔥 High Risk Claims · ML Composite Risk Score</h3>
                <button onClick={() => navigate('/intelligence/lida/chat')} className="text-[10px] text-[rgb(var(--color-primary))] hover:underline">Ask LIDA →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead><tr className="border-b border-th-border bg-th-surface-overlay">
                    {['Claim','Payer','Amount','Denial Prob','Write-off','CRS','MF','CARC','Action'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[9px] font-mono font-semibold uppercase tracking-wider text-th-muted whitespace-nowrap">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const STATIC_HIGH_RISK = [
                        { id:'CLM-9041', payer:'BCBS TX', amt:12400, dp:91, wo:67, crs:'54 HOLD', mf:'disputed', carc:'CO-4', action:'Review' },
                        { id:'CLM-5510', payer:'Medicare', amt:6100, dp:84, wo:41, crs:'62', mf:'disputed', carc:'CO-4', action:'Review' },
                        { id:'CLM-3301', payer:'Humana', amt:9800, dp:78, wo:72, crs:'48 HOLD', mf:'disputed', carc:'CO-29', action:'Urgent' },
                        { id:'CLM-7204', payer:'UHC', amt:2800, dp:78, wo:35, crs:'71', mf:'pending', carc:'PR-50', action:'Simulate' },
                        { id:'CLM-7788', payer:'Aetna', amt:8400, dp:62, wo:18, crs:'74', mf:'confirmed', carc:'CO-97', action:'Appeal' },
                      ];
                      const src = appeals.length > 0 ? appeals : FALLBACK_CLAIMS;
                      const liveHighRisk = src
                        .filter(c => (c.denial_probability >= 0.60) || c.urg_level === 'CRIT' || c.urg_level === 'HIGH')
                        .sort((a, b) => (b.denial_probability || 0) - (a.denial_probability || 0))
                        .map(c => ({
                          id: c.claim_id || c.id,
                          payer: c.payer || c.payer_id || 'Unknown',
                          amt: c.denial_amount || c.amount || 0,
                          dp: c.denial_probability != null ? Math.round(c.denial_probability * 100) : (c.urgScore || 0),
                          wo: c.write_off_risk != null ? Math.round(c.write_off_risk * 100) : 0,
                          crs: c.composite_risk_score != null ? `${c.composite_risk_score}${c.hold_flag ? ' HOLD' : ''}` : String(c.urgScore || 0),
                          mf: c.mf_verdict || c.mf || 'pending',
                          carc: c.carc_code || c.carc || '',
                          action: c.urg_level === 'CRIT' ? 'Urgent' : c.mf_verdict === 'confirmed' ? 'Appeal' : 'Review',
                        }));
                      return (liveHighRisk.length > 0 ? liveHighRisk : STATIC_HIGH_RISK);
                    })().map((row, i) => (
                      <tr key={i} onClick={() => { setSelectedClaim(row.id); setActiveTab('queue'); }} className="border-b border-th-border last:border-0 hover:bg-th-surface-overlay transition-colors cursor-pointer">
                        <td className="px-3 py-2.5 font-mono font-bold text-[rgb(var(--color-info))]">{row.id}</td>
                        <td className="px-3 py-2.5 text-th-secondary">{row.payer}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-th-heading">${row.amt.toLocaleString()}</td>
                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="w-16 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden"><div className={cn('h-full rounded-full', row.dp >= 80 ? 'bg-[rgb(var(--color-danger))]' : 'bg-[rgb(var(--color-warning))]')} style={{width:`${row.dp}%`}} /></div><span className={cn('font-mono text-[9px] font-bold', row.dp >= 80 ? 'text-[rgb(var(--color-danger))]' : 'text-[rgb(var(--color-warning))]')}>{row.dp}%</span></div></td>
                        <td className={cn('px-3 py-2.5 font-mono font-bold', row.wo >= 60 ? 'text-[rgb(var(--color-danger))]' : row.wo >= 30 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-success))]')}>{row.wo}%</td>
                        <td className="px-3 py-2.5"><span className={cn('px-2 py-0.5 rounded text-[9px] font-bold font-mono border', row.crs.includes('HOLD') ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]' : Number(row.crs) >= 70 ? 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]' : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]')}>{row.crs}</span></td>
                        <td className="px-3 py-2.5">{row.mf === 'confirmed' ? <span className="text-[rgb(var(--color-success))] font-bold text-[10px]">✓</span> : row.mf === 'disputed' ? <span className="text-[rgb(var(--color-danger))] font-bold text-[10px]">✗</span> : <span className="text-[rgb(var(--color-warning))] text-[10px]">⏳</span>}</td>
                        <td className={cn('px-3 py-2.5 font-mono font-bold', row.carc.startsWith('CO') ? 'text-[rgb(var(--color-danger))]' : 'text-[rgb(var(--color-warning))]')}>{row.carc}</td>
                        <td className="px-3 py-2.5"><button onClick={(e) => { e.stopPropagation(); setSelectedClaim(row.id); setActiveTab('queue'); }} className={cn('px-2 py-0.5 rounded text-[9px] font-bold border', row.action === 'Urgent' ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]' : row.action === 'Appeal' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' : row.action === 'Simulate' ? 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]' : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]')}>{row.action} →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-th-surface-raised border border-[rgb(var(--color-primary)/0.2)] rounded-lg">
              <div>
                <p className="text-[11px] font-semibold text-th-heading">7 of these 31 high-risk claims had prevention alerts that were dismissed before submission</p>
                <p className="text-[10px] text-th-muted mt-0.5">ELIGIBILITY_RISK or AUTH_EXPIRY alerts existed but were not acted on</p>
              </div>
              <button onClick={() => navigate('/analytics/prevention')} className="ml-4 shrink-0 px-3 py-1.5 rounded border border-th-border bg-th-surface-overlay text-[11px] text-th-secondary hover:text-th-heading transition-colors">🛡 Fix Prevention Rules →</button>
            </div>
          </div>
        )}

        {/* TAB 4: PAYER PATTERNS + HEATMAP */}
        {activeTab === 'payer' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-2 text-[8.5px] font-mono font-bold text-th-muted uppercase tracking-widest">
              CARC Code Heatmap · Payer × Denial Reason · Click any cell to filter
              <span className="flex-1 h-px bg-th-border" />
            </div>
            <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                <h3 className="text-[11px] font-semibold text-th-heading">🗺️ Denial Heatmap · Payer × CARC</h3>
                <button onClick={() => navigate('/analytics/graph-explorer')} className="text-[10px] text-[rgb(var(--color-primary))] hover:underline">Graph Explorer →</button>
              </div>
              <div className="p-4">
                {(() => {
                  // Build heatmap from detect-briefing API, then denial-matrix API, else static fallback
                  const STATIC_CARCS = ['CO-16\nAuth','CO-4\nCode','CO-97\nDup','PR-50\nMedNec','CO-11\nDiag','CO-29\nTimely','Other'];
                  const STATIC_CARC_KEYS = ['CO-16','CO-4','CO-97','PR-50','CO-11','CO-29','Other'];
                  const STATIC_ROWS = [
                    { payer:'Medicare', cells:[5,4,1,0,2,0,1] },
                    { payer:'BCBS TX', cells:[0,6,1,1,0,0,1] },
                    { payer:'Aetna', cells:[2,1,3,1,0,1,0] },
                    { payer:'UHC', cells:[1,2,1,2,1,0,0] },
                    { payer:'Cigna', cells:[2,0,1,1,2,0,0] },
                    { payer:'Humana', cells:[1,0,0,0,0,3,0] },
                  ];
                  const briefingHeatmap = detectBriefing?.heatmap;
                  const useApiMatrix = briefingHeatmap ? true : heatmapPayers !== FALLBACK_HEATMAP_PAYERS;
                  const CARCS = briefingHeatmap
                    ? briefingHeatmap.categories.map(c => c.replace(/_/g, ' ').replace(/-/g, '\n'))
                    : useApiMatrix ? heatmapDepts.map(d => d.replace(/_/g, ' ')) : STATIC_CARCS;
                  const CARC_KEYS = briefingHeatmap
                    ? briefingHeatmap.categories
                    : useApiMatrix ? heatmapDepts : STATIC_CARC_KEYS;
                  const ROWS = briefingHeatmap
                    ? briefingHeatmap.matrix.map(row => ({ payer: row.payer, cells: row.cells.map(c => c.count) }))
                    : useApiMatrix
                    ? heatmapPayers.map(p => ({
                        payer: p,
                        cells: CARC_KEYS.map(cat => heatmapData[p]?.[cat] ?? 0),
                      }))
                    : STATIC_ROWS;
                  const maxVal = Math.max(6, ...ROWS.flatMap(r => r.cells));
                  const cellBg = (v) => {
                    if (v === 0) return 'bg-th-surface-overlay text-th-muted';
                    const intensity = v / maxVal;
                    if (intensity >= 0.8) return 'bg-[rgb(var(--color-danger))] text-white';
                    if (intensity >= 0.5) return 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]';
                    if (intensity >= 0.2) return 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))]';
                    return 'bg-th-surface-overlay text-th-muted';
                  };
                  return (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-16 shrink-0" />
                        {CARCS.map((c, i) => (<div key={i} className="flex-1 text-center text-[8px] font-mono text-th-muted leading-tight whitespace-pre-line">{c}</div>))}
                      </div>
                      {ROWS.map((row, ri) => (
                        <div key={ri} className="flex gap-1.5 items-center">
                          <div className="w-16 shrink-0 text-[9px] font-semibold text-th-secondary truncate">{row.payer}</div>
                          {row.cells.map((v, ci) => (
                            <button key={ci} onClick={() => { setPayerFilter(row.payer); setCarcFilter(CARC_KEYS[ci]); setActiveTab('queue'); }}
                              className={cn('flex-1 h-6 rounded flex items-center justify-center text-[9px] font-bold font-mono transition-transform hover:scale-110', cellBg(v))}>
                              {v > 0 ? (v === 6 ? `${v}🔥` : String(v)) : ''}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div className="mt-3 px-3 py-2 bg-[rgb(var(--color-danger-bg))] border border-[rgb(var(--color-danger)/0.3)] rounded-md text-[10.5px] text-th-secondary leading-relaxed flex items-center gap-3">
                  {(() => {
                    const hottestRow = detectBriefing?.heatmap?.matrix?.[0];
                    const hottestCell = hottestRow?.cells?.reduce((max, c) => c.count > (max?.count || 0) ? c : max, null);
                    const hottestPayer = hottestRow?.payer;
                    if (hottestPayer && hottestCell) {
                      return <span>🔥 <strong className="text-[rgb(var(--color-danger))]">{hottestPayer} {hottestCell.carc || CARC_KEYS[hottestRow.cells.indexOf(hottestCell)]} spike: {hottestCell.count} denials</strong> — MiroFish: fix root cause to reduce denial rate.</span>;
                    }
                    return <span>🔥 <strong className="text-[rgb(var(--color-danger))]">BCBS TX CO-4 spike: 6 denials</strong> — 3 providers. CPT mismatch. MiroFish: fix coding → denial rate drop +$120K/month.</span>;
                  })()}
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => navigate('/analytics/prevention')} className="px-2 py-1 rounded text-[9.5px] border border-th-border bg-th-surface-raised text-th-secondary hover:text-th-heading transition-colors whitespace-nowrap">Fix coding →</button>
                    <button onClick={() => navigate('/intelligence/lida/chat')} className="px-2 py-1 rounded text-[9.5px] border border-th-border bg-th-surface-raised text-th-secondary hover:text-th-heading transition-colors whitespace-nowrap">Ask LIDA →</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                <h3 className="text-[11px] font-semibold text-th-heading">📊 Trending Root Causes · Last 30 Days</h3>
              </div>
              <table className="w-full text-[11px]">
                <thead><tr className="border-b border-th-border bg-th-surface-overlay">
                  {['Root Cause','Group','Count','Revenue','Trend','Prevention'].map(h => (<th key={h} className="px-3 py-2 text-left text-[9px] font-mono font-semibold uppercase tracking-wider text-th-muted">{h}</th>))}
                </tr></thead>
                <tbody>
                  {(() => {
                    const STATIC_TRENDS = [
                      { cause:'Auth Missing', group:'Admin', gc:'danger', count:11, rev:'$84K', trend:'↑ +18%', tc:'danger', link:'AUTH rule →', lc:'warning' },
                      { cause:'CPT Mismatch', group:'Coding', gc:'warning', count:9, rev:'$62K', trend:'↑ +41%', tc:'danger', link:'Coding alert →', lc:'danger' },
                      { cause:'Duplicate Claim', group:'System', gc:'info', count:7, rev:'$44K', trend:'↓ -8%', tc:'success', link:'AUTO-012 ✓', lc:'success' },
                      { cause:'Med Necessity', group:'Clinical', gc:'purple', count:6, rev:'$38K', trend:'→ Stable', tc:'muted', link:'Manual review', lc:'muted' },
                      { cause:'Timely Filing', group:'Admin', gc:'warning', count:4, rev:'$28K', trend:'↑ +12%', tc:'warning', link:'AUTO-009 →', lc:'warning' },
                    ];
                    const groupColorMap = { Admin:'danger', Coding:'warning', System:'info', Clinical:'purple' };
                    const trendColor = (pct) => pct > 0 ? 'danger' : pct < 0 ? 'success' : 'muted';
                    const apiTrends = detectBriefing?.trending_root_causes?.map(t => ({
                      cause: t.cause,
                      group: t.group,
                      gc: groupColorMap[t.group] || 'warning',
                      count: t.count,
                      rev: t.revenue >= 1000 ? '$' + Math.round(t.revenue / 1000) + 'K' : '$' + t.revenue,
                      trend: (t.trend_pct > 0 ? '↑ +' : t.trend_pct < 0 ? '↓ ' : '→ ') + (t.trend_pct === 0 ? 'Stable' : t.trend_pct + '%'),
                      tc: trendColor(t.trend_pct),
                      link: t.prevention_link || 'Review →',
                      lc: trendColor(t.trend_pct),
                    }));
                    return (apiTrends || STATIC_TRENDS);
                  })().map((row, i) => {
                    const colors = {danger:'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]', warning:'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]', info:'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]', success:'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]', purple:'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700', muted:'bg-th-surface-overlay text-th-muted border-th-border'};
                    const tc = {danger:'text-[rgb(var(--color-danger))]', warning:'text-[rgb(var(--color-warning))]', success:'text-[rgb(var(--color-success))]', muted:'text-th-muted'};
                    return (
                      <tr key={i} className="border-b border-th-border last:border-0 hover:bg-th-surface-overlay transition-colors cursor-pointer">
                        <td className="px-3 py-2.5 font-semibold text-th-heading">{row.cause}</td>
                        <td className="px-3 py-2.5"><span className={cn('px-2 py-0.5 rounded text-[9px] font-bold border', colors[row.gc])}>{row.group}</span></td>
                        <td className="px-3 py-2.5 font-mono font-bold text-th-heading">{row.count}</td>
                        <td className={cn('px-3 py-2.5 font-mono font-semibold', tc[row.tc])}>{row.rev}</td>
                        <td className={cn('px-3 py-2.5 font-semibold', tc[row.tc])}>{row.trend}</td>
                        <td className="px-3 py-2.5"><span className={cn('px-2 py-0.5 rounded text-[9px] font-bold border', colors[row.lc])}>{row.link}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ROOT CAUSE INTELLIGENCE */}
        {activeTab === 'rca' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Section label */}
            <div className="flex items-center gap-2 text-[8.5px] font-mono font-bold text-th-muted uppercase tracking-widest">
              Root Cause Intelligence · Real-time from {(detectBriefing?.filter_facets?.mf_verdicts || []).reduce((s,v) => s + v.count, 0).toLocaleString() || '—'} analyzed denials
              <span className="flex-1 h-px bg-th-border" />
            </div>

            {/* 4 KPI summary cards */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-th-surface-raised border border-th-border border-t-2 border-t-[rgb(var(--color-success))] rounded-lg p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-th-muted mb-2">Preventable (Recoverable)</p>
                <p className="text-[28px] font-black leading-none tabular-nums text-[rgb(var(--color-success))]">{detectBriefing?.kpis?.preventable_count?.toLocaleString() ?? '—'}</p>
                <p className="text-[10px] text-th-muted mt-1">{detectBriefing?.kpis?.preventable_amount ? '$' + Math.round(detectBriefing.kpis.preventable_amount / 1e6) + 'M recovery potential' : '—'}</p>
              </div>
              <div className="bg-th-surface-raised border border-th-border border-t-2 border-t-[rgb(var(--color-danger))] rounded-lg p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-th-muted mb-2">CRS Below 60 (Held)</p>
                <p className="text-[28px] font-black leading-none tabular-nums text-[rgb(var(--color-danger))]">{detectBriefing?.kpis?.crs_below_60?.toLocaleString() ?? '—'}</p>
                <p className="text-[10px] text-th-muted mt-1">AUTO-006 holds active</p>
              </div>
              <div className="bg-th-surface-raised border border-th-border border-t-2 border-t-[rgb(var(--color-warning))] rounded-lg p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-th-muted mb-2">Write-off Risk &gt;50%</p>
                <p className="text-[28px] font-black leading-none tabular-nums text-[rgb(var(--color-warning))]">{detectBriefing?.kpis?.write_off_high?.toLocaleString() ?? '—'}</p>
                <p className="text-[10px] text-th-muted mt-1">{detectBriefing?.kpis?.write_off_amount ? '$' + Math.round(detectBriefing.kpis.write_off_amount / 1000) + 'K exposure' : '—'}</p>
              </div>
              <div className="bg-th-surface-raised border border-th-border border-t-2 border-t-[rgb(var(--color-info))] rounded-lg p-4">
                <p className="text-[9px] font-mono uppercase tracking-wider text-th-muted mb-2">MiroFish Confirmed</p>
                <p className="text-[28px] font-black leading-none tabular-nums text-[rgb(var(--color-info))]">{(detectBriefing?.filter_facets?.mf_verdicts?.find(v => v.val === 'confirmed')?.count || 0).toLocaleString()}</p>
                <p className="text-[10px] text-th-muted mt-1">Appeal recommended</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* LEFT: Root Cause Breakdown */}
              <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                  <h3 className="text-[11px] font-semibold text-th-heading">Root Cause Breakdown</h3>
                  <button onClick={() => navigate('/analytics/graph-explorer')} className="text-[10px] text-[rgb(var(--color-primary))] hover:underline">Graph Explorer →</button>
                </div>
                <div className="p-4 space-y-3">
                  {/* Trending root causes from API */}
                  {(detectBriefing?.trending_root_causes || []).length > 0 ? (
                    (detectBriefing.trending_root_causes).map((rc, i) => {
                      const maxCount = Math.max(...(detectBriefing.trending_root_causes).map(r => r.count));
                      const pct = maxCount > 0 ? Math.round((rc.count / maxCount) * 100) : 0;
                      const groupColors = {
                        'PREVENTABLE': { bar: 'bg-[rgb(var(--color-success))]', text: 'text-[rgb(var(--color-success))]', badge: 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' },
                        'PROCESS': { bar: 'bg-[rgb(var(--color-warning))]', text: 'text-[rgb(var(--color-warning))]', badge: 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]' },
                        'PAYER': { bar: 'bg-[rgb(var(--color-info))]', text: 'text-[rgb(var(--color-info))]', badge: 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]' },
                        'CLINICAL': { bar: 'bg-purple-500', text: 'text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700' },
                      };
                      const gc = groupColors[rc.group] || groupColors['PROCESS'];
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-th-heading">{rc.cause}</span>
                              <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold border', gc.badge)}>{rc.group}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono font-bold text-th-heading">{rc.count}</span>
                              <span className={cn('text-[10px] font-mono', gc.text)}>
                                {rc.revenue > 0 ? '$' + (rc.revenue >= 1e6 ? (rc.revenue/1e6).toFixed(1) + 'M' : Math.round(rc.revenue/1000) + 'K') : '—'}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', gc.bar)} style={{width: pct + '%'}} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <span className="material-symbols-outlined text-3xl text-th-muted">analytics</span>
                      <p className="text-[11px] text-th-muted">No root cause data analyzed yet</p>
                      <button onClick={() => {
                        api.rootCause.validateBatch(50).then(() => api.denials.getDetectBriefing()).then(d => { if (d) setDetectBriefing(d); }).catch(() => {});
                      }} className="px-4 py-2 rounded-md text-[11px] font-semibold bg-[rgb(var(--color-primary))] text-white hover:opacity-90 transition-opacity">
                        Run MiroFish Analysis (50 denials)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Payer x CARC Hotspots */}
              <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                  <h3 className="text-[11px] font-semibold text-th-heading">Top Payers by Denial Volume</h3>
                </div>
                <div className="p-4 space-y-2">
                  {(detectBriefing?.filter_facets?.payers || []).map((p, i) => {
                    const maxC = Math.max(...(detectBriefing?.filter_facets?.payers || []).map(x => x.count));
                    const pct = maxC > 0 ? Math.round((p.count / maxC) * 100) : 0;
                    return (
                      <button key={i} onClick={() => { setPayerFilter(p.val); setActiveTab('queue'); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded border border-th-border bg-th-surface-overlay hover:bg-th-surface-raised transition-colors text-left">
                        <span className="text-[10px] font-semibold text-th-heading w-[120px] truncate">{p.val}</span>
                        <div className="flex-1 h-1.5 bg-th-surface-base rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[rgb(var(--color-danger))]" style={{width: pct + '%'}} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[rgb(var(--color-danger))] w-10 text-right">{p.count}</span>
                      </button>
                    );
                  })}
                  {(detectBriefing?.filter_facets?.payers || []).length === 0 && (
                    <p className="text-[10px] text-th-muted italic text-center py-4">Loading payer data...</p>
                  )}
                </div>
              </div>

            </div>

            {/* Bottom: CARC Code Distribution + Denial Categories */}
            <div className="grid grid-cols-2 gap-4">

              {/* CARC Codes */}
              <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                  <h3 className="text-[11px] font-semibold text-th-heading">CARC Code Distribution</h3>
                </div>
                <div className="p-4 space-y-1.5">
                  {(detectBriefing?.filter_facets?.carc_codes || []).map((c, i) => (
                    <button key={i} onClick={() => { setCarcFilter(c.val); setActiveTab('queue'); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded border border-th-border bg-th-surface-overlay hover:bg-th-surface-raised transition-colors text-left">
                      <span className="font-mono text-[10px] font-bold text-[rgb(var(--color-danger))]">{c.val}</span>
                      <span className="text-[10px] font-mono text-th-heading">{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Denial Categories */}
              <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-th-border bg-th-surface-overlay">
                  <h3 className="text-[11px] font-semibold text-th-heading">Denial Category Breakdown</h3>
                </div>
                <div className="p-4 space-y-1.5">
                  {(detectBriefing?.filter_facets?.categories || []).map((c, i) => {
                    const totalCats = (detectBriefing?.filter_facets?.categories || []).reduce((s, x) => s + x.count, 0);
                    const pct = totalCats > 0 ? Math.round((c.count / totalCats) * 100) : 0;
                    return (
                      <button key={i} onClick={() => { setCategoryFilter(c.val); setActiveTab('queue'); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded border border-th-border bg-th-surface-overlay hover:bg-th-surface-raised transition-colors text-left">
                        <span className="text-[10px] font-semibold text-th-heading flex-1">{c.val}</span>
                        <span className="text-[10px] font-mono text-th-muted">{pct}%</span>
                        <span className="text-[10px] font-mono font-bold text-th-heading w-12 text-right">{c.count.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Action bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-th-surface-raised border border-[rgb(var(--color-primary)/0.2)] rounded-lg">
              <div>
                <p className="text-[11px] font-semibold text-th-heading">
                  {detectBriefing?.kpis?.preventable_count?.toLocaleString() || '—'} denials are preventable — {detectBriefing?.kpis?.preventable_amount ? '$' + Math.round(detectBriefing.kpis.preventable_amount / 1e6) + 'M' : '—'} recoverable
                </p>
                <p className="text-[10px] text-th-muted mt-0.5">Fix prevention rules and coding patterns to reduce future denials</p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4">
                <button onClick={() => navigate('/analytics/prevention')} className="px-3 py-1.5 rounded border border-th-border bg-th-surface-overlay text-[11px] text-th-secondary hover:text-th-heading transition-colors">Fix Prevention Rules →</button>
                <button onClick={() => navigate('/intelligence/lida/chat')} className="px-3 py-1.5 rounded border border-th-border bg-th-surface-overlay text-[11px] text-th-secondary hover:text-th-heading transition-colors">Ask LIDA →</button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
 );
}
