import React from 'react';

export function FeatureImportance() {
    return (
        <div className="flex h-full font-sans bg-[#0a1111] text-slate-100 overflow-hidden">
            {/* Left Sidebar: Feature Interaction Matrix */}
            <aside className="hidden lg:flex w-80 border-r border-[#283939] flex-col bg-[#0a1111] shrink-0 overflow-hidden">
                <div className="p-4 border-b border-[#283939]">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-primary text-lg">grid_view</span>
                        Feature Interaction
                    </h2>
                    <p className="text-[10px] text-[#9db9b9] mt-1 uppercase font-mono">Correlation Matrix (Pearson)</p>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    <div className="relative">
                        <div className="grid grid-cols-6 gap-1 mb-1 ml-12">
                            {['Payer ID', 'ICD-10', 'Amount', 'Age', 'Prov ID', 'Zip'].map((label, i) => (
                                <span key={i} className="text-[8px] text-[#9db9b9] rotate-45 origin-bottom-left whitespace-nowrap">{label}</span>
                            ))}
                        </div>
                        <div className="space-y-1">
                            {[
                                { label: 'Payer ID', cells: [100, 40, 10, 20, 5, 10] },
                                { label: 'ICD-10', cells: [40, 100, 60, 10, 40, 20] },
                                { label: 'Amount', cells: [10, 60, 100, 30, 10, 5] },
                                { label: 'Age', cells: [20, 10, 30, 100, 10, 40] },
                                { label: 'Prov ID', cells: [5, 40, 10, 10, 100, 30] },
                                { label: 'Zip', cells: [10, 20, 5, 40, 30, 100] }
                            ].map((row, i) => (
                                <div key={i} className="flex gap-1 items-center">
                                    <span className="w-12 text-[8px] text-[#9db9b9] text-right truncate">{row.label}</span>
                                    <div className="flex-1 grid grid-cols-6 gap-1">
                                        {row.cells.map((opacity, j) => (
                                            <div key={j} className={`aspect-square bg-primary/${opacity} rounded-sm hover:ring-1 hover:ring-primary transition-all hover:scale-110 hover:z-10`}></div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 space-y-4">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-[#283939] pb-2">Cluster Insights</h3>
                        <div className="bg-[#112020] rounded p-3 border border-[#283939]">
                            <p className="text-[11px] text-slate-300 leading-relaxed italic">"Payer ID and ICD-10 Complexity show high non-linear interaction in denial clusters for region NE-04."</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content: Advanced Feature Importance */}
            <section className="flex-1 flex flex-col overflow-hidden bg-[#0a1111]/50">
                {/* Header */}
                <div className="p-6 border-b border-[#283939] flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">Advanced Feature Importance</h2>
                        <p className="text-[#9db9b9] font-mono text-sm mt-1">SHAP Kernel Explainer // Cohort: All Claims (Q4-2023)</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-[#283939] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">filter_alt</span> Refine Cohort
                        </button>
                        <button className="bg-primary text-[#0a1111] font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/10">
                            <span className="material-symbols-outlined text-sm">download</span> Export SHAP Data
                        </button>
                    </div>
                </div>

                {/* Beeswarm Chart Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="bg-[#112020] border border-[#283939] rounded-xl p-8 relative min-h-[500px]">
                        {/* Legend */}
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                    <span className="text-[10px] font-mono text-[#9db9b9]">Decreases Probability</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#ff0051]"></span>
                                    <span className="text-[10px] font-mono text-[#9db9b9]">Increases Probability</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-mono text-[#9db9b9] uppercase">Feature Value: <span className="text-blue-400">Low</span> <span className="inline-block w-20 h-1.5 bg-gradient-to-r from-blue-400 to-[#ff0051] rounded-full mx-2"></span> <span className="text-[#ff0051]">High</span></div>
                        </div>

                        <div className="space-y-8 relative">
                            {/* Feature Row 1 */}
                            <div className="relative group">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="w-32 text-xs font-mono text-white text-right truncate">Payer ID</span>
                                    <div className="flex-1 relative h-6">
                                        <div className="absolute top-1/2 w-full h-[1px] bg-[#283939]"></div>
                                        {/* SHAP Dots (Simulated) */}
                                        <div className="absolute left-1/2 top-0 h-full flex items-center gap-0.5">
                                            {[60, 80, 100, 70, 90, 100, 40].map((opacity, i) => (
                                                <div key={i} className={`size-2 rounded-full bg-[#ff0051]/${opacity} ${i % 2 === 0 ? '-ml-1' : 'ml-1'}`}></div>
                                            ))}
                                        </div>
                                        <div className="absolute right-1/2 top-0 h-full flex items-center">
                                            {[40, 80, 100].map((opacity, i) => (
                                                <div key={i} className={`size-2 rounded-full bg-blue-500/${opacity} ${i % 2 === 0 ? 'mr-4' : 'mr-2'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Row 2 */}
                            <div className="relative group">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="w-32 text-xs font-mono text-white text-right truncate">ICD-10 Complexity</span>
                                    <div className="flex-1 relative h-6">
                                        <div className="absolute top-1/2 w-full h-[1px] bg-[#283939]"></div>
                                        <div className="absolute left-1/2 top-0 h-full flex items-center">
                                            <div className="size-2 rounded-full bg-[#ff0051] ml-4"></div>
                                            <div className="size-2 rounded-full bg-[#ff0051]/80 ml-8"></div>
                                            <div className="size-2 rounded-full bg-[#ff0051] ml-12"></div>
                                        </div>
                                        <div className="absolute right-1/2 top-0 h-full flex items-center">
                                            <div className="size-2 rounded-full bg-blue-500 ml-6"></div>
                                            <div className="size-2 rounded-full bg-blue-500/60 ml-12"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature Row 3 - Total Claim Amount */}
                            <div className="relative group">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="w-32 text-xs font-mono text-white text-right truncate">Total Claim Amount</span>
                                    <div className="flex-1 relative h-6">
                                        <div className="absolute top-1/2 w-full h-[1px] bg-[#283939]"></div>
                                        <div className="absolute left-1/2 top-0 h-full flex items-center">
                                            <div className="size-2 rounded-full bg-[#ff0051]/60 ml-2"></div>
                                        </div>
                                        <div className="absolute right-1/2 top-0 h-full flex items-center">
                                            <div className="size-2 rounded-full bg-blue-500 ml-4"></div>
                                            <div className="size-2 rounded-full bg-blue-500 ml-8"></div>
                                            <div className="size-2 rounded-full bg-blue-500/80 ml-12"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Line Marker */}
                            <div className="absolute top-0 bottom-0 left-[calc(8rem+1rem+50%)] w-[1px] bg-primary/20 pointer-events-none">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary bg-[#0a1111] px-1">BASE_VALUE</div>
                            </div>
                        </div>
                        <div className="mt-12 flex items-center justify-between pt-6 border-t border-[#283939]">
                            <div className="text-[10px] text-[#9db9b9] max-w-md">
                                The SHAP value summary shows how each feature contributes to the model's prediction. Each dot represents a claim from the dataset.
                            </div>
                            <div className="flex items-center gap-4 text-[11px] font-mono">
                                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-[#9db9b9]">info</span> Convergence: 0.998</div>
                                <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-xs text-[#00ff9d]">check_circle</span> Validated</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Right Sidebar: Top Influencers */}
            <aside className="hidden xl:flex w-80 border-l border-[#283939] flex-col bg-[#0a1111] shrink-0 overflow-hidden">
                <div className="p-6 border-b border-[#283939]">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                        Top Influencers
                    </h3>
                    <p className="text-[10px] text-[#9db9b9] mt-1 font-mono uppercase">AI-Generated Explanations</p>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 shadow-[0_0_15px_rgba(19,236,236,0.15)]">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Rising Dominance</span>
                            <span className="text-[10px] font-mono text-[#9db9b9]">+12.4%</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">ICD-10 Complexity</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Higher weight detected in recent denials. The model is increasingly sensitive to secondary diagnostic codes in neurosurgery claims, likely due to updated payer adjudication logic in Q3.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase bg-white/5 px-2 py-0.5 rounded">Steady Bias</span>
                            <span className="text-[10px] font-mono text-[#9db9b9]">Stable</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">Payer ID (BlueShield)</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Remains the strongest predictor for eligibility-based denials. Feature importance is consistently linked to Payer-specific policy revisions.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 opacity-70">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-[#ff4d4d] uppercase bg-[#ff4d4d]/10 px-2 py-0.5 rounded">Fading Weight</span>
                            <span className="text-[10px] font-mono text-[#ff4d4d]">-5.2%</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">Facility Provider Rating</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Provider reputation is losing predictive power as the model shifts toward clinical documentation integrity (CDI) features for denial probability.
                        </p>
                    </div>
                    <div className="pt-4 mt-4 border-t border-[#283939]">
                        <button className="w-full py-2 bg-[#283939] text-white rounded font-bold text-[10px] uppercase border border-white/5 hover:bg-primary hover:text-[#0a1111] transition-all">
                            Request Deep Analysis
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
