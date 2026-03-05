import React from 'react';

export function AIInsightsPanel({ insights, onInsightClick }) {
    const getImpactColor = (impact) => {
        const colors = {
            'high': 'border-red-500 bg-red-50 dark:bg-red-900/10',
            'medium': 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
            'low': 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
        };
        return colors[impact] || 'border-slate-300';
    };

    const getImpactIcon = (impact) => {
        const icons = {
            'high': 'priority_high',
            'medium': 'info',
            'low': 'lightbulb'
        };
        return icons[impact] || 'info';
    };

    const getCategoryBadge = (category) => {
        const badges = {
            'payer-relationship': { label: 'Payer', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
            'process-improvement': { label: 'Process', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
            'timing': { label: 'Timing', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
            'training': { label: 'Training', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' }
        };
        return badges[category] || { label: 'General', color: 'bg-slate-100 text-slate-700' };
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border border-blue-100 dark:border-slate-700 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">psychology</span>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI-Powered Insights</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Actionable recommendations to optimize collections</p>
                </div>
            </div>

            <div className="space-y-4">
                {insights.slice(0, 4).map((insight, index) => {
                    const badge = getCategoryBadge(insight.category);
                    return (
                        <div
                            key={insight.id}
                            className={`border-l-4 ${getImpactColor(insight.impact)} bg-white dark:bg-slate-800 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5`}
                            onClick={() => onInsightClick && onInsightClick(insight)}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className={`material-symbols-outlined text-2xl ${insight.impact === 'high' ? 'text-red-500' :
                                            insight.impact === 'medium' ? 'text-amber-500' :
                                                'text-blue-500'
                                        }`}>
                                        {getImpactIcon(insight.impact)}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{insight.title}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{insight.description}</p>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                            💡 {insight.recommendation}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence</div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white">{insight.confidence}%</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div className="text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Potential Recovery: </span>
                                    <span className="font-bold text-green-600 dark:text-green-400">
                                        ${(insight.potentialRecovery / 1000).toFixed(0)}k
                                    </span>
                                </div>
                                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                    View Details
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
