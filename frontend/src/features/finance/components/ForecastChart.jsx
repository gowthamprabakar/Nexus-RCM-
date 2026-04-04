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
import { getSeriesColors, getGridProps, getAxisProps, getChartTheme } from '../../../lib/chartTheme';

const _colors = getSeriesColors();

const CustomTooltip = ({ active, payload, label, aiInsights }) => {
 if (active && payload && payload.length) {
 // Find if there is an AI insight for this date
 const insight = aiInsights.find(i => i.date === label);

 return (
 <div className="bg-th-surface-raised p-4 rounded-xl border border-th-border shadow-xl z-50 max-w-xs animate-in fade-in zoom-in-95 duration-200">
 <p className="text-sm font-bold text-th-heading mb-2">{label}</p>
 <div className="space-y-1 mb-3">
 {payload.map((entry, index) => (
 <div key={index} className="flex justify-between gap-4 text-xs">
 <span style={{ color: entry.color }}>{entry.name}:</span>
 <span className="font-mono font-bold text-th-primary ">
 ${entry.value.toLocaleString()}
 </span>
 </div>
 ))}
 </div>

 {insight && (
 <div className={`mt-2 p-2 rounded-lg border text-xs ${insight.severity === 'high' ? 'bg-[rgb(var(--color-danger))]/10 border-[rgb(var(--color-danger))]/20 text-[rgb(var(--color-danger))]' :
 insight.severity === 'medium' ? 'bg-[rgb(var(--color-warning))]/10 border-[rgb(var(--color-warning))]/20 text-[rgb(var(--color-warning))]' :
 'bg-[rgb(var(--color-info))]/10 border-[rgb(var(--color-info))]/20 text-[rgb(var(--color-info))]'
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
 const colors = getSeriesColors();
 const gridProps = getGridProps();
 const theme = getChartTheme();

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
 <stop offset="5%" stopColor={colors[4]} stopOpacity={0.1} />
 <stop offset="95%" stopColor={colors[4]} stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorPosted" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[1]} stopOpacity={0.1} />
 <stop offset="95%" stopColor={colors[1]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="date"
 tick={{ fontSize: 10, fill: theme.axis }}
 tickLine={false}
 axisLine={false}
 tickFormatter={(str) => {
 const date = new Date(str);
 return `${date.getMonth() + 1}/${date.getDate()}`;
 }}
 />
 <YAxis
 tick={{ fontSize: 10, fill: theme.axis }}
 tickLine={false}
 axisLine={false}
 tickFormatter={(val) => `$${val / 1000}k`}
 />
 <Tooltip content={<CustomTooltip aiInsights={aiInsights} />} cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }} />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

 {/* Reference Lines */}
 {selectedDate && (
 <ReferenceLine x={selectedDate} stroke={colors[0]} strokeDasharray="3 3" />
 )}

 {/* Historical Areas */}
 <Area
 type="monotone"
 dataKey="forecasted"
 name="Forecasted Revenue"
 stroke={colors[4]}
 fillOpacity={1}
 fill="url(#colorForecast)"
 strokeWidth={2}
 />
 <Area
 type="monotone"
 dataKey="posted"
 name="EHR Posted"
 stroke={colors[1]}
 fillOpacity={1}
 fill="url(#colorPosted)"
 strokeWidth={2}
 />

 {/* Predictive Lines (Dashed) */}
 <Line
 type="monotone"
 dataKey="predicted"
 name="AI Prediction (7 Days)"
 stroke={colors[0]}
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
