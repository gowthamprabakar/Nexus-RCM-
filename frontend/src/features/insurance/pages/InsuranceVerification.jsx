import React, { useState } from 'react';

export function InsuranceVerification() {
    const [searchTerm, setSearchTerm] = useState("Jane Doe | 987654321");
    const [carrier, setCarrier] = useState("BlueShield CA - PPO");
    const [isRunning, setIsRunning] = useState(false);
    const [showResults, setShowResults] = useState(true);

    const handleRun270 = () => {
        setIsRunning(true);
        // Simulate API call
        setTimeout(() => {
            setIsRunning(false);
            setShowResults(true);
        }, 2000);
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto h-full bg-[#f6f6f8] dark:bg-[#101622] p-8 custom-scrollbar">
            {/* Header / Search Section */}
            <div className="bg-white dark:bg-[#101622] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Patient Name / ID</span>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">person</span>
                                <input
                                    className="w-full pl-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg h-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </label>
                        <label className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Insurance Carrier</span>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">corporate_fare</span>
                                <input
                                    className="w-full pl-10 border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg h-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary text-slate-900 dark:text-white"
                                    type="text"
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                />
                            </div>
                        </label>
                    </div>
                    <button
                        onClick={handleRun270}
                        disabled={isRunning}
                        className="flex items-center justify-center gap-2 bg-primary text-white h-12 px-8 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-70"
                    >
                        {isRunning ? (
                            <>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                Processing 270...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">sync</span>
                                Run 270 Transaction
                            </>
                        )}
                    </button>
                </div>
            </div>

            {showResults && (
                <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left: Benefit Coverage Breakdown (8 Cols) */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Status Banner */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-6 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-emerald-900 dark:text-emerald-400 text-lg font-bold leading-tight">Active Coverage</h3>
                                    <p className="text-emerald-700 dark:text-emerald-500/80 text-sm">271 Response: Eligibility Confirmed for 2024 (Plan #BS-990-23)</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">Effective Since</span>
                                <p className="text-emerald-900 dark:text-emerald-300 font-bold">01/01/2024</p>
                            </div>
                        </div>

                        {/* Deductibles & Progress */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#101622] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white">Individual Deductible</h4>
                                    <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">In-Network</span>
                                </div>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">$1,250<span className="text-lg text-gray-400 font-medium"> / $2,500</span></span>
                                    <span className="text-sm font-bold text-emerald-600">50% Met</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-1/2 rounded-full"></div>
                                </div>
                                <div className="mt-4 flex justify-between text-xs font-medium text-gray-500">
                                    <span>$1,250 Remaining</span>
                                    <span>$2,500 Total</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#101622] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-gray-900 dark:text-white">Out-of-Pocket Max</h4>
                                    <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">In-Network</span>
                                </div>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">$3,100<span className="text-lg text-gray-400 font-medium"> / $6,000</span></span>
                                    <span className="text-sm font-bold text-emerald-600">52% Met</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-[52%] rounded-full"></div>
                                </div>
                                <div className="mt-4 flex justify-between text-xs font-medium text-gray-500">
                                    <span>$2,900 Remaining</span>
                                    <span>$6,000 Total</span>
                                </div>
                            </div>
                        </div>

                        {/* Copay Grid */}
                        <div className="bg-white dark:bg-[#101622] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h4 className="font-bold text-gray-900 dark:text-white">Copayments by Service Type</h4>
                                <span className="material-symbols-outlined text-gray-400">info</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-800">
                                <div className="p-6 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Care</p>
                                    <p className="text-3xl font-black text-primary">$25.00</p>
                                    <p className="text-[10px] mt-1 text-gray-500">Per Visit</p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Specialist</p>
                                    <p className="text-3xl font-black text-primary">$50.00</p>
                                    <p className="text-[10px] mt-1 text-gray-500">Referral Required</p>
                                </div>
                                <div className="p-6 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Emergency Room</p>
                                    <p className="text-3xl font-black text-primary">$250.00</p>
                                    <p className="text-[10px] mt-1 text-gray-500">Waived if Admitted</p>
                                </div>
                            </div>
                        </div>

                        {/* Verification History */}
                        <div className="bg-white dark:bg-[#101622] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-900 dark:text-white">Verification History</h4>
                                <button className="text-primary text-xs font-bold hover:underline">View All</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <div className="size-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-500 text-lg">history</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Real-time Verification Run</p>
                                        <p className="text-xs text-gray-500">By Sarah Miller • 271 EDI Success</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Today, 09:15 AM</p>
                                        <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">ACTIVE</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                                    <div className="size-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-500 text-lg">history</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Scheduled Batch Check</p>
                                        <p className="text-xs text-gray-500">Automated System • 271 EDI Success</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Jun 12, 2024</p>
                                        <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded">ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Eligibility Insights (4 Cols) */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-[#101622] text-white p-6 rounded-xl border border-gray-800 shadow-xl">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                <h4 className="font-bold text-lg">AI Eligibility Insights</h4>
                            </div>
                            <div className="space-y-4">
                                {/* Insight 1 */}
                                <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-amber-500">warning</span>
                                        <div>
                                            <p className="text-sm font-bold mb-1">COB Required</p>
                                            <p className="text-xs text-gray-400 leading-relaxed">Secondary payer detected (United Healthcare). Patient must verify Coordination of Benefits before claim submission.</p>
                                            <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Resolve Now</button>
                                        </div>
                                    </div>
                                </div>
                                {/* Insight 2 */}
                                <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-primary">description</span>
                                        <div>
                                            <p className="text-sm font-bold mb-1">Auth Needed: CPT 99214</p>
                                            <p className="text-xs text-gray-400 leading-relaxed">AI predicts High-Complexity Office Visit requires prior authorization for this plan type.</p>
                                            <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">Start Auth Request</button>
                                        </div>
                                    </div>
                                </div>
                                {/* Insight 3 */}
                                <div className="bg-white/5 border border-white/10 p-4 rounded-lg relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
                                    <div className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                        <div>
                                            <p className="text-sm font-bold mb-1">Referral Status</p>
                                            <p className="text-xs text-gray-400 leading-relaxed">Current referral on file is valid until 12/31/2024. 6 remaining visits authorized.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h5 class="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Patient Demographics Match</h5>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Name Match</span>
                                        <span className="text-emerald-500 font-bold">100%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">DOB Match</span>
                                        <span className="text-emerald-500 font-bold">100%</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">Address Match</span>
                                        <span className="text-amber-500 font-bold">Partial (Zip)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white dark:bg-[#101622] p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Front Desk Actions</h4>
                            <div className="space-y-2">
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2525] text-sm font-medium flex items-center gap-3 transition-colors text-slate-700 dark:text-white">
                                    <span className="material-symbols-outlined text-gray-400">print</span>
                                    Print Benefit Summary
                                </button>
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2525] text-sm font-medium flex items-center gap-3 transition-colors text-primary">
                                    <span className="material-symbols-outlined">mail</span>
                                    Email Quote to Patient
                                </button>
                                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a2525] text-sm font-medium flex items-center gap-3 transition-colors text-slate-700 dark:text-white">
                                    <span className="material-symbols-outlined text-gray-400">file_download</span>
                                    Download Full 271 EDI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
