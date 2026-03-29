import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ARTrendChart({ data }) {
 const chartData = data.map(item => ({
 ...item,
 balanceM: item.balance / 1000000,
 collectedM: item.collected / 1000000,
 outstandingM: item.outstanding / 1000000
 }));

 const CustomTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="bg-white border border-th-border rounded-lg p-4 shadow-xl">
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
 <stop offset="5%" stopColor="#135bec" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
 </linearGradient>
 <linearGradient id="colorOutstanding" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
 <XAxis
 dataKey="month"
 tick={{ fill: '#64748b', fontSize: 12 }}
 />
 <YAxis
 tick={{ fill: '#64748b', fontSize: 12 }}
 label={{ value: 'Amount ($M)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
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
 stroke="#135bec"
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorBalance)"
 />
 <Area
 type="monotone"
 dataKey="collectedM"
 name="Collected"
 stroke="#10b981"
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorCollected)"
 />
 <Area
 type="monotone"
 dataKey="outstandingM"
 name="Outstanding"
 stroke="#f59e0b"
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorOutstanding)"
 />
 </AreaChart>
 </ResponsiveContainer>
 );
}
