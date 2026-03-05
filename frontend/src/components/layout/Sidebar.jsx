import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

// Reusable Capsule Component
const SidebarCapsule = ({ title, icon, children, isOpen, onToggle, statusColor }) => {
    return (
        <div className="mb-2">
            <button
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group",
                    isOpen
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
            >
                <div className="flex items-center gap-3">
                    <span className={cn("material-symbols-outlined transition-colors", isOpen ? "text-primary" : "")}>{icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {statusColor && (
                        <span className={cn("size-2 rounded-full", statusColor)}></span>
                    )}
                    <span className={cn("material-symbols-outlined text-base transition-transform duration-200", isOpen ? "rotate-90" : "")}>
                        chevron_right
                    </span>
                </div>
            </button>

            <div className={cn("overflow-hidden transition-all duration-300 ease-in-out", isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                <div className="pt-1 pb-2 pl-3 space-y-0.5 border-l-2 border-slate-100 dark:border-slate-800 ml-4 mt-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Reusable Link Item
const SidebarLink = ({ to, icon, label, status }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center justify-between px-3 py-2 rounded-md transition-colors text-sm",
                isActive
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
        >
            <div className="flex items-center gap-3">
                {/* <span className="material-symbols-outlined text-[18px] opacity-70">{icon}</span> Optional: Hide sub-icons for cleaner look if desired */}
                <span className="">{label}</span>
            </div>
            {status && (
                <span className={cn("size-1.5 rounded-full",
                    status === 'green' ? "bg-emerald-500" :
                        status === 'amber' ? "bg-amber-500" :
                            "bg-red-500"
                )}></span>
            )}
        </NavLink>
    );
};

export function Sidebar() {
    // State for expanded capsules (defaulting first 3 to open for visibility)
    const [openCapsules, setOpenCapsules] = useState({
        command: true,
        patient: false,
        claims: false,
        denial: false,
        ai: false,
        admin: false
    });

    const toggleCapsule = (key) => {
        setOpenCapsules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <aside className="w-72 bg-white dark:bg-[#0d1117] border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen shrink-0 font-sans z-20">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-xl">blur_on</span>
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">NEXUS RCM</h1>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI-Native Enterprise</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* 1. Command Center */}
                <SidebarCapsule
                    title="Command Center"
                    icon="dashboard"
                    isOpen={openCapsules.command}
                    onToggle={() => toggleCapsule('command')}
                >
                    <SidebarLink to="/" label="Dashboard" />
                    <SidebarLink to="/lida/chat" label="LIDA Chat (Analytics)" status="green" />
                    <SidebarLink to="/lida/reports" label="Collaborative Reports" />
                    <SidebarLink to="/denials/variance" label="Payer Variance Narrative" />
                    <SidebarLink to="/finance/reconciliation-advanced" label="Revenue Forecasting" />
                </SidebarCapsule>

                {/* 2. Patient Access */}
                <SidebarCapsule
                    title="Patient Access"
                    icon="badge"
                    isOpen={openCapsules.patient}
                    onToggle={() => toggleCapsule('patient')}
                    statusColor="bg-emerald-500"
                >
                    <SidebarLink to="/insurance-verification/overview" label="Eligibility & Verifications" status="green" />
                    <SidebarLink to="/patient-accounts" label="Patient Accounts Overview" />
                    <SidebarLink to="/evv/dashboard" label="EVV Compliance Monitor" status="amber" />
                    <SidebarLink to="/evv/mandates" label="State Regulatory Hubs" />
                </SidebarCapsule>

                {/* 3. Claims & Revenue */}
                <SidebarCapsule
                    title="Claims & Revenue"
                    icon="monetization_on"
                    isOpen={openCapsules.claims}
                    onToggle={() => toggleCapsule('claims')}
                    statusColor="bg-amber-500"
                >
                    <SidebarLink to="/claims/work-queue" label="Claims Work Queue" status="amber" />
                    <SidebarLink to="/claims/pre-batch-scrub" label="Pre-Batch Scrub" />
                    <SidebarLink to="/ai-coding" label="AI Coding Optimizer" />
                    <SidebarLink to="/finance/reconciliation" label="Reconciliation Center" />
                    <SidebarLink to="/collections" label="A/R Aging & Collections" status="green" />
                </SidebarCapsule>

                {/* 4. Denial & Recovery */}
                <SidebarCapsule
                    title="Denial & Recovery"
                    icon="gavel"
                    isOpen={openCapsules.denial}
                    onToggle={() => toggleCapsule('denial')}
                >
                    <SidebarLink to="/denials/prevention-dashboard" label="Prevention Dashboard" status="green" />
                    <SidebarLink to="/denials/high-risk" label="High Risk Worklist" status="amber" />
                    <SidebarLink to="/denials/workspace" label="Prevention Workspace" />
                    <SidebarLink to="/denials/workflow-log" label="Workflow Audit Log" />
                    <SidebarLink to="/denials" label="Automated Appeals" />
                    <SidebarLink to="/finance/payer-performance" label="Payer Intelligence" />
                </SidebarCapsule>

                {/* 5. AI & Engineering */}
                <SidebarCapsule
                    title="AI & Engineering"
                    icon="memory"
                    isOpen={openCapsules.ai}
                    onToggle={() => toggleCapsule('ai')}
                    statusColor="bg-emerald-500"
                >
                    <SidebarLink to="/developer/mcp-agents" label="MCP Agent Orchestrator" status="green" />
                    <SidebarLink to="/developer/ai-monitor" label="Model Drift Monitor" />
                    <SidebarLink to="/admin/integrations" label="Integration Hub" />
                    <SidebarLink to="/admin/etl-designer" label="ETL Pipelines" />
                    <SidebarLink to="/admin/api-manager" label="API Management" status="green" />
                </SidebarCapsule>

                {/* 6. Admin & Settings */}
                <SidebarCapsule
                    title="Admin & Settings"
                    icon="admin_panel_settings"
                    isOpen={openCapsules.admin}
                    onToggle={() => toggleCapsule('admin')}
                >
                    <SidebarLink to="/settings" label="Global Settings Hub" />
                    <SidebarLink to="/settings/users" label="User Access & RBAC" />
                    <SidebarLink to="/settings/billing-rules" label="Billing & AI Config" />
                    <SidebarLink to="/finance/audit-log" label="Blockchain Audit Trail" />
                </SidebarCapsule>

            </div>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-200 overflow-hidden border border-white dark:border-slate-700 shadow-sm">
                        <img src="https://ui-avatars.com/api/?name=Alex+Sterling&background=0f172a&color=fff" alt="Profile" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Alex Sterling</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">CFO Executive</p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
