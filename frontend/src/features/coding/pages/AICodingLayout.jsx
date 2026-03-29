import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const TABS = [
 { to: '/ai-coding', label: 'Coding Optimizer', icon: 'code', end: true },
 { to: '/ai-coding/audit', label: 'Audit & Review', icon: 'policy' },
 { to: '/ai-coding/compliance', label: 'Compliance', icon: 'shield_person' },
 { to: '/ai-coding/rulebook', label: 'Payer Rulebook', icon: 'menu_book' },
];

export function AICodingLayout() {
 return (
 <div className="flex flex-col flex-1 overflow-hidden h-[calc(100vh-64px)] font-sans text-th-heading bg-th-surface-base">
 {/* Horizontal Tab Navigation */}
 <div className="shrink-0 border-b border-th-border bg-th-surface-raised">
 <div className="flex items-center gap-1 px-6">
 {TABS.map((tab) => (
 <NavLink
 key={tab.to}
 to={tab.to}
 end={tab.end}
 className={({ isActive }) => cn(
 'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
 isActive
 ? 'border-b-cyan-400 text-cyan-400'
 : 'border-b-transparent text-th-secondary hover:text-th-heading hover:border-b-slate-600'
 )}
 >
 <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
 {tab.label}
 </NavLink>
 ))}
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-hidden">
 <Outlet />
 </div>
 </div>
 );
}
