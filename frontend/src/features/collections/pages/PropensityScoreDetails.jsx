import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function PropensityScoreDetails() {
 const { accountId } = useParams();
 const navigate = useNavigate();
 const [details, setDetails] = useState(null);
 const [loading, setLoading] = useState(true);
 const [selectedScenario, setSelectedScenario] = useState(null);

 useEffect(() => {
   let cancelled = false;
   async function fetchData() {
     setLoading(true);
     const data = await api.collections.getPropensity(accountId);
     if (!cancelled) {
       setDetails(data);
       setLoading(false);
     }
   }
   fetchData();
   return () => { cancelled = true; };
 }, [accountId]);

 const getStatusColor = (status) => {
 switch (status) {
 case 'critical': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
 case 'moderate': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
 case 'good': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
 default: return 'bg-th-surface-overlay text-th-primary border-th-border ';
 }
 };

 const getScoreColor = (score) => {
 if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
 if (score >= 60) return 'text-blue-600 dark:text-blue-400';
 if (score >= 40) return 'text-amber-600 dark:text-amber-400';
 return 'text-red-600 dark:text-red-400';
 };

 const getImpactColor = (impact) => {
 if (impact > 0) return 'text-emerald-600 dark:text-emerald-400';
 if (impact < 0) return 'text-red-600 dark:text-red-400';
 return 'text-th-muted ';
 };

 if (loading) {
   return (
     <div className="flex-1 flex items-center justify-center h-full">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
     </div>
   );
 }

 if (!details) {
   return (
     <div className="flex-1 flex flex-col items-center justify-center h-full gap-4">
       <span className="material-symbols-outlined text-6xl text-th-muted">search_off</span>
       <p className="text-th-secondary">Propensity data not found or failed to load.</p>
       <button onClick={() => navigate(`/collections/account/${accountId}`)} className="px-4 py-2 bg-primary text-white rounded-lg">Back to Account</button>
     </div>
   );
 }

 return (
 <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
 <div className="max-w-[1600px] mx-auto px-10 py-8">
 {/* Breadcrumb */}
 <div className="flex items-center gap-2 text-sm text-th-muted mb-6">
 <button onClick={() => navigate('/collections')} className="hover:text-primary transition-colors">
 Collections Hub
 </button>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <button onClick={() => navigate(`/collections/account/${accountId}`)} className="hover:text-primary transition-colors">
 Account Details
 </button>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span className="text-th-heading font-medium">Propensity Score Details</span>
 </div>

 {/* Page Header */}
 <div className="flex justify-between items-end mb-8">
 <div>
 <h1 className="text-3xl font-black text-th-heading mb-2">Propensity Score Analysis</h1>
 <p className="text-th-muted ">
 Account {details?.accountId} • Model {details?.modelVersion} • Updated {new Date(details?.calculatedAt).toLocaleDateString()}
 </p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-white border border-th-border rounded-lg text-sm font-bold shadow-sm hover:bg-th-surface-overlay/30 transition-colors">
 <span className="material-symbols-outlined text-sm">refresh</span>
 Recalculate
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">file_download</span>
 Export Analysis
 </button>
 </div>
 </div>

 {/* Score Overview */}
 <div className="bg-gradient-to-br from-primary/10 to-blue-500/5 dark:from-primary/20 dark:to-blue-500/10 border border-primary/20 rounded-xl p-8 mb-8">
 <div className="grid grid-cols-4 gap-8">
 <div className="col-span-1">
 <p className="text-sm text-th-muted uppercase tracking-wider mb-2">Current Score</p>
 <p className={`text-6xl font-black tabular-nums ${getScoreColor(details?.currentScore)}`}>{details?.currentScore}</p>
 <p className="text-sm text-th-muted mt-2">{details?.scoreLabel}</p>
 </div>
 <div className="col-span-3">
 <p className="text-sm text-th-muted uppercase tracking-wider mb-4">Score History</p>
 <ResponsiveContainer width="100%" height={120}>
 <LineChart data={details?.scoreHistory || []}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#64748b" />
 <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#64748b" />
 <Tooltip
 content={({ active, payload }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-th-surface-base text-th-heading p-3 rounded-lg shadow-lg text-xs">
 <p className="font-bold">{payload[0].payload.event}</p>
 <p>Score: {payload[0].value}</p>
 <p className="text-th-secondary">{payload[0].payload.date}</p>
 </div>
 );
 }
 return null;
 }}
 />
 <Line
 type="monotone"
 dataKey="score"
 stroke="#3b82f6"
 strokeWidth={3}
 dot={{ fill: '#3b82f6', r: 4 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/20">
 <div className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-lg p-2">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Confidence Level</p>
 <p className="text-2xl font-black text-th-heading tabular-nums">{details?.confidence}%</p>
 </div>
 <div className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-lg p-2">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Model Version</p>
 <p className="text-2xl font-black text-th-heading tabular-nums">{details?.modelVersion}</p>
 </div>
 <div className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 rounded-lg p-2">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Last Calculated</p>
 <p className="text-2xl font-black text-th-heading tabular-nums">
 {new Date(details?.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>
 </div>

 {/* Feature Importance */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm mb-8">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
 <h3 className="text-lg font-black text-th-heading ">Feature Importance</h3>
 <span className="text-sm text-th-muted ml-2">
 Factors influencing the propensity score
 </span>
 </div>

 <div className="space-y-4">
 {(details?.featureImportance || []).map((feature, idx) => (
 <div key={idx} className="bg-th-surface-overlay/30 /50 rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-start justify-between mb-3">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-1">
 <h4 className="text-sm font-bold text-th-heading ">{feature.displayName}</h4>
 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(feature.status)}`}>
 {feature.status}
 </span>
 </div>
 <p className="text-xs text-th-muted ">{feature.description}</p>
 </div>
 <div className="text-right ml-4">
 <p className="text-xs text-th-muted mb-1">Current Value</p>
 <p className="text-lg font-black text-th-heading tabular-nums">
 {typeof feature.value === 'number' && feature.unit === 'rate'
 ? (feature.value * 100).toFixed(0) + '%'
 : typeof feature.value === 'number' && feature.unit === 'dollars'
 ? '$' + feature.value.toLocaleString()
 : feature.value + (feature.unit === 'days' ? 'd' : feature.unit === 'count' ? '' : '')}
 </p>
 {feature.benchmark !== 'N/A' && (
 <p className="text-xs text-th-muted mt-1">
 Benchmark: {typeof feature.benchmark === 'number' && feature.unit === 'rate'
 ? (feature.benchmark * 100).toFixed(0) + '%'
 : feature.benchmark}
 </p>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-xs text-th-muted mb-2">Importance to Model</p>
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-th-surface-overlay rounded-full h-2">
 <div
 className="bg-primary h-2 rounded-full"
 style={{ width: `${feature.importance * 100}%` }}
 ></div>
 </div>
 <span className="text-xs font-bold text-primary tabular-nums">
 {(feature.importance * 100).toFixed(0)}%
 </span>
 </div>
 </div>
 <div>
 <p className="text-xs text-th-muted mb-2">Impact on Score</p>
 <div className="flex items-center gap-2">
 <div className="flex-1 bg-th-surface-overlay rounded-full h-2">
 <div
 className={`h-2 rounded-full ${feature.impact > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
 style={{ width: `${Math.abs(feature.impact) * 5}%` }}
 ></div>
 </div>
 <span className={`text-xs font-bold tabular-nums ${getImpactColor(feature.impact)}`}>
 {feature.impact > 0 ? '+' : ''}{feature.impact} pts
 </span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* What-If Analysis */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm mb-8">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-primary text-2xl">science</span>
 <h3 className="text-lg font-black text-th-heading ">What-If Analysis</h3>
 <span className="text-sm text-th-muted ml-2">
 Explore how changes would impact the score
 </span>
 </div>

 <div className="grid grid-cols-3 gap-4">
 {(details?.whatIfScenarios || []).map((scenario, idx) => (
 <div
 key={idx}
 onClick={() => setSelectedScenario(idx)}
 className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedScenario === idx
 ? 'border-primary bg-primary/5'
 : 'border-th-border hover:border-primary/50'
 }`}
 >
 <div className="flex items-start justify-between mb-3">
 <h4 className="text-sm font-bold text-th-heading ">{scenario.scenario}</h4>
 <span className={`text-lg font-black tabular-nums ${getImpactColor(scenario.scoreDelta)}`}>
 {scenario.scoreDelta > 0 ? '+' : ''}{scenario.scoreDelta}
 </span>
 </div>

 {scenario.changes.map((change, cidx) => (
 <div key={cidx} className="mb-3">
 <div className="flex items-center gap-2 text-xs text-th-muted ">
 <span className="material-symbols-outlined text-xs">arrow_forward</span>
 <span>{change.feature}: {change.from} → {change.to}</span>
 </div>
 </div>
 ))}

 <div className="pt-3 border-t border-th-border ">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs text-th-muted ">New Score</span>
 <span className={`text-xl font-black tabular-nums ${getScoreColor(scenario.newScore)}`}>
 {scenario.newScore}
 </span>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-2 py-0.5 rounded text-xs font-bold ${scenario.feasibility === 'high'
 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
 : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
 }`}>
 {scenario.feasibility} feasibility
 </span>
 </div>
 <p className="text-xs text-th-muted mt-2">
 💡 {scenario.recommendation}
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Model Performance */}
 <div className="grid grid-cols-2 gap-6 mb-8">
 {/* Overall Metrics */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm">
 <h3 className="text-lg font-black text-th-heading mb-4">Model Performance Metrics</h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-th-surface-overlay/30 /50 rounded-lg p-4 border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Overall Accuracy</p>
 <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
 {(details?.modelMetrics?.overallAccuracy * 100).toFixed(0)}%
 </p>
 </div>
 <div className="bg-th-surface-overlay/30 /50 rounded-lg p-4 border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Precision</p>
 <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tabular-nums">
 {(details?.modelMetrics?.precision * 100).toFixed(0)}%
 </p>
 </div>
 <div className="bg-th-surface-overlay/30 /50 rounded-lg p-4 border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">Recall</p>
 <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tabular-nums">
 {(details?.modelMetrics?.recall * 100).toFixed(0)}%
 </p>
 </div>
 <div className="bg-th-surface-overlay/30 /50 rounded-lg p-4 border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-1">AUC Score</p>
 <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
 {(details?.modelMetrics?.auc * 100).toFixed(0)}%
 </p>
 </div>
 </div>
 </div>

 {/* Performance by Score Range */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm">
 <h3 className="text-lg font-black text-th-heading mb-4">Performance by Score Range</h3>
 <ResponsiveContainer width="100%" height={200}>
 <BarChart data={details?.modelMetrics?.performanceByScoreRange || []}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#64748b" />
 <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} stroke="#64748b" />
 <Tooltip
 formatter={(value) => (value * 100).toFixed(0) + '%'}
 contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
 />
 <Legend />
 <Bar dataKey="accuracy" fill="#10b981" name="Accuracy" />
 <Bar dataKey="precision" fill="#3b82f6" name="Precision" />
 <Bar dataKey="recall" fill="#8b5cf6" name="Recall" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Historical Predictions */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm mb-8">
 <h3 className="text-lg font-black text-th-heading mb-4">Historical Prediction Accuracy</h3>
 <div className="grid grid-cols-4 gap-4">
 {(details?.modelMetrics?.historicalPredictions || []).map((pred, idx) => (
 <div key={idx} className="bg-th-surface-overlay/30 /50 rounded-lg p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-xs text-th-muted uppercase tracking-wider mb-2">{pred.month}</p>
 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-sm text-th-muted ">Predicted:</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">
 ${(pred.predicted / 1000000).toFixed(2)}M
 </span>
 </div>
 <div className="flex items-baseline gap-2 mb-2">
 <span className="text-sm text-th-muted ">Actual:</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">
 ${(pred.actual / 1000000).toFixed(2)}M
 </span>
 </div>
 <div className="pt-2 border-t border-th-border ">
 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
 {(pred.accuracy * 100).toFixed(0)}% accurate
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Audit Trail */}
 <div className="bg-white dark:bg-card-dark border border-th-border rounded-xl p-6 shadow-sm">
 <div className="flex items-center gap-2 mb-4">
 <span className="material-symbols-outlined text-primary">history</span>
 <h3 className="text-lg font-black text-th-heading ">Audit Trail</h3>
 </div>

 <div className="space-y-3">
 {(details?.auditTrail || []).map((entry, idx) => (
 <div key={idx} className="flex gap-4 pb-3 border-b border-th-border-subtle last:border-0">
 <div className="flex flex-col items-center">
 <div className="w-2 h-2 rounded-full bg-primary"></div>
 {idx < (details?.auditTrail || []).length - 1 && (
 <div className="w-0.5 h-full bg-th-surface-overlay mt-2"></div>
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between mb-1">
 <h4 className="text-sm font-bold text-th-heading ">{entry.event}</h4>
 <span className="text-xs text-th-muted ">
 {new Date(entry.timestamp).toLocaleString()}
 </span>
 </div>
 <p className="text-xs text-th-muted mb-1">{entry.details}</p>
 <div className="flex items-center gap-4 text-xs">
 {entry.score && (
 <span className="text-th-muted ">
 Score: <span className="font-bold text-primary">{entry.score}</span>
 </span>
 )}
 {entry.modelVersion && (
 <span className="text-th-muted ">
 Model: <span className="font-bold">{entry.modelVersion}</span>
 </span>
 )}
 {entry.user && (
 <span className="text-th-muted ">
 By: <span className="font-bold">{entry.user}</span>
 </span>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
