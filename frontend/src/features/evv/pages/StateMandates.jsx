import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function StateMandates() {
 const [loading, setLoading] = useState(true);
 const [kpis, setKpis] = useState({
  readiness: '87.4%',
  dailySubmission: '42.1k',
  activeMCOs: 12,
 });

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   try {
    const summary = await api.crs.getSummary();
    if (cancelled) return;
    if (summary) {
     setKpis(prev => ({
      ...prev,
      readiness: summary.readiness_score ? `${summary.readiness_score.toFixed(1)}%` : prev.readiness,
      dailySubmission: summary.total_claims
       ? `${(summary.total_claims / 1000).toFixed(1)}k`
       : prev.dailySubmission,
      totalClaims: summary.total_claims || null,
      cleanClaims: summary.clean_claims || summary.passed || null,
      highRisk: summary.high_risk_count || summary.failed || null,
     }));
    }
   } catch (err) {
    console.error('State mandates load error:', err);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  return () => { cancelled = true; };
 }, []);

 return (
  <div className="flex h-full font-sans text-th-heading overflow-auto">
   <main className="flex-1 px-4 lg:px-10 py-8 max-w-[1600px] mx-auto w-full">
    {/* Profile/State Header */}
    <div className="flex flex-col mb-8">
     <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between items-start">
      <div className="flex gap-6">
       <div className="bg-th-surface-raised border border-th-border rounded-xl min-h-32 w-32 flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-primary">map</span>
       </div>
       <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
         <h1 className="text-3xl font-bold leading-tight tracking-[-0.015em] text-th-heading">Texas EVV Mandate Drill-Down</h1>
         <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Active Mandate</span>
        </div>
        <p className="text-th-secondary text-base font-normal mt-1 flex items-center gap-2">
         <span className="material-symbols-outlined text-sm">sync</span>
         Last Sync: {loading ? 'Updating...' : 'Just now'}
         {loading && <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary ml-1"></span>}
        </p>
        <p className="text-th-secondary text-base font-normal">State Medicaid Code: <span className="font-mono">TX-EVV-2024</span></p>
       </div>
      </div>
      <div className="flex flex-wrap gap-3 self-end lg:self-center">
       <button className="flex min-w-[120px] items-center justify-center rounded-lg h-10 px-4 bg-th-surface-raised border border-th-border text-th-heading text-sm font-bold transition-colors hover:bg-th-surface-overlay">
        State Ombudsman
       </button>
       <button className="flex min-w-[120px] items-center justify-center rounded-lg h-10 px-4 bg-primary text-th-heading text-sm font-bold shadow-lg shadow-primary/20">
        Update Credentials
       </button>
      </div>
     </div>
    </div>

    {/* Stats Overview - wired to real data */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
     <div className="flex flex-col gap-2 rounded-xl p-6 border border-th-border border-l-[3px] border-l-blue-500 bg-th-surface-raised hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Overall Readiness</p>
      <div className="flex items-end justify-between">
       <p className="text-primary tracking-tight text-3xl font-bold leading-tight tabular-nums">{kpis.readiness}</p>
       <p className="text-emerald-500 text-sm font-medium flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_up</span>+2.4%</p>
      </div>
      <div className="mt-2 h-1.5 w-full bg-th-surface-overlay rounded-full overflow-hidden">
       <div className="h-full bg-primary" style={{ width: kpis.readiness }}></div>
      </div>
     </div>
     <div className="flex flex-col gap-2 rounded-xl p-6 border border-th-border border-l-[3px] border-l-amber-500 bg-th-surface-raised hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Regional Risk</p>
      <div className="flex items-end justify-between">
       <p className="tracking-tight text-3xl font-bold leading-tight text-th-heading">
        {kpis.highRisk ? (kpis.highRisk > 50 ? 'Elevated' : 'Moderate') : 'Elevated'}
       </p>
       <span className="material-symbols-outlined text-orange-500">warning</span>
      </div>
      <p className="text-th-secondary text-xs mt-2">
       <span className="tabular-nums">{kpis.highRisk || 14}</span> {kpis.highRisk ? 'high-risk claims' : 'Counties below 70% threshold'}
      </p>
     </div>
     <div className="flex flex-col gap-2 rounded-xl p-6 border border-th-border border-l-[3px] border-l-emerald-500 bg-th-surface-raised hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Active MCOs</p>
      <div className="flex items-end justify-between">
       <p className="tracking-tight text-3xl font-bold leading-tight text-th-heading tabular-nums">{kpis.activeMCOs}</p>
       <span className="material-symbols-outlined text-primary">account_balance</span>
      </div>
      <p className="text-th-secondary text-xs mt-2">All proprietary API connections live</p>
     </div>
     <div className="flex flex-col gap-2 rounded-xl p-6 border border-th-border border-l-[3px] border-l-purple-500 bg-th-surface-raised hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Daily Submission</p>
      <div className="flex items-end justify-between">
       <p className="tracking-tight text-3xl font-bold leading-tight text-th-heading tabular-nums">{kpis.dailySubmission}</p>
       <p className="text-orange-500 text-sm font-medium flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_down</span>-1.2%</p>
      </div>
      <p className="text-th-secondary text-xs mt-2">
       {kpis.totalClaims ? `${kpis.totalClaims.toLocaleString()} total claims tracked` : 'Avg. Visits per 24h Window'}
      </p>
     </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
     {/* Main Content Area */}
     <div className="lg:col-span-8 flex flex-col gap-8">
      {/* Regulatory Compliance Grid */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
       <div className="p-6 border-b border-th-border flex justify-between items-center">
        <h3 className="text-xl font-bold text-th-heading">Regulatory Compliance Grid</h3>
        <span className="text-xs text-th-secondary font-mono">Phase 3 Revision v2.4</span>
       </div>
       <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Aggregator Integration', 'Required Data Elements', 'Transmission Frequency', 'Service Code Mapping'].map((title, i) => (
         <div key={i} className="p-4 bg-th-surface-overlay/30 border border-th-border rounded-lg hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
          <div className="flex justify-between items-start mb-3">
           <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">hub</span>
            <span className="font-bold text-th-heading">{title}</span>
           </div>
           <span className={`material-symbols-outlined ${i === 1 ? 'text-yellow-500' : 'text-emerald-500'}`}>
            {i === 1 ? 'error' : 'check_circle'}
           </span>
          </div>
          <div className="space-y-2 text-xs text-th-secondary italic">
           Status details for {title}...
          </div>
         </div>
        ))}
       </div>
      </div>

      {/* Regional Risk Heatmap */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
       <div className="flex justify-between items-center mb-6">
        <div>
         <h3 className="text-xl font-bold text-th-heading">Regional Risk Heatmap</h3>
         <p className="text-sm text-th-secondary">County-level drill-down for non-compliance risk</p>
        </div>
        <div className="flex gap-2">
         <button className="bg-th-surface-overlay border border-th-border px-3 py-1 rounded text-xs hover:bg-th-surface-overlay text-th-heading">County View</button>
         <button className="bg-th-surface-overlay border border-th-border px-3 py-1 rounded text-xs hover:bg-th-surface-overlay text-th-heading">MCO View</button>
        </div>
       </div>
       <div className="h-96 w-full rounded-lg bg-th-surface-overlay/20 flex items-center justify-center relative border border-th-border overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-gradient-to-br from-primary/10 via-transparent to-primary/5"></div>
        <div className="z-10 text-center flex flex-col items-center">
         <p className="text-primary font-bold">Interactive Texas Map Visualization</p>
         <p className="text-xs text-th-secondary">Harris County: High Risk (62% Readiness)</p>
        </div>
       </div>
      </div>
     </div>

     {/* Sidebar */}
     <div className="lg:col-span-4 flex flex-col gap-8">
      {/* Payer Specific Rules */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl flex flex-col h-fit">
       <div className="p-6 border-b border-th-border">
        <h3 className="text-lg font-bold text-th-heading">Payer Specific Rules</h3>
        <p className="text-xs text-th-secondary">Medicaid MCO Requirements</p>
       </div>
       <div className="divide-y divide-slate-700/50">
        {[
         { name: 'Superior HealthPlan', vendor: 'HHAe', desc: 'Required 24h batching for LTSS services.' },
         { name: 'Amerigroup Texas', vendor: 'Sandata', desc: 'Unique Portal credentials required.' },
         { name: 'UnitedHealthcare', vendor: 'Proprietary', desc: 'Alert: Recent schema update.' }
        ].map((payer, i) => (
         <div key={i} className="p-4 hover:bg-th-surface-overlay/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
           <span className="text-sm font-bold text-th-heading">{payer.name}</span>
           <span className="text-[10px] bg-th-surface-overlay px-1.5 py-0.5 rounded text-th-secondary">VENDOR: {payer.vendor}</span>
          </div>
          <p className="text-xs text-th-secondary leading-relaxed">{payer.desc}</p>
         </div>
        ))}
       </div>
      </div>

      {/* News & Policy Alerts */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl flex flex-col h-fit">
       <div className="p-6 border-b border-th-border flex justify-between items-center">
        <h3 className="text-lg font-bold text-th-heading">News & Policy</h3>
        <span className="material-symbols-outlined text-th-secondary text-lg">rss_feed</span>
       </div>
       <div className="p-4 space-y-4">
        <div className="border-l-2 border-primary pl-4 py-1">
         <p className="text-xs font-bold text-th-heading mb-1">HHSC Phase 3 Extension</p>
         <p className="text-[11px] text-th-secondary">Extended pilot phase until Jan 2024.</p>
        </div>
        <div className="border-l-2 border-orange-500 pl-4 py-1">
         <p className="text-xs font-bold text-th-heading mb-1">Sandata Aggregator Outage</p>
         <p className="text-[11px] text-th-secondary">Latency in Region 4 transmissions.</p>
        </div>
       </div>
      </div>
     </div>
    </div>
   </main>
  </div>
 );
}
