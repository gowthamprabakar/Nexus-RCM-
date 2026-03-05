import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCommandCenterData } from '../../../data/synthetic/mockCommandCenterData';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';

export function CommandCenter() {
    const navigate = useNavigate();
    const data = mockCommandCenterData;

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
            {/* Header / Command Bar */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <span className="material-symbols-outlined text-sm">hub</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">Command Center</h1>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">Enterprise Revenue OS</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Nominal</span>
                    </div>
                    <button className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-500">notifications</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* LAYER 1: Executive Pulse Ribbon */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">ecg_heart</span>
                            Executive Pulse
                        </h2>
                        <span className="text-[10px] font-mono text-slate-400">UPDATED: JUST NOW</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <PulseCard
                            title="Pipeline Value"
                            metric={data.executive.totalPipeline}
                            icon="payments"
                            color="text-emerald-500"
                        />
                        <PulseCard
                            title="Clean Claim Ratio"
                            metric={data.executive.cleanClaimRatio}
                            icon="fact_check"
                            color="text-blue-500"
                        />
                        <PulseCard
                            title="Denial Rate"
                            metric={data.executive.denialRate}
                            icon="block"
                            color="text-rose-500"
                        />
                        <PulseCard
                            title="Revenue At Risk"
                            metric={data.executive.revenueAtRisk}
                            icon="warning"
                            color="text-amber-500"
                        />
                        <PulseCard
                            title="System Health"
                            metric={data.executive.systemHealth}
                            icon="memory"
                            color="text-purple-500"
                        />
                    </div>
                </section>

                {/* LAYER 2: Lifecycle Flow Intelligence */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">schema</span>
                            Lifecycle Flow
                        </h2>
                    </div>
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2 rounded-full"></div>

                        <div className="grid grid-cols-5 gap-4">
                            {data.lifecycle.map((stage, i) => (
                                <LifecycleNode key={stage.id} stage={stage} index={i} total={data.lifecycle.length} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* LAYER 3 & 4: Operational Intelligence & AI */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Layer 3: Bottleneck Radar */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">radar</span>
                                Operational Radar
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500">3 Bottlenecks Detected</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.bottlenecks.map(b => (
                                <BottleneckCard key={b.id} data={b} />
                            ))}
                            {/* AI Intelligence Widget */}
                            <AIIntelligenceWidget trends={data.aiInsights} />
                        </div>
                    </div>

                    {/* Layer 5 & 6: Performance & Actions */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">bolt</span>
                                Action Center
                            </h2>
                        </div>

                        {/* Automation Performance Small Widget */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold opacity-80 uppercase">Auto-Fix Efficiency</span>
                                <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-black">{data.performance.automation.autoFixRate}</span>
                                <span className="text-xs font-bold mb-1 opacity-80">claims autonomous</span>
                            </div>
                            <div className="w-full bg-black/20 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="h-full bg-white/90 rounded-full" style={{ width: data.performance.automation.autoFixRate }}></div>
                            </div>
                        </div>

                        {/* Recent Tickets List */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                <span className="text-[10px] font-bold uppercase text-slate-500">Active Signals</span>
                                <button className="text-[10px] font-bold text-blue-500 hover:text-blue-600">View All</button>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                {data.tickets.map(ticket => (
                                    <TicketCompact key={ticket.id} ticket={ticket} />
                                ))}
                            </div>
                        </div>

                        {/* Team Performance Mini */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <span className="text-[10px] font-bold uppercase text-slate-500 mb-3 block">Team Velocity</span>
                            <div className="space-y-3">
                                {data.performance.team.map((team, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                                {team.avatar}
                                            </div>
                                            <span className="text-xs font-bold">{team.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("text-xs font-bold block", team.status === 'healthy' ? "text-emerald-500" : "text-amber-500")}>{team.efficiency}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// Micro-Components (Cont.)
// ----------------------------------------------------------------------

function BottleneckCard({ data }) {
    const navigate = useNavigate();
    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={() => data.targetRoute && navigate(data.targetRoute)}
            className="bg-white dark:bg-[#1e293b] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-rose-200 dark:hover:border-rose-900 group cursor-pointer transition-all"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                    data.type === 'Payer' ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" :
                        "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400")}>
                    {data.type} BottleNeck
                </span>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-rose-500 transition-colors">warning</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">{data.name}</h4>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium text-slate-500">{data.description}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Fin. Impact</p>
                    <p className="text-sm font-bold text-rose-500">{data.impact}</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Delay</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{data.delay}</p>
                </div>
            </div>
        </motion.div>
    );
}

function AIIntelligenceWidget({ trends }) {
    const [activeTab, setActiveTab] = useState('situational');

    return (
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-black dark:to-[#0f172a] rounded-xl p-5 text-white shadow-xl relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 p-10 opacity-5">
                <span className="material-symbols-outlined text-9xl">psychology</span>
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">auto_awesome</span>
                    <h3 className="text-sm font-bold tracking-wide">AI Usage Intelligence</h3>
                </div>
                <div className="flex gap-1 bg-white/10 p-1 rounded-lg">
                    {['situational', 'prescriptive'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn("px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors",
                                activeTab === tab ? "bg-white text-slate-900" : "text-white/50 hover:text-white")}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {trends[activeTab].map(insight => (
                    <div key={insight.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-amber-300">{insight.title}</span>
                            <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-bold">{insight.prob || insight.impact}</span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-snug mb-2">{insight.desc}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            {insight.action}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TicketCompact({ ticket }) {
    const priorityColors = {
        "Critical": "text-rose-500 bg-rose-500/10",
        "High": "text-amber-500 bg-amber-500/10",
        "Medium": "text-blue-500 bg-blue-500/10"
    };

    return (
        <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer last:border-0">
            <div className="flex justify-between items-start mb-1">
                <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", priorityColors[ticket.priority] || priorityColors["Medium"])}>
                    {ticket.priority}
                </span>
                <span className="text-[9px] text-slate-400">{ticket.time}</span>
            </div>
            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mb-1">{ticket.title}</h5>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Assigned: {ticket.owner}</span>
            </div>
        </div>
    );
}


function PulseCard({ title, metric, icon, color }) {
    const navigate = useNavigate();

    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={() => metric.targetRoute && navigate(metric.targetRoute)}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md cursor-pointer transition-all relative overflow-hidden group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
                <span className={cn("material-symbols-outlined text-lg opacity-70 group-hover:opacity-100 transition-opacity", color)}>{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{metric.value}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className={cn("text-[10px] font-bold flex items-center", metric.isPositive ? "text-emerald-500" : "text-rose-500")}>
                    {metric.isPositive ? '↑' : '↓'} {metric.trend}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">{metric.trendLabel}</span>
            </div>

            {/* Hover visual cue */}
            <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity", color.replace('text-', 'bg-'))}></div>
        </motion.div>
    );
}

function LifecycleNode({ stage, index, total }) {
    const navigate = useNavigate();

    // Status Colors
    const statusColors = {
        healthy: "bg-emerald-500",
        warning: "bg-amber-500",
        critical: "bg-rose-500",
        stable: "bg-blue-500"
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => stage.targetRoute && navigate(stage.targetRoute)}
            className="bg-white dark:bg-[#1e293b] p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative cursor-pointer z-10 group"
        >
            {/* Connector Dot */}
            <div className={cn("absolute -left-2.5 top-1/2 -translate-y-1/2 size-5 rounded-full border-4 border-[#f8fafc] dark:border-[#0f172a]", statusColors[stage.status])}></div>

            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">{stage.stage}</h3>
                <span className="material-symbols-outlined text-slate-300 text-sm group-hover:text-blue-500 transition-colors">open_in_new</span>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Vol</span>
                    <span className="font-bold">{stage.count}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Val</span>
                    <span className="font-bold text-slate-900 dark:text-white">{stage.value}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                    <span className="text-slate-400">Avg Dwell</span>
                    <span className={cn("font-mono font-bold", stage.status === 'critical' ? "text-rose-500" : "text-emerald-500")}>
                        {stage.avgDwell}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
