import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import ErrorBanner from '../../../components/ui/ErrorBanner';

const cn = (...classes) => classes.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Normalize API appeal rows to the UI shape used by the in-flight queue + lookups.
const normalizeAppeal = (a) => ({
    id: a.claim_id || a.id,
    claim_id: a.claim_id,
    appeal_id: a.appeal_id,
    payer: a.payer_name || a.payer || 'Unknown',
    amount: a.denial_amount != null ? a.denial_amount : (a.amount || 0),
    winPct: a.win_pct != null ? a.win_pct : (a.winPct || a.appeal_quality_score || 0),
    outcome: (a.outcome || '').toUpperCase(),
    status: (() => {
        const o = (a.outcome || '').toUpperCase();
        if (o === 'WON' || o === 'APPROVED') return 'Submitted';
        if (o === 'UNDER_REVIEW') return 'Under review';
        if (o === 'LOST' || o === 'DENIED') return 'Denied';
        if (o === 'SUBMITTED') return 'Submitted';
        if (o === 'PENDING') return 'Pending review';
        return a.status || 'Pending review';
    })(),
    days_in_status: a.days_in_status != null ? a.days_in_status : a.age_days,
    created_at: a.created_at,
    submitted_at: a.submitted_at,
    deadline: a.deadline || '—',
    carc_code: a.carc_code,
    denial_prob: a.denial_prob,
    write_off: a.write_off,
});

// Lightweight in-flight filter: SUBMITTED / UNDER_REVIEW / PENDING
const isInFlight = (a) => ['SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(a.outcome || '');

// Days between two dates (fallback when backend doesn't compute days_in_status)
const daysBetween = (iso) => {
    if (!iso) return null;
    const then = new Date(iso);
    if (isNaN(then.getTime())) return null;
    const diff = Date.now() - then.getTime();
    return Math.max(0, Math.round(diff / 86400000));
};

const STEP_ARG_META = {
    ELIGIBILITY_CHECK:         { title: 'Eligibility Check',      icon: 'verified_user' },
    AUTH_TIMELINE_CHECK:       { title: 'Authorization Timeline', icon: 'event_available' },
    CODING_VALIDATION:         { title: 'Coding Validation',      icon: 'code' },
    MIROFISH_AGENT_VALIDATION: { title: 'MiroFish Consensus',     icon: 'groups' },
    PAYER_HISTORY_MATCH:       { title: 'Payer Precedent',        icon: 'history' },
};

// Required sections used by the compliance checker (regex keywords)
const COMPLIANCE_SECTIONS = [
    { id: 'patient',   label: 'Patient Identifier',    re: /\b(patient|mrn|member\s*id|dob|date\s*of\s*birth)\b/i },
    { id: 'reason',    label: 'Denial Reason',         re: /\b(denial|denied|co-?\d+|pr-?\d+|carc|reason code)\b/i },
    { id: 'necessity', label: 'Medical Necessity',     re: /\b(medical(ly)?\s*necess|clinic(al)?|diagnos|treatment)\b/i },
    { id: 'evidence',  label: 'Supporting Evidence',   re: /\b(enclos|attached|supporting|documentation|evidence|exhibit)\b/i },
    { id: 'request',   label: 'Request Statement',     re: /\b(request|appeal|reconsider|reversal|payment of|respectfully)\b/i },
];

const MOBILE_TABS = [
    { id: 'evidence', label: 'Evidence', icon: 'fact_check' },
    { id: 'letter',   label: 'Letter',   icon: 'edit_note'  },
    { id: 'insights', label: 'Insights', icon: 'insights'   },
];

/* ------------------------------------------------------------------ */
/* Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

const SectionLabel = ({ children, accessory }) => (
    <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted">{children}</p>
        {accessory}
    </div>
);

const SkeletonLine = ({ className }) => (
    <div className={cn('animate-pulse bg-th-surface-overlay rounded', className)} />
);

const Chip = ({ label, value, mono, accent }) => (
    <div className="flex-1 min-w-[64px] px-3 py-2 rounded-lg border border-th-border bg-th-surface-overlay">
        <p className="text-[8px] font-mono text-th-muted uppercase tracking-wider mb-1">{label}</p>
        <p className={cn('text-[11px] font-bold truncate', mono && 'font-mono', accent || 'text-th-heading')}>{value}</p>
    </div>
);

/* ------------------------------------------------------------------ */
/* AppealPipelineTracker — 3-column Appeal Workbench                  */
/* ------------------------------------------------------------------ */

export default function AppealPipelineTracker() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // ---- state --------------------------------------------------------
    const [selectedId, setSelectedId] = useState(searchParams.get('claim') || '');
    const [letterText, setLetterText] = useState('');
    const [letterSource, setLetterSource] = useState('TEMPLATE');  // LLM | TEMPLATE | UNSAVED
    const [letterConfidence, setLetterConfidence] = useState(0);
    const [letterDirty, setLetterDirty] = useState(false);
    const [letterSavedAt, setLetterSavedAt] = useState(null);
    const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error | unsaved

    const [liveAppeals, setLiveAppeals] = useState([]);
    const [appealsLoading, setAppealsLoading] = useState(true);
    const [appealsError, setAppealsError] = useState(null);

    const [rcaData, setRcaData] = useState(null);
    const [rcaLoading, setRcaLoading] = useState(false);
    const [rcaError, setRcaError] = useState(null);

    const [precedents, setPrecedents] = useState([]);
    const [precedentsLoading, setPrecedentsLoading] = useState(false);

    const [regenLoading, setRegenLoading] = useState(false);
    const [regenError, setRegenError] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitBanner, setSubmitBanner] = useState(null);

    const [mobileTab, setMobileTab] = useState('evidence');
    const [expandedArg, setExpandedArg] = useState(null);

    // ---- live appeal lookup ------------------------------------------
    const selectedAppeal = useMemo(
        () => liveAppeals.find(a => a.id === selectedId || a.claim_id === selectedId) || null,
        [liveAppeals, selectedId]
    );

    // ---- fetch: appeals list -----------------------------------------
    const loadAppeals = useCallback(() => {
        setAppealsLoading(true);
        setAppealsError(null);
        return api.appeals.list({ page: 1, size: 100 })
            .then(res => {
                const list = Array.isArray(res) ? res : (res?.items || res?.appeals || []);
                const normalized = list.map(normalizeAppeal);
                setLiveAppeals(normalized);
                // Auto-select first appeal if none selected
                if (!selectedId && normalized.length > 0) {
                    setSelectedId(normalized[0].id || normalized[0].claim_id);
                }
            })
            .catch(err => {
                console.error('Appeals list error:', err);
                setAppealsError('Unable to load appeal list from backend.');
            })
            .finally(() => setAppealsLoading(false));
    }, [selectedId]);

    useEffect(() => { loadAppeals(); /* eslint-disable-next-line */ }, []);

    // ---- fetch: RCA on claim change ----------------------------------
    useEffect(() => {
        if (!selectedId) { setRcaData(null); return; }
        setRcaLoading(true);
        setRcaError(null);
        setRcaData(null);
        api.rootCause.getClaimAnalysis(selectedId)
            .then(res => {
                if (res?.analysis) setRcaData(res.analysis);
                else if (res && (res.steps || res.evidence_summary)) setRcaData(res);
                else setRcaData(null);
            })
            .catch(err => {
                console.error('RCA fetch error:', err);
                setRcaError('Unable to load root-cause analysis for this claim.');
            })
            .finally(() => setRcaLoading(false));
    }, [selectedId]);

    // ---- fetch: precedents (arguments library) ------------------------
    useEffect(() => {
        if (!selectedId) { setPrecedents([]); return; }
        const carc = selectedAppeal?.carc_code || rcaData?.carc_code;
        if (!carc) { setPrecedents([]); return; }
        setPrecedentsLoading(true);
        api.rootCause.getSummary({ carc_code: carc })
            .then(res => {
                const list = res?.precedents || res?.arguments || res?.root_causes || [];
                setPrecedents(Array.isArray(list) ? list.slice(0, 6) : []);
            })
            .catch(err => {
                console.error('Precedents fetch error:', err);
                setPrecedents([]);
            })
            .finally(() => setPrecedentsLoading(false));
    }, [selectedId, selectedAppeal?.carc_code, rcaData?.carc_code]);

    // ---- fetch: existing letter --------------------------------------
    useEffect(() => {
        if (!selectedAppeal?.appeal_id) {
            setLetterText('');
            setLetterSource('TEMPLATE');
            setLetterConfidence(0);
            setLetterDirty(false);
            setSaveState('idle');
            return;
        }
        let cancelled = false;
        setLetterDirty(false);
        setSaveState('idle');
        api.appeals.getLetter(selectedAppeal.appeal_id)
            .then(res => {
                if (cancelled) return;
                if (res?.letter_text) {
                    setLetterText(res.letter_text);
                    setLetterSource(res.source || res.letter_source || 'LLM');
                    setLetterConfidence(res.confidence != null ? Math.round(res.confidence) : 0);
                    setLetterSavedAt(res.updated_at || res.generated_at || null);
                } else {
                    setLetterText('');
                    setLetterSource('TEMPLATE');
                    setLetterConfidence(0);
                }
            })
            .catch(err => {
                if (!cancelled) {
                    console.error('getLetter error:', err);
                    setLetterText('');
                    setLetterSource('TEMPLATE');
                }
            });
        return () => { cancelled = true; };
    }, [selectedAppeal?.appeal_id]);

    // ---- URL sync ----------------------------------------------------
    useEffect(() => {
        if (selectedId && selectedId !== searchParams.get('claim')) {
            const p = new URLSearchParams(searchParams);
            p.set('claim', selectedId);
            setSearchParams(p, { replace: true });
        }
    }, [selectedId]); // eslint-disable-line

    /* ---------- actions: regenerate / save / submit ---------------- */

    const handleRegenerate = useCallback(async () => {
        if (!selectedId) return;
        setRegenLoading(true);
        setRegenError(null);
        try {
            const payload = {
                claim_id: selectedId,
                carc_code: selectedAppeal?.carc_code || rcaData?.carc_code,
                payer: selectedAppeal?.payer,
                amount: selectedAppeal?.amount,
                evidence_summary: rcaData?.evidence_summary,
            };
            const res = await api.ai.draftAppeal(payload);
            if (res?.letter_text) {
                setLetterText(res.letter_text);
                setLetterSource('LLM');
                setLetterConfidence(res.confidence != null ? Math.round(res.confidence * (res.confidence <= 1 ? 100 : 1)) : 80);
                setLetterDirty(true);
                setSaveState('unsaved');
            } else if (res?.draft) {
                setLetterText(res.draft);
                setLetterSource('LLM');
                setLetterConfidence(res.confidence != null ? Math.round(res.confidence) : 80);
                setLetterDirty(true);
                setSaveState('unsaved');
            } else {
                setRegenError('AI draft endpoint returned no letter text.');
            }
        } catch (err) {
            console.error('Regenerate error:', err);
            setRegenError('Unable to regenerate letter via AI. Try again in a moment.');
        } finally {
            setRegenLoading(false);
        }
    }, [selectedId, selectedAppeal, rcaData]);

    const handleSave = useCallback(async () => {
        if (!letterText.trim()) return;
        if (!selectedAppeal?.appeal_id) {
            // No appeal row exists yet — cannot persist without an appeal_id.
            setSaveState('unsaved');
            return;
        }
        setSaveState('saving');
        try {
            const res = await api.appeals.updateLetter(selectedAppeal.appeal_id, letterText);
            if (res?.ok) {
                setSaveState('saved');
                setLetterDirty(false);
                setLetterSavedAt(new Date().toISOString());
            } else {
                // Endpoint may not be deployed yet — mark unsaved locally but don't block.
                console.warn('Letter save failed, keeping local copy', res);
                setSaveState('unsaved');
            }
        } catch (err) {
            console.error('Save letter error:', err);
            setSaveState('error');
        }
    }, [letterText, selectedAppeal]);

    const handleSubmit = useCallback(async () => {
        if (!selectedId) return;
        setSubmitLoading(true);
        setSubmitError(null);
        setSubmitBanner(null);
        try {
            if (selectedAppeal?.appeal_id) {
                const res = await api.appeals.updateOutcome(selectedAppeal.appeal_id, { outcome: 'SUBMITTED' });
                if (res) {
                    setSubmitBanner(`Appeal ${selectedAppeal.appeal_id.slice(0, 8)} marked as Submitted.`);
                    await loadAppeals();
                } else {
                    setSubmitError('Submit failed — backend did not return a result.');
                }
            } else {
                // Create a new appeal for this claim
                const res = await api.appeals.create({
                    claim_id: selectedId,
                    denial_id: selectedId,
                    appeal_type: 'FIRST_LEVEL',
                    ai_generated: true,
                    letter_text: letterText,
                });
                if (res) {
                    setSubmitBanner(`New appeal created for ${selectedId}.`);
                    await loadAppeals();
                } else {
                    setSubmitError('Unable to create appeal — backend returned no result.');
                }
            }
        } catch (err) {
            console.error('Submit error:', err);
            setSubmitError('Submit failed — check backend connectivity.');
        } finally {
            setSubmitLoading(false);
        }
    }, [selectedId, selectedAppeal, letterText, loadAppeals]);

    /* ---------- derived values ------------------------------------- */

    // ML scores: prefer live appeal + RCA, else zero with empty-state
    const appealSuccess = selectedAppeal?.winPct ?? (rcaData?.appeal_probability != null ? Math.round(rcaData.appeal_probability * 100) : 0);
    const denialRecurrence = selectedAppeal?.denial_prob != null
        ? Math.round((selectedAppeal.denial_prob > 1 ? selectedAppeal.denial_prob : selectedAppeal.denial_prob * 100))
        : (rcaData?.denial_probability != null ? Math.round(rcaData.denial_probability * 100) : 0);
    const writeOffRisk = selectedAppeal?.write_off != null
        ? Math.round((selectedAppeal.write_off > 1 ? selectedAppeal.write_off : selectedAppeal.write_off * 100))
        : (rcaData?.write_off_probability != null ? Math.round(rcaData.write_off_probability * 100) : 0);

    // Baselines for delta indicators (simple historical averages — adjust via props later)
    const baselines = { appealSuccess: 62, denialRecurrence: 45, writeOffRisk: 35 };

    // MiroFish verdict
    const mfVerdict = rcaData?.mf_verdict || selectedAppeal?.mf_verdict || null;
    const mfConfidence = rcaData?.mf_confidence != null
        ? Math.round(rcaData.mf_confidence * (rcaData.mf_confidence <= 1 ? 100 : 1))
        : (rcaData?.confidence_score || 0);
    const mfTone = rcaData?.recommended_tone || (mfVerdict === 'LIKELY_APPROVE' ? 'formal' : mfVerdict === 'LIKELY_DENY' ? 'urgent' : 'data-driven');

    // Evidence summary (MiroFish reason)
    const evidenceSummary = rcaData?.evidence_summary
        || (selectedAppeal ? `AI analysis pending for claim ${selectedId}. Submit appeal to trigger full evidence review.` : null);

    // Key arguments from RCA steps
    const keyArguments = useMemo(() => {
        if (!rcaData?.steps) return [];
        const wanted = ['ELIGIBILITY_CHECK', 'AUTH_TIMELINE_CHECK', 'CODING_VALIDATION', 'MIROFISH_AGENT_VALIDATION'];
        return rcaData.steps
            .filter(s => wanted.includes(s.step_name))
            .map(s => ({
                step: s.step_name,
                title: STEP_ARG_META[s.step_name]?.title || s.step_name,
                icon: STEP_ARG_META[s.step_name]?.icon || 'check_circle',
                status: (s.finding_status || s.status || 'INFO').toUpperCase(),
                summary: s.finding || s.summary || 'Analysis complete.',
                details: s.details || s.evidence || s.explanation || null,
            }));
    }, [rcaData]);

    // Compliance check (regex scan of letter text)
    const compliance = useMemo(() => {
        const text = letterText || '';
        return COMPLIANCE_SECTIONS.map(s => ({ ...s, present: s.re.test(text) }));
    }, [letterText]);

    // In-flight queue
    const inFlight = useMemo(() => {
        const rows = liveAppeals.filter(isInFlight).map(a => ({
            ...a,
            days: a.days_in_status ?? daysBetween(a.submitted_at || a.created_at),
        }));
        rows.sort((a, b) => (b.days || 0) - (a.days || 0));
        return rows;
    }, [liveAppeals]);

    // Documents list (template for now — backend has no docs endpoint yet)
    const documents = useMemo(() => {
        const authRelated = (selectedAppeal?.carc_code || rcaData?.carc_code || '').toUpperCase().includes('CO-16');
        const base = [
            { id: 'eob',      name: 'EOB / Denial Notice',          required: true,  status: 'placeholder' },
            { id: 'claim',    name: 'Claim Copy (CMS-1500 / UB-04)', required: true,  status: 'placeholder' },
            { id: 'medrec',   name: 'Medical Record Excerpt',       required: true,  status: 'placeholder' },
        ];
        if (authRelated) base.push({ id: 'auth', name: 'Authorization Letter', required: true, status: 'missing' });
        return base;
    }, [selectedAppeal, rcaData]);

    /* ---------- render helpers ------------------------------------- */

    const scoreBar = (val, label, baseline, color) => {
        const delta = baseline != null ? val - baseline : null;
        const col = color || (val >= 70 ? 'success' : val >= 50 ? 'warning' : 'danger');
        const barBg = col === 'success' ? 'bg-[rgb(var(--color-success))]'
            : col === 'warning' ? 'bg-[rgb(var(--color-warning))]'
            : 'bg-[rgb(var(--color-danger))]';
        const txt = col === 'success' ? 'text-[rgb(var(--color-success))]'
            : col === 'warning' ? 'text-[rgb(var(--color-warning))]'
            : 'text-[rgb(var(--color-danger))]';
        return (
            <div>
                <div className="flex justify-between items-baseline text-[9px] text-th-secondary mb-0.5">
                    <span>{label}</span>
                    <span className="flex items-baseline gap-1.5">
                        <span className={cn('font-bold font-mono', txt)}>{val}%</span>
                        {delta != null && (
                            <span className={cn('text-[8px] font-mono',
                                delta > 0 ? 'text-[rgb(var(--color-success))]' : delta < 0 ? 'text-[rgb(var(--color-danger))]' : 'text-th-muted'
                            )}>{delta > 0 ? '+' : ''}{delta} vs {baseline}</span>
                        )}
                    </span>
                </div>
                <div className="h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-[width] duration-500', barBg)} style={{ width: `${Math.max(0, Math.min(100, val))}%` }} />
                </div>
            </div>
        );
    };

    const argStatusBadge = (status) => {
        const map = {
            PASS:  'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]',
            FAIL:  'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]',
            WARN:  'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]',
            INFO:  'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]',
        };
        return map[status] || map.INFO;
    };

    /* ---------- column renderers ---------------------------------- */

    const EvidenceColumn = (
        <div className="overflow-y-auto bg-th-surface-base p-4 space-y-4 border-th-border">
            <div className="flex items-center gap-2">
                <p className="text-[8.5px] font-mono font-bold uppercase tracking-widest text-th-muted">AI Evidence Panel</p>
                {rcaData && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border border-[rgb(var(--color-success)/0.3)]">LIVE</span>}
                {!rcaData && !rcaLoading && selectedId && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted border border-th-border">NO RCA</span>}
                {rcaLoading && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-th-surface-overlay text-th-muted border border-th-border animate-pulse">LOADING…</span>}
            </div>

            {rcaError && <ErrorBanner title="Root cause unavailable" message={rcaError} onRetry={() => { setRcaError(null); setRcaData(null); }} />}

            {/* Claim chips */}
            {selectedId ? (
                <div className="flex gap-2 flex-wrap">
                    <Chip label="CLAIM"  value={selectedId}                                      mono accent="text-[rgb(var(--color-info))]" />
                    <Chip label="PAYER"  value={selectedAppeal?.payer || '—'} />
                    <Chip label="AMOUNT" value={selectedAppeal ? `$${Number(selectedAppeal.amount || 0).toLocaleString()}` : '—'} mono />
                    <div className="flex-1 min-w-[64px] px-3 py-2 rounded-lg border border-th-border bg-th-surface-overlay">
                        <p className="text-[8px] font-mono text-th-muted uppercase tracking-wider mb-1">MF VERDICT</p>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono border',
                            mfVerdict === 'CONFIRMED' || mfVerdict === 'LIKELY_APPROVE' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]'
                                : mfVerdict === 'DISPUTED' || mfVerdict === 'LIKELY_DENY' ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]'
                                : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]'
                        )}>
                            {mfVerdict ? mfVerdict.replace('_', ' ') : 'PENDING'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="text-center py-6 text-[10.5px] text-th-muted">Select an appeal from the In-Flight Queue.</div>
            )}

            {/* MiroFish reason */}
            {selectedId && (
                <div className={cn('px-3 py-2.5 rounded-lg border text-[10.5px] text-th-secondary leading-relaxed',
                    mfVerdict === 'CONFIRMED' || mfVerdict === 'LIKELY_APPROVE' ? 'bg-[rgb(var(--color-success-bg))] border-[rgb(var(--color-success)/0.3)]'
                        : mfVerdict === 'DISPUTED' || mfVerdict === 'LIKELY_DENY' ? 'bg-[rgb(var(--color-danger-bg))] border-[rgb(var(--color-danger)/0.3)]'
                        : 'bg-th-surface-overlay border-th-border'
                )}>
                    <p className="text-[8px] font-mono font-bold uppercase tracking-wider mb-1.5 text-th-muted">
                        MiroFish Reason {mfConfidence > 0 && <span className="opacity-70">· {mfConfidence}% consensus</span>}
                    </p>
                    {rcaLoading ? (
                        <div className="space-y-1.5"><SkeletonLine className="h-2 w-full" /><SkeletonLine className="h-2 w-4/5" /><SkeletonLine className="h-2 w-2/3" /></div>
                    ) : (
                        <span>{evidenceSummary || 'No evidence summary available.'}</span>
                    )}
                </div>
            )}

            {/* Key arguments */}
            {selectedId && (
                <div>
                    <SectionLabel>Key Arguments</SectionLabel>
                    {rcaLoading && (
                        <div className="space-y-1.5">{[1,2,3,4].map(i => <SkeletonLine key={i} className="h-10 w-full" />)}</div>
                    )}
                    {!rcaLoading && keyArguments.length === 0 && (
                        <div className="px-3 py-3 bg-th-surface-overlay border border-th-border rounded text-[10.5px] text-th-muted text-center">
                            No RCA steps available. Trigger root-cause analysis for this claim.
                        </div>
                    )}
                    {!rcaLoading && keyArguments.length > 0 && (
                        <div className="space-y-1.5">
                            {keyArguments.map(arg => {
                                const open = expandedArg === arg.step;
                                return (
                                    <div key={arg.step} className="bg-th-surface-overlay border border-th-border rounded overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedArg(open ? null : arg.step)}
                                            className="w-full px-3 py-2 flex items-start gap-2 text-left hover:bg-th-surface-raised transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px] leading-none text-th-muted mt-0.5" aria-hidden="true">{arg.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold text-th-heading">{arg.title}</span>
                                                    <span className={cn('px-1.5 py-0 rounded text-[8px] font-bold font-mono border', argStatusBadge(arg.status))}>{arg.status}</span>
                                                </div>
                                                <p className="text-[10.5px] text-th-secondary leading-relaxed">{arg.summary}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-[16px] leading-none text-th-muted" aria-hidden="true">
                                                {open ? 'expand_less' : 'expand_more'}
                                            </span>
                                        </button>
                                        {open && arg.details && (
                                            <div className="px-3 py-2 border-t border-th-border bg-th-surface-base text-[10px] text-th-secondary leading-relaxed whitespace-pre-wrap">
                                                {typeof arg.details === 'string' ? arg.details : JSON.stringify(arg.details, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Arguments library — precedents */}
            {selectedId && (
                <div>
                    <SectionLabel accessory={precedents.length > 0 && (
                        <span className="text-[8px] font-mono text-th-muted">{precedents.length} precedent{precedents.length === 1 ? '' : 's'}</span>
                    )}>Arguments Library</SectionLabel>
                    {precedentsLoading && <SkeletonLine className="h-10 w-full" />}
                    {!precedentsLoading && precedents.length === 0 && (
                        <div className="px-3 py-2 bg-th-surface-overlay border border-th-border rounded text-[10px] text-th-muted text-center">
                            No precedent arguments available for this CARC code.
                        </div>
                    )}
                    {!precedentsLoading && precedents.length > 0 && (
                        <div className="space-y-1">
                            {precedents.map((p, i) => (
                                <div key={i} className="px-2.5 py-1.5 bg-th-surface-overlay border border-th-border rounded text-[10px] text-th-secondary">
                                    <span className="font-bold text-th-heading">{p.title || p.root_cause || p.category || `Precedent ${i + 1}`}</span>
                                    {p.win_rate != null && <span className="ml-2 font-mono text-[rgb(var(--color-success))]">{Math.round(p.win_rate * (p.win_rate <= 1 ? 100 : 1))}% win</span>}
                                    {(p.summary || p.description) && <p className="mt-0.5 text-[9.5px] leading-relaxed opacity-90">{p.summary || p.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const letterSourceBadge = () => {
        const map = {
            LLM:      { label: 'LLM',       cls: 'bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))] border-[rgb(var(--color-info)/0.3)]' },
            TEMPLATE: { label: 'TEMPLATE',  cls: 'bg-th-surface-overlay text-th-muted border-th-border' },
            UNSAVED:  { label: 'UNSAVED',   cls: 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]' },
        };
        const m = map[letterSource] || map.TEMPLATE;
        return <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border', m.cls)}>{m.label}</span>;
    };

    const saveBadge = () => {
        if (saveState === 'saving') return <span className="text-[9px] font-mono text-th-muted">Saving…</span>;
        if (saveState === 'saved')  return <span className="text-[9px] font-mono text-[rgb(var(--color-success))]">Saved {letterSavedAt ? new Date(letterSavedAt).toLocaleTimeString() : ''}</span>;
        if (saveState === 'error')  return <span className="text-[9px] font-mono text-[rgb(var(--color-danger))]">Save error</span>;
        if (saveState === 'unsaved')return <span className="text-[9px] font-mono text-[rgb(var(--color-warning))]">Unsaved (local)</span>;
        if (letterDirty)            return <span className="text-[9px] font-mono text-[rgb(var(--color-warning))]">Unsaved changes</span>;
        return null;
    };

    const LetterColumn = (
        <div className="overflow-y-auto p-4 flex flex-col gap-3 border-th-border">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                    <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-th-muted">Letter Editor</p>
                    {letterSourceBadge()}
                    {saveBadge()}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleRegenerate}
                        disabled={regenLoading || !selectedId}
                        className="px-2.5 py-1.5 rounded text-[10px] font-medium border border-th-border bg-th-surface-overlay text-th-secondary hover:text-th-heading disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">{regenLoading ? 'progress_activity' : 'auto_awesome'}</span>
                        {regenLoading ? 'Regenerating…' : 'Regenerate with AI'}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saveState === 'saving' || !letterText.trim()}
                        className="px-2.5 py-1.5 rounded text-[10px] font-medium border border-th-border bg-th-surface-overlay text-th-secondary hover:text-th-heading disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">save</span>
                        Save Draft
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitLoading || !letterText.trim() || !selectedId}
                        className="px-2.5 py-1.5 rounded text-[10px] font-semibold bg-[rgb(var(--color-primary))] text-white border border-[rgb(var(--color-primary))] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">{submitLoading ? 'progress_activity' : 'send'}</span>
                        Submit Appeal
                    </button>
                </div>
            </div>

            {regenError && <ErrorBanner title="Regenerate failed" message={regenError} onRetry={handleRegenerate} />}
            {submitError && <ErrorBanner title="Submit failed" message={submitError} onRetry={handleSubmit} />}
            {submitBanner && (
                <div className="px-3 py-2 bg-[rgb(var(--color-success-bg))] border border-[rgb(var(--color-success)/0.3)] text-[rgb(var(--color-success))] text-[10.5px] rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">check_circle</span>
                    {submitBanner}
                </div>
            )}

            {/* Textarea */}
            <textarea
                value={letterText}
                onChange={(e) => { setLetterText(e.target.value); setLetterDirty(true); if (saveState === 'saved') setSaveState('idle'); }}
                placeholder={selectedId ? 'Draft your appeal letter here, or click "Regenerate with AI" to generate one.' : 'Select an appeal from the queue to begin.'}
                disabled={!selectedId}
                className="flex-1 min-h-[500px] bg-th-surface-overlay border border-th-border rounded-lg p-4 text-[10.5px] text-th-secondary leading-relaxed resize-none focus:outline-none focus:border-[rgb(var(--color-primary)/0.5)] font-sans disabled:opacity-50"
            />

            {/* Meta row */}
            <div className="flex items-center justify-between text-[9px] font-mono text-th-muted shrink-0 flex-wrap gap-2">
                <span>Source: {letterSource} {letterConfidence > 0 && `· Confidence ${letterConfidence}%`}</span>
                <span>{letterText.length.toLocaleString()} chars · {letterText.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
            </div>

            {/* Compliance checker */}
            <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden shrink-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-th-border bg-th-surface-overlay">
                    <h3 className="text-[10px] font-semibold text-th-heading">Compliance Checker</h3>
                    <span className="text-[9px] font-mono text-th-muted">
                        {compliance.filter(c => c.present).length} / {compliance.length} sections present
                    </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {compliance.map(c => (
                        <div key={c.id} className={cn('flex items-center gap-2 px-2 py-1 rounded text-[10px]',
                            c.present ? 'text-[rgb(var(--color-success))]' : 'text-th-muted'
                        )}>
                            <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">
                                {c.present ? 'check_circle' : 'cancel'}
                            </span>
                            {c.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const InsightsColumn = (
        <div className="overflow-y-auto p-4 space-y-4 bg-th-surface-base">
            {/* ML Scores */}
            <div className="bg-th-surface-raised border border-th-border rounded-lg p-3">
                <SectionLabel accessory={selectedAppeal && <span className="text-[8px] font-mono text-th-muted">LIVE</span>}>ML Scores</SectionLabel>
                <div className="space-y-2.5">
                    {scoreBar(appealSuccess, 'Appeal Success Probability', baselines.appealSuccess)}
                    {scoreBar(denialRecurrence, 'Denial Recurrence Risk', baselines.denialRecurrence,
                        denialRecurrence <= 30 ? 'success' : denialRecurrence <= 60 ? 'warning' : 'danger')}
                    {scoreBar(writeOffRisk, 'Write-off Risk if Not Appealed', baselines.writeOffRisk,
                        writeOffRisk <= 25 ? 'success' : writeOffRisk <= 50 ? 'warning' : 'danger')}
                </div>
            </div>

            {/* MiroFish Prediction */}
            <div className="bg-th-surface-raised border border-th-border rounded-lg p-3">
                <SectionLabel>MiroFish Prediction</SectionLabel>
                {rcaLoading ? (
                    <SkeletonLine className="h-16 w-full" />
                ) : mfVerdict ? (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold font-mono border',
                                mfVerdict === 'LIKELY_APPROVE' || mfVerdict === 'CONFIRMED' ? 'bg-[rgb(var(--color-success-bg))] text-[rgb(var(--color-success))] border-[rgb(var(--color-success)/0.3)]'
                                    : mfVerdict === 'LIKELY_DENY' || mfVerdict === 'DISPUTED' ? 'bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))] border-[rgb(var(--color-danger)/0.3)]'
                                    : 'bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))] border-[rgb(var(--color-warning)/0.3)]'
                            )}>
                                {mfVerdict.replace('_', ' ')}
                            </span>
                            {mfConfidence > 0 && <span className="text-[9px] font-mono text-th-muted">{mfConfidence}% confidence</span>}
                        </div>
                        <p className="text-[10.5px] text-th-secondary leading-relaxed">
                            Simulated payer response: <strong>{mfVerdict.replace('_', ' ').toLowerCase()}</strong>.
                        </p>
                        <p className="text-[9.5px] font-mono text-th-muted">
                            Recommended tone: <strong className="text-th-secondary">{mfTone}</strong>
                        </p>
                    </div>
                ) : (
                    <div className="text-[10px] text-th-muted text-center py-2">No prediction available.</div>
                )}
            </div>

            {/* Documents */}
            <div className="bg-th-surface-raised border border-th-border rounded-lg p-3">
                <SectionLabel>Documents</SectionLabel>
                {selectedId ? (
                    <div className="space-y-1.5">
                        {documents.map(d => (
                            <div key={d.id} className="flex items-center justify-between px-2.5 py-1.5 rounded border border-th-border bg-th-surface-overlay text-[10px]">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={cn('material-symbols-outlined text-[14px] leading-none shrink-0',
                                        d.status === 'uploaded' ? 'text-[rgb(var(--color-success))]' : d.status === 'missing' ? 'text-[rgb(var(--color-warning))]' : 'text-th-muted'
                                    )} aria-hidden="true">
                                        {d.status === 'uploaded' ? 'check_circle' : d.status === 'missing' ? 'warning' : 'attach_file'}
                                    </span>
                                    <span className="truncate text-th-secondary">{d.name}</span>
                                </div>
                                <button type="button" className="shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold border border-th-border bg-th-surface-base text-th-secondary hover:text-th-heading transition-colors">
                                    {d.status === 'uploaded' ? 'View' : 'Upload'}
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[10px] text-th-muted text-center py-2">Select an appeal to view documents.</div>
                )}
            </div>

            {/* In-Flight Queue */}
            <div className="bg-th-surface-raised border border-th-border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-th-border bg-th-surface-overlay">
                    <h3 className="text-[10px] font-semibold text-th-heading">In-Flight Queue</h3>
                    <span className="text-[8px] font-mono text-th-muted">{inFlight.length} active</span>
                </div>
                {appealsError && <div className="p-3"><ErrorBanner title="Cannot load queue" message={appealsError} onRetry={loadAppeals} /></div>}
                {!appealsError && appealsLoading && (
                    <div className="p-3 space-y-1.5">{[1,2,3].map(i => <SkeletonLine key={i} className="h-8 w-full" />)}</div>
                )}
                {!appealsError && !appealsLoading && inFlight.length === 0 && (
                    <div className="p-4 text-[10px] text-th-muted text-center">No in-flight appeals.</div>
                )}
                {!appealsError && !appealsLoading && inFlight.length > 0 && (
                    <div className="max-h-[240px] overflow-y-auto">
                        {inFlight.map(a => {
                            const active = (a.id || a.claim_id) === selectedId;
                            return (
                                <button
                                    type="button"
                                    key={a.appeal_id || a.id}
                                    onClick={() => setSelectedId(a.id || a.claim_id)}
                                    className={cn('w-full flex items-center justify-between px-3 py-2 border-b border-th-border last:border-0 text-left hover:bg-th-surface-overlay transition-colors',
                                        active && 'bg-[rgb(var(--color-primary-bg))]'
                                    )}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-mono font-bold text-[10px] text-[rgb(var(--color-info))]">{a.id || a.claim_id}</p>
                                        <p className="text-[9px] text-th-muted truncate">{a.payer}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className="text-[9px] font-mono text-th-secondary">{a.days != null ? `${a.days}d` : '—'}</p>
                                        <p className="text-[8px] font-mono text-th-muted uppercase">{a.status}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    /* ---------- top-level render ---------------------------------- */

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-th-surface-base">
            {/* Mobile tab bar (below md) */}
            <div className="md:hidden flex border-b border-th-border bg-th-surface-raised shrink-0">
                {MOBILE_TABS.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setMobileTab(t.id)}
                        className={cn('flex-1 px-3 py-2 text-[10px] font-semibold inline-flex items-center justify-center gap-1.5 border-b-2 transition-colors',
                            mobileTab === t.id
                                ? 'border-[rgb(var(--color-primary))] text-[rgb(var(--color-primary))] bg-th-surface-base'
                                : 'border-transparent text-th-muted hover:text-th-heading'
                        )}
                    >
                        <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Desktop: 3 columns. Mobile: single active column. */}
            <div className="flex-1 min-h-0 overflow-hidden md:grid md:grid-cols-[1fr_1.2fr_1fr]">
                <div className={cn('md:block md:border-r min-h-0', mobileTab === 'evidence' ? 'block' : 'hidden')}>
                    {EvidenceColumn}
                </div>
                <div className={cn('md:block md:border-r min-h-0', mobileTab === 'letter' ? 'block' : 'hidden')}>
                    {LetterColumn}
                </div>
                <div className={cn('md:block min-h-0', mobileTab === 'insights' ? 'block' : 'hidden')}>
                    {InsightsColumn}
                </div>
            </div>
        </div>
    );
}
