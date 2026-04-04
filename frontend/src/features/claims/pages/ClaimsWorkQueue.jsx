import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { ClaimsFilterPanel } from '../components/ClaimsFilterPanel';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getSeriesColors } from '../../../lib/chartTheme';
import {
  AIInsightCard,
  DateRangePicker,
  FilterChipGroup,
} from '../../../components/ui';
import { DenialRiskBadge } from '../../../components/predictions';

const ITEMS_PER_PAGE = 25;

// Utility: resolve nested keys like "patient.name" or "payer.name"
function resolveKey(obj, key) {
  return key.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Mock Sparkline Data
const generateSparklineData = () => Array.from({ length: 10 }, (_, i) => ({ value: Math.floor(Math.random() * 50) + 20 }));

function AIBadge({ level }) {
  const styles = {
    'AI Enhanced': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'AI Priority': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'AI Monitored': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${styles[level] || styles['AI Monitored']}`}>
      <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
      {level}
    </span>
  );
}



export function ClaimsWorkQueue() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('errors');
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ payer: 'all', minValue: 0 });
  const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState(null);

  // Enhanced filter bar state
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [payerFilter, setPayerFilter] = useState('all');
  const [riskLevel, setRiskLevel] = useState('all');
  const [errorType, setErrorType] = useState('all');
  const [amountRange, setAmountRange] = useState('all');

  // AI Insights state
  const [wqAiInsights, setWqAiInsights] = useState([]);
  const [wqAiLoading, setWqAiLoading] = useState(false);
  const [crsSummary, setCrsSummary] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await api.claims.list();
        setClaims(data);
      } catch (error) {
        console.error("Failed to load claims", error);
        setFetchError(error?.message || 'Failed to load claims data');
      } finally {
        setLoading(false);
      }
    };
    fetchClaims();

    // Load AI insights (non-blocking)
    setWqAiLoading(true);
    api.ai.getInsights('claims-workqueue').then(r => {
      if (r?.insights?.length) setWqAiInsights(r.insights);
      setWqAiLoading(false);
    }).catch(() => setWqAiLoading(false));
    // Load CRS summary for KPI sparklines
    api.crs.getSummary().then(d => setCrsSummary(d)).catch(() => null);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters, sortConfig]);

  // Build active filter chips for enhanced bar
  const enhancedActiveFilters = [
    payerFilter !== 'all' && { key: 'payerFilter', label: 'Payer', value: payerFilter, color: 'blue' },
    riskLevel !== 'all' && { key: 'riskLevel', label: 'Risk', value: riskLevel, color: 'amber' },
    errorType !== 'all' && { key: 'errorType', label: 'Error Type', value: errorType, color: 'purple' },
    amountRange !== 'all' && { key: 'amountRange', label: 'Amount', value: amountRange, color: 'emerald' },
  ].filter(Boolean);

  const handleRemoveEnhancedFilter = (key) => {
    if (key === 'payerFilter') setPayerFilter('all');
    if (key === 'riskLevel') setRiskLevel('all');
    if (key === 'errorType') setErrorType('all');
    if (key === 'amountRange') setAmountRange('all');
  };

  const handleClearEnhancedFilters = () => {
    setPayerFilter('all');
    setRiskLevel('all');
    setErrorType('all');
    setAmountRange('all');
  };

  // Filter Logic with dot-notation sort key resolver
  const filteredClaims = useMemo(() => {
    let result = claims;

    if (activeTab === 'errors') {
      result = result.filter(c => c.status === 'Denied' || c.status === 'Rejected' || c.status === 'Unbilled');
    } else if (activeTab === 'ai_review') {
      result = result.filter(c => c.status === 'Submitted' && c.risk_score > 50);
    } else if (activeTab === 'clean') {
      result = result.filter(c => c.status === 'Paid' || (c.status === 'Submitted' && c.risk_score <= 50));
    }

    if (filters.payer !== 'all') result = result.filter(c => c.payer.name.includes(filters.payer));
    if (filters.minValue) result = result.filter(c => c.amount >= Number(filters.minValue));

    return [...result].sort((a, b) => {
      const aVal = resolveKey(a, sortConfig.key);
      const bVal = resolveKey(b, sortConfig.key);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [claims, activeTab, filters, sortConfig]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredClaims.length / ITEMS_PER_PAGE));
  const paginatedClaims = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClaims.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClaims, currentPage]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleAIPrioritySort = () => {
    setSortConfig({ key: 'risk_score', direction: 'desc' });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedClaims.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedClaims.map(c => c.id)));
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const handleBatchAction = () => {
    if (selectedIds.size === 0) return;
    showToast(`Batch submitted: ${selectedIds.size} claim${selectedIds.size > 1 ? 's' : ''} sent for processing.`);
    setSelectedIds(new Set());
  };

  const selectClass =
    'h-9 px-3 rounded-lg bg-th-surface-raised border border-th-border text-th-secondary text-sm font-medium ' +
    'hover:bg-th-surface-overlay hover:text-th-heading focus:outline-none focus:ring-1 focus:ring-blue-500 ' +
    'transition-all duration-200 cursor-pointer';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (fetchError && claims.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="bg-th-surface-raised border border-th-border rounded-xl p-8 max-w-md w-full text-center">
          <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-400 text-2xl">error_outline</span>
          </div>
          <h3 className="text-th-heading text-lg font-bold mb-2">Failed to Load Claims</h3>
          <p className="text-th-secondary text-sm mb-6">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-th-heading text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full text-th-heading p-6 relative">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-th-heading px-5 py-3 rounded-xl shadow-lg shadow-emerald-900/30 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span className="text-sm font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-th-heading">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <ClaimsFilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={setFilters}
      />

      {/* Header with Sparklines */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-th-heading">Work Queue</h1>
            <AIBadge level="AI Enhanced" />
          </div>
          <p className="text-th-secondary text-sm mt-1">
            Active Batch: <span className="font-mono font-bold text-primary">BATCH-2023-A</span>
          </p>
          <div className="mt-4 flex gap-2">
            <button
              disabled={selectedIds.size === 0}
              onClick={handleBatchAction}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-th-heading px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined">send</span>
              Batch Submit ({selectedIds.size})
            </button>
          </div>
        </div>

        <KPISparkline label="Queue Size" value={claims.length?.toLocaleString() || '0'} trend="" color={getSeriesColors()[1]} />
        <KPISparkline label="CRS Pass Rate" value={crsSummary?.passRate ? `${crsSummary.passRate}%` : crsSummary?.pass_rate ? `${crsSummary.pass_rate}%` : '--'} trend="" color={getSeriesColors()[2]} />
        <KPISparkline label="Auto-Fix Rate" value={crsSummary?.autoFixRate ? `${crsSummary.autoFixRate}%` : crsSummary?.auto_fix_rate ? `${crsSummary.auto_fix_rate}%` : '--'} trend="" color={getSeriesColors()[0]} />
      </div>

      {/* ── Enhanced Filter Bar ── */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 mb-6 flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={(preset) => setDateRange(preset.label)}
          />

          <select value={payerFilter} onChange={(e) => setPayerFilter(e.target.value)} className={selectClass}>
            <option value="all">All Payers</option>
            <option value="Medicare">Medicare</option>
            <option value="Medicaid">Medicaid</option>
            <option value="Commercial">Commercial</option>
          </select>

          <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={selectClass}>
            <option value="all">All Risk Levels</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select value={errorType} onChange={(e) => setErrorType(e.target.value)} className={selectClass}>
            <option value="all">All Error Types</option>
            <option value="Authorization">Authorization</option>
            <option value="Coding">Coding</option>
            <option value="Eligibility">Eligibility</option>
            <option value="Duplicate">Duplicate</option>
            <option value="Timely Filing">Timely Filing</option>
          </select>

          <select value={amountRange} onChange={(e) => setAmountRange(e.target.value)} className={selectClass}>
            <option value="all">All Amounts</option>
            <option value="<$500">&lt;$500</option>
            <option value="$500-$2K">$500–$2K</option>
            <option value="$2K-$10K">$2K–$10K</option>
            <option value=">$10K">&gt;$10K</option>
          </select>

          <button
            onClick={() => setIsFilterOpen(true)}
            className={`h-9 px-3 rounded-lg bg-th-surface-overlay text-th-heading text-sm font-bold flex items-center gap-1.5 hover:bg-th-surface-overlay transition-colors border border-th-border ${filters.payer !== 'all' ? 'ring-2 ring-primary' : ''}`}
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            More Filters {filters.payer !== 'all' && '(Active)'}
          </button>
        </div>

        {enhancedActiveFilters.length > 0 && (
          <FilterChipGroup
            filters={enhancedActiveFilters}
            onRemove={handleRemoveEnhancedFilter}
            onClearAll={handleClearEnhancedFilters}
          />
        )}
      </div>

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between border-b border-th-border mb-6 shrink-0 sticky top-0 z-20 backdrop-blur py-2">
        <div className="flex gap-8">
          <TabButton isActive={activeTab === 'errors'} onClick={() => setActiveTab('errors')} icon="error" label="Errors" count={claims.filter(c => c.status === 'Denied').length} color="text-[rgb(var(--color-danger))]" />
          <TabButton isActive={activeTab === 'ai_review'} onClick={() => setActiveTab('ai_review')} icon="auto_awesome" label="AI Review" count={claims.filter(c => c.status === 'Submitted').length} color="text-[rgb(var(--color-warning))]" />
          <TabButton isActive={activeTab === 'clean'} onClick={() => setActiveTab('clean')} icon="check_circle" label="Clean" count={claims.filter(c => c.status === 'Paid').length} color="text-[rgb(var(--color-success))]" />
        </div>
        <div className="flex gap-2 pb-3">
          <button
            onClick={handleAIPrioritySort}
            className="px-3 py-1.5 rounded bg-violet-600/20 text-violet-400 text-xs font-bold flex items-center gap-1 hover:bg-violet-600/30 transition-colors border border-violet-500/20"
          >
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            AI Priority Sort
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-th-surface-overlay/90 backdrop-blur z-10 border-b border-th-border">
              <tr>
                <th className="px-4 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-th-border-strong bg-transparent text-primary focus:ring-primary cursor-pointer"
                    checked={selectedIds.size === paginatedClaims.length && paginatedClaims.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <SortHeader label="Claim ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Patient" sortKey="patient.name" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Payer" sortKey="payer.name" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Amount" sortKey="amount" currentSort={sortConfig} onSort={handleSort} />
                <SortHeader label="Risk Score" sortKey="risk_score" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-th-secondary">Denial Risk</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-th-secondary">Insight</th>
                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-th-secondary text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-20">
                    <div className="flex flex-col items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-th-muted mb-2">inbox</span>
                      <p className="text-th-secondary font-bold">No Claims Found in Database</p>
                      <p className="text-xs text-th-muted mt-1">Submit claims via the API to see them here.</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedClaims.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-th-secondary">
                    No claims match current filters.
                  </td>
                </tr>
              ) : (
                paginatedClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className={`hover:bg-th-surface-overlay/50 transition-colors group ${selectedIds.has(claim.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-th-border-strong bg-transparent text-primary focus:ring-primary cursor-pointer"
                        checked={selectedIds.has(claim.id)}
                        onChange={() => toggleSelect(claim.id)}
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs font-bold text-primary">{claim.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-th-heading">{claim.patient.name}</div>
                      <div className="text-[10px] text-th-muted">{claim.patient.dob}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-th-heading">{claim.payer ? claim.payer.name : 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm font-bold tabular-nums">${claim.amount ? claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                    <td className="px-4 py-4">
                      <RiskTag score={claim.risk_score} />
                    </td>
                    <td className="px-4 py-4">
                      <DenialRiskBadge claimId={claim.id} compact />
                    </td>
                    <td className="px-4 py-4">
                      <SmartBadge claim={claim} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="text-th-secondary hover:text-primary transition-colors p-1 rounded hover:bg-th-surface-overlay"
                          title="Review claim"
                        >
                          <span className="material-symbols-outlined text-lg">edit_note</span>
                        </button>
                        <button
                          className="text-th-secondary hover:text-emerald-400 transition-colors p-1 rounded hover:bg-th-surface-overlay"
                          title="Approve claim"
                        >
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </button>
                        <button
                          className="text-th-secondary hover:text-rose-400 transition-colors p-1 rounded hover:bg-th-surface-overlay"
                          title="Flag claim"
                        >
                          <span className="material-symbols-outlined text-lg">flag</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredClaims.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-th-border">
            <p className="text-xs text-th-secondary">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredClaims.length)} of <span className="tabular-nums">{filteredClaims.length}</span> claims
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold transition-colors tabular-nums",
                      currentPage === pageNum
                        ? "bg-primary text-th-heading"
                        : "text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs font-bold text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI Insights ── */}
      <div className="mt-6 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-icons text-primary text-base">auto_awesome</span>
          <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wqAiLoading ? (
            [1, 2].map(i => (
              <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 w-3/4 bg-th-surface-overlay rounded" />
                <div className="h-3 w-full bg-th-surface-overlay rounded" />
                <div className="h-3 w-1/2 bg-th-surface-overlay rounded" />
              </div>
            ))
          ) : wqAiInsights.length > 0 ? (
            wqAiInsights.map((insight, i) => (
              <AIInsightCard key={i} {...insight} onClick={() => {}} />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-sm text-th-muted">
              <span className="material-symbols-outlined text-2xl mb-2 block">auto_awesome</span>
              No AI insights available. Insights will appear when the AI engine processes your claims data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function SortHeader({ label, sortKey, currentSort, onSort }) {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-th-secondary cursor-pointer hover:text-th-heading transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="material-symbols-outlined text-xs text-primary">
            {currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </div>
    </th>
  );
}

function KPISparkline({ label, value, trend, color }) {
  const data = useMemo(generateSparklineData, []);
  return (
    <div className="bg-th-surface-raised border border-th-border border-l-[3px] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200" style={{ borderLeftColor: color }}>
      <div className="z-10">
        <p className="text-th-secondary text-xs font-bold uppercase">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <h3 className="text-2xl font-black text-th-heading tabular-nums">{value}</h3>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>{trend}</span>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TabButton({ isActive, onClick, icon, label, count, color }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 pb-3 font-bold text-sm tracking-wide transition-all",
        isActive ? `border-current ${color}` : "border-transparent text-th-secondary hover:text-th-heading"
      )}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      {label}
      <span className="ml-1 bg-th-surface-overlay text-xs px-1.5 py-0.5 rounded text-th-heading border border-th-border tabular-nums">{count}</span>
    </button>
  );
}

function RiskTag({ score }) {
  const colorClass = score > 80 ? 'bg-red-500/20 text-red-400' : score > 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400';
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold tabular-nums ${colorClass}`}>
      {score}% Risk
    </span>
  );
}

function SmartBadge({ claim }) {
  if (claim.amount > 5000) return <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">High Value</span>;
  if (claim.risk_score < 20) return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Auto-Approve</span>;
  return <span className="text-[10px] font-bold text-th-muted">{claim.denial_code || '-'}</span>;
}
