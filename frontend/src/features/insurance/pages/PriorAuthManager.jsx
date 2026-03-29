import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function PriorAuthManager() {
 const [loading, setLoading] = useState(true);
 const [crsSummary, setCrsSummary] = useState(null);
 const [denialsSummary, setDenialsSummary] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     const [crs, denials] = await Promise.all([
       api.crs.getSummary(),
       api.denials.getSummary(),
     ]);
     setCrsSummary(crs);
     setDenialsSummary(denials);
     setLoading(false);
   }
   load();
 }, []);

 // Derive auth metrics from real API data
 const authScore = crsSummary?.component_scores?.authorization;
 const authScoreDisplay = authScore != null ? `${authScore.toFixed(1)}%` : '--';
 const authDenialCategory = denialsSummary?.top_categories?.find(c =>
   c.category?.toUpperCase().includes('AUTH')
 );
 const authDenialCount = authDenialCategory?.count ?? 0;
 const authDenialRevenue = authDenialCategory?.revenue_at_risk
   ? `$${(authDenialCategory.revenue_at_risk / 1000).toFixed(1)}k`
   : '$0';

 const Skeleton = () => (
   <div className="animate-pulse bg-th-surface-overlay rounded h-6 w-20"></div>
 );

 return (
 <div className="flex-1 overflow-y-auto h-full p-6 text-th-heading custom-scrollbar">
 <div className="max-w-[1600px] mx-auto space-y-6">

 {/* Auth KPI Strip */}
 {!loading && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-blue-500">
     <p className="text-xs font-bold uppercase text-th-muted mb-1">Auth Component Score</p>
     <h3 className="text-2xl font-black text-primary tabular-nums">{authScoreDisplay}</h3>
     <p className="text-[10px] text-th-secondary mt-1">CRS authorization readiness</p>
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-rose-500">
     <p className="text-xs font-bold uppercase text-th-muted mb-1">Auth-Related Denials</p>
     <h3 className="text-2xl font-black text-rose-500 tabular-nums">{authDenialCount}</h3>
     <p className="text-[10px] text-th-secondary mt-1">From AUTHORIZATION category</p>
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-amber-500">
     <p className="text-xs font-bold uppercase text-th-muted mb-1">Revenue at Risk</p>
     <h3 className="text-2xl font-black text-amber-500 tabular-nums">{authDenialRevenue}</h3>
     <p className="text-[10px] text-th-secondary mt-1">Auth denial financial impact</p>
   </div>
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Active Requests */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-bold text-lg text-th-heading">Active Requests</h3>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <div className="space-y-4">
 {[
 { patient: "Jameson, R.", cpt: "MRI Brain (70553)", payer: "UHC", status: "Pending Clinicals", days: 2 },
 { patient: "Miller, D.", cpt: "CT Abdomen (74177)", payer: "Aetna", status: "In Payer Review", days: 5 },
 { patient: "Smith, A.", cpt: "Sleep Study (95810)", payer: "BCBS", status: "Approved", days: 0 },
 ].map((req, i) => (
 <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-th-surface-overlay/50 border border-th-border">
 <div>
 <p className="font-bold text-sm text-th-heading">{req.patient}</p>
 <p className="text-xs text-th-secondary">{req.cpt} &bull; {req.payer}</p>
 </div>
 <div className="text-right">
 <span className={`text-[10px] font-bold px-2 py-1 rounded ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
 req.status === 'Pending Clinicals' ? 'bg-amber-500/10 text-amber-500' :
 'bg-blue-500/10 text-blue-500'
 }`}>{req.status}</span>
 {req.days > 0 && <p className="text-[10px] text-th-muted mt-1 tabular-nums">{req.days} days aging</p>}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* AI Clinical Assistant */}
 <div className="bg-th-surface-raised text-th-heading border border-th-border border-l-[3px] border-l-purple-500 rounded-xl p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <span className="material-symbols-outlined text-9xl">psychology</span>
 </div>
 <div className="flex items-center gap-2 mb-4 relative z-10">
 <h3 className="font-bold text-lg text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">auto_fix_high</span> AI Clinical Assistant
 </h3>
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>

 <div className="bg-white/5 border border-th-border rounded-lg p-4 mb-4 relative z-10">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Drafting Justification For:</p>
 <p className="font-bold text-sm text-th-heading mb-2">Sarah Jenkins - MRI Brain w/ Contrast (70553)</p>
 <div className="p-3 bg-black/30 rounded border border-th-border text-xs font-mono text-th-secondary">
 "Patient presents with persistent headaches &gt; 6 weeks with neurological deficits. Failed conservative therapy. MRI indicated to rule out intracranial pathology..."
 </div>
 </div>

 <div className="flex gap-3 relative z-10">
 <button className="flex-1 bg-primary text-th-heading font-bold py-2 rounded-lg hover:brightness-110">Attach Records</button>
 <button className="flex-1 bg-white/10 text-th-heading font-bold py-2 rounded-lg hover:bg-white/20">Edit Draft</button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
