import React from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const tabs = [
 { to: '/intelligence/lida/dashboard', label: 'Dashboard', icon: 'dashboard' },
 { to: '/intelligence/lida/chat', label: 'LIDA Chat', icon: 'chat_bubble' },
 { to: '/intelligence/lida/reports', label: 'Reports', icon: 'bar_chart' },
 { to: '/intelligence/lida/tickets', label: 'Action Tracker', icon: 'assignment' },
];

export function LidaLayout() {
 const location = useLocation();

 if (location.pathname === '/intelligence/lida' || location.pathname === '/intelligence/lida/') {
 return <Navigate to="/intelligence/lida/dashboard" replace />;
 }

 return (
 <div className="flex flex-col h-full text-th-heading overflow-hidden">
 {/* Header with horizontal tabs */}
 <div className="border-b border-th-border bg-th-surface-raised shrink-0">
 <div className="px-8 pt-6 pb-0">
 <div className="flex items-center gap-3 mb-1">
 <span className="material-symbols-outlined text-2xl text-primary">auto_awesome</span>
 <h2 className="text-xl font-bold text-th-heading">LIDA AI</h2>
 </div>
 <p className="text-sm text-th-secondary mb-5">Predictive Intelligence & Analytics</p>

 <nav className="flex gap-6">
 {tabs.map((tab) => (
 <NavLink
 key={tab.to}
 to={tab.to}
 className={({ isActive }) => cn(
 'flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2',
 isActive
 ? 'border-primary text-primary'
 : 'border-transparent text-th-secondary hover:text-th-heading'
 )}
 >
 <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
 {tab.label}
 </NavLink>
 ))}
 </nav>
 </div>
 </div>

 {/* Main Content Area */}
 <main className="flex-1 overflow-hidden relative">
 <Outlet />
 </main>
 </div>
 );
}
