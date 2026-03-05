import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockARData } from '../data/mockARData';
import { KPICard } from '../components/KPICard';
import { ARAgingChart } from '../components/charts/ARAgingChart';
import { ARTrendChart } from '../components/charts/ARTrendChart';
import { CollectionVelocityChart } from '../components/charts/CollectionVelocityChart';
import { AIInsightsPanel } from '../components/AIInsightsPanel';
import { AgingBucketDetailModal } from '../components/modals/AgingBucketDetailModal';
import { PayerPerformanceModal } from '../components/modals/PayerPerformanceModal';
import { AIInsightDetailModal } from '../components/modals/AIInsightDetailModal';
import { DenialReasonsChart } from '../components/charts/DenialReasonsChart';
import { PaymentDistributionChart } from '../components/charts/PaymentDistributionChart';
import { TopCPTCodesChart } from '../components/charts/TopCPTCodesChart';

export function CollectionsHub() {
    const navigate = useNavigate();
    const [selectedBucket, setSelectedBucket] = useState(null);
    const [selectedPayer, setSelectedPayer] = useState(null);
    const [selectedInsight, setSelectedInsight] = useState(null);

    const { kpis, arTrend, agingBuckets, collectionVelocity, payerTreemap, aiInsights, highRiskClaims, denialReasons, paymentDistribution, topCPTCodes } = mockARData;

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="max-w-[1600px] mx-auto px-10 py-8">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">A/R Aging Analysis & Collections Hub</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Real-time enterprise accounts receivable tracking with AI-prioritized intervention workflows.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                            <span className="material-symbols-outlined text-sm">filter_list</span>
                            <span>Filters</span>
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">file_download</span>
                            <span>Export Report</span>
                        </button>
                    </div>
                </div>

                {/* KPI Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <KPICard
                        title="Total A/R Balance"
                        value={`$${(kpis.totalARBalance.current / 1000000).toFixed(2)}M`}
                        change={kpis.totalARBalance.change}
                        trend={kpis.totalARBalance.trend}
                        subtitle={`vs last month ($${(kpis.totalARBalance.previous / 1000000).toFixed(1)}M)`}
                        icon="account_balance"
                    />
                    <KPICard
                        title="Avg. Days Outstanding"
                        value={`${kpis.avgDaysOutstanding.current} Days`}
                        change={kpis.avgDaysOutstanding.change}
                        trend={kpis.avgDaysOutstanding.trend}
                        subtitle={`Target: ${kpis.avgDaysOutstanding.target} Days`}
                        accentColor="border-l-amber-500"
                    />
                    <div onClick={() => navigate('/collections/recovery-insights')} className="cursor-pointer">
                        <KPICard
                            title="Projected 30D Cash"
                            value={`$${(kpis.projected30DCash.current / 1000000).toFixed(1)}M`}
                            subtitle={`Confidence level: ${kpis.projected30DCash.confidence}%`}
                            icon="trending_up"
                        />
                    </div>
                    <div onClick={() => navigate('/collections/alerts')} className="cursor-pointer">
                        <KPICard
                            title="AI Risk Flagged Claims"
                            value={kpis.aiRiskFlagged.count}
                            subtitle={`Potential Loss: $${(kpis.aiRiskFlagged.potentialLoss / 1000).toFixed(0)}k`}
                            accentColor="border-l-red-500"
                            icon="warning"
                        />
                    </div>
                </div>

                {/* Operations & Analytics Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div
                        onClick={() => navigate('/collections/performance')}
                        className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <span className="material-symbols-outlined">leaderboard</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Performance Analytics</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Team metrics, leaderboards & efficiency stats</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">arrow_forward</span>
                    </div>

                    <div
                        onClick={() => navigate('/collections/timeline')}
                        className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                <span className="material-symbols-outlined">history</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">Global Activity Timeline</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Audit trail of all collection activities</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">arrow_forward</span>
                    </div>
                </div>

                {/* Charts Grid Tier 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Aging Bucket Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">A/R Aging Buckets vs. Expected Collectability</h3>
                                <p className="text-sm text-slate-500">Current portfolio breakdown by aging category</p>
                            </div>
                        </div>
                        <ARAgingChart data={agingBuckets} onBucketClick={setSelectedBucket} />
                    </div>

                    {/* AI Insights Panel */}
                    <div>
                        <AIInsightsPanel insights={aiInsights} onInsightClick={setSelectedInsight} />
                    </div>
                </div>

                {/* AR Trend Chart */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-8">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">12-Month A/R Trend Analysis</h3>
                        <p className="text-sm text-slate-500">Historical balance, collections, and outstanding amounts</p>
                    </div>
                    <ARTrendChart data={arTrend} />
                </div>

                {/* Collection Velocity Chart */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-8">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Collection Velocity by Payer</h3>
                        <p className="text-sm text-slate-500">Average days to settle by top payers</p>
                    </div>
                    <CollectionVelocityChart data={collectionVelocity} onPayerClick={setSelectedPayer} />
                </div>

                {/* Additional Insights Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Denial Reasons Breakdown */}
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Denial Reasons Breakdown</h3>
                            <p className="text-sm text-slate-500">Top reasons for claim denials</p>
                        </div>
                        <DenialReasonsChart data={denialReasons} />
                    </div>

                    {/* Payment Method Distribution */}
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Distribution</h3>
                            <p className="text-sm text-slate-500">Revenue by payment method</p>
                        </div>
                        <PaymentDistributionChart data={paymentDistribution} />
                    </div>

                    {/* Top CPT Codes */}
                    <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top CPT Codes by Revenue</h3>
                            <p className="text-sm text-slate-500">Highest revenue procedures</p>
                        </div>
                        <TopCPTCodesChart data={topCPTCodes} />
                    </div>
                </div>

                {/* Payer Treemap Section */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark p-6 rounded-xl shadow-sm mb-8">
                    <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Top Payers by A/R Balance</h3>
                    <p className="text-sm text-slate-500 mb-6">Treemap visualization of capital concentration</p>
                    <div className="grid grid-cols-12 grid-rows-2 h-72 gap-2 text-slate-900 dark:text-white">
                        <div className="col-span-6 row-span-2 bg-primary/10 border border-primary/20 rounded-lg p-6 flex flex-col justify-between hover:bg-primary/20 cursor-pointer transition-all hover:scale-[1.02]">
                            <div>
                                <p className="text-sm font-bold opacity-80">Medicare Advantage</p>
                                <p className="text-3xl font-black text-primary mt-1">$3.8M</p>
                            </div>
                            <p className="text-xs font-bold opacity-60">30.5% of Portfolio</p>
                        </div>
                        <div className="col-span-3 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">BCBS Texas</p>
                            <p className="text-xl font-bold">$1.4M</p>
                        </div>
                        <div className="col-span-3 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">Aetna National</p>
                            <p className="text-xl font-bold">$1.2M</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">Cigna</p>
                            <p className="text-lg font-bold">$920k</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-center">
                            <p className="text-xs font-bold opacity-70">United</p>
                            <p className="text-lg font-bold">$840k</p>
                        </div>
                        <div className="col-span-2 row-span-1 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <p className="text-xs font-bold text-slate-400">14 Others</p>
                        </div>
                    </div>
                </div>

                {/* High-Value / High-Risk Worklist */}
                <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-sm overflow-hidden mb-12">
                    <div className="flex flex-wrap justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">High-Value/High-Risk Worklist</h3>
                            <p className="text-sm text-slate-500">AI-prioritized claims requiring immediate follow-up</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-600 rounded-md shadow-sm text-slate-900 dark:text-white">By Risk Score</button>
                                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">By Balance</button>
                                <button className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">By Aging</button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Claim ID</th>
                                    <th className="px-6 py-4">Payer</th>
                                    <th className="px-6 py-4">Balance</th>
                                    <th className="px-6 py-4">Aging</th>
                                    <th className="px-6 py-4">AI Risk Analysis</th>
                                    <th className="px-6 py-4">Next Action</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                                {highRiskClaims.map((claim) => (
                                    <tr
                                        key={claim.claimId}
                                        onClick={() => navigate(`/collections/account/${claim.accountId}`)}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{claim.claimId}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{claim.accountId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{claim.patient}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{claim.mrn}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{claim.payer}</td>
                                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                                            ${claim.balance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${claim.aging > 90 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                                claim.aging > 60 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                                    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                {claim.aging} Days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${claim.riskLevel === 'critical' ? 'bg-red-500' :
                                                    claim.riskLevel === 'high' ? 'bg-orange-500' :
                                                        'bg-amber-500'
                                                    }`}></span>
                                                <span className="font-bold text-slate-900 dark:text-white capitalize">
                                                    {claim.riskLevel} ({claim.riskScore}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">{claim.nextAction}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/collections/account/${claim.accountId}`);
                                                }}
                                                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Floating Help & Action Button */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3">
                <button className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined !text-3xl">smart_toy</span>
                </button>
            </div>

            {/* Modals */}
            {selectedBucket && (
                <AgingBucketDetailModal bucket={selectedBucket} onClose={() => setSelectedBucket(null)} />
            )}
            {selectedPayer && (
                <PayerPerformanceModal payer={selectedPayer} onClose={() => setSelectedPayer(null)} />
            )}
            {selectedInsight && (
                <AIInsightDetailModal insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
            )}
        </div>
    );
}
