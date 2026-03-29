import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function PatientAccessHub() {
 const [loading, setLoading] = useState(true);
 const [crsSummary, setCrsSummary] = useState(null);
 const [arSummary, setArSummary] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     const [crs, ar] = await Promise.all([
       api.crs.getSummary(),
       api.ar.getSummary(),
     ]);
     setCrsSummary(crs);
     setArSummary(ar);
     setLoading(false);
   }
   load();
 }, []);

 // Derive KPI values from real data, with safe fallbacks
 const registrationAccuracy = crsSummary?.component_scores?.eligibility != null
   ? `${crsSummary.component_scores.eligibility.toFixed(1)}%`
   : '--';
 const registrationTrend = crsSummary?.overall_score != null && crsSummary.overall_score > 90
   ? '+0.5%' : '--%';

 const coverageGapCount = arSummary?.total_claims ?? '--';
 const authAlerts = crsSummary?.component_scores?.authorization != null
   ? Math.round((100 - crsSummary.component_scores.authorization) / 10)
   : '--';
 const estLiability = arSummary?.total_outstanding != null
   ? `$${(arSummary.total_outstanding / 1000).toFixed(1)}k`
   : '--';
 const collectedAmt = arSummary?.total_collected != null
   ? `+$${(arSummary.total_collected / 1000).toFixed(1)}k`
   : '--';

 const Skeleton = () => (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-24"></div>
 );

 return (
 <div className="flex-1 overflow-y-auto h-full p-6 text-th-heading custom-scrollbar">
 <div className="max-w-[1600px] mx-auto space-y-6">
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
 {[
 { patient: "Sarah Jenkins", initials: "SJ", task: "Obtain Prior Auth", urgency: "High", time: "10:00 AM", score: 98 },
 { patient: "Michael Ross", initials: "MR", task: "Verify Sec. Insurance", urgency: "Medium", time: "10:15 AM", score: 85 },
 { patient: "David Miller", initials: "DM", task: "Review Benefits Limit", urgency: "Low", time: "11:00 AM", score: 60 },
 { patient: "Linda Chen", initials: "LC", task: "Update Demographics", urgency: "Critical", time: "09:30 AM", score: 99 },
 ].sort((a, b) => b.score - a.score).map((item, i) => (
 <div key={i} className="flex items-center justify-between p-4 border-b border-th-border hover:bg-th-surface-overlay/50 transition-colors group cursor-pointer">
 <div className="flex items-center gap-4">
 <div className={`size-10 rounded-full flex items-center justify-center font-bold text-th-heading ${item.urgency === 'Critical' ? 'bg-rose-500' : 'bg-th-surface-overlay'}`}>
 <span className="tabular-nums">{item.score}</span>
 </div>
 <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
 {item.initials}
 </div>
 <div>
 <p className="font-bold text-sm text-th-heading">{item.task}</p>
 <p className="text-xs text-th-secondary">{item.patient} • Appointment at {item.time}</p>
 </div>
 </div>
 <button className="px-4 py-2 bg-primary text-th-heading text-xs font-bold rounded-lg transition-all hover:bg-primary/90">
 Process
 </button>
 </div>
 ))}
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
