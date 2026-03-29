import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function TabNav({ tabs, className }) {
    return (
        <div className={cn("border-b border-slate-200 dark:border-th-border bg-white dark:bg-th-surface-base px-8", className)}>
            <nav className="flex gap-0 -mb-px">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.end}
                        className={({ isActive }) => cn(
                            "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                            isActive
                                ? "border-primary text-primary"
                                : "border-transparent text-th-muted dark:text-th-secondary hover:text-slate-700 dark:hover:text-th-heading hover:border-slate-300 dark:hover:border-th-border-strong"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {tab.icon && <span className="material-symbols-outlined text-lg">{tab.icon}</span>}
                            {tab.label}
                            {tab.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                                    {tab.badge}
                                </span>
                            )}
                        </div>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
