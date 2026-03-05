import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDenialData } from '../data/mockDenialData';
import { RetryBackoffChart } from '../components/RetryBackoffChart';
import { RetryQueueTable } from '../components/RetryQueueTable';
import { TrendIndicator } from '../components/TrendIndicator';

export function EVVAutoRetryManager() {
    const navigate = useNavigate();
    const { evvStats, evvQueue } = mockDenialData;
    const [queue, setQueue] = useState(evvQueue);
    const [backoffStrategy, setBackoffStrategy] = useState('exponential');
    const [automationEnabled, setAutomationEnabled] = useState(true);

    const handleQueueAction = (action, id) => {
        console.log(`Action: ${action} on ID: ${id}`);

        if (action === 'details') {
            const item = queue.find(i => i.id === id);
            if (item) {
                navigate(`/denials/claim/${item.claimId}`);
            }
            return;
        }

        // In a real app, this would trigger an API call
        if (action === 'retry') {
            setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'Retrying' } : item));
            setTimeout(() => {
                setQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'Success' } : item));
            }, 2000);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">EVV Auto-Retry Manager</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm pl-8">
                            Autonomous recovery for Electronic Visit Verification failures.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${automationEnabled ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${automationEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
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
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Active Retries</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">{evvStats.activeRetries}</div>
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <span className="material-symbols-outlined">refresh</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Success Rate (24h)</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-black text-emerald-600">{evvStats.successRate24h}%</div>
                            <TrendIndicator direction="up" value="2.4%" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Revenue Recovered</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-black text-slate-900 dark:text-white py-1">${(evvStats.revenueRecovered / 1000).toFixed(1)}k</div>
                            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                <span className="material-symbols-outlined">attach_money</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-5 shadow-sm">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Avg. Attempts</div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-black text-slate-900 dark:text-white">{evvStats.avgRetryCount}</div>
                            <span className="text-xs text-slate-400 mb-1">Target: &lt; 3.0</span>
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
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-purple-500">tune</span>
                                Strategy Configuration
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Backoff Algorithm</label>
                                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                                        <button
                                            onClick={() => setBackoffStrategy('linear')}
                                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${backoffStrategy === 'linear' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Linear
                                        </button>
                                        <button
                                            onClick={() => setBackoffStrategy('exponential')}
                                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${backoffStrategy === 'exponential' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            Exponential
                                        </button>
                                    </div>
                                </div>

                                <RetryBackoffChart strategy={backoffStrategy} />

                                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                    <div className="flex gap-3">
                                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">psychology</span>
                                        <div>
                                            <div className="text-sm font-bold text-purple-900 dark:text-purple-100">Smart Pause Active</div>
                                            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1 leading-relaxed">
                                                AI has detected a 40% failure rate for "Missing Signature" errors today. Retries for this specific reason are temporarily paused to prevent rejection fees.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-lg">
                            <h3 className="font-bold mb-2">Exception Handling</h3>
                            <p className="text-sm text-slate-300 mb-4">
                                12 claims have exceeded max retries (5) and require manual intervention.
                            </p>
                            <button className="w-full py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors">
                                Review Exceptions
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
