import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const tabs = [
 { label: 'Overview', to: '/claims/overview', icon: 'dashboard' },
 { label: 'Work Queue', to: '/claims/work-queue', icon: 'inbox' },
 { label: 'Pre-Batch Scrub', to: '/claims/mass-scrub', icon: 'cleaning_services' },
 { label: 'Rule Engine', to: '/claims/rules', icon: 'rule' },
 { label: 'Batch Actions', to: '/claims/batch', icon: 'dynamic_form' },
];

export function ClaimsLayout() {
 return (
 <div className="flex flex-col h-full font-sans text-th-heading overflow-hidden">
 {/* Horizontal Tab Navigation */}
 <nav className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-th-border shrink-0">
 {tabs.map((tab) => (
 <NavLink
 key={tab.to}
 to={tab.to}
 className={({ isActive }) => cn(
 "flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all -mb-px",
 isActive
 ? "border-b-2 border-primary text-primary"
 : "text-th-secondary hover:text-th-heading"
 )}
 >
 <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
 <span>{tab.label}</span>
 </NavLink>
 ))}
 </nav>

 {/* Main Content Area */}
 <main className="flex-1 overflow-hidden relative">
 <Outlet />
 </main>
 </div>
 );
}
