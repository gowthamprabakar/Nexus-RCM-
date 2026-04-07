import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const APPEAL_DATA = {
  'CLM-8821': {
    payer: 'Medicare', amount: 4200, carc: 'CO-16', patient: 'Sarah Johnson',
    mf: 'confirmed', mfConf: 87,
    mfReason: '47 agents agree: Prior auth PA-2024-8821 covers DOS 2024-01-15. Denial is administrative non-attachment. Fully recoverable.',
    arguments: [
      { color: 'success', title: 'Auth was valid:', body: 'PA-2024-8821 active on DOS. Medicare §1842(l) allows resubmission with auth documentation.' },
      { color: 'success', title: 'Administrative error:', body: 'Auth not attached due to EHR migration workflow gap. 9 of 11 similar claims appealed successfully.' },
      { color: 'primary', title: 'Historical precedent:', body: 'Medicare upheld 89% of similar admin CO-16 denials with auth documentation. Graph evidence confirms.' },
      { color: 'purple', title: 'Medical necessity met:', body: 'CPT 99215 appropriate — 5-component exam documented. No clinical denial basis.' },
    ],
    scores: [
      { label: 'Appeal success', val: 87, color: 'success' },
      { label: 'Denial recurrence prob', val: 23, color: 'success' },
      { label: 'Write-off risk if not appealed', val: 42, color: 'warning' },
    ],
    docs: [
      { name: 'Prior Auth PA-2024-8821', status: 'attached' },
      { name: 'Clinical Notes DOS 2024-01-15', status: 'attached' },
      { name: 'PAR Letter from Dr. Martinez', status: 'pending' },
      { name: 'EHR Migration Documentation', status: 'optional' },
    ],
    letterConfidence: 91,
    letter: `April 04, 2026\n\nMedicare Provider Relations\nRe: Appeal of Claim Denial — CLM-8821\n\nDear Medicare Provider Relations,\n\nWe are formally appealing the denial of claim CLM-8821 for services rendered to Sarah Johnson (MRN-10284) on January 15, 2024. The claim was denied under CO-16.\n\nBasis for Appeal: Prior Authorization PA-2024-8821 was obtained and valid for DOS. The authorization was not attached due to EHR migration — an administrative error.\n\nSupporting Documentation Enclosed:\n1. Copy of Prior Authorization PA-2024-8821\n2. Complete clinical notes\n3. Physician attestation from Dr. Martinez\n\nWe respectfully request reconsideration and payment of $4,200.00.\n\nSincerely,\nSarah Patel · Billing Director`,
  },
  'CLM-7788': {
    payer: 'Aetna', amount: 8400, carc: 'CO-97', patient: 'David Park',
    mf: 'confirmed', mfConf: 74,
    mfReason: 'Duplicate is a system error from billing migration. Original claim paid. Appeal with migration evidence will be upheld.',
    arguments: [
      { color: 'success', title: 'System-generated duplicate:', body: 'EHR migration triggered duplicate. Not a human error.' },
      { color: 'success', title: 'Original claim paid:', body: 'CLM-7781 (original) was paid in full.' },
      { color: 'primary', title: 'Historical precedent:', body: 'Aetna accepted 74% of similar system-generated duplicate reversals.' },
    ],
    scores: [
      { label: 'Appeal success', val: 74, color: 'success' },
      { label: 'Denial recurrence prob', val: 18, color: 'success' },
      { label: 'Write-off risk', val: 18, color: 'success' },
    ],
    docs: [
      { name: 'Evidence of original payment CLM-7781', status: 'attached' },
      { name: 'EHR migration documentation', status: 'attached' },
      { name: 'Letter confirming system-generated dup', status: 'pending' },
    ],
    letterConfidence: 82,
    letter: `April 04, 2026\n\nAetna Provider Relations\nRe: Appeal — CLM-7788 (CO-97 Duplicate)\n\nDear Aetna Provider Relations,\n\nWe are appealing CLM-7788 denied under CO-97. This duplicate was generated automatically during EHR migration. Original claim CLM-7781 was paid.\n\nEnclosed:\n1. Evidence of original payment CLM-7781\n2. EHR migration documentation\n\nWe request reversal and payment of $8,400.00.\n\nSincerely,\nSarah Patel · Billing Director`,
  },
  'CLM-6632': {
    payer: 'Cigna', amount: 3900, carc: 'CO-16', patient: 'James Wilson',
    mf: 'confirmed', mfConf: 81,
    mfReason: 'Renewal request initiated before DOS. Cigna policy allows retroactive auth in renewal delay cases. 81% win rate.',
    arguments: [
      { color: 'success', title: 'Renewal requested before DOS:', body: 'Auth renewal submitted 2024-02-08, before DOS 2024-02-15.' },
      { color: 'success', title: 'Ongoing clinical necessity:', body: 'Treatment ongoing — auth lapse was administrative.' },
      { color: 'primary', title: 'Cigna retroactive auth policy:', body: 'Cigna §12.4 allows retroactive auth when renewal in process.' },
    ],
    scores: [
      { label: 'Appeal success', val: 81, color: 'success' },
      { label: 'Denial recurrence prob', val: 12, color: 'success' },
      { label: 'Write-off risk', val: 12, color: 'success' },
    ],
    docs: [
      { name: 'Auth renewal request dated 2024-02-08', status: 'attached' },
      { name: 'Clinical notes', status: 'attached' },
      { name: 'Cigna retroactive auth policy citation', status: 'pending' },
    ],
    letterConfidence: 85,
    letter: `April 04, 2026\n\nCigna Provider Relations\nRe: Appeal — CLM-6632 (CO-16 Auth Expired)\n\nDear Cigna Provider Relations,\n\nWe appeal CLM-6632 denied under CO-16. Auth renewal was requested 2024-02-08 before DOS. Under Cigna §12.4, retroactive auth is permitted.\n\nEnclosed:\n1. Auth renewal request\n2. Clinical notes\n3. Cigna policy citation\n\nWe request payment of $3,900.00.\n\nSincerely,\nSarah Patel · Billing Director`,
  },
  'CLM-4821': {
    payer: 'BCBS TX', amount: 4800, carc: 'CO-4', patient: 'Dr Kim Patient',
    mf: 'confirmed', mfConf: 71,
    mfReason: 'Modifier-25 required for same-day E&M + procedure under BCBS TX policy. Documentation supports separate evaluation.',
    arguments: [
      { color: 'success', title: 'Separate significant evaluation:', body: 'Dr. Kim performed distinct E&M service separate from procedure — documented.' },
      { color: 'primary', title: 'Modifier-25 appropriate:', body: 'CPT guidelines allow Modifier-25 for separately identifiable E&M on same day as procedure.' },
    ],
    scores: [
      { label: 'Appeal success', val: 71, color: 'success' },
      { label: 'Denial recurrence prob', val: 22, color: 'success' },
      { label: 'Write-off risk', val: 22, color: 'success' },
    ],
    docs: [
      { name: 'Clinical notes with Modifier-25 documentation', status: 'attached' },
      { name: 'CPT Modifier-25 policy reference', status: 'pending' },
    ],
    letterConfidence: 78,
    letter: `April 04, 2026\n\nBCBS TX Provider Relations\nRe: Appeal — CLM-4821 (CO-4 Modifier-25)\n\nDear BCBS TX Provider Relations,\n\nWe appeal CLM-4821. Modifier-25 was appropriate — Dr. Kim performed a separate E&M service documented in clinical notes.\n\nEnclosed:\n1. Clinical notes\n2. CPT Modifier-25 policy reference\n\nWe request payment of $4,800.00.\n\nSincerely,\nSarah Patel · Billing Director`,
  },
};

const IN_FLIGHT_APPEALS = [
  { id: 'CLM-8821', payer: 'Medicare', amount: 4200, winPct: 87, status: 'Pending review', deadline: 'Jul-15' },
  { id: 'CLM-6632', payer: 'Cigna', amount: 3900, winPct: 81, status: 'Pending review', deadline: 'Jun-30' },
  { id: 'CLM-7788', payer: 'Aetna', amount: 8400, winPct: 74, status: 'Under review', deadline: 'May-20' },
  { id: 'CLM-4821', payer: 'BCBS TX', amount: 4800, winPct: 71, status: 'Draft', deadline: 'Jul-01' },
  { id: 'CLM-2910', payer: 'Medicare', amount: 1200, winPct: 79, status: 'Submitted', deadline: 'Aug-10' },
];

export default function AppealPipelineTracker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlClaim = searchParams.get('claim');
  const [selectedId, setSelectedId] = useState(urlClaim || 'CLM-8821');
  const [letterText, setLetterText] = useState('');
  const [liveAppeals, setLiveAppeals] = useState([]);
  const [letterLoading, setLetterLoading] = useState(false);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [claimRCA, setClaimRCA] = useState(null);
  const [rcaLoading, setRcaLoading] = useState(false);

  const claim = APPEAL_DATA[selectedId] || APPEAL_DATA['CLM-8821'];

  // Normalize API appeal rows to the UI shape expected by the table
  const normalizeAppeal = (a) => ({
    id: a.claim_id || a.id,
    claim_id: a.claim_id,
    appeal_id: a.appeal_id,
    payer: a.payer_name || a.payer || 'Unknown',
    amount: a.denial_amount != null ? a.denial_amount : (a.amount || 0),
    winPct: a.win_pct != null ? a.win_pct : (a.winPct || a.appeal_quality_score || 0),
    status: (() => {
      const o = (a.outcome || '').toUpperCase();
      if (o === 'WON' || o === 'APPROVED') return 'Submitted';
      if (o === 'UNDER_REVIEW') return 'Under review';
      if (o === 'LOST' || o === 'DENIED') return 'Denied';
      return a.status || 'Pending review';
    })(),
    deadline: a.deadline || '—',
  });

  // Load real appeals list from backend
  useEffect(() => {
    setAppealsLoading(true);
    api.appeals.list({ page: 1, size: 50 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.items || res?.appeals || []);
        if (list.length > 0) setLiveAppeals(list.map(normalizeAppeal));
      })
      .catch(() => {})
      .finally(() => setAppealsLoading(false));
  }, []);

  // Fetch RCA when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    setRcaLoading(true);
    setClaimRCA(null);
    api.rootCause?.getClaimAnalysis?.(selectedId)
      .then(res => {
        if (res?.analysis) setClaimRCA(res.analysis);
      })
      .catch(() => {})
      .finally(() => setRcaLoading(false));
  }, [selectedId]);

  // Compute scores from live appeal data if available
  const liveAppeal = liveAppeals.find(a => (a.claim_id || a.id) === selectedId);
  const liveScores = liveAppeal ? [
    { label: 'Appeal success', val: liveAppeal.win_pct || liveAppeal.winPct || 0, color: (liveAppeal.win_pct || liveAppeal.winPct || 0) >= 70 ? 'success' : (liveAppeal.win_pct || liveAppeal.winPct || 0) >= 50 ? 'warning' : 'danger' },
    { label: 'Denial recurrence prob', val: Math.round((liveAppeal.denial_prob || 0) * 100) || 0, color: (liveAppeal.denial_prob || 0) <= 0.3 ? 'success' : (liveAppeal.denial_prob || 0) <= 0.6 ? 'warning' : 'danger' },
    { label: 'Write-off risk', val: Math.round((liveAppeal.write_off || 0) * 100) || 0, color: (liveAppeal.write_off || 0) <= 0.25 ? 'success' : (liveAppeal.write_off || 0) <= 0.5 ? 'warning' : 'danger' },
  ] : null;
  const scores = liveScores || claim.scores;

  // Derive MiroFish reason from RCA if available
  const mfReason = claimRCA?.evidence_summary || claim.mfReason;
  const mfConf = claimRCA?.confidence_score || claim.mfConf;

  // Derive key arguments from RCA steps if available
  const liveArguments = claimRCA?.steps ? (() => {
    const STEP_ARG_MAP = {
      'ELIGIBILITY_CHECK': { color: 'success', title: 'Eligibility verified:' },
      'AUTH_TIMELINE_CHECK': { color: 'success', title: 'Authorization status:' },
      'CODING_VALIDATION': { color: 'primary', title: 'Coding analysis:' },
      'PAYER_HISTORY_MATCH': { color: 'primary', title: 'Historical precedent:' },
      'MIROFISH_AGENT_VALIDATION': { color: 'success', title: 'MiroFish consensus:' },
    };
    return (claimRCA.steps || [])
      .filter(s => STEP_ARG_MAP[s.step_name])
      .map(s => ({
        color: s.finding_status === 'PASS' ? 'success' : s.finding_status === 'FAIL' ? 'warning' : 'primary',
        title: STEP_ARG_MAP[s.step_name].title,
        body: s.finding || 'Analysis complete.',
      }));
  })() : null;
  const arguments_ = liveArguments && liveArguments.length > 0 ? liveArguments : claim.arguments;

  // When switching claims: load letter from static data, then try real API
  useEffect(() => {
    setLetterText(claim.letter);
    // Try to load real letter if appeal exists for this claim
    const matchedAppeal = liveAppeals.find(a => (a.id || a.claim_id) === selectedId);
    if (matchedAppeal?.appeal_id) {
      setLetterLoading(true);
      api.appeals.getLetter(matchedAppeal.appeal_id)
        .then(res => { if (res?.letter_text) setLetterText(res.letter_text); })
        .catch(() => {})
        .finally(() => setLetterLoading(false));
    }
  }, [selectedId]);

  const appeals = liveAppeals.length > 0 ? liveAppeals : IN_FLIGHT_APPEALS;
  const totalValue = appeals.reduce((s, a) => s + (a.amount || 0), 0);

  const barColor = (val, color) => color === 'success' ? 'bg-[rgb(var(--color-success))]' : color === 'warning' ? 'bg-[rgb(var(--color-warning))]' : val >= 70 ? 'bg-[rgb(var(--color-success))]' : val >= 50 ? 'bg-[rgb(var(--color-warning))]' : 'bg-[rgb(var(--color-danger))]';
  const valColor = (val, color) => color === 'success' ? 'text-[rgb(var(--color-success))]' : color === 'warning' ? 'text-[rgb(var(--color-warning))]' : val >= 70 ? 'text-[rgb(var(--color-success))]' : val >= 50 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-danger))]';
  const argBorder = (color) => ({ success:'border-l-[rgb(var(--color-success))]', primary:'border-l-[rgb(var(--color-primary))]', purple:'border-l-purple-500', warning:'border-l-[rgb(var(--color-warning))]' }[color] || 'border-l-th-border');
  const statusBadge = (status) => status === 'Submitted' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' : status === 'Under review' ? 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]' : status === 'Draft' ? 'bg-th-surface-overlay text-th-muted border-th-border' : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]';

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden" style={{display:'grid', gridTemplateColumns:'1fr 1fr'}}>
      {/* LEFT: AI EVIDENCE */}
      <div className="border-r border-th-border overflow-y-auto bg-th-surface-base p-4 space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-th-muted">AI Evidence · Why the appeal was drafted this way</p>
          {claimRCA && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success)/0.3)]">LIVE</span>}
          {!claimRCA && !rcaLoading && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted border border-th-border">TEMPLATE</span>}
        </div>

        {/* Claim header chips */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label:'CLAIM', val: selectedId, mono: true, color: 'text-[rgb(var(--color-info))]' },
            { label:'PAYER', val: claim.payer, mono: false, color: 'text-th-heading' },
            { label:'AMOUNT', val: `$${claim.amount.toLocaleString()}`, mono: true, color: 'text-th-heading' },
            { label:'VERDICT', val: null, mono: false, color: '' },
          ].map((chip, i) => (
            <div key={i} className={cn('flex-1 min-w-[60px] px-3 py-2 rounded-lg border bg-th-surface-overlay', chip.label === 'VERDICT' ? claim.mf === 'confirmed' ? 'border-[rgb(var(--color-success)/0.3)]' : 'border-[rgb(var(--color-danger)/0.3)]' : 'border-th-border')}>
              <p className="text-[8px] font-mono text-th-muted uppercase tracking-wider mb-1">{chip.label}</p>
              {chip.label === 'VERDICT' ? (
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono border', claim.mf === 'confirmed' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' : claim.mf === 'disputed' ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]' : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]')}>
                  {claim.mf === 'confirmed' ? 'CONFIRMED' : claim.mf === 'disputed' ? 'DISPUTED' : 'Pending'}
                </span>
              ) : (
                <p className={cn('text-[11px] font-bold', chip.mono ? 'font-mono' : '', chip.color)}>{chip.val}</p>
              )}
            </div>
          ))}
        </div>

        {/* MiroFish reason */}
        <div className={cn('px-3 py-2.5 rounded-lg border text-[10.5px] text-th-secondary leading-relaxed', claim.mf === 'confirmed' ? 'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success)/0.3)]' : 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)]')}>
          <p className={cn('text-[8px] font-mono font-bold uppercase tracking-wider mb-1.5', claim.mf === 'confirmed' ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-danger))]')}>
            MiroFish {claim.mf.toUpperCase()} · {mfConf}% consensus
          </p>
          {mfReason}
        </div>

        {/* Key arguments */}
        <div>
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted mb-2">Key Arguments</p>
          <div className="space-y-1.5">
            {arguments_.map((arg, i) => (
              <div key={i} className={cn('px-3 py-2 bg-th-surface-overlay border border-th-border rounded border-l-2 text-[10.5px] text-th-secondary leading-relaxed', argBorder(arg.color))}>
                <strong className="text-th-heading">{arg.title}</strong> {arg.body}
              </div>
            ))}
          </div>
        </div>

        {/* ML Scores */}
        <div>
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted mb-2">ML Scores</p>
          <div className="space-y-2">
            {scores.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-[9px] text-th-secondary mb-0.5">
                  <span>{s.label}</span>
                  <span className={cn('font-bold font-mono', valColor(s.val, s.color))}>{s.val}%</span>
                </div>
                <div className="h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', barColor(s.val, s.color))} style={{width:`${s.val}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div>
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted mb-2">Documents to Attach</p>
          <div className="space-y-1.5">
            {claim.docs.map((doc, i) => (
              <div key={i} className={cn('flex items-center justify-between px-2.5 py-1.5 rounded border text-[10px]', doc.status === 'attached' ? 'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success)/0.2)]' : 'bg-th-surface-overlay border-th-border')}>
                <span className={doc.status === 'attached' ? 'text-th-heading' : 'text-th-secondary'}>{doc.name}</span>
                <span className={cn('px-2 py-0.5 rounded text-[9px] font-bold border', doc.status === 'attached' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]' : doc.status === 'pending' ? 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]' : 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]')}>
                  {doc.status === 'attached' ? 'Attached' : doc.status === 'pending' ? 'Pending' : 'Optional'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Claim selector */}
        <div className="pt-2 border-t border-th-border">
          <p className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-th-muted mb-2">Switch Claim</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(APPEAL_DATA).map(id => (
              <button key={id} onClick={() => setSelectedId(id)} className={cn('px-2 py-0.5 rounded text-[9px] font-bold font-mono border transition-colors', selectedId === id ? 'bg-[rgb(var(--color-primary))] text-white border-[rgb(var(--color-primary))]' : 'bg-th-surface-overlay text-th-muted border-th-border hover:text-th-heading')}>
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: LETTER EDITOR + QUEUE */}
      <div className="overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted">
            {letterLoading ? 'Loading letter...' : `AI-Drafted Appeal Letter · Confidence: ${claim.letterConfidence}%`}
          </p>
          <div className="flex gap-2">
            <button onClick={() => {
              const matched = liveAppeals.find(a => (a.id || a.claim_id) === selectedId);
              if (matched?.appeal_id) {
                setLetterLoading(true);
                api.appeals.getLetter(matched.appeal_id)
                  .then(res => { if (res?.letter_text) setLetterText(res.letter_text); })
                  .catch(() => {})
                  .finally(() => setLetterLoading(false));
              }
            }} className="px-2.5 py-1.5 rounded text-[10px] font-medium border border-th-border bg-th-surface-overlay text-th-secondary hover:text-th-heading transition-colors">Regenerate</button>
            <button className="px-2.5 py-1.5 rounded text-[10px] font-medium border border-th-border bg-th-surface-overlay text-th-secondary hover:text-th-heading transition-colors">Edit</button>
            <button onClick={() => {
              const matched = liveAppeals.find(a => (a.id || a.claim_id) === selectedId);
              if (!matched) {
                // Create a new appeal for this claim's denial
                const claimData = APPEAL_DATA[selectedId];
                if (claimData) {
                  api.appeals.create({ denial_id: selectedId, claim_id: selectedId, appeal_type: 'FIRST_LEVEL', ai_generated: true })
                    .then(res => { if (res) setLiveAppeals(prev => [...prev, normalizeAppeal(res)]); })
                    .catch(() => {});
                }
              }
            }} className="px-2.5 py-1.5 rounded text-[10px] font-semibold bg-[rgb(var(--color-primary))] text-white border border-[rgb(var(--color-primary))] hover:opacity-90 transition-opacity">Submit Appeal</button>
          </div>
        </div>

        <textarea value={letterText} onChange={(e) => setLetterText(e.target.value)} className="flex-1 min-h-[280px] bg-th-surface-overlay border border-th-border rounded-lg p-4 text-[10.5px] text-th-secondary leading-relaxed resize-none focus:outline-none focus:border-[rgb(var(--color-primary)/0.5)] font-sans" />

        <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden shrink-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-th-border bg-th-surface-overlay">
            <h3 className="text-[11px] font-semibold text-th-heading">All Appeals In-Flight</h3>
            <span className="text-[9px] font-mono text-th-muted">{appeals.length} active · ${(totalValue / 1000).toFixed(0)}K</span>
          </div>
          <table className="w-full text-[11px]">
            <thead><tr className="border-b border-th-border bg-th-surface-overlay">
              {['Claim','Payer','Amount','Win%','Status','Deadline'].map(h => (<th key={h} className="px-3 py-2 text-left text-[9px] font-mono font-semibold uppercase tracking-wider text-th-muted">{h}</th>))}
            </tr></thead>
            <tbody>
              {appeals.map((a, i) => (
                <tr key={i} onClick={() => setSelectedId(a.id || a.claim_id)} className={cn('border-b border-th-border last:border-0 hover:bg-th-surface-overlay transition-colors cursor-pointer', (a.id || a.claim_id) === selectedId ? 'bg-[rgb(var(--color-primary-bg))]' : '')}>
                  <td className="px-3 py-2 font-mono font-bold text-[rgb(var(--color-info))]">{a.id || a.claim_id}</td>
                  <td className="px-3 py-2 text-th-secondary">{a.payer}</td>
                  <td className="px-3 py-2 font-mono font-bold text-th-heading">${(a.amount || 0).toLocaleString()}</td>
                  <td className={cn('px-3 py-2 font-mono font-bold', (a.winPct || 0) >= 75 ? 'text-[rgb(var(--color-success))]' : (a.winPct || 0) >= 50 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-danger))]')}>{a.winPct || 0}%</td>
                  <td className="px-3 py-2"><span className={cn('px-2 py-0.5 rounded text-[9px] font-bold border', statusBadge(a.status))}>{a.status}</span></td>
                  <td className="px-3 py-2 font-mono text-th-muted">{a.deadline || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
