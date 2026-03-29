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

// Defaults used when API data is unavailable
const DEFAULT_STATS = { activeVisits: '1,284', gpsVerified: '1,142', criticalExceptions: 14, compliance: '98.4%' };

export function EVVDashboard() {
 const [filters, setFilters] = useState({
  caregiver: '',
  client: '',
  location: '',
  complianceStatus: '',
 });
 const [stats, setStats] = useState(DEFAULT_STATS);
 const [errorCategories, setErrorCategories] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   try {
    const [crsSummary, errCats] = await Promise.allSettled([
     api.crs.getSummary(),
     api.crs.getErrorCategories(),
    ]);
    if (cancelled) return;

    if (crsSummary.status === 'fulfilled' && crsSummary.value) {
     const s = crsSummary.value;
     setStats({
      activeVisits: s.total_claims?.toLocaleString() || DEFAULT_STATS.activeVisits,
      gpsVerified: s.clean_claims?.toLocaleString() || s.passed?.toLocaleString() || DEFAULT_STATS.gpsVerified,
      criticalExceptions: s.high_risk_count || s.failed || DEFAULT_STATS.criticalExceptions,
      compliance: s.readiness_score ? `${s.readiness_score.toFixed(1)}%` : DEFAULT_STATS.compliance,
      readinessScore: s.readiness_score || null,
      totalClaims: s.total_claims || null,
     });
    }

    if (errCats.status === 'fulfilled' && Array.isArray(errCats.value)) {
     // Find EVV-related error category
     const evvCat = errCats.value.find(c => c.id === 'evv' || c.label?.toLowerCase().includes('evv'));
     if (evvCat) {
      setStats(prev => ({
       ...prev,
       evvErrorCount: evvCat.count || 0,
      }));
     }
     setErrorCategories(errCats.value);
    }
   } catch (err) {
    console.error('EVV Dashboard load error:', err);
   } finally {
    if (!cancelled) setLoading(false);
   }
  }
  load();
  return () => { cancelled = true; };
 }, []);

 return (
  <div className="flex-1 flex flex-col overflow-hidden bg-th-surface-base font-sans h-full">
   {/* Filters Bar */}
   <div className="px-6 pt-5 pb-3 flex flex-wrap items-center gap-3">
    <span className="text-xs font-semibold uppercase tracking-wider text-th-muted mr-1">Filters:</span>
    <select
     value={filters.caregiver}
     onChange={(e) => setFilters({ ...filters, caregiver: e.target.value })}
     className="bg-th-surface-raised border border-th-border rounded-lg px-3 py-1.5 text-xs text-th-heading focus:outline-none focus:border-primary"
    >
     <option value="">All Caregivers</option>
     <option value="sarah">Sarah Jenkins</option>
     <option value="marcus">Marcus Thorne</option>
     <option value="elena">Elena Rodriguez</option>
     <option value="tom">Tom Harrison</option>
    </select>
    <select
     value={filters.client}
     onChange={(e) => setFilters({ ...filters, client: e.target.value })}
     className="bg-th-surface-raised border border-th-border rounded-lg px-3 py-1.5 text-xs text-th-heading focus:outline-none focus:border-primary"
    >
     <option value="">All Clients</option>
     <option value="robert">Robert D.</option>
     <option value="alice">Alice W.</option>
     <option value="john">John M.</option>
     <option value="linda">Linda K.</option>
    </select>
    <select
     value={filters.location}
     onChange={(e) => setFilters({ ...filters, location: e.target.value })}
     className="bg-th-surface-raised border border-th-border rounded-lg px-3 py-1.5 text-xs text-th-heading focus:outline-none focus:border-primary"
    >
     <option value="">All Locations</option>
     <option value="metro-north">Metro North</option>
     <option value="metro-south">Metro South</option>
     <option value="downtown">Downtown</option>
    </select>
    <select
     value={filters.complianceStatus}
     onChange={(e) => setFilters({ ...filters, complianceStatus: e.target.value })}
     className="bg-th-surface-raised border border-th-border rounded-lg px-3 py-1.5 text-xs text-th-heading focus:outline-none focus:border-primary"
    >
     <option value="">All Statuses</option>
     <option value="verified">Verified</option>
     <option value="warning">Warning</option>
     <option value="exception">Exception</option>
    </select>
    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 ml-2"></div>}
   </div>

   {/* Stats Header */}
   <div className="flex flex-wrap gap-4 px-6 pb-5 border-b border-th-border">
    <div className="flex min-w-[180px] flex-1 flex-col gap-1 bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Active Visits</p>
      <AIBadge level="descriptive" />
     </div>
     <div className="flex items-end justify-between">
      <p className="text-th-heading text-2xl font-black leading-none tabular-nums">{stats.activeVisits}</p>
      <p className="text-emerald-500 text-xs font-bold flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_up</span> 5.2%</p>
     </div>
    </div>
    <div className="flex min-w-[180px] flex-1 flex-col gap-1 bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">GPS Verified</p>
      <AIBadge level="descriptive" />
     </div>
     <div className="flex items-end justify-between">
      <p className="text-th-heading text-2xl font-black leading-none tabular-nums">{stats.gpsVerified}</p>
      <p className="text-emerald-500 text-xs font-bold flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_up</span> 3.1%</p>
     </div>
    </div>
    <div className="flex min-w-[180px] flex-1 flex-col gap-1 bg-th-surface-raised border border-red-500/20 border-l-[3px] border-l-red-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <p className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical Exceptions</p>
     <div className="flex items-end justify-between">
      <p className="text-red-500 text-2xl font-black leading-none tabular-nums">{stats.criticalExceptions}</p>
      <p className="text-red-400 text-xs font-bold flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_down</span> 12.4%</p>
     </div>
    </div>
    <div className="flex min-w-[180px] flex-1 flex-col gap-1 bg-th-surface-raised border border-primary/20 border-l-[3px] border-l-purple-500 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <p className="text-xs font-semibold uppercase tracking-wider text-primary">Org Compliance</p>
     <div className="flex items-end justify-between">
      <p className="text-primary text-2xl font-black leading-none tabular-nums">{stats.compliance}</p>
      <p className="text-emerald-500 text-xs font-bold flex items-center tabular-nums"><span className="material-symbols-outlined text-sm">trending_up</span> 0.8%</p>
     </div>
    </div>
   </div>

   {/* Dashboard Grid */}
   <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
    {/* Left: Visit Integrity Monitor Feed */}
    <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden">
     <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Live Visit Feed</h3>
      <div className="flex gap-1">
       <span className="material-symbols-outlined text-primary text-sm">fiber_manual_record</span>
       <span className="text-[10px] font-bold text-primary uppercase">Real-time</span>
      </div>
     </div>
     <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-700">
      {/* Visit Card 1 (Verified) */}
      <div className="p-3 rounded-lg bg-th-surface-raised border border-th-border hover:border-primary/50 transition-all cursor-pointer group">
       <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
         <span className="text-xs font-bold text-th-heading">Sarah Jenkins</span>
         <span className="text-[10px] text-th-secondary">Client: Robert D.</span>
        </div>
        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-0.5 rounded">VERIFIED</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="flex gap-1">
         <span className="material-symbols-outlined text-primary text-sm">location_on</span>
         <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
         <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
         <span className="text-[10px] font-bold text-th-heading">08:45 AM</span>
         <span className="text-[10px] text-th-secondary">Duration: 1h 12m</span>
        </div>
       </div>
      </div>
      {/* Visit Card 2 (GPS Mismatch) */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition-all cursor-pointer">
       <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
         <span className="text-xs font-bold text-th-heading">Marcus Thorne</span>
         <span className="text-[10px] text-th-secondary">Client: Alice W.</span>
        </div>
        <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded">GPS MISMATCH</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="flex gap-1">
         <span className="material-symbols-outlined text-red-500 text-sm">location_off</span>
         <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
         <span className="material-symbols-outlined text-th-muted text-sm">history_edu</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
         <span className="text-[10px] font-bold text-th-heading">09:12 AM</span>
         <span className="text-[10px] text-th-secondary">Delta: 0.18 miles</span>
        </div>
       </div>
      </div>
      {/* Visit Card 3 (Short Visit Warning) */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:border-amber-500 transition-all cursor-pointer">
       <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
         <span className="text-xs font-bold text-th-heading">Elena Rodriguez</span>
         <span className="text-[10px] text-th-secondary">Client: John M.</span>
        </div>
        <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded">SHORT VISIT</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="flex gap-1">
         <span className="material-symbols-outlined text-primary text-sm">location_on</span>
         <span className="material-symbols-outlined text-primary text-sm">signal_cellular_alt</span>
         <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
         <span className="text-[10px] font-bold text-th-heading">09:30 AM</span>
         <span className="text-[10px] text-amber-400 font-bold">25m (min: 30m)</span>
        </div>
       </div>
      </div>
      {/* Visit Card 4 (Exception) */}
      <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 hover:border-red-500 transition-all cursor-pointer">
       <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
         <span className="text-xs font-bold text-th-heading">Tom Harrison</span>
         <span className="text-[10px] text-th-secondary">Client: Linda K.</span>
        </div>
        <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded">NO CLOCK-OUT</span>
       </div>
       <div className="flex items-center gap-3">
        <div className="flex gap-1">
         <span className="material-symbols-outlined text-th-muted text-sm">location_off</span>
         <span className="material-symbols-outlined text-red-500 text-sm">signal_disconnected</span>
         <span className="material-symbols-outlined text-th-muted text-sm">history_edu</span>
        </div>
        <div className="ml-auto flex flex-col items-end">
         <span className="text-[10px] font-bold text-th-heading">Yest. 18:00</span>
         <span className="text-[10px] text-red-500 font-bold">MISSING DATA</span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Center: Map Widget */}
    <div className="col-span-12 lg:col-span-8 xl:col-span-6 flex flex-col gap-4 overflow-hidden">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
       <h3 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Active Map</h3>
       <div className="flex bg-th-surface-raised rounded-lg p-1 border border-th-border">
        <button className="px-3 py-1 rounded-md bg-th-surface-overlay text-[10px] font-bold text-primary shadow-sm">Pins</button>
        <button className="px-3 py-1 rounded-md text-[10px] font-bold text-th-muted hover:text-th-heading">Heatmap</button>
       </div>
      </div>
      <span className="text-xs text-th-secondary">Viewing: Greater Metro Area</span>
     </div>
     <div className="flex-1 bg-th-surface-raised/30 rounded-2xl relative overflow-hidden border border-th-border group h-[400px]">
      {/* Abstract Map Visualization */}
      <div className="absolute inset-0 bg-th-surface-base">
       <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(#13ecec 1px, transparent 1px)',
        backgroundSize: '20px 20px'
       }}></div>
      </div>

      {/* Map Pins */}
      <div className="absolute top-1/4 left-1/3">
       <div className="relative flex items-center justify-center">
        <div className="absolute h-8 w-8 bg-emerald-500/20 rounded-full animate-ping"></div>
        <span className="material-symbols-outlined text-emerald-500 text-3xl drop-shadow-lg">location_on</span>
       </div>
      </div>
      <div className="absolute top-1/2 right-1/4">
       <div className="relative flex items-center justify-center">
        <div className="absolute h-8 w-8 bg-primary/20 rounded-full animate-pulse"></div>
        <span className="material-symbols-outlined text-primary text-3xl drop-shadow-lg">location_on</span>
       </div>
      </div>
      <div className="absolute bottom-1/3 left-1/2">
       <div className="relative flex items-center justify-center">
        <div className="absolute h-8 w-8 bg-red-500/20 rounded-full animate-ping"></div>
        <span className="material-symbols-outlined text-red-500 text-3xl drop-shadow-lg">report</span>
       </div>
      </div>
      <div className="absolute top-1/3 right-1/2">
       <div className="relative flex items-center justify-center">
        <span className="material-symbols-outlined text-amber-500 text-3xl drop-shadow-lg">warning</span>
       </div>
      </div>

      {/* Map Overlay Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
       <button className="h-8 w-8 bg-th-surface-raised/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-th-border text-th-heading hover:text-primary">
        <span className="material-symbols-outlined">add</span>
       </button>
       <button className="h-8 w-8 bg-th-surface-raised/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-th-border text-th-heading hover:text-primary">
        <span className="material-symbols-outlined">remove</span>
       </button>
      </div>
      <div className="absolute top-4 left-4 p-3 bg-th-surface-raised/80 backdrop-blur-md rounded-xl border border-th-border">
       <p className="text-[10px] font-bold text-th-heading uppercase mb-2">Map Legend</p>
       <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
         <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
         <span className="text-[9px] text-th-heading">Verified Visit</span>
        </div>
        <div className="flex items-center gap-2">
         <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
         <span className="text-[9px] text-th-heading">GPS Warning (&gt;0.1 mi)</span>
        </div>
        <div className="flex items-center gap-2">
         <div className="h-2 w-2 bg-red-500 rounded-full"></div>
         <span className="text-[9px] text-th-heading">Critical Exception</span>
        </div>
       </div>
      </div>
     </div>
    </div>

    {/* Right: Exception Management */}
    <div className="col-span-12 xl:col-span-3 flex flex-col gap-4 overflow-hidden">
     <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
       <h3 className="text-xs font-semibold uppercase tracking-wider text-red-500">Action Required</h3>
       <AIBadge level="prescriptive" />
      </div>
      <button className="text-[10px] font-bold text-primary hover:underline">VIEW ALL {stats.criticalExceptions}</button>
     </div>
     <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
      {/* Exception Item 1 */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5 relative overflow-hidden group">
       <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
       <div className="flex flex-col">
        <div className="flex justify-between">
         <span className="text-xs font-black text-th-heading">Missing Client Signature</span>
         <span className="text-[10px] text-red-400 font-bold">HIGH RISK</span>
        </div>
        <p className="text-[10px] text-th-secondary mt-1">Provider: Tom Harrison &bull; Visit ID: #88219</p>
       </div>
       <p className="text-[11px] text-th-heading leading-relaxed">Mandatory state requirement for Medicare billing. Document not finalized at clock-out.</p>
       <div className="flex gap-2 mt-1">
        <button className="flex-1 py-1.5 bg-primary text-[#102222] text-[10px] font-bold rounded-md hover:bg-white transition-colors">RESOLVE</button>
        <button className="px-2 py-1.5 bg-transparent text-th-heading text-[10px] font-bold rounded-md border border-th-border-strong hover:border-primary transition-all">NOTIFY PROVIDER</button>
       </div>
      </div>
      {/* Exception Item 2 */}
      <div className="flex flex-col gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
       <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
       <div className="flex flex-col">
        <div className="flex justify-between">
         <span className="text-xs font-black text-th-heading">GPS Offset (0.22 mi)</span>
         <span className="text-[10px] text-amber-500 font-bold">WARNING</span>
        </div>
        <p className="text-[10px] text-th-secondary mt-1">Provider: Marcus Thorne &bull; Visit ID: #88310</p>
       </div>
       <p className="text-[11px] text-th-heading leading-relaxed">Clock-in location exceeds 0.1-mile geofence threshold per state mandate. Potential billing denial.</p>
       <div className="flex gap-2 mt-1">
        <button className="flex-1 py-1.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-md border border-amber-500/30 hover:bg-amber-500 hover:text-th-heading transition-all">MANUAL VERIFY</button>
       </div>
      </div>

      {/* Top Exception Reasons - wired from error categories */}
      <div className="p-4 rounded-xl bg-th-surface-raised border border-th-border hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Top Exception Reasons</p>
        <AIBadge level="diagnostic" />
       </div>
       <div className="flex flex-col gap-2">
        {errorCategories.length > 0 ? (
         errorCategories.slice(0, 5).map((cat, i) => (
          <div key={i} className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">{cat.label}</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">{cat.count || 0}</span>
          </div>
         ))
        ) : (
         <>
          <div className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">GPS Mismatch (&gt;0.1 mi)</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">38%</span>
          </div>
          <div className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">Missing Signature</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">24%</span>
          </div>
          <div className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">Short Visit (&lt;30m personal care)</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">19%</span>
          </div>
          <div className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">Clock-out Missing</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">12%</span>
          </div>
          <div className="flex justify-between items-center">
           <span className="text-[11px] text-th-heading">Other</span>
           <span className="text-[11px] font-bold text-th-heading tabular-nums">7%</span>
          </div>
         </>
        )}
       </div>
      </div>

      {/* Compliance Trend Card */}
      <div className="mt-auto p-4 rounded-xl bg-th-surface-raised border border-th-border hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
       <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Compliance Score Trend</p>
        <AIBadge level="predictive" />
       </div>
       <div className="h-16 w-full relative flex items-end gap-1">
        <div className="flex-1 bg-primary/20 h-10 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
        <div className="flex-1 bg-primary/20 h-12 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
        <div className="flex-1 bg-primary/20 h-8 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
        <div className="flex-1 bg-primary/20 h-14 rounded-t-sm hover:bg-primary transition-colors cursor-pointer"></div>
        <div className="flex-1 bg-primary/40 h-16 rounded-t-sm hover:bg-primary transition-colors cursor-pointer border-t-2 border-primary"></div>
        <div className="flex-1 bg-primary/10 h-[60px] rounded-t-sm border border-dashed border-primary/30 cursor-pointer" title="Forecast"></div>
        <div className="flex-1 bg-primary/10 h-[56px] rounded-t-sm border border-dashed border-primary/30 cursor-pointer" title="Forecast"></div>
       </div>
       <div className="flex justify-between mt-2">
        <span className="text-[9px] text-th-muted">Mon</span>
        <span className="text-[9px] text-th-muted">Tue</span>
        <span className="text-[9px] text-th-muted">Wed</span>
        <span className="text-[9px] text-th-muted">Thu</span>
        <span className="text-[9px] font-bold text-primary">Today</span>
        <span className="text-[9px] text-th-muted italic">Sat*</span>
        <span className="text-[9px] text-th-muted italic">Sun*</span>
       </div>
       <p className="text-[9px] text-th-muted mt-1 italic">* Forecast based on historical patterns</p>
      </div>
     </div>
    </div>
   </div>

   {/* Bottom Action Bar / KPIs */}
   <footer className="bg-th-surface-base border-t border-th-border px-6 py-2 flex items-center justify-between text-xs font-medium text-th-secondary">
    <div className="flex items-center gap-6">
     <div className="flex items-center gap-2">
      <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
      <span>{stats.gpsVerified} Claims Ready to Submit</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
      <span>{stats.criticalExceptions} Failed Validation</span>
     </div>
     <div className="flex items-center gap-2">
      <span className="h-2 w-2 bg-primary rounded-full"></span>
      <span>Average Review Time: 12m</span>
     </div>
    </div>
    <div className="flex items-center gap-4">
     <span className="material-symbols-outlined text-sm">terminal</span>
     <span>API V2.4.1-STABLE</span>
     <button className="bg-th-surface-raised border border-th-border text-th-heading px-3 py-1 rounded hover:bg-primary hover:text-[#102222] transition-all font-bold">EXPORT COMPLIANCE LOG</button>
    </div>
   </footer>
  </div>
 );
}
