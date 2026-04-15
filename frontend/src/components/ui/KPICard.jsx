import React from 'react';
import { cn } from '../../lib/utils';

/*  ═══════════════════════════════════════════════════════════════
    KPICard — unified stat tile used across Detect (Denial Intelligence,
    High Risk Claims) and other feature pages.

    Supports two color APIs (both map to th-* tokens):
      color='primary'|'success'|'warning'|'danger'|'info'   (new — preferred)
      accentColor='blue'|'green'|'amber'|'red'|'purple'     (legacy, still honored)

    Props:
      icon           material-symbols name, rendered top-right of the header.
      label          Uppercase caption.
      value          Headline value (string / number / node).
      sublabel       Small helper text beneath the value.  (alias: subtitle)
      trend          Trend copy (e.g. "+12%").
      trendDirection 'up' | 'down' — picks arrow + good/bad hue.
      color          Semantic color token driving icon + accent border.
      accentColor    Legacy color name (kept for backwards compatibility).
      variant        'default' | 'inverse' — when 'inverse', "up" is bad.
      onClick        Makes the tile clickable.
      className      Additional classes.
   ═══════════════════════════════════════════════════════════════ */

// New color API: semantic color tokens → th-* utility strings
const COLOR_STYLES = {
    primary: {
        border: 'border-t-th-primary',
        icon:   'bg-th-primary-bg text-th-primary',
    },
    success: {
        border: 'border-t-th-success',
        icon:   'bg-th-success-bg text-th-success',
    },
    warning: {
        border: 'border-t-th-warning',
        icon:   'bg-th-warning-bg text-th-warning',
    },
    danger: {
        border: 'border-t-th-danger',
        icon:   'bg-th-danger-bg text-th-danger',
    },
    info: {
        border: 'border-t-th-info',
        icon:   'bg-th-info-bg text-th-info',
    },
};

// Legacy accentColor API — maps to the same th-* set when possible.
const LEGACY_ACCENTS = {
    blue:   'primary',
    green:  'success',
    amber:  'warning',
    red:    'danger',
    purple: null,                               // no th-* purple — fall through
};

const LEGACY_BORDER_CLASS = {
    purple: 'border-t-purple-500 dark:border-t-purple-400',
};

export function KPICard({
    icon,
    label,
    value,
    sublabel,
    subtitle,                                   // legacy alias
    trend,
    trendDirection,
    color,
    accentColor,
    variant = 'default',
    onClick,
    className,
}) {
    // Resolve effective semantic color.
    const resolved =
        (color && COLOR_STYLES[color]) ? color :
        (accentColor && LEGACY_ACCENTS[accentColor]) ? LEGACY_ACCENTS[accentColor] :
        null;

    const style = resolved ? COLOR_STYLES[resolved] : null;
    const legacyBorderOverride = accentColor && !resolved ? LEGACY_BORDER_CLASS[accentColor] : null;

    const isPositive = trendDirection === 'up';
    const trendGood  = variant === 'inverse' ? !isPositive : isPositive;
    const helper     = sublabel ?? subtitle;

    return (
        <div
            onClick={onClick}
            className={cn(
                'bg-th-surface-raised border border-th-border rounded-lg p-4',
                'transition-colors duration-150 hover:border-th-border-strong',
                style ? `border-t-2 ${style.border}` : legacyBorderOverride ? `border-t-2 ${legacyBorderOverride}` : '',
                onClick ? 'cursor-pointer' : '',
                className
            )}
        >
            {/* Header row: icon (left) + label (right-aligned uppercase) */}
            <div className="flex items-start justify-between mb-3">
                {icon && (
                    <span
                        className={cn(
                            'inline-flex items-center justify-center',
                            'h-8 w-8 rounded-md shrink-0',
                            style ? style.icon : 'bg-th-surface-overlay text-th-muted'
                        )}
                        aria-hidden="true"
                    >
                        <span className="material-symbols-outlined text-[18px] leading-none">{icon}</span>
                    </span>
                )}
                {label && (
                    <span className="text-[11px] font-medium uppercase tracking-wide text-th-muted text-right">
                        {label}
                    </span>
                )}
            </div>

            {/* Big value + optional trend */}
            <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-semibold text-th-heading tracking-tight tabular-nums">
                    {value}
                </span>
                {trend && (
                    <span
                        className={cn(
                            'text-[11px] font-semibold flex items-center gap-0.5',
                            trendGood ? 'text-th-success' : 'text-th-danger'
                        )}
                    >
                        <span className="material-symbols-outlined text-[13px] leading-none" aria-hidden="true">
                            {isPositive ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        {trend}
                    </span>
                )}
            </div>

            {helper && (
                <p className="text-[12px] text-th-muted mt-1.5 leading-relaxed">{helper}</p>
            )}
        </div>
    );
}

export function KPIRibbon({ children, className }) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-8 py-4',
                'border-b border-th-border bg-th-surface-base',
                className
            )}
        >
            {children}
        </div>
    );
}

export default KPICard;
