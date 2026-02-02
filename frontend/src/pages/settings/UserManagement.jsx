import React from 'react';

export function UserManagement() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">User Access & Role Management</h1>
                    <p className="text-slate-500 mt-2">Control organizational access, define granular RBAC policies, and monitor security.</p>
                </div>
                <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all">
                    <span className="material-symbols-outlined text-sm">person_add</span> Add User
                </button>
            </header>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: Role Hierarchy (3 cols) */}
                <div className="col-span-3 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#0d1117]">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Role Hierarchy</h3>
                        </div>
                        <ul className="p-2 space-y-1">
                            <li className="p-2 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center gap-2 cursor-pointer">
                                <span className="material-symbols-outlined text-lg">admin_panel_settings</span> Super Admin
                            </li>
                            <li className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">account_balance</span> Finance Exec
                            </li>
                            <li className="p-2 ml-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">supervisor_account</span> Billing Manager
                            </li>
                            <li className="p-2 ml-8 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">person</span> Billing Specialist
                            </li>
                        </ul>
                        <div className="p-3 border-t border-slate-200 dark:border-gray-800">
                            <button className="w-full py-2 border border-dashed border-slate-300 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-500 hover:text-primary transition-colors">
                                + Create Custom Role
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden flex-1">
                        <div className="p-4 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-[#0d1117] flex items-center justify-between">
                            <h3 className="text-sm font-bold dark:text-white">Security Audit Log</h3>
                            <span className="size-2 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                        <div className="p-4 space-y-4">
                            {[
                                { time: "09:15:33", msg: "Security Policy updated", user: "Admin" },
                                { time: "09:12:10", msg: "User J.Doe added to Group 'Finance'", user: "Admin" },
                                { time: "08:45:00", msg: "Failed login attempt (IP: 192.168.1.1)", user: "System" },
                            ].map((log, i) => (
                                <div key={i} className="flex gap-3 text-xs">
                                    <span className="font-mono text-slate-400 shrink-0">{log.time}</span>
                                    <p className="text-slate-600 dark:text-slate-300 leading-tight">
                                        <span className="font-bold text-slate-900 dark:text-white">{log.msg}</span>
                                        <br /><span className="text-[10px] text-slate-400">by {log.user}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: User Table (9 cols) */}
                <div className="col-span-9 space-y-6">
                    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px]">
                        {/* Table Controls */}
                        <div className="p-4 border-b border-slate-200 dark:border-gray-800 flex justify-between items-center">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-sm">search</span>
                                <input type="text" placeholder="Search 42 users..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-gray-700 rounded-lg text-sm w-64" />
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">Filter</button>
                                <button className="px-3 py-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">Export CSV</button>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-gray-800 text-slate-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">2FA Status</th>
                                    <th className="px-6 py-4">Last Active</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-800">
                                {[
                                    { name: "Alice Miller", email: "alice.m@rcm.ai", role: "Super Admin", ava: "AM", color: "bg-purple-100 text-purple-700" },
                                    { name: "David Chen", email: "d.chen@rcm.ai", role: "Billing Manager", ava: "DC", color: "bg-blue-100 text-blue-700" },
                                    { name: "Sarah Jenkins", email: "s.jenkins@rcm.ai", role: "Billing Specialist", ava: "SJ", color: "bg-emerald-100 text-emerald-700" },
                                ].map((user, i) => (
                                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-9 rounded-full ${user.color} flex items-center justify-center font-bold text-xs`}>{user.ava}</div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-widest">Enabled</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">2 mins ago</td>
                                        <td className="px-6 py-4">
                                            <button className="text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">more_horiz</span></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Granular Permissions Matrix</h3>
                                <p className="text-[10px] text-slate-500">Configuring: Super Admin</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-gray-800">
                                        <th className="text-left py-2 font-bold text-slate-500">Module Access</th>
                                        <th className="text-center py-2 font-bold text-slate-500">View</th>
                                        <th className="text-center py-2 font-bold text-slate-500">Edit</th>
                                        <th className="text-center py-2 font-bold text-slate-500">Delete</th>
                                        <th className="text-center py-2 font-bold text-slate-500">Export</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-gray-900">
                                    {['Billing Rules', 'User Management', 'Financial Reports', 'Patient Data'].map((row, i) => (
                                        <tr key={i}>
                                            <td className="py-3 font-medium dark:text-slate-300">{row}</td>
                                            <td className="text-center"><input type="checkbox" checked className="rounded text-primary focus:ring-primary" /></td>
                                            <td className="text-center"><input type="checkbox" checked className="rounded text-primary focus:ring-primary" /></td>
                                            <td className="text-center"><input type="checkbox" checked={i < 2} className="rounded text-primary focus:ring-primary" /></td>
                                            <td className="text-center"><input type="checkbox" checked className="rounded text-primary focus:ring-primary" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
