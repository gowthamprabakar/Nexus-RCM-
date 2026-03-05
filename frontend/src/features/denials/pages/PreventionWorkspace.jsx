import React, { useState } from 'react';
import { mockDenialData } from '../data/mockDenialData';
import { StatusPill } from '../components/StatusPill';

export function PreventionWorkspace() {
    // Mocking a queue of items to work on
    const [queue, setQueue] = useState(mockDenialData.highRiskClaims.slice(0, 5));
    const [processingId, setProcessingId] = useState(null);

    const handleAction = (id, action) => {
        setProcessingId(id);
        // Simulate API call
        setTimeout(() => {
            setQueue(current => current.filter(item => item.id !== id));
            setProcessingId(null);
            // In a real app, show toast notification here
        }, 1500);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1000px] mx-auto w-full space-y-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Prevention Workspace</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Review and execute AI-recommended preventive actions.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{queue.length}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Pending Actions</div>
                    </div>
                </div>

                {queue.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <span className="material-symbols-outlined text-6xl text-emerald-200 mb-4">check_circle</span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
                        <p className="text-slate-500">You've cleared the high-priority prevention queue.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {queue.map(claim => {
                            const recommendation = mockDenialData.preventionActions[claim.topFactor] || { action: 'Manual Review', type: 'Review' };

                            return (
                                <div key={claim.id} className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden flex flex-col md:flex-row">
                                    {/* Left: Claim Context */}
                                    <div className="p-6 flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{claim.id}</span>
                                                <span className="text-sm text-slate-500">• {claim.patient}</span>
                                            </div>
                                            <StatusPill status="Predicted" size="sm" />
                                        </div>
                                        <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                            <span className="font-bold">Risk:</span> {claim.topFactor}
                                        </div>
                                        <div className="flex gap-4 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
                                            <div>
                                                <span className="block uppercase text-[10px] text-slate-400 mb-0.5">Payer</span>
                                                <span className="text-slate-900 dark:text-white">{claim.payer}</span>
                                            </div>
                                            <div>
                                                <span className="block uppercase text-[10px] text-slate-400 mb-0.5">Service Date</span>
                                                <span className="text-slate-900 dark:text-white">{claim.serviceDate}</span>
                                            </div>
                                            <div>
                                                <span className="block uppercase text-[10px] text-slate-400 mb-0.5">Amount</span>
                                                <span className="text-slate-900 dark:text-white">${claim.amount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action Area */}
                                    <div className="bg-slate-50 dark:bg-slate-800/30 p-6 md:w-80 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 flex flex-col justify-center gap-3">
                                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                            <span className="material-symbols-outlined text-lg">lightbulb</span>
                                            AI Recommendation
                                        </div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                            {recommendation.action}
                                        </p>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleAction(claim.id, 'approve')}
                                                disabled={processingId === claim.id}
                                                className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                            >
                                                {processingId === claim.id ? (
                                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                                ) : 'Execute'}
                                            </button>
                                            <button
                                                onClick={() => handleAction(claim.id, 'ignore')}
                                                disabled={processingId === claim.id}
                                                className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white rounded-lg transition-colors"
                                                title="Ignore / Reject"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
