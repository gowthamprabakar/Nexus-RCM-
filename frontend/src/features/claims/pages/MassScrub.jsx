import React from 'react';

export function MassScrub() {
 return (
 <div className="flex h-full font-sans text-th-heading overflow-hidden p-6 custom-scrollbar">
 <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
 {/* Header */}
 <div className="flex justify-between items-end">
 <div>
 <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-th-heading">
 Mass Scrub Configuration
 <span className="ai-predictive">Predictive AI</span>
 </h1>
 <p className="text-th-secondary text-sm mt-1">Run AI validation logic across massive claim datasets.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Configuration Panel */}
 <div className="lg:col-span-2 space-y-6">
 <section className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">tune</span> Configuration
 </h3>
 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Target Payer Group</label>
 <select className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg h-10 px-3 text-sm text-th-heading focus:ring-primary">
 <option>All Payers</option>
 <option>Medicare Part A & B</option>
 <option>Commercial - United</option>
 <option>Commercial - Aetna</option>
 </select>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Date Range</label>
 <select className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg h-10 px-3 text-sm text-th-heading focus:ring-primary">
 <option>Last 30 Days</option>
 <option>This Quarter</option>
 <option>Custom Range</option>
 </select>
 </div>
 </div>
 <div className="mt-6 space-y-4">
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted">Rule Sets to Apply</label>
 <div className="grid grid-cols-2 gap-4">
 <label className="flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-th-surface-overlay/50 cursor-pointer transition-colors bg-th-surface-overlay/30">
 <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
 <div>
 <p className="font-bold text-sm text-th-heading">Standard NCD/LCD</p>
 <p className="text-xs text-th-secondary">CMS medical necessity checks</p>
 </div>
 </label>
 <label className="flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-th-surface-overlay/50 cursor-pointer transition-colors bg-th-surface-overlay/30">
 <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
 <div>
 <p className="font-bold text-sm text-th-heading">CCI Bundling Edits</p>
 <p className="text-xs text-th-secondary">Prevents unbundling errors</p>
 </div>
 </label>
 <label className="flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-th-surface-overlay/50 cursor-pointer transition-colors bg-th-surface-overlay/30">
 <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
 <div>
 <p className="font-bold text-sm text-th-heading">Payer Specific Rules</p>
 <p className="text-xs text-th-secondary">United/Aetna policy checks</p>
 </div>
 </label>
 <label className="flex items-center gap-3 p-3 rounded-lg border border-th-border hover:bg-th-surface-overlay/50 cursor-pointer transition-colors bg-th-surface-overlay/30">
 <input type="checkbox" className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
 <div>
 <p className="font-bold text-sm text-th-heading">Experimental AI</p>
 <p className="text-xs text-th-secondary">Deep learning pattern match</p>
 </div>
 </label>
 </div>
 </div>
 </section>

 {/* Dry Run Outcome — flat, terminal aesthetic */}
 <section className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-primary rounded-xl p-6">
 <h3 className="text-xs font-bold uppercase tracking-wider text-th-muted mb-4 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">view_in_ar</span> Simulation Results (Dry Run)
 </h3>
 <div className="grid grid-cols-3 gap-6">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Impacted Claims</p>
 <p className="text-3xl font-black text-th-heading tabular-nums">4,821</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Est. Revenue Saved</p>
 <p className="text-3xl font-black text-emerald-500 tabular-nums">$842k</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">New Errors Found</p>
 <p className="text-3xl font-black text-rose-500 tabular-nums">128</p>
 </div>
 </div>
 <div className="mt-6 pt-6 border-t border-th-border">
 <p className="text-xs text-th-secondary mb-4">
 <span className="font-bold text-th-heading">Heads up —</span> this job locks the selected claims for ~45 minutes.
 </p>
 <button className="w-full py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-base" aria-hidden="true">play_circle</span> Execute Mass Scrub
 </button>
 </div>
 </section>
 </div>

 {/* Right Sidebar: Recent Events */}
 <div className="lg:col-span-1">
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 rounded-xl flex flex-col h-full hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="p-5 border-b border-th-border">
 <h3 className="font-bold text-th-heading">Execution Log</h3>
 </div>
 <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
 {[1, 2, 3, 4, 5].map((i) => (
 <div key={i} className="flex gap-3">
 <div className="flex flex-col items-center gap-1">
 <div className="size-2 rounded-full bg-th-muted/30"></div>
 <div className="w-px h-full bg-th-surface-overlay"></div>
 </div>
 <div className="pb-4">
 <p className="text-xs font-bold text-th-secondary">Oct 2{i}, 14:00</p>
 <p className="text-sm font-bold text-th-heading">Manual Scrub: Medicare</p>
 <p className="text-xs text-th-muted mt-1">Found 42 errors across 1,200 claims.</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
