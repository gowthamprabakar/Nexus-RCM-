import React from 'react';

export function MassScrub() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white overflow-hidden p-6 custom-scrollbar">
            <div className="flex flex-col gap-6 max-w-[1200px] mx-auto w-full">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Mass Scrub Configuration
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">Run AI validation logic across massive claim datasets.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">tune</span> Configuration
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[#9db9b9]">Target Payer Group</label>
                                    <select className="w-full bg-slate-50 dark:bg-[#1a2525] border border-slate-200 dark:border-[#3b5454] rounded-lg h-10 px-3 text-sm focus:ring-primary">
                                        <option>All Payers</option>
                                        <option>Medicare Part A & B</option>
                                        <option>Commercial - United</option>
                                        <option>Commercial - Aetna</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-[#9db9b9]">Date Range</label>
                                    <select className="w-full bg-slate-50 dark:bg-[#1a2525] border border-slate-200 dark:border-[#3b5454] rounded-lg h-10 px-3 text-sm focus:ring-primary">
                                        <option>Last 30 Days</option>
                                        <option>This Quarter</option>
                                        <option>Custom Range</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 space-y-4">
                                <label className="text-xs font-bold uppercase text-[#9db9b9]">Rule Sets to Apply</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#3b5454] hover:bg-[#1a2525] cursor-pointer transition-colors bg-[#1a2525]/50">
                                        <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
                                        <div>
                                            <p className="font-bold text-sm">Standard NCD/LCD</p>
                                            <p className="text-xs text-[#9db9b9]">CMS medical necessity checks</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#3b5454] hover:bg-[#1a2525] cursor-pointer transition-colors bg-[#1a2525]/50">
                                        <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
                                        <div>
                                            <p className="font-bold text-sm">CCI Bundling Edits</p>
                                            <p className="text-xs text-[#9db9b9]">Prevents unbundling errors</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#3b5454] hover:bg-[#1a2525] cursor-pointer transition-colors bg-[#1a2525]/50">
                                        <input type="checkbox" defaultChecked className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
                                        <div>
                                            <p className="font-bold text-sm">Payer Specific Rules</p>
                                            <p className="text-xs text-[#9db9b9]">United/Aetna policy checks</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-[#3b5454] hover:bg-[#1a2525] cursor-pointer transition-colors bg-[#1a2525]/50">
                                        <input type="checkbox" className="rounded border-slate-500 text-primary focus:ring-primary size-4" />
                                        <div>
                                            <p className="font-bold text-sm">Experimental AI</p>
                                            <p className="text-xs text-[#9db9b9]">Deep learning pattern match</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Dry Run Outcome */}
                        <section className="bg-gradient-to-br from-[#111818] to-[#1a2525] border border-[#3b5454] rounded-xl p-6 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <span className="material-symbols-outlined text-9xl">science</span>
                            </div>
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                                <span className="material-symbols-outlined text-primary">view_in_ar</span> Simulation Results (Dry Run)
                            </h3>
                            <div className="grid grid-cols-3 gap-6 relative z-10">
                                <div>
                                    <p className="text-xs font-bold text-[#9db9b9] uppercase mb-1">Impacted Claims</p>
                                    <p className="text-3xl font-black text-white">4,821</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#9db9b9] uppercase mb-1">Est. Revenue Saved</p>
                                    <p className="text-3xl font-black text-emerald-500">$842k</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#9db9b9] uppercase mb-1">New Errors Found</p>
                                    <p className="text-3xl font-black text-rose-500">128</p>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-[#3b5454] relative z-10">
                                <p className="text-sm text-[#9db9b9] italic mb-4">
                                    <span className="font-bold text-primary">Note:</span> Running this job will lock the selected claims for approximately 45 minutes.
                                </p>
                                <button className="w-full py-4 bg-primary text-[#102222] rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(19,236,236,0.3)] hover:brightness-110 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">play_circle</span> Execute Mass Scrub
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar: Recent Events */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl flex flex-col h-full">
                            <div className="p-5 border-b border-[#3b5454]">
                                <h3 className="font-bold">Execution Log</h3>
                            </div>
                            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="size-2 rounded-full bg-slate-500"></div>
                                            <div className="w-px h-full bg-slate-800"></div>
                                        </div>
                                        <div className="pb-4">
                                            <p className="text-xs font-bold text-[#9db9b9]">Oct 2{i}, 14:00</p>
                                            <p className="text-sm font-bold text-white">Manual Scrub: Medicare</p>
                                            <p className="text-xs text-slate-500 mt-1">Found 42 errors across 1,200 claims.</p>
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
