import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockDenialData } from '../data/mockDenialData';

export function DenialTrendChart() {
    const data = mockDenialData.denialTrends;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                            <span className="text-slate-600 dark:text-slate-300 w-20">{entry.name}:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{entry.value}%</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-border-dark p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Denial Rate Trends</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">12-Month Historical & Projected Analysis</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-primary"></span> Overall
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span> Industry
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            unit="%"
                            domain={[0, 'dataMax + 2']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="industry"
                            name="Industry Avg"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            fill="none"
                        />
                        <Area
                            type="monotone"
                            dataKey="overall"
                            name="Overall Rate"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fill="url(#colorOverall)"
                        />
                        <Area
                            type="monotone"
                            dataKey="uhc"
                            name="UHC"
                            stroke="#3b82f6"
                            strokeWidth={1}
                            fill="none"
                            hide={true} // Hidden by default, could be toggled
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
