import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle } from '../../../lib/chartTheme';

export function PerformanceAnalytics() {
 const navigate = useNavigate();
 const [users, setUsers] = useState([]);
 const [teamMetrics, setTeamMetrics] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   let cancelled = false;
   async function fetchData() {
     setLoading(true);
     const [perfRes, teamRes] = await Promise.all([
       api.collections.getUserPerformance(),
       api.collections.getTeamMetrics(),
     ]);
     if (!cancelled) {
       setUsers(perfRes?.users || perfRes || []);
       setTeamMetrics(teamRes);
       setLoading(false);
     }
   }
   fetchData();
   return () => { cancelled = true; };
 }, []);

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

 const colors = getSeriesColors();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const getMetricColor = (index) => {
 return colors[index % colors.length];
 };

 const getRankBadgeColor = (rank) => {
 switch (rank) {
 case 1: return 'bg-yellow-900/30 text-yellow-300';
 case 2: return 'bg-th-surface-overlay text-th-heading';
 case 3: return 'bg-orange-900/30 text-orange-300';
 default: return 'bg-th-surface-overlay text-th-secondary';
 }
 };

 if (loading) {
   return (
     <div className="flex-1 flex items-center justify-center h-full p-6">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
     </div>
   );
 }

 if (!teamMetrics) {
   return (
     <div className="flex-1 flex flex-col items-center justify-center h-full gap-4 p-6">
       <span className="material-symbols-outlined text-6xl text-th-muted">bar_chart_off</span>
       <p className="text-th-secondary">Performance data not available.</p>
       <button onClick={() => navigate('/collections')} className="px-4 py-2 bg-primary text-white rounded-lg">Back to Collections</button>
     </div>
   );
 }

 return (
 <div className="p-6 space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 text-sm text-th-secondary mb-2">
 <span onClick={() => navigate('/collections')} className="hover:text-primary cursor-pointer">Collections Hub</span>
 <span className="material-symbols-outlined text-xs">chevron_right</span>
 <span>Performance Analytics</span>
 </div>
 <div className="flex items-center gap-3">
 <h1 className="text-2xl font-bold text-th-heading">Team Performance Analytics</h1>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <p className="text-th-secondary mt-1">
 Track individual and team collection performance metrics
 </p>
 </div>
 <div className="flex gap-3">
 <button className="flex items-center gap-2 px-4 py-2 bg-th-surface-raised border border-th-border text-th-heading rounded-lg hover:bg-th-surface-overlay transition-colors">
 <span className="material-symbols-outlined text-sm">download</span>
 <span>Export Report</span>
 </button>
 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-th-heading rounded-lg hover:bg-blue-700 transition-colors">
 <span className="material-symbols-outlined text-sm">refresh</span>
 <span>Refresh</span>
 </button>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border p-4">
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">
 Team Member
 </label>
 <select
 value={selectedUser}
 onChange={(e) => setSelectedUser(e.target.value)}
 className="w-full px-4 py-2 bg-th-surface-base border border-th-border rounded-lg text-th-heading"
 >
 <option value="all">All Team Members</option>
 {users.map(user => (
 <option key={user.userId} value={user.userId}>{user.name}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">
 Primary Metric
 </label>
 <select
 value={selectedMetric}
 onChange={(e) => setSelectedMetric(e.target.value)}
 className="w-full px-4 py-2 bg-th-surface-base border border-th-border rounded-lg text-th-heading"
 >
 <option value="revenue">Total Revenue</option>
 <option value="resolution">Resolution Rate</option>
 <option value="efficiency">Avg Resolution Time</option>
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold uppercase tracking-wider text-th-muted mb-2">
 Date Range
 </label>
 <select
 value={dateRange}
 onChange={(e) => setDateRange(e.target.value)}
 className="w-full px-4 py-2 bg-th-surface-base border border-th-border rounded-lg text-th-heading"
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
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-6 border-l-[3px] border-l-blue-500">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Revenue</span>
 <span className="material-symbols-outlined text-green-400">trending_up</span>
 </div>
 <p className="text-2xl font-bold text-th-heading tabular-nums">{formatCurrency(teamMetrics?.overall.totalRevenue)}</p>
 <p className="text-xs text-green-400 mt-1 tabular-nums">{teamMetrics?.overall.totalRevenue ? 'Current period' : '--'}</p>
 </div>
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-6 border-l-[3px] border-l-emerald-500">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Accounts Resolved</span>
 <span className="material-symbols-outlined text-blue-400">check_circle</span>
 </div>
 <p className="text-2xl font-bold text-th-heading tabular-nums">{teamMetrics?.overall.totalAccountsResolved}</p>
 <p className="text-xs text-th-secondary mt-1 tabular-nums">of {teamMetrics?.overall.totalAccountsAssigned} assigned</p>
 </div>
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-6 border-l-[3px] border-l-purple-500">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Avg Resolution Rate</span>
 <span className="material-symbols-outlined text-purple-400">speed</span>
 </div>
 <p className="text-2xl font-bold text-th-heading tabular-nums">{formatPercent(teamMetrics?.overall.avgResolutionRate)}</p>
 <p className="text-xs text-green-400 mt-1 tabular-nums">+3% improvement</p>
 </div>
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-6 border-l-[3px] border-l-amber-500">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-th-muted">Total Contacts</span>
 <span className="material-symbols-outlined text-orange-400">call</span>
 </div>
 <p className="text-2xl font-bold text-th-heading tabular-nums">{teamMetrics?.overall.totalCallsMade + teamMetrics?.overall.totalEmailsSent}</p>
 <p className="text-xs text-th-secondary mt-1 tabular-nums">{teamMetrics?.overall.totalCallsMade} calls, {teamMetrics?.overall.totalEmailsSent} emails</p>
 </div>
 </div>

 {/* Leaderboard */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border p-6">
 <h2 className="text-lg font-semibold text-th-heading mb-4 flex items-center gap-2">
 <span className="material-symbols-outlined text-primary">leaderboard</span>
 Performance Leaderboard
 </h2>
 <div className="space-y-3">
 {getSortedUsers().map((user, index) => (
 <div key={user.userId} className="flex items-center gap-4 p-4 bg-th-surface-base/50 rounded-lg hover:bg-th-surface-overlay transition-colors">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(index + 1)}`}>
 #{index + 1}
 </div>
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-th-heading font-bold">
 {user.avatar}
 </div>
 <div className="flex-1">
 <p className="font-semibold text-th-heading">{user.name}</p>
 <p className="text-sm text-th-secondary">{user.role}</p>
 </div>
 <div className="text-right">
 <p className="font-bold text-th-heading tabular-nums">
 {selectedMetric === 'revenue' && formatCurrency(user.metrics.totalRevenue)}
 {selectedMetric === 'resolution' && formatPercent(user.metrics.resolutionRate)}
 {selectedMetric === 'efficiency' && `${user.metrics.avgResolutionDays.toFixed(1)} days`}
 </p>
 <p className="text-sm text-th-secondary tabular-nums">
 {user.metrics.accountsResolved} accounts resolved
 </p>
 </div>
 <div className="flex gap-2">
 <div className="text-center px-3 py-2 bg-th-surface-overlay rounded-lg">
 <p className="text-xs text-th-secondary">Calls/Day</p>
 <p className="font-semibold text-th-heading tabular-nums">{user.metrics.callsPerDay.toFixed(1)}</p>
 </div>
 <div className="text-center px-3 py-2 bg-th-surface-overlay rounded-lg">
 <p className="text-xs text-th-secondary">Success Rate</p>
 <p className="font-semibold text-th-heading tabular-nums">{formatPercent(user.metrics.successRateByAction.call)}</p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Weekly Trends Chart */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border p-6">
 <div className="flex items-center gap-3 mb-4">
 <h2 className="text-lg font-semibold text-th-heading">Weekly Revenue Trends</h2>
 <span className="ai-descriptive">Descriptive AI</span>
 </div>
 <ResponsiveContainer width="100%" height={300}>
 <LineChart>
 <CartesianGrid {...gridProps} />
 <XAxis dataKey="week" {...axisProps} />
 <YAxis {...axisProps} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
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
 <div className="bg-th-surface-raised rounded-xl border border-th-border p-6">
 <div className="flex items-center gap-3 mb-4">
 <h2 className="text-lg font-semibold text-th-heading">Activity Heatmap - Calls by Day/Hour</h2>
 <span className="ai-diagnostic">Diagnostic AI</span>
 </div>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={teamMetrics?.activityHeatmap || []}>
 <CartesianGrid {...gridProps} />
 <XAxis dataKey="hour" {...axisProps} />
 <YAxis {...axisProps} />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
 />
 <Legend />
 <Bar dataKey="calls" fill={colors[0]} name="Calls" />
 <Bar dataKey="emails" fill={colors[1]} name="Emails" />
 </BarChart>
 </ResponsiveContainer>
 </div>

 {/* Individual Metrics Grid */}
 <div className="grid grid-cols-2 gap-6">
 {users.map(user => (
 <div key={user.userId} className="bg-th-surface-raised rounded-lg border border-th-border p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-th-heading font-bold">
 {user.avatar}
 </div>
 <div>
 <p className="font-semibold text-th-heading">{user.name}</p>
 <p className="text-sm text-th-secondary">{user.role}</p>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 bg-th-surface-base/50 rounded-lg">
 <p className="text-xs text-th-secondary mb-1">Resolution Rate</p>
 <p className="text-lg font-bold text-th-heading tabular-nums">{formatPercent(user.metrics.resolutionRate)}</p>
 </div>
 <div className="p-3 bg-th-surface-base/50 rounded-lg">
 <p className="text-xs text-th-secondary mb-1">Avg Days</p>
 <p className="text-lg font-bold text-th-heading tabular-nums">{user.metrics.avgResolutionDays.toFixed(1)}</p>
 </div>
 <div className="p-3 bg-th-surface-base/50 rounded-lg">
 <p className="text-xs text-th-secondary mb-1">Revenue/Account</p>
 <p className="text-lg font-bold text-th-heading tabular-nums">{formatCurrency(user.metrics.revenuePerAccount)}</p>
 </div>
 <div className="p-3 bg-th-surface-base/50 rounded-lg">
 <p className="text-xs text-th-secondary mb-1">Contact Rate</p>
 <p className="text-lg font-bold text-th-heading tabular-nums">{formatPercent(user.metrics.contactAttemptRate)}</p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Monthly Trends */}
 <div className="bg-th-surface-raised rounded-xl border border-th-border p-6">
 <div className="flex items-center gap-3 mb-4">
 <h2 className="text-lg font-semibold text-th-heading">Team Monthly Trends</h2>
 <span className="ai-diagnostic">Diagnostic AI</span>
 </div>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={teamMetrics?.monthlyTrends || []}>
 <CartesianGrid {...gridProps} />
 <XAxis dataKey="month" {...axisProps} />
 <YAxis yAxisId="left" {...axisProps} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
 <YAxis yAxisId="right" orientation="right" {...axisProps} />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
 formatter={(value, name) => {
 if (name === 'Revenue') return formatCurrency(value);
 if (name === 'Avg Days') return `${value} days`;
 return value;
 }}
 />
 <Legend />
 <Bar yAxisId="left" dataKey="revenue" fill={colors[0]} name="Revenue" />
 <Bar yAxisId="right" dataKey="accounts" fill={colors[1]} name="Accounts" />
 <Line yAxisId="right" type="monotone" dataKey="avgDays" stroke={colors[2]} name="Avg Days" strokeWidth={2} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}
