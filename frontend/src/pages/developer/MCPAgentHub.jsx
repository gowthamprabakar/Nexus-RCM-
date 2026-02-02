import React from 'react';

export function MCPAgentHub() {
    return (
        <div className="bg-slate-50 dark:bg-[#0a0a0f] text-slate-900 dark:text-white flex flex-col h-full overflow-hidden font-sans">
            {/* Top Navigation Bar: Hidden in favor of main shell, but keeping control bar elements potentially */}

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Agent Categories */}
                <aside className="w-64 border-r border-slate-200 dark:border-[#2b2839] bg-white dark:bg-[#0a0a0f] p-4 flex flex-col gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-[#a19db9] uppercase tracking-widest mb-4">Network Clusters</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 group cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                                    <p className="text-slate-900 dark:text-white text-sm font-medium">Claims Intake</p>
                                </div>
                                <span className="text-[10px] bg-primary text-white px-1.5 rounded">4</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#131022] transition-colors group cursor-pointer text-slate-500 dark:text-[#a19db9]">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-xl">gavel</span>
                                    <p className="group-hover:text-slate-900 dark:group-hover:text-white text-sm font-medium">Denial Mgmt</p>
                                </div>
                                <span className="text-[10px] bg-slate-200 dark:bg-[#2b2839] text-slate-500 dark:text-[#a19db9] px-1.5 rounded">6</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#131022] transition-colors group cursor-pointer text-slate-500 dark:text-[#a19db9]">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-xl">medical_information</span>
                                    <p className="group-hover:text-slate-900 dark:group-hover:text-white text-sm font-medium">Coding Opt</p>
                                </div>
                                <span className="text-[10px] bg-slate-200 dark:bg-[#2b2839] text-slate-500 dark:text-[#a19db9] px-1.5 rounded">5</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Global Precision</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-2">99.8%</p>
                            <div className="w-full bg-slate-200 dark:bg-[#2b2839] h-1 rounded-full overflow-hidden">
                                <div className="bg-primary h-full w-[99.8%]"></div>
                            </div>
                            <p className="text-[10px] text-emerald-500 dark:text-[#0bda6c] mt-2 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">trending_up</span> +0.4% from yesterday
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Center Stage: Network Visualization */}
                <section className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent overflow-hidden">
                    {/* SVG Connections Overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {/* Lines to various cards - using fixed percentages for demo */}
                        <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 20% 20%" fill="none"></path>
                        <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 80% 20%" fill="none"></path>
                        <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 20% 80%" fill="none"></path>
                        <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 80% 80%" fill="none"></path>
                        <path className="stroke-primary stroke-[1] stroke-dasharray-4 opacity-40" d="M 50% 50% L 50% 15%" fill="none"></path>
                    </svg>

                    {/* Central Hub */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="w-48 h-48 rounded-full bg-white dark:bg-[#0a0a0f] border-4 border-primary shadow-[0_0_40px_rgba(55,19,236,0.4)] flex flex-col items-center justify-center text-center p-4 relative">
                            <div className="absolute -top-2 -right-2 bg-emerald-500 dark:bg-[#0bda6c] w-4 h-4 rounded-full border-4 border-white dark:border-[#0a0a0f]"></div>
                            <span className="material-symbols-outlined text-5xl text-primary mb-2">psychology</span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Central Orchestrator</h3>
                            <p className="text-[10px] text-slate-500 dark:text-[#a19db9]">Load: 42% | Active</p>
                        </div>
                    </div>

                    {/* Orbiting Agents */}
                    {/* Agent 1 */}
                    <div className="absolute top-[10%] left-[10%] w-60 group z-10">
                        <div className="bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#2b2839] p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-cyan-400 dark:text-[#00f3ff]">receipt_long</span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Claim Processing Agent</h4>
                                </div>
                                <input defaultChecked className="rounded-full bg-slate-200 dark:bg-[#2b2839] border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 dark:text-[#a19db9]">Task: Validating EDI-837</span>
                                    <span className="text-emerald-500 dark:text-[#0bda6c]">98.2% Acc.</span>
                                </div>
                                <div className="flex gap-1 h-8 items-end">
                                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[40%]"></div>
                                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[60%]"></div>
                                    <div className="flex-1 bg-primary h-[90%]"></div>
                                    <div className="flex-1 bg-primary/40 rounded-t-sm h-[50%]"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-[#a19db9] font-mono">CPU: 12% | RAM: 1.2GB</p>
                            </div>
                        </div>
                    </div>

                    {/* Agent 2 */}
                    <div className="absolute top-[5%] right-[15%] w-60 z-10">
                        <div className="bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#2b2839] p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-400">gavel</span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Denial Prevention Agent</h4>
                                </div>
                                <input defaultChecked className="rounded-full bg-slate-200 dark:bg-[#2b2839] border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
                            </div>
                            <div className="space-y-2 text-[10px]">
                                <p className="text-slate-500 dark:text-[#a19db9]">Current: Analyzing Payer Policy Changes</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1 bg-slate-200 dark:bg-[#2b2839] rounded-full overflow-hidden">
                                        <div className="bg-orange-400 h-full w-[85%]"></div>
                                    </div>
                                    <span className="text-slate-900 dark:text-white">85% Load</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent 3 */}
                    <div className="absolute bottom-[20%] left-[12%] w-60 z-10">
                        <div className="bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#2b2839] p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 dark:text-[#0bda6c]">data_thresholding</span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Coding Optimization</h4>
                                </div>
                                <input defaultChecked className="rounded-full bg-slate-200 dark:bg-[#2b2839] border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-slate-500 dark:text-[#a19db9]">Status: Real-time ICD-10 Mapping</p>
                                <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-900 dark:text-white">Accuracy Rate</span>
                                    <span className="text-emerald-500 dark:text-[#0bda6c] font-bold">99.9%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agent 4 */}
                    <div className="absolute bottom-[10%] right-[10%] w-60 z-10">
                        <div className="bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#2b2839] p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">clinical_notes</span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Clinical Data Agent</h4>
                                </div>
                                <input className="rounded-full bg-slate-200 dark:bg-[#2b2839] border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
                            </div>
                            <p className="text-[10px] text-[#fa6938] bg-orange-500/10 px-2 py-1 rounded inline-block">NODE STANDBY</p>
                        </div>
                    </div>

                    {/* Agent 5 */}
                    <div className="absolute top-[40%] right-[5%] w-60 z-10">
                        <div className="bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#2b2839] p-4 rounded-xl hover:border-primary transition-all duration-300 shadow-lg">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-400">forum</span>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Payer Communication</h4>
                                </div>
                                <input defaultChecked className="rounded-full bg-slate-200 dark:bg-[#2b2839] border-none text-primary focus:ring-0 w-4 h-4" type="checkbox" />
                            </div>
                            <div className="animate-pulse bg-primary/20 h-1 rounded-full mb-2"></div>
                            <p className="text-[10px] text-slate-500 dark:text-[#a19db9]">Connecting to UnitedHealth Gateway...</p>
                        </div>
                    </div>
                </section>

                {/* Right Sidebar: Live Activity Log */}
                <aside className="w-80 border-l border-slate-200 dark:border-[#2b2839] bg-white/50 dark:bg-[#0a0a0f]/50 backdrop-blur-sm flex flex-col pointer-events-none xl:pointer-events-auto hidden xl:flex">
                    <div className="p-4 border-b border-slate-200 dark:border-[#2b2839] bg-white dark:bg-[#0a0a0f]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary text-lg">terminal</span>
                                Live Activity Log
                            </h3>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#0bda6c] animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-primary">[14:20:01]</span> <span className="text-slate-900 dark:text-white">Denial Agent</span> requested medical records from <span className="text-slate-900 dark:text-white">Clinical Agent</span>.
                        </div>
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-primary">[14:20:04]</span> <span className="text-slate-900 dark:text-white">Clinical Agent</span>: Processing request #REQ-921...
                        </div>
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-primary">[14:20:08]</span> <span className="text-emerald-500 dark:text-[#0bda6c]">Coding Agent</span>: Optimized ICD-10 codes delivered to Hub.
                        </div>
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-primary">[14:21:12]</span> <span className="text-slate-900 dark:text-white">Orchestrator</span>: Re-routing claim #AX-229 to manual review.
                        </div>
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-[#fa6938]">[14:21:15] Warning:</span> Latency spike in Payer Gateway (240ms).
                        </div>
                        <div className="text-slate-500 dark:text-[#a19db9]">
                            <span className="text-primary">[14:21:30]</span> <span className="text-slate-900 dark:text-white">Denial Agent</span>: Analysis complete for Case #9021.
                        </div>
                    </div>
                </aside>
            </main>

            {/* System Health Footer */}
            <footer className="h-12 border-t border-slate-200 dark:border-[#2b2839] bg-white dark:bg-[#131022] flex items-center justify-between px-8 z-50 text-xs">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 dark:text-[#a19db9] font-bold uppercase">Token Usage</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">4.2M / 10M</span>
                        <span className="text-[10px] text-emerald-500 dark:text-[#0bda6c]">+12%</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-[#2b2839] pl-10">
                        <span className="text-[10px] text-slate-500 dark:text-[#a19db9] font-bold uppercase">System Latency</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">124ms</span>
                        <span className="text-[10px] text-[#fa6938]">-5%</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-[#2b2839] pl-10">
                        <span className="text-[10px] text-slate-500 dark:text-[#a19db9] font-bold uppercase">Throughput</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">842 req/sec</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#0bda6c]"></div>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">API GATEWAY: ONLINE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#0bda6c]"></div>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">DB SHARD 01: HEALTHY</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
