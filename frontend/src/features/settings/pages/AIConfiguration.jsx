import React, { useState } from 'react';

export function AIConfiguration() {
    const [confidence, setConfidence] = useState({
        coding: 95,
        eligibility: 90
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">AI Agent & Model Configuration</h1>
                    <p className="text-slate-500 mt-2">Fine-tune your AI ecosystem, adjust confidence thresholds, and monitor performance.</p>
                </div>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                    <input type="text" placeholder="Search parameters..." className="pl-10 pr-4 py-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-800 rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary" />
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">System Latency (P95)</span>
                        <span className="material-symbols-outlined text-emerald-500">bolt</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">42ms</span>
                        <span className="text-xs font-bold text-emerald-500">-12% vs last week</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Active Agents</span>
                        <span className="material-symbols-outlined text-purple-500">smart_toy</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">12</span>
                        <span className="text-xs font-bold text-slate-500">Deployed</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#161b22] p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase">Model Drift</span>
                        <span className="material-symbols-outlined text-blue-500">query_stats</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">0.02</span>
                        <span className="text-xs font-bold text-emerald-500">Stable</span>
                    </div>
                </div>
            </div>

            {/* Configuration Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Agent Thresholds */}
                <div className="lg:col-span-2 bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="font-bold text-lg dark:text-white">Autonomous Decision Thresholds</h3>
                        <button className="text-xs font-bold text-primary">Reset Defaults</button>
                    </div>
                    <div className="p-6 space-y-8">
                        {/* Coding Agent */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500 bg-purple-100 dark:bg-purple-900/20 p-1.5 rounded-lg">code</span>
                                    <span className="font-bold text-sm dark:text-white">Medical Coding Agent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Set Point</span>
                                    <select className="text-xs border-slate-200 dark:border-gray-700 rounded bg-slate-50 dark:bg-[#0d1117] font-bold py-1 px-2">
                                        <option>High Precision</option>
                                        <option>Balanced</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative py-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={confidence.coding}
                                    onChange={(e) => setConfidence({ ...confidence, coding: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                                    <span>Manual Review (0-70%)</span>
                                    <span>Augmented (71-90%)</span>
                                    <span>Autonomous (91%+)</span>
                                </div>
                                <div className="absolute top-0 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow-sm" style={{ left: `${confidence.coding}%` }}>
                                    {confidence.coding}%
                                </div>
                            </div>
                            <p className="text-xs text-slate-500">Codes with confidence below {confidence.coding}% will currently satisfy <strong className="text-slate-700 dark:text-slate-300">Human-Loop Review</strong>.</p>
                        </div>

                        <hr className="border-slate-100 dark:border-gray-800" />

                        {/* Eligibility Agent */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500 bg-emerald-100 dark:bg-emerald-900/20 p-1.5 rounded-lg">verified_user</span>
                                    <span className="font-bold text-sm dark:text-white">Eligibility Verification Agent</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Set Point</span>
                                    <select className="text-xs border-slate-200 dark:border-gray-700 rounded bg-slate-50 dark:bg-[#0d1117] font-bold py-1 px-2">
                                        <option>Standard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative py-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={confidence.eligibility}
                                    onChange={(e) => setConfidence({ ...confidence, eligibility: parseInt(e.target.value) })}
                                    className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                                <div className="absolute top-0 transform -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm" style={{ left: `${confidence.eligibility}%` }}>
                                    {confidence.eligibility}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Health */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 p-6">
                        <h3 className="font-bold text-sm dark:text-white mb-4">Model Versioning</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">GPT-4o (Clinical)</p>
                                    <p className="text-xs text-emerald-500 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">check_circle</span> Active</p>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">v2.1.0</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Llama 3 (Parsing)</p>
                                    <p className="text-xs text-slate-500">Standby</p>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">v0.9.beta</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 py-2 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                            Deploy New Model
                        </button>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <span className="material-symbols-outlined">lightbulb</span>
                            <h4 className="font-bold text-sm">Optimization Tip</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Increasing the Medical Coding threshold to 97% could reduce audit time by 2.5 hours/week based on your current volume.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
