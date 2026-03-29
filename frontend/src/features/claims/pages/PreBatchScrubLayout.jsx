import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { PreBatchProvider } from '../context/PreBatchContext';

export function PreBatchScrubLayout() {
 const location = useLocation();
 const navigate = useNavigate();

 // Helper to determine active tab class
 const getTabClass = (path) => {
 const isActive = location.pathname === path;
 return `px-4 py-2 text-sm font-bold border-b-2 transition-colors ${isActive
 ? 'border-primary text-primary'
 : 'border-transparent text-th-muted hover:text-th-primary hover:border-th-border-strong'
 }`;
 };

 return (
 <PreBatchProvider>
 <div className="flex flex-col h-full bg-th-surface-overlay/30 dark:bg-background-dark font-sans overflow-hidden">
 {/* Header */}
 <div className="bg-white dark:bg-card-dark border-b border-th-border px-6 py-4 flex items-center justify-between shrink-0">
 <div>
 <div className="flex items-center gap-2 text-xs font-medium text-th-secondary mb-1">
 <span>Claims</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span className="text-th-heading ">Validation & Scrubbing</span>
 </div>
 <h1 className="text-2xl font-black text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">fact_check</span>
 Pre-Batch Scrub
 </h1>
 </div>
 </div>

 {/* Sub-Navigation (Tabs) */}
 <div className="bg-white dark:bg-card-dark border-b border-th-border px-6 flex gap-2 shrink-0">
 <button
 onClick={() => navigate('/claims/pre-batch-scrub/dashboard')}
 className={getTabClass('/claims/pre-batch-scrub/dashboard')}
 >
 Dashboard
 </button>
 <button
 onClick={() => navigate('/claims/pre-batch-scrub/queue')}
 className={getTabClass('/claims/pre-batch-scrub/queue')}
 >
 Validation Queue
 </button>
 <button
 onClick={() => navigate('/claims/pre-batch-scrub/auto-fix')}
 className={getTabClass('/claims/pre-batch-scrub/auto-fix')}
 >
 Auto-Fix Center
 </button>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-hidden relative">
 <Outlet />
 </div>
 </div>
 </PreBatchProvider>
 );
}
