import React, { useState } from 'react';

export function IntegrationDebugger() {
    const [selectedPacket, setSelectedPacket] = useState('TRX-99821-BC');

    return (
        <div className="flex h-full font-sans bg-[#f6f6f8] dark:bg-[#0f1115] text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Stats */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-[#11161d] border-b border-slate-200 dark:border-[#2d333b]">
                    {[
                        { label: 'P99 Latency', value: '142ms', change: '+12%', color: 'text-orange-500', icon: 'warning' },
                        { label: 'Throughput', value: '8.2k', sub: 'req/s', change: '+5.2%', color: 'text-green-500', icon: 'trending_up' },
                        { label: 'Error Rate', value: '0.04%', change: 'STABLE', color: 'text-blue-500', icon: 'info' },
                        { label: 'Active Connectors', value: '612', sub: '/ 642' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#161b22] p-4 rounded-xl border border-slate-200 dark:border-[#2d333b]">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                                {stat.icon && <span className={`material-symbols-outlined ${stat.color} text-sm`}>{stat.icon}</span>}
                            </div>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-bold dark:text-white">{stat.value} {stat.sub && <span className="text-xs text-slate-400 font-normal">{stat.sub}</span>}</p>
                                {stat.change && <p className={`text-xs font-medium mb-1 ${stat.color === 'text-orange-500' ? 'text-red-500' : 'text-green-500'}`}>{stat.change}</p>}
                            </div>
                            {/* Simple visual bar */}
                            <div className="mt-3 h-1 w-full bg-slate-200 dark:bg-[#2d333b] rounded-full overflow-hidden">
                                <div className={`h-full ${i === 0 ? 'bg-orange-500 w-[60%]' : i === 1 ? 'bg-green-500 w-[80%]' : 'bg-blue-500 w-[10%]'}`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="p-3 flex flex-wrap items-center gap-3 border-b border-slate-200 dark:border-[#2d333b] bg-white dark:bg-[#0f1115]">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input className="w-full bg-slate-100 dark:bg-[#161b22] border-slate-200 dark:border-[#2d333b] rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary text-white" placeholder="Search by Trace ID..." type="text" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">
                            <span className="material-symbols-outlined text-sm">pause</span> Pause Stream
                        </button>
                    </div>
                </div>

                {/* Log Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-[#161b22] z-10 border-b border-slate-200 dark:border-[#2d333b] shadow-sm">
                            <tr>
                                {['Timestamp', 'Connector', 'Event Type', 'Status', 'Latency', 'Trace ID'].map(h => (
                                    <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#2d333b] font-mono text-[12px]">
                            {/* Log Row 1 */}
                            <tr className="log-row cursor-pointer transition-colors bg-red-50/20 dark:bg-red-900/5 hover:bg-red-900/10" onClick={() => setSelectedPacket('TRX-99821-BC')}>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">2023-11-20 14:30:01.452</td>
                                <td className="px-4 py-3 font-semibold dark:text-white">Cerner-FHIR-Outbound</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-[#2d333b] text-slate-400 border border-slate-700">Outbound</span></td>
                                <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-red-500 font-bold"><span className="material-symbols-outlined text-[16px]">error</span> ERROR</span></td>
                                <td className="px-4 py-3 text-red-400 font-bold">1,420ms</td>
                                <td className="px-4 py-3 text-primary font-bold">TRX-99821-BC</td>
                            </tr>
                            {/* Log Row 2 */}
                            <tr className="log-row cursor-pointer transition-colors hover:bg-slate-800/30">
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">2023-11-20 14:29:58.210</td>
                                <td className="px-4 py-3 font-semibold dark:text-white">Epic-HL7-Inbound</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-[#2d333b] text-slate-400 border border-slate-700">Inbound</span></td>
                                <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-green-500 font-bold"><span className="material-symbols-outlined text-[16px]">check_circle</span> SUCCESS</span></td>
                                <td className="px-4 py-3 text-slate-400">42ms</td>
                                <td className="px-4 py-3 text-primary font-bold">TRX-99820-A1</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Packet Detail View (Context Drawer) */}
            <aside className={`w-[600px] bg-white dark:bg-[#161b22] border-l border-slate-200 dark:border-[#2d333b] flex flex-col shadow-2xl z-40 transition-transform duration-300 ${selectedPacket ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="p-4 bg-slate-50 dark:bg-[#0f1115] border-b border-slate-200 dark:border-[#2d333b] flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded uppercase">Failed</span>
                            <h3 className="font-bold text-sm text-white">TRX-99821-BC</h3>
                        </div>
                        <p className="text-xs text-slate-500">Cerner-FHIR-Outbound • Nov 20, 14:30:01.452</p>
                    </div>
                    <button onClick={() => setSelectedPacket(null)} className="flex items-center justify-center size-8 rounded hover:bg-[#2d333b] transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>
                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200 dark:border-[#2d333b] px-4 bg-slate-50/50 dark:bg-[#0f1115]/50">
                    <button className="px-4 py-3 text-xs font-bold border-b-2 border-primary text-primary">Packet Inspection</button>
                    <button className="px-4 py-3 text-xs font-medium text-slate-500 hover:text-slate-300">HTTP Headers</button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Raw Inbound */}
                    <div className="flex-1 border-b border-slate-200 dark:border-[#2d333b] flex flex-col">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-[#0f1115] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inbound Raw (HL7)</span>
                            <button className="text-[10px] text-primary font-bold hover:underline">Copy</button>
                        </div>
                        <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed overflow-auto custom-scrollbar bg-slate-900 text-slate-300">
                            <pre>MSH|^~\&|EPIC|HOSPITAL|CERNER|LAB|20231120143001||ORM^O01|12345678|P|2.3
                                PID|||123456789^^^MRN||DOE^JOHN^||19800101|M|||123 MAIN ST^^ANYTOWN^NY^12345
                                PV1||I|NURSING UNIT^101^1||||12345^SMITH^JANE^MD||||||||||||1234567
                                ORC|NW|A12345|||||1^once^^^^20231120143001</pre>
                        </div>
                    </div>
                    {/* Transformed Outbound */}
                    <div className="flex-1 flex flex-col">
                        <div className="px-4 py-2 bg-slate-50 dark:bg-[#0f1115] flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transformed Outbound (JSON)</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-red-500 font-bold">Validation Failed: 'resourceType' missing</span>
                            </div>
                        </div>
                        <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed overflow-auto custom-scrollbar bg-slate-900 text-slate-300">
                            <pre>{`{
  "id": "123456789",
  "patient": {
    "name": "John Doe",
    "birthDate": "1980-01-01"
  }
}`}</pre>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
