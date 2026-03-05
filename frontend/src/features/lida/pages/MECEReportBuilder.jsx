import React, { useState } from 'react';

export function MECEReportBuilder() {
    const [activeSection, setActiveSection] = useState('Executive Summary');

    return (
        <div className="flex h-full bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden">
            {/* Left Sidebar: Report Structure */}
            <aside className="w-64 border-r border-[#21262d] flex flex-col bg-[#0d1117]">
                <div className="p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#238636]">dashboard</span>
                    <h2 className="font-bold text-white text-sm">MECE Builder</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                    <h3 className="px-3 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2 mt-2">Report Structure</h3>
                    <div className="space-y-0.5">
                        <div className="px-3 py-2 text-sm text-[#58a6ff] bg-[#1f6feb]/10 rounded-md border-l-2 border-[#1f6feb] flex items-center gap-2 font-medium">
                            <span className="material-symbols-outlined text-sm">folder_open</span> Executive Summary
                        </div>
                        <div className="ml-4 pl-3 border-l border-[#30363d] space-y-1 my-1">
                            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#8b949e] hover:text-white cursor-pointer rounded hover:bg-[#21262d]">
                                <span className="material-symbols-outlined text-xs">bar_chart</span> Q3 Performance Overview
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#8b949e] hover:text-white cursor-pointer rounded hover:bg-[#21262d]">
                                <span className="material-symbols-outlined text-xs">pie_chart</span> Revenue Mix by Entity
                            </div>
                        </div>
                        <div className="px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white rounded-md cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">folder</span> Payer Analysis
                        </div>
                        <div className="px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white rounded-md cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">folder</span> Denial Management
                        </div>
                        <div className="px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-white rounded-md cursor-pointer flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">folder</span> Forecast Models
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#21262d]">
                    <button className="w-full py-2 border border-dashed border-[#30363d] rounded-lg text-xs text-[#8b949e] hover:text-white hover:border-[#8b949e] flex items-center justify-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span> Add Section
                    </button>
                </div>
            </aside>

            {/* Center: Canvas */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117]">
                <header className="h-14 border-b border-[#21262d] flex justify-between items-center px-6">
                    <div className="flex items-center gap-3">
                        <h1 className="font-bold text-white text-sm">Q3 Revenue Integrity Report</h1>
                        <div className="flex -space-x-2">
                            <div className="size-6 rounded-full bg-slate-400 border-2 border-[#0d1117]"></div>
                            <div className="size-6 rounded-full bg-[#3fb950] flex items-center justify-center text-[10px] text-[#0d1117] font-bold border-2 border-[#0d1117]">JD</div>
                            <div className="size-6 rounded-full bg-[#30363d] flex items-center justify-center text-[10px] text-white border-2 border-[#0d1117]">+2</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[#21262d] rounded-lg p-0.5">
                            <button className="px-3 py-1 bg-[#30363d] text-white text-xs font-bold rounded shadow-sm">Design</button>
                            <button className="px-3 py-1 text-[#8b949e] text-xs font-bold hover:text-white">Preview</button>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#238636] text-white rounded-md text-xs font-bold hover:bg-[#2ea043] transition-colors">
                            <span className="material-symbols-outlined text-sm">ios_share</span> Share & Export
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Executive Summary</h2>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-[#8b949e]">Last edited 2 minutes ago by Sarah Chen</p>
                                <span className="material-symbols-outlined text-[#8b949e] hover:text-white cursor-pointer">settings</span>
                            </div>
                            <div className="h-px w-full bg-[#21262d] mt-4 mb-8"></div>
                        </div>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Chart 1: Revenue by Entity */}
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#8b949e] transition-colors group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#3fb950] text-sm">auto_awesome</span>
                                        <h3 className="text-sm font-bold text-white">Revenue by Entity</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e]">
                                            <span className="material-symbols-outlined text-[10px]">visibility</span> Sharable
                                        </button>
                                        <span className="material-symbols-outlined text-[#8b949e] text-sm">more_vert</span>
                                    </div>
                                </div>

                                {/* Bar Chart Mockup */}
                                <div className="h-40 flex items-end gap-3 px-2 mb-4">
                                    <div className="flex-1 bg-[#1aaedb] h-[60%] rounded-t opacity-80 group-hover:opacity-100"></div>
                                    <div className="flex-1 bg-[#1f6feb] h-[40%] rounded-t opacity-80 group-hover:opacity-100"></div>
                                    <div className="flex-1 bg-[#1aaedb] h-[75%] rounded-t opacity-80 group-hover:opacity-100"></div>
                                    <div className="flex-1 bg-[#1f6feb] h-[30%] rounded-t opacity-80 group-hover:opacity-100"></div>
                                    <div className="flex-1 bg-[#1aaedb] h-[50%] rounded-t opacity-80 group-hover:opacity-100"></div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-[#21262d]">
                                    <div className="flex items-center gap-1.5 text-[#3fb950] font-bold text-xs">
                                        <span className="material-symbols-outlined text-sm">chat_bubble</span> 4 comments
                                    </div>
                                    <span className="text-[10px] text-[#8b949e] italic">AI Confidence: 98%</span>
                                </div>
                            </div>

                            {/* Chart 2: Denial Trends */}
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#8b949e] transition-colors group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[#58a6ff] text-sm">auto_awesome</span>
                                        <h3 className="text-sm font-bold text-white">Denial Trends</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[10px] text-[#8b949e]">
                                            <span className="material-symbols-outlined text-[10px]">lock</span> Personal
                                        </button>
                                        <span className="material-symbols-outlined text-[#8b949e] text-sm">more_vert</span>
                                    </div>
                                </div>

                                {/* Area Chart Mockup */}
                                <div className="h-40 relative flex items-end px-2 mb-4">
                                    <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                        <path d="M0,40 C 20,35 40,35 60,20 S 80,30 100,15" fill="none" stroke="#58a6ff" strokeWidth="2" />
                                        <path d="M0,40 C 20,35 40,35 60,20 S 80,30 100,15 V 50 H 0 Z" fill="url(#blue-gradient)" opacity="0.1" />
                                        <defs>
                                            <linearGradient id="blue-gradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#58a6ff" />
                                                <stop offset="100%" stopColor="transparent" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-[#21262d]">
                                    <div className="flex items-center gap-1.5 text-[#8b949e] hover:text-white font-bold text-xs cursor-pointer">
                                        <span className="material-symbols-outlined text-sm">chat_bubble_outline</span> Add comment
                                    </div>
                                    <span className="text-[10px] text-[#8b949e] italic">AI Confidence: 92%</span>
                                </div>
                            </div>
                        </div>

                        {/* MECE Validation Engine */}
                        <div className="border border-[#238636]/30 bg-[#238636]/5 rounded-xl p-6 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-4 text-[#3fb950]">
                                <span className="material-symbols-outlined">psychology</span>
                                <h3 className="font-bold text-sm tracking-widest uppercase">MECE Validation Engine</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg flex items-start gap-3">
                                    <div className="size-6 bg-[#238636] rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"><span className="material-symbols-outlined text-sm">check</span></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#8b949e] uppercase">Mutually Exclusive</p>
                                        <p className="text-xs text-white">No data overlap detected</p>
                                    </div>
                                </div>
                                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg flex items-start gap-3">
                                    <div className="size-6 bg-[#238636] rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"><span className="material-symbols-outlined text-sm">check</span></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#8b949e] uppercase">Collectively Exhaustive</p>
                                        <p className="text-xs text-white">100% of revenue mapped</p>
                                    </div>
                                </div>
                                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg flex items-start gap-3">
                                    <div className="size-6 bg-[#d29922] rounded-full flex items-center justify-center text-[#0d1117] shrink-0 mt-0.5"><span className="material-symbols-outlined text-sm">priority_high</span></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-[#8b949e] uppercase">Consistency Check</p>
                                        <p className="text-xs text-[#d29922] font-bold">1 minor categorization alert</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Sidebar: Feedback */}
            <aside className="w-72 bg-[#0d1117] border-l border-[#21262d] flex flex-col">
                <div className="p-4 border-b border-[#21262d] flex justify-between items-end">
                    <h3 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest pb-1">Feedback & Review</h3>
                    <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] text-[9px] font-bold border border-[#238636]/30">2 Unresolved</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex gap-3">
                        <div className="size-8 rounded bg-[#f0f6fc] flex items-center justify-center shrink-0">
                            <img src="https://ui-avatars.com/api/?name=Marcus+Thorne&background=random" className="rounded w-full h-full" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="text-xs font-bold text-white">Marcus Thorne</p>
                                <span className="text-[9px] text-[#8b949e]">10m ago</span>
                            </div>
                            <p className="text-xs text-[#8b949e] leading-relaxed mb-2">
                                <span className="text-[#58a6ff]">@Sarah Chen</span> the Medicare drop in chart 1 seems high. Did we account for the new sequester adjustment?
                            </p>
                            <div className="flex gap-3">
                                <button className="text-[10px] font-bold text-[#8b949e] hover:text-white">Reply</button>
                                <button className="text-[10px] font-bold text-[#8b949e] hover:text-white">Resolve</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="size-8 rounded bg-[#1f6feb] flex items-center justify-center shrink-0 text-white font-bold text-xs">SC</div>
                        <div className="flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                                <p className="text-xs font-bold text-white">Sarah Chen</p>
                                <span className="text-[9px] text-[#8b949e]">2h ago</span>
                            </div>
                            <p className="text-xs text-[#8b949e] italic leading-relaxed pl-2 border-l-2 border-[#30363d]">
                                "Resolved: Data query on BCBS collection efficiency"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#21262d]">
                    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 min-h-[80px] text-xs text-[#8b949e] relative">
                        Type @ to mention team members...
                        <div className="absolute bottom-2 right-2 flex gap-2">
                            <span className="material-symbols-outlined text-[#8b949e] text-sm hover:text-white cursor-pointer">attach_file</span>
                            <span className="material-symbols-outlined text-[#1f6feb] text-sm hover:text-[#388bfd] cursor-pointer">send</span>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
