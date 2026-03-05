import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export function DenialManagement() {
    const navigate = useNavigate();
    const [showAIModal, setShowAIModal] = useState(false);
    const [showHeatmapModal, setShowHeatmapModal] = useState(false);

    const handleDrillDown = (path) => {
        navigate(path);
    };
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            {/* Page Header */}
            <div className="px-8 py-6 max-w-[1600px] mx-auto w-full">
                <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">Denial Prevention & Appeals</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Real-time predictive insights and automated recovery management powered by AI.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                            <span className="material-symbols-outlined mr-2 text-sm">download</span>
                            Export Report
                        </button>
                        <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined mr-2 text-sm">bolt</span>
                            Run AI Audit
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-8 flex-wrap">
                    <button className="flex h-9 items-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 px-4 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors shadow-sm">
                        <p className="text-slate-700 dark:text-white text-xs font-bold">Date: Last 30 Days</p>
                        <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                    </button>
                    <button className="flex h-9 items-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 px-4 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors shadow-sm">
                        <p className="text-slate-700 dark:text-white text-xs font-bold">Facility: Northeast Medical Center</p>
                        <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                    </button>
                    <button className="flex h-9 items-center gap-x-2 rounded-lg bg-white dark:bg-slate-800 px-4 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors shadow-sm">
                        <p className="text-slate-700 dark:text-white text-xs font-bold">Risk Level: High Only</p>
                        <span className="material-symbols-outlined text-slate-400 text-lg">expand_more</span>
                    </button>
                    <div className="flex-1"></div>
                    <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full border border-primary/30 animate-pulse-slow">
                        <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-primary text-[11px] font-bold uppercase tracking-wider">AI Live Monitoring Active</span>
                    </div>
                </div>

                {/* KPI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div
                        onClick={() => handleDrillDown('/denials/analytics')}
                        className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Denied Revenue At Risk</p>
                            <span className="material-symbols-outlined text-primary text-xl">account_balance_wallet</span>
                        </div>
                        <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-black">$4.2M</p>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
                            <p className="text-green-600 dark:text-green-400 text-sm font-bold">+12.4% vs last mo</p>
                        </div>
                    </div>
                    <div
                        onClick={() => handleDrillDown('/denials/analytics')}
                        className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Successful Appeal Rate</p>
                            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                        </div>
                        <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-black">68.5%</p>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-green-500 text-sm">trending_up</span>
                            <p className="text-green-600 dark:text-green-400 text-sm font-bold">+2.1% efficiency</p>
                        </div>
                    </div>
                    <div
                        onClick={() => handleDrillDown('/denials/analytics')}
                        className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-md hover:border-primary/50 cursor-pointer transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider group-hover:text-primary transition-colors">Projected Recovery</p>
                            <span className="material-symbols-outlined text-primary text-xl">insights</span>
                        </div>
                        <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-black">$2.8M</p>
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-red-500 text-sm">trending_down</span>
                            <p className="text-red-500 text-sm font-bold">-5.2% timeliness</p>
                        </div>
                    </div>
                    <div
                        onClick={() => setShowAIModal(true)}
                        className="flex flex-col gap-2 rounded-xl p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-primary/50 shadow-sm relative overflow-hidden hover:scale-[1.02] cursor-pointer transition-transform"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full z-0"></div>
                        <div className="flex justify-between items-start relative z-10">
                            <p className="text-primary text-xs font-black uppercase tracking-wider">AI Prevention Impact</p>
                            <span className="material-symbols-outlined text-primary text-xl animate-pulse-slow">auto_awesome</span>
                        </div>
                        <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-black relative z-10">422</p>
                        <p className="text-primary text-sm font-bold relative z-10">Claims auto-corrected</p>
                    </div>
                </div>

                {/* Middle Section: Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Predictive Denial Analytics Heatmap */}
                    <div
                        onClick={() => setShowHeatmapModal(true)}
                        className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-6 shadow-sm cursor-pointer hover:border-primary/50 transition-colors group"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold group-hover:text-primary transition-colors">Predictive Denial Heatmap</h3>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                                <span>Low Risk</span>
                                <div className="flex h-2 w-24 rounded-full overflow-hidden">
                                    <div className="bg-blue-200 dark:bg-blue-900 w-1/4"></div>
                                    <div className="bg-blue-300 dark:bg-blue-700 w-1/4"></div>
                                    <div className="bg-blue-500 dark:bg-blue-500 w-1/4"></div>
                                    <div className="bg-blue-700 dark:bg-blue-300 w-1/4"></div>
                                </div>
                                <span>High Risk</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                            <div className="col-start-2 text-center text-[10px] text-slate-500 font-bold">Radiology</div>
                            <div className="text-center text-[10px] text-slate-500 font-bold">Cardiology</div>
                            <div className="text-center text-[10px] text-slate-500 font-bold">Emergency</div>
                            <div className="text-center text-[10px] text-slate-500 font-bold">Oncology</div>
                            <div className="text-center text-[10px] text-slate-500 font-bold">Surgery</div>

                            <div className="text-right text-[10px] text-slate-500 font-bold pr-2 flex items-center justify-end">Medicare</div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer" title="Low Risk"></div>
                            <div className="h-10 bg-blue-500 dark:bg-blue-600 rounded hover:scale-105 transition-transform cursor-pointer" title="High Risk"></div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer" title="Medium Risk"></div>
                            <div className="h-10 bg-blue-700 dark:bg-primary rounded hover:scale-105 transition-transform cursor-pointer" title="Critical Risk"></div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer" title="Low Risk"></div>

                            <div className="text-right text-[10px] text-slate-500 font-bold pr-2 flex items-center justify-end">UHC</div>
                            <div className="h-10 bg-blue-700 dark:bg-primary rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-500 dark:bg-blue-600 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer"></div>

                            <div className="text-right text-[10px] text-slate-500 font-bold pr-2 flex items-center justify-end">Aetna</div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-700 dark:bg-primary rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-500 dark:bg-blue-600 rounded hover:scale-105 transition-transform cursor-pointer"></div>

                            <div className="text-right text-[10px] text-slate-500 font-bold pr-2 flex items-center justify-end">Cigna</div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-500 dark:bg-blue-600 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-300 dark:bg-blue-800 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                            <div className="h-10 bg-blue-100 dark:bg-blue-900/40 rounded hover:scale-105 transition-transform cursor-pointer"></div>
                        </div>
                        <div className="mt-6 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <span className="material-symbols-outlined text-primary">info</span>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                <span className="text-slate-900 dark:text-white font-bold">AI Insight:</span> Medicare/Oncology shows a 24% spike in medical necessity denials. Recommended action: Update clinical documentation templates for chemotherapy protocols.
                            </p>
                        </div>
                    </div>

                    {/* Root Cause Analysis (Simulated Donut) */}
                    <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-6 shadow-sm flex flex-col items-center justify-center">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6 w-full text-left">Root Cause Analysis</h3>
                        <div className="relative flex justify-center py-4">
                            <div className="size-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800 relative flex items-center justify-center">
                                {/* Segments Simulation using simple rotation/borders trick or just CSS gradients. Using conic gradient for better React compatibility if I could, but here sticking to simple CSS borders simulation from mockup */}
                                <div className="absolute inset-0 rounded-full border-[16px] border-primary border-t-transparent border-l-transparent -rotate-45 opacity-100"></div>
                                <div className="absolute inset-0 rounded-full border-[16px] border-blue-400 border-r-transparent border-b-transparent rotate-12 opacity-100"></div>

                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">72%</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Clinical</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 mt-6 w-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-primary"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Medical Necessity</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">42%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-blue-400"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Missing Documentation</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">28%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Coding Errors</span>
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">18%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lower Section: Appeals & Payer Intel */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-12">
                    {/* Appeal Management Queue */}
                    <div className="xl:col-span-3 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="text-slate-900 dark:text-white text-lg font-bold">Active Appeals Queue</h3>
                            <div className="flex gap-2">
                                <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <button className="bg-primary text-white px-3 py-1 text-xs font-bold">All</button>
                                    <button className="bg-white dark:bg-slate-800 text-slate-500 px-3 py-1 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700">High Priority</button>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-6 py-4">Claim ID</th>
                                        <th className="px-6 py-4">Payer</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Denial Reason</th>
                                        <th className="px-6 py-4">AI Confidence</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-white text-sm font-bold">CLM-882193</span>
                                                <span className="text-[10px] text-slate-500">DOS: 10/24/23</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">Medicare (Part B)</td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-bold">$12,450.00</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold">Med Necessity</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full w-[92%]"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary">92%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to="/denials/appeal" className="flex items-center gap-1 bg-primary px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm ml-auto">
                                                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                                                AI Appeal
                                            </Link>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-900 dark:text-white text-sm font-bold">CLM-990214</span>
                                                <span className="text-[10px] text-slate-500">DOS: 10/22/23</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">UnitedHealthcare</td>
                                        <td className="px-6 py-4 text-slate-900 dark:text-white text-sm font-bold">$4,120.00</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold">Pre-Auth Missing</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="bg-primary h-full w-[78%]"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-primary">78%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to="/denials/appeal" className="flex items-center gap-1 bg-primary px-3 py-1.5 rounded-lg text-white text-xs font-bold hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 shadow-sm ml-auto">
                                                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                                                AI Appeal
                                            </Link>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 flex justify-center border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800/30">
                            <button className="text-slate-500 text-xs font-bold hover:text-primary transition-colors">View All 1,242 Claims</button>
                        </div>
                    </div>

                    {/* Payer Intelligence Panel */}
                    <div className="rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark p-6 shadow-sm">
                        <h3 className="text-slate-900 dark:text-white text-lg font-bold mb-6">Payer Intelligence</h3>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors cursor-pointer group">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-900 dark:text-white text-sm font-bold">Medicare</span>
                                    <span className="text-green-600 dark:text-green-400 text-[10px] font-bold">+2.4%</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-1">
                                    <span>Win Rate</span>
                                    <span>78.2%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                    <div className="bg-primary h-full w-[78%]"></div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    <span>Avg Overturn: 14 Days</span>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors cursor-pointer">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-900 dark:text-white text-sm font-bold">UnitedHealthcare</span>
                                    <span className="text-red-500 text-[10px] font-bold">-4.1%</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-bold mb-1">
                                    <span>Win Rate</span>
                                    <span>52.4%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                    <div className="bg-primary h-full w-[52%]"></div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    <span>Avg Overturn: 32 Days</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                                <h4 className="text-slate-900 dark:text-white text-xs font-bold uppercase">Behavioral Trend</h4>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                "UHC has increased technical denials for 'Itemized Statements' by 40%. AI has updated the auto-attach logic."
                            </p>
                        </div>
                    </div>
                </div>
            </div>


            {/* AI Impact Modal */}
            {
                showAIModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowAIModal(false)}>
                        <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-border-dark overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">AI Prevention Impact</h3>
                                    <p className="text-sm text-slate-500">Real-time auto-correction logs</p>
                                </div>
                                <button onClick={() => setShowAIModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <span className="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>
                            <div className="p-0 max-h-[60vh] overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                                        <tr className="text-xs font-bold text-slate-500 uppercase">
                                            <th className="px-6 py-3">Claim ID</th>
                                            <th className="px-6 py-3">Issue Detected</th>
                                            <th className="px-6 py-3">Action Taken</th>
                                            <th className="px-6 py-3 text-right">Savings</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">CLM-2023-00{i}</td>
                                                <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">Missing Modifier 25</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold border border-green-200 dark:border-green-900">
                                                        <span className="material-symbols-outlined text-[12px]">auto_fix</span>
                                                        Auto-Appended
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs font-bold text-slate-900 dark:text-white">$1,240.00</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                                <button onClick={() => setShowAIModal(false)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Heatmap Drill-down Modal */}
            {
                showHeatmapModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowHeatmapModal(false)}>
                        <div className="bg-white dark:bg-card-dark w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-border-dark overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Oncology / Medicare Risk Analysis</h3>
                                    <p className="text-sm text-slate-500">Drill-down into high-risk denial patterns</p>
                                </div>
                                <button onClick={() => setShowHeatmapModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <span className="material-symbols-outlined text-slate-400">close</span>
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top Root Causes</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                            <span className="text-xs font-bold text-red-700 dark:text-red-400">Medical Necessity</span>
                                            <span className="text-xs font-black text-red-700 dark:text-red-400">42%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Auth Expired</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">18%</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Coding Error</span>
                                            <span className="text-xs font-black text-slate-900 dark:text-white">12%</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recommended Actions</h4>
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-3">
                                        <div className="flex gap-3">
                                            <span className="material-symbols-outlined text-primary text-md mt-0.5">auto_fix_high</span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Update Chemo Protocols</p>
                                                <p className="text-[10px] text-slate-500 leading-snug mt-1">AI suggests creating a new documentation template for drug administration (J9035).</p>
                                            </div>
                                        </div>
                                        <button className="w-full py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/30 hover:bg-blue-600 transition-colors">Deploy New Rule</button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
                                <button onClick={() => setShowHeatmapModal(false)} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold">Close</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
