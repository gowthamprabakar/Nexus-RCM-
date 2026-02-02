import React from 'react';

export function PaymentPortal() {
    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            {/* Top Navigation (Portal Specific) */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-card-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-primary">HealPay AI</h1>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <a className="text-sm font-semibold text-primary border-b-2 border-primary pb-0.5" href="#">Statements</a>
                        <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">Payment Plans</a>
                        <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">Insurance</a>
                        <a className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="#">Support</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-card-dark"></span>
                        </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300">SJ</div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">Sarah J.</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Section */}
                <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 bg-white dark:bg-card-dark p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Good morning, Sarah</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">Your recent statement from <b>Northwest Medical Center</b> is ready for review. We've used AI to simplify your bill and find the best payment options for you.</p>
                        <div className="flex gap-4 pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm">verified_user</span> HIPAA SECURE
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-sm">lock</span> PCI-DSS COMPLIANT
                            </span>
                        </div>
                    </div>
                    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/10 min-w-[280px]">
                        <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Total Balance Due</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$1,240.50</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Statement Date: Oct 24, 2023</p>
                        <button className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                            Pay Full Balance <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Center Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* AI Bill Explorer */}
                        <section className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Itemized Bill Explorer</h3>
                                </div>
                                <button className="text-sm font-medium text-primary flex items-center gap-1 hover:underline">
                                    <span className="material-symbols-outlined text-sm">download</span> Download PDF
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Service Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Description & Code</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">AI Explanation</th>
                                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-6 text-sm text-slate-500">Oct 12, 2023</td>
                                            <td className="px-6 py-6">
                                                <div className="font-bold text-slate-900 dark:text-white">Office Visit</div>
                                                <div className="text-xs text-slate-400">CPT: 99214</div>
                                            </td>
                                            <td className="px-6 py-6 max-w-xs">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"General check-up and consultation for your persistent symptoms."</p>
                                            </td>
                                            <td className="px-6 py-6 text-right font-bold text-slate-900 dark:text-white">$150.00</td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-6 text-sm text-slate-500">Oct 12, 2023</td>
                                            <td className="px-6 py-6">
                                                <div className="font-bold text-slate-900 dark:text-white">Lipid Panel</div>
                                                <div className="text-xs text-slate-400">CPT: 80061</div>
                                            </td>
                                            <td className="px-6 py-6 max-w-xs">
                                                <p className="text-sm text-slate-600 dark:text-slate-400 italic">"A routine blood test to monitor your cholesterol and heart health."</p>
                                            </td>
                                            <td className="px-6 py-6 text-right font-bold text-slate-900 dark:text-white">$45.00</td>
                                        </tr>
                                        <tr className="group bg-blue-50/30 dark:bg-primary/5 hover:bg-blue-50 dark:hover:bg-primary/10 transition-colors">
                                            <td className="px-6 py-6 text-sm text-slate-500">Oct 15, 2023</td>
                                            <td className="px-6 py-6">
                                                <div className="font-bold text-slate-900 dark:text-white">Chest X-Ray</div>
                                                <div className="text-xs text-slate-400">CPT: 71045</div>
                                            </td>
                                            <td className="px-6 py-6 max-w-xs">
                                                <div className="flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">info</span>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 italic font-medium">"Imaging of the lungs and heart. This was flagged for high insurance coverage."</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right font-bold text-slate-900 dark:text-white">$1,045.50</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* Flexible Payment Options */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-lg">
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Personalized Payment Plans</h3>
                                <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">AI GENERATED</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white dark:bg-card-dark border-2 border-primary rounded-2xl relative shadow-sm">
                                    <div className="absolute -top-3 right-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Most Popular</div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">0% Interest Installments</h4>
                                            <p className="text-sm text-slate-500">Spread over 6 months</p>
                                        </div>
                                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                                    </div>
                                    <div className="text-2xl font-extrabold mb-4 text-slate-900 dark:text-white">$206.75 <span className="text-sm font-normal text-slate-400">/ month</span></div>
                                    <button className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Apply Now</button>
                                </div>
                                <div className="p-6 bg-white dark:bg-card-dark border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm hover:border-primary/50 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">Extended Flexible Plan</h4>
                                            <p className="text-sm text-slate-500">Up to 12 months</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">trending_up</span>
                                    </div>
                                    <div className="text-2xl font-extrabold mb-4 text-slate-900 dark:text-white">$103.38 <span className="text-sm font-normal text-slate-400">/ month</span></div>
                                    <button className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold py-2.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Apply Now</button>
                                </div>
                            </div>
                        </section>

                        {/* One-Click Payment */}
                        <section className="bg-slate-900 dark:bg-[#111318] p-8 rounded-2xl text-white">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Secure One-Click Payment</h3>
                                    <p className="text-slate-400 text-sm">Choose your preferred secure checkout method.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <button className="bg-white text-black px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                        <span className="material-symbols-outlined">smartphone</span> Apple Pay
                                    </button>
                                    <button className="bg-white text-black px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
                                        <span className="material-symbols-outlined">touch_app</span> Google Pay
                                    </button>
                                    <button className="bg-primary text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors">
                                        <span className="material-symbols-outlined">account_balance</span> Bank Transfer
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar: AI Smart Assistant */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-white dark:bg-card-dark rounded-2xl shadow-sm border border-slate-100 dark:border-border-dark h-[600px] flex flex-col">
                                <div className="p-4 border-b border-slate-100 dark:border-border-dark flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">smart_toy</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">HealPay Smart Assistant</h4>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Chat Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300">
                                            Hi Sarah! I've reviewed your latest statement. Would you like me to explain why your insurance didn't cover the full cost of the X-ray?
                                        </div>
                                        <span className="text-[10px] text-slate-400 pl-1">Just now</span>
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[85%] ml-auto items-end">
                                        <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none text-sm">
                                            Yes, please explain how this matches my insurance EOB.
                                        </div>
                                        <span className="text-[10px] text-slate-400 pr-1">2m ago</span>
                                    </div>
                                    <div className="flex flex-col gap-1 max-w-[85%]">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-sm text-slate-700 dark:text-slate-300">
                                            Of course! Your EOB shows your deductible wasn't met. However, I found a 15% prompt-pay discount you're eligible for. Would you like to apply it?
                                        </div>
                                        <span className="text-[10px] text-slate-400 pl-1">1m ago</span>
                                    </div>
                                </div>
                                {/* Chat Input */}
                                <div className="p-4 border-t border-slate-100 dark:border-border-dark space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <button className="text-[10px] font-bold px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-primary/5 transition-colors text-primary">Apply Discount</button>
                                        <button className="text-[10px] font-bold px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-primary/5 transition-colors text-primary">Explain EOB</button>
                                    </div>
                                    <div className="relative">
                                        <input class="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 dark:text-white placeholder:text-slate-400" placeholder="Ask a question..." type="text" />
                                        <button className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-lg">
                                            <span class="material-symbols-outlined text-lg">send</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Trust Cards */}
                            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-4 rounded-xl flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <span class="material-symbols-outlined text-primary">shield_person</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Your data is encrypted</p>
                                    <p className="text-[10px] text-slate-500">256-bit AES protection active.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 dark:border-border-dark mt-12 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                        <span className="text-sm font-bold">HealPay AI</span>
                    </div>
                    <div className="flex gap-8 text-xs font-medium text-slate-400">
                        <a className="hover:text-primary" href="#">Privacy Policy</a>
                        <a className="hover:text-primary" href="#">Terms of Service</a>
                        <a className="hover:text-primary" href="#">HIPAA Compliance</a>
                        <a className="hover:text-primary" href="#">Accessibility Statement</a>
                    </div>
                    <p className="text-[10px] text-slate-400">© 2023 HealPay AI Revenue Systems. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}
