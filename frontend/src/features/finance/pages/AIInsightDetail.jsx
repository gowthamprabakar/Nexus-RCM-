import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockForecastingData } from '../../../data/synthetic/mockForecastingData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle } from '../../../lib/chartTheme';

export function AIInsightDetail() {
 const { insightId } = useParams();
 const navigate = useNavigate();

 // In detail view, we fetch the specific insight
 const insight = useMemo(() =>
 mockForecastingData.aiInsights.find(i => i.id === insightId) || mockForecastingData.aiInsights[0],
 [insightId]);

 // Data for the "Factor Impact" chart
 const chartData = insight.contributing_factors || [];
 const colors = getSeriesColors();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 return (
 <div className="flex flex-col font-sans bg-[#f6f6f8] dark:bg-[#101622] text-th-heading min-h-full">

 {/* Header */}
 <div className="h-16 px-6 border-b border-th-border dark:border-[#282e39] bg-white dark:bg-[#101622] flex items-center justify-between shrink-0 sticky top-0 z-10">
 <div className="flex items-center gap-4">
 <button onClick={() => navigate(-1)} className="p-2 hover:bg-th-surface-overlay dark:hover:bg-[#282e39] rounded-full transition-colors">
 <span className="material-symbols-outlined">arrow_back</span>
 </button>
 <div>
 <h1 className="text-lg font-bold flex items-center gap-2">
 AI Insight Analysis
 <span className={`px-2 py-0.5 text-xs font-mono rounded font-bold uppercase ${insight.severity === 'High' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-amber-100 text-amber-600'
 }`}>
 {insight.type}: {insight.severity} Priority
 </span>
 </h1>
 </div>
 </div>
 </div>

 <main className="flex-1 p-6 lg:p-10">
 <div className="max-w-5xl mx-auto space-y-8">

 {/* Top Narrative Card */}
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-8 relative overflow-hidden transition-all duration-200">
 <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

 <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-4">
 <h2 className="text-2xl font-extrabold text-th-heading leading-tight">
 Root Cause Analysis
 </h2>
 <p className="text-lg text-th-muted dark:text-[#9da6b9] leading-relaxed">
 {insight.root_cause_analysis}
 </p>
 <div className="flex gap-4 mt-6">
 <div className="flex items-center gap-2 px-4 py-2 bg-th-surface-overlay/30 dark:bg-[#1c222d] rounded-lg border border-th-border dark:border-[#3b4354]">
 <span className="material-symbols-outlined text-emerald-500">check_circle</span>
 <div>
 <p className="text-xs text-th-muted uppercase font-bold">Confidence</p>
 <p className="font-bold tabular-nums">{insight.confidence_score}% Verified</p>
 </div>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-th-surface-overlay/30 dark:bg-[#1c222d] rounded-lg border border-th-border dark:border-[#3b4354]">
 <span className="material-symbols-outlined text-rose-500">show_chart</span>
 <div>
 <p className="text-xs text-th-muted uppercase font-bold">Est. Impact</p>
 <p className="font-bold tabular-nums">{insight.impact_value}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Action Panel */}
 <div className="lg:col-span-1 bg-th-surface-overlay rounded-xl p-6 border border-th-border-subtle">
 <h3 className="text-sm font-bold uppercase text-th-muted mb-4">Recommended Actions</h3>
 <div className="space-y-3">
 {insight.recommended_actions?.map((action, idx) => (
 <button key={idx} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${action.type === 'primary'
 ? 'bg-primary text-th-heading shadow-lg shadow-primary/20 hover:bg-blue-700'
 : 'bg-white dark:bg-[#282e39] border border-th-border dark:border-[#3b4354] hover:bg-th-surface-overlay/30 dark:hover:bg-[#323846]'
 }`}>
 <span className="material-symbols-outlined text-lg">{action.icon}</span>
 {action.action}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Split View: Factors & History */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

 {/* Factor Impact Chart */}
 <div className="bg-th-surface-raised rounded-lg border border-th-border border-l-[3px] border-l-[rgb(var(--color-danger))] p-6 transition-all duration-200">
 <h3 className="text-lg font-bold mb-6">Contributing Factors</h3>
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid {...gridProps} horizontal={false} vertical={true} />
 <XAxis type="number" hide />
 <YAxis dataKey="factor" type="category" width={150} tick={axisProps.tick} />
 <Tooltip
 cursor={{ fill: 'transparent' }}
 contentStyle={tooltipStyle.contentStyle}
 />
 <Bar dataKey="impact" barSize={20} radius={[0, 4, 4, 0]}>
 {chartData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={index === 0 ? colors[3] : colors[0]} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Historical Context */}
 <div className="bg-th-surface-raised rounded-lg border border-th-border border-l-[3px] border-l-[rgb(var(--color-warning))] p-6 transition-all duration-200">
 <h3 className="text-lg font-bold mb-6">Similar Historical Events</h3>
 {insight.history_link && insight.history_link.length > 0 ? (
 <div className="space-y-4">
 {insight.history_link.map((history, idx) => (
 <div key={idx} className="flex gap-4 items-start p-4 rounded-lg bg-th-surface-overlay/30 dark:bg-[#1c222d] border border-th-border-subtle dark:border-[#282e39]">
 <div className="mt-1 size-2 rounded-full bg-slate-400"></div>
 <div>
 <p className="font-bold text-sm">{history.event}</p>
 <p className="text-xs text-th-muted mt-1">{history.date}</p>
 </div>
 <button className="ml-auto text-xs font-bold text-primary hover:underline">Compare</button>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-th-muted text-sm">No similar historical patterns detected.</p>
 )}
 </div>

 </div>

 {/* Supporting Evidence (The "Foot") */}
 <div className="bg-th-surface-raised rounded-lg border border-th-border overflow-hidden transition-all duration-200">
 <div className="px-6 py-5 border-b border-th-border dark:border-[#282e39] bg-th-surface-overlay/30 dark:bg-[#1c222d] flex justify-between items-center">
 <div>
 <h3 className="text-lg font-bold">Supporting Evidence</h3>
 <p className="text-xs text-th-muted">Transactions directly contributing to this insight.</p>
 </div>
 <button className="text-xs font-bold text-primary hover:underline">Export Data</button>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-th-surface-overlay/30 dark:bg-[#1c222d] text-th-muted dark:text-[#9da6b9] text-[11px] font-bold uppercase tracking-wider">
 <tr>
 <th className="px-6 py-3">Transaction ID</th>
 <th className="px-6 py-3">Posted Date</th>
 <th className="px-6 py-3">Predicted Date</th>
 <th className="px-6 py-3">Variance</th>
 <th className="px-6 py-3">Amount</th>
 <th className="px-6 py-3">Status</th>
 <th className="px-6 py-3 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-[#282e39]">
 {insight.related_transactions && insight.related_transactions.length > 0 ? (
 insight.related_transactions.map((txn, idx) => (
 <tr key={idx} className="hover:bg-th-surface-overlay/30 dark:hover:bg-[#1c222d] transition-colors">
 <td className="px-6 py-4 text-sm font-medium font-mono text-th-muted ">{txn.id}</td>
 <td className="px-6 py-4 text-sm text-th-muted dark:text-[#9da6b9]">{txn.date}</td>
 <td className="px-6 py-4 text-sm text-th-muted">{txn.predicted_date}</td>
 <td className="px-6 py-4">
 <span className="bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 px-2 py-0.5 rounded text-xs font-bold">
 {txn.variance}
 </span>
 </td>
 <td className="px-6 py-4 text-sm font-bold tabular-nums">${txn.amount.toLocaleString()}</td>
 <td className="px-6 py-4 text-sm text-th-muted dark:text-[#9da6b9]">{txn.status}</td>
 <td className="px-6 py-4 text-right">
 <button
 onClick={() => navigate(`/finance/reconciliation/transaction/${txn.id}`)}
 className="text-primary font-bold text-xs hover:underline"
 >
 Audit
 </button>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan="7" className="px-6 py-8 text-center text-th-muted text-sm">
 No individual transactions linked to this widespread anomaly.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 </div>
 </main>
 </div>
 );
}
