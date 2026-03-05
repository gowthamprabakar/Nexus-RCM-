import React from 'react';

export function PatientAccessHub() {
    return (
        <div className="flex-1 overflow-y-auto h-full bg-[#f6f6f8] dark:bg-[#101622] p-6 text-slate-900 dark:text-white custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Patient Access Hub
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">Front-office mission control for registration quality.</p>
                    </div>
                    <div className="flex gap-3">
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                            <span className="material-symbols-outlined text-sm">check_circle</span> System Online
                        </span>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-[#111818] p-5 rounded-xl border border-[#3b5454] shadow-sm">
                        <p className="text-xs font-bold uppercase text-[#9db9b9] mb-1">Registration Accuracy</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">99.2%</h3>
                        <p className="text-xs text-emerald-500 font-bold flex items-center mt-1"><span className="material-symbols-outlined text-sm">arrow_upward</span> +0.5% this week</p>
                    </div>
                    <div className="bg-white dark:bg-[#111818] p-5 rounded-xl border border-[#3b5454] shadow-sm">
                        <p className="text-xs font-bold uppercase text-[#9db9b9] mb-1">Verified Patients</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">124</h3>
                        <p className="text-xs text-slate-500 font-bold mt-1">Today's Volume</p>
                    </div>
                    <div className="bg-white dark:bg-[#111818] p-5 rounded-xl border border-[#3b5454] shadow-sm">
                        <p className="text-xs font-bold uppercase text-[#9db9b9] mb-1">Authorization Alerts</p>
                        <h3 className="text-3xl font-black text-rose-500">5</h3>
                        <p className="text-xs text-rose-500 font-bold mt-1">Action Required</p>
                    </div>
                    <div className="bg-white dark:bg-[#111818] p-5 rounded-xl border border-[#3b5454] shadow-sm">
                        <p className="text-xs font-bold uppercase text-[#9db9b9] mb-1">Est. Patient Liability</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">$4.2k</h3>
                        <p className="text-xs text-emerald-500 font-bold mt-1">+$1.1k collected</p>
                    </div>
                </div>

                {/* AI Task List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                    <div className="lg:col-span-2 bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl flex flex-col shadow-sm">
                        <div className="p-6 border-b border-[#3b5454] flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">task</span>
                                AI-Prioritized Worklist
                            </h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg bg-[#283939] text-[#9db9b9] text-xs font-bold hover:text-white">All Tasks</button>
                                <button className="px-3 py-1.5 rounded-lg bg-primary text-[#102222] text-xs font-bold">My Tasks</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {[
                                { patient: "Sarah Jenkins", task: "Obtain Prior Auth", urgency: "High", time: "10:00 AM", score: 98 },
                                { patient: "Michael Ross", task: "Verify Sec. Insurance", urgency: "Medium", time: "10:15 AM", score: 85 },
                                { patient: "David Miller", task: "Review Benefits Limit", urgency: "Low", time: "11:00 AM", score: 60 },
                                { patient: "Linda Chen", task: "Update Demographics", urgency: "Critical", time: "09:30 AM", score: 99 },
                            ].sort((a, b) => b.score - a.score).map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 border-b border-[#3b5454] hover:bg-[#1a2525] transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-white ${item.urgency === 'Critical' ? 'bg-rose-500' : 'bg-slate-700'}`}>
                                            {item.score}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{item.task}</p>
                                            <p className="text-xs text-[#9db9b9]">{item.patient} • Appointment at {item.time}</p>
                                        </div>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-primary text-[#102222] text-xs font-bold rounded-lg transition-all">
                                        Process
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Launch Panel */}
                    <div className="bg-gradient-to-br from-[#101622] to-[#1a2525] border border-[#3b5454] rounded-xl p-6 flex flex-col gap-4 shadow-lg">
                        <h3 className="font-bold text-white mb-2">Quick Actions</h3>

                        <button className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">person_add</span>
                                <span className="text-[10px] font-bold text-[#9db9b9] uppercase tracking-widest">New</span>
                            </div>
                            <p className="font-bold text-white">Register New Patient</p>
                            <p className="text-xs text-[#9db9b9] mt-1">Start intake workflow with ID scan.</p>
                        </button>

                        <button className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="material-symbols-outlined text-emerald-500 text-2xl group-hover:scale-110 transition-transform">payments</span>
                                <span className="text-[10px] font-bold text-[#9db9b9] uppercase tracking-widest">Estimate</span>
                            </div>
                            <p className="font-bold text-white">Create Cost Estimate</p>
                            <p className="text-xs text-[#9db9b9] mt-1">Generate good-faith estimate.</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
