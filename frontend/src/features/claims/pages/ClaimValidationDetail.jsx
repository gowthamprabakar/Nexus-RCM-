import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePreBatch } from '../context/PreBatchContext';
import { ValidationStatusBadge } from '../components/ValidationStatusBadge';

export function ClaimValidationDetail() {
    const { claimId } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    const { claims, applyAutoFix } = usePreBatch();

    // Find claim in context
    const claim = claims.find(c => c.id === claimId);

    // Local state for interactive demo parts (modifier/diagnosis fixes)
    const [errorsFixed, setErrorsFixed] = useState({ modifier: false, diagnosis: false });

    useEffect(() => {
        // Sync local state if claim is already auto-fixed in context
        if (claim?.status === 'Auto-Fixed') {
            setErrorsFixed({ modifier: true, diagnosis: true });
        }
    }, [claim]);

    if (!claim) return <div className="p-10">Claim not found</div>;

    const handleAutoFix = (type) => {
        setErrorsFixed(prev => ({ ...prev, [type]: true }));
        // Also update global context to reflect progress
        if (type === 'modifier') applyAutoFix(claim.id, 'ISS-001'); // Mock ID
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark animate-in fade-in slide-in-from-right-4 duration-300">

            {/* Header */}
            <div className="bg-white dark:bg-background-dark border-b border-slate-200 dark:border-border-dark p-6 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex flex-col gap-1">
                        <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
                            <button onClick={() => navigate('/claims/pre-batch-scrub/queue')} className="hover:text-primary">Validation Queue</button>
                            <span className="material-symbols-outlined text-xs">chevron_right</span>
                            <span className="text-slate-900 dark:text-slate-100">{claim.id}</span>
                        </nav>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            Claim Validation Detail
                            <ValidationStatusBadge status={claim.status} />
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 flex-1 justify-end">
                        <div className="flex items-center gap-6 pr-6 border-r border-slate-200 dark:border-border-dark">
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400 uppercase">Confidence</div>
                                <div className="text-xl font-black text-emerald-500">{(claim.confidenceScore * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => navigate('/claims/pre-batch-scrub/queue')} className="h-9 px-4 bg-slate-100 dark:bg-card-dark text-slate-900 dark:text-white rounded-lg font-bold text-xs transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                                Close
                            </button>
                            <button className="h-9 px-6 bg-primary text-white rounded-lg font-bold text-xs shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95">
                                <span className="material-symbols-outlined text-sm">save</span>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Claim Data Editor (Static Visualization for Demo) */}
                <section className="w-[60%] border-r border-slate-200 dark:border-border-dark overflow-y-auto bg-white dark:bg-background-dark/30 p-6">
                    <div className="space-y-8">
                        {/* Patient Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary text-lg">person</span>
                                Patient & Encounter
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Patient Name</label>
                                    <input className="w-full h-9 rounded bg-slate-50 dark:bg-card-dark border-slate-200 dark:border-border-dark text-sm px-3 text-slate-900 dark:text-white" type="text" defaultValue={claim.patient} readOnly />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500">Date of Service</label>
                                    <input className="w-full h-9 rounded bg-slate-50 dark:bg-card-dark border-slate-200 dark:border-border-dark text-sm px-3 text-slate-900 dark:text-white" type="date" defaultValue={claim.dos} readOnly />
                                </div>
                            </div>
                        </div>

                        {/* Coding Table */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <span className="material-symbols-outlined text-primary text-lg">medical_services</span>
                                Services
                            </h4>
                            <div className="border border-slate-200 dark:border-border-dark rounded-lg overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-card-dark/50 border-b border-slate-200 dark:border-border-dark">
                                        <tr>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">CPT Code</th>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">Modifier</th>
                                            <th className="px-4 py-2 font-bold text-slate-400 uppercase text-[10px]">Fee</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                                        <tr className={errorsFixed.modifier ? "bg-green-50 dark:bg-green-900/10" : ""}>
                                            <td className="px-4 py-3 font-mono">99213</td>
                                            <td className="px-4 py-3">
                                                <span className={`font-mono font-bold ${errorsFixed.modifier ? 'text-slate-400 line-through' : 'text-red-600'}`}>
                                                    25
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-900 dark:text-white">$125.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right: Issues Panel */}
                <section className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Validation Issues</h3>

                    <div className="space-y-4">
                        {claim.issues.map(issue => (
                            <div key={issue.id} className={`rounded-xl border p-4 shadow-sm transition-all ${errorsFixed.modifier && issue.id === 'ISS-001'
                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30'
                                    : 'bg-white border-red-200 border-l-4 border-l-red-500 dark:bg-card-dark dark:border-border-dark'
                                }`}>
                                <div className="flex gap-3">
                                    <span className={`material-symbols-outlined ${errorsFixed.modifier && issue.id === 'ISS-001' ? 'text-green-500' : 'text-red-500'}`}>
                                        {errorsFixed.modifier && issue.id === 'ISS-001' ? 'check_circle' : 'error'}
                                    </span>
                                    <div className="flex-1">
                                        <h5 className={`text-sm font-bold ${errorsFixed.modifier && issue.id === 'ISS-001' ? 'text-green-700 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}>
                                            {errorsFixed.modifier && issue.id === 'ISS-001' ? 'Fixed: ' + issue.type : issue.type + ' Error'}
                                        </h5>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {issue.message}
                                        </p>

                                        {!errorsFixed.modifier && issue.autoFixAvailable && (
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                                    <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                                                    Suggestion: {issue.suggestedFix}
                                                </div>
                                                <button
                                                    onClick={() => handleAutoFix('modifier')}
                                                    className="text-xs font-bold text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded transition-all border border-primary active:scale-95"
                                                >
                                                    Apply Fix
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {claim.issues.length === 0 && (
                            <div className="text-center py-10">
                                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-2">thumb_up</span>
                                <p className="font-bold text-slate-900 dark:text-white">Clean Claim</p>
                                <p className="text-xs text-slate-500">No validation issues found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
