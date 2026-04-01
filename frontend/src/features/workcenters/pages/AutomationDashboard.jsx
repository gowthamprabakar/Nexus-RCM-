import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import { api } from '../../../services/api';
import { AIInsightCard } from '../../../components/ui';

function parseTriggerData(str) { if (!str) return {}; try { return JSON.parse(str); } catch { return {}; } }

const statusConfig = {
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-400' },
  paused: { label: 'Paused', className: 'bg-amber-500/15 text-amber-400' },
  learning: { label: 'Learning', className: 'bg-blue-500/15 text-blue-400' },
};

const outcomeConfig = {
  EXECUTED: { label: 'Success', className: 'text-emerald-400' },
  REJECTED: { label: 'Rejected', className: 'text-rose-400' },
  FAILED: { label: 'Failed', className: 'text-rose-400' },
  success: { label: 'Success', className: 'text-emerald-400' },
  pending_review: { label: 'Pending Review', className: 'text-amber-400' },
};

const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

function KpiCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-th-muted uppercase tracking-wide">{label}</span>
        <span className="material-symbols-outlined text-lg text-th-muted">{icon}</span>
      </div>
      <span className="text-2xl font-black text-th-heading tabular-nums">{value}</span>
    </div>
  );
}

export function AutomationDashboard() {
  const [rules, setRules] = useState([]);
  const [pending, setPending] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const [toggledRules, setToggledRules] = useState({});
  const [aiInsights, setAiInsights] = useState([]);
  const [preventionCount, setPreventionCount] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  // Fetch live data from backend
  const fetchData = useCallback(async () => {
    try {
      const [rulesData, pendingData, auditData] = await Promise.all([
        api.automation.getRules(),
        api.automation.getPending(),
        api.automation.getAudit(50),
      ]);

      if (rulesData && Array.isArray(rulesData)) {
        setRules(rulesData);
        const map = {};
        rulesData.forEach(r => { map[r.rule_id] = r.enabled; });
        setToggledRules(map);
        setIsLive(true);
      }

      if (pendingData && Array.isArray(pendingData)) {
        setPending(pendingData);
      }

      if (auditData && Array.isArray(auditData)) {
        setAudit(auditData);
      }
    } catch (err) {
      console.error('Automation dashboard: API unavailable', err);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Non-blocking: AI insights + prevention
    api.ai.getInsights('command-center').then(res => {
      if (res?.insights?.length) setAiInsights(res.insights);
    }).catch(() => {});
    api.prevention.scan(3).then(d => setPreventionCount(d)).catch(() => null);
    api.scheduler.getStatus().then(d => d && setSchedulerStatus(d)).catch(() => null);
  }, [fetchData]);

  // Toggle rule
  const handleToggle = useCallback(async (ruleId) => {
    const newState = !toggledRules[ruleId];
    setToggledRules(prev => ({ ...prev, [ruleId]: newState }));

    if (isLive) {
      const result = await api.automation.toggleRule(ruleId, newState);
      if (!result || result.error) {
        // Revert on failure
        setToggledRules(prev => ({ ...prev, [ruleId]: !newState }));
      }
    }
  }, [toggledRules, isLive]);

  // Approve action
  const handleApprove = useCallback(async (actionId) => {
    if (isLive) {
      const result = await api.automation.approveAction(actionId);
      if (result && !result.error) {
        // Remove from pending, refresh audit
        setPending(prev => prev.filter(p => p.action_id !== actionId));
        const auditData = await api.automation.getAudit(50);
        if (auditData && Array.isArray(auditData) && auditData.length > 0) {
          setAudit(auditData);
        }
      }
    } else {
      setPending(prev => prev.filter(p => p.action_id !== actionId));
    }
  }, [isLive]);

  // Reject action
  const handleReject = useCallback(async (actionId) => {
    if (isLive) {
      const result = await api.automation.rejectAction(actionId);
      if (result && !result.error) {
        setPending(prev => prev.filter(p => p.action_id !== actionId));
        const auditData = await api.automation.getAudit(50);
        if (auditData && Array.isArray(auditData) && auditData.length > 0) {
          setAudit(auditData);
        }
      }
    } else {
      setPending(prev => prev.filter(p => p.action_id !== actionId));
    }
  }, [isLive]);

  // Run rules now
  const handleEvaluate = useCallback(async () => {
    setEvaluating(true);
    try {
      const result = await api.automation.evaluate();
      if (result) {
        // Refresh all data after evaluation
        await fetchData();
      }
    } catch (err) {
      console.error('Rule evaluation failed:', err);
    } finally {
      setEvaluating(false);
    }
  }, [fetchData]);

  // Compute KPI values
  const activeRuleCount = Object.values(toggledRules).filter(Boolean).length;
  const totalExecuted = rules.reduce((s, r) => s + (r.executed_count || 0), 0);
  const rulesWithActions = rules.filter(r => r.total_actions > 0);
  const avgSuccessRate = rulesWithActions.length > 0
    ? (rulesWithActions.reduce((s, r) => s + r.success_rate, 0) / rulesWithActions.length).toFixed(1)
    : '0';
  const totalImpact = audit.reduce((s, a) => s + (a.estimated_impact || 0), 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-th-heading tracking-tight">Automation Dashboard</h1>
          <p className="text-sm text-th-secondary">
            Rules, approvals, and audit trail for NEXUS automation engine
            {isLive && (
              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleEvaluate}
          disabled={evaluating}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2',
            evaluating
              ? 'bg-th-surface-overlay text-th-muted cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {evaluating ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">play_arrow</span>
          )}
          {evaluating ? 'Evaluating...' : 'Run Rules Now'}
        </button>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Rules" value={activeRuleCount} icon="rule" />
        <KpiCard label="Auto-Actions" value={totalExecuted.toLocaleString()} icon="bolt" />
        <KpiCard label="Success Rate" value={`${avgSuccessRate}%`} icon="check_circle" />
        <KpiCard label="Revenue Saved" value={fmt(totalImpact)} icon="savings" />
      </div>

      {/* Row 2: Rules Table */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border">
          <h2 className="text-sm font-bold text-th-heading">Automation Rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-th-border text-th-muted text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Rule</th>
                <th className="text-left px-5 py-3 font-semibold">Trigger</th>
                <th className="text-left px-5 py-3 font-semibold">Approval</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Success Rate</th>
                <th className="text-left px-5 py-3 font-semibold">Actions</th>
                <th className="text-center px-5 py-3 font-semibold">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const isActive = toggledRules[rule.rule_id];
                const st = isActive ? statusConfig.active : statusConfig.paused;
                const successRate = rule.success_rate || 0;
                return (
                  <tr key={rule.rule_id} className="border-b border-th-border/50 hover:bg-th-surface-overlay/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-th-heading">{rule.name}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                          <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
                          Swarm Validated
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-th-secondary">{rule.trigger}</td>
                    <td className="px-5 py-3">
                      {rule.requires_approval ? (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-400">Required</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/15 text-emerald-400">Auto</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('px-2 py-0.5 text-[11px] font-bold rounded-full', st.className)}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              successRate >= 90 ? 'bg-emerald-500' : successRate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                            )}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-th-muted tabular-nums">{successRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-th-muted tabular-nums">
                      {rule.total_actions != null ? `${rule.executed_count || 0} / ${rule.total_actions}` : (rule.last_triggered || '--')}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleToggle(rule.rule_id)}
                        className={cn(
                          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                          isActive ? 'bg-primary' : 'bg-th-surface-overlay'
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                            isActive ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Pending Approvals */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border flex items-center gap-2">
          <h2 className="text-sm font-bold text-th-heading">Pending Approvals</h2>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-400 tabular-nums">{pending.length}</span>
        </div>
        {pending.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-th-muted">No pending approvals</div>
        ) : (
          <div className="divide-y divide-th-border/50">
            {pending.map((item) => (
              <div key={item.action_id} className="px-5 py-4 flex items-center gap-4 hover:bg-th-surface-overlay/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-th-muted tabular-nums">{item.action_id}</span>
                    <span className="text-xs text-primary font-semibold">{item.rule_name}</span>
                  </div>
                  <p className="text-sm font-semibold text-th-heading truncate">{item.suggested_action}</p>
                  {item.estimated_impact > 0 && (
                    <p className="text-xs text-th-secondary mt-0.5">Impact: {fmt(item.estimated_impact)} -- {item.affected_claims || 0} claims</p>
                  )}
                  {(() => {
                    const td = parseTriggerData(item.trigger_data);
                    const vn = td.validation_notes;
                    const rf = td.risk_flags || [];
                    if (!vn || vn === 'unavailable' || vn === 'timed out') return null;
                    return (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 max-w-[320px] truncate">
                          <span className="material-symbols-outlined" style={{fontSize:'11px'}}>science</span>
                          {vn.length > 90 ? vn.slice(0, 90) + '...' : vn}
                        </span>
                        {rf.slice(0, 3).map((flag, fi) => (
                          <span key={fi} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {flag}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.confidence}%` }} />
                  </div>
                  <span className="text-xs text-th-muted tabular-nums w-8">{item.confidence}%</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                    <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
                    Validated
                  </span>
                  <button
                    onClick={() => handleApprove(item.action_id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.action_id)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prevention + AI Insights */}
      {preventionCount && (preventionCount.total > 0 || preventionCount.alerts?.length > 0) && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
          <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
          <span className="font-bold text-amber-400 tabular-nums">{preventionCount.total || preventionCount.alerts?.length || 0}</span>
          <span className="text-th-secondary">prevention alerts relevant to automation rules</span>
        </div>
      )}
      {aiInsights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-purple-400 text-base">auto_awesome</span>
            <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">AI Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiInsights.slice(0, 2).map((ins, i) => (
              <AIInsightCard
                key={i}
                title={ins.title}
                description={ins.body || ins.description}
                confidence={ins.confidence || 85}
                impact={ins.severity === 'critical' ? 'high' : 'medium'}
                category={ins.badge || ins.category || 'Diagnostic'}
                action="Review"
                value={ins.value || ''}
                icon={ins.icon || 'auto_awesome'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Row 4: Scheduler Status */}
      {schedulerStatus && (
        <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
          <div className="px-5 py-4 border-b border-th-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-th-heading flex items-center gap-2">
              <span className="material-symbols-outlined text-base">schedule</span>
              Background Scheduler
            </h2>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
              schedulerStatus.running
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <span className={`size-1.5 rounded-full ${schedulerStatus.running ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {schedulerStatus.running ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {(schedulerStatus.jobs || []).map((job) => (
              <div key={job.job_id} className="flex items-center gap-3 rounded-lg border border-th-border/50 bg-th-surface-overlay/30 px-4 py-3">
                <span className="material-symbols-outlined text-base text-th-muted">timer</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-th-heading truncate">{job.name}</p>
                  <p className="text-[10px] text-th-muted">
                    Next: {job.next_run_time ? new Date(job.next_run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 5: Audit Trail */}
      <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
        <div className="px-5 py-4 border-b border-th-border">
          <h2 className="text-sm font-bold text-th-heading">Audit Trail</h2>
        </div>
        <div className="divide-y divide-th-border/50">
          {audit.map((entry, idx) => {
            const oc = outcomeConfig[entry.status] || outcomeConfig[entry.outcome] || { label: entry.status || 'Unknown', className: 'text-th-muted' };
            const timestamp = entry.executed_at
              ? new Date(entry.executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : (entry.created_at && entry.created_at.includes('T')
                  ? new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : entry.created_at || entry.timestamp || '--');
            return (
              <div key={idx} className="px-5 py-3 flex items-center gap-4 hover:bg-th-surface-overlay/30 transition-colors">
                <span className="text-xs text-th-muted tabular-nums w-16 shrink-0">{timestamp}</span>
                <span className="text-xs font-semibold text-primary shrink-0 w-28 truncate">{entry.rule_name || entry.rule}</span>
                <span className="text-sm text-th-heading flex-1 truncate">{entry.suggested_action || entry.action}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-10 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${entry.confidence}%` }} />
                  </div>
                  <span className="text-[11px] text-th-muted tabular-nums">{entry.confidence}%</span>
                </div>
                <span className={cn('text-[11px] font-bold shrink-0', oc.className)}>{oc.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
