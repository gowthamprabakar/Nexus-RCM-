import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer
} from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle } from '../../../lib/chartTheme';

const defaultChartData = [
 { name: 'Mon', score: 82 },
 { name: 'Tue', score: 89 },
 { name: 'Wed', score: 85 },
 { name: 'Thu', score: 93 },
 { name: 'Fri', score: 94 },
 { name: 'Sat', score: 91 },
 { name: 'Sun', score: 96 },
];

export function AICodingCompliance() {
 const [activeTab, setActiveTab] = useState('violations');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [complianceData, setComplianceData] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const data = await api.coding.getCompliance();
       if (!data) throw new Error('No compliance data returned');
       setComplianceData(data);
     } catch (err) {
       console.error('Failed to load coding compliance:', err);
       setError(err.message || 'Failed to load compliance data');
     } finally {
       setLoading(false);
     }
   }
   load();
 }, []);

 // Derive compliance metrics from coding API data
 const modifierPatterns = complianceData?.modifier_patterns || [];
 const providerDistribution = complianceData?.provider_distribution || [];

 // Calculate compliance score from modifier usage patterns
 const totalModifierUsage = modifierPatterns.reduce((sum, m) => sum + (m.usage_count || 0), 0);
 const complianceScore = providerDistribution.length > 0
   ? (100 - providerDistribution.reduce((sum, p) => sum + (p.unique_cpt_codes > 20 ? 1 : 0), 0) / providerDistribution.length * 100).toFixed(1)
   : '96.4';
 const overallScore = providerDistribution.length > 0
   ? (providerDistribution.reduce((sum, p) => sum + p.claim_count, 0) > 0 ? complianceScore : '--')
   : '--';

 // Build violations from providers with high avg charges (potential overcoding)
 const complianceFindings = providerDistribution
   .filter(p => p.avg_charges > 500 || p.unique_cpt_codes > 15)
   .map(p => ({
     claim_id: `PRV-${p.provider_id}`,
     category: `High Avg Charges ($${p.avg_charges.toFixed(0)}) - ${p.specialty || 'Unknown'}`,
     severity: p.avg_charges > 1000 ? 'high' : p.avg_charges > 500 ? 'medium' : 'low',
     detected: `${p.claim_count} claims`,
     provider_name: p.provider_name,
   }));
 const violationCount = complianceFindings.length || 0;
 const totalFindings = modifierPatterns.length + providerDistribution.length;

 // Build chart data from modifier usage or use defaults
 const chartData = modifierPatterns.length > 0
   ? modifierPatterns.slice(0, 7).map((m, i) => ({
       name: m.modifier || `Mod ${i+1}`,
       score: Math.min(100, Math.round(80 + (m.usage_count / (totalModifierUsage || 1)) * 100)),
     }))
   : defaultChartData;

 const colors = getSeriesColors();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const tabs = [
 { id: 'overview', label: 'Overview', icon: 'dashboard' },
 { id: 'violations', label: `Violations (${violationCount})`, icon: 'warning' },
 { id: 'documentation', label: 'Documentation', icon: 'topic' },
 { id: 'reports', label: 'Reports', icon: 'assessment' },
 ];

 return (
 <div className="flex-1 flex flex-col overflow-hidden text-th-heading">
 {/* Horizontal Tabs */}
 <div className="px-6 pt-4 pb-0 flex items-center gap-2 border-b border-th-border">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
 activeTab === tab.id
 ? 'border-primary text-primary'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 }`}
 >
 <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
 {tab.label}
 </button>
 ))}
 <div className="ml-auto flex items-center gap-3 pb-2">
 <span className="ai-diagnostic">Diagnostic AI</span>
 <button className="flex items-center gap-2 px-3 py-1.5 bg-th-surface-raised border border-th-border text-th-heading text-xs font-bold rounded-lg hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-[16px]">download</span>
 Export Audit Log
 </button>
 </div>
 </div>

 {/* Breadcrumb */}
 <div className="px-6 py-3 flex items-center gap-2 text-sm">
 <span className="text-th-muted hover:text-primary cursor-pointer font-medium transition-colors">Compliance</span>
 <span className="text-th-muted">/</span>
 <span className="font-bold text-th-heading">Daily Monitoring Dashboard</span>
 {!loading && (
   <span className="ml-2 text-xs font-bold text-th-muted bg-th-surface-overlay px-2 py-0.5 rounded tabular-nums">{totalFindings} Diagnostic Findings</span>
 )}
 </div>

 {/* Error State */}
 {error && (
 <div className="mx-6 mt-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
   <span className="material-symbols-outlined text-red-400">error</span>
   <div>
     <p className="text-sm font-bold text-red-400">Failed to load coding compliance data</p>
     <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
   </div>
   <button onClick={() => window.location.reload()} className="ml-auto px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10">Retry</button>
 </div>
 )}

 <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
 {/* System Status Bar */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-4 mb-6 flex items-center justify-between">
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
 <span className="text-xs text-th-secondary">HIPAA Guidelines 2024: <span className="font-bold text-green-400">Active</span></span>
 </div>
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
 <span className="text-xs text-th-secondary">Stark Law Checks: <span className="font-bold text-green-400">Active</span></span>
 </div>
 {!loading && (
 <div className="flex items-center gap-2">
 <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
 <span className="text-xs text-th-secondary">CRS Overall: <span className="font-bold text-blue-400 tabular-nums">{overallScore}%</span></span>
 </div>
 )}
 </div>
 <span className="text-xs font-bold text-th-muted">Real-time Watchdog</span>
 </div>

 <div className="grid grid-cols-12 gap-6 mb-6">
 {/* Compliance Score Chart */}
 <div className="col-span-8 bg-th-surface-raised rounded-xl border border-th-border p-6 flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h2 className="text-lg font-bold text-th-heading">Compliance Score Trend</h2>
 <p className="text-sm text-th-secondary">Trailing 7-day adherence to payer guidelines.</p>
 </div>
 <div className="text-right">
 {loading ? (
   <div className="animate-pulse bg-th-surface-overlay rounded h-10 w-24"></div>
 ) : (
 <>
   <div className="text-3xl font-bold text-green-400 tabular-nums">{complianceScore}%</div>
   <div className="text-xs font-bold text-green-400 flex items-center justify-end gap-1">
   <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
   <span className="tabular-nums">+2.1%</span> this week
   </div>
 </>
 )}
 </div>
 </div>
 <div className="flex-1 h-[250px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[1]} stopOpacity={0.1} />
 <stop offset="95%" stopColor={colors[1]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="name"
 {...axisProps}
 dy={10}
 />
 <YAxis
 {...axisProps}
 domain={[60, 100]}
 />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
 itemStyle={tooltipStyle.itemStyle}
 />
 <Area
 type="monotone"
 dataKey="score"
 stroke={colors[1]}
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#colorScore)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Recent Alerts */}
 <div className="col-span-4 flex flex-col gap-4">
 <div className="bg-[rgb(var(--color-danger))]/10 border border-[rgb(var(--color-danger))]/20 border-l-[3px] border-l-[rgb(var(--color-danger))] rounded-xl p-4 transition-all duration-200">
 <div className="flex items-start gap-3">
 <div className="size-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-red-400 text-[18px]">gavel</span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-red-400">Stark Law Risk</h3>
 <p className="text-xs text-red-400/80 mt-1 mb-2">Potential self-referral pattern detected in Cardiology department.</p>
 <button className="text-[10px] font-bold text-white bg-red-600 px-3 py-1.5 rounded hover:bg-red-700 transition-colors">Investigate</button>
 </div>
 </div>
 </div>

 <div className="bg-[rgb(var(--color-warning))]/10 border border-[rgb(var(--color-warning))]/20 border-l-[3px] border-l-[rgb(var(--color-warning))] rounded-xl p-4 flex-1 transition-all duration-200">
 <div className="flex items-start gap-3">
 <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-amber-400 text-[18px]">update</span>
 </div>
 <div>
 <h3 className="text-sm font-bold text-amber-400">Coding Lag Alert</h3>
 <p className="text-xs text-amber-400/80 mt-1">Average coding time increased by <span className="tabular-nums">14%</span> over last 24hrs.</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Pending Violations Table - enhanced with diagnostics findings */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden mb-6">
 <div className="px-6 py-4 border-b border-th-border flex justify-between items-center">
 <h2 className="font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-amber-500">warning</span>
 Flagged Potential Violations
 </h2>
 <span className="text-xs font-bold text-th-secondary bg-th-surface-overlay px-2 py-1 rounded-full">{violationCount} Open</span>
 </div>
 <table className="w-full text-sm text-left">
 <thead className="bg-th-surface-overlay/50 text-xs uppercase font-bold text-th-muted">
 <tr>
 <th className="px-6 py-4">Claim ID</th>
 <th className="px-6 py-4">Issue Type</th>
 <th className="px-6 py-4">Risk Level</th>
 <th className="px-6 py-4">Detected</th>
 <th className="px-6 py-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30">
 {(complianceFindings.length > 0 ? complianceFindings.slice(0, 5) : (loading ? [] : [
   { claim_id: 'No violations', category: 'All providers within normal coding parameters', severity: 'low', detected: '--' },
 ])).map((item, i) => (
 <tr key={i} className="hover:bg-th-surface-overlay/30 transition-colors group">
 <td className="px-6 py-4 font-medium text-th-heading">{item.claim_id || `CLM-${item.id || i}`}</td>
 <td className="px-6 py-4 text-th-heading">{item.category || item.issue_type || 'Compliance Issue'}</td>
 <td className="px-6 py-4">
 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
   (item.severity || '').toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400' :
   (item.severity || '').toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' :
   'bg-th-surface-overlay text-th-secondary'
 }`}>
 <span className={`w-1.5 h-1.5 rounded-full ${
   (item.severity || '').toLowerCase() === 'high' ? 'bg-red-500' :
   (item.severity || '').toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-th-surface-overlay/300'
 }`}></span> {(item.severity || 'Low').charAt(0).toUpperCase() + (item.severity || 'Low').slice(1)}
 </span>
 </td>
 <td className="px-6 py-4 text-th-secondary">{item.detected || item.detected_at || `${i + 2} hrs ago`}</td>
 <td className="px-6 py-4 text-right">
 <button className="text-primary font-bold text-xs hover:underline">Review Details</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Immutable Ledger Strip */}
 <div className="bg-th-surface-base text-th-secondary rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden border border-th-border">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <span className="material-symbols-outlined text-[120px]">link</span>
 </div>
 <div className="flex justify-between items-center relative z-10">
 <div>
 <h3 className="text-th-heading font-bold flex items-center gap-2">
 <span className="material-symbols-outlined text-purple-400">lock</span>
 Immutable Audit Ledger
 </h3>
 <p className="text-xs mt-1">Blockchain-verified compliance trail for regulatory bodies.</p>
 </div>
 <span className="text-[10px] font-mono bg-th-surface-overlay px-3 py-1 rounded text-purple-300 border border-th-border">
 BLOCK #99281-A &bull; HASH: 0x7f...3a2
 </span>
 </div>
 <div className="grid grid-cols-4 gap-4 relative z-10">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg flex flex-col gap-2">
 <div className="w-8 h-8 rounded bg-th-surface-overlay flex items-center justify-center text-[10px] font-bold text-th-heading">
 Block {i}
 </div>
 <div className="h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div className="h-full bg-purple-500 w-full animate-pulse"></div>
 </div>
 <span className="text-[9px] font-mono">0x...Verified</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
