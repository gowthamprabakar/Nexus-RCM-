import React from 'react';

export function StateMandates() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-[#111818] dark:text-white selection:bg-primary/30 overflow-auto custom-scrollbar">
            <main className="flex-1 px-4 lg:px-10 py-8 max-w-[1600px] mx-auto w-full">
                {/* Profile/State Header */}
                <div className="flex flex-col mb-8">
                    <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between items-start">
                        <div className="flex gap-6">
                            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-32 w-32 shadow-xl shadow-primary/10 border border-[#3b5454]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8CDEr1TRBqDVCjOwloExIRArmrQshqIFc2rR-Gbb9tznCznfLxu84kRDdL8WNJeZwjA517Sxndq168CjSNAR4HKk1Oqd9Bs_KJdvKq5JcEL6hIWy2TkpDNC2lFl2zHgpmh9tCKvAhwLrCaWLlRo-jfwxTEwFE_41FLD6v2ThmXr5UDydVyieoi9n8Nt3bAPZk0Eb_rk5edQZ8gK1Ebf77kgv7AlyUpADFqvSuNEyomKamTXlBcrCenU-ag_6CqSBo2B91UU13F2Pq")' }}></div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold leading-tight tracking-[-0.015em]">Texas EVV Mandate Drill-Down</h1>
                                    <span className="bg-[#13ecec]/20 text-[#13ecec] px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Active Mandate</span>
                                </div>
                                <p className="text-[#9db9b9] text-base font-normal mt-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">sync</span> Last Sync: Oct 24, 2023 - 08:42 AM
                                </p>
                                <p className="text-[#9db9b9] text-base font-normal">State Medicaid Code: <span className="font-mono">TX-EVV-2024</span></p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 self-end lg:self-center">
                            <button className="flex min-w-[120px] items-center justify-center rounded-lg h-10 px-4 bg-[#283939] text-white text-sm font-bold transition-colors hover:bg-[#3b5454]">
                                State Ombudsman
                            </button>
                            <button className="flex min-w-[120px] items-center justify-center rounded-lg h-10 px-4 bg-[#13ecec] text-[#111818] text-sm font-bold shadow-lg shadow-primary/20">
                                Update Credentials
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b5454] bg-[#1a2e2e]/40">
                        <p className="text-[#9db9b9] text-sm font-medium uppercase tracking-wider">Overall Readiness</p>
                        <div className="flex items-end justify-between">
                            <p className="text-[#13ecec] tracking-tight text-3xl font-bold leading-tight">87.4%</p>
                            <p className="text-[#0bda50] text-sm font-medium flex items-center"><span className="material-symbols-outlined text-sm">trending_up</span>+2.4%</p>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-[#3b5454] rounded-full overflow-hidden">
                            <div className="h-full bg-[#13ecec]" style={{ width: '87.4%' }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b5454] bg-[#1a2e2e]/40">
                        <p className="text-[#9db9b9] text-sm font-medium uppercase tracking-wider">Regional Risk</p>
                        <div className="flex items-end justify-between">
                            <p className="tracking-tight text-3xl font-bold leading-tight">Elevated</p>
                            <span className="material-symbols-outlined text-[#fa5c38]">warning</span>
                        </div>
                        <p className="text-[#9db9b9] text-xs mt-2">14 Counties below 70% threshold</p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b5454] bg-[#1a2e2e]/40">
                        <p className="text-[#9db9b9] text-sm font-medium uppercase tracking-wider">Active MCOs</p>
                        <div className="flex items-end justify-between">
                            <p className="tracking-tight text-3xl font-bold leading-tight">12</p>
                            <span className="material-symbols-outlined text-[#13ecec]">account_balance</span>
                        </div>
                        <p className="text-[#9db9b9] text-xs mt-2">All proprietary API connections live</p>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#3b5454] bg-[#1a2e2e]/40">
                        <p className="text-[#9db9b9] text-sm font-medium uppercase tracking-wider">Daily Submission</p>
                        <div className="flex items-end justify-between">
                            <p className="tracking-tight text-3xl font-bold leading-tight">42.1k</p>
                            <p className="text-[#fa5c38] text-sm font-medium flex items-center"><span className="material-symbols-outlined text-sm">trending_down</span>-1.2%</p>
                        </div>
                        <p className="text-[#9db9b9] text-xs mt-2">Avg. Visits per 24h Window</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Regulatory Compliance Grid */}
                        <div className="bg-[#1a2e2e]/20 border border-[#3b5454] rounded-xl overflow-hidden">
                            <div className="p-6 border-b border-[#3b5454] flex justify-between items-center bg-[#1a2e2e]/40">
                                <h3 className="text-xl font-bold">Regulatory Compliance Grid</h3>
                                <span className="text-xs text-[#9db9b9] font-mono">Phase 3 Revision v2.4</span>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['Aggregator Integration', 'Required Data Elements', 'Transmission Frequency', 'Service Code Mapping'].map((title, i) => (
                                    <div key={i} className="p-4 bg-[#283939]/30 border border-[#3b5454] rounded-lg">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[#13ecec]">hub</span>
                                                <span className="font-bold">{title}</span>
                                            </div>
                                            <span className={`material-symbols-outlined ${i === 1 ? 'text-[#facc15]' : 'text-[#0bda50]'}`}>
                                                {i === 1 ? 'error' : 'check_circle'}
                                            </span>
                                        </div>
                                        <div className="space-y-2 text-xs text-[#9db9b9] italic">
                                            Status details for {title}...
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Regional Risk Heatmap */}
                        <div className="bg-[#1a2e2e]/20 border border-[#3b5454] rounded-xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold">Regional Risk Heatmap</h3>
                                    <p className="text-sm text-[#9db9b9]">County-level drill-down for non-compliance risk</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="bg-[#283939] px-3 py-1 rounded text-xs hover:bg-[#3b5454] text-white">County View</button>
                                    <button className="bg-[#283939] px-3 py-1 rounded text-xs hover:bg-[#3b5454] text-white">MCO View</button>
                                </div>
                            </div>
                            <div className="h-96 w-full rounded-lg bg-[#283939]/20 flex items-center justify-center relative border border-[#3b5454] overflow-hidden">
                                {/* Placeholder Map */}
                                <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-[#13ecec]/10 via-transparent to-[#13ecec]/5"></div>
                                <div className="z-10 text-center flex flex-col items-center">
                                    <p className="text-[#13ecec] font-bold">Interactive Texas Map Visualization</p>
                                    <p className="text-xs text-[#9db9b9]">Harris County: High Risk (62% Readiness)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-8">
                        {/* Payer Specific Rules */}
                        <div className="bg-[#1a2e2e]/20 border border-[#3b5454] rounded-xl flex flex-col h-fit">
                            <div className="p-6 border-b border-[#3b5454]">
                                <h3 className="text-lg font-bold">Payer Specific Rules</h3>
                                <p className="text-xs text-[#9db9b9]">Medicaid MCO Requirements</p>
                            </div>
                            <div className="divide-y divide-[#3b5454]">
                                {[
                                    { name: 'Superior HealthPlan', vendor: 'HHAe', desc: 'Required 24h batching for LTSS services.' },
                                    { name: 'Amerigroup Texas', vendor: 'Sandata', desc: 'Unique Portal credentials required.' },
                                    { name: 'UnitedHealthcare', vendor: 'Proprietary', desc: 'Alert: Recent schema update.' }
                                ].map((payer, i) => (
                                    <div key={i} className="p-4 hover:bg-[#283939]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-bold">{payer.name}</span>
                                            <span className="text-[10px] bg-[#3b5454] px-1.5 py-0.5 rounded text-[#9db9b9]">VENDOR: {payer.vendor}</span>
                                        </div>
                                        <p className="text-xs text-[#9db9b9] leading-relaxed">{payer.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* News & Policy Alerts */}
                        <div className="bg-[#1a2e2e]/20 border border-[#3b5454] rounded-xl flex flex-col h-fit">
                            <div className="p-6 border-b border-[#3b5454] flex justify-between items-center">
                                <h3 className="text-lg font-bold">News & Policy</h3>
                                <span className="material-symbols-outlined text-[#9db9b9] text-lg">rss_feed</span>
                            </div>
                            <div className="p-4 space-y-4">
                                <div className="border-l-2 border-[#13ecec] pl-4 py-1">
                                    <p className="text-xs font-bold mb-1">HHSC Phase 3 Extension</p>
                                    <p className="text-[11px] text-[#9db9b9]">Extended pilot phase until Jan 2024.</p>
                                </div>
                                <div className="border-l-2 border-[#fa5c38] pl-4 py-1">
                                    <p className="text-xs font-bold mb-1">Sandata Aggregator Outage</p>
                                    <p className="text-[11px] text-[#9db9b9]">Latency in Region 4 transmissions.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
