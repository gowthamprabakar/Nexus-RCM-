import React from 'react';

export function AIModelOverview() {
    return (
        <div className="space-y-6">
            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Performance & Model Drift</h2>
                    <p className="text-slate-500 dark:text-[#9db9b9] font-mono text-sm mt-1">Telemetry Live: 2023-10-27T14:42:01Z // Cluster: us-east-1-rcm-04</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] rounded px-3 py-1 flex items-center gap-2 shadow-sm">
                        <span className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase font-bold">Refresh Rate:</span>
                        <span className="text-xs font-mono text-primary font-bold">5s</span>
                    </div>
                    <button className="bg-primary text-[#0a1111] font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
                        <span className="material-symbols-outlined text-sm">autorenew</span> Retrain All
                    </button>
                </div>
            </div>

            {/* Model Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow dark:shadow-primary/5">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-[#9db9b9] font-bold uppercase tracking-widest">Model Alpha</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Denial Predictor</h3>
                        </div>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded">HEALTHY</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Drift Score</p>
                            <p className="text-3xl font-mono font-bold text-primary">0.12</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Latency</p>
                            <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">45<span className="text-sm font-normal text-slate-400 dark:text-[#9db9b9]">ms</span></p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                        <div className="flex-1 h-8 bg-slate-100 dark:bg-[#1a2e2e] rounded relative overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                <path d="M0 20 L10 18 L20 22 L30 15 L40 18 L50 12 L60 20 L70 15 L80 18 L90 10 L100 15" fill="none" stroke="#13ecec" strokeWidth="1.5"></path>
                            </svg>
                        </div>
                        <span className="text-[10px] font-mono text-primary">+0.02%</span>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-[#9db9b9] font-bold uppercase tracking-widest">Model Beta</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Coding Agent</h3>
                        </div>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded">STABLE</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Drift Score</p>
                            <p className="text-3xl font-mono font-bold text-primary">0.05</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Latency</p>
                            <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">120<span className="text-sm font-normal text-slate-400 dark:text-[#9db9b9]">ms</span></p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                        <div className="flex-1 h-8 bg-slate-100 dark:bg-[#1a2e2e] rounded relative overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                <path d="M0 15 L20 16 L40 14 L60 15 L80 14 L100 15" fill="none" stroke="#13ecec" strokeWidth="1.5"></path>
                            </svg>
                        </div>
                        <span className="text-[10px] font-mono text-primary">-0.01%</span>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white dark:bg-[#112020] border border-red-500/50 p-5 rounded-xl shadow-[0_0_15px_rgba(255,77,77,0.1)] dark:shadow-[0_0_15px_rgba(255,77,77,0.3)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[11px] text-slate-500 dark:text-[#9db9b9] font-bold uppercase tracking-widest">Model Gamma</p>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Forecaster</h3>
                        </div>
                        <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded">CRITICAL DRIFT</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Drift Score</p>
                            <p className="text-3xl font-mono font-bold text-red-500">0.28</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Latency</p>
                            <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">80<span className="text-sm font-normal text-slate-400 dark:text-[#9db9b9]">ms</span></p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                        <div className="flex-1 h-8 bg-red-50 dark:bg-red-500/5 rounded relative overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
                                <path d="M0 25 L20 20 L40 28 L60 15 L80 5 L100 2" fill="none" stroke="#ff4d4d" strokeWidth="1.5"></path>
                            </svg>
                        </div>
                        <span className="text-[10px] font-mono text-red-500">+12.4%</span>
                    </div>
                </div>
            </div>

            {/* Main Visualizations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PSI Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Population Stability Index (PSI)</h3>
                                <p className="text-sm text-slate-500 dark:text-[#9db9b9]">Aggregated feature drift across all production cohorts</p>
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-mono">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-full"></span> PSI Value</div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 border-t-2 border-dashed border-red-500"></span> Alert Threshold (0.2)</div>
                            </div>
                        </div>
                        <div className="relative h-64 w-full bg-slate-50 dark:bg-[#0a1111]/50 rounded-lg p-4 border border-slate-100 dark:border-[#283939]">
                            {/* Chart Placeholder / SVG */}
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                                <defs>
                                    <linearGradient id="psiGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                                        <stop offset="0%" stopColor="#13ecec" stopOpacity="0.2"></stop>
                                        <stop offset="100%" stopColor="#13ecec" stopOpacity="0"></stop>
                                    </linearGradient>
                                </defs>
                                <line stroke="#ff4d4d" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="60" y2="60"></line>
                                <path d="M0 160 Q 50 150, 100 170 T 200 140 T 300 165 T 400 130 T 500 145 T 600 70 T 700 50 T 800 45" fill="none" stroke="#13ecec" strokeWidth="2.5"></path>
                                <path d="M0 160 Q 50 150, 100 170 T 200 140 T 300 165 T 400 130 T 500 145 T 600 70 T 700 50 T 800 45 L 800 200 L 0 200 Z" fill="url(#psiGradient)"></path>
                                <circle className="animate-ping" cx="700" cy="50" fill="#ff4d4d" r="4"></circle>
                                <circle cx="700" cy="50" fill="#ff4d4d" r="3"></circle>
                            </svg>
                            <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between text-[10px] text-slate-400 dark:text-[#9db9b9] font-mono py-4">
                                <span>0.40</span><span>0.30</span><span className="text-red-500 font-bold">0.20</span><span>0.10</span><span>0.00</span>
                            </div>
                        </div>
                        <div className="flex justify-between mt-4 text-[10px] text-slate-400 dark:text-[#9db9b9] font-mono px-6">
                            <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>NOW</span>
                        </div>
                    </div>

                    {/* Accuracy vs Ground Truth */}
                    <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Accuracy vs. Ground Truth</h3>
                            <div className="flex gap-4 text-[11px] font-mono">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary"></span> Predicted Score</div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-slate-400 dark:bg-white"></span> Actual Outcome</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-3 h-48 relative bg-slate-50 dark:bg-[#0a1111]/50 rounded-lg p-2 border border-slate-100 dark:border-[#283939]">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 150">
                                    <path d="M0 30 L50 35 L100 25 L150 40 L200 38 L250 45 L300 55 L350 70 L400 75 L450 80 L500 85 L600 90" fill="none" stroke="#13ecec" strokeWidth="2"></path>
                                    <path d="M0 35 L50 32 L100 28 L150 38 L200 42 L250 50 L300 65 L350 85 L400 95 L450 110 L500 120 L600 135" fill="none" stroke="currentColor" className="text-slate-400 dark:text-white" strokeOpacity="0.6" strokeWidth="2"></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-[1px] h-full bg-red-500/20 ml-[30%] relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded uppercase font-bold">Divergence Detected</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center border-l border-slate-200 dark:border-[#283939] pl-6 space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">RMSE Delta</p>
                                    <p className="text-xl font-mono font-bold text-red-500">+0.142</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] uppercase">Confidence</p>
                                    <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">82.4%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Retraining Queue */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] rounded-xl flex flex-col h-full min-h-[500px] shadow-sm">
                        <div className="p-6 border-b border-slate-200 dark:border-[#283939]">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">dynamic_feed</span>
                                Retraining Queue
                            </h3>
                        </div>
                        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            {/* Job 1 */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-primary">MODEL ALPHA V2.4</span>
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#9db9b9]">88%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-[#1a2e2e] rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-primary" style={{ width: '88%' }}></div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#9db9b9]">
                                    <span className="material-symbols-outlined text-sm text-primary">sync</span>
                                    Validating Feature Weights...
                                </div>
                            </div>
                            {/* Job 2 */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4 opacity-70">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">Denial Predictor v1.9</span>
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#9db9b9]">WAITING</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-[#1a2e2e] rounded-full overflow-hidden mb-3">
                                    <div className="h-full bg-slate-700" style={{ width: '0%' }}></div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#9db9b9]">
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    Scheduled for 02:00 UTC
                                </div>
                            </div>
                            {/* Job 3 */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-4 opacity-70">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">Revenue Forecaster Patch</span>
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#9db9b9]">QUEUED</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-[#9db9b9] mt-4">
                                    <span className="material-symbols-outlined text-sm">priority_high</span>
                                    Manual review required
                                </div>
                                <button className="mt-3 w-full py-1.5 bg-slate-200 dark:bg-white/10 rounded text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white">REVIEW DATASET</button>
                            </div>
                        </div>
                        <div className="p-4 bg-primary/5 border-t border-slate-200 dark:border-[#283939]">
                            <p className="text-[10px] text-slate-500 dark:text-[#9db9b9] text-center mb-3">Worker Nodes Active: 14/16</p>
                            <button className="w-full py-2 bg-[#283939] text-white rounded font-bold text-sm border border-white/5 hover:border-primary/50 transition-all">MANAGE PIPELINES</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-white dark:bg-[#112020] border border-slate-200 dark:border-[#283939] rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Current Feature Importance</h3>
                        <p className="text-sm text-slate-500 dark:text-[#9db9b9]">Top drivers influencing model decisions in last 24h</p>
                    </div>
                    <select className="bg-slate-100 dark:bg-[#1a2e2e] border-none text-[11px] font-bold text-slate-900 dark:text-white rounded cursor-pointer ring-1 ring-slate-200 dark:ring-white/10 focus:ring-primary px-3 py-1">
                        <option>All Models</option>
                        <option>Denial Predictor</option>
                        <option>Coding Agent</option>
                    </select>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-900 dark:text-white">Payer ID (Eligibility)</span>
                            <span className="text-primary font-bold">0.342</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-[#1a2e2e] rounded-sm overflow-hidden">
                            <div className="h-full bg-primary shadow-[0_0_10px_rgba(19,236,236,0.3)]" style={{ width: '82%' }}></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-900 dark:text-white">Total Claim Amount</span>
                            <span className="text-primary font-bold">0.211</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-[#1a2e2e] rounded-sm overflow-hidden">
                            <div className="h-full bg-primary/80" style={{ width: '64%' }}></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-900 dark:text-white">ICD-10 Code Complexity</span>
                            <span className="text-primary font-bold">0.188</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-[#1a2e2e] rounded-sm overflow-hidden">
                            <div className="h-full bg-primary/60" style={{ width: '52%' }}></div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-900 dark:text-white">Facility Provider Rating</span>
                            <span className="text-primary font-bold">0.094</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 dark:bg-[#1a2e2e] rounded-sm overflow-hidden">
                            <div className="h-full bg-primary/40" style={{ width: '28%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
