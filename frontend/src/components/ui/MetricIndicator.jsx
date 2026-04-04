import React from 'react';
import { cn } from '../../lib/utils';

const AI_LEVELS = {
    descriptive: { icon: 'bar_chart', color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Descriptive' },
    diagnostic: { icon: 'troubleshoot', color: 'text-amber-400', bg: 'bg-amber-900/20', label: 'Diagnostic' },
    predictive: { icon: 'query_stats', color: 'text-purple-400', bg: 'bg-purple-900/20', label: 'Predictive' },
    prescriptive: { icon: 'auto_fix_high', color: 'text-emerald-400', bg: 'bg-emerald-900/20', label: 'Prescriptive' },
};

export function AILevelBadge({ level, className }) {
    const config = AI_LEVELS[level];
    if (!config) return null;
    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", config.bg, config.color, className)}>
            <span className="material-symbols-outlined text-xs">{config.icon}</span>
            {config.label}
        </span>
    );
}

export function AIInsightCard({ level, title, description, action, onAction, className }) {
    const config = AI_LEVELS[level] || AI_LEVELS.descriptive;
    return (
        <div className={cn("border border-th-border rounded-lg p-4 bg-th-surface-raised", className)}>
            <div className="flex items-start justify-between mb-2">
                <AILevelBadge level={level} />
                {action && (
                    <button onClick={onAction} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">
                        {action}
                    </button>
                )}
            </div>
            <h4 className="text-[13px] font-semibold text-th-heading mb-1">{title}</h4>
            <p className="text-xs text-th-muted dark:text-th-secondary leading-relaxed">{description}</p>
        </div>
    );
}
