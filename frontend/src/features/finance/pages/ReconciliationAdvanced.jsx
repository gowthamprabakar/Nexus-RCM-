import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { ForecastChart } from '../components/ForecastChart';
import { DailyAnalysisPanel } from '../components/DailyAnalysisPanel';

export function ReconciliationAdvanced() {
 const navigate = useNavigate();
 const [selectedDate, setSelectedDate] = useState(null);
 const [isPanelOpen, setIsPanelOpen] = useState(false);
 const [scenario, setScenario] = useState('baseline');
 const [forecastData, setForecastData] = useState({ forecastTrend: [], scenarios: {}, transactions: [], aiInsights: [] });
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   Promise.all([
     api.forecast.getWeekly(),
     api.reconciliation.getSummary(),
     api.ai.getInsights('reconciliation')
   ]).then(([weeklyData, reconSummary, insightsData]) => {
     const trend = weeklyData?.weeks || weeklyData?.forecastTrend || weeklyData || [];
     const transactions = reconSummary?.transactions || reconSummary?.items || [];
     const insights = insightsData?.insights || insightsData || [];
     setForecastData({
       forecastTrend: Array.isArray(trend) ? trend : [],
       scenarios: weeklyData?.scenarios || {},
       transactions: Array.isArray(transactions) ? transactions : [],
       aiInsights: Array.isArray(insights) ? insights : []
     });
     setLoading(false);
   }).catch(() => setLoading(false));
 }, []);

 const filteredTransactions = selectedDate
 ? forecastData.transactions.filter(t => t.date === selectedDate)
 : forecastData.transactions;

 const chartData = (forecastData.forecastTrend || []).map(point => {
 const scenarioOverride = forecastData.scenarios[scenario]?.find(s => s.date === point.date);
 return scenarioOverride ? { ...point, predicted: scenarioOverride.predicted } : point;
 });

 const handleChartClick = (date) => {
 setSelectedDate(date);
 setIsPanelOpen(true);
 };

 const handleClosePanel = () => {
 setIsPanelOpen(false);
 setSelectedDate(null);
 };

 if (loading) return (
   <div className="flex-1 flex items-center justify-center h-full">
     <div className="text-th-secondary text-sm">Loading reconciliation data...</div>
   </div>
 );

 return (
 <div className="flex h-full font-sans text-th-heading overflow-hidden relative">

 {/* Slide-over Panel */}
 <div className={`absolute right-0 top-0 bottom-0 z-30 transform transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
 <DailyAnalysisPanel
 date={selectedDate}
 onClose={handleClosePanel}
 data={forecastData}
 />
 </div>

 {/* Left Filter Sidebar */}
 <aside className="w-72 border-r border-th-border bg-th-surface-raised hidden xl:flex flex-col p-6 sticky top-0 h-full overflow-y-auto shrink-0">
 <div className="flex flex-col gap-6">
 <div>
 <h1 className="text-lg font-bold text-th-heading">Slice & Dice</h1>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mt-1">Multi-Dimensional Analysis</p>
 </div>
 <div className="space-y-1">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Filters</p>
 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 cursor-pointer">
 <span className="material-symbols-outlined !text-[20px]">credit_card</span>
 <p className="text-sm font-semibold">Payer Type</p>
 <span className="material-symbols-outlined ml-auto !text-lg">expand_more</span>
 </div>
 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-th-heading hover:bg-th-surface-overlay cursor-pointer transition-colors">
 <span className="material-symbols-outlined !text-[20px]">map</span>
 <p className="text-sm font-medium">Region</p>
 <span className="material-symbols-outlined ml-auto !text-lg text-th-secondary">expand_more</span>
 </div>
 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-th-heading hover:bg-th-surface-overlay cursor-pointer transition-colors">
 <span className="material-symbols-outlined !text-[20px]">medical_services</span>
 <p className="text-sm font-medium">Provider Group</p>
 <span className="material-symbols-outlined ml-auto !text-lg text-th-secondary">expand_more</span>
 </div>
 <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-th-heading hover:bg-th-surface-overlay cursor-pointer transition-colors">
 <span className="material-symbols-outlined !text-[20px]">calendar_today</span>
 <p className="text-sm font-medium">Date Range</p>
 <span className="material-symbols-outlined ml-auto !text-lg text-primary">forward_30</span>
 </div>
 </div>
 <div className="pt-4 border-t border-th-border">
 <div className="bg-[#0f1623] p-4 rounded-xl space-y-3 border border-th-border">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Quick Stats</p>
 <div className="flex justify-between items-end">
 <span className="text-xs text-th-secondary">Active Filters</span>
 <span className="text-xs font-bold text-primary">3 Applied</span>
 </div>
 <div className="flex flex-wrap gap-2">
 <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">Commercial</span>
 <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">Northeast</span>
 </div>
 </div>
 </div>
 <div className="pt-4 border-t border-th-border">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-3">Forecast Scenarios</p>
 <div className="space-y-2">
 <button
 onClick={() => setScenario('baseline')}
 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${scenario === 'baseline' ? 'bg-primary text-th-heading' : 'hover:bg-th-surface-overlay text-th-heading'}`}
 >
 Baseline Projection
 </button>
 <button
 onClick={() => setScenario('optimistic')}
 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${scenario === 'optimistic' ? 'bg-emerald-500 text-th-heading' : 'hover:bg-th-surface-overlay text-th-heading'}`}
 >
 Optimistic (High Volume)
 </button>
 <button
 onClick={() => setScenario('pessimistic')}
 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${scenario === 'pessimistic' ? 'bg-amber-500 text-th-heading' : 'hover:bg-th-surface-overlay text-th-heading'}`}
 >
 Pessimistic (High Denials)
 </button>
 </div>
 </div>
 </div>
 <div className="mt-auto pt-6">
 <button className="w-full flex items-center justify-center rounded-lg h-11 px-4 bg-primary text-th-heading text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-700 transition-all">
 Apply Filters
 </button>
 </div>
 </aside>

 {/* Main Content Area */}
 <main className="flex-1 min-w-0 p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar">
 {/* Section Header */}
 <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
 <div>
 <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-th-heading">Revenue & Cash Posting Reconciliation</h2>
 <p className="text-th-secondary mt-1">Analyzing cross-source variances for the last 30 days + 7-day AI forecast. <span className="ai-predictive">Predictive AI</span></p>
 </div>
 <div className="flex gap-2">
 <button className="p-2 rounded-lg border border-th-border bg-th-surface-raised text-th-heading hover:bg-th-surface-overlay">
 <span className="material-symbols-outlined">refresh</span>
 </button>
 </div>
 </div>

 {/* AI Narrative Action Panel */}
 <div className="relative overflow-hidden group rounded-xl">
 <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
 <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-xl border border-primary/20 bg-th-surface-raised p-6">
 <div className="flex items-center gap-5">
 <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
 <span className="material-symbols-outlined !text-3xl">auto_awesome</span>
 </div>
 <div className="flex flex-col gap-1">
 <p className="text-base font-bold text-th-heading flex items-center gap-2">
 AI Narrative Summary
 <span className="ai-diagnostic">Diagnostic AI</span>
 </p>
 <p className="text-th-secondary text-base font-medium leading-normal">
 <span className="text-rose-500 font-bold">Alert:</span> {forecastData.aiInsights[0]?.body || forecastData.aiInsights[0]?.description || forecastData.aiInsights[0]?.message || 'No insights available'}
 </p>
 </div>
 </div>
 <button
 onClick={() => forecastData.aiInsights[0]?.id && navigate(`/finance/insights/${forecastData.aiInsights[0].id}`)}
 className="text-sm font-bold leading-normal tracking-wide flex items-center gap-2 text-primary hover:text-blue-400 transition-colors shrink-0"
 >
 View Details <span className="material-symbols-outlined">arrow_forward</span>
 </button>
 </div>
 </div>

 {/* Stats Overview */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="flex flex-col gap-3 rounded-xl p-6 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Forecasted</p>
 <span className="material-symbols-outlined text-th-secondary !text-xl">trending_up</span>
 </div>
 <p className="tracking-tight text-3xl font-extrabold text-th-heading tabular-nums">$4.2M</p>
 <div className="flex items-center gap-2">
 <span className="text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 tabular-nums">
 <span className="material-symbols-outlined !text-xs">arrow_upward</span> Posted
 </span>
 <span className="text-th-secondary text-[11px]">Current period</span>
 </div>
 </div>
 <div className="flex flex-col gap-3 rounded-xl p-6 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">EHR Posted</p>
 <span className="material-symbols-outlined text-th-secondary !text-xl">database</span>
 </div>
 <p className="tracking-tight text-3xl font-extrabold text-th-heading tabular-nums">$3.9M</p>
 <div className="flex items-center gap-2">
 <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 tabular-nums">
 <span className="material-symbols-outlined !text-xs">arrow_downward</span> 3.4%
 </span>
 <span className="text-th-secondary text-[11px]">pending clearinghouse</span>
 </div>
 </div>
 <div className="flex flex-col gap-3 rounded-xl p-6 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Bank Credits</p>
 <span className="material-symbols-outlined text-th-secondary !text-xl">account_balance</span>
 </div>
 <p className="tracking-tight text-3xl font-extrabold text-th-heading tabular-nums">$3.8M</p>
 <div className="flex items-center gap-2">
 <span className="text-rose-500 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 tabular-nums">
 <span className="material-symbols-outlined !text-xs">arrow_downward</span> 1.2%
 </span>
 <span className="text-th-secondary text-[11px]">variance gap</span>
 </div>
 </div>
 </div>

 {/* Multi-Series Area Chart */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised p-6 overflow-hidden flex flex-col">
 <div className="flex items-center justify-between mb-2">
 <h3 className="text-lg font-bold text-th-heading">30-Day Trend Analysis & Forecast</h3>
 <div className="flex items-center gap-2">
 <div className="px-2 py-1 bg-indigo-900/20 text-indigo-400 text-[10px] font-bold uppercase rounded flex items-center gap-1">
 <span className="material-symbols-outlined !text-sms">online_prediction</span>
 AI Model: {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
 </div>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 </div>

 <div className="flex-1 min-h-[320px]">
 <ForecastChart
 data={chartData}
 aiInsights={forecastData.aiInsights}
 onDataClick={handleChartClick}
 selectedDate={selectedDate}
 />
 </div>
 </div>

 {/* Reconciliation Gap Matrix */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
 <div className="px-6 py-5 border-b border-th-border flex justify-between items-center bg-[#0f1623]">
 <div>
 <h3 className="text-lg font-bold text-th-heading flex items-center gap-2">
 Reconciliation Gap Matrix
 <span className="ai-diagnostic">Diagnostic AI</span>
 {selectedDate && <span className="px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">Filtered: {selectedDate}</span>}
 </h3>
 <p className="text-xs text-th-muted">Transactions requiring manual intervention or AI-matching verification.</p>
 </div>
 <div className="flex gap-2">
 {selectedDate && (
 <button onClick={() => setSelectedDate(null)} className="px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors">
 Clear Filter
 </button>
 )}
 <button className="px-3 py-1.5 text-xs font-bold border border-th-border rounded-lg hover:bg-th-surface-overlay text-th-heading">Filter Matrix</button>
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-[#0f1623] text-th-muted text-[11px] font-bold uppercase tracking-wider">
 <tr>
 <th className="px-6 py-3">Transaction ID</th>
 <th className="px-6 py-3">Date</th>
 <th className="px-6 py-3">Payer</th>
 <th className="px-6 py-3">Amount</th>
 <th className="px-6 py-3">Status Gap</th>
 <th className="px-6 py-3">Variance Reason</th>
 <th className="px-6 py-3 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border">
 {filteredTransactions.length === 0 ? (
 <tr>
 <td colSpan="7" className="px-6 py-10 text-center text-th-secondary text-sm">
 No transactions found for this selection.
 </td>
 </tr>
 ) : (
 filteredTransactions.map(txn => (
 <tr key={txn.id} className="hover:bg-th-surface-overlay/50 transition-colors group cursor-pointer">
 <td className="px-6 py-4 text-sm font-medium font-mono text-th-muted group-hover:text-primary transition-colors">
 {txn.id}
 </td>
 <td className="px-6 py-4 text-sm text-th-secondary">{txn.date}</td>
 <td className="px-6 py-4 text-sm text-th-secondary font-medium">{txn.payer}</td>
 <td className="px-6 py-4 text-sm font-bold text-th-heading tabular-nums">${txn.amount.toLocaleString()}</td>
 <td className="px-6 py-4">
 <span className={`flex items-center gap-1.5 font-bold text-xs uppercase ${txn.status_gap === 'EHR Only' ? 'text-rose-500' :
 txn.status_gap === 'Bank Only' ? 'text-amber-500' :
 'text-th-muted'
 }`}>
 <span className="material-symbols-outlined !text-sm">
 {txn.status_gap === 'EHR Only' ? 'error' : 'pending'}
 </span>
 {txn.status_gap}
 </span>
 </td>
 <td className="px-6 py-4 text-sm text-th-muted">{txn.variance_reason}</td>
 <td className="px-6 py-4 text-right">
 <button
 onClick={(e) => {
 e.stopPropagation();
 navigate(`/finance/reconciliation/transaction/${txn.id}`);
 }}
 className="text-primary font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
 >
 Audit Trail
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </main>
 </div>
 );
}
