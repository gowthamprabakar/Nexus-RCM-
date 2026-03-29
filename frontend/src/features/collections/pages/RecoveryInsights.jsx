import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export function RecoveryInsights() {
 const navigate = useNavigate();
 const [insights, setInsights] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   let cancelled = false;
   async function fetchData() {
     setLoading(true);
     const [forecastRes, collectionsRes, arRes] = await Promise.all([
       api.forecast.getSummary(),
       api.collections.getSummary(),
       api.ar.getSummary(),
     ]);
     if (!cancelled) {
       // Build recovery insights from combined API responses
       const recoveryInsights = {
         forecast: forecastRes?.forecast || forecastRes?.periods || {},
         forecastTrend: forecastRes?.trend || forecastRes?.forecastTrend || [],
         scenarios: forecastRes?.scenarios || collectionsRes?.scenarios || [],
         segmentAnalysis: {
           byAgingBucket: arRes?.aging_buckets || arRes?.byAgingBucket || [],
           byPayer: arRes?.by_payer || arRes?.byPayer || [],
           byBalanceRange: arRes?.by_balance_range || arRes?.byBalanceRange || [],
         },
         roiMetrics: collectionsRes?.roiMetrics || forecastRes?.roiMetrics || {},
         topAccounts: collectionsRes?.topAccounts || forecastRes?.topAccounts || [],
       };
       setInsights(recoveryInsights);
       setLoading(false);
     }
   }
   fetchData();
   return () => { cancelled = true; };
 }, []);

 const [selectedScenario, setSelectedScenario] = useState('baseline');
 const [effortLevel, setEffortLevel] = useState(100);
 const [settlementRate, setSettlementRate] = useState(0);

 const currentScenario = insights?.scenarios?.find(s => s.id === selectedScenario);

 const getEffortLabel = (level) => {
 if (level < 85) return 'Low';
 if (level < 115) return 'Medium';
 return 'High';
 };

 const calculateCustomScenario = () => {
 const baseScenario = insights?.scenarios?.[0];
 if (!baseScenario) return { forecast30d: 0, forecast60d: 0, forecast90d: 0, costs: 0, netRecovery: 0 };
 const multiplier = effortLevel / 100;
 const settlementImpact = 1 + (settlementRate / 100) * 0.15;

 return {
 forecast30d: Math.round(baseScenario.forecast30d * multiplier * settlementImpact),
 forecast60d: Math.round(baseScenario.forecast60d * multiplier * settlementImpact),
 forecast90d: Math.round(baseScenario.forecast90d * multiplier * settlementImpact),
 costs: Math.round(baseScenario.costs * multiplier),
 netRecovery: Math.round((baseScenario.forecast90d * multiplier * settlementImpact) - (baseScenario.costs * multiplier))
 };
 };

 const customScenario = calculateCustomScenario();

 if (loading) {
   return (
     <div className="flex-1 flex items-center justify-center h-full">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
     </div>
   );
 }

 if (!insights) {
   return (
     <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
       <span className="material-symbols-outlined text-6xl text-th-muted">insights</span>
       <p className="text-th-secondary">Recovery insights data not available.</p>
       <button onClick={() => navigate('/collections')} className="px-4 py-2 bg-primary text-white rounded-lg">Back to Collections</button>
     </div>
   );
 }

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="max-w-[1600px] mx-auto px-10 py-8">
 {/* Breadcrumb */}
 <div className="flex items-center gap-2 text-sm text-th-secondary mb-6">
 <button onClick={() => navigate('/collections')} className="hover:text-primary transition-colors">
 Collections Hub
 </button>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span className="text-th-heading font-medium">Expected Recovery Insights</span>
 </div>

 {/* Page Header */}
 <div className="flex justify-between items-end mb-8">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <h1 className="text-3xl font-black text-th-heading">Expected Recovery Insights</h1>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <p className="text-th-secondary">Revenue forecasting and ROI analysis for collection efforts</p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">refresh</span>
 Refresh
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">file_download</span>
 Export Report
 </button>
 </div>
 </div>

 {/* Forecast Dashboard */}
 <div className="grid grid-cols-3 gap-6 mb-8">
 {Object.entries(insights?.forecast || {}).map(([period, data]) => (
 <div key={period} className="bg-th-surface-raised border border-th-border rounded-xl p-6 border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">
 {period} Forecast
 </h3>
 <div className="flex items-center gap-1">
 <span className="material-symbols-outlined text-sm text-emerald-400">trending_up</span>
 <span className="text-xs font-bold text-emerald-400 tabular-nums">
 {data.confidence}% confidence
 </span>
 </div>
 </div>
 <p className="text-3xl font-black text-th-heading mb-2 tabular-nums">
 ${(data.amount / 1000000).toFixed(2)}M
 </p>
 <div className="flex items-center gap-2 text-xs text-th-secondary">
 <span className="tabular-nums">Range: ${(data.lowEstimate / 1000000).toFixed(2)}M - ${(data.highEstimate / 1000000).toFixed(2)}M</span>
 </div>
 <div className="mt-4 pt-4 border-t border-th-border">
 <div className="flex justify-between text-sm">
 <span className="text-th-secondary">Expected Accounts</span>
 <span className="font-bold text-th-heading tabular-nums">{data.accountsExpected}</span>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Forecast Trend Chart */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-8">
 <div className="flex items-center gap-3 mb-4">
 <h3 className="text-lg font-black text-th-heading">Revenue Forecast Trend</h3>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart data={insights?.forecastTrend || []}>
 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
 <XAxis
 dataKey="day"
 label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
 stroke="#64748b"
 />
 <YAxis
 label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft' }}
 stroke="#64748b"
 tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
 />
 <Tooltip
 formatter={(value) => [`$${value.toLocaleString()}`, 'Forecast']}
 contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
 />
 <Legend />
 <Line
 type="monotone"
 dataKey="amount"
 stroke="#3b82f6"
 strokeWidth={3}
 dot={{ fill: '#3b82f6', r: 4 }}
 name="Expected Recovery"
 />
 <Line
 type="monotone"
 dataKey="confidence"
 stroke="#10b981"
 strokeWidth={2}
 strokeDasharray="5 5"
 dot={false}
 name="Confidence %"
 yAxisId="right"
 />
 <YAxis
 yAxisId="right"
 orientation="right"
 stroke="#10b981"
 domain={[0, 100]}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Scenario Modeling */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 mb-8">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-primary text-2xl">tune</span>
 <h3 className="text-lg font-black text-th-heading">Scenario Modeling</h3>
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>

 {/* Preset Scenarios */}
 <div className="grid grid-cols-3 gap-4 mb-6">
 {(insights?.scenarios || []).map((scenario) => (
 <button
 key={scenario.id}
 onClick={() => setSelectedScenario(scenario.id)}
 className={`p-4 rounded-lg border-2 transition-all text-left ${selectedScenario === scenario.id
 ? 'border-primary bg-primary/5'
 : 'border-th-border hover:border-primary/50'
 }`}
 >
 <h4 className="text-sm font-bold text-th-heading mb-1">{scenario.name}</h4>
 <p className="text-xs text-th-secondary mb-3">{scenario.effortLevel} effort</p>
 <div className="space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-th-secondary">90d Forecast</span>
 <span className="font-bold text-th-heading tabular-nums">
 ${(scenario.forecast90d / 1000000).toFixed(2)}M
 </span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-th-secondary">ROI</span>
 <span className="font-bold text-emerald-400 tabular-nums">
 {scenario.roi.toLocaleString()}%
 </span>
 </div>
 </div>
 </button>
 ))}
 </div>

 {/* Custom Scenario Sliders */}
 <div className="bg-th-surface-base/50 rounded-lg p-6 mb-6">
 <h4 className="text-sm font-bold text-th-heading mb-4">Custom Scenario Builder</h4>

 <div className="space-y-6">
 <div>
 <div className="flex justify-between mb-2">
 <label className="text-sm text-th-heading">Collection Effort Intensity</label>
 <span className="text-sm font-bold text-primary">{effortLevel}% ({getEffortLabel(effortLevel)})</span>
 </div>
 <input
 type="range"
 min="50"
 max="200"
 value={effortLevel}
 onChange={(e) => setEffortLevel(parseInt(e.target.value))}
 className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-primary"
 />
 <div className="flex justify-between text-xs text-th-secondary mt-1">
 <span>Low (50%)</span>
 <span>Medium (100%)</span>
 <span>High (200%)</span>
 </div>
 </div>

 <div>
 <div className="flex justify-between mb-2">
 <label className="text-sm text-th-heading">Settlement Discount Rate</label>
 <span className="text-sm font-bold text-primary">{settlementRate}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="30"
 value={settlementRate}
 onChange={(e) => setSettlementRate(parseInt(e.target.value))}
 className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-primary"
 />
 <div className="flex justify-between text-xs text-th-secondary mt-1">
 <span>0% (No Settlements)</span>
 <span>30% (Max Discount)</span>
 </div>
 </div>
 </div>

 {/* Custom Scenario Results */}
 <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-th-border">
 <div>
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">30d Forecast</p>
 <p className="text-lg font-black text-th-heading tabular-nums">
 ${(customScenario.forecast30d / 1000000).toFixed(2)}M
 </p>
 </div>
 <div>
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">60d Forecast</p>
 <p className="text-lg font-black text-th-heading tabular-nums">
 ${(customScenario.forecast60d / 1000000).toFixed(2)}M
 </p>
 </div>
 <div>
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">90d Forecast</p>
 <p className="text-lg font-black text-th-heading tabular-nums">
 ${(customScenario.forecast90d / 1000000).toFixed(2)}M
 </p>
 </div>
 <div>
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Net Recovery</p>
 <p className="text-lg font-black text-emerald-400 tabular-nums">
 ${(customScenario.netRecovery / 1000000).toFixed(2)}M
 </p>
 </div>
 </div>
 </div>

 {/* Scenario Comparison */}
 <div>
 <h4 className="text-sm font-bold text-th-heading mb-4">Scenario Comparison</h4>
 <ResponsiveContainer width="100%" height={250}>
 <BarChart data={(insights?.scenarios || [])}>
 <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
 <XAxis dataKey="name" stroke="#64748b" />
 <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
 <Tooltip
 formatter={(value) => `$${value.toLocaleString()}`}
 contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
 />
 <Legend />
 <Bar dataKey="forecast90d" fill="#3b82f6" name="90d Forecast" />
 <Bar dataKey="costs" fill="#ef4444" name="Costs" />
 <Bar dataKey="netRecovery" fill="#10b981" name="Net Recovery" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Segment Analysis */}
 <div className="grid grid-cols-3 gap-6 mb-8">
 {/* By Aging Bucket */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <h3 className="text-sm font-bold text-th-heading mb-4">Recovery by Aging Bucket</h3>
 <div className="space-y-3">
 {(insights?.segmentAnalysis?.byAgingBucket || []).map((segment) => (
 <div key={segment.bucket}>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-th-heading font-bold">{segment.bucket}</span>
 <span className="text-emerald-400 font-bold">
 {(segment.recoveryProb * 100).toFixed(0)}%
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-th-surface-overlay rounded-full h-2">
 <div
 className="bg-emerald-500 h-2 rounded-full"
 style={{ width: `${segment.recoveryProb * 100}%` }}
 ></div>
 </div>
 <span className="text-xs text-th-secondary">
 ${(segment.expectedRecovery / 1000).toFixed(0)}K
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* By Payer */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <h3 className="text-sm font-bold text-th-heading mb-4">Recovery by Payer</h3>
 <div className="space-y-3">
 {(insights?.segmentAnalysis?.byPayer || []).slice(0, 5).map((segment) => (
 <div key={segment.payer}>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-th-heading font-bold">{segment.payer}</span>
 <span className="text-primary font-bold">
 {(segment.recoveryProb * 100).toFixed(0)}%
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-th-surface-overlay rounded-full h-2">
 <div
 className="bg-primary h-2 rounded-full"
 style={{ width: `${segment.recoveryProb * 100}%` }}
 ></div>
 </div>
 <span className="text-xs text-th-secondary">
 ${(segment.expectedRecovery / 1000).toFixed(0)}K
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* By Balance Range */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <h3 className="text-sm font-bold text-th-heading mb-4">Recovery by Balance Range</h3>
 <div className="space-y-3">
 {(insights?.segmentAnalysis?.byBalanceRange || []).map((segment) => (
 <div key={segment.range}>
 <div className="flex justify-between text-sm mb-1">
 <span className="text-th-heading font-bold">{segment.range}</span>
 <span className="text-amber-400 font-bold">
 {(segment.recoveryProb * 100).toFixed(0)}%
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-th-surface-overlay rounded-full h-2">
 <div
 className="bg-amber-500 h-2 rounded-full"
 style={{ width: `${segment.recoveryProb * 100}%` }}
 ></div>
 </div>
 <span className="text-xs text-th-secondary">
 {segment.count} accts
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ROI Calculator */}
 <div className="bg-th-surface-raised border border-emerald-800/50 rounded-xl p-6 mb-8">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-emerald-400 text-2xl">calculate</span>
 <h3 className="text-lg font-black text-th-heading">ROI Analysis</h3>
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>

 <div className="grid grid-cols-4 gap-6">
 <div className="bg-th-surface-overlay/50 rounded-lg p-4 border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Total Investment</p>
 <p className="text-2xl font-black text-th-heading tabular-nums">
 ${insights?.roiMetrics.totalInvestment.toLocaleString()}
 </p>
 <p className="text-xs text-th-secondary mt-1 tabular-nums">
 ${insights?.roiMetrics.costPerAccount.toFixed(2)} per account
 </p>
 </div>
 <div className="bg-th-surface-overlay/50 rounded-lg p-4 border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Expected Recovery</p>
 <p className="text-2xl font-black text-th-heading tabular-nums">
 ${(insights?.roiMetrics.expectedRecovery / 1000000).toFixed(2)}M
 </p>
 <p className="text-xs text-th-secondary mt-1 tabular-nums">
 ${insights?.roiMetrics.revenuePerAccount.toLocaleString()} per account
 </p>
 </div>
 <div className="bg-th-surface-overlay/50 rounded-lg p-4 border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Net Recovery</p>
 <p className="text-2xl font-black text-emerald-400 tabular-nums">
 ${(insights?.roiMetrics.netRecovery / 1000000).toFixed(2)}M
 </p>
 <p className="text-xs text-th-secondary mt-1">
 After collection costs
 </p>
 </div>
 <div className="bg-th-surface-overlay/50 rounded-lg p-4 border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">ROI</p>
 <p className="text-2xl font-black text-emerald-400 tabular-nums">
 {insights?.roiMetrics.roi.toLocaleString()}%
 </p>
 <p className="text-xs text-th-secondary mt-1">
 Break-even in {insights?.roiMetrics.breakEvenDays} days
 </p>
 </div>
 </div>
 </div>

 {/* Top Accounts by Recovery Potential */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <h3 className="text-lg font-black text-th-heading">Top Accounts by Recovery Potential</h3>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 <button className="text-sm text-primary font-bold hover:underline">View All</button>
 </div>

 <table className="w-full">
 <thead>
 <tr className="border-b border-th-border">
 <th className="text-left text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Account</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Balance</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Recovery Prob</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Expected Recovery</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Effort Score</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">ROI</th>
 <th className="text-right text-xs font-semibold uppercase tracking-wider text-th-muted pb-3">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 {(insights?.topAccounts || []).map((account) => (
 <tr key={account.accountId} className="hover:bg-th-surface-overlay/50 transition-colors">
 <td className="py-4">
 <div>
 <p className="text-sm font-bold text-th-heading">{account.accountId}</p>
 <p className="text-xs text-th-secondary">{account.patient}</p>
 </div>
 </td>
 <td className="py-4 text-right font-mono text-sm font-bold text-th-heading tabular-nums">
 ${account.balance.toLocaleString()}
 </td>
 <td className="py-4 text-right">
 <span className="text-sm font-bold text-emerald-400 tabular-nums">
 {(account.recoveryProb * 100).toFixed(0)}%
 </span>
 </td>
 <td className="py-4 text-right font-mono text-sm font-bold text-th-heading tabular-nums">
 ${account.expectedRecovery.toLocaleString()}
 </td>
 <td className="py-4 text-right">
 <span className="text-sm text-th-heading">{account.effortScore.toFixed(1)}</span>
 </td>
 <td className="py-4 text-right">
 <span className="text-sm font-bold text-primary tabular-nums">{account.roi}%</span>
 </td>
 <td className="py-4 text-right">
 <button
 onClick={() => navigate(`/collections/account/${account.accountId}`)}
 className="text-xs font-bold text-primary hover:underline"
 >
 View Account
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
