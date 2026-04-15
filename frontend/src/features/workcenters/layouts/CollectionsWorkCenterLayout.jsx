import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const tabs = [
  { label: 'Hub', to: 'hub' },
  { label: 'Queue', to: 'queue' },
  { label: 'Alerts', to: 'alerts' },
  { label: 'Patient Portal', to: 'portal' },
  { label: 'Timeline', to: 'timeline' },
];

export function CollectionsWorkCenterLayout() {
  const tabClass = ({ isActive }) =>
    cn(
      'px-4 py-2 text-sm font-semibold border-b-2 transition-colors',
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-th-muted hover:text-th-heading hover:border-th-border'
    );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-0 border-b border-th-border bg-th-surface-raised">
        <h1 className="text-xl font-black text-th-heading tracking-tight">Collections Work Center</h1>
        <p className="text-sm text-th-secondary mb-3">Collections queue, alerts, and patient payments</p>
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} className={tabClass}>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
