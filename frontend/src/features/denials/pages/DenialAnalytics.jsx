import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useNavigate } from 'react-router-dom';

export function DenialAnalytics() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleGenerateAppeals = () => {
        navigate('/denials/appeal');
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await api.claims.list();
                setClaims(data);
            } catch (e) {
                console.error("Failed to load claims", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-background-dark text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            </div>
        );
    }

    // ------------------------------------------------------------------------
    // Analytics Calculations
    // ------------------------------------------------------------------------
    const totalClaims = claims.length;
    const deniedClaims = claims.filter(c => c.status === 'Denied');
    const deniedCount = deniedClaims.length;

    // Metrics
    const denialRate = totalClaims > 0 ? ((deniedCount / totalClaims) * 100).toFixed(1) : "0.0";
    const totalLeakage = deniedClaims.reduce((sum, c) => sum + (c.amount || 0), 0);
    const avgAppealDays = 42; // Mock for now, as we don't have appeal history dates in simple claim object
    const recoveryPotential = totalLeakage * 0.65; // Estimated 65% recovery

    // Group by Reason (Root Cause)
    const reasonMap = {};
    deniedClaims.forEach(c => {
        const reason = c.denial_code || c.ai_insight || "Unspecified";
        if (!reasonMap[reason]) reasonMap[reason] = { count: 0, value: 0 };
        reasonMap[reason].count++;
        reasonMap[reason].value += c.amount;
    });
    const topReasons = Object.entries(reasonMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    // Group by Payer
    const payerMap = {};
    deniedClaims.forEach(c => {
        const payerName = c.payer?.name || "Unknown";
        if (!payerMap[payerName]) payerMap[payerName] = { denied: 0, total: 0, value: 0 };
        payerMap[payerName].denied++;
        payerMap[payerName].value += c.amount;
    });
    // Need total counts per payer for rate
    claims.forEach(c => {
        const payerName = c.payer?.name || "Unknown";
        if (payerMap[payerName]) payerMap[payerName].total++;
    });

    const payerBenchmarks = Object.entries(payerMap).map(([name, stats]) => ({
        name,
        rate: stats.total > 0 ? ((stats.denied / stats.total) * 100).toFixed(1) : "0.0",
        value: stats.value,
        variance: (Math.random() * 5 - 2).toFixed(1) // Mock variance +/-
    })).sort((a, b) => b.value - a.value);


    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Advanced Denial Analysis</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Identifying ${(totalLeakage / 1000000).toFixed(1)}M in annual financial leakage through root cause mapping.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-sm">ios_share</span>
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Chips/Filters - Visual Only for Prototype */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button className="flex h-8 items-center gap-x-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-4 pr-3 shadow-sm hover:border-primary transition-colors">
                        <p className="text-xs font-semibold text-slate-700 dark:text-white">Range: Last 90 Days</p>
                        <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
                    </button>
                    {/* Add more filters if needed */}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <MetricCard
                        label="Total Leakage"
                        value={`$${(totalLeakage / 1000000).toFixed(1)}M`}
                        trend="+12.5% vs Prev Quarter"
                        trendColor="text-red-500"
                        icon="trending_up"
                        valueColor="text-primary"
                    />
                    <MetricCard
                        label="Denial Rate"
                        value={`${denialRate}%`}
                        trend="-2.1% Industry Avg"
                        trendColor="text-emerald-500"
                        icon="trending_down"
                        valueColor="text-slate-900 dark:text-white"
                    />
                    <MetricCard
                        label="Avg. Appeal Days"
                        value={`${avgAppealDays} Days`}
                        trend="+5.0% Lag detected"
                        trendColor="text-red-500"
                        icon="warning"
                        valueColor="text-slate-900 dark:text-white"
                    />
                    <MetricCard
                        label="Recovery Potential"
                        value={`$${(recoveryPotential / 1000000).toFixed(1)}M`}
                        trend="82% Accuracy Confidence"
                        trendColor="text-emerald-500"
                        icon="check_circle"
                        valueColor="text-amber-500"
                    />
                </div>

                {/* Main Visualization Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Tree Map & Benchmark Table */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                        {/* Denial Root Cause List (Simulating Tree Map) */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Denial Categories</h3>
                                    <p className="text-xs text-slate-500">Ranked by revenue impact</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {topReasons.map((reason, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className="w-48 text-sm font-bold text-slate-700 dark:text-slate-300 truncate" title={reason.name}>{reason.name}</div>
                                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full"
                                                style={{ width: `${(reason.value / topReasons[0].value) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="w-24 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">
                                            ${(reason.value / 1000).toFixed(1)}k
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payer Benchmark Table */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 overflow-hidden shadow-sm">
                            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Payer Denial Benchmark</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700 font-bold uppercase">
                                            <th className="py-3 px-2">PAYER</th>
                                            <th className="py-3 px-2 text-right">CURRENT RATE</th>
                                            <th className="py-3 px-2 text-right">IND. AVG</th>
                                            <th className="py-3 px-2 text-center">VARIANCE</th>
                                            <th className="py-3 px-2 text-right">IMPACT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {payerBenchmarks.slice(0, 5).map((payer, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-4 px-2 font-bold text-slate-900 dark:text-white">{payer.name}</td>
                                                <td className="py-4 px-2 text-right font-semibold text-slate-700 dark:text-slate-300">{payer.rate}%</td>
                                                <td className="py-4 px-2 text-right text-slate-500">12.0%</td>
                                                <td className="py-4 px-2 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${parseFloat(payer.variance) > 0 ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                                                        {parseFloat(payer.variance) > 0 ? '+' : ''}{payer.variance}%
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-right font-bold text-primary">
                                                    ${(payer.value / 1000).toFixed(1)}k
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: AI Actionable Insights */}
                    <div className="flex flex-col gap-6">
                        {/* AI Insights Section - Static Mock for Prototype */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 flex-1 flex flex-col gap-4 shadow-xl shadow-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary">bolt</span>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Actionable Insights</h3>
                            </div>

                            <InsightCard
                                impact="Extreme"
                                tag="URGENT"
                                color="red"
                                title="Automate Eligibility checks for Cardiology Dept."
                                description="Found 42% recurring denial rate due to missing authorization for Blue Shield plans. Updating intake logic could save $125K/mo."
                            />

                            <InsightCard
                                impact="High"
                                tag="RECOVERY"
                                color="amber"
                                title="Bulk Appeal: ICD-10 Coding Mismatch"
                                description="AI detected 128 claims denied in error for 'Incorrect Modifier'. Predictive model suggests 94% win rate on Level 1 appeal."
                                action="Generate 128 Appeals"
                                onAction={handleGenerateAppeals}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components
function MetricCard({ label, value, trend, trendColor, icon, valueColor }) {
    return (
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark shadow-sm">
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className={`tracking-tight text-3xl font-black ${valueColor}`}>{value}</p>
            <div className={`flex items-center gap-1 ${trendColor} text-xs font-bold`}>
                <span className="material-symbols-outlined text-sm">{icon}</span>
                <span>{trend}</span>
            </div>
        </div>
    );
}

function InsightCard({ impact, tag, color, title, description, action, onAction }) {
    const colorClasses = {
        red: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-500', text: 'text-red-500', btn: 'bg-red-500 hover:bg-red-600' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-500', text: 'text-amber-500', btn: 'bg-amber-500 hover:bg-amber-600' },
    }[color];

    return (
        <div className={`p-4 rounded-lg border-l-4 flex flex-col gap-3 ${colorClasses.bg} ${colorClasses.border}`}>
            <div className="flex justify-between items-start">
                <span className={`text-xs font-bold uppercase ${colorClasses.text}`}>Impact: {impact}</span>
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-bold ${colorClasses.btn.split(' ')[0]}`}>{tag}</span>
            </div>
            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                {title}
            </p>
            <p className="text-xs text-slate-500 leading-normal">
                {description}
            </p>
            {action && (
                <button
                    onClick={onAction}
                    className={`w-full py-2 text-white text-xs font-bold rounded-lg transition-colors shadow-sm ${colorClasses.btn}`}
                >
                    {action}
                </button>
            )}
        </div>
    );
}

