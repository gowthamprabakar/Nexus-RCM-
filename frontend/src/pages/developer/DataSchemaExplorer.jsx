import React from 'react';

export function DataSchemaExplorer() {
    return (
        <div className="bg-slate-50 dark:bg-[#101622] text-slate-900 dark:text-white font-sans h-screen flex flex-col overflow-hidden">
            {/* Top Navigation Bar: Implemented by Shell, keeping controls here simplified */}

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Global Schema Tree */}
                <aside className="hidden lg:flex w-72 bg-white dark:bg-[#101622] border-r border-slate-200 dark:border-slate-800 flex-col shrink-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold flex items-center gap-2">
                            Global Schema Tree
                        </h1>
                        <p className="text-slate-500 text-xs font-normal mt-1">642 Connected Data Sources</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary group cursor-pointer">
                                <span className="material-symbols-outlined text-lg">description</span>
                                <p className="text-sm font-semibold">Claims</p>
                                <span className="material-symbols-outlined ml-auto text-sm">expand_more</span>
                            </div>
                            <div className="ml-4 border-l-2 border-primary/20 pl-2 flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-primary bg-primary/5 text-xs font-medium cursor-pointer">
                                    <span className="material-symbols-outlined text-base">table_chart</span>
                                    Professional Claims
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer">
                                    <span className="material-symbols-outlined text-base">table_chart</span>
                                    Institutional Claims
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer">
                                    <span className="material-symbols-outlined text-base">table_chart</span>
                                    Claim Line Items
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">group</span>
                                <p className="text-sm font-medium">Patients</p>
                                <span className="material-symbols-outlined ml-auto text-sm text-slate-400">chevron_right</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">medical_services</span>
                                <p className="text-sm font-medium">Providers</p>
                                <span className="material-symbols-outlined ml-auto text-sm text-slate-400">chevron_right</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">payments</span>
                                <p className="text-sm font-medium">Payments</p>
                                <span className="material-symbols-outlined ml-auto text-sm text-slate-400">chevron_right</span>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 group cursor-pointer transition-colors">
                                <span className="material-symbols-outlined text-lg">inventory_2</span>
                                <p className="text-sm font-medium">Common Entities</p>
                                <span className="material-symbols-outlined ml-auto text-sm text-slate-400">chevron_right</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Workspace */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#101622] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                    {/* Breadcrumbs & Heading */}
                    <div className="px-8 pt-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <a className="text-slate-500 text-xs font-medium hover:text-primary flex items-center" href="#">
                                Unified Model
                                <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
                            </a>
                            <a className="text-slate-500 text-xs font-medium hover:text-primary flex items-center" href="#">
                                Claims
                                <span className="material-symbols-outlined text-sm ml-1">chevron_right</span>
                            </a>
                            <span className="text-slate-900 dark:text-white text-xs font-bold">Professional Claims</span>
                        </div>
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                            <div className="flex flex-col gap-1">
                                <h2 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight flex items-center gap-2">
                                    Professional Claims Schema
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Standard V4.2</span>
                                </h2>
                                <p className="text-slate-500 text-sm font-normal max-w-2xl">Manage mapping definitions from Epic, Cerner, and HL7 sources to unified internal RCM record standards.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <span className="material-symbols-outlined text-lg mr-2">download</span>
                                    Export Schema
                                </button>
                                <button className="flex items-center justify-center rounded-lg h-9 px-4 bg-primary text-white text-sm font-bold hover:bg-blue-600 shadow-sm transition-colors">
                                    <span className="material-symbols-outlined text-lg mr-2">save</span>
                                    Save Mapping
                                </button>
                            </div>
                        </div>
                        {/* Tabs */}
                        <div className="border-b border-slate-200 dark:border-slate-800 flex gap-8 mb-6">
                            <button className="flex flex-col items-center justify-center border-b-2 border-primary text-primary pb-3 pt-2">
                                <p className="text-sm font-bold tracking-tight">Source Mapping</p>
                            </button>
                            <button className="flex flex-col items-center justify-center border-b-2 border-transparent text-slate-500 pb-3 pt-2 hover:text-primary transition-colors">
                                <p className="text-sm font-bold tracking-tight">Field Metadata</p>
                            </button>
                            <button className="flex flex-col items-center justify-center border-b-2 border-transparent text-slate-500 pb-3 pt-2 hover:text-primary transition-colors">
                                <p className="text-sm font-bold tracking-tight">Validation Rules</p>
                            </button>
                        </div>
                    </div>

                    {/* Mapping Grid */}
                    <div className="px-8 pb-10">
                        <div className="grid grid-cols-1 gap-4">
                            {/* Mapping Card 1 */}
                            <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">key</span>
                                        <span className="text-xs font-bold font-mono text-primary">CLAIM_ID</span>
                                        <span className="text-[10px] text-slate-400 px-1.5 py-0.5 border border-slate-300 dark:border-slate-600 rounded">Primary Key</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                                        <span className="material-symbols-outlined text-slate-400 text-lg">more_vert</span>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    {/* Source Field */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Source Fields</span>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">Epic</span>
                                                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">patient_claim_no</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1 rounded font-bold">Cerner</span>
                                                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">CLAIM_NUM_EXT</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Transform Logic */}
                                    <div className="flex flex-col items-center justify-center px-4 text-center">
                                        <span className="material-symbols-outlined text-slate-300 text-3xl">trending_flat</span>
                                        <div className="mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Trim & Uppercase</div>
                                    </div>
                                    {/* Unified Field Details */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Field Metadata</span>
                                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Validated
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="block text-[9px] text-slate-500 uppercase">Type</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">VARCHAR(64)</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="block text-[9px] text-slate-500 uppercase">Privacy</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Non-Sensitive</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mapping Card 2 (Sensitive PHI) */}
                            <div className="bg-white dark:bg-[#101622] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-slate-500 text-lg">subject</span>
                                        <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">PATIENT_SSN</span>
                                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-yellow-600">warning</span>
                                            HIPAA PHI
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400 text-lg">info</span>
                                        <span className="material-symbols-outlined text-slate-400 text-lg">more_vert</span>
                                    </div>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    {/* Source Field */}
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Source Fields</span>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                                <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded font-bold">Epic</span>
                                                <span className="text-xs font-mono text-slate-700 dark:text-slate-300">ssn_no_formatted</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Transform Logic */}
                                    <div className="flex flex-col items-center justify-center px-4 text-center">
                                        <span className="material-symbols-outlined text-slate-300 text-3xl">trending_flat</span>
                                        <div className="mt-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">Regex Strip & Mask</div>
                                    </div>
                                    {/* Unified Field Details */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Field Metadata</span>
                                            <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">verified_user</span>
                                                Encrypted
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="block text-[9px] text-slate-500 uppercase">Type</span>
                                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">INT(9)</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-800">
                                                <span className="block text-[9px] text-slate-500 uppercase">Privacy</span>
                                                <span className="text-xs font-bold text-yellow-600">Restricted PII</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Right Sidebar: Lineage Panel */}
                <aside className="hidden xl:flex w-80 bg-white dark:bg-[#101622] border-l border-slate-200 dark:border-slate-800 flex-col shrink-0">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <h1 className="text-slate-900 dark:text-white text-base font-bold">Cross-System Lineage</h1>
                        <button className="text-primary hover:text-blue-700 transition-colors">
                            <span className="material-symbols-outlined text-lg">fullscreen</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        <div className="flex flex-col items-center">
                            {/* Lineage Flow */}
                            <div className="w-full flex flex-col items-center gap-4">
                                {/* Node 1 */}
                                <div className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-green-700 text-lg">database</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Source System</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Epic Chronicles</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">arrow_downward</span>
                                {/* Node 2 */}
                                <div className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary text-lg">settings_suggest</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">ETL / Normalization</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Airflow: RCM_Ingest_V4</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">arrow_downward</span>
                                {/* Node 3 */}
                                <div className="w-full bg-primary/5 dark:bg-primary/10 p-3 rounded-lg border-2 border-primary">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-lg">hub</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary uppercase">Current Entity</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Unified Professional Claim</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300">arrow_downward</span>
                                {/* Node 4 */}
                                <div className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-purple-700 text-lg">analytics</span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Downstream Consumer</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Revenue Forecaster AI</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lineage Details */}
                            <div className="w-full mt-10 space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Health Metrics</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Data Freshness</span>
                                        <span className="font-bold text-green-600">4m ago</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full" style={{ width: '95%' }}></div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Mapping Coverage</span>
                                        <span className="font-bold text-primary">88%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full" style={{ width: '88%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
