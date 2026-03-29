import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockDenialData } from '../data/mockDenialData';
import { RiskScoreBadge } from '../components/RiskScoreBadge';
import { DifferentialDial } from '../components/DifferentialDial'; // Re-use for risk gauge

export function DenialPredictionAnalysis() {
 const { id } = useParams();
 const navigate = useNavigate();

 // In real app, fetch by ID. Here, finding from mock data.
 // If mocking navigation without ID, fallback to first item.
 const claim = mockDenialData.highRiskClaims.find(c => c.id === id) || mockDenialData.highRiskClaims[0];

 // Find recommended action based on top factor
 const recommendation = mockDenialData.preventionActions[claim.topFactor] || {
 type: 'Review',
 action: 'Manual Review Required',
 automationLevel: 'Manual',
 estimatedSavings: 0
 };

 return (
 <div className="flex-1 overflow-y-auto bg-th-surface-overlay/30 dark:bg-background-dark font-sans h-full">
 <div className="p-6 max-w-[1200px] mx-auto w-full space-y-6">

 {/* Breadcrumb / Back Navigation */}
 <div className="flex items-center gap-2 mb-2">
 <button onClick={() => navigate('/denials/high-risk')} className="text-th-secondary hover:text-th-primary dark:hover:text-th-heading transition-colors flex items-center gap-1 text-sm font-medium">
 <span className="material-symbols-outlined text-sm">arrow_back</span>
 Back to Worklist
 </button>
 </div>

 {/* Header Card */}
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm p-6">
 <div className="flex flex-wrap justify-between gap-6">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h1 className="text-2xl font-black text-th-heading ">Analysis: {claim.id}</h1>
 <span className="px-2 py-0.5 bg-th-surface-overlay text-th-muted text-xs font-bold rounded uppercase">
 Pre-Submission
 </span>
 </div>
 <p className="text-th-muted font-medium">{claim.patient} • {claim.mrn}</p>
 <div className="flex gap-4 mt-4 text-sm">
 <div>
 <span className="block text-th-secondary text-xs uppercase font-bold">Payer</span>
 <span className="font-semibold text-th-heading ">{claim.payer}</span>
 </div>
 <div>
 <span className="block text-th-secondary text-xs uppercase font-bold">Facility</span>
 <span className="font-semibold text-th-heading ">{claim.facility}</span>
 </div>
 <div>
 <span className="block text-th-secondary text-xs uppercase font-bold">Amount</span>
 <span className="font-semibold text-th-heading font-mono tabular-nums">${claim.amount.toLocaleString()}</span>
 </div>
 </div>
 </div>

 {/* Risk Gauge Section */}
 <div className="flex items-center gap-6">
 {/* Re-using DifferentialDial logic for single gauge visualization */}
 <div className="w-40 h-32 scale-90 origin-top">
 <DifferentialDial
 title="Prediction Score"
 value={claim.riskScore}
 benchmark={40}
 status={claim.riskScore > 80 ? 'critical' : 'warning'}
 trend="up"
 />
 </div>
 <div className="flex flex-col justify-center min-w-[200px]">
 <div className="text-sm font-bold text-th-muted mb-1">Confidence: <span className="tabular-nums">{claim.predictionConfidence}%</span></div>
 <div className="text-xs text-th-secondary leading-relaxed">
 AI Model v4.2 suggests extremely high probability of denial based on diagnosis/procedure mismatch patterns.
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

 {/* Left Column: Contributing Factors */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <h2 className="text-lg font-bold text-th-heading mb-4 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">analytics</span>
 Contributing Factors
 </h2>
 <div className="space-y-4">
 {claim.factors.map((factor, idx) => (
 <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-th-surface-overlay/30 /50 border border-th-border-subtle hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className={`w-1.5 self-stretch rounded-full ${factor.impact === 'High' ? 'bg-red-500' : factor.impact === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
 <div className="flex-1">
 <div className="font-bold text-th-heading text-sm">{factor.name}</div>
 <div className="text-xs text-th-muted">Impact Weight: <span className="tabular-nums">{factor.weight}%</span></div>
 </div>
 <div className="text-right">
 <span className={`px-2 py-1 rounded text-xs font-bold ${factor.impact === 'High' ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'text-amber-600 bg-amber-100'}`}>
 {factor.impact} Risk
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Similar Claims Analysis */}
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-sm p-6">
 <h2 className="text-lg font-bold text-th-heading mb-4">Historical Context</h2>
 <p className="text-sm text-th-muted mb-4">
 <strong>24 similar claims</strong> were processed in the last 90 days.
 <span className="text-red-500 font-bold ml-1 tabular-nums">88% were denied</span> when submitted without modification.
 </p>
 <div className="h-2 w-full bg-th-surface-overlay rounded-full overflow-hidden flex">
 <div className="h-full bg-red-500" style={{ width: '88%' }}></div>
 <div className="h-full bg-emerald-500" style={{ width: '12%' }}></div>
 </div>
 <div className="flex justify-between text-xs font-bold mt-2 text-th-muted">
 <span>Denied (21)</span>
 <span>Paid (3)</span>
 </div>
 </div>
 </div>

 {/* Right Column: Prevention Action */}
 <div className="space-y-6">
 <div className="bg-white dark:bg-card-dark rounded-xl border border-th-border shadow-lg shadow-emerald-500/10 p-6 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
 <h2 className="text-lg font-bold text-th-heading mb-2 flex items-center gap-2">
 <span className="material-symbols-outlined text-emerald-500">verified_user</span>
 Recommended Action
 </h2>
 <div className="mb-6">
 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded uppercase tracking-wide">
 {recommendation.automationLevel}
 </span>
 <h3 className="text-xl font-black text-th-heading mt-2 mb-1">
 {recommendation.action}
 </h3>
 <p className="text-sm text-th-muted">
 Estimated Savings: <span className="font-bold text-th-heading tabular-nums">${recommendation.estimatedSavings}</span>
 </p>
 </div>

 <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-th-heading font-bold rounded-lg shadow-md hover:shadow-lg transition-all mb-3 flex items-center justify-center gap-2">
 <span className="material-symbols-outlined">auto_fix_high</span>
 Execute Prevention
 </button>
 <button className="w-full py-3 bg-white border border-th-border text-th-primary font-bold rounded-lg hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-all flex items-center justify-center gap-2">
 <span className="material-symbols-outlined">do_not_disturb</span>
 Ignore Risk
 </button>
 </div>
 </div>

 </div>
 </div>
 </div>
 );
}
