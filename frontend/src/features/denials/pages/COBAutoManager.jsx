import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDenialData } from '../data/mockDenialData';
import { PayerOrderVisualizer } from '../components/PayerOrderVisualizer';
import { ConfidenceScoreTooltip } from '../components/ConfidenceScoreTooltip';

export function COBAutoManager() {
    const navigate = useNavigate();
    const { cobStats, cobConflicts } = mockDenialData;
    const [conflicts, setConflicts] = useState(cobConflicts);
    const [autoResolveThreshold, setAutoResolveThreshold] = useState(90);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAutoResolve = (id) => {
        setIsProcessing(true);
        setTimeout(() => {
            setConflicts(prev => prev.filter(c => c.id !== id));
            setIsProcessing(false);
        }, 800);
    };

    const handleBulkResolve = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setConflicts(prev => prev.filter(c => c.confidenceScore < autoResolveThreshold));
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">COB Auto Manager</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm pl-8">
                            Automated coordination of benefits resolution and payer sequencing.
                        </p>
                    </div>
                </div>

                {/* Section 1: Executive Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-slate-500">warning</span>
                        </div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Conflicts Detected</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{cobStats.conflictsDetected}</div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-emerald-500">auto_fix_high</span>
                        </div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Auto-Resolved</div>
                        <div className="text-3xl font-black text-emerald-600">{cobStats.autoResolved}</div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-6xl text-amber-500">pending_actions</span>
                        </div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Pending Review</div>
                        <div className="text-3xl font-black text-amber-600">{conflicts.length}</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-5 shadow-lg text-white">
                        <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Est. Denials Prevented</div>
                        <div className="text-3xl font-black">${(cobStats.estDenialsPrevented / 1000).toFixed(1)}k</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Conflict Queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">report_problem</span>
                                Conflict Queue
                            </h3>
                            <button
                                onClick={handleBulkResolve}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">auto_fix_normal</span>
                                Auto-Resolve Eligible ({conflicts.filter(c => c.confidenceScore >= autoResolveThreshold).length})
                            </button>
                        </div>

                        <div className="space-y-4">
                            {conflicts.map(conflict => (
                                <div key={conflict.id} className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">

                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-900 dark:text-white text-lg">{conflict.patient}</span>
                                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{conflict.claimId}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">ID: {conflict.id}</p>
                                                </div>
                                                <div className="text-right">
                                                    <ConfidenceScoreTooltip score={conflict.confidenceScore} />
                                                    <div className="text-xs text-slate-400 font-bold uppercase mt-1">Confidence</div>
                                                </div>
                                            </div>

                                            <PayerOrderVisualizer
                                                currentOrder={conflict.currentOrder}
                                                suggestedOrder={conflict.suggestedOrder}
                                                conflictType={conflict.conflictType}
                                            />
                                        </div>

                                        <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 min-w-[180px]">
                                            <button
                                                onClick={() => handleAutoResolve(conflict.id)}
                                                disabled={isProcessing}
                                                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Accept Fix
                                            </button>
                                            <button
                                                onClick={() => navigate(`/denials/claim/${conflict.claimId}`)}
                                                className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-colors text-sm"
                                            >
                                                Review Manual
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {conflicts.length === 0 && (
                                <div className="text-center py-12 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark border-dashed">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-3xl">check</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Clear!</h3>
                                    <p className="text-slate-500">No active COB conflicts pending review.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Automation Logic Panel */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
                            <h3 className="font-bold mb-4 flex items-center gap-2 relative z-10">
                                <span className="material-symbols-outlined text-indigo-400">psychology</span>
                                Auto-Resolution Logic
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-slate-300">Confidence Threshold</span>
                                        <span className="text-indigo-400">{autoResolveThreshold}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="70"
                                        max="100"
                                        value={autoResolveThreshold}
                                        onChange={(e) => setAutoResolveThreshold(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">
                                        System will automatically fix conflicts where AI confidence exceeds {autoResolveThreshold}%.
                                    </p>
                                </div>

                                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-400 uppercase">Engine Status</span>
                                    </div>
                                    <ul className="space-y-2 text-sm text-slate-300">
                                        <li className="flex justify-between">
                                            <span>Medicare Rules</span>
                                            <span className="text-emerald-400">Active</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Commercial COB</span>
                                            <span className="text-emerald-400">Active</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>State Medicaid</span>
                                            <span className="text-emerald-400">Active</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Rule Override</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Force manual review for specific payers or scenarios regardless of confidence score.
                            </p>
                            <button className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
                                Manage Rules
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
