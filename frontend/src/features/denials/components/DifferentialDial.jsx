import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getSeriesColors, getChartTheme } from '../../../lib/chartTheme';

export function DifferentialDial({ title, value, benchmark, status, trend, onClick, isActive }) {
 const colors = getSeriesColors();
 const theme = getChartTheme();

 // Calculate color based on status
 const getColor = (status) => {
 switch (status) {
 case 'critical': return colors[3];
 case 'warning': return colors[2];
 case 'good': return colors[1];
 default: return colors[5];
 }
 };

 const color = getColor(status);

 // Data for the semi-circle gauge
 const data = [
 { name: 'Value', value: value, color: color },
 { name: 'Remaining', value: 10 - value, color: theme.grid }
 ];

 // Calculate rotation for needle (0-10 scale mapped to 180 degrees)
 // 0 = 180deg (left), 10 = 0deg (right)
 const needleRotation = 180 - (value * 18);

 return (
 <div
 onClick={onClick}
 className={`bg-th-surface-raised rounded-lg border p-4 flex flex-col items-center cursor-pointer transition-all duration-200 ${isActive ? 'ring-2 ring-primary border-primary' : 'border-th-border '}`}
 >
 <h3 className="text-sm font-bold text-th-primary mb-2">{title}</h3>

 <div className="relative w-32 h-16 mb-2">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data}
 cx="50%"
 cy="100%"
 startAngle={180}
 endAngle={0}
 innerRadius={40}
 outerRadius={60}
 paddingAngle={0}
 dataKey="value"
 stroke="none"
 >
 <Cell key="value" fill={color} />
 <Cell key="remaining" fill={theme.grid} />
 </Pie>
 </PieChart>
 </ResponsiveContainer>

 {/* Needle */}
 <div
 className="absolute bottom-0 left-1/2 w-1 h-1 bg-th-surface-overlay rounded-full z-10"
 style={{ transform: 'translateX(-50%)' }}
 >
 <div
 className="absolute bottom-0 left-1/2 w-1 h-14 bg-th-surface-overlay origin-bottom rounded-t-full transition-transform duration-1000 ease-out"
 style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
 ></div>
 </div>

 {/* Value Display */}
 <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
 <span className={`text-xl font-black ${status === 'critical' ? 'text-[rgb(var(--color-danger))]' : status === 'warning' ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-success))]'}`}>
 {value}%
 </span>
 </div>
 </div>

 <div className="flex items-center gap-2 mt-6 text-xs text-th-muted">
 <span>BM: {benchmark}%</span>
 {trend === 'up' && <span className="text-red-500 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>Rising</span>}
 {trend === 'down' && <span className="text-emerald-500 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_down</span>Falling</span>}
 {trend === 'flat' && <span className="text-th-secondary flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_flat</span>Stable</span>}
 </div>
 </div>
 );
}
