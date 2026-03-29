import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

// ─── Ticket type to detail route mapping ──────────────────────────────────────
function getTicketDetailRoute(ticket) {
  if (ticket.type === 'diagnostic') {
    // Navigate to the diagnostic source based on keywords in the title/desc
    const text = `${ticket.title} ${ticket.desc}`.toLowerCase();
    if (text.includes('denial') || text.includes('carc')) return '/analytics/denials/overview';
    if (text.includes('payment') || text.includes('underpay')) return '/analytics/payments/overview';
    if (text.includes('claim') || text.includes('cpt')) return '/analytics/claims/overview';
    if (text.includes('a/r') || text.includes('aging') || text.includes('ar ')) return '/analytics/revenue/ar-aging';
    if (text.includes('reconcil')) return '/analytics/revenue/reconciliation';
    return '/intelligence/lida/dashboard';
  }
  if (ticket.type === 'automation') {
    return '/work/automation';
  }
  return null;
}

export function TicketHub() {
 const navigate = useNavigate();
 const [selectedTicket, setSelectedTicket] = useState(null);
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [tickets, setTickets] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);

 useEffect(() => {
   let cancelled = false;
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const [pending, findingsRes] = await Promise.all([
         api.automation.getPending(),
         api.diagnostics.getFindings(),
       ]);
       if (cancelled) return;

       // Normalize automation pending items into ticket shape
       const automationTickets = (Array.isArray(pending) ? pending : pending?.items || []).map((item, idx) => ({
         id: item.id || item.action_id || `AUTO-${idx + 1}`,
         title: item.title || item.description || item.action_type || 'Pending Action',
         priority: item.priority || (item.risk_score > 80 ? 'Critical' : 'High'),
         assignee: item.assignee || item.assigned_to || 'Unassigned',
         assigneeInitials: (item.assignee || item.assigned_to || 'UA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
         source: 'Automation',
         recovery: item.estimated_recovery ? `$${Number(item.estimated_recovery).toLocaleString()}` : item.revenue_impact ? `$${Number(item.revenue_impact).toLocaleString()}` : '--',
         timeline: item.deadline || item.due_date || '--',
         desc: item.details || item.reason || item.description || '',
         chartColor: 'bg-blue-500',
         actionId: item.action_id || item.id,
         type: 'automation',
       }));

       // Normalize diagnostic findings into ticket shape
       const findings = findingsRes?.findings || (Array.isArray(findingsRes) ? findingsRes : []);
       const diagnosticTickets = findings.map((f, idx) => ({
         id: f.id || f.finding_id || `DIAG-${idx + 1}`,
         title: f.title || f.finding || f.description || 'Diagnostic Finding',
         priority: f.severity === 'critical' ? 'Critical' : f.severity === 'high' ? 'High' : 'Medium',
         assignee: f.assignee || 'Unassigned',
         assigneeInitials: (f.assignee || 'UA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
         source: 'Diagnostic AI',
         recovery: f.revenue_impact ? `$${Number(f.revenue_impact).toLocaleString()}` : '--',
         timeline: f.deadline || '--',
         desc: f.details || f.recommendation || f.description || '',
         chartColor: 'bg-rose-500',
         type: 'diagnostic',
       }));

       setTickets([...automationTickets, ...diagnosticTickets]);
     } catch (err) {
       if (!cancelled) setError(err.message || 'Failed to load tickets');
     } finally {
       if (!cancelled) setLoading(false);
     }
   }
   load();
   return () => { cancelled = true; };
 }, []);

 const handleApprove = async (actionId) => {
   try {
     await api.automation.approve(actionId);
     setTickets((prev) => prev.filter((t) => t.actionId !== actionId));
     if (selectedTicket?.actionId === actionId) setSelectedTicket(null);
   } catch (err) {
     console.error('Approve failed:', err);
   }
 };

 const handleReject = async (actionId) => {
   try {
     await api.automation.reject(actionId);
     setTickets((prev) => prev.filter((t) => t.actionId !== actionId));
     if (selectedTicket?.actionId === actionId) setSelectedTicket(null);
   } catch (err) {
     console.error('Reject failed:', err);
   }
 };

 const priorityClass = (p) => {
   if (p === 'Critical') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
   if (p === 'High') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
   return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
 };

 return (
 <div className="flex-1 overflow-y-auto h-full p-8 text-th-heading custom-scrollbar">
 {/* Top toolbar */}
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <span className="ai-predictive">Predictive AI</span>
 <span className="ai-prescriptive">Prescriptive AI</span>
 {loading && <span className="text-xs text-th-muted animate-pulse">Loading tickets...</span>}
 </div>
 <button
 onClick={() => setShowCreateModal(true)}
 className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors"
 >
 <span className="material-symbols-outlined text-sm">add</span> Create Ticket
 </button>
 </div>

 {error && (
   <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 mb-6 text-center">
     <p className="text-red-400 text-sm font-bold">{error}</p>
     <p className="text-xs text-th-secondary mt-1">Showing cached data or empty state.</p>
   </div>
 )}

 {!loading && tickets.length === 0 && !error && (
   <div className="rounded-xl border border-th-border bg-th-surface-raised p-12 text-center">
     <span className="material-symbols-outlined text-4xl text-th-muted mb-3 block">check_circle</span>
     <p className="text-th-muted font-bold">No pending tickets</p>
     <p className="text-xs text-th-secondary mt-1">All automation actions and diagnostic findings are resolved.</p>
   </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
 {/* Tickets List (3 cols) */}
 <div className="lg:col-span-3 space-y-4">
 {loading ? (
   [1, 2].map((i) => (
     <div key={i} className="bg-th-surface-raised border border-th-border rounded-xl p-5 animate-pulse">
       <div className="h-4 bg-th-surface-overlay rounded w-1/4 mb-3" />
       <div className="h-6 bg-th-surface-overlay rounded w-2/3 mb-2" />
       <div className="h-3 bg-th-surface-overlay rounded w-full" />
     </div>
   ))
 ) : (
 tickets.map((ticket, i) => (
 <div
 key={ticket.id || i}
 onClick={() => setSelectedTicket(ticket)}
 className={`bg-th-surface-raised border rounded-xl p-5 cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 ${selectedTicket?.id === ticket.id ? 'border-primary ring-1 ring-primary' : 'border-th-border hover:border-th-border-strong'}`}
 >
 <div className="flex justify-between items-start">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${priorityClass(ticket.priority)}`}>
 {ticket.priority} Priority
 </span>
 <span className="text-xs font-mono text-th-muted">{ticket.id}</span>
 {ticket.type === 'automation' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">AUTOMATION</span>}
 {ticket.type === 'diagnostic' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">DIAGNOSTIC</span>}
 </div>
 <h3 className="text-lg font-bold text-th-heading mb-2 group-hover:text-blue-400 transition-colors">{ticket.title}</h3>
 <p className="text-sm text-th-secondary leading-relaxed max-w-xl">{ticket.desc}</p>
 {getTicketDetailRoute(ticket) && (
   <button
     onClick={(e) => { e.stopPropagation(); navigate(getTicketDetailRoute(ticket)); }}
     className="mt-2 inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
   >
     <span className="material-symbols-outlined text-sm">open_in_new</span>
     View Source Details
   </button>
 )}

 <div className="flex items-center gap-8 mt-6">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-th-surface-overlay flex items-center justify-center text-xs font-bold text-th-heading">
 {ticket.assigneeInitials}
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted">Assigned Leader</p>
 <p className="text-xs font-bold text-th-heading">{ticket.assignee}</p>
 </div>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Source Insight</p>
 <div className="flex items-center gap-1.5 text-blue-400">
 <span className="material-symbols-outlined text-sm">auto_awesome</span>
 <span className="text-xs font-bold">{ticket.source}</span>
 </div>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Est. Recovery</p>
 <p className="text-sm font-bold text-emerald-400 tabular-nums">{ticket.recovery}</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-1">Timeline</p>
 <p className="text-sm font-bold text-th-heading">{ticket.timeline}</p>
 </div>
 </div>

 {/* Action buttons for automation tickets */}
 {ticket.type === 'automation' && ticket.actionId && (
   <div className="flex items-center gap-3 mt-4">
     <button
       onClick={(e) => { e.stopPropagation(); handleApprove(ticket.actionId); }}
       className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors"
     >Approve</button>
     <button
       onClick={(e) => { e.stopPropagation(); handleReject(ticket.actionId); }}
       className="px-4 py-1.5 bg-th-surface-overlay border border-th-border text-th-heading rounded-lg text-xs font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
     >Reject</button>
   </div>
 )}
 </div>

 <div className="w-32 bg-th-surface-overlay/50 rounded-lg p-3 border border-th-border ml-4">
 <p className="text-[9px] font-bold text-th-muted uppercase mb-2">Related Chart</p>
 <div className="h-16 flex items-end gap-1">
 {[40, 50, 45, 90, 85].map((h, idx) => (
 <div key={idx} className={`flex-1 rounded-t ${idx > 2 ? ticket.chartColor : ticket.chartColor + '/20'}`} style={{ height: `${h}%` }}></div>
 ))}
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>

 {/* Right Panel (2 cols) */}
 <div className="lg:col-span-2">
 {selectedTicket ? (
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <div className="px-6 py-4 border-b border-th-border bg-th-surface-overlay/30">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">{selectedTicket.id} / REVIEW</span>
 <button onClick={() => setSelectedTicket(null)} className="text-th-muted hover:text-th-heading"><span className="material-symbols-outlined">close</span></button>
 </div>
 <div className="flex items-center justify-between">
 <h2 className="text-base font-bold text-th-heading leading-tight max-w-[70%]">{selectedTicket.title}</h2>
 <div className="flex bg-th-surface-overlay rounded-lg p-0.5 border border-th-border">
 <button className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">Pending</button>
 <button className="px-3 py-1 text-th-muted text-xs font-bold hover:text-th-heading">Verified</button>
 </div>
 </div>
 </div>

 <div className="p-6">
 <h4 className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-6">Details</h4>
 <div className="space-y-4">
   <div className="bg-th-surface-overlay/50 border border-th-border rounded-xl p-4">
     <p className="text-xs font-bold text-blue-400 mb-1">Source: {selectedTicket.source}</p>
     <p className="text-sm text-th-heading leading-relaxed">{selectedTicket.desc}</p>
   </div>
   <div className="grid grid-cols-2 gap-3">
     <div className="bg-th-surface-overlay/50 border border-th-border rounded-lg p-3">
       <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Priority</p>
       <p className={`text-sm font-bold ${selectedTicket.priority === 'Critical' ? 'text-rose-400' : selectedTicket.priority === 'High' ? 'text-amber-400' : 'text-blue-400'}`}>{selectedTicket.priority}</p>
     </div>
     <div className="bg-th-surface-overlay/50 border border-th-border rounded-lg p-3">
       <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Est. Recovery</p>
       <p className="text-sm font-bold text-emerald-400">{selectedTicket.recovery}</p>
     </div>
   </div>
 </div>
 </div>

 <div className="p-6 border-t border-th-border bg-th-surface-overlay/30">
 <div className="bg-th-surface-base/50 border border-th-border rounded-xl p-3 focus-within:ring-1 focus-within:ring-primary transition-all">
 <textarea rows="2" className="w-full bg-transparent border-none text-sm text-th-heading placeholder-th-muted focus:ring-0 resize-none mb-2" placeholder="Add a comment or @tag a team member..."></textarea>
 <div className="flex justify-between items-center">
 <button className="text-th-muted hover:text-th-heading"><span className="material-symbols-outlined text-lg">attach_file</span></button>
 <button className="h-8 w-8 bg-primary text-th-heading rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors"><span className="material-symbols-outlined text-sm">send</span></button>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-6">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <h2 className="text-sm font-bold text-th-heading mb-4">Ticket Summary</h2>
 <div className="grid grid-cols-2 gap-3">
   <div className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg text-center">
     <p className="text-2xl font-bold text-th-heading tabular-nums">{tickets.length}</p>
     <p className="text-[10px] text-th-muted uppercase font-bold">Total Tickets</p>
   </div>
   <div className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg text-center">
     <p className="text-2xl font-bold text-rose-400 tabular-nums">{tickets.filter(t => t.priority === 'Critical').length}</p>
     <p className="text-[10px] text-th-muted uppercase font-bold">Critical</p>
   </div>
   <div className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg text-center">
     <p className="text-2xl font-bold text-blue-400 tabular-nums">{tickets.filter(t => t.type === 'automation').length}</p>
     <p className="text-[10px] text-th-muted uppercase font-bold">Automation</p>
   </div>
   <div className="bg-th-surface-overlay/50 border border-th-border p-3 rounded-lg text-center">
     <p className="text-2xl font-bold text-purple-400 tabular-nums">{tickets.filter(t => t.type === 'diagnostic').length}</p>
     <p className="text-[10px] text-th-muted uppercase font-bold">Diagnostic</p>
   </div>
 </div>
 </div>

 <div className="bg-primary rounded-xl p-5 text-th-heading">
 <div className="flex items-center gap-2 mb-3">
 <span className="material-symbols-outlined text-sm">auto_awesome</span>
 <h4 className="text-sm font-bold text-th-heading">LIDA Efficiency Insight</h4>
 </div>
 <p className="text-xs leading-relaxed opacity-90 mb-4">
 Tickets are generated from real automation pending actions and diagnostic findings. Approve or reject automation items directly from the ticket list.
 </p>
 <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors border border-white/20">Analyze Team Impact</button>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* Create Ticket Modal */}
 {showCreateModal && (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-th-surface-raised border border-th-border w-full max-w-xl rounded-xl shadow-2xl flex flex-col">
 <header className="p-6 border-b border-th-border flex justify-between items-center">
 <h2 className="text-xl font-bold text-th-heading">Create New Ticket</h2>
 <button onClick={() => setShowCreateModal(false)} className="text-th-muted hover:text-th-heading"><span className="material-symbols-outlined">close</span></button>
 </header>
 <div className="p-6 space-y-6">
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Ticket Title</label>
 <input type="text" className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 text-sm text-th-heading focus:border-primary focus:ring-1 focus:ring-primary" placeholder="e.g. Investigate Denial Spikes in Cardio..." />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Priority</label>
 <select className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 text-sm text-th-heading">
 <option>Critical</option>
 <option>High</option>
 <option>Medium</option>
 <option>Low</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Assignee</label>
 <select className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 text-sm text-th-heading">
 <option>Unassigned</option>
 <option>Sarah Miller</option>
 <option>David Chen</option>
 <option>Elena Rodriguez</option>
 </select>
 </div>
 </div>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Description</label>
 <textarea rows="3" className="w-full bg-th-surface-overlay/50 border border-th-border rounded-lg p-3 text-sm text-th-heading focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Provide details..."></textarea>
 </div>
 </div>
 <footer className="p-6 border-t border-th-border flex justify-end gap-3 bg-th-surface-overlay/30 rounded-b-xl">
 <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-th-secondary hover:text-th-heading transition-colors">Cancel</button>
 <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-primary text-th-heading rounded-lg text-sm font-bold hover:bg-blue-500 shadow-lg">Create Ticket</button>
 </footer>
 </div>
 </div>
 )}
 </div>
 );
}
