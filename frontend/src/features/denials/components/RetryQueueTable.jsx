import React from 'react';

export function RetryQueueTable({ queue, onAction }) {
 const getStatusColor = (status) => {
 switch (status) {
 case 'Pending': return 'bg-th-surface-overlay text-th-muted ';
 case 'Retrying': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse';
 case 'Success': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
 case 'Failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
 default: return 'bg-th-surface-overlay text-th-muted';
 }
 };

 return (
 <div className="bg-white rounded-xl border border-th-border shadow-sm overflow-hidden">
 <div className="p-4 border-b border-th-border flex justify-between items-center bg-th-surface-overlay/30/50 /50">
 <h3 className="font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">queue_music</span>
 Active Retry Queue
 </h3>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-th-border rounded-lg hover:bg-th-surface-overlay/30 transition-colors">
 Filter
 </button>
 <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-th-border rounded-lg hover:bg-th-surface-overlay/30 transition-colors">
 Export
 </button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead className="bg-th-surface-overlay/30 text-xs uppercase text-th-muted font-bold">
 <tr>
 <th className="px-6 py-4">Claim / Visit ID</th>
 <th className="px-6 py-4">Failure Reason</th>
 <th className="px-6 py-4 text-center">Attempt</th>
 <th className="px-6 py-4">Next Retry</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-th-border">
 {queue.map((item) => (
 <tr key={item.id} className="hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="font-bold text-th-heading font-mono">{item.claimId}</div>
 <div className="text-xs text-th-muted">{item.patient}</div>
 </td>
 <td className="px-6 py-4">
 <span className="font-medium text-th-primary ">{item.failureReason}</span>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="inline-flex items-center gap-1 font-mono text-xs">
 <span className="font-bold text-th-heading ">{item.retryCount}</span>
 <span className="text-th-secondary">/</span>
 <span className="text-th-muted">{item.maxRetries}</span>
 </div>
 <div className="w-16 h-1 bg-th-surface-overlay rounded-full mx-auto mt-1 overflow-hidden">
 <div
 className="h-full bg-primary transition-all duration-500"
 style={{ width: `${(item.retryCount / item.maxRetries) * 100}%` }}
 ></div>
 </div>
 </td>
 <td className="px-6 py-4 text-th-muted font-mono text-xs">
 {item.status === 'Retrying' ? (
 <span className="text-blue-600 font-bold animate-pulse">Processing...</span>
 ) : (
 item.nextRetryAt.split(',')[1] // Just showing time for mock
 )}
 </td>
 <td className="px-6 py-4">
 <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${getStatusColor(item.status)}`}>
 {item.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
 {item.status === 'Pending' && (
 <button
 onClick={() => onAction('retry', item.id)}
 className="p-1 text-th-secondary hover:text-primary transition-colors"
 title="Retry Now"
 >
 <span className="material-symbols-outlined text-lg">autoplay</span>
 </button>
 )}
 <button
 onClick={() => onAction('pause', item.id)}
 className="p-1 text-th-secondary hover:text-orange-500 transition-colors"
 title="Pause Automation"
 >
 <span className="material-symbols-outlined text-lg">pause_circle</span>
 </button>
 <button
 onClick={() => onAction('details', item.id)}
 className="p-1 text-th-secondary hover:text-th-primary dark:hover:text-th-heading transition-colors"
 title="View Details"
 >
 <span className="material-symbols-outlined text-lg">visibility</span>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
