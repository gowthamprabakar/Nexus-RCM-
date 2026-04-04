import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function ARTrendChart({ data }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const chartData = data.map(item => ({
 ...item,
 balanceM: item.balance / 1000000,
 collectedM: item.collected / 1000000,
 outstandingM: item.outstanding / 1000000
 }));

 const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-th-surface-raised border border-th-border rounded-lg p-4 shadow-xl">
 <p className="font-bold text-th-heading mb-2">{label} 2024</p>
 {payload.map((entry, index) => (
 <p key={index} className="text-sm" style={{ color: entry.color }}>
 {entry.name}: <span className="font-bold">${entry.value.toFixed(2)}M</span>
 </p>
 ))}
 </div>
 );
 }
 return null;
 };

 return (
 <ResponsiveContainer width="100%" height={300}>
 <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[0]} stopOpacity={0.3} />
 <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[1]} stopOpacity={0.3} />
 <stop offset="95%" stopColor={colors[1]} stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[2]} stopOpacity={0.3} />
 <stop offset="95%" stopColor={colors[2]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="month"
 tick={axisProps.tick}
 />
 <YAxis
 tick={axisProps.tick}
 label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft', fill: axisProps.tick.fill }}
 />
 <Tooltip content={<CustomTooltip />} />
 <Legend
 wrapperStyle={{ paddingTop: '10px' }}
 iconType="circle"
 />
 <Area
 type="monotone"
 dataKey="balanceM"
 name="Total A/R Balance"
 stroke={colors[0]}
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorBalance)"
 />
 <Area
 type="monotone"
 dataKey="collectedM"
 name="Collected"
 stroke={colors[1]}
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorCollected)"
 />
 <Area
 type="monotone"
 dataKey="outstandingM"
 name="Outstanding"
 stroke={colors[2]}
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorOutstanding)"
 />
 </AreaChart>
 </ResponsiveContainer>
 );
}
