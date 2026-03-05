import React from 'react';

export function AdminDashboard() {
    return (
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 font-sans h-full">
            {/* Page Heading */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                    <span>System Admin</span>
                    <span>/</span>
                    <span className="text-slate-400">Access Control</span>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">System Admin & Access Control</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage role hierarchies, granular permissions, and real-time security status.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                            System Operational
                        </span>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">
                {/* Left: Role Hierarchy (3 cols) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role Hierarchy</h3>
                            <span className="material-symbols-outlined text-slate-400 text-lg cursor-pointer hover:text-primary transition-colors">add_circle</span>
                        </div>
                        <div className="p-3">
                            <ul className="flex flex-col gap-1 text-sm">
                                <li className="p-2 flex items-center gap-2 text-primary font-bold bg-primary/5 rounded-lg border-l-2 border-primary">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                    <span className="material-symbols-outlined text-lg">account_balance</span>
                                    CFO / Executive
                                </li>
                                <li className="p-2 ml-4 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    <span className="material-symbols-outlined text-lg">payments</span>
                                    Billing Manager
                                </li>
                                <li className="p-2 ml-8 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                    Billing Specialist
                                </li>
                                <li className="p-2 ml-4 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <span className="material-symbols-outlined text-lg">expand_more</span>
                                    <span className="material-symbols-outlined text-lg">smart_toy</span>
                                    AI Supervisor
                                </li>
                                <li className="p-2 ml-12 flex items-center gap-2 text-primary bg-primary/5 rounded-lg">
                                    <span className="material-symbols-outlined text-lg">robot_2</span>
                                    AI Agent L1
                                </li>
                                <li className="p-2 ml-4 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    <span className="material-symbols-outlined text-lg">gavel</span>
                                    Claims Auditor
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* User Management Preview */}
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex-1">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Search Users</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-primary">JD</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Jane Doe</p>
                                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">MFA Enabled</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-60">
                                <div className="h-8 w-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-400">RK</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Robert King</p>
                                    <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">MFA Disabled</p>
                                </div>
                            </div>
                            <button className="w-full border border-slate-200 dark:border-slate-700 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">View All 42 Users</button>
                        </div>
                    </div>
                </div>

                {/* Center: Permissions Matrix (6 cols) */}
                <div className="col-span-12 lg:col-span-6">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Granular Permissions Matrix</h3>
                                <p className="text-[10px] text-slate-500 font-medium">Configuring: CFO / Executive Role</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-sm text-slate-500 dark:text-slate-300">filter_alt</span>
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Filter Categories</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white dark:bg-card-dark z-10 border-b border-slate-100 dark:border-slate-800">
                                    <tr className="text-[10px] font-bold text-slate-500 uppercase">
                                        <th className="px-6 py-3">Permission Node</th>
                                        <th className="px-4 py-3">View</th>
                                        <th className="px-4 py-3">Edit</th>
                                        <th className="px-4 py-3">Admin</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {/* PHI Section */}
                                    <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                        <td className="px-6 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest" colSpan="4">Data Privacy (PHI)</td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Patient Identifiable Info</td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">SSN / Insurance Details</td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    {/* Revenue Section */}
                                    <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                        <td className="px-6 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest" colSpan="4">Financial Operations</td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Edit Claims Records</td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Revenue Forecasting</td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    {/* AI Section */}
                                    <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                        <td className="px-6 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest" colSpan="4">AI Engine Control</td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Override AI Suggestions</td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Train Model with Data</td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                    {/* System Section */}
                                    <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                                        <td className="px-6 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest" colSpan="4">System Administration</td>
                                    </tr>
                                    <tr className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="px-6 py-3 font-medium text-xs text-slate-700 dark:text-slate-300">Manage API Keys</td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                        <td className="px-4 py-3"><input defaultChecked className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" type="checkbox" /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Security Health (3 cols) */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                        <h3 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">Security Health</h3>
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative flex items-center justify-center">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle className="text-slate-100 dark:text-slate-800" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                    <circle className="text-primary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="10" strokeWidth="8"></circle>
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">98%</span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Compliant</span>
                                </div>
                            </div>
                            <p className="text-xs font-bold mt-4 text-center text-slate-900 dark:text-white">HIPAA & SOC-2 Status</p>
                            <p className="text-[10px] text-green-600 font-bold mt-1">✓ Full Compliance Verified</p>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Sessions</p>
                                    <span className="text-[10px] font-black text-primary">12 Active</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[70%]"></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Alerts</h4>
                                <div className="flex gap-3 p-2 border-l-2 border-amber-500 bg-amber-50 dark:bg-amber-900/10 rounded-r">
                                    <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white">New IP Login Detected</p>
                                        <p className="text-[9px] text-slate-500">User: RM-104 | 192.168.1.12</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-2 border-l-2 border-green-500 bg-green-50 dark:bg-green-900/10 rounded-r">
                                    <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-900 dark:text-white">MFA Policy Update</p>
                                        <p className="text-[9px] text-slate-500">Applied to 42 users successfully</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Quick Actions</h3>
                        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full text-left">
                            <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">key</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">Reset API Keys</p>
                                <p className="text-[9px] text-slate-500">Rotate all system keys</p>
                            </div>
                        </button>
                        <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full text-left">
                            <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-lg">history</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">View System Logs</p>
                                <p className="text-[9px] text-slate-500">Access full audit trail</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer / Status Bar */}
            <div className="mt-8 flex flex-wrap justify-between items-center px-4 py-3 bg-white dark:bg-card-dark border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm gap-4">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-slate-500">SOC-2 TYPE II: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-primary rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-500">PHI ENCRYPTION: AES-256</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className="text-[10px] font-medium text-slate-400">Last security sync: 2 minutes ago</p>
                    <button className="text-[10px] font-bold text-primary underline hover:text-blue-700">Run Manual Scan</button>
                </div>
            </div>
        </div>
    );
}
