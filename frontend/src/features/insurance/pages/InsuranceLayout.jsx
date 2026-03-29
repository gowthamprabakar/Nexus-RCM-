import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const tabs = [
 { to: '/insurance-verification/overview', label: 'Access Dashboard', icon: 'dashboard' },
 { to: '/insurance-verification/eligibility', label: 'Eligibility (270/271)', icon: 'verified_user' },
 { to: '/insurance-verification/auths', label: 'Prior Authorization', icon: 'assignment_turned_in' },
 { to: '/insurance-verification/benefits', label: 'Benefit Analytics', icon: 'payments' },
 { to: '/insurance-verification/history', label: 'History', icon: 'history' },
];

export function InsuranceLayout() {
 return (
 <div className="flex flex-col h-full text-th-heading overflow-hidden">
 {/* Horizontal Tab Navigation */}
 <nav className="shrink-0 border-b border-th-border bg-th-surface-raised px-6">
 <div className="flex items-center gap-1 overflow-x-auto">
 {tabs.map((tab) => (
 <NavLink
 key={tab.to}
 to={tab.to}
 className={({ isActive }) => cn(
 "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
 isActive
 ? "border-primary text-primary"
 : "border-transparent text-th-secondary hover:text-th-heading"
 )}
 >
 <span className="material-symbols-outlined text-lg">{tab.icon}</span>
 {tab.label}
 </NavLink>
 ))}
 </div>
 </nav>

 {/* Main Content Area */}
 <main className="flex-1 overflow-hidden relative">
 <Outlet />
 </main>
 </div>
 );
}
