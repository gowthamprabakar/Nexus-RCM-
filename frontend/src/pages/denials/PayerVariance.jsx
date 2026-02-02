import React from 'react';

export function PayerVariance() {
    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#0b0e14] text-white overflow-hidden custom-scrollbar">
            <main className="p-6 max-w-[1600px] mx-auto space-y-6 w-full overflow-y-auto">
                {/* Breadcrumbs & Heading */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <a className="text-[#9da6b9] hover:text-white" href="#">Analytics</a>
                        <span className="text-[#282e39]">/</span>
                        <span className="text-primary font-medium">Payer Variance Deep-Dive</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                                AI Narrative: Payer Variance Deep-Dive
                                <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded border border-primary/30 uppercase tracking-widest font-bold">AI Native</span>
                            </h1>
                            <p className="text-[#9da6b9] text-base">Root-cause analysis for actual vs. forecasted revenue performance for Q3 2024.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-[#161b26] border border-[#282e39] text-white text-sm font-bold hover:bg-[#282e39] transition-colors">
                                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                                <span>Last 90 Days</span>
                            </button>
                            <button className="flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span>Export Executive Summary</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
                    {/* Left Panel: AI Financial Story */}
                    <aside className="lg:col-span-3 flex flex-col gap-4">
                        <div className="bg-[#161b26] rounded-xl border border-[#282e39] p-5 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                                    <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                    AI Financial Story
                                </h3>
                                <span className="text-xs text-[#9da6b9]">Updated 12m ago</span>
                            </div>
                            <div className="space-y-6 text-white">
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[#9da6b9] uppercase tracking-wider">Primary Deviation</h4>
                                    <p className="text-sm leading-relaxed">
                                        A <span className="text-red-400 font-bold">15.2% drop</span> in BlueCross collections is directly linked to a new <span className="bg-primary/10 text-primary px-1 rounded">prior-authorization policy</span> implemented on July 1st for diagnostic imaging (CPT 7000-series).
                                    </p>
                                </div>
                                <div className="h-px bg-[#282e39]"></div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[#9da6b9] uppercase tracking-wider">Payer Behavior</h4>
                                    <p className="text-sm leading-relaxed">
                                        <span className="text-white font-semibold underline decoration-primary underline-offset-4">Aetna</span> is showing a mean processing delay of <span className="text-orange-300 font-bold">14.5 days</span> beyond the historical baseline, resulting in a <span className="text-orange-300 font-bold">$1.2M shift</span> in realized revenue to next period.
                                    </p>
                                </div>
                                <div className="h-px bg-[#282e39]"></div>
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[#9da6b9] uppercase tracking-wider">Systemic Risk</h4>
                                    <p className="text-sm leading-relaxed">
                                        Denial rates for <span className="text-white font-semibold underline decoration-primary underline-offset-4">Medical Necessity</span> have spiked by 8% across Medicare Advantage plans, accounting for $450k in trapped revenue.
                                    </p>
                                </div>
                                <button className="w-full flex items-center justify-center gap-2 py-3 mt-4 border border-dashed border-[#282e39] text-[#9da6b9] hover:text-white hover:border-white rounded-lg transition-all">
                                    <span className="material-symbols-outlined text-[18px]">share</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">Share Narrative to Slack</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Center Panel: Variance Waterfall */}
                    <section className="lg:col-span-6 flex flex-col gap-4">
                        <div className="bg-[#161b26] rounded-xl border border-[#282e39] p-6 h-full relative overflow-hidden">
                            <div className="flex justify-between items-start mb-10 text-white">
                                <div>
                                    <h3 className="text-lg font-bold">Variance Waterfall</h3>
                                    <p className="text-[#9da6b9] text-xs">Revenue Walk: Forecasted vs. Net Realized</p>
                                </div>
                                <div className="flex gap-4">
                                    {[{ color: 'bg-primary', label: 'Base' }, { color: 'bg-red-500', label: 'Negative' }, { color: 'bg-emerald-500', label: 'Positive' }].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className={`size-2 ${item.color} rounded-full`}></span>
                                            <span className="text-[10px] uppercase font-bold text-[#9da6b9]">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Simplified Waterfall Mockup */}
                            <div className="h-[300px] w-full flex items-end justify-between px-4 rounded-lg pt-10" style={{ backgroundImage: 'linear-gradient(rgba(40, 46, 57, 0.3) 1px, transparent 1px), linear-gradient(90px, rgba(40, 46, 57, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                                <div className="flex flex-col items-center gap-2 w-16 text-white">
                                    <span className="text-xs font-bold">$14.2M</span>
                                    <div className="w-full bg-primary rounded-t-sm shadow-[0_0_20px_rgba(19,91,236,0.3)] h-[220px]"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">FORECASTED</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-16 mb-[180px]">
                                    <span className="text-xs font-bold text-red-400">-$1.2M</span>
                                    <div className="w-full h-[40px] bg-red-500/80 rounded-sm"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">PAYER LAG</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-16 mb-[140px]">
                                    <span className="text-xs font-bold text-red-400">-$0.8M</span>
                                    <div className="w-full h-[30px] bg-red-500/80 rounded-sm"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">DENIALS</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-16 mb-[140px]">
                                    <span className="text-xs font-bold text-emerald-400">+$0.3M</span>
                                    <div className="w-full h-[15px] bg-emerald-500/80 rounded-sm translate-y-[-15px]"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">APPEALS</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-16 mb-[110px]">
                                    <span className="text-xs font-bold text-red-400">-$0.4M</span>
                                    <div className="w-full h-[20px] bg-red-500/80 rounded-sm"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">ADJUSTS.</span>
                                </div>
                                <div className="flex flex-col items-center gap-2 w-16 text-white">
                                    <span className="text-xs font-bold">$12.1M</span>
                                    <div className="w-full bg-primary/80 rounded-t-sm h-[190px]"></div>
                                    <span className="text-[10px] text-[#9da6b9] text-center font-bold">REALIZED</span>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Gross Variance', value: '-14.7%', color: 'text-red-400' },
                                    { label: 'Leakage Risk', value: '$2.1M', color: 'text-orange-300' },
                                    { label: 'Recovery Potential', value: '$1.4M', color: 'text-emerald-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-4 bg-[#0b0e14]/50 rounded-lg border border-[#282e39]">
                                        <p className="text-[10px] font-bold text-[#9da6b9] uppercase tracking-wider">{stat.label}</p>
                                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Right Panel: Actionable Recommendations */}
                    <aside className="lg:col-span-3 flex flex-col gap-4">
                        <div className="bg-[#161b26] rounded-xl border border-[#282e39] p-5 h-full">
                            <div className="flex items-center justify-between mb-6 text-white">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">bolt</span>
                                    Systemic Fixes
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {/* Recommendations */}
                                {[
                                    { level: 'Critical Impact', code: '#BC-09', title: 'Update Pre-Auth Rules', desc: 'Map BlueCross imaging policy change to frontend registration workflow.', action: 'Execute Automation', color: 'primary', border: 'border-primary' },
                                    { level: 'Medium Impact', code: '#AET-42', title: 'Audit Aetna Latency', desc: 'Investigate 835 EDI transmission delays for Northeast region.', action: 'Start Investigation', color: 'orange-400', border: 'border-orange-400' },
                                    { level: 'High Recovery', code: '#GOV-11', title: 'Batch Appeal: Imaging', desc: '458 denials for CPT 70551 ready for bulk clinical appeal submission.', action: 'Submit Batch (458)', color: 'emerald-400', border: 'border-emerald-400' }
                                ].map((rec, i) => (
                                    <div key={i} className={`p-4 rounded-lg bg-[#0b0e14] border-l-4 ${rec.border} hover:bg-[#282e39] transition-colors cursor-pointer group`}>
                                        <div className="flex justify-between mb-2">
                                            <span className={`text-[10px] font-bold text-${rec.color} uppercase`}>{rec.level}</span>
                                            <span className="text-[10px] font-bold text-[#9da6b9]">{rec.code}</span>
                                        </div>
                                        <h5 className="text-sm font-bold mb-1 text-white">{rec.title}</h5>
                                        <p className="text-xs text-[#9da6b9] leading-relaxed mb-3">{rec.desc}</p>
                                        <button className={`w-full py-2 ${i === 0 ? 'bg-primary border-transparent' : 'bg-[#161b26] border border-[#282e39] group-hover:border-white'} text-xs font-bold rounded-md transition-colors text-white`}>{rec.action}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Bottom: Historical Variance Trend Heatmap */}
                    <section className="lg:col-span-12 pb-6">
                        <div className="bg-[#161b26] rounded-xl border border-[#282e39] p-6 text-white">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold">Historical Variance Trend</h3>
                                    <p className="text-[#9da6b9] text-xs">Variance intensity by Payer and Period</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-[#9da6b9]">
                                    <span>LOW VARIANCE</span>
                                    <div className="flex h-3 w-40 rounded-full overflow-hidden border border-[#282e39]">
                                        <div className="w-1/4 bg-emerald-900/40"></div>
                                        <div className="w-1/4 bg-emerald-600/60"></div>
                                        <div className="w-1/4 bg-orange-600/60"></div>
                                        <div className="w-1/4 bg-red-600"></div>
                                    </div>
                                    <span>HIGH VARIANCE</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-4 text-[10px] font-bold text-[#9da6b9] uppercase tracking-wider w-40">Payer Name</th>
                                            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                                                <th key={m} className="py-2 px-1 text-[10px] font-bold text-[#9da6b9] uppercase text-center">{m}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#282e39]/50">
                                        <tr>
                                            <td className="py-3 px-4 text-xs font-bold text-[#9da6b9]">BlueCross BlueShield</td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-emerald-900/40 border border-emerald-900/10"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-emerald-900/40 border border-emerald-900/10"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-emerald-600/30 border border-emerald-600/10"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-orange-600/40 border border-orange-600/10"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-red-600/60 border border-red-600/10"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-red-600 border border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-red-600/80"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-orange-600/50"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-[#282e39]/30"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-[#282e39]/30"></div></td>
                                            <td className="p-1"><div className="h-10 w-full rounded-sm bg-[#282e39]/30"></div></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
