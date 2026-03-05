import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
// import { cn } from '@/lib/utils'; // Alias issue
const cn = (...classes) => classes.filter(Boolean).join(' '); // Inline simple utility for now

export function SettingsLayout() {
    return (
        <div className="flex h-full bg-[#f6f8f8] dark:bg-[#0d1117]">
            {/* Settings Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#161b22] border-r border-slate-200 dark:border-gray-800 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">System Settings</h1>
                    <p className="text-xs text-slate-500 mt-1">Global Configuration Hub</p>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">General</div>
                    <NavLink to="/settings/profile" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800")}>
                        <span className="material-symbols-outlined text-[20px]">apartment</span> Practice Profile
                    </NavLink>

                    <div className="mt-6 mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">RCM Logic</div>
                    <NavLink to="/settings/billing-rules" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800")}>
                        <span className="material-symbols-outlined text-[20px]">rule</span> Billing Rules
                    </NavLink>
                    <NavLink to="/settings/compliance" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800")}>
                        <span className="material-symbols-outlined text-[20px]">gavel</span> Compliance & Audit
                    </NavLink>

                    <div className="mt-6 mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Intelligence</div>
                    <NavLink to="/settings/ai-config" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800")}>
                        <span className="material-symbols-outlined text-[20px]">psychology</span> AI Agent & Models
                    </NavLink>

                    <div className="mt-6 mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Security</div>
                    <NavLink to="/settings/users" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-bold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-gray-800")}>
                        <span className="material-symbols-outlined text-[20px]">group</span> User Management
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-gray-800">
                    <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm font-medium">
                        <span className="material-symbols-outlined">help</span> Documentation
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
