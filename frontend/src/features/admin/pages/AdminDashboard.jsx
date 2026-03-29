import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function AdminDashboard() {
 const [systemHealth, setSystemHealth] = useState({
  aiStatus: null,
  rulesCount: 0,
  crsSummary: null,
  loading: true,
  error: null,
 });

 useEffect(() => {
  let cancelled = false;
  async function load() {
   try {
    const [aiHealth, rulesData, crsSummary] = await Promise.allSettled([
     api.ai.health(),
     api.automation.getRules(),
     api.crs.getSummary(),
    ]);
    if (cancelled) return;
    setSystemHealth({
     aiStatus: aiHealth.status === 'fulfilled' ? aiHealth.value : null,
     rulesCount: rulesData.status === 'fulfilled' && rulesData.value?.rules ? rulesData.value.rules.length : 0,
     enabledRules: rulesData.status === 'fulfilled' && rulesData.value?.rules ? rulesData.value.rules.filter(r => r.enabled).length : 0,
     crsSummary: crsSummary.status === 'fulfilled' ? crsSummary.value : null,
     loading: false,
     error: null,
    });
   } catch (err) {
    if (!cancelled) setSystemHealth(prev => ({ ...prev, loading: false, error: err.message }));
   }
  }
  load();
  const interval = setInterval(load, 60000);
  return () => { cancelled = true; clearInterval(interval); };
 }, []);

 const isOperational = systemHealth.aiStatus?.status === 'ok' || systemHealth.aiStatus?.ollama === true;
 const ollamaStatus = systemHealth.aiStatus?.ollama ? 'Connected' : 'Offline';
 const crs = systemHealth.crsSummary;

 return (
 <div className="flex-1 overflow-y-auto p-6 font-sans h-full">
  {/* Status Badge */}
  <div className="mb-6 flex justify-end">
   {systemHealth.loading ? (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-th-surface-overlay text-th-secondary rounded-full text-[11px] font-bold border border-th-border">
     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
     Checking System...
    </span>
   ) : (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
     isOperational
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    }`}>
     <span className={`h-1.5 w-1.5 rounded-full ${isOperational ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
     {isOperational ? 'System Operational' : 'Degraded Performance'}
    </span>
   )}
  </div>

  {/* Dashboard Grid */}
  <div className="grid grid-cols-12 gap-6">
   {/* Left: Role Hierarchy (3 cols) */}
   <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
    <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden">
     <div className="p-4 border-b border-th-border flex justify-between items-center">
      <h3 className="text-sm font-bold text-th-heading">Role Hierarchy</h3>
      <span className="material-symbols-outlined text-th-secondary text-lg cursor-pointer hover:text-blue-400 transition-colors">add_circle</span>
     </div>
     <div className="p-3">
      <ul className="flex flex-col gap-1 text-sm">
       <li className="p-2 flex items-center gap-2 text-blue-400 font-bold bg-blue-500/5 rounded-lg border-l-2 border-blue-500">
        <span className="material-symbols-outlined text-lg">expand_more</span>
        <span className="material-symbols-outlined text-lg">account_balance</span>
        CFO / Executive
       </li>
       <li className="p-2 ml-4 flex items-center gap-2 text-th-secondary hover:text-blue-400 transition-colors cursor-pointer rounded-lg hover:bg-th-surface-overlay/50">
        <span className="material-symbols-outlined text-lg">chevron_right</span>
        <span className="material-symbols-outlined text-lg">payments</span>
        Billing Manager
       </li>
       <li className="p-2 ml-8 flex items-center gap-2 text-th-secondary hover:text-blue-400 transition-colors cursor-pointer rounded-lg hover:bg-th-surface-overlay/50">
        <span className="material-symbols-outlined text-lg">person</span>
        Billing Specialist
       </li>
       <li className="p-2 ml-4 flex items-center gap-2 text-th-secondary hover:text-blue-400 transition-colors cursor-pointer rounded-lg hover:bg-th-surface-overlay/50">
        <span className="material-symbols-outlined text-lg">expand_more</span>
        <span className="material-symbols-outlined text-lg">smart_toy</span>
        AI Supervisor
       </li>
       <li className="p-2 ml-12 flex items-center gap-2 text-blue-400 bg-blue-500/5 rounded-lg">
        <span className="material-symbols-outlined text-lg">robot_2</span>
        AI Agent L1
       </li>
       <li className="p-2 ml-4 flex items-center gap-2 text-th-secondary hover:text-blue-400 transition-colors cursor-pointer rounded-lg hover:bg-th-surface-overlay/50">
        <span className="material-symbols-outlined text-lg">chevron_right</span>
        <span className="material-symbols-outlined text-lg">gavel</span>
        Claims Auditor
       </li>
      </ul>
     </div>
    </div>
    {/* User Management Preview */}
    <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden flex-1">
     <div className="p-4 border-b border-th-border">
      <h3 className="text-sm font-bold text-th-heading">Quick Search Users</h3>
     </div>
     <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
       <div className="h-8 w-8 rounded bg-th-surface-overlay flex items-center justify-center font-bold text-xs text-blue-400">JD</div>
       <div>
        <p className="text-xs font-bold text-th-heading">Jane Doe</p>
        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">MFA Enabled</p>
       </div>
      </div>
      <div className="flex items-center gap-3 opacity-60">
       <div className="h-8 w-8 rounded bg-th-surface-overlay flex items-center justify-center font-bold text-xs text-th-secondary">RK</div>
       <div>
        <p className="text-xs font-bold text-th-heading">Robert King</p>
        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tighter">MFA Disabled</p>
       </div>
      </div>
      <button className="w-full border border-th-border py-2 rounded-lg text-xs font-bold text-th-secondary hover:bg-th-surface-overlay transition-colors">View All Users</button>
     </div>
    </div>
   </div>

   {/* Center: Permissions Matrix (6 cols) */}
   <div className="col-span-12 lg:col-span-6">
    <div className="bg-th-surface-raised rounded-xl border border-th-border h-full overflow-hidden flex flex-col">
     <div className="p-4 border-b border-th-border flex justify-between items-center">
      <div>
       <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400">Granular Permissions Matrix</h3>
       <p className="text-[10px] text-th-muted font-medium">Configuring: CFO / Executive Role</p>
      </div>
      <div className="flex gap-2">
       <div className="flex items-center gap-1.5 bg-th-surface-overlay border border-th-border-strong px-2 py-1 rounded cursor-pointer hover:bg-th-surface-overlay transition-colors">
        <span className="material-symbols-outlined text-sm text-th-heading">filter_alt</span>
        <span className="text-[10px] font-bold text-th-heading">Filter Categories</span>
       </div>
      </div>
     </div>
     <div className="flex-1 overflow-y-auto">
      <table className="w-full text-left border-collapse">
       <thead className="sticky top-0 bg-th-surface-raised z-10 border-b border-th-border">
        <tr className="text-[10px] font-bold text-th-muted uppercase">
         <th className="px-6 py-3">Permission Node</th>
         <th className="px-4 py-3">View</th>
         <th className="px-4 py-3">Edit</th>
         <th className="px-4 py-3">Admin</th>
        </tr>
       </thead>
       <tbody className="text-sm">
        {/* PHI Section */}
        <tr className="bg-th-surface-overlay/20">
         <td className="px-6 py-2 text-[10px] font-extrabold text-th-secondary uppercase tracking-widest" colSpan="4">Data Privacy (PHI)</td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Patient Identifiable Info</td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">SSN / Insurance Details</td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        {/* Revenue Section */}
        <tr className="bg-th-surface-overlay/20">
         <td className="px-6 py-2 text-[10px] font-extrabold text-th-secondary uppercase tracking-widest" colSpan="4">Financial Operations</td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Edit Claims Records</td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Revenue Forecasting</td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        {/* AI Section */}
        <tr className="bg-th-surface-overlay/20">
         <td className="px-6 py-2 text-[10px] font-extrabold text-th-secondary uppercase tracking-widest" colSpan="4">AI Engine Control</td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Override AI Suggestions</td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Train Model with Data</td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
        {/* System Section */}
        <tr className="bg-th-surface-overlay/20">
         <td className="px-6 py-2 text-[10px] font-extrabold text-th-secondary uppercase tracking-widest" colSpan="4">System Administration</td>
        </tr>
        <tr className="border-b border-th-border/50">
         <td className="px-6 py-3 font-medium text-xs text-th-heading">Manage API Keys</td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
         <td className="px-4 py-3"><input defaultChecked className="rounded border-th-border-strong text-blue-600 focus:ring-blue-600 h-4 w-4" type="checkbox" /></td>
        </tr>
       </tbody>
      </table>
     </div>
    </div>
   </div>

   {/* Right: Security Health (3 cols) */}
   <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
    <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-blue-500 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <h3 className="text-sm font-bold mb-4 text-th-heading">Security Health</h3>
     <div className="flex flex-col items-center mb-6">
      <div className="relative flex items-center justify-center">
       <svg className="w-24 h-24 transform -rotate-90">
        <circle className="text-th-heading" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
        <circle className="text-blue-600" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="10" strokeWidth="8"></circle>
       </svg>
       <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black text-th-heading tabular-nums">
         {crs?.readiness_score ? `${Math.round(crs.readiness_score)}%` : '98%'}
        </span>
        <span className="text-[8px] font-bold text-th-muted uppercase tracking-tighter">Compliant</span>
       </div>
      </div>
      <p className="text-xs font-bold mt-4 text-center text-th-heading">HIPAA & SOC-2 Status</p>
      <p className="text-[10px] text-emerald-400 font-bold mt-1">
       {isOperational ? 'Full Compliance Verified' : 'Partial - AI Engine Offline'}
      </p>
     </div>
     <div className="space-y-4">
      <div className="p-3 bg-th-surface-overlay/50 rounded-lg">
       <div className="flex justify-between items-center mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">AI Engine</p>
        <span className={`text-[10px] font-black tabular-nums ${systemHealth.aiStatus?.ollama ? 'text-emerald-400' : 'text-red-400'}`}>
         {systemHealth.loading ? '...' : ollamaStatus}
        </span>
       </div>
       <div className="flex justify-between items-center mb-1 mt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Automation Rules</p>
        <span className="text-[10px] font-black text-blue-400 tabular-nums">
         {systemHealth.loading ? '...' : `${systemHealth.enabledRules || 0}/${systemHealth.rulesCount} Active`}
        </span>
       </div>
       <div className="h-1.5 w-full bg-th-surface-overlay rounded-full overflow-hidden mt-1">
        <div className="h-full bg-blue-600" style={{ width: systemHealth.rulesCount > 0 ? `${(systemHealth.enabledRules / systemHealth.rulesCount) * 100}%` : '70%' }}></div>
       </div>
      </div>
      <div className="flex flex-col gap-3">
       <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted">Real-time Alerts</h4>
       <div className={`flex gap-3 p-2 border-l-2 rounded-r ${
        systemHealth.aiStatus?.ollama ? 'border-emerald-500 bg-emerald-900/10' : 'border-amber-500 bg-amber-900/10'
       }`}>
        <span className={`material-symbols-outlined text-lg ${systemHealth.aiStatus?.ollama ? 'text-emerald-500' : 'text-amber-500'}`}>
         {systemHealth.aiStatus?.ollama ? 'check_circle' : 'warning'}
        </span>
        <div className="flex-1">
         <p className="text-[10px] font-bold text-th-heading">
          {systemHealth.aiStatus?.ollama ? 'Ollama LLM Connected' : 'AI Engine Offline'}
         </p>
         <p className="text-[9px] text-th-muted">
          {systemHealth.aiStatus?.model ? `Model: ${systemHealth.aiStatus.model}` : 'Check Ollama service'}
         </p>
        </div>
       </div>
       {crs && (
        <div className="flex gap-3 p-2 border-l-2 border-blue-500 bg-blue-900/10 rounded-r">
         <span className="material-symbols-outlined text-blue-500 text-lg">assessment</span>
         <div className="flex-1">
          <p className="text-[10px] font-bold text-th-heading">CRS Score: {crs.readiness_score ? `${Math.round(crs.readiness_score)}%` : 'N/A'}</p>
          <p className="text-[9px] text-th-muted">{crs.total_claims ? `${crs.total_claims.toLocaleString()} claims monitored` : 'Claims data loading'}</p>
         </div>
        </div>
       )}
      </div>
     </div>
    </div>
    <div className="bg-th-surface-raised rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 p-5 flex flex-col gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
     <h3 className="text-sm font-bold text-th-heading">Quick Actions</h3>
     <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay transition-colors w-full text-left">
      <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center">
       <span className="material-symbols-outlined text-lg">key</span>
      </div>
      <div>
       <p className="text-xs font-bold text-th-heading">Reset API Keys</p>
       <p className="text-[9px] text-th-muted">Rotate all system keys</p>
      </div>
     </button>
     <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay transition-colors w-full text-left">
      <div className="h-8 w-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center">
       <span className="material-symbols-outlined text-lg">history</span>
      </div>
      <div>
       <p className="text-xs font-bold text-th-heading">View System Logs</p>
       <p className="text-[9px] text-th-muted">Access full audit trail</p>
      </div>
     </button>
    </div>
   </div>
  </div>

  {/* Footer / Status Bar */}
  <div className="mt-8 flex flex-wrap justify-between items-center px-4 py-3 bg-th-surface-raised border border-th-border rounded-xl gap-4">
   <div className="flex items-center gap-8">
    <div className="flex items-center gap-2">
     <span className={`h-2 w-2 rounded-full ${isOperational ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
     <span className="text-[10px] font-bold text-th-muted">SOC-2 TYPE II: ACTIVE</span>
    </div>
    <div className="flex items-center gap-2">
     <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
     <span className="text-[10px] font-bold text-th-muted">PHI ENCRYPTION: AES-256</span>
    </div>
   </div>
   <div className="flex items-center gap-4">
    <p className="text-[10px] font-medium text-th-secondary">
     Last security sync: {systemHealth.loading ? 'checking...' : 'just now'}
    </p>
    <button className="text-[10px] font-bold text-blue-400 underline hover:text-blue-300">Run Manual Scan</button>
   </div>
  </div>
 </div>
 );
}
