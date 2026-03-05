import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockForecastingData } from '../../../data/synthetic/mockForecastingData';

export function TransactionLedger() {
    const { transactionId } = useParams();
    const navigate = useNavigate();

    // In a real app, fetch data based on ID
    const transaction = mockForecastingData.transactions.find(t => t.id === transactionId) || mockForecastingData.transactions[0];

    return (
        <div className="flex h-full flex-col font-sans bg-[#f6f6f8] dark:bg-[#101622] text-slate-900 dark:text-white overflow-hidden">
            {/* Header */}
            <div className="h-16 px-6 border-b border-slate-200 dark:border-[#282e39] bg-white dark:bg-[#101622] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-[#282e39] rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            Transaction Ledger
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#282e39] text-xs font-mono rounded text-slate-500">{transaction.id}</span>
                        </h1>
                        <p className="text-xs text-slate-500">End-to-end audit trail and reconciliation</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">
                        Force Match
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Details & ERA */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-white dark:bg-[#111318] rounded-xl border border-slate-200 dark:border-[#3b4354] p-6 shadow-sm">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Payer</p>
                                    <p className="font-bold text-lg">{transaction.payer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Amount</p>
                                    <p className="font-bold text-lg font-mono">${transaction.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Date</p>
                                    <p className="font-bold text-lg">{transaction.date}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${transaction.status_gap === 'EHR Only' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                        {transaction.status_gap}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#282e39] grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Patient</p>
                                    <p className="font-medium">{transaction.patient}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-bold text-slate-400">Provider</p>
                                    <p className="font-medium">{transaction.provider}</p>
                                </div>
                            </div>
                        </div>

                        {/* ERA / EOB Viewer Concept */}
                        <div className="bg-white dark:bg-[#111318] rounded-xl border border-slate-200 dark:border-[#3b4354] overflow-hidden shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#3b4354] bg-slate-50 dark:bg-[#1c222d] flex justify-between items-center">
                                <h3 className="font-bold text-sm">Digital ERA View (835)</h3>
                                <button className="text-primary text-xs font-bold hover:underline">Download Original</button>
                            </div>
                            <div className="p-6 font-mono text-sm space-y-2 text-slate-600 dark:text-slate-300">
                                <p><span className="text-slate-400">TRN*1*</span>{transaction.id}<span className="text-slate-400">*1999999999</span></p>
                                <p><span className="text-slate-400">DTM*405*</span>{transaction.date.replace(/-/g, '')}</p>
                                <p><span className="text-slate-400">N1*PR*</span>{transaction.payer}</p>
                                <p><span className="text-slate-400">CLP*</span>{transaction.id}<span className="text-slate-400">*1*</span>{transaction.amount}<span className="text-slate-400">*0*</span></p>
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded mt-4">
                                    <p className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">warning</span>
                                        Variance Detected: Check Number Mismatch
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timeline Lifecycle */}
                    <div className="bg-white dark:bg-[#111318] rounded-xl border border-slate-200 dark:border-[#3b4354] p-6 shadow-sm h-fit">
                        <h3 className="font-bold text-lg mb-6">Payment Lifecycle</h3>
                        <div className="relative pl-4 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#282e39]">
                            {transaction.lifecycle_events && transaction.lifecycle_events.map((event, index) => (
                                <div key={index} className="relative flex gap-4">
                                    <div className={`z-10 size-10 rounded-full border-4 border-white dark:border-[#111318] flex items-center justify-center shrink-0 shadow-sm ${event.status === 'Success' ? 'bg-emerald-500 text-white' :
                                        event.status === 'Failed' ? 'bg-rose-500 text-white' :
                                            'bg-amber-500 text-white'
                                        }`}>
                                        <span className="material-symbols-outlined text-lg">
                                            {event.source === 'EHR' ? 'description' :
                                                event.source === 'Bank' ? 'account_balance' :
                                                    event.source === 'Payer' ? 'corporate_fare' : 'hub'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold">{event.date}</p>
                                        <p className="font-bold text-sm">{event.event}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{event.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
