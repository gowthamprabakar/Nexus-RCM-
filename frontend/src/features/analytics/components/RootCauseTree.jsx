import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfidenceBar } from '../../../components/ui';
import { api } from '../../../services/api';

// ─── Color Maps ───────────────────────────────────────────────────────────────

const PRIORITY_BORDER = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-slate-500',
};

const PRIORITY_LABEL_COLOR = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

const NODE_ICON_COLOR = {
  red: 'text-red-400',
  amber: 'text-amber-400',
  orange: 'text-orange-400',
  rose: 'text-rose-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  emerald: 'text-emerald-400',
};

const NODE_RING = {
  red: 'ring-red-500/30',
  amber: 'ring-amber-500/30',
  orange: 'ring-orange-500/30',
  rose: 'ring-rose-500/30',
  blue: 'ring-blue-500/30',
  purple: 'ring-purple-500/30',
  emerald: 'ring-emerald-500/30',
};

const NODE_TREND_COLOR = {
  critical: 'text-red-400',
  high: 'text-amber-400',
  medium: 'text-blue-400',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ViewClaimsButton({ node, navigate }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(node.navPath || '/denials'); }}
      className="mt-3 w-full py-1.5 border border-th-border hover:border-blue-500/50 hover:bg-blue-500/5 text-th-secondary hover:text-blue-400 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
    >
      <span className="material-symbols-outlined text-sm">open_in_new</span>
      View {node.claims?.toLocaleString()} Claims →
    </button>
  );
}

// L2 child node card (individual root cause)
function L2NodeCard({ node, navigate }) {
  return (
    <div className="bg-th-surface-overlay/60 border border-th-border rounded-xl p-4 flex flex-col hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-th-heading leading-snug">{node.label}</p>
          {node.carc && (
            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 tabular-nums">
              {node.carc}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-th-heading tabular-nums">{node.value}</p>
          <p className="text-[10px] text-th-muted tabular-nums">{node.claims?.toLocaleString()} claims</p>
        </div>
      </div>

      {node.confidence > 0 && (
        <div className="mb-2">
          <ConfidenceBar score={node.confidence} size="sm" label="Confidence" />
        </div>
      )}

      <p className="text-[11px] text-th-secondary leading-relaxed mb-1 flex-1">{node.description}</p>

      <ViewClaimsButton node={node} navigate={navigate} />
    </div>
  );
}

// L1 node card (group level)
function L1NodeCard({ node, expanded, onToggle, navigate }) {
  const iconColor = NODE_ICON_COLOR[node.color] || 'text-blue-400';
  const ringClass = NODE_RING[node.color] || 'ring-blue-500/30';
  const borderLeft = PRIORITY_BORDER[node.priority] || 'border-l-slate-500';
  const priorityLabel = PRIORITY_LABEL_COLOR[node.priority] || PRIORITY_LABEL_COLOR.medium;
  const trendColor = NODE_TREND_COLOR[node.priority] || 'text-th-secondary';

  return (
    <div className="flex flex-col">
      <div className="flex justify-center">
        <div className="w-px h-6 bg-th-border" />
      </div>

      <div
        className={`bg-th-surface-raised border border-th-border border-l-4 ${borderLeft} rounded-xl overflow-hidden transition-all duration-200 ${expanded ? `ring-1 ${ringClass} shadow-lg` : 'hover:shadow-md hover:-translate-y-0.5'}`}
      >
        <div className="p-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${iconColor} text-xl`}>{node.icon}</span>
              <div>
                <p className="text-xs font-bold text-th-heading leading-snug">{node.label}</p>
                <p className="text-[10px] text-th-muted">{node.stage}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${priorityLabel}`}>
                {node.priority}
              </span>
              <span className={`material-symbols-outlined text-th-muted text-base transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl font-black text-th-heading tabular-nums">{node.value}</span>
            <span className="text-xs text-th-muted tabular-nums">{node.claims?.toLocaleString()} claims</span>
          </div>

          <div className="mb-2">
            <ConfidenceBar score={node.confidence} size="sm" label="AI Confidence" />
          </div>

          {node.trend && <p className={`text-[10px] font-semibold tabular-nums ${trendColor}`}>{node.trend}</p>}
        </div>

        {expanded && (
          <div className="border-t border-th-border px-4 pb-4 pt-3">
            <p className="text-[11px] text-th-secondary leading-relaxed mb-3">{node.description}</p>
            <ViewClaimsButton node={node} navigate={navigate} />
          </div>
        )}
      </div>

      {expanded && node.children && node.children.length > 0 && (
        <div className="mt-2">
          <div className="flex justify-center">
            <div className="w-px h-4 bg-th-border" />
          </div>
          <div className="relative">
            <div className="absolute top-0 left-4 right-4 h-px bg-th-border" />
          </div>
          <div className="grid gap-3 pt-4" style={{ gridTemplateColumns: `repeat(${Math.min(node.children.length, 2)}, minmax(0, 1fr))` }}>
            {node.children.map((child) => (
              <L2NodeCard key={child.id} node={child} navigate={navigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// L1 compact card
function L1CompactCard({ node, navigate }) {
  const iconColor = NODE_ICON_COLOR[node.color] || 'text-blue-400';
  const borderLeft = PRIORITY_BORDER[node.priority] || 'border-l-slate-500';
  const priorityLabel = PRIORITY_LABEL_COLOR[node.priority] || PRIORITY_LABEL_COLOR.medium;

  return (
    <div
      className={`bg-th-surface-raised border border-th-border border-l-4 ${borderLeft} rounded-xl p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
      onClick={() => navigate(node.navPath || '/denials')}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined ${iconColor} text-lg`}>{node.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-th-heading truncate">{node.label}</p>
          <p className="text-[10px] text-th-muted">{node.stage}</p>
        </div>
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${priorityLabel} shrink-0`}>
          {node.priority}
        </span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-base font-black text-th-heading tabular-nums">{node.value}</span>
        <span className="text-[10px] text-th-muted tabular-nums">{node.claims?.toLocaleString()} claims</span>
      </div>
      <ConfidenceBar score={node.confidence} size="sm" label="Confidence" />
    </div>
  );
}

// Loading skeleton
function TreeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-20 bg-th-surface-overlay rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-th-surface-overlay rounded-xl" />)}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RootCauseTree({ compact = false }) {
  const navigate = useNavigate();
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all');
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await api.rootCause.getTree();
      if (!cancelled && data) setTreeData(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleNode = (id) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return <TreeSkeleton />;
  if (!treeData) return <div className="text-center text-th-muted py-12">Failed to load root cause data</div>;

  const root = treeData.root;
  const children = treeData.children || [];
  const summary = treeData.summary || {};

  // Filter L1 nodes
  const filteredChildren = children.filter((node) => {
    if (filterPriority === 'all') return true;
    return node.priority === filterPriority;
  });

  // ── Compact Mode ─────────────────────────────────────────────────────────
  if (compact) {
    const compactChildren = children.slice(0, 3);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-th-heading">Root Cause Analysis</h3>
            <p className="text-[10px] text-th-muted mt-0.5">Top 3 drivers • <span className="tabular-nums">{root.value}</span> identified • Click to investigate</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="material-symbols-outlined text-sm">troubleshoot</span>
            Diagnostic AI
          </span>
        </div>

        <div
          className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-500/8 transition-colors"
          onClick={() => navigate('/claims-analytics')}
        >
          <span className="material-symbols-outlined text-blue-400 text-xl">{root.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-th-heading">{root.label}: <span className="tabular-nums">{root.value}</span></p>
            <p className="text-[10px] text-th-muted tabular-nums">{root.claims?.toLocaleString()} claims • This period</p>
          </div>
          <span className="material-symbols-outlined text-th-muted text-base">chevron_right</span>
        </div>

        <div className="flex flex-col gap-2">
          {compactChildren.map((node) => (
            <L1CompactCard key={node.id} node={node} navigate={navigate} />
          ))}
        </div>
      </div>
    );
  }

  // ── Full Mode ─────────────────────────────────────────────────────────────
  const filterPills = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-th-heading text-xl font-bold">AI Root Cause Analysis Engine</h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="material-symbols-outlined text-sm">psychology</span>
            Diagnostic AI
          </span>
          {summary.pattern_count > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-th-surface-overlay text-th-muted border border-th-border tabular-nums">
              <span className="material-symbols-outlined text-sm">hub</span>
              {summary.pattern_count.toLocaleString()} patterns
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/claims-analytics')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-th-border hover:border-blue-500/50 hover:bg-blue-500/5 text-th-secondary hover:text-blue-400 text-xs font-semibold transition-all"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-th-surface-overlay border border-th-border">
            {filterPills.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  filterPriority === p
                    ? 'bg-th-surface-raised text-th-heading shadow-sm border border-th-border'
                    : 'text-th-muted hover:text-th-secondary'
                }`}
              >
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-th-muted text-xs mb-6">
        Identify → Analyze → Act — Click any node to drill down to claim-level details
      </p>

      {/* Root node */}
      <div
        className="flex items-center gap-4 p-5 bg-blue-500/5 border-2 border-blue-500/30 rounded-2xl cursor-pointer hover:bg-blue-500/8 hover:border-blue-500/50 transition-all duration-200 mb-0 mx-auto max-w-xl"
        onClick={() => navigate('/claims-analytics')}
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-blue-400 text-2xl">{root.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-th-heading tabular-nums">{root.value}</span>
            <span className="text-xs text-th-muted tabular-nums">{root.claims?.toLocaleString()} claims</span>
          </div>
          <p className="text-sm font-bold text-th-heading">{root.label}</p>
          <p className="text-[11px] text-th-muted leading-snug">{root.description}</p>
        </div>
        <span className="material-symbols-outlined text-blue-400/60 text-2xl shrink-0">account_tree</span>
      </div>

      {/* Connector */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-th-border" />
      </div>
      <div className="relative">
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-th-border" />
      </div>

      {/* L1 nodes grid */}
      <div
        className="grid gap-4 pt-0"
        style={{ gridTemplateColumns: `repeat(${Math.min(filteredChildren.length, 5)}, minmax(0, 1fr))` }}
      >
        {filteredChildren.map((node) => (
          <L1NodeCard
            key={node.id}
            node={node}
            expanded={expandedNodes.has(node.id)}
            onToggle={() => toggleNode(node.id)}
            navigate={navigate}
          />
        ))}
      </div>

      {filteredChildren.length === 0 && (
        <div className="py-12 text-center text-th-muted text-sm">
          No nodes match the selected filter.
        </div>
      )}

      {/* Summary row */}
      <div className="mt-8 pt-5 border-t border-th-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-th-muted">Total Identified: </span>
            <span className="font-bold text-th-heading tabular-nums">{summary.total_identified}</span>
          </div>
          <div>
            <span className="text-th-muted">Immediately Actionable: </span>
            <span className="font-bold text-emerald-400 tabular-nums">{summary.immediately_actionable}</span>
            <span className="text-th-muted tabular-nums"> ({summary.actionable_pct}%)</span>
          </div>
          <div>
            <span className="text-th-muted">AI Confidence: </span>
            <span className="font-bold text-blue-400 tabular-nums">{summary.avg_confidence}% avg</span>
          </div>
        </div>
        <button
          onClick={() => navigate('/claims-analytics')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-blue-500/20"
        >
          <span className="material-symbols-outlined text-sm">auto_awesome</span>
          Run Full Analysis →
        </button>
      </div>
    </div>
  );
}
