import React from 'react';

export function ModelRegistry() {
 return (
 <div className="flex h-full font-sans bg-th-surface-base text-th-heading">
 {/* Main Content Area */}
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
 <div className="lg:col-span-3 space-y-6">
 {/* Header */}
 <div className="flex flex-wrap items-end justify-between gap-4 border-b border-th-border pb-6">
 <div>
 <h2 className="text-3xl font-black text-th-heading tracking-tight uppercase">Model Registry <span className="text-primary">& Retraining History</span></h2>
 <p className="text-th-secondary font-mono text-sm mt-1">Lifecycle Tracking ID: US-PROD-RCM-8821 // Audit Trail: ACTIVE</p>
 </div>
 <div className="flex gap-2">
 <button className="bg-th-surface-raised border border-th-border text-th-heading font-bold text-sm px-4 py-2 rounded flex items-center gap-2 hover:bg-th-surface-overlay">
 <span className="material-symbols-outlined text-sm">filter_list</span> Filter History
 </button>
 <button className="bg-primary text-[#0a1111] font-bold text-sm px-4 py-2 rounded flex items-center gap-2 shadow-lg shadow-primary/10">
 <span className="material-symbols-outlined text-sm">add_box</span> New Version
 </button>
 </div>
 </div>

 {/* Chronological Event Log */}
 <div className="space-y-4">
 <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-th-secondary flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">schedule</span> Chronological Event Log
 </h3>
 <div className="relative pl-12 space-y-6">
 {/* Timeline Line */}
 <div className="absolute left-[21px] top-0 bottom-0 w-[2px] bg-th-surface-overlay"></div>

 {/* Event 1 */}
 <div className="relative">
 <div className="absolute -left-10 top-0 size-10 rounded bg-primary flex items-center justify-center text-[#0a1111] z-10">
 <span className="material-symbols-outlined">rocket_launch</span>
 </div>
 <div className="bg-th-surface-raised border border-th-border p-5 rounded-lg shadow-[0_0_15px_rgba(19,236,236,0.15)] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
 <div className="flex items-center gap-4">
 <div className="bg-th-surface-overlay border border-th-border px-3 py-1 rounded text-xs font-mono font-bold text-th-heading">v2.4.0-FINAL</div>
 <div>
 <h4 className="text-th-heading font-bold">Denial Predictor - Production Promotion</h4>
 <p className="text-xs text-th-secondary font-mono">2023-11-20 14:42:01 UTC</p>
 </div>
 </div>
 <div className="flex gap-3 text-right">
 <div>
 <p className="text-[10px] text-th-secondary uppercase">Performance Delta</p>
 <p className="text-sm font-mono font-bold text-[#00ff9d] tabular-nums">+2.4% Accuracy</p>
 </div>
 <div>
 <p className="text-[10px] text-th-secondary uppercase">F1 Improvement</p>
 <p className="text-sm font-mono font-bold text-primary tabular-nums">+0.012</p>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-th-border-subtle">
 <div>
 <p className="text-[10px] text-th-secondary uppercase mb-1">Training Dataset Range</p>
 <p className="text-xs font-mono text-th-heading">2023-01-01 -&gt; 2023-10-31</p>
 </div>
 <div>
 <p className="text-[10px] text-th-secondary uppercase mb-1">Reason for Retraining</p>
 <p className="text-xs text-th-heading flex items-center gap-1">
 <span className="material-symbols-outlined text-xs text-[#ff4d4d]">error</span> Drift Threshold Exceeded (PSI: <span className="tabular-nums">0.22</span>)
 </p>
 </div>
 </div>
 </div>
 </div>

 {/* Event 2 */}
 <div className="relative">
 <div className="absolute -left-10 top-0 size-10 rounded bg-th-surface-overlay flex items-center justify-center text-primary z-10 border border-primary/20">
 <span className="material-symbols-outlined">model_training</span>
 </div>
 <div className="bg-th-surface-raised border border-th-border p-5 rounded-lg opacity-80 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
 <div className="flex items-center gap-4">
 <div className="bg-th-surface-overlay border border-th-border px-3 py-1 rounded text-xs font-mono font-bold text-th-secondary">v2.3.8-BETA</div>
 <div>
 <h4 className="text-th-heading font-bold">Coding Agent - Automated Retrain</h4>
 <p className="text-xs text-th-secondary font-mono">2023-11-18 02:15:00 UTC</p>
 </div>
 </div>
 <div className="flex gap-3 text-right">
 <div>
 <p className="text-[10px] text-th-secondary uppercase">Accuracy Delta</p>
 <p className="text-sm font-mono font-bold text-th-heading tabular-nums">-0.1% (Stable)</p>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-th-border-subtle">
 <div>
 <p className="text-[10px] text-th-secondary uppercase mb-1">Training Dataset Range</p>
 <p className="text-xs font-mono text-th-heading">2023-09-01 -&gt; 2023-11-15</p>
 </div>
 <div>
 <p className="text-[10px] text-th-secondary uppercase mb-1">Reason for Retraining</p>
 <p className="text-xs text-th-heading">Scheduled Maintenance Cycle</p>
 </div>
 </div>
 </div>
 </div>

 {/* Event 3 */}
 <div className="relative">
 <div className="absolute -left-10 top-0 size-10 rounded bg-th-surface-overlay flex items-center justify-center text-th-secondary z-10 border border-th-border">
 <span className="material-symbols-outlined">history</span>
 </div>
 <div className="bg-th-surface-raised border border-th-border p-5 rounded-lg opacity-60">
 <div className="flex items-center gap-4 mb-4">
 <div className="bg-th-surface-overlay border border-th-border px-3 py-1 rounded text-xs font-mono font-bold text-th-muted">v2.3.5</div>
 <h4 className="text-th-secondary font-bold">Revenue Forecaster - Hotfix Deployment</h4>
 </div>
 <p className="text-[10px] text-th-muted uppercase italic">Detailed logs archived to cold storage</p>
 </div>
 </div>
 </div>
 </div>

 {/* Environment Matrix Table */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden mt-8">
 <div className="p-6 border-b border-th-border flex justify-between items-center bg-th-surface-overlay/30">
 <h3 className="text-lg font-bold text-th-heading">Environment Matrix</h3>
 <span className="text-[10px] font-mono text-th-secondary tabular-nums">LATEST HEARTBEAT: 2s ago</span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="text-[10px] uppercase tracking-widest text-th-secondary border-b border-th-border">
 <th className="px-6 py-4 font-bold">Model Agent</th>
 <th className="px-6 py-4 font-bold">Environment</th>
 <th className="px-6 py-4 font-bold">Active Version</th>
 <th className="px-6 py-4 font-bold">Status</th>
 <th className="px-6 py-4 font-bold text-right">Traffic</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border-subtle text-sm">
 <tr>
 <td className="px-6 py-4 text-th-heading font-medium">Denial Predictor</td>
 <td className="px-6 py-4">
 <span className="bg-[#00ff9d]/10 text-[#00ff9d] text-[10px] font-bold px-2 py-0.5 rounded border border-[#00ff9d]/20">PRODUCTION</span>
 </td>
 <td className="px-6 py-4 font-mono text-primary">v2.4.0-FINAL</td>
 <td className="px-6 py-4 flex items-center gap-2 text-[#00ff9d]">
 <span className="size-2 rounded-full bg-[#00ff9d]"></span> Optimal
 </td>
 <td className="px-6 py-4 text-right font-mono tabular-nums">100%</td>
 </tr>
 <tr>
 <td className="px-6 py-4 text-th-heading font-medium">Coding Agent</td>
 <td className="px-6 py-4">
 <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded border border-primary/20">STAGING</span>
 </td>
 <td className="px-6 py-4 font-mono text-th-secondary">v2.3.8-BETA</td>
 <td className="px-6 py-4 flex items-center gap-2 text-primary">
 <span className="size-2 rounded-full bg-primary animate-pulse"></span> Testing
 </td>
 <td className="px-6 py-4 text-right font-mono tabular-nums">15% Shadow</td>
 </tr>
 <tr>
 <td className="px-6 py-4 text-th-heading font-medium">Revenue Forecaster</td>
 <td className="px-6 py-4">
 <span className="bg-[#00ff9d]/10 text-[#00ff9d] text-[10px] font-bold px-2 py-0.5 rounded border border-[#00ff9d]/20">PRODUCTION</span>
 </td>
 <td className="px-6 py-4 font-mono text-th-secondary">v2.3.5</td>
 <td className="px-6 py-4 flex items-center gap-2 text-[#ff4d4d]">
 <span className="size-2 rounded-full bg-[#ff4d4d]"></span> Warning
 </td>
 <td className="px-6 py-4 text-right font-mono tabular-nums">100%</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Right Sidebar: Rollback Controls */}
 <div className="lg:col-span-1 space-y-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl flex flex-col h-full border-l-[3px] border-l-[#ff4d4d]">
 <div className="p-6 border-b border-th-border bg-[#ff4d4d]/5">
 <h3 className="text-lg font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-[#ff4d4d]">restart_alt</span>
 Rollback Controls
 </h3>
 <p className="text-xs text-th-secondary mt-1">One-click revert to stable state</p>
 </div>
 <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
 <p className="text-[10px] uppercase font-bold text-th-secondary px-2">Last Known Stable Versions</p>

 <div className="bg-th-surface-overlay/30 border border-th-border rounded-lg p-4 hover:border-[#ff4d4d]/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group cursor-pointer box-border">
 <div className="flex justify-between items-start mb-2">
 <span className="text-xs font-mono font-bold text-th-heading bg-th-surface-overlay px-2 py-1 rounded">v2.3.1</span>
 <span className="text-[10px] text-[#00ff9d] font-bold">STABLE</span>
 </div>
 <h4 className="text-sm font-bold text-th-heading">Denial Predictor - Core</h4>
 <p className="text-[10px] text-th-secondary mt-1">Deactivated: 2023-11-20</p>
 <button className="mt-4 w-full py-2 bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/20 rounded font-bold text-xs uppercase hover:bg-[#ff4d4d] hover:text-th-heading transition-all">
 Immediate Revert
 </button>
 </div>

 <div className="bg-th-surface-overlay/30 border border-th-border rounded-lg p-4 hover:border-[#ff4d4d]/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group cursor-pointer box-border">
 <div className="flex justify-between items-start mb-2">
 <span className="text-xs font-mono font-bold text-th-heading bg-th-surface-overlay px-2 py-1 rounded">v2.2.0</span>
 <span className="text-[10px] text-[#00ff9d] font-bold">LEGACY</span>
 </div>
 <h4 className="text-sm font-bold text-th-heading">Revenue Forecaster</h4>
 <p className="text-[10px] text-th-secondary mt-1">Last seen active: Oct 2023</p>
 <button className="mt-4 w-full py-2 bg-th-surface-overlay/30 text-th-secondary border border-th-border rounded font-bold text-xs uppercase hover:bg-[#ff4d4d] hover:text-th-heading transition-all">
 Emergency Revert
 </button>
 </div>
 </div>
 <div className="p-4 bg-th-surface-base/50 border-t border-th-border">
 <div className="flex items-center gap-3 p-3 bg-[#ff4d4d]/5 rounded border border-[#ff4d4d]/20 mb-4">
 <span className="material-symbols-outlined text-[#ff4d4d]">gpp_maybe</span>
 <p className="text-[10px] text-th-heading leading-tight">Rolling back will disrupt existing inference sessions for ~30s.</p>
 </div>
 <button className="w-full py-3 bg-th-surface-overlay text-th-heading rounded font-bold text-sm border border-th-border hover:border-primary/50 transition-all">
 VIEW GLOBAL SNAPSHOTS
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
