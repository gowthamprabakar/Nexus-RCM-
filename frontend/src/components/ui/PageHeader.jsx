import React from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({ title, subtitle, actions, breadcrumbs, className }) {
    return (
        <div className={cn("px-8 py-6 border-b border-slate-200 dark:border-th-border bg-white dark:bg-th-surface-base", className)}>
            {breadcrumbs && (
                <nav className="flex items-center gap-1.5 text-xs text-th-secondary dark:text-th-muted mb-3 font-medium">
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
                            {crumb.to ? (
                                <a href={crumb.to} className="hover:text-slate-600 dark:hover:text-th-heading transition-colors">{crumb.label}</a>
                            ) : (
                                <span className="text-th-muted dark:text-th-heading">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-th-heading tracking-tight">{title}</h1>
                    {subtitle && <p className="text-sm text-th-muted dark:text-th-secondary mt-0.5">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}
