import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { fmtCurrency, formatPercent, formatDate } from '../../../lib/formatters';
import { EmptyState, ErrorBanner, Skeleton, StatusBadge } from '../../../components/ui';
import { KPICard } from './KPICard';

/**
 * DunningTrackerPanel
 *
 * Renders the dunning-letter sequence tracker:
 *  - 4-up KPI ribbon (active sequences, letters sent 30d, response rate, $ collected)
 *  - Queue table with per-row "Send Next" + "Pause" actions
 *  - Template preview modal launched from the row click
 *
 * All data is loaded from `/api/v1/collections/dunning/*` via api.collections.dunning.
 */
export function DunningTrackerPanel() {
    const [summary, setSummary] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionBusyId, setActionBusyId] = useState(null);
    const [previewSequence, setPreviewSequence] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, q] = await Promise.all([
                api.collections.dunning.getSummary(),
                api.collections.dunning.getQueue({ page: 1, size: 25 }),
            ]);
            setSummary(s);
            // Backend returns bare array; accept both shapes
            const list = Array.isArray(q) ? q : Array.isArray(q?.items) ? q.items : [];
            setQueue(list);
            if (!s && list.length === 0) {
                setError(new Error('Dunning service unreachable'));
            }
        } catch (e) {
            console.error('DunningTrackerPanel load error:', e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        // Templates loaded lazily but kept once fetched
        api.collections.dunning.getTemplates().then((res) => {
            const list = Array.isArray(res?.templates) ? res.templates : Array.isArray(res) ? res : [];
            setTemplates(list);
        });
    }, []);

    const handleSendNext = async (row) => {
        if (!row?.sequence_id) return;
        setActionBusyId(row.sequence_id);
        try {
            const next = (row.current_step || 0) + 1;
            const res = await api.collections.dunning.send({ sequence_id: row.sequence_id, step: next });
            if (res) await load();
        } finally {
            setActionBusyId(null);
        }
    };

    const handlePause = async (row) => {
        if (!row?.sequence_id) return;
        setActionBusyId(row.sequence_id);
        try {
            const res = await api.collections.dunning.pause(row.sequence_id);
            if (res) await load();
        } finally {
            setActionBusyId(null);
        }
    };

    const openPreview = async (row) => {
        if (!row?.sequence_id) return;
        setPreviewLoading(true);
        setPreviewSequence({ row, sequence: null });
        try {
            const seq = await api.collections.dunning.getSequence(row.sequence_id);
            setPreviewSequence({ row, sequence: seq });
        } finally {
            setPreviewLoading(false);
        }
    };

    const matchedTemplate = (() => {
        if (!previewSequence?.row) return null;
        const step = (previewSequence.row.current_step || 0) + 1;
        return (
            templates.find((t) => t.step === step) ||
            templates.find((t) => String(t.id) === String(previewSequence.row.next_template_id)) ||
            null
        );
    })();

    return (
        <section className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-8" aria-labelledby="dunning-panel-heading">
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-th-primary text-base" aria-hidden="true">mail</span>
                        <h2 id="dunning-panel-heading" className="text-lg font-bold text-th-heading">Dunning Letter Tracker</h2>
                    </div>
                    <p className="text-sm text-th-secondary">Active sequences, response rates, and next-letter actions.</p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">refresh</span>
                    Refresh
                </button>
            </div>

            {error && (
                <ErrorBanner
                    title="Could not load dunning data"
                    message={error.message || 'The dunning service did not respond. Try again in a moment.'}
                    onRetry={load}
                    className="mb-4"
                />
            )}

            {/* KPI tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {loading ? (
                    [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)
                ) : (
                    <>
                        <KPICard
                            title="Active Sequences"
                            value={summary?.active_sequences != null ? summary.active_sequences.toLocaleString() : '—'}
                            subtitle="Currently in flight"
                            icon="auto_mode"
                        />
                        <KPICard
                            title="Letters Sent (30d)"
                            value={summary?.letters_sent_30d != null ? summary.letters_sent_30d.toLocaleString() : '—'}
                            subtitle="Across all stages"
                            icon="outgoing_mail"
                        />
                        <KPICard
                            title="Response Rate"
                            value={summary?.response_rate_pct != null ? `${Number(summary.response_rate_pct).toFixed(1)}%` : (summary?.response_rate != null ? formatPercent(summary.response_rate, 1) : '—')}
                            subtitle="Inbound replies / sent"
                            icon="mark_email_read"
                            accentColor="border-l-blue-500"
                        />
                        <KPICard
                            title="Collected via Dunning"
                            value={summary?.collected_via_dunning != null ? fmtCurrency(summary.collected_via_dunning) : '—'}
                            subtitle="Trailing 30 days"
                            icon="payments"
                            accentColor="border-l-green-500"
                        />
                    </>
                )}
            </div>

            {/* Queue table */}
            <div className="overflow-x-auto rounded-lg border border-th-border">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-th-surface-overlay/30">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Patient</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Balance</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Step</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Last Letter</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Next Due</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                        {loading && (
                            [0, 1, 2, 3].map((i) => (
                                <tr key={i}>
                                    <td colSpan={7} className="px-4 py-3"><Skeleton className="h-6 w-full" /></td>
                                </tr>
                            ))
                        )}

                        {!loading && queue.length === 0 && !error && (
                            <tr>
                                <td colSpan={7} className="px-0 py-0">
                                    <EmptyState
                                        icon="mail_outline"
                                        title="No active dunning sequences"
                                        description="When patient balances enter the dunning workflow, they will appear here for review and stepwise outreach."
                                    />
                                </td>
                            </tr>
                        )}

                        {!loading && queue.map((row) => {
                            const step = row.current_step ?? 0;
                            const totalSteps = row.total_steps ?? 5;
                            return (
                                <tr
                                    key={row.sequence_id || row.id}
                                    onClick={() => openPreview(row)}
                                    className="hover:bg-th-surface-overlay/40 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-th-heading">{row.patient_name || row.patient || '—'}</p>
                                        <p className="text-xs text-th-muted">{row.patient_id || row.account_id || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-th-heading tabular-nums">
                                        {row.balance != null ? fmtCurrency(row.balance) : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-th-secondary tabular-nums">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-th-heading">{step}</span>
                                            <span className="text-th-muted">/ {totalSteps}</span>
                                            <div className="w-16 h-1.5 rounded-full bg-th-surface-overlay overflow-hidden">
                                                <div className="h-full bg-th-primary" style={{ width: `${Math.min(100, (step / Math.max(1, totalSteps)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-th-secondary text-xs">{formatDate(row.last_sent_at || row.last_letter_at)}</td>
                                    <td className="px-4 py-3 text-th-secondary text-xs">{formatDate(row.next_due_at)}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={row.status || 'pending'} size="xs" />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleSendNext(row); }}
                                                disabled={actionBusyId === row.sequence_id || row.status === 'completed'}
                                                className="inline-flex items-center gap-1 h-7 px-3 rounded-md text-xs font-semibold bg-th-primary text-white hover:bg-th-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                                            >
                                                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">send</span>
                                                Send Next
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handlePause(row); }}
                                                disabled={actionBusyId === row.sequence_id || row.status === 'paused'}
                                                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-semibold border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                                            >
                                                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">pause</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Template preview modal */}
            {previewSequence && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="dunning-preview-heading"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setPreviewSequence(null)}
                >
                    <div
                        className="bg-th-surface-raised border border-th-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-th-border">
                            <div>
                                <h3 id="dunning-preview-heading" className="text-base font-bold text-th-heading">
                                    Sequence preview · {previewSequence.row.patient_name || previewSequence.row.patient || 'Patient'}
                                </h3>
                                <p className="text-xs text-th-muted">Next letter would be step {(previewSequence.row.current_step || 0) + 1}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewSequence(null)}
                                aria-label="Close preview"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-th-muted hover:text-th-heading hover:bg-th-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            {previewLoading && <Skeleton className="h-32 w-full" />}

                            {!previewLoading && matchedTemplate && (
                                <div className="rounded-lg border border-th-border bg-th-surface-overlay/40 p-3">
                                    <div className="text-xs uppercase tracking-wider text-th-muted font-semibold mb-1">Template — Step {matchedTemplate.step ?? '?'}</div>
                                    <div className="text-sm font-semibold text-th-heading mb-2">{matchedTemplate.subject || matchedTemplate.title || 'Untitled template'}</div>
                                    <pre className="text-xs text-th-secondary whitespace-pre-wrap font-sans leading-relaxed">{matchedTemplate.body || matchedTemplate.content || 'No body provided.'}</pre>
                                </div>
                            )}

                            {!previewLoading && !matchedTemplate && (
                                <EmptyState
                                    icon="description"
                                    title="No template matched for the next step"
                                    description="The backend did not return a template body for this step. Confirm template configuration in /collections/dunning/templates."
                                />
                            )}

                            {!previewLoading && Array.isArray(previewSequence.sequence?.letters) && previewSequence.sequence.letters.length > 0 && (
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-th-muted font-semibold mb-2">History</div>
                                    <ul className="space-y-1">
                                        {previewSequence.sequence.letters.map((h, idx) => (
                                            <li key={h.letter_id || idx} className="flex items-center justify-between text-xs text-th-secondary border-b border-th-border/40 py-1.5">
                                                <span>Step {h.step ?? idx + 1} · {h.letter_type || 'NOTICE'} · <span className="uppercase text-[10px] font-semibold text-th-muted">{h.status || '—'}</span></span>
                                                <span className="text-th-muted">{formatDate(h.sent_at)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default DunningTrackerPanel;
