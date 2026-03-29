import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { AutomationActionModal } from '../components/AutomationActionModal';
import { AutomationAnalysisPanel } from '../components/AutomationAnalysisPanel';

export function ClaimDenialDetail() {
 const { id } = useParams();
 const navigate = useNavigate();
 const [claim, setClaim] = useState(null);
 const [selectedLine, setSelectedLine] = useState(null);
 const [showAutoModal, setShowAutoModal] = useState(false);
 const [automationScenario, setAutomationScenario] = useState(null);

 useEffect(() => {
   Promise.all([
     api.graph.getClaimFullContext(id),
     api.rootCause.getClaimAnalysis(id)
   ]).then(([claimData, rootCause]) => {
     if (claimData) {
       const foundClaim = {
         id: claimData.id || claimData.claim_id || id,
         patient: claimData.patient_name || claimData.patient || 'Unknown',
         mrn: claimData.mrn || claimData.patient_id || 'N/A',
         payer: claimData.payer_name || claimData.payer || 'Unknown',
         facility: claimData.facility || 'Main Hospital',
         serviceDate: claimData.date_of_service || claimData.serviceDate || 'N/A',
         amount: claimData.amount || claimData.total_charges || 0,
         riskScore: claimData.risk_score || claimData.riskScore || 50,
         category: claimData.denial_category || claimData.category || 'General',
         topFactor: rootCause?.top_factor || rootCause?.topFactor || claimData.top_factor || 'Under Review',
         factors: rootCause?.factors || claimData.factors || [],
         lineItems: claimData.line_items || claimData.lineItems || [
           { code: claimData.cpt_code || 'N/A', description: claimData.description || 'Service', amount: claimData.amount || 0, risk: 'Medium', issue: rootCause?.top_factor || '' }
         ],
         automatedAction: claimData.automated_action || null,
         status: claimData.status || 'Pending'
       };
       setClaim(foundClaim);
       setSelectedLine(foundClaim.lineItems[0]);

       // Build automation scenario from root cause if available
       if (rootCause?.recommendation) {
         setAutomationScenario({
           actionName: rootCause.recommendation.action_name || rootCause.recommendation.actionName || 'AI Fix',
           description: rootCause.recommendation.description || 'AI-recommended corrective action.'
         });
       }
     }
   }).catch(err => console.error('ClaimDenialDetail load error:', err));
 }, [id]);

 if (!claim) return <div className="p-10 text-center">Loading Claim Data...</div>;

 return (
 <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
 <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

 {/* Back Button */}
 <button
 onClick={() => navigate(-1)}
 className="flex items-center gap-2 text-th-muted hover:text-th-heading dark:hover:text-th-heading transition-colors"
 >
 <span className="material-symbols-outlined text-sm">arrow_back</span>
 <span className="text-sm font-semibold">Back to Worklist</span>
 </button>

 {/* Claim Header Card */}
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
 <div className="flex flex-wrap justify-between items-start gap-6">
 <div className="space-y-1">
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-black text-th-heading ">{claim.id}</h1>
 <span className={`px-2 py-0.5 rounded text-xs font-bold border ${claim.category === 'COB' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 'bg-th-surface-overlay text-th-muted border-th-border '}`}>
 {claim.category === 'COB' ? (
 <span className="flex items-center gap-1">
 <span className="material-symbols-outlined text-[10px]">shield</span>
 COB Prevention Active
 </span>
 ) : claim.category}
 </span>
 </div>
 <div className="flex items-center gap-4 text-sm text-th-muted">
 <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">person</span> {claim.patient} ({claim.mrn})</span>
 <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">calendar_today</span> DOS: {claim.serviceDate}</span>
 </div>
 </div>

 <div className="flex items-center gap-6">
 <div className="text-right">
 <div className="text-sm text-th-muted">Total Charges</div>
 <div className="text-2xl font-mono font-bold text-th-heading tabular-nums">${claim.amount.toLocaleString()}</div>
 </div>
 <div className="text-right">
 <div className="text-sm text-th-muted mb-1">Denial Probability</div>
 <RiskScoreBadge score={claim.riskScore} />
 </div>
 </div>
 </div>
 </div>

 {/* Automation Analysis Panel (New) */}
 <AutomationAnalysisPanel claim={claim} />

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Col: Line Items */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm overflow-hidden">
 <div className="p-4 border-b border-th-border flex justify-between items-center bg-th-surface-overlay/30/50 /50">
 <h3 className="font-bold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">list_alt</span>
 Claim Line Items
 </h3>
 <span className="text-xs bg-th-surface-overlay px-2 py-1 rounded text-th-muted font-medium">
 {claim.lineItems.length} Lines
 </span>
 </div>
 <table className="w-full text-left border-collapse">
 <thead className="bg-th-surface-overlay/30 text-xs uppercase text-th-muted font-bold">
 <tr>
 <th className="px-6 py-3">Service Code</th>
 <th className="px-6 py-3">Description</th>
 <th className="px-6 py-3 text-right">Charges</th>
 <th className="px-6 py-3 text-center">Risk</th>
 <th className="px-6 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {claim.lineItems.map((item, idx) => (
 <tr
 key={idx}
 onClick={() => setSelectedLine(item)}
 className={`cursor-pointer transition-colors ${selectedLine === item ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay/50 border-l-4 border-l-transparent'}`}
 >
 <td className="px-6 py-4 font-mono font-semibold text-th-primary ">{item.code}</td>
 <td className="px-6 py-4 text-sm text-th-muted ">{item.description}</td>
 <td className="px-6 py-4 text-right font-mono text-th-primary tabular-nums">${item.amount}</td>
 <td className="px-6 py-4 text-center">
 <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${item.risk === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
 {item.risk}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 {selectedLine === item && (
 <span className="text-primary text-xs font-bold flex items-center justify-end gap-1">
 Selected <span className="material-symbols-outlined text-sm">check</span>
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Automation Trigger Card */}
 {automationScenario && (
 <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-6 shadow-lg text-th-heading relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all duration-700"></div>

 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
 <span className="material-symbols-outlined text-sm">smart_toy</span>
 </span>
 <span className="text-xs font-bold tracking-wider uppercase opacity-90">AI Recommendation Available</span>
 </div>
 <h3 className="text-xl font-bold mb-1">{automationScenario.actionName}</h3>
 <p className="text-white/80 text-sm max-w-lg">
 {automationScenario.description}
 </p>
 </div>
 <button
 onClick={() => setShowAutoModal(true)}
 className="px-6 py-3 bg-white text-violet-600 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
 >
 <span className="material-symbols-outlined">bolt</span>
 Execute Fix
 </button>

 {/* Deep Links to Automation Managers */}
 {claim.category === 'EVV' && (
 <button
 onClick={() => navigate('/automation/evv-retry')}
 className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-th-heading rounded-xl font-bold shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 whitespace-nowrap"
 >
 <span className="material-symbols-outlined">autorenew</span>
 Manage Retries
 </button>
 )}
 {claim.category === 'COB' && (
 <button
 onClick={() => navigate('/automation/cob-manager')}
 className="px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-th-heading rounded-xl font-bold shadow-lg backdrop-blur-sm transition-all flex items-center gap-2 whitespace-nowrap"
 >
 <span className="material-symbols-outlined">alt_route</span>
 View Payer Flow
 </button>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Right Col: AI Insights */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm p-6 sticky top-6">
 <h3 className="font-bold text-th-heading flex items-center gap-2 mb-4">
 <span className="material-symbols-outlined text-amber-500">lightbulb</span>
 AI Analysis
 </h3>

 {selectedLine ? (
 <div className="space-y-4 animate-fade-in">
 <div className="p-4 bg-th-surface-overlay/30 rounded-lg border border-th-border-subtle ">
 <div className="text-xs text-th-secondary font-bold uppercase mb-2">Analysing Line Item</div>
 <div className="font-mono font-bold text-lg text-th-primary mb-1">{selectedLine.code}</div>
 <div className="text-sm text-th-muted ">{selectedLine.description}</div>
 </div>

 {selectedLine.issue ? (
 <div className="space-y-3">
 <div className="flex gap-3 items-start">
 <div className="mt-0.5 min-w-[20px] text-red-500">
 <span className="material-symbols-outlined text-lg">error</span>
 </div>
 <div>
 <div className="text-sm font-bold text-th-heading ">Identified Issue</div>
 <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded mt-1 inline-block">
 {selectedLine.issue}
 </div>
 </div>
 </div>

 <div className="flex gap-3 items-start">
 <div className="mt-0.5 min-w-[20px] text-primary">
 <span className="material-symbols-outlined text-lg">psychology</span>
 </div>
 <div>
 <div className="text-sm font-bold text-th-heading ">Root Cause Analysis</div>
 <p className="text-sm text-th-muted mt-1">
 The AI model has detected high probability of denial due to compliance checks hitting provider-specific rulesets.
 </p>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-6 text-th-secondary">
 <span className="material-symbols-outlined text-4xl mb-2 text-emerald-400">check_circle</span>
 <span className="text-sm">No significant risks detected for this line.</span>
 </div>
 )}
 </div>
 ) : (
 <p className="text-sm text-th-muted italic text-center py-8">Select a line item to reveal specific insights.</p>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Automation Modal */}
 <AutomationActionModal
 isOpen={showAutoModal}
 onClose={() => setShowAutoModal(false)}
 action={automationScenario}
 claimId={claim.id}
 onExecute={() => {
 // In a real app, this would refresh data
 setShowAutoModal(false);
 navigate(-1); // Go back to worklist
 }}
 />
 </div>
 );
}
