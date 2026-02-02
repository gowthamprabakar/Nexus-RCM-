import React from 'react';

export function PriorAuthManager() {
    return (
        <div className="flex-1 overflow-y-auto h-full bg-[#f6f6f8] dark:bg-[#101622] p-6 text-slate-900 dark:text-white custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Prior Authorization Command Center
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">AI-driven tracking and automated clinical justification.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Requests */}
                    <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Active Requests</h3>
                        <div className="space-y-4">
                            {[
                                { patient: "Jameson, R.", cpt: "MRI Knee (73721)", payer: "UHC", status: "Pending Clinicals", days: 2 },
                                { patient: "Miller, D.", cpt: "Cataract Surg (66984)", payer: "Aetna", status: "In Payer Review", days: 5 },
                                { patient: "Smith, A.", cpt: "Sleep Study (95810)", payer: "BCBS", status: "Approved", days: 0 },
                            ].map((req, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-[#1a2525] border border-slate-100 dark:border-[#3b5454]">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">{req.patient}</p>
                                        <p className="text-xs text-[#9db9b9]">{req.cpt} • {req.payer}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                            req.status === 'Pending Clinicals' ? 'bg-amber-500/10 text-amber-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>{req.status}</span>
                                        {req.days > 0 && <p className="text-[10px] text-slate-500 mt-1">{req.days} days aging</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI Clinical Assistant */}
                    <div className="bg-[#101622] text-white border border-[#3b5454] rounded-xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-9xl">psychology</span>
                        </div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                            <span className="material-symbols-outlined text-primary">auto_fix_high</span> AI Clinical Assistant
                        </h3>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 relative z-10">
                            <p className="text-xs text-[#9db9b9] uppercase font-bold mb-2">Drafting Justification For:</p>
                            <p className="font-bold text-sm mb-2">Sarah Jenkins - MRI Knee (Left)</p>
                            <div className="p-3 bg-black/30 rounded border border-white/5 text-xs font-mono text-gray-300">
                                "Patient presents with chronic left knee pain &gt; 6 weeks. Failed conservative therapy (NSAIDs + PT). MRI indicated to rule out meniscal tear..."
                            </div>
                        </div>

                        <div className="flex gap-3 relative z-10">
                            <button className="flex-1 bg-primary text-[#102222] font-bold py-2 rounded-lg hover:brightness-110">Attach Records</button>
                            <button className="flex-1 bg-white/10 text-white font-bold py-2 rounded-lg hover:bg-white/20">Edit Draft</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
