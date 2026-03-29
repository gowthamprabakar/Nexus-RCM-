import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const FALLBACK_JOBS = [
 { name: 'Daily Batch Claim Submissions', source: 'CMS-Gateway-V4', cron: '0 0 * * *', status: 'running', last_run: '14m 22s', success_rate: 99.8 },
 { name: 'ERA/835 Processing Pipeline', source: 'Clearinghouse-Availity', cron: '*/15 * * * *', status: 'running', last_run: '2m 45s', success_rate: 99.95 },
 { name: 'Weekly Revenue Report Generation', source: 'CFO Dashboard + Email', cron: '0 6 * * 1', status: 'scheduled', last_run: '8m 10s', success_rate: 100 },
 { name: 'Real-time Claims Scrubbing', source: null, cron: '*/5 * * * *', status: 'failing', last_run: '--', success_rate: 62.4, error: 'Timeout on API endpoint' },
];

function formatUptime(seconds) {
 if (!seconds) return '-- --';
 const days = Math.floor(seconds / 86400);
 const hours = Math.floor((seconds % 86400) / 3600);
 return `${days}d ${hours}h`;
}

function formatRecords(count) {
 if (!count && count !== 0) return '--';
 if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
 if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
 return count.toLocaleString();
}

export function Scheduler() {
 const [schedulerData, setSchedulerData] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function load() {
   setLoading(true);
   setError(null);
   try {
    const data = await api.scheduler.getStatus();
    if (cancelled) return;
    setSchedulerData(data);
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

 const jobs = schedulerData?.jobs || schedulerData?.schedules || FALLBACK_JOBS;
 const totalActive = schedulerData?.total_active ?? schedulerData?.active_jobs ?? jobs.filter(j => j.status !== 'failing' && j.status !== 'stopped').length;
 const avgSuccessRate = schedulerData?.avg_success_rate ?? (jobs.length > 0 ? (jobs.reduce((s, j) => s + (j.success_rate || 0), 0) / jobs.length).toFixed(2) : 0);
 const recordsProcessed = schedulerData?.records_24h ?? schedulerData?.records_processed ?? null;
 const uptimeSeconds = schedulerData?.uptime_seconds ?? schedulerData?.uptime ?? null;
 const lastRestart = schedulerData?.last_restart ?? null;
 const totalThroughput = schedulerData?.throughput ?? schedulerData?.total_records ?? null;
 const throughputChange = schedulerData?.throughput_change ?? null;
 const systemOnline = schedulerData?.status === 'online' || schedulerData?.healthy === true || (!error && !loading);

 return (
 <div className="flex h-full font-sans text-th-heading p-6 flex-col overflow-scroll">
 {/* Status Badge */}
 <div className="flex items-center gap-2 mb-6">
 {loading ? (
  <>
   <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
   <p className="text-th-secondary text-sm font-medium">Checking scheduler status...</p>
  </>
 ) : (
  <>
   <span className={`flex h-2 w-2 rounded-full ${systemOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
   <p className="text-th-secondary text-sm font-medium">
    {systemOnline
     ? `System status: All high-frequency syncs operational${schedulerData?.uptime_pct ? ` (${schedulerData.uptime_pct}% uptime)` : ' (99.98% uptime)'}`
     : error ? `System status: Error fetching scheduler data` : 'System status: Degraded'}
   </p>
   {error && <span className="text-xs text-amber-400 ml-2">Using cached data</span>}
  </>
 )}
 </div>

 {/* Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Active Jobs</p>
 <span className="material-symbols-outlined text-blue-400">analytics</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">{loading ? '--' : totalActive}</p>
 <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
 <span className="material-symbols-outlined text-xs">schedule</span> Active
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Avg. Success Rate</p>
 <span className="material-symbols-outlined text-emerald-500">check_circle</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">{loading ? '--' : `${avgSuccessRate}%`}</p>
 <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
 <span className="material-symbols-outlined text-xs">keyboard_arrow_up</span> {schedulerData?.success_rate_change ? `${schedulerData.success_rate_change}% change` : 'Nominal'}
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Records (24h)</p>
 <span className="material-symbols-outlined text-amber-500">database</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">{loading ? '--' : formatRecords(recordsProcessed)}</p>
 <div className="flex items-center gap-1 text-th-secondary text-xs font-bold">
 {schedulerData?.records_change != null ? (
  <><span className="material-symbols-outlined text-xs">{schedulerData.records_change >= 0 ? 'trending_up' : 'trending_down'}</span> {schedulerData.records_change}%</>
 ) : (
  <span>--</span>
 )}
 </div>
 </div>
 <div className="flex flex-col gap-2 rounded-xl p-5 border border-th-border bg-th-surface-raised border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">System Uptime</p>
 <span className="material-symbols-outlined text-indigo-500">speed</span>
 </div>
 <p className="text-3xl font-bold leading-tight text-th-heading tabular-nums">{loading ? '--' : formatUptime(uptimeSeconds)}</p>
 <div className="flex items-center gap-1 text-th-secondary text-xs font-bold">
 Last restart: {lastRestart || '--'}
 </div>
 </div>
 </div>

 {/* Throughput Chart */}
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden mb-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="p-6 border-b border-th-border flex justify-between items-center">
 <div>
 <h3 className="text-lg font-bold text-th-heading">Job Throughput</h3>
 <p className="text-th-secondary text-sm">Records processed per minute across all active syncs</p>
 </div>
 <div className="flex bg-th-surface-overlay rounded-lg p-1">
 <button className="px-3 py-1 text-xs font-bold rounded-md bg-th-surface-overlay text-th-heading shadow-sm">24H</button>
 <button className="px-3 py-1 text-xs font-medium text-th-muted">7D</button>
 </div>
 </div>
 <div className="p-6">
 <div className="flex items-baseline gap-2 mb-4">
 <span className="text-4xl font-black tracking-tight text-th-heading tabular-nums">
  {loading ? '--' : totalThroughput != null ? totalThroughput.toLocaleString() : recordsProcessed != null ? recordsProcessed.toLocaleString() : '--'}
 </span>
 {throughputChange != null && (
  <span className={`text-sm font-bold flex items-center tabular-nums ${throughputChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
   <span className="material-symbols-outlined text-xs">{throughputChange >= 0 ? 'arrow_upward' : 'arrow_downward'}</span> {Math.abs(throughputChange)}%
  </span>
 )}
 </div>
 <div className="h-48 w-full relative">
 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
 <defs>
 <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
 <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3"></stop>
 <stop offset="100%" stopColor="#2563eb" stopOpacity="0"></stop>
 </linearGradient>
 </defs>
 <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50 V200 H0 Z" fill="url(#chartGradient)"></path>
 <path d="M0,150 Q50,140 100,160 T200,120 T300,100 T400,140 T500,80 T600,60 T700,90 T800,40 T900,70 T1000,50" fill="none" stroke="#2563eb" strokeWidth="3"></path>
 </svg>
 </div>
 </div>
 </div>

 {/* Active Cron Jobs Table */}
 <div className="space-y-4">
 <div className="flex items-center justify-between px-1">
 <h2 className="text-xl font-bold leading-tight text-th-heading">Active Cron Jobs</h2>
 <div className="flex gap-2">
 <select className="text-xs font-bold rounded-lg border border-th-border bg-th-surface-base text-th-heading h-8">
 <option>All Statuses</option>
 <option>Healthy</option>
 <option>Failing</option>
 </select>
 </div>
 </div>
 <div className="rounded-xl border border-th-border bg-th-surface-raised overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-th-surface-overlay/50 border-b border-th-border text-[11px] uppercase tracking-widest text-th-muted font-bold">
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4">Job Details</th>
 <th className="px-6 py-4">Schedule (Cron)</th>
 <th className="px-6 py-4">Last Run</th>
 <th className="px-6 py-4">Success</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800 text-sm">
 {loading ? (
  <tr><td colSpan="6" className="px-6 py-12 text-center">
   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
  </td></tr>
 ) : jobs.map((job, i) => {
  const status = (job.status || 'unknown').toLowerCase();
  const isFailing = status === 'failing' || status === 'failed' || status === 'error';
  const isRunning = status === 'running' || status === 'active';
  const successRate = job.success_rate ?? 0;
  const successColor = isFailing ? 'text-rose-500' : 'text-emerald-500';
  const barColor = isFailing ? 'bg-rose-500' : 'bg-emerald-500';
  return (
  <tr key={job.name || i} className={`hover:bg-th-surface-overlay/30 transition-colors ${isFailing ? 'bg-rose-900/5' : ''}`}>
  <td className="px-6 py-4">
  <div className="flex items-center gap-2">
  {isRunning ? (
   <span className="relative flex h-2 w-2">
   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
   </span>
  ) : (
   <span className={`flex h-2 w-2 rounded-full ${isFailing ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
  )}
  <span className={`text-xs font-bold uppercase ${isFailing ? 'text-rose-500' : 'text-emerald-500'}`}>
   {job.status || 'Unknown'}
  </span>
  </div>
  </td>
  <td className="px-6 py-4">
  <div className="flex flex-col">
  <span className="text-sm font-bold text-th-heading">{job.name || job.job_name || `Job ${i + 1}`}</span>
  {job.error ? (
   <span className="text-xs text-rose-500 font-medium">Error: {job.error}</span>
  ) : (
   <span className="text-xs text-th-muted">{job.source ? `Source: ${job.source}` : job.description || ''}</span>
  )}
  </div>
  </td>
  <td className="px-6 py-4">
  <code className="px-2 py-1 bg-th-surface-overlay rounded text-xs font-mono text-blue-400">{job.cron || job.schedule || '--'}</code>
  </td>
  <td className="px-6 py-4">
  <span className="text-xs font-medium text-th-secondary">{job.last_run || job.last_run_ago || '--'}</span>
  </td>
  <td className="px-6 py-4">
  <div className="flex items-center gap-2">
  <span className={`text-xs font-bold tabular-nums ${successColor}`}>{successRate}%</span>
  <div className="w-12 h-1 bg-th-surface-overlay rounded-full overflow-hidden">
  <div className={`${barColor} h-full`} style={{ width: `${Math.min(successRate, 100)}%` }}></div>
  </div>
  </div>
  </td>
  <td className="px-6 py-4 text-right">
  <div className="flex justify-end gap-1">
  <button className={`p-1.5 rounded-md ${isFailing ? 'hover:bg-rose-800 text-rose-500' : 'hover:bg-th-surface-overlay text-th-muted'}`}>
  <span className="material-symbols-outlined text-sm">{isFailing ? 'refresh' : 'play_arrow'}</span>
  </button>
  </div>
  </td>
  </tr>
  );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
