import React from 'react';

export function RuleEngine() {
 return (
 <div className="flex h-full font-sans text-th-heading overflow-hidden p-6 custom-scrollbar">
 <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full h-full">
 {/* Header */}
 <div className="flex justify-between items-end shrink-0">
 <div>
 <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-th-heading">
 AI Claim Rule Engine
 <span className="ai-prescriptive">Prescriptive AI</span>
 </h1>
 <p className="text-th-secondary text-sm mt-1">Build, test, and monitor automated validation logic.</p>
 </div>
 <button className="bg-primary text-[#0B1120] px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20">
 <span className="material-symbols-outlined">add</span> Create New Rule
 </button>
 </div>

 <div className="flex gap-6 flex-1 overflow-hidden">
 {/* Rule List */}
 <div className="w-1/3 bg-th-surface-raised border border-th-border rounded-xl flex flex-col overflow-hidden">
 <div className="p-4 border-b border-th-border">
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-muted">search</span>
 <input className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg pl-10 h-10 text-sm focus:ring-1 focus:ring-primary placeholder:text-th-muted text-th-heading" placeholder="Search rules..." type="text" />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar">
 {[
 { name: 'Medicare LCD Check', type: 'Clinical', active: true, count: 1240 },
 { name: 'Missing Modifier 25', type: 'Coding', active: true, count: 850 },
 { name: 'BCBS Home Health', type: 'Payer Policy', active: false, count: 120 },
 { name: 'Duplicate Service', type: 'Admin', active: true, count: 2100 },
 { name: 'Invalid Diagnosis', type: 'Clinical', active: true, count: 430 },
 ].map((rule, i) => (
 <div key={i} className={`p-4 border-b border-th-border cursor-pointer hover:bg-th-surface-overlay/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${i === 0 ? 'bg-th-surface-overlay/50 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
 <div className="flex justify-between items-start mb-1">
 <h4 className={`text-sm font-bold ${i === 0 ? 'text-primary' : 'text-th-heading'}`}>{rule.name}</h4>
 {rule.active ? (
 <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">ACTIVE</span>
 ) : (
 <span className="text-[10px] text-th-muted font-bold bg-th-surface-overlay/300/10 px-1.5 py-0.5 rounded">PAUSED</span>
 )}
 </div>
 <div className="flex justify-between items-center text-xs text-th-secondary">
 <span>{rule.type}</span>
 <span className="tabular-nums">{rule.count} Hits</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Rule Editor (Canvas) */}
 <div className="flex-1 bg-th-surface-overlay/30 rounded-xl border border-th-border relative overflow-hidden flex flex-col shadow-inner">
 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

 {/* Editor Toolbar */}
 <div className="h-12 border-b border-th-border bg-th-surface-raised flex items-center justify-between px-4 shrink-0 relative z-10">
 <div className="flex items-center gap-2 text-sm text-th-secondary">
 <span className="font-bold text-th-heading">Medicare LCD Check</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span>v2.4 (Draft)</span>
 </div>
 <div className="flex gap-2">
 <button className="p-1.5 hover:bg-th-surface-overlay rounded text-th-secondary"><span className="material-symbols-outlined text-lg">undo</span></button>
 <button className="p-1.5 hover:bg-th-surface-overlay rounded text-th-secondary"><span className="material-symbols-outlined text-lg">redo</span></button>
 <button className="px-3 py-1 bg-primary text-[#0B1120] font-bold text-xs rounded hover:brightness-110">Save</button>
 </div>
 </div>

 {/* Visual Logic Flow */}
 <div className="flex-1 p-8 relative z-0 overflow-auto flex items-center justify-center">
 <div className="flex flex-col items-center gap-8">
 {/* Node 1 */}
 <div className="bg-th-surface-raised border border-primary p-4 rounded-xl w-64 shadow-[0_0_15px_rgba(59,130,246,0.1)] relative">
 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-[#0B1120] text-[10px] font-bold px-2 py-0.5 rounded uppercase">Trigger</div>
 <p className="text-sm font-bold text-center text-th-heading">New Claim Created</p>
 <div className="h-4 w-4 bg-th-surface-raised border-b border-r border-primary absolute -bottom-2 create-triangle left-1/2 -translate-x-1/2 rotate-45"></div>
 </div>

 {/* Line */}
 <div className="h-8 w-px bg-slate-600"></div>

 {/* Node 2 */}
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl w-64 relative">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Condition</div>
 <p className="text-sm font-bold text-th-heading">Payer == "Medicare"</p>
 </div>

 {/* Line */}
 <div className="h-8 w-px bg-slate-600"></div>

 {/* Node 3 */}
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl w-64 relative">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Look Up</div>
 <p className="text-sm font-bold text-th-heading">Check NCD Database</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
