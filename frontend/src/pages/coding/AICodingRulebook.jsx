import React, { useState } from 'react';

export function AICodingRulebook() {
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <div className="flex w-full h-full font-sans">
            {/* Payer Directory Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col p-4 shrink-0">
                <div className="flex flex-col mb-4">
                    <h1 className="text-base font-bold text-slate-900 dark:text-white">Payer Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">5,241 Active Rule Sets</p>
                </div>

                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search payers..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <nav className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Medicare Part B</span>
                            <span className="material-symbols-outlined text-primary text-[16px]">star</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">National · Primary</p>
                        <div className="flex items-center gap-1 text-[10px] bg-white dark:bg-background-dark px-2 py-1 rounded border border-slate-100 dark:border-slate-700 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="font-medium text-slate-600 dark:text-slate-400">142 Updates</span>
                        </div>
                    </div>

                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Cigna Health</span>
                            <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-400 text-[16px]">navigate_next</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">Commercial · Regional</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="font-medium">Synced: 2h ago</span>
                        </div>
                    </div>

                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">Blue Cross Blue Shield</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">Commercial · National</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="font-medium">Synced: 5h ago</span>
                        </div>
                    </div>

                    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all group">
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">UnitedHealthcare</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">Commercial · Managed Care</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="font-medium">Synced: 1d ago</span>
                        </div>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark/50">
                <header className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 hover:text-primary cursor-pointer text-sm font-medium transition-colors">Payer Rulebook</span>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white">Medicare Part B - National Policy Manual</h1>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="material-symbols-outlined text-[16px] animate-spin-slow">sync</span>
                        Updated: Today, 06:00 AM EST
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Top Stats Cards */}
                    <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full z-0"></div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">Local Coverage (LCD)</h3>
                            <div className="flex items-end gap-2 relative z-10">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">1,204</span>
                                <span className="text-xs font-medium text-green-600 mb-1.5 flex items-center">
                                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                                    12 New
                                </span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">L34636 Active</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">Cardiology Focus</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full z-0"></div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 relative z-10">National Coverage (NCD)</h3>
                            <div className="flex items-end gap-2 relative z-10">
                                <span className="text-3xl font-bold text-slate-900 dark:text-white">342</span>
                                <span className="text-xs font-medium text-slate-400 mb-1.5">No recent changes</span>
                            </div>
                            <div className="mt-3">
                                <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded font-bold">Federal Mandate</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-4 shadow-lg flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">AI Rule Engine</h3>
                                <p className="text-sm font-medium">Ready to test claims against latest CMS guidelines.</p>
                            </div>
                            <button className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 mt-4 border border-white/10 group">
                                <span className="text-xs font-bold">Open Simulator</span>
                                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-8 h-full">
                        {/* Crosswalks Table */}
                        <div className="col-span-8 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden h-fit">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400">cable</span>
                                    High-Volume Crosswalks (Cardiology)
                                </h2>
                                <button className="text-primary text-xs font-bold hover:underline">View All</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3">CPT Procedure</th>
                                        <th className="px-6 py-3">Req. Diagnosis (ICD-10)</th>
                                        <th className="px-6 py-3">Rule Link</th>
                                        <th className="px-6 py-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">93000</div>
                                            <div className="text-xs text-slate-500">Electrocardiogram, 12-lead</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">R07.9</span>
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">I20.9</span>
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">+14 more</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
                                                LCD L34636 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">93306</div>
                                            <div className="text-xs text-slate-500">Echocardiography, TTE</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">I50.9</span>
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">I48.91</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
                                                NCD 20.27 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">78452</div>
                                            <div className="text-xs text-slate-500">Myocardial perfusion imaging</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">I25.10</span>
                                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">R07.2</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a href="#" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
                                                LCD L33394 <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                                                In Review
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Recent Policy Updates List */}
                        <div className="col-span-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-border-dark p-6 h-fit">
                            <h2 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Recent Policy Alerts</h2>
                            <div className="flex flex-col gap-4">
                                <div className="bg-white dark:bg-card-dark p-3 rounded-lg border-l-4 border-l-amber-500 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Effective Oct 1, 2024</span>
                                        <span className="material-symbols-outlined text-amber-500 text-[16px]">priority_high</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Telehealth Modifiers Changed</p>
                                    <p className="text-[10px] text-slate-500">Modifier -95 is being phased out for Place of Service 10.</p>
                                </div>

                                <div className="bg-white dark:bg-card-dark p-3 rounded-lg border-l-4 border-l-blue-500 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">Effective Jan 1, 2025</span>
                                        <span className="material-symbols-outlined text-blue-500 text-[16px]">info</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">New E/M Guidelines</p>
                                    <p className="text-[10px] text-slate-500">Comprehensive update to office visit complexity scoring.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
