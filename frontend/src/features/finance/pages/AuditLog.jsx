import React from 'react';

export function AuditLog() {
 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="flex flex-1 overflow-hidden h-full">
 {/* Sidebar */}
 <aside className="w-64 border-r border-th-border bg-th-surface-raised p-6 flex flex-col gap-8 hidden lg:flex">
 <div className="space-y-4">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Main Modules</h3>
 <div className="flex flex-col gap-1">
 <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-th-surface-overlay transition-all text-th-secondary w-full text-left">
 <span className="material-symbols-outlined text-th-secondary">monitoring</span>
 <span className="text-sm font-medium">Real-time Feed</span>
 </button>
 <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 w-full text-left">
 <span className="material-symbols-outlined">verified_user</span>
 <span className="text-sm font-bold">Immutable Ledger</span>
 </button>
 <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-th-surface-overlay transition-all text-th-secondary w-full text-left">
 <span className="material-symbols-outlined text-th-secondary">warning</span>
 <span className="text-sm font-medium">Tamper Alerts</span>
 <span className="ml-auto bg-red-500 text-th-heading text-[10px] px-1.5 py-0.5 rounded-full font-bold">0</span>
 </button>
 <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-th-surface-overlay transition-all text-th-secondary w-full text-left">
 <span className="material-symbols-outlined text-th-secondary">group</span>
 <span className="text-sm font-medium">Access Logs</span>
 </button>
 </div>
 </div>
 <div className="mt-auto bg-th-surface-overlay p-4 rounded-xl border border-th-border">
 <div className="flex items-center gap-2 mb-2">
 <span className="relative flex h-3 w-3">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
 </span>
 <span className="text-xs font-bold text-green-500">CHAIN SECURE</span>
 </div>
 <p className="text-[10px] text-th-secondary font-mono break-all leading-tight">
 MERKLE ROOT: 8f2b...d91c
 </p>
 <button className="mt-3 w-full py-2 bg-primary text-th-heading text-xs font-bold rounded-lg hover:brightness-110 transition-all">
 Validate Chain
 </button>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 overflow-y-auto p-8">
 {/* Header / Verification Panel */}
 <div className="max-w-5xl mx-auto space-y-8">
 <div className="flex flex-col gap-6">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <h1 className="text-3xl font-black tracking-tight text-th-heading">Audit Trail</h1>
 <p className="text-th-secondary mt-1">Cryptographic verification for mission-critical RCM compliance.</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold hover:bg-th-surface-overlay transition-colors text-th-heading">
 <span className="material-symbols-outlined text-sm">download</span>
 Export Ledger
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">security</span>
 Audit Certificate
 </button>
 </div>
 </div>
 {/* Action Panel / Chain Integrity */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 relative overflow-hidden border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
 <div className="flex flex-wrap items-center justify-between relative z-10 gap-4">
 <div className="flex items-center gap-4">
 <div className="bg-green-500/10 p-3 rounded-full">
 <span className="material-symbols-outlined text-green-500 text-3xl">verified</span>
 </div>
 <div>
 <h4 className="text-lg font-bold text-th-heading">Chain Integrity: Fully Verified</h4>
 <p className="text-th-secondary text-sm">Latest Block: <span className="font-mono text-primary tabular-nums">#1,402,982</span> -- 256-bit AES Cryptography Active</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Last Validation</p>
 <p className="text-sm font-mono font-medium text-th-heading">2023-11-24 14:32:01 UTC</p>
 </div>
 </div>
 </div>
 {/* Filters */}
 <div className="flex flex-wrap items-center gap-4 py-2">
 <span className="text-sm font-bold text-th-secondary">Filter Ledger:</span>
 <div className="flex flex-wrap gap-2">
 <button className="px-4 py-1.5 bg-primary text-th-heading rounded-full text-xs font-bold transition-all">All Activities</button>
 <button className="px-4 py-1.5 bg-th-surface-overlay hover:bg-th-surface-overlay rounded-full text-xs font-bold transition-all flex items-center gap-1 text-th-heading">
 <span className="material-symbols-outlined text-xs">medical_services</span> PHI Access
 </button>
 <button className="px-4 py-1.5 bg-th-surface-overlay hover:bg-th-surface-overlay rounded-full text-xs font-bold transition-all flex items-center gap-1 text-th-heading">
 <span className="material-symbols-outlined text-xs">payments</span> Financial Changes
 </button>
 <button className="px-4 py-1.5 bg-th-surface-overlay hover:bg-th-surface-overlay rounded-full text-xs font-bold transition-all flex items-center gap-1 text-th-heading">
 <span className="material-symbols-outlined text-xs">smart_toy</span> AI Agent Actions
 </button>
 </div>
 </div>
 </div>
 {/* Timeline Content */}
 <div className="relative pl-10 space-y-8 before:absolute before:left-5 before:top-0 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-slate-800">
 {/* Timeline Block 1 */}
 <div className="relative group">
 <div className="absolute -left-10 top-6 w-10 h-10 flex items-center justify-center">
 <div className="w-4 h-4 rounded-full bg-primary border-4 border-[#0B1120] z-10"></div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg border-l-[3px] border-l-blue-500">
 <div className="p-5 flex flex-wrap items-start justify-between gap-4">
 <div className="flex gap-4">
 <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
 <span className="material-symbols-outlined">edit_square</span>
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-bold text-lg text-th-heading">Claim #8920 Edited</h3>
 <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
 <span className="material-symbols-outlined text-[12px] fill-1">shield</span> VERIFIED
 </span>
 </div>
 <div className="flex items-center gap-4 text-xs font-medium text-th-muted">
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">person</span> Agent 04 (AI-Assistant)
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">schedule</span> 14:30:12 UTC
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">description</span> Claim #8920
 </span>
 </div>
 </div>
 </div>
 <div className="text-right flex flex-col items-end gap-1 ml-auto">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Block Hash</span>
 <span className="font-mono text-xs bg-th-surface-overlay px-2 py-1 rounded border border-th-border text-primary">
 0x71C4...3a2F9E
 </span>
 </div>
 </div>
 {/* Detailed Diff */}
 <div className="border-t border-th-border bg-th-surface-overlay/50 p-5">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Previous State</p>
 <div className="bg-red-500/5 border border-red-500/20 p-3 rounded-lg font-mono text-xs text-red-400 line-through">
 "status": "PENDING_REVIEW",<br />
 "adjustment_amount": 0.00,<br />
 "denial_code": "N/A"
 </div>
 </div>
 <div className="space-y-2">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">New State</p>
 <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-lg font-mono text-xs text-green-400">
 "status": <span className="bg-green-500/20 px-1">"APPROVED"</span>,<br />
 "adjustment_amount": <span className="bg-green-500/20 px-1 tabular-nums">142.50</span>,<br />
 "denial_code": "N/A"
 </div>
 </div>
 </div>
 <div className="mt-4 pt-4 border-t border-th-border flex justify-between items-center">
 <p className="text-[10px] text-th-muted">Transaction confirmed by 12 network nodes.</p>
 <button className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
 View Full Ledger Entry <span className="material-symbols-outlined text-sm">open_in_new</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 {/* Timeline Block 2 */}
 <div className="relative group">
 <div className="absolute -left-10 top-6 w-10 h-10 flex items-center justify-center">
 <div className="w-4 h-4 rounded-full bg-th-surface-overlay border-4 border-[#0B1120] z-10"></div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/50 opacity-80 hover:opacity-100 group-hover:opacity-100 hover:-translate-y-0.5 hover:shadow-lg border-l-[3px] border-l-amber-500">
 <div className="p-5 flex flex-wrap items-start justify-between gap-4">
 <div className="flex gap-4">
 <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
 <span className="material-symbols-outlined">visibility</span>
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-bold text-lg text-th-heading">PHI Access by User: J. Doe</h3>
 <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
 <span className="material-symbols-outlined text-[12px] fill-1">shield</span> VERIFIED
 </span>
 </div>
 <div className="flex items-center gap-4 text-xs font-medium text-th-muted">
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">fingerprint</span> Auth: OAuth2 / Biometric
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">schedule</span> 14:28:45 UTC
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">person</span> J. Doe
 </span>
 </div>
 </div>
 </div>
 <div className="text-right flex flex-col items-end gap-1 ml-auto">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Block Hash</span>
 <span className="font-mono text-xs bg-th-surface-overlay px-2 py-1 rounded border border-th-border text-primary">
 0x3B9D...e91A84
 </span>
 </div>
 </div>
 </div>
 </div>
 {/* Timeline Block 3 */}
 <div className="relative group">
 <div className="absolute -left-10 top-6 w-10 h-10 flex items-center justify-center">
 <div className="w-4 h-4 rounded-full bg-th-surface-overlay border-4 border-[#0B1120] z-10"></div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/50 opacity-80 hover:opacity-100 group-hover:opacity-100 hover:-translate-y-0.5 hover:shadow-lg border-l-[3px] border-l-purple-500">
 <div className="p-5 flex flex-wrap items-start justify-between gap-4">
 <div className="flex gap-4">
 <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
 <span className="material-symbols-outlined">psychology</span>
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1 flex-wrap">
 <h3 className="font-bold text-lg text-th-heading">AI Policy Update: Med-A1</h3>
 <span className="flex items-center gap-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/20">
 <span className="material-symbols-outlined text-[12px] fill-1">shield</span> VERIFIED
 </span>
 </div>
 <div className="flex items-center gap-4 text-xs font-medium text-th-muted">
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">auto_awesome</span> System Origin
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">schedule</span> 14:15:22 UTC
 </span>
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm">policy</span> Policy Med-A1
 </span>
 </div>
 </div>
 </div>
 <div className="text-right flex flex-col items-end gap-1 ml-auto">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Block Hash</span>
 <span className="font-mono text-xs bg-th-surface-overlay px-2 py-1 rounded border border-th-border text-primary">
 0xF281...C20D41
 </span>
 </div>
 </div>
 </div>
 </div>
 {/* Load More */}
 <div className="pt-4 pb-12">
 <button className="flex items-center gap-2 mx-auto px-6 py-2 bg-th-surface-overlay border border-th-border rounded-full text-xs font-bold hover:bg-th-surface-overlay transition-all text-th-heading">
 <span className="material-symbols-outlined text-sm">history</span>
 Load Older Block Data
 </button>
 </div>
 </div>
 </div>
 </main>
 </div>
 </div>
 );
}
