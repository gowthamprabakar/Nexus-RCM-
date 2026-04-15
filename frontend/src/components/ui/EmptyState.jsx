import React from 'react';
import { cn } from '../../lib/utils';

/**
 * EmptyState — Center-aligned placeholder for empty lists, tables, or panels.
 *
 * Props:
 *  - icon         Material-symbols icon name (e.g. "inbox", "search_off").
 *  - title        Short heading.
 *  - description  Supporting text (optional, truncated to max-w-xs).
 *  - action       Callback invoked when the action button is clicked (optional).
 *  - actionLabel  Label for the action button (optional; required when action is set).
 *  - className    Extra classes to merge onto the outer wrapper.
 */
export function EmptyState({ icon, title, description, action, actionLabel, className }) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center px-6 py-10',
                className
            )}
            role="status"
            aria-live="polite"
        >
            {icon && (
                <div
                    className={cn(
                        'flex items-center justify-center rounded-full',
                        'h-12 w-12 mb-3',
                        'bg-th-surface-overlay text-th-muted'
                    )}
                    aria-hidden="true"
                >
                    <span className="material-symbols-outlined text-[24px] leading-none">{icon}</span>
                </div>
            )}

            {title && (
                <h3 className="text-sm font-semibold text-th-heading">{title}</h3>
            )}

            {description && (
                <p className="mt-1 text-xs text-th-muted max-w-xs leading-relaxed">
                    {description}
                </p>
            )}

            {action && actionLabel && (
                <button
                    type="button"
                    onClick={action}
                    className={cn(
                        'mt-4 inline-flex items-center justify-center gap-1.5',
                        'h-9 px-4 rounded-lg text-sm font-semibold',
                        'bg-th-primary text-white hover:bg-th-primary-hover',
                        'transition-colors duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-primary focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-base'
                    )}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;
