import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

export function PaymentPortal() {
 const [loading, setLoading] = useState(true);
 const [collectionsSummary, setCollectionsSummary] = useState(null);
 const [arSummary, setArSummary] = useState(null);

 useEffect(() => {
  let cancelled = false;
  async function fetchData() {
   setLoading(true);
   const [collectionsResult, arResult] = await Promise.all([
    api.collections.getSummary(),
    api.ar.getSummary(),
   ]);
   if (cancelled) return;
   setCollectionsSummary(collectionsResult);
   setArSummary(arResult);
   setLoading(false);
  }
  fetchData();
  return () => { cancelled = true; };
 }, []);

 const fmt = (n) => {
  if (n == null) return '$0';
  if (n < 0) return '-$' + Math.abs(n).toLocaleString();
  return '$' + n.toLocaleString();
 };

 const totalBalance = collectionsSummary?.total_outstanding || arSummary?.total_ar || 0;
 const totalCollected = collectionsSummary?.total_collected || 0;

 if (loading) {
  return (
   <div className="flex-1 overflow-y-auto font-sans h-full">
    <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-center h-64">
     <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-th-muted text-sm">Loading payment portal...</p>
     </div>
    </div>
   </div>
  );
 }

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 {/* Top Navigation (Portal Specific) */}
 <header className="sticky top-0 z-50 bg-th-surface-raised/80 backdrop-blur-md border-b border-th-border">
 <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-th-heading">
 <span className="material-symbols-outlined text-lg">auto_awesome</span>
 </div>
 <h1 className="text-xl font-bold tracking-tight text-primary">HealPay AI</h1>
 </div>
 <nav className="hidden md:flex items-center gap-8">
 <a className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5" href="#">Statements</a>
 <a className="text-sm font-medium text-th-secondary hover:text-primary transition-colors" href="#">Payment Plans</a>
 <a className="text-sm font-medium text-th-secondary hover:text-primary transition-colors" href="#">Insurance</a>
 <a className="text-sm font-medium text-th-secondary hover:text-primary transition-colors" href="#">Support</a>
 </nav>
 <div className="flex items-center gap-4">
 <button className="p-2 text-th-secondary hover:bg-th-surface-overlay rounded-full transition-colors relative">
 <span className="material-symbols-outlined">notifications</span>
 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#111827]"></span>
 </button>
 <div className="flex items-center gap-3 pl-4 border-l border-th-border">
 <div className="w-9 h-9 rounded-full bg-th-surface-overlay flex items-center justify-center font-bold text-th-heading">SJ</div>
 <span className="text-sm font-semibold text-th-heading">Sarah J.</span>
 </div>
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-6 py-8">
 {/* Welcome Section */}
 <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 bg-th-surface-raised p-8 rounded-2xl border border-th-border">
 <div className="space-y-2">
 <h2 className="text-3xl font-bold tracking-tight text-th-heading">Good morning, Sarah</h2>
 <p className="text-th-secondary max-w-md">Your recent statement from <b className="text-th-heading">Northwest Medical Center</b> is ready for review. We've used AI to simplify your bill and find the best payment options for you.</p>
 <div className="flex gap-4 pt-2">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-bold">
 <span className="material-symbols-outlined text-sm">verified_user</span> HIPAA SECURE
 </span>
 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs font-bold">
 <span className="material-symbols-outlined text-sm">lock</span> PCI-DSS COMPLIANT
 </span>
 </div>
 </div>
 <div className="bg-primary/10 p-6 rounded-xl border border-primary/10 min-w-[280px] border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Total Balance Due</p>
 <div className="flex items-baseline gap-2">
 <span className="text-4xl font-extrabold text-th-heading tabular-nums">{fmt(totalBalance)}</span>
 </div>
 <p className="text-xs text-th-secondary mt-2">
  {collectionsSummary ? `${collectionsSummary.total_accounts || 0} accounts` : arSummary ? `A/R total from ${arSummary.total_claims || 0} claims` : 'Statement data'}
 </p>
 <button className="w-full mt-4 bg-primary text-th-heading font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
 Pay Full Balance <span className="material-symbols-outlined text-sm">arrow_forward</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 {/* Left & Center Content */}
 <div className="lg:col-span-2 space-y-8">
 {/* Summary KPIs from API */}
 <section className="bg-th-surface-raised rounded-2xl border border-th-border overflow-hidden">
 <div className="p-6 border-b border-th-border flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-purple-900/30 text-purple-400 rounded-lg">
 <span className="material-symbols-outlined">auto_awesome</span>
 </div>
 <h3 className="text-xl font-bold text-th-heading">Account Summary</h3>
 </div>
 <button className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
 <span className="material-symbols-outlined text-sm">download</span> Download PDF
 </button>
 </div>
 <div className="p-6">
 {(collectionsSummary || arSummary) ? (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
   {collectionsSummary && (
    <>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Total Outstanding</p>
      <p className="text-2xl font-extrabold text-th-heading tabular-nums mt-1">{fmt(collectionsSummary.total_outstanding || 0)}</p>
     </div>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Total Collected</p>
      <p className="text-2xl font-extrabold text-emerald-400 tabular-nums mt-1">{fmt(collectionsSummary.total_collected || 0)}</p>
     </div>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Collection Rate</p>
      <p className="text-2xl font-extrabold text-th-heading tabular-nums mt-1">{collectionsSummary.collection_rate || 0}%</p>
     </div>
    </>
   )}
   {arSummary && (
    <>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Total A/R</p>
      <p className="text-2xl font-extrabold text-th-heading tabular-nums mt-1">{fmt(arSummary.total_ar || 0)}</p>
     </div>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Avg Days in A/R</p>
      <p className="text-2xl font-extrabold text-th-heading tabular-nums mt-1">{arSummary.avg_days_in_ar || arSummary.average_days || 0}</p>
     </div>
     <div>
      <p className="text-xs font-bold uppercase tracking-wider text-th-muted">Over 90 Days</p>
      <p className="text-2xl font-extrabold text-red-400 tabular-nums mt-1">{fmt(arSummary.over_90_days || arSummary.aging_90_plus || 0)}</p>
     </div>
    </>
   )}
  </div>
 ) : (
  <div className="flex flex-col items-center justify-center py-8 text-center">
   <span className="material-symbols-outlined text-4xl text-th-muted mb-3">info</span>
   <h3 className="text-lg font-bold text-th-heading mb-1">No Data Available</h3>
   <p className="text-th-muted text-sm">Account summary data is not yet available.</p>
  </div>
 )}
 </div>
 </section>

 {/* Flexible Payment Options */}
 <section>
 <div className="flex items-center gap-3 mb-6">
 <div className="p-2 bg-blue-900/30 text-primary rounded-lg">
 <span className="material-symbols-outlined">payments</span>
 </div>
 <h3 className="text-xl font-bold text-th-heading">Personalized Payment Plans</h3>
 <span className="ml-auto text-xs font-bold text-th-secondary bg-th-surface-overlay px-2 py-1 rounded">AI GENERATED</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="p-6 bg-th-surface-raised border-2 border-primary rounded-2xl relative hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-l-[3px] border-l-emerald-500">
 <div className="absolute -top-3 right-4 bg-primary text-th-heading text-[10px] font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>
 <div className="flex justify-between items-start mb-4">
 <div>
 <h4 className="font-bold text-lg text-th-heading">0% Interest Installments</h4>
 <p className="text-sm text-th-secondary">Spread over 6 months</p>
 </div>
 <span className="material-symbols-outlined text-primary">calendar_month</span>
 </div>
 <div className="text-2xl font-extrabold mb-4 text-th-heading tabular-nums">{fmt(Math.round(totalBalance / 6))} <span className="text-sm font-normal text-th-secondary">/ month</span></div>
 <button className="w-full bg-primary text-th-heading font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Apply Now</button>
 </div>
 <div className="p-6 bg-th-surface-raised border border-th-border rounded-2xl hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group border-l-[3px] border-l-amber-500">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h4 className="font-bold text-lg text-th-heading">Extended Flexible Plan</h4>
 <p className="text-sm text-th-secondary">Up to 12 months</p>
 </div>
 <span className="material-symbols-outlined text-th-secondary group-hover:text-primary">trending_up</span>
 </div>
 <div className="text-2xl font-extrabold mb-4 text-th-heading tabular-nums">{fmt(Math.round(totalBalance / 12))} <span className="text-sm font-normal text-th-secondary">/ month</span></div>
 <button className="w-full bg-th-surface-overlay text-th-heading font-bold py-2.5 rounded-lg hover:bg-th-surface-overlay transition-colors">Apply Now</button>
 </div>
 </div>
 </section>

 {/* One-Click Payment */}
 <section className="bg-th-surface-raised p-8 rounded-2xl border border-th-border text-th-heading">
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div>
 <h3 className="text-xl font-bold mb-2">Secure One-Click Payment</h3>
 <p className="text-th-secondary text-sm">Choose your preferred secure checkout method.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button className="bg-th-surface-overlay text-th-heading px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-600 transition-colors">
 <span className="material-symbols-outlined">smartphone</span> Apple Pay
 </button>
 <button className="bg-th-surface-overlay text-th-heading px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-600 transition-colors">
 <span className="material-symbols-outlined">touch_app</span> Google Pay
 </button>
 <button className="bg-primary text-th-heading px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors">
 <span className="material-symbols-outlined">account_balance</span> Bank Transfer
 </button>
 </div>
 </div>
 </section>
 </div>

 {/* Right Sidebar: AI Smart Assistant */}
 <div className="lg:col-span-1">
 <div className="sticky top-24 space-y-6">
 <div className="bg-th-surface-raised rounded-2xl border border-th-border h-[600px] flex flex-col">
 <div className="p-4 border-b border-th-border flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
 <span className="material-symbols-outlined">smart_toy</span>
 </div>
 <div>
 <h4 className="font-bold text-sm text-th-heading">HealPay Smart Assistant</h4>
 <div className="flex items-center gap-1.5">
 <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
 <span className="text-[10px] font-bold text-th-secondary uppercase tracking-widest">Online</span>
 </div>
 </div>
 </div>
 {/* Chat Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 <div className="flex flex-col gap-1 max-w-[85%]">
 <div className="bg-th-surface-overlay p-3 rounded-2xl rounded-tl-none text-sm text-th-heading">
 Hi Sarah! I've reviewed your latest statement. Would you like me to explain your balance or help set up a payment plan?
 </div>
 <span className="text-[10px] text-th-secondary pl-1">Just now</span>
 </div>
 </div>
 {/* Chat Input */}
 <div className="p-4 border-t border-th-border space-y-3">
 <div className="flex flex-wrap gap-2">
 <button className="text-[10px] font-bold px-2 py-1 border border-th-border rounded-full hover:bg-primary/5 transition-colors text-primary">Apply Discount</button>
 <button className="text-[10px] font-bold px-2 py-1 border border-th-border rounded-full hover:bg-primary/5 transition-colors text-primary">Explain EOB</button>
 </div>
 <div className="relative">
 <input className="w-full bg-th-surface-overlay border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 text-th-heading placeholder:text-th-secondary" placeholder="Ask a question..." type="text" />
 <button className="absolute right-2 top-1.5 p-1.5 bg-primary text-th-heading rounded-lg">
 <span className="material-symbols-outlined text-lg">send</span>
 </button>
 </div>
 </div>
 </div>
 {/* Trust Cards */}
 <div className="bg-primary/10 border border-primary/10 p-4 rounded-xl flex items-center gap-4">
 <div className="p-2 bg-th-surface-overlay rounded-lg">
 <span className="material-symbols-outlined text-primary">shield_person</span>
 </div>
 <div>
 <p className="text-xs font-bold text-th-heading leading-tight">Your data is encrypted</p>
 <p className="text-[10px] text-th-muted">256-bit AES protection active.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </main>

 <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-th-border mt-12 mb-8">
 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
 <div className="flex items-center gap-2 opacity-50 text-th-secondary">
 <span className="material-symbols-outlined text-lg">auto_awesome</span>
 <span className="text-sm font-bold">HealPay AI</span>
 </div>
 <div className="flex gap-8 text-xs font-medium text-th-secondary">
 <a className="hover:text-primary" href="#">Privacy Policy</a>
 <a className="hover:text-primary" href="#">Terms of Service</a>
 <a className="hover:text-primary" href="#">HIPAA Compliance</a>
 <a className="hover:text-primary" href="#">Accessibility Statement</a>
 </div>
 <p className="text-[10px] text-th-secondary">&copy; 2023 HealPay AI Revenue Systems. All Rights Reserved.</p>
 </div>
 </footer>
 </div>
 );
}
