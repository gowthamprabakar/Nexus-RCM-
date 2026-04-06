import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Reusable Link Item — left-border accent style (Atlassian pattern)
const SidebarLink = ({ to, icon, label, badge, isNew, badgeDanger, badgeAmber, badgePurple, badgeCyan }) => {
    return (
        <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
                "flex items-center justify-between px-4 py-1.5 transition-colors text-[13px] group border-l-2",
                isActive
                    ? "bg-[rgb(var(--color-primary-bg))] text-[rgb(var(--color-primary))] font-medium border-l-2 border-[rgb(var(--color-primary))] pl-3 pr-3"
                    : "border-transparent text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay"
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
                    <span className={cn(
                        "px-1.5 py-0.5 text-[9px] font-bold rounded",
                        badgeAmber  ? "bg-[rgb(var(--color-warning-bg))] text-[rgb(var(--color-warning))]" :
                        badgePurple ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                        badgeCyan   ? "bg-[rgb(var(--color-info-bg))] text-[rgb(var(--color-info))]" :
                        badgeDanger ? "bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]" :
                                      "bg-[rgb(var(--color-danger-bg))] text-[rgb(var(--color-danger))]"
                    )}>{badge}</span>
                )}
            </div>
        </NavLink>
    );
};

// Section Divider
const SectionHeader = ({ label }) => (
    <p className="text-[11px] font-medium uppercase tracking-wide text-th-muted px-3 pt-5 pb-1.5">{label}</p>
);

export function Sidebar() {
    return (
        <aside className="w-[240px] bg-th-surface-sidebar border-r border-th-border flex flex-col h-screen shrink-0 font-sans z-20 transition-colors duration-200">

            {/* Brand Header */}
            <div className="h-[52px] flex items-center px-4 border-b border-th-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[rgb(var(--color-primary))] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        NX
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-th-heading tracking-tight">NEXUS RCM</h1>
                        <p className="text-[9px] font-semibold text-th-muted uppercase tracking-widest">Revenue Intelligence</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">

                {/* ── COMMAND ── */}
                <SectionHeader label="Command" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/" icon="hub" label="Command Center" badge="23" />
                </div>

                <div className="mx-3 my-2 h-px bg-th-border" />

                {/* ── PREVENT ── */}
                <SectionHeader label="🛡 Prevent" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/analytics/claims"       icon="fact_check"     label="Claim Readiness"    badge="8" />
                    <SidebarLink to="/analytics/prevention"   icon="health_and_safety" label="Prevention Engine" badge="12" />
                    <SidebarLink to="/specialty/patient-access" icon="person_check"  label="Patient Access" />
                    <SidebarLink to="/specialty/coding"        icon="code"           label="Coding Optimizer"   isNew />
                    <SidebarLink to="/work/automation"         icon="smart_toy"      label="Automation Rules"   badge="14" />
                </div>

                <div className="mx-3 my-2 h-px bg-th-border" />

                {/* ── DETECT ── */}
                <SectionHeader label="⚡ Detect" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/work/denials"           icon="bolt"           label="Denial Command"     badge="47" badgeDanger />
                    <SidebarLink to="/analytics/denials"      icon="psychology"     label="Denial Intelligence" isNew />
                    <SidebarLink to="/work/denials/appeals"   icon="description"    label="Appeal Workbench"   badge="9" />
                    <SidebarLink to="/work/denials/high-risk" icon="local_fire_department" label="High Risk Claims" badge="31" badgeDanger />
                    <SidebarLink to="/analytics/payer-health" icon="bar_chart"      label="Payer Patterns" />
                    <SidebarLink to="/analytics/root-cause"   icon="hub"            label="RCA Tree"           isNew />
                </div>

                <div className="mx-3 my-2 h-px bg-th-border" />

                {/* ── RECOVER ── */}
                <SectionHeader label="💰 Recover" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/work/collections"       icon="call"           label="Collections Hub"    badge="$2.4M" badgeAmber />
                    <SidebarLink to="/analytics/ar-aging"     icon="hourglass_bottom" label="AR Aging" />
                    <SidebarLink to="/analytics/cash-flow"    icon="account_balance_wallet" label="Cash Flow" />
                    <SidebarLink to="/payments/era"           icon="receipt"        label="ERA Processing" />
                </div>

                <div className="mx-3 my-2 h-px bg-th-border" />

                {/* ── PREDICT ── */}
                <SectionHeader label="🧠 Predict" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/intelligence/forecast"   icon="trending_up"   label="Revenue Forecast"   badge="90d" badgePurple />
                    <SidebarLink to="/intelligence/simulation" icon="science"        label="Payer Simulation"   isNew />
                    <SidebarLink to="/analytics/graph-explorer" icon="hub"          label="Graph Explorer"     badgeCyan />
                    <SidebarLink to="/intelligence/lida"       icon="auto_awesome"  label="LIDA AI"            isNew />
                </div>

                <div className="mx-3 my-2 h-px bg-th-border" />

                {/* ── SETTINGS ── */}
                <SectionHeader label="Settings" />
                <div className="space-y-0.5 mb-1">
                    <SidebarLink to="/analytics/compliance"   icon="verified_user"  label="Compliance Risk"    isNew />
                    <SidebarLink to="/analytics/provider-leaderboard" icon="leaderboard" label="Provider Leaderboard" isNew />
                    <SidebarLink to="/payments/contract-variance" icon="difference" label="Contract Variance"  isNew />
                    <SidebarLink to="/settings"               icon="settings"       label="Settings" />
                </div>

            </div>

            {/* System Status Footer */}
            <div className="px-4 py-3 border-t border-th-border bg-th-surface-base/50 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[rgb(var(--color-success))]"></span>
                        <span className="text-[10px] font-medium text-th-muted">System Operational</span>
                    </div>
                    <span className="text-[10px] text-th-muted">v5.0</span>
                </div>
            </div>

        </aside>
    );
}
