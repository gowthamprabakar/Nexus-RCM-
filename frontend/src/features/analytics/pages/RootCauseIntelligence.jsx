import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { RootCauseTree } from '../../../components/ui/RootCauseTree';

const fmt = (n) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;

const GROUP_COLORS = {
  PREVENTABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PROCESS: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PAYER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CLINICAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const GROUP_OPTIONS = ['ALL', 'PREVENTABLE', 'PROCESS', 'PAYER', 'CLINICAL'];
const DATE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
];

export function RootCauseIntelligence() {
  const navigate = useNavigate();

  // ── Shared state ────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('intelligence');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [aiLoading, setAiLoading] = useState(true);

  // ── Interactive Tree state ──────────────────────────────────────
  const [treeData, setTreeData] = useState(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [payerList, setPayerList] = useState([]);
  const [filterPayer, setFilterPayer] = useState('all');
  const [filterGroup, setFilterGroup] = useState('ALL');
  const [filterDate, setFilterDate] = useState('30d');
  const [selectedNode, setSelectedNode] = useState(null);

  // ── Initial load: summary + payers + AI + first tree fetch ─────
  useEffect(() => {
    async function load() {
      try {
        const [summaryData, payers] = await Promise.all([
          api.rootCause.getSummary(),
          api.payers.list(),
        ]);
        setSummary(summaryData || null);
        const normalized = (payers || []).map(p => ({
          id: p.id || p.payer_id,
          name: p.name || p.payer_name,
        })).filter(p => p.id && p.name);
        setPayerList(normalized);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }
    load();

    // AI insights — non-blocking
    api.ai.getInsights('root-cause').then(r => {
      if (r?.insights?.length) setAiInsights(r.insights);
      setAiLoading(false);
    }).catch(() => setAiLoading(false));
  }, []);

  // ── Tree fetch: initial + whenever filters change ──────────────
  useEffect(() => {
    let cancelled = false;
    setTreeLoading(true);
    (async () => {
      try {
        const data = await api.rootCause.getTree({
          payer_id: filterPayer,
          group: filterGroup,
        });
        if (!cancelled) setTreeData(data || null);
      } catch {
        if (!cancelled) setTreeData(null);
      } finally {
        if (!cancelled) setTreeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterPayer, filterGroup, filterDate]);

  // ── Derived: summary mapping ────────────────────────────────────
  const data = useMemo(() => {
    if (!summary) return null;
    const byRootCause = summary.by_root_cause || summary.distribution || [];
    const byGroup = summary.by_group || [];
    return {
      total_analyzed: summary.total_analyses || summary.total_analyzed || 0,
      top_root_cause: byRootCause[0]?.root_cause?.replace(/_/g, ' ') || '—',
      preventable_pct: summary.preventable_pct || 0,
      avg_confidence: byRootCause.length > 0
        ? Math.round(byRootCause.reduce((s, r) => s + (r.avg_confidence || 0), 0) / byRootCause.length)
        : 0,
      distribution: byRootCause.map(r => ({
        root_cause: r.root_cause,
        label: (r.root_cause || '').replace(/_/g, ' '),
        count: r.count,
        impact: r.total_impact || r.impact || 0,
        confidence: r.avg_confidence || 0,
        group: r.group,
        pct: r.pct || 0,
      })),
      groups: Object.fromEntries(byGroup.map(g => [g.group, g.count])),
      recent_analyses: byRootCause.slice(0, 5).map(r => ({
        root_cause: r.root_cause,
        count: r.count,
        impact: r.total_impact || r.impact || 0,
        group: r.group,
        confidence: r.avg_confidence || 0,
      })),
      total_financial_impact: summary.total_financial_impact || 0,
      preventable_amount: summary.preventable_amount || 0,
    };
  }, [summary]);

  const maxCount = data ? Math.max(...(data.distribution || []).map(d => d.count), 1) : 1;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  // ── Header (shared across tabs) ────────────────────────────────
  const header = (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black text-th-heading tracking-tight">Root Cause Intelligence</h1>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
      </div>
      <div className="flex gap-3">
        <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-sm">ios_share</span>
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );

  // ── Tab switcher ───────────────────────────────────────────────
  const tabSwitcher = (
    <div className="bg-th-surface-overlay/40 p-1 rounded-lg inline-flex items-center gap-1 mb-6 border border-th-border">
      <button
        onClick={() => setActiveTab('intelligence')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          activeTab === 'intelligence'
            ? 'bg-th-surface-raised text-th-heading shadow-sm'
            : 'text-th-muted hover:text-th-heading'
        }`}
      >
        <span className="material-symbols-outlined text-sm">insights</span>
        Intelligence
      </button>
      <button
        onClick={() => setActiveTab('tree')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
          activeTab === 'tree'
            ? 'bg-th-surface-raised text-th-heading shadow-sm'
            : 'text-th-muted hover:text-th-heading'
        }`}
      >
        <span className="material-symbols-outlined text-sm">account_tree</span>
        Interactive Tree
      </button>
    </div>
  );

  // ── Intelligence tab: existing content ─────────────────────────
  const intelligenceTab = data ? (
    <>
      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Analyzed</p>
          <p className="text-3xl font-black text-th-heading tabular-nums">{data.total_analyzed?.toLocaleString()}</p>
          <p className="text-xs text-th-secondary font-bold">Denial claims processed</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Top Root Cause</p>
          <p className="text-lg font-black text-th-heading leading-tight">{data.top_root_cause}</p>
          <p className="text-xs text-purple-400 font-bold">Most frequent driver</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Preventable %</p>
          <p className="text-3xl font-black text-emerald-400 tabular-nums">{data.preventable_pct}%</p>
          <p className="text-xs text-th-secondary font-bold">Could have been avoided</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Avg Confidence</p>
          <p className="text-3xl font-black text-th-heading tabular-nums">{data.avg_confidence}%</p>
          <p className="text-xs text-amber-400 font-bold">AI model accuracy</p>
        </div>
      </div>

      {/* Row 2: Root Cause Distribution */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-th-heading">Root Cause Distribution</h3>
            <p className="text-xs text-th-muted">Ranked by occurrence count with financial impact</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20">Diagnostic AI</span>
        </div>
        <div className="space-y-3">
          {(data.distribution || []).map((item, i) => {
            const groupColors = {
              PROCESS: { bar: 'bg-blue-500', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              PREVENTABLE: { bar: 'bg-amber-500', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              PAYER: { bar: 'bg-red-500', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
              CLINICAL: { bar: 'bg-purple-500', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            };
            const gc = groupColors[item.group] || groupColors.PROCESS;
            return (
            <div key={i} className="flex items-center gap-4 p-3 bg-th-surface-overlay/30 rounded-lg hover:bg-th-surface-overlay/60 cursor-pointer transition-all duration-200" onClick={() => navigate(`/analytics/denials/root-cause/claims?cause=${item.root_cause}`)}>
              <div className="w-56 shrink-0">
                <p className="text-sm font-bold text-th-heading">{item.label}</p>
                <p className="text-[10px] text-th-muted">{item.pct?.toFixed(1)}% of denials</p>
              </div>
              <div className="flex-1 h-4 bg-th-surface-overlay rounded-full overflow-hidden">
                <div className={`h-full ${gc.bar} rounded-full transition-all duration-500`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
              </div>
              <div className="w-16 text-right font-mono text-sm font-bold text-th-heading tabular-nums">{item.count.toLocaleString()}</div>
              <div className="w-20 text-right font-mono text-sm font-bold text-primary tabular-nums">{fmt(item.impact)}</div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${gc.badge}`}>{item.group}</span>
              <span className="material-symbols-outlined text-th-muted text-sm">chevron_right</span>
            </div>
            );
          })}
        </div>
      </div>

      {/* Row 3: Root Cause Groups */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.groups || {}).map(([group, count]) => (
          <div key={group} className={`rounded-xl p-5 border ${GROUP_COLORS[group] || 'bg-th-surface-raised border-th-border'} flex flex-col items-center gap-2`}>
            <span className="text-xs font-bold uppercase tracking-wider">{group}</span>
            <span className="text-3xl font-black tabular-nums">{count}</span>
            <span className="text-[10px] font-semibold text-th-secondary">{((count / data.total_analyzed) * 100).toFixed(1)}% of total</span>
          </div>
        ))}
      </div>

      {/* Row 4: AI Insights */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-icons text-purple-400 text-base">auto_awesome</span>
          <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
          {aiInsights.length > 0 && (
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live &middot; Ollama</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiLoading ? (
            [0, 1, 2].map(i => (
              <div key={i} className="rounded-xl border border-th-border bg-th-surface-overlay p-4 animate-pulse">
                <div className="h-3 bg-th-border rounded w-2/3 mb-3" />
                <div className="h-2 bg-th-border rounded w-full mb-2" />
                <div className="h-2 bg-th-border rounded w-4/5" />
              </div>
            ))
          ) : aiInsights.length > 0 ? (
            aiInsights.slice(0, 3).map((ins, i) => (
              <div key={i} className="rounded-xl border border-th-border bg-th-surface-overlay p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${ins.badge === 'Predictive' ? 'bg-purple-500/10 text-purple-400' : ins.badge === 'Prescriptive' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{ins.badge}</span>
                  <span className={`text-[10px] font-bold uppercase ${ins.severity === 'critical' ? 'text-rose-400' : ins.severity === 'warning' ? 'text-amber-400' : 'text-th-muted'}`}>{ins.severity}</span>
                </div>
                <p className="text-sm font-semibold text-th-heading mb-1">{ins.title}</p>
                <p className="text-xs text-th-secondary leading-relaxed">{ins.body}</p>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-th-muted text-sm">AI insights will appear when Ollama is connected.</div>
          )}
        </div>
      </div>

      {/* Row 5: Recent Analyses Table */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-th-border">
          <h3 className="text-sm font-bold text-th-heading">Recent Root Cause Analyses</h3>
          <span className="text-xs text-th-muted tabular-nums">{(data.recent_analyses || []).length} analyses</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                <th className="px-4 py-3">Claim ID</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Root Cause</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-right">Impact</th>
                <th className="px-4 py-3 text-center">Group</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data.recent_analyses || []).map((row, i) => (
                <tr key={i} className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-primary">{row.claim_id}</td>
                  <td className="px-4 py-3 text-sm text-th-heading font-medium">{row.category}</td>
                  <td className="px-4 py-3 text-sm text-th-secondary">{row.root_cause}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.confidence >= 90 ? 'bg-emerald-500/10 text-emerald-400' : row.confidence >= 75 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {row.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-th-heading tabular-nums">{fmt(row.impact)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${GROUP_COLORS[row.group] || 'bg-th-surface-overlay text-th-muted border-th-border'}`}>{row.group}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link to={`/analytics/denials/root-cause/claims?cause=${row.root_cause}`} className="text-xs font-bold text-primary hover:underline">Claims &rarr;</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center py-24 text-th-muted gap-2">
      <span className="material-symbols-outlined text-4xl">info</span>
      <p className="text-sm">No root cause intelligence data available.</p>
    </div>
  );

  // ── Interactive Tree tab ───────────────────────────────────────
  const treeTab = (
    <div className="flex flex-col gap-4 h-[calc(100vh-14rem)]">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 bg-th-surface-raised border border-th-border rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-th-muted text-sm">filter_alt</span>
          <span className="text-xs font-bold uppercase tracking-wider text-th-muted">Filters</span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Payer</label>
          <select
            value={filterPayer}
            onChange={(e) => setFilterPayer(e.target.value)}
            className="bg-th-surface-overlay border border-th-border rounded-md px-3 py-1.5 text-xs text-th-heading font-semibold focus:outline-none focus:border-primary min-w-[160px]"
          >
            <option value="all">All Payers</option>
            {payerList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Root Cause Group</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-th-surface-overlay border border-th-border rounded-md px-3 py-1.5 text-xs text-th-heading font-semibold focus:outline-none focus:border-primary min-w-[160px]"
          >
            {GROUP_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Date Range</label>
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-th-surface-overlay border border-th-border rounded-md px-3 py-1.5 text-xs text-th-heading font-semibold focus:outline-none focus:border-primary min-w-[160px]"
          >
            {DATE_OPTIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setFilterPayer('all'); setFilterGroup('ALL'); setFilterDate('30d'); setSelectedNode(null); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-th-muted hover:text-th-heading hover:bg-th-surface-overlay transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Reset
        </button>
      </div>

      {/* Tree + side panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Tree container */}
        <div className="flex-1 bg-th-surface-raised border border-th-border rounded-xl p-4 overflow-auto min-w-0">
          <TreeContent
            loading={treeLoading}
            treeData={treeData}
            onNodeSelect={setSelectedNode}
            onClaimSelect={(claimId) => navigate(`/analytics/denials/root-cause/claim/${claimId}`)}
          />
        </div>

        {/* Side panel */}
        <aside className="w-[340px] shrink-0 bg-th-surface-raised border border-th-border rounded-xl p-4 overflow-y-auto hidden lg:block">
          <NodeDetailPanel node={selectedNode} navigate={navigate} />
        </aside>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full">
        {header}
        {tabSwitcher}
        {activeTab === 'intelligence' ? intelligenceTab : treeTab}
      </div>
    </div>
  );
}

/* ─── Helper: Tree content with loading / empty / missing-endpoint states ─── */
function TreeContent({ loading, treeData, onNodeSelect, onClaimSelect }) {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-th-surface-overlay rounded-xl w-56 mx-auto" />
        <div className="h-2 bg-th-border rounded w-1 mx-auto my-3" />
        <div className="flex gap-3 justify-center">
          {[0,1,2,3].map(i => <div key={i} className="h-16 bg-th-surface-overlay rounded-xl w-36" />)}
        </div>
      </div>
    );
  }

  // Endpoint not yet implemented (null response)
  if (!treeData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
        <div className="size-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-amber-400">pending</span>
        </div>
        <div>
          <p className="text-sm font-bold text-th-heading mb-1">Interactive Tree Requires Backend Endpoint</p>
          <p className="text-xs text-th-muted max-w-md leading-relaxed">
            The <code className="font-mono text-primary">/root-cause/tree</code> endpoint returned no data.
            Run backend sprint <span className="font-mono font-bold text-amber-400">BE-FIX-5</span> first.
          </p>
        </div>
      </div>
    );
  }

  // Tree is empty (no branches for current filters)
  const isEmpty =
    (Array.isArray(treeData) && treeData.length === 0) ||
    (treeData.children && treeData.children.length === 0) ||
    (treeData.branches && treeData.branches.length === 0) ||
    (treeData.nodes && treeData.nodes.length === 0);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
        <div className="size-14 rounded-2xl bg-th-surface-overlay border border-th-border flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-th-muted">search_off</span>
        </div>
        <div>
          <p className="text-sm font-bold text-th-heading mb-1">No Tree Branches Match These Filters</p>
          <p className="text-xs text-th-muted">Try widening payer, group, or date filters.</p>
        </div>
      </div>
    );
  }

  // Happy path — render the existing tree component
  return (
    <div className="min-w-[900px]">
      <RootCauseTree
        data={treeData}
        onNodeSelect={onNodeSelect}
        onClaimSelect={onClaimSelect}
      />
    </div>
  );
}

/* ─── Side panel: selected node detail ─── */
function NodeDetailPanel({ node, navigate }) {
  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-2">
        <span className="material-symbols-outlined text-3xl text-th-muted">ads_click</span>
        <p className="text-xs text-th-muted max-w-[220px]">
          Click a tree node to see its revenue impact, top CARC codes, and linked claims.
        </p>
      </div>
    );
  }

  const label = node.label || node.cause || node.category || 'Node';
  const group = node.group || '';
  const impact = node.impact || node.total_impact || 0;
  const claims = node.count || node.claim_count || 0;
  const confidence = node.avg_confidence || node.confidence || 0;
  const rootCauseKey = node.root_cause || node.cause;

  const carcCodes = node.top_carc_codes || node.carc_codes || [];
  const topPayers = node.top_payers || node.payers || [];
  const maxCarcCount = Math.max(...carcCodes.map(c => c.count || 0), 1);

  return (
    <div className="flex flex-col gap-4">
      {/* Title */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-1">Selected Node</p>
        <div className="flex items-start gap-2">
          <p className="text-sm font-black text-th-heading leading-tight flex-1">
            {(label || '').replace(/_/g, ' ')}
          </p>
          {group && (
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${GROUP_COLORS[group] || 'bg-th-surface-overlay text-th-muted border-th-border'}`}>
              {group}
            </span>
          )}
        </div>
      </div>

      {/* Impact metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-th-surface-overlay/40 border border-th-border p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-th-muted">Impact</p>
          <p className="text-sm font-black text-primary tabular-nums">{fmt(impact)}</p>
        </div>
        <div className="rounded-lg bg-th-surface-overlay/40 border border-th-border p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-th-muted">Claims</p>
          <p className="text-sm font-black text-th-heading tabular-nums">{claims.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-th-surface-overlay/40 border border-th-border p-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-th-muted">Avg Conf.</p>
          <p className="text-sm font-black text-emerald-400 tabular-nums">{Math.round(confidence)}%</p>
        </div>
      </div>

      {/* Top CARC codes */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Top CARC Codes</p>
        {carcCodes.length === 0 ? (
          <p className="text-[11px] text-th-muted italic">No CARC data for this branch.</p>
        ) : (
          <div className="space-y-1.5">
            {carcCodes.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-primary font-bold w-10 shrink-0">{c.code}</span>
                <div className="flex-1 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: `${((c.count || 0) / maxCarcCount) * 100}%` }} />
                </div>
                <span className="text-[10px] text-th-muted tabular-nums w-8 text-right">{c.count || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top payers */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted mb-2">Top Payers</p>
        {topPayers.length === 0 ? (
          <p className="text-[11px] text-th-muted italic">No payer breakdown available.</p>
        ) : (
          <ul className="space-y-1">
            {topPayers.slice(0, 5).map((p, i) => (
              <li key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-th-heading font-semibold truncate">{p.payer_name || p.name}</span>
                <span className="text-th-muted tabular-nums">{fmt(p.impact || 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA */}
      {rootCauseKey && (
        <button
          onClick={() => navigate(`/work/denials?root_cause=${rootCauseKey}`)}
          className="mt-auto flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-th-heading text-xs font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform"
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          View All Claims
        </button>
      )}
    </div>
  );
}
