import React, { useState, useEffect } from 'react';
import { api } from '../../../../services/api';

const FALLBACK_MODELS = [
 { label: 'Model Alpha', name: 'Denial Predictor', drift_score: 0.12, latency_ms: 45, status: 'HEALTHY', drift_change: '+0.02%', border: 'border-l-primary', statusBg: 'bg-primary/10 text-primary' },
 { label: 'Model Beta', name: 'Coding Agent', drift_score: 0.05, latency_ms: 120, status: 'STABLE', drift_change: '-0.01%', border: 'border-l-blue-500', statusBg: 'bg-primary/10 text-primary' },
 { label: 'Model Gamma', name: 'Revenue Forecaster', drift_score: 0.28, latency_ms: 80, status: 'CRITICAL DRIFT', drift_change: '+12.4%', border: 'border-l-red-500', statusBg: 'bg-red-500/20 text-red-500' },
];

const FALLBACK_FEATURES = [
 { name: 'Payer ID (Eligibility)', importance: 0.342, width: '82%' },
 { name: 'Total Claim Amount', importance: 0.211, width: '64%' },
 { name: 'ICD-10 Code Complexity', importance: 0.188, width: '52%' },
 { name: 'Facility Provider Rating', importance: 0.094, width: '28%' },
];

function getStatusStyle(status) {
 const s = (status || '').toUpperCase();
 if (s.includes('CRITICAL') || s.includes('DRIFT') || s.includes('ALERT')) return { border: 'border-red-500/50 border-l-red-500', badge: 'bg-red-500/20 text-red-500', driftColor: 'text-red-500', sparkBg: 'bg-red-50', sparkStroke: '#ff4d4d', shadow: 'shadow-[0_0_15px_rgba(255,77,77,0.1)]' };
 if (s.includes('HEALTHY') || s.includes('GOOD')) return { border: 'border-th-border border-l-primary', badge: 'bg-primary/10 text-primary', driftColor: 'text-primary', sparkBg: 'bg-th-surface-overlay', sparkStroke: '#13ecec', shadow: '' };
 return { border: 'border-th-border border-l-blue-500', badge: 'bg-primary/10 text-primary', driftColor: 'text-primary', sparkBg: 'bg-th-surface-overlay', sparkStroke: '#13ecec', shadow: '' };
}

export function AIModelOverview() {
 const [governance, setGovernance] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   setError(null);
   try {
    const data = await api.predictions.getModelGovernance();
    if (cancelled) return;
    setGovernance(data);
   } catch (err) {
    if (cancelled) return;
    setError(err.message);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  const interval = setInterval(load, 30000);
  return () => { cancelled = true; clearInterval(interval); };
 }, []);

 const models = governance?.models || governance?.model_status || FALLBACK_MODELS;
 const features = governance?.feature_importance || governance?.features || FALLBACK_FEATURES;
 const telemetryTs = governance?.timestamp || governance?.last_updated || new Date().toISOString();
 const cluster = governance?.cluster || governance?.environment || 'us-east-1-rcm-04';
 const psi = governance?.psi || governance?.population_stability_index || null;
 const accuracy = governance?.accuracy || governance?.accuracy_vs_truth || null;
 const retrainQueue = governance?.retraining_queue || governance?.retrain_jobs || null;

 return (
 <div className="space-y-6">
 {/* Page Heading */}
 <div className="flex flex-wrap items-end justify-between gap-4">
 <div>
 <h2 className="text-3xl font-black text-th-heading tracking-tight">AI Performance & Model Drift</h2>
 <p className="text-th-muted font-mono text-sm mt-1">
  Telemetry Live: {telemetryTs} // Cluster: {cluster}
  {error && <span className="text-amber-400 ml-3">API unavailable - showing cached data</span>}
 </p>
 </div>
 <div className="flex gap-2">
 <div className="bg-white border border-th-border rounded px-3 py-1 flex items-center gap-2 shadow-sm">
 <span className="text-[10px] text-th-muted uppercase font-bold">Refresh Rate:</span>
 <span className="text-xs font-mono text-primary font-bold">5s</span>
 </div>
 <button className="bg-primary text-[#0a1111] font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
 <span className="material-symbols-outlined text-sm">autorenew</span> Retrain All
 </button>
 </div>
 </div>

 {/* Model Health Grid */}
 {loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
   {[1,2,3].map(i => (
    <div key={i} className="bg-white border border-th-border p-5 rounded-xl shadow-sm animate-pulse h-44"></div>
   ))}
  </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {models.map((model, i) => {
  const fallback = FALLBACK_MODELS[i] || FALLBACK_MODELS[0];
  const modelName = model.name || model.model_name || fallback.name;
  const modelLabel = model.label || model.model_id || fallback.label;
  const driftScore = model.drift_score ?? model.psi ?? fallback.drift_score;
  const latency = model.latency_ms ?? model.latency ?? fallback.latency_ms;
  const status = model.status || (driftScore > 0.2 ? 'CRITICAL DRIFT' : driftScore < 0.1 ? 'HEALTHY' : 'STABLE');
  const driftChange = model.drift_change ?? model.drift_delta ?? fallback.drift_change;
  const style = getStatusStyle(status);
  return (
  <div key={modelLabel} className={`bg-white border ${style.border} border-l-[3px] p-5 rounded-xl shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${style.shadow}`}>
  <div className="flex justify-between items-start mb-4">
  <div>
  <p className="text-[11px] text-th-muted font-bold uppercase tracking-widest">{modelLabel}</p>
  <h3 className="text-lg font-bold text-th-heading">{modelName}</h3>
  </div>
  <span className={`${style.badge} text-[10px] font-bold px-2 py-1 rounded`}>{status}</span>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
  <p className="text-[10px] text-th-muted uppercase">Drift Score</p>
  <p className={`text-3xl font-mono font-bold tabular-nums ${style.driftColor}`}>{typeof driftScore === 'number' ? driftScore.toFixed(2) : driftScore}</p>
  </div>
  <div>
  <p className="text-[10px] text-th-muted uppercase">Latency</p>
  <p className="text-3xl font-mono font-bold text-th-heading tabular-nums">{latency}<span className="text-sm font-normal text-th-secondary">ms</span></p>
  </div>
  </div>
  <div className="mt-4 pt-4 border-t border-th-border-subtle flex items-center gap-3">
  <div className={`flex-1 h-8 ${style.sparkBg} rounded relative overflow-hidden`}>
  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 30">
  <path d={driftScore > 0.2 ? "M0 25 L20 20 L40 28 L60 15 L80 5 L100 2" : "M0 20 L10 18 L20 22 L30 15 L40 18 L50 12 L60 20 L70 15 L80 18 L90 10 L100 15"} fill="none" stroke={style.sparkStroke} strokeWidth="1.5"></path>
  </svg>
  </div>
  <span className={`text-[10px] font-mono tabular-nums ${style.driftColor}`}>{driftChange}</span>
  </div>
  </div>
  );
 })}
 </div>
 )}

 {/* Main Visualizations Grid */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* PSI Chart Section */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-th-border rounded-xl p-6 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Population Stability Index (PSI)</h3>
 <p className="text-sm text-th-muted">Aggregated feature drift across all production cohorts</p>
 </div>
 <div className="flex items-center gap-4 text-[11px] font-mono">
 <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-full"></span> PSI Value</div>
 <div className="flex items-center gap-1.5"><span className="w-3 h-3 border-t-2 border-dashed border-red-500"></span> Alert Threshold (0.2)</div>
 </div>
 </div>
 <div className="relative h-64 w-full bg-th-surface-overlay/30 rounded-lg p-4 border border-th-border-subtle">
 {/* Chart Placeholder / SVG */}
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
 <defs>
 <linearGradient id="psiGradient" x1="0%" x2="0%" y1="0%" y2="100%">
 <stop offset="0%" stopColor="#13ecec" stopOpacity="0.2"></stop>
 <stop offset="100%" stopColor="#13ecec" stopOpacity="0"></stop>
 </linearGradient>
 </defs>
 <line stroke="#ff4d4d" strokeDasharray="4" strokeWidth="1" x1="0" x2="800" y1="60" y2="60"></line>
 <path d="M0 160 Q 50 150, 100 170 T 200 140 T 300 165 T 400 130 T 500 145 T 600 70 T 700 50 T 800 45" fill="none" stroke="#13ecec" strokeWidth="2.5"></path>
 <path d="M0 160 Q 50 150, 100 170 T 200 140 T 300 165 T 400 130 T 500 145 T 600 70 T 700 50 T 800 45 L 800 200 L 0 200 Z" fill="url(#psiGradient)"></path>
 <circle className="animate-ping" cx="700" cy="50" fill="#ff4d4d" r="4"></circle>
 <circle cx="700" cy="50" fill="#ff4d4d" r="3"></circle>
 </svg>
 <div className="absolute left-1 top-0 bottom-0 flex flex-col justify-between text-[10px] text-th-secondary font-mono py-4">
 <span className="tabular-nums">0.40</span><span className="tabular-nums">0.30</span><span className="text-red-500 font-bold tabular-nums">0.20</span><span className="tabular-nums">0.10</span><span className="tabular-nums">0.00</span>
 </div>
 </div>
 <div className="flex justify-between mt-4 text-[10px] text-th-secondary font-mono px-6">
 <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>NOW</span>
 </div>
 </div>

 {/* Accuracy vs Ground Truth */}
 <div className="bg-white border border-th-border rounded-xl p-6 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <h3 className="text-lg font-bold text-th-heading">Accuracy vs. Ground Truth</h3>
 <div className="flex gap-4 text-[11px] font-mono">
 <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-primary"></span> Predicted Score</div>
 <div className="flex items-center gap-1.5"><span className="w-3 h-1 bg-slate-400"></span> Actual Outcome</div>
 </div>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="md:col-span-3 h-48 relative bg-th-surface-overlay/30 rounded-lg p-2 border border-th-border-subtle">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 150">
 <path d="M0 30 L50 35 L100 25 L150 40 L200 38 L250 45 L300 55 L350 70 L400 75 L450 80 L500 85 L600 90" fill="none" stroke="#13ecec" strokeWidth="2"></path>
 <path d="M0 35 L50 32 L100 28 L150 38 L200 42 L250 50 L300 65 L350 85 L400 95 L450 110 L500 120 L600 135" fill="none" stroke="currentColor" className="text-th-secondary" strokeOpacity="0.6" strokeWidth="2"></path>
 </svg>
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <div className="w-[1px] h-full bg-red-500/20 ml-[30%] relative">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-th-heading text-[9px] px-1 py-0.5 rounded uppercase font-bold">Divergence Detected</div>
 </div>
 </div>
 </div>
 <div className="flex flex-col justify-center border-l border-th-border pl-6 space-y-4">
 <div>
 <p className="text-[10px] text-th-muted uppercase">RMSE Delta</p>
 <p className="text-xl font-mono font-bold text-red-500 tabular-nums">{accuracy?.rmse_delta != null ? (accuracy.rmse_delta > 0 ? '+' : '') + accuracy.rmse_delta.toFixed(3) : '+0.142'}</p>
 </div>
 <div>
 <p className="text-[10px] text-th-muted uppercase">Confidence</p>
 <p className="text-xl font-mono font-bold text-th-heading tabular-nums">{accuracy?.confidence != null ? `${accuracy.confidence}%` : '82.4%'}</p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right Sidebar: Retraining Queue */}
 <div className="space-y-6">
 <div className="bg-white border border-th-border rounded-xl flex flex-col h-full min-h-[500px] shadow-sm">
 <div className="p-6 border-b border-th-border">
 <h3 className="text-lg font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">dynamic_feed</span>
 Retraining Queue
 </h3>
 </div>
 <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
 {(retrainQueue && retrainQueue.length > 0 ? retrainQueue : [
  { name: 'MODEL ALPHA V2.4', progress: 88, status: 'running', message: 'Validating Feature Weights...' },
  { name: 'Denial Predictor v1.9', progress: 0, status: 'waiting', message: 'Scheduled for 02:00 UTC' },
  { name: 'Revenue Forecaster Patch', progress: null, status: 'queued', message: 'Manual review required' },
 ]).map((job, i) => {
  const jobStatus = (job.status || '').toLowerCase();
  const isActive = jobStatus === 'running' || jobStatus === 'training' || jobStatus === 'active';
  const progress = job.progress ?? job.percent ?? null;
  return (
  <div key={job.name || i} className={`bg-th-surface-overlay/30 border border-th-border rounded-lg p-4 ${!isActive ? 'opacity-70' : ''}`}>
  <div className="flex justify-between mb-2">
  <span className={`text-xs font-bold uppercase ${isActive ? 'text-primary' : 'text-th-heading'}`}>{job.name || job.model_name || `Job ${i+1}`}</span>
  <span className="text-[10px] font-mono text-th-muted tabular-nums">{progress != null ? `${progress}%` : (job.status || 'QUEUED').toUpperCase()}</span>
  </div>
  {progress != null && (
  <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden mb-3">
  <div className={`h-full ${isActive ? 'bg-primary' : 'bg-th-surface-overlay'}`} style={{ width: `${progress}%` }}></div>
  </div>
  )}
  <div className="flex items-center gap-2 text-[10px] text-th-muted mt-1">
  <span className="material-symbols-outlined text-sm">{isActive ? 'sync' : jobStatus === 'queued' ? 'priority_high' : 'schedule'}</span>
  {job.message || job.description || job.status || '--'}
  </div>
  {jobStatus === 'queued' && (
  <button className="mt-3 w-full py-1.5 bg-th-surface-overlay rounded text-[10px] font-bold hover:bg-slate-300 transition-colors text-th-primary">REVIEW DATASET</button>
  )}
  </div>
  );
 })}
 </div>
 <div className="p-4 bg-primary/5 border-t border-th-border">
 <p className="text-[10px] text-th-muted text-center mb-3">Worker Nodes Active: {governance?.worker_nodes || '14/16'}</p>
 <button className="w-full py-2 bg-th-surface-overlay text-th-heading rounded font-bold text-sm border border-th-border hover:border-primary/50 transition-all">MANAGE PIPELINES</button>
 </div>
 </div>
 </div>
 </div>

 {/* Feature Importance Bar Chart */}
 <div className="bg-white border border-th-border rounded-xl p-6 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Current Feature Importance</h3>
 <p className="text-sm text-th-muted">Top drivers influencing model decisions in last 24h</p>
 </div>
 <select className="bg-th-surface-overlay border-none text-[11px] font-bold text-th-heading rounded cursor-pointer ring-1 ring-slate-200 focus:ring-primary px-3 py-1">
 <option>All Models</option>
 <option>Denial Predictor</option>
 <option>Coding Agent</option>
 </select>
 </div>
 <div className="space-y-4">
 {features.map((feat, i) => {
  const maxImportance = features.reduce((m, f) => Math.max(m, f.importance || f.value || 0), 0);
  const importance = feat.importance ?? feat.value ?? 0;
  const widthPct = feat.width || (maxImportance > 0 ? `${Math.round((importance / maxImportance) * 100)}%` : '0%');
  const opacityLevels = [1, 0.8, 0.6, 0.4, 0.3];
  const opacity = opacityLevels[Math.min(i, opacityLevels.length - 1)];
  return (
  <div key={feat.name || i} className="space-y-2">
  <div className="flex justify-between text-[11px] font-mono">
  <span className="text-th-heading">{feat.name || feat.feature_name || `Feature ${i+1}`}</span>
  <span className="text-primary font-bold tabular-nums">{typeof importance === 'number' ? importance.toFixed(3) : importance}</span>
  </div>
  <div className="w-full h-3 bg-th-surface-overlay rounded-sm overflow-hidden">
  <div className="h-full bg-primary" style={{ width: widthPct, opacity, boxShadow: i === 0 ? '0 0 10px rgba(19,236,236,0.3)' : 'none' }}></div>
  </div>
  </div>
  );
 })}
 </div>
 </div>
 </div>
 );
}
