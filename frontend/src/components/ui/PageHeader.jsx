import React from 'react';
import { cn } from '../../lib/utils';

export function PageHeader({ title, subtitle, actions, breadcrumbs, className }) {
    return (
        <div className={cn("px-8 py-4 mb-4", className)}>
            {breadcrumbs && (
                <nav className="flex items-center gap-1.5 text-xs text-th-secondary mb-3 font-medium">
                    {breadcrumbs.map((crumb, i) => (
                        <React.Fragment key={i}>
                            {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
                            {crumb.to ? (
                                <a href={crumb.to} className="hover:text-th-heading transition-colors">{crumb.label}</a>
                            ) : (
                                <span className="text-th-heading">{crumb.label}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[18px] font-semibold text-th-heading">{title}</h1>
                    {subtitle && <p className="text-[13px] text-th-secondary mt-0.5">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
        </div>
    );
}
