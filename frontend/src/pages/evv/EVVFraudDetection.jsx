import React from 'react';

export function EVVFraudDetection() {
    return (
        <div className="bg-slate-50 dark:bg-[#101922] font-sans h-full flex flex-col text-slate-800 dark:text-slate-200">
            {/* Header / Navigation - Simplified version as we have Sidebar */}
            <header className="border-b border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-50">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-red-600 p-1.5 rounded-lg">
                            <span className="material-symbols-outlined text-white text-2xl">security</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">EVV Fraud & Anomaly Detection</h1>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                                AI Engine: Active • Live Surveillance
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Sidebar (Navigation Icons) - Mocking functionality as per design */}
                <nav className="hidden lg:flex w-16 flex-col items-center py-6 border-r border-slate-200 dark:border-white/10 bg-white/30 dark:bg-black/10">
                    <div className="space-y-8 flex flex-col">
                        <button className="p-2 text-red-600 rounded-xl bg-red-600/10 border border-red-600/20">
                            <span className="material-symbols-outlined">grid_view</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">map</span>
                        </button>
                    </div>
                </nav>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Risk Heatmap (Top Section) */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 relative bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden min-h-[300px] h-[350px]">
                            {/* Heatmap Background Gradient Mock */}
                            <div className="absolute inset-0 bg-slate-100 dark:bg-black/50">
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(242, 13, 13, 0.4) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(242, 13, 13, 0.2) 0%, transparent 40%)'
                                }}></div>
                            </div>

                            <div className="relative p-5 h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4 z-10">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">National Risk Heatmap</h3>
                                    <div className="flex space-x-2 text-[10px] items-center">
                                        <span className="bg-red-600/20 text-red-600 px-2 py-0.5 rounded border border-red-600/30">CRITICAL HOTSPOTS</span>
                                        <span className="bg-slate-100 dark:bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/10 uppercase">Regional Clusters</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/USA_location_map.svg/1024px-USA_location_map.svg.png')] bg-contain bg-center bg-no-repeat opacity-20 dark:opacity-40 mix-blend-multiply dark:mix-blend-overlay filter grayscale"></div>

                                    {/* Mock Data Points */}
                                    <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-red-600 rounded-full blur-xl animate-pulse"></div>
                                    <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-red-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                                    <div className="absolute bottom-1/3 left-1/4 w-6 h-6 bg-yellow-500 rounded-full blur-xl opacity-60"></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 p-5 flex flex-col">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Risk Distribution</h3>
                            <div className="flex-1 flex flex-col justify-center space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-red-600">CRITICAL FRAUD</span>
                                        <span className="text-slate-400">18%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-600 w-[18%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-yellow-500">ANOMALOUS ACTIVITY</span>
                                        <span className="text-slate-400">42%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-yellow-500 w-[42%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-medium text-blue-500">VERIFIED CLEAN</span>
                                        <span className="text-slate-400">40%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[40%]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 text-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white italic">0.92</span>
                                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">System Reliability Score</p>
                            </div>
                        </div>
                    </section>

                    {/* Bottom Section: Table & Patterns */}
                    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Anomaly Detection Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
                            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <span className="material-symbols-outlined text-red-600">warning</span>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Active Anomalies Detected</h3>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="text-xs px-3 py-1 bg-slate-100 dark:bg-white/5 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-600 dark:text-slate-300">EXPORT CSV</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-separate border-spacing-0">
                                    <thead>
                                        <tr className="text-[10px] uppercase text-slate-500 tracking-wider">
                                            <th className="px-5 py-3 border-b border-slate-100 dark:border-white/5 font-bold">Risk Score</th>
                                            <th className="px-5 py-3 border-b border-slate-100 dark:border-white/5 font-bold">Provider / Client</th>
                                            <th className="px-5 py-3 border-b border-slate-100 dark:border-white/5 font-bold">Detection Tag</th>
                                            <th className="px-5 py-3 border-b border-slate-100 dark:border-white/5 font-bold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {/* Row 1 */}
                                        <tr className="hover:bg-red-50 dark:hover:bg-red-600/5 cursor-pointer transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center text-xs font-bold text-red-600">98</div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">Marcus Sterling</div>
                                                <div className="text-xs text-slate-500 italic">to Martha W.</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 border border-red-600/20">
                                                    <span className="material-symbols-outlined text-[10px] mr-1">flight_takeoff</span> Impossible Travel
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">PENDING AUDIT</span>
                                            </td>
                                        </tr>
                                        {/* Row 2 */}
                                        <tr className="hover:bg-red-50 dark:hover:bg-red-600/5 cursor-pointer transition-colors border-l-4 border-red-600 bg-red-50 dark:bg-red-600/5">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-10 h-10 rounded-full border-2 border-red-600 flex items-center justify-center text-xs font-bold text-red-600">94</div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">Elena Rodriguez</div>
                                                <div className="text-xs text-slate-500 italic">to Multiple Clients</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-500/20 text-orange-500 border border-orange-500/20">
                                                    <span className="material-symbols-outlined text-[10px] mr-1">visibility_off</span> Ghost Billing
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">UNDER INVESTIGATION</span>
                                            </td>
                                        </tr>
                                        {/* Row 3 */}
                                        <tr className="hover:bg-red-50 dark:hover:bg-red-600/5 cursor-pointer transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center text-xs font-bold text-yellow-500">72</div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white">James K. Hall</div>
                                                <div className="text-xs text-slate-500 italic">to Frank Miller</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-400 border border-slate-200 dark:border-white/5">
                                                    <span className="material-symbols-outlined text-[10px] mr-1">draw</span> Signature Forgery
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">FLAGGED</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Pattern Analysis Node Chart */}
                        <div className="bg-white dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/10 flex flex-col">
                            <div className="p-5 border-b border-slate-200 dark:border-white/10">
                                <h3 className="font-bold text-slate-900 dark:text-white">Provider-Client Collusion</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Network Interaction Diagram</p>
                            </div>
                            <div className="flex-1 relative flex items-center justify-center p-4">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                                    backgroundSize: '20px 20px',
                                    opacity: 0.2
                                }}></div>
                                {/* Simple SVG Visualization */}
                                <svg className="w-full h-full" viewBox="0 0 300 300">
                                    <line opacity="0.6" stroke="#f20d0d" strokeWidth="2" x1="150" x2="80" y1="150" y2="80"></line>
                                    <line opacity="0.4" stroke="#f20d0d" strokeWidth="2" x1="150" x2="220" y1="150" y2="80"></line>
                                    <line stroke="#999" strokeWidth="1" x1="150" x2="150" y1="150" y2="230"></line>
                                    <line stroke="#f20d0d" strokeDasharray="4" strokeWidth="1" x1="80" x2="40" y1="80" y2="100"></line>
                                    <circle cx="150" cy="150" fill="#f20d0d" r="14"></circle>
                                    <circle cx="80" cy="80" fill="#666" r="10"></circle>
                                    <circle cx="220" cy="80" fill="#666" r="10"></circle>
                                    <circle cx="150" cy="230" fill="#666" r="10"></circle>
                                    <text fill="#666" fontSize="10" textAnchor="middle" x="150" y="180">SUSPECT</text>
                                </svg>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Panel: AI Investigator Lab */}
                <aside className="w-96 border-l border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-md overflow-y-auto hidden xl:block">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Investigator Lab</h2>
                            <span className="px-2 py-1 bg-red-600 text-[10px] text-white font-black rounded uppercase">Live Case</span>
                        </div>
                        {/* Case Header */}
                        <div className="mb-8">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-slate-200 dark:bg-white/10 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-500">fingerprint</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Elena Rodriguez</h4>
                                    <p className="text-xs text-slate-500 tracking-wider font-medium">PROVIDER ID: 884-29-X</p>
                                </div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-red-600 uppercase">Fraud Confidence</span>
                                    <span className="text-lg font-black text-red-600">94.2%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-600 w-[94.2%]"></div>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                                    AI detected overlapping GPS pings for Client 449 and Client 112 simultaneously at 14:02 EST. Physical distance between sites is 18 miles.
                                </p>
                            </div>
                        </div>
                        {/* Actions */}
                        <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-white/10">
                            <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-2">
                                <span className="material-symbols-outlined text-sm">block</span>
                                <span>SUSPEND BILLING</span>
                            </button>
                            <button className="w-full py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold rounded-lg border border-slate-200 dark:border-white/10 transition-colors flex items-center justify-center space-x-2">
                                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                                <span>FLAG FOR AUDIT</span>
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
            {/* Footer Stats */}
            <footer className="h-10 bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-white/10 px-6 flex items-center justify-between">
                <div className="flex space-x-8">
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 uppercase">System Latency:</span>
                        <span className="text-[10px] text-green-500 font-bold">14ms</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-500 uppercase">Models Loaded:</span>
                        <span className="text-[10px] text-slate-900 dark:text-white font-bold">BERT-4, Custom-GPS v2.1</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    SECURE ACCESS SESSION • 128-BIT ENCRYPTION ACTIVE
                </div>
            </footer>
        </div>
    );
}
