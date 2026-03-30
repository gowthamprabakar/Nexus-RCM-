import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../services/api';

/* ──────────────────────────────────────────────────────────────────────────
   Constants & Helpers
   ────────────────────────────────────────────────────────────────────────── */
const POLL_INTERVAL = 30000;

const SCENARIO_META = {
  'auto-appeal-coding': { icon: 'auto_fix_high', color: 'from-violet-500 to-purple-600', accent: 'violet' },
  'humana-auth-policy': { icon: 'policy', color: 'from-emerald-500 to-teal-600', accent: 'emerald' },
  'pre-submission-eligibility': { icon: 'verified_user', color: 'from-blue-500 to-indigo-600', accent: 'blue' },
  'medicare-timely-filing': { icon: 'schedule', color: 'from-amber-500 to-orange-600', accent: 'amber' },
  '90-day-cash-flow': { icon: 'account_balance', color: 'from-cyan-500 to-blue-600', accent: 'cyan' },
};

const SCENARIO_LABELS = {
  'auto-appeal-coding': 'SIM-001',
  'humana-auth-policy': 'SIM-002',
  'pre-submission-eligibility': 'SIM-003',
  'medicare-timely-filing': 'SIM-004',
  '90-day-cash-flow': 'SIM-005',
};

const fmtDollars = (v) => {
  if (v == null) return '--';
  if (typeof v === 'string') return v;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtNumber = (v) => {
  if (v == null) return '--';
  return v.toLocaleString();
};

const timeAgo = (isoStr) => {
  if (!isoStr) return 'never';
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const riskColor = (level) => {
  if (!level) return 'text-th-muted';
  const l = level.toLowerCase();
  if (l === 'high' || l === 'critical') return 'text-red-400';
  if (l === 'medium' || l === 'moderate') return 'text-amber-400';
  return 'text-emerald-400';
};

const statusColor = (status) => {
  if (!status) return 'text-th-muted';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'success') return 'text-emerald-400';
  if (s === 'running' || s === 'in_progress') return 'text-amber-400';
  if (s === 'failed' || s === 'error') return 'text-red-400';
  return 'text-th-muted';
};

const statusDot = (status) => {
  if (!status) return 'bg-gray-500';
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'done' || s === 'success') return 'bg-emerald-400';
  if (s === 'running' || s === 'in_progress') return 'bg-amber-400 animate-pulse';
  if (s === 'failed' || s === 'error') return 'bg-red-400';
  return 'bg-gray-500';
};

/* ══════════════════════════════════════════════════════════════════════════
   SIMULATION DASHBOARD — MiroFish Agent Swarm
   ══════════════════════════════════════════════════════════════════════════ */
export function SimulationDashboard() {
  /* ── State ────────────────────────────────────────────────────────────── */
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [scenarioResults, setScenarioResults] = useState([]);
  const [payerAgents, setPayerAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningScenarios, setRunningScenarios] = useState(new Set());
  const [interviewAgent, setInterviewAgent] = useState(null);

  const pollRef = useRef(null);

  /* ── Fetch helpers ───────────────────────────────────────────────────── */
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const data = await api.simulation.getSchedulerStatus();
      if (!data) return;
      setSchedulerStatus(data);

      // Extract cached scenario results from scheduler status
      if (data.latest_results || data.cached_results || data.scenarios) {
        const results = data.latest_results || data.cached_results || data.scenarios || [];
        if (Array.isArray(results) && results.length > 0) {
          setScenarioResults(results);
        }
      }
    } catch (err) {
      console.error('Scheduler status fetch failed:', err);
    }
  }, []);

  const fetchPayerAgents = useCallback(async () => {
    try {
      const data = await api.simulation.getRCMAgents();
      if (!data) return;
      const agents = data.agents || data || [];
      if (Array.isArray(agents) && agents.length > 0) {
        setPayerAgents(agents);
      }
    } catch (err) {
      console.error('Payer agents fetch failed:', err);
    }
  }, []);

  /* ── Initial load ───────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      await Promise.all([fetchSchedulerStatus(), fetchPayerAgents()]);
      if (!cancelled) setLoading(false);
    }
    init();
    return () => { cancelled = true; };
  }, [fetchSchedulerStatus, fetchPayerAgents]);

  /* ── Polling (30s) ──────────────────────────────────────────────────── */
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchSchedulerStatus();
      fetchPayerAgents();
    }, POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchSchedulerStatus, fetchPayerAgents]);

  /* ── Run Now ────────────────────────────────────────────────────────── */
  const handleRunNow = useCallback(async (scenarioId) => {
    setRunningScenarios((prev) => new Set(prev).add(scenarioId));
    try {
      const result = await api.simulation.runScenarioNow(scenarioId);
      if (!result) throw new Error('Run now returned no data');
      // Refresh status after a short delay to pick up new results
      setTimeout(() => {
        fetchSchedulerStatus();
        setRunningScenarios((prev) => {
          const next = new Set(prev);
          next.delete(scenarioId);
          return next;
        });
      }, 3000);
    } catch (err) {
      console.error(`Run-now failed for ${scenarioId}:`, err);
      setRunningScenarios((prev) => {
        const next = new Set(prev);
        next.delete(scenarioId);
        return next;
      });
    }
  }, [fetchSchedulerStatus]);

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════ */
  const scheduler = schedulerStatus || {};
  const isActive = scheduler.running || scheduler.status === 'active' || scheduler.enabled;
  const agentCount = payerAgents.length || scheduler.agent_count || 10;
  const modelName = scheduler.model || scheduler.llm_model || 'Qwen3 4B';
  const neo4jNodes = scheduler.neo4j_nodes ?? scheduler.graph_nodes ?? '--';
  const lastSimTime = scheduler.last_run || scheduler.last_simulation;
  const nextRunTime = scheduler.next_run || scheduler.next_scheduled;
  const lastGraphUpdate = scheduler.last_graph_update || scheduler.graph_last_updated;

  return (
    <div className="flex-1 overflow-y-auto font-sans p-6 custom-scrollbar">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-black text-th-heading">Simulation Engine</h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30">
            <span className="material-symbols-outlined text-xs">precision_manufacturing</span>
            MiroFish
          </span>
        </div>
        <p className="text-sm text-th-secondary max-w-2xl">
          MiroFish Agent Swarm — 10 payer digital twins running continuous simulations against a Neo4j knowledge graph. All suggestions are validated by the agent swarm before surfacing to users.
        </p>
      </div>

      {/* ── Swarm Status Bar ────────────────────────────────────────────── */}
      <SwarmStatusBar
        isActive={isActive}
        agentCount={agentCount}
        modelName={modelName}
        neo4jNodes={neo4jNodes}
        lastSimTime={lastSimTime}
        nextRunTime={nextRunTime}
        lastGraphUpdate={lastGraphUpdate}
        loading={loading}
      />

      {/* ── Scenario Results ────────────────────────────────────────────── */}
      <SectionTitle icon="science" label="Scenario Results" subtitle="Pre-loaded from latest simulation runs" />
      <div className="space-y-3 mb-10">
        {scenarioResults.length > 0 ? (
          scenarioResults.map((result) => (
            <ScenarioResultCard
              key={result.scenario_id || result.id}
              result={result}
              isRunning={runningScenarios.has(result.scenario_id || result.id)}
              onRunNow={handleRunNow}
            />
          ))
        ) : (
          <EmptyScenarioPlaceholder loading={loading} />
        )}
      </div>

      {/* ── Payer Digital Twins ─────────────────────────────────────────── */}
      <SectionTitle icon="groups" label="Payer Digital Twins" subtitle={`${agentCount} MiroFish agents modeling real payer behavior`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-10">
        {payerAgents.length > 0 ? (
          payerAgents.map((agent) => (
            <PayerAgentCard
              key={agent.id || agent.agent_id || agent.name}
              agent={agent}
              onInterview={() => setInterviewAgent(agent)}
            />
          ))
        ) : loading ? (
          Array.from({ length: 10 }).map((_, i) => <AgentCardSkeleton key={i} />)
        ) : (
          <div className="col-span-full text-center py-8 text-sm text-th-muted">No payer agents loaded</div>
        )}
      </div>

      {/* ── Validation Layer ──────────────────────────────────────────── */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 mb-6 ${
        isActive
          ? 'border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-teal-500/5'
          : 'border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5'
      }`}>
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
          isActive ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`}>
          <span className={`material-symbols-outlined text-xl ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>shield</span>
        </div>
        <div>
          <p className="text-sm font-bold text-th-heading">{isActive ? 'Validation Layer Active' : 'Validation Layer Degraded'}</p>
          <p className="text-xs text-th-secondary">
            {isActive
              ? 'All suggestions and recommendations are validated by the full agent swarm consensus before being surfaced to users. No unvalidated insights reach the dashboard.'
              : 'The validation layer is currently offline. Suggestions may not be fully validated by the agent swarm.'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`size-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-amber-400'}`}>{isActive ? 'Verified' : 'Offline'}</span>
        </div>
      </div>

      {/* ── Interview Modal ─────────────────────────────────────────────── */}
      {interviewAgent && (
        <InterviewModal
          agent={interviewAgent}
          onClose={() => setInterviewAgent(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════ */

function SectionTitle({ icon, label, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="material-symbols-outlined text-lg text-th-primary">{icon}</span>
      <div>
        <h2 className="text-sm font-bold text-th-heading">{label}</h2>
        {subtitle && <p className="text-[11px] text-th-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ── Swarm Status Bar ────────────────────────────────────────────────── */
function SwarmStatusBar({ isActive, agentCount, modelName, neo4jNodes, lastSimTime, nextRunTime, lastGraphUpdate, loading }) {
  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised p-4 mb-8">
      {/* Row 1 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
          <span className={`text-sm font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-th-muted'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <span className="text-th-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-th-primary">groups</span>
          <span className="text-sm font-semibold text-th-heading">{agentCount} Agents</span>
        </div>
        <span className="text-th-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-violet-400">memory</span>
          <span className="text-sm font-semibold text-th-heading">{modelName}</span>
        </div>
        <span className="text-th-border">|</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-cyan-400">hub</span>
          <span className="text-sm font-semibold text-th-heading">Neo4j: {neo4jNodes} nodes</span>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-th-secondary">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          Last sim: {lastSimTime ? timeAgo(lastSimTime) : loading ? '...' : 'never'}
        </span>
        <span className="text-th-border">|</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">update</span>
          Next: {nextRunTime ? timeAgo(nextRunTime) : '--'}
        </span>
        <span className="text-th-border">|</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">account_tree</span>
          Graph updated: {lastGraphUpdate ? timeAgo(lastGraphUpdate) : '--'}
        </span>
      </div>
    </div>
  );
}

/* ── Scenario Result Card ────────────────────────────────────────────── */
function ScenarioResultCard({ result, isRunning, onRunNow }) {
  const scenarioId = result.scenario_id || result.id || '';
  const meta = SCENARIO_META[scenarioId] || { icon: 'science', color: 'from-gray-500 to-gray-600', accent: 'gray' };
  const label = SCENARIO_LABELS[scenarioId] || scenarioId.toUpperCase().slice(0, 7);
  const name = result.scenario_name || result.title || result.name || scenarioId;
  const status = result.status || 'pending';
  const revenueImpact = result.revenue_impact ?? result.estimated_impact;
  const riskLevel = result.risk_level || result.risk;
  const confidence = result.confidence ?? result.confidence_score;
  const summary = result.executive_summary || result.summary || result.description || '';
  const elapsed = result.elapsed_time || result.duration || result.elapsed;

  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised p-4 hover:border-th-primary/30 transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`size-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
          <span className="material-symbols-outlined text-lg">{meta.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-th-muted font-mono">[{label}]</span>
            <h3 className="text-sm font-bold text-th-heading truncate">{name}</h3>
            <div className="flex items-center gap-1 ml-2">
              <span className={`size-1.5 rounded-full ${statusDot(status)}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor(status)}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-4 flex-wrap mt-2">
            {revenueImpact != null && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-400">trending_up</span>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">{fmtDollars(revenueImpact)}</span>
              </div>
            )}
            {riskLevel && (
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined text-xs ${riskColor(riskLevel)}`}>warning</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${riskColor(riskLevel)}`}>{riskLevel} risk</span>
              </div>
            )}
            {confidence != null && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-blue-400">verified</span>
                <span className="text-xs font-bold text-blue-400 tabular-nums">{confidence}%</span>
              </div>
            )}
            {elapsed && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-th-muted">timer</span>
                <span className="text-[10px] text-th-muted tabular-nums">{elapsed}</span>
              </div>
            )}
          </div>

          {/* Executive summary */}
          {summary && (
            <p className="text-[11px] text-th-secondary mt-2 line-clamp-2 leading-relaxed">{summary}</p>
          )}
        </div>

        {/* Run Now button */}
        <div className="shrink-0 self-center">
          <button
            onClick={() => onRunNow(scenarioId)}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
              isRunning
                ? 'bg-th-surface-overlay text-th-muted cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Running
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                Run Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Empty Scenario Placeholder ──────────────────────────────────────── */
function EmptyScenarioPlaceholder({ loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-th-border bg-th-surface-raised p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-xl bg-th-surface-overlay" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-th-surface-overlay rounded w-1/3" />
                <div className="h-2 bg-th-surface-overlay rounded w-2/3" />
              </div>
              <div className="h-8 w-20 bg-th-surface-overlay rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-th-border border-dashed bg-th-surface-raised/50 p-8 text-center">
      <span className="material-symbols-outlined text-3xl text-th-muted mb-2">science</span>
      <p className="text-sm font-semibold text-th-heading mb-1">No Cached Results</p>
      <p className="text-xs text-th-muted">Waiting for the scheduler to run the first simulation cycle. Results will appear here automatically.</p>
    </div>
  );
}

/* ── Payer Agent Card ─────────────────────────────────────────────────── */
function PayerAgentCard({ agent, onInterview }) {
  const name = agent.name || agent.agent_name || 'Unknown';
  const denialRate = agent.denial_rate ?? agent.denialRate;
  const adtp = agent.adtp ?? agent.avg_days_to_pay;
  const claimVolume = agent.claim_volume ?? agent.claims ?? agent.volume;
  const agentColor = agent.color || '#6366F1';

  const denialColor = denialRate > 12 ? 'text-red-400' : denialRate > 9 ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="size-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0"
          style={{ backgroundColor: agentColor }}
        >
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-th-heading truncate">{name}</p>
          <p className="text-[10px] text-th-muted">{agent.payment_behavior || agent.persona || 'Digital Twin'}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2 flex-1">
        {denialRate != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-th-muted">Denial Rate</span>
            <span className={`text-xs font-bold tabular-nums ${denialColor}`}>{denialRate}%</span>
          </div>
        )}
        {adtp != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-th-muted">ADTP</span>
            <span className="text-xs font-bold tabular-nums text-th-heading">{adtp} days</span>
          </div>
        )}
        {claimVolume != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-th-muted">Claims</span>
            <span className="text-xs font-bold tabular-nums text-th-heading">{fmtNumber(claimVolume)}</span>
          </div>
        )}
        {agent.contract_compliance != null && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-th-muted">Contract</span>
            <span className={`text-xs font-bold tabular-nums ${agent.contract_compliance >= 95 ? 'text-emerald-400' : agent.contract_compliance >= 90 ? 'text-amber-400' : 'text-red-400'}`}>
              {agent.contract_compliance}%
            </span>
          </div>
        )}
      </div>

      {/* Interview button */}
      <button
        onClick={onInterview}
        className="mt-3 flex items-center justify-center gap-1 w-full px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-200"
      >
        <span className="material-symbols-outlined text-xs">chat</span>
        Interview
      </button>
    </div>
  );
}

/* ── Agent Card Skeleton ──────────────────────────────────────────────── */
function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-th-border bg-th-surface-raised p-4 animate-pulse">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="size-8 rounded-lg bg-th-surface-overlay" />
        <div className="flex-1 space-y-1">
          <div className="h-3 bg-th-surface-overlay rounded w-3/4" />
          <div className="h-2 bg-th-surface-overlay rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-th-surface-overlay rounded" />
        <div className="h-2 bg-th-surface-overlay rounded" />
        <div className="h-2 bg-th-surface-overlay rounded" />
      </div>
      <div className="h-7 bg-th-surface-overlay rounded-lg mt-3" />
    </div>
  );
}

/* ── Interview Modal ──────────────────────────────────────────────────── */
function InterviewModal({ agent, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const agentId = agent.id || agent.agent_id || agent.name?.toLowerCase().replace(/\s+/g, '-');
  const agentName = agent.name || agent.agent_name || 'Agent';
  const agentColor = agent.color || '#6366F1';

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendQuestion = useCallback(async () => {
    const question = input.trim();
    if (!question || sending) return;

    setInput('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: question }]);

    try {
      const data = await api.simulation.interviewAgent(agentId, question);

      if (!data) throw new Error('No response from agent');

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: data.response || data.answer || data.message || 'No response received.',
          agentName: data.agent_name || agentName,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          content: `Error communicating with ${agentName}: ${err.message}`,
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [input, sending, agentId, agentName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl border border-th-border bg-th-surface-raised shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-th-border shrink-0">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-black"
            style={{ backgroundColor: agentColor }}
          >
            {agentName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-th-heading">Interview: {agentName}</h3>
            <p className="text-[11px] text-th-muted">
              {agent.payment_behavior || agent.persona || 'Payer Digital Twin'} — Ask about denial patterns, payment behavior, policy changes
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg flex items-center justify-center text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <span className="material-symbols-outlined text-4xl text-th-muted/50 mb-3">forum</span>
              <p className="text-sm text-th-muted mb-1">Ask {agentName} a question</p>
              <p className="text-[11px] text-th-muted/70 max-w-sm">
                Example: "What are the most common denial reasons?" or "How would a policy change affect claim approval rates?"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white'
                    : msg.isError
                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                    : 'bg-th-surface-overlay border border-th-border text-th-heading'
                }`}
              >
                {msg.role === 'agent' && !msg.isError && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-th-primary mb-1">
                    {msg.agentName || agentName}
                  </p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-th-surface-overlay border border-th-border rounded-xl px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-th-primary mb-1">{agentName}</p>
                <div className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-th-border shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agentName} a question...`}
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-th-surface-overlay border border-th-border text-sm text-th-heading placeholder:text-th-muted focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-50"
            />
            <button
              onClick={sendQuestion}
              disabled={!input.trim() || sending}
              className="size-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
