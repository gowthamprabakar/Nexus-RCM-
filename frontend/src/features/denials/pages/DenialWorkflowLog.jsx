import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function DenialWorkflowLog() {
 const [filterStatus, setFilterStatus] = useState('all');
 const [loading, setLoading] = useState(true);
 const [denials, setDenials] = useState([]);
 const [summary, setSummary] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [denialsResult, summaryResult] = await Promise.all([
    api.denials.list({ page: 1, size: 100 }),
    api.denials.getSummary(),
   ]);
   if (cancelled) return;
   // Map denials to workflow log format
   const items = (denialsResult?.items || []).map((d, idx) => ({
    id: idx + 1,
    claimId: d.claim_id || d.claimId || d.id,
    user: d.assigned_to || d.user || (d.ai_detected ? 'AI System' : 'System Automation'),
    action: d.denial_category || d.action || 'Risk Identified',
    details: d.description || d.details || `${d.carc_code || ''} - ${d.denial_category || ''}`.trim(),
    timestamp: d.denial_date || d.created_at || d.timestamp || '',
    status: d.status || d.appeal_status || 'Open',
   }));
   setDenials(items);
   setSummary(summaryResult);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 const statuses = ['Open', 'In Review', 'Appealed', 'Resolved', 'Closed'];

 const statusColors = {
 'Open': 'bg-blue-900/30 text-blue-400',
 'In Review': 'bg-amber-900/30 text-amber-400',
 'Appealed': 'bg-purple-900/30 text-purple-400',
 'Resolved': 'bg-emerald-900/30 text-emerald-400',
 'Closed': 'bg-th-surface-overlay text-th-secondary',
 };

 const filteredLogs = filterStatus === 'all' ? denials : denials.filter(l => l.status === filterStatus);

 if (loading) {
  return (
   <div className="flex-1 overflow-y-auto font-sans h-full">
    <div className="p-6 max-w-[1600px] mx-auto w-full flex items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading denial workflow data...</p>
     </div>
    </div>
   </div>
  );
 }

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

 {/* Action Bar */}
 <div className="flex flex-wrap justify-between items-center gap-4">
 <div className="flex items-center gap-3">
 <span className="ai-descriptive">Descriptive AI</span>
 <span className="ai-predictive">Predictive AI</span>
 <span className="text-th-secondary text-sm">Audit trail of AI predictions and user interventions</span>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-th-heading text-sm font-bold hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">download</span> Export Log
 </button>
 </div>

 {/* Status Filter Tabs */}
 <div className="flex gap-2 flex-wrap">
 <button
 onClick={() => setFilterStatus('all')}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
 filterStatus === 'all' ? 'bg-primary text-th-heading' : 'bg-th-surface-raised border border-th-border text-th-secondary hover:text-th-heading'
 }`}
 >
 All ({denials.length})
 </button>
 {statuses.map(status => {
 const count = denials.filter(l => l.status === status).length;
 return (
 <button
 key={status}
 onClick={() => setFilterStatus(status)}
 className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
 filterStatus === status ? 'bg-primary text-th-heading' : 'bg-th-surface-raised border border-th-border text-th-secondary hover:text-th-heading'
 }`}
 >
 {status} ({count})
 </button>
 );
 })}
 </div>

 {/* Summary Stats */}
 <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
 {statuses.map(status => {
 const count = denials.filter(l => l.status === status).length;
 return (
 <div key={status} className={`bg-th-surface-raised border border-th-border border-l-[3px] rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${
 status === 'Open' ? 'border-l-blue-500' :
 status === 'In Review' ? 'border-l-amber-500' :
 status === 'Appealed' ? 'border-l-purple-500' :
 status === 'Resolved' ? 'border-l-emerald-500' :
 'border-l-slate-500'
 }`}>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">{status}</p>
 <p className="text-2xl font-black text-th-heading mt-1 tabular-nums">{count}</p>
 </div>
 );
 })}
 </div>

 {/* Workflow Table */}
 {filteredLogs.length === 0 ? (
  <div className="bg-th-surface-raised border border-th-border rounded-xl p-12 flex flex-col items-center justify-center text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">assignment_turned_in</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Workflow Entries</h3>
   <p className="text-th-muted text-sm">No denial workflow entries match the current filter.</p>
  </div>
 ) : (
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-th-surface-overlay/50 text-xs font-semibold uppercase tracking-wider text-th-muted border-b border-th-border">
 <th className="px-6 py-4">Timestamp</th>
 <th className="px-6 py-4">Claim ID</th>
 <th className="px-6 py-4">User / System</th>
 <th className="px-6 py-4">Action</th>
 <th className="px-6 py-4">Details</th>
 <th className="px-6 py-4">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/50 text-sm">
 {filteredLogs.map(log => (
 <tr key={log.id} className="hover:bg-th-surface-overlay/50 transition-colors">
 <td className="px-6 py-4 text-th-muted font-mono text-xs tabular-nums">{log.timestamp}</td>
 <td className="px-6 py-4 font-bold text-th-heading">{log.claimId}</td>
 <td className="px-6 py-4 text-th-secondary">
 <div className="flex items-center gap-2">
 {log.user.includes('System') || log.user.includes('AI') ? (
 <span className="material-symbols-outlined text-purple-400 text-sm">smart_toy</span>
 ) : (
 <span className="material-symbols-outlined text-th-muted text-sm">person</span>
 )}
 {log.user}
 </div>
 </td>
 <td className="px-6 py-4 font-medium text-th-heading">{log.action}</td>
 <td className="px-6 py-4 text-th-secondary max-w-xs truncate" title={log.details}>{log.details}</td>
 <td className="px-6 py-4">
 <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColors[log.status] || 'bg-th-surface-overlay text-th-secondary'}`}>
 {log.status}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 </div>
 </div>
 );
}
