import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';

const fmt = (n) => {
  if (n == null) return '$0';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
};

export function PayerPaymentIntelligence() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [triangulation, setTriangulation] = useState(null);
  const [adtpData, setAdtpData] = useState(null);
  const [floatData, setFloatData] = useState([]);
  const [underpayments, setUnderpayments] = useState(null);
  const [selectedPayer, setSelectedPayer] = useState(searchParams.get('payer') || '');
  const [payerTriDetail, setPayerTriDetail] = useState(null);
  const [loadingPayer, setLoadingPayer] = useState(false);
  const [payerDiagnostic, setPayerDiagnostic] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [tri, adtp, fl, under] = await Promise.all([
          api.payments.getTriangulationSummary(),
          api.payments.getADTP(),
          api.payments.getFloatAnalysis(),
          api.payments.getSilentUnderpayments(),
        ]);
        setTriangulation(tri);
        setAdtpData(adtp);
        setFloatData(fl || []);
        setUnderpayments(under);
      } catch (err) {
        console.error('PayerProfiles load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load payer-specific detail when selected
  useEffect(() => {
    if (!selectedPayer) {
      setPayerTriDetail(null);
      setPayerDiagnostic(null);
      return;
    }
    async function loadPayer() {
      setLoadingPayer(true);
      try {
        const [detail, diag] = await Promise.all([
          api.payments.getTriangulationPayer(selectedPayer),
          api.diagnostics.getPayerDiagnostic(selectedPayer).catch(() => null),
        ]);
        setPayerTriDetail(detail);
        setPayerDiagnostic(diag);
      } catch {
        setPayerTriDetail(null);
        setPayerDiagnostic(null);
      } finally {
        setLoadingPayer(false);
      }
    }
    loadPayer();
  }, [selectedPayer]);

  // Build payer list from triangulation
  const payerList = useMemo(() => {
    const src = triangulation?.payer_breakdown || triangulation?.payers || [];
    if (!src.length) return [];
    return src.map((p) => ({
      id: p.payer_id || p.payer,
      name: p.payer_name || p.payer || p.payer_id,
      era: p.era_received || p.era || 0,
      bank: p.bank_deposited || p.bank || 0,
      forecasted: p.forecasted || 0,
      gap: p.variance || p.gap || 0,
      gap_pct: p.gap_pct || (p.era_received ? ((p.variance || 0) / p.era_received * 100).toFixed(1) : 0),
    })).sort((a, b) => b.era - a.era);
  }, [triangulation]);

  // Selected payer data
  const selectedPayerInfo = useMemo(() => {
    if (!selectedPayer) return null;
    return payerList.find(
      (p) => p.id === selectedPayer || p.name === selectedPayer
    );
  }, [selectedPayer, payerList]);

  // ADTP for selected payer
  const payerADTP = useMemo(() => {
    if (!selectedPayer || !adtpData?.payers) return null;
    return adtpData.payers.find(
      (p) => p.payer_id === selectedPayer || p.payer_name === selectedPayer
    );
  }, [selectedPayer, adtpData]);

  // Float for selected payer
  const payerFloat = useMemo(() => {
    if (!selectedPayer || !floatData?.length) return null;
    return (Array.isArray(floatData) ? floatData : []).find(
      (f) => f.payer_id === selectedPayer || f.payer === selectedPayer
    );
  }, [selectedPayer, floatData]);

  // Underpayments for selected payer
  const payerUnderpayments = useMemo(() => {
    if (!selectedPayer || !underpayments?.items) return [];
    return underpayments.items.filter(
      (u) => u.payer_id === selectedPayer || u.payer === selectedPayer
    );
  }, [selectedPayer, underpayments]);

  const handleSelectPayer = (payerId) => {
    setSelectedPayer(payerId);
    setSearchParams({ payer: payerId });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-th-muted">
        <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (payerList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-th-muted gap-2">
        <span className="material-symbols-outlined text-4xl">info</span>
        <p className="text-sm">No payer data available.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto font-sans h-full">
      <div className="p-6 max-w-[1600px] mx-auto w-full">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-black text-th-heading tracking-tight">Payer Payment Profiles</h1>
            <p className="text-sm text-th-secondary">Per-payer deep dive: triangulation, ADTP, underpayments</p>
          </div>
          {/* Payer Selector */}
          <select
            value={selectedPayer}
            onChange={(e) => handleSelectPayer(e.target.value)}
            className="h-10 px-4 text-sm font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer min-w-[240px]"
          >
            <option value="">Select a payer...</option>
            {payerList.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Payer List (when no payer selected) */}
        {!selectedPayer && (
          <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-th-border">
              <h3 className="text-sm font-bold text-th-heading">All Payers ({payerList.length})</h3>
              <p className="text-xs text-th-muted mt-0.5">Click a payer to see detailed profile</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Payer</th>
                    <th className="px-4 py-3 text-right">ERA Amount</th>
                    <th className="px-4 py-3 text-right">Bank Deposit</th>
                    <th className="px-4 py-3 text-right">Gap</th>
                    <th className="px-4 py-3 text-right">Gap %</th>
                  </tr>
                </thead>
                <tbody>
                  {payerList.map((p, i) => (
                    <tr
                      key={p.id}
                      onClick={() => handleSelectPayer(p.id)}
                      className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-xs font-bold text-th-muted">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-bold text-th-heading">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading font-bold tabular-nums">{fmt(p.era)}</td>
                      <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(p.bank)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-rose-400 tabular-nums">{fmt(p.gap)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold tabular-nums ${p.gap_pct > 10 ? 'text-rose-400 bg-rose-500/10' : p.gap_pct > 5 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                          {p.gap_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selected Payer Detail */}
        {selectedPayer && (
          <div className="space-y-6">

            {/* Back Button */}
            <button
              onClick={() => { setSelectedPayer(''); setSearchParams({}); }}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to all payers
            </button>

            {/* Payer Profile Card */}
            <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-th-heading">{selectedPayerInfo?.name || selectedPayer}</h2>
                  <p className="text-sm text-th-secondary mt-1">Payer ID: {selectedPayer}</p>
                </div>
                <div className="flex gap-3">
                  {payerADTP && (
                    <div className={`px-4 py-2 rounded-lg border ${(payerADTP.current_adtp || payerADTP.adtp || 0) > 30 ? 'border-rose-500/30 bg-rose-500/10' : 'border-emerald-500/30 bg-emerald-500/10'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">ADTP</p>
                      <p className={`text-lg font-black tabular-nums ${(payerADTP.current_adtp || payerADTP.adtp || 0) > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(payerADTP.current_adtp || payerADTP.adtp || 0).toFixed(1)}d
                      </p>
                    </div>
                  )}
                  {payerFloat && (
                    <div className={`px-4 py-2 rounded-lg border ${payerFloat.avg_float_days > 5 ? 'border-amber-500/30 bg-amber-500/10' : 'border-blue-500/30 bg-blue-500/10'}`}>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Float Days</p>
                      <p className={`text-lg font-black tabular-nums ${payerFloat.avg_float_days > 5 ? 'text-amber-400' : 'text-blue-400'}`}>
                        {payerFloat.avg_float_days}d
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payer KPI Row */}
              {selectedPayerInfo && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                  <div className="p-3 rounded-lg bg-th-surface-overlay">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">ERA Amount</p>
                    <p className="text-lg font-black text-emerald-400 tabular-nums">{fmt(selectedPayerInfo.era)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-th-surface-overlay">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Bank Deposit</p>
                    <p className="text-lg font-black text-blue-400 tabular-nums">{fmt(selectedPayerInfo.bank)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-th-surface-overlay">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Forecasted</p>
                    <p className="text-lg font-black text-purple-400 tabular-nums">{fmt(selectedPayerInfo.forecasted)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-th-surface-overlay">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Gap</p>
                    <p className="text-lg font-black text-rose-400 tabular-nums">{fmt(selectedPayerInfo.gap)} ({selectedPayerInfo.gap_pct}%)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payer Diagnostic Findings */}
            {payerDiagnostic && (payerDiagnostic.findings?.length > 0 || payerDiagnostic.diagnostics?.length > 0) && (
              <div className="bg-gradient-to-r from-purple-900/20 via-th-surface-raised to-th-surface-raised border border-purple-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-purple-400 text-lg">diagnosis</span>
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">Payer Diagnostic</h3>
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
                    {(payerDiagnostic.findings || payerDiagnostic.diagnostics || []).length} findings
                  </span>
                </div>
                <div className="space-y-2">
                  {(payerDiagnostic.findings || payerDiagnostic.diagnostics || []).slice(0, 5).map((f, i) => {
                    const sev = (f.severity || 'INFO').toUpperCase();
                    const sevColor = sev === 'CRITICAL' ? 'text-rose-400' : sev === 'WARNING' ? 'text-amber-400' : 'text-blue-400';
                    const sevIcon = sev === 'CRITICAL' ? 'error' : sev === 'WARNING' ? 'warning' : 'info';
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-th-surface-overlay/30 border border-th-border">
                        <span className={`material-symbols-outlined ${sevColor} text-base mt-0.5 shrink-0`}>{sevIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-th-heading">{f.title || f.finding || f.description || 'Diagnostic finding'}</p>
                          <p className="text-[10px] text-th-muted mt-0.5">{f.detail || f.description || ''}</p>
                        </div>
                        {f.impact && <span className="text-xs font-bold text-rose-400 tabular-nums shrink-0">{fmt(f.impact)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payer Triangulation Detail */}
            {loadingPayer ? (
              <div className="flex items-center justify-center py-12 text-th-muted">
                <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
              </div>
            ) : payerTriDetail ? (
              <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-th-border">
                  <h3 className="text-sm font-bold text-th-heading">Payer Triangulation (Weekly Breakdown)</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20">Diagnostic</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                        <th className="px-4 py-3">Week</th>
                        <th className="px-4 py-3 text-right">Forecasted</th>
                        <th className="px-4 py-3 text-right">ERA</th>
                        <th className="px-4 py-3 text-right">Bank</th>
                        <th className="px-4 py-3 text-right">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payerTriDetail.weeks || payerTriDetail.data || []).map((w, i) => (
                        <tr key={i} className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-th-heading font-medium">{w.week || w.period || `Week ${i + 1}`}</td>
                          <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(w.forecasted || 0)}</td>
                          <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(w.era || 0)}</td>
                          <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">{fmt(w.bank || 0)}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-rose-400 tabular-nums">{fmt(w.gap || 0)}</td>
                        </tr>
                      ))}
                      {(payerTriDetail.weeks || payerTriDetail.data || []).length === 0 && (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-sm text-th-muted">No weekly breakdown available for this payer.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* ADTP Detail */}
            {payerADTP && (
              <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
                <h3 className="text-sm font-bold text-th-heading mb-4">ADTP Detail</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-th-surface-overlay">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Current ADTP</p>
                    <p className="text-lg font-black text-th-heading tabular-nums">{(payerADTP.current_adtp || payerADTP.adtp || 0).toFixed(1)} days</p>
                  </div>
                  {payerADTP.expected_adtp != null && (
                    <div className="p-3 rounded-lg bg-th-surface-overlay">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Expected ADTP</p>
                      <p className="text-lg font-black text-th-heading tabular-nums">{payerADTP.expected_adtp.toFixed(1)} days</p>
                    </div>
                  )}
                  {payerADTP.historical_avg != null && (
                    <div className="p-3 rounded-lg bg-th-surface-overlay">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Historical Avg</p>
                      <p className="text-lg font-black text-th-heading tabular-nums">{payerADTP.historical_avg.toFixed(1)} days</p>
                    </div>
                  )}
                  {payerADTP.anomaly != null && (
                    <div className="p-3 rounded-lg bg-th-surface-overlay">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Anomaly</p>
                      <p className={`text-lg font-black ${payerADTP.anomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {payerADTP.anomaly ? 'Flagged' : 'Normal'}
                      </p>
                    </div>
                  )}
                  {payerADTP.claim_count != null && (
                    <div className="p-3 rounded-lg bg-th-surface-overlay">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Claims Analyzed</p>
                      <p className="text-lg font-black text-th-heading tabular-nums">{payerADTP.claim_count}</p>
                    </div>
                  )}
                  {payerADTP.total_paid != null && (
                    <div className="p-3 rounded-lg bg-th-surface-overlay">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted">Total Paid</p>
                      <p className="text-lg font-black text-th-heading tabular-nums">{fmt(payerADTP.total_paid)}</p>
                    </div>
                  )}
                </div>
                {/* Rolling ADTP Chart (text-based) */}
                {payerADTP.rolling && payerADTP.rolling.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-th-muted mb-3 uppercase tracking-wider">Rolling ADTP Trend</p>
                    <div className="space-y-2">
                      {payerADTP.rolling.slice(-8).map((r, i) => {
                        const maxVal = Math.max(...payerADTP.rolling.map(x => x.adtp || x.value || 0), 1);
                        const val = r.adtp || r.value || 0;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-th-muted w-20 truncate">{r.period || r.week}</span>
                            <div className="flex-1 h-2.5 bg-th-surface-overlay rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${val > 30 ? 'bg-rose-500' : val > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(val / maxVal) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-th-heading tabular-nums w-12 text-right">{val.toFixed(1)}d</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Underpayments for this payer */}
            {payerUnderpayments.length > 0 && (
              <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-th-border">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-th-heading">Silent Underpayments</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">{payerUnderpayments.length} detected</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-th-border text-xs font-bold uppercase tracking-wider text-th-muted">
                        <th className="px-4 py-3">Claim ID</th>
                        <th className="px-4 py-3">CPT</th>
                        <th className="px-4 py-3 text-right">Expected</th>
                        <th className="px-4 py-3 text-right">Actual</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payerUnderpayments.map((row, i) => (
                        <tr key={i} className="border-b border-th-border/30 hover:bg-th-surface-overlay/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-primary">{row.claim_id}</td>
                          <td className="px-4 py-3 text-sm font-mono text-th-secondary">{row.cpt}</td>
                          <td className="px-4 py-3 text-sm text-right text-th-heading font-bold tabular-nums">${row.expected?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-th-heading tabular-nums">${row.actual?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-rose-400 tabular-nums">-${row.variance?.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
