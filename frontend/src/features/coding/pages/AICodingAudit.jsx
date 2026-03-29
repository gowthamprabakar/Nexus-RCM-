import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function AICodingAudit() {
 const [activeTab, setActiveTab] = useState('audit');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [auditData, setAuditData] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const data = await api.coding.getAudit();
       if (!data) throw new Error('No audit data returned');
       setAuditData(data);
     } catch (err) {
       console.error('Failed to load coding audit:', err);
       setError(err.message || 'Failed to load audit data');
     } finally {
       setLoading(false);
     }
   }
   load();
 }, []);

 // Derive audit metrics from coding API data
 const totalCodingDenials = auditData?.total_coding_denials ?? 0;
 const denialsByCarc = auditData?.denials_by_carc || [];
 const topErrorCpts = auditData?.top_error_cpt_codes || [];
 const totalClaims = auditData?.total_claims ?? 0;

 const financialImpact = denialsByCarc.length > 0
   ? `$${(denialsByCarc.reduce((sum, d) => sum + (d.total_amount || 0), 0) / 1000).toFixed(1)}k`
   : '$0';
 const codingMismatchCount = totalCodingDenials;
 const auditScore = auditData?.coding_accuracy_pct != null
   ? `${auditData.coding_accuracy_pct}%` : '--';

 const tabs = [
 { id: 'worklist', label: 'Worklist', icon: 'list_alt' },
 { id: 'audit', label: 'Audit & Review', icon: 'fact_check' },
 { id: 'risk', label: 'Risk Analytics', icon: 'analytics' },
 { id: 'finalized', label: 'Finalized Claims', icon: 'done_all' },
 ];

 return (
 <div className="flex-1 flex flex-col overflow-hidden text-th-heading">
 {/* Horizontal Tabs */}
 <div className="px-6 pt-4 pb-0 flex items-center gap-2 border-b border-th-border">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
 activeTab === tab.id
 ? 'border-primary text-primary'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 }`}
 >
 <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
 {tab.label}
 </button>
 ))}
 <div className="ml-auto flex items-center gap-4 pb-2">
 <div className="flex items-center gap-2 text-sm">
 <span className="text-th-muted">Assigned Coder:</span>
 <span className="font-bold text-th-heading">Michael S.</span>
 </div>
 <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold uppercase tracking-wide">
 <span className="material-symbols-outlined text-[16px]">priority_high</span>
 {totalCodingDenials > 0 ? `${totalCodingDenials} Coding Denials` : 'High Variance'}
 </div>
 </div>
 </div>

 {/* Breadcrumb */}
 <div className="px-6 py-3 flex items-center gap-2 text-sm">
 <span className="text-th-muted hover:text-primary cursor-pointer font-medium transition-colors">Audits</span>
 <span className="text-th-muted">/</span>
 <span className="font-bold text-th-heading">Encounter #88291 - Medical Review</span>
 <span className="ml-2 text-xs font-bold text-th-muted bg-th-surface-overlay px-2 py-0.5 rounded">AUD-99281</span>
 <span className="ml-2 ai-diagnostic">Diagnostic AI</span>
 </div>

 {/* Error State */}
 {error && (
 <div className="mx-6 mt-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
   <span className="material-symbols-outlined text-red-400">error</span>
   <div>
     <p className="text-sm font-bold text-red-400">Failed to load coding audit data</p>
     <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
   </div>
   <button onClick={() => window.location.reload()} className="ml-auto px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10">Retry</button>
 </div>
 )}

 {/* Audit Workspace Content */}
 <div className="flex-1 overflow-hidden flex gap-0">
 {/* Column 1: Coding Comparison */}
 <div className="w-[380px] flex flex-col border-r border-th-border bg-th-surface-raised shrink-0">
 <div className="p-4 border-b border-th-border flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">compare_arrows</span>
 <h2 className="text-sm font-bold text-th-heading">Coding Comparison</h2>
 </div>
 <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
 <div className="flex justify-between items-center mb-4">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Original Coder Results</span>
 <span className="text-[10px] font-bold bg-th-surface-overlay text-th-secondary px-1.5 py-0.5 rounded">v1.0</span>
 </div>

 <div className="border border-th-border rounded-lg p-3 mb-3 bg-th-surface-overlay/30">
 <div className="flex justify-between items-start">
 <div>
 <div className="text-sm font-bold text-th-heading">I50.9</div>
 <div className="text-xs text-th-secondary">Heart failure, unspecified</div>
 </div>
 <span className="material-symbols-outlined text-th-muted text-[16px]">history</span>
 </div>
 </div>

 <div className="border border-th-border rounded-lg p-3 mb-8 bg-th-surface-overlay/30">
 <div className="flex justify-between items-start">
 <div>
 <div className="text-sm font-bold text-th-heading">93000</div>
 <div className="text-xs text-th-secondary">Routine EKG (12-lead)</div>
 </div>
 <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
 </div>
 </div>

 <div className="flex justify-center mb-4">
 <span className="material-symbols-outlined text-th-muted">arrow_downward</span>
 </div>

 <div className="flex justify-between items-center mb-4">
 <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Optimization Suggestions</span>
 <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded tabular-nums">94% Confidence</span>
 </div>

 <div className="border-2 border-green-500/20 bg-green-500/5 rounded-lg p-0 overflow-hidden mb-4 relative">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
 <div className="p-3">
 <div className="flex justify-between items-start mb-1">
 <div>
 <div className="text-sm font-bold text-green-400">I50.32 (Optimized)</div>
 <div className="text-xs text-th-secondary">Chronic diastolic heart failure</div>
 </div>
 <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-1 rounded uppercase">MCC</span>
 </div>
 <div className="mt-2 bg-th-surface-overlay/50 p-2 rounded border border-th-border text-[10px] italic text-th-secondary">
 "Evidence of basal rales and LV hypertrophy in notes supports higher specificity."
 </div>
 </div>
 </div>

 <div className="border-2 border-amber-500/20 bg-amber-500/5 rounded-lg p-0 overflow-hidden relative">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
 <div className="p-3">
 <h3 className="text-sm font-bold text-amber-400 mb-0.5">Add Modifier -25</h3>
 <p className="text-xs text-th-secondary mb-2">Separate E/M encounter</p>
 <p className="text-[10px] text-amber-400 font-medium">Prevents bundling rejection for CPT 93000.</p>
 </div>
 </div>

 {/* Coding Denials by CARC from API */}
 {!loading && denialsByCarc.length > 0 && (
 <div className="mt-6 pt-4 border-t border-th-border">
   <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Denials by CARC Code</h3>
   <div className="space-y-2">
     {denialsByCarc.slice(0, 5).map((d, i) => (
       <div key={i} className="flex justify-between items-center text-xs p-2 bg-th-surface-overlay/30 rounded">
         <div>
           <span className="text-th-heading font-medium">{d.carc_code}</span>
           <span className="text-th-muted ml-1.5">{d.description || ''}</span>
         </div>
         <div className="text-right">
           <span className="font-bold text-amber-400 tabular-nums">{d.denial_count}</span>
           <span className="text-th-muted ml-1 text-[10px] tabular-nums">(${(d.total_amount / 1000).toFixed(1)}k)</span>
         </div>
       </div>
     ))}
   </div>
 </div>
 )}
 {/* Top Error CPT Codes */}
 {!loading && topErrorCpts.length > 0 && (
 <div className="mt-4 pt-4 border-t border-th-border">
   <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Top Error CPT Codes</h3>
   <div className="space-y-2">
     {topErrorCpts.slice(0, 5).map((cpt, i) => (
       <div key={i} className="flex justify-between items-center text-xs p-2 bg-th-surface-overlay/30 rounded">
         <span className="text-th-heading font-medium">{cpt.cpt_code}</span>
         <span className="font-bold text-red-400 tabular-nums">{cpt.error_count} errors</span>
       </div>
     ))}
   </div>
 </div>
 )}
 </div>
 </div>

 {/* Column 2: Risk & Variance Analysis */}
 <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
 <h2 className="text-lg font-bold text-th-heading">Risk & Variance Analysis</h2>

 <div className="grid grid-cols-3 gap-4">
 <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Financial Impact</p>
 {loading ? (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-24"></div>
 ) : (
   <div className="text-2xl font-bold text-green-400 tabular-nums">{financialImpact}</div>
 )}
 </div>
 <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Coding Mismatches</p>
 {loading ? (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-24"></div>
 ) : (
   <div className="text-2xl font-bold text-amber-500 tabular-nums">{codingMismatchCount}</div>
 )}
 </div>
 <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-blue-500 relative hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Audit Score</p>
 {loading ? (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-24"></div>
 ) : (
   <div className="text-2xl font-bold text-blue-400 tabular-nums">{auditScore}</div>
 )}
 <span className="absolute bottom-4 right-4 text-[9px] text-th-muted">Target 95%+</span>
 </div>
 </div>

 <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden flex-1">
 <div className="p-4 border-b border-th-border flex items-center gap-2">
 <span className="material-symbols-outlined text-red-400">warning</span>
 <h3 className="text-sm font-bold text-th-heading">Key Variance: DRG Misalignment</h3>
 </div>
 <div className="p-0">
 <table className="w-full text-xs text-left">
 <thead className="bg-th-surface-overlay/50 text-th-muted uppercase">
 <tr>
 <th className="px-4 py-3 font-medium">Element</th>
 <th className="px-4 py-3 font-medium">Current (Coder)</th>
 <th className="px-4 py-3 font-medium">Suggested (AI)</th>
 <th className="px-4 py-3 font-medium">Reimbursement Delta</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30 text-th-heading">
 <tr>
 <td className="px-4 py-3">PDX Code</td>
 <td className="px-4 py-3 text-red-400 line-through">I50.9</td>
 <td className="px-4 py-3 text-green-400 font-bold">I50.32</td>
 <td className="px-4 py-3 text-th-heading font-medium tabular-nums">+$210.00</td>
 </tr>
 <tr>
 <td className="px-4 py-3">CC/MCC Status</td>
 <td className="px-4 py-3">None</td>
 <td className="px-4 py-3 font-bold">MCC Present</td>
 <td className="px-4 py-3">Shift to DRG 291</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Reviewer Decision Box */}
 <div className="bg-blue-500/5 rounded-xl border-2 border-th-border border-dashed p-6 text-center">
 <div className="flex items-center gap-2 mb-4 justify-center text-th-heading font-bold">
 <span className="material-symbols-outlined text-primary">edit_note</span>
 Reviewer Decision
 </div>
 <div className="flex justify-center gap-4 mb-6">
 <button className="flex flex-col items-center justify-center w-24 h-24 bg-th-surface-raised border-2 border-primary text-primary rounded-xl hover:bg-primary/10 transition-colors">
 <span className="material-symbols-outlined text-[24px] mb-1">auto_fix_high</span>
 <span className="text-xs font-bold">Approve AI</span>
 </button>
 <button className="flex flex-col items-center justify-center w-24 h-24 bg-th-surface-raised border border-slate-700 text-th-secondary hover:bg-th-surface-overlay transition-colors rounded-xl">
 <span className="material-symbols-outlined text-[24px] mb-1">undo</span>
 <span className="text-xs font-bold leading-tight">Revert to Coder</span>
 </button>
 <button className="flex flex-col items-center justify-center w-24 h-24 bg-th-surface-raised border border-slate-700 text-th-secondary hover:bg-th-surface-overlay transition-colors rounded-xl">
 <span className="material-symbols-outlined text-[24px] mb-1">tune</span>
 <span className="text-xs font-bold leading-tight">Manually Adjust</span>
 </button>
 </div>
 <div className="relative">
 <textarea className="w-full text-xs p-3 rounded-lg border border-th-border bg-th-surface-raised text-th-heading placeholder:text-th-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-20" placeholder="Add mandatory reviewer rationale for audit trail..."></textarea>
 <span className="absolute bottom-2 right-2 material-symbols-outlined text-[12px] text-th-muted">drag_handle</span>
 </div>
 </div>
 </div>

 {/* Column 3: Reviewer Activity Log */}
 <div className="w-[300px] border-l border-th-border bg-th-surface-raised flex flex-col shrink-0">
 <div className="p-4 border-b border-th-border flex items-center gap-2">
 <span className="material-symbols-outlined text-th-secondary">history_edu</span>
 <h2 className="text-sm font-bold text-th-heading">Reviewer Activity Log</h2>
 </div>
 <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
 <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-700/50"></div>

 <div className="relative pl-8 mb-8 group">
 <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-th-surface-raised shadow-sm z-10"></div>
 <h3 className="text-xs font-bold text-th-heading">System Optimization</h3>
 <p className="text-[10px] text-th-muted mt-0.5">10:42 AM - AI suggested specificity upgrade for I50.9 to I50.32.</p>
 </div>

 <div className="relative pl-8 mb-8 group">
 <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-th-surface-raised shadow-sm z-10"></div>
 <h3 className="text-xs font-bold text-th-heading">Coder Submission</h3>
 <p className="text-[10px] text-th-muted mt-0.5">09:15 AM - Michael S. finalized initial coding pass.</p>
 </div>

 <div className="relative pl-8 mb-8 group">
 <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-th-surface-raised shadow-sm z-10"></div>
 <h3 className="text-xs font-bold text-th-heading">Encounter Ingested</h3>
 <p className="text-[10px] text-th-muted mt-0.5">08:30 AM - Medical record imported via HL7 integration.</p>
 </div>
 </div>

 <div className="p-4 border-t border-th-border bg-th-surface-overlay/30">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">QA Scoring (Internal)</h3>
 <div className="mb-3">
 <div className="flex justify-between text-[10px] mb-1">
 <span className="text-th-secondary">Documentation Accuracy</span>
 <span className="font-bold text-th-heading tabular-nums">92%</span>
 </div>
 <div className="h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-blue-500 w-[92%]"></div>
 </div>
 </div>
 <div className="mb-4">
 <div className="flex justify-between text-[10px] mb-1">
 <span className="text-th-secondary">Payer Rule Compliance</span>
 <span className="font-bold text-th-heading tabular-nums">100%</span>
 </div>
 <div className="h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-green-500 w-full"></div>
 </div>
 </div>
 <div className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg flex justify-between items-center">
 <span className="text-[10px] font-medium text-th-secondary">Overall Coder Performance</span>
 <div className="flex items-center gap-1">
 <div className="flex text-amber-400 text-[12px]">
 <span className="material-symbols-outlined fill-current">star</span>
 <span className="material-symbols-outlined fill-current">star</span>
 <span className="material-symbols-outlined fill-current">star</span>
 <span className="material-symbols-outlined fill-current">star</span>
 <span className="material-symbols-outlined text-th-muted">star</span>
 </div>
 <span className="text-xs font-bold text-th-heading tabular-nums">4.0 / 5.0</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Footer Action Bar */}
 <footer className="h-16 bg-th-surface-raised border-t border-th-border flex items-center justify-between px-6 shrink-0 z-10">
 <div className="flex items-center gap-8">
 <div>
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Audit Status</span>
 <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
 <span className="w-2 h-2 rounded-full bg-amber-500"></span>
 Pending Supervisor Verification
 </div>
 </div>
 <div>
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Final DRG</span>
 <div className="text-sm font-bold text-th-heading">291 - Heart Failure with MCC</div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <button className="px-4 py-2 bg-th-surface-overlay text-th-heading text-sm font-bold rounded-lg hover:bg-th-surface-overlay transition-colors border border-th-border">Place in Hold</button>
 <button className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2">
 <span className="material-symbols-outlined text-[18px]">verified</span>
 Verify & Finalize Claim
 </button>
 </div>
 </footer>
 </div>
 );
}
