import React, { useState } from 'react';
import { mockReconciliationData } from '../data/mockReconciliationData';

export function BankReconciliation() {
    const [selectedDeposit, setSelectedDeposit] = useState(null);
    const [filter, setFilter] = useState('all');

    const deposits = mockReconciliationData.bankDeposits;
    const { metrics } = mockReconciliationData;

    const filteredDeposits = deposits.filter(d => {
        if (filter === 'all') return true;
        return d.status.toLowerCase() === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Matched': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            case 'Partial Match': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            case 'Unmatched': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700 dashed border-2';
            case 'Flagged': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header & KPI */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">account_balance</span>
                            Bank Reconciliation Center
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time matching of Bank Feeds (Actual) vs System Postings (Book)</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white dark:bg-card-dark px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-right">
                            <div className="text-xs text-slate-500 font-bold uppercase">Unreconciled Cash</div>
                            <div className="text-xl font-mono font-bold text-red-600 dark:text-red-400">${metrics.unreconciledAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-white dark:bg-card-dark px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-right">
                            <div className="text-xs text-slate-500 font-bold uppercase">Suspense Balance</div>
                            <div className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">${metrics.suspenseAccountBalance.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Deposit Feed */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex gap-2">
                            {['all', 'matched', 'unmatched', 'flagged'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-card-dark text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {filteredDeposits.map((deposit) => (
                                <div
                                    key={deposit.id}
                                    onClick={() => setSelectedDeposit(deposit)}
                                    className={`group bg-white dark:bg-card-dark rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md relative overflow-hidden ${selectedDeposit?.id === deposit.id ? 'ring-2 ring-primary border-transparent' : 'border-slate-200 dark:border-border-dark'}`}
                                >
                                    {/* Status Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${deposit.status === 'Matched' ? 'bg-emerald-500' : deposit.status === 'Unmatched' ? 'bg-slate-300' : 'bg-red-500'}`}></div>

                                    <div className="flex justify-between items-center pl-3">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold ${deposit.amount > 10000 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {deposit.payer.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {deposit.payer}
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(deposit.status)}`}>
                                                        {deposit.status}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                                    <span className="font-mono">{deposit.date}</span> • {deposit.method} • Ref: <span className="font-mono text-xs">{deposit.traceNumber}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">${deposit.amount.toLocaleString()}</div>
                                            {deposit.matchVariance && (
                                                <div className="text-xs font-bold text-red-500">Var: ${deposit.matchVariance}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Col: Drill Down / Matcher */}
                    <div className="lg:col-span-1">
                        {selectedDeposit ? (
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-xl sticky top-6 animate-slide-in-right">
                                {/* Header */}
                                <div className="p-6 border-b border-slate-200 dark:border-border-dark bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="text-xs text-slate-500 font-bold uppercase mb-1">Drill-Through Analysis</div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedDeposit.id}</h2>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="text-sm text-slate-600 dark:text-slate-400">Bank Amount</div>
                                        <div className="font-mono font-bold text-lg">${selectedDeposit.amount.toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Content based on Status */}
                                <div className="p-6 space-y-6">
                                    {selectedDeposit.status === 'Matched' && (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-3xl">check_circle</span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-2">Fully Reconciled</h3>
                                            <p className="text-sm text-slate-500">
                                                This deposit matches System Payment <span className="font-mono font-bold text-slate-700 dark:text-slate-300">PMT-8001</span> perfectly.
                                            </p>
                                            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 text-left">
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Included Checks</div>
                                                {selectedDeposit.items.map(item => (
                                                    <div key={item.id} className="flex justify-between text-sm py-1">
                                                        <span className="font-mono text-slate-600">{item.id}</span>
                                                        <span className="font-mono text-slate-900 dark:text-white">${item.amount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDeposit.status === 'Unmatched' && (
                                        <div className="space-y-4">
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                                                <span className="material-symbols-outlined icon-filled">warning</span>
                                                <div>
                                                    <div className="font-bold">Missing Allocation</div>
                                                    Cash received in bank but no matching post found in RCM Pulse.
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <button className="w-full py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined">search</span>
                                                    Find Matching ERA
                                                </button>
                                                <button className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-all flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined">post_add</span>
                                                    Post to Suspense
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {selectedDeposit.status === 'Flagged' && (
                                        <div className="space-y-4">
                                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
                                                <div className="font-bold flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined icon-filled text-base">error</span>
                                                    Anomaly Detected
                                                </div>
                                                {selectedDeposit.issue}
                                            </div>
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <h4 className="font-bold text-sm mb-2">AI Suggested Action</h4>
                                                <p className="text-xs text-slate-500 mb-3">
                                                    Based on payer history, this large round amount suggests a capitation or settling of multiple bulk claims.
                                                </p>
                                                <button className="text-xs font-bold text-primary hover:underline">View Historical Splits for Medicare</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark border-dashed p-10 text-center h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-4 opacity-50">touch_app</span>
                                <p className="font-medium">Select a deposit to drill down</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
