import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function CodingOptimizer() {
    return (
        <div className="flex w-full h-full">
            {/* Local Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-background-dark flex flex-col justify-between p-4 shrink-0">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-base font-bold">Coding Agent</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-semibold mt-1">Optimization Workspace</p>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <NavLink
                            to="/ai-coding"
                            end
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">code</span>
                            <span className="text-sm">Coding Optimizer</span>
                        </NavLink>
                        <NavLink
                            to="/ai-coding/audit"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">policy</span>
                            <span className="text-sm">Audits & Reviews</span>
                        </NavLink>
                        <NavLink
                            to="/ai-coding/compliance"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">shield_person</span>
                            <span className="text-sm">Compliance</span>
                        </NavLink>
                        <NavLink
                            to="/ai-coding/rulebook"
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold"
                                    : "text-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            <span className="material-symbols-outlined text-[20px]">menu_book</span>
                            <span className="text-sm">Payer Rulebook</span>
                        </NavLink>
                    </nav>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-green-500 text-[18px]">verified</span>
                        <span className="text-xs font-bold">AI Assistant Live</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Processing real-time payer updates for Cigna and Medicare B.</p>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden h-full">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark shrink-0">
                    <a className="text-slate-500 text-sm font-medium hover:text-primary transition-colors" href="#">Encounters</a>
                    <span className="text-slate-400 text-sm">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-bold">Encounter #88291 - Optimization</span>
                </div>

                {/* Main Three-Panel Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT PANEL: Source Clinical Documentation */}
                    <section className="w-1/3 border-r border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark flex flex-col min-w-[350px]">
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark shrink-0">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                                Source Clinical Documentation
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-slate-900 dark:text-slate-200">
                            <p className="mb-4 font-bold text-xs text-slate-500">CHIEF COMPLAINT: Chest Pain</p>
                            <p className="mb-4 italic text-xs text-slate-500">Encounter Date: 2023-10-12 | Provider: Dr. Sarah Chen</p>
                            <p className="mb-4">
                                Patient is a 58-year-old male presenting with intermittent chest pain that started two days ago.
                                He describes the pain as a pressure-like sensation localized to the substernal region.
                                <span className="bg-primary/15 border-b-2 border-primary px-1 rounded cursor-pointer hover:bg-primary/25 transition-colors" title="Linked to ICD-10 Code: I20.9">Pain radiates to the left arm</span> and is associated with shortness of breath.
                            </p>
                            <p className="mb-4">
                                PAST MEDICAL HISTORY: <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to ICD-10 Code: I10">Hypertension</span>, Type 2 Diabetes, and Hyperlipidemia.
                                The patient has a history of smoking (1 pack/day for 20 years).
                            </p>
                            <p className="mb-4">
                                EXAMINATION: Cardiovascular exam reveals regular rate and rhythm. No murmurs, rubs, or gallops.
                                Respiratory exam shows <span className="bg-primary/15 border-b-2 border-primary px-1 rounded cursor-pointer hover:bg-primary/25 transition-colors" title="Evidence for higher specificity">bilateral basal rales</span>.
                            </p>
                            <p className="mb-4">
                                PROCEDURE: An <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to CPT: 93000">12-lead Electrocardiogram (EKG)</span> was performed in the office.
                                Results show ST-segment depression in leads V4-V6.
                                Ordered <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to CPT: 82550">Cardiac Enzymes</span> and immediate referral to Cardiology for further evaluation.
                            </p>
                            <div className="mt-8 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                                    <span className="text-xs font-bold">Documentation Gap Identified</span>
                                </div>
                                <p className="text-xs text-amber-800 dark:text-amber-300">Provider mentioned "intermittent" but didn't specify frequency or triggers. Clarification may unlock higher tier DRG.</p>
                            </div>
                        </div>
                    </section>

                    {/* CENTER PANEL: AI Code Selector */}
                    <section className="flex-1 bg-slate-50 dark:bg-background-dark flex flex-col min-w-[400px]">
                        <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark shrink-0">
                            <div className="flex border-b border-slate-200 dark:border-border-dark px-4 gap-8">
                                <button className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-primary pb-[10px] pt-4">
                                    <p className="text-xs font-bold uppercase tracking-wider">All Codes</p>
                                </button>
                                <button className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-slate-500 pb-[10px] pt-4 hover:text-primary transition-colors">
                                    <p className="text-xs font-bold uppercase tracking-wider">ICD-10</p>
                                </button>
                                <button className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-slate-500 pb-[10px] pt-4 hover:text-primary transition-colors">
                                    <p className="text-xs font-bold uppercase tracking-wider">CPT</p>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                            {/* Suggestion Card 1 */}
                            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 inline-block">ICD-10 (Suggested)</span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">I20.9</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Angina pectoris, unspecified</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm">
                                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                                            98% Confidence
                                        </div>
                                        <div className="w-24 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-green-500 h-full w-[98%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg mb-4">
                                    <p className="text-xs text-slate-900 dark:text-slate-300 font-medium">AI Justification:</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">"Substernal pressure localized and radiating to left arm is pathognomonic for angina pectoris."</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Compare</button>
                                    <button className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-blue-700 transition-colors">Accept Code</button>
                                </div>
                            </div>

                            {/* Suggestion Card 2 (Optimization Alert) */}
                            <div className="bg-white dark:bg-card-dark border-2 border-amber-200 dark:border-amber-800/50 rounded-xl p-4 shadow-sm relative">
                                <div className="absolute -top-3 left-4 bg-amber-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                                    Specificity Improvement
                                </div>
                                <div className="flex justify-between items-start mb-3 mt-1">
                                    <div>
                                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 inline-block">ICD-10 (Optimized)</span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">I50.32</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Chronic diastolic (left ventricular) heart failure</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
                                            <span className="material-symbols-outlined text-[16px]">priority_high</span>
                                            82% Confidence
                                        </div>
                                        <div className="w-24 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="bg-amber-500 h-full w-[82%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg mb-4">
                                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium italic">Replaces: I50.9 (Heart failure, unspecified)</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Based on "bilateral basal rales" in clinical exam documentation.</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button className="px-4 py-1.5 bg-primary text-white rounded text-xs font-bold hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all">Replace Current Code</button>
                                </div>
                            </div>

                            {/* Suggestion Card 3 (CPT) */}
                            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 inline-block">CPT (Procedure)</span>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">93000</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Electrocardiogram, routine ECG with at least 12 leads</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-sm">
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            Validated
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button className="px-4 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded text-xs font-bold cursor-not-allowed" disabled>Already Added</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT PANEL: Payer-Specific Rule Validation */}
                    <section className="w-80 border-l border-slate-200 dark:border-border-dark bg-white dark:bg-card-dark flex flex-col shrink-0">
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark shrink-0">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">fact_check</span>
                                Payer Rule Validation
                            </h2>
                        </div>
                        <div className="p-4 border-b border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 shrink-0">
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Payer</label>
                            <div className="flex items-center justify-between bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-3 py-1.5 cursor-pointer">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Medicare - Part B</span>
                                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                            <div className="flex gap-3 items-start">
                                <div className="size-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[16px]">check</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Medical Necessity Found</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ICD-10 I20.9 is a covered diagnosis for CPT 93000 under LCD L34636.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="size-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[16px]">check</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">NCD Compliance</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Met billing frequency requirements (1 per 12 months).</p>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <div className="size-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[16px]">warning</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">Modifier Required</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Add Modifier -25 to E/M code as a separate procedure (EKG) was performed.</p>
                                    <button className="mt-1 text-[10px] text-primary font-bold hover:underline">Apply Modifier -25</button>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start opacity-50">
                                <div className="size-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-[16px]">hourglass_empty</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">CCl Edit Check</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Pending acceptance of suggested codes.</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Revenue Impact Bar (Sticky Footer) */}
                <footer className="h-16 bg-white dark:bg-card-dark border-t border-slate-200 dark:border-border-dark flex items-center justify-between px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] shrink-0 z-10 relative">
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Claim Value</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">$142.50</span>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-700">arrow_forward</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Optimized Claim Value</span>
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">$218.75</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 px-3 py-1 rounded-lg">
                            <span className="text-xs font-bold text-green-700 dark:text-green-300">+ $76.25 Net Impact</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors">Save Draft</button>
                        <button className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-primary/30 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">publish</span>
                            Finalize & Submit to Billing
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
