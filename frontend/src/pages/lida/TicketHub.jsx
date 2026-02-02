import React, { useState } from 'react';

export function TicketHub() {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Mock Ticket Data
    const tickets = [
        {
            id: "TKT-8842",
            title: "Aetna Denial Spike in New York Region",
            priority: "Critical",
            assignee: "David Miller",
            source: "Payer Variance",
            recovery: "$142,500",
            timeline: "2 days left",
            desc: "Investigate sudden 15% increase in 'Duplicate Claim' denials for NY outpatient services.",
            chartColor: "bg-[#da3633]"
        },
        {
            id: "TKT-8845",
            title: "Medicare Part B AR Aging Over 90 Days",
            priority: "High",
            assignee: "Elena Rodriguez",
            source: "Predictive AR",
            recovery: "$420,000",
            timeline: "5 days left",
            desc: "LIDA AI identified $420k in aging accounts that meet auto-appeal criteria.",
            chartColor: "bg-[#1f6feb]"
        }
    ];

    return (
        <div className="flex h-full bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden items-stretch">

            {/* Left Column: Tickets List (65%) */}
            <div className="flex-1 flex flex-col border-r border-[#21262d] min-w-0">
                <header className="h-16 px-6 border-b border-[#21262d] flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-lg font-bold text-white">Active Insights Tickets</h1>
                        <p className="text-xs text-[#8b949e]">Manage tasks derived directly from AI data insights</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1f6feb] text-white rounded-lg text-sm font-bold hover:bg-[#388bfd] transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">add</span> Create Ticket
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {tickets.map((ticket, i) => (
                        <div
                            key={i}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`bg-[#161b22] border rounded-xl p-0 transition-all cursor-pointer group ${selectedTicket?.id === ticket.id ? 'border-[#1f6feb] ring-1 ring-[#1f6feb]' : 'border-[#30363d] hover:border-[#8b949e]'}`}
                        >
                            <div className="p-5 flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${ticket.priority === 'Critical' ? 'text-[#f85149] bg-[#da3633]/10 border-[#da3633]/20' :
                                                'text-[#d29922] bg-[#d29922]/10 border-[#d29922]/20'
                                            }`}>
                                            {ticket.priority} Priority
                                        </span>
                                        <span className="text-xs font-mono text-[#8b949e]">{ticket.id}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#58a6ff] transition-colors">{ticket.title}</h3>
                                    <p className="text-sm text-[#8b949e] leading-relaxed max-w-xl">
                                        {ticket.desc}
                                    </p>

                                    <div className="flex items-center gap-8 mt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-[#f0f6fc] flex items-center justify-center overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${ticket.assignee.replace(' ', '+')}&background=random`} alt={ticket.assignee} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-[#8b949e]">Assigned Leader</p>
                                                <p className="text-xs font-bold text-white">{ticket.assignee}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Source Insight</p>
                                            <div className="flex items-center gap-1.5 text-[#58a6ff]">
                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                <span className="text-xs font-bold">{ticket.source}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Est. Recovery</p>
                                            <p className="text-sm font-bold text-[#3fb950]">{ticket.recovery}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-[#8b949e] mb-1">Timeline</p>
                                            <p className="text-sm font-bold text-white">{ticket.timeline}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Chart Visual */}
                                <div className="w-32 bg-[#0d1117] rounded-lg p-3 border border-[#30363d]">
                                    <p className="text-[9px] font-bold text-[#8b949e] uppercase mb-2">Related Chart</p>
                                    <div className="h-16 flex items-end gap-1">
                                        {[40, 50, 45, 90, 85].map((h, idx) => (
                                            <div key={idx} className={`flex-1 rounded-t ${idx > 2 ? ticket.chartColor : ticket.chartColor + '/20'}`} style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Review Panel or Stats (35%) */}
            <div className="w-[450px] flex flex-col bg-[#0d1117] border-l border-[#21262d] shrink-0 transition-all">
                {selectedTicket ? (
                    // REVIEW PANEL
                    <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right duration-300">
                        <header className="px-6 py-4 border-b border-[#21262d] bg-[#161b22]">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">{selectedTicket.id} / REVIEW</span>
                                <button onClick={() => setSelectedTicket(null)} className="text-[#8b949e] hover:text-white"><span className="material-symbols-outlined">close</span></button>
                            </div>
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white leading-tight max-w-[70%]">{selectedTicket.title}</h2>
                                <div className="flex bg-[#0d1117] rounded-lg p-0.5 border border-[#30363d]">
                                    <button className="px-3 py-1 bg-[#d29922]/20 text-[#d29922] text-xs font-bold rounded">Pending</button>
                                    <button className="px-3 py-1 text-[#8b949e] text-xs font-bold hover:text-white">Verified</button>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0d1117]">
                            <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-6">Timeline of Communication</h4>
                            <div className="space-y-6 relative pl-4">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-4 bottom-4 w-px bg-[#21262d]"></div>

                                {/* LIDA Event */}
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-0 size-8 rounded-full bg-[#1f6feb] flex items-center justify-center z-10 ring-4 ring-[#0d1117]">
                                        <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                                    </div>
                                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-[#58a6ff]">LIDA Intelligence</span>
                                            <span className="text-[10px] text-[#8b949e]">Oct 24, 09:12 AM</span>
                                        </div>
                                        <p className="text-sm text-[#c9d1d9] leading-relaxed">
                                            Ticket automatically generated from NY Payer Variance alert. Priority set to <span className="text-[#f85149] font-bold">Critical</span> due to $142.5k revenue exposure.
                                        </p>
                                    </div>
                                </div>

                                {/* User Comment */}
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-0 size-8 rounded-full bg-[#f0f6fc] flex items-center justify-center overflow-hidden z-10 ring-4 ring-[#0d1117]">
                                        <img src="https://ui-avatars.com/api/?name=David+Miller&background=random" alt="DM" />
                                    </div>
                                    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-white">David Miller</span>
                                            <span className="text-[10px] text-[#8b949e]">Oct 24, 11:30 AM</span>
                                        </div>
                                        <p className="text-sm text-[#c9d1d9] leading-relaxed">
                                            I've initiated the audit of the NY clearinghouse logs. <span className="text-[#58a6ff]">@Marcus Chen</span>, can you verify if the CO-18 codes are hitting the middleware correctly?
                                        </p>
                                    </div>
                                </div>

                                {/* Verified Event */}
                                <div className="relative pl-12">
                                    <div className="absolute left-0 top-0 size-8 rounded-full bg-[#238636] flex items-center justify-center z-10 ring-4 ring-[#0d1117]">
                                        <span className="material-symbols-outlined text-white text-sm">check</span>
                                    </div>
                                    <div className="bg-[#238636]/10 border border-[#238636]/30 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-[#3fb950]">Progress Verified</span>
                                            <span className="text-[10px] text-[#8b949e]">Oct 25, 02:45 PM</span>
                                        </div>
                                        <p className="text-sm text-[#c9d1d9] leading-relaxed">
                                            Configuration error in Node-NY4 identified. Routing issue corrected for Aetna 835 response files.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-[#21262d] bg-[#161b22] mt-auto">
                            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 focus-within:ring-1 focus-within:ring-[#1f6feb] transition-all">
                                <textarea rows="2" className="w-full bg-transparent border-none text-sm text-white placeholder-[#8b949e] focus:ring-0 resize-none mb-2" placeholder="Add a comment or @tag a team member..."></textarea>
                                <div className="flex justify-between items-center">
                                    <button className="text-[#8b949e] hover:text-white"><span className="material-symbols-outlined text-lg">attach_file</span></button>
                                    <button className="h-8 w-8 bg-[#1f6feb] text-white rounded-lg flex items-center justify-center hover:bg-[#388bfd] transition-colors"><span className="material-symbols-outlined text-sm">send</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // TEAM PERFORMANCE PANEL (Default)
                    <div className="flex-1 flex flex-col h-full">
                        <header className="h-16 px-6 border-b border-[#21262d] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-bold text-white">Team Performance</h2>
                                <span className="material-symbols-outlined text-slate-500 text-sm">more_horiz</span>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {/* Top Performers */}
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-4">
                                    <span className="material-symbols-outlined text-[#3fb950] text-sm">check_circle</span> Top Performers
                                </h4>
                                <div className="space-y-3">
                                    <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-[#f0f6fc] overflow-hidden"><img src="https://ui-avatars.com/api/?name=Marcus+Chen&background=random" alt="MC" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Marcus Chen</p>
                                                <p className="text-[10px] text-[#8b949e]">Avg Resolution: 4.2h</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#3fb950]">12 Tickets</p>
                                            <p className="text-[9px] text-[#8b949e] uppercase">Closed</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-[#f0f6fc] overflow-hidden"><img src="https://ui-avatars.com/api/?name=Elena+Rodriguez&background=random" alt="ER" /></div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Elena Rodriguez</p>
                                                <p className="text-[10px] text-[#8b949e]">Avg Resolution: 5.8h</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-[#3fb950]">9 Tickets</p>
                                            <p className="text-[9px] text-[#8b949e] uppercase">Closed</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lagging Response */}
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-4">
                                    <span className="material-symbols-outlined text-[#d29922] text-sm">assignment_late</span> Lagging Response
                                </h4>
                                <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-[#f0f6fc] overflow-hidden"><img src="https://ui-avatars.com/api/?name=Tom+Braddock&background=random" alt="TB" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Tom Braddock</p>
                                            <p className="text-[10px] text-[#8b949e]">Avg Resolution: 28.5h</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-[#f85149]">4 Overdue</p>
                                        <p className="text-[9px] text-[#8b949e] uppercase">Stalled</p>
                                    </div>
                                </div>
                            </div>

                            {/* LIDA Insight Card */}
                            <div className="bg-[#1f6feb] rounded-xl p-5 text-white">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    <h4 className="text-sm font-bold">LIDA Efficiency Insight</h4>
                                </div>
                                <p className="text-xs leading-relaxed opacity-90 mb-4">
                                    "Direct ticket generation from Chat has reduced triage time by 42% this month. Teams focusing on 'Critical' items first have seen a 12% revenue lift."
                                </p>
                                <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors border border-white/20">Analyze Team Impact</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-[#30363d] w-full max-w-xl rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-[#30363d] flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-[#8b949e] hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </header>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-2">Ticket Title</label>
                                <input type="text" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-white focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb]" placeholder="e.g. Investigate Denial Spikes in Cardio..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#8b949e] uppercase mb-2">Priority</label>
                                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-white">
                                        <option>Critical</option>
                                        <option>High</option>
                                        <option>Medium</option>
                                        <option>Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#8b949e] uppercase mb-2">Assignee</label>
                                    <select className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-white">
                                        <option>Unassigned</option>
                                        <option>Sarah Miller</option>
                                        <option>David Chen</option>
                                        <option>Elena Rodriguez</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-2">Related Insight</label>
                                <div className="flex items-center gap-3 p-3 bg-[#0d1117] border border-[#30363d] rounded-lg cursor-pointer hover:border-[#58a6ff] transition-colors">
                                    <span className="material-symbols-outlined text-[#58a6ff]">auto_awesome</span>
                                    <div>
                                        <p className="text-sm font-bold text-white">Payer Variance Analysis (Oct 24)</p>
                                        <p className="text-xs text-[#8b949e]">Auto-detected 15% deviation in Aetna</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#8b949e] ml-auto">expand_more</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#8b949e] uppercase mb-2">Description</label>
                                <textarea rows="3" className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-3 text-sm text-white focus:border-[#1f6feb] focus:ring-1 focus:ring-[#1f6feb]" placeholder="Provide details..."></textarea>
                            </div>
                        </div>
                        <footer className="p-6 border-t border-[#30363d] flex justify-end gap-3 bg-[#0d1117] rounded-b-xl">
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-[#8b949e] hover:text-white transition-colors">Cancel</button>
                            <button onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 bg-[#1f6feb] text-white rounded-lg text-sm font-bold hover:bg-[#388bfd] shadow-lg">Create Ticket</button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
