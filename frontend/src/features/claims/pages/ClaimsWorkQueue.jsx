import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../services/api';
import { cn } from '../../../lib/utils';
import { ClaimsFilterPanel } from '../components/ClaimsFilterPanel';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'; // Assuming recharts is installed

// Mock Sparkline Data
const generateSparklineData = () => Array.from({ length: 10 }, (_, i) => ({ value: Math.floor(Math.random() * 50) + 20 }));

export function ClaimsWorkQueue() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('errors'); // 'errors', 'ai_review', 'clean'
    const [selectedClaim, setSelectedClaim] = useState(null);

    // 2.0 State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({ payer: 'all', minValue: 0 });
    const [sortConfig, setSortConfig] = useState({ key: 'amount', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState(new Set());

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

    // Filter Logic
    const filteredClaims = useMemo(() => {
        let result = claims;

        // 1. Tab Filter
        if (activeTab === 'errors') result = result.filter(c => c.status === 'Denied' || c.status === 'Rejected');
        else if (activeTab === 'ai_review') result = result.filter(c => c.status === 'Submitted' && c.risk_score > 50);
        else if (activeTab === 'clean') result = result.filter(c => c.status === 'Paid' || (c.status === 'Submitted' && c.risk_score <= 50));

        // 2. Advanced Filters
        if (filters.payer !== 'all') result = result.filter(c => c.payer.name.includes(filters.payer));
        if (filters.minValue) result = result.filter(c => c.amount >= Number(filters.minValue));

        // 3. Sorting
        return result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [claims, activeTab, filters, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredClaims.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredClaims.map(c => c.id)));
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleBatchAction = () => {
        if (selectedIds.size === 0) return;
        alert(`Submit Batch: Processing ${selectedIds.size} claims...`);
        setSelectedIds(new Set());
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full bg-[#f6f8f8] dark:bg-[#102222] text-slate-500">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f8f8] dark:bg-[#102222] text-slate-900 dark:text-white p-6 relative">
            <ClaimsFilterPanel
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApplyFilters={setFilters}
            />

            {/* Header with Sparklines */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 shrink-0">
                <div className="lg:col-span-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Work Queue</h1>
                    <p className="text-slate-600 dark:text-[#9db9b9] text-sm mt-1">
                        Active Batch: <span className="font-mono font-bold text-primary">BATCH-2023-A</span>
                    </p>
                    <div className="mt-4 flex gap-2">
                        <button
                            disabled={selectedIds.size === 0}
                            onClick={handleBatchAction}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-[#102222] px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">send</span>
                            Batch Submit ({selectedIds.size})
                        </button>
                    </div>
                </div>

                <KPISparkline label="Throughput" value="142" trend="+12%" color="#10b981" />
                <KPISparkline label="Error Rate" value="4.2%" trend="-0.5%" color="#f59e0b" />
                <KPISparkline label="Avg Age" value="12d" trend="-2d" color="#3b82f6" />
            </div>

            {/* Tabs & Controls */}
            <div className="flex items-center justify-between border-b border-[#3b5454] mb-6 shrink-0 sticky top-0 z-20 bg-[#f6f8f8]/90 dark:bg-[#102222]/90 backdrop-blur py-2">
                <div className="flex gap-8">
                    <TabButton isActive={activeTab === 'errors'} onClick={() => setActiveTab('errors')} icon="error" label="Errors" count={claims.filter(c => c.status === 'Denied').length} color="text-red-500" />
                    <TabButton isActive={activeTab === 'ai_review'} onClick={() => setActiveTab('ai_review')} icon="auto_awesome" label="AI Review" count={claims.filter(c => c.status === 'Submitted').length} color="text-amber-500" />
                    <TabButton isActive={activeTab === 'clean'} onClick={() => setActiveTab('clean')} icon="check_circle" label="Clean" count={claims.filter(c => c.status === 'Paid').length} color="text-emerald-500" />
                </div>
                <div className="flex gap-2 pb-3">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={`px-3 py-1.5 rounded bg-slate-200 dark:bg-[#283939] text-slate-700 dark:text-white text-xs font-bold flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-[#3b5454] transition-colors ${filters.payer !== 'all' ? 'ring-2 ring-primary' : ''}`}
                    >
                        <span className="material-symbols-outlined text-xs">filter_list</span>
                        Filter {filters.payer !== 'all' && '(Active)'}
                    </button>
                    <button onClick={() => setSortConfig({ key: 'amount', direction: 'desc' })} className="px-3 py-1.5 rounded bg-slate-200 dark:bg-[#283939] text-slate-700 dark:text-white text-xs font-bold flex items-center gap-1 hover:bg-slate-300 dark:hover:bg-[#3b5454]">
                        <span className="material-symbols-outlined text-xs">sort</span> Smart Sort
                    </button>
                </div>
            </div>

            {/* Data Grid 2.0 */}
            <div className="bg-slate-100 dark:bg-[#111818] rounded-xl border border-[#3b5454] overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="sticky top-0 bg-slate-200/50 dark:bg-[#283939]/90 backdrop-blur z-10 border-b border-[#3b5454]">
                            <tr>
                                <th className="px-4 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary cursor-pointer"
                                        checked={selectedIds.size === filteredClaims.length && filteredClaims.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <SortHeader label="Claim ID" sortKey="id" currentSort={sortConfig} onSort={handleSort} />
                                <SortHeader label="Patient" sortKey="patient.name" currentSort={sortConfig} onSort={handleSort} />
                                <SortHeader label="Payer" sortKey="payer.name" currentSort={sortConfig} onSort={handleSort} />
                                <SortHeader label="Amount" sortKey="amount" currentSort={sortConfig} onSort={handleSort} />
                                <SortHeader label="Risk Score" sortKey="risk_score" currentSort={sortConfig} onSort={handleSort} />
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9]">Insight</th>
                                <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9] text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3b5454]/50">
                            {filteredClaims.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-500 dark:text-[#9db9b9]">
                                        No claims match current filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredClaims.map((claim) => (
                                    <tr
                                        key={claim.id}
                                        className={`hover:bg-slate-200/30 dark:hover:bg-primary/5 transition-colors group ${selectedIds.has(claim.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-[#3b5454] bg-transparent text-primary focus:ring-primary cursor-pointer"
                                                checked={selectedIds.has(claim.id)}
                                                onChange={() => toggleSelect(claim.id)}
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-mono text-xs font-bold text-primary">{claim.id}</td>
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{claim.patient.name}</div>
                                            <div className="text-[10px] text-[#9db9b9]">{claim.patient.dob}</div>
                                        </td>
                                        <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{claim.payer.name}</td>
                                        <td className="px-4 py-4 text-sm font-bold">${claim.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-4">
                                            <RiskTag score={claim.risk_score} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <SmartBadge claim={claim} />
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button onClick={() => setSelectedClaim(claim)} className="text-[#9db9b9] hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-lg">edit_note</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- Sub-components ---

function SortHeader({ label, sortKey, currentSort, onSort }) {
    const isActive = currentSort.key === sortKey;
    return (
        <th
            className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-[#9db9b9] cursor-pointer hover:text-white transition-colors select-none"
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                {isActive && (
                    <span className="material-symbols-outlined text-xs">
                        {currentSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                )}
            </div>
        </th>
    );
}

function KPISparkline({ label, value, trend, color }) {
    const data = useMemo(generateSparklineData, []);
    return (
        <div className="bg-slate-100 dark:bg-[#111818]/50 border border-[#3b5454] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="z-10">
                <p className="text-[#9db9b9] text-xs font-bold uppercase">{label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{value}</h3>
                    <span className="text-xs font-bold" style={{ color }}>{trend}</span>
                </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#grad-${label})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function TabButton({ isActive, onClick, icon, label, count, color }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 border-b-2 pb-3 font-bold text-sm tracking-wide transition-all",
                isActive ? `border-current ${color}` : "border-transparent text-[#9db9b9] hover:text-white"
            )}
        >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
            <span className="ml-1 bg-slate-200 dark:bg-[#283939] text-xs px-1.5 py-0.5 rounded text-slate-600 dark:text-white">{count}</span>
        </button>
    );
}

function RiskTag({ score }) {
    const colorClass = score > 80 ? 'bg-red-500/20 text-red-400' : score > 50 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400';
    return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${colorClass}`}>
            {score}% Risk
        </span>
    );
}

function SmartBadge({ claim }) {
    if (claim.amount > 5000) return <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">High Value</span>;
    if (claim.risk_score < 20) return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">Auto-Approve</span>;
    return <span className="text-[10px] font-bold text-slate-500">{claim.denial_code || '-'}</span>;
}

