import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function InsuranceVerification() {
 const [searchTerm, setSearchTerm] = useState("Jane Doe | MRN-8472192");
 const [carrier, setCarrier] = useState("BlueShield CA - PPO");
 const [isRunning, setIsRunning] = useState(false);
 const [showResults, setShowResults] = useState(true);
 const [loading, setLoading] = useState(true);
 const [crsSummary, setCrsSummary] = useState(null);
 const [denialsSummary, setDenialsSummary] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     const [crs, denials] = await Promise.all([
       api.crs.getSummary(),
       api.denials.getSummary(),
     ]);
     setCrsSummary(crs);
     setDenialsSummary(denials);
     setLoading(false);
   }
   load();
 }, []);

 const handleRun270 = () => {
 setIsRunning(true);
 setTimeout(() => {
 setIsRunning(false);
 setShowResults(true);
 }, 2000);
 };

 // Derive verification metrics from real API data
 const eligibilityScore = crsSummary?.component_scores?.eligibility;
 const verificationRate = eligibilityScore != null ? `${eligibilityScore.toFixed(1)}%` : '--';
 const overallCRS = crsSummary?.overall_score != null ? `${crsSummary.overall_score.toFixed(1)}%` : '--';
 const eligibilityDenialCategory = denialsSummary?.top_categories?.find(c =>
   c.category?.toUpperCase().includes('ELIGIB') || c.category?.toUpperCase().includes('COVERAGE')
 );
 const eligDenialCount = eligibilityDenialCategory?.count ?? 0;
 const eligDenialRevenue = eligibilityDenialCategory?.revenue_at_risk
   ? `$${(eligibilityDenialCategory.revenue_at_risk / 1000).toFixed(1)}k`
   : '$0';

 const Skeleton = ({ className = "h-8 w-24" }) => (
   <div className={`animate-pulse bg-th-surface-overlay rounded ${className}`}></div>
 );

 return (
 <div className="flex-1 flex flex-col overflow-y-auto h-full p-8 custom-scrollbar">
 {/* Header / Search Section */}
 <div className="bg-th-surface-raised p-6 rounded-xl border border-th-border mb-6">
 <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
 <label className="flex flex-col gap-2">
 <span className="text-sm font-semibold text-th-secondary">Patient Name / MRN</span>
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-muted">person</span>
 <input
 className="w-full pl-10 border border-th-border bg-th-surface-overlay/50 rounded-lg h-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary text-th-heading placeholder-th-muted"
 type="text"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </label>
 <label className="flex flex-col gap-2">
 <span className="text-sm font-semibold text-th-secondary">Insurance Carrier</span>
 <div className="relative">
 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-th-muted">corporate_fare</span>
 <input
 className="w-full pl-10 border border-th-border bg-th-surface-overlay/50 rounded-lg h-12 text-sm focus:border-primary focus:ring-1 focus:ring-primary text-th-heading placeholder-th-muted"
 type="text"
 value={carrier}
 onChange={(e) => setCarrier(e.target.value)}
 />
 </div>
 </label>
 </div>
 <button
 onClick={handleRun270}
 disabled={isRunning}
 className="flex items-center justify-center gap-2 bg-primary text-th-heading h-12 px-8 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-md disabled:opacity-70"
 >
 {isRunning ? (
 <>
 <span className="material-symbols-outlined animate-spin">sync</span>
 Processing 270...
 </>
 ) : (
 <>
 <span className="material-symbols-outlined">sync</span>
 Run 270 Transaction
 </>
 )}
 </button>
 </div>

 {/* Real-time verification metrics bar */}
 {!loading && (
 <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-4 gap-4">
   <div className="text-center">
     <p className="text-[10px] font-bold uppercase text-th-muted">Eligibility Score</p>
     <p className="text-lg font-black text-primary tabular-nums">{verificationRate}</p>
   </div>
   <div className="text-center">
     <p className="text-[10px] font-bold uppercase text-th-muted">Overall CRS</p>
     <p className="text-lg font-black text-th-heading tabular-nums">{overallCRS}</p>
   </div>
   <div className="text-center">
     <p className="text-[10px] font-bold uppercase text-th-muted">Eligibility Denials</p>
     <p className="text-lg font-black text-rose-500 tabular-nums">{eligDenialCount}</p>
   </div>
   <div className="text-center">
     <p className="text-[10px] font-bold uppercase text-th-muted">At-Risk Revenue</p>
     <p className="text-lg font-black text-amber-500 tabular-nums">{eligDenialRevenue}</p>
   </div>
 </div>
 )}
 </div>

 {showResults && (
 <div className="grid grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {/* Left: Benefit Coverage Breakdown (8 Cols) */}
 <div className="col-span-12 lg:col-span-8 space-y-6">
 {/* Status Banner */}
 <div className="bg-emerald-900/20 border border-emerald-800/30 p-6 rounded-xl flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-emerald-500 text-th-heading flex items-center justify-center">
 <span className="material-symbols-outlined text-2xl">check_circle</span>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h3 className="text-emerald-400 text-lg font-bold leading-tight">Active Coverage</h3>
 <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">Descriptive</span>
 </div>
 <p className="text-emerald-500/80 text-sm">271 Response: Eligibility Confirmed for 2024 (Plan #BS-990-23)</p>
 </div>
 </div>
 <div className="text-right">
 <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">Effective Since</span>
 <p className="text-emerald-300 font-bold">01/01/2024</p>
 </div>
 </div>

 {/* Deductibles & Progress */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-th-surface-raised p-6 rounded-xl border border-th-border border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <h4 className="font-bold text-th-heading">Individual Deductible</h4>
 <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">In-Network</span>
 </div>
 <div className="flex items-end justify-between mb-2">
 <span className="text-3xl font-black text-th-heading tabular-nums">$1,250<span className="text-lg text-th-secondary font-medium"> / $2,500</span></span>
 <span className="text-sm font-bold text-emerald-600 tabular-nums">50% Met</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2.5 rounded-full overflow-hidden">
 <div className="bg-primary h-full w-1/2 rounded-full"></div>
 </div>
 <div className="mt-4 flex justify-between text-xs font-medium text-th-secondary tabular-nums">
 <span>$1,250 Remaining</span>
 <span>$2,500 Total</span>
 </div>
 </div>
 <div className="bg-th-surface-raised p-6 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <h4 className="font-bold text-th-heading">Out-of-Pocket Max</h4>
 <span className="text-xs font-bold text-primary px-2 py-1 bg-primary/10 rounded">In-Network</span>
 </div>
 <div className="flex items-end justify-between mb-2">
 <span className="text-3xl font-black text-th-heading tabular-nums">$3,100<span className="text-lg text-th-secondary font-medium"> / $6,000</span></span>
 <span className="text-sm font-bold text-emerald-600 tabular-nums">52% Met</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2.5 rounded-full overflow-hidden">
 <div className="bg-primary h-full w-[52%] rounded-full"></div>
 </div>
 <div className="mt-4 flex justify-between text-xs font-medium text-th-secondary tabular-nums">
 <span>$2,900 Remaining</span>
 <span>$6,000 Total</span>
 </div>
 </div>
 </div>

 {/* Copay Grid */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border overflow-hidden hover:shadow-lg transition-all duration-200">
 <div className="px-6 py-4 border-b border-th-border flex justify-between items-center">
 <h4 className="font-bold text-th-heading">Copayments by Service Type</h4>
 <span className="material-symbols-outlined text-th-secondary">info</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-th-border">
 <div className="p-6 text-center">
 <p className="text-xs font-bold text-th-secondary uppercase tracking-widest mb-1">Primary Care</p>
 <p className="text-3xl font-black text-primary tabular-nums">$25.00</p>
 <p className="text-[10px] mt-1 text-th-muted">Per Visit</p>
 </div>
 <div className="p-6 text-center">
 <p className="text-xs font-bold text-th-secondary uppercase tracking-widest mb-1">Specialist</p>
 <p className="text-3xl font-black text-primary tabular-nums">$50.00</p>
 <p className="text-[10px] mt-1 text-th-muted">Referral Required</p>
 </div>
 <div className="p-6 text-center">
 <p className="text-xs font-bold text-th-secondary uppercase tracking-widest mb-1">Emergency Room</p>
 <p className="text-3xl font-black text-primary tabular-nums">$250.00</p>
 <p className="text-[10px] mt-1 text-th-muted">Waived if Admitted</p>
 </div>
 </div>
 </div>

 {/* Verification History */}
 <div className="bg-th-surface-raised p-6 rounded-xl border border-th-border hover:shadow-lg transition-all duration-200">
 <div className="flex items-center justify-between mb-4">
 <h4 className="font-bold text-th-heading">Verification History</h4>
 <button className="text-primary text-xs font-bold hover:underline">View All</button>
 </div>
 <div className="space-y-4">
 <div className="flex items-center gap-4 py-3 border-b border-th-border last:border-0">
 <div className="size-8 rounded bg-th-surface-overlay flex items-center justify-center">
 <span className="material-symbols-outlined text-th-secondary text-lg">history</span>
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-th-heading">Real-time Verification Run</p>
 <p className="text-xs text-th-secondary">By Sarah Miller &bull; 271 EDI Success</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-medium text-th-heading">Today, 09:15 AM</p>
 <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded">ACTIVE</span>
 </div>
 </div>
 <div className="flex items-center gap-4 py-3 border-b border-th-border last:border-0">
 <div className="size-8 rounded bg-th-surface-overlay flex items-center justify-center">
 <span className="material-symbols-outlined text-th-secondary text-lg">history</span>
 </div>
 <div className="flex-1">
 <p className="text-sm font-bold text-th-heading">Scheduled Batch Check</p>
 <p className="text-xs text-th-secondary">Automated System &bull; 271 EDI Success</p>
 </div>
 <div className="text-right">
 <p className="text-sm font-medium text-th-heading">Jun 12, 2024</p>
 <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 bg-emerald-500/10 rounded">ACTIVE</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Right: AI Eligibility Insights (4 Cols) */}
 <div className="col-span-12 lg:col-span-4 space-y-6">
 <div className="bg-th-surface-raised text-th-heading p-6 rounded-xl border border-th-border hover:shadow-lg transition-all duration-200">
 <div className="flex items-center gap-2 mb-6">
 <span className="material-symbols-outlined text-primary">auto_awesome</span>
 <h4 className="font-bold text-lg">AI Eligibility Insights</h4>
 <span className="text-[10px] font-bold text-violet-400 px-1.5 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">Predictive</span>
 </div>
 <div className="space-y-4">
 {/* Insight 1 */}
 <div className="bg-white/5 border border-th-border p-4 rounded-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-amber-500">warning</span>
 <div>
 <p className="text-sm font-bold mb-1">COB Required</p>
 <p className="text-xs text-th-secondary leading-relaxed">Secondary payer detected (United Healthcare). Patient must verify Coordination of Benefits before claim submission.</p>
 <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-th-heading transition-colors">Resolve Now</button>
 </div>
 </div>
 </div>
 {/* Insight 2 */}
 <div className="bg-white/5 border border-th-border p-4 rounded-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-1 h-full bg-primary"></div>
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-primary">description</span>
 <div>
 <p className="text-sm font-bold mb-1">Auth Needed: CPT 70553 (MRI Brain)</p>
 <p className="text-xs text-th-secondary leading-relaxed">AI predicts MRI Brain w/o & w/ Contrast requires prior authorization for this plan type.</p>
 <button className="mt-3 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-th-heading transition-colors">Start Auth Request</button>
 </div>
 </div>
 </div>
 {/* Insight 3 */}
 <div className="bg-white/5 border border-th-border p-4 rounded-lg relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-emerald-500">check_circle</span>
 <div>
 <p className="text-sm font-bold mb-1">Referral Status</p>
 <p className="text-xs text-th-secondary leading-relaxed">Current referral on file is valid until 12/31/2024. 6 remaining visits authorized.</p>
 </div>
 </div>
 </div>
 </div>
 <div className="mt-8 pt-6 border-t border-th-border">
 <h5 className="text-xs font-bold text-th-muted uppercase tracking-widest mb-4">Patient Demographics Match</h5>
 <div className="space-y-3">
 <div className="flex justify-between items-center text-xs">
 <span className="text-th-secondary">Name Match</span>
 <span className="text-emerald-500 font-bold tabular-nums">100%</span>
 </div>
 <div className="flex justify-between items-center text-xs">
 <span className="text-th-secondary">DOB Match</span>
 <span className="text-emerald-500 font-bold tabular-nums">100%</span>
 </div>
 <div className="flex justify-between items-center text-xs">
 <span className="text-th-secondary">Address Match</span>
 <span className="text-amber-500 font-bold">Partial (Zip)</span>
 </div>
 </div>
 </div>
 </div>

 {/* Quick Actions Card */}
 <div className="bg-th-surface-raised p-6 rounded-xl border border-th-border hover:shadow-lg transition-all duration-200">
 <h4 className="font-bold text-th-heading mb-4">Front Desk Actions</h4>
 <div className="space-y-2">
 <button className="w-full text-left p-3 rounded-lg hover:bg-th-surface-overlay/50 text-sm font-medium flex items-center gap-3 transition-colors text-th-heading">
 <span className="material-symbols-outlined text-th-secondary">print</span>
 Print Benefit Summary
 </button>
 <button className="w-full text-left p-3 rounded-lg hover:bg-th-surface-overlay/50 text-sm font-medium flex items-center gap-3 transition-colors text-primary">
 <span className="material-symbols-outlined">mail</span>
 Email Quote to Patient
 </button>
 <button className="w-full text-left p-3 rounded-lg hover:bg-th-surface-overlay/50 text-sm font-medium flex items-center gap-3 transition-colors text-th-heading">
 <span className="material-symbols-outlined text-th-secondary">file_download</span>
 Download Full 271 EDI
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
