import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';

export function AlertsQueue() {
 const navigate = useNavigate();
 const [activeFilter, setActiveFilter] = useState('all');
 const [selectedAlerts, setSelectedAlerts] = useState([]);
 const [alerts, setAlerts] = useState([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   api.collections.getAlerts({ limit: 100 }).then(data => {
     setAlerts(data?.items || data || []);
     setLoading(false);
   }).catch(() => setLoading(false));
 }, []);

 const filterAlerts = (alerts) => {
 if (activeFilter === 'all') return alerts;
 return alerts.filter(alert => alert.type === activeFilter);
 };

 const filteredAlerts = filterAlerts(alerts);

 const getAlertCounts = () => {
 return {
 all: alerts.length,
 overdue_followup: alerts.filter(a => a.type === 'overdue_followup').length,
 sla_breach: alerts.filter(a => a.type === 'sla_breach').length,
 high_risk: alerts.filter(a => a.type === 'high_risk').length,
 ai_triggered: alerts.filter(a => a.type === 'ai_triggered').length,
 payment_promise: alerts.filter(a => a.type === 'payment_promise').length
 };
 };

 const counts = getAlertCounts();

 const getPriorityColor = (priority) => {
 const colors = {
 critical: 'bg-red-500',
 high: 'bg-orange-500',
 medium: 'bg-amber-500',
 low: 'bg-slate-400'
 };
 return colors[priority] || 'bg-slate-400';
 };

 const getAlertTypeLabel = (type) => {
 const labels = {
 overdue_followup: 'Overdue Follow-up',
 sla_breach: 'SLA Breach',
 high_risk: 'High Risk',
 ai_triggered: 'AI Alert',
 payment_promise: 'Payment Promise'
 };
 return labels[type] || type;
 };

 const getAlertIcon = (type) => {
 const icons = {
 overdue_followup: 'schedule',
 sla_breach: 'warning',
 high_risk: 'error',
 ai_triggered: 'auto_awesome',
 payment_promise: 'payments'
 };
 return icons[type] || 'notifications';
 };

 const toggleSelectAlert = (alertId) => {
 setSelectedAlerts(prev =>
 prev.includes(alertId)
 ? prev.filter(id => id !== alertId)
 : [...prev, alertId]
 );
 };

 const toggleSelectAll = () => {
 if (selectedAlerts.length === filteredAlerts.length) {
 setSelectedAlerts([]);
 } else {
 setSelectedAlerts(filteredAlerts.map(a => a.id));
 }
 };

 const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
 month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
 });

 if (loading) return (
   <div className="flex-1 flex items-center justify-center h-full">
     <div className="text-th-secondary text-sm">Loading alerts...</div>
   </div>
 );

 return (
 <div className="flex-1 overflow-y-auto font-sans h-full">
 <div className="max-w-[1600px] mx-auto px-10 py-8">
 {/* Breadcrumb */}
 <div className="flex items-center gap-2 text-sm text-th-secondary mb-6">
 <button onClick={() => navigate('/collections')} className="hover:text-primary transition-colors">
 Collections Hub
 </button>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span className="text-th-heading font-medium">Alerts & Follow-up Queue</span>
 </div>

 {/* Header */}
 <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
 <div className="flex flex-col gap-1">
 <h1 className="text-th-heading text-3xl font-black leading-tight tracking-tight">
 Alerts & Follow-up Queue
 </h1>
 <p className="text-th-secondary text-base font-normal">
 Proactive management of time-sensitive collection items
 </p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">refresh</span>
 <span>Refresh</span>
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">file_download</span>
 <span>Export to CSV</span>
 </button>
 </div>
 </div>

 {/* Filter Tabs */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden mb-6">
 <div className="flex overflow-x-auto">
 <button
 onClick={() => setActiveFilter('all')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'all'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 All Alerts
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-th-surface-overlay text-th-heading tabular-nums">
 {counts.all}
 </span>
 </button>
 <button
 onClick={() => setActiveFilter('overdue_followup')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'overdue_followup'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 Overdue Follow-ups
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400">
 {counts.overdue_followup}
 </span>
 </button>
 <button
 onClick={() => setActiveFilter('sla_breach')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'sla_breach'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 SLA Breaches
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-900/30 text-amber-400">
 {counts.sla_breach}
 </span>
 </button>
 <button
 onClick={() => setActiveFilter('high_risk')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'high_risk'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 High Risk
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-900/30 text-red-400">
 {counts.high_risk}
 </span>
 </button>
 <button
 onClick={() => setActiveFilter('ai_triggered')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'ai_triggered'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 AI Alerts
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-900/30 text-blue-400">
 {counts.ai_triggered}
 </span>
 </button>
 <button
 onClick={() => setActiveFilter('payment_promise')}
 className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors ${activeFilter === 'payment_promise'
 ? 'text-primary border-b-2 border-primary bg-primary/5'
 : 'text-th-secondary hover:text-th-heading hover:bg-th-surface-overlay/50'
 }`}
 >
 Payment Promises
 <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-900/30 text-emerald-400">
 {counts.payment_promise}
 </span>
 </button>
 </div>
 </div>

 {/* Bulk Actions Bar */}
 {selectedAlerts.length > 0 && (
 <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
 <p className="text-sm font-bold text-primary">
 {selectedAlerts.length} alert{selectedAlerts.length > 1 ? 's' : ''} selected
 </p>
 <div className="flex gap-2">
 <button className="px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 Assign to User
 </button>
 <button className="px-4 py-2 bg-th-surface-raised border border-th-border rounded-lg text-sm font-bold text-th-heading hover:bg-th-surface-overlay transition-colors">
 Snooze
 </button>
 <button className="px-4 py-2 bg-emerald-500 text-th-heading rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors">
 Mark as Resolved
 </button>
 </div>
 </div>
 )}

 {/* Alerts Table */}
 <div className="bg-th-surface-raised border border-th-border rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-th-surface-overlay/50 text-xs font-semibold uppercase tracking-wider text-th-muted">
 <tr>
 <th className="px-6 py-4">
 <input
 type="checkbox"
 checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
 onChange={toggleSelectAll}
 className="rounded border-th-border-strong"
 />
 </th>
 <th className="px-6 py-4">Priority</th>
 <th className="px-6 py-4">Type</th>
 <th className="px-6 py-4">Patient/Account</th>
 <th className="px-6 py-4">Message</th>
 <th className="px-6 py-4">Balance</th>
 <th className="px-6 py-4">Assigned To</th>
 <th className="px-6 py-4">Due Date</th>
 <th className="px-6 py-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-th-border text-sm">
 {filteredAlerts.map((alert) => (
 <tr key={alert.id} className="hover:bg-th-surface-overlay/50 transition-all duration-200">
 <td className="px-6 py-4">
 <input
 type="checkbox"
 checked={selectedAlerts.includes(alert.id)}
 onChange={() => toggleSelectAlert(alert.id)}
 className="rounded border-th-border-strong"
 />
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className={`w-2 h-2 rounded-full ${getPriorityColor(alert.priority)}`}></div>
 <span className="font-bold text-th-heading capitalize">{alert.priority}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <span className="material-symbols-outlined text-sm text-th-secondary">
 {getAlertIcon(alert.type)}
 </span>
 <span className="text-th-heading">{getAlertTypeLabel(alert.type)}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div>
 <p className="font-bold text-th-heading">{alert.patient}</p>
 <p className="text-xs text-th-secondary">{alert.mrn}</p>
 </div>
 </td>
 <td className="px-6 py-4">
 <p className="text-th-heading max-w-md">{alert.message}</p>
 {alert.daysOverdue > 0 && (
 <p className="text-xs text-red-500 font-bold mt-1 tabular-nums">
 {alert.daysOverdue} days overdue
 </p>
 )}
 </td>
 <td className="px-6 py-4 font-mono font-bold text-th-heading tabular-nums">
 ${alert.balance.toLocaleString()}
 </td>
 <td className="px-6 py-4 text-th-heading">
 {alert.assignedTo}
 </td>
 <td className="px-6 py-4 text-th-heading">
 {formatDate(alert.dueDate)}
 </td>
 <td className="px-6 py-4 text-right">
 <button
 onClick={() => navigate(`/collections/account/${alert.accountId}`)}
 className="bg-primary text-th-heading text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
 >
 View Account
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
