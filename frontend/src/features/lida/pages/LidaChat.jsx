import React, { useState } from 'react';

export function LidaChat() {
    const [messages, setMessages] = useState([
        { role: 'user', content: 'What is driving the 4.2% revenue leakage observed in the Northeast region over the last 60 days? Specifically, I want to understand if this is related to payer policy changes or internal coding errors.' },
        { role: 'assistant', content: "Based on an agentic audit of 4,200 claims, I've identified that the revenue leakage is primarily driven by **Medical Necessity Denials** from two major payers. This isn't a coding error but a mismatch between new clinical guidelines and documentation protocols." }
    ]);
    const [showPermissions, setShowPermissions] = useState(false);

    return (
        <div className="flex h-full bg-[#0d1117] text-slate-300 font-sans overflow-hidden">
            {/* Left Sidebar: Thread History (Design to Dev) */}
            <aside className="w-64 border-r border-[#21262d] flex flex-col bg-[#0d1117]">
                <div className="p-4">
                    <button className="w-full flex items-center justify-center gap-2 py-2 border border-[#30363d] rounded-lg text-sm text-white hover:bg-[#21262d] transition-colors">
                        <span className="material-symbols-outlined text-sm">add</span> New Session
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-6">
                    <div>
                        <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Descriptive</h3>
                        <div className="space-y-1">
                            <div className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg cursor-pointer">Q3 Denial Summary</div>
                            <div className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg cursor-pointer">Payer Performance Overview</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Predictive</h3>
                        <div className="space-y-1">
                            <div className="px-3 py-2 text-sm text-white bg-[#1f6feb]/20 border border-[#1f6feb]/30 rounded-lg cursor-pointer flex items-center justify-between">
                                <span>Revenue Leakage Analysis</span>
                            </div>
                            <div className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg cursor-pointer">Cash Flow Forecast Nov</div>
                        </div>
                    </div>
                    <div>
                        <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Prescriptive</h3>
                        <div className="space-y-1">
                            <div className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg cursor-pointer">Liquidity Optimization Plan</div>
                            <div className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-[#21262d] rounded-lg cursor-pointer">Workflow Redesign - Claims</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#21262d]">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-orange-200">
                            <img src="https://ui-avatars.com/api/?name=Marcus+Chen&background=ffedd5&color=9a3412" alt="MC" className="rounded-full rounded-full w-full h-full" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">Marcus Chen</p>
                            <p className="text-xs text-slate-500">CFO, Health Systems</p>
                        </div>
                        <span className="material-symbols-outlined ml-auto text-slate-500 text-sm">settings</span>
                    </div>
                </div>
            </aside>

            {/* Center: Chat Interface */}
            <main className="flex-1 flex flex-col border-r border-[#21262d] min-w-0">
                <header className="h-14 border-b border-[#21262d] flex justify-between items-center px-6">
                    <div className="flex items-center gap-3">
                        <h2 className="font-bold text-white text-sm">Revenue Leakage Analysis</h2>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1f6feb]/20 text-[#58a6ff] font-bold uppercase border border-[#1f6feb]/30">Predictive</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowPermissions(true)} className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined text-sm">ios_share</span> Export Report
                        </button>
                        <button className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-sm">more_horiz</span></button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* User Message */}
                    <div className="flex gap-4">
                        <div className="size-8 rounded-full bg-[#30363d] flex items-center justify-center shrink-0 border border-[#21262d] text-xs font-bold text-[#8b949e]">MC</div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-white text-sm">Marcus Chen</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                What is driving the 4.2% revenue leakage observed in the Northeast region over the last 60 days? Specifically, I want to understand if this is related to payer policy changes or internal coding errors.
                            </p>
                        </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex gap-4">
                        <div className="size-8 rounded-full bg-[#1f6feb] flex items-center justify-center shrink-0 text-white shadow-[0_0_15px_rgba(31,111,235,0.4)]">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-[#58a6ff] text-sm">LIDA AI • Diagnostic Analysis</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                Based on an agentic audit of 4,200 claims, I've identified that the revenue leakage is primarily driven by <strong className="text-white">Medical Necessity Denials</strong> from two major payers. This isn't a coding error but a mismatch between new clinical guidelines and documentation protocols.
                            </p>

                            {/* Leakage Breakdown Card */}
                            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-0 overflow-hidden max-w-2xl">
                                <div className="p-4 border-b border-[#30363d] flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Leakage Root Cause Breakdown</h4>
                                    <span className="px-2 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] text-[10px] font-bold border border-[#238636]/30">Live Agent Feed</span>
                                </div>
                                <div className="p-6">
                                    {/* Chart Placeholder */}
                                    <div className="h-40 flex items-end justify-between gap-4 mb-6 relative">
                                        <div className="absolute top-1/2 w-full border-t border-dashed border-[#30363d]"></div>
                                        <div className="flex-1 bg-[#21262d] rounded h-[20%] relative group hover:bg-[#30363d] transition-colors"> <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Clinical Doc</span></div>
                                        <div className="flex-1 bg-[#21262d] rounded h-[35%] relative group hover:bg-[#30363d] transition-colors"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Payer Lag</span></div>
                                        <div className="flex-1 bg-[#21262d] rounded h-[15%] relative group hover:bg-[#30363d] transition-colors"><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Auth Issues</span></div>
                                        <div className="flex-1 bg-gradient-to-t from-[#da3633] to-[#f85149] rounded h-[85%] relative shadow-[0_0_20px_rgba(218,54,51,0.2)]">
                                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap">Coding</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#8b949e] uppercase mb-1">Primary Root Cause</p>
                                            <p className="text-sm font-bold text-[#f85149]">Payer Guideline Shift (Aetna/Cigna)</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-[#8b949e] uppercase mb-1">Impact Score</p>
                                            <p className="text-sm font-bold text-white">Critical (8.4/10)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowPermissions(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#21262d] text-white text-xs font-bold hover:bg-[#30363d] border border-[#30363d] transition-colors">
                                    <span className="material-symbols-outlined text-sm">share</span> Share
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#21262d] text-white text-xs font-bold hover:bg-[#30363d] border border-[#30363d] transition-colors">
                                    <span className="material-symbols-outlined text-sm">save</span> Save to Report
                                </button>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1f6feb] text-white text-xs font-bold hover:bg-[#388bfd] border border-transparent shadow-[0_0_10px_rgba(31,111,235,0.3)] transition-colors">
                                    <span className="material-symbols-outlined text-sm">confirmation_number</span> Create Ticket
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-[#21262d]">
                    <div className="max-w-4xl mx-auto bg-[#161b22] border border-[#30363d] rounded-xl flex items-center p-2 focus-within:ring-1 focus-within:ring-[#1f6feb] focus-within:border-[#1f6feb]">
                        <span className="material-symbols-outlined text-[#8b949e] p-2">attach_file</span>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none text-white text-sm focus:ring-0 placeholder-[#8b949e]"
                            placeholder="Ask LIDA for follow-up analysis or agentic tasks..."
                        />
                        <button className="p-2 bg-[#1f6feb] text-white rounded-lg hover:bg-[#388bfd]">
                            <span className="material-symbols-outlined text-sm">send</span>
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-[#484f58] mt-2">LIDA AI can make mistakes. Verify critical clinical and financial data.</p>
                </div>
            </main>

            {/* Right Sidebar: Collaborator Panel */}
            <aside className="w-72 bg-[#0d1117] flex flex-col">
                <div className="p-4 border-b border-[#21262d] flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#8b949e]">people</span>
                    <h3 className="text-sm font-bold text-white">Collaborator Panel</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {/* Active Leaders */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Active Leaders</h4>
                            <span className="text-[9px] font-bold text-[#3fb950] bg-[#238636]/20 px-1.5 py-0.5 rounded border border-[#238636]/30">Online</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className="relative">
                                    <div className="size-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-[1px]">
                                        <img src="https://ui-avatars.com/api/?name=Sarah+Miller&background=0d1117&color=fff" className="rounded-full h-full w-full border-2 border-[#0d1117]" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 size-2.5 bg-[#3fb950] border-2 border-[#0d1117] rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">Sarah Miller</p>
                                    <p className="text-[10px] text-[#8b949e]">VP Operations • 4 comments</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 group cursor-pointer">
                                <div className="relative">
                                    <div className="size-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-[1px]">
                                        <img src="https://ui-avatars.com/api/?name=James+Wilson&background=0d1117&color=fff" className="rounded-full h-full w-full border-2 border-[#0d1117]" />
                                    </div>
                                    <div className="absolute bottom-0 right-0 size-2.5 bg-[#3fb950] border-2 border-[#0d1117] rounded-full"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white">James Wilson</p>
                                    <p className="text-[10px] text-[#8b949e]">Dir. Billing • Active now</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Laggards */}
                    <div>
                        <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-3">Laggards (Behind)</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="size-8 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-[#8b949e]">ET</div>
                                <div>
                                    <p className="text-sm font-bold text-white">Elena Torres</p>
                                    <p className="text-[10px] text-[#f85149]">Review pending (2d)</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                                <div className="size-8 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-[#8b949e]">RK</div>
                                <div>
                                    <p className="text-sm font-bold text-white">Raj K.</p>
                                    <p className="text-[10px] text-[#f85149]">Task overdue</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thread History */}
                    <div>
                        <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-4">Thread History</h4>
                        <div className="space-y-6 relative pl-2">
                            <div className="absolute left-2 top-2 bottom-2 w-px bg-[#21262d]"></div>

                            <div className="relative pl-6">
                                <div className="absolute left-[-1px] top-1.5 size-2 bg-[#1f6feb] rounded-full ring-4 ring-[#0d1117]"></div>
                                <p className="textxs font-bold text-white">Ticket #402 Created</p>
                                <p className="text-[10px] text-[#8b949e] italic">"Follow up with Aetna regarding policy 2024-X"</p>
                            </div>

                            <div className="relative pl-6">
                                <div className="absolute left-[-1px] top-1.5 size-2 bg-[#30363d] rounded-full ring-4 ring-[#0d1117]"></div>
                                <p className="textxs font-bold text-white">Report Exported</p>
                                <p className="text-[10px] text-[#8b949e]">Shared with Northeast Regional Leads</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Share & Permissions Modal */}
            {showPermissions && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-white">
                    <div className="bg-[#161b22] w-full max-w-lg rounded-xl shadow-2xl border border-[#30363d] flex flex-col">
                        <div className="p-6 border-b border-[#30363d] flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">Share & Permissions</h2>
                                <p className="text-xs text-[#8b949e] mt-1">Manage access for "Q4 Revenue Analysis - North Region"</p>
                            </div>
                            <button onClick={() => setShowPermissions(false)} className="text-[#8b949e] hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-[#8b949e] mb-2 block">Privacy Scope</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button className="flex items-center justify-center gap-2 bg-[#1f6feb] text-white py-2 rounded-lg text-sm font-bold border border-[#1f6feb]">
                                        <span className="material-symbols-outlined text-sm">lock</span> Private
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-transparent text-[#8b949e] py-2 rounded-lg text-sm font-bold border border-[#30363d] hover:bg-[#21262d] transition-colors">
                                        <span className="material-symbols-outlined text-sm">group</span> Team
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-transparent text-[#8b949e] py-2 rounded-lg text-sm font-bold border border-[#30363d] hover:bg-[#21262d] transition-colors">
                                        <span className="material-symbols-outlined text-sm">domain</span> Org
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-[#8b949e] mb-2 block">Add Collaborators</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]">search</span>
                                        <input type="text" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-10 h-10 text-sm text-white focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb]" placeholder="Search by name, email, or department..." />
                                    </div>
                                    <select className="bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-white px-3 focus:ring-0">
                                        <option>Can View</option>
                                        <option>Can Edit</option>
                                    </select>
                                    <button className="px-4 bg-[#1f6feb] text-white rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-[#388bfd]">
                                        <span className="material-symbols-outlined text-sm">add</span> Add
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold uppercase text-[#8b949e]">Shared With (4)</label>
                                    <span className="text-[10px] text-[#8b949e] flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">info</span> AI-Rankings based on last 30 days</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#21262d]/50 hover:bg-[#21262d] group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#30363d] flex items-center justify-center overflow-hidden">
                                                <img src="https://ui-avatars.com/api/?name=David+Chen&background=random" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">David Chen</p>
                                                <p className="text-[10px] text-[#8b949e]">Revenue Integrity Manager</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] text-[9px] font-bold border border-[#238636]/30 uppercase">Leader</span>
                                            <span className="text-xs text-[#8b949e]">Full Owner</span>
                                            <span className="material-symbols-outlined text-[#8b949e] text-sm hover:text-[#f85149]">remove_circle_outline</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#21262d]/50 hover:bg-[#21262d] group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#30363d] flex items-center justify-center overflow-hidden">
                                                <img src="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Sarah Jenkins</p>
                                                <p className="text-[10px] text-[#8b949e]">Billing Specialist</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] text-[9px] font-bold border border-[#238636]/30 uppercase">Leader</span>
                                            <span className="text-xs text-[#8b949e]">Can Edit</span>
                                            <span className="material-symbols-outlined text-[#8b949e] text-sm hover:text-[#f85149]">remove_circle_outline</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1f6feb]/10 border border-[#1f6feb]/20 p-4 rounded-xl flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[#58a6ff]">
                                        <span className="material-symbols-outlined">link</span>
                                        <h4 className="font-bold text-sm">Public Sharing Link</h4>
                                    </div>
                                    <div className="w-8 h-4 bg-[#1f6feb] rounded-full relative cursor-pointer">
                                        <div className="absolute right-0.5 top-0.5 size-3 bg-white rounded-full"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-[#8b949e]">Enable external access via secure URL</p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value="https://rcm.ai/share/xf9-2kLp-98xZ-pQ1" className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-[#8b949e] px-3 h-8" />
                                    <button className="h-8 w-8 flex items-center justify-center border border-[#30363d] rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e]">
                                        <span className="material-symbols-outlined text-sm">content_copy</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <label className="text-[9px] font-bold text-[#8b949e] uppercase mb-1 block">Expires On</label>
                                        <input type="date" className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 h-8 text-xs text-white" value="2023-12-31" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-[#8b949e] uppercase mb-1 block">Password Protect</label>
                                        <input type="password" placeholder="Optional password" className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 h-8 text-xs text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-[#30363d] flex items-center justify-between bg-[#0d1117] rounded-b-xl">
                            <p className="text-[10px] text-[#8b949e]">Last modified by David C. • 2 hours ago</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowPermissions(false)} className="text-sm font-bold text-[#8b949e] hover:text-white">Cancel</button>
                                <button onClick={() => setShowPermissions(false)} className="px-4 py-2 bg-[#1f6feb] text-white rounded-lg text-sm font-bold shadow-lg hover:bg-[#388bfd]">Save Permissions</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
