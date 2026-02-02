import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { cn } from '../../lib/utils';

export function ClaimsWorkQueue() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('errors'); // 'errors', 'ai_review', 'clean'
    const [selectedClaim, setSelectedClaim] = useState(null);

    useEffect(() => {
        const fetchClaims = async () => {
            try {
                const data = await api.claims.list();
                setClaims(data);
            } catch (error) {
                console.error("Failed to load claims", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClaims();
    }, []);

    // Categorize Claims
    const errorClaims = claims.filter(c => c.status === 'Denied' || c.status === 'Rejected');
    const aiReviewClaims = claims.filter(c => c.status === 'Submitted' && c.risk_score > 50);
    const cleanClaims = claims.filter(c => c.status === 'Paid' || (c.status === 'Submitted' && c.risk_score <= 50));

    const getActiveConfig = () => {
        switch (activeTab) {
            case 'ai_review': return { data: aiReviewClaims, label: 'Pending AI Review', color: 'text-amber-500', icon: 'auto_awesome' };
            case 'clean': return { data: cleanClaims, label: 'Clean Claims', color: 'text-emerald-500', icon: 'check_circle' };
            default: return { data: errorClaims, label: 'Errors Found', color: 'text-red-500', icon: 'error' };
        }
    };

    const activeConfig = getActiveConfig();

    // KPIs Calculation
    const cleanRate = ((cleanClaims.length / (claims.length || 1)) * 100).toFixed(1);
    const avgScrubTime = "4.2h"; // Mock metric for now

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-[#f6f8f8] dark:bg-[#102222] text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white p-6 overflow-hidden">
            {/* Heading & KPIs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Claim Validation Queue</h1>
                    <p className="text-slate-600 dark:text-[#9db9b9] text-base">Optimizing revenue cycle with AI-driven scrubbing and error detection.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <KPICard label="Clean Claim Rate" value={`${cleanRate}%`} trend="+2.1%" color="text-emerald-500" icon="trending_up" />
                    <KPICard label="Avg. Scrub Time" value={avgScrubTime} trend="-15%" color="text-orange-500" icon="trending_down" />

                    <div className="flex min-w-[140px] flex-col gap-1 rounded-xl p-4 border border-[#3b5454] bg-slate-100 dark:bg-transparent">
                        <p className="text-slate-500 dark:text-[#9db9b9] text-xs font-bold uppercase">Pending AI Review</p>
                        <div className="flex items-end gap-2">
                            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">{aiReviewClaims.length}</p>
                            {aiReviewClaims.length > 0 && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1 font-bold">New</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="flex items-center justify-between border-b border-[#3b5454] mb-6 shrink-0">
                <div className="flex gap-8">
                    <TabButton
                        isActive={activeTab === 'errors'}
                        onClick={() => setActiveTab('errors')}
                        icon="error"
                        label={`Errors Found (${errorClaims.length})`}
                        activeColor="border-red-500 text-red-500"
                    />
                    <TabButton
                        isActive={activeTab === 'ai_review'}
                        onClick={() => setActiveTab('ai_review')}
                        icon="auto_awesome"
                        label={`AI Review (${aiReviewClaims.length})`}
                        activeColor="border-amber-500 text-amber-500"
                    />
                    <TabButton
                        isActive={activeTab === 'clean'}
                        onClick={() => setActiveTab('clean')}
                        icon="check_circle"
                        label={`Clean Claims (${cleanClaims.length})`}
                        activeColor="border-emerald-500 text-emerald-500"
                    />
                </div>
                <div className="flex gap-2 pb-3">
                    <TableAction icon="filter_list" label="Filter" />
                    <TableAction icon="download" label="Export" />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-slate-100 dark:bg-[#111818] rounded-xl border border-[#3b5454] overflow-hidden flex flex-col flex-1 shadow-sm">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 bg-slate-200/50 dark:bg-[#283939]/90 backdrop-blur z-10 border-b border-[#3b5454]">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center"><input className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary" type="checkbox" /></th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Claim ID</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Patient</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Payer</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Amount</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Risk Score</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Status / Insight</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3b5454]/50">
                            {activeConfig.data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-[#9db9b9]">
                                        No claims found in this category.
                                    </td>
                                </tr>
                            ) : (
                                activeConfig.data.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-slate-200/30 dark:hover:bg-primary/5 transition-colors group">
                                        <td className="px-4 py-4 text-center"><input className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary" type="checkbox" /></td>
                                        <td className="px-4 py-4 font-mono text-xs font-bold text-primary">{claim.id}</td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{claim.patient.name}</div>
                                            <div className="text-[10px] text-[#9db9b9]">DOB: {claim.patient.dob}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-[#283939] text-xs font-medium">{claim.payer.name}</span>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-bold">${claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4">
                                            <RiskBar score={claim.risk_score} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <StatusBadge status={claim.status} insight={claim.ai_insight || claim.denial_code} />
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedClaim(claim)}
                                                className="p-1.5 rounded-lg border border-[#3b5454] text-[#9db9b9] hover:bg-primary hover:text-[#102222] transition-colors"
                                                title="Edit Claim"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Pagination (Visual Only) */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-200/20 dark:bg-[#283939]/20 border-t border-[#3b5454] shrink-0">
                    <p className="text-xs text-[#9db9b9]">Showing {activeConfig.data.length} records</p>
                    <div className="flex items-center gap-1">
                        <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#283939] text-slate-500 dark:text-white disabled:opacity-30" disabled><span className="material-symbols-outlined text-lg">chevron_left</span></button>
                        <button className="px-2.5 py-1 text-xs font-bold rounded bg-primary text-[#102222]">1</button>
                        <button className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#283939] text-slate-500 dark:text-white"><span className="material-symbols-outlined text-lg">chevron_right</span></button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#102222] border border-[#3b5454] w-full max-w-lg rounded-xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Claim {selectedClaim.id}</h3>
                            <button onClick={() => setSelectedClaim(null)} className="text-slate-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#9db9b9] uppercase mb-1">Status</label>
                                <select className="w-full bg-[#111818] border border-[#3b5454] rounded p-2 text-white">
                                    <option>Submitted</option>
                                    <option>Denied</option>
                                    <option>Paid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9db9b9] uppercase mb-1">Payer</label>
                                <input className="w-full bg-[#111818] border border-[#3b5454] rounded p-2 text-white" defaultValue={selectedClaim.payer} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#9db9b9] uppercase mb-1">AI Insight Override</label>
                                <textarea className="w-full bg-[#111818] border border-[#3b5454] rounded p-2 text-white h-24" defaultValue={selectedClaim.ai_insight}></textarea>
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end gap-3">
                            <button onClick={() => setSelectedClaim(null)} className="px-4 py-2 text-slate-400 hover:text-white font-bold text-sm">Cancel</button>
                            <button onClick={() => { alert('Saved!'); setSelectedClaim(null); }} className="px-6 py-2 bg-primary text-[#102222] font-bold rounded text-sm hover:bg-primary/90">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-components
function KPICard({ label, value, trend, color, icon }) {
    return (
        <div className="flex min-w-[140px] flex-col gap-1 rounded-xl p-4 border border-[#3b5454] bg-slate-100 dark:bg-transparent">
            <p className="text-slate-500 dark:text-[#9db9b9] text-xs font-bold uppercase">{label}</p>
            <div className="flex items-end gap-2">
                <p className="text-slate-900 dark:text-white text-2xl font-bold leading-none">{value}</p>
                <p className={`${color} text-xs font-bold pb-1 flex items-center`}>
                    <span className="material-symbols-outlined text-xs">{icon}</span>{trend}
                </p>
            </div>
        </div>
    );
}

function TabButton({ isActive, onClick, icon, label, activeColor }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 border-b-2 pb-3 font-bold text-sm tracking-wide transition-all",
                isActive ? activeColor : "border-transparent text-[#9db9b9] hover:text-white"
            )}
        >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
        </button>
    );
}

function TableAction({ icon, label }) {
    return (
        <button className="px-3 py-1.5 rounded bg-slate-200 dark:bg-[#283939] text-slate-700 dark:text-white text-xs font-bold flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-[#3b5454]">
            <span className="material-symbols-outlined text-xs">{icon}</span> {label}
        </button>
    );
}

function RiskBar({ score }) {
    let color = 'bg-emerald-500';
    let textColor = 'text-emerald-500';
    if (score > 50) { color = 'bg-orange-500'; textColor = 'text-orange-500'; }
    if (score > 80) { color = 'bg-red-500'; textColor = 'text-red-500'; }

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 w-16 bg-slate-200 dark:bg-[#283939] rounded-full overflow-hidden">
                <div className={`${color} h-full`} style={{ width: `${score}%` }}></div>
            </div>
            <span className={`text-xs font-bold ${textColor}`}>{score}%</span>
        </div>
    );
}

function StatusBadge({ status, insight }) {
    if (status === 'Denied' || status === 'Rejected') {
        return <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><span className="material-symbols-outlined text-sm">warning</span> {insight || 'Denial'}</span>;
    }
    if (status === 'Submitted') {
        return <span className="flex items-center gap-1 text-xs text-orange-500 font-medium"><span className="material-symbols-outlined text-sm">auto_awesome</span> {insight || 'Under Review'}</span>;
    }
    return <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><span className="material-symbols-outlined text-sm">check_circle</span> Clean</span>;
}

