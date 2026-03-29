import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function BenefitAnalytics() {
 const [loading, setLoading] = useState(true);
 const [arSummary, setArSummary] = useState(null);
 const [paymentsSummary, setPaymentsSummary] = useState(null);
 const [benefitsData, setBenefitsData] = useState(null);
 const [error, setError] = useState(null);

 useEffect(() => {
   async function load() {
     setLoading(true);
     setError(null);
     try {
       const [ar, payments, benefits] = await Promise.allSettled([
         api.ar.getSummary(),
         api.payments.getSummary(),
         api.patientAccess.getBenefits('default'),
       ]);
       if (ar.status === 'fulfilled') setArSummary(ar.value);
       if (payments.status === 'fulfilled') setPaymentsSummary(payments.value);
       if (benefits.status === 'fulfilled' && benefits.value) setBenefitsData(benefits.value);
     } catch (err) {
       console.error('BenefitAnalytics load error:', err);
       setError('Failed to load benefits data.');
     } finally {
       setLoading(false);
     }
   }
   load();
 }, []);

 // Derive benefit metrics (prefer patientAccess API, fallback to AR/payments)
 const totalOutstanding = benefitsData?.total_outstanding != null
   ? `$${(benefitsData.total_outstanding / 1000).toFixed(1)}k`
   : arSummary?.total_outstanding != null
     ? `$${(arSummary.total_outstanding / 1000).toFixed(1)}k` : '--';
 const totalClaims = benefitsData?.total_claims ?? arSummary?.total_claims ?? '--';
 const avgDaysInAR = benefitsData?.avg_days_in_ar != null
   ? `${benefitsData.avg_days_in_ar.toFixed(0)} days`
   : arSummary?.avg_days_in_ar != null
     ? `${arSummary.avg_days_in_ar.toFixed(0)} days` : '--';
 const totalPayments = benefitsData?.total_payments != null
   ? `$${(benefitsData.total_payments / 1000).toFixed(1)}k`
   : paymentsSummary?.total_payments != null
     ? `$${(paymentsSummary.total_payments / 1000).toFixed(1)}k` : '--';
 const avgPaymentTime = benefitsData?.avg_days_to_payment != null
   ? `${benefitsData.avg_days_to_payment.toFixed(0)} days`
   : paymentsSummary?.avg_days_to_payment != null
     ? `${paymentsSummary.avg_days_to_payment.toFixed(0)} days` : '--';

 const Skeleton = () => (
   <div className="animate-pulse bg-th-surface-overlay rounded h-8 w-20"></div>
 );

 return (
 <div className="flex-1 overflow-y-auto h-full p-6 text-th-heading custom-scrollbar">
 <div className="max-w-[1600px] mx-auto space-y-6">

 {/* Error Banner */}
 {error && (
 <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 flex items-center gap-2">
 <span className="material-symbols-outlined text-sm">warning</span>
 {error}
 </div>
 )}

 {/* Real-time Benefit KPIs from API */}
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-blue-500">
     <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Total Outstanding</p>
     {loading ? <Skeleton /> : <h3 className="text-xl font-black text-th-heading tabular-nums">{totalOutstanding}</h3>}
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-emerald-500">
     <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Total Claims</p>
     {loading ? <Skeleton /> : <h3 className="text-xl font-black text-th-heading tabular-nums">{totalClaims}</h3>}
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-amber-500">
     <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Avg Days in A/R</p>
     {loading ? <Skeleton /> : <h3 className="text-xl font-black text-amber-500 tabular-nums">{avgDaysInAR}</h3>}
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-purple-500">
     <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Total Payments</p>
     {loading ? <Skeleton /> : <h3 className="text-xl font-black text-emerald-500 tabular-nums">{totalPayments}</h3>}
   </div>
   <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border border-l-[3px] border-l-cyan-500">
     <p className="text-[10px] font-bold uppercase text-th-muted mb-1">Avg Payment Time</p>
     {loading ? <Skeleton /> : <h3 className="text-xl font-black text-th-heading tabular-nums">{avgPaymentTime}</h3>}
   </div>
 </div>

 {/* Utilization Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-red-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-primary/10 rounded-lg text-primary">
 <span className="material-symbols-outlined">physical_therapy</span>
 </div>
 <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-1 rounded">High Usage</span>
 </div>
 <h3 className="font-bold text-lg text-th-heading mb-1">Physical Therapy</h3>
 <div className="flex items-end gap-2 mb-2">
 <span className="text-3xl font-black text-th-heading tabular-nums">18</span>
 <span className="text-sm text-th-secondary font-medium mb-1 tabular-nums">/ 20 Visits</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2 rounded-full overflow-hidden">
 <div className="bg-rose-500 h-full w-[90%]"></div>
 </div>
 <p className="text-xs text-rose-500 mt-2 font-bold tabular-nums">2 Visits Remaining</p>
 </div>

 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-emerald-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
 <span className="material-symbols-outlined">psychology</span>
 </div>
 <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">Good Standing</span>
 </div>
 <h3 className="font-bold text-lg text-th-heading mb-1">Mental Health</h3>
 <div className="flex items-end gap-2 mb-2">
 <span className="text-3xl font-black text-th-heading tabular-nums">4</span>
 <span className="text-sm text-th-secondary font-medium mb-1">/ Unlimited</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2 rounded-full overflow-hidden">
 <div className="bg-emerald-500 h-full w-[10%]"></div>
 </div>
 <p className="text-xs text-th-secondary mt-2">No hard cap.</p>
 </div>

 <div className="bg-th-surface-raised border border-th-border border-l-[3px] border-l-amber-500 rounded-xl p-6 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
 <span className="material-symbols-outlined">home_health</span>
 </div>
 <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Approaching Limit</span>
 </div>
 <h3 className="font-bold text-lg text-th-heading mb-1">Home Health</h3>
 <div className="flex items-end gap-2 mb-2">
 <span className="text-3xl font-black text-th-heading tabular-nums">25</span>
 <span className="text-sm text-th-secondary font-medium mb-1 tabular-nums">/ 30 Days</span>
 </div>
 <div className="w-full bg-th-surface-overlay h-2 rounded-full overflow-hidden">
 <div className="bg-amber-500 h-full w-[83%]"></div>
 </div>
 <p className="text-xs text-amber-500 mt-2 font-bold tabular-nums">5 Days Remaining</p>
 </div>
 </div>

 {/* Risk Alert Panel */}
 <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-6 flex gap-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <span className="material-symbols-outlined text-rose-500 text-3xl">notification_important</span>
 <div>
 <h4 className="font-bold text-rose-500 text-lg">Coverage Risk Alert</h4>
 <p className="text-th-heading text-sm mt-1">Patient enters the "Coverage Gap" (Donut Hole) after <span className="tabular-nums">$520</span> more in prescription spend. Estimated date: Nov 14th.</p>
 <div className="flex items-center gap-3 mt-3">
 <button className="px-4 py-2 bg-rose-500 text-th-heading font-bold rounded-lg text-xs hover:bg-rose-600">Notify Financial Counselor</button>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
