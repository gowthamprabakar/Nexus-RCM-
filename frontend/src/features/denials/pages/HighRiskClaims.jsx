import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../../services/api';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { AIInsightCard, ConfidenceBar, DateRangePicker, FilterChip, FilterChipGroup } from '../../../components/ui';

export function HighRiskClaims() {
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();

 // State
 const [claims, setClaims] = useState([]);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [sortConfig, setSortConfig] = useState({ key: 'crsScore', direction: 'asc' });
 const [filterPayer, setFilterPayer] = useState('all');
 const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'all');
 const [expandedRows, setExpandedRows] = useState(new Set());
 const [hrRiskThreshold, setHrRiskThreshold] = useState('all');
 const [hrDateRange, setHrDateRange] = useState(null);
 const [appealModal, setAppealModal] = useState(null);   // { claim, letter, loading }
 const [preventionAlerts, setPreventionAlerts] = useState(null);
 const [diagnosticFindings, setDiagnosticFindings] = useState(null);

 const handleDraftAppeal = async (claim) => {
   setAppealModal({ claim, letter: '', loading: true });
   const result = await api.ai.draftAppeal({ claim_id: claim.id, patient_name: claim.patient, payer_name: claim.payer, billed_amount: claim.amount });
   setAppealModal({ claim, letter: result?.appeal_letter || 'Unable to generate appeal. Please try again.', loading: false });
 };

 useEffect(() => {
   async function load() {
     setLoading(true);
     const data = await api.crs.getHighRisk({ page: 1, size: 100 });
     setClaims(data.items || []);
     setTotal(data.total || 0);
     setLoading(false);
   }
   load();
   // Load prevention alerts (non-blocking)
   api.prevention.scan(10).catch(() => null).then(data => {
     if (data) setPreventionAlerts(data);
   });
   // Load diagnostics (non-blocking)
   api.diagnostics.getFindings({ category: 'DENIAL_PATTERN', severity: 'critical' }).then(d => setDiagnosticFindings(d)).catch(() => null);
 }, []);

 useEffect(() => {
 const categoryParam = searchParams.get('category');
 if (categoryParam) {
 setFilterCategory(categoryParam);
 }
 }, [searchParams]);

 const toggleRowCheck = (id) => {
 const newExpanded = new Set(expandedRows);
 if (newExpanded.has(id)) {
 newExpanded.delete(id);
 } else {
 newExpanded.add(id);
 }
 setExpandedRows(newExpanded);
 };

 const uniquePayers = [...new Set(claims.map(c => c.payer))];

 // Filter Logic — uses live API fields: id, patient, payer, crsScore, denialRisk, amount
 const filteredClaims = claims.filter(claim => {
 const matchesSearch =
 (claim.patient || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (claim.id || '').toLowerCase().includes(searchTerm.toLowerCase());
 const matchesPayer = filterPayer === 'all' || claim.payer === filterPayer;
 const matchesCategory = filterCategory === 'all'; // category filter from live API

 const matchesRiskThreshold =
 hrRiskThreshold === 'all' ||
 (hrRiskThreshold === 'critical' && claim.denialRisk > 70) ||
 (hrRiskThreshold === 'high' && claim.denialRisk > 50) ||
 (hrRiskThreshold === 'medium' && claim.denialRisk > 30);

 return matchesSearch && matchesPayer && matchesCategory && matchesRiskThreshold;
 });

 // Sort Logic
 const sortedClaims = [...filteredClaims].sort((a, b) => {
 if (a[sortConfig.key] < b[sortConfig.key]) {
 return sortConfig.direction === 'asc' ? -1 : 1;
 }
 if (a[sortConfig.key] > b[sortConfig.key]) {
 return sortConfig.direction === 'asc' ? 1 : -1;
 }
 return 0;
 });

 const handleSort = (key) => {
 let direction = 'asc';
 if (sortConfig.key === key && sortConfig.direction === 'asc') {
 direction = 'desc';
 }
 setSortConfig({ key, direction });
 };

 const getSortIcon = (key) => {
 if (sortConfig.key !== key) return 'unfold_more';
 return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
 };

 return (
 <>
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

 {/* Action Bar */}
 <div className="flex flex-wrap justify-between items-center gap-4">
 <div className="flex items-center gap-3">
 <span className="ai-predictive">Predictive AI</span>
 <span className="ai-prescriptive">Prescriptive AI</span>
 <span className="text-th-secondary text-sm">Pre-submission claims flagged for potential denial</span>
 {diagnosticFindings?.findings?.length > 0 && (
   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
     <span className="material-symbols-outlined text-xs">biotech</span>
     {diagnosticFindings.findings.length} critical patterns detected
   </span>
 )}
 </div>
 </div>

 {/* ── Enhanced Filters ────────────────────────────────────────── */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-4">
 <div className="flex flex-wrap gap-3 items-center mb-3">
 <div className="relative flex-1 min-w-[200px]">
 <span className="material-symbols-outlined absolute left-3 top-2.5 text-th-secondary text-sm">search</span>
 <input
 type="text"
 placeholder="Search by Patient, ID, or Reason..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 bg-th-surface-overlay border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-th-heading placeholder:text-th-muted"
 />
 </div>
 <DateRangePicker
 value={hrDateRange}
 onChange={setHrDateRange}
 placeholder="Service Date Range"
 className="h-9"
 />
 <select
 value={filterPayer}
 onChange={(e) => setFilterPayer(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="all">All Payers</option>
 {uniquePayers.map(payer => (
 <option key={payer} value={payer}>{payer}</option>
 ))}
 </select>
 <select
 value={hrRiskThreshold}
 onChange={(e) => setHrRiskThreshold(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="all">Risk Score: All</option>
 <option value="critical">&gt;90 (Critical)</option>
 <option value="high">&gt;75 (High)</option>
 <option value="medium">&gt;60 (Medium)</option>
 </select>
 <select
 value={filterCategory}
 onChange={(e) => setFilterCategory(e.target.value)}
 className="h-9 px-3 text-xs font-bold rounded-lg border border-th-border bg-th-surface-overlay text-th-heading focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
 >
 <option value="all">All Categories</option>
 </select>
 </div>
 <FilterChipGroup
 filters={[
 ...(filterPayer !== 'all' ? [{ key: 'payer', label: 'Payer', value: filterPayer, color: 'blue' }] : []),
 ...(hrRiskThreshold !== 'all' ? [{ key: 'risk', label: 'Risk', value: hrRiskThreshold, color: 'amber' }] : []),
 ]}
 onRemove={(key) => {
 if (key === 'payer') setFilterPayer('all');
 if (key === 'risk') setHrRiskThreshold('all');
 }}
 onClearAll={() => { setFilterPayer('all'); setHrRiskThreshold('all'); }}
 />
 </div>

 {/* ── Prevention Alerts (Pre-Submission) ───────────────────────── */}
 {preventionAlerts && (preventionAlerts.items?.length > 0 || preventionAlerts.total > 0) && (() => {
   const alertItems = preventionAlerts.items || preventionAlerts.alerts || [];
   const alertCount = preventionAlerts.total || alertItems.length;
   const totalAtRisk = alertItems.reduce((s, a) => s + (a.amount || a.billed_amount || a.at_risk || 0), 0);
   return (
     <div className="bg-gradient-to-r from-amber-900/20 to-th-surface-raised border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
       <div className="flex items-center gap-3">
         <span className="material-symbols-outlined text-amber-400 text-lg">shield</span>
         <div>
           <span className="text-th-heading text-sm font-bold">Prevention AI: </span>
           <span className="text-amber-400 font-black">{alertCount} claims</span>
           <span className="text-th-heading text-sm font-bold"> flagged pre-submission — </span>
           <span className="text-amber-400 font-black">${totalAtRisk.toLocaleString()}</span>
           <span className="text-th-heading text-sm font-bold"> at risk</span>
         </div>
       </div>
       <div className="flex items-center gap-2">
         <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
           Pre-Submission
         </span>
         <span className="text-th-muted text-[10px]">Complements CRS at-submission flags</span>
       </div>
     </div>
   );
 })()}

 {/* ── AI Risk Summary Bar ───────────────────────────────────────── */}
 <div className="bg-gradient-to-r from-red-900/20 to-th-surface-raised border border-red-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className="material-icons text-red-400 text-lg">warning</span>
 <div>
 <span className="text-th-heading text-sm font-bold">AI has identified </span>
 <span className="text-red-400 font-black tabular-nums">{total} high-risk claims</span>
 <span className="text-th-heading text-sm font-bold"> with CRS score &lt; 60 — pre-submission intervention required</span>
 </div>
 </div>
 <div className="flex items-center gap-3 min-w-[240px]">
 <span className="text-th-muted text-xs whitespace-nowrap">Overall portfolio risk:</span>
 <div className="flex-1">
 <ConfidenceBar score={73} label="Portfolio Risk" size="sm" showBar={true} showLabel={true} />
 </div>
 </div>
 </div>

 {/* ── AI Insights ──────────────────────────────────────────────── */}
 <div>
 <div className="flex items-center gap-2 mb-3">
 <span className="material-icons text-purple-400 text-base">auto_awesome</span>
 <span className="text-th-secondary text-xs font-semibold uppercase tracking-wider">AI Intelligence</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
 <AIInsightCard
 title="High-Risk Cluster: Spine Surgery"
 description="14 lumbar fusion claims ($480K) show 87% denial probability based on payer LCD changes. Pre-emptive peer-to-peer review recommended."
 confidence={87}
 impact="high"
 category="Predictive"
 action="Schedule P2P reviews"
 value="$480K at risk"
 icon="warning"
 />
 <AIInsightCard
 title="Duplicate Submission Risk"
 description="AI detected 8 claim pairs with matching patient + DOS + CPT. Auto-hold activated. Manual review required before re-submission."
 confidence={99}
 impact="high"
 category="Diagnostic"
 action="Review duplicate pairs"
 value="8 duplicate pairs"
 icon="content_copy"
 />
 </div>
 </div>

 {/* Claims Table */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-th-surface-overlay/50 text-xs font-semibold uppercase tracking-wider text-th-muted">
 <th className="px-6 py-4 w-10"></th>
 <th className="px-6 py-4 cursor-pointer hover:bg-th-surface-overlay transition-colors" onClick={() => handleSort('id')}>
 <div className="flex items-center gap-1">Claim ID / Patient <span className="material-symbols-outlined text-sm">{getSortIcon('id')}</span></div>
 </th>
 <th className="px-6 py-4 cursor-pointer hover:bg-th-surface-overlay transition-colors" onClick={() => handleSort('serviceDate')}>
 <div className="flex items-center gap-1">Service Date <span className="material-symbols-outlined text-sm">{getSortIcon('serviceDate')}</span></div>
 </th>
 <th className="px-6 py-4 cursor-pointer hover:bg-th-surface-overlay transition-colors" onClick={() => handleSort('payer')}>
 <div className="flex items-center gap-1">Payer <span className="material-symbols-outlined text-sm">{getSortIcon('payer')}</span></div>
 </th>
 <th className="px-6 py-4">Category</th>
 <th className="px-6 py-4 cursor-pointer hover:bg-th-surface-overlay transition-colors" onClick={() => handleSort('riskScore')}>
 <div className="flex items-center gap-1">Predicted Risk <span className="material-symbols-outlined text-sm">{getSortIcon('riskScore')}</span></div>
 </th>
 <th className="px-6 py-4 text-right cursor-pointer hover:bg-th-surface-overlay transition-colors" onClick={() => handleSort('amount')}>
 <div className="flex items-center justify-end gap-1">Value <span className="material-symbols-outlined text-sm">{getSortIcon('amount')}</span></div>
 </th>
 <th className="px-6 py-4"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/50">
 {sortedClaims.map(claim => (
 <React.Fragment key={claim.id}>
 <tr className={`hover:bg-th-surface-overlay/50 transition-colors group ${expandedRows.has(claim.id) ? 'bg-th-surface-overlay/50' : ''}`}>
 <td className="px-6 py-4 text-center">
 <button
 onClick={() => toggleRowCheck(claim.id)}
 className="w-6 h-6 rounded flex items-center justify-center text-th-secondary hover:text-primary transition-colors"
 >
 <span className="material-symbols-outlined text-lg">
 {expandedRows.has(claim.id) ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
 </span>
 </button>
 </td>
 <td className="px-6 py-4">
 <div className="font-bold text-th-heading font-mono text-xs cursor-pointer hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/analytics/denials/root-cause/claim/${claim.id}`); }}>{claim.id}</div>
 <div className="text-xs text-th-muted">{claim.patient}</div>
 </td>
 <td className="px-6 py-4 text-sm text-th-secondary whitespace-nowrap">
 {claim.dos}
 </td>
 <td className="px-6 py-4 text-sm text-th-secondary">
 {claim.payer}
 </td>
 <td className="px-6 py-4">
 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/20 text-red-400">
 CRS: {claim.crsScore}
 </span>
 </td>
 <td className="px-6 py-4">
 <RiskScoreBadge score={claim.denialRisk || (100 - (claim.crsScore || 0))} />
 </td>
 <td className="px-6 py-4 text-right font-mono font-medium text-th-secondary tabular-nums">
 ${(claim.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2">
 <button
 title="Snooze"
 className="p-1.5 text-th-secondary hover:text-amber-400 hover:bg-amber-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
 >
 <span className="material-symbols-outlined text-lg">snooze</span>
 </button>
 <button
 title="Quick Fix"
 className="p-1.5 text-th-secondary hover:text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
 >
 <span className="material-symbols-outlined text-lg">auto_fix_high</span>
 </button>
 <button
 onClick={() => navigate(`/analytics/denials/root-cause/claim/${claim.id}`)}
 className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg transition-colors"
 >
 Analyze
 </button>
 </div>
 </td>
 </tr>
 {/* Expanded Row Content: Line Items Preview */}
 {expandedRows.has(claim.id) && (
 <tr className="bg-th-surface-overlay/30">
 <td colSpan="8" className="px-6 py-4 pl-16">
 <div className="bg-th-surface-base rounded-lg border border-th-border overflow-hidden">
 <div className="px-4 py-3 space-y-2">
 {(claim.issues || []).slice(0, 4).map((issue, idx) => (
 <div key={idx} className="flex items-start gap-3 text-xs">
 <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">error</span>
 <div>
 <span className="font-bold text-th-heading">{issue.type} — </span>
 <span className="text-th-secondary">{issue.message}</span>
 </div>
 </div>
 ))}
 </div>
 <div className="px-4 py-2 bg-th-surface-overlay/50 border-t border-th-border flex items-center justify-between">
 <span className="text-xs text-th-muted">
 <span className="ai-prescriptive">Prescriptive AI</span>
 <span className="ml-2 font-semibold text-th-heading">{claim.issueCount} issue{claim.issueCount !== 1 ? 's' : ''} flagged — resolve before submitting</span>
 </span>
 <div className="flex items-center gap-3">
 <button
 onClick={() => handleDraftAppeal(claim)}
 className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-bold hover:bg-purple-500/20 flex items-center gap-1"
 >
 <span className="material-icons" style={{fontSize:'12px'}}>auto_awesome</span>
 Draft Appeal
 </button>
 <button
 onClick={() => navigate(`/claims/pre-batch-scrub/claim/${claim.id}`)}
 className="text-xs text-primary font-bold hover:underline"
 >
 Fix Issues →
 </button>
 </div>
 </div>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 ))}
 </tbody>
 </table>
 </div>
 {/* Pagination */}
 <div className="px-6 py-4 border-t border-th-border flex justify-between items-center text-sm text-th-muted">
 <span>Showing {sortedClaims.length} items</span>
 <div className="flex gap-2">
 <button className="px-3 py-1 bg-th-surface-overlay rounded hover:bg-th-surface-overlay text-th-secondary">Previous</button>
 <button className="px-3 py-1 bg-th-surface-overlay rounded hover:bg-th-surface-overlay text-th-secondary">Next</button>
 </div>
 </div>
 </div>

 </div>

 {/* ── Appeal Draft Modal (Ollama AI) ─────────────────────── */}
 {appealModal && (
   <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
   <div className="bg-th-surface rounded-2xl border border-th-border w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
     <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
     <div className="flex items-center gap-2">
       <span className="material-icons text-purple-400">auto_awesome</span>
       <div>
       <h3 className="text-th-heading font-bold text-sm">AI Appeal Draft</h3>
       <p className="text-th-muted text-xs">Claim {appealModal.claim?.id} · {appealModal.claim?.patient}</p>
       </div>
     </div>
     <button onClick={() => setAppealModal(null)} className="text-th-muted hover:text-th-heading">
       <span className="material-icons">close</span>
     </button>
     </div>
     <div className="flex-1 overflow-y-auto px-6 py-4">
     {appealModal.loading ? (
       <div className="flex flex-col items-center justify-center h-40 gap-3">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
       <p className="text-th-muted text-sm">Ollama is drafting your appeal letter...</p>
       </div>
     ) : (
       <pre className="text-th-secondary text-xs whitespace-pre-wrap font-sans leading-relaxed">
       {appealModal.letter}
       </pre>
     )}
     </div>
     {!appealModal.loading && (
     <div className="px-6 py-4 border-t border-th-border flex gap-3 justify-end">
       <button
       onClick={() => navigator.clipboard.writeText(appealModal.letter)}
       className="px-4 py-2 text-xs bg-th-surface-overlay text-th-secondary rounded-lg hover:bg-th-border font-semibold flex items-center gap-1"
       >
       <span className="material-icons text-xs">content_copy</span>
       Copy Letter
       </button>
       <button
       onClick={() => setAppealModal(null)}
       className="px-4 py-2 text-xs bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 font-semibold"
       >
       Close
       </button>
     </div>
     )}
   </div>
   </div>
 )}
 </div>
 </>
 );
}
