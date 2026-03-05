import React from 'react';

export function VerificationHistory() {
    return (
        <div className="flex-1 overflow-y-auto h-full bg-[#f6f6f8] dark:bg-[#101622] p-6 text-slate-900 dark:text-white custom-scrollbar">
            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            Verification & Coverage History
                        </h1>
                        <p className="text-[#9db9b9] text-sm mt-1">Chronological audit trail of all insurance events.</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#3b5454] bg-slate-50 dark:bg-[#1a2525]">
                        <div className="flex gap-4">
                            <select className="bg-white dark:bg-[#111818] border border-[#3b5454] rounded-lg px-3 py-1.5 text-sm font-bold">
                                <option>All Event Types</option>
                                <option>Eligibility Checks (270/271)</option>
                                <option>Manual Updates</option>
                                <option>Plan Changes</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-[#1a2525] border-b border-[#3b5454]">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-[#9db9b9] uppercase text-xs">Date/Time</th>
                                    <th className="px-6 py-4 font-bold text-[#9db9b9] uppercase text-xs">Event Type</th>
                                    <th className="px-6 py-4 font-bold text-[#9db9b9] uppercase text-xs">User/System</th>
                                    <th className="px-6 py-4 font-bold text-[#9db9b9] uppercase text-xs">Outcome</th>
                                    <th className="px-6 py-4 font-bold text-[#9db9b9] uppercase text-xs text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3b5454]/30">
                                <tr className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium">Oct 24, 09:15 AM</td>
                                    <td className="px-6 py-4 font-bold">Real-time Verification (270)</td>
                                    <td className="px-6 py-4">Sarah Miller</td>
                                    <td className="px-6 py-4"><span className="text-emerald-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> Active</span></td>
                                    <td className="px-6 py-4 text-right"><button className="text-primary font-bold hover:underline">View 271</button></td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium">Jun 12, 02:00 AM</td>
                                    <td className="px-6 py-4 font-bold">Batch Check</td>
                                    <td className="px-6 py-4">System (Auto)</td>
                                    <td className="px-6 py-4"><span className="text-emerald-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span> Active</span></td>
                                    <td className="px-6 py-4 text-right"><button className="text-primary font-bold hover:underline">View 271</button></td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium">Jan 05, 11:30 AM</td>
                                    <td className="px-6 py-4 font-bold">Manual Policy Update</td>
                                    <td className="px-6 py-4">Admin</td>
                                    <td className="px-6 py-4"><span className="text-slate-500 font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">edit</span> Modified</span></td>
                                    <td className="px-6 py-4 text-right"><button className="text-primary font-bold hover:underline">Compare</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
