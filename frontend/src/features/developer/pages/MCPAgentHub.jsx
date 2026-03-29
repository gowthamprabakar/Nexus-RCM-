import React, { useState } from 'react';

export function MCPAgentHub() {
 const [activeTab, setActiveTab] = useState('claims');

 const tabs = [
 { id: 'claims', label: 'Claims Intake', icon: 'account_balance_wallet', count: 4 },
 { id: 'denials', label: 'Denial Mgmt', icon: 'gavel', count: 6 },
 { id: 'coding', label: 'Coding Opt', icon: 'medical_information', count: 5 },
 ];

 return (
 <div className="flex flex-col h-full overflow-hidden font-sans">
 {/* Horizontal Tabs replacing left sidebar */}
 <div className="px-6 pt-4 pb-0">
 <div className="flex items-center gap-6 border-b border-th-border">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
 ? 'border-primary text-primary'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 }`}
 >
 <span className="material-symbols-outlined text-lg">{tab.icon}</span>
 {tab.label}
 <span className={`text-[10px] px-1.5 rounded ${activeTab === tab.id ? 'bg-primary text-th-heading' : 'bg-th-surface-overlay text-th-secondary'}`}>{tab.count}</span>
 </button>
 ))}
 <div className="ml-auto flex items-center gap-3 pb-3">
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>
 </div>
 </div>

 <main className="flex-1 flex overflow-hidden">
 {/* Center Stage: Network Visualization */}
 <section className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent overflow-hidden">
 {/* SVG Connections Overlay */}
 <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
 <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 20% 20%" fill="none"></path>
 <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 80% 20%" fill="none"></path>
 <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 20% 80%" fill="none"></path>
 <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 80% 80%" fill="none"></path>
 <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 50% 15%" fill="none"></path>
 </svg>

 {/* Central Hub */}
 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
 <div className="w-48 h-48 rounded-full bg-th-surface-raised border-4 border-primary shadow-[0_0_40px_rgba(55,19,236,0.4)] flex flex-col items-center justify-center text-center p-4 relative">
 <div className="absolute -top-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-4 border-[#111827]"></div>
 <span className="material-symbols-outlined text-5xl text-primary mb-2">psychology</span>
 <h3 className="text-sm font-bold text-th-heading uppercase tracking-tighter">Central Orchestrator</h3>
 <p className="text-[10px] text-th-secondary">Load: 42% | Active</p>
 </div>
 </div>

 {/* Orbiting Agents */}
 {/* Agent 1 */}
 <div className="absolute top-[10%] left-[10%] w-60 group z-10">
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-cyan-400">receipt_long</span>
 <h4 className="text-xs font-bold text-th-heading">Claim Processing Agent</h4>
 </div>
 <input defaultChecked className="rounded-full bg-th-surface-overlay border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-[10px]">
 <span className="text-th-secondary">Task: Validating EDI-837</span>
 <span className="text-emerald-500 tabular-nums">98.2% Acc.</span>
 </div>
 <div className="flex gap-1 h-8 items-end">
 <div className="flex-1 bg-primary/40 rounded-t-sm h-[40%]"></div>
 <div className="flex-1 bg-primary/40 rounded-t-sm h-[60%]"></div>
 <div className="flex-1 bg-primary h-[90%]"></div>
 <div className="flex-1 bg-primary/40 rounded-t-sm h-[50%]"></div>
 </div>
 <p className="text-[10px] text-th-secondary font-mono">CPU: 12% | RAM: 1.2GB</p>
 </div>
 </div>
 </div>

 {/* Agent 2 */}
 <div className="absolute top-[5%] right-[15%] w-60 z-10">
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-orange-400">gavel</span>
 <h4 className="text-xs font-bold text-th-heading">Denial Prevention Agent</h4>
 </div>
 <input defaultChecked className="rounded-full bg-th-surface-overlay border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
 </div>
 <div className="space-y-2 text-[10px]">
 <p className="text-th-secondary">Current: Analyzing Payer Policy Changes</p>
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="bg-orange-400 h-full w-[85%]"></div>
 </div>
 <span className="text-th-heading tabular-nums">85% Load</span>
 </div>
 </div>
 </div>
 </div>

 {/* Agent 3 */}
 <div className="absolute bottom-[20%] left-[12%] w-60 z-10">
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-emerald-500">data_thresholding</span>
 <h4 className="text-xs font-bold text-th-heading">Coding Optimization</h4>
 </div>
 <input defaultChecked className="rounded-full bg-th-surface-overlay border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
 </div>
 <div className="space-y-2">
 <p className="text-[10px] text-th-secondary">Status: Real-time ICD-10 Mapping</p>
 <div className="flex justify-between items-center text-[10px]">
 <span className="text-th-heading">Accuracy Rate</span>
 <span className="text-emerald-500 font-bold tabular-nums">99.9%</span>
 </div>
 </div>
 </div>
 </div>

 {/* Agent 4 */}
 <div className="absolute bottom-[10%] right-[10%] w-60 z-10">
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">clinical_notes</span>
 <h4 className="text-xs font-bold text-th-heading">Clinical Data Agent</h4>
 </div>
 <input className="rounded-full bg-th-surface-overlay border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
 </div>
 <p className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-1 rounded inline-block">NODE STANDBY</p>
 </div>
 </div>

 {/* Agent 5 */}
 <div className="absolute top-[40%] right-[5%] w-60 z-10">
 <div className="bg-th-surface-raised border border-th-border p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
 <div className="flex items-start justify-between mb-3">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-purple-400">forum</span>
 <h4 className="text-xs font-bold text-th-heading">Payer Communication</h4>
 </div>
 <input defaultChecked className="rounded-full bg-th-surface-overlay border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
 </div>
 <div className="animate-pulse bg-primary/20 h-1 rounded-full mb-2"></div>
 <p className="text-[10px] text-th-secondary">Connecting to UnitedHealth Gateway...</p>
 </div>
 </div>
 </section>

 {/* Right Panel: Live Activity Log */}
 <aside className="w-80 border-l border-th-border bg-th-surface-raised flex flex-col hidden xl:flex">
 <div className="p-4 border-b border-th-border">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary text-lg">terminal</span>
 Live Activity Log
 </h3>
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
 <div className="text-th-secondary">
 <span className="text-primary">[14:20:01]</span> <span className="text-th-heading">Denial Agent</span> requested medical records from <span className="text-th-heading">Clinical Agent</span>.
 </div>
 <div className="text-th-secondary">
 <span className="text-primary">[14:20:04]</span> <span className="text-th-heading">Clinical Agent</span>: Processing request #REQ-921...
 </div>
 <div className="text-th-secondary">
 <span className="text-primary">[14:20:08]</span> <span className="text-emerald-500">Coding Agent</span>: Optimized ICD-10 codes delivered to Hub.
 </div>
 <div className="text-th-secondary">
 <span className="text-primary">[14:21:12]</span> <span className="text-th-heading">Orchestrator</span>: Re-routing claim #AX-229 to manual review.
 </div>
 <div className="text-th-secondary">
 <span className="text-orange-400">[14:21:15] Warning:</span> Latency spike in Payer Gateway (240ms).
 </div>
 <div className="text-th-secondary">
 <span className="text-primary">[14:21:30]</span> <span className="text-th-heading">Denial Agent</span>: Analysis complete for Case #9021.
 </div>
 </div>

 {/* Global Precision */}
 <div className="p-4 border-t border-th-border">
 <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-bold text-th-heading mb-1">Global Precision</p>
 <p className="text-2xl font-bold text-th-heading mb-2 tabular-nums">99.8%</p>
 <div className="w-full bg-th-surface-overlay h-1 rounded-full overflow-hidden">
 <div className="bg-primary h-full w-[99.8%]"></div>
 </div>
 <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
 <span className="material-symbols-outlined text-xs">trending_up</span> +0.4% from yesterday
 </p>
 </div>
 </div>
 </aside>
 </main>

 {/* System Health Footer */}
 <footer className="h-12 border-t border-th-border bg-th-surface-raised flex items-center justify-between px-8 z-50 text-xs">
 <div className="flex items-center gap-10">
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Token Usage</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">4.2M / 10M</span>
 <span className="text-[10px] text-emerald-500 tabular-nums">+12%</span>
 </div>
 <div className="flex items-center gap-2 border-l border-th-border pl-10">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">System Latency</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">124ms</span>
 <span className="text-[10px] text-orange-400 tabular-nums">-5%</span>
 </div>
 <div className="flex items-center gap-2 border-l border-th-border pl-10">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Throughput</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">842 req/sec</span>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
 <span className="text-[10px] font-bold text-th-heading">API GATEWAY: ONLINE</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
 <span className="text-[10px] font-bold text-th-heading">DB SHARD 01: HEALTHY</span>
 </div>
 </div>
 </footer>
 </div>
 );
}
