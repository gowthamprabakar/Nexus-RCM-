import React from 'react';
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceArea
} from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../lib/chartTheme';

export function RetryBackoffChart({ strategy = 'exponential' }) {
 // Generate data based on strategy
 const generateData = () => {
 const data = [];
 let timeInMinutes = 0;

 for (let attempt = 1; attempt <= 5; attempt++) {
 let delay = 0;
 if (strategy === 'linear') {
 delay = 15; // 15 mins between
 } else {
 // Exponential: 5, 15, 45, 135, 405
 delay = 5 * Math.pow(3, attempt - 1);
 }

 timeInMinutes += delay;

 data.push({
 attempt: `Try ${attempt}`,
 time: timeInMinutes,
 label: `${timeInMinutes}m`
 });
 }
 return data;
 };

 const data = generateData();

 const colors = getSeriesColors();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();
 const theme = getChartTheme();

 return (
 <div className="h-64 w-full bg-th-surface-raised rounded-lg border border-th-border p-4">
 <h4 className="text-sm font-bold text-th-primary mb-4 flex items-center justify-between">
 <span>Backoff Strategy Visualization</span>
 <span className="text-xs bg-th-surface-overlay px-2 py-1 rounded text-th-muted capitalize">{strategy}</span>
 </h4>

 <ResponsiveContainer width="100%" height="100%" minHeight={200}>
 <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid {...gridProps} />
 <XAxis
 dataKey="attempt"
 {...axisProps}
 dy={10}
 />
 <YAxis
 label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: theme.axis, fontSize: 10 }}
 {...axisProps}
 />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
 itemStyle={tooltipStyle.itemStyle}
 />
 <Line
 type="stepAfter"
 dataKey="time"
 stroke={colors[4]}
 strokeWidth={3}
 dot={{ r: 4, fill: colors[4], strokeWidth: 2, stroke: '#fff' }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 );
}
