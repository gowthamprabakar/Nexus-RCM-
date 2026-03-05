import React, { useState } from 'react';

export function PatientAccounts() {
    const [activeTab, setActiveTab] = useState('registration');

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark overflow-y-auto font-sans custom-scrollbar">
            {/* Top Patient Header Card */}
            <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-border-dark p-6 pb-0">
                <div className="flex flex-wrap justify-between items-start gap-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="size-20 rounded-full bg-cover bg-center border-4 border-slate-100 dark:border-slate-800 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCWYNuMjYrb-w82--j7la9HVa3SMNNJmB88sLo3pLLWNf4hQGcEOhI1kzB0gQNWc64JLjSfxgK_2KJm1AaK5WqzTP6FEGr-QKSn-JAm2HgO313DHg9_m4eNz86WI6_-2t1J-p-2xdH55exbDBCzS3RMdoz6xlIkNvWf5cORhDlGKmVhPc60qEKN01vmrVd73om-lUncFxsbuOvFzAMNJ8YwerBM4Ou3lnlrsWhdl91woj7kDYJirBSeYlbOPCTWYIUffAKafl938jO1")' }}></div>
                            <div className="absolute -bottom-1 -right-1 size-6 bg-emerald-500 rounded-full border-2 border-white dark:border-card-dark flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Johnathan Davis Doe</h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">MRN: 8472-192</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px]">cake</span> 05/12/1980 (43y)</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>Male</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>English</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                            <span className="material-symbols-outlined text-[20px]">print</span>
                            Print Forms
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                            <span className="material-symbols-outlined text-[20px]">bolt</span>
                            Quick Actions
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-8 mt-8 border-b border-slate-200 dark:border-slate-800 max-w-7xl mx-auto">
                    {['Registration', 'Insurance', 'History', 'Documents', 'Billing', 'Appointments'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.toLowerCase()
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Scrollable Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status Chips */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex h-10 items-center gap-2 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 px-4 shadow-sm">
                                <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                                <p className="text-slate-700 dark:text-white text-sm font-semibold">BlueCross BlueShield</p>
                            </div>
                            <div className="flex h-10 items-center gap-2 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 px-4 shadow-sm">
                                <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                                <p className="text-slate-700 dark:text-white text-sm font-semibold">Coverage: Active</p>
                            </div>
                            <div className="flex h-10 items-center gap-2 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 px-4 shadow-sm">
                                <span className="material-symbols-outlined text-amber-500 text-[20px]">history_edu</span>
                                <p className="text-slate-700 dark:text-white text-sm font-semibold">Pre-Auth: 2 Pending</p>
                            </div>
                            <div className="flex h-10 items-center gap-2 rounded-lg bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-700 px-4 shadow-sm">
                                <span className="material-symbols-outlined text-primary text-[20px]">medical_information</span>
                                <p className="text-slate-700 dark:text-white text-sm font-semibold">PCP: Dr. Sarah Chen</p>
                            </div>
                        </div>

                        {/* Medical History Timeline */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Medical History</h3>
                                <button className="text-primary text-sm font-semibold hover:underline">View Full Record</button>
                            </div>
                            <div className="relative overflow-x-auto pb-2">
                                <div className="flex min-w-[600px] items-center gap-0">
                                    {/* Event 1 */}
                                    <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
                                        <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 absolute top-4 left-1/2"></div>
                                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center relative z-10 border-2 border-primary group-hover:scale-110 transition-transform bg-white dark:bg-card-dark">
                                            <span className="material-symbols-outlined text-primary text-[18px]">emergency</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">OCT 12</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">ER Visit</p>
                                    </div>
                                    {/* Event 2 */}
                                    <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
                                        <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 absolute top-4"></div>
                                        <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center relative z-10 border-2 border-emerald-500 group-hover:scale-110 transition-transform bg-white dark:bg-card-dark">
                                            <span className="material-symbols-outlined text-emerald-500 text-[18px]">content_paste_search</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">NOV 02</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">Follow-up</p>
                                    </div>
                                    {/* Event 3 */}
                                    <div className="flex flex-col items-center flex-1 relative group cursor-pointer text-center">
                                        <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 absolute top-4"></div>
                                        <div className="size-8 rounded-full bg-primary flex items-center justify-center relative z-10 shadow-lg shadow-primary/40 group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-white text-[18px]">event</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-primary mt-2 uppercase">TODAY</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">MRI Imaging</p>
                                    </div>
                                    {/* Event 4 */}
                                    <div className="flex flex-col items-center flex-1 relative opacity-50 text-center">
                                        <div className="w-full h-0.5 bg-slate-100 dark:bg-slate-700 absolute top-4 right-1/2"></div>
                                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center relative z-10 border-2 border-slate-300 dark:border-slate-600">
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_today</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">DEC 20</p>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">Routine Lab</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Documents */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Recent Documents</h3>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">upload</span>
                                    Upload New
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {/* ID Card */}
                                <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 ring-primary ring-offset-2 dark:ring-offset-card-dark transition-all">
                                    <div className="absolute top-2 right-2 z-10"><span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold uppercase">OCR: 99%</span></div>
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdciERXa-2M7uMfqCawsOT5dgaRs5lNdveS9DFcBEW1mzK7VrlG7oxjS5okMxqBEb8GFJY06ZmtfMqXqhryX-z4fCHrtINUUfDmFIMvqiIdlueKYCNI7C3EtbivPG67p3d0EWTR7MgsSHKwWY1Oh-1S7pLQEvCefO4SJ6j2jl4fhf00ykKXWoaHgSedJNYW5SqUuT9SndSYsdFkdKjLVjHsARhOcGph6G6LBkptXZaWVfeE7RTYLzrpJN9y9c4I7I4aNPm_rxkDedQ" className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="ID" />
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-[10px] font-bold truncate">Driver's License</p>
                                    </div>
                                </div>
                                {/* Insurance Card */}
                                <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-slate-100 dark:bg-background-dark border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 ring-primary ring-offset-2 dark:ring-offset-card-dark transition-all">
                                    <div className="absolute top-2 right-2 z-10"><span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold uppercase">OCR: 94%</span></div>
                                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx_jj7wg3f2SHl2Z9alku3IuIfZTt1BSnYpkGH3psOE3Ul5OPkNuK-K5nCip3qiZz5yiX511OnlRbokSbZzKwr8mwT9LmXPXt8rtHxjXe2ETsns_G2yvtgrg-S8WCCOu1dTP6WFB1tQqRNw1BE8XLzmGGPOxCW37afJ0bCNC_-yFIqJopDTWVeEBbI90HHkybjSNpn8s7ThH3aNf3sxe2hTAebOJrQ6y1oactnzI_awLUiojCAsnKyCcdyMeWYkN23DyUzpp8BzH8r" className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Insurance" />
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-white text-[10px] font-bold truncate">Insurance Card</p>
                                    </div>
                                </div>
                                {/* PDF */}
                                <div className="group relative aspect-[1.4/1] rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:ring-2 ring-primary ring-offset-2 dark:ring-offset-card-dark transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined text-slate-400 text-4xl group-hover:text-primary transition-colors">picture_as_pdf</span>
                                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                                        <p className="text-white text-[10px] font-bold truncate">Referral.pdf</p>
                                    </div>
                                </div>
                                {/* Add */}
                                <div className="aspect-[1.4/1] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center group bg-slate-50/50">
                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary mb-1">add_circle</span>
                                    <p className="text-slate-400 group-hover:text-primary text-[10px] font-bold uppercase">Add Doc</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="space-y-6">
                        {/* Financial Counselor Card */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Financial Overview</h3>
                            </div>

                            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20 mb-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-primary/80 uppercase tracking-wide mb-1">Financial Health</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-primary">842</span>
                                            <span className="text-xs font-bold text-slate-500">/ 1000</span>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-white dark:bg-card-dark rounded-lg shadow-sm">
                                        <span className="material-symbols-outlined text-emerald-500">security</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">Likelihood to pay: <span className="text-emerald-500 font-bold">High</span></p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Current Balance</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white">$342.50</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Visit Copay</span>
                                        <span className="text-slate-900 dark:text-white font-bold">$40.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">MRI Service</span>
                                        <span className="text-slate-900 dark:text-white font-bold">$212.50</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow-sm shadow-primary/20 hover:scale-[1.02] transition-transform">Online Payment</button>
                                <button className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Establish Plan</button>
                            </div>
                        </div>

                        {/* Scheduling Mini-Widget */}
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Provider Availability</h3>
                                <span className="text-xs font-bold text-slate-400">NOV 20-24</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">SC</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. Sarah Chen</p>
                                        <p className="text-[10px] text-emerald-500 font-bold">3 Slots Available</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">RM</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. Robert Mills</p>
                                        <p className="text-[10px] text-amber-500 font-bold">Limited Availability</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">AG</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Dr. Amy Grant</p>
                                        <p className="text-[10px] text-slate-400 font-bold">Unavailble</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
