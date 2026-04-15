import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { fmtCurrency, formatDate } from '../../../lib/formatters';
import { EmptyState, ErrorBanner, Skeleton, StatusBadge } from '../../../components/ui';

/**
 * AutoDialerPanel
 *
 * Three-pane operations view for the predictive dialer:
 *  - Active campaigns with progress bars + start/pause control
 *  - Agent leaderboard
 *  - Recent call log (scrollable)
 *
 * All data sourced from `/api/v1/collections/dialer/*` via api.collections.dialer.
 */
export function AutoDialerPanel() {
    const [campaigns, setCampaigns] = useState([]);
    const [agents, setAgents] = useState([]);
    const [callLogs, setCallLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyCampaignId, setBusyCampaignId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [c, a, l, s] = await Promise.all([
                api.collections.dialer.getCampaigns(),
                api.collections.dialer.getAgents(),
                api.collections.dialer.getCallLogs({ page: 1, size: 25 }),
                api.collections.dialer.getSummary(),
            ]);
            const cList = Array.isArray(c?.campaigns) ? c.campaigns : Array.isArray(c) ? c : [];
            const aList = Array.isArray(a?.agents) ? a.agents : Array.isArray(a) ? a : [];
            const lList = Array.isArray(l?.items) ? l.items : Array.isArray(l) ? l : [];
            setCampaigns(cList);
            setAgents(aList);
            setCallLogs(lList);
            setSummary(s);
            if (cList.length === 0 && aList.length === 0 && lList.length === 0 && !s) {
                setError(new Error('Dialer service unreachable'));
            }
        } catch (e) {
            console.error('AutoDialerPanel load error:', e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleCampaign = async (camp) => {
        const id = camp.id || camp.campaign_id;
        if (!id) return;
        const nextStatus = camp.status === 'running' || camp.status === 'active' ? 'paused' : 'running';
        setBusyCampaignId(id);
        try {
            const res = await api.collections.dialer.updateCampaign(id, { status: nextStatus });
            if (res) await load();
        } finally {
            setBusyCampaignId(null);
        }
    };

    return (
        <section
            className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-8"
            aria-labelledby="dialer-panel-heading"
        >
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-th-primary text-base" aria-hidden="true">phone_in_talk</span>
                        <h2 id="dialer-panel-heading" className="text-lg font-bold text-th-heading">Auto-Dialer Status</h2>
                    </div>
                    <p className="text-sm text-th-secondary">Live campaigns, agent performance, and recent calls.</p>
                </div>
                <div className="flex items-center gap-3">
                    {summary && (
                        <div className="flex items-center gap-3 text-xs font-semibold text-th-secondary tabular-nums">
                            <span><span className="text-th-success font-bold">{(summary.calls_today ?? 0).toLocaleString()}</span> today</span>
                            <span className="text-th-muted">·</span>
                            <span><span className="text-th-heading font-bold">{(summary.active_campaigns ?? 0)}</span> active</span>
                            <span className="text-th-muted">·</span>
                            <span><span className="text-th-primary font-bold">{(summary.contact_rate_pct ?? 0).toFixed(1)}%</span> contact rate</span>
                        </div>
                    )}
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
                    title="Could not load dialer data"
                    message={error.message || 'The dialer service did not respond.'}
                    onRetry={load}
                    className="mb-4"
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Active Campaigns */}
                <div className="bg-th-surface-overlay/30 border border-th-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Active Campaigns</h3>
                        <span className="text-[11px] tabular-nums text-th-muted">{campaigns.length}</span>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {loading && [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}

                        {!loading && campaigns.length === 0 && !error && (
                            <EmptyState
                                icon="campaign"
                                title="No campaigns running"
                                description="Create a campaign to start outbound outreach."
                            />
                        )}

                        {!loading && campaigns.map((camp) => {
                            const id = camp.id || camp.campaign_id;
                            const target = Number(camp.target_count ?? camp.target_calls ?? camp.target ?? 0);
                            const completed = Number(camp.completed_count ?? camp.completed_calls ?? camp.completed ?? 0);
                            const pct = camp.progress_pct != null
                                ? Math.min(100, Math.round(Number(camp.progress_pct)))
                                : (target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0);
                            const isRunning = String(camp.status || '').toUpperCase() === 'ACTIVE';
                            return (
                                <div key={id} className="rounded-md border border-th-border bg-th-surface-base p-3">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-th-heading truncate">{camp.name || `Campaign ${id}`}</p>
                                            <p className="text-[11px] text-th-muted truncate">{camp.payer || camp.bucket || camp.description || ''}</p>
                                        </div>
                                        <StatusBadge status={camp.status || 'pending'} size="xs" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-th-surface-overlay overflow-hidden">
                                            <div className="h-full bg-th-primary transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-[11px] font-semibold tabular-nums text-th-secondary">{pct}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-th-muted tabular-nums">
                                        <span>{completed.toLocaleString()} / {target.toLocaleString()} calls</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleCampaign(camp)}
                                            disabled={busyCampaignId === id}
                                            className="inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] font-semibold border border-th-border text-th-secondary hover:text-th-heading hover:border-th-border-strong disabled:opacity-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary"
                                        >
                                            <span className="material-symbols-outlined text-[12px]" aria-hidden="true">
                                                {isRunning ? 'pause' : 'play_arrow'}
                                            </span>
                                            {isRunning ? 'Pause' : 'Start'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Agent Leaderboard */}
                <div className="bg-th-surface-overlay/30 border border-th-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Agent Leaderboard</h3>
                        <span className="text-[11px] tabular-nums text-th-muted">{agents.length}</span>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-th-surface-overlay/80">
                                <tr className="text-th-muted">
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider">Agent</th>
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider tabular-nums">Calls</th>
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider tabular-nums">Contacts</th>
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider tabular-nums">Promises</th>
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider tabular-nums">$ Collected</th>
                                    <th className="px-2 py-2 font-semibold uppercase tracking-wider tabular-nums">Avg Dur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-th-border">
                                {loading && [0, 1, 2].map((i) => (
                                    <tr key={i}><td colSpan={6} className="p-2"><Skeleton className="h-5 w-full" /></td></tr>
                                ))}
                                {!loading && agents.length === 0 && !error && (
                                    <tr><td colSpan={6} className="p-0">
                                        <EmptyState icon="group" title="No agent activity yet" description="Performance metrics will appear once agents make calls today." />
                                    </td></tr>
                                )}
                                {!loading && agents.map((agent) => {
                                    const calls = agent.calls_today ?? 0;
                                    const contacts = agent.contacts_made ?? agent.contacts ?? 0;
                                    const promises = agent.promises_secured ?? agent.promises ?? 0;
                                    const avgDur = agent.avg_call_duration ?? agent.avg_duration_seconds;
                                    return (
                                    <tr key={agent.agent_id || agent.id || agent.agent_name || agent.name} className="hover:bg-th-surface-overlay/40">
                                        <td className="px-2 py-2 font-semibold text-th-heading whitespace-nowrap">{agent.agent_name || agent.name || '—'}</td>
                                        <td className="px-2 py-2 text-th-secondary tabular-nums">{Number(calls).toLocaleString()}</td>
                                        <td className="px-2 py-2 text-th-secondary tabular-nums">{Number(contacts).toLocaleString()}</td>
                                        <td className="px-2 py-2 text-th-secondary tabular-nums">{Number(promises).toLocaleString()}</td>
                                        <td className="px-2 py-2 text-th-success tabular-nums font-semibold">{agent.dollars_collected != null ? fmtCurrency(agent.dollars_collected) : '—'}</td>
                                        <td className="px-2 py-2 text-th-muted tabular-nums">{avgDur != null ? `${Math.round(Number(avgDur) / 60)}m ${Math.round(Number(avgDur) % 60)}s` : '—'}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Call Log */}
                <div className="bg-th-surface-overlay/30 border border-th-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted">Recent Call Log</h3>
                        <span className="text-[11px] tabular-nums text-th-muted">{callLogs.length}</span>
                    </div>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {loading && [0, 1, 2, 3].map((i) => <li key={i}><Skeleton className="h-12 w-full" /></li>)}

                        {!loading && callLogs.length === 0 && !error && (
                            <EmptyState icon="call_log" title="No recent calls" description="Once agents start dialing, calls will stream in here." />
                        )}

                        {!loading && callLogs.map((log) => {
                            const promisedAmt = log.promised_payment_amount ?? 0;
                            return (
                            <li
                                key={log.call_id || log.id || `${log.call_started_at}-${log.account_id}`}
                                className="rounded-md border border-th-border bg-th-surface-base p-2 text-xs"
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="font-semibold text-th-heading truncate">{log.patient_name || log.patient || `Acct ${log.account_id || ''}`}</span>
                                    <span className="text-[11px] text-th-muted tabular-nums">{formatDate(log.call_started_at || log.timestamp || log.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <StatusBadge status={log.outcome || log.disposition || 'pending'} size="xs" />
                                    <span className="text-[11px] text-th-muted">{log.agent_name || log.agent || '—'}</span>
                                    {log.call_duration_sec != null && (
                                        <span className="text-[11px] text-th-muted tabular-nums">· {Math.floor(log.call_duration_sec / 60)}m {log.call_duration_sec % 60}s</span>
                                    )}
                                    {promisedAmt > 0 && (
                                        <span className="text-[11px] text-th-success font-semibold tabular-nums">· {fmtCurrency(promisedAmt)} promised</span>
                                    )}
                                </div>
                                {log.notes && (
                                    <p className="text-[11px] text-th-secondary line-clamp-2 leading-relaxed">{log.notes}</p>
                                )}
                            </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </section>
    );
}

export default AutoDialerPanel;
