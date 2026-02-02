import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api'; // Adjust path as needed
import { cn } from '../../../lib/utils';

export function AuditLogModal({ onClose }) {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, we'd fetch from API
        // Checking if api.audit exists, if not use mock or fetch
        // Since we created audit_logs.json, we can import it or use a service method if verified
        const fetchLogs = async () => {
            // Fallback mock if service not fully defined yet, but trying to use imported data pattern
            try {
                const data = await import('../../../data/synthetic/audit_logs.json').then(m => m.default);
                setLogs(data);
            } catch (e) {
                console.error("Failed to load audit logs", e);
                setLogs([
                    { id: "ERR-01", action: "Load Error", user: "System", timestamp: new Date().toISOString(), details: "Could not load logs." }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.user.toLowerCase().includes(filter.toLowerCase()) ||
        log.details.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-border-dark flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">security</span>
                            System Audit & Performance Log
                        </h3>
                        <p className="text-xs text-slate-500">Immutable record of all system actions and access events</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-4 border-b border-slate-200 dark:border-border-dark bg-slate-50/50 shrink-0">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input
                            type="text"
                            placeholder="Filter by user, action, or details..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <span className="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 border-b border-slate-200 dark:border-border-dark">Timestamp</th>
                                    <th className="px-6 py-3 border-b border-slate-200 dark:border-border-dark">User</th>
                                    <th className="px-6 py-3 border-b border-slate-200 dark:border-border-dark">Action</th>
                                    <th className="px-6 py-3 border-b border-slate-200 dark:border-border-dark">Details</th>
                                    <th className="px-6 py-3 border-b border-slate-200 dark:border-border-dark w-24">IP Addr</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {log.user.charAt(0)}
                                                </div>
                                                {log.user}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-xs">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded font-bold uppercase text-[9px]",
                                                log.level === 'Warning' ? "bg-amber-100 text-amber-700" :
                                                    log.action.includes("Error") ? "bg-red-100 text-red-700" :
                                                        "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                        <td className="px-6 py-3 text-xs text-slate-400 font-mono">
                                            {log.ip_address}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-card-dark/20 text-xs text-slate-500 flex justify-between">
                    <span>Showing {filteredLogs.length} events</span>
                    <button className="font-bold text-primary hover:underline">Export CSV</button>
                </div>
            </div>
        </div>
    );
}
