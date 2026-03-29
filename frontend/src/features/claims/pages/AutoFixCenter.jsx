import React, { useState, useEffect } from 'react';
import { usePreBatch } from '../context/PreBatchContext';
import { FixCandidateCard } from '../components/FixCandidateCard';
import { api } from '../../../services/api';

export function AutoFixCenter() {
 const { claims, applyAutoFix } = usePreBatch();
 const [crsSummary, setCrsSummary] = useState(null);
 const [highRiskClaims, setHighRiskClaims] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [summaryResult, highRiskResult] = await Promise.all([
    api.crs.getSummary(),
    api.crs.getHighRisk({ page: 1, size: 50 }),
   ]);
   if (cancelled) return;
   setCrsSummary(summaryResult);
   setHighRiskClaims(highRiskResult?.items || []);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 // Filter for claims that have auto-fixable issues that are not yet applied
 const fixCandidates = claims.filter(c =>
 c.issues && c.issues.some(i => i.autoFixAvailable && !i.applied)
 );

 // Combine context candidates with high-risk API claims that need fixes
 const apiFixCandidates = highRiskClaims.filter(c =>
  c.issues && c.issues.some(i => i.autoFixAvailable && !i.applied)
 );

 const allCandidates = fixCandidates.length > 0 ? fixCandidates : apiFixCandidates;

 const fmt = (n) => {
  if (n == null) return '--';
  return typeof n === 'number' ? n.toLocaleString() : String(n);
 };

 return (
 <div className="h-full flex flex-col">
 <div className="bg-th-surface-raised border-b border-th-border px-6 py-6">
 <div className="flex justify-between items-end">
 <div>
 <h2 className="text-xl font-bold text-th-heading mb-2 flex items-center gap-3">
 Auto-Fix Center
 <span className="ai-prescriptive">Prescriptive AI</span>
 </h2>
 <p className="text-sm text-th-secondary">Review and approve high-confidence AI corrections.</p>
 </div>
 <div className="flex gap-4">
 <div className="text-right">
 <div className="text-2xl font-black text-th-heading tabular-nums">{allCandidates.length}</div>
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted">Candidates</div>
 </div>
 {crsSummary && (
  <>
   <div className="text-right">
    <div className="text-2xl font-black text-th-heading tabular-nums">{fmt(crsSummary.autoFixRate || crsSummary.auto_fix_rate)}%</div>
    <div className="text-xs font-semibold uppercase tracking-wider text-th-muted">Auto-Fix Rate</div>
   </div>
   <div className="text-right">
    <div className="text-2xl font-black text-emerald-400 tabular-nums">${fmt(crsSummary.denialsPreventedValue || crsSummary.denials_prevented_value || 0)}</div>
    <div className="text-xs font-semibold uppercase tracking-wider text-th-muted">Denials Prevented</div>
   </div>
  </>
 )}
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 {loading ? (
  <div className="h-full flex flex-col items-center justify-center text-th-secondary">
   <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
   <p className="text-sm text-th-muted">Loading auto-fix data...</p>
  </div>
 ) : allCandidates.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-th-secondary">
 <div className="size-20 bg-th-surface-overlay rounded-full flex items-center justify-center mb-4">
 <span className="material-symbols-outlined text-4xl">check</span>
 </div>
 <h3 className="text-lg font-bold text-th-heading">All Clean!</h3>
 <p>No auto-fix candidates remaining.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {allCandidates.map(claim => (
 <FixCandidateCard
 key={claim.id}
 claim={claim}
 onApplyFix={applyAutoFix}
 />
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
