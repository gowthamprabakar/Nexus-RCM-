import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function AICodingAudit() {
    return (
        <div className="flex w-full h-full font-sans">
            {/* Audit Workspace Sidebar */}
            <aside className="w-64 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col justify-between p-4 shrink-0">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-base font-bold text-slate-900 dark:text-white">Audit Workspace</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Review ID: AUD-99281</p>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">list_alt</span>
                            <span className="text-sm font-medium">Worklist</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 bg-primary/10 text-primary rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">fact_check</span>
                            <span className="text-sm font-bold">Audit & Review</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">analytics</span>
                            <span className="text-sm font-medium">Risk Analytics</span>
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-2 text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">done_all</span>
                            <span className="text-sm font-medium">Finalized Claims</span>
                        </a>
                    </nav>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-400">
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span className="text-xs font-bold">Compliance Check</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Claims are being cross-referenced with latest CMS 2024 guidelines.</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-background-dark/50">
                {/* Header */}
                <header className="px-6 py-4 bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500 hover:text-primary cursor-pointer text-sm font-medium transition-colors">Audits</span>
                        <span className="text-slate-300">/</span>
                        <h1 className="text-sm font-bold text-slate-900 dark:text-white">Encounter #88291 - Medical Review</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-slate-500">Assigned Coder:</span>
                            <span className="font-bold text-slate-900 dark:text-white">Michael S.</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[16px]">priority_high</span>
                            High Variance
                        </div>
                    </div>
                </header>

                {/* Audit Workspace Content */}
                <div className="flex-1 overflow-hidden flex gap-0">
                    {/* Column 1: Coding Comparison */}
                    <div className="w-[380px] flex flex-col border-r border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">compare_arrows</span>
                            <h2 className="text-sm font-bold">Coding Comparison</h2>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Coder Results</span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">v1.0</span>
                            </div>

                            {/* Original Code Card */}
                            <div className="border border-slate-200 dark:border-border-dark rounded-lg p-3 mb-3 bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">I50.9</div>
                                        <div className="text-xs text-slate-500">Heart failure, unspecified</div>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-[16px]">history</span>
                                </div>
                            </div>

                            <div className="border border-slate-200 dark:border-border-dark rounded-lg p-3 mb-8 bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">93000</div>
                                        <div className="text-xs text-slate-500">Routine EKG (12-lead)</div>
                                    </div>
                                    <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                                </div>
                            </div>

                            <div className="flex justify-center mb-4">
                                <span className="material-symbols-outlined text-slate-300">arrow_downward</span>
                            </div>

                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Optimization Suggestions</span>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">94% Confidence</span>
                            </div>

                            {/* AI Suggestion Card */}
                            <div className="border-2 border-green-500/20 bg-green-50/10 rounded-lg p-0 overflow-hidden mb-4 relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <div className="text-sm font-bold text-green-700 dark:text-green-400">I50.32 (Optimized)</div>
                                            <div className="text-xs text-slate-500">Chronic diastolic heart failure</div>
                                        </div>
                                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1 rounded uppercase">MCC</span>
                                    </div>
                                    <div className="mt-2 bg-white dark:bg-background-dark p-2 rounded border border-slate-100 text-[10px] italic text-slate-500">
                                        "Evidence of basal rales and LV hypertrophy in notes supports higher specificity."
                                    </div>
                                </div>
                            </div>

                            <div className="border-2 border-amber-500/20 bg-amber-50/10 rounded-lg p-0 overflow-hidden relative">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                                <div className="p-3">
                                    <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-0.5">Add Modifier -25</h3>
                                    <p className="text-xs text-slate-500 mb-2">Separate E/M encounter</p>
                                    <p className="text-[10px] text-amber-600 font-medium">Prevents bundling rejection for CPT 93000.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Risk & Variance Analysis */}
                    <div className="flex-1 flex flex-col overflow-hidden p-6 gap-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Risk & Variance Analysis</h2>

                        {/* KPI Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Financial Impact</p>
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">+$158.40</div>
                            </div>
                            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Compliance Risk</p>
                                <div className="text-2xl font-bold text-amber-500">Medium</div>
                            </div>
                            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm relative">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Score</p>
                                <div className="text-2xl font-bold text-blue-600">82%</div>
                                <span className="absolute bottom-4 right-4 text-[9px] text-slate-400">Target 95%+</span>
                            </div>
                        </div>

                        {/* Variance Detail */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden flex-1">
                            <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center gap-2 text-red-600">
                                <span className="material-symbols-outlined">warning</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Key Variance: DRG Misalignment</h3>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Element</th>
                                            <th className="px-4 py-3 font-medium">Current (Coder)</th>
                                            <th className="px-4 py-3 font-medium">Suggested (AI)</th>
                                            <th className="px-4 py-3 font-medium">Reimbursement Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <td className="px-4 py-3">PDX Code</td>
                                            <td className="px-4 py-3 text-red-500 line-through">I50.9</td>
                                            <td className="px-4 py-3 text-green-600 font-bold">I50.32</td>
                                            <td className="px-4 py-3 text-slate-900 font-medium">+$210.00</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">CC/MCC Status</td>
                                            <td className="px-4 py-3">None</td>
                                            <td className="px-4 py-3 font-bold">MCC Present</td>
                                            <td className="px-4 py-3">Shift to DRG 291</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Reviewer Decision Box */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border-2 border-slate-200 dark:border-slate-700 border-dashed p-6 text-center">
                            <div className="flex items-center gap-2 mb-4 justify-center text-slate-700 dark:text-slate-300 font-bold">
                                <span className="material-symbols-outlined text-primary">edit_note</span>
                                Reviewer Decision
                            </div>
                            <div className="flex justify-center gap-4 mb-6">
                                <button className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-card-dark border-2 border-primary text-primary rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <span className="material-symbols-outlined text-[24px] mb-1">auto_fix_high</span>
                                    <span className="text-xs font-bold">Approve AI</span>
                                </button>
                                <button className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 transition-colors rounded-xl shadow-sm">
                                    <span className="material-symbols-outlined text-[24px] mb-1">undo</span>
                                    <span className="text-xs font-bold leading-tight">Revert to Coder</span>
                                </button>
                                <button className="flex flex-col items-center justify-center w-24 h-24 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 transition-colors rounded-xl shadow-sm">
                                    <span className="material-symbols-outlined text-[24px] mb-1">tune</span>
                                    <span className="text-xs font-bold leading-tight">Manually Adjust</span>
                                </button>
                            </div>
                            <div className="relative">
                                <textarea className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-20" placeholder="Add mandatory reviewer rationale for audit trail..."></textarea>
                                <span className="absolute bottom-2 right-2 material-symbols-outlined text-[12px] text-slate-300">drag_handle</span>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Reviewer Activity Log */}
                    <div className="w-[300px] border-l border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-500">history_edu</span>
                            <h2 className="text-sm font-bold">Reviewer Activity Log</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 relative">
                            {/* Timeline Line */}
                            <div className="absolute left-6 top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-700"></div>

                            {/* Event 1 */}
                            <div className="relative pl-8 mb-8 group">
                                <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-card-dark shadow-sm z-10"></div>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white">System Optimization</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">10:42 AM - AI suggested specificity upgrade for I50.9 to I50.32.</p>
                            </div>

                            {/* Event 2 */}
                            <div className="relative pl-8 mb-8 group">
                                <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-card-dark shadow-sm z-10"></div>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Coder Submission</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">09:15 AM - Michael S. finalized initial coding pass.</p>
                            </div>

                            {/* Event 3 */}
                            <div className="relative pl-8 mb-8 group">
                                <div className="absolute left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-card-dark shadow-sm z-10"></div>
                                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Encounter Ingested</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">08:30 AM - Medical record imported via HL7 integration.</p>
                            </div>
                        </div>

                        {/* Internal QA Scoring */}
                        <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">QA Scoring (Internal)</h3>
                            <div className="mb-3">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-slate-600">Documentation Accuracy</span>
                                    <span className="font-bold">92%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-[92%]"></div>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span className="text-slate-600">Payer Rule Compliance</span>
                                    <span className="font-bold">100%</span>
                                </div>
                                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-full"></div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 p-3 rounded-lg flex justify-between items-center">
                                <span className="text-[10px] font-medium text-slate-500">Overall Coder Performance</span>
                                <div className="flex items-center gap-1">
                                    <div className="flex text-amber-400 text-[12px]">
                                        <span className="material-symbols-outlined fill-current">star</span>
                                        <span className="material-symbols-outlined fill-current">star</span>
                                        <span className="material-symbols-outlined fill-current">star</span>
                                        <span className="material-symbols-outlined fill-current">star</span>
                                        <span className="material-symbols-outlined text-slate-300">star</span>
                                    </div>
                                    <span className="text-xs font-bold">4.0 / 5.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <footer className="h-16 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-border-dark flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-8">
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Audit Status</span>
                            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Pending Supervisor Verification
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Final DRG</span>
                            <div className="text-sm font-bold text-slate-900">291 - Heart Failure with MCC</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">Place in Hold</button>
                        <button className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            Verify & Finalize Claim
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
