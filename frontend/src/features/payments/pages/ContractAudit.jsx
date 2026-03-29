import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

export function ContractAudit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [underpayments, setUnderpayments] = useState(null);
  const [triangulation, setTriangulation] = useState(null);
  const [sortField, setSortField] = useState('variance');
  const [sortDir, setSortDir] = useState('desc');
  const [payerFilter, setPayerFilter] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [under, tri] = await Promise.all([
          api.payments.getSilentUnderpayments(),
          api.payments.getTriangulationSummary(),
        ]);
        setUnderpayments(under);
        setTriangulation(tri);
      } catch (err) {
        console.error('ContractAudit load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Compute stats — API returns { underpayments: [...], total_underpaid_amount, underpayment_count }
  const items = underpayments?.underpayments || underpayments?.items || [];
  const totalUnderpaid = underpayments?.total_underpaid_amount || items.reduce((s, i) => s + (i.underpaid_amount || i.variance || 0), 0);
  const underpaidItems = items.filter((i) => (i.underpaid_amount || i.variance || 0) > 0);
  const overpaidItems = items.filter((i) => (i.variance_pct || 0) < -100);  // overpaid = paid > expected
  const totalOverpaid = Math.abs(overpaidItems.reduce((s, i) => s + (i.underpaid_amount || i.variance || 0), 0));
  const totalVariance = underpayments?.total_underpaid_amount || totalUnderpaid;
  const complianceRate = items.length > 0
    ? ((items.filter((i) => Math.abs(i.variance || 0) < 1).length / items.length) * 100).toFixed(1)
    : '100.0';

  // Unique payers for filter
  const payers = useMemo(() => {
    const set = new Set(items.map((i) => i.payer || i.payer_name || ''));
    return [...set].filter(Boolean).sort();
  }, [items]);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    if (payerFilter) {
      filtered = filtered.filter((i) => (i.payer || i.payer_name) === payerFilter);
    }
    filtered.sort((a, b) => {
      const av = a[sortField] || 0;
      const bv = b[sortField] || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return filtered;
  }, [items, payerFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return <span className="material-symbols-outlined text-[10px] ml-0.5">{sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'}</span>;
  };

  // Payer breakdown from triangulation
  const payerBreakdown = useMemo(() => {
    const src = triangulation?.payer_breakdown || triangulation?.payers || [];
    if (!src.length) return [];
    return src.map((p) => ({
      payer: p.payer_name || p.payer,
      era: p.era_received || p.era || 0,
      forecasted: p.forecasted || 0,
      gap: p.variance || p.gap || 0,
      gap_pct: p.gap_pct || 0,
    })).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }, [triangulation]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-th-heading tracking-tight">Contract Rate Audit</h1>
            <p className="text-sm text-th-secondary">Detect underpayments and overpayments vs contracted rates</p>
          </div>
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value)}
            className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">All Payers</option>
            {payers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-rose-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Total Underpaid</p>
            <p className="text-2xl font-black text-rose-400 tabular-nums">{fmt(totalUnderpaid)}</p>
            <p className="text-[10px] text-th-muted">{underpaidItems.length} claims</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Total Overpaid</p>
            <p className="text-2xl font-black text-amber-400 tabular-nums">{fmt(totalOverpaid)}</p>
            <p className="text-[10px] text-th-muted">{overpaidItems.length} claims</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Claims Audited</p>
            <p className="text-2xl font-black text-blue-400 tabular-nums">{items.length}</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-th-muted">Compliance Rate</p>
            <p className={`text-2xl font-black tabular-nums ${parseFloat(complianceRate) > 90 ? 'text-emerald-400' : parseFloat(complianceRate) > 75 ? 'text-amber-400' : 'text-rose-400'}`}>{complianceRate}%</p>
          </div>
        </div>

        {/* Underpayment Table */}
        <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-th-border">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-th-heading">Contract Variance Detail</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{filteredItems.length} records</span>
            </div>
            <span className="text-sm font-bold text-rose-400 tabular-nums">Net Variance: {fmt(totalVariance)}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('claim_id')}>
                    Claim ID <SortIcon field="claim_id" />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('payer')}>
                    Payer <SortIcon field="payer" />
                  </th>
                  <th className="px-4 py-3">CPT Code</th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('expected')}>
                    Expected <SortIcon field="expected" />
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('actual')}>
                    Actual Paid <SortIcon field="actual" />
                  </th>
                  <th className="px-4 py-3 text-right cursor-pointer select-none" onClick={() => handleSort('variance')}>
                    Variance <SortIcon field="variance" />
                  </th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((row, i) => {
                  const isUnderpaid = (row.variance || 0) > 0;
                  const isOverpaid = (row.variance || 0) < 0;
                  return (
                    <tr key={i} className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-primary cursor-pointer hover:underline" onClick={() => row.claim_id && navigate(`/denials/claim/${row.claim_id}`)}>
                        {row.claim_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-th-heading font-medium">{row.payer || row.payer_name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-th-secondary">{row.cpt || row.cpt_code}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading font-bold tabular-nums">${row.expected?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">${row.actual?.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold tabular-nums ${isUnderpaid ? 'text-rose-400' : isOverpaid ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isUnderpaid ? '-' : isOverpaid ? '+' : ''}${Math.abs(row.variance || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isUnderpaid ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          isOverpaid ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {row.status || (isUnderpaid ? 'Underpaid' : isOverpaid ? 'Overpaid' : 'Compliant')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-th-muted text-sm">No contract variances detected.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overpayment Alerts */}
        {overpaidItems.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-lg text-amber-400">gpp_maybe</span>
              <h3 className="text-sm font-bold text-th-heading">Overpayment Compliance Alerts</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">{overpaidItems.length} alerts</span>
            </div>
            <p className="text-xs text-th-secondary mb-3">These claims were paid above contracted rates. Review for potential refund obligations.</p>
            <div className="space-y-2">
              {overpaidItems.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-th-surface-overlay hover:bg-th-surface-overlay/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-primary">{item.claim_id}</span>
                    <span className="text-sm text-th-heading font-medium">{item.payer || item.payer_name}</span>
                    <span className="text-xs text-th-muted font-mono">{item.cpt || item.cpt_code}</span>
                  </div>
                  <span className="text-sm font-bold text-amber-400 tabular-nums">+${Math.abs(item.variance || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract Rate Coverage */}
        {payerBreakdown.length > 0 && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-th-heading mb-4">Contract Rate Coverage by Payer</h3>
            <p className="text-xs text-th-secondary mb-4">Payer variance from forecasted contract amounts (gap analysis)</p>
            <div className="space-y-3">
              {payerBreakdown.slice(0, 15).map((p) => {
                const maxGap = Math.max(...payerBreakdown.map(x => Math.abs(x.gap)), 1);
                return (
                  <div key={p.payer} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-th-heading w-40 truncate">{p.payer}</span>
                    <div className="flex-1 h-3 bg-th-surface-overlay rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${p.gap_pct > 10 ? 'bg-rose-500' : p.gap_pct > 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(Math.abs(p.gap) / maxGap) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-th-heading tabular-nums w-16 text-right">{fmt(Math.abs(p.gap))}</span>
                    <span className={`text-xs font-bold tabular-nums w-12 text-right ${p.gap_pct > 10 ? 'text-rose-400' : p.gap_pct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>{p.gap_pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && payerBreakdown.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-th-muted gap-2">
            <span className="material-symbols-outlined text-4xl">verified</span>
            <p className="text-sm">No contract rate variances detected. All payments compliant.</p>
          </div>
        )}

      </div>
    </div>
  );
}
