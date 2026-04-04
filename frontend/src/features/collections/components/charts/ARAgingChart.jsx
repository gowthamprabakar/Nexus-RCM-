import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function ARAgingChart({ data, onBucketClick }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const chartData = data.map(bucket => ({
 name: bucket.bucket,
 balance: bucket.balance / 1000000, // Convert to millions
 collectability: bucket.collectability,
 color: bucket.color,
 fullData: bucket
 }));

 const CustomTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-th-surface-raised border border-th-border rounded-lg p-4 shadow-xl">
 <p className="font-bold text-th-heading mb-2">{data.name}</p>
 <p className="text-sm text-th-muted ">
 Balance: <span className="font-bold">${(data.balance).toFixed(2)}M</span>
 </p>
 <p className="text-sm text-th-muted ">
 Collectability: <span className="font-bold">{data.collectability}%</span>
 </p>
 <p className="text-xs text-th-secondary mt-2">Click to view details</p>
 </div>
 );
 }
 return null;
 };

 const handleBarClick = (data) => {
 if (onBucketClick && data.fullData) {
 onBucketClick(data.fullData);
 }
 };

 return (
 <ResponsiveContainer width="100%" height={300}>
 <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="name"
 tick={{ ...axisProps.tick, fontWeight: 600 }}
 />
 <YAxis
 yAxisId="left"
 tick={axisProps.tick}
 label={{ value: 'Balance ($M)', angle: -90, position: 'insideLeft', fill: axisProps.tick.fill }}
 />
 <YAxis
 yAxisId="right"
 orientation="right"
 tick={axisProps.tick}
 label={{ value: 'Collectability (%)', angle: 90, position: 'insideRight', fill: axisProps.tick.fill }}
 domain={[0, 100]}
 />
 <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
 <Legend
 wrapperStyle={{ paddingTop: '20px' }}
 iconType="circle"
 />
 <Bar
 yAxisId="left"
 dataKey="balance"
 name="A/R Balance ($M)"
 radius={[8, 8, 0, 0]}
 onClick={handleBarClick}
 cursor="pointer"
 >
 {chartData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 <Line
 yAxisId="right"
 type="monotone"
 dataKey="collectability"
 name="Collectability %"
 stroke={colors[0]}
 strokeWidth={3}
 dot={{ fill: colors[0], r: 5 }}
 activeDot={{ r: 7 }}
 />
 </ComposedChart>
 </ResponsiveContainer>
 );
}
