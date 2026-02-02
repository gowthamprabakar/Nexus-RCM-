import React, { useState } from 'react';

export function APIManager() {
    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Left Sidebar: Endpoint Registry */}
            <aside className="w-72 border-r border-[#282e39] bg-white dark:bg-[#101622] flex flex-col shrink-0">
                <div className="p-4 border-b border-[#282e39] flex justify-between items-center">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Endpoint Registry</h2>
                    <button className="text-primary hover:bg-primary/10 p-1 rounded">
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex flex-col gap-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 rounded bg-primary/20">REST</span>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-sm font-medium">Epic FHIR Gateway</p>
                        <p className="text-xs text-slate-500 truncate font-mono">/api/v4/fhir/r4</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-[#1a2130] border border-transparent hover:border-[#282e39] flex flex-col gap-1 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">GQL</span>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <p className="text-sm font-medium">Claims Graph Service</p>
                        <p className="text-xs text-slate-500 truncate font-mono">/graphql/claims</p>
                    </div>
                    <div className="p-3 rounded-lg hover:bg-[#1a2130] border border-transparent hover:border-[#282e39] flex flex-col gap-1 transition-all group cursor-pointer">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">REST</span>
                            <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                        </div>
                        <p className="text-sm font-medium">Payer Auth Proxy</p>
                        <p className="text-xs text-slate-500 truncate font-mono">/auth/v1/sessions</p>
                    </div>
                </div>
                <div className="p-4 bg-[#1a2130]/30 border-t border-[#282e39]">
                    <button className="w-full py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">key</span>
                        <span>Manage Secrets</span>
                    </button>
                </div>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col bg-[#f6f6f8] dark:bg-[#101622]">
                {/* Header */}
                <header className="flex items-center justify-between border-b border-[#282e39] px-6 py-3 bg-white dark:bg-[#101622] sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-primary">
                            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined">hub</span>
                            </div>
                            <h1 className="text-lg font-bold tracking-tight">RCM Data Console</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 hidden md:block">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
                            <input className="w-full bg-[#1a2130] border-none rounded-lg pl-10 h-10 text-sm focus:ring-1 focus:ring-primary placeholder:text-slate-500 text-white" placeholder="Search endpoints..." type="text" />
                        </div>
                    </div>
                </header>

                <div className="p-6 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Stat 1 */}
                        <div className="bg-[#1a2130] border border-[#282e39] p-5 rounded-xl">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Avg Latency</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold font-mono text-white">240<span className="text-sm text-slate-500 ml-1">ms</span></h3>
                                <span className="text-rose-500 text-xs font-medium">-12ms</span>
                            </div>
                            <div className="mt-4 h-8 w-full bg-primary/5 rounded flex items-end gap-1 px-1">
                                {[20, 30, 40, 75, 50, 60].map((h, i) => (
                                    <div key={i} className="flex-1 bg-primary/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                        {/* Stat 2 */}
                        <div className="bg-[#1a2130] border border-[#282e39] p-5 rounded-xl">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Throughput</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold font-mono text-white">1.2<span className="text-sm text-slate-500 ml-1">k/s</span></h3>
                                <span className="text-emerald-500 text-xs font-medium">+5%</span>
                            </div>
                            <div className="mt-4 h-8 w-full bg-primary/5 rounded flex items-end gap-1 px-1">
                                {[60, 50, 70, 80, 75, 90].map((h, i) => (
                                    <div key={i} className="flex-1 bg-emerald-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                        {/* Stat 3 */}
                        <div className="bg-[#1a2130] border border-[#282e39] p-5 rounded-xl">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Error Rate</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold font-mono text-white">0.02<span className="text-sm text-slate-500 ml-1">%</span></h3>
                                <span className="text-emerald-500 text-xs font-medium">-0.01%</span>
                            </div>
                            <div className="mt-4 h-8 w-full bg-primary/5 rounded flex items-end gap-1 px-1">
                                <div className="flex-1 bg-primary/20 h-1/6 rounded-t-sm"></div>
                                <div className="flex-1 bg-primary/20 h-1/6 rounded-t-sm"></div>
                                <div className="flex-1 bg-primary/20 h-1/6 rounded-t-sm"></div>
                                <div className="flex-1 bg-rose-500/50 h-2/3 rounded-t-sm"></div>
                                <div className="flex-1 bg-primary/20 h-1/6 rounded-t-sm"></div>
                                <div className="flex-1 bg-primary/20 h-1/6 rounded-t-sm"></div>
                            </div>
                        </div>
                        {/* Stat 4 */}
                        <div className="bg-[#1a2130] border border-[#282e39] p-5 rounded-xl">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Uptime</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold font-mono text-white">99.99<span className="text-sm text-slate-500 ml-1">%</span></h3>
                                <span className="text-emerald-500 text-xs font-medium">Stable</span>
                            </div>
                            <div className="mt-4 h-8 w-full bg-primary/5 rounded flex items-end gap-1 px-1">
                                {[100, 100, 100, 100, 100, 100].map((h, i) => (
                                    <div key={i} className="flex-1 bg-primary/60 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Webhook Orchestrator */}
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Webhook Orchestrator</h2>
                                <p className="text-slate-500 text-sm">Configure event-driven ETL triggers for external systems.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-3 py-2 bg-[#1a2130] border border-[#282e39] rounded-lg text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                                    <span className="material-symbols-outlined text-lg">sync</span> Refresh
                                </button>
                                <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
                                    <span className="material-symbols-outlined text-lg">add</span> New Webhook
                                </button>
                            </div>
                        </div>

                        {/* Webhook Card 1 */}
                        <div className="bg-[#1a2130] border border-[#282e39] rounded-xl p-6 hover:border-primary/50 transition-colors group">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h4 className="font-bold text-lg text-white">ETL Pipeline Alpha</h4>
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">99.4% Delivery Rate</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target URL</label>
                                            <div className="flex items-center gap-2 bg-[#101622] px-3 py-2 rounded border border-[#282e39]">
                                                <span className="material-symbols-outlined text-slate-500 text-base">link</span>
                                                <span className="text-sm font-mono text-primary">https://etl.data-core.io/v1/rcm/claims</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subscribed Events</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['claim.updated', 'denial.received', 'payer.ack'].map((tag, i) => (
                                                    <span key={i} className="px-2 py-1 bg-[#101622] rounded text-xs border border-[#282e39] text-slate-300">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px bg-[#282e39] hidden md:block"></div>
                                <div className="md:w-64 flex flex-col justify-between py-1">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Retry Logic</span>
                                            <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                                                <div className="absolute right-1 top-1 size-3 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Exp. Backoff</span>
                                            <span className="text-sm font-medium text-white">Enabled</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button className="flex-1 py-1.5 border border-[#282e39] rounded bg-[#101622] text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors">Test</button>
                                        <button className="flex-1 py-1.5 border border-[#282e39] rounded bg-[#101622] text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors">Edit</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Webhook Card 2 */}
                        <div className="bg-[#1a2130] border border-[#282e39] rounded-xl p-6 hover:border-primary/50 transition-colors group opacity-80">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h4 className="font-bold text-lg text-slate-400">Patient Data Sync</h4>
                                        <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-[#282e39] italic">Paused</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target URL</label>
                                            <div className="flex items-center gap-2 bg-[#101622] px-3 py-2 rounded border border-[#282e39]">
                                                <span className="material-symbols-outlined text-slate-500 text-base">link</span>
                                                <span className="text-sm font-mono text-slate-500">https://hooks.slack.com/services/T0123...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-px bg-[#282e39] hidden md:block"></div>
                                <div className="md:w-64 flex flex-col justify-between py-1">
                                    <div className="md:w-64 flex flex-col gap-4">
                                        <div className="flex justify-between items-center text-slate-500">
                                            <span className="text-sm">Retry Logic</span>
                                            <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer">
                                                <div className="absolute left-1 top-1 size-3 bg-slate-400 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button className="flex-1 py-1.5 border border-[#282e39] rounded bg-[#101622] text-xs text-slate-400">Resume</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Panel: Payload Inspector */}
            <aside className="w-80 border-l border-[#282e39] bg-white dark:bg-[#101622] flex flex-col shrink-0 hidden xl:flex">
                <div className="p-4 border-b border-[#282e39] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">terminal</span>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Payload Inspector</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Log Items */}
                    <div className="p-4 border-b border-[#282e39] bg-primary/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">200 OK</span>
                            <span className="text-[10px] font-mono text-slate-500">14:20:05.12</span>
                        </div>
                        <p className="text-xs font-mono text-slate-300 truncate mb-3">POST /v1/rcm/claims</p>
                        <div className="bg-[#1a2130] rounded p-3 font-mono text-[11px] text-primary overflow-x-hidden leading-relaxed">
                            <span className="text-blue-400">"event"</span>: <span className="text-emerald-400">"claim.updated"</span>,<br />
                            <div className="pl-2">
                                <span className="text-blue-400">"id"</span>: <span className="text-emerald-400">"cl_9281X"</span>,<br />
                                <span className="text-blue-400">"status"</span>: <span className="text-emerald-400">"paid"</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-b border-[#282e39]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">500 ERR</span>
                            <span className="text-[10px] font-mono text-slate-500">14:19:58.44</span>
                        </div>
                        <p className="text-xs font-mono text-slate-300 truncate mb-3">POST /v1/rcm/claims</p>
                        <div className="bg-[#1a2130] rounded p-3 font-mono text-[11px] text-slate-400 leading-relaxed italic">
                            Connection timeout while reaching target host. Retrying in 5s...
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-[#1a2130]/50 border-t border-[#282e39] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Stream</span>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
