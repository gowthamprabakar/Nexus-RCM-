import React from 'react';

export function DenialWorkflowLog() {
    // Mock Audit Data
    const auditLogs = [
        { id: 1, claimId: 'CLM-2024001', user: 'AI System', action: 'Risk Identified', details: 'Risk Score: 92 (Critical)', timestamp: '2024-02-15 08:30 AM', status: 'Flagged' },
        { id: 2, claimId: 'CLM-2024001', user: 'Sarah Jenkins', action: 'Analysis Viewed', details: 'Reviewed prediction details', timestamp: '2024-02-15 09:15 AM', status: 'In Review' },
        { id: 3, claimId: 'CLM-2024001', user: 'Sarah Jenkins', action: 'Prevention Executed', details: 'Executed: Initiate Retro-Auth Request', timestamp: '2024-02-15 09:18 AM', status: 'Resolved' },
        { id: 4, claimId: 'CLM-2024042', user: 'AI System', action: 'Risk Identified', details: 'Risk Score: 78 (High)', timestamp: '2024-02-15 10:00 AM', status: 'Flagged' },
        { id: 5, claimId: 'CLM-2024042', user: 'Mike Ross', action: 'Ignored Risk', details: 'Reason: False Positive', timestamp: '2024-02-15 11:45 AM', status: 'Ignored' },
        { id: 6, claimId: 'CLM-2024055', user: 'System Automation', action: 'Batch Correction', details: 'Applied Modifier -25 to 14 claims', timestamp: '2024-02-14 04:00 PM', status: 'Resolved' },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Workflow Activity Log</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Audit trail of AI predictions and user interventions.</p>
                    </div>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm">
                        <span className="material-symbols-outlined">download</span> Export Log
                    </button>
                </div>

                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-4">Timestamp</th>
                                <th className="px-6 py-4">Claim ID</th>
                                <th className="px-6 py-4">User / System</th>
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Details</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                            {auditLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{log.timestamp}</td>
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{log.claimId}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        {log.user.includes('System') || log.user.includes('AI') ? (
                                            <span className="material-symbols-outlined text-purple-500 text-sm">smart_toy</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                                        )}
                                        {log.user}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{log.action}</td>
                                    <td className="px-6 py-4 text-slate-500">{log.details}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${log.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                                log.status === 'Flagged' ? 'bg-red-100 text-red-700' :
                                                    log.status === 'Ignored' ? 'bg-slate-100 text-slate-600' :
                                                        'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}
