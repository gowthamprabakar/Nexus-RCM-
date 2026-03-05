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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                            <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Automation Agent</h3>
                            <p className="text-xs text-slate-500">Autonomous Action Execution</p>
                        </div>
                    </div>
                    {step !== 'processing' && (
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
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
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Time Saved</div>
                                    <div className="font-mono font-bold text-slate-700 dark:text-slate-200">{action.timeSaved}</div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Success Probability</div>
                                    <div className="font-mono font-bold text-emerald-600">{action.probabilitySuccess}</div>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 text-center pt-2">
                                By proceeding, you authorize the AI agent to interact with the payer portal/system on your behalf.
                            </p>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="space-y-4">
                            <div className="h-48 bg-slate-950 rounded-xl p-4 font-mono text-xs overflow-y-auto space-y-2 border border-slate-800 shadow-inner">
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
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Automation Complete</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                The action <strong>{action.actionName}</strong> has been successfully executed.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'confirm' && (
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExecute}
                            className="flex-[2] py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
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
