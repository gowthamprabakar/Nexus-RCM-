import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function LidaLayout() {
    return (
        <div className="flex h-full font-sans bg-[#f6f8f8] dark:bg-[#0d1117] text-slate-900 dark:text-white overflow-hidden">
            {/* Inner Sidebar for LIDA Analytics */}
            <aside className="w-64 border-r border-slate-200 dark:border-gray-800 bg-white dark:bg-[#0d1117] flex flex-col shrink-0 transition-all duration-300">
                <div className="p-6 border-b border-slate-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 text-primary">
                        <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                        <h2 className="text-[#111318] dark:text-white text-lg font-bold leading-tight">LIDA AI</h2>
                    </div>
                    <p className="text-[#616f89] dark:text-slate-400 text-xs mt-1 font-medium">Predictive Intelligence</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/lida/dashboard"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22]"
                        )}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                        <span className="text-sm font-medium">Dashboard</span>
                    </NavLink>
                    <NavLink
                        to="/lida/chat"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22]"
                        )}
                    >
                        <span className="material-symbols-outlined">chat_bubble</span>
                        <span className="text-sm font-medium">LIDA Chat</span>
                    </NavLink>
                    <NavLink
                        to="/lida/reports"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22]"
                        )}
                    >
                        <span className="material-symbols-outlined">bar_chart</span>
                        <span className="text-sm font-medium">MECE Reports</span>
                    </NavLink>
                    <NavLink
                        to="/lida/tickets"
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                            isActive
                                ? "bg-primary text-white"
                                : "text-[#616f89] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#161b22]"
                        )}
                    >
                        <span className="material-symbols-outlined">assignment</span>
                        <span className="text-sm font-medium">Ticket Hub</span>
                    </NavLink>
                </nav>
                <div className="p-4 mt-auto border-t border-slate-200 dark:border-gray-800">
                    <button className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm font-bold shadow-sm hover:brightness-110 transition-all">
                        <span className="material-symbols-outlined text-lg">sync</span>
                        Sync Data
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
