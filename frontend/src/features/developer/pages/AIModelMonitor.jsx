import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../../lib/utils';
import { AIModelOverview } from './ai/AIModelOverview';

export function AIModelMonitor() {
 const location = useLocation();

 const isRoot = location.pathname === '/developer/ai-monitor' || location.pathname === '/developer/ai-monitor/';

 const navItems = [
 { to: '/developer/ai-monitor', end: true, icon: 'dashboard', label: 'System Overview' },
 { to: '/developer/ai-monitor/psi', icon: 'analytics', label: 'PSI Distribution' },
 { to: '/developer/ai-monitor/feature-importance', icon: 'monitoring', label: 'Feature Importance' },
 { to: '/developer/ai-monitor/registry', icon: 'history', label: 'Model Registry' },
 { to: '/developer/ai-monitor/drift-logs', icon: 'table_chart', label: 'Drift Logs' },
 ];

 return (
 <div className="text-th-heading min-h-screen flex flex-col font-sans">
 <main className="flex-1 flex overflow-hidden">
 {/* Horizontal Tab Navigation replacing sidebar */}
 <div className="flex-1 flex flex-col overflow-hidden">
 <div className="px-6 pt-4 border-b border-th-border">
 <div className="flex items-center gap-1 overflow-x-auto">
 {navItems.map(item => (
 <NavLink
 key={item.to}
 to={item.to}
 end={item.end}
 className={({ isActive }) => cn(
 "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap",
 isActive
 ? "border-primary text-primary"
 : "border-transparent text-th-secondary hover:text-th-heading"
 )}
 >
 <span className="material-symbols-outlined text-lg">{item.icon}</span>
 {item.label}
 </NavLink>
 ))}

 <div className="ml-auto flex items-center gap-3 pb-3">
 <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-th-secondary">
 <span className="material-symbols-outlined text-xs text-emerald-500">fiber_manual_record</span>
 <span className="text-sm font-medium">Production</span>
 </div>
 <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-th-surface-raised border border-th-border text-th-heading">
 <span className="material-symbols-outlined text-xs text-primary">radio_button_checked</span>
 <span className="text-sm font-medium">Staging-Canary</span>
 </div>
 <span className="ai-predictive">Predictive AI</span>
 </div>
 </div>
 </div>

 {/* Dashboard Content */}
 <section className="flex-1 overflow-y-auto p-6">
 {isRoot ? <AIModelOverview /> : <Outlet />}
 </section>
 </div>
 </main>
 </div>
 );
}
