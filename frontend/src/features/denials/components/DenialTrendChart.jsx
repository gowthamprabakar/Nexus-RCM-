import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../lib/chartTheme';

export function DenialTrendChart({ data = [] }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-th-surface-raised p-3 border border-th-border rounded-lg shadow-lg">
 <p className="font-bold text-th-heading mb-2">{label}</p>
 {payload.map((entry, index) => (
 <div key={index} className="flex items-center gap-2 text-xs">
 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
 <span className="text-th-muted w-20">{entry.name}:</span>
 <span className="font-bold text-th-heading ">{entry.value}%</span>
 </div>
 ))}
 </div>
 );
 }
 return null;
 };

 return (
 <div className="bg-th-surface-raised rounded-lg border border-th-border p-6 shadow-sm h-full flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-lg font-bold text-th-heading ">Denial Rate Trends</h3>
 <p className="text-sm text-th-muted ">12-Month Historical & Projected Analysis</p>
 </div>
 <div className="flex gap-2">
 <span className="flex items-center gap-1 text-xs font-medium text-th-muted">
 <span className="w-2 h-2 rounded-full bg-primary"></span> Overall
 </span>
 <span className="flex items-center gap-1 text-xs font-medium text-th-muted">
 <span className="w-2 h-2 rounded-full bg-th-muted"></span> Industry
 </span>
 </div>
 </div>

 <div className="flex-1 w-full min-h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={colors[0]} stopOpacity={0.1} />
 <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="month"
 axisLine={false}
 tickLine={false}
 tick={axisProps.tick}
 dy={10}
 />
 <YAxis
 axisLine={false}
 tickLine={false}
 tick={axisProps.tick}
 unit="%"
 domain={[0, 'dataMax + 2']}
 />
 <Tooltip content={<CustomTooltip />} />
 <Area
 type="monotone"
 dataKey="industry"
 name="Industry Avg"
 stroke={colors[5]}
 strokeWidth={2}
 strokeDasharray="5 5"
 fill="none"
 />
 <Area
 type="monotone"
 dataKey="overall"
 name="Overall Rate"
 stroke={colors[0]}
 strokeWidth={3}
 fill="url(#colorOverall)"
 />
 <Area
 type="monotone"
 dataKey="uhc"
 name="UHC"
 stroke={colors[0]}
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
