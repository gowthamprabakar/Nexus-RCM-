import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { AIModelOverview } from './ai/AIModelOverview';

export function AIModelMonitor() {
    const location = useLocation();

    // Check if we are at the root path to render the default overview
    const isRoot = location.pathname === '/developer/ai-monitor' || location.pathname === '/developer/ai-monitor/';

    return (
        <div className="bg-slate-50 dark:bg-[#0a1111] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
            {/* Top Navigation - Implemented by layout Shell */}

            <main className="flex-1 flex overflow-hidden">
                {/* Sidebar Navigation */}
                <aside className="hidden lg:flex w-64 border-r border-slate-200 dark:border-[#283939] flex-col bg-white dark:bg-[#0a1111] shrink-0">
                    <div className="p-4 space-y-2 flex-1">
                        <NavLink
                            to="/developer/ai-monitor"
                            end
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                    : "text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined">dashboard</span>
                            <span className="text-sm">System Overview</span>
                        </NavLink>

                        <NavLink
                            to="/developer/ai-monitor/psi"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                    : "text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined">analytics</span>
                            <span className="text-sm font-medium">PSI Distribution</span>
                        </NavLink>

                        <NavLink
                            to="/developer/ai-monitor/feature-importance"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                    : "text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined">monitoring</span>
                            <span className="text-sm font-medium">Feature Importance</span>
                        </NavLink>

                        <NavLink
                            to="/developer/ai-monitor/registry"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                    : "text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined">history</span>
                            <span className="text-sm font-medium">Model Registry</span>
                        </NavLink>

                        <NavLink
                            to="/developer/ai-monitor/drift-logs"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                                    : "text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <span className="material-symbols-outlined">table_chart</span>
                            <span className="text-sm font-medium">Drift Logs</span>
                        </NavLink>

                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-[#283939]">
                            <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-slate-400 dark:text-[#9db9b9]">Environments</p>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                                <span className="material-symbols-outlined text-xs text-emerald-500">fiber_manual_record</span>
                                <span className="text-sm font-medium">Production</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 dark:text-[#9db9b9] hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer">
                                <span className="material-symbols-outlined text-xs text-primary">radio_button_checked</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Staging-Canary</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Dashboard Content */}
                <section className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-primary/50">
                    {isRoot ? <AIModelOverview /> : <Outlet />}
                </section>
            </main>
        </div>
    );
}
