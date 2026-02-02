import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function ClaimsLayout() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white overflow-hidden">
            {/* Inner Sidebar for Claims Management */}
            <aside className="w-64 border-r border-[#283939] hidden xl:flex flex-col justify-between bg-white dark:bg-[#102222] p-4 shrink-0 transition-all duration-300">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col px-2">
                        <h1 className="text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest opacity-50">Queue Management</h1>
                        <p className="text-primary text-sm font-semibold mt-1">Active Scrubbing Phase</p>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <NavLink
                            to="/claims/overview"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-slate-600 dark:text-[#9db9b9] hover:bg-slate-200 dark:hover:bg-[#283939]/50 font-medium"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">dashboard</span>
                            <span className="text-sm">Overview</span>
                        </NavLink>
                        <NavLink
                            to="/claims/work-queue"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-slate-600 dark:text-[#9db9b9] hover:bg-slate-200 dark:hover:bg-[#283939]/50 font-medium"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px] fill-1">inbox</span>
                            <span className="text-sm">Work Queue</span>
                        </NavLink>
                        <NavLink
                            to="/claims/batch"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-slate-600 dark:text-[#9db9b9] hover:bg-slate-200 dark:hover:bg-[#283939]/50 font-medium"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">dynamic_form</span>
                            <span className="text-sm">Batch Actions</span>
                        </NavLink>
                        <NavLink
                            to="/claims/mass-scrub"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-slate-600 dark:text-[#9db9b9] hover:bg-slate-200 dark:hover:bg-[#283939]/50 font-medium"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">cleaning_services</span>
                            <span className="text-sm">Mass Scrub</span>
                        </NavLink>
                        <NavLink
                            to="/claims/rules"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold border border-primary/20"
                                    : "text-slate-600 dark:text-[#9db9b9] hover:bg-slate-200 dark:hover:bg-[#283939]/50 font-medium"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">rule</span>
                            <span className="text-sm">Rule Engine</span>
                        </NavLink>
                    </nav>

                    <div className="pt-6 border-t border-[#283939]">
                        <h3 className="px-3 text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Quick Filters</h3>
                        <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#283939]/30 rounded text-sm text-[#9db9b9]">
                                <input className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary" type="checkbox" />
                                <span>High Risk (&gt; 80%)</span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#283939]/30 rounded text-sm text-[#9db9b9]">
                                <input defaultChecked className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary" type="checkbox" />
                                <span>Payer: Medicare</span>
                            </label>
                            <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-[#283939]/30 rounded text-sm text-[#9db9b9]">
                                <input className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary" type="checkbox" />
                                <span>Value &gt; $5,000</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-auto">
                    <p className="text-xs text-[#9db9b9] mb-2 uppercase font-bold tracking-tighter">Ready for Batch</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1,204 <span className="text-xs font-normal text-primary">Clean Claims</span></p>
                    <button className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 bg-primary text-[#102222] text-sm font-bold transition-transform active:scale-95 hover:brightness-110">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        Submit All Clean
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
