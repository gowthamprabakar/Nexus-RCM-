import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function DenialReasonsChart({ data }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const COLORS = getSeriesColors();

 const CustomTooltip = ({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-th-surface-raised border border-th-border rounded-lg p-4 shadow-xl">
 <p className="font-bold text-th-heading mb-2">{data.reason}</p>
 <div className="space-y-1">
 <p className="text-sm text-th-muted ">
 Count: <span className="font-bold">{data.count} claims</span>
 </p>
 <p className="text-sm text-th-muted ">
 Amount: <span className="font-bold">${(data.amount / 1000).toFixed(0)}k</span>
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
 <span className="text-xs text-th-muted truncate">
 {item.reason}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
}
