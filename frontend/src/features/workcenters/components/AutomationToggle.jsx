import React from 'react';

export function AutomationToggle({ available, label, confidence, onApprove, onReject, status = 'suggested' }) {
  if (!available) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/5 border border-primary/20">
      <span className="text-xs">⚡</span>
      <span className="text-[11px] font-semibold text-primary">{label}</span>
      <div className="w-12 h-1.5 bg-th-surface-overlay rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${confidence}%` }} />
      </div>
      <span className="text-[10px] text-th-muted tabular-nums">{confidence}%</span>
      {status === 'suggested' && (
        <>
          <button onClick={onApprove} className="size-5 flex items-center justify-center rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs">✓</button>
          <button onClick={onReject} className="size-5 flex items-center justify-center rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs">✗</button>
        </>
      )}
      {status === 'approved' && <span className="text-[10px] text-emerald-400 font-bold">Approved</span>}
      {status === 'executed' && <span className="text-[10px] text-blue-400 font-bold">Done</span>}
    </div>
  );
}
