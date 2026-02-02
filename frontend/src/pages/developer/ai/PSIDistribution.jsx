import React from 'react';

export function PSIDistribution() {
    return (
        <div className="flex h-full font-sans bg-[#0a1111] text-slate-100">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <a className="text-primary text-xs flex items-center gap-1 hover:underline" href="#">
                                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Overview
                            </a>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight text-uppercase">PSI Distribution Analysis</h2>
                        <p className="text-[#9db9b9] font-mono text-sm mt-1 uppercase tracking-wider">Metric: Population Stability Index // Target: Denial_Predictor_v4</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-[#112020] border border-[#283939] rounded px-4 py-2">
                            <p className="text-[10px] text-[#9db9b9] uppercase font-bold">Current System PSI</p>
                            <p className="text-xl font-mono text-primary font-bold">0.142 <span className="text-xs font-normal text-slate-500">(STABLE)</span></p>
                        </div>
                        <button className="bg-primary/10 border border-primary/20 text-primary font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">filter_alt</span> Refine Filters
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PSI Bar Chart Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#112020] border border-[#283939] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Cohort PSI Score Distribution</h3>
                                    <p className="text-sm text-[#9db9b9]">Frequency of PSI scores across 1,200 sub-segments</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-mono">
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-sm"></span> Stable (&lt;0.1)</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-yellow-500 rounded-sm"></span> Warning (0.1-0.2)</div>
                                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-[#ff4d4d] rounded-sm"></span> High Drift (&gt;0.2)</div>
                                </div>
                            </div>
                            {/* Bar Chart Visualization */}
                            <div className="h-64 flex items-end gap-1 px-2 border-l border-b border-[#283939]">
                                {[
                                    { h: '20%', c: 'bg-primary/20 hover:bg-primary' },
                                    { h: '45%', c: 'bg-primary/20 hover:bg-primary' },
                                    { h: '70%', c: 'bg-primary/20 hover:bg-primary' },
                                    { h: '90%', c: 'bg-primary/20 hover:bg-primary' },
                                    { h: '100%', c: 'bg-primary hover:bg-primary shadow-[0_0_15px_rgba(19,236,236,0.5)]' },
                                    { h: '65%', c: 'bg-yellow-500/40 hover:bg-yellow-500' },
                                    { h: '40%', c: 'bg-yellow-500/40 hover:bg-yellow-500' },
                                    { h: '25%', c: 'bg-yellow-500/40 hover:bg-yellow-500' },
                                    { h: '15%', c: 'bg-yellow-500/40 hover:bg-yellow-500' },
                                    { h: '10%', c: 'bg-yellow-500/40 hover:bg-yellow-500' },
                                    { h: '15%', c: 'bg-[#ff4d4d]/40 hover:bg-[#ff4d4d]' },
                                    { h: '8%', c: 'bg-[#ff4d4d]/40 hover:bg-[#ff4d4d]' },
                                    { h: '5%', c: 'bg-[#ff4d4d]/40 hover:bg-[#ff4d4d]' },
                                    { h: '3%', c: 'bg-[#ff4d4d]/40 hover:bg-[#ff4d4d]' },
                                ].map((bar, i) => (
                                    <div key={i} className={`flex-1 transition-all ${bar.c}`} style={{ height: bar.h }}></div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-[#9db9b9] font-mono">
                                <span>0.00 PSI</span>
                                <span>0.10 PSI</span>
                                <span>0.20 PSI</span>
                                <span>0.30+ PSI</span>
                            </div>
                        </div>

                        {/* Heatmap */}
                        <div className="bg-[#112020] border border-[#283939] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-white">PSI Drift Heatmap by Feature Category</h3>
                                    <p className="text-sm text-[#9db9b9]">Temporal analysis of drift across logical feature groups</p>
                                </div>
                                <button className="text-primary text-[10px] font-bold border border-primary/20 px-2 py-1 rounded hover:bg-primary/10 transition-colors">EXPORT CSV</button>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] gap-4">
                                <div className="flex flex-col justify-between py-2 text-[10px] font-bold text-[#9db9b9] uppercase space-y-6">
                                    <span>Demographics</span>
                                    <span>Clinical Codes</span>
                                    <span>Payer Data</span>
                                    <span>Facility Info</span>
                                    <span>Historical Claims</span>
                                </div>
                                <div className="space-y-2">
                                    {/* Row 1 - Demographics */}
                                    <div className="grid grid-cols-12 gap-1 h-8">
                                        {[10, 20, 10, 10, 40, 30, 20, 10, 20, 10, 40, 30].map((opacity, i) => (
                                            <div key={i} className={`rounded-sm bg-primary/${opacity} hover:opacity-100 transition-opacity`}></div>
                                        ))}
                                    </div>
                                    {/* Row 2 - Clinical Codes */}
                                    <div className="grid grid-cols-12 gap-1 h-8">
                                        <div className="bg-primary/40 rounded-sm"></div>
                                        <div className="bg-primary/60 rounded-sm"></div>
                                        <div className="bg-yellow-500/50 rounded-sm"></div>
                                        <div className="bg-yellow-500/80 rounded-sm"></div>
                                        <div className="bg-[#ff4d4d]/60 rounded-sm"></div>
                                        <div className="bg-[#ff4d4d]/80 rounded-sm"></div>
                                        <div className="bg-[#ff4d4d] rounded-sm"></div>
                                        <div className="bg-[#ff4d4d]/90 rounded-sm"></div>
                                        <div className="bg-[#ff4d4d]/70 rounded-sm"></div>
                                        <div className="bg-yellow-500/90 rounded-sm"></div>
                                        <div className="bg-yellow-500/60 rounded-sm"></div>
                                        <div className="bg-primary/60 rounded-sm"></div>
                                    </div>
                                    {/* Row 3 - Payer Data */}
                                    <div className="grid grid-cols-12 gap-1 h-8">
                                        {[20, 10, 10, 20, 20, 30, 10, 10, 20, 20, 30, 40].map((opacity, i) => (
                                            <div key={i} className={`rounded-sm bg-primary/${opacity}`}></div>
                                        ))}
                                    </div>
                                    {/* Row 4 - Facility Info */}
                                    <div className="grid grid-cols-12 gap-1 h-8">
                                        {[30, 40, 50, 30, 20, 10, 10, 20, 20, 30, 20, 10].map((opacity, i) => (
                                            <div key={i} className={`rounded-sm bg-primary/${opacity}`}></div>
                                        ))}
                                    </div>
                                    {/* Row 5 - Historical Claims */}
                                    <div className="grid grid-cols-12 gap-1 h-8">
                                        <div className="bg-primary/10 rounded-sm"></div>
                                        <div className="bg-primary/10 rounded-sm"></div>
                                        <div className="bg-primary/10 rounded-sm"></div>
                                        <div className="bg-primary/20 rounded-sm"></div>
                                        <div className="bg-primary/30 rounded-sm"></div>
                                        <div className="bg-primary/40 rounded-sm"></div>
                                        <div className="bg-primary/50 rounded-sm"></div>
                                        <div className="bg-yellow-500/40 rounded-sm"></div>
                                        <div className="bg-yellow-500/60 rounded-sm"></div>
                                        <div className="bg-yellow-500/80 rounded-sm"></div>
                                        <div className="bg-yellow-500/90 rounded-sm"></div>
                                        <div className="bg-[#ff4d4d]/50 rounded-sm"></div>
                                    </div>
                                    <div className="grid grid-cols-12 gap-1 text-[9px] font-mono text-[#9db9b9] pt-1">
                                        <span className="text-center">W1</span><span className="text-center">W2</span><span className="text-center">W3</span><span className="text-center">W4</span>
                                        <span className="text-center">W5</span><span className="text-center">W6</span><span className="text-center">W7</span><span className="text-center">W8</span>
                                        <span className="text-center">W9</span><span className="text-center">W10</span><span className="text-center">W11</span><span className="text-center">W12</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Analysis */}
                    <div className="space-y-6">
                        <div className="bg-[#112020] border border-[#ff4d4d]/30 rounded-xl p-6 shadow-[0_0_15px_rgba(19,236,236,0.15)] flex flex-col h-full">
                            <div className="mb-6">
                                <span className="bg-[#ff4d4d]/10 text-[#ff4d4d] text-[10px] font-bold px-2 py-1 rounded border border-[#ff4d4d]/20 mb-2 inline-block">MOST UNSTABLE FEATURE</span>
                                <h3 className="text-lg font-bold text-white">ICD-10_Complexity_Index</h3>
                                <p className="text-xs text-[#9db9b9] mt-1">PSI Value: <span className="text-[#ff4d4d] font-mono font-bold">0.284</span></p>
                            </div>
                            <div className="flex-1 space-y-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] text-[#9db9b9] uppercase font-bold tracking-widest">Training vs. Production</span>
                                        <div className="flex gap-2">
                                            <span className="w-3 h-3 bg-white/20 rounded-full border border-white/40"></span>
                                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                                        </div>
                                    </div>
                                    <div className="relative h-48 border-l border-b border-[#283939] px-2 flex items-end justify-between overflow-hidden">
                                        {/* Chart Placeholder */}
                                        <svg className="absolute inset-0 w-full h-full px-2" preserveAspectRatio="none" viewBox="0 0 300 150">
                                            <path d="M0 150 Q 75 120, 150 20 T 300 150" fill="none" stroke="rgba(255,255,255,0.2)" strokeDasharray="4" strokeWidth="2"></path>
                                            <path className="drop-shadow-[0_0_5px_cyan]" d="M0 150 Q 150 140, 225 30 T 300 150" fill="none" stroke="#13ecec" strokeWidth="3"></path>
                                            <path d="M0 150 Q 150 140, 225 30 T 300 150 L 300 150 L 0 150 Z" fill="rgba(19, 236, 236, 0.05)"></path>
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ff4d4d]/90 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest -rotate-12">Mean Shift: +1.2σ</div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[9px] font-mono text-slate-500">
                                        <span>Low Complexity</span>
                                        <span>Med</span>
                                        <span>High Complexity</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                                    <h4 className="text-[10px] text-white font-bold uppercase tracking-widest border-b border-white/10 pb-2">Analysis Insight</h4>
                                    <p className="text-xs text-[#9db9b9] leading-relaxed">
                                        Significant right-ward shift detected in clinical complexity values compared to training set (v2.4). This drift correlates with the recent expansion into <span className="text-white font-mono">Territory_West_04</span>.
                                    </p>
                                    <button className="w-full py-2 bg-primary text-[#0a1111] text-xs font-bold rounded hover:opacity-90 transition-opacity uppercase tracking-tighter">
                                        Trigger Retraining with Latest Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
