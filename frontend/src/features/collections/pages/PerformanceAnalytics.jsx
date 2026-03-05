import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockARData } from '../data/mockARData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export function PerformanceAnalytics() {
    const navigate = useNavigate();
    const users = mockARData.userPerformanceMetrics;
    const teamMetrics = mockARData.teamMetrics;

    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedMetric, setSelectedMetric] = useState('revenue');
    const [dateRange, setDateRange] = useState('month');

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    };

    const formatPercent = (value) => {
        return `${(value * 100).toFixed(0)}%`;
    };

    // Sort users by selected metric
    const getSortedUsers = () => {
        const metricMap = {
            revenue: 'totalRevenue',
            resolution: 'resolutionRate',
            efficiency: 'avgResolutionDays'
        };

        return [...users].sort((a, b) => {
            const metric = metricMap[selectedMetric];
            if (selectedMetric === 'efficiency') {
                return a.metrics[metric] - b.metrics[metric]; // Lower is better
            }
            return b.metrics[metric] - a.metrics[metric]; // Higher is better
        });
    };

    const getMetricColor = (index) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        return colors[index % colors.length];
    };

    const getRankBadgeColor = (rank) => {
        switch (rank) {
            case 1: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case 2: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
            case 3: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            default: return 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span onClick={() => navigate('/collections')} className="hover:text-primary cursor-pointer">Collections Hub</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <span>Performance Analytics</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Performance Analytics</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Track individual and team collection performance metrics
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span>Export Report</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Team Member
                        </label>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="all">All Team Members</option>
                            {users.map(user => (
                                <option key={user.userId} value={user.userId}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Primary Metric
                        </label>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="revenue">Total Revenue</option>
                            <option value="resolution">Resolution Rate</option>
                            <option value="efficiency">Avg Resolution Time</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Date Range
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                        >
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Team Overview KPIs */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400">trending_up</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(teamMetrics.overall.totalRevenue)}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">+12% vs last month</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Accounts Resolved</span>
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">check_circle</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{teamMetrics.overall.totalAccountsResolved}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">of {teamMetrics.overall.totalAccountsAssigned} assigned</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Avg Resolution Rate</span>
                        <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">speed</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPercent(teamMetrics.overall.avgResolutionRate)}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">+3% improvement</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Contacts</span>
                        <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">call</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{teamMetrics.overall.totalCallsMade + teamMetrics.overall.totalEmailsSent}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{teamMetrics.overall.totalCallsMade} calls, {teamMetrics.overall.totalEmailsSent} emails</p>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">leaderboard</span>
                    Performance Leaderboard
                </h2>
                <div className="space-y-3">
                    {getSortedUsers().map((user, index) => (
                        <div key={user.userId} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(index + 1)}`}>
                                #{index + 1}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                                {user.avatar}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{user.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    {selectedMetric === 'revenue' && formatCurrency(user.metrics.totalRevenue)}
                                    {selectedMetric === 'resolution' && formatPercent(user.metrics.resolutionRate)}
                                    {selectedMetric === 'efficiency' && `${user.metrics.avgResolutionDays.toFixed(1)} days`}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {user.metrics.accountsResolved} accounts resolved
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div className="text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Calls/Day</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{user.metrics.callsPerDay.toFixed(1)}</p>
                                </div>
                                <div className="text-center px-3 py-2 bg-white dark:bg-slate-800 rounded-lg">
                                    <p className="text-xs text-slate-600 dark:text-slate-400">Success Rate</p>
                                    <p className="font-semibold text-slate-900 dark:text-white">{formatPercent(user.metrics.successRateByAction.call)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Weekly Trends Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Weekly Revenue Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="week" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value) => formatCurrency(value)}
                        />
                        <Legend />
                        {users.map((user, index) => (
                            <Line
                                key={user.userId}
                                data={user.weeklyTrend}
                                type="monotone"
                                dataKey="revenue"
                                name={user.name}
                                stroke={getMetricColor(index)}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Activity Heatmap */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Activity Heatmap - Calls by Day/Hour</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamMetrics.activityHeatmap}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="hour" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend />
                        <Bar dataKey="calls" fill="#3b82f6" name="Calls" />
                        <Bar dataKey="emails" fill="#10b981" name="Emails" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Individual Metrics Grid */}
            <div className="grid grid-cols-2 gap-6">
                {users.map(user => (
                    <div key={user.userId} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                                {user.avatar}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{user.role}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Resolution Rate</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPercent(user.metrics.resolutionRate)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg Days</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{user.metrics.avgResolutionDays.toFixed(1)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Revenue/Account</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(user.metrics.revenuePerAccount)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Contact Rate</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{formatPercent(user.metrics.contactAttemptRate)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Team Monthly Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={teamMetrics.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                        <XAxis dataKey="month" stroke="#64748b" />
                        <YAxis yAxisId="left" stroke="#64748b" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            formatter={(value, name) => {
                                if (name === 'Revenue') return formatCurrency(value);
                                if (name === 'Avg Days') return `${value} days`;
                                return value;
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
                        <Bar yAxisId="right" dataKey="accounts" fill="#10b981" name="Accounts" />
                        <Line yAxisId="right" type="monotone" dataKey="avgDays" stroke="#f59e0b" name="Avg Days" strokeWidth={2} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
