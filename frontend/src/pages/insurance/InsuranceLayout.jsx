import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function InsuranceLayout() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white overflow-hidden">
            {/* Inner Sidebar for Insurance Verification */}
            <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#102222] flex flex-col shrink-0 transition-all duration-300">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-primary">
                        <span className="material-symbols-outlined text-3xl">health_metrics</span>
                        <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">RCM Verify AI</h2>
                    </div>
                    <p className="text-[#616f89] dark:text-slate-400 text-xs mt-1 font-medium">Enterprise AI-Native</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/insurance-verification/overview"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1a2525]"
                        )}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Overview</span>
                    </NavLink>
                    <NavLink
                        to="/insurance-verification/eligibility"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1a2525]"
                        )}
                    >
                        <span className="material-symbols-outlined">verified_user</span>
                        <span className="text-sm font-medium">Eligibility</span>
                    </NavLink>
                    <NavLink
                        to="/insurance-verification/auths"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1a2525]"
                        )}
                    >
                        <span className="material-symbols-outlined">assignment_turned_in</span>
                        <span className="text-sm font-medium">Authorizations</span>
                    </NavLink>
                    <NavLink
                        to="/insurance-verification/benefits"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1a2525]"
                        )}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        <span className="text-sm font-medium">Benefits</span>
                    </NavLink>
                    <NavLink
                        to="/insurance-verification/history"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-[#1a2525]"
                        )}
                    >
                        <span className="material-symbols-outlined">history</span>
                        <span className="text-sm font-medium">History</span>
                    </NavLink>
                </nav>
                <div className="p-4 mt-auto border-t border-gray-200 dark:border-gray-800">
                    <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:brightness-110 transition-all">
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Verify New Patient
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}
