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

 return (
 <div className="h-64 w-full bg-white rounded-xl border border-th-border p-4 shadow-sm">
 <h4 className="text-sm font-bold text-th-primary mb-4 flex items-center justify-between">
 <span>Backoff Strategy Visualization</span>
 <span className="text-xs bg-th-surface-overlay px-2 py-1 rounded text-th-muted capitalize">{strategy}</span>
 </h4>

 <ResponsiveContainer width="100%" height="100%" minHeight={200}>
 <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
 <XAxis
 dataKey="attempt"
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#64748b', fontSize: 12 }}
 dy={10}
 />
 <YAxis
 label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#94a3b8', fontSize: 10 }}
 />
 <Tooltip
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 itemStyle={{ color: '#2563eb', fontWeight: 600 }}
 />
 <Line
 type="stepAfter"
 dataKey="time"
 stroke="#8b5cf6"
 strokeWidth={3}
 dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 );
}
