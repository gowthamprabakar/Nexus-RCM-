import React from 'react';

export function PayerOrderVisualizer({ currentOrder, suggestedOrder, conflictType }) {
    // Helper to parse "Payer A -> Payer B" string into array
    const parseOrder = (orderStr) => orderStr.split('→').map(s => s.trim());

    const current = parseOrder(currentOrder);
    const suggested = parseOrder(suggestedOrder);

    return (
        <div className="flex flex-col gap-6">
            {/* Current State (Problem) */}
            <div className="opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                <div className="text-xs font-bold uppercase text-slate-500 mb-2 flex justify-between">
                    <span>Current Sequence</span>
                    <span className="text-red-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {conflictType}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {current.map((payer, idx) => (
                        <React.Fragment key={idx}>
                            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-400">
                                {payer}
                            </div>
                            {idx < current.length - 1 && (
                                <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* AI Suggestion */}
            <div className="relative pl-4 border-l-2 border-emerald-500">
                <div className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    AI Suggested Sequence
                </div>
                <div className="flex items-center gap-2">
                    {suggested.map((payer, idx) => (
                        <React.Fragment key={idx}>
                            <div className={`px-4 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all
                                ${payer !== current[idx]
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white'
                                }
                            `}>
                                {payer}
                            </div>
                            {idx < suggested.length - 1 && (
                                <span className="material-symbols-outlined text-slate-400">arrow_forward</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
}
