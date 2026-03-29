import React from 'react';

export function ConfidenceScoreTooltip({ score, factors }) {
 // Determine color based on score
 const getColor = (s) => {
 if (s >= 90) return 'text-emerald-500';
 if (s >= 70) return 'text-amber-500';
 return 'text-red-500';
 };

 return (
 <div className="group relative inline-flex items-center gap-1 cursor-help">
 <span className={`font-black text-lg ${getColor(score)}`}>{score}%</span>
 <span className="material-symbols-outlined text-th-secondary text-sm">info</span>

 {/* Tooltip Content */}
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-th-surface-base text-th-heading text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
 <div className="font-bold border-b border-th-border pb-1 mb-2 text-th-heading">AI Confidence Factors</div>
 <ul className="space-y-1.5">
 {factors ? factors.map((factor, idx) => (
 <li key={idx} className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
 <span>{factor}</span>
 </li>
 )) : (
 <>
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
 <span>Real-time portal verification</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
 <span>Historical payment patterns</span>
 </li>
 <li className="flex items-start gap-2">
 <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
 <span>COB database match</span>
 </li>
 </>
 )}
 </ul>
 {/* Arrow */}
 <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-th-surface-base"></div>
 </div>
 </div>
 );
}
