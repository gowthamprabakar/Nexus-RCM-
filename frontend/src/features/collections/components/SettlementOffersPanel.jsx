import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { fmtCurrency, formatPercent, formatDate } from '../../../lib/formatters';
import { EmptyState, ErrorBanner, Skeleton, StatusBadge } from '../../../components/ui';
import { KPICard } from './KPICard';

/**
 * SettlementOffersPanel
 *
 * Inline workbench for patient settlement offers:
 *  - 4-up KPI ribbon (active, avg %, total recovered, approval pending)
 *  - Queue table with Accept / Reject / Counter actions
 *  - Inline form to create a new offer
 *
 * Backed by `/api/v1/collections/settlements/*` via api.collections.settlements.
 */
const initialDraft = { account_id: '', original_amount: '', offer_amount: '', expires_in_days: 14, notes: '' };

export function SettlementOffersPanel() {
    const [summary, setSummary] = useState(null);
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [draft, setDraft] = useState(initialDraft);
    const [createBusy, setCreateBusy] = useState(false);
    const [counterRow, setCounterRow] = useState(null);
    const [counterAmount, setCounterAmount] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [s, q] = await Promise.all([
                api.collections.settlements.getSummary(),
                api.collections.settlements.getQueue(),
            ]);
            setSummary(s);
            const list = Array.isArray(q?.items) ? q.items : Array.isArray(q) ? q : [];
            setQueue(list);
            if (!s && list.length === 0) {
                setError(new Error('Settlements service unreachable'));
            }
        } catch (e) {
            console.error('SettlementOffersPanel load error:', e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (row, action, payload = {}) => {
        const id = row.offer_id || row.id;
        if (!id) return;
        // Map UI action verbs → backend status values (SettlementUpdateBody)
        const actionToStatus = {
            accept: 'ACCEPTED',
            reject: 'REJECTED',
            counter: 'COUNTERED',
            approve: 'APPROVED',
        };
        const body = {};
        if (actionToStatus[action]) body.status = actionToStatus[action];
        if (payload.counter_amount != null) body.patient_counter_amount = Number(payload.counter_amount);
        if (payload.notes) body.notes = payload.notes;
        setBusyId(id);
        try {
            const res = await api.collections.settlements.update(id, body);
            if (res) await load();
        } finally {
            setBusyId(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!draft.account_id || !draft.offer_amount) return;
        setCreateBusy(true);
        try {
            const payload = {
                account_id: draft.account_id.trim(),
                original_balance: Number(draft.original_amount) || 0,
                offered_amount: Number(draft.offer_amount),
                expires_days: Number(draft.expires_in_days) || 14,
                notes: draft.notes?.trim() || undefined,
            };
            const res = await api.collections.settlements.create(payload);
            if (res) {
                setDraft(initialDraft);
                setShowNewForm(false);
                await load();
            }
        } finally {
            setCreateBusy(false);
        }
    };

    const submitCounter = async () => {
        if (!counterRow || !counterAmount) return;
        await handleAction(counterRow, 'counter', { counter_amount: Number(counterAmount) });
        setCounterRow(null);
        setCounterAmount('');
    };

    return (
        <section
            className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-12"
            aria-labelledby="settlements-panel-heading"
        >
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-th-primary text-base" aria-hidden="true">handshake</span>
                        <h2 id="settlements-panel-heading" className="text-lg font-bold text-th-heading">Settlement Offers Queue</h2>
                    </div>
                    <p className="text-sm text-th-secondary">Active settlement offers, counter-offers, and approval workflow.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowNewForm((v) => !v)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold bg-th-primary text-white hover:bg-th-primary-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                    >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">{showNewForm ? 'close' : 'add'}</span>
                        {showNewForm ? 'Cancel' : 'New Offer'}
                    </button>
                    <button
                        type="button"
                        onClick={load}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                    >
                        <span className="material-symbols-outlined text-[14px]" aria-hidden="true">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <ErrorBanner
                    title="Could not load settlement offers"
                    message={error.message || 'The settlements service did not respond.'}
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
                            title="Active Offers"
                            value={summary?.active_offers != null ? summary.active_offers.toLocaleString() : '—'}
                            subtitle="Awaiting patient response"
                            icon="pending_actions"
                        />
                        <KPICard
                            title="Avg Settlement %"
                            value={summary?.avg_settlement_pct != null ? formatPercent(summary.avg_settlement_pct, 1) : '—'}
                            subtitle="Of original balance"
                            icon="percent"
                            accentColor="border-l-blue-500"
                        />
                        <KPICard
                            title="Total Recovered"
                            value={summary?.total_recovered != null ? fmtCurrency(summary.total_recovered) : '—'}
                            subtitle="Trailing 30 days"
                            icon="savings"
                            accentColor="border-l-green-500"
                        />
                        <KPICard
                            title="Approval Pending"
                            value={summary?.approval_pending != null ? summary.approval_pending.toLocaleString() : '—'}
                            subtitle="Requires supervisor"
                            icon="approval"
                            accentColor="border-l-amber-500"
                        />
                    </>
                )}
            </div>

            {/* New offer form */}
            {showNewForm && (
                <form
                    onSubmit={handleCreate}
                    className="rounded-lg border border-th-border bg-th-surface-overlay/40 p-4 mb-6"
                    aria-label="Create new settlement offer"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <FormField label="Account ID" required>
                            <input
                                value={draft.account_id}
                                onChange={(e) => setDraft({ ...draft, account_id: e.target.value })}
                                required
                                className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-1.5 text-sm text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            />
                        </FormField>
                        <FormField label="Original $">
                            <input
                                type="number"
                                step="0.01"
                                value={draft.original_amount}
                                onChange={(e) => setDraft({ ...draft, original_amount: e.target.value })}
                                className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-1.5 text-sm text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            />
                        </FormField>
                        <FormField label="Offer $" required>
                            <input
                                type="number"
                                step="0.01"
                                value={draft.offer_amount}
                                onChange={(e) => setDraft({ ...draft, offer_amount: e.target.value })}
                                required
                                className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-1.5 text-sm text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            />
                        </FormField>
                        <FormField label="Expires (days)">
                            <input
                                type="number"
                                min={1}
                                value={draft.expires_in_days}
                                onChange={(e) => setDraft({ ...draft, expires_in_days: e.target.value })}
                                className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-1.5 text-sm text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            />
                        </FormField>
                        <FormField label="Notes">
                            <input
                                value={draft.notes}
                                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                                className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-1.5 text-sm text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            />
                        </FormField>
                    </div>
                    <div className="mt-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={createBusy || !draft.account_id || !draft.offer_amount}
                            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold bg-th-primary text-white hover:bg-th-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-raised"
                        >
                            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">send</span>
                            {createBusy ? 'Submitting…' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            )}

            {/* Queue table */}
            <div className="overflow-x-auto rounded-lg border border-th-border">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-th-surface-overlay/30">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Patient</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Original $</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Offered $</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Discount</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Response</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted">Expires</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-th-border">
                        {loading && [0, 1, 2].map((i) => (
                            <tr key={i}><td colSpan={8} className="p-3"><Skeleton className="h-5 w-full" /></td></tr>
                        ))}

                        {!loading && queue.length === 0 && !error && (
                            <tr><td colSpan={8} className="p-0">
                                <EmptyState
                                    icon="handshake"
                                    title="No active settlement offers"
                                    description="Create a new offer for a patient to begin negotiation."
                                    action={() => setShowNewForm(true)}
                                    actionLabel="Create offer"
                                />
                            </td></tr>
                        )}

                        {!loading && queue.map((row) => {
                            const id = row.offer_id || row.id;
                            const original = Number(row.original_balance ?? row.original_amount ?? 0);
                            const offered = Number(row.offered_amount ?? row.offer_amount ?? 0);
                            const discountPct = original > 0 ? Math.round(((original - offered) / original) * 100) : null;
                            const counterAmt = row.patient_counter_amount;
                            return (
                                <tr key={id} className="hover:bg-th-surface-overlay/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-th-heading">{row.patient_name || row.patient || row.patient_id || '—'}</p>
                                        <p className="text-xs text-th-muted">{row.account_id || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 font-mono tabular-nums text-th-secondary">{original > 0 ? fmtCurrency(original) : '—'}</td>
                                    <td className="px-4 py-3 font-mono font-bold tabular-nums text-th-heading">{offered > 0 ? fmtCurrency(offered) : '—'}</td>
                                    <td className="px-4 py-3 tabular-nums">{discountPct != null ? `${discountPct}%` : '—'}</td>
                                    <td className="px-4 py-3"><StatusBadge status={row.status || 'pending'} size="xs" /></td>
                                    <td className="px-4 py-3 text-xs text-th-secondary">{counterAmt ? `Counter: ${fmtCurrency(counterAmt)}` : (row.notes || '—')}</td>
                                    <td className="px-4 py-3 text-xs text-th-muted">{formatDate(row.expires_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleAction(row, 'accept')}
                                                disabled={busyId === id || row.status === 'accepted'}
                                                className="inline-flex items-center h-7 px-2 rounded text-xs font-semibold bg-th-success/15 text-th-success hover:bg-th-success/25 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-success"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleAction(row, 'reject')}
                                                disabled={busyId === id || row.status === 'rejected'}
                                                className="inline-flex items-center h-7 px-2 rounded text-xs font-semibold bg-th-danger/15 text-th-danger hover:bg-th-danger/25 disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-danger"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setCounterRow(row); setCounterAmount(String(offered || '')); }}
                                                disabled={busyId === id}
                                                className="inline-flex items-center h-7 px-2 rounded text-xs font-semibold border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                                            >
                                                Counter
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Counter-offer modal */}
            {counterRow && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="counter-heading"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setCounterRow(null)}
                >
                    <div
                        className="bg-th-surface-raised border border-th-border rounded-xl max-w-sm w-full p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="counter-heading" className="text-base font-bold text-th-heading mb-1">Counter-offer</h3>
                        <p className="text-xs text-th-muted mb-3">{counterRow.patient_name || counterRow.patient || 'Patient'} · current offer {fmtCurrency(counterRow.offer_amount || 0)}</p>
                        <label className="block text-xs uppercase tracking-wider font-semibold text-th-muted mb-1">Counter Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={counterAmount}
                            onChange={(e) => setCounterAmount(e.target.value)}
                            className="w-full bg-th-surface-base border border-th-border rounded-md px-3 py-2 text-sm text-th-heading mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setCounterRow(null)}
                                className="h-8 px-3 rounded-md text-xs font-semibold border border-th-border text-th-secondary hover:text-th-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            >Cancel</button>
                            <button
                                type="button"
                                onClick={submitCounter}
                                disabled={!counterAmount}
                                className="h-8 px-3 rounded-md text-xs font-semibold bg-th-primary text-white hover:bg-th-primary-hover disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                            >Submit Counter</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function FormField({ label, required, children }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">
                {label}{required && <span className="text-th-danger ml-0.5">*</span>}
            </span>
            {children}
        </label>
    );
}

export default SettlementOffersPanel;
