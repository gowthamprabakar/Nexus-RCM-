import React from 'react';

export function AIInsightDetailModal({ insight, onClose }) {
    if (!insight) return null;

    const getImpactColor = (impact) => {
        const colors = {
            'high': 'from-red-600 to-pink-600',
            'medium': 'from-amber-600 to-orange-600',
            'low': 'from-blue-600 to-indigo-600'
        };
        return colors[impact] || 'from-slate-600 to-slate-700';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-r ${getImpactColor(insight.impact)} p-6 text-white`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl">psychology</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black mb-2">{insight.title}</h2>
                                <p className="text-white/90">{insight.description}</p>
                            </div>
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
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Impact Level</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{insight.impact}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Confidence</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{insight.confidence}%</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <p className="text-green-600 dark:text-green-400 text-xs font-bold mb-1">Potential Recovery</p>
                            <p className="text-2xl font-black text-green-700 dark:text-green-300">
                                ${(insight.potentialRecovery / 1000).toFixed(0)}k
                            </p>
                        </div>
                    </div>

                    {/* Recommendation Section */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-xl mb-6">
                        <div className="flex items-start gap-3 mb-4">
                            <span className="material-symbols-outlined text-blue-600 text-2xl">recommend</span>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Recommended Action</h3>
                                <p className="text-slate-700 dark:text-slate-300">{insight.recommendation}</p>
                            </div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">play_arrow</span>
                            Execute Recommendation
                        </button>
                    </div>

                    {/* Supporting Data */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Supporting Analysis</h3>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">analytics</span>
                                Data Points Analyzed
                            </h4>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Historical claim data (12 months)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Payer settlement patterns
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Industry benchmarks
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    Denial trend analysis
                                </li>
                            </ul>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">timeline</span>
                                Expected Timeline
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Implementation: 2-3 weeks • Expected results: 30-45 days
                            </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">groups</span>
                                Stakeholders
                            </h4>
                            <div className="flex gap-2 flex-wrap">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold">
                                    Collections Team
                                </span>
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-bold">
                                    Payer Relations
                                </span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                                    Revenue Cycle Mgmt
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <button className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">share</span>
                        Share Insight
                    </button>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            Save for Later
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
