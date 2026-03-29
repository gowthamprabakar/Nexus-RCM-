import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function AICodingRulebook() {
 const [searchTerm, setSearchTerm] = useState('');
 const [activePayer, setActivePayer] = useState('medicare');
 const [loading, setLoading] = useState(true);
 const [errorCategories, setErrorCategories] = useState([]);

 useEffect(() => {
   async function load() {
     setLoading(true);
     const errors = await api.crs.getErrorCategories();
     setErrorCategories(errors || []);
     setLoading(false);
   }
   load();
 }, []);

 // Derive rule violation stats from real error categories
 const totalErrors = errorCategories.reduce((sum, c) => sum + (c.count || 0), 0);
 const topCategories = [...errorCategories].sort((a, b) => (b.count || 0) - (a.count || 0));

 const payers = [
 { id: 'medicare', name: 'Medicare Part B', type: 'National - Primary', updates: '142 Updates', starred: true },
 { id: 'cigna', name: 'Cigna Health', type: 'Commercial - Regional', synced: '2h ago' },
 { id: 'bcbs', name: 'Blue Cross Blue Shield', type: 'Commercial - National', synced: '5h ago' },
 { id: 'uhc', name: 'UnitedHealthcare', type: 'Commercial - Managed Care', synced: '1d ago' },
 ];

 const Skeleton = () => (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-20"></div>
 );

 return (
 <div className="flex-1 flex flex-col overflow-hidden text-th-heading">
 {/* Horizontal Payer Tabs */}
 <div className="px-6 pt-4 pb-0 border-b border-th-border">
 <div className="flex items-center gap-3 mb-3">
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-muted text-[18px]">search</span>
 <input
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 placeholder="Search payers..."
 className="pl-9 pr-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-xs font-medium text-th-heading placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-56"
 />
 </div>
 <div className="flex items-center gap-1 ml-2">
 {payers.map((payer) => (
 <button
 key={payer.id}
 onClick={() => setActivePayer(payer.id)}
 className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
 activePayer === payer.id
 ? 'border-primary text-primary bg-primary/5'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 }`}
 >
 {payer.starred && <span className="material-symbols-outlined text-primary text-[14px]">star</span>}
 {payer.name}
 </button>
 ))}
 </div>
 <div className="ml-auto flex items-center gap-2 text-xs text-th-secondary bg-th-surface-raised px-3 py-1.5 rounded-lg border border-th-border mb-1">
 <span className="material-symbols-outlined text-[16px]">sync</span>
 Updated: Today, 06:00 AM EST
 </div>
 </div>
 </div>

 {/* Breadcrumb */}
 <div className="px-6 py-3 flex items-center gap-2 text-sm">
 <span className="text-th-muted hover:text-primary cursor-pointer font-medium transition-colors">Payer Rulebook</span>
 <span className="text-th-muted">/</span>
 <span className="font-bold text-th-heading">Medicare Part B - National Policy Manual</span>
 <span className="ml-2 text-xs font-bold text-th-muted bg-th-surface-overlay px-2 py-0.5 rounded tabular-nums">5,241 Active Rule Sets</span>
 <span className="ml-2 ai-descriptive">Descriptive AI</span>
 {!loading && totalErrors > 0 && (
   <span className="ml-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded tabular-nums">{totalErrors} Rule Violations</span>
 )}
 </div>

 <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
 {/* Top Stats Cards */}
 <div className="grid grid-cols-3 gap-6 mb-8">
 <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-blue-500 p-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full z-0"></div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2 relative z-10">Local Coverage (LCD)</h3>
 <div className="flex items-end gap-2 relative z-10">
 <span className="text-3xl font-bold text-th-heading tabular-nums">1,204</span>
 <span className="text-xs font-medium text-green-400 mb-1.5 flex items-center">
 <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
 12 New
 </span>
 </div>
 <div className="mt-3 flex gap-2">
 <span className="text-[10px] bg-th-surface-overlay text-th-secondary px-2 py-1 rounded font-bold">L34636 Active</span>
 <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold">Cardiology Focus</span>
 </div>
 </div>

 <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-purple-500 p-4 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full z-0"></div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2 relative z-10">National Coverage (NCD)</h3>
 <div className="flex items-end gap-2 relative z-10">
 <span className="text-3xl font-bold text-th-heading tabular-nums">342</span>
 <span className="text-xs font-medium text-th-muted mb-1.5">No recent changes</span>
 </div>
 <div className="mt-3">
 <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded font-bold">Federal Mandate</span>
 </div>
 </div>

 <div className="bg-gradient-to-br from-th-surface-overlay to-th-surface-base text-th-heading rounded-xl p-4 border border-th-border border-l-[3px] border-l-emerald-500 flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div>
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-secondary mb-1">AI Rule Engine</h3>
 <p className="text-sm font-medium text-th-heading">Ready to test claims against latest CMS guidelines.</p>
 </div>
 <button className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 mt-4 border border-white/10 group">
 <span className="text-xs font-bold">Open Simulator</span>
 <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
 </button>
 </div>
 </div>

 {/* Error Categories from API */}
 {!loading && errorCategories.length > 0 && (
 <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden mb-8">
   <div className="px-6 py-4 border-b border-th-border flex justify-between items-center">
     <h2 className="font-bold text-th-heading flex items-center gap-2">
       <span className="material-symbols-outlined text-rose-400">error</span>
       CRS Error Categories - Rule Violations
     </h2>
     <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full tabular-nums">{totalErrors} Total</span>
   </div>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-th-border">
     {topCategories.slice(0, 4).map((cat, i) => (
       <div key={i} className="p-4 text-center">
         <p className="text-[10px] font-bold text-th-muted uppercase tracking-widest mb-1">{cat.category || cat.name || `Category ${i+1}`}</p>
         <p className="text-2xl font-black text-th-heading tabular-nums">{cat.count || 0}</p>
         {cat.revenue_at_risk != null && (
           <p className="text-[10px] text-rose-400 mt-1 font-bold tabular-nums">${(cat.revenue_at_risk / 1000).toFixed(1)}k at risk</p>
         )}
       </div>
     ))}
   </div>
 </div>
 )}

 <div className="grid grid-cols-12 gap-8 h-full">
 {/* Crosswalks Table */}
 <div className="col-span-8 bg-th-surface-raised rounded-xl border border-th-border overflow-hidden h-fit">
 <div className="px-6 py-4 border-b border-th-border flex justify-between items-center">
 <h2 className="font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-th-secondary">cable</span>
 High-Volume Crosswalks (Cardiology)
 </h2>
 <button className="text-primary text-xs font-bold hover:underline">View All</button>
 </div>
 <table className="w-full text-sm text-left">
 <thead className="bg-th-surface-overlay/50 text-xs uppercase font-bold text-th-muted">
 <tr>
 <th className="px-6 py-3">CPT Procedure</th>
 <th className="px-6 py-3">Req. Diagnosis (ICD-10)</th>
 <th className="px-6 py-3">Rule Link</th>
 <th className="px-6 py-3 text-right">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30">
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-th-heading">93000</div>
 <div className="text-xs text-th-secondary">Electrocardiogram, 12-lead</div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1">
 <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">R07.9</span>
 <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">I20.9</span>
 <span className="px-1.5 py-0.5 bg-th-surface-overlay text-th-secondary rounded text-[10px] font-medium">+14 more</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
 LCD L34636 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
 </a>
 </td>
 <td className="px-6 py-4 text-right">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
 Active
 </span>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-th-heading">93306</div>
 <div className="text-xs text-th-secondary">Echocardiography, TTE</div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1">
 <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">I50.9</span>
 <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">I48.91</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
 NCD 20.27 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
 </a>
 </td>
 <td className="px-6 py-4 text-right">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
 Active
 </span>
 </td>
 </tr>
 <tr className="hover:bg-th-surface-overlay/30 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-th-heading">78452</div>
 <div className="text-xs text-th-secondary">Myocardial perfusion imaging</div>
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-wrap gap-1">
 <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px] font-bold">I25.10</span>
 <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-bold">R07.2</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
 LCD L33394 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
 </a>
 </td>
 <td className="px-6 py-4 text-right">
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
 In Review
 </span>
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Recent Policy Updates List */}
 <div className="col-span-4 bg-th-surface-raised rounded-xl border border-th-border p-6 h-fit">
 <h2 className="font-bold text-th-heading mb-4 text-sm">Recent Policy Alerts</h2>
 <div className="flex flex-col gap-4">
 <div className="bg-th-surface-overlay/50 p-3 rounded-lg border-l-4 border-l-amber-500">
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-bold text-th-muted uppercase">Effective Oct 1, 2024</span>
 <span className="material-symbols-outlined text-amber-500 text-[16px]">priority_high</span>
 </div>
 <p className="text-xs font-bold text-th-heading mb-1">Telehealth Modifiers Changed</p>
 <p className="text-[10px] text-th-secondary">Modifier -95 is being phased out for Place of Service 10.</p>
 </div>

 <div className="bg-th-surface-overlay/50 p-3 rounded-lg border-l-4 border-l-blue-500">
 <div className="flex justify-between items-start mb-1">
 <span className="text-[10px] font-bold text-th-muted uppercase">Effective Jan 1, 2025</span>
 <span className="material-symbols-outlined text-blue-400 text-[16px]">info</span>
 </div>
 <p className="text-xs font-bold text-th-heading mb-1">New E/M Guidelines</p>
 <p className="text-[10px] text-th-secondary">Comprehensive update to office visit complexity scoring.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
