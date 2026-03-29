import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../../lib/utils';

const tabs = [
  { label: 'Overview', to: 'overview' },
  { label: 'Root Cause', to: 'root-cause' },
  { label: 'Payer Patterns', to: 'payer-patterns' },
  { label: 'Trends', to: 'trends' },
];

export function DenialAnalyticsLayout() {
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
        <h1 className="text-xl font-black text-th-heading tracking-tight">Denial Analytics</h1>
        <p className="text-sm text-th-secondary mb-3">Denial patterns, root cause analysis, and prevention intelligence</p>
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
