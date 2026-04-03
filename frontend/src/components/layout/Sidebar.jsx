import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Reusable Link Item — left-border accent style (Atlassian pattern)
const SidebarLink = ({ to, icon, label, badge, isNew }) => {
    return (
        <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
                "flex items-center justify-between px-4 py-1.5 transition-colors text-[13px] group border-l-2",
                isActive
                    ? "border-th-primary text-th-primary bg-th-surface-highlight/50 font-semibold"
                    : "border-transparent text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50"
            )}
        >
            <div className="flex items-center gap-2.5">
                {icon && (
                    <span className="material-symbols-outlined text-[18px] opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
                )}
                <span>{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
                {isNew && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-th-primary/10 text-th-primary font-bold uppercase">New</span>
                )}
                {badge && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-th-danger/10 text-th-danger">{badge}</span>
                )}
            </div>
        </NavLink>
    );
};

// Section Divider
const SectionHeader = ({ label }) => (
    <p className="text-[10px] font-bold uppercase tracking-wider text-th-muted px-4 pt-5 pb-1">{label}</p>
);

export function Sidebar() {
    return (
        <aside className="w-60 bg-th-surface-sidebar border-r border-th-border flex flex-col h-screen shrink-0 font-sans z-20 transition-colors duration-200">
            {/* Brand Header */}
            <div className="h-14 flex items-center px-4 border-b border-th-border">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-th-primary flex items-center justify-center text-white text-xs font-bold">
                        NX
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-th-heading tracking-tight">NEXUS RCM</h1>
                        <p className="text-[9px] font-semibold text-th-muted uppercase tracking-widest">Revenue Intelligence</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">

                {/* Command Center */}
                <div className="mb-1">
                    <SidebarLink to="/" icon="hub" label="Command Center" />
                </div>

                {/* -- ANALYTICS -- */}
                <SectionHeader label="Analytics" />
                <div className="space-y-0.5">
                    <SidebarLink to="/analytics/revenue" icon="monitoring" label="Revenue Analytics" />
                    <SidebarLink to="/analytics/denials" icon="shield" label="Denial Analytics" />
                    <SidebarLink to="/analytics/payments" icon="payments" label="Payment Intelligence" />
                    <SidebarLink to="/analytics/prevention" icon="health_and_safety" label="Prevention" isNew />
                    <SidebarLink to="/analytics/claims" icon="receipt_long" label="Claims Pipeline" />
                    <SidebarLink to="/analytics/graph-explorer" icon="hub" label="Graph Explorer" isNew />
                    <SidebarLink to="/analytics/compliance" icon="verified_user" label="Compliance Risk" isNew />
                    <SidebarLink to="/analytics/payer-health" icon="vital_signs" label="Payer Health" isNew />
                    <SidebarLink to="/analytics/provider-leaderboard" icon="leaderboard" label="Provider Leaderboard" isNew />
                    <SidebarLink to="/payments/contract-variance" icon="difference" label="Contract Variance" isNew />
                </div>

                {/* -- WORK -- */}
                <SectionHeader label="Work" />
                <div className="space-y-0.5">
                    <SidebarLink to="/work/claims" icon="edit_note" label="Claims Work Center" />
                    <SidebarLink to="/work/denials" icon="gavel" label="Denial Work Center" badge="12" />
                    <SidebarLink to="/work/collections" icon="call" label="Collections Work Center" />
                    <SidebarLink to="/work/payments" icon="account_balance" label="Payment Work Center" />
                    <SidebarLink to="/work/automation" icon="smart_toy" label="Automation Dashboard" isNew />
                </div>

                {/* -- INTELLIGENCE -- */}
                <SectionHeader label="Intelligence" />
                <div className="space-y-0.5">
                    <SidebarLink to="/intelligence/lida" icon="auto_awesome" label="LIDA AI" />
                    <SidebarLink to="/intelligence/forecast" icon="trending_up" label="Revenue Forecast" />
                    <SidebarLink to="/intelligence/simulation" icon="science" label="Simulation Engine" isNew />
                </div>

                {/* -- SPECIALTY -- */}
                <SectionHeader label="Specialty" />
                <div className="space-y-0.5">
                    <SidebarLink to="/specialty/patient-access" icon="person_check" label="Patient Access" />
                    <SidebarLink to="/specialty/coding" icon="code" label="Coding & Charge" />
                    <SidebarLink to="/specialty/evv" icon="home_health" label="EVV Home Health" />
                </div>

                {/* -- SETTINGS -- */}
                <SectionHeader label="Settings" />
                <div className="space-y-0.5">
                    <SidebarLink to="/settings" icon="settings" label="Settings" />
                </div>

            </div>

            {/* System Status Footer */}
            <div className="px-4 py-3 border-t border-th-border bg-th-surface-base/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-th-success"></span>
                        <span className="text-[10px] font-medium text-th-muted">System Operational</span>
                    </div>
                    <span className="text-[10px] text-th-muted">v5.0.0</span>
                </div>
            </div>
        </aside>
    );
}
