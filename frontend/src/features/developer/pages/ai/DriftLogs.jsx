import React from 'react';

export function DriftLogs() {
    return (
        <div className="flex h-full font-sans bg-[#0a1111] text-slate-100 p-6">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-[#283939] pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">System Audit <span className="text-primary">& Drift Logs</span></h2>
                        <p className="text-[#9db9b9] font-mono text-sm mt-1">Full Traceability of AI Decision Lifecycle</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-[#112020] border border-[#283939] rounded text-xs font-bold uppercase hover:bg-[#1a2e2e] transition-colors text-white">
                            Export CSV
                        </button>
                        <button className="px-3 py-1.5 bg-primary text-[#0a1111] font-bold text-xs rounded uppercase hover:brightness-110 transition-colors">
                            Live Stream
                        </button>
                    </div>
                </div>

                <div className="space-y-4 max-w-4xl">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#9db9b9] flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-sm">history</span> Unified Log Stream
                    </h3>

                    <div className="relative pl-8 space-y-8">
                        <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-[#283939]"></div>

                        {/* Log Item 1 */}
                        <div className="relative group">
                            <div className="absolute -left-[29px] top-0 size-8 rounded-full bg-[#ff4d4d]/20 border border-[#ff4d4d] flex items-center justify-center text-[#ff4d4d] z-10 shadow-[0_0_10px_rgba(255,77,77,0.4)]">
                                <span className="material-symbols-outlined text-sm">warning</span>
                            </div>
                            <div className="bg-[#112020] border border-white/5 p-4 rounded-lg hover:border-[#ff4d4d]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white">Critical Data Drift Detected</span>
                                            <span className="text-[10px] bg-[#ff4d4d]/10 text-[#ff4d4d] px-1.5 py-0.5 rounded border border-[#ff4d4d]/20">SEV-1</span>
                                        </div>
                                        <p className="text-[11px] text-[#9db9b9] font-mono">Model: Revenue_Forecaster_v2.3</p>
                                    </div>
                                    <span className="text-[10px] text-slate-500">2 mins ago</span>
                                </div>
                                <div className="mt-3 bg-[#0a1111] p-3 rounded border border-[#283939] font-mono text-[10px] text-slate-400">
                                    &gt; PSI Score for feature 'Payer_Mix' spiked to 0.42 (Threshold: 0.25)<br />
                                    &gt; Automated Retraining Triggered: JOB_ID_9921
                                </div>
                            </div>
                        </div>

                        {/* Log Item 2 */}
                        <div className="relative group">
                            <div className="absolute -left-[29px] top-0 size-8 rounded-full bg-[#00ff9d]/20 border border-[#00ff9d] flex items-center justify-center text-[#00ff9d] z-10">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </div>
                            <div className="bg-[#112020] border border-white/5 p-4 rounded-lg hover:border-[#00ff9d]/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white">Model Retraining Complete</span>
                                            <span className="text-[10px] bg-[#00ff9d]/10 text-[#00ff9d] px-1.5 py-0.5 rounded border border-[#00ff9d]/20">INFO</span>
                                        </div>
                                        <p className="text-[11px] text-[#9db9b9] font-mono">Model: Denial_Predictor_v2.4.1</p>
                                    </div>
                                    <span className="text-[10px] text-slate-500">2023-10-27 12:15 UTC</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Validation Accuracy: 98.2% (+0.2%). Promoted to Staging automatically.</p>
                            </div>
                        </div>

                        {/* Log Item 3 */}
                        <div className="relative group">
                            <div className="absolute -left-[29px] top-0 size-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary z-10">
                                <span className="material-symbols-outlined text-sm">manage_accounts</span>
                            </div>
                            <div className="bg-[#112020] border border-white/5 p-4 rounded-lg hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-white">Manual Override</span>
                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">AUDIT</span>
                                        </div>
                                        <p className="text-[11px] text-[#9db9b9] font-mono">User: Admin_Ops_01</p>
                                    </div>
                                    <span className="text-[10px] text-slate-500">2023-10-27 10:45 UTC</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Rolled back 'Coding_Agent' to v1.8.2 due to latency spike in US-East-1.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
