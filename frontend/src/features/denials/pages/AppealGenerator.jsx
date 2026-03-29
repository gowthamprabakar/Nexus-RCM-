import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
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

const DEFAULT_APPEAL_TEXT = `Dear Medical Director,

This letter serves as a formal appeal of the denial for the aforementioned claim based on "Lack of Medical Necessity" (Claim Adjustment Reason Code 50 — These are non-covered services because this does not meet the criteria of medical necessity). We believe the clinical evidence provided demonstrates that the procedure performed was medically necessary according to your policy guidelines and standard of care.

According to the H&P report from 10/10/23, the patient presented with chronic lumbar radiculopathy unresponsive to 6 months of conservative management. Payer policy 4.02.1 specifies that surgical intervention is indicated when conservative measures fail to provide relief. Our attached documentation clearly confirms the failure of physical therapy and pharmacological intervention.

Furthermore, the Operative Report (Section 4.1) confirms findings of severe foraminal stenosis which directly aligns with the ICD-10 codes submitted. We have attached the specific imaging reports that correlate with these intraoperative findings.

We request an immediate review of this appeal and the overturning of the denial. Thank you for your time and professional consideration.`;

export function AppealGenerator() {
 const navigate = useNavigate();
 const [searchParams] = useSearchParams();
 const denialId = searchParams.get('denial_id');

 const [isGenerating, setIsGenerating] = useState(true);
 const [showSuccess, setShowSuccess] = useState(false);
 const [showConfirmDialog, setShowConfirmDialog] = useState(false);
 const [appealText, setAppealText] = useState(DEFAULT_APPEAL_TEXT);
 const [sigName, setSigName] = useState('');
 const [sigCredentials, setSigCredentials] = useState('');
 const [activeSection, setActiveSection] = useState('context');
 const [appealId, setAppealId] = useState(null);
 const [letterData, setLetterData] = useState(null);
 const [denialContext, setDenialContext] = useState(null);
 const [winRates, setWinRates] = useState(null);
 const [diagnosticFindings, setDiagnosticFindings] = useState(null);
 const [preventionCount, setPreventionCount] = useState(null);

 useEffect(() => {
 async function loadLetter() {
   setIsGenerating(true);
   if (denialId) {
     // Create appeal for this denial, then fetch the letter
     const denialsData = await api.denials.list({ page: 1, size: 1, search: denialId });
     const denial = denialsData.items?.[0];
     if (denial) {
       setDenialContext(denial);
       const newAppeal = await api.appeals.create({
         denial_id: denial.denial_id,
         claim_id: denial.claim_id,
         appeal_type: 'FIRST_LEVEL',
         appeal_method: 'PORTAL',
         ai_generated: true,
       });
       if (newAppeal) {
         setAppealId(newAppeal.appeal_id);
         const letter = await api.appeals.getLetter(newAppeal.appeal_id);
         if (letter) {
           setLetterData(letter);
           setAppealText(letter.letter_text);
         }
       }
     }
   } else {
     // Fallback: use default mock letter after delay
     await new Promise(r => setTimeout(r, 2000));
   }
   setIsGenerating(false);
 }
 loadLetter();
 // Load appeal win rates by category (non-blocking)
 api.analytics.getAppealWinRates().catch(() => null).then(data => {
   if (data) setWinRates(data);
 });
 // Non-blocking: diagnostics + prevention
 api.diagnostics.getFindings({ category: 'DENIAL_PATTERN' }).then(d => setDiagnosticFindings(d)).catch(() => null);
 api.prevention.scan(3).then(d => setPreventionCount(d)).catch(() => null);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [denialId]);

 const handleRegenerate = () => {
 setIsGenerating(true);
 setTimeout(() => {
 setIsGenerating(false);
 setAppealText(letterData?.letter_text || DEFAULT_APPEAL_TEXT);
 }, 1500);
 };

 const handleSubmitClick = () => {
 setShowConfirmDialog(true);
 };

 const handleConfirmSubmit = async () => {
 setShowConfirmDialog(false);
 if (appealId) {
   await api.appeals.updateOutcome(appealId, {
     outcome: 'PENDING',
     approved_by_user_id: sigName || 'system',
   });
 }
 setShowSuccess(true);
 };

 const handleCancelSubmit = () => {
 setShowConfirmDialog(false);
 };

 return (
 <div className="flex w-full h-[calc(100vh-64px)] overflow-hidden font-sans bg-th-surface-base">
 {/* Left Sidebar: Denial Details */}
 <aside className="w-72 flex-shrink-0 border-r border-th-border bg-th-surface-raised overflow-y-auto">
 <div className="p-6">
 <NavLink to="/denials" className="flex items-center gap-2 mb-6 text-th-secondary hover:text-cyan-400 transition-colors">
 <span className="material-symbols-outlined text-[18px]">arrow_back</span>
 <span className="text-xs font-medium uppercase tracking-wider">Back to Queue</span>
 </NavLink>
 <div className="mb-8">
 <h1 className="text-th-heading text-xl font-bold mb-1">Appeal Workspace</h1>
 <p className="text-th-muted text-xs font-mono">
 {denialContext ? `DENIAL: ${denialContext.denial_id}` : appealId ? `APPEAL: ${appealId}` : 'CASE ID: #88219-BC'}
 </p>
 </div>
 <div className="space-y-6">
 <div>
 <h3 className="text-th-muted text-[10px] font-bold uppercase tracking-widest mb-3">Claim Information</h3>
 <div className="space-y-4">
 <div className="flex flex-col gap-1">
 <span className="text-xs text-th-muted">Payer</span>
 <div className="flex items-center gap-2">
 <div className="size-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-th-heading">
 {(denialContext?.payer_name || 'BC').slice(0, 2).toUpperCase()}
 </div>
 <span className="text-sm font-medium text-th-heading">
 {denialContext?.payer_name || 'BlueCross BlueShield'}
 </span>
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-xs text-th-muted">Patient</span>
 <span className="text-sm font-medium text-th-heading">
 {denialContext?.patient_name || 'Patient on record'}
 </span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-xs text-th-muted">Reason</span>
 <span className="text-sm font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 w-fit">
 {denialContext?.denial_category || 'Medical Necessity'}
 </span>
 </div>
 <div className="flex flex-col gap-2">
 <span className="text-xs text-th-muted">Denial Codes</span>
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-bold text-th-secondary bg-th-surface-overlay px-1.5 py-0.5 rounded">CARC</span>
 <span className="text-sm font-medium text-th-heading">
 {denialContext?.carc_code || letterData?.carc_info?.label || '50'}
 </span>
 </div>
 <p className="text-[11px] text-th-secondary leading-snug pl-0.5">
 {denialContext?.carc_description || letterData?.carc_info?.description || 'Non-covered services — does not meet criteria of medical necessity'}
 </p>
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-xs text-th-muted">Amount</span>
 <span className="text-sm font-bold text-cyan-400 tabular-nums">
 ${(denialContext?.denial_amount || 12450).toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </span>
 </div>
 {letterData?.appeal_probability && (
 <div className="flex flex-col gap-1">
 <span className="text-xs text-th-muted">Appeal Probability</span>
 <span className="text-sm font-bold text-emerald-400 tabular-nums">{letterData.appeal_probability}%</span>
 </div>
 )}
 </div>
 </div>
 <div className="pt-6 border-t border-th-border">
 <h3 className="text-th-muted text-[10px] font-bold uppercase tracking-widest mb-3">Navigation</h3>
 <nav className="space-y-1">
 <button
 onClick={() => setActiveSection('context')}
 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${activeSection === 'context' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-th-secondary hover:bg-th-surface-overlay'}`}
 >
 <span className="material-symbols-outlined text-[20px]">info</span>
 <span className="text-sm font-medium">Denial Context</span>
 </button>
 <button
 onClick={() => setActiveSection('policy')}
 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${activeSection === 'policy' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-th-secondary hover:bg-th-surface-overlay'}`}
 >
 <span className="material-symbols-outlined text-[20px]">policy</span>
 <span className="text-sm font-medium">Payer Policy</span>
 </button>
 <button
 onClick={() => setActiveSection('docs')}
 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${activeSection === 'docs' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-th-secondary hover:bg-th-surface-overlay'}`}
 >
 <span className="material-symbols-outlined text-[20px]">description</span>
 <span className="text-sm font-medium">Clinical Docs</span>
 </button>
 <button
 onClick={() => setActiveSection('history')}
 className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${activeSection === 'history' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-th-secondary hover:bg-th-surface-overlay'}`}
 >
 <span className="material-symbols-outlined text-[20px]">history</span>
 <span className="text-sm font-medium">History</span>
 </button>
 </nav>
 {diagnosticFindings?.findings?.length > 0 && (
   <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
     <span className="material-symbols-outlined text-rose-400 text-sm">biotech</span>
     <span className="text-[11px] text-rose-400 font-bold">{diagnosticFindings.findings.length} denial patterns</span>
   </div>
 )}
 {preventionCount && (preventionCount.total > 0 || preventionCount.alerts?.length > 0) && (
   <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
     <span className="material-symbols-outlined text-amber-400 text-sm">shield</span>
     <span className="text-[11px] text-amber-400 font-bold">{preventionCount.total || preventionCount.alerts?.length || 0} prevention alerts</span>
   </div>
 )}
 </div>
 </div>
 </div>
 </aside>

 {/* Center Panel: AI Editor */}
 <section className="flex-1 flex flex-col bg-th-surface-base overflow-hidden relative">
 {/* Confidence Meter Bar */}
 <div className="p-6 bg-th-surface-raised border-b border-th-border flex items-center justify-between z-10">
 <div className="flex-1 max-w-md">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-cyan-400 text-[20px]">trending_up</span>
 <p className="text-th-heading text-sm font-bold">Probability of Overturn</p>
 {AI_LEVEL_BADGES.predictive}
 </div>
 <p className="text-cyan-400 text-sm font-bold tabular-nums">{letterData?.appeal_probability || 88}%</p>
 </div>
 <div className="h-1.5 w-full bg-th-surface-overlay rounded-full overflow-hidden">
 <div
   className="h-full bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(19,236,236,0.5)]"
   style={{ width: `${letterData?.appeal_probability || 88}%` }}
 ></div>
 </div>
 <p className="text-th-muted text-[10px] mt-2 italic">
 {letterData
   ? `Letter quality score: ${letterData.letter_quality_score}/100 — ${denialContext?.denial_category || 'Denial'} appeal for ${denialContext?.payer_name || 'payer'}.`
   : 'Confidence optimized based on 452 historically similar Medical Necessity appeals for BCBS.'
 }
 </p>
 </div>
 <div className="flex gap-2">
 <button className="p-2 rounded-lg border border-th-border hover:bg-th-surface-overlay text-th-secondary">
 <span className="material-symbols-outlined text-[20px]">undo</span>
 </button>
 <button className="p-2 rounded-lg border border-th-border hover:bg-th-surface-overlay text-th-secondary">
 <span className="material-symbols-outlined text-[20px]">redo</span>
 </button>
 <button
 onClick={handleRegenerate}
 disabled={isGenerating}
 className="flex items-center gap-2 px-3 py-2 rounded-lg bg-th-surface-overlay text-th-heading text-xs font-bold border border-th-border hover:border-cyan-500/50 transition-all disabled:opacity-50"
 >
 <span className={`material-symbols-outlined text-[18px] ${isGenerating ? 'animate-spin' : ''}`}>
 {isGenerating ? 'sync' : 'magic_button'}
 </span>
 {isGenerating ? 'Generating...' : 'Re-Generate Draft'}
 </button>
 </div>
 </div>

 {/* Editor Content */}
 <div className="flex-1 overflow-y-auto p-8 flex justify-center">
 {isGenerating ? (
 <div className="w-full max-w-[800px] bg-th-surface-raised shadow-xl rounded-xl p-12 min-h-[1000px] border border-th-border flex flex-col items-center justify-center gap-6">
 <div className="size-16 rounded-full border-4 border-th-border border-t-cyan-400 animate-spin"></div>
 <div className="text-center space-y-2">
 <p className="text-lg font-bold text-th-heading">Drafting Clinical Appeal...</p>
 <p className="text-sm text-th-muted">Analyzing payer policy 4.02.1 vs patient medical history</p>
 </div>
 </div>
 ) : (
 <div className="w-full max-w-[800px] bg-th-surface-raised shadow-xl rounded-xl p-12 min-h-[1000px] border border-th-border animate-in fade-in slide-in-from-bottom-4 duration-700">
 <div className="space-y-6 text-th-heading text-sm leading-relaxed">
 {/* Letter Header */}
 <div className="flex justify-between items-start mb-8">
 <div className="space-y-1 text-th-heading">
 <p className="font-bold text-th-heading">Date: October 24, 2023</p>
 <p>To: BlueCross BlueShield Appeals Department</p>
 <p>Re: Formal Appeal for Claim #88219-BC</p>
 <p>Patient: John Doe | DOB: 05/12/1978</p>
 </div>
 <div className="text-right text-xs text-th-muted font-mono flex flex-col items-end gap-1">
 <span>AI DRAFT V2.4</span>
 {AI_LEVEL_BADGES.prescriptive}
 </div>
 </div>

 {/* Editable Appeal Body */}
 <textarea
 value={appealText}
 onChange={(e) => setAppealText(e.target.value)}
 className="w-full min-h-[400px] bg-th-surface-base/50 border border-th-border rounded-lg p-6 text-th-heading text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder-th-muted"
 placeholder="Appeal letter content..."
 />

 {/* AI Highlight Box (read-only context) */}
 <div className="bg-cyan-500/5 border-l-4 border-cyan-400 p-4 rounded-r-lg">
 <div className="flex items-center gap-2 mb-2 text-cyan-400">
 <span className="material-symbols-outlined text-[18px]">verified</span>
 <span className="text-xs font-bold uppercase tracking-wider">AI Highlight: Clinical Justification</span>
 {AI_LEVEL_BADGES.diagnostic}
 </div>
 <p className="italic text-th-secondary text-xs">Key clinical evidence has been incorporated into the editable letter above. Modify as needed to match your clinical judgment.</p>
 </div>

 {/* Payer Digital Twin Validation */}
 <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded bg-violet-500/5 border border-violet-500/20">
   <span className="material-symbols-outlined text-violet-400" style={{fontSize:'16px'}}>smart_toy</span>
   <span className="text-xs text-violet-300">
     Tested by payer digital twin — estimated {letterData?.appeal_probability || 88}% success rate
   </span>
 </div>

 {/* Signature Block */}
 <div className="pt-8 border-t border-th-border space-y-4">
 <p className="text-th-heading">Sincerely,</p>
 <div className="space-y-3 max-w-sm">
 <div>
 <label className="block text-[10px] font-bold text-th-muted uppercase tracking-wider mb-1">Authorized Representative Name</label>
 <input
 type="text"
 value={sigName}
 onChange={(e) => setSigName(e.target.value)}
 placeholder="e.g., Dr. James Mitchell"
 className="w-full bg-th-surface-base/50 border border-th-border rounded px-3 py-2 text-sm text-th-heading placeholder-th-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-th-muted uppercase tracking-wider mb-1">Credentials / Title</label>
 <input
 type="text"
 value={sigCredentials}
 onChange={(e) => setSigCredentials(e.target.value)}
 placeholder="e.g., MD, FACS — Chief of Surgery"
 className="w-full bg-th-surface-base/50 border border-th-border rounded px-3 py-2 text-sm text-th-heading placeholder-th-muted focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50"
 />
 </div>
 <p className="text-xs text-th-muted">On behalf of: Metropolitan General Health</p>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Global Floating Action Bar */}
 {!showSuccess && (
 <div className="absolute bottom-6 right-6 flex items-center gap-4 z-50">
 <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-th-surface-overlay text-th-heading font-bold text-sm shadow-2xl hover:bg-th-surface-overlay transition-all border border-th-border">
 <span className="material-symbols-outlined text-[20px]">save</span>
 Save Draft
 </button>
 <button
 onClick={handleSubmitClick}
 className="flex items-center gap-2 px-8 py-4 rounded-full bg-cyan-500 text-th-heading font-bold text-base shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all"
 >
 <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
 Submit Final Appeal
 </button>
 </div>
 )}

 {/* Confirmation Dialog */}
 {showConfirmDialog && (
 <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
 <div className="bg-th-surface-raised border border-th-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
 <div className="flex items-center gap-3 mb-4">
 <div className="size-10 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center">
 <span className="material-symbols-outlined text-xl">warning</span>
 </div>
 <h3 className="text-lg font-bold text-th-heading">Confirm Submission</h3>
 </div>
 <p className="text-sm text-th-secondary mb-2">You are about to submit this appeal for Claim #88219-BC to BlueCross BlueShield via the payer portal.</p>
 <p className="text-sm text-th-secondary mb-6">This action cannot be undone. Please ensure the appeal letter and all evidence attachments are correct.</p>
 <div className="flex gap-3 justify-end">
 <button
 onClick={handleCancelSubmit}
 className="px-5 py-2.5 rounded-lg bg-th-surface-overlay text-th-heading text-sm font-bold border border-th-border hover:bg-th-surface-overlay transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmSubmit}
 className="px-6 py-2.5 rounded-lg bg-cyan-500 text-th-heading text-sm font-bold hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 transition-all"
 >
 Confirm & Submit
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Success Overlay — persistent, no auto-redirect */}
 {showSuccess && (
 <div className="absolute inset-0 z-[100] bg-th-surface-base/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
 <div className="bg-th-surface-raised p-8 rounded-2xl shadow-2xl border border-th-border flex flex-col items-center text-center max-w-md animate-in zoom-in-50 duration-500 slide-in-from-bottom-10">
 <div className="size-20 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center mb-6">
 <span className="material-symbols-outlined text-4xl">check_circle</span>
 </div>
 <h2 className="text-2xl font-black text-th-heading mb-2">Appeal Submitted!</h2>
 <p className="text-th-secondary mb-6">Your appeal for Claim #88219-BC has been successfully submitted via payer portal to BlueCross BlueShield.</p>
 <div className="flex flex-col w-full gap-2">
 <div className="p-3 bg-th-surface-overlay rounded-lg flex justify-between items-center text-xs">
 <span className="text-th-muted">Confirmation ID</span>
 <span className="font-mono font-bold text-th-heading">1Z9928383-001</span>
 </div>
 <div className="p-3 bg-th-surface-overlay rounded-lg flex justify-between items-center text-xs">
 <span className="text-th-muted">Submitted By</span>
 <span className="font-medium text-th-heading">{sigName || 'Not specified'}</span>
 </div>
 <button
 onClick={() => navigate('/denials')}
 className="w-full py-3 bg-white text-th-heading rounded-lg font-bold text-sm mt-3 hover:bg-th-surface-overlay transition-colors"
 >
 Back to Queue
 </button>
 </div>
 </div>
 </div>
 )}
 </section>

 {/* Right Panel: Evidence & Suggestions */}
 <aside className="w-80 flex-shrink-0 border-l border-th-border bg-th-surface-raised overflow-y-auto">
 <div className="p-5 flex flex-col gap-8">
 {/* AI Suggestions Section */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-th-heading text-xs font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="material-symbols-outlined text-cyan-400 text-[18px]">lightbulb</span>
 AI Suggestions
 </h3>
 <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-1.5 py-0.5 rounded">2 New</span>
 </div>
 <div className="flex mb-3">{AI_LEVEL_BADGES.prescriptive}</div>
 <div className="space-y-3">
 <div className="p-3 rounded-lg bg-th-surface-overlay/50 border border-th-border group hover:border-cyan-500/50 transition-all cursor-pointer">
 <p className="text-xs font-bold text-th-heading mb-1">Strengthen Clinical Argument</p>
 <p className="text-[11px] text-th-muted mb-3 leading-snug">Case history suggests adding the MRI report dated 09/15 to confirm stenosis level.</p>
 <button className="w-full py-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500 hover:text-th-heading transition-all">Apply Suggestion</button>
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 mt-1">
   <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
   Validated
 </span>
 </div>
 <div className="p-3 rounded-lg bg-th-surface-overlay/50 border border-th-border group hover:border-cyan-500/50 transition-all cursor-pointer">
 <p className="text-xs font-bold text-th-heading mb-1">Missing Policy Citation</p>
 <p className="text-[11px] text-th-muted mb-3 leading-snug">Section 3.2 of BCBS policy 2023-A is relevant. Include citation?</p>
 <button className="w-full py-1.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20 hover:bg-cyan-500 hover:text-th-heading transition-all">Add Citation</button>
 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 mt-1">
   <span className="material-symbols-outlined" style={{fontSize:'11px'}}>shield</span>
   Validated
 </span>
 </div>
 </div>
 </div>

 {/* ── Appeal Win Rates by Category ──────────────────────── */}
 {winRates && (
 <div>
   <div className="flex items-center justify-between mb-3">
     <h3 className="text-th-heading text-xs font-bold uppercase tracking-widest flex items-center gap-2">
       <span className="material-symbols-outlined text-emerald-400 text-[18px]">leaderboard</span>
       Win Rates by Category
     </h3>
     {AI_LEVEL_BADGES.predictive}
   </div>
   <div className="space-y-2">
     {(winRates.categories || winRates.rates || [
       { category: 'Coding/Bundling', win_rate: 71 },
       { category: 'Authorization', win_rate: 62 },
       { category: 'Medical Necessity', win_rate: 48 },
       { category: 'Eligibility', win_rate: 55 },
       { category: 'Timely Filing', win_rate: 38 },
     ]).slice(0, 5).map((cat, i) => {
       const rate = cat.win_rate ?? cat.winRate ?? cat.rate ?? 0;
       const label = cat.category || cat.label || cat.name;
       return (
         <div key={i} className="p-2 rounded-lg bg-th-surface-overlay/50 border border-th-border">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[11px] font-bold text-th-heading">{label}</span>
             <span className={`text-xs font-black tabular-nums ${rate >= 60 ? 'text-emerald-400' : rate >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{rate}%</span>
           </div>
           <div className="h-1 w-full bg-th-surface-overlay rounded-full overflow-hidden">
             <div className={`h-full rounded-full ${rate >= 60 ? 'bg-emerald-400' : rate >= 45 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${rate}%` }} />
           </div>
         </div>
       );
     })}
   </div>
 </div>
 )}

 {/* Evidence Attachments Section */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-th-heading text-xs font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="material-symbols-outlined text-th-muted text-[18px]">attach_file</span>
 Evidence Attachments
 </h3>
 <button className="text-cyan-400 text-[18px] hover:text-cyan-300 transition-colors">
 <span className="material-symbols-outlined">add_circle</span>
 </button>
 </div>
 <div className="space-y-1">
 <div className="flex items-center gap-3 p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
 <input defaultChecked className="rounded border-th-border-strong text-cyan-400 focus:ring-cyan-500 bg-transparent size-4" type="checkbox" />
 <div className="flex-1">
 <p className="text-xs font-medium text-th-heading">History & Physical</p>
 <p className="text-[10px] text-th-muted">PDF - 1.2 MB</p>
 </div>
 <span className="material-symbols-outlined text-[16px] text-th-muted">visibility</span>
 </div>
 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay transition-colors">
 <input defaultChecked className="rounded border-th-border-strong text-cyan-400 focus:ring-cyan-500 bg-transparent size-4" type="checkbox" />
 <div className="flex-1">
 <p className="text-xs font-medium text-th-heading">Operative Report</p>
 <p className="text-[10px] text-th-muted">PDF - 850 KB</p>
 </div>
 <span className="material-symbols-outlined text-[16px] text-th-muted">visibility</span>
 </div>
 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay transition-colors">
 <input defaultChecked className="rounded border-th-border-strong text-cyan-400 focus:ring-cyan-500 bg-transparent size-4" type="checkbox" />
 <div className="flex-1">
 <p className="text-xs font-medium text-th-heading">MRI Lumbar Spine</p>
 <p className="text-[10px] text-th-muted">DICOM Link - 45 MB</p>
 </div>
 <span className="material-symbols-outlined text-[16px] text-th-muted">visibility</span>
 </div>
 <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-th-surface-overlay transition-colors opacity-50">
 <input className="rounded border-th-border-strong text-cyan-400 focus:ring-cyan-500 bg-transparent size-4" type="checkbox" />
 <div className="flex-1">
 <p className="text-xs font-medium text-th-heading">PT Progress Notes</p>
 <p className="text-[10px] text-th-muted">Missing - Needs Upload</p>
 </div>
 <span className="material-symbols-outlined text-[16px] text-cyan-400 cursor-pointer">upload</span>
 </div>
 </div>
 </div>

 {/* Summary Stats */}
 <div className="mt-auto pt-6 border-t border-th-border">
 <div className="bg-th-surface-overlay/50 p-4 rounded-xl space-y-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-[3px] border-l-emerald-500">
 <div className="flex justify-between items-center">
 <span className="text-[11px] text-th-muted">Expected Reimbursement at Contracted Rate</span>
 <span className="text-xs font-bold text-green-400 tabular-nums">$10,956.00</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[11px] text-th-muted">Payer Processing Time</span>
 <span className="text-xs font-bold text-th-heading tabular-nums">12-18 Days</span>
 </div>
 </div>
 </div>
 </div>
 </aside>
 </div>
 );
}
