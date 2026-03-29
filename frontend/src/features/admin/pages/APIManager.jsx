import React from 'react';

export function APIManager() {
 return (
 <div className="flex h-full font-sans text-th-heading overflow-hidden">
 {/* Left Sidebar: Endpoint Registry */}
 <aside className="w-72 border-r border-th-border bg-th-surface-raised flex flex-col shrink-0">
 <div className="p-4 border-b border-th-border flex justify-between items-center">
 <h2 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Endpoint Registry</h2>
 <button className="text-blue-400 hover:bg-blue-500/10 p-1 rounded">
 <span className="material-symbols-outlined text-xl">add_circle</span>
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
 <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex flex-col gap-1 cursor-pointer">
 <div className="flex justify-between items-start">
 <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/20">REST</span>
 <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
 </div>
 <p className="text-sm font-medium text-th-heading">Epic FHIR Gateway</p>
 <p className="text-xs text-th-muted truncate font-mono">/api/v4/fhir/r4</p>
 </div>
 <div className="p-3 rounded-lg hover:bg-th-surface-overlay/50 border border-transparent hover:border-th-border flex flex-col gap-1 transition-all cursor-pointer">
 <div className="flex justify-between items-start">
 <span className="text-[10px] font-bold text-th-secondary px-1.5 py-0.5 rounded bg-th-surface-overlay">GQL</span>
 <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
 </div>
 <p className="text-sm font-medium text-th-heading">Claims Graph Service</p>
 <p className="text-xs text-th-muted truncate font-mono">/graphql/claims</p>
 </div>
 <div className="p-3 rounded-lg hover:bg-th-surface-overlay/50 border border-transparent hover:border-th-border flex flex-col gap-1 transition-all cursor-pointer">
 <div className="flex justify-between items-start">
 <span className="text-[10px] font-bold text-th-secondary px-1.5 py-0.5 rounded bg-th-surface-overlay">REST</span>
 <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
 </div>
 <p className="text-sm font-medium text-th-heading">Payer Auth Proxy</p>
 <p className="text-xs text-th-muted truncate font-mono">/auth/v1/sessions</p>
 </div>
 </div>
 <div className="p-4 border-t border-th-border">
 <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-th-heading rounded-lg text-sm font-bold flex items-center justify-center gap-2">
 <span className="material-symbols-outlined text-lg">key</span>
 <span>Manage Secrets</span>
 </button>
 </div>
 </aside>

 {/* Main Workspace */}
 <main className="flex-1 overflow-y-auto flex flex-col">
 <div className="p-6 space-y-6">
 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 p-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Avg Latency</p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-2xl font-bold font-mono text-th-heading tabular-nums">240<span className="text-sm text-th-muted ml-1">ms</span></h3>
 <span className="text-rose-500 text-xs font-medium tabular-nums">-12ms</span>
 </div>
 <div className="mt-4 h-8 w-full bg-blue-500/5 rounded flex items-end gap-1 px-1">
 {[20, 30, 40, 75, 50, 60].map((h, i) => (
 <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
 ))}
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 p-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Throughput</p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-2xl font-bold font-mono text-th-heading tabular-nums">1.2<span className="text-sm text-th-muted ml-1">k/s</span></h3>
 <span className="text-emerald-500 text-xs font-medium tabular-nums">+5%</span>
 </div>
 <div className="mt-4 h-8 w-full bg-blue-500/5 rounded flex items-end gap-1 px-1">
 {[60, 50, 70, 80, 75, 90].map((h, i) => (
 <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
 ))}
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 p-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Error Rate</p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-2xl font-bold font-mono text-th-heading tabular-nums">0.02<span className="text-sm text-th-muted ml-1">%</span></h3>
 <span className="text-emerald-500 text-xs font-medium tabular-nums">-0.01%</span>
 </div>
 <div className="mt-4 h-8 w-full bg-blue-500/5 rounded flex items-end gap-1 px-1">
 <div className="flex-1 bg-blue-500/20 h-1/6 rounded-t-sm"></div>
 <div className="flex-1 bg-blue-500/20 h-1/6 rounded-t-sm"></div>
 <div className="flex-1 bg-blue-500/20 h-1/6 rounded-t-sm"></div>
 <div className="flex-1 bg-rose-500/50 h-2/3 rounded-t-sm"></div>
 <div className="flex-1 bg-blue-500/20 h-1/6 rounded-t-sm"></div>
 <div className="flex-1 bg-blue-500/20 h-1/6 rounded-t-sm"></div>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 p-5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Uptime</p>
 <div className="flex items-baseline gap-2">
 <h3 className="text-2xl font-bold font-mono text-th-heading tabular-nums">99.99<span className="text-sm text-th-muted ml-1">%</span></h3>
 <span className="text-emerald-500 text-xs font-medium">Stable</span>
 </div>
 <div className="mt-4 h-8 w-full bg-blue-500/5 rounded flex items-end gap-1 px-1">
 {[100, 100, 100, 100, 100, 100].map((h, i) => (
 <div key={i} className="flex-1 bg-blue-500/60 rounded-t-sm" style={{ height: `${h}%` }}></div>
 ))}
 </div>
 </div>
 </div>

 {/* Webhook Orchestrator */}
 <div className="flex flex-col gap-6">
 <div className="flex justify-between items-center">
 <div>
 <h2 className="text-xl font-bold text-th-heading">Webhook Orchestrator</h2>
 <p className="text-th-secondary text-sm">Configure event-driven ETL triggers for external systems.</p>
 </div>
 <div className="flex gap-2">
 <button className="flex items-center gap-2 px-3 py-2 bg-th-surface-overlay border border-th-border-strong rounded-lg text-sm font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-lg">sync</span> Refresh
 </button>
 <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-th-heading rounded-lg text-sm font-bold transition-colors">
 <span className="material-symbols-outlined text-lg">add</span> New Webhook
 </button>
 </div>
 </div>

 {/* Webhook Card 1 */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:border-blue-500/50 transition-colors group">
 <div className="flex flex-col md:flex-row gap-6">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-3">
 <h4 className="font-bold text-lg text-th-heading">ETL Pipeline Alpha</h4>
 <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">99.4% Delivery Rate</span>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted block mb-1">Target URL</label>
 <div className="flex items-center gap-2 bg-th-surface-base px-3 py-2 rounded border border-th-border">
 <span className="material-symbols-outlined text-th-muted text-base">link</span>
 <span className="text-sm font-mono text-blue-400">https://etl.data-core.io/v1/rcm/claims</span>
 </div>
 </div>
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted block mb-1">Subscribed Events</label>
 <div className="flex flex-wrap gap-2">
 {['claim.updated', 'denial.received', 'payer.ack'].map((tag, i) => (
 <span key={i} className="px-2 py-1 bg-th-surface-base rounded text-xs border border-th-border text-th-heading">{tag}</span>
 ))}
 </div>
 </div>
 </div>
 </div>
 <div className="w-px bg-th-surface-overlay hidden md:block"></div>
 <div className="md:w-64 flex flex-col justify-between py-1">
 <div className="flex flex-col gap-4">
 <div className="flex justify-between items-center">
 <span className="text-sm text-th-secondary">Retry Logic</span>
 <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
 <div className="absolute right-1 top-1 size-3 bg-white rounded-full"></div>
 </div>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-sm text-th-secondary">Exp. Backoff</span>
 <span className="text-sm font-medium text-th-heading">Enabled</span>
 </div>
 </div>
 <div className="flex gap-2 mt-4">
 <button className="flex-1 py-1.5 border border-th-border rounded bg-th-surface-base text-xs font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">Test</button>
 <button className="flex-1 py-1.5 border border-th-border rounded bg-th-surface-base text-xs font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">Edit</button>
 </div>
 </div>
 </div>
 </div>

 {/* Webhook Card 2 */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:border-blue-500/50 transition-colors group opacity-80">
 <div className="flex flex-col md:flex-row gap-6">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-3">
 <h4 className="font-bold text-lg text-th-secondary">Patient Data Sync</h4>
 <span className="bg-th-surface-overlay text-th-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-th-border italic">Paused</span>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-semibold uppercase tracking-wider text-th-muted block mb-1">Target URL</label>
 <div className="flex items-center gap-2 bg-th-surface-base px-3 py-2 rounded border border-th-border">
 <span className="material-symbols-outlined text-th-muted text-base">link</span>
 <span className="text-sm font-mono text-th-muted">https://hooks.slack.com/services/T0123...</span>
 </div>
 </div>
 </div>
 </div>
 <div className="w-px bg-th-surface-overlay hidden md:block"></div>
 <div className="md:w-64 flex flex-col justify-between py-1">
 <div className="md:w-64 flex flex-col gap-4">
 <div className="flex justify-between items-center text-th-muted">
 <span className="text-sm">Retry Logic</span>
 <div className="w-10 h-5 bg-th-surface-overlay rounded-full relative cursor-pointer">
 <div className="absolute left-1 top-1 size-3 bg-slate-400 rounded-full"></div>
 </div>
 </div>
 <div className="flex gap-2 mt-4">
 <button className="flex-1 py-1.5 border border-th-border rounded bg-th-surface-base text-xs text-th-secondary">Resume</button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </main>

 {/* Right Panel: Payload Inspector */}
 <aside className="w-80 border-l border-th-border bg-th-surface-raised flex flex-col shrink-0 hidden xl:flex">
 <div className="p-4 border-b border-th-border flex items-center gap-2">
 <span className="material-symbols-outlined text-blue-400 text-lg">terminal</span>
 <h2 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Payload Inspector</h2>
 </div>
 <div className="flex-1 overflow-y-auto">
 {/* Log Items */}
 <div className="p-4 border-b border-th-border bg-blue-500/5">
 <div className="flex justify-between items-center mb-2">
 <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">200 OK</span>
 <span className="text-[10px] font-mono text-th-muted">14:20:05.12</span>
 </div>
 <p className="text-xs font-mono text-th-heading truncate mb-3">POST /v1/rcm/claims</p>
 <div className="bg-th-surface-base rounded p-3 font-mono text-[11px] text-blue-400 overflow-x-hidden leading-relaxed">
 <span className="text-blue-400">&quot;event&quot;</span>: <span className="text-emerald-400">&quot;claim.updated&quot;</span>,<br />
 <div className="pl-2">
 <span className="text-blue-400">&quot;id&quot;</span>: <span className="text-emerald-400">&quot;cl_9281X&quot;</span>,<br />
 <span className="text-blue-400">&quot;status&quot;</span>: <span className="text-emerald-400">&quot;paid&quot;</span>
 </div>
 </div>
 </div>

 <div className="p-4 border-b border-th-border">
 <div className="flex justify-between items-center mb-2">
 <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">500 ERR</span>
 <span className="text-[10px] font-mono text-th-muted">14:19:58.44</span>
 </div>
 <p className="text-xs font-mono text-th-heading truncate mb-3">POST /v1/rcm/claims</p>
 <div className="bg-th-surface-base rounded p-3 font-mono text-[11px] text-th-secondary leading-relaxed italic">
 Connection timeout while reaching target host. Retrying in 5s...
 </div>
 </div>
 </div>
 <div className="p-4 bg-th-surface-base border-t border-th-border flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <span className="text-[10px] font-bold text-th-muted uppercase tracking-widest">Live Stream</span>
 </div>
 <button className="text-th-muted hover:text-th-heading transition-colors">
 <span className="material-symbols-outlined text-lg">delete</span>
 </button>
 </div>
 </aside>
 </div>
 );
}
