import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

function buildPresets() {
    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);

    const startOfMonth = (d) => {
        const r = new Date(d);
        r.setDate(1);
        return r;
    };
    const endOfMonth = (d) => {
        const r = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return r;
    };
    const startOfQuarter = (d) => {
        const q = Math.floor(d.getMonth() / 3);
        return new Date(d.getFullYear(), q * 3, 1);
    };
    const endOfQuarter = (d) => {
        const q = Math.floor(d.getMonth() / 3);
        return new Date(d.getFullYear(), q * 3 + 3, 0);
    };

    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevQStart = startOfQuarter(new Date(now.getFullYear(), now.getMonth() - 3, 1));
    const prevQEnd = endOfQuarter(new Date(now.getFullYear(), now.getMonth() - 3, 1));

    const ago = (days) => {
        const d = new Date(today);
        d.setDate(d.getDate() - days);
        return d;
    };

    return [
        { label: 'Today',          from: fmt(today),              to: fmt(today),              days: 1 },
        { label: 'Last 7 Days',    from: fmt(ago(6)),             to: fmt(today),              days: 7 },
        { label: 'Last 30 Days',   from: fmt(ago(29)),            to: fmt(today),              days: 30 },
        { label: 'Last 90 Days',   from: fmt(ago(89)),            to: fmt(today),              days: 90 },
        { label: 'This Month',     from: fmt(startOfMonth(now)),  to: fmt(endOfMonth(now)),    days: null },
        { label: 'Last Month',     from: fmt(lastMonth),          to: fmt(endOfMonth(lastMonth)), days: null },
        { label: 'This Quarter',   from: fmt(startOfQuarter(now)),to: fmt(endOfQuarter(now)),  days: null },
        { label: 'Last Quarter',   from: fmt(prevQStart),         to: fmt(prevQEnd),           days: null },
        { label: 'YTD',            from: `${now.getFullYear()}-01-01`, to: fmt(today),         days: null },
        { label: 'Custom',         from: null,                    to: null,                    days: null, custom: true },
    ];
}

const PRESETS = buildPresets();

export function DateRangePicker({ value, onChange, align = 'left', className }) {
    const [open, setOpen] = useState(false);
    const [activeLabel, setActiveLabel] = useState(value || 'Last 30 Days');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const containerRef = useRef(null);

    const handleOutsideClick = useCallback((e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
            setOpen(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            document.addEventListener('mousedown', handleOutsideClick);
        } else {
            document.removeEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [open, handleOutsideClick]);

    useEffect(() => {
        if (value) setActiveLabel(value);
    }, [value]);

    const handleSelect = (preset) => {
        if (preset.custom) {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        setActiveLabel(preset.label);
        setOpen(false);
        onChange && onChange(preset);
    };

    const handleCustomApply = () => {
        if (!customFrom || !customTo) return;
        const from = new Date(customFrom);
        const to = new Date(customTo);
        const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
        const label = `${customFrom} – ${customTo}`;
        setActiveLabel(label);
        setOpen(false);
        setShowCustom(false);
        onChange && onChange({ label, from: customFrom, to: customTo, days });
    };

    return (
        <div ref={containerRef} className={cn('relative inline-block', className)}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium',
                    'bg-th-surface-raised border border-th-border text-th-secondary',
                    'hover:bg-th-surface-overlay hover:text-th-heading',
                    'transition-all duration-200',
                    open && 'ring-1 ring-blue-500 border-blue-500'
                )}
            >
                <span className="material-symbols-outlined text-base text-th-muted">calendar_month</span>
                <span className="max-w-[180px] truncate">{activeLabel}</span>
                <span className={cn(
                    'material-symbols-outlined text-base text-th-muted transition-transform duration-200',
                    open && 'rotate-180'
                )}>expand_more</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className={cn(
                    'absolute z-50 mt-1.5 w-56 rounded-xl bg-th-surface-raised border border-th-border shadow-lg',
                    'py-1 overflow-hidden',
                    align === 'right' ? 'right-0' : 'left-0'
                )}>
                    {PRESETS.map((preset) => {
                        const isActive = activeLabel === preset.label;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleSelect(preset)}
                                className={cn(
                                    'w-full flex items-center justify-between px-3 py-2 text-sm text-left',
                                    'transition-colors duration-150',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold'
                                        : 'text-th-secondary hover:bg-th-surface-overlay hover:text-th-heading'
                                )}
                            >
                                <span>{preset.label}</span>
                                {isActive && (
                                    <span className="material-symbols-outlined text-sm text-blue-600 dark:text-blue-400">
                                        check
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {/* Custom date inputs */}
                    {showCustom && (
                        <div className="px-3 pt-2 pb-3 border-t border-th-border mt-1 space-y-2">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-th-muted mb-1">
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className={cn(
                                        'w-full h-8 px-2 text-xs rounded-lg',
                                        'bg-th-surface-raised border border-th-border text-th-heading',
                                        'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
                                        'transition-colors duration-150'
                                    )}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-th-muted mb-1">
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={customTo}
                                    min={customFrom || undefined}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className={cn(
                                        'w-full h-8 px-2 text-xs rounded-lg',
                                        'bg-th-surface-raised border border-th-border text-th-heading',
                                        'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
                                        'transition-colors duration-150'
                                    )}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleCustomApply}
                                disabled={!customFrom || !customTo}
                                className={cn(
                                    'w-full h-8 rounded-lg text-xs font-semibold transition-colors duration-150',
                                    customFrom && customTo
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-th-surface-overlay text-th-muted cursor-not-allowed'
                                )}
                            >
                                Apply Range
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DateRangePicker;
