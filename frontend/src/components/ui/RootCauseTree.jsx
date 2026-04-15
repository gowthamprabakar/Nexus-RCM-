import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (n) => {
  if (!n && n !== 0) return '$0';
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const ragColor = { red: 'bg-rose-500', amber: 'bg-amber-500', green: 'bg-emerald-500' };
const ragGlow  = { red: 'shadow-rose-500/25', amber: 'shadow-amber-500/25', green: 'shadow-emerald-500/25' };
const ragBorder = { red: 'border-rose-500/40', amber: 'border-amber-500/40', green: 'border-emerald-500/40' };
const ragBg    = { red: 'bg-rose-500/5', amber: 'bg-amber-500/5', green: 'bg-emerald-500/5' };

function getRag(impact, maxImpact) {
  if (!maxImpact) return 'red';
  const pct = impact / maxImpact;
  if (pct >= 0.6) return 'red';
  if (pct >= 0.3) return 'amber';
  return 'green';
}

/* ── Animated entry wrapper ──────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = '' }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`transition-all duration-500 ease-out ${className} ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-95'
      }`}
    >
      {children}
    </div>
  );
}

/* ── SVG connector lines ─────────────────────────────────────────────────── */
function VerticalConnector({ height = 28 }) {
  return (
    <div className="flex justify-center" style={{ height }}>
      <svg width="2" height={height} className="overflow-visible">
        <line x1="1" y1="0" x2="1" y2={height} stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="text-th-border" />
        <circle cx="1" cy={height} r="3" className="fill-th-border" />
      </svg>
    </div>
  );
}

function HorizontalFanOut({ count }) {
  if (count <= 1) return <VerticalConnector />;
  const h = 36;
  const spacing = 200;
  const totalW = (count - 1) * spacing;
  const svgW = totalW + 40;
  return (
    <div className="flex justify-center" style={{ height: h }}>
      <svg width={svgW} height={h} className="overflow-visible" style={{ marginLeft: -(svgW / 2 - 20) }}>
        {/* vertical trunk from parent */}
        <line x1={svgW / 2} y1="0" x2={svgW / 2} y2={h / 2} stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="text-th-border" />
        {/* horizontal rail */}
        <line x1={20} y1={h / 2} x2={svgW - 20} y2={h / 2} stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="text-th-border" />
        {/* drop lines */}
        {Array.from({ length: count }).map((_, i) => {
          const x = 20 + i * spacing;
          return (
            <g key={i}>
              <line x1={x} y1={h / 2} x2={x} y2={h} stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="text-th-border" />
              <circle cx={x} cy={h} r="3" className="fill-th-border" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Tree Node Card ──────────────────────────────────────────────────────── */
function TreeNode({ rag = 'red', label, sublabel, value, clickable, onClick, expanded, size = 'md', pulse = false }) {
  const sizeClasses = {
    lg: 'px-5 py-3.5 min-w-[220px]',
    md: 'px-4 py-3 min-w-[180px]',
    sm: 'px-3 py-2 min-w-[150px]',
  };
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      className={`
        group relative rounded-xl border-2 text-left transition-all duration-300
        ${ragBorder[rag]} ${ragBg[rag]} bg-th-surface-raised
        ${clickable ? 'cursor-pointer hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]' : ''}
        ${expanded ? `shadow-lg ${ragGlow[rag]}` : 'shadow-sm'}
        ${sizeClasses[size]}
      `}
    >
      {/* RAG dot + pulse */}
      <div className="flex items-center gap-2 mb-1">
        <span className="relative flex size-3">
          <span className={`absolute inset-0 rounded-full ${ragColor[rag]} ${pulse ? 'animate-ping opacity-50' : ''}`} />
          <span className={`relative size-3 rounded-full ${ragColor[rag]}`} />
        </span>
        <span className="text-xs font-black text-th-heading uppercase tracking-wider leading-tight truncate">{label}</span>
        {clickable && (
          <span className="material-symbols-outlined text-th-muted text-sm ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        )}
      </div>
      <p className="text-sm font-bold text-th-heading tabular-nums">{value}</p>
      {sublabel && <p className="text-[10px] text-th-muted mt-0.5">{sublabel}</p>}
    </button>
  );
}

/* ── Claim Leaf Row ──────────────────────────────────────────────────────── */
function ClaimLeaf({ claim, onClick, delay }) {
  return (
    <FadeIn delay={delay}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-th-border bg-th-surface-raised hover:bg-th-surface-overlay/80 hover:border-primary/40 transition-all duration-200 cursor-pointer group"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
          <span className="relative size-2.5 rounded-full bg-rose-500" />
        </span>
        <span className="font-mono text-xs text-primary font-bold">{claim.claim_id}</span>
        <span className="text-[10px] text-th-muted truncate flex-1 text-left">{claim.payer_name || claim.patient_name || ''}</span>
        <span className="text-xs font-black text-th-heading tabular-nums">{fmt(claim.financial_impact || claim.denial_amount)}</span>
        <span className="material-symbols-outlined text-th-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
      </button>
    </FadeIn>
  );
}

/* ── Main RootCauseTree Component ────────────────────────────────────────── */
export function RootCauseTree({ onClaimSelect, onNodeSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Level 1: Revenue root
  const [revenueData, setRevenueData] = useState(null);

  // Level 2: expanded payer IDs → category data
  const [expandedPayers, setExpandedPayers] = useState({});   // { payerId: { data, categories } }

  // Level 3: expanded categories → root cause data
  const [expandedCategories, setExpandedCategories] = useState({}); // { "payerId|category": { data } }

  // Level 4: expanded root causes → claims
  const [expandedRootCauses, setExpandedRootCauses] = useState({}); // { "payerId|category|cause": { data } }

  const containerRef = useRef(null);

  /* Load Level 1 on mount */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const graphData = await api.graph.getRevenueToPayers();
        if (cancelled) return;
        if (graphData && graphData.payers) {
          setRevenueData(graphData);
        } else {
          setError('No revenue data available');
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load revenue tree');
        console.error('RootCauseTree L1:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* Level 2: Toggle payer expansion */
  const togglePayer = async (payer) => {
    const pid = payer.payer_id;
    onNodeSelect?.({
      level: 'payer',
      label: payer.payer_name,
      group: 'PAYER',
      impact: payer.impact,
      count: payer.claim_count || payer.denial_count,
      payer_id: pid,
    });
    // Check current state via functional setter to avoid stale closures
    setExpandedPayers(prev => {
      if (prev[pid]) {
        // Already expanded — collapse
        const n = { ...prev };
        delete n[pid];
        return n;
      }
      // Not expanded — trigger load (return prev unchanged, load async)
      (async () => {
        setLoading(true);
        try {
          const result = await api.graph.getPayerCategories(pid);
          if (result && result.categories) {
            setExpandedPayers(p => ({ ...p, [pid]: result }));
          }
        } catch (err) { console.error('Tree L2:', err); }
        finally { setLoading(false); }
      })();
      return prev;
    });
  };

  /* Level 3: Toggle category expansion */
  const toggleCategory = async (payerId, category, catData) => {
    const key = `${payerId}|${category}`;
    if (catData) {
      onNodeSelect?.({
        level: 'category',
        label: category,
        category,
        impact: catData.impact,
        count: catData.count,
        payer_id: payerId,
      });
    }
    setExpandedCategories(prev => {
      if (prev[key]) {
        const n = { ...prev }; delete n[key]; return n;
      }
      (async () => {
        setLoading(true);
        try {
          const result = await api.graph.getCategoryRootCauses(payerId, category);
          if (result && result.root_causes) {
            setExpandedCategories(p => ({ ...p, [key]: result }));
          }
        } catch (err) { console.error('Tree L3:', err); }
        finally { setLoading(false); }
      })();
      return prev;
    });
  };

  /* Level 4: Toggle root cause expansion */
  const toggleRootCause = async (payerId, category, cause, rcData) => {
    const key = `${payerId}|${category}|${cause}`;
    if (rcData) {
      onNodeSelect?.({
        level: 'root_cause',
        label: cause.replace(/_/g, ' '),
        root_cause: cause,
        cause,
        category,
        group: rcData.group,
        impact: rcData.impact,
        count: rcData.count,
        confidence: rcData.avg_confidence,
        payer_id: payerId,
      });
    }
    setExpandedRootCauses(prev => {
      if (prev[key]) {
        const n = { ...prev }; delete n[key]; return n;
      }
      (async () => {
        setLoading(true);
        try {
          const result = await api.graph.getClaims({ payer_id: payerId, root_cause: cause, category, limit: 10 });
          if (result) {
            setExpandedRootCauses(p => ({ ...p, [key]: result }));
          }
        } catch (err) { console.error('Tree L4:', err); }
        finally { setLoading(false); }
      })();
      return prev;
    });
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="material-symbols-outlined text-3xl text-rose-400 mb-2">error</span>
        <p className="text-sm text-th-muted">{error}</p>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined text-2xl text-th-muted animate-spin">progress_activity</span>
      </div>
    );
  }

  const payers = revenueData.payers || [];
  const maxPayerImpact = Math.max(...payers.map(p => p.impact || 0), 1);
  // Show top 5 payers in the tree to keep it manageable in a side panel
  const displayPayers = payers.slice(0, 5);

  return (
    <div ref={containerRef} className="relative pb-6">
      {/* Global loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-th-surface-raised/50 z-10 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
          <span className="material-symbols-outlined text-2xl text-primary animate-spin">progress_activity</span>
        </div>
      )}

      {/* ═══ LEVEL 1: Revenue Root ═══ */}
      <FadeIn className="flex justify-center">
        <TreeNode
          rag="red"
          label="Revenue Impact"
          value={fmt(revenueData.total_impact)}
          sublabel={`${payers.reduce((s, p) => s + (p.claim_count || 0), 0).toLocaleString()} claims affected`}
          size="lg"
          pulse
        />
      </FadeIn>

      <VerticalConnector height={32} />

      {/* ═══ LEVEL 2: Payer Cards (horizontal row) ═══ */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-3 justify-center min-w-min">
          {displayPayers.map((payer, i) => {
            const rag = payer.rag || getRag(payer.impact, maxPayerImpact);
            const isExpanded = !!expandedPayers[payer.payer_id];
            return (
              <FadeIn key={payer.payer_id} delay={80 * i} className="flex-shrink-0">
                <TreeNode
                  rag={rag}
                  label={payer.payer_name}
                  value={fmt(payer.impact)}
                  sublabel={`${(payer.claim_count || payer.denial_count || 0).toLocaleString()} claims`}
                  clickable
                  expanded={isExpanded}
                  onClick={() => togglePayer(payer)}
                  size="sm"
                />
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* ═══ LEVEL 2 expanded → LEVEL 3: Categories per payer ═══ */}
      {displayPayers.map(payer => {
        const pid = payer.payer_id;
        const payerData = expandedPayers[pid];
        if (!payerData) return null;

        const cats = payerData.categories || [];
        const maxCatImpact = Math.max(...cats.map(c => c.impact || 0), 1);

        return (
          <FadeIn key={`cat-${pid}`} delay={60} className="mt-2">
            {/* Connector from payer to categories */}
            <VerticalConnector height={24} />

            <div className="ml-2 pl-4 border-l-2 border-dashed border-th-border space-y-2">
              <p className="text-[10px] font-black text-th-muted uppercase tracking-widest mb-1">
                {payerData.payer_name} — Categories
              </p>

              {cats.map((cat, ci) => {
                const catRag = cat.rag || getRag(cat.impact, maxCatImpact);
                const catKey = `${pid}|${cat.category}`;
                const isExpanded = !!expandedCategories[catKey];

                return (
                  <FadeIn key={cat.category} delay={50 * ci}>
                    <div className="space-y-2">
                      <TreeNode
                        rag={catRag}
                        label={cat.category}
                        value={fmt(cat.impact)}
                        sublabel={`${cat.count} denials · ${cat.pct || Math.round((cat.impact / (payerData.total_impact || 1)) * 100)}%`}
                        clickable
                        expanded={isExpanded}
                        onClick={() => toggleCategory(pid, cat.category, cat)}
                        size="sm"
                      />

                      {/* ═══ LEVEL 3 expanded → LEVEL 4: Root Causes ═══ */}
                      {isExpanded && expandedCategories[catKey] && (
                        <FadeIn delay={40} className="ml-4 pl-4 border-l-2 border-dotted border-th-border space-y-2">
                          <p className="text-[10px] font-black text-th-muted uppercase tracking-widest mb-1">
                            Root Causes
                          </p>
                          {(expandedCategories[catKey].root_causes || []).map((rc, ri) => {
                            const rcKey = `${pid}|${cat.category}|${rc.cause}`;
                            const rcExpanded = !!expandedRootCauses[rcKey];

                            return (
                              <FadeIn key={rc.cause} delay={40 * ri}>
                                <div className="space-y-2">
                                  <TreeNode
                                    rag={rc.weight_pct >= 50 ? 'red' : rc.weight_pct >= 20 ? 'amber' : 'green'}
                                    label={rc.cause.replace(/_/g, ' ')}
                                    value={fmt(rc.impact)}
                                    sublabel={`${rc.count} cases · ${rc.weight_pct}% weight`}
                                    clickable
                                    expanded={rcExpanded}
                                    onClick={() => toggleRootCause(pid, cat.category, rc.cause, rc)}
                                    size="sm"
                                  />

                                  {/* ═══ LEVEL 4 expanded → Claims ═══ */}
                                  {rcExpanded && expandedRootCauses[rcKey] && (
                                    <FadeIn delay={30} className="ml-4 pl-4 border-l-2 border-dotted border-th-border/50 space-y-1.5">
                                      <p className="text-[10px] font-black text-th-muted uppercase tracking-widest mb-1">
                                        Claims ({expandedRootCauses[rcKey].total || (expandedRootCauses[rcKey].claims || []).length})
                                      </p>
                                      {(expandedRootCauses[rcKey].claims || []).map((cl, cli) => (
                                        <ClaimLeaf
                                          key={cl.claim_id}
                                          claim={cl}
                                          delay={30 * cli}
                                          onClick={() => onClaimSelect?.(cl.claim_id)}
                                        />
                                      ))}
                                    </FadeIn>
                                  )}
                                </div>
                              </FadeIn>
                            );
                          })}
                        </FadeIn>
                      )}
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </FadeIn>
        );
      })}
    </div>
  );
}

export default RootCauseTree;
