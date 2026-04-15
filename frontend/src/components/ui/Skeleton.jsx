import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Skeleton — Neutral loading placeholder.
 *
 * Usage:
 *   <Skeleton className="h-8 w-full" />
 *   <Skeleton className="h-4 w-32" />
 *
 * Defaults to a pulsing overlay surface. Pass any sizing / shape classes
 * via className (e.g. `rounded-full`, `h-64`, etc.).
 */
export function Skeleton({ className, ...rest }) {
    return (
        <div
            aria-hidden="true"
            className={cn(
                'bg-th-surface-overlay animate-pulse rounded',
                className
            )}
            {...rest}
        />
    );
}

export default Skeleton;
