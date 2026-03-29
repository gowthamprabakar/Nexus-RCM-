import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { RetryBackoffChart } from '../components/RetryBackoffChart';
import { RetryQueueTable } from '../components/RetryQueueTable';
import { TrendIndicator } from '../components/TrendIndicator';

export function EVVAutoRetryManager() {
 const navigate = useNavigate();
 const [queue, setQueue] = useState([]);
 const [evvStats, setEvvStats] = useState({ activeRetries: 0, successRate24h: 0, revenueRecovered: 0, avgRetryCount: 0 });
 const [backoffStrategy, setBackoffStrategy] = useState('exponential');
 const [automationEnabled, setAutomationEnabled] = useState(true);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   api.denials.list({ denial_category: 'EVV', size: 100 }).then(data => {
     const items = data?.items || [];
     setQueue(items);
     const retrying = items.filter(i => i.status === 'Retrying' || i.status === 'Pending');
     const succeeded = items.filter(i => i.status === 'Success' || i.status === 'Resolved');
     setEvvStats({
       activeRetries: retrying.length,
       successRate24h: items.length > 0 ? Math.round((succeeded.length / items.length) * 100) : 0,
       revenueRecovered: succeeded.reduce((sum, i) => sum + (i.amount || 0), 0),
       avgRetryCount: items.length > 0 ? +(items.reduce((sum, i) => sum + (i.retry_count || i.retryCount || 1), 0) / items.length).toFixed(1) : 0
     });
     setLoading(false);
   }).catch(() => setLoading(false));
 }, []);

 const handleQueueAction = (action, id) => {
 console.log(`Action: ${action} on ID: ${id}`);

 if (action === 'details') {
 const item = queue.find(i => i.id === id);
 if (item) {
 navigate(`/denials/claim/${item.claimId}`);
 }
 return;
 }

 if (action === 'retry') {
 setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'Retrying' } : item));
 setTimeout(() => {
 setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'Success' } : item));
 }, 2000);
 }
 };

 if (loading) return (
   <div className="flex-1 flex items-center justify-center h-full">
     <div className="text-th-secondary text-sm">Loading EVV data...</div>
   </div>
 );

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

 {/* Header */}
 <div className="flex flex-wrap justify-between items-start gap-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <button onClick={() => navigate(-1)} className="text-th-secondary hover:text-th-heading">
 <span className="material-symbols-outlined">arrow_back</span>
 </button>
 <h1 className="text-2xl font-black text-th-heading">EVV Auto-Retry Manager</h1>
 <span className="ai-prescriptive">Prescriptive AI</span>
 </div>
 <p className="text-th-secondary text-sm pl-8">
 Autonomous recovery for Electronic Visit Verification failures.
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${automationEnabled ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400' : 'bg-th-surface-overlay/50 border-th-border text-th-muted'}`}>
 <div className={`w-2.5 h-2.5 rounded-full ${automationEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-th-surface-overlay/300'}`}></div>
 <span className="text-sm font-bold">{automationEnabled ? 'Automation Active' : 'System Paused'}</span>
 </div>
 <button
 onClick={() => setAutomationEnabled(!automationEnabled)}
 className="text-sm font-semibold text-primary hover:underline"
 >
 {automationEnabled ? 'Pause System' : 'Resume'}
 </button>
 </div>
 </div>

 {/* Section 1: Executive Metrics */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Active Retries</div>
 <div className="flex items-end justify-between">
 <div className="text-3xl font-black text-th-heading tabular-nums">{evvStats.activeRetries}</div>
 <div className="p-1.5 rounded-lg bg-blue-900/20 text-blue-400">
 <span className="material-symbols-outlined">refresh</span>
 </div>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Success Rate (24h)</div>
 <div className="flex items-end justify-between">
 <div className="text-3xl font-black text-emerald-500 tabular-nums">{evvStats.successRate24h}%</div>
 <TrendIndicator direction="up" value="2.4%" />
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 border-l-[3px] border-l-amber-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Revenue Recovered</div>
 <div className="flex items-end justify-between">
 <div className="text-3xl font-black text-th-heading py-1 tabular-nums">${(evvStats.revenueRecovered / 1000).toFixed(1)}k</div>
 <div className="p-1.5 rounded-lg bg-emerald-900/20 text-emerald-400">
 <span className="material-symbols-outlined">attach_money</span>
 </div>
 </div>
 </div>
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-5 border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">Avg. Attempts</div>
 <div className="flex items-end justify-between">
 <div className="text-3xl font-black text-th-heading tabular-nums">{evvStats.avgRetryCount}</div>
 <span className="text-xs text-th-muted mb-1 tabular-nums">Target: &lt; 3.0</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left: Queue Table (Main Workspace) */}
 <div className="lg:col-span-2 space-y-6">
 <RetryQueueTable queue={queue} onAction={handleQueueAction} />
 </div>

 {/* Right: Controls & Strategy */}
 <div className="space-y-6">
 {/* Control Panel */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl p-6">
 <h3 className="font-bold text-th-heading flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-purple-500">tune</span>
 Strategy Configuration
 </h3>

 <div className="space-y-6">
 <div>
 <label className="text-sm font-semibold text-th-heading block mb-2">Backoff Algorithm</label>
 <div className="bg-th-surface-overlay/50 p-1 rounded-lg flex">
 <button
 onClick={() => setBackoffStrategy('linear')}
 className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${backoffStrategy === 'linear' ? 'bg-th-surface-overlay text-th-heading shadow-sm' : 'text-th-muted hover:text-th-heading'}`}
 >
 Linear
 </button>
 <button
 onClick={() => setBackoffStrategy('exponential')}
 className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${backoffStrategy === 'exponential' ? 'bg-th-surface-overlay text-th-heading shadow-sm' : 'text-th-muted hover:text-th-heading'}`}
 >
 Exponential
 </button>
 </div>
 </div>

 <RetryBackoffChart strategy={backoffStrategy} />

 <div className="p-4 bg-purple-900/10 rounded-xl border border-purple-800/30">
 <div className="flex gap-3">
 <span className="material-symbols-outlined text-purple-400">psychology</span>
 <div>
 <div className="text-sm font-bold text-purple-100">Smart Pause Active</div>
 <p className="text-xs text-purple-300 mt-1 leading-relaxed">
 AI has detected a 40% failure rate for "Missing Signature" errors today. Retries for this specific reason are temporarily paused to prevent rejection fees.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="bg-th-surface-raised border border-th-border text-th-heading rounded-xl p-6">
 <h3 className="font-bold mb-2 text-th-heading">Exception Handling</h3>
 <p className="text-sm text-th-secondary mb-4">
 12 claims have exceeded max retries (5) and require manual intervention.
 </p>
 <button className="w-full py-2.5 bg-primary text-th-heading font-bold rounded-lg hover:bg-primary/90 transition-colors">
 Review Exceptions
 </button>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
