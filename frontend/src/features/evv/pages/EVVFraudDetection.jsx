import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const AI_BADGES = {
 descriptive: { label: 'Descriptive', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
 diagnostic: { label: 'Diagnostic', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
 predictive: { label: 'Predictive', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
 prescriptive: { label: 'Prescriptive', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

function AIBadge({ level }) {
 const badge = AI_BADGES[level];
 if (!badge) return null;
 return (
  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badge.color}`}>
   AI: {badge.label}
  </span>
 );
}

const FALLBACK_ANOMALIES = [
 { riskScore: 98, provider: 'Marcus Sterling', client: 'Martha W.', tag: 'Impossible Travel', tagIcon: 'flight_takeoff', tagColor: 'bg-red-500/10 text-red-400 border-red-500/20', status: 'PENDING AUDIT', statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
 { riskScore: 94, provider: 'Elena Rodriguez', client: 'Multiple Clients', tag: 'Ghost Billing', tagIcon: 'visibility_off', tagColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20', status: 'UNDER INVESTIGATION', statusColor: 'text-red-400 bg-red-500/10 border-red-500/20', highlighted: true },
 { riskScore: 72, provider: 'James K. Hall', client: 'Frank Miller', tag: 'Signature Forgery', tagIcon: 'draw', tagColor: 'bg-slate-700/30 text-th-secondary border-th-border', status: 'FLAGGED', statusColor: 'text-th-secondary bg-slate-700/30 border-th-border' },
];

export function EVVFraudDetection() {
 const [loading, setLoading] = useState(true);
 const [findings, setFindings] = useState([]);
 const [anomalies, setAnomalies] = useState(FALLBACK_ANOMALIES);
 const [diagnosticsSummary, setDiagnosticsSummary] = useState(null);
 const [crsSummary, setCrsSummary] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   try {
    const [findingsRes, diagSummary, crs] = await Promise.allSettled([
     api.diagnostics.getFindings({ severity: 'high' }),
     api.diagnostics.getSummary(),
     api.crs.getSummary(),
    ]);
    if (cancelled) return;

    // Process findings into anomalies for the table
    if (findingsRes.status === 'fulfilled' && findingsRes.value?.findings?.length > 0) {
     const mapped = findingsRes.value.findings.slice(0, 10).map((f, i) => ({
      riskScore: f.severity_score || f.risk_score || (90 - i * 5),
      provider: f.provider_name || f.entity || `Provider ${f.claim_id || ''}`,
      client: f.patient_name || f.patient_id || 'Unknown',
      tag: f.finding_type || f.category || f.description?.slice(0, 30) || 'Anomaly',
      tagIcon: f.finding_type?.includes('travel') ? 'flight_takeoff' : f.finding_type?.includes('ghost') ? 'visibility_off' : 'warning',
      tagColor: (f.severity_score || 0) > 80 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      status: f.status || 'FLAGGED',
      statusColor: f.status === 'investigating' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: f.description || null,
     }));
     setAnomalies(mapped);
     setFindings(findingsRes.value.findings);
    }

    if (diagSummary.status === 'fulfilled' && diagSummary.value) {
     setDiagnosticsSummary(diagSummary.value);
    }

    if (crs.status === 'fulfilled' && crs.value) {
     setCrsSummary(crs.value);
    }
   } catch (err) {
    console.error('Fraud detection load error:', err);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  return () => { cancelled = true; };
 }, []);

 const totalFindings = diagnosticsSummary?.total_findings || findings.length || 106;
 const reliabilityScore = crsSummary?.readiness_score ? (crsSummary.readiness_score / 100).toFixed(2) : '0.96';

 return (
  <div className="bg-th-surface-base font-sans h-full flex flex-col text-th-heading">
   {/* Header */}
   <header className="border-b border-th-border bg-th-surface-base/80 backdrop-blur-md sticky top-0 z-50">
    <div className="px-6 py-4 flex items-center justify-between">
     <div className="flex items-center space-x-4">
      <div className="bg-red-600/20 border border-red-600/30 p-1.5 rounded-lg">
       <span className="material-symbols-outlined text-red-500 text-2xl">security</span>
      </div>
      <div>
       <h1 className="text-xl font-bold tracking-tight text-th-heading uppercase">EVV Fraud & Anomaly Detection</h1>
       <div className="flex items-center text-xs text-th-secondary">
        <span className={`flex h-2 w-2 rounded-full mr-2 ${loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></span>
        AI Engine: {loading ? 'Loading...' : 'Active'} &bull; {totalFindings} Findings Monitored
       </div>
      </div>
     </div>
    </div>
   </header>

   <main className="flex-1 flex overflow-hidden">
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
     {/* Risk Heatmap (Top Section) */}
     <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Geographic Distribution */}
      <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl overflow-hidden min-h-[300px] h-[350px] flex flex-col">
       <div className="p-5 flex justify-between items-center border-b border-th-border">
        <div className="flex items-center gap-3">
         <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Geographic Distribution</h3>
         <AIBadge level="descriptive" />
        </div>
        <div className="flex space-x-2 text-[10px] items-center">
         <span className="bg-red-600/10 text-red-500 px-2 py-0.5 rounded border border-red-600/20">HOTSPOTS</span>
         <span className="bg-th-surface-raised text-th-secondary px-2 py-0.5 rounded border border-th-border uppercase">Regional Clusters</span>
        </div>
       </div>
       <div className="flex-1 p-5">
        <div className="h-full overflow-y-auto">
         <table className="w-full text-left text-sm border-separate border-spacing-0">
          <thead>
           <tr className="text-[10px] uppercase text-th-muted tracking-wider">
            <th className="px-3 py-2 border-b border-th-border/30 font-bold">Region</th>
            <th className="px-3 py-2 border-b border-th-border/30 font-bold">Anomalies</th>
            <th className="px-3 py-2 border-b border-th-border/30 font-bold">Risk Level</th>
            <th className="px-3 py-2 border-b border-th-border/30 font-bold">Trend</th>
           </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
           <tr className="hover:bg-th-surface-overlay/20 transition-colors">
            <td className="px-3 py-3 text-xs text-th-heading font-medium">Southeast (FL, GA, TX)</td>
            <td className="px-3 py-3 text-xs text-red-400 font-bold tabular-nums">42</td>
            <td className="px-3 py-3"><span className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">HIGH</span></td>
            <td className="px-3 py-3 text-xs text-red-400 flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_up</span>+8%</td>
           </tr>
           <tr className="hover:bg-th-surface-overlay/20 transition-colors">
            <td className="px-3 py-3 text-xs text-th-heading font-medium">Northeast (NY, NJ, PA)</td>
            <td className="px-3 py-3 text-xs text-amber-400 font-bold tabular-nums">28</td>
            <td className="px-3 py-3"><span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">MODERATE</span></td>
            <td className="px-3 py-3 text-xs text-th-secondary flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_flat</span>+1%</td>
           </tr>
           <tr className="hover:bg-th-surface-overlay/20 transition-colors">
            <td className="px-3 py-3 text-xs text-th-heading font-medium">Midwest (IL, OH, MI)</td>
            <td className="px-3 py-3 text-xs text-amber-400 font-bold tabular-nums">19</td>
            <td className="px-3 py-3"><span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">MODERATE</span></td>
            <td className="px-3 py-3 text-xs text-emerald-400 flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_down</span>-3%</td>
           </tr>
           <tr className="hover:bg-th-surface-overlay/20 transition-colors">
            <td className="px-3 py-3 text-xs text-th-heading font-medium">West Coast (CA, WA, OR)</td>
            <td className="px-3 py-3 text-xs text-th-heading font-bold tabular-nums">11</td>
            <td className="px-3 py-3"><span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LOW</span></td>
            <td className="px-3 py-3 text-xs text-emerald-400 flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_down</span>-5%</td>
           </tr>
           <tr className="hover:bg-th-surface-overlay/20 transition-colors">
            <td className="px-3 py-3 text-xs text-th-heading font-medium">Mountain/Plains (CO, AZ)</td>
            <td className="px-3 py-3 text-xs text-th-heading font-bold tabular-nums">6</td>
            <td className="px-3 py-3"><span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">LOW</span></td>
            <td className="px-3 py-3 text-xs text-emerald-400 flex items-center"><span className="material-symbols-outlined text-sm mr-1">trending_down</span>-2%</td>
           </tr>
          </tbody>
         </table>
        </div>
       </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-red-500 rounded-xl p-5 flex flex-col hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Risk Distribution</h3>
        <AIBadge level="diagnostic" />
       </div>
       <div className="flex-1 flex flex-col justify-center space-y-4">
        {(() => {
         const anomalyPct = diagnosticsSummary?.anomaly_rate ?? 3.5;
         const reviewPct = diagnosticsSummary?.review_rate ?? 12.5;
         const cleanPct = diagnosticsSummary?.clean_rate ?? 84;
         return (
          <>
           <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
             <span className="font-medium text-red-400">ANOMALY DETECTED</span>
             <span className="text-th-secondary tabular-nums">{anomalyPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700/30 rounded-full overflow-hidden">
             <div className="h-full bg-red-500 rounded-full" style={{ width: `${anomalyPct}%` }}></div>
            </div>
           </div>
           <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
             <span className="font-medium text-amber-400">NEEDS REVIEW</span>
             <span className="text-th-secondary tabular-nums">{reviewPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700/30 rounded-full overflow-hidden">
             <div className="h-full bg-amber-500 rounded-full" style={{ width: `${reviewPct}%` }}></div>
            </div>
           </div>
           <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
             <span className="font-medium text-blue-400">VERIFIED CLEAN</span>
             <span className="text-th-secondary tabular-nums">{cleanPct}%</span>
            </div>
            <div className="w-full h-2 bg-slate-700/30 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cleanPct}%` }}></div>
            </div>
           </div>
          </>
         );
        })()}
       </div>
       <div className="mt-4 pt-4 border-t border-th-border text-center">
        <span className="text-2xl font-black text-th-heading tabular-nums">{reliabilityScore}</span>
        <p className="text-[10px] text-th-muted uppercase tracking-tighter">System Reliability Score</p>
       </div>
      </div>
     </section>

     {/* Bottom Section: Table & Patterns */}
     <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Anomaly Detection Table */}
      <div className="lg:col-span-2 bg-th-surface-raised border border-th-border rounded-xl flex flex-col">
       <div className="p-5 border-b border-th-border flex justify-between items-center">
        <div className="flex items-center space-x-3">
         <span className="material-symbols-outlined text-amber-500">warning</span>
         <h3 className="font-bold text-th-heading">Active Anomalies Detected</h3>
         <AIBadge level="predictive" />
         {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></div>}
        </div>
        <div className="flex space-x-2">
         <button className="text-xs px-3 py-1 bg-slate-700/30 border border-th-border rounded hover:bg-th-surface-overlay transition-colors text-th-heading">EXPORT CSV</button>
        </div>
       </div>
       <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-separate border-spacing-0">
         <thead>
          <tr className="text-[10px] uppercase text-th-muted tracking-wider">
           <th className="px-5 py-3 border-b border-th-border/30 font-bold">Risk Score</th>
           <th className="px-5 py-3 border-b border-th-border/30 font-bold">Provider / Client</th>
           <th className="px-5 py-3 border-b border-th-border/30 font-bold">Detection Tag</th>
           <th className="px-5 py-3 border-b border-th-border/30 font-bold">Status</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-slate-700/30">
          {anomalies.map((row, i) => (
           <tr key={i} className={`hover:bg-th-surface-overlay/20 cursor-pointer transition-colors group ${row.highlighted ? 'bg-red-500/5' : ''}`}>
            <td className="px-5 py-4">
             <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold tabular-nums ${
               row.riskScore >= 90 ? 'border-red-500 text-red-400' : row.riskScore >= 70 ? 'border-amber-500 text-amber-400' : 'border-blue-500 text-blue-400'
              }`}>{row.riskScore}</div>
             </div>
            </td>
            <td className="px-5 py-4">
             <div className="font-semibold text-th-heading">{row.provider}</div>
             <div className="text-xs text-th-secondary italic">to {row.client}</div>
            </td>
            <td className="px-5 py-4">
             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${row.tagColor}`}>
              <span className="material-symbols-outlined text-[10px] mr-1">{row.tagIcon}</span> {row.tag}
             </span>
            </td>
            <td className="px-5 py-4">
             <span className={`text-[10px] font-bold px-2 py-1 rounded border ${row.statusColor}`}>{row.status}</span>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>

      {/* Pattern Analysis Node Chart */}
      <div className="bg-th-surface-raised border border-th-border rounded-xl flex flex-col">
       <div className="p-5 border-b border-th-border">
        <div className="flex items-center justify-between">
         <h3 className="font-bold text-th-heading">Provider-Client Collusion</h3>
         <AIBadge level="diagnostic" />
        </div>
        <p className="text-[10px] text-th-muted uppercase font-bold mt-1">Network Interaction Diagram</p>
       </div>
       <div className="flex-1 relative flex items-center justify-center p-4">
        <div className="absolute inset-0" style={{
         backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
         backgroundSize: '20px 20px',
         opacity: 0.2
        }}></div>
        <svg className="w-full h-full" viewBox="0 0 300 300">
         <line opacity="0.6" stroke="#ef4444" strokeWidth="2" x1="150" x2="80" y1="150" y2="80"></line>
         <line opacity="0.4" stroke="#ef4444" strokeWidth="2" x1="150" x2="220" y1="150" y2="80"></line>
         <line stroke="#64748b" strokeWidth="1" x1="150" x2="150" y1="150" y2="230"></line>
         <line stroke="#ef4444" strokeDasharray="4" strokeWidth="1" x1="80" x2="40" y1="80" y2="100"></line>
         <circle cx="150" cy="150" fill="#ef4444" r="14"></circle>
         <circle cx="80" cy="80" fill="#475569" r="10"></circle>
         <circle cx="220" cy="80" fill="#475569" r="10"></circle>
         <circle cx="150" cy="230" fill="#475569" r="10"></circle>
         <text fill="#94a3b8" fontSize="10" textAnchor="middle" x="150" y="180">SUSPECT</text>
        </svg>
       </div>
      </div>
     </section>
    </div>

    {/* Right Panel: AI Investigator Lab */}
    <aside className="w-96 border-l border-th-border bg-th-surface-raised/60 backdrop-blur-md overflow-y-auto hidden xl:block">
     <div className="p-6">
      <div className="flex items-center justify-between mb-8">
       <h2 className="text-lg font-bold text-th-heading">Investigator Lab</h2>
       <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-black rounded uppercase">Live Case</span>
      </div>
      {/* Case Header */}
      <div className="mb-8">
       <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-slate-700/30 border border-th-border rounded-lg flex items-center justify-center">
         <span className="material-symbols-outlined text-th-secondary">fingerprint</span>
        </div>
        <div>
         <h4 className="font-bold text-th-heading">{anomalies[0]?.provider || 'Elena Rodriguez'}</h4>
         <p className="text-xs text-th-muted tracking-wider font-medium">PROVIDER ID: 884-29-X</p>
        </div>
       </div>
       <div className="bg-red-500/5 border border-red-500/20 border-l-[3px] border-l-red-500 p-4 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
         <span className="text-[10px] font-bold text-red-400 uppercase">Anomaly Confidence</span>
         <span className="text-lg font-black text-red-400 tabular-nums">
          {anomalies[0]?.riskScore ? `${anomalies[0].riskScore}.2%` : '94.2%'}
         </span>
        </div>
        <div className="w-full h-1.5 bg-slate-700/30 rounded-full overflow-hidden">
         <div className="h-full bg-red-500 rounded-full" style={{ width: `${anomalies[0]?.riskScore || 94.2}%` }}></div>
        </div>
        <p className="text-[10px] text-th-secondary mt-2 leading-relaxed">
         {anomalies[0]?.description || 'AI detected overlapping GPS pings for Client 449 and Client 112 simultaneously at 14:02 EST. Physical distance between sites is 18 miles.'}
        </p>
       </div>
      </div>

      {/* Investigation Recommendations */}
      <div className="mb-6 p-4 bg-th-surface-base border border-th-border rounded-xl">
       <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Recommended Actions</span>
        <AIBadge level="prescriptive" />
       </div>
       <div className="space-y-2">
        <div className="flex items-start gap-2">
         <span className="material-symbols-outlined text-emerald-400 text-sm mt-0.5">check_circle</span>
         <span className="text-[11px] text-th-heading">Suspend billing for overlapping visit claims</span>
        </div>
        <div className="flex items-start gap-2">
         <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5">schedule</span>
         <span className="text-[11px] text-th-heading">Request GPS device logs for corroboration</span>
        </div>
        <div className="flex items-start gap-2">
         <span className="material-symbols-outlined text-amber-400 text-sm mt-0.5">schedule</span>
         <span className="text-[11px] text-th-heading">Cross-reference with client confirmation calls</span>
        </div>
        <div className="flex items-start gap-2">
         <span className="material-symbols-outlined text-th-muted text-sm mt-0.5">radio_button_unchecked</span>
         <span className="text-[11px] text-th-heading">Escalate to compliance officer if confirmed</span>
        </div>
       </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-6 border-t border-th-border">
       <button className="w-full py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold rounded-lg transition-colors flex items-center justify-center space-x-2">
        <span className="material-symbols-outlined text-sm">block</span>
        <span>SUSPEND BILLING</span>
       </button>
       <button className="w-full py-3 bg-slate-700/30 border border-th-border hover:bg-th-surface-overlay text-th-heading font-bold rounded-lg transition-colors flex items-center justify-center space-x-2">
        <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
        <span>FLAG FOR AUDIT</span>
       </button>
      </div>
     </div>
    </aside>
   </main>

   {/* Footer Stats */}
   <footer className="h-10 bg-th-surface-base border-t border-th-border px-6 flex items-center justify-between">
    <div className="flex space-x-8">
     <div className="flex items-center space-x-2">
      <span className="text-[10px] text-th-muted uppercase">System Latency:</span>
      <span className="text-[10px] text-green-500 font-bold tabular-nums">14ms</span>
     </div>
     <div className="flex items-center space-x-2">
      <span className="text-[10px] text-th-muted uppercase">Models Loaded:</span>
      <span className="text-[10px] text-th-heading font-bold">BERT-4, Custom-GPS v2.1</span>
     </div>
     <div className="flex items-center space-x-2">
      <span className="text-[10px] text-th-muted uppercase">Findings:</span>
      <span className="text-[10px] text-th-heading font-bold tabular-nums">{totalFindings}</span>
     </div>
    </div>
    <div className="text-[10px] text-th-muted font-bold uppercase tracking-widest">
     SECURE ACCESS SESSION
    </div>
   </footer>
  </div>
 );
}
