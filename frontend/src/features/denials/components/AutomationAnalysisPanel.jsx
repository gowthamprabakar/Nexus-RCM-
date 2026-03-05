import React from 'react';

export function AutomationAnalysisPanel({ claim }) {
    if (!claim || (claim.category !== 'COB' && claim.category !== 'EVV')) return null;

    if (claim.category === 'COB') {
        return (
            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden mb-6 animate-fade-in">
                <div className="p-4 border-b border-slate-200 dark:border-border-dark bg-amber-50/50 dark:bg-amber-900/10 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 dark:text-amber-500">compare_arrows</span>
                        COB Payer Analysis
                    </h3>
                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full dark:bg-amber-900/40 dark:text-amber-400">
                        Conflict Detected
                    </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Visualizer */}
                    <div className="relative pt-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10 transform -translate-y-1/2"></div>
                        <div className="flex justify-between relative z-0">
                            <div className="text-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-1/3">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Primary</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{claim.payer || 'Medicare'}</div>
                            </div>
                            <div className="bg-red-50 text-red-600 rounded-full p-2 border border-red-100 flex items-center justify-center w-10 h-10 shadow-sm mt-2">
                                <span className="material-symbols-outlined text-xl">close</span>
                            </div>
                            <div className="text-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-1/3 opacity-50">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Secondary</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">BCBS</div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between relative z-0">
                            <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 w-1/3 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900">
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Correct Primary</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">BCBS (Active)</div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-600 rounded-full p-2 border border-emerald-100 flex items-center justify-center w-10 h-10 shadow-sm mt-2">
                                <span className="material-symbols-outlined text-xl">check</span>
                            </div>
                            <div className="text-center bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 w-1/3">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Correct Secondary</div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{claim.payer || 'Medicare'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Data */}
                    <div className="space-y-4 border-l border-slate-100 dark:border-slate-700 pl-8">
                        <div className="relative pb-6 border-l-2 border-emerald-500 pl-4">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                            <div className="text-xs text-emerald-600 font-bold mb-1">Just Now</div>
                            <h4 className="font-bold text-sm">Real-time Eligibility Check</h4>
                            <p className="text-xs text-slate-500 mt-1">Bot verified BCBS active coverage via portal.</p>
                        </div>
                        <div className="relative pb-6 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                            <div className="absolute -left-[21px] top-0 w-3 h-3 bg-slate-300 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                            <div className="text-xs text-slate-400 font-bold mb-1">2 Days Ago</div>
                            <h4 className="font-bold text-sm text-slate-600">Claim Created</h4>
                            <p className="text-xs text-slate-500 mt-1">Submitted with default payer order.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (claim.category === 'EVV') {
        return (
            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden mb-6 animate-fade-in">
                <div className="p-4 border-b border-slate-200 dark:border-border-dark bg-indigo-50/50 dark:bg-indigo-900/10 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-500">location_on</span>
                        EVV & GPS Analysis
                    </h3>
                    <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/40 dark:text-indigo-400">
                        Location Mismatch
                    </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Mock Map View */}
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 relative overflow-hidden h-48 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                        {/* Patient Home */}
                        <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <span className="material-symbols-outlined text-3xl text-indigo-500">home_pin</span>
                            <span className="text-[10px] font-bold bg-white/80 px-1.5 rounded mt-0.5">Patient Home</span>
                        </div>

                        {/* Clock In Location */}
                        <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                            <span className="material-symbols-outlined text-3xl text-red-500">person_pin_circle</span>
                            <span className="text-[10px] font-bold bg-white/80 px-1.5 rounded mt-0.5 text-red-600">Clock-In (0.6mi away)</span>
                        </div>

                        {/* Connection Line */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <line x1="33%" y1="50%" x2="66%" y2="50%" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                        </svg>
                    </div>

                    {/* Visit Logs */}
                    <div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-slate-500 uppercase border-b border-slate-100 dark:border-slate-700">
                                    <th className="text-left pb-2">Event</th>
                                    <th className="text-right pb-2">Time</th>
                                    <th className="text-right pb-2">Variance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                <tr>
                                    <td className="py-3 font-medium">Scheduled Start</td>
                                    <td className="py-3 text-right font-mono">09:00 AM</td>
                                    <td className="py-3 text-right text-slate-400">-</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-red-600">Clock In</td>
                                    <td className="py-3 text-right font-mono">09:12 AM</td>
                                    <td className="py-3 text-right text-red-500">+12m</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium">Scheduled End</td>
                                    <td className="py-3 text-right font-mono">11:00 AM</td>
                                    <td className="py-3 text-right text-slate-400">-</td>
                                </tr>
                                <tr>
                                    <td className="py-3 font-medium text-emerald-600">Clock Out</td>
                                    <td className="py-3 text-right font-mono">11:05 AM</td>
                                    <td className="py-3 text-right text-emerald-500">+5m</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300 flex gap-2">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Significant GPS variance detected at clock-in. Manual verification required.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
