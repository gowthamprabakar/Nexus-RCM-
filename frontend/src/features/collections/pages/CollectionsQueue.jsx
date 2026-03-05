import React from 'react';
import { useNavigate } from 'react-router-dom';

export function CollectionsQueue() {
    const navigate = useNavigate();
    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 dark:bg-background-dark font-sans">
            {/* KPI Ribbon */}
            <div className="flex flex-wrap gap-4 p-4 lg:px-6 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark shrink-0 z-10">
                <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <p className="text-xs font-semibold uppercase tracking-wider">Calls Completed</p>
                        <span className="material-symbols-outlined text-lg">call</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">12 / 40</p>
                        <p className="text-green-500 text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">trending_up</span> +15%
                        </p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: '30%' }}></div>
                    </div>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <p className="text-xs font-semibold uppercase tracking-wider">PTP Amount</p>
                        <span className="material-symbols-outlined text-lg">payments</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">$14,250</p>
                        <p className="text-green-500 text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">trending_up</span> +22%
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Daily Goal: $25,000</p>
                </div>
                <div className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <p className="text-xs font-semibold uppercase tracking-wider">Tasks Remaining</p>
                        <span className="material-symbols-outlined text-lg">assignment</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">28</p>
                        <p className="text-red-500 text-sm font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">trending_down</span> -8%
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Focus on High Priority (12)</p>
                </div>
                <div className="hidden xl:flex min-w-[200px] flex-1 flex-col gap-1 rounded-xl p-4 border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <p className="text-xs font-semibold uppercase tracking-wider">Average Handling</p>
                        <span className="material-symbols-outlined text-lg">timer</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-2xl font-black text-slate-900 dark:text-white">4.2m</p>
                        <p className="text-primary text-sm font-medium">On Target</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">Historical: 4.5m</p>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Task Table Content */}
                <div className="flex-1 overflow-auto bg-white dark:bg-background-dark">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-border-dark sticky top-0 bg-white dark:bg-background-dark z-10">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Task Queue</h3>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full">All Tasks</button>
                                <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">High Probability</button>
                                <button className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">Payer Follow-up</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                            <span className="text-xs">Sort by: AI Priority</span>
                            <span className="material-symbols-outlined cursor-pointer hover:text-primary">filter_list</span>
                        </div>
                    </div>
                    <div className="min-w-full inline-block align-middle">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-[61px] z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient/MRN</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payer</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Days in A/R</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prob %</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Next AI Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {/* Active Row */}
                                <tr
                                    onClick={() => navigate('/collections/account/ACC-90284')}
                                    className="bg-primary/5 border-l-4 border-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">HIGH</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">John Doe</div>
                                        <div className="text-xs text-slate-400">MRN-882</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">UnitedHealth</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right text-slate-900 dark:text-white">$4,200.00</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">45</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                                                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '85%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-500">85%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-primary">Call Payer</span>
                                            <span className="material-symbols-outlined text-sm text-primary">bolt</span>
                                        </div>
                                    </td>
                                </tr>
                                {/* Normal Rows */}
                                <tr
                                    onClick={() => navigate('/collections/account/ACC-88122')}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">HIGH</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Sarah Smith</div>
                                        <div className="text-xs text-slate-400">MRN-104</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">Aetna</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right text-slate-900 dark:text-white">$1,850.50</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">62</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                                                <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '72%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-emerald-500">72%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Submit Claim</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">MED</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">Michael Brown</div>
                                        <div className="text-xs text-slate-400">MRN-923</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">Cigna</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right text-slate-900 dark:text-white">$9,100.00</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">31</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                                                <div className="bg-amber-500 h-1 rounded-full" style={{ width: '60%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-amber-500">60%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Review Denial</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">LOW</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white">David Wilson</div>
                                        <div className="text-xs text-slate-400">MRN-211</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">Medicare</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-right text-slate-900 dark:text-white">$12,400.00</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">15</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                                                <div className="bg-amber-500 h-1 rounded-full" style={{ width: '30%' }}></div>
                                            </div>
                                            <span className="text-sm font-bold text-amber-500">30%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">Validate COB</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Side: Contact Workspace */}
                <div className="w-[420px] bg-white dark:bg-card-dark border-l border-slate-200 dark:border-border-dark flex flex-col shrink-0">
                    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto">
                        {/* Workspace Header */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                                <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">Contact Workspace</h1>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/20">LIVE ACCOUNT</span>
                            </div>
                            <p className="text-slate-500 text-sm">Active: <span className="text-slate-900 dark:text-white font-medium">John Doe (MRN-882)</span></p>
                        </div>

                        {/* Dialer Section */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">phone_in_talk</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">UnitedHealth Provider Line</span>
                                </div>
                                <span className="text-xs text-slate-400">800-842-1100</span>
                            </div>
                            <button className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined">call</span>
                                <span>Start One-Click Dial</span>
                            </button>
                        </div>

                        {/* AI Script Panel */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">auto_awesome</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Payer Script</h3>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-card-dark flex flex-col gap-3">
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    "Claim denied for <span className="text-slate-900 dark:text-white font-medium italic">Coordination of Benefits</span>. Ask the representative: <span className="text-primary font-medium underline">'Can you verify the primary insurance on file for this member and provide the effective dates?'</span>"
                                </p>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded transition-colors text-slate-700 dark:text-slate-300">Copy Script</button>
                                    <button className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-sm">thumb_up</span></button>
                                    <button className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"><span className="material-symbols-outlined text-sm">thumb_down</span></button>
                                </div>
                            </div>
                        </div>

                        {/* Tabs/Tools Section */}
                        <div className="flex flex-col flex-1">
                            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
                                <button className="px-4 py-2 text-xs font-bold border-b-2 border-primary text-primary">Templates</button>
                                <button className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">History</button>
                                <button className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Notes</button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/50 cursor-pointer transition-colors group bg-white dark:bg-card-dark">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">mail</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">COB Information Request</p>
                                            <p className="text-[10px] text-slate-500">Patient Email Template</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-xs text-slate-600">chevron_right</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-primary/50 cursor-pointer transition-colors group bg-white dark:bg-card-dark">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">description</span>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">Payer Appeal Form</p>
                                            <p className="text-[10px] text-slate-500">Standardized Denial Appeal</p>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-xs text-slate-600">chevron_right</span>
                                </div>
                            </div>

                            {/* Notes Area */}
                            <div className="mt-6 font-sans">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quick Note (Auto-saves)</label>
                                <textarea className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg text-sm p-3 h-24 focus:ring-primary focus:border-primary dark:text-white" placeholder="Type call notes here..."></textarea>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <span className="material-symbols-outlined text-xs text-emerald-500">check_circle</span>
                                        Synced with EPIC EHR
                                    </div>
                                    <button className="text-[10px] font-bold text-primary hover:underline">Complete Task (Alt + C)</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hotkey Toolbar (Bottom) */}
            <footer className="bg-white dark:bg-card-dark border-t border-slate-200 dark:border-border-dark px-6 py-2 flex items-center justify-between shrink-0 h-10">
                <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">⌘</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">K</kbd> Search</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">Enter</kbd> Open Task</span>
                    <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">ESC</kbd> Close Call</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-emerald-500">VOIP Ready</span>
                </div>
            </footer>
        </div>
    );
}
