import React, { useState } from 'react';

export function ClaimsFilterPanel({ isOpen, onClose, onApplyFilters }) {
    const [filters, setFilters] = useState({
        minValue: '',
        payer: 'all',
        errorType: 'all',
        riskLevel: 'all'
    });

    const handleApply = () => {
        onApplyFilters(filters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="relative w-96 h-full bg-white dark:bg-[#111818] border-l border-slate-200 dark:border-[#3b5454] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-[#283939] flex justify-between items-center bg-slate-50 dark:bg-[#1c2828]">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_list</span>
                        Smart Filters
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Value Range */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-[#9db9b9] tracking-wider">Claim Value</label>
                        <div className="flex bg-slate-100 dark:bg-[#1c2828] rounded-lg p-1 border border-slate-200 dark:border-[#3b5454]">
                            <span className="px-3 py-2 text-slate-500 font-bold">$</span>
                            <input
                                type="number"
                                placeholder="Min Amount (e.g. 1000)"
                                className="bg-transparent w-full text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
                                value={filters.minValue}
                                onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Payer Filter */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-[#9db9b9] tracking-wider">Payer Group</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Medicare', 'Cigna', 'Aetna', 'UHC'].map(payer => (
                                <button
                                    key={payer}
                                    onClick={() => setFilters({ ...filters, payer: filters.payer === payer ? 'all' : payer })}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${filters.payer === payer
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                            : 'bg-white dark:bg-[#1c2828] text-slate-500 dark:text-[#9db9b9] border-slate-200 dark:border-[#3b5454] hover:bg-slate-50'
                                        }`}
                                >
                                    {payer}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk Level */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-[#9db9b9] tracking-wider">Risk Level</label>
                        <select
                            className="w-full bg-white dark:bg-[#1c2828] border border-slate-200 dark:border-[#3b5454] rounded-lg px-4 py-3 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                            value={filters.riskLevel}
                            onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                        >
                            <option value="all">All Risk Levels</option>
                            <option value="high">High Risk (&gt; 80%)</option>
                            <option value="medium">Medium Risk (50-80%)</option>
                            <option value="low">Low Risk (&lt; 50%)</option>
                        </select>
                    </div>

                    {/* Error Type */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase text-slate-500 dark:text-[#9db9b9] tracking-wider">Error Category</label>
                        <div className="space-y-2">
                            {['Coding Mismatch', 'Registration', 'Pre-Auth Missing'].map(err => (
                                <label key={err} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-[#3b5454] hover:bg-slate-50 dark:hover:bg-[#1c2828] cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="errorType"
                                        checked={filters.errorType === err}
                                        onChange={() => setFilters({ ...filters, errorType: err })}
                                        className="text-primary focus:ring-primary bg-slate-100 border-slate-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{err}</span>
                                </label>
                            ))}
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-[#3b5454] hover:bg-slate-50 dark:hover:bg-[#1c2828] cursor-pointer transition-colors">
                                <input
                                    type="radio"
                                    name="errorType"
                                    checked={filters.errorType === 'all'}
                                    onChange={() => setFilters({ ...filters, errorType: 'all' })}
                                    className="text-primary focus:ring-primary bg-slate-100 border-slate-300"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Any Error</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-[#3b5454] bg-slate-50 dark:bg-[#1c2828] flex gap-3">
                    <button
                        onClick={() => setFilters({ minValue: '', payer: 'all', errorType: 'all', riskLevel: 'all' })}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-[#3b5454] text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-[#283939] transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] px-4 py-3 rounded-xl bg-primary text-[#102222] font-bold text-sm shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">check</span>
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
