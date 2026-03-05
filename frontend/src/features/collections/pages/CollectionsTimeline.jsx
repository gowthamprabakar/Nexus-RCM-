import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockARData } from '../data/mockARData';

export function CollectionsTimeline() {
    const navigate = useNavigate();
    const timeline = mockARData.comprehensiveTimeline;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterUser, setFilterUser] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDateTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getActivityIcon = (type) => {
        const icons = {
            call: 'call',
            email: 'email',
            payment: 'payments',
            status_change: 'edit_note',
            escalation: 'arrow_upward',
            settlement: 'handshake'
        };
        return icons[type] || 'event';
    };

    const getActivityColor = (type) => {
        const colors = {
            call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            email: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            payment: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            status_change: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
            escalation: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            settlement: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
        };
        return colors[type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    };

    const getOutcomeBadgeColor = (outcome) => {
        const positive = ['PTP', 'PAID', 'PARTIAL', 'PLAN', 'sent', 'offered'];
        const negative = ['REFUSED', 'DISPUTE', 'WRONG_NUM', 'DISC'];

        if (positive.includes(outcome)) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (negative.includes(outcome)) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    };

    // Filter timeline
    const filteredTimeline = timeline.filter(activity => {
        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                activity.patientName.toLowerCase().includes(searchLower) ||
                activity.accountId.toLowerCase().includes(searchLower) ||
                activity.details.toLowerCase().includes(searchLower) ||
                activity.user.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Type filter
        if (filterType !== 'all' && activity.type !== filterType) return false;

        // User filter
        if (filterUser !== 'all' && activity.user !== filterUser) return false;

        // Date filters
        if (startDate && new Date(activity.timestamp) < new Date(startDate)) return false;
        if (endDate && new Date(activity.timestamp) > new Date(endDate)) return false;

        return true;
    });

    // Get unique users for filter
    const uniqueUsers = [...new Set(timeline.map(a => a.user))].filter(Boolean).sort();

    const handleExport = () => {
        // In a real app, this would generate CSV
        alert('Exporting timeline to CSV...');
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span onClick={() => navigate('/collections')} className="hover:text-primary cursor-pointer">Collections Hub</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span>Activity Timeline</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collections Activity Timeline</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Complete audit trail of all collection activities
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Export CSV</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">filter_alt</span>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Filters</h2>
                </div>

                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Search
                    </label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by account, patient, user, or notes..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Activity Type
                        </label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="all">All Types</option>
                            <option value="call">Calls</option>
                            <option value="email">Emails</option>
                            <option value="payment">Payments</option>
                            <option value="status_change">Status Changes</option>
                            <option value="escalation">Escalations</option>
                            <option value="settlement">Settlements</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            User
                        </label>
                        <select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="all">All Users</option>
                            {uniqueUsers.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Active Filters Summary */}
                {(searchTerm || filterType !== 'all' || filterUser !== 'all' || startDate || endDate) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Active filters:</span>
                        <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                    Search: "{searchTerm}"
                                </span>
                            )}
                            {filterType !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                    Type: {filterType}
                                </span>
                            )}
                            {filterUser !== 'all' && (
                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                    User: {filterUser}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterType('all');
                                    setFilterUser('all');
                                    setStartDate('');
                                    setEndDate('');
                                }}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                            >
                                Clear all
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between px-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing {filteredTimeline.length} of {timeline.length} activities
                </p>
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <div className="space-y-4">
                    {filteredTimeline.map((activity, index) => (
                        <div key={activity.id} className="relative">
                            {/* Timeline Line */}
                            {index < filteredTimeline.length - 1 && (
                                <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                            )}

                            <div className="flex gap-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                                    <span className="material-symbols-outlined">{getActivityIcon(activity.type)}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-6">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                                                    {activity.type.replace('_', ' ')}
                                                </h3>
                                                {activity.outcome && (
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOutcomeBadgeColor(activity.outcome)}`}>
                                                        {activity.disposition || activity.outcome}
                                                    </span>
                                                )}
                                                {activity.duration && (
                                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                                        {activity.duration.toFixed(1)} min
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {formatDateTime(activity.timestamp)} • {activity.user}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/collections/account/${activity.accountId}`)}
                                            className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                                        >
                                            <span>{activity.accountId}</span>
                                            <span className="material-symbols-outlined text-xs">arrow_forward</span>
                                        </button>
                                    </div>

                                    {/* Patient Info */}
                                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                                        <span className="font-medium">{activity.patient}</span>
                                        {activity.amount && <span className="text-primary ml-2">{formatCurrency(activity.amount)}</span>}
                                    </p>

                                    {/* Notes */}
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                        {activity.details}
                                    </p>

                                    {/* Additional Details */}
                                    {(activity.template || activity.subject || activity.nextFollowUp || activity.escalatedTo) && (
                                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1 text-sm">
                                            {activity.template && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Template:</span> {activity.template}
                                                </p>
                                            )}
                                            {activity.subject && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Subject:</span> {activity.subject}
                                                </p>
                                            )}
                                            {activity.nextFollowUp && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Follow-up:</span> {formatDateTime(activity.nextFollowUp)}
                                                </p>
                                            )}
                                            {activity.escalatedTo && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Escalated to:</span> {activity.escalatedTo}
                                                </p>
                                            )}
                                            {activity.settlementAmount && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Settlement:</span> {formatCurrency(activity.settlementAmount)} ({activity.discountPercent}% discount)
                                                </p>
                                            )}
                                            {activity.oldStatus && (
                                                <p className="text-slate-600 dark:text-slate-400">
                                                    <span className="font-medium">Status Change:</span> {activity.oldStatus} → {activity.newStatus}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {activity.tags && activity.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {activity.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredTimeline.length === 0 && (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">search_off</span>
                        <p className="text-slate-600 dark:text-slate-400">No activities found matching your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}
