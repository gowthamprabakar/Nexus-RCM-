import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function CollectionVelocityChart({ data, onPayerClick }) {
    const getPerformanceColor = (performance) => {
        const colors = {
            'excellent': '#10b981',
            'good': '#10b981',
            'fair': '#f59e0b',
            'poor': '#f97316',
            'critical': '#ef4444'
        };
        return colors[performance] || '#64748b';
    };

    const chartData = data.map(item => ({
        ...item,
        balanceM: item.avgBalance / 1000000
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-xl min-w-[200px]">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">{data.payer}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Avg Days: <span className="font-bold">{data.days} days</span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Avg Balance: <span className="font-bold">${data.balanceM.toFixed(2)}M</span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Performance: <span className="font-bold capitalize">{data.performance}</span>
                        </p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Click for details</p>
                </div>
            );
        }
        return null;
    };

    const handleBarClick = (data) => {
        if (onPayerClick) {
            onPayerClick(data);
        }
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    label={{ value: 'Days to Settle', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                />
                <YAxis
                    type="category"
                    dataKey="payer"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    width={90}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                <Bar
                    dataKey="days"
                    radius={[0, 4, 4, 0]}
                    onClick={handleBarClick}
                    cursor="pointer"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.performance)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
