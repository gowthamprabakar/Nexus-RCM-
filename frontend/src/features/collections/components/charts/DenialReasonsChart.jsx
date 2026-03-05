import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function DenialReasonsChart({ data }) {
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#64748b'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-xl">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">{data.reason}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Count: <span className="font-bold">{data.count} claims</span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Amount: <span className="font-bold">${(data.amount / 1000).toFixed(0)}k</span>
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Percentage: <span className="font-bold">{data.percentage}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percentage < 5) return null;

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="font-bold text-sm"
            >
                {`${percentage}%`}
            </text>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="percentage"
                        paddingAngle={2}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
                {data.map((item, index) => (
                    <div key={item.reason} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {item.reason}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
