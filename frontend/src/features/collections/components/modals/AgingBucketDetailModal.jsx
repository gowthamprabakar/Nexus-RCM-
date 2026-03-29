import React from 'react';

export function AgingBucketDetailModal({ bucket, onClose }) {
 if (!bucket) return null;

 const sampleClaims = [
 { id: 'CLM-10001', payer: 'Medicare', balance: 12500, dos: '2024-01-15', status: 'In Process', patient: 'John Doe' },
 { id: 'CLM-10002', payer: 'Aetna', balance: 8900, dos: '2024-01-18', status: 'Pending', patient: 'Jane Smith' },
 { id: 'CLM-10003', payer: 'BCBS', balance: 15200, dos: '2024-01-20', status: 'Follow-up', patient: 'Bob Johnson' },
 { id: 'CLM-10004', payer: 'United Health', balance: 6750, dos: '2024-01-22', status: 'Pending', patient: 'Alice Brown' },
 { id: 'CLM-10005', payer: 'Medicare', balance: 11300, dos: '2024-01-25', status: 'In Process', patient: 'Charlie Wilson' }
 ];

 return (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
 <div
 className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-th-heading">
 <div className="flex justify-between items-start">
 <div>
 <h2 className="text-2xl font-black mb-2">Aging Bucket: {bucket.bucket}</h2>
 <p className="text-blue-100">Detailed claim breakdown and analytics</p>
 </div>
 <button
 onClick={onClose}
 className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
 >
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>

 {/* Quick Stats */}
 <div className="grid grid-cols-3 gap-4 mt-6">
 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
 <p className="text-blue-100 text-sm mb-1">Total Balance</p>
 <p className="text-2xl font-black">${(bucket.balance / 1000000).toFixed(2)}M</p>
 </div>
 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
 <p className="text-blue-100 text-sm mb-1">Claim Count</p>
 <p className="text-2xl font-black">{bucket.claimCount}</p>
 </div>
 <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
 <p className="text-blue-100 text-sm mb-1">Collectability</p>
 <p className="text-2xl font-black">{bucket.collectability}%</p>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
 <h3 className="text-lg font-bold text-th-heading mb-4">Claims in this Bucket</h3>

 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-th-surface-overlay/30 text-th-muted text-xs uppercase font-bold">
 <tr>
 <th className="px-4 py-3">Claim ID</th>
 <th className="px-4 py-3">Patient</th>
 <th className="px-4 py-3">Payer</th>
 <th className="px-4 py-3">DOS</th>
 <th className="px-4 py-3">Balance</th>
 <th className="px-4 py-3">Status</th>
 <th className="px-4 py-3">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-th-border">
 {sampleClaims.map((claim) => (
 <tr key={claim.id} className="hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 transition-colors">
 <td className="px-4 py-3 font-bold text-th-heading ">{claim.id}</td>
 <td className="px-4 py-3 text-th-muted ">{claim.patient}</td>
 <td className="px-4 py-3 text-th-muted ">{claim.payer}</td>
 <td className="px-4 py-3 text-th-muted ">{claim.dos}</td>
 <td className="px-4 py-3 font-mono font-bold text-th-heading ">
 ${claim.balance.toLocaleString()}
 </td>
 <td className="px-4 py-3">
 <span className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold">
 {claim.status}
 </span>
 </td>
 <td className="px-4 py-3">
 <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-bold">
 View
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Footer */}
 <div className="border-t border-th-border p-6 bg-th-surface-overlay/30 /50 flex justify-between items-center">
 <p className="text-sm text-th-muted ">
 Showing 5 of {bucket.claimCount} claims
 </p>
 <div className="flex gap-3">
 <button className="px-4 py-2 border border-th-border-strong -strong rounded-lg text-sm font-bold hover:bg-th-surface-overlay dark:hover:bg-th-surface-overlay transition-colors">
 Export to CSV
 </button>
 <button
 onClick={onClose}
 className="px-4 py-2 bg-blue-600 text-th-heading rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
