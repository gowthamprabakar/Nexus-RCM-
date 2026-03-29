import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const FALLBACK_VISIT = {
 serviceCode: 'H2014',
 serviceName: 'Personal Care',
 duration: '4.0 Hours Scheduled',
 client: { name: 'Sarah Johnson', id: '#7721-00', initials: 'SJ' },
 provider: { name: 'Michael Chen, CNA', license: 'TX-49221-C', initials: 'MC' },
 scheduled: { start: '08:00 AM', end: '12:00 PM', hours: 4.0 },
 actual: { start: '08:05 AM', end: '12:12 PM', hours: 4.12, delta: '+17m' },
 complianceScore: 85,
 status: 'Pending Review',
};

export function EVVVisitDetails() {
 const [visit, setVisit] = useState(FALLBACK_VISIT);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   try {
    // Load CRS summary to populate KPIs with real system data
    const summary = await api.crs.getSummary();
    if (!cancelled && summary) {
     setVisit(prev => ({
      ...prev,
      complianceScore: summary.readiness_score ? Math.round(summary.readiness_score) : prev.complianceScore,
      crsScore: summary.readiness_score || null,
      totalClaims: summary.total_claims || null,
     }));
    }
   } catch (err) {
    console.error('EVV Visit detail load error:', err);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  return () => { cancelled = true; };
 }, []);

 const displayId = 'EVV-2023-08-15-001';

 return (
  <div className="flex-1 overflow-y-auto font-sans h-full">
   <main className="max-w-[1440px] mx-auto px-6 py-6 font-sans">
    {/* Breadcrumbs */}
    <div className="flex items-center gap-2 mb-4">
     <a className="text-th-secondary text-sm font-medium hover:text-primary transition-colors" href="#">Visits</a>
     <span className="text-th-muted text-sm">/</span>
     <span className="text-th-heading text-sm font-medium">Visit Detail #{displayId}</span>
    </div>
    {/* Page Heading */}
    <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
     <div className="flex flex-col gap-1">
      <h1 className="text-th-heading text-3xl font-black leading-tight tracking-[-0.033em]">Visit Detail & Audit</h1>
      <div className="flex items-center gap-3">
       <p className="text-th-secondary text-sm">Visit ID: <span className="font-mono font-bold">{displayId}</span></p>
       {visit.crsScore && (
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
         CRS: {Math.round(visit.crsScore)}
        </span>
       )}
       <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
       <p className="text-amber-500 text-sm font-semibold">Status: {visit.status}</p>
       {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
      </div>
     </div>
     <div className="flex gap-3">
      <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold shadow-sm hover:bg-th-surface-overlay transition-colors text-th-heading">
       <span className="material-symbols-outlined text-[20px]">download</span>
       Export PDF
      </button>
      <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold shadow-sm hover:bg-th-surface-overlay transition-colors text-th-heading">
       <span className="material-symbols-outlined text-[20px]">history</span>
       Audit Log
      </button>
     </div>
    </div>
    {/* Layout Grid */}
    <div className="grid grid-cols-12 gap-6">
     {/* Left Panel: Visit Profile */}
     <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
      {/* Profile Card */}
      <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-4">Service Information</h3>
       <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
         <span className="material-symbols-outlined text-primary">medical_services</span>
         <div>
          <p className="text-sm font-bold text-th-heading">{visit.serviceName} ({visit.serviceCode})</p>
          <p className="text-xs text-th-secondary">Duration: {visit.duration}</p>
         </div>
        </div>
        <div className="border-t border-th-border pt-4">
         <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">CLIENT</p>
         <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-th-surface-overlay flex items-center justify-center font-bold text-th-secondary text-xs">{visit.client.initials}</div>
          <div>
           <p className="text-sm font-bold text-th-heading">{visit.client.name}</p>
           <p className="text-xs text-th-secondary">Member ID: {visit.client.id}</p>
          </div>
         </div>
        </div>
        <div className="border-t border-th-border pt-4">
         <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">PROVIDER</p>
         <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-th-surface-overlay flex items-center justify-center font-bold text-th-secondary text-xs">{visit.provider.initials}</div>
          <div>
           <p className="text-sm font-bold text-th-heading">{visit.provider.name}</p>
           <p className="text-xs text-th-secondary">License: {visit.provider.license}</p>
          </div>
         </div>
        </div>

        {/* Show CRS issues if available */}
        {visit.issues && visit.issues.length > 0 && (
         <div className="border-t border-th-border pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">CRS ISSUES</p>
          <div className="flex flex-col gap-2">
           {visit.issues.slice(0, 3).map((issue, i) => (
            <div key={i} className="text-xs p-2 rounded bg-amber-500/5 border border-amber-500/20 text-amber-400">
             {issue.description || issue.message || JSON.stringify(issue)}
            </div>
           ))}
          </div>
         </div>
        )}
       </div>
      </div>
      {/* Time Comparison Card */}
      <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-4">Time Tracking</h3>
       <div className="space-y-4">
        <div className="flex justify-between items-end">
         <div>
          <p className="text-xs text-th-secondary">Scheduled</p>
          <p className="text-sm font-bold text-th-heading">{visit.scheduled.start} - {visit.scheduled.end}</p>
         </div>
         <span className="text-xs font-medium text-th-muted tabular-nums">{visit.scheduled.hours} hrs</span>
        </div>
        <div className="flex justify-between items-end p-2 bg-th-surface-overlay/50 rounded-lg">
         <div>
          <p className="text-xs text-th-secondary">Actual (EVV)</p>
          <p className="text-sm font-bold text-th-heading">{visit.actual.start} - {visit.actual.end}</p>
         </div>
         <div className="text-right">
          <span className="text-[10px] font-bold text-red-500 block tabular-nums">{visit.actual.delta} Delta</span>
          <span className="text-xs font-medium text-th-heading tabular-nums">{visit.actual.hours} hrs</span>
         </div>
        </div>
        <div className="flex items-center gap-2 text-amber-500 bg-amber-900/10 p-2 rounded-lg text-xs font-medium">
         <span className="material-symbols-outlined text-[16px]">warning</span>
         Delta exceeds 15m threshold
        </div>
       </div>
      </div>
     </aside>
     {/* Center Panel: Geofencing & Validation */}
     <div className="col-span-12 xl:col-span-6 flex flex-col gap-6">
      {/* Map Container */}
      <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <div className="p-4 border-b border-th-border flex justify-between items-center">
        <div className="flex items-center gap-2">
         <span className="material-symbols-outlined text-primary">map</span>
         <h3 className="text-sm font-bold text-th-heading">Geofencing & Validation</h3>
        </div>
        <div className="flex gap-2">
         <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-[10px] font-bold rounded-full">IN-BOUNDS</span>
         <span className="ai-diagnostic">Diagnostic AI</span>
        </div>
       </div>
       <div className="relative h-[360px] bg-th-surface-base flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-th-surface-overlay opacity-50"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#137fec 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary border-dashed rounded-full bg-primary/5 flex items-center justify-center">
         <span className="text-[10px] font-bold text-primary uppercase bg-th-surface-raised px-1 rounded shadow-sm">Geofence Radius</span>
        </div>
        <div className="absolute top-[45%] left-[48%] flex flex-col items-center">
         <span className="material-symbols-outlined text-primary text-3xl drop-shadow-md">home</span>
        </div>
        <div className="absolute top-[52%] left-[55%] flex flex-col items-center">
         <span className="material-symbols-outlined text-green-500 text-2xl drop-shadow-md">location_on</span>
         <span className="text-[10px] bg-th-surface-raised text-th-heading px-1 font-bold rounded shadow-sm">Check-in</span>
        </div>
        <div className="absolute top-[40%] left-[42%] flex flex-col items-center">
         <span className="material-symbols-outlined text-green-500 text-2xl drop-shadow-md">location_on</span>
         <span className="text-[10px] bg-th-surface-raised text-th-heading px-1 font-bold rounded shadow-sm">Check-out</span>
        </div>
       </div>
       <div className="p-4 flex gap-6 text-xs text-th-secondary">
        <div className="flex items-center gap-1">
         <span className="w-3 h-3 rounded-full bg-primary"></span>
         Client Residence
        </div>
        <div className="flex items-center gap-1">
         <span className="w-3 h-3 rounded-full bg-green-500"></span>
         Provider Pings
        </div>
        <div className="flex items-center gap-1">
         <span className="w-3 h-3 rounded-full border-2 border-dashed border-primary"></span>
         300ft Compliance Radius
        </div>
       </div>
      </div>

      {/* Proof of Service */}
      <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-4">Proof of Service</h3>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-th-border rounded-lg p-4">
         <p className="text-xs font-semibold text-th-secondary mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">edit_note</span> Client Signature
         </p>
         <div className="h-24 bg-th-surface-overlay/50 rounded-md flex items-center justify-center overflow-hidden border border-dashed border-th-border">
          <span className="text-th-muted text-xs italic opacity-50 select-none">[Digital Signature Placeholder]</span>
         </div>
         <p className="text-[10px] text-right mt-1 text-th-muted italic font-mono">Timestamped: 12:15:02 PM CST</p>
        </div>
        <div className="border border-th-border rounded-lg p-4">
         <p className="text-xs font-semibold text-th-secondary mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">mic</span> Voice Verification
         </p>
         <div className="h-24 bg-th-surface-overlay/50 rounded-md p-3 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
           <button className="h-8 w-8 rounded-full bg-primary text-th-heading flex items-center justify-center hover:bg-blue-600 transition-colors">
            <span className="material-symbols-outlined text-[18px] fill-1">play_arrow</span>
           </button>
           <div className="flex-1 h-8 flex items-center gap-0.5 opacity-70">
            <div className="h-2 w-1 bg-primary rounded-full"></div>
            <div className="h-4 w-1 bg-primary/60 rounded-full"></div>
            <div className="h-6 w-1 bg-primary rounded-full"></div>
            <div className="h-3 w-1 bg-primary/40 rounded-full"></div>
            <div className="h-5 w-1 bg-primary rounded-full"></div>
            <div className="h-2 w-1 bg-primary rounded-full"></div>
            <div className="h-4 w-1 bg-primary/60 rounded-full"></div>
            <div className="h-6 w-1 bg-primary rounded-full"></div>
            <div className="h-3 w-1 bg-primary/40 rounded-full"></div>
           </div>
          </div>
          <p className="text-[10px] text-center text-th-secondary">Audio Match: <span className="tabular-nums">98.4%</span> Confidence</p>
         </div>
        </div>
       </div>
      </div>
     </div>
     {/* Right Panel: Audit Checklist */}
     <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
      <div className="bg-th-surface-raised border border-th-border rounded-xl flex flex-col h-full overflow-hidden">
       <div className="p-4 border-b border-th-border bg-th-surface-overlay/50">
        <h3 className="text-sm font-bold flex items-center gap-2 text-th-heading">
         <span className="material-symbols-outlined text-primary">fact_check</span>
         Cures Act Audit Checklist
        </h3>
       </div>
       <div className="p-4 flex-1 flex flex-col gap-3">
        {[
         { title: 'Type of Service', desc: `Verified: ${visit.serviceCode} ${visit.serviceName}` },
         { title: 'Individual Served', desc: `ID Match: ${visit.client.name} (${visit.client.id})` },
         { title: 'Date of Service', desc: 'Aug 15, 2023' },
         { title: 'Location of Service', desc: 'GPS In-Bounds (Within 300ft)' },
         { title: 'Individual Providing', desc: `Auth: ${visit.provider.name}` },
        ].map((item, i) => (
         <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-green-900/10 border border-green-800/20">
          <span className="material-symbols-outlined text-green-500 text-[20px]">check_circle</span>
          <div>
           <p className="text-xs font-bold text-green-400">{item.title}</p>
           <p className="text-[10px] text-green-500/70">{item.desc}</p>
          </div>
         </div>
        ))}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/10 border border-amber-800/20">
         <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
         <div className="flex-1">
          <p className="text-xs font-bold text-amber-400">Time In / Out</p>
          <p className="text-[10px] text-amber-500/70">Delta {visit.actual.delta}. Requires manual override.</p>
          <button className="mt-2 text-[10px] font-bold text-amber-400 underline uppercase hover:text-amber-300">Fix Warning</button>
         </div>
        </div>
       </div>
       <div className="p-4 border-t border-th-border bg-th-surface-overlay/50">
        <div className="flex flex-col gap-3">
         <div className="flex items-center justify-between">
          <p className="text-xs text-th-secondary">Compliance Score</p>
          <p className="text-sm font-black text-amber-500 tabular-nums">{visit.complianceScore}%</p>
         </div>
         <div className="w-full h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${visit.complianceScore}%` }}></div>
         </div>
         <button className="w-full py-3 bg-th-surface-overlay text-th-muted font-bold rounded-lg text-sm flex items-center justify-center gap-2 cursor-not-allowed group relative" disabled>
          <span className="material-symbols-outlined text-[18px]">lock</span>
          Submit for Billing
         </button>
         <p className="text-[10px] text-center text-th-muted">All 6 21st Century Cures Act elements must be validated.</p>
        </div>
       </div>
      </div>
     </aside>
    </div>
   </main>
   {/* Floating AI Audit Badge */}
   <div className="fixed bottom-6 right-6 z-10">
    <div className="bg-th-surface-raised border border-th-border text-th-heading px-4 py-2 rounded-full shadow-xl flex items-center gap-3">
     <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
     </span>
     <p className="text-xs font-bold uppercase tracking-widest">AI Audit Active</p>
    </div>
   </div>
  </div>
 );
}
