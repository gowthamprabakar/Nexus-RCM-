import React from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label, aiInsights }) => {
    if (active && payload && payload.length) {
        // Find if there is an AI insight for this date
        const insight = aiInsights.find(i => i.date === label);

        return (
            <div className="bg-white dark:bg-[#1c222d] p-4 rounded-xl border border-slate-200 dark:border-[#3b4354] shadow-xl z-50 max-w-xs animate-in fade-in zoom-in-95 duration-200">
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                <div className="space-y-1 mb-3">
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between gap-4 text-xs">
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                ${entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>

                {insight && (
                    <div className={`mt-2 p-2 rounded-lg border text-xs ${insight.severity === 'high' ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-900/30 dark:text-rose-400' :
                            insight.severity === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900/30 dark:text-amber-400' :
                                'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/10 dark:border-blue-900/30 dark:text-blue-400'
                        }`}>
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                            <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                            {insight.title}
                        </div>
                        <p className="leading-snug opacity-90">{insight.message}</p>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export function ForecastChart({ data, aiInsights, onDataClick, selectedDate }) {
    return (
        <div className="w-full h-80 relative select-none">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    onClick={(e) => {
                        if (e && e.activeLabel) {
                            onDataClick(e.activeLabel);
                        }
                    }}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPosted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                        }}
                    />
                    <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val / 1000}k`}
                    />
                    <Tooltip content={<CustomTooltip aiInsights={aiInsights} />} cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                    {/* Reference Lines */}
                    {selectedDate && (
                        <ReferenceLine x={selectedDate} stroke="#3b82f6" strokeDasharray="3 3" />
                    )}

                    {/* Historical Areas */}
                    <Area
                        type="monotone"
                        dataKey="forecasted"
                        name="Forecasted Revenue"
                        stroke="#a855f7"
                        fillOpacity={1}
                        fill="url(#colorForecast)"
                        strokeWidth={2}
                    />
                    <Area
                        type="monotone"
                        dataKey="posted"
                        name="EHR Posted"
                        stroke="#14b8a6"
                        fillOpacity={1}
                        fill="url(#colorPosted)"
                        strokeWidth={2}
                    />

                    {/* Predictive Lines (Dashed) */}
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        name="AI Prediction (7 Days)"
                        stroke="#6366f1"
                        strokeDasharray="5 5"
                        dot={false}
                        strokeWidth={2}
                        connectNulls
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
