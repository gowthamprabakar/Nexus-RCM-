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
 const [carcPrediction, setCarcPrediction] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const [audit, suggestions, carc] = await Promise.all([
         api.coding.getAudit(),
         api.coding.getSuggestions(activeEncounter.id),
         api.predictions.getCarcPrediction(activeEncounter.id),
       ]);
       setAuditData(audit);
       setSuggestionsData(suggestions);
       setCarcPrediction(carc);
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

 // Denial risk chip — derive a single headline probability from the CARC predictor
 const topCarc = Array.isArray(carcPrediction?.top_3_carc) && carcPrediction.top_3_carc.length > 0
   ? carcPrediction.top_3_carc[0]
   : null;
 const rawRiskPct = topCarc?.probability != null
   ? (topCarc.probability <= 1 ? topCarc.probability * 100 : topCarc.probability)
   : null;
 const denialRiskPct = rawRiskPct != null ? Math.round(rawRiskPct) : null;
 const denialRiskLabel = denialRiskPct == null
   ? '--'
   : denialRiskPct < 10 ? `Low (${denialRiskPct}%)`
   : denialRiskPct < 25 ? `Medium (${denialRiskPct}%)`
   : `High (${denialRiskPct}%)`;
 const denialRiskClass = denialRiskPct == null
   ? 'text-th-muted'
   : denialRiskPct < 10 ? 'text-green-400'
   : denialRiskPct < 25 ? 'text-amber-400'
   : 'text-rose-400';

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
 {loading && (
 <div className="text-center py-12 text-th-muted text-sm">Loading coding suggestions…</div>
 )}

 {!loading && lineSuggestions.length === 0 && (
 <div className="text-center py-12">
 <span className="material-symbols-outlined text-[40px] text-th-muted mb-2">code_off</span>
 <p className="text-sm font-bold text-th-heading mb-1">No coding suggestions for this encounter</p>
 <p className="text-xs text-th-muted">Encounter {activeEncounter.id} has no claim lines, or no historical paid patterns were found.</p>
 </div>
 )}

 {!loading && lineSuggestions.map((line, idx) => {
 const topPattern = Array.isArray(line.similar_paid_patterns) && line.similar_paid_patterns.length > 0
 ? line.similar_paid_patterns[0]
 : null;
 const confidencePct = topPattern?.frequency
 ? Math.min(99, Math.round((topPattern.frequency / (topPattern.frequency + (line.denial_risk_count || 0))) * 100))
 : null;
 const denialCount = line.denial_risk_count || 0;
 return (
 <div key={`${line.current_cpt}-${idx}`} className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-blue-500 rounded-xl p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-3">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">CPT {line.current_cpt}</span>
 {AI_LEVEL_BADGES.descriptive}
 </div>
 <h3 className="text-lg font-bold text-th-heading">{line.current_icd10 || '—'}</h3>
 <p className="text-sm text-th-secondary">
 {line.current_modifier ? `Modifier: ${line.current_modifier}` : 'No modifier on current line'}
 </p>
 </div>
 <div className="text-right">
 {confidencePct != null ? (
 <>
 <div className="flex items-center gap-1 text-green-400 font-bold text-sm">
 <span className="material-symbols-outlined text-[16px]">trending_up</span>
 <span className="tabular-nums">{confidencePct}%</span> Match
 </div>
 <div className="w-24 bg-th-surface-overlay h-1.5 rounded-full mt-1 overflow-hidden">
 <div className="bg-green-500 h-full" style={{ width: `${confidencePct}%` }}></div>
 </div>
 </>
 ) : (
 <div className="text-xs text-th-muted">No pattern match</div>
 )}
 </div>
 </div>
 {topPattern && (
 <div className="bg-th-surface-overlay/50 p-2 rounded-lg mb-3">
 <div className="flex items-center gap-2 mb-1">
 <p className="text-xs text-th-heading font-medium">Historical paid pattern:</p>
 {AI_LEVEL_BADGES.diagnostic}
 </div>
 <p className="text-xs text-th-secondary italic">
 {topPattern.frequency} paid claims with CPT {topPattern.cpt_code}
 {topPattern.modifier_1 ? ` + modifier ${topPattern.modifier_1}` : ''}
 {topPattern.icd10_primary ? ` + ICD ${topPattern.icd10_primary}` : ''}
 {topPattern.avg_paid_amount ? ` — avg paid $${topPattern.avg_paid_amount.toFixed(2)}` : ''}
 </p>
 </div>
 )}
 <div className="flex items-center gap-2 mb-3 px-2 flex-wrap">
 <span className="text-[10px] text-th-muted">Denial Risk:</span>
 {AI_LEVEL_BADGES.predictive}
 <span className={`text-xs font-bold tabular-nums ${denialRiskClass}`}>{denialRiskLabel}</span>
 {/* Sprint Q Track C3 — ML-predicted CARC code */}
 {topCarc?.carc_code && (
 <span className="text-[10px] font-bold text-th-muted px-1.5 py-0.5 rounded bg-th-surface-overlay/60 border border-th-border flex items-center gap-1"
 title={topCarc.prevention_action || 'Predicted top CARC denial code'}>
 <span className="material-symbols-outlined text-[10px]">smart_toy</span>
 Predicted CARC: <span className="text-amber-400 tabular-nums">{topCarc.carc_code}</span>
 </span>
 )}
 {denialCount > 0 && (
 <span className="text-[10px] text-th-muted ml-2">({denialCount} historical denials on this combo)</span>
 )}
 </div>
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-th-muted text-[16px]">schedule</span>
 <span className="text-[10px] text-th-muted font-bold">NCCI/CCI: Not yet connected</span>
 </div>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 border border-th-border rounded text-xs font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">Compare</button>
 <button className="px-4 py-1.5 bg-cyan-500 text-white rounded text-xs font-bold hover:bg-cyan-600 transition-colors">Accept Code</button>
 </div>
 </div>
 </div>
 );
 })}
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
 <div className="flex flex-col items-center justify-center text-center py-12 px-4">
 <span className="material-symbols-outlined text-[40px] text-th-muted mb-3">rule</span>
 <p className="text-xs font-bold text-th-heading mb-1">Rule validation not yet connected</p>
 <p className="text-[11px] text-th-muted leading-relaxed max-w-[220px]">
 NCCI / MUE / LCD / NCD rule engine will light up here once the
 payer policy connector is wired in a future sprint.
 </p>
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
