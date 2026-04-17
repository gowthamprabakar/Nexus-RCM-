import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';

// Comprehensive route-to-title + breadcrumb mapping
const ROUTE_META = {
    '/': { title: 'Command Center', section: 'Intelligence Hub' },
    '/command-center': { title: 'Command Center', section: 'Intelligence Hub' },
    '/executive-dashboard': { title: 'Executive Dashboard', section: 'Intelligence Hub' },
    '/lida/chat': { title: 'LIDA Chat', section: 'Intelligence Hub', subtitle: 'Conversational Analytics' },
    '/lida/dashboard': { title: 'LIDA Dashboard', section: 'Intelligence Hub' },
    '/lida/reports': { title: 'Reports Builder', section: 'Intelligence Hub' },
    '/lida/tickets': { title: 'Action Tracker', section: 'Intelligence Hub' },
    '/reporting': { title: 'Revenue Forecast', section: 'Intelligence Hub' },

    '/insurance-verification': { title: 'Patient Access Hub', section: 'Patient Access' },
    '/insurance-verification/overview': { title: 'Patient Access Hub', section: 'Patient Access' },
    '/insurance-verification/eligibility': { title: 'Eligibility Verification', section: 'Patient Access', subtitle: '270/271 Transactions' },
    '/insurance-verification/auths': { title: 'Prior Authorization', section: 'Patient Access' },
    '/insurance-verification/benefits': { title: 'Benefit Analytics', section: 'Patient Access' },
    '/insurance-verification/history': { title: 'Verification History', section: 'Patient Access' },
    '/patient-accounts': { title: 'Patient Accounts', section: 'Patient Access' },
    // Canonical Phase 3 Prevent / Patient Access paths
    '/specialty/patient-access': { title: 'Patient Access Hub', section: 'Prevent' },
    '/specialty/patient-access/overview': { title: 'Patient Access Hub', section: 'Prevent' },
    '/specialty/patient-access/eligibility': { title: 'Eligibility Verification', section: 'Prevent', subtitle: '270/271 Transactions' },
    '/specialty/patient-access/auths': { title: 'Prior Authorization', section: 'Prevent' },
    '/specialty/patient-access/benefits': { title: 'Benefit Analytics', section: 'Prevent' },
    '/specialty/patient-access/history': { title: 'Verification History', section: 'Prevent' },
    '/specialty/patient-access/accounts': { title: 'Patient Accounts', section: 'Prevent' },
    '/analytics/claims/queue': { title: 'Validation Queue', section: 'Prevent' },
    '/analytics/claims/scrub': { title: 'Claim Scrubbing', section: 'Prevent' },
    '/analytics/claims/mass-scrub': { title: 'Mass Scrub', section: 'Prevent' },

    '/ai-coding': { title: 'AI Coding Optimizer', section: 'Coding & Charge' },
    '/ai-coding/audit': { title: 'Coding Audit & Review', section: 'Coding & Charge' },
    '/ai-coding/compliance': { title: 'Coding Compliance', section: 'Coding & Charge' },
    '/ai-coding/rulebook': { title: 'Payer Rulebook', section: 'Coding & Charge' },

    '/claims': { title: 'Claims Overview', section: 'Claims Management' },
    '/claims/overview': { title: 'Claims Overview', section: 'Claims Management' },
    '/claims/work-queue': { title: 'Claims Work Queue', section: 'Claims Management' },
    '/claims/batch': { title: 'Batch Actions', section: 'Claims Management' },
    '/claims/mass-scrub': { title: 'Mass Scrub', section: 'Claims Management' },
    '/claims/rules': { title: 'Rule Engine', section: 'Claims Management' },
    '/claims/pre-batch-scrub': { title: 'Pre-Batch Scrub', section: 'Claims Management' },
    '/claims/pre-batch-scrub/dashboard': { title: 'Scrub Dashboard', section: 'Claims Management' },
    '/claims/pre-batch-scrub/queue': { title: 'Validation Queue', section: 'Claims Management' },
    '/claims/pre-batch-scrub/auto-fix': { title: 'Auto-Fix Center', section: 'Claims Management' },
    '/claims/submission-tracking': { title: 'Submission Tracking', section: 'Claims Management' },
    '/claims/acknowledgments': { title: 'Payer Acknowledgments', section: 'Claims Management' },
    '/claims-scrubbing': { title: 'Claim Scrubbing', section: 'Claims Management' },
    '/claims-analytics': { title: 'Claims Analytics', section: 'Claims Management' },

    '/payments/dashboard': { title: 'Payment Dashboard', section: 'Payments & Posting' },
    '/payments/era-processing': { title: 'ERA/835 Processing', section: 'Payments & Posting' },
    '/payments/posting': { title: 'Payment Posting', section: 'Payments & Posting' },
    '/payments/contracts': { title: 'Contract Manager', section: 'Payments & Posting' },
    '/finance/payer-performance': { title: 'Payer Performance', section: 'Payments & Posting' },

    '/denials': { title: 'Denial Work Queue', section: 'Denial Prevention' },
    '/denials/appeal': { title: 'AI Appeal Generator', section: 'Denial Prevention' },
    '/denials/analytics': { title: 'Denial Analytics', section: 'Denial Prevention' },
    '/denials/prevention-dashboard': { title: 'Prevention Dashboard', section: 'Denial Prevention' },
    '/denials/high-risk': { title: 'High Risk Claims', section: 'Denial Prevention' },
    '/denials/workspace': { title: 'Prevention Workspace', section: 'Denial Prevention' },
    '/denials/workflow-log': { title: 'Workflow Log', section: 'Denial Prevention' },
    '/denials/variance': { title: 'Payer Variance Analysis', section: 'Denial Prevention', subtitle: 'AI Financial Narrative' },

    '/collections': { title: 'A/R Aging Hub', section: 'Billing & Collections' },
    '/collections/tasks': { title: 'Collections Work Queue', section: 'Billing & Collections' },
    '/collections/portal': { title: 'Patient Payment Portal', section: 'Billing & Collections' },
    '/collections/alerts': { title: 'Alerts Queue', section: 'Billing & Collections' },
    '/collections/recovery-insights': { title: 'Recovery Insights', section: 'Billing & Collections' },
    '/collections/performance': { title: 'Performance Analytics', section: 'Billing & Collections' },
    '/collections/timeline': { title: 'Collections Timeline', section: 'Billing & Collections' },
    '/collections/statements': { title: 'Patient Statements', section: 'Billing & Collections' },

    '/finance/reconciliation': { title: 'Reconciliation Center', section: 'Reconciliation' },
    '/finance/reconciliation-advanced': { title: 'Revenue & Cash Posting', section: 'Reconciliation' },
    '/reconciliation/bank-view': { title: 'Bank Reconciliation', section: 'Reconciliation' },
    '/reconciliation/ar-balance': { title: 'A/R Balance Reconciliation', section: 'Reconciliation' },
    '/finance/audit-log': { title: 'Audit Trail', section: 'Settings' },

    '/evv/dashboard': { title: 'EVV Compliance Dashboard', section: 'EVV Home Health' },
    '/evv/visit-details': { title: 'Visit Verification', section: 'EVV Home Health' },
    '/evv/fraud-detection': { title: 'Fraud Detection', section: 'EVV Home Health' },
    '/evv/mandates': { title: 'State Mandates', section: 'EVV Home Health' },
    '/evv/billing-bridge': { title: 'EVV Billing Bridge', section: 'EVV Home Health' },
    '/automation/evv-retry': { title: 'EVV Auto-Retry', section: 'EVV Home Health' },
    '/automation/cob-manager': { title: 'Automation Console', section: 'AI Engine' },

    '/ai-engine/performance': { title: 'AI Performance', section: 'AI Engine' },
    '/developer/mcp-agents': { title: 'Agent Orchestrator', section: 'AI Engine' },
    '/developer/ai-monitor': { title: 'Model Monitor', section: 'AI Engine' },
    '/developer/data-schema': { title: 'Data Schema Explorer', section: 'AI Engine' },

    '/settings': { title: 'Settings', section: 'Settings' },
    '/settings/users': { title: 'Users & Roles', section: 'Settings' },
    '/settings/billing-rules': { title: 'Billing Rules', section: 'Settings' },
    '/settings/ai-config': { title: 'AI Configuration', section: 'Settings' },
    '/admin/integrations': { title: 'Integration Hub', section: 'Settings' },
    '/admin/etl-designer': { title: 'ETL Pipelines', section: 'Settings' },
    '/admin/dashboard': { title: 'Admin Dashboard', section: 'Settings' },
    '/admin/api-manager': { title: 'API Management', section: 'Settings' },
    '/admin/scheduler': { title: 'Scheduler', section: 'Settings' },

    '/intelligence/lida':           { title: 'LIDA AI', section: 'Intelligence' },
    '/intelligence/lida/chat':      { title: 'LIDA Chat', section: 'Intelligence' },
    '/intelligence/lida/reports':   { title: 'Report Builder', section: 'Intelligence' },
    '/intelligence/forecast':       { title: 'Revenue Forecast', section: 'Intelligence' },
    '/intelligence/simulation':     { title: 'Payer Simulation', section: 'Intelligence' },
    '/analytics/prevention':        { title: 'Prevention Intelligence', section: 'Analytics' },
    '/analytics/graph-explorer':    { title: 'Graph Explorer', section: 'Analytics' },
    '/analytics/payer-health':      { title: 'Payer Health Scorecard', section: 'Analytics' },
    '/analytics/compliance':        { title: 'Compliance Risk', section: 'Analytics' },
    '/analytics/outcomes':          { title: 'ML Model Governance', section: 'Analytics' },
    '/work/denials/queue':          { title: 'Denial Work Queue', section: 'Work Centers' },
    '/work/denials/appeals':        { title: 'Appeal Generator', section: 'Work Centers' },
    '/work/denials/high-risk':      { title: 'High Risk Claims', section: 'Work Centers' },
    '/work/collections/queue':      { title: 'Collections Queue', section: 'Work Centers' },
    '/work/automation':             { title: 'Automation Dashboard', section: 'Work Centers' },
};

function formatCurrentDate() {
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

export function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, toggleTheme, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [liveTime, setLiveTime] = useState(new Date());
    const [mfStatus, setMfStatus] = useState('offline');
    const [hitlCount, setHitlCount] = useState(0);

    const isCommandCenter = ['/', '/command-center'].includes(location.pathname);

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date()), 30000);
        return () => clearInterval(t);
    }, []);

    // MiroFish + HITL status (only on Command Center)
    useEffect(() => {
        if (!isCommandCenter) return;
        api.mirofish?.getStatus?.().then(d => { if (d?.status) setMfStatus(d.status); }).catch(() => {});
        fetch('/api/v1/automation/pending').then(r => r.ok ? r.json() : null)
            .then(d => { const items = d?.items || (Array.isArray(d) ? d : []); setHitlCount(items.length); })
            .catch(() => {});
    }, [isCommandCenter]);

    const getRouteMeta = () => {
        const path = location.pathname;
        if (ROUTE_META[path]) return ROUTE_META[path];
        const segments = path.split('/');
        for (let i = segments.length; i > 0; i--) {
            const partial = segments.slice(0, i).join('/');
            if (ROUTE_META[partial]) return ROUTE_META[partial];
        }
        return { title: 'NEXUS RCM', section: 'Platform' };
    };

    const meta = getRouteMeta();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            console.log('Search:', searchQuery);
        }
    };

    return (
        <header className="h-[52px] border-b border-th-border bg-th-surface-header px-6 flex items-center justify-between sticky top-0 z-10 font-sans transition-colors duration-200 shadow-header">
            {/* Left: Breadcrumb + Title */}
            <div className="flex items-center gap-3 min-w-0">
                <nav className="flex items-center gap-1.5 text-xs">
                    <span className="text-th-muted font-medium">{meta.section}</span>
                    <span className="material-symbols-outlined text-th-muted/50 text-xs">chevron_right</span>
                    <span className="text-th-heading font-semibold truncate">{meta.title}</span>
                </nav>
                {meta.subtitle && (
                    <>
                        <div className="h-4 w-px bg-th-border"></div>
                        <span className="text-[11px] text-th-secondary">{meta.subtitle}</span>
                    </>
                )}
            </div>

            {/* Center: Status Pills (Command Center only) */}
            {isCommandCenter && (
                <div className="flex items-center gap-2">
                    {/* LIVE pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[rgb(var(--color-success))]/10 border border-[rgb(var(--color-success))]/20">
                        <span className="relative flex size-[5px]">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-success))] opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-[5px] bg-[rgb(var(--color-success))]"></span>
                        </span>
                        <span className="font-mono text-[9.5px] font-bold text-[rgb(var(--color-success))]">LIVE · {liveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {/* MiroFish pill */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border ${mfStatus === 'healthy' ? 'bg-purple-500/10 border-purple-500/20' : mfStatus === 'degraded' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <span className="relative flex size-[5px]">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mfStatus === 'healthy' ? 'bg-purple-400' : mfStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full size-[5px] ${mfStatus === 'healthy' ? 'bg-purple-400' : mfStatus === 'degraded' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
                        </span>
                        <span className={`font-mono text-[9.5px] font-bold ${mfStatus === 'healthy' ? 'text-purple-400' : mfStatus === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>MiroFish {mfStatus === 'healthy' ? 'ONLINE' : mfStatus === 'degraded' ? 'DEGRADED' : 'OFFLINE'}</span>
                    </div>
                    {/* Neo4j pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                        <span className="relative flex size-[5px]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" style={{animationDelay:'.5s'}}></span><span className="relative inline-flex rounded-full size-[5px] bg-cyan-400"></span></span>
                        <span className="font-mono text-[9.5px] font-bold text-cyan-400">Neo4j CONNECTED</span>
                    </div>
                    {/* LIDA pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[rgb(var(--color-primary))]/10 border border-[rgb(var(--color-primary))]/20">
                        <span className="relative flex size-[5px]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--color-primary))] opacity-75" style={{animationDelay:'1s'}}></span><span className="relative inline-flex rounded-full size-[5px] bg-[rgb(var(--color-primary))]"></span></span>
                        <span className="font-mono text-[9.5px] font-bold text-[rgb(var(--color-primary))]">LIDA READY</span>
                    </div>
                </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Command Center Action Buttons */}
                {isCommandCenter && (
                    <>
                        <button onClick={() => navigate('/intelligence/lida/chat')} className="flex items-center gap-1 px-2.5 py-1 rounded text-[10.5px] font-medium text-th-secondary bg-th-surface-overlay border border-th-border hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all">
                            💬 Ask LIDA
                        </button>
                        <button onClick={() => window.dispatchEvent(new CustomEvent('open-hitl-modal'))} className="flex items-center gap-1 px-2.5 py-1 rounded text-[10.5px] font-medium text-th-secondary bg-th-surface-overlay border border-th-border hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] transition-all">
                            ⚡ HITL Queue {hitlCount > 0 && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-black min-w-[16px] text-center">{hitlCount}</span>}
                        </button>
                        <button onClick={() => navigate('/intelligence/simulation')} className="flex items-center gap-1 px-2.5 py-1 rounded text-[10.5px] font-semibold text-white bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary-hover))] transition-all">
                            🌊 Run Simulation
                        </button>
                        <div className="h-4 w-px bg-th-border"></div>
                    </>
                )}

                {/* Date */}
                <span className="text-[11px] text-th-secondary">{formatCurrentDate()}</span>

                <div className="h-4 w-px bg-th-border"></div>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        className="w-48 bg-th-surface-overlay rounded-md px-3 py-1.5 text-sm pl-8 focus:ring-1 focus:ring-th-primary focus:border-th-primary text-th-heading placeholder:text-th-muted transition-all focus:w-64"
                        placeholder="Search claims, patients..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Global search"
                    />
                    <span className="material-symbols-outlined absolute left-2 top-1.5 text-th-muted text-base">search</span>
                </form>

                <div className="h-4 w-px bg-th-border"></div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50 rounded-md transition-colors"
                    aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                    title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>

                {/* Notifications */}
                <button
                    className="p-1.5 text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50 rounded-md relative transition-colors"
                    aria-label="Notifications"
                >
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                    <span className="absolute top-1 right-1 size-2 bg-th-danger rounded-full ring-2 ring-th-surface-header"></span>
                </button>

                {/* User avatar */}
                <button className="flex items-center gap-2 pl-1" aria-label="User menu">
                    <div className="size-8 rounded-full bg-th-primary flex items-center justify-center text-white text-xs font-bold">
                        AS
                    </div>
                </button>
            </div>
        </header>
    );
}
