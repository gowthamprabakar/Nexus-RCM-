import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PayerPerformanceModal({ payer, onClose }) {
    if (!payer) return null;

    // Mock trend data for the payer
    const trendData = [
        { month: 'Jul', days: payer.days + 5, volume: 85 },
        { month: 'Aug', days: payer.days + 3, volume: 92 },
        { month: 'Sep', days: payer.days + 1, volume: 88 },
        { month: 'Oct', days: payer.days - 1, volume: 95 },
        { month: 'Nov', days: payer.days, volume: 90 },
        { month: 'Dec', days: payer.days, volume: 87 }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black mb-2">{payer.payer} Performance</h2>
                            <p className="text-purple-100">6-month collection velocity analysis</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Avg Days to Settle</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{payer.days}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Avg Balance</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                ${(payer.avgBalance / 1000).toFixed(0)}k
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Performance</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{payer.performance}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Denial Rate</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">8.2%</p>
                        </div>
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Collection Velocity Trend</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="days"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Insights */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Key Insights</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-600">lightbulb</span>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white mb-1">Improving Trend</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Collection velocity has improved by 12% over the last 3 months.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-amber-600">warning</span>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white mb-1">Watch Point</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        Claims with specific CPT codes (99285, 27447) show 20% longer settlement times.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        Export Report
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
