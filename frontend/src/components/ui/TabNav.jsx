import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function TabNav({ tabs, className }) {
    return (
        <div className={cn("border-b border-th-border px-8", className)}>
            <nav className="flex gap-0 -mb-px">
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end={tab.end}
                        className={({ isActive }) => cn(
                            "px-3 py-2 text-[13px] border-b-2 transition-colors whitespace-nowrap",
                            isActive
                                ? "border-th-primary text-th-primary font-semibold"
                                : "border-transparent text-th-secondary hover:text-th-heading"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {tab.icon && <span className="material-symbols-outlined text-lg">{tab.icon}</span>}
                            {tab.label}
                            {tab.badge && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]">
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
