import React, { useState } from 'react';

export function ClaimScrubbing() {
    const [errorsFixed, setErrorsFixed] = useState({ modifier: false, diagnosis: false });

    const handleAutoFix = (type) => {
        setErrorsFixed(prev => ({ ...prev, [type]: true }));
    };

    return (
        <>
            <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-border-dark p-6">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                            <span>Claims</span>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span>Validation Detail</span>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span className="text-slate-900 dark:text-slate-100">#992831</span>
                        </nav>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Claim Scrubbing & Validation</h2>
                    </div>
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="flex items-center gap-6 pr-6 border-r border-slate-200 dark:border-border-dark">
                            {/* Validation Score Circle */}
                            <div className="relative size-16 flex items-center justify-center">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <circle className="stroke-slate-100 dark:stroke-slate-800" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                                    <circle className="stroke-primary transition-all duration-1000 ease-out" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${Object.values(errorsFixed).filter(Boolean).length * 4 + 90}, 100`} strokeLinecap="round" strokeWidth="3"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-base font-bold text-primary">{98 + Object.values(errorsFixed).filter(Boolean).length}</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Score</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-8">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Errors</span>
                                    <span className="text-xl font-bold text-red-600 transition-all">{2 - Object.values(errorsFixed).filter(Boolean).length}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Warnings</span>
                                    <span className="text-xl font-bold text-amber-500">1</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Missing</span>
                                    <span className="text-xl font-bold text-slate-600 dark:text-slate-300">0</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="h-10 px-4 bg-slate-100 dark:bg-card-dark text-slate-900 dark:text-white rounded-lg font-bold text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                                Save Draft
                            </button>
                            <button className="h-10 px-6 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
                                <span className="material-symbols-outlined text-sm">send</span>
                                Submit to Payer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Claim Data Editor */}
                <section className="w-[55%] border-r border-slate-200 dark:border-border-dark overflow-y-auto bg-white dark:bg-background-dark/30 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Claim Data Editor</h3>
                        <span className="text-xs text-primary font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">sync</span> Autosaved 2m ago
                        </span>
                    </div>

                    <div className="space-y-8">
                        {/* Patient Info Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary text-lg">person</span>
                                Patient & Encounter Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Patient Name</label>
                                    <input className="w-full h-9 rounded bg-slate-50 dark:bg-card-dark border-slate-200 dark:border-border-dark text-sm px-3 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" type="text" defaultValue="Sarah Jenkins" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Date of Service</label>
                                    <input className="w-full h-9 rounded bg-slate-50 dark:bg-card-dark border-slate-200 dark:border-border-dark text-sm px-3 focus:ring-1 focus:ring-primary text-slate-900 dark:text-white" type="date" defaultValue="2024-10-12" />
                                </div>
                            </div>
                        </div>

                        {/* Coding Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-primary text-lg">medical_services</span>
                                    Professional Services (CPT/HCPCS)
                                </h4>
                                <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                    <span className="material-symbols-outlined text-xs">add_circle</span> Add Service
                                </button>
                            </div>
                            <div className="border border-slate-200 dark:border-border-dark rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-card-dark/50 border-b border-slate-200 dark:border-border-dark">
                                        <tr>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">CPT Code</th>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">Modifier</th>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">Units</th>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">Charge</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark text-slate-900 dark:text-white">
                                        <tr className={errorsFixed.modifier ? "bg-green-50 dark:bg-green-900/10 transition-colors duration-500" : ""}>
                                            <td className="px-4 py-3">
                                                <input className="w-20 h-8 rounded border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/20 text-sm font-bold focus:ring-primary pl-2" type="text" defaultValue="99213" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    className={`w-16 h-8 rounded border text-sm font-bold focus:ring-primary pl-2 transition-all duration-300 ${errorsFixed.modifier
                                                            ? "border-slate-200 dark:border-border-dark bg-transparent text-slate-400 decoration-slate-400 line-through"
                                                            : "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                                                        }`}
                                                    type="text"
                                                    value={errorsFixed.modifier ? "25" : "25"}
                                                    readOnly
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input className="w-16 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm focus:ring-primary pl-2" type="number" defaultValue="1" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input className="w-24 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm focus:ring-primary pl-2" type="text" defaultValue="$125.00" />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">
                                                <input className="w-20 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm font-bold focus:ring-primary pl-2" type="text" defaultValue="90658" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input className="w-16 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm focus:ring-primary pl-2" placeholder="-" type="text" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input className="w-16 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm focus:ring-primary pl-2" type="number" defaultValue="1" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input className="w-24 h-8 rounded border-slate-200 dark:border-border-dark bg-transparent text-sm focus:ring-primary pl-2" type="text" defaultValue="$25.00" />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Diagnosis Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary text-lg">stethoscope</span>
                                ICD-10 Diagnosis Codes
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark">
                                    <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">A1</span>
                                    <span className="text-sm flex-1 text-slate-900 dark:text-white">Z00.00 - Encounter for general adult medical examination</span>
                                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                                        <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                </div>
                                {errorsFixed.diagnosis && (
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <span className="text-xs font-bold bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">NEW</span>
                                        <span className="text-sm flex-1 text-slate-900 dark:text-white">Z23 - Encounter for immunization</span>
                                        <button className="text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                )}
                                <button className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-border-dark rounded-lg text-xs font-bold text-slate-400 hover:border-primary hover:text-primary transition-all">
                                    + Add New Diagnosis
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right: Validation Engine */}
                <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Validation Engine</h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">
                                {Math.max(0, 2 - Object.values(errorsFixed).filter(Boolean).length)} ERRORS
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold">1 WARNING</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Error Card 1 */}
                        {!errorsFixed.modifier ? (
                            <div className="bg-white dark:bg-card-dark rounded-xl border-l-4 border-red-500 p-4 shadow-sm border border-slate-100 dark:border-border-dark transition-all duration-300">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-red-500">error</span>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">Incompatible Modifier</h5>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                            Modifier 25 is not typically used with CPT 99213 unless a significant, separately identifiable E/M service is performed.
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                                <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                                                AI Suggestion: Remove -25
                                            </div>
                                            <button
                                                onClick={() => handleAutoFix('modifier')}
                                                className="text-xs font-bold text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
                                            >
                                                Apply Auto-Fix
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-900/30 flex items-center justify-between animate-in fade-in duration-300">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    <div>
                                        <h5 className="text-sm font-bold text-green-700 dark:text-green-400">Fixed: Incompatible Modifier</h5>
                                        <p className="text-xs text-green-600 dark:text-green-500">Modifier 25 removed from 99213.</p>
                                    </div>
                                </div>
                                <button onClick={() => setErrorsFixed(prev => ({ ...prev, modifier: false }))} className="text-xs text-slate-400 hover:text-slate-600">Undo</button>
                            </div>
                        )}

                        {/* Error Card 2 */}
                        {!errorsFixed.diagnosis ? (
                            <div className="bg-white dark:bg-card-dark rounded-xl border-l-4 border-red-500 p-4 shadow-sm border border-slate-100 dark:border-border-dark transition-all duration-300">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-red-500">priority_high</span>
                                    <div className="flex-1">
                                        <h5 className="text-sm font-bold text-slate-900 dark:text-white">Diagnosis Coding Conflict</h5>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                            CPT 90658 (Flu Vaccine) lacks a corresponding preventative diagnosis code (Z23).
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                                <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                                                AI Suggestion: Add Z23
                                            </div>
                                            <button
                                                onClick={() => handleAutoFix('diagnosis')}
                                                className="text-xs font-bold text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
                                            >
                                                Apply Auto-Fix
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-4 border border-green-200 dark:border-green-900/30 flex items-center justify-between animate-in fade-in duration-300">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                                    <div>
                                        <h5 className="text-sm font-bold text-green-700 dark:text-green-400">Fixed: Diagnosis Coding</h5>
                                        <p className="text-xs text-green-600 dark:text-green-500">Added Z23 to encounter diagnoses.</p>
                                    </div>
                                </div>
                                <button onClick={() => setErrorsFixed(prev => ({ ...prev, diagnosis: false }))} className="text-xs text-slate-400 hover:text-slate-600">Undo</button>
                            </div>
                        )}

                        {/* Warning Card */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border-l-4 border-amber-500 p-4 shadow-sm border border-slate-100 dark:border-border-dark">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                <div className="flex-1">
                                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">Frequency Limit Pre-check</h5>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        Payer Medicare historically rejects 99213 more than 3 times per month for this patient. Verify encounter history.
                                    </p>
                                    <div className="mt-3">
                                        <button className="text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-border-dark px-3 py-1 rounded hover:bg-slate-100 dark:hover:bg-card-dark transition-colors">
                                            Dismiss Warning
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Prediction Panel */}
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20 mt-6">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-xl">psychology</span>
                                <h5 className="text-sm font-bold text-primary">AI Rejection Probability</h5>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full bg-primary transition-all duration-1000 ease-out`} style={{ width: Object.values(errorsFixed).every(Boolean) ? '2%' : '12%' }}></div>
                                </div>
                                <span className="text-sm font-extrabold text-primary transition-all">{Object.values(errorsFixed).every(Boolean) ? '2%' : '12%'}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                                {Object.values(errorsFixed).every(Boolean)
                                    ? "With applied fixes, this claim is now highly likely to be paid."
                                    : "Based on similar claims with Aetna, this claim has a high likelihood of clean-claim status after fixes."
                                }
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Payer-Specific Rule Check Panel */}
            <div className="h-48 border-t border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col">
                <div className="px-6 py-3 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined text-slate-400 text-lg">fact_check</span>
                        Payer-Specific Rule Check (Aetna Commercial)
                    </h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-bold text-slate-500">{12 + Object.values(errorsFixed).filter(Boolean).length} Passed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="size-2 rounded-full bg-red-500"></div>
                            <span className="text-[10px] font-bold text-slate-500">{2 - Object.values(errorsFixed).filter(Boolean).length} Failed</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-4 grid grid-cols-4 gap-4 overflow-y-auto">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-card-dark/50">
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        <div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">NCD/LCD Guidelines</p>
                            <p className="text-[9px] text-slate-500">Medical necessity met for all codes.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-card-dark/50">
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        <div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">Bundling Check (CCI)</p>
                            <p className="text-[9px] text-slate-500">No prohibited combinations found.</p>
                        </div>
                    </div>
                    {errorsFixed.modifier ? (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                            <div>
                                <p className="text-[11px] font-bold text-green-700 dark:text-green-400">Modifier Validation</p>
                                <p className="text-[9px] text-green-600 dark:text-green-500">Resolved: Modifier removed.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                            <span className="material-symbols-outlined text-red-500 text-xl">cancel</span>
                            <div>
                                <p className="text-[11px] font-bold text-red-700 dark:text-red-400">Modifier Validation</p>
                                <p className="text-[9px] text-red-600 dark:text-red-500">Conflict found on CPT 99213.</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-card-dark/50">
                        <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                        <div>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-white">Timely Filing</p>
                            <p className="text-[9px] text-slate-500">DOS is within the 90-day window.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Action Footer */}
            <div className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-border-dark px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">file_download</span> Export PDF
                    </button>
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1">
                        <span className="material-symbols-outlined text-lg">print</span> Print
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-xs font-medium text-slate-400 italic">Reviewing edits will recalculate the score automatically.</p>
                    <button className="h-11 px-8 bg-primary text-white rounded-lg font-bold text-sm shadow-xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
                        <span className="material-symbols-outlined">restart_alt</span>
                        Rescrub Claim
                    </button>
                </div>
            </div>
        </>
    );
}
