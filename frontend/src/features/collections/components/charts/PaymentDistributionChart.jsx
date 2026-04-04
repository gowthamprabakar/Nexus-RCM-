import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function PaymentDistributionChart({ data }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const CustomTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-th-surface-raised border border-th-border rounded-lg p-4 shadow-xl">
 <p className="font-bold text-th-heading mb-2">{data.method}</p>
 <div className="space-y-1">
 <p className="text-sm text-th-muted ">
 Amount: <span className="font-bold">${(data.amount / 1000000).toFixed(2)}M</span>
 </p>
 <p className="text-sm text-th-muted ">
 Percentage: <span className="font-bold">{data.percentage}%</span>
 </p>
 </div>
 </div>
 );
 }
 return null;
 };

 const formatYAxis = (value) => {
 return `$${(value / 1000000).toFixed(1)}M`;
 };

 return (
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="method"
 tick={{ ...axisProps.tick, fontSize: 11 }}
 angle={-45}
 textAnchor="end"
 height={80}
 />
 <YAxis
 tick={axisProps.tick}
 tickFormatter={formatYAxis}
 />
 <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
 <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
 {data.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 );
}
