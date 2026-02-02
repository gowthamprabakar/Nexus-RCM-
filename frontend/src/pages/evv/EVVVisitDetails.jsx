import React from 'react';

export function EVVVisitDetails() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#101922] font-sans h-full">
            <main className="max-w-[1440px] mx-auto px-6 py-6 font-sans">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-4">
                    <a className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors" href="#">Visits</a>
                    <span className="text-slate-400 text-sm">/</span>
                    <span className="text-slate-900 dark:text-white text-sm font-medium">Visit Detail #EVV-2023-08-15-001</span>
                </div>
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Visit Detail & Audit</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Visit ID: <span className="font-mono font-bold">EVV-2023-08-15-001</span></p>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            <p className="text-amber-600 dark:text-amber-500 text-sm font-semibold">Status: Pending Review</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2530] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-[#253241] transition-colors text-slate-700 dark:text-white">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Export PDF
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1a2530] border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-[#253241] transition-colors text-slate-700 dark:text-white">
                            <span className="material-symbols-outlined text-[20px]">history</span>
                            Audit Log
                        </button>
                    </div>
                </div>
                {/* Layout Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Panel: Visit Profile */}
                    <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
                        {/* Profile Card */}
                        <div className="bg-white dark:bg-[#1a2530] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Service Information</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                                    <span className="material-symbols-outlined text-primary">medical_services</span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Personal Care (H2014)</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Duration: 4.0 Hours Scheduled</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">CLIENT</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">SJ</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Sarah Johnson</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Member ID: #7721-00</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">PROVIDER</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">MC</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Michael Chen, CNA</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">License: TX-49221-C</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Time Comparison Card */}
                        <div className="bg-white dark:bg-[#1a2530] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Time Tracking</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">08:00 AM - 12:00 PM</p>
                                    </div>
                                    <span className="text-xs font-medium text-slate-400">4.0 hrs</span>
                                </div>
                                <div className="flex justify-between items-end p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Actual (EVV)</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">08:05 AM - 12:12 PM</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-red-500 block">+17m Delta</span>
                                        <span className="text-xs font-medium text-slate-900 dark:text-white">4.12 hrs</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg text-xs font-medium">
                                    <span className="material-symbols-outlined text-[16px]">warning</span>
                                    Delta exceeds 15m threshold
                                </div>
                            </div>
                        </div>
                    </aside>
                    {/* Center Panel: Geofencing & Validation */}
                    <div className="col-span-12 xl:col-span-6 flex flex-col gap-6">
                        {/* Map Container */}
                        <div className="bg-white dark:bg-[#1a2530] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1a2530]">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">map</span>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Geofencing & Validation</h3>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded-full">IN-BOUNDS</span>
                                </div>
                            </div>
                            <div className="relative h-[360px] bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                                {/* Abstract Map Background */}
                                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#137fec 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                                <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-primary border-dashed rounded-full bg-primary/5 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-primary uppercase bg-white dark:bg-[#1a2530] px-1 rounded shadow-sm">Geofence Radius</span>
                                </div>
                                {/* Marker Home */}
                                <div className="absolute top-[45%] left-[48%] flex flex-col items-center">
                                    <span className="material-symbols-outlined text-primary text-3xl drop-shadow-md">home</span>
                                </div>
                                {/* Marker Pings */}
                                <div className="absolute top-[52%] left-[55%] flex flex-col items-center">
                                    <span className="material-symbols-outlined text-green-600 text-2xl drop-shadow-md">location_on</span>
                                    <span className="text-[10px] bg-white dark:bg-[#1a2530] dark:text-white px-1 font-bold rounded shadow-sm">Check-in</span>
                                </div>
                                <div className="absolute top-[40%] left-[42%] flex flex-col items-center">
                                    <span className="material-symbols-outlined text-green-600 text-2xl drop-shadow-md">location_on</span>
                                    <span className="text-[10px] bg-white dark:bg-[#1a2530] dark:text-white px-1 font-bold rounded shadow-sm">Check-out</span>
                                </div>
                            </div>
                            <div className="p-4 flex gap-6 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-primary"></span>
                                    Client Residence
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                                    Provider Pings
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full border-2 border-dashed border-primary"></span>
                                    300ft Compliance Radius
                                </div>
                            </div>
                        </div>

                        {/* Proof of Service */}
                        <div className="bg-white dark:bg-[#1a2530] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Proof of Service</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">edit_note</span> Client Signature
                                    </p>
                                    <div className="h-24 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center overflow-hidden border border-dashed border-slate-200 dark:border-slate-700">
                                        <span className="text-slate-400 dark:text-slate-500 text-xs italic opacity-50 select-none">[Digital Signature Placeholder]</span>
                                    </div>
                                    <p className="text-[10px] text-right mt-1 text-slate-400 italic font-mono">Timestamped: 12:15:02 PM CST</p>
                                </div>
                                <div className="border border-slate-100 dark:border-slate-700 rounded-lg p-4">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[16px]">mic</span> Voice Verification
                                    </p>
                                    <div className="h-24 bg-slate-50 dark:bg-slate-800 rounded-md p-3 flex flex-col justify-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <button className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                                                <span className="material-symbols-outlined text-[18px] fill-1">play_arrow</span>
                                            </button>
                                            <div className="flex-1 h-8 flex items-center gap-0.5 opacity-70">
                                                <div className="h-2 w-1 bg-primary rounded-full"></div>
                                                <div className="h-4 w-1 bg-primary/60 rounded-full"></div>
                                                <div className="h-6 w-1 bg-primary rounded-full"></div>
                                                <div className="h-3 w-1 bg-primary/40 rounded-full"></div>
                                                <div className="h-5 w-1 bg-primary rounded-full"></div>
                                                <div className="h-2 w-1 bg-primary rounded-full"></div>
                                                <div className="h-4 w-1 bg-primary/60 rounded-full"></div>
                                                <div className="h-6 w-1 bg-primary rounded-full"></div>
                                                <div className="h-3 w-1 bg-primary/40 rounded-full"></div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">Audio Match: 98.4% Confidence</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Right Panel: Audit Checklist */}
                    <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
                        <div className="bg-white dark:bg-[#1a2530] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <span className="material-symbols-outlined text-primary">fact_check</span>
                                    Cures Act Audit Checklist
                                </h3>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-3">
                                {/* Checklist Items */}
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                                    <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Type of Service</p>
                                        <p className="text-[10px] text-green-700/70 dark:text-green-500/70">Verified: H2014 Personal Care</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                                    <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Individual Served</p>
                                        <p className="text-[10px] text-green-700/70 dark:text-green-500/70">ID Match: Sarah Johnson (#7721)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                                    <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Date of Service</p>
                                        <p className="text-[10px] text-green-700/70 dark:text-green-500/70">Aug 15, 2023</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                                    <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Location of Service</p>
                                        <p className="text-[10px] text-green-700/70 dark:text-green-500/70">GPS In-Bounds (Within 300ft)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/20">
                                    <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                                    <div>
                                        <p className="text-xs font-bold text-green-800 dark:text-green-400">Individual Providing</p>
                                        <p className="text-[10px] text-green-700/70 dark:text-green-500/70">Auth: Michael Chen (Device: iPhone 14)</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20">
                                    <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Time In / Out</p>
                                        <p className="text-[10px] text-amber-700/70 dark:text-amber-500/70">Delta +17m. Requires manual override.</p>
                                        <button className="mt-2 text-[10px] font-bold text-amber-800 dark:text-amber-400 underline uppercase hover:text-amber-600 dark:hover:text-amber-300">Fix Warning</button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Compliance Score</p>
                                        <p className="text-sm font-black text-amber-600 dark:text-amber-500">85%</p>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }}></div>
                                    </div>
                                    {/* Action Button: Disabled until override */}
                                    <button className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold rounded-lg text-sm flex items-center justify-center gap-2 cursor-not-allowed group relative" disabled>
                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                        Submit for Billing
                                    </button>
                                    <p className="text-[10px] text-center text-slate-500 dark:text-slate-400">All 6 21st Century Cures Act elements must be validated.</p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
            {/* Side Footer / Console Label */}
            <div className="fixed bottom-6 right-6 z-10">
                <div className="bg-[#111418] dark:bg-white text-white dark:text-[#111418] px-4 py-2 rounded-full shadow-xl flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <p className="text-xs font-bold uppercase tracking-widest">AI Audit Active</p>
                </div>
            </div>
        </div>
    );
}
