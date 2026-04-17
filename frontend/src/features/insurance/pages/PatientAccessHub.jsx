import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function PatientAccessHub() {
 const [loading, setLoading] = useState(true);
 const [crsSummary, setCrsSummary] = useState(null);
 const [arSummary, setArSummary] = useState(null);
 const [eligibilityData, setEligibilityData] = useState(null);
 const [costEstimate, setCostEstimate] = useState(null);
 const [worklist, setWorklist] = useState([]);
 const [error, setError] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       // Pull the pending prior-auth queue — this drives the worklist AND the
       // first-patient lookups for eligibility / cost estimate below.
       const paList = await api.patientAccess.getPriorAuth({ size: 10, status: 'PENDING' }).catch(() => null);
       const items = paList?.items || (Array.isArray(paList) ? paList : []);
       setWorklist(items);
       const firstPatientId = items[0]?.patient_id || null;
       const firstClaimId = items[0]?.claim_id || null;

       const [crs, ar, eligibility, cost] = await Promise.allSettled([
         api.crs.getSummary(),
         api.ar.getSummary(),
         firstPatientId ? api.patientAccess.getEligibility(firstPatientId) : Promise.resolve(null),
         firstClaimId ? api.patientAccess.getCostEstimate(firstClaimId) : Promise.resolve(null),
       ]);
       if (crs.status === 'fulfilled') setCrsSummary(crs.value);
       if (ar.status === 'fulfilled') setArSummary(ar.value);
       if (eligibility.status === 'fulfilled' && eligibility.value) setEligibilityData(eligibility.value);
       if (cost.status === 'fulfilled' && cost.value) setCostEstimate(cost.value);
     } catch (err) {
       console.error('PatientAccessHub load error:', err);
       setError('Failed to load patient access data.');
     } finally {
       setLoading(false);
     }
   }
   load();
 }, []);

 // Days until expiry helper — null-safe
 const daysUntil = (dateStr) => {
   if (!dateStr) return null;
   const d = new Date(dateStr);
   if (Number.isNaN(d.getTime())) return null;
   const diffMs = d.getTime() - Date.now();
   return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
 };

 // Derive KPI values from real data (prefer patientAccess APIs, fallback to CRS/AR)
 const registrationAccuracy = eligibilityData?.accuracy != null
   ? `${eligibilityData.accuracy.toFixed(1)}%`
   : crsSummary?.component_scores?.eligibility != null
     ? `${crsSummary.component_scores.eligibility.toFixed(1)}%`
     : '--';
 const registrationTrend = eligibilityData?.trend != null
   ? `${eligibilityData.trend > 0 ? '+' : ''}${eligibilityData.trend}%`
   : crsSummary?.overall_score != null && crsSummary.overall_score > 90
     ? '+0.5%' : '--%';

 const coverageGapCount = eligibilityData?.coverage_gaps ?? arSummary?.total_claims ?? '--';
 const authAlerts = eligibilityData?.auth_alerts ?? (crsSummary?.component_scores?.authorization != null
   ? Math.round((100 - crsSummary.component_scores.authorization) / 10)
   : '--');
 const estLiability = costEstimate?.estimated_liability != null
   ? `$${(costEstimate.estimated_liability / 1000).toFixed(1)}k`
   : costEstimate?.estimated_patient_oop != null
     ? `$${(costEstimate.estimated_patient_oop / 1000).toFixed(1)}k`
   : arSummary?.total_outstanding != null
     ? `$${(arSummary.total_outstanding / 1000).toFixed(1)}k`
     : '--';
 const collectedAmt = costEstimate?.collected != null
   ? `+$${(costEstimate.collected / 1000).toFixed(1)}k`
   : arSummary?.total_collected != null
     ? `+$${(arSummary.total_collected / 1000).toFixed(1)}k`
     : '--';

 // Sprint Q Track C4 — propensity-to-pay badge
 const payProb = costEstimate?.patient_payment_probability;
 const payProbPct = typeof payProb === 'number' ? Math.round(payProb * 100) : null;
 const payProbTier = costEstimate?.patient_payment_tier;
 const payProbColor = payProbPct == null
   ? 'text-th-muted bg-th-surface-overlay border-th-border'
   : payProbPct >= 70 ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/40'
   : payProbPct >= 40 ? 'text-amber-400 bg-amber-900/20 border-amber-800/40'
   : 'text-rose-400 bg-rose-900/20 border-rose-800/40';

 const Skeleton = () => (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-24"></div>
 );

 return (
 <div className="flex-1 overflow-y-auto h-full p-6 text-th-heading custom-scrollbar">
 <div className="max-w-[1600px] mx-auto space-y-6">
 {error && (
 <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">warning</span>
 {error}
 </div>
 )}
 <div className="flex justify-between items-end">
 <div>
 <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
 Patient Access Hub
 </h1>
 <p className="text-th-secondary text-sm mt-1">Front-office mission control for registration quality.</p>
 </div>
 <div className="flex gap-3">
 <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
 <span className="material-symbols-outlined text-sm">check_circle</span> System Online
 </span>
 </div>
 </div>

 {/* KPI Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-1">
 <p className="text-xs font-bold uppercase text-th-secondary">Registration Accuracy</p>
 <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">Descriptive</span>
 </div>
 {loading ? <Skeleton /> : <h3 className="text-3xl font-black text-th-heading tabular-nums">{registrationAccuracy}</h3>}
 <p className="text-xs text-emerald-500 font-bold flex items-center mt-1"><span className="material-symbols-outlined text-sm">arrow_upward</span> <span className="tabular-nums">{registrationTrend}</span> this week</p>
 </div>
 <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-1">
 <p className="text-xs font-bold uppercase text-th-secondary">Coverage Gap Analysis</p>
 <span className="text-[10px] font-bold text-amber-400 px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">Diagnostic</span>
 </div>
 {loading ? <Skeleton /> : <h3 className="text-3xl font-black text-th-heading tabular-nums">{coverageGapCount}</h3>}
 <p className="text-xs text-th-secondary font-bold mt-1">Today's Volume</p>
 </div>
 <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-1">
 <p className="text-xs font-bold uppercase text-th-secondary">Authorization Alerts</p>
 <span className="text-[10px] font-bold text-violet-400 px-1.5 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">Predictive</span>
 </div>
 {loading ? <Skeleton /> : <h3 className="text-3xl font-black text-rose-500 tabular-nums">{authAlerts}</h3>}
 <p className="text-xs text-rose-500 font-bold mt-1">Action Required</p>
 </div>
 <div className="bg-th-surface-raised p-5 rounded-xl border border-th-border border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-bold uppercase text-th-secondary mb-1">Est. Patient Liability</p>
 {loading ? <Skeleton /> : <h3 className="text-3xl font-black text-th-heading tabular-nums">{estLiability}</h3>}
 <p className="text-xs text-emerald-500 font-bold mt-1 tabular-nums">{loading ? '' : `${collectedAmt} collected`}</p>
 {/* Sprint Q Track C4 — ML-predicted propensity to pay */}
 {!loading && payProbPct != null && (
 <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold tabular-nums ${payProbColor}`}
      title={`Tier: ${payProbTier || 'N/A'} — ML propensity-to-pay`}>
 <span className="material-symbols-outlined text-[11px]">smart_toy</span>
 Likely to collect: {payProbPct}%
 {payProbTier && <span className="opacity-70">({payProbTier})</span>}
 </div>
 )}
 </div>
 </div>

 {/* AI Task List */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
 <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl flex flex-col hover:shadow-lg transition-all duration-200">
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div className="flex items-center gap-3">
 <h3 className="font-bold text-lg flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">task</span>
 AI-Prioritized Worklist
 </h3>
 <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">Prescriptive</span>
 </div>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 rounded-lg bg-th-surface-overlay text-th-secondary text-xs font-bold hover:text-th-heading">All Tasks</button>
 <button className="px-3 py-1.5 rounded-lg bg-primary text-th-heading text-xs font-bold">My Tasks</button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
 {loading && (
 <div className="p-6 text-sm text-th-muted">Loading prior-auth queue…</div>
 )}
 {!loading && worklist.length === 0 && (
 <div className="p-10 text-center">
 <span className="material-symbols-outlined text-[40px] text-th-muted mb-2">task_alt</span>
 <p className="text-sm font-bold text-th-heading mb-1">No pending prior authorizations</p>
 <p className="text-xs text-th-muted">Queue is clear — all active auths are approved or in progress.</p>
 </div>
 )}
 {!loading && worklist.map((item) => {
 const days = daysUntil(item.expiry_date);
 const isCritical = days != null && days <= 3;
 const initials = (item.patient_id || '?').slice(-2).toUpperCase();
 const firstCpt = (item.approved_cpt_codes || '').split(',')[0]?.trim() || '—';
 return (
 <div key={item.auth_id} className="flex items-center justify-between p-4 border-b border-th-border hover:bg-th-surface-overlay/50 transition-colors group cursor-pointer">
 <div className="flex items-center gap-4">
 <div className={`size-10 rounded-full flex items-center justify-center font-bold text-th-heading ${isCritical ? 'bg-rose-500' : 'bg-th-surface-overlay'}`}>
 <span className="tabular-nums text-xs">
 {days != null ? `${days}d` : '—'}
 </span>
 </div>
 <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
 {initials}
 </div>
 <div>
 <p className="font-bold text-sm text-th-heading">
 {item.patient_id} · CPT {firstCpt}
 </p>
 <p className="text-xs text-th-secondary">
 {item.payer_name || item.payer_id || 'Unknown payer'}
 {' · '}
 <span className="uppercase tracking-wide text-[10px] font-bold">{item.status}</span>
 {item.auth_number ? ` · Auth ${item.auth_number}` : ' · No auth number yet'}
 {days != null ? ` · ${days >= 0 ? `${days} days to expiry` : `expired ${Math.abs(days)}d ago`}` : ''}
 </p>
 </div>
 </div>
 <button className="px-4 py-2 bg-primary text-th-heading text-xs font-bold rounded-lg transition-all hover:bg-primary/90">
 Process
 </button>
 </div>
 );
 })}
 </div>
 </div>

 {/* Quick Launch Panel */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 flex flex-col gap-4 hover:shadow-lg transition-all duration-200">
 <h3 className="font-bold text-th-heading mb-2">Quick Actions</h3>

 <button className="w-full text-left p-4 rounded-xl bg-white/5 border border-th-border hover:bg-white/10 transition-all group">
 <div className="flex justify-between items-start mb-2">
 <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">person_add</span>
 <span className="text-[10px] font-bold text-th-secondary uppercase tracking-widest">New</span>
 </div>
 <p className="font-bold text-th-heading">Register New Patient</p>
 <p className="text-xs text-th-secondary mt-1">Start intake workflow with ID scan.</p>
 </button>

 <button className="w-full text-left p-4 rounded-xl bg-white/5 border border-th-border hover:bg-white/10 transition-all group">
 <div className="flex justify-between items-start mb-2">
 <span className="material-symbols-outlined text-emerald-500 text-2xl group-hover:scale-110 transition-transform">payments</span>
 <span className="text-[10px] font-bold text-th-secondary uppercase tracking-widest">Estimate</span>
 </div>
 <p className="font-bold text-th-heading">Create Cost Estimate</p>
 <p className="text-xs text-th-secondary mt-1">Generate good-faith estimate.</p>
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
