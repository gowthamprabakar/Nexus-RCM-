import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { api } from '../../../services/api';
import { ClaimBatchModal } from '../../../components/dashboard/modals/ClaimBatchModal';
import { AuditLogModal } from '../../../components/dashboard/modals/AuditLogModal';

export function ExecutiveDashboard() {
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState("October 2023 Fiscal View");

    // Data State
    const [kpis, setKpis] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [activeTickets, setActiveTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true); // Show loading spinner on change
            try {
                const [kpiData, trendData, ticketData] = await Promise.all([
                    api.dashboard.getKPIs(dateRange),
                    api.dashboard.getRevenueTrend(dateRange),
                    api.tickets.listActive()
                ]);
                setKpis(kpiData);
                setRevenueTrend(trendData);
                setActiveTickets(ticketData);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, [dateRange]);

    const handleCreateTicket = async (ticketData) => {
        const newTicket = await api.tickets.create(ticketData);
        setActiveTickets(prev => [newTicket, ...prev]);
        setIsCreateModalOpen(false);
    };

    const handleBatchSubmit = (batchData) => {
        // Simulate API call
        console.log("Batch Submitted:", batchData);
        setIsBatchModalOpen(false);
        // In a real app, we'd add a toast here
    };

    const handleEligibilityCheck = () => {
        navigate('/insurance-verification/overview');
    };

    const handleKPIClick = (route) => {
        if (route) navigate(route);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center h-screen bg-background-light dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Header */}
            <header className="h-14 border-b border-slate-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold tracking-tight">Executive Revenue Dashboard</h2>
                    <div className="h-4 w-px bg-slate-200 dark:bg-border-dark"></div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-transparent border-none outline-none font-bold appearance-none cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                            <option>October 2023 Fiscal View</option>
                            <option>September 2023 Fiscal View</option>
                            <option>Q3 2023 Aggregate</option>
                        </select>
                        <span className="material-symbols-outlined text-[14px]">keyboard_arrow_down</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-48 h-8 bg-slate-100 dark:bg-card-dark border-none rounded-md text-[11px] pl-8 focus:ring-1 focus:ring-primary focus:w-64 transition-all outline-none"
                            placeholder="Search infrastructure..."
                            type="text"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-slate-400 text-[18px]">search</span>
                    </div>
                    <button className="size-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-card-dark rounded-md relative transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-1.5 right-1.5 size-1.5 bg-red-500 rounded-full"></span>
                    </button>
                    <button className="size-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-card-dark rounded-md transition-colors">
                        <span className="material-symbols-outlined">grid_view</span>
                    </button>
                </div>
            </header>

            {/* Sub-Header Actions */}
            <div className="px-6 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark/40 shrink-0">
                <div className="flex gap-2">
                    <button
                        onClick={handleEligibilityCheck}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark hover:border-primary/50 rounded-md text-[11px] font-bold transition-all"
                    >
                        <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                        Eligibility Check
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark hover:border-primary/50 rounded-md text-[11px] font-bold transition-all">
                        <span className="material-symbols-outlined text-[16px] text-primary">cloud_download</span>
                        Financial Export
                    </button>
                </div>
                <button
                    onClick={() => setIsBatchModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-md text-[11px] font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/10"
                >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Submit New Claim Batch
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* KPI Cards Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            title="Claims Volume"
                            value={kpis?.claimsVolume || "12,450"}
                            icon="inventory_2"
                            trend={{ value: "+4.2%", label: "vs target", isPositive: true }}
                            onClick={() => handleKPIClick('/claims/work-queue')}
                        />
                        <KPICard
                            title="Approval Rate"
                            value={kpis?.approvalRate || "94.2%"}
                            target="Target 95.0%"
                            customChart={
                                <div className="relative w-[80px] h-[40px] overflow-hidden">
                                    <div className="w-[80px] h-[80px] rounded-full border-8 border-slate-800 dark:border-slate-700 border-b-transparent border-l-transparent -rotate-45 absolute top-0 left-0"></div>
                                    <div className="w-[80px] h-[80px] rounded-full border-8 border-primary border-b-transparent border-l-transparent rotate-[115deg] absolute top-0 left-0"></div>
                                    <div className="absolute bottom-0 inset-x-0 text-center text-[10px] font-bold dark:text-white">{parseInt(kpis?.approvalRate || 94)}%</div>
                                </div>
                            }
                            onClick={() => handleKPIClick('/claims/analytics')}
                        />
                        <KPICard
                            title="Denial Rate"
                            value={kpis?.denialRate || "3.1%"}
                            icon="warning"
                            iconColor="text-red-500"
                            borderColor="border-l-4 border-l-red-500/50"
                            trend={{ value: "-0.5%", label: "Threshold breach", isPositive: false, color: "text-red-500" }}
                            onClick={() => handleKPIClick('/denials/analytics')}
                        />
                        <KPICard
                            title="Net Collections"
                            value={kpis?.netCollections || "$4.25M"}
                            icon="monetization_on"
                            iconColor="text-emerald-500"
                            trend={{ value: "+8.1%", label: "Month-on-Month", isPositive: true }}
                            onClick={() => handleKPIClick('/collections/hub')}
                        />
                    </div>

                    {/* Financial & Alerts Grid */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Financial Analytics (Left Column) */}
                        <div className="col-span-12 lg:col-span-8 space-y-6">

                            {/* Revenue Trend Chart */}
                            <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-lg">insights</span>
                                            Revenue Lifecycle Intelligence
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-1">Real-time processing vs. AI predictive projections</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-semibold">
                                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-primary"></div> Actual</div>
                                        <div className="flex items-center gap-1.5"><div className="size-2 rounded-full bg-slate-600"></div> AI Model</div>
                                        <button onClick={() => handleKPIClick('/analytics/revenue')} className="text-slate-400 hover:text-primary transition-colors ml-2" title="Expand View">
                                            <span className="material-symbols-outlined text-lg">fullscreen</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end gap-3 px-2 relative">
                                    <div className="absolute inset-0 flex flex-col justify-between py-2 text-[10px] text-slate-500 border-l border-slate-200 dark:border-border-dark pl-2">
                                        <span>$5.0M</span><span>$4.0M</span><span>$3.0M</span><span>$2.0M</span><span>$1.0M</span><span>0</span>
                                    </div>
                                    <div className="flex-1 ml-12 flex items-end gap-3 h-full">
                                        {(revenueTrend.length > 0 ? revenueTrend : [
                                            { actual: 2.5, predicted: 2.6, month: 'May' },
                                            { actual: 3.2, predicted: 3.1, month: 'Jun' },
                                            { actual: 3.8, predicted: 3.9, month: 'Jul' },
                                            { actual: 4.2, predicted: 4.1, month: 'Aug' },
                                            { actual: null, predicted: 4.5, month: 'Sep' }
                                        ]).map((data, i, arr) => (
                                            <ChartBar
                                                key={i}
                                                height={data.actual ? `${(data.actual / 5) * 80}%` : null}
                                                aiHeight={`${(data.predicted / 5) * 90}%`}
                                                isActive={i === arr.length - 1} // just highlight last for demo
                                                isAiOnly={!data.actual}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-between ml-14 mt-4 text-[10px] text-slate-500 font-bold tracking-tighter uppercase">
                                    {(revenueTrend.length > 0 ? revenueTrend : [
                                        { month: 'May' }, { month: 'Jun' }, { month: 'Jul' }, { month: 'Aug' }, { month: 'Sep' }
                                    ]).map((d, i) => (
                                        <span key={i} className={revenueTrend.length > 0 && !d.actual ? "text-primary" : ""}>{d.month}</span>
                                    ))}
                                </div>
                            </div>

                            {/* A/R Aging Section */}
                            <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-slate-200 dark:border-border-dark">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-sm font-bold">A/R Aging Segmentation</h4>
                                    <div className="flex gap-1">
                                        <button className="px-2 py-1 text-[10px] bg-slate-100 dark:bg-border-dark rounded font-bold hover:bg-slate-200 transition-colors">Payer Group</button>
                                        <button className="px-2 py-1 text-[10px] text-slate-500 rounded font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Facility</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-medium">
                                            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500"></span> 0-30 Days</span>
                                            <span>$1,420,000 (62%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                                            <div className="bg-emerald-500 h-full w-[62%]"></div>
                                            <div className="bg-primary h-full w-[15%]"></div>
                                            <div className="bg-amber-500 h-full w-[10%]"></div>
                                            <div className="bg-red-500 h-full w-[13%]"></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <AgingCard title="31-60 Days" value="$540k" percent="23%" color="bg-primary" />
                                        <AgingCard title="61-90 Days" value="$210k" percent="10%" color="bg-amber-500" />
                                        <AgingCard title="90+ Days" value="$115k" percent="5%" color="bg-red-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alerts & Intelligence (Right Column) */}
                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
                                    <h4 className="text-xs font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-amber-500 text-lg">auto_awesome</span>
                                        LIDA Intelligence Alerts
                                    </h4>
                                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[9px] font-bold rounded uppercase">4 Action Required</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    <AlertItem
                                        type="error"
                                        title="Claim #8821 Rejected"
                                        time="2m ago"
                                        description="Missing Provider NPI on BlueShield. Value:"
                                        value="$12,400"
                                    />
                                    <AlertItem
                                        type="warning"
                                        title="Coverage Expiration"
                                        time="45m ago"
                                        description="S. Johnson (ID: 0042) policy inactive. 12 claims pending."
                                    />
                                    <AlertItem
                                        type="info"
                                        title="Coding Recommendation"
                                        time="2h ago"
                                        description="Suggest modifier -25 for 18 ortho claims to prevent bundling."
                                    />
                                </div>
                                <button
                                    onClick={() => setIsAuditModalOpen(true)}
                                    className="p-3 w-full text-left text-[10px] font-bold text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-border-dark uppercase tracking-widest"
                                >
                                    Audit Performance Log
                                </button>
                            </div>

                            {/* AI Confidence Card */}
                            <div className="bg-gradient-to-br from-[#0f1420] to-primary/80 p-5 rounded-xl text-white shadow-xl shadow-primary/10 border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-symbols-outlined text-6xl">psychology</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl">smart_toy</span>
                                        </div>
                                        <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded">98.4% ACCURACY</span>
                                    </div>
                                    <h5 className="text-sm font-bold">Predictive Engine v4.2</h5>
                                    <p className="text-[10px] text-white/70 mt-1 leading-relaxed">Processing 2.4k claims/min with real-time payer rule ingestion from 450+ carriers.</p>
                                    <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex -space-x-1.5">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="size-5 rounded-full ring-2 ring-[#0f1420] bg-slate-600 flex items-center justify-center text-[8px] font-bold">AI</div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-white/60">3 Node Clusters Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Intelligence Section */}
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold">Active Insights Tickets</h3>
                                    <p className="text-sm text-slate-500">Manage tasks derived directly from AI data insights</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-blue-600 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span> Create Ticket
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {activeTickets.filter(t =>
                                    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    t.id.toLowerCase().includes(searchQuery.toLowerCase())
                                ).map(ticket => (
                                    <TicketCard
                                        key={ticket.id}
                                        id={ticket.id}
                                        priority={ticket.priority}
                                        title={ticket.title}
                                        description={ticket.description}
                                        assignee={ticket.assignee?.name || ticket.assignee}
                                        source={ticket.source}
                                        recovery={typeof ticket.recovery_potential === 'number' ? `$${ticket.recovery_potential.toLocaleString()}` : ticket.recovery_potential || '$0'}
                                        timeline={ticket.timeline_display || "3 days left"}
                                        chartColor={ticket.chartColor || "bg-primary"}
                                        onClick={() => setSelectedTicket(ticket)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold">Team Performance</h3>
                                    <span className="material-symbols-outlined text-slate-400 cursor-pointer">more_horiz</span>
                                </div>
                                <div className="space-y-6">
                                    <PerformanceGroup
                                        title="Top Performers"
                                        icon="verified"
                                        iconColor="text-emerald-500"
                                        members={[
                                            { name: "Marcus Chen", stat: "Avg Resolution: 4.2h", metric: "12 Tickets", subMetric: "Closed", metricColor: "text-emerald-500" },
                                            { name: "Elena Rodriguez", stat: "Avg Resolution: 5.8h", metric: "9 Tickets", subMetric: "Closed", metricColor: "text-emerald-500" }
                                        ]}
                                    />
                                    <PerformanceGroup
                                        title="Lagging Response"
                                        icon="pending_actions"
                                        iconColor="text-amber-500"
                                        members={[
                                            { name: "Tom Braddock", stat: "Avg Resolution: 28.5h", metric: "4 Overdue", subMetric: "Stalled", metricColor: "text-rose-500" }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-primary to-blue-800 p-6 rounded-xl text-white shadow-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    <h4 className="text-sm font-bold">LIDA Efficiency Insight</h4>
                                </div>
                                <p className="text-xs leading-relaxed opacity-90 mb-4">"Direct ticket generation from Chat has reduced triage time by 42% this month. Teams focusing on 'Critical' items first have seen a 12% revenue lift."</p>
                                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors">Analyze Team Impact</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals & Slide-overs */}
            {isCreateModalOpen && <CreateTicketModal onSubmit={handleCreateTicket} onClose={() => setIsCreateModalOpen(false)} />}
            {isBatchModalOpen && <ClaimBatchModal onSubmit={handleBatchSubmit} onClose={() => setIsBatchModalOpen(false)} />}
            {isAuditModalOpen && <AuditLogModal onClose={() => setIsAuditModalOpen(false)} />}
            {selectedTicket && <TicketReviewPanel ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}
        </div>
    );
}

// ----------------------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------------------

function KPICard({ title, value, icon, target, trend, iconColor, borderColor, customChart, onClick }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white dark:bg-card-dark p-5 rounded-xl border border-slate-200 dark:border-border-dark flex flex-col justify-between transition-shadow hover:shadow-md cursor-pointer",
                borderColor
            )}
        >
            <div className="flex justify-between items-start">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                {icon && <span className={cn("material-symbols-outlined", iconColor || "text-slate-400")}>{icon}</span>}
            </div>
            {customChart ? (
                <div className="flex justify-between items-end mt-3">
                    <div>
                        <h3 className="text-2xl font-bold">{value}</h3>
                        {target && <p className="text-primary text-[10px] font-bold mt-2">{target}</p>}
                    </div>
                    {customChart}
                </div>
            ) : (
                <div className="mt-3">
                    <h3 className="text-2xl font-bold">{value}</h3>
                    {trend && (
                        <div className={cn("mt-2 flex items-center gap-1 text-[10px] font-bold", trend.isPositive ? "text-emerald-500" : trend.color || "text-slate-500")}>
                            <span className="material-symbols-outlined text-[14px]">{trend.isPositive ? "trending_up" : "error"}</span>
                            {trend.value} <span className="text-slate-400 font-normal ml-1">{trend.label}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ChartBar({ height, aiHeight, isActive, isAiOnly }) {
    return (
        <div className={cn("flex-1 rounded-t h-full relative group cursor-pointer transition-all", isAiOnly ? "" : isActive ? "bg-slate-200 dark:bg-slate-700" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700")}>
            {/* AI Prediction */}
            {aiHeight && (
                <div
                    className={cn("absolute inset-x-0 bottom-0 bg-primary/30 rounded-t transition-all", isAiOnly ? "border-t-2 border-dashed border-primary bg-primary/10" : "")}
                    style={{ height: aiHeight }}
                ></div>
            )}

            {/* Actual */}
            {!isAiOnly && height && (
                <div
                    className={cn("absolute inset-x-0 bottom-0 bg-primary rounded-t shadow-[0_0_15px_rgba(19,91,236,0.2)]", isActive ? "shadow-[0_0_20px_rgba(19,91,236,0.4)]" : "")}
                    style={{ height: height }}
                ></div>
            )}
        </div>
    );
}

function AgingCard({ title, value, percent, color }) {
    return (
        <div className="p-3 rounded-lg border border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-slate-800/30">
            <p className="text-[10px] text-slate-500 font-bold uppercase">{title}</p>
            <p className="text-sm font-bold mt-1">{value}</p>
            <div className="w-full bg-white dark:bg-slate-800 h-1 rounded-full mt-2">
                <div className={cn("h-full rounded-full", color)} style={{ width: percent }}></div>
            </div>
        </div>
    );
}

function AlertItem({ type, title, time, description, value }) {
    const icons = {
        error: { icon: "report", color: "text-red-500", bg: "bg-red-500/10" },
        warning: { icon: "person_off", color: "text-amber-500", bg: "bg-amber-500/10" },
        info: { icon: "bolt", color: "text-primary", bg: "bg-primary/10" }
    };

    const style = icons[type];

    return (
        <div className="p-4 border-b border-slate-50 dark:border-border-dark/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
            <div className="flex gap-3">
                <div className={cn("size-7 rounded shrink-0 flex items-center justify-center transition-colors", style.bg, style.color)}>
                    <span className="material-symbols-outlined text-base">{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{title}</p>
                        <span className="text-[9px] text-slate-400">{time}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {description} {value && <span className="text-slate-900 dark:text-slate-100 font-bold">{value}</span>}
                    </p>
                    {type === "error" && (
                        <div className="mt-2.5 flex gap-2">
                            <button className="px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded hover:bg-blue-600 transition-colors">Auto-Fix</button>
                            <button className="px-2 py-0.5 border border-slate-200 dark:border-border-dark text-[9px] font-bold rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">View</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TicketCard({ id, priority, title, description, assignee, source, recovery, timeline, chartColor, onClick }) {
    const priorityColors = {
        "Critical": "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
        "High": "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        "Medium": "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
        "Low": "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
        "Resolved": "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
    };

    return (
        <div onClick={onClick} className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
            <div className="p-5 flex gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", priorityColors[priority] || priorityColors["Medium"])}>{priority} Priority</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{id}</span>
                    </div>
                    <h4 className="text-base font-bold mb-1 group-hover:text-primary transition-colors">{title}</h4>
                    <p className="text-sm text-slate-500 mb-4">{description}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-100 dark:border-border-dark/50">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Leader</p>
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-slate-200"></div>
                                <span className="text-xs font-medium">{assignee}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Source Insight</p>
                            <div className="flex items-center gap-1 text-primary">
                                <span className="material-symbols-outlined text-[14px]">query_stats</span>
                                <span className="text-xs font-medium">{source}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Est. Recovery</p>
                            <span className="text-xs font-bold text-emerald-500">{recovery}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Timeline</p>
                            <span className="text-xs font-medium">{timeline}</span>
                        </div>
                    </div>
                </div>
                <div className="w-48 shrink-0 flex flex-col gap-2 hidden md:flex">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Related Chart</p>
                    <div className="bg-slate-50 dark:bg-background-dark rounded-lg p-3 h-full border border-slate-100 dark:border-border-dark/30">
                        <div className="flex items-end gap-1 h-full pt-4">
                            {[30, 40, 35, 90, 85].map((h, i) => (
                                <div key={i} className={cn("flex-1 rounded-t-sm", i > 2 ? chartColor : `${chartColor}/20`)} style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PerformanceGroup({ title, icon, iconColor, members }) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <span className={cn("material-symbols-outlined text-[20px]", iconColor)}>{icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
            </div>
            <div className="space-y-3">
                {members.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-border-dark/30">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-300"></div>
                            <div>
                                <p className="text-xs font-bold">{m.name}</p>
                                <p className="text-[10px] text-slate-500">{m.stat}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className={cn("text-xs font-bold", m.metricColor)}>{m.metric}</p>
                            <p className="text-[10px] text-slate-500">{m.subMetric}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CreateTicketModal({ onSubmit, onClose }) {
    const [title, setTitle] = useState("New Investigation");
    const [priority, setPriority] = useState("Medium");
    const [recovery, setRecovery] = useState(0);

    const handleSubmit = () => {
        onSubmit({
            title,
            priority,
            description: "User generated ticket...",
            assignee: { name: "You" },
            source: "Manual",
            recovery_potential: parseInt(recovery)
        });
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
                    <h3 className="text-lg font-bold">Create New Insight Ticket</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Ticket Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-200 outline-none" type="text" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Priority Level</label>
                            <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-200 outline-none">
                                <option>Critical</option>
                                <option>High</option>
                                <option>Medium</option>
                                <option>Low</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Estimated Revenue Recovery</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                                <input value={recovery} onChange={e => setRecovery(e.target.value)} className="w-full pl-7 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm p-2.5 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-200 outline-none" type="number" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-200 dark:border-border-dark flex justify-end gap-3 bg-slate-50 dark:bg-card-dark/20">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-primary/20">Generate Ticket</button>
                </div>
            </div>
        </div>
    );
}

function TicketReviewPanel({ ticket, onClose }) {
    return (
        <div className="fixed inset-y-0 right-0 z-[110] w-[450px] bg-background-light dark:bg-background-dark border-l border-slate-200 dark:border-border-dark shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark/30">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ticket.id} / Review</span>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{ticket.title}</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-border-dark">
                        <button className="px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 shadow-sm">Pending</button>
                        <button className="px-3 py-1 text-[10px] font-bold rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Verified</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-6 tracking-widest">Timeline of Communication</h4>
                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-border-dark">
                    {(ticket.timeline || []).map((event, i) => (
                        <TimelineItem
                            key={i}
                            icon={event.type === 'system' ? "auto_awesome" : "person"}
                            iconBg={event.type === 'system' ? "bg-primary" : "bg-slate-400"}
                            name={event.author}
                            time={new Date(event.time).toLocaleTimeString()}
                            content={event.content}
                            isSystem={event.type === 'system'}
                        />
                    ))}
                    {(!ticket.timeline || ticket.timeline.length === 0) && (
                        <div className="pl-10 text-sm text-slate-500">No events recorded yet.</div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark/30">
                <div className="relative">
                    <textarea className="w-full bg-slate-50 dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl text-sm p-4 focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-slate-200 scrollbar-none resize-none outline-none" placeholder="Add a comment or @tag a team member..." rows="3"></textarea>
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button className="size-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400">
                            <span className="material-symbols-outlined text-[18px]">attach_file</span>
                        </button>
                        <button className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors">Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TimelineItem({ icon, iconBg, name, time, content, isSystem }) {
    return (
        <div className="relative pl-10">
            <div className={cn("absolute left-1 top-0 size-6 rounded-full flex items-center justify-center text-white ring-4 ring-background-light dark:ring-background-dark", iconBg)}>
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
            </div>
            <div className={cn("rounded-xl p-4 border", isSystem ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20" : "bg-white dark:bg-card-dark border-slate-200 dark:border-border-dark")}>
                <div className="flex justify-between items-center mb-1">
                    <span className={cn("text-xs font-bold", isSystem ? "text-emerald-600 dark:text-emerald-500" : (name === "LIDA Intelligence" ? "text-primary" : ""))}>{name}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{time}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
