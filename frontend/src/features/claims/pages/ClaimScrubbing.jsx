import React, { useState } from 'react';

export function ClaimScrubbing() {
 const [errorsFixed, setErrorsFixed] = useState({ modifier: false, diagnosis: false });

 const handleAutoFix = (type) => {
 setErrorsFixed(prev => ({ ...prev, [type]: true }));
 };

 return (
 <>
 <div className="bg-th-surface-raised border-b border-th-border p-6">
 <div className="flex flex-wrap items-center justify-between gap-6">
 <div className="flex flex-col gap-1">
 <nav className="flex items-center gap-2 text-xs font-medium text-th-secondary mb-1">
 <span>Claims</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span>Validation Detail</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span className="text-th-heading">#992831</span>
 </nav>
 <h2 className="text-2xl font-extrabold tracking-tight text-th-heading flex items-center gap-3">
 Claim Scrubbing & Validation
 <span className="ai-prescriptive">Prescriptive AI</span>
 </h2>
 </div>
 <div className="flex items-center gap-4 flex-1 justify-end">
 <div className="flex items-center gap-6 pr-6 border-r border-th-border">
 {/* Validation Score Circle */}
 <div className="relative size-16 flex items-center justify-center">
 <svg className="size-full -rotate-90" viewBox="0 0 36 36">
 <circle className="stroke-slate-700" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
 <circle className="stroke-primary transition-all duration-1000 ease-out" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${Object.values(errorsFixed).filter(Boolean).length * 4 + 90}, 100`} strokeLinecap="round" strokeWidth="3"></circle>
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-base font-bold text-primary tabular-nums">{98 + Object.values(errorsFixed).filter(Boolean).length}</span>
 <span className="text-[8px] font-bold text-th-muted uppercase">Score</span>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-8">
 <div className="flex flex-col">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Errors</span>
 <span className="text-xl font-bold text-red-500 transition-all tabular-nums">{2 - Object.values(errorsFixed).filter(Boolean).length}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Warnings</span>
 <span className="text-xl font-bold text-amber-500 tabular-nums">1</span>
 </div>
 <div className="flex flex-col">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Missing</span>
 <span className="text-xl font-bold text-th-heading tabular-nums">0</span>
 </div>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="h-10 px-4 bg-th-surface-overlay/50 border border-th-border text-th-heading rounded-lg font-bold text-sm transition-colors hover:bg-th-surface-overlay">
 Save Draft
 </button>
 <button className="h-10 px-6 bg-primary text-th-heading rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
 <span className="material-symbols-outlined text-sm">send</span>
 Submit to Payer
 </button>
 </div>
 </div>
 </div>
 </div>

 <div className="flex-1 flex overflow-hidden">
 {/* Left: Claim Data Editor */}
 <section className="w-[55%] border-r border-th-border overflow-y-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Claim Data Editor</h3>
 <span className="text-xs text-primary font-medium flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">sync</span> Autosaved 2m ago
 </span>
 </div>

 <div className="space-y-8">
 {/* Patient Info Section */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary text-lg">person</span>
 Patient & Encounter Information
 </h4>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Patient Name</label>
 <input className="w-full h-9 rounded bg-th-surface-overlay/50 border border-th-border text-sm px-3 focus:ring-1 focus:ring-primary text-th-heading" type="text" defaultValue="Sarah Jenkins" />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Date of Service</label>
 <input className="w-full h-9 rounded bg-th-surface-overlay/50 border border-th-border text-sm px-3 focus:ring-1 focus:ring-primary text-th-heading" type="date" defaultValue="2024-10-12" />
 </div>
 </div>
 </div>

 {/* Coding Section */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary text-lg">medical_services</span>
 Professional Services (CPT/HCPCS)
 </h4>
 <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
 <span className="material-symbols-outlined text-xs">add_circle</span> Add Service
 </button>
 </div>
 <div className="border border-th-border rounded-lg overflow-hidden">
 <table className="w-full text-left text-sm">
 <thead className="bg-th-surface-overlay/50 border-b border-th-border">
 <tr>
 <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-th-muted">CPT Code</th>
 <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-th-muted">Modifier</th>
 <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-th-muted">Units</th>
 <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-th-muted">Charge</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30 text-th-heading">
 <tr className={errorsFixed.modifier ? "bg-green-900/10 transition-colors duration-500" : ""}>
 <td className="px-4 py-3">
 <input className="w-20 h-8 rounded border-amber-900 bg-amber-900/20 text-sm font-bold focus:ring-primary pl-2 text-th-heading" type="text" defaultValue="99213" />
 </td>
 <td className="px-4 py-3">
 <input
 className={`w-16 h-8 rounded border text-sm font-bold focus:ring-primary pl-2 transition-all duration-300 ${errorsFixed.modifier
 ? "border-th-border bg-transparent text-th-secondary decoration-slate-400 line-through"
 : "border-red-900 bg-red-900/20 text-red-400"
 }`}
 type="text"
 value={errorsFixed.modifier ? "25" : "25"}
 readOnly
 />
 </td>
 <td className="px-4 py-3">
 <input className="w-16 h-8 rounded border-th-border bg-transparent text-sm focus:ring-primary pl-2 text-th-heading" type="number" defaultValue="1" />
 </td>
 <td className="px-4 py-3">
 <input className="w-24 h-8 rounded border-th-border bg-transparent text-sm focus:ring-primary pl-2 text-th-heading tabular-nums" type="text" defaultValue="$125.00" />
 </td>
 </tr>
 <tr>
 <td className="px-4 py-3">
 <input className="w-20 h-8 rounded border-th-border bg-transparent text-sm font-bold focus:ring-primary pl-2 text-th-heading" type="text" defaultValue="90658" />
 </td>
 <td className="px-4 py-3">
 <input className="w-16 h-8 rounded border-th-border bg-transparent text-sm focus:ring-primary pl-2 text-th-heading" placeholder="-" type="text" />
 </td>
 <td className="px-4 py-3">
 <input className="w-16 h-8 rounded border-th-border bg-transparent text-sm focus:ring-primary pl-2 text-th-heading" type="number" defaultValue="1" />
 </td>
 <td className="px-4 py-3">
 <input className="w-24 h-8 rounded border-th-border bg-transparent text-sm focus:ring-primary pl-2 text-th-heading tabular-nums" type="text" defaultValue="$25.00" />
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Diagnosis Section */}
 <div className="space-y-4">
 <h4 className="text-sm font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary text-lg">stethoscope</span>
 ICD-10 Diagnosis Codes
 </h4>
 <div className="grid grid-cols-1 gap-2">
 <div className="flex items-center gap-3 p-3 rounded-lg bg-th-surface-overlay/50 border border-th-border">
 <span className="text-xs font-bold bg-th-surface-overlay text-th-heading px-2 py-1 rounded">A1</span>
 <span className="text-sm flex-1 text-th-heading">Z00.00 - Encounter for general adult medical examination</span>
 <button className="text-th-secondary hover:text-red-500 transition-colors">
 <span className="material-symbols-outlined text-lg">close</span>
 </button>
 </div>
 {errorsFixed.diagnosis && (
 <div className="flex items-center gap-3 p-3 rounded-lg bg-green-900/10 border border-green-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
 <span className="text-xs font-bold bg-green-800 text-green-200 px-2 py-1 rounded">NEW</span>
 <span className="text-sm flex-1 text-th-heading">Z23 - Encounter for immunization</span>
 <button className="text-th-secondary hover:text-red-500 transition-colors">
 <span className="material-symbols-outlined text-lg">close</span>
 </button>
 </div>
 )}
 <button className="w-full py-2 border-2 border-dashed border-th-border rounded-lg text-xs font-bold text-th-secondary hover:border-primary hover:text-primary transition-all">
 + Add New Diagnosis
 </button>
 </div>
 </div>
 </div>
 </section>

 {/* Right: Validation Engine */}
 <section className="flex-1 overflow-y-auto p-6">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Validation Engine</h3>
 <div className="flex gap-2">
 <span className="px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 text-[10px] font-bold">
 {Math.max(0, 2 - Object.values(errorsFixed).filter(Boolean).length)} ERRORS
 </span>
 <span className="px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-[10px] font-bold">1 WARNING</span>
 </div>
 </div>

 <div className="space-y-4">
 {/* Error Card 1 */}
 {!errorsFixed.modifier ? (
 <div className="bg-th-surface-raised rounded-xl border-l-4 border-red-500 p-4 border border-th-border transition-all duration-300">
 <div className="flex gap-3">
 <span className="material-symbols-outlined text-red-500">error</span>
 <div className="flex-1">
 <h5 className="text-sm font-bold text-th-heading">Incompatible Modifier</h5>
 <p className="text-xs text-th-secondary mt-1 leading-relaxed">
 Modifier 25 is not typically used with CPT 99213 unless a significant, separately identifiable E/M service is performed.
 </p>
 <div className="mt-3 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
 <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
 AI Suggestion: Remove -25
 </div>
 <button
 onClick={() => handleAutoFix('modifier')}
 className="text-xs font-bold text-primary hover:bg-primary hover:text-th-heading px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
 >
 Apply Auto-Fix
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-green-900/10 rounded-xl p-4 border border-green-900/30 flex items-center justify-between animate-in fade-in duration-300">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-green-500">check_circle</span>
 <div>
 <h5 className="text-sm font-bold text-green-400">Fixed: Incompatible Modifier</h5>
 <p className="text-xs text-green-500">Modifier 25 removed from 99213.</p>
 </div>
 </div>
 <button onClick={() => setErrorsFixed(prev => ({ ...prev, modifier: false }))} className="text-xs text-th-secondary hover:text-th-heading">Undo</button>
 </div>
 )}

 {/* Error Card 2 */}
 {!errorsFixed.diagnosis ? (
 <div className="bg-th-surface-raised rounded-xl border-l-4 border-red-500 p-4 border border-th-border transition-all duration-300">
 <div className="flex gap-3">
 <span className="material-symbols-outlined text-red-500">priority_high</span>
 <div className="flex-1">
 <h5 className="text-sm font-bold text-th-heading">Diagnosis Coding Conflict</h5>
 <p className="text-xs text-th-secondary mt-1 leading-relaxed">
 CPT 90658 (Flu Vaccine) lacks a corresponding preventative diagnosis code (Z23).
 </p>
 <div className="mt-3 flex items-center justify-between">
 <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
 <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
 AI Suggestion: Add Z23
 </div>
 <button
 onClick={() => handleAutoFix('diagnosis')}
 className="text-xs font-bold text-primary hover:bg-primary hover:text-th-heading px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
 >
 Apply Auto-Fix
 </button>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-green-900/10 rounded-xl p-4 border border-green-900/30 flex items-center justify-between animate-in fade-in duration-300">
 <div className="flex items-center gap-3">
 <span className="material-symbols-outlined text-green-500">check_circle</span>
 <div>
 <h5 className="text-sm font-bold text-green-400">Fixed: Diagnosis Coding</h5>
 <p className="text-xs text-green-500">Added Z23 to encounter diagnoses.</p>
 </div>
 </div>
 <button onClick={() => setErrorsFixed(prev => ({ ...prev, diagnosis: false }))} className="text-xs text-th-secondary hover:text-th-heading">Undo</button>
 </div>
 )}

 {/* Warning Card */}
 <div className="bg-th-surface-raised rounded-xl border-l-4 border-amber-500 p-4 border border-th-border">
 <div className="flex gap-3">
 <span className="material-symbols-outlined text-amber-500">warning</span>
 <div className="flex-1">
 <h5 className="text-sm font-bold text-th-heading">Frequency Limit Pre-check</h5>
 <p className="text-xs text-th-secondary mt-1 leading-relaxed">
 Payer Medicare historically rejects 99213 more than 3 times per month for this patient. Verify encounter history.
 </p>
 <div className="mt-3">
 <button className="text-[10px] font-bold text-th-muted border border-th-border px-3 py-1 rounded hover:bg-th-surface-overlay/50 transition-colors">
 Dismiss Warning
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* AI Prediction Panel */}
 <div className="bg-primary/10 rounded-xl p-4 border border-primary/20 mt-6">
 <div className="flex items-center gap-2 mb-2">
 <span className="material-symbols-outlined text-primary text-xl">psychology</span>
 <h5 className="text-sm font-bold text-primary">AI Rejection Probability</h5>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex-1 h-2 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className={`h-full bg-primary transition-all duration-1000 ease-out`} style={{ width: Object.values(errorsFixed).every(Boolean) ? '2%' : '12%' }}></div>
 </div>
 <span className="text-sm font-extrabold text-primary transition-all tabular-nums">{Object.values(errorsFixed).every(Boolean) ? '2%' : '12%'}</span>
 </div>
 <p className="text-[10px] text-th-secondary mt-2">
 {Object.values(errorsFixed).every(Boolean)
 ? "With applied fixes, this claim is now highly likely to be paid."
 : "Based on similar claims with Aetna, this claim has a high likelihood of clean-claim status after fixes."
 }
 </p>
 </div>
 </div>
 </section>
 </div>

 {/* Bottom Payer-Specific Rule Check Panel */}
 <div className="h-48 border-t border-th-border bg-th-surface-raised flex flex-col">
 <div className="px-6 py-3 border-b border-th-border flex items-center justify-between">
 <h3 className="text-sm font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-th-secondary text-lg">fact_check</span>
 Payer-Specific Rule Check (Aetna Commercial)
 </h3>
 <div className="flex gap-4">
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-green-500"></div>
 <span className="text-[10px] font-bold text-th-muted tabular-nums">{12 + Object.values(errorsFixed).filter(Boolean).length} Passed</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="size-2 rounded-full bg-red-500"></div>
 <span className="text-[10px] font-bold text-th-muted tabular-nums">{2 - Object.values(errorsFixed).filter(Boolean).length} Failed</span>
 </div>
 </div>
 </div>
 <div className="flex-1 p-4 grid grid-cols-4 gap-4 overflow-y-auto">
 <div className="flex items-start gap-3 p-3 rounded-lg bg-th-surface-overlay/50">
 <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
 <div>
 <p className="text-[11px] font-bold text-th-heading">NCD/LCD Guidelines</p>
 <p className="text-[9px] text-th-muted">Medical necessity met for all codes.</p>
 </div>
 </div>
 <div className="flex items-start gap-3 p-3 rounded-lg bg-th-surface-overlay/50">
 <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
 <div>
 <p className="text-[11px] font-bold text-th-heading">Bundling Check (CCI)</p>
 <p className="text-[9px] text-th-muted">No prohibited combinations found.</p>
 </div>
 </div>
 {errorsFixed.modifier ? (
 <div className="flex items-start gap-3 p-3 rounded-lg bg-green-900/10 border border-green-900/30">
 <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
 <div>
 <p className="text-[11px] font-bold text-green-400">Modifier Validation</p>
 <p className="text-[9px] text-green-500">Resolved: Modifier removed.</p>
 </div>
 </div>
 ) : (
 <div className="flex items-start gap-3 p-3 rounded-lg bg-red-900/10 border border-red-900/30">
 <span className="material-symbols-outlined text-red-500 text-xl">cancel</span>
 <div>
 <p className="text-[11px] font-bold text-red-400">Modifier Validation</p>
 <p className="text-[9px] text-red-500">Conflict found on CPT 99213.</p>
 </div>
 </div>
 )}
 <div className="flex items-start gap-3 p-3 rounded-lg bg-th-surface-overlay/50">
 <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
 <div>
 <p className="text-[11px] font-bold text-th-heading">Timely Filing</p>
 <p className="text-[9px] text-th-muted">DOS is within the 90-day window.</p>
 </div>
 </div>
 </div>
 </div>

 {/* Sticky Bottom Action Footer */}
 <div className="bg-th-surface-raised border-t border-th-border px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <button className="text-sm font-bold text-th-secondary hover:text-th-heading flex items-center gap-1">
 <span className="material-symbols-outlined text-lg">file_download</span> Export PDF
 </button>
 <button className="text-sm font-bold text-th-secondary hover:text-th-heading flex items-center gap-1">
 <span className="material-symbols-outlined text-lg">print</span> Print
 </button>
 </div>
 <div className="flex items-center gap-4">
 <p className="text-xs font-medium text-th-secondary italic">Reviewing edits will recalculate the score automatically.</p>
 <button className="h-11 px-8 bg-primary text-th-heading rounded-lg font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
 <span className="material-symbols-outlined">restart_alt</span>
 Rescrub Claim
 </button>
 </div>
 </div>
 </>
 );
}
