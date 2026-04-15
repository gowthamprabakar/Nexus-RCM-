import React from 'react';
import { cn } from '../../lib/utils';

/**
 * ErrorBanner — Red-tinted banner for surfacing recoverable errors.
 *
 * Props:
 *  - title      Short heading (bold).
 *  - message    Supporting detail shown beneath the title.
 *  - onRetry    Optional callback; when provided, a "Retry" button is rendered.
 *  - className  Extra classes to merge onto the wrapper.
 *
 * The banner is not dismissible — it persists until retry succeeds (caller removes it).
 */
export function ErrorBanner({ title, message, onRetry, className }) {
    return (
        <div
            role="alert"
            aria-live="assertive"
            className={cn(
                'flex items-start gap-3 rounded-lg border px-4 py-3',
                'bg-th-danger-bg border-th-danger text-th-danger',
                className
            )}
        >
            <span
                className="material-symbols-outlined text-[20px] leading-none mt-0.5 shrink-0"
                aria-hidden="true"
            >
                error
            </span>

            <div className="flex-1 min-w-0">
                {title && (
                    <p className="text-sm font-bold leading-snug">{title}</p>
                )}
                {message && (
                    <p className={cn('text-xs leading-relaxed opacity-90', title && 'mt-0.5')}>
                        {message}
                    </p>
                )}
            </div>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className={cn(
                        'inline-flex items-center gap-1 shrink-0',
                        'h-8 px-3 rounded-md text-xs font-semibold',
                        'border border-th-danger text-th-danger',
                        'hover:bg-th-danger hover:text-white transition-colors duration-150',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-th-danger focus-visible:ring-offset-2 focus-visible:ring-offset-th-surface-base'
                    )}
                >
                    <span className="material-symbols-outlined text-[14px] leading-none" aria-hidden="true">
                        refresh
                    </span>
                    Retry
                </button>
            )}
        </div>
    );
}

export default ErrorBanner;
