import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const AI_LEVEL_BADGES = {
 descriptive: (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/20">
 <span className="material-symbols-outlined text-[10px]">bar_chart</span>
 Descriptive AI
 </span>
 ),
 diagnostic: (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/15 text-purple-400 border border-purple-500/20">
 <span className="material-symbols-outlined text-[10px]">search</span>
 Diagnostic AI
 </span>
 ),
 predictive: (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
 <span className="material-symbols-outlined text-[10px]">trending_up</span>
 Predictive AI
 </span>
 ),
 prescriptive: (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
 <span className="material-symbols-outlined text-[10px]">auto_fix_high</span>
 Prescriptive AI
 </span>
 ),
};

export function CodingOptimizer() {
 const [encounterSearch, setEncounterSearch] = useState('');
 const [activeEncounter, setActiveEncounter] = useState({ id: '88291', chief: 'Chest Pain', date: '2023-10-12', provider: 'Dr. Sarah Chen' });
 const [codeFilterTab, setCodeFilterTab] = useState('all');
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [auditData, setAuditData] = useState(null);
 const [suggestionsData, setSuggestionsData] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const [audit, suggestions] = await Promise.all([
         api.coding.getAudit(),
         api.coding.getSuggestions(activeEncounter.id),
       ]);
       setAuditData(audit);
       setSuggestionsData(suggestions);
     } catch (err) {
       console.error('Failed to load coding optimizer data:', err);
       setError(err.message || 'Failed to load data');
     } finally {
       setLoading(false);
     }
   }
   load();
 }, [activeEncounter.id]);

 // Derive coding accuracy metrics from coding API data
 const codingAccuracy = auditData?.coding_accuracy_pct != null
   ? `${auditData.coding_accuracy_pct}%` : '--';
 const codingErrors = auditData?.total_coding_denials ?? '--';
 const codingDenialImpact = auditData?.denials_by_carc?.length > 0
   ? `$${(auditData.denials_by_carc.reduce((sum, d) => sum + (d.total_amount || 0), 0) / 1000).toFixed(1)}k`
   : '$0';
 const lineSuggestions = suggestionsData?.line_suggestions || [];

 const handleEncounterSearch = (e) => {
 if (e.key === 'Enter' && encounterSearch.trim()) {
 setActiveEncounter({ id: encounterSearch.trim(), chief: 'Loading...', date: '', provider: '' });
 setEncounterSearch('');
 }
 };

 return (
 <div className="flex flex-col w-full h-full bg-th-surface-base">
 {/* Encounter Search Bar */}
 <div className="shrink-0 px-6 py-3 bg-th-surface-raised border-b border-th-border flex items-center gap-4">
 <div className="flex items-center gap-2 flex-1 max-w-lg">
 <span className="material-symbols-outlined text-th-muted text-[20px]">search</span>
 <input
 type="text"
 value={encounterSearch}
 onChange={(e) => setEncounterSearch(e.target.value)}
 onKeyDown={handleEncounterSearch}
 placeholder="Search encounter by ID, patient name, or date..."
 className="flex-1 bg-transparent border-none text-sm text-th-heading placeholder-slate-600 focus:outline-none"
 />
 </div>
 <div className="h-6 w-px bg-slate-700/50" />
 <div className="flex items-center gap-3">
 <span className="text-th-muted text-xs">Active:</span>
 <span className="text-th-heading text-sm font-bold">Encounter #{activeEncounter.id}</span>
 <span className="text-th-muted text-xs">—</span>
 <span className="text-th-secondary text-sm">{activeEncounter.chief}</span>
 {activeEncounter.provider && (
 <>
 <span className="text-th-muted text-xs">|</span>
 <span className="text-th-secondary text-sm">{activeEncounter.provider}</span>
 </>
 )}
 </div>
 {/* Real-time coding metrics in search bar */}
 {!loading && (
 <div className="ml-auto flex items-center gap-4">
   <div className="text-center px-3">
     <p className="text-[9px] font-bold uppercase text-th-muted">Coding Score</p>
     <p className="text-sm font-black text-primary tabular-nums">{codingAccuracy}</p>
   </div>
   <div className="text-center px-3">
     <p className="text-[9px] font-bold uppercase text-th-muted">Errors</p>
     <p className="text-sm font-black text-amber-500 tabular-nums">{codingErrors}</p>
   </div>
   <div className="text-center px-3">
     <p className="text-[9px] font-bold uppercase text-th-muted">Denial Impact</p>
     <p className="text-sm font-black text-rose-500 tabular-nums">{codingDenialImpact}</p>
   </div>
 </div>
 )}
 </div>

 {/* Error State */}
 {error && (
 <div className="mx-6 my-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
   <span className="material-symbols-outlined text-red-400">error</span>
   <div>
     <p className="text-sm font-bold text-red-400">Failed to load coding data</p>
     <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
   </div>
   <button onClick={() => window.location.reload()} className="ml-auto px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10">Retry</button>
 </div>
 )}

 {/* Main Three-Panel Workspace */}
 <div className="flex-1 flex overflow-hidden">
 {/* LEFT PANEL: Source Clinical Documentation */}
 <section className="w-1/3 border-r border-th-border bg-th-surface-raised flex flex-col min-w-[350px]">
 <div className="p-4 border-b border-th-border shrink-0">
 <h2 className="text-sm font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-cyan-400 text-[20px]">description</span>
 Source Clinical Documentation
 {AI_LEVEL_BADGES.descriptive}
 </h2>
 </div>
 <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed text-th-heading">
 <p className="mb-4 font-bold text-xs text-th-muted">CHIEF COMPLAINT: Chest Pain</p>
 <p className="mb-4 italic text-xs text-th-muted">Encounter Date: 2023-10-12 | Provider: Dr. Sarah Chen</p>
 <p className="mb-4">
 Patient is a 58-year-old male presenting with intermittent chest pain that started two days ago.
 He describes the pain as a pressure-like sensation localized to the substernal region.
 <span className="bg-cyan-500/15 border-b-2 border-cyan-400 px-1 rounded cursor-pointer hover:bg-cyan-500/25 transition-colors" title="Linked to ICD-10 Code: I20.9">Pain radiates to the left arm</span> and is associated with shortness of breath.
 </p>
 <p className="mb-4">
 PAST MEDICAL HISTORY: <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to ICD-10 Code: I10">Hypertension</span>, Type 2 Diabetes, and Hyperlipidemia.
 The patient has a history of smoking (1 pack/day for 20 years).
 </p>
 <p className="mb-4">
 EXAMINATION: Cardiovascular exam reveals regular rate and rhythm. No murmurs, rubs, or gallops.
 Respiratory exam shows <span className="bg-cyan-500/15 border-b-2 border-cyan-400 px-1 rounded cursor-pointer hover:bg-cyan-500/25 transition-colors" title="Evidence for higher specificity">bilateral basal rales</span>.
 </p>
 <p className="mb-4">
 PROCEDURE: An <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to CPT: 93000">12-lead Electrocardiogram (EKG)</span> was performed in the office.
 Results show ST-segment depression in leads V4-V6.
 Ordered <span className="bg-green-500/15 border-b-2 border-green-500 px-1 rounded cursor-pointer hover:bg-green-500/25 transition-colors" title="Linked to CPT: 82550">Cardiac Enzymes</span> and immediate referral to Cardiology for further evaluation.
 </p>
 <div className="mt-8 p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
 <div className="flex items-center gap-2 text-amber-400 mb-1">
 <span className="material-symbols-outlined text-[18px]">lightbulb</span>
 <span className="text-xs font-bold">Documentation Gap Identified</span>
 </div>
 <p className="text-xs text-amber-300/80">Provider mentioned "intermittent" but didn't specify frequency or triggers. Clarification may unlock higher tier DRG.</p>
 </div>
 </div>
 </section>

 {/* CENTER PANEL: AI Code Selector */}
 <section className="flex-1 bg-th-surface-base flex flex-col min-w-[400px]">
 <div className="bg-th-surface-raised border-b border-th-border shrink-0">
 <div className="flex border-b border-th-border px-4 gap-8">
 {[
 { key: 'all', label: 'All Codes' },
 { key: 'icd', label: 'ICD-10' },
 { key: 'cpt', label: 'CPT' },
 ].map((tab) => (
 <button
 key={tab.key}
 onClick={() => setCodeFilterTab(tab.key)}
 className={`flex flex-col items-center justify-center border-b-[3px] pb-[10px] pt-4 transition-colors ${
 codeFilterTab === tab.key
 ? 'border-b-cyan-400 text-cyan-400'
 : 'border-b-transparent text-th-muted hover:text-th-heading'
 }`}
 >
 <p className="text-xs font-bold uppercase tracking-wider">{tab.label}</p>
 </button>
 ))}
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
 {/* Suggestion Card 1 */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">ICD-10 (Suggested)</span>
 {AI_LEVEL_BADGES.descriptive}
 </div>
 <h3 className="text-lg font-bold text-th-heading">I20.9</h3>
 <p className="text-sm text-th-secondary">Angina pectoris, unspecified</p>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
 <span className="material-symbols-outlined text-[16px]">trending_up</span>
 <span className="tabular-nums">98%</span> Confidence
 </div>
 <div className="w-24 bg-th-surface-overlay h-1.5 rounded-full mt-1 overflow-hidden">
 <div className="bg-green-500 h-full w-[98%]"></div>
 </div>
 </div>
 </div>
 <div className="bg-th-surface-overlay/50 p-2 rounded-lg mb-3">
 <div className="flex items-center gap-2 mb-1">
 <p className="text-xs text-th-heading font-medium">Why this code:</p>
 {AI_LEVEL_BADGES.diagnostic}
 </div>
 <p className="text-xs text-th-secondary italic">"Substernal pressure localized and radiating to left arm is pathognomonic for angina pectoris."</p>
 </div>
 <div className="flex items-center gap-2 mb-3 px-2">
 <span className="text-[10px] text-th-muted">Denial Risk:</span>
 {AI_LEVEL_BADGES.predictive}
 <span className="text-xs font-bold text-green-400 tabular-nums">Low (4%)</span>
 </div>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-green-400 text-[16px]">verified</span>
 <span className="text-[10px] text-green-400 font-bold">NCCI/CCI: No edits found</span>
 </div>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 border border-th-border rounded text-xs font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">Compare</button>
 <button className="px-4 py-1.5 bg-cyan-500 text-white rounded text-xs font-bold hover:bg-cyan-600 transition-colors">Accept Code</button>
 </div>
 </div>
 </div>

 {/* Suggestion Card 2 (Optimization Alert) */}
 <div className="bg-th-surface-raised border-2 border-amber-800/50 rounded-xl p-4 shadow-sm relative hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute -top-3 left-4 bg-amber-500 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1">
 <span className="material-symbols-outlined text-[12px]">bolt</span>
 Specificity Improvement
 </div>
 <div className="flex justify-between items-start mb-3 mt-1">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">ICD-10 (Optimized)</span>
 {AI_LEVEL_BADGES.prescriptive}
 </div>
 <h3 className="text-lg font-bold text-th-heading">I50.32</h3>
 <p className="text-sm text-th-secondary">Chronic diastolic (left ventricular) heart failure</p>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
 <span className="material-symbols-outlined text-[16px]">priority_high</span>
 <span className="tabular-nums">82%</span> Confidence
 </div>
 <div className="w-24 bg-th-surface-overlay h-1.5 rounded-full mt-1 overflow-hidden">
 <div className="bg-amber-500 h-full w-[82%]"></div>
 </div>
 </div>
 </div>
 <div className="bg-amber-900/10 p-2 rounded-lg mb-3">
 <div className="flex items-center gap-2 mb-1">
 <p className="text-xs text-amber-300 font-medium italic">Replaces: I50.9 (Heart failure, unspecified)</p>
 </div>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[10px] text-th-muted">Why this code:</span>
 {AI_LEVEL_BADGES.diagnostic}
 </div>
 <p className="text-xs text-th-secondary mt-1">Based on "bilateral basal rales" in clinical exam documentation.</p>
 </div>
 <div className="flex items-center gap-2 mb-3 px-2">
 <span className="text-[10px] text-th-muted">Denial Risk:</span>
 {AI_LEVEL_BADGES.predictive}
 <span className="text-xs font-bold text-amber-400 tabular-nums">Medium (18%)</span>
 </div>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-amber-400 text-[16px]">info</span>
 <span className="text-[10px] text-amber-400 font-bold">NCCI/CCI: Review modifier pairing</span>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-1.5 bg-cyan-500 text-white rounded text-xs font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 transition-all">Replace Current Code</button>
 </div>
 </div>
 </div>

 {/* Suggestion Card 3 (CPT) */}
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-purple-500 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">CPT (Procedure)</span>
 {AI_LEVEL_BADGES.descriptive}
 </div>
 <h3 className="text-lg font-bold text-th-heading">93000</h3>
 <p className="text-sm text-th-secondary">Electrocardiogram, routine ECG with at least 12 leads</p>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
 <span className="material-symbols-outlined text-[16px]">check_circle</span>
 Validated
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2 mb-3 px-2">
 <span className="text-[10px] text-th-muted">Denial Risk:</span>
 {AI_LEVEL_BADGES.predictive}
 <span className="text-xs font-bold text-green-400 tabular-nums">Low (2%)</span>
 </div>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-green-400 text-[16px]">verified</span>
 <span className="text-[10px] text-green-400 font-bold">NCCI/CCI: No edits found</span>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-1.5 bg-th-surface-overlay text-th-muted rounded text-xs font-bold cursor-not-allowed" disabled>Already Added</button>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* RIGHT PANEL: Payer-Specific Rule Validation */}
 <section className="w-80 border-l border-th-border bg-th-surface-raised flex flex-col shrink-0">
 <div className="p-4 border-b border-th-border shrink-0">
 <h2 className="text-sm font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-cyan-400 text-[20px]">fact_check</span>
 Payer Rule Validation
 </h2>
 </div>
 <div className="p-4 border-b border-th-border bg-th-surface-overlay/50 shrink-0">
 <label className="text-[10px] font-bold text-th-muted uppercase block mb-1">Target Payer</label>
 <div className="flex items-center justify-between bg-th-surface-base/50 border border-th-border rounded px-3 py-1.5 cursor-pointer">
 <span className="text-sm font-medium text-th-heading">Medicare - Part B</span>
 <span className="material-symbols-outlined text-[18px] text-th-secondary">expand_more</span>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
 <div className="flex gap-3 items-start">
 <div className="size-6 rounded-full bg-green-900/40 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-green-400 text-[16px]">check</span>
 </div>
 <div>
 <p className="text-xs font-bold text-th-heading">Medical Necessity Found</p>
 <p className="text-[11px] text-th-muted mt-0.5">ICD-10 I20.9 is a covered diagnosis for CPT 93000 under LCD L34636.</p>
 </div>
 </div>
 <div className="flex gap-3 items-start">
 <div className="size-6 rounded-full bg-green-900/40 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-green-400 text-[16px]">check</span>
 </div>
 <div>
 <p className="text-xs font-bold text-th-heading">NCD Compliance</p>
 <p className="text-[11px] text-th-muted mt-0.5">Met billing frequency requirements (1 per 12 months).</p>
 </div>
 </div>
 <div className="flex gap-3 items-start">
 <div className="size-6 rounded-full bg-red-900/40 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-red-400 text-[16px]">warning</span>
 </div>
 <div>
 <p className="text-xs font-bold text-th-heading">Modifier Required</p>
 <p className="text-[11px] text-th-muted mt-0.5">Add Modifier -25 to E/M code as a separate procedure (EKG) was performed.</p>
 <button className="mt-1 text-[10px] text-cyan-400 font-bold hover:underline">Apply Modifier -25</button>
 </div>
 </div>
 <div className="flex gap-3 items-start">
 <div className="size-6 rounded-full bg-cyan-900/40 flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-cyan-400 text-[16px]">fact_check</span>
 </div>
 <div>
 <div className="flex items-center gap-2 mb-0.5">
 <p className="text-xs font-bold text-th-heading">NCCI/CCI Edit Check</p>
 {AI_LEVEL_BADGES.predictive}
 </div>
 <p className="text-[11px] text-th-muted mt-0.5">No unbundling conflicts detected for current code set. CPT 93000 + E/M is compliant with modifier -25.</p>
 </div>
 </div>
 <div className="flex gap-3 items-start opacity-50">
 <div className="size-6 rounded-full bg-th-surface-overlay flex items-center justify-center shrink-0">
 <span className="material-symbols-outlined text-th-secondary text-[16px]">hourglass_empty</span>
 </div>
 <div>
 <p className="text-xs font-bold text-th-heading">MUE Validation</p>
 <p className="text-[11px] text-th-muted mt-0.5">Pending acceptance of suggested codes.</p>
 </div>
 </div>
 </div>
 </section>
 </div>

 {/* Revenue Impact Bar (Sticky Footer) */}
 <footer className="h-16 bg-th-surface-raised border-t border-th-border flex items-center justify-between px-8 shadow-[0_-4px_10px_rgba(0,0,0,0.2)] shrink-0 z-10 relative">
 <div className="flex items-center gap-10">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-th-muted uppercase tracking-wider">Current Claim Value</span>
 <span className="text-sm font-bold text-th-heading tabular-nums">$142.50</span>
 </div>
 <span className="material-symbols-outlined text-th-primary">arrow_forward</span>
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-th-muted uppercase tracking-wider">Optimized Claim Value</span>
 <span className="text-sm font-bold text-green-400 tabular-nums">$218.75</span>
 </div>
 <div className="bg-green-900/20 border border-green-800/50 px-3 py-1 rounded-lg">
 <span className="text-xs font-bold text-green-400 tabular-nums">+ $76.25 Net Impact</span>
 </div>
 </div>
 <div className="flex items-center gap-4">
 <button className="px-5 py-2.5 bg-th-surface-overlay text-th-heading text-sm font-bold rounded-lg border border-th-border hover:bg-th-surface-overlay transition-colors">Save Draft</button>
 <button className="px-8 py-2.5 bg-cyan-500 text-white text-sm font-bold rounded-lg hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2">
 <span className="material-symbols-outlined text-[18px]">publish</span>
 Finalize & Submit to Billing
 </button>
 </div>
 </footer>
 </div>
 );
}
