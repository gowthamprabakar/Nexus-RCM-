import React from 'react';

export function EVVDashboard() {
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#10141d] font-sans h-full">
            {/* Stats Header */}
            <div className="flex flex-wrap gap-4 p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Visits</p>
                    <div className="flex items-end justify-between">
                        <p className="text-slate-900 dark:text-white text-2xl font-black leading-none">1,284</p>
                        <p className="text-emerald-500 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span> 5.2%</p>
                    </div>
                </div>
                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">GPS Verified</p>
                    <div className="flex items-end justify-between">
                        <p className="text-slate-900 dark:text-white text-2xl font-black leading-none">1,142</p>
                        <p className="text-emerald-500 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span> 3.1%</p>
                    </div>
                </div>
                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-4 border border-red-500/20 dark:border-red-500/20 bg-red-500/5 shadow-sm">
                    <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">Critical Exceptions</p>
                    <div className="flex items-end justify-between">
                        <p className="text-red-500 text-2xl font-black leading-none">14</p>
                        <p className="text-red-400 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-sm">trending_down</span> 12.4%</p>
                    </div>
                </div>
                <div className="flex min-w-[180px] flex-1 flex-col gap-1 rounded-xl p-4 border border-primary/20 bg-primary/5 shadow-sm">
                    <p className="text-primary text-xs font-semibold uppercase tracking-wider">Org Compliance</p>
                    <div className="flex items-end justify-between">
                        <p className="text-primary text-2xl font-black leading-none">98.4%</p>
                        <p className="text-emerald-500 text-xs font-bold flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span> 0.8%</p>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Left: Visit Integrity Monitor Feed */}
                <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Live Visit Feed</h3>
                        <div className="flex gap-1">
                            <span className="material-symbols-outlined text-primary text-sm">fiber_manual_record</span>
                            <span className="text-[10px] font-bold text-primary uppercase">Real-time</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {/* Visit Card 1 (Verified) */}
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] hover:border-primary/50 transition-all cursor-pointer group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Sarah Jenkins</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Client: Robert D.</span>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded">VERIFIED</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                    <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
                                    <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white">08:45 AM</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Duration: 1h 12m</span>
                                </div>
                            </div>
                        </div>
                        {/* Visit Card 2 (Warning) */}
                        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Marcus Thorne</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Client: Alice W.</span>
                                </div>
                                <span className="bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded">GPS MISMATCH</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="material-symbols-outlined text-red-500 text-sm">location_off</span>
                                    <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
                                    <span className="material-symbols-outlined text-slate-500 text-sm">history_edu</span>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white">09:12 AM</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Delta: 0.4 miles</span>
                                </div>
                            </div>
                        </div>
                        {/* Visit Card 3 (Verified) */}
                        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b] hover:border-primary/50 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Elena Rodriguez</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Client: John M.</span>
                                </div>
                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded">VERIFIED</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                    <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
                                    <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white">09:30 AM</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Duration: 25m</span>
                                </div>
                            </div>
                        </div>
                        {/* Visit Card 4 (Exception) */}
                        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 hover:border-red-500 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">Tom Harrison</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Client: Linda K.</span>
                                </div>
                                <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded">NO CLOCK-OUT</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="material-symbols-outlined text-slate-500 text-sm">location_off</span>
                                    <span className="material-symbols-outlined text-red-500 text-sm">signal_disconnected</span>
                                    <span className="material-symbols-outlined text-slate-500 text-sm">history_edu</span>
                                </div>
                                <div className="ml-auto flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white">Yest. 18:00</span>
                                    <span className="text-[10px] text-red-500 font-bold">MISSING DATA</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center: Map Widget */}
                <div className="col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Map</h3>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                <button className="px-3 py-1 rounded-md bg-white dark:bg-[#1e293b] text-[10px] font-bold text-primary shadow-sm">Pins</button>
                                <button className="px-3 py-1 rounded-md text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">Heatmap</button>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Viewing: Greater Metro Area</span>
                    </div>
                    <div className="flex-1 bg-slate-200 dark:bg-[#1e293b]/30 rounded-2xl relative overflow-hidden border border-slate-300 dark:border-slate-700 group h-[400px]">
                        {/* Abstract Map Visualization */}
                        <div className="absolute inset-0 bg-slate-300 dark:bg-[#0f172a]">
                            <div className="absolute inset-0 opacity-20" style={{
                                backgroundImage: 'radial-gradient(#13ecec 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}></div>
                        </div>

                        {/* Map Pins */}
                        <div className="absolute top-1/4 left-1/3">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-8 w-8 bg-emerald-500/20 rounded-full animate-ping"></div>
                                <span className="material-symbols-outlined text-emerald-500 text-3xl drop-shadow-lg">location_on</span>
                            </div>
                        </div>
                        <div className="absolute top-1/2 right-1/4">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-8 w-8 bg-primary/20 rounded-full animate-pulse"></div>
                                <span className="material-symbols-outlined text-primary text-3xl drop-shadow-lg">location_on</span>
                            </div>
                        </div>
                        <div className="absolute bottom-1/3 left-1/2">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-8 w-8 bg-red-500/20 rounded-full animate-ping"></div>
                                <span className="material-symbols-outlined text-red-500 text-3xl drop-shadow-lg">report</span>
                            </div>
                        </div>
                        <div className="absolute top-1/3 right-1/2">
                            <div className="relative flex items-center justify-center">
                                <span className="material-symbols-outlined text-amber-500 text-3xl drop-shadow-lg">warning</span>
                            </div>
                        </div>

                        {/* Map Overlay Controls */}
                        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                            <button className="h-8 w-8 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:text-primary">
                                <span className="material-symbols-outlined">add</span>
                            </button>
                            <button className="h-8 w-8 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white hover:text-primary">
                                <span className="material-symbols-outlined">remove</span>
                            </button>
                        </div>
                        <div className="absolute top-4 left-4 p-3 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase mb-2">Map Legend</p>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                                    <span className="text-[9px] text-slate-600 dark:text-slate-300">Verified Visit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                                    <span className="text-[9px] text-slate-600 dark:text-slate-300">GPS Warning</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                                    <span className="text-[9px] text-slate-600 dark:text-slate-300">Critical Exception</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Exception Management */}
                <div className="col-span-12 xl:col-span-3 flex flex-col gap-4 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-red-500">Action Required</h3>
                        <button className="text-[10px] font-bold text-primary hover:underline">VIEW ALL 14</button>
                    </div>
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        {/* Exception Item 1 */}
                        <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            <div className="flex flex-col">
                                <div className="flex justify-between">
                                    <span className="text-xs font-black text-slate-900 dark:text-white">Missing Client Signature</span>
                                    <span className="text-[10px] text-red-400 font-bold">HIGH RISK</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Provider: Tom Harrison • Visit ID: #88219</p>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Mandatory state requirement for Medicare billing. Document not finalized at clock-out.</p>
                            <div className="flex gap-2 mt-1">
                                <button className="flex-1 py-1.5 bg-primary text-[#102222] text-[10px] font-bold rounded-md hover:bg-white transition-colors">RESOLVE</button>
                                <button className="px-2 py-1.5 bg-transparent text-slate-900 dark:text-white text-[10px] font-bold rounded-md border border-slate-300 dark:border-slate-600 hover:border-primary transition-all">NOTIFY PROVIDER</button>
                            </div>
                        </div>
                        {/* Exception Item 2 */}
                        <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                            <div className="flex flex-col">
                                <div className="flex justify-between">
                                    <span className="text-xs font-black text-slate-900 dark:text-white">GPS Offset (0.8mi)</span>
                                    <span className="text-[10px] text-amber-500 font-bold">WARNING</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Provider: Marcus Thorne • Visit ID: #88310</p>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Clock-in location outside client geofence boundary. Potential billing denial.</p>
                            <div className="flex gap-2 mt-1">
                                <button className="flex-1 py-1.5 bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded-md border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all">MANUAL VERIFY</button>
                            </div>
                        </div>
                        {/* Trend Card */}
                        <div className="mt-auto p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#1e293b]/40">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Compliance Score Trend</p>
                            <div className="h-16 w-full relative flex items-end gap-1">
                                <div className="flex-1 bg-primary/20 h-10 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                                <div className="flex-1 bg-primary/20 h-12 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                                <div className="flex-1 bg-primary/20 h-8 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                                <div className="flex-1 bg-primary/20 h-14 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                                <div className="flex-1 bg-primary/40 h-16 rounded-t-sm hover:bg-primary transition-colors cursor-pointer border-t-2 border-primary"></div>
                                <div className="flex-1 bg-primary/20 h-15 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                                <div className="flex-1 bg-primary/20 h-13 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <span className="text-[9px] text-slate-500">Mon</span>
                                <span className="text-[9px] text-slate-500">Tue</span>
                                <span className="text-[9px] text-slate-500">Wed</span>
                                <span className="text-[9px] text-slate-500">Thu</span>
                                <span className="text-[9px] text-slate-500 font-bold text-primary">Today</span>
                                <span className="text-[9px] text-slate-500">Sat</span>
                                <span className="text-[9px] text-slate-500">Sun</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Action Bar / KPIs */}
            <footer className="bg-white dark:bg-[#10141d] border-t border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                        <span>842 Claims Ready to Submit</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                        <span>14 Failed Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-primary rounded-full"></span>
                        <span>Average Review Time: 12m</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span>API V2.4.1-STABLE</span>
                    <button className="bg-slate-200 dark:bg-[#283939] text-slate-900 dark:text-white px-3 py-1 rounded hover:bg-primary hover:text-[#102222] transition-all font-bold">EXPORT COMPLIANCE LOG</button>
                </div>
            </footer>
        </div>
    );
}
