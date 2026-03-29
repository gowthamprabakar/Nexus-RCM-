import React, { useState, useEffect } from 'react';

export function AutomationActionModal({ isOpen, onClose, action, claimId, onExecute }) {
 const [step, setStep] = useState('confirm'); // confirm, processing, success
 const [logs, setLogs] = useState([]);

 useEffect(() => {
 if (isOpen) {
 setStep('confirm');
 setLogs([]);
 }
 }, [isOpen]);

 const handleExecute = () => {
 setStep('processing');

 // Simulate bot steps
 const steps = [
 'Initializing automated agent...',
 `Analyzing claim context for ${claimId}...`,
 'Verifying payer portal connectivity...',
 `Executing action: ${action.actionName}...`,
 'Validating response...',
 'Updating claim status...'
 ];

 let currentStep = 0;
 const interval = setInterval(() => {
 if (currentStep < steps.length) {
 setLogs(prev => [...prev, { message: steps[currentStep], timestamp: new Date().toLocaleTimeString() }]);
 currentStep++;
 } else {
 clearInterval(interval);
 setStep('success');
 setTimeout(() => {
 onExecute(); // Notify parent of success
 }, 1500);
 }
 }, 800);
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-th-surface-base/50 backdrop-blur-sm">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-th-border ">

 {/* Header */}
 <div className="p-6 border-b border-th-border-subtle flex justify-between items-center bg-th-surface-overlay/30/50 /50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
 <span className="material-symbols-outlined">smart_toy</span>
 </div>
 <div>
 <h3 className="text-lg font-bold text-th-heading ">AI Automation Agent</h3>
 <p className="text-xs text-th-muted">Autonomous Action Execution</p>
 </div>
 </div>
 {step !== 'processing' && (
 <button onClick={onClose} className="text-th-secondary hover:text-th-secondary dark:hover:text-th-heading">
 <span className="material-symbols-outlined">close</span>
 </button>
 )}
 </div>

 {/* Body */}
 <div className="p-6">
 {step === 'confirm' && (
 <div className="space-y-4">
 <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl border border-violet-100 dark:border-violet-800/50">
 <h4 className="font-bold text-violet-900 dark:text-violet-100 mb-1">{action.actionName}</h4>
 <p className="text-sm text-violet-700 dark:text-violet-300 opacity-90">{action.description}</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="p-3 bg-th-surface-overlay/30 /50 rounded-lg text-center">
 <div className="text-xs text-th-muted uppercase font-bold tracking-wider mb-1">Time Saved</div>
 <div className="font-mono font-bold text-th-primary ">{action.timeSaved}</div>
 </div>
 <div className="p-3 bg-th-surface-overlay/30 /50 rounded-lg text-center">
 <div className="text-xs text-th-muted uppercase font-bold tracking-wider mb-1">Success Probability</div>
 <div className="font-mono font-bold text-emerald-600">{action.probabilitySuccess}</div>
 </div>
 </div>

 <p className="text-sm text-th-muted text-center pt-2">
 By proceeding, you authorize the AI agent to interact with the payer portal/system on your behalf.
 </p>
 </div>
 )}

 {step === 'processing' && (
 <div className="space-y-4">
 <div className="h-48 bg-slate-950 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-2 border border-th-border shadow-inner">
 {logs.map((log, i) => (
 <div key={i} className="flex gap-3 text-emerald-400 animate-fade-in">
 <span className="opacity-50">[{log.timestamp}]</span>
 <span>{log.message}</span>
 </div>
 ))}
 <div className="flex gap-3 text-emerald-400 animate-pulse">
 <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span>
 <span className="inline-block w-2 H-4 bg-emerald-400">_</span>
 </div>
 </div>
 </div>
 )}

 {step === 'success' && (
 <div className="text-center py-6 animate-scale-in">
 <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
 <span className="material-symbols-outlined text-3xl">check_circle</span>
 </div>
 <h3 className="text-xl font-bold text-th-heading mb-2">Automation Complete</h3>
 <p className="text-th-muted ">
 The action <strong>{action.actionName}</strong> has been successfully executed.
 </p>
 </div>
 )}
 </div>

 {/* Footer */}
 {step === 'confirm' && (
 <div className="p-6 border-t border-th-border-subtle flex gap-3">
 <button
 onClick={onClose}
 className="flex-1 py-3 px-4 rounded-xl border border-th-border font-bold text-th-muted hover:bg-th-surface-overlay/30 dark:hover:bg-th-surface-overlay transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleExecute}
 className="flex-[2] py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-th-heading font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
 >
 <span className="material-symbols-outlined">smart_toy</span>
 Execute Automation
 </button>
 </div>
 )}
 </div>
 </div>
 );
}
