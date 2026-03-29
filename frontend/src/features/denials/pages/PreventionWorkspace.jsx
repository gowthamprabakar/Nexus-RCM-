import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { StatusPill } from '../components/StatusPill';

export function PreventionWorkspace() {
 const [queue, setQueue] = useState([]);
 const [processingId, setProcessingId] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   api.crs.getHighRisk({ size: 10 }).then(data => {
     setQueue(data?.items || []);
     setLoading(false);
   }).catch(() => setLoading(false));
 }, []);

 const handleAction = (id, action) => {
 setProcessingId(id);
 // Simulate API call
 setTimeout(() => {
 setQueue(current => current.filter(item => item.id !== id));
 setProcessingId(null);
 // In a real app, show toast notification here
 }, 1500);
 };

 if (loading) return (
   <div className="flex-1 flex items-center justify-center h-full">
     <div className="text-th-secondary text-sm">Loading prevention workspace...</div>
   </div>
 );

 return (
 <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
 <div className="p-6 max-w-[1000px] mx-auto w-full space-y-6">

 <div className="flex justify-between items-center">
 <div>
 <h1 className="text-2xl font-black text-th-heading ">Prevention Workspace</h1>
 <p className="text-th-muted text-sm">Review and execute AI-recommended preventive actions.</p>
 </div>
 <div className="text-right">
 <div className="text-2xl font-bold text-th-heading tabular-nums">{queue.length}</div>
 <div className="text-xs text-th-muted uppercase font-bold tracking-wider">Pending Actions</div>
 </div>
 </div>

 {queue.length === 0 ? (
 <div className="text-center py-20 bg-white dark:bg-card-dark rounded-xl border border-dashed border-th-border-strong ">
 <span className="material-symbols-outlined text-6xl text-emerald-200 mb-4">check_circle</span>
 <h3 className="text-xl font-bold text-th-heading ">All Caught Up!</h3>
 <p className="text-th-muted">You've cleared the high-priority prevention queue.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {queue.map(claim => {
 const recommendation = { action: claim.recommendation || claim.topFactor || 'Manual Review', type: 'Review' };

 return (
 <div key={claim.id} className="bg-white dark:bg-card-dark rounded-xl border border-th-border border-l-[3px] border-l-blue-500 shadow-sm overflow-hidden flex flex-col md:flex-row hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 {/* Left: Claim Context */}
 <div className="p-6 flex-1">
 <div className="flex justify-between items-start mb-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-th-heading ">{claim.id}</span>
 <span className="text-sm text-th-muted">• {claim.patient}</span>
 </div>
 <StatusPill status="Predicted" size="sm" />
 </div>
 <div className="text-sm text-th-muted mb-4">
 <span className="font-bold">Risk:</span> {claim.topFactor}
 </div>
 <div className="flex gap-4 text-xs font-medium text-th-muted bg-th-surface-overlay/30 /50 p-3 rounded-lg">
 <div>
 <span className="block uppercase text-[10px] text-th-secondary mb-0.5">Payer</span>
 <span className="text-th-heading ">{claim.payer}</span>
 </div>
 <div>
 <span className="block uppercase text-[10px] text-th-secondary mb-0.5">Service Date</span>
 <span className="text-th-heading ">{claim.serviceDate}</span>
 </div>
 <div>
 <span className="block uppercase text-[10px] text-th-secondary mb-0.5">Amount</span>
 <span className="text-th-heading tabular-nums">${claim.amount}</span>
 </div>
 </div>
 </div>

 {/* Right: Action Area */}
 <div className="bg-th-surface-overlay/30 /30 p-6 md:w-80 border-t md:border-t-0 md:border-l border-th-border-subtle flex flex-col justify-center gap-3">
 <div className="flex items-center gap-2 text-primary font-bold text-sm">
 <span className="material-symbols-outlined text-lg">lightbulb</span>
 AI Recommendation
 </div>
 <p className="text-sm font-medium text-th-heading ">
 {recommendation.action}
 </p>

 <div className="flex gap-2 mt-2">
 <button
 onClick={() => handleAction(claim.id, 'approve')}
 disabled={processingId === claim.id}
 className="flex-1 bg-primary hover:bg-primary-dark text-th-heading text-sm font-bold py-2 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
 >
 {processingId === claim.id ? (
 <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
 ) : 'Execute'}
 </button>
 <button
 onClick={() => handleAction(claim.id, 'ignore')}
 disabled={processingId === claim.id}
 className="px-3 bg-white border border-th-border -strong text-th-muted hover:text-th-primary dark:hover:text-th-heading rounded-lg transition-colors"
 title="Ignore / Reject"
 >
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 );
}
