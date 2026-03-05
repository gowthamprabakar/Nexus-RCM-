import React, { useState } from 'react';

export function BillingRules() {
    const [toggles, setToggles] = useState({
        deepLearning: true,
        modifierValidation: true,
        specificPayer: true
    });

    const rules = [
        {
            id: "R-9921",
            name: "Medicare: Cardiology Modifier-26 Requirement",
            payer: "Medicare Part B",
            desc: "IF CPT is (93000..93010) AND Payer is (Medicare Part B) THEN require (Modifier 26)",
            status: "Active"
        },
        {
            id: "R-8842",
            name: "UnitedHealthcare: PT Visit Limit Check",
            payer: "UnitedHealthcare",
            desc: "IF CPT is (97110, 97112) THEN check (Visit Count > 20) in Rolling Year",
            status: "Active"
        }
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Billing Rules Configuration</h1>
                    <p className="text-slate-500 mt-2">Manage global scrubbing logic and payer-specific validation rules.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all">
                    <span className="material-symbols-outlined text-sm">magic_button</span> Create Custom Rule
                </button>
            </header>

            {/* Global Switches */}
            <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 divide-y divide-slate-100 dark:divide-gray-800 shadow-sm">
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Deep Learning Scrubbing</h3>
                        <p className="text-sm text-slate-500">Enable multi-layered payer logic analysis based on historical denials.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={toggles.deepLearning} onChange={() => setToggles({ ...toggles, deepLearning: !toggles.deepLearning })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
                <div className="p-5 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Modifier Validation</h3>
                        <p className="text-sm text-slate-500">Verification of modifier compatibility with CPT/HCPCS code combinations.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={toggles.modifierValidation} onChange={() => setToggles({ ...toggles, modifierValidation: !toggles.modifierValidation })} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>

            {/* Rule Wizard Mockup */}
            <div className="bg-slate-50 dark:bg-[#0d1117] p-6 rounded-xl border border-dashed border-slate-300 dark:border-gray-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">science</span> Quick Rule Builder
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Payer</label>
                        <select className="w-full mt-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm">
                            <option>Medicare Part B</option>
                            <option>Aetna</option>
                            <option>Cigna</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Trigger Code (CPT)</label>
                        <input type="text" className="w-full mt-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm" placeholder="e.g. 99214" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                        <select className="w-full mt-1 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg p-2.5 text-sm">
                            <option>Require Modifier</option>
                            <option>Flag for Review</option>
                            <option>Deny Entry</option>
                        </select>
                    </div>
                    <button className="bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
                        Add Logic
                    </button>
                </div>
            </div>

            {/* Active Rules List */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Custom Rules</h3>
                {rules.map((rule, i) => (
                    <div key={i} className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 p-5 flex items-start justify-between group hover:border-primary/50 transition-colors">
                        <div className="flex gap-4">
                            <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined">gavel</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base">{rule.name}</h4>
                                <div className="flex items-center gap-2 mt-1 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-gray-800 text-slate-500 px-2 py-0.5 rounded">{rule.id}</span>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{rule.payer}</span>
                                </div>
                                <p className="text-sm font-mono text-slate-500 bg-slate-50 dark:bg-[#0d1117] px-3 py-1.5 rounded border border-slate-100 dark:border-gray-800 inline-block">
                                    {rule.desc}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="size-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button className="size-8 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-gray-800 text-xs text-slate-400">
                <p>Blockchain Audit Log Hash: 0x8a1...f3e2 | Rule Integrity Verified</p>
                <p>System v4.2.1-stable</p>
            </div>
        </div>
    );
}
