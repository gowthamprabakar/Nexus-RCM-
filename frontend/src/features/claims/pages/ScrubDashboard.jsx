import React from 'react';
import { usePreBatch } from '../context/PreBatchContext';
import { BatchReadinessMeter } from '../components/BatchReadinessMeter';
import { ValidationStatusBadge } from '../components/ValidationStatusBadge';

export function ScrubDashboard() {
    const { metrics } = usePreBatch();

    return (
        <div className="p-6 h-full overflow-y-auto animate-in fade-in duration-300">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Readiness Card */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm md:col-span-2 flex flex-col justify-center">
                        <BatchReadinessMeter percentage={metrics.batchReadiness} />
                        <div className="mt-4 flex gap-8">
                            <div>
                                <div className="text-sm text-slate-500">Total Claims</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalClaims}</div>
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">Est. Revenue</div>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${(metrics.totalClaims * 450).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Pass Rate */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                            <span className="text-sm font-bold text-slate-500 uppercase">First Pass Rate</span>
                        </div>
                        <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{metrics.passRate}%</div>
                        <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">trending_up</span>
                            +2.4% vs last batch
                        </div>
                    </div>

                    {/* Auto-Fix Impact */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-blue-500">auto_fix_high</span>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase">Auto-Fixed</span>
                        </div>
                        <div className="text-4xl font-black text-blue-900 dark:text-white mb-1">{metrics.autoFixRate}%</div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                            {Math.floor(metrics.totalClaims * (metrics.autoFixRate / 100))} claims corrected
                        </div>
                    </div>
                </div>

                {/* Breakdown Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Status Breakdown */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm lg:col-span-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Validation Status Breakdown</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                <ValidationStatusBadge status="Passed" />
                                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metrics.statusBreakdown.passed}</div>
                                <div className="text-xs text-slate-500">Clean Claims</div>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                <ValidationStatusBadge status="Auto-Fixed" />
                                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metrics.statusBreakdown.autoFixed}</div>
                                <div className="text-xs text-slate-500">AI Corrected</div>
                            </div>
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <ValidationStatusBadge status="Review Required" />
                                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metrics.statusBreakdown.reviewRequired}</div>
                                <div className="text-xs text-slate-500">Manual Attention</div>
                            </div>
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                <ValidationStatusBadge status="Blocked" />
                                <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metrics.statusBreakdown.blocked}</div>
                                <div className="text-xs text-slate-500">Fatal Errors</div>
                            </div>
                        </div>
                    </div>

                    {/* Error Categories */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Error Categories</h3>
                        <div className="space-y-4">
                            {metrics.errorCategories.map(cat => (
                                <div key={cat.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{cat.label}</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{cat.count}</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${cat.color} rounded-full`}
                                            style={{ width: `${(cat.count / 30) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ROI Banner */}
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Prevented Denial Revenue</h3>
                        <p className="text-violet-100 text-sm">Potential lost revenue caught by pre-batch Scrub this week.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black">${metrics.denialsPreventedValue.toLocaleString()}</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
