import { useNavigate } from 'react-router-dom';
import { mockDenialData } from '../data/mockDenialData';
import { DifferentialDial } from '../components/DifferentialDial';
import { DenialTrendChart } from '../components/DenialTrendChart';
import { TrendIndicator } from '../components/TrendIndicator';

export function DenialPreventionDashboard() {
    const navigate = useNavigate();
    const { differentialDials, highRiskClaims } = mockDenialData;

    // Calculate aggregated financial metrics
    const totalRiskValue = highRiskClaims.reduce((sum, claim) => sum + claim.amount, 0);
    const criticalRiskClaims = highRiskClaims.filter(c => c.riskScore >= 90);
    const criticalRiskValue = criticalRiskClaims.reduce((sum, claim) => sum + claim.amount, 0);

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Denial Prevention & Intelligence</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">AI-driven monitoring and pre-submission intervention.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            <span>Last 30 Days</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors">
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* Section 1: Executive Monitoring - Differential Dials */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {differentialDials.map(dial => (
                        <DifferentialDial
                            key={dial.id}
                            title={dial.category}
                            value={dial.value}
                            benchmark={dial.benchmark}
                            status={dial.status}
                            trend={dial.trend}
                            onClick={() => navigate(`/denials/high-risk?category=${dial.category}`)}
                        />
                    ))}
                </div>

                {/* Section 2: Trends & Financial Impact */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Trend Chart */}
                    <div className="lg:col-span-2">
                        <DenialTrendChart />
                    </div>

                    {/* Right: Financial Impact Summary */}
                    <div className="space-y-6">
                        {/* Revenue at Risk Card */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined">warning</span>
                                </div>
                                <TrendIndicator direction="up" value="12%" label="vs last month" inverse={true} />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue at Risk</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                ${(totalRiskValue / 1000).toFixed(0)}k
                            </h3>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-300">Critical Priority</span>
                                    <span className="font-bold text-red-600">${(criticalRiskValue / 1000).toFixed(0)}k</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                                    <div
                                        className="bg-red-500 h-1.5 rounded-full"
                                        style={{ width: `${(criticalRiskValue / totalRiskValue) * 100}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {criticalRiskClaims.length} claims require immediate attention
                                </p>
                            </div>
                        </div>

                        {/* Prevented Revenue Card */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <TrendIndicator direction="up" value="8%" label="vs last month" />
                            </div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue Saved (AI)</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                $245k
                            </h3>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => navigate('/denials/workflow-log')}
                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-lg transition-colors"
                                >
                                    View Impact Analysis
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Automation Console Widget */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div
                        onClick={() => navigate('/automation/evv-retry')}
                        className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">autorenew</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">EVV Auto-Retry Manager</h3>
                                    <p className="text-xs text-slate-500">Processing 142 failed visits</p>
                                </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Active
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full w-[75%] animate-[shimmer_2s_infinite]"></div>
                        </div>
                    </div>

                    <div
                        onClick={() => navigate('/automation/cob-manager')}
                        className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">alt_route</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">COB Auto Manager</h3>
                                    <p className="text-xs text-slate-500">18 conflicts pending review</p>
                                </div>
                            </div>
                            <TrendIndicator direction="up" value="94%" label="Confidence" inverse={false} />
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="h-1 w-full bg-amber-500 rounded-full"></span>
                            <span className="h-1 w-full bg-amber-500 rounded-full"></span>
                            <span className="h-1 w-full bg-amber-500/30 rounded-full"></span>
                        </div>
                    </div>
                </div>

                {/* Section 3: High Risk Worklist Preview (Updated to use Line Item data if available, but staying simple for dashboard view) */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-border-dark flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">High-Risk Claims Queue</h3>
                            <p className="text-sm text-slate-500">Top 5 claims requiring pre-submission intervention</p>
                        </div>
                        <button
                            onClick={() => navigate('/denials/high-risk')}
                            className="text-primary text-sm font-bold hover:underline"
                        >
                            View All High Risk Claims
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Claim ID / Patient</th>
                                    <th className="px-6 py-4">Payer</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Predicted Risk</th>
                                    <th className="px-6 py-4 text-right">Value</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {highRiskClaims.slice(0, 5).map(claim => (
                                    <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 dark:text-white">{claim.id}</div>
                                            <div className="text-xs text-slate-500">{claim.patient}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                            {claim.payer}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${claim.category === 'COB' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'}`}>
                                                {claim.category === 'COB' && <span className="material-symbols-outlined text-[10px] mr-1">shield</span>}
                                                {claim.category === 'COB' ? 'COB Prevention' : claim.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-2 h-2 rounded-full ${claim.riskScore >= 90 ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}
                                                ></div>
                                                <span className={`font-bold ${claim.riskScore >= 90 ? 'text-red-600' : 'text-orange-600'}`}>
                                                    {claim.riskScore}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                            ${claim.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/denials/claim/${claim.id}`)}
                                                className="text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Analyze
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
