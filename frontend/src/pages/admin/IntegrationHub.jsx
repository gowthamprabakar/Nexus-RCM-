import React from 'react';

export function IntegrationHub() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="flexh-full">
                {/* Side Navigation Sidebar (Merged into layout or standalone if needed, keeping simple here) */}
                {/* Since we have the main Sidebar, we'll implement the main content area here */}

                <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-background-dark overflow-y-auto">
                    {/* Header Section */}
                    <header className="p-8 pb-4 flex flex-col gap-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="max-w-2xl">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Integration Hub</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage 600+ real-time healthcare system connections across EHR, Payer, and Financial layers.</p>
                            </div>
                            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">add_link</span>
                                New Connection
                            </button>
                        </div>
                        {/* Stats & Live Health Map Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Map Panel */}
                            <div className="lg:col-span-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl overflow-hidden relative group h-[240px]">
                                <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-xs font-bold text-white uppercase tracking-wider">Live Traffic Map</span>
                                    </div>
                                </div>
                                {/* Placeholder for Map */}
                                <div className="h-full w-full bg-slate-100 dark:bg-slate-950 bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest">[Live Connection Map Visualization]</span>
                                </div>
                                <div className="absolute bottom-4 right-4 text-right">
                                    <p className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">GLOBAL_EDGE_NODES: ACTIVE</p>
                                </div>
                            </div>
                            {/* Stats Panel */}
                            <div className="flex flex-col gap-4">
                                <div className="flex-1 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 flex flex-col justify-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Active</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">584/612</h3>
                                        <span className="text-emerald-500 text-xs font-bold">+2.4%</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 flex flex-col justify-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">System Throughput</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">1.2M <span className="text-lg font-normal opacity-60">rec/hr</span></h3>
                                        <span className="text-emerald-500 text-xs font-bold">+12.1%</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 flex flex-col justify-center">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg. Latency</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white">42ms</h3>
                                        <span className="text-orange-500 text-xs font-bold">-5.2%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    {/* Search and Filters Sticky Bar */}
                    <div className="sticky top-0 z-20 px-8 py-4 bg-slate-50/80 dark:bg-background-dark/80 backdrop-blur-md border-y border-slate-200 dark:border-border-dark flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative group">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                                <input className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-border-dark rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all" placeholder="Search 600+ connectors (e.g. Epic, Cerner, Stripe)..." type="text" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                            <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full whitespace-nowrap shadow-md shadow-primary/20">All Connectors</button>
                            <button className="px-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full hover:border-primary transition-all whitespace-nowrap">EHR Systems</button>
                            <button className="px-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full hover:border-primary transition-all whitespace-nowrap">Payer Portals</button>
                            <button className="px-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full hover:border-primary transition-all whitespace-nowrap">Financial</button>
                            <button className="px-4 py-2 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark text-slate-600 dark:text-slate-400 text-xs font-bold rounded-full hover:border-primary transition-all whitespace-nowrap">Clearinghouse</button>
                        </div>
                    </div>
                    {/* Connector Marketplace Grid */}
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {/* Connector Card: Epic */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:border-primary/50 transition-all group flex flex-col gap-4 shadow-sm hover:shadow-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">EP</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Epic App Orchard</h4>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">EHR Integration</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Active</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Latency</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">12ms</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</p>
                                    <p className="text-sm font-mono font-bold text-emerald-500">99.98%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-xs font-bold transition-all">Config</button>
                                <button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
                            </div>
                        </div>

                        {/* Connector Card: Cerner */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:border-primary/50 transition-all group flex flex-col gap-4 shadow-sm hover:shadow-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">CE</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Cerner Ignite</h4>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">EHR Integration</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full border border-primary/20">
                                    <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Syncing</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Latency</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">84ms</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</p>
                                    <p className="text-sm font-mono font-bold text-emerald-500">98.2%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-xs font-bold transition-all">Config</button>
                                <button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
                            </div>
                        </div>

                        {/* Connector Card: Stripe */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:border-primary/50 transition-all group flex flex-col gap-4 shadow-sm hover:shadow-xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">ST</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Stripe Billing</h4>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Financial Gateway</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Active</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Latency</p>
                                    <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">32ms</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</p>
                                    <p className="text-sm font-mono font-bold text-emerald-500">100%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-xs font-bold transition-all">Config</button>
                                <button className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
                            </div>
                        </div>

                        {/* Connector Card: Change Healthcare */}
                        <div className="bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-xl p-5 hover:border-red-500/50 transition-all group flex flex-col gap-4 shadow-sm hover:shadow-xl border-l-4 border-l-red-500">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">CH</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">Change Health</h4>
                                        <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Clearinghouse</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                    <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Error</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 dark:border-slate-800/50">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Latency</p>
                                    <p className="text-sm font-mono font-bold text-red-400">TIMEOUT</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Success Rate</p>
                                    <p className="text-sm font-mono font-bold text-red-500">42.1%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto">
                                <button className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-red-500/20 hover:bg-red-600">Fix Connection</button>
                                <button className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-xs font-bold transition-all">Logs</button>
                            </div>
                        </div>
                    </div>
                    {/* Smart Suggestion AI Banner */}
                    <div className="mx-8 mb-12 p-6 bg-primary/10 border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-primary/10 pointer-events-none">
                            <span className="material-symbols-outlined text-[160px]">auto_awesome</span>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/30">
                                <span className="material-symbols-outlined">auto_awesome</span>
                            </div>
                            <div>
                                <h5 className="font-bold text-slate-900 dark:text-white">AI Optimization Suggestion</h5>
                                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mt-1">Our AI detected a potential performance bottleneck in the Cerner FHIR API. Switching to the Batch-Fetch protocol could reduce latency by 45%.</p>
                            </div>
                        </div>
                        <button className="relative z-10 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all">Apply Optimization</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
