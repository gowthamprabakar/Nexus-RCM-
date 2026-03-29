import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { RootCauseTree } from './RootCauseTree';
import { RootCauseGraph } from './RootCauseGraph';

const MOCK_FALLBACK = {
  revenue_impact: { amount: 1200000, claims_affected: 3847 },
  payer_breakdown: [
    { payer: 'Humana Commercial', payer_id: 'PAY001', amount: 580000, pct: 48, rag: 'red' },
    { payer: 'Cigna / Evernorth', payer_id: 'PAY002', amount: 290000, pct: 24, rag: 'red' },
    { payer: 'UnitedHealthcare', payer_id: 'PAY003', amount: 180000, pct: 15, rag: 'amber' },
    { payer: 'Medicare FFS', payer_id: 'PAY004', amount: 90000, pct: 8, rag: 'green' },
    { payer: 'Others', payer_id: 'PAY005', amount: 60000, pct: 5, rag: 'green' },
  ],
  denial_categories: [
    { category: 'AUTHORIZATION', change_pct: 340, rag: 'red' },
    { category: 'CODING', change_pct: 45, rag: 'red' },
    { category: 'ELIGIBILITY', change_pct: 8, rag: 'amber' },
    { category: 'TIMELY_FILING', change_pct: -2, rag: 'green' },
  ],
  root_causes: [
    { cause: 'Payer Policy Change (Humana)', weight: 64, group: 'PAYER' },
    { cause: 'Documentation Gap', weight: 22, group: 'CLINICAL' },
    { cause: 'Coding Modifier Issue', weight: 14, group: 'PROCESS' },
  ],
  top_claims: [
    { claim_id: 'CLM0023456', payer: 'Humana', amount: 48200, category: 'AUTH', action: 'Appeal' },
    { claim_id: 'CLM0023891', payer: 'Cigna', amount: 31400, category: 'CODING', action: 'Fix & Resubmit' },
    { claim_id: 'CLM0024102', payer: 'UHC', amount: 22100, category: 'AUTH', action: 'Appeal' },
  ],
  actions: [
    { priority: 'critical', action: 'Update Humana prior auth workflow', impact: 580000 },
    { priority: 'critical', action: 'Retrain coders on modifier usage', impact: 290000 },
    { priority: 'warning', action: 'Verify UHC eligibility pipeline', impact: 180000 },
  ],
};

const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const ragDot = { red: 'bg-rose-500', amber: 'bg-amber-500', green: 'bg-emerald-500' };
const ragText = { red: 'text-rose-400', amber: 'text-amber-400', green: 'text-emerald-400' };

function Section({ title, ragList, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="rounded-lg border border-th-border bg-th-surface-overlay/50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-th-surface-overlay/80 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-th-heading uppercase tracking-wider">{title}</span>
          <div className="flex gap-1">
            {(ragList || []).map((r, i) => (
              <span key={i} className={`size-2 rounded-full ${ragDot[r]}`} />
            ))}
          </div>
        </div>
        <span className="material-symbols-outlined text-th-muted text-sm">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && <div className="px-4 pb-3 border-t border-th-border/50">{children}</div>}
    </div>
  );
}

// Map KPI metric names to diagnostic categories and root cause groups
const METRIC_TO_CONTEXT = {
  'Denial Rate':          { category: 'DENIAL_PATTERN',   rcGroup: null },
  'Pipeline Value':       { category: null,               rcGroup: null },
  'Clean Claim Rate':     { category: 'DENIAL_PATTERN',   rcGroup: 'PROCESS' },
  'Days in A/R':          { category: 'AR_AGING',         rcGroup: 'PAYER' },
  'First Pass Rate':      { category: 'DENIAL_PATTERN',   rcGroup: 'PREVENTABLE' },
  'Net Collection Rate':  { category: 'PAYMENT_FLOW',     rcGroup: 'PAYER' },
  'Revenue At Risk':      { category: 'REVENUE_LEAKAGE',  rcGroup: null },
  'Open Denials':         { category: 'DENIAL_PATTERN',   rcGroup: null },
  'Appeal Success Rate':  { category: 'DENIAL_PATTERN',   rcGroup: 'PROCESS' },
  'Monthly Recovery':     { category: 'PAYMENT_FLOW',     rcGroup: null },
  'Underpayment Count':   { category: 'REVENUE_LEAKAGE',  rcGroup: 'PAYER' },
  'Underpaid Amount':     { category: 'REVENUE_LEAKAGE',  rcGroup: 'PAYER' },
  'Avg Float Days':       { category: 'PAYMENT_FLOW',     rcGroup: 'PAYER' },
};

export function RootCauseInvestigationPanel({ isOpen, onClose, context }) {
  const [data, setData] = useState(MOCK_FALLBACK);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'list'

  // Drill-down state
  const [drillPath, setDrillPath] = useState([]); // [{level, label, id}]
  const [currentLevel, setCurrentLevel] = useState('revenue'); // revenue | payer | category | root_cause | claims
  const [categoryData, setCategoryData] = useState(null);
  const [rootCauseData, setRootCauseData] = useState(null);
  const [claimsData, setClaimsData] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Reset drill state when panel closes/opens
  useEffect(() => {
    if (!isOpen) {
      setDrillPath([]);
      setCurrentLevel('revenue');
      setCategoryData(null);
      setRootCauseData(null);
      setClaimsData(null);
      setSelectedClaim(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !context) return;

    let cancelled = false;
    setLoading(true);

    async function fetchLiveData() {
      try {
        // Try new graph API first (Level 1: payer breakdown)
        const graphData = await api.graph.getRevenueToPayers();

        if (cancelled) return;

        if (graphData && graphData.payers && graphData.payers.length > 0) {
          // Map graph API response to panel data structure
          const payer_breakdown = graphData.payers.map(p => ({
            payer: p.payer_name,
            payer_id: p.payer_id,
            amount: p.impact,
            pct: p.pct,
            rag: p.rag,
            claim_count: p.claim_count,
            denial_count: p.denial_count,
            top_root_cause: p.top_root_cause,
          }));

          // Also fetch claims for top view
          const claimsResult = await api.graph.getClaims({ limit: 5 });

          const top_claims = (claimsResult?.claims || []).map(cl => ({
            claim_id: cl.claim_id,
            payer: cl.payer_name,
            amount: cl.financial_impact || cl.denial_amount,
            category: cl.denial_category,
            action: cl.resolution_path ? cl.resolution_path.split('.')[0] : 'Investigate',
          }));

          // Build actions from top payers
          const actions = payer_breakdown.slice(0, 3).map(p => ({
            priority: p.rag === 'red' ? 'critical' : 'warning',
            action: `Investigate ${p.payer}: ${p.top_root_cause || 'multiple root causes'}`,
            impact: p.amount,
          }));

          setData({
            revenue_impact: {
              amount: graphData.total_impact,
              claims_affected: payer_breakdown.reduce((s, p) => s + (p.claim_count || 0), 0),
            },
            payer_breakdown,
            denial_categories: [], // Populated on drill-down
            root_causes: [],       // Populated on drill-down
            top_claims: top_claims.length > 0 ? top_claims : MOCK_FALLBACK.top_claims,
            actions: actions.length > 0 ? actions : MOCK_FALLBACK.actions,
          });
          setIsLive(true);
        } else {
          // Fall back to legacy API
          const metricCtx = METRIC_TO_CONTEXT[context.metric] || {};
          const summaryFilter = {};
          if (metricCtx.rcGroup) summaryFilter.root_cause_group = metricCtx.rcGroup;

          const [summary, findingsResult] = await Promise.all([
            api.rootCause.getSummary(summaryFilter),
            api.diagnostics.getFindings({ limit: 5 }).catch(() => null),
          ]);

          if (cancelled) return;

          if (summary && (summary.by_root_cause?.length || summary.total_analyses)) {
            const mapped = _mapLegacySummary(summary, findingsResult);
            if (mapped) { setData(mapped); setIsLive(true); }
            else { setData(MOCK_FALLBACK); setIsLive(false); }
          } else {
            setData(MOCK_FALLBACK);
            setIsLive(false);
          }
        }
      } catch (err) {
        console.error('Root cause panel: API unavailable, using mock fallback', err);
        if (!cancelled) { setData(MOCK_FALLBACK); setIsLive(false); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLiveData();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Drill into a payer
  const drillIntoPayer = useCallback(async (payerId, payerName) => {
    setLoading(true);
    try {
      const result = await api.graph.getPayerCategories(payerId);
      if (result && result.categories) {
        setCategoryData(result);
        setDrillPath([{ level: 'payer', label: payerName, id: payerId }]);
        setCurrentLevel('payer');
      }
    } catch (err) {
      console.error('Drill into payer failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Drill into a category
  const drillIntoCategory = useCallback(async (category) => {
    if (!drillPath.length) return;
    const payerId = drillPath[0].id;
    setLoading(true);
    try {
      const result = await api.graph.getCategoryRootCauses(payerId, category);
      if (result && result.root_causes) {
        setRootCauseData(result);
        setDrillPath(prev => [...prev, { level: 'category', label: category, id: category }]);
        setCurrentLevel('category');
      }
    } catch (err) {
      console.error('Drill into category failed:', err);
    } finally {
      setLoading(false);
    }
  }, [drillPath]);

  // Drill into root cause to see claims
  const drillIntoClaims = useCallback(async (rootCause) => {
    const payerId = drillPath.length > 0 ? drillPath[0].id : null;
    const category = drillPath.length > 1 ? drillPath[1].id : null;
    setLoading(true);
    try {
      const result = await api.graph.getClaims({
        payer_id: payerId,
        root_cause: rootCause,
        category: category,
        limit: 20,
      });
      if (result) {
        setClaimsData(result);
        setDrillPath(prev => [...prev, { level: 'root_cause', label: rootCause, id: rootCause }]);
        setCurrentLevel('claims');
      }
    } catch (err) {
      console.error('Drill into claims failed:', err);
    } finally {
      setLoading(false);
    }
  }, [drillPath]);

  // View full claim context
  const viewClaimContext = useCallback(async (claimId) => {
    setLoading(true);
    try {
      const result = await api.graph.getClaimFullContext(claimId);
      if (result && !result.error) {
        setSelectedClaim(result);
      }
    } catch (err) {
      console.error('Claim context failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Navigate breadcrumb
  const navigateBreadcrumb = useCallback((index) => {
    if (index < 0) {
      // Back to root
      setDrillPath([]);
      setCurrentLevel('revenue');
      setCategoryData(null);
      setRootCauseData(null);
      setClaimsData(null);
      setSelectedClaim(null);
    } else {
      const newPath = drillPath.slice(0, index + 1);
      setDrillPath(newPath);
      const lastLevel = newPath[newPath.length - 1]?.level;
      if (lastLevel === 'payer') setCurrentLevel('payer');
      else if (lastLevel === 'category') setCurrentLevel('category');
      else if (lastLevel === 'root_cause') setCurrentLevel('claims');
      setSelectedClaim(null);
    }
  }, [drillPath]);

  if (!isOpen || !context) return null;

  const metric = context.metric || 'Unknown';
  const value = context.value ?? '\u2014';
  const baseline = context.baseline ?? '\u2014';
  const deviation = context.deviation ?? '\u2014';
  const sev = context.severity || 'info';

  const sevColors = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-[500px] z-[9999] bg-th-surface-raised border-l border-th-border shadow-2xl flex flex-col">

        {/* Header */}
        <div className="shrink-0 border-b border-th-border px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-400">troubleshoot</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${sevColors[sev]}`}>{sev}</span>
              {isLive ? (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-th-surface-overlay text-th-muted border-th-border">
                  SAMPLE DATA
                </span>
              )}
            </div>
            <button onClick={onClose} className="size-7 flex items-center justify-center rounded-lg hover:bg-th-surface-overlay text-th-muted hover:text-th-heading">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <h2 className="text-lg font-black text-th-heading mb-2">{metric} Investigation</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-th-surface-overlay px-2 py-1 rounded border border-th-border text-th-heading font-bold tabular-nums">Current: {value}</span>
            <span className="bg-th-surface-overlay px-2 py-1 rounded border border-th-border text-th-muted tabular-nums">Baseline: {baseline}</span>
            <span className={`px-2 py-1 rounded border ${sevColors[sev]} font-bold tabular-nums`}>Deviation: {deviation}</span>
          </div>
          <p className="text-xs text-rose-400 font-bold mt-2">Revenue at Risk: {fmt(data.revenue_impact.amount)} ({data.revenue_impact.claims_affected.toLocaleString()} claims)</p>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 mt-3 bg-th-surface-overlay rounded-lg p-0.5 border border-th-border w-fit">
            <button
              onClick={() => { setViewMode('tree'); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                viewMode === 'tree'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'text-th-muted hover:text-th-heading'
              }`}
            >
              <span className="material-symbols-outlined text-xs">account_tree</span>
              Tree View
            </button>
            <button
              onClick={() => { setViewMode('list'); }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'text-th-muted hover:text-th-heading'
              }`}
            >
              <span className="material-symbols-outlined text-xs">list</span>
              List View
            </button>
          </div>

          {/* Breadcrumb */}
          {drillPath.length > 0 && (
            <div className="flex items-center gap-1 mt-3 flex-wrap">
              <button onClick={() => navigateBreadcrumb(-1)} className="text-[10px] font-bold text-primary hover:underline">All</button>
              {drillPath.map((crumb, i) => (
                <React.Fragment key={i}>
                  <span className="text-[10px] text-th-muted">/</span>
                  <button
                    onClick={() => navigateBreadcrumb(i)}
                    className={`text-[10px] font-bold truncate max-w-[100px] ${i === drillPath.length - 1 ? 'text-th-heading' : 'text-primary hover:underline'}`}
                  >
                    {crumb.label.replace(/_/g, ' ')}
                  </button>
                </React.Fragment>
              ))}
              {selectedClaim && (
                <>
                  <span className="text-[10px] text-th-muted">/</span>
                  <span className="text-[10px] font-bold text-th-heading">{selectedClaim.claim?.claim_id}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

          {loading && viewMode === 'list' && (
            <div className="flex items-center justify-center py-4">
              <span className="material-symbols-outlined text-2xl text-th-muted animate-spin">progress_activity</span>
            </div>
          )}

          {/* ═══ TREE VIEW ═══ */}
          {viewMode === 'tree' && !selectedClaim && (
            <RootCauseTree onClaimSelect={(claimId) => {
              if (claimId) viewClaimContext(claimId);
            }} />
          )}

          {/* Selected Claim Full Context (shared by both views) */}
          {selectedClaim && (
            <ClaimContextView claim={selectedClaim} onBack={() => setSelectedClaim(null)} />
          )}

          {/* ═══ LIST VIEW — existing drill-down views ═══ */}
          {viewMode === 'list' && !selectedClaim && (
            <>
              {/* Arrow connector */}
              <div className="flex justify-center text-th-muted"><span className="material-symbols-outlined text-sm">arrow_downward</span></div>

              {/* Level 1: Payer Breakdown -- always visible at revenue level */}
              {currentLevel === 'revenue' && (
                <>
                  <Section title="Payer Breakdown" ragList={data.payer_breakdown.map(p => p.rag)} defaultOpen={true}>
                    <div className="space-y-1 pt-2">
                      {data.payer_breakdown.map((p, i) => (
                        <button
                          key={i}
                          onClick={() => p.payer_id && isLive ? drillIntoPayer(p.payer_id, p.payer) : null}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${isLive && p.payer_id ? 'hover:bg-th-surface-overlay cursor-pointer' : ''}`}
                        >
                          <span className={`size-2 rounded-full shrink-0 ${ragDot[p.rag]}`} />
                          <span className="text-xs text-th-heading flex-1 truncate text-left">{p.payer}</span>
                          <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(p.amount)}</span>
                          <span className="text-[10px] text-th-muted tabular-nums w-8 text-right">{p.pct}%</span>
                          {isLive && p.payer_id && <span className="material-symbols-outlined text-th-muted text-xs">chevron_right</span>}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <div className="flex justify-center text-th-muted"><span className="material-symbols-outlined text-sm">arrow_downward</span></div>

                  {/* Top Claims at revenue level */}
                  <Section title="Top Affected Claims" ragList={data.top_claims.map(() => 'red').slice(0, 3)} defaultOpen={true}>
                    <div className="space-y-2 pt-2">
                      {data.top_claims.map((cl, i) => (
                        <button
                          key={i}
                          onClick={() => isLive && cl.claim_id && !cl.claim_id.startsWith('Top') ? viewClaimContext(cl.claim_id) : null}
                          className={`w-full flex items-center gap-2 text-xs ${isLive && cl.claim_id && !cl.claim_id.startsWith('Top') ? 'hover:bg-th-surface-overlay cursor-pointer' : ''} rounded px-2 py-1`}
                        >
                          <span className="font-mono text-primary">{cl.claim_id}</span>
                          <span className="text-th-muted">{cl.payer}</span>
                          <span className="font-bold text-th-heading tabular-nums flex-1 text-right">{fmt(cl.amount)}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400">{cl.category}</span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* Level 2: Denial Categories for selected payer */}
              {currentLevel === 'payer' && categoryData && (
                <>
                  <div className="text-xs text-th-muted mb-2">
                    Payer: <span className="font-bold text-th-heading">{categoryData.payer_name}</span>
                    <span className="ml-2 tabular-nums">{fmt(categoryData.total_impact)} total impact</span>
                  </div>
                  <Section title="Denial Categories" ragList={categoryData.categories.map(d => d.rag)} defaultOpen={true}>
                    <div className="space-y-1 pt-2">
                      {categoryData.categories.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => drillIntoCategory(d.category)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-th-surface-overlay transition-colors cursor-pointer"
                        >
                          <span className={`size-2 rounded-full shrink-0 ${ragDot[d.rag]}`} />
                          <span className="text-xs text-th-heading flex-1 text-left">{d.category}</span>
                          <span className="text-xs text-th-muted tabular-nums">{d.count} denials</span>
                          <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(d.impact)}</span>
                          <span className={`text-xs font-bold tabular-nums ${ragText[d.rag]}`}>{d.pct}%</span>
                          <span className="material-symbols-outlined text-th-muted text-xs">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* Level 3: Root Causes for payer + category */}
              {currentLevel === 'category' && rootCauseData && (
                <>
                  <div className="text-xs text-th-muted mb-2">
                    <span className="font-bold text-th-heading">{rootCauseData.payer_name}</span>
                    <span className="mx-1">/</span>
                    <span className="font-bold text-th-heading">{rootCauseData.denial_category}</span>
                  </div>
                  <Section title="Root Causes" ragList={['red']} defaultOpen={true}>
                    <div className="space-y-1 pt-2">
                      {rootCauseData.root_causes.map((rc, i) => (
                        <button
                          key={i}
                          onClick={() => drillIntoClaims(rc.cause)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-th-surface-overlay transition-colors cursor-pointer"
                        >
                          <div className="flex-1 text-left">
                            <p className="text-xs font-semibold text-th-heading">{rc.cause.replace(/_/g, ' ')}</p>
                            <p className="text-[10px] text-th-muted">{rc.group} -- {rc.count} cases -- Confidence: {rc.avg_confidence}%</p>
                          </div>
                          <div className="w-16 h-2 bg-th-surface-overlay rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${rc.weight_pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-th-heading tabular-nums w-8 text-right">{rc.weight_pct}%</span>
                          <span className="text-xs font-bold text-th-heading tabular-nums">{fmt(rc.impact)}</span>
                          <span className="material-symbols-outlined text-th-muted text-xs">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  {rootCauseData.root_causes.length > 0 && rootCauseData.root_causes[0].resolution_path && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-[10px] font-bold text-primary uppercase mb-1">Suggested Resolution</p>
                      <p className="text-xs text-th-heading">{rootCauseData.root_causes[0].resolution_path}</p>
                    </div>
                  )}
                </>
              )}

              {/* Level 4: Individual Claims */}
              {currentLevel === 'claims' && claimsData && (
                <>
                  <div className="text-xs text-th-muted mb-2">
                    <span className="font-bold text-th-heading">{claimsData.total}</span> claims found
                  </div>
                  <Section title={`Claims (${claimsData.claims.length} of ${claimsData.total})`} ragList={['red']} defaultOpen={true}>
                    <div className="space-y-1 pt-2">
                      {claimsData.claims.map((cl, i) => (
                        <button
                          key={i}
                          onClick={() => viewClaimContext(cl.claim_id)}
                          className="w-full flex items-center gap-2 text-xs px-2 py-2 rounded-md hover:bg-th-surface-overlay transition-colors cursor-pointer"
                        >
                          <span className="font-mono text-primary shrink-0">{cl.claim_id}</span>
                          <span className="text-th-muted truncate flex-1 text-left">{cl.patient_name} -- {cl.payer_name}</span>
                          <span className="font-bold text-th-heading tabular-nums shrink-0">{fmt(cl.financial_impact)}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 shrink-0">{cl.carc_code}</span>
                          <span className="material-symbols-outlined text-th-muted text-xs shrink-0">chevron_right</span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer: Actions */}
        {!selectedClaim && currentLevel === 'revenue' && (
          <div className="shrink-0 border-t border-th-border px-5 py-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-th-muted mb-2">Priority Actions</h3>
            <div className="space-y-2">
              {data.actions.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`size-2 rounded-full mt-1.5 shrink-0 ${a.priority === 'critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span className="text-xs text-th-heading flex-1">{a.action}</span>
                  <span className="text-[10px] text-th-muted tabular-nums">{fmt(a.impact)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}


/** Claim full context sub-view */
function ClaimContextView({ claim, onBack }) {
  if (!claim) return null;

  const c = claim.claim;
  const d = claim.denial;
  const rc = claim.root_cause;
  const era = claim.era_payment;
  const lines = claim.claim_lines || [];
  const elig = claim.eligibility;
  const auth = claim.prior_auth;
  const actions = claim.suggested_actions || [];

  return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-primary hover:underline">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Back to list
      </button>

      {/* Claim header */}
      <div className="rounded-lg border border-th-border bg-th-surface-overlay/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-th-heading">{c?.claim_id}</span>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${c?.status === 'DENIED' ? 'bg-rose-500/15 text-rose-400' : c?.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
            {c?.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-th-muted">Patient:</span> <span className="text-th-heading">{c?.patient_name || c?.patient_id}</span></div>
          <div><span className="text-th-muted">Payer:</span> <span className="text-th-heading">{c?.payer_name}</span></div>
          <div><span className="text-th-muted">DOS:</span> <span className="text-th-heading tabular-nums">{c?.date_of_service}</span></div>
          <div><span className="text-th-muted">Charges:</span> <span className="text-th-heading font-bold tabular-nums">{fmt(c?.total_charges)}</span></div>
          <div><span className="text-th-muted">CRS:</span> <span className="text-th-heading tabular-nums">{c?.crs_score || '--'}/100</span></div>
          <div><span className="text-th-muted">Submission:</span> <span className="text-th-heading tabular-nums">{c?.submission_date || '--'}</span></div>
        </div>
      </div>

      {/* Denial */}
      {d && (
        <Section title="Denial" ragList={['red']} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div><span className="text-th-muted">CARC:</span> <span className="text-th-heading font-bold">{d.carc_code}</span></div>
            <div><span className="text-th-muted">Amount:</span> <span className="text-rose-400 font-bold tabular-nums">{fmt(d.denial_amount)}</span></div>
            <div className="col-span-2"><span className="text-th-muted">Description:</span> <span className="text-th-heading">{d.carc_description}</span></div>
            <div><span className="text-th-muted">Category:</span> <span className="text-th-heading">{d.denial_category}</span></div>
            <div><span className="text-th-muted">Appeal By:</span> <span className="text-amber-400 font-bold">{d.appeal_deadline || '--'}</span></div>
            {d.recommended_action && <div className="col-span-2"><span className="text-th-muted">Recommended:</span> <span className="text-primary">{d.recommended_action}</span></div>}
          </div>
        </Section>
      )}

      {/* Root Cause Analysis Graph */}
      {rc && (
        <Section title="Root Cause Analysis" ragList={['amber']} defaultOpen={true}>
          <div className="pt-2">
            {rc.steps && rc.steps.length > 0 ? (
              <RootCauseGraph
                steps={rc.steps}
                primaryRootCause={rc.primary_root_cause}
                confidence={rc.confidence_score}
                denialAmount={d?.denial_amount || rc.financial_impact}
                claimId={c?.claim_id}
                carcCode={d?.carc_code}
                rootCauseGroup={rc.root_cause_group}
                resolutionPath={rc.resolution_path}
              />
            ) : (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-bold text-th-heading">{rc.primary_root_cause?.replace(/_/g, ' ')}</span>
                  <span className="text-primary font-bold">{rc.confidence_score}% confidence</span>
                </div>
                {rc.secondary_root_cause && <p className="text-th-muted">Secondary: {rc.secondary_root_cause?.replace(/_/g, ' ')}</p>}
                <div className="flex justify-between text-th-muted">
                  <span>Group: {rc.root_cause_group}</span>
                  <span>Impact: {fmt(rc.financial_impact)}</span>
                </div>
                {rc.resolution_path && <p className="text-primary">{rc.resolution_path}</p>}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ERA Payment */}
      {era && (
        <Section title="ERA Payment" ragList={['green']}>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            <div><span className="text-th-muted">Paid:</span> <span className="text-emerald-400 font-bold tabular-nums">{fmt(era.payment_amount)}</span></div>
            <div><span className="text-th-muted">Date:</span> <span className="text-th-heading tabular-nums">{era.payment_date}</span></div>
            <div><span className="text-th-muted">Allowed:</span> <span className="text-th-heading tabular-nums">{fmt(era.allowed_amount)}</span></div>
            <div><span className="text-th-muted">Method:</span> <span className="text-th-heading">{era.payment_method}</span></div>
          </div>
        </Section>
      )}

      {/* Claim Lines */}
      {lines.length > 0 && (
        <Section title={`Claim Lines (${lines.length})`} ragList={[]}>
          <div className="space-y-1 pt-2">
            {lines.map((ln, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="text-th-muted w-4">{ln.line_number}</span>
                <span className="font-mono text-primary">{ln.cpt_code}</span>
                <span className="text-th-muted">{ln.icd10_primary}</span>
                <span className="text-th-heading tabular-nums flex-1 text-right">{fmt(ln.charge_amount)}</span>
                {ln.paid_amount != null && <span className="text-emerald-400 tabular-nums">{fmt(ln.paid_amount)}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Eligibility & Prior Auth */}
      {(elig || auth) && (
        <Section title="Eligibility & Authorization" ragList={[]}>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {elig && (
              <>
                <div><span className="text-th-muted">Status:</span> <span className={elig.subscriber_status === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{elig.subscriber_status}</span></div>
                <div><span className="text-th-muted">Network:</span> <span className="text-th-heading">{elig.network_status}</span></div>
                <div><span className="text-th-muted">Deductible Remaining:</span> <span className="text-th-heading tabular-nums">{fmt(elig.deductible_remaining)}</span></div>
                <div><span className="text-th-muted">Plan:</span> <span className="text-th-heading">{elig.plan_type}</span></div>
              </>
            )}
            {auth && (
              <>
                <div><span className="text-th-muted">Auth #:</span> <span className="text-th-heading">{auth.auth_number || '--'}</span></div>
                <div><span className="text-th-muted">Auth Status:</span> <span className={auth.status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{auth.status}</span></div>
                <div><span className="text-th-muted">Expiry:</span> <span className="text-th-heading tabular-nums">{auth.expiry_date || '--'}</span></div>
                <div><span className="text-th-muted">Units:</span> <span className="text-th-heading tabular-nums">{auth.approved_units || '--'}</span></div>
              </>
            )}
          </div>
        </Section>
      )}

      {/* Auto-Appeal / Take Action button */}
      {rc && rc.resolution_path && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase mb-0.5">AI-Recommended Action</p>
              <p className="text-xs text-th-heading truncate">{rc.resolution_path}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await api.automation.approveAction(c?.claim_id || 'unknown');
                } catch (err) {
                  console.error('Auto-action failed:', err);
                }
              }}
              className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              {rc.resolution_path?.toLowerCase().includes('appeal') ? 'Auto-Appeal' : 'Take Action'}
            </button>
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {actions.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-bold text-primary uppercase mb-2">Suggested Actions</p>
          <div className="space-y-2">
            {actions.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`size-2 rounded-full mt-1 shrink-0 ${a.priority === 'critical' ? 'bg-rose-500' : a.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="text-xs text-th-heading">{a.action}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-[10px] text-th-muted">{a.confidence}% confidence</span>
                    {a.automation_available && <span className="text-[10px] text-primary font-bold">AUTOMATABLE</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/** Legacy mapper for backwards compat */
function _mapLegacySummary(summary, findingsResult) {
  if (!summary) return null;
  const byRootCause = summary.by_root_cause || [];
  if (!byRootCause.length && !summary.total_analyses) return null;

  const totalImpact = summary.total_financial_impact || byRootCause.reduce((s, r) => s + (r.total_impact || 0), 0);
  const claimsAffected = summary.total_analyses || byRootCause.reduce((s, r) => s + (r.count || 0), 0);

  const root_causes = byRootCause.slice(0, 5).map(r => ({
    cause: r.root_cause || r.primary_root_cause || 'Unknown',
    weight: Math.round(r.pct || 0),
    group: r.group || 'UNKNOWN',
    count: r.count || 0,
    impact: r.total_impact || 0,
  }));

  const byGroup = summary.by_group || [];
  const payer_breakdown = byGroup.length > 0
    ? byGroup.map(g => ({
        payer: g.group || 'Unknown',
        amount: g.total_impact || 0,
        pct: totalImpact > 0 ? Math.round((g.total_impact || 0) / totalImpact * 100) : 0,
        rag: (g.total_impact || 0) > totalImpact * 0.3 ? 'red' : (g.total_impact || 0) > totalImpact * 0.1 ? 'amber' : 'green',
      }))
    : root_causes.map(rc => ({
        payer: rc.group,
        amount: rc.impact,
        pct: rc.weight,
        rag: rc.weight >= 25 ? 'red' : rc.weight >= 15 ? 'amber' : 'green',
      }));

  const denial_categories = root_causes.map(rc => ({
    category: rc.cause.replace(/_/g, ' '),
    change_pct: rc.weight,
    rag: rc.weight > 25 ? 'red' : rc.weight > 10 ? 'amber' : 'green',
  }));

  const top_claims = root_causes.slice(0, 3).map(rc => ({
    claim_id: `Top ${rc.count} claims`,
    payer: rc.group,
    amount: rc.impact,
    category: rc.cause,
    action: 'Investigate',
  }));

  const findings = findingsResult?.findings || findingsResult?.items || [];
  const actions = findings.slice(0, 3).map(f => ({
    priority: f.severity === 'critical' ? 'critical' : 'warning',
    action: f.title || f.description || 'Review finding',
    impact: f.impact_amount || f.financial_impact || 0,
  }));
  if (actions.length === 0) {
    root_causes.slice(0, 3).forEach(rc => {
      actions.push({
        priority: rc.weight > 25 ? 'critical' : 'warning',
        action: `Investigate: ${rc.cause.replace(/_/g, ' ')}`,
        impact: rc.impact,
      });
    });
  }

  return { revenue_impact: { amount: totalImpact, claims_affected: claimsAffected }, payer_breakdown, denial_categories, root_causes, top_claims, actions };
}
