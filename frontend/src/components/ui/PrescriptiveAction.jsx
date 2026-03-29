import React, { useState } from 'react';
import { cn } from '../../lib/utils';

const PRIORITY_STYLES = {
    critical: {
        dot: 'bg-red-500',
        label: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400',
        ring: 'ring-red-200 dark:ring-red-800',
    },
    high: {
        dot: 'bg-amber-500',
        label: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
        ring: 'ring-amber-200 dark:ring-amber-800',
    },
    medium: {
        dot: 'bg-blue-500',
        label: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        ring: 'ring-blue-200 dark:ring-blue-800',
    },
    low: {
        dot: 'bg-slate-400',
        label: 'bg-slate-100 dark:bg-th-surface-overlay text-th-muted',
        ring: 'ring-slate-200 dark:ring-slate-700',
    },
};

const EFFORT_STYLES = {
    immediate: 'bg-red-50 dark:bg-red-900/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
    'short-term': 'bg-amber-50 dark:bg-amber-900/15 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    'long-term': 'bg-slate-100 dark:bg-th-surface-overlay text-th-secondary border-th-border',
};

const ICON_BG_CYCLE = [
    'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
];

function ActionItem({ action, index }) {
    const priority = PRIORITY_STYLES[action.priority] || PRIORITY_STYLES.medium;
    const effortStyle = EFFORT_STYLES[action.effort] || EFFORT_STYLES['short-term'];
    const iconBg = ICON_BG_CYCLE[index % ICON_BG_CYCLE.length];
    const isAITag = action.tag && action.tag.toLowerCase().includes('ai');

    return (
        <div className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            'border border-transparent hover:border-th-border hover:bg-th-surface-overlay',
            'transition-all duration-200 group'
        )}>
            {/* Priority dot + Icon */}
            <div className="relative shrink-0">
                <div className={cn(
                    'size-9 rounded-lg flex items-center justify-center',
                    iconBg
                )}>
                    <span className="material-symbols-outlined text-base">
                        {action.icon || 'lightbulb'}
                    </span>
                </div>
                {/* Priority indicator dot */}
                <span className={cn(
                    'absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-th-surface-raised',
                    priority.dot
                )} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-th-heading leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
                        {action.title}
                    </p>
                    {/* Impact value */}
                    {action.impact && (
                        <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                            {action.impact}
                        </span>
                    )}
                </div>

                {action.description && (
                    <p className="text-xs text-th-secondary mt-0.5 leading-relaxed line-clamp-2">
                        {action.description}
                    </p>
                )}

                {/* Bottom meta row */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Effort badge */}
                    {action.effort && (
                        <span className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize',
                            effortStyle
                        )}>
                            {action.effort.replace('-', ' ')}
                        </span>
                    )}

                    {/* Priority badge */}
                    <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize',
                        priority.label
                    )}>
                        <span className={cn('size-1.5 rounded-full', priority.dot)} />
                        {action.priority}
                    </span>

                    {/* Tag pill */}
                    {action.tag && (
                        <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            isAITag
                                ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                : 'bg-slate-100 dark:bg-th-surface-overlay text-th-muted'
                        )}>
                            {isAITag && (
                                <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                            )}
                            {action.tag}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export function PrescriptiveAction({
    actions = [],
    title = 'AI Recommended Actions',
    maxVisible = 3,
    className,
}) {
    const [showAll, setShowAll] = useState(false);
    const visibleActions = showAll ? actions : actions.slice(0, maxVisible);
    const hiddenCount = actions.length - maxVisible;

    return (
        <div className={cn(
            'bg-th-surface-raised border border-th-border rounded-xl overflow-hidden',
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-th-border bg-gradient-to-r from-purple-50/60 to-transparent dark:from-purple-900/10 dark:to-transparent">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-purple-600 dark:text-purple-400">
                        auto_awesome
                    </span>
                    <h3 className="text-sm font-bold text-th-heading">{title}</h3>
                    {actions.length > 0 && (
                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold tabular-nums">
                            {actions.length}
                        </span>
                    )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 dark:text-purple-400 ai-badge" style={{ background: 'transparent' }}>
                    AI Powered
                </span>
            </div>

            {/* Action list */}
            <div className="p-3 space-y-1">
                {visibleActions.length === 0 ? (
                    <div className="py-8 text-center">
                        <span className="material-symbols-outlined text-3xl text-th-muted mb-2 block">check_circle</span>
                        <p className="text-sm text-th-muted">No actions recommended at this time.</p>
                    </div>
                ) : (
                    visibleActions.map((action, i) => (
                        <ActionItem key={action.title + i} action={action} index={i} />
                    ))
                )}
            </div>

            {/* View all / Show less */}
            {!showAll && hiddenCount > 0 && (
                <div className="px-5 py-3 border-t border-th-border">
                    <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-150 flex items-center gap-1"
                    >
                        View all {actions.length} actions
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                </div>
            )}
            {showAll && actions.length > maxVisible && (
                <div className="px-5 py-3 border-t border-th-border">
                    <button
                        type="button"
                        onClick={() => setShowAll(false)}
                        className="text-xs font-semibold text-th-muted hover:text-th-secondary transition-colors duration-150 flex items-center gap-1"
                    >
                        Show less
                        <span className="material-symbols-outlined text-sm">expand_less</span>
                    </button>
                </div>
            )}
        </div>
    );
}

export default PrescriptiveAction;
