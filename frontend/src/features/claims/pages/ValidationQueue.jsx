import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreBatch } from '../context/PreBatchContext';
import { ValidationStatusBadge } from '../components/ValidationStatusBadge';

export function ValidationQueue() {
 const navigate = useNavigate();
 const { filteredClaims, filters, setFilters, applyAllHighConfidenceFixes } = usePreBatch();

 return (
 <div className="flex flex-col h-full">
 {/* Toolbar */}
 <div className="bg-th-surface-raised border-b border-th-border px-6 py-4 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-4 flex-1">
 <div className="relative max-w-xs w-full">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-secondary text-sm">search</span>
 <input
 type="text"
 placeholder="Search Patient or Claim ID..."
 value={filters.search}
 onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
 className="w-full pl-9 h-10 rounded-lg bg-th-surface-overlay/50 border border-th-border text-sm text-th-heading focus:ring-1 focus:ring-primary outline-none placeholder:text-th-muted"
 />
 </div>

 {/* Filters */}
 <select
 value={filters.status}
 onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
 className="h-10 px-3 rounded-lg bg-th-surface-overlay/50 border border-th-border text-sm font-medium text-th-heading outline-none"
 >
 <option value="all">All Statuses</option>
 <option value="passed">Passed</option>
 <option value="autofixed">Auto-Fixed</option>
 <option value="review">Review Required</option>
 <option value="blocked">Blocked</option>
 </select>

 <select
 value={filters.payer}
 onChange={(e) => setFilters(prev => ({ ...prev, payer: e.target.value }))}
 className="h-10 px-3 rounded-lg bg-th-surface-overlay/50 border border-th-border text-sm font-medium text-th-heading outline-none"
 >
 <option value="all">All Payers</option>
 <option value="Aetna Commercial">Aetna Commercial</option>
 <option value="Medicare">Medicare</option>
 <option value="BCBS">BCBS</option>
 <option value="UHC">UHC</option>
 <option value="Cigna">Cigna</option>
 </select>
 </div>

 <button
 onClick={applyAllHighConfidenceFixes}
 className="h-10 px-4 bg-primary text-th-heading rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">auto_fix_high</span>
 Applied High-Confidence Fixes
 </button>
 </div>

 {/* Table */}
 <div className="flex-1 overflow-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-th-surface-raised sticky top-0 z-10 border-b border-th-border">
 <tr>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Claim ID</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Patient</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">DOS</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Payer</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Amount</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Status</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted">Issues</th>
 <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-th-muted text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-700/30 bg-th-surface-raised/50">
 {filteredClaims.length === 0 ? (
 <tr>
 <td colSpan="8" className="px-6 py-12 text-center text-th-muted">
 No claims found matching your filters.
 </td>
 </tr>
 ) : (
 filteredClaims.map((claim) => (
 <tr
 key={claim.id}
 onClick={() => navigate(`/claims/pre-batch-scrub/claim/${claim.id}`)}
 className="hover:bg-th-surface-overlay/50 transition-colors group cursor-pointer"
 >
 <td className="px-6 py-4 font-mono text-xs font-bold text-th-secondary">{claim.id}</td>
 <td className="px-6 py-4 text-sm font-bold text-th-heading">{claim.patient}</td>
 <td className="px-6 py-4 text-sm text-th-secondary">{claim.dos}</td>
 <td className="px-6 py-4 text-sm font-medium text-th-heading">
 {claim.payer}
 </td>
 <td className="px-6 py-4 text-sm font-mono font-medium text-th-heading tabular-nums">${claim.amount.toLocaleString()}</td>
 <td className="px-6 py-4">
 <ValidationStatusBadge status={claim.status} size="sm" />
 </td>
 <td className="px-6 py-4">
 {claim.issues.length > 0 ? (
 <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-900/10 text-red-400 text-xs font-bold">
 <span className="material-symbols-outlined text-[14px]">warning</span>
 <span className="tabular-nums">{claim.issues.length}</span> Issues
 </span>
 ) : (
 <span className="text-xs text-th-muted">-</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-primary hover:text-primary-dark font-bold text-xs hover:underline">
 {claim.status === 'Review Required' ? 'Fix Now' : 'View Details'}
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Footer */}
 <div className="bg-th-surface-raised border-t border-th-border px-6 py-3 flex items-center justify-between text-xs text-th-secondary">
 <span>Showing {filteredClaims.length} results</span>
 <div className="flex gap-2">
 <button className="px-3 py-1 rounded border border-th-border hover:bg-th-surface-overlay/50 disabled:opacity-50 text-th-secondary" disabled>Previous</button>
 <button className="px-3 py-1 rounded border border-th-border hover:bg-th-surface-overlay/50 text-th-secondary">Next</button>
 </div>
 </div>
 </div>
 );
}
