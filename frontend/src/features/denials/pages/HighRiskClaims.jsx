import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockDenialData } from '../data/mockDenialData';
import { RiskScoreBadge } from '../components/RiskScoreBadge';

export function HighRiskClaims() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'riskScore', direction: 'desc' });
    const [filterPayer, setFilterPayer] = useState('all');
    const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'all');
    const [expandedRows, setExpandedRows] = useState(new Set()); // Track expanded rows by ID

    const claims = mockDenialData.highRiskClaims;
    const uniquePayers = [...new Set(claims.map(c => c.payer))];
    const uniqueCategories = ['Authorization', 'Eligibility', 'Coding', 'COB', 'EVV'];

    // Update filter if URL param changes
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setFilterCategory(categoryParam);
        }
    }, [searchParams]);

    const toggleRowCheck = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Filter Logic
    const filteredClaims = claims.filter(claim => {
        const matchesSearch =
            claim.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            claim.topFactor.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPayer = filterPayer === 'all' || claim.payer === filterPayer;
        const matchesCategory = filterCategory === 'all' || claim.category === filterCategory;

        return matchesSearch && matchesPayer && matchesCategory;
    });

    // Sort Logic
    const sortedClaims = [...filteredClaims].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return 'unfold_more';
        return sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more';
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark font-sans h-full">
            <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">High-Risk Claims Worklist</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Pre-submission claims flagged for potential denial.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-slate-200 dark:border-border-dark shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[240px]">
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Search by Patient, ID, or Reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    <div className="w-48">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-48">
                        <select
                            value={filterPayer}
                            onChange={(e) => setFilterPayer(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Payers</option>
                            {uniquePayers.map(payer => (
                                <option key={payer} value={payer}>{payer}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Claims Table */}
                <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4 w-10"></th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('id')}>
                                        <div className="flex items-center gap-1">Claim ID / Patient <span className="material-symbols-outlined text-sm">{getSortIcon('id')}</span></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('serviceDate')}>
                                        <div className="flex items-center gap-1">Service Date <span className="material-symbols-outlined text-sm">{getSortIcon('serviceDate')}</span></div>
                                    </th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('payer')}>
                                        <div className="flex items-center gap-1">Payer <span className="material-symbols-outlined text-sm">{getSortIcon('payer')}</span></div>
                                    </th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('riskScore')}>
                                        <div className="flex items-center gap-1">Predicted Risk <span className="material-symbols-outlined text-sm">{getSortIcon('riskScore')}</span></div>
                                    </th>
                                    <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-1">Value <span className="material-symbols-outlined text-sm">{getSortIcon('amount')}</span></div>
                                    </th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {sortedClaims.map(claim => (
                                    <React.Fragment key={claim.id}>
                                        <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${expandedRows.has(claim.id) ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleRowCheck(claim.id)}
                                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {expandedRows.has(claim.id) ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{claim.id}</div>
                                                <div className="text-xs text-slate-500">{claim.patient} • {claim.mrn}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {claim.serviceDate}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                {claim.payer}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                    {claim.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <RiskScoreBadge score={claim.riskScore} />
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                                                ${claim.amount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Quick Actions */}
                                                    <button
                                                        title="Snooze"
                                                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">snooze</span>
                                                    </button>
                                                    <button
                                                        title="Quick Fix"
                                                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">auto_fix_high</span>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/denials/claim/${claim.id}`)}
                                                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-lg transition-colors"
                                                    >
                                                        Analyze
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Expanded Row Content: Line Items Preview */}
                                        {expandedRows.has(claim.id) && (
                                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                                <td colSpan="8" className="px-6 py-4 pl-16">
                                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                                                                <tr>
                                                                    <th className="px-4 py-2 text-left">Code</th>
                                                                    <th className="px-4 py-2 text-left">Description</th>
                                                                    <th className="px-4 py-2 text-left">Issue</th>
                                                                    <th className="px-4 py-2 text-right">Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                {claim.lineItems?.map((item, idx) => (
                                                                    <tr key={idx} className={item.risk === 'High' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                                                        <td className="px-4 py-2 font-medium">{item.code}</td>
                                                                        <td className="px-4 py-2">{item.description}</td>
                                                                        <td className="px-4 py-2 text-red-600 dark:text-red-400 font-medium">
                                                                            {item.issue || '-'}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-right font-mono">${item.amount}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                            <span className="text-xs text-slate-500">
                                                                AI Recommendation: <span className="font-semibold text-slate-700 dark:text-slate-300">{claim.automatedAction}</span>
                                                            </span>
                                                            <button
                                                                onClick={() => navigate(`/denials/claim/${claim.id}`)}
                                                                className="text-xs text-primary font-bold hover:underline"
                                                            >
                                                                View Full Claim Details
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Mock */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-border-dark flex justify-between items-center text-sm text-slate-500">
                        <span>Showing {sortedClaims.length} items</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Previous</button>
                            <button className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700">Next</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
