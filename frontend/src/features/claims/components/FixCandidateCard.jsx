import React from 'react';
import { ValidationStatusBadge } from './ValidationStatusBadge';

export function FixCandidateCard({ claim, onApplyFix }) {
    const issue = claim.issues.find(i => i.autoFixAvailable && !i.applied);
    if (!issue) return null;

    return (
        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            {/* Confidence Strip */}
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${issue.confidenceScore > 0.9 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

            <div className="pl-3">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500">{claim.id}</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{claim.patient}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${issue.confidenceScore > 0.9 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {(issue.confidenceScore * 100).toFixed(0)}% Confidence
                    </span>
                </div>

                <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {issue.message}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                        <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                        AI Fix: {issue.suggestedFix}
                    </div>
                </div>

                <button
                    onClick={() => onApplyFix(claim.id, issue.id)}
                    className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    Apply Fix
                </button>
            </div>
        </div>
    );
}
