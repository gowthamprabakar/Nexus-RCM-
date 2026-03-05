import React from 'react';
import { mockARData } from '../../data/mockARData';

export function CollectionsStrategyModal({ accountId, onClose }) {
    const strategy = mockARData.strategyRecommendations;

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            case 'moderate': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            case 'good': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
            default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
        }
    };

    const getImpactColor = (impact) => {
        if (impact === 'high') return 'text-red-600 dark:text-red-400';
        if (impact === 'medium') return 'text-amber-600 dark:text-amber-400';
        return 'text-slate-600 dark:text-slate-400';
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-border-dark">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">AI Collections Strategy</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Account {strategy.accountId} • Claim {strategy.claimId}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Strategy Overview */}
                    <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 dark:from-primary/20 dark:to-blue-500/10 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Recommended Strategy</h3>
                                </div>
                                <p className="text-2xl font-black text-primary">{strategy.actionLabel}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Success Probability</p>
                                <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{strategy.successProbability}%</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    CI: {strategy.confidenceInterval[0]}-{strategy.confidenceInterval[1]}%
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expected Recovery</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">
                                    ${strategy.expectedRecovery.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    of ${strategy.currentBalance.toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Est. Time to Resolution</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{strategy.estimatedDays} days</p>
                            </div>
                            <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Priority Level</p>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 uppercase">
                                    {strategy.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Historical Analysis */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">history</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Similar Accounts Analysis</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            Based on {strategy.similarAccounts.length} similar accounts with the same payer and denial reason
                        </p>

                        <div className="space-y-3">
                            {strategy.similarAccounts.map((account) => (
                                <div
                                    key={account.accountId}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{account.accountId}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{account.denialReason}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Action Taken</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{account.actionTaken}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Outcome</p>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{account.outcome}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Recovered</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                ${account.recoveryAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Days</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{account.daysToResolution}d</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Success Rate</p>
                                            <p className="text-sm font-bold text-primary">{account.successRate}%</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payer Intelligence */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">business</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Payer Intelligence: {strategy.payerIntelligence.payerName}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Contact Information</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">phone</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{strategy.payerIntelligence.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            Best time: {strategy.payerIntelligence.bestTimeToContact.day}, {strategy.payerIntelligence.bestTimeToContact.time}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm text-primary">mail</span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">
                                            Preferred: {strategy.payerIntelligence.preferredMethod}
                                        </span>
                                    </div>
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-6 mb-3">Payment Patterns</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Days to Payment</span>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {strategy.payerIntelligence.paymentPatterns.avgDaysToPayment} days
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">On-Time Payment Rate</span>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {(strategy.payerIntelligence.paymentPatterns.onTimePaymentRate * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">Response Rate</span>
                                        <span className="text-sm font-bold text-primary">
                                            {(strategy.payerIntelligence.responseRate * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Common Denial Reasons</h4>
                                <div className="space-y-2">
                                    {strategy.payerIntelligence.commonDenialReasons.map((denial, idx) => (
                                        <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{denial.reason}</span>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{denial.frequency}% frequency</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                                    <div
                                                        className="bg-emerald-500 h-1.5 rounded-full"
                                                        style={{ width: `${denial.resolutionRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {denial.resolutionRate}% resolved
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Plan */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">checklist</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Step-by-Step Action Plan</h3>
                        </div>

                        <div className="space-y-4">
                            {strategy.actionPlan.map((step) => (
                                <div key={step.step} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                                            {step.step}
                                        </div>
                                        {step.step < strategy.actionPlan.length && (
                                            <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-2"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 pb-6">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{step.action}</h4>
                                                {step.required && (
                                                    <span className="inline-block text-xs text-red-600 dark:text-red-400 font-bold mt-1">
                                                        * Required
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{step.estimatedTime}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{step.description}</p>
                                        {step.documents && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {step.documents.map((doc, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-700 dark:text-slate-300"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">description</span>
                                                        {doc}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {step.deadline && (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                                ⏰ Deadline: {step.deadline}
                                            </p>
                                        )}
                                        {step.trigger && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                Trigger: {step.trigger}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">warning</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Risk Factors</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {strategy.riskFactors.map((risk, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{risk.factor}</h4>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(risk.status)}`}>
                                            {risk.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{risk.description}</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${getImpactColor(risk.impact)}`}>
                                            {risk.impact.toUpperCase()} IMPACT
                                        </span>
                                        <span className="text-xs text-slate-400">•</span>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{risk.recommendation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Templates */}
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">description</span>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Recommended Templates</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {strategy.templates.map((template) => (
                                <div key={template.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{template.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{template.category}</p>
                                        </div>
                                        <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors">
                                            Use Template
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">check_circle</span>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                {template.successRate}% success rate
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs text-slate-500">groups</span>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                                Used {template.usageCount}x
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>
                    <button className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        Execute Strategy
                    </button>
                </div>
            </div>
        </div>
    );
}
