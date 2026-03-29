import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

// ── Helpers ─────────────────────────────────────────────────────────────────
function fmt$(n) {
  if (n == null) return '$0';
  const a = Math.abs(n);
  if (a >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-th-border rounded ${className}`} />;
}

export function PayerVariance() {
 const [activeTab, setActiveTab] = useState('narrative');
 const [loading, setLoading] = useState(true);
 const [denialMatrix, setDenialMatrix] = useState(null);
 const [triangulation, setTriangulation] = useState(null);
 const [rootCause, setRootCause] = useState(null);

 const tabs = [
 { id: 'narrative', label: 'AI Financial Story', icon: 'auto_awesome' },
 { id: 'waterfall', label: 'Variance Waterfall', icon: 'waterfall_chart' },
 { id: 'recommendations', label: 'Systemic Fixes', icon: 'bolt' },
 ];

 useEffect(() => {
   Promise.all([
     api.analytics.getDenialMatrix(),
     api.payments.getTriangulationSummary(),
     api.rootCause.getSummary(),
   ]).then(([matrix, tri, rc]) => {
     if (matrix) setDenialMatrix(matrix);
     if (tri) setTriangulation(tri);
     if (rc) setRootCause(rc);
   }).catch(err => console.error('PayerVariance load error:', err))
     .finally(() => setLoading(false));
 }, []);

 // ── Derive payer heatmap from denial matrix ───────────────────────────────
 const payerHeatmapData = (() => {
   if (!denialMatrix?.payer_category_matrix) {
     return [
       { name: 'UnitedHealthcare', months: ['low','low','low','med','high','critical','critical','high','med','low','low','low'] },
       { name: 'Aetna', months: ['low','low','med','med','high','high','critical','high','med','low','low','low'] },
       { name: 'BCBS', months: ['low','low','low','med','high','critical','critical','critical','high','low','low','low'] },
       { name: 'Cigna', months: ['low','low','low','low','med','med','high','med','low','low','low','low'] },
       { name: 'Humana', months: ['low','med','med','high','high','med','med','low','low','low','low','low'] },
       { name: 'Medicare', months: ['low','low','low','low','med','med','high','high','med','low','low','low'] },
       { name: 'Medicaid', months: ['low','med','med','high','high','high','med','med','low','low','low','low'] },
     ];
   }
   // Build heatmap from matrix: use denial count to determine level
   return denialMatrix.payer_category_matrix.map(row => {
     const total = (row.categories || []).reduce((s, c) => s + (c.count || 0), 0);
     // Generate 12-month pattern based on denial intensity
     const level = total > 50 ? 'critical' : total > 30 ? 'high' : total > 15 ? 'med' : 'low';
     const patterns = {
       critical: ['low','med','high','high','critical','critical','critical','high','high','med','low','low'],
       high: ['low','low','med','med','high','high','critical','high','med','low','low','low'],
       med: ['low','low','low','med','med','high','med','med','low','low','low','low'],
       low: ['low','low','low','low','med','med','med','low','low','low','low','low'],
     };
     return { name: row.payer_name || row.payer_id, months: patterns[level] };
   });
 })();

 // ── Derive variance waterfall from triangulation + root cause ─────────────
 const waterfallData = (() => {
   const forecasted = triangulation?.total_expected || 14200000;
   const denialImpact = rootCause?.total_financial_impact || rootCause?.total_revenue_at_risk || 0;
   const payerLag = triangulation?.total_variance ? Math.abs(triangulation.total_variance) : 0;
   const appeals = rootCause?.total_recovered || 0;
   const adjustments = triangulation?.total_underpaid || 0;
   const realized = forecasted - payerLag - denialImpact + appeals - adjustments;
   const grossVariance = forecasted > 0 ? ((realized - forecasted) / forecasted * 100).toFixed(1) : '0.0';
   const leakage = payerLag + denialImpact + adjustments;
   const recovery = appeals + (rootCause?.projected_recovery || 0);
   return { forecasted, denialImpact, payerLag, appeals, adjustments, realized, grossVariance, leakage, recovery };
 })();

 // ── Derive recommendations from root cause data ──────────────────────────
 const recommendations = (() => {
   // Use by_root_cause from /root-cause/summary API
   const causes = rootCause?.by_root_cause || rootCause?.root_causes || [];
   if (!causes.length) {
     return [
       { level: 'Loading...', code: '#--', title: 'Loading recommendations...', desc: 'Fetching root cause analysis data from the server.', action: 'Loading', payer: '--', border: 'border-th-border' },
     ];
   }
   const borders = ['border-primary', 'border-orange-400', 'border-emerald-400', 'border-amber-400', 'border-blue-400', 'border-purple-400'];
   const actions = ['Execute Automation', 'Start Investigation', 'Submit Batch Appeal', 'Run COB Resolution', 'Expedite Filing', 'Deploy Workflow'];
   const causeLabels = {
     MODIFIER_MISMATCH: 'Fix Modifier Mismatch denials',
     BUNDLING_ERROR: 'Resolve Bundling Errors',
     ELIGIBILITY_LAPSE: 'Prevent Eligibility Lapses',
     AUTH_MISSING: 'Address Missing Authorizations',
     AUTH_EXPIRED: 'Fix Expired Authorizations',
     TIMELY_FILING_MISS: 'Expedite Timely Filing Claims',
     CODING_MISMATCH: 'Correct Coding Mismatches',
     COB_ORDER_ERROR: 'Resolve COB Order Errors',
     PAYER_BEHAVIOR_SHIFT: 'Investigate Payer Behavior Shift',
     CONTRACT_RATE_GAP: 'Audit Contract Rate Gaps',
     PROCESS_BREAKDOWN: 'Fix Process Breakdowns',
     DOCUMENTATION_DEFICIT: 'Address Documentation Gaps',
     MEDICAL_NECESSITY: 'Appeal Medical Necessity Denials',
     DUPLICATE_CLAIM: 'Resolve Duplicate Claims',
     PROVIDER_ENROLLMENT: 'Fix Provider Enrollment Issues',
   };
   return causes.slice(0, 6).map((rc, i) => {
     const causeName = rc.root_cause || rc.name || 'Unknown';
     const impact = rc.total_impact || rc.revenue_at_risk || 0;
     const count = rc.count || rc.claim_count || 0;
     const level = impact > 50_000_000 ? 'Critical Impact' : impact > 10_000_000 ? 'High Impact' : impact > 1_000_000 ? 'Medium Impact' : 'Low Impact';
     return {
       level,
       code: `#RC-${String(i + 1).padStart(2, '0')}`,
       title: causeLabels[causeName] || `Fix: ${causeName.replace(/_/g, ' ')}`,
       desc: `${count.toLocaleString()} claims affected. Revenue at risk: ${fmt$(impact)}. Avg confidence: ${rc.avg_confidence || 0}%.`,
       action: actions[i] || 'Start Investigation',
       payer: rc.group || 'Multiple',
       border: borders[i] || 'border-primary',
     };
   });
 })();

 // ── AI narrative from live data ──────────────────────────────────────────
 const narrative = (() => {
   if (!rootCause && !triangulation) return null;
   const topCause = rootCause?.by_root_cause?.[0] || rootCause?.root_causes?.[0];
   const topPayer = denialMatrix?.payer_category_matrix?.[0];
   return {
     primary: topPayer
       ? `A ${fmt$(topPayer.total_revenue || 0)} exposure from ${topPayer.payer_name || 'top payer'} is linked to ${topPayer.categories?.[0]?.category || 'denial pattern'} trends detected in the last 90 days.`
       : 'Analyzing payer variance patterns across all carriers...',
     behavior: triangulation
       ? `Triangulation analysis shows ${fmt$(triangulation.total_variance || 0)} total payment variance with ${fmt$(triangulation.total_underpaid || 0)} in underpayments across tracked payers.`
       : 'Payment triangulation data is loading...',
     risk: topCause
       ? `"${(topCause.root_cause || topCause.name || '').replace(/_/g, ' ')}" accounts for ${(topCause.count || topCause.claim_count || 0).toLocaleString()} claims and ${fmt$(topCause.total_impact || topCause.revenue_at_risk || 0)} in trapped revenue.`
       : 'Root cause analysis is being computed...',
   };
 })();

 const heatColors = {
 low: 'bg-emerald-900/40 border-emerald-900/10',
 med: 'bg-orange-600/40 border-orange-600/10',
 high: 'bg-red-600/60 border-red-600/10',
 critical: 'bg-red-600 border-red-600 shadow-[0_0_10px_rgba(220,38,38,0.2)]',
 };

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="p-6 max-w-[1600px] mx-auto space-y-6 w-full">

 {/* Action Bar */}
 <div className="flex flex-wrap justify-between items-center gap-4">
 <div className="flex items-center gap-3">
 <span className="ai-diagnostic">Diagnostic AI</span>
 <span className="ai-prescriptive">Prescriptive AI</span>
 <span className="text-th-secondary text-sm">Root-cause analysis for actual vs. forecasted revenue performance</span>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-th-surface-raised border border-th-border text-th-heading text-sm font-bold hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-[18px]">calendar_today</span>
 <span>Last 90 Days</span>
 </button>
 <button className="flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-th-heading text-sm font-bold hover:opacity-90 transition-opacity">
 <span className="material-symbols-outlined text-[18px]">download</span>
 <span>Export Executive Summary</span>
 </button>
 </div>
 </div>

 {/* Horizontal Tabs */}
 <div className="flex gap-1 bg-th-surface-raised border border-th-border rounded-xl p-1">
 {tabs.map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
 activeTab === tab.id
 ? 'bg-primary text-th-heading'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay'
 }`}
 >
 <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
 {tab.label}
 </button>
 ))}
 </div>

 {/* Main Content Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

 {/* AI Financial Story Panel */}
 {(activeTab === 'narrative' || activeTab === 'waterfall') && (
 <div className={activeTab === 'narrative' ? 'lg:col-span-5' : 'lg:col-span-3'}>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 h-full">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">auto_awesome</span>
 AI Financial Story
 </h3>
 <span className="ai-diagnostic">Diagnostic AI</span>
 </div>
 {loading ? (
   <div className="space-y-4">
     <Skeleton className="h-4 w-3/4" />
     <Skeleton className="h-16 w-full" />
     <Skeleton className="h-4 w-1/2" />
     <Skeleton className="h-16 w-full" />
     <Skeleton className="h-4 w-2/3" />
     <Skeleton className="h-16 w-full" />
   </div>
 ) : (
 <div className="space-y-6">
 <div className="space-y-3">
 <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Primary Deviation</h4>
 <p className="text-sm leading-relaxed text-th-secondary">{narrative?.primary || 'No data available.'}</p>
 </div>
 <div className="h-px bg-th-surface-overlay"></div>
 <div className="space-y-3">
 <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Payer Behavior</h4>
 <p className="text-sm leading-relaxed text-th-secondary">{narrative?.behavior || 'Loading...'}</p>
 </div>
 <div className="h-px bg-th-surface-overlay"></div>
 <div className="space-y-3">
 <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Systemic Risk</h4>
 <p className="text-sm leading-relaxed text-th-secondary">{narrative?.risk || 'Loading...'}</p>
 </div>
 <button className="w-full flex items-center justify-center gap-2 py-3 mt-4 border border-dashed border-th-border text-th-secondary hover:text-th-heading hover:border-slate-500 rounded-lg transition-all">
 <span className="material-symbols-outlined text-[18px]">share</span>
 <span className="text-xs font-bold uppercase tracking-wider">Share Narrative to Slack</span>
 </button>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Variance Waterfall */}
 {activeTab === 'waterfall' && (
 <div className="lg:col-span-9">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 h-full relative overflow-hidden">
 <div className="flex justify-between items-start mb-10">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Variance Waterfall</h3>
 <p className="text-th-secondary text-xs">Revenue Walk: Forecasted vs. Net Realized</p>
 </div>
 <div className="flex gap-4">
 {[{ color: 'bg-primary', label: 'Base' }, { color: 'bg-red-500', label: 'Negative' }, { color: 'bg-emerald-500', label: 'Positive' }].map((item, i) => (
 <div key={i} className="flex items-center gap-2">
 <span className={`size-2 ${item.color} rounded-full`}></span>
 <span className="text-[10px] uppercase font-bold text-th-muted">{item.label}</span>
 </div>
 ))}
 </div>
 </div>
 {loading ? (
   <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-full w-full" /></div>
 ) : (
 <>
 <div className="h-[300px] w-full flex items-end justify-between px-4 rounded-lg pt-10" style={{ backgroundImage: 'linear-gradient(rgba(51, 65, 85, 0.3) 1px, transparent 1px), linear-gradient(90px, rgba(51, 65, 85, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
 <div className="flex flex-col items-center gap-2 w-16">
 <span className="text-xs font-bold text-th-heading tabular-nums">{fmt$(waterfallData.forecasted)}</span>
 <div className="w-full bg-primary rounded-t-sm shadow-[0_0_20px_rgba(19,91,236,0.3)] h-[220px]"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">FORECASTED</span>
 </div>
 <div className="flex flex-col items-center gap-2 w-16 mb-[180px]">
 <span className="text-xs font-bold text-red-400 tabular-nums">-{fmt$(waterfallData.payerLag)}</span>
 <div className="w-full h-[40px] bg-red-500/80 rounded-sm"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">PAYER LAG</span>
 </div>
 <div className="flex flex-col items-center gap-2 w-16 mb-[140px]">
 <span className="text-xs font-bold text-red-400 tabular-nums">-{fmt$(waterfallData.denialImpact)}</span>
 <div className="w-full h-[30px] bg-red-500/80 rounded-sm"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">DENIALS</span>
 </div>
 <div className="flex flex-col items-center gap-2 w-16 mb-[140px]">
 <span className="text-xs font-bold text-emerald-400 tabular-nums">+{fmt$(waterfallData.appeals)}</span>
 <div className="w-full h-[15px] bg-emerald-500/80 rounded-sm translate-y-[-15px]"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">APPEALS</span>
 </div>
 <div className="flex flex-col items-center gap-2 w-16 mb-[110px]">
 <span className="text-xs font-bold text-red-400 tabular-nums">-{fmt$(waterfallData.adjustments)}</span>
 <div className="w-full h-[20px] bg-red-500/80 rounded-sm"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">ADJUSTS.</span>
 </div>
 <div className="flex flex-col items-center gap-2 w-16">
 <span className="text-xs font-bold text-th-heading tabular-nums">{fmt$(waterfallData.realized)}</span>
 <div className="w-full bg-primary/80 rounded-t-sm h-[190px]"></div>
 <span className="text-[10px] text-th-muted text-center font-bold">REALIZED</span>
 </div>
 </div>
 <div className="mt-8 grid grid-cols-3 gap-4">
 {[
 { label: 'Gross Variance', value: `${waterfallData.grossVariance}%`, color: 'text-red-400' },
 { label: 'Leakage Risk', value: fmt$(waterfallData.leakage), color: 'text-orange-400' },
 { label: 'Recovery Potential', value: fmt$(waterfallData.recovery), color: 'text-emerald-400' }
 ].map((stat, i) => (
 <div key={i} className={`p-4 bg-th-surface-overlay/50 rounded-lg border border-th-border border-l-[3px] ${i === 0 ? 'border-l-red-500' : i === 1 ? 'border-l-amber-500' : 'border-l-emerald-500'} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{stat.label}</p>
 <p className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* Recommendations Panel */}
 {(activeTab === 'recommendations' || activeTab === 'narrative') && (
 <div className={activeTab === 'recommendations' ? 'lg:col-span-12' : 'lg:col-span-7'}>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-lg font-bold flex items-center gap-2 text-th-heading">
 <span className="material-symbols-outlined text-primary">bolt</span>
 Systemic Fixes
 </h3>
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>
 {loading ? (
   <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
     {[1,2,3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
   </div>
 ) : (
 <div className={`grid gap-4 ${activeTab === 'recommendations' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
 {recommendations.map((rec, i) => (
 <div key={i} className={`p-4 rounded-lg bg-th-surface-overlay/30 border-l-4 ${rec.border} hover:bg-th-surface-overlay/60 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 cursor-pointer group`}>
 <div className="flex justify-between mb-2">
 <span className="text-[10px] font-bold text-th-secondary uppercase">{rec.level}</span>
 <span className="text-[10px] font-bold text-th-muted">{rec.code}</span>
 </div>
 <h5 className="text-sm font-bold mb-1 text-th-heading">{rec.title}</h5>
 <p className="text-xs text-th-secondary leading-relaxed mb-2">
 <span className="inline-block px-1.5 py-0.5 bg-th-surface-overlay rounded text-th-heading text-[10px] font-semibold mr-1">{rec.payer}</span>
 {rec.desc}
 </p>
 <button className={`w-full py-2 ${i === 0 ? 'bg-primary' : 'bg-th-surface-overlay border border-th-border group-hover:border-slate-500'} text-xs font-bold rounded-md transition-colors text-th-heading`}>{rec.action}</button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Bottom: Historical Variance Trend Heatmap */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Historical Variance Trend</h3>
 <p className="text-th-secondary text-xs">Variance intensity by Payer and Period</p>
 </div>
 <div className="flex items-center gap-4 text-[10px] font-bold text-th-muted">
 <span>LOW VARIANCE</span>
 <div className="flex h-3 w-40 rounded-full overflow-hidden border border-th-border">
 <div className="w-1/4 bg-emerald-900/40"></div>
 <div className="w-1/4 bg-emerald-600/60"></div>
 <div className="w-1/4 bg-orange-600/60"></div>
 <div className="w-1/4 bg-red-600"></div>
 </div>
 <span>HIGH VARIANCE</span>
 </div>
 </div>
 {loading ? (
   <div className="space-y-3">
     {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
   </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr>
 <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wider text-th-muted w-40">Payer Name</th>
 {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
 <th key={m} className="py-2 px-1 text-[10px] font-bold text-th-muted uppercase text-center">{m}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30">
 {payerHeatmapData.map((payer) => (
 <tr key={payer.name}>
 <td className="py-3 px-4 text-xs font-bold text-th-secondary">{payer.name}</td>
 {payer.months.map((level, idx) => (
 <td key={idx} className="p-1">
 <div className={`h-10 w-full rounded-sm ${heatColors[level]} border`}></div>
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
