import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const tabs = [
 { to: '/settings/users', label: 'Users & Roles', icon: 'group' },
 { to: '/settings/billing-rules', label: 'Billing Rules', icon: 'rule' },
 { to: '/settings/ai-config', label: 'AI Configuration', icon: 'psychology' },
];

export function SettingsLayout() {
 const location = useLocation();

 // Default redirect to users tab
 if (location.pathname === '/settings' || location.pathname === '/settings/') {
 return <Navigate to="/settings/users" replace />;
 }

 return (
 <div className="flex flex-col h-full">
 {/* Header with horizontal tabs */}
 <div className="border-b border-th-border bg-th-surface-raised">
 <div className="px-8 pt-6 pb-0">
 <h1 className="text-xl font-bold text-th-heading mb-1">System Settings</h1>
 <p className="text-sm text-th-secondary mb-5">Manage your organization configuration</p>

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
 <main className="flex-1 overflow-auto">
 <Outlet />
 </main>
 </div>
 );
}
