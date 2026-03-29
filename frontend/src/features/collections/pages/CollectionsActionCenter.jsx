import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

export function CollectionsActionCenter() {
 const { accountId } = useParams();
 const navigate = useNavigate();

 const [account, setAccount] = useState(null);
 const [templates, setTemplates] = useState({ call: [], email: [] });
 const [dispositions, setDispositions] = useState([]);
 const [escalationReasons, setEscalationReasons] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   let cancelled = false;
   async function fetchData() {
     setLoading(true);
     const [acct, tpl, disp, esc] = await Promise.all([
       api.collections.getAccountDetail(accountId),
       api.collections.getTemplates(),
       api.collections.getDispositionCodes(),
       api.collections.getEscalationReasons(),
     ]);
     if (!cancelled) {
       setAccount(acct);
       setTemplates({ call: tpl?.call_templates || [], email: tpl?.email_templates || tpl?.email || [] });
       setDispositions(Array.isArray(disp) ? disp : []);
       setEscalationReasons(Array.isArray(esc) ? esc : []);
       setLoading(false);
     }
   }
   fetchData();
   return () => { cancelled = true; };
 }, [accountId]);

 // State management
 const [activeAction, setActiveAction] = useState('call'); // call, email, settlement, escalation, status
 const [callDuration, setCallDuration] = useState(0);
 const [selectedDisposition, setSelectedDisposition] = useState('');
 const [callNotes, setCallNotes] = useState('');
 const [promiseToPay, setPromiseToPay] = useState({ amount: '', date: '' });
 const [followUpDate, setFollowUpDate] = useState('');

 const [selectedEmailTemplate, setSelectedEmailTemplate] = useState('');
 const [emailSubject, setEmailSubject] = useState('');
 const [emailBody, setEmailBody] = useState('');

 const [settlementDiscount, setSettlementDiscount] = useState(20);
 const [paymentPlanMonths, setPaymentPlanMonths] = useState(6);

 const [selectedEscalationReason, setSelectedEscalationReason] = useState('');
 const [escalationNotes, setEscalationNotes] = useState('');
 const [escalationPriority, setEscalationPriority] = useState('medium');

 const [isTimerRunning, setIsTimerRunning] = useState(false);
 const [timerInterval, setTimerInterval] = useState(null);

 // Helper functions
 const formatCurrency = (amount) => {
 return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
 };

 const formatDuration = (minutes) => {
 const mins = Math.floor(minutes);
 const secs = Math.floor((minutes - mins) * 60);
 return `${mins}:${secs.toString().padStart(2, '0')}`;
 };

 const startTimer = () => {
 setIsTimerRunning(true);
 const interval = setInterval(() => {
 setCallDuration(prev => prev + 0.0167); // Add 1 second
 }, 1000);
 setTimerInterval(interval);
 };

 const stopTimer = () => {
 setIsTimerRunning(false);
 if (timerInterval) {
 clearInterval(timerInterval);
 }
 };

 const resetTimer = () => {
 stopTimer();
 setCallDuration(0);
 };

 const calculateSettlement = () => {
 const originalBalance = account?.balance?.total;
 const discountAmount = originalBalance * (settlementDiscount / 100);
 const settlementAmount = originalBalance - discountAmount;
 return { originalBalance, discountAmount, settlementAmount };
 };

 const calculatePaymentPlan = () => {
 const monthlyPayment = account?.balance?.total / paymentPlanMonths;
 return monthlyPayment;
 };

 const replaceTemplateTokens = (template) => {
 return template
 .replace(/{{patientName}}/g, account?.patient?.name)
 .replace(/{{accountId}}/g, account?.accountId)
 .replace(/{{balance}}/g, formatCurrency(account?.balance?.total))
 .replace(/{{serviceDate}}/g, account?.serviceDate)
 .replace(/{{phone}}/g, '(555) 123-4567')
 .replace(/{{facilityName}}/g, 'Memorial Healthcare')
 .replace(/{{collectorName}}/g, 'Collections Team')
 .replace(/{{paymentPortalUrl}}/g, 'https://pay.memorial.com')
 .replace(/{{mailingAddress}}/g, '123 Hospital Way, Medical City, MC 12345');
 };

 const handleTemplateSelect = (templateId) => {
 const template = templates.email.find(t => t.id === templateId);
 if (template) {
 setSelectedEmailTemplate(templateId);
 setEmailSubject(replaceTemplateTokens(template.subject));
 setEmailBody(replaceTemplateTokens(template.body));
 }
 };

 const handleLogAction = () => {
 // In a real app, this would save to backend
 alert(`Action logged successfully!\nType: ${activeAction}\nAccount: ${accountId}`);
 // Reset form
 if (activeAction === 'call') {
 resetTimer();
 setSelectedDisposition('');
 setCallNotes('');
 setPromiseToPay({ amount: '', date: '' });
 setFollowUpDate('');
 }
 };

 const getDispositionColor = (category) => {
 switch (category) {
 case 'positive': return 'text-green-600 dark:text-green-400';
 case 'negative': return 'text-red-600 dark:text-red-400';
 default: return 'text-yellow-600 dark:text-yellow-400';
 }
 };

 const getSeverityColor = (severity) => {
 switch (severity) {
 case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
 case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
 case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
 default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
 }
 };

 if (loading) {
   return (
     <div className="flex-1 flex items-center justify-center h-full p-6">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
     </div>
   );
 }

 if (!account) {
   return (
     <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 p-6">
       <span className="material-symbols-outlined text-6xl text-th-muted">search_off</span>
       <p className="text-th-secondary">Account not found or failed to load.</p>
       <button onClick={() => navigate('/collections')} className="px-4 py-2 bg-primary text-white rounded-lg">Back to Collections</button>
     </div>
   );
 }

 return (
 <div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 text-sm text-th-muted mb-2">
 <span onClick={() => navigate('/collections')} className="hover:text-primary cursor-pointer">Collections Hub</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span onClick={() => navigate(`/collections/account/${accountId}`)} className="hover:text-primary cursor-pointer">Account Details</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span>Action Center</span>
 </div>
 <h1 className="text-2xl font-bold text-th-heading ">Collections Action Center</h1>
 <p className="text-th-muted mt-1">
 Account {account?.accountId} • {account?.patient?.name} • {formatCurrency(account?.balance?.total)}
 </p>
 </div>
 <button
 onClick={() => navigate(`/collections/account/${accountId}`)}
 className="flex items-center gap-2 px-4 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-th-surface-overlay transition-colors"
 >
 <span className="material-symbols-outlined text-sm">arrow_back</span>
 <span>Back to Account</span>
 </button>
 </div>

 {/* Action Type Selector */}
 <div className="bg-white rounded-lg border border-th-border p-4">
 <div className="flex gap-2 overflow-x-auto">
 {[
 { id: 'call', label: 'Log Call', icon: 'call' },
 { id: 'email', label: 'Send Email', icon: 'email' },
 { id: 'settlement', label: 'Settlement Offer', icon: 'handshake' },
 { id: 'escalation', label: 'Escalate', icon: 'arrow_upward' },
 { id: 'status', label: 'Update Status', icon: 'edit_note' }
 ].map(action => (
 <button
 key={action.id}
 onClick={() => setActiveAction(action.id)}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeAction === action.id
 ? 'bg-primary text-th-heading'
 : 'bg-th-surface-overlay text-th-primary hover:bg-th-surface-overlay dark:hover:bg-slate-600'
 }`}
 >
 <span className="material-symbols-outlined text-sm">{action.icon}</span>
 <span className="font-medium">{action.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Call Logging Interface */}
 {activeAction === 'call' && (
 <div className="bg-white rounded-lg border border-th-border p-6 space-y-6">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">call</span>
 Call Logging
 </h2>
 <div className="flex items-center gap-4">
 <div className="text-2xl font-mono font-bold text-th-heading tabular-nums">
 {formatDuration(callDuration)}
 </div>
 <div className="flex gap-2">
 {!isTimerRunning ? (
 <button
 onClick={startTimer}
 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-th-heading rounded-lg hover:bg-green-700 transition-colors"
 >
 <span className="material-symbols-outlined text-sm">play_arrow</span>
 <span>Start</span>
 </button>
 ) : (
 <button
 onClick={stopTimer}
 className="flex items-center gap-2 px-4 py-2 bg-red-600 text-th-heading rounded-lg hover:bg-red-700 transition-colors"
 >
 <span className="material-symbols-outlined text-sm">stop</span>
 <span>Stop</span>
 </button>
 )}
 <button
 onClick={resetTimer}
 className="flex items-center gap-2 px-3 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors"
 >
 <span className="material-symbols-outlined text-sm">refresh</span>
 </button>
 </div>
 </div>
 </div>

 {/* Disposition Selection */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Call Outcome *
 </label>
 <select
 value={selectedDisposition}
 onChange={(e) => setSelectedDisposition(e.target.value)}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading focus:ring-2 focus:ring-primary focus:border-transparent"
 >
 <option value="">Select outcome...</option>
 {dispositions.map(disp => (
 <option key={disp.code} value={disp.code} className={getDispositionColor(disp.category)}>
 {disp.label}
 </option>
 ))}
 </select>
 </div>

 {/* Promise to Pay Fields */}
 {selectedDisposition === 'PTP' && (
 <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Promise Amount
 </label>
 <input
 type="number"
 value={promiseToPay.amount}
 onChange={(e) => setPromiseToPay({ ...promiseToPay, amount: e.target.value })}
 placeholder="$0.00"
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading "
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Promise Date
 </label>
 <input
 type="date"
 value={promiseToPay.date}
 onChange={(e) => setPromiseToPay({ ...promiseToPay, date: e.target.value })}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading "
 />
 </div>
 </div>
 )}

 {/* Call Notes */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Call Notes *
 </label>
 <textarea
 value={callNotes}
 onChange={(e) => setCallNotes(e.target.value)}
 rows={4}
 placeholder="Document the conversation details, patient responses, and any commitments made..."
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading resize-none"
 />
 </div>

 {/* Follow-up Scheduling */}
 {dispositions.find(d => d.code === selectedDisposition)?.requiresFollowUp && (
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Schedule Follow-up
 </label>
 <input
 type="datetime-local"
 value={followUpDate}
 onChange={(e) => setFollowUpDate(e.target.value)}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading "
 />
 </div>
 )}

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-4 border-t border-th-border ">
 <button
 onClick={() => {
 resetTimer();
 setSelectedDisposition('');
 setCallNotes('');
 setPromiseToPay({ amount: '', date: '' });
 setFollowUpDate('');
 }}
 className="px-6 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors"
 >
 Clear
 </button>
 <button
 onClick={handleLogAction}
 disabled={!selectedDisposition || !callNotes}
 className="px-6 py-2 bg-primary text-th-heading rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">save</span>
 <span>Log Call</span>
 </button>
 </div>
 </div>
 )}

 {/* Email Template Interface */}
 {activeAction === 'email' && (
 <div className="bg-white rounded-lg border border-th-border p-6 space-y-6">
 <h2 className="text-lg font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">email</span>
 Email Communication
 </h2>

 {/* Template Selection */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Select Template
 </label>
 <select
 value={selectedEmailTemplate}
 onChange={(e) => handleTemplateSelect(e.target.value)}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading focus:ring-2 focus:ring-primary focus:border-transparent"
 >
 <option value="">Choose a template...</option>
 {templates.email.map(template => (
 <option key={template.id} value={template.id}>
 {template.name}
 </option>
 ))}
 </select>
 </div>

 {selectedEmailTemplate && (
 <>
 {/* Subject Line */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Subject
 </label>
 <input
 type="text"
 value={emailSubject}
 onChange={(e) => setEmailSubject(e.target.value)}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading "
 />
 </div>

 {/* Email Body */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Message
 </label>
 <textarea
 value={emailBody}
 onChange={(e) => setEmailBody(e.target.value)}
 rows={12}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading font-mono text-sm resize-none"
 />
 </div>

 {/* Preview Note */}
 <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
 <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
 <div className="text-sm text-blue-900 dark:text-blue-100">
 <p className="font-medium mb-1">Template Variables Replaced</p>
 <p className="text-blue-700 dark:text-blue-300">Patient name, account details, and contact information have been automatically populated.</p>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-4 border-t border-th-border ">
 <button
 onClick={() => {
 setSelectedEmailTemplate('');
 setEmailSubject('');
 setEmailBody('');
 }}
 className="px-6 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors"
 >
 Clear
 </button>
 <button
 onClick={handleLogAction}
 className="px-6 py-2 bg-primary text-th-heading rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">send</span>
 <span>Send Email</span>
 </button>
 </div>
 </>
 )}
 </div>
 )}

 {/* Settlement Calculator */}
 {activeAction === 'settlement' && (
 <div className="bg-white rounded-lg border border-th-border p-6 space-y-6">
 <h2 className="text-lg font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">handshake</span>
 Settlement Offer Calculator
 </h2>

 {/* Settlement Discount Slider */}
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="text-sm font-medium text-th-primary ">
 Settlement Discount
 </label>
 <span className="text-2xl font-bold text-primary tabular-nums">{settlementDiscount}%</span>
 </div>
 <input
 type="range"
 min="10"
 max="50"
 step="5"
 value={settlementDiscount}
 onChange={(e) => setSettlementDiscount(Number(e.target.value))}
 className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-primary"
 />
 <div className="flex justify-between text-xs text-th-muted mt-1">
 <span>10%</span>
 <span>50%</span>
 </div>
 </div>

 {/* Settlement Calculation Display */}
 <div className="grid grid-cols-3 gap-4">
 <div className="p-4 bg-th-surface-overlay/30 rounded-lg border-l-[3px] border-l-blue-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-sm text-th-muted mb-1">Original Balance</p>
 <p className="text-2xl font-bold text-th-heading tabular-nums">
 {formatCurrency(calculateSettlement().originalBalance)}
 </p>
 </div>
 <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-[3px] border-l-emerald-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-sm text-green-600 dark:text-green-400 mb-1">Discount Amount</p>
 <p className="text-2xl font-bold text-green-700 dark:text-green-300 tabular-nums">
 -{formatCurrency(calculateSettlement().discountAmount)}
 </p>
 </div>
 <div className="p-4 bg-primary/10 rounded-lg border-l-[3px] border-l-purple-500 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
 <p className="text-sm text-primary-dark dark:text-primary-light mb-1">Settlement Amount</p>
 <p className="text-2xl font-bold text-primary tabular-nums">
 {formatCurrency(calculateSettlement().settlementAmount)}
 </p>
 </div>
 </div>

 {/* Payment Plan Option */}
 <div className="p-4 bg-th-surface-overlay/30 rounded-lg space-y-4">
 <h3 className="font-semibold text-th-heading ">Or Offer Payment Plan</h3>
 <div>
 <div className="flex justify-between items-center mb-2">
 <label className="text-sm font-medium text-th-primary ">
 Number of Months
 </label>
 <span className="text-lg font-bold text-th-heading tabular-nums">{paymentPlanMonths} months</span>
 </div>
 <input
 type="range"
 min="3"
 max="24"
 step="3"
 value={paymentPlanMonths}
 onChange={(e) => setPaymentPlanMonths(Number(e.target.value))}
 className="w-full h-2 bg-th-surface-overlay rounded-lg appearance-none cursor-pointer accent-primary"
 />
 <div className="flex justify-between text-xs text-th-muted mt-1">
 <span>3 months</span>
 <span>24 months</span>
 </div>
 </div>
 <div className="flex items-center justify-between p-3 bg-white rounded-lg">
 <span className="text-sm text-th-muted ">Monthly Payment</span>
 <span className="text-xl font-bold text-th-heading tabular-nums">
 {formatCurrency(calculatePaymentPlan())}/month
 </span>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-4 border-t border-th-border ">
 <button
 onClick={handleLogAction}
 className="px-6 py-2 bg-primary text-th-heading rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">send</span>
 <span>Send Settlement Offer</span>
 </button>
 </div>
 </div>
 )}

 {/* Escalation Interface */}
 {activeAction === 'escalation' && (
 <div className="bg-white rounded-lg border border-th-border p-6 space-y-6">
 <h2 className="text-lg font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">arrow_upward</span>
 Escalate Account
 </h2>

 {/* Escalation Reason */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Escalation Reason *
 </label>
 <select
 value={selectedEscalationReason}
 onChange={(e) => setSelectedEscalationReason(e.target.value)}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading focus:ring-2 focus:ring-primary focus:border-transparent"
 >
 <option value="">Select reason...</option>
 {escalationReasons.map(reason => (
 <option key={reason.id} value={reason.id}>
 {reason.label}
 </option>
 ))}
 </select>
 </div>

 {/* Priority Level */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-3">
 Priority Level *
 </label>
 <div className="grid grid-cols-4 gap-3">
 {[
 { value: 'low', label: 'Low', color: 'blue' },
 { value: 'medium', label: 'Medium', color: 'yellow' },
 { value: 'high', label: 'High', color: 'orange' },
 { value: 'critical', label: 'Critical', color: 'red' }
 ].map(priority => (
 <button
 key={priority.value}
 onClick={() => setEscalationPriority(priority.value)}
 className={`px-4 py-3 rounded-lg font-medium transition-colors ${escalationPriority === priority.value
 ? `bg-${priority.color}-600 text-th-heading`
 : `bg-${priority.color}-100 dark:bg-${priority.color}-900/30 text-${priority.color}-800 dark:text-${priority.color}-300 hover:bg-${priority.color}-200 dark:hover:bg-${priority.color}-900/50`
 }`}
 >
 {priority.label}
 </button>
 ))}
 </div>
 </div>

 {/* Escalation Notes */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Escalation Notes *
 </label>
 <textarea
 value={escalationNotes}
 onChange={(e) => setEscalationNotes(e.target.value)}
 rows={6}
 placeholder="Provide detailed context for the escalation, including previous attempts, patient responses, and recommended next steps..."
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading resize-none"
 />
 </div>

 {/* Manager Assignment */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Assign To
 </label>
 <select className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading ">
 <option>Collections Manager - John Smith</option>
 <option>Senior Supervisor - Mary Johnson</option>
 <option>Legal Review Team</option>
 </select>
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-4 border-t border-th-border ">
 <button
 onClick={() => {
 setSelectedEscalationReason('');
 setEscalationNotes('');
 setEscalationPriority('medium');
 }}
 className="px-6 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors"
 >
 Clear
 </button>
 <button
 onClick={handleLogAction}
 disabled={!selectedEscalationReason || !escalationNotes}
 className="px-6 py-2 bg-red-600 text-th-heading rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">arrow_upward</span>
 <span>Escalate Account</span>
 </button>
 </div>
 </div>
 )}

 {/* Status Update Interface */}
 {activeAction === 'status' && (
 <div className="bg-white rounded-lg border border-th-border p-6 space-y-6">
 <h2 className="text-lg font-semibold text-th-heading flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">edit_note</span>
 Update Account Status
 </h2>

 {/* Current Status */}
 <div className="p-4 bg-th-surface-overlay/30 rounded-lg">
 <p className="text-sm text-th-muted mb-1">Current Status</p>
 <p className="text-lg font-semibold text-th-heading ">{account?.status}</p>
 </div>

 {/* New Status */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 New Status *
 </label>
 <select className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading ">
 <option>In Collections</option>
 <option>Promise to Pay</option>
 <option>Payment Plan</option>
 <option>Dispute</option>
 <option>Escalated</option>
 <option>Legal Review</option>
 <option>Settled</option>
 <option>Paid in Full</option>
 <option>Write-off</option>
 </select>
 </div>

 {/* Reason for Change */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Reason for Status Change *
 </label>
 <textarea
 rows={4}
 placeholder="Explain why the status is being changed..."
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading resize-none"
 />
 </div>

 {/* Effective Date */}
 <div>
 <label className="block text-sm font-medium text-th-primary mb-2">
 Effective Date
 </label>
 <input
 type="date"
 defaultValue={new Date().toISOString().split('T')[0]}
 className="w-full px-4 py-2 bg-white border border-th-border-strong -strong rounded-lg text-th-heading "
 />
 </div>

 {/* Action Buttons */}
 <div className="flex justify-end gap-3 pt-4 border-t border-th-border ">
 <button className="px-6 py-2 bg-th-surface-overlay text-th-primary rounded-lg hover:bg-th-surface-overlay dark:hover:bg-slate-600 transition-colors">
 Cancel
 </button>
 <button
 onClick={handleLogAction}
 className="px-6 py-2 bg-primary text-th-heading rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
 >
 <span className="material-symbols-outlined text-sm">check</span>
 <span>Update Status</span>
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
