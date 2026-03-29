import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

const fmtFull = (n) => `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PayerReconClaimsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const payerName = searchParams.get('payer') || 'Unknown Payer';
  const eraReceived = parseFloat(searchParams.get('era') || '0');
  const bankDeposited = parseFloat(searchParams.get('bank') || '0');
  const reconVariance = parseFloat(searchParams.get('variance') || '0');

  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const size = 25;

  useEffect(() => {
    setLoading(true);
    api.reconciliation.getPayerClaims({ payer_name: payerName, page, size })
      .then((data) => {
        setClaims(data.claims || []);
        setTotal(data.total || 0);
        setSummary(data.summary || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [payerName, page]);

  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="flex-1 flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-6 font-sans h-full overflow-y-auto">

      {/* Back Button */}
      <button
        onClick={() => navigate('/analytics/revenue/reconciliation')}
        className="flex items-center gap-2 text-sm text-th-muted hover:text-primary transition-colors w-fit"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Back to Reconciliation Center
      </button>

      {/* Payer Reconciliation Banner */}
      <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/5 border border-blue-500/30 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-th-heading tracking-tight">{payerName}</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full">
                FROM RECON
              </span>
            </div>
            <p className="text-sm text-th-secondary">Paid claims received via ERA/835 for this payer</p>
          </div>
          <div className="flex gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-th-muted">ERA Received</span>
              <span className="text-xl font-bold text-emerald-400 tabular-nums">{fmt(eraReceived)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-th-muted">Bank Deposited</span>
              <span className="text-xl font-bold text-blue-400 tabular-nums">{fmt(bankDeposited)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-th-muted">Variance</span>
              <span className={`text-xl font-bold tabular-nums ${reconVariance > 0 ? 'text-amber-400' : reconVariance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {fmt(Math.abs(reconVariance))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Claims Paid</p>
          <p className="text-2xl font-bold text-th-heading tabular-nums">{(summary.total_claims || 0).toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Charged</p>
          <p className="text-2xl font-bold text-th-heading tabular-nums">{fmt(summary.total_charged)}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Paid (ERA)</p>
          <p className="text-2xl font-bold text-emerald-400 tabular-nums">{fmt(summary.total_paid)}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Charge-to-Payment Variance</p>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{fmt(summary.total_variance)}</p>
        </div>
      </div>

      {/* Paid Claims Table */}
      <div className="flex flex-col flex-1 bg-th-surface-raised rounded-xl border border-th-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-th-border bg-[#0f1623]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500">paid</span>
            <h2 className="text-sm font-bold text-th-heading uppercase tracking-wider">Paid Claims</h2>
            <span className="text-xs text-th-muted">({total.toLocaleString()} records)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-th-muted">
            Page {page} of {totalPages}
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-th-muted">
              <span className="material-symbols-outlined text-3xl mb-2 animate-spin">sync</span>
              <p className="text-sm">Loading paid claims...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="p-12 text-center text-th-muted">
              <span className="material-symbols-outlined text-3xl mb-2">search_off</span>
              <p className="text-sm">No paid claims found for this payer</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0f1623] text-th-muted sticky top-0 uppercase text-[11px] font-bold tracking-widest border-b border-th-border">
                <tr>
                  <th className="p-3">Claim ID</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Date of Service</th>
                  <th className="p-3 text-right">Total Charges</th>
                  <th className="p-3 text-right">ERA Payment</th>
                  <th className="p-3 text-right">Allowed Amt</th>
                  <th className="p-3 text-right">CO Adj</th>
                  <th className="p-3 text-right">PR (Patient)</th>
                  <th className="p-3 text-right">Variance</th>
                  <th className="p-3">Payment Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {claims.map((c, i) => (
                  <tr
                    key={`${c.claim_id}-${i}`}
                    className="hover:bg-th-surface-overlay/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/analytics/denials/root-cause/claim/${c.claim_id}`)}
                  >
                    <td className="p-3">
                      <span className="font-bold text-primary text-sm underline decoration-primary/30">{c.claim_id}</span>
                    </td>
                    <td className="p-3 text-sm text-th-heading">{c.patient_name}</td>
                    <td className="p-3 text-sm text-th-secondary">{c.date_of_service || '--'}</td>
                    <td className="p-3 text-right font-mono text-th-heading tabular-nums">{fmtFull(c.total_charges)}</td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold tabular-nums">{fmtFull(c.payment_amount)}</td>
                    <td className="p-3 text-right font-mono text-th-secondary tabular-nums">{fmtFull(c.allowed_amount)}</td>
                    <td className="p-3 text-right font-mono text-th-secondary tabular-nums">{fmtFull(c.co_amount)}</td>
                    <td className="p-3 text-right font-mono text-th-secondary tabular-nums">{fmtFull(c.pr_amount)}</td>
                    <td className={`p-3 text-right font-mono font-bold tabular-nums ${c.variance > 100 ? 'text-amber-400' : c.variance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {fmtFull(c.variance)}
                    </td>
                    <td className="p-3 text-sm text-th-secondary">{c.payment_date || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-th-border bg-[#0f1623]">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-th-border bg-th-surface-raised text-th-heading hover:bg-th-surface-overlay disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let p;
                if (totalPages <= 5) {
                  p = idx + 1;
                } else if (page <= 3) {
                  p = idx + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + idx;
                } else {
                  p = page - 2 + idx;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'text-th-muted hover:bg-th-surface-overlay hover:text-th-heading'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-th-border bg-th-surface-raised text-th-heading hover:bg-th-surface-overlay disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
