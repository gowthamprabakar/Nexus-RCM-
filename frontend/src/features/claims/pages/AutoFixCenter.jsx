import React from 'react';
import { usePreBatch } from '../context/PreBatchContext';
import { FixCandidateCard } from '../components/FixCandidateCard';

export function AutoFixCenter() {
    const { claims, applyAutoFix } = usePreBatch();

    // Filter for claims that have auto-fixable issues that are not yet applied
    const fixCandidates = claims.filter(c =>
        c.issues.some(i => i.autoFixAvailable && !i.applied)
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-background-dark">
            <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark px-6 py-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Auto-Fix Center</h2>
                        <p className="text-sm text-slate-500">Review and approve high-confidence AI corrections.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{fixCandidates.length}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase">Candidates</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {fixCandidates.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl">check</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Clean!</h3>
                        <p>No auto-fix candidates remaining.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fixCandidates.map(claim => (
                            <FixCandidateCard
                                key={claim.id}
                                claim={claim}
                                onApplyFix={applyAutoFix}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
