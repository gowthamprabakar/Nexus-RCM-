import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function CollectionVelocityChart({ data, onPayerClick }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const getPerformanceColor = (performance) => {
 const performanceColors = {
 'excellent': colors[1],
 'good': colors[1],
 'fair': colors[2],
 'poor': colors[3],
 'critical': colors[3]
 };
 return performanceColors[performance] || colors[5];
 };

 const chartData = data.map(item => ({
 ...item,
 balanceM: item.avgBalance / 1000000
 }));

 const CustomTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-th-surface-raised border border-th-border rounded-lg p-4 shadow-xl min-w-[200px]">
 <p className="font-bold text-th-heading mb-2">{data.payer}</p>
 <div className="space-y-1">
 <p className="text-sm text-th-muted ">
 Avg Days: <span className="font-bold">{data.days} days</span>
 </p>
 <p className="text-sm text-th-muted ">
 Avg Balance: <span className="font-bold">${data.balanceM.toFixed(2)}M</span>
 </p>
 <p className="text-sm text-th-muted ">
 Performance: <span className="font-bold capitalize">{data.performance}</span>
 </p>
 </div>
 <p className="text-xs text-th-secondary mt-2">Click for details</p>
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
 <CartesianGrid {...gridProps} />
 <XAxis
 type="number"
 tick={axisProps.tick}
 label={{ value: 'Days to Settle', position: 'insideBottom', offset: -5, fill: axisProps.tick.fill }}
 />
 <YAxis
 type="category"
 dataKey="payer"
 tick={{ ...axisProps.tick, fontWeight: 600 }}
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
