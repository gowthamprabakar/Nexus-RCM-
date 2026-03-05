import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function DifferentialDial({ title, value, benchmark, status, trend, onClick, isActive }) {
    // Calculate color based on status
    const getColor = (status) => {
        switch (status) {
            case 'critical': return '#ef4444'; // red-500
            case 'warning': return '#f97316'; // orange-500
            case 'good': return '#10b981'; // emerald-500
            default: return '#64748b'; // slate-500
        }
    };

    const color = getColor(status);

    // Data for the semi-circle gauge
    const data = [
        { name: 'Value', value: value, color: color },
        { name: 'Remaining', value: 10 - value, color: '#e2e8f0' } // slate-200
    ];

    // Calculate rotation for needle (0-10 scale mapped to 180 degrees)
    // 0 = 180deg (left), 10 = 0deg (right)
    const needleRotation = 180 - (value * 18);

    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-card-dark rounded-xl border p-4 shadow-sm flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${isActive ? 'ring-2 ring-primary border-primary' : 'border-slate-200 dark:border-border-dark'}`}
        >
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{title}</h3>

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
                            <Cell key="remaining" fill="#e2e8f0" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Needle */}
                <div
                    className="absolute bottom-0 left-1/2 w-1 h-1 bg-slate-800 rounded-full z-10"
                    style={{ transform: 'translateX(-50%)' }}
                >
                    <div
                        className="absolute bottom-0 left-1/2 w-1 h-14 bg-slate-800 origin-bottom rounded-t-full transition-transform duration-1000 ease-out"
                        style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                    ></div>
                </div>

                {/* Value Display */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-center">
                    <span className={`text-xl font-black ${status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-orange-500' : 'text-emerald-500'}`}>
                        {value}%
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-6 text-xs text-slate-500">
                <span>BM: {benchmark}%</span>
                {trend === 'up' && <span className="text-red-500 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_up</span>Rising</span>}
                {trend === 'down' && <span className="text-emerald-500 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_down</span>Falling</span>}
                {trend === 'flat' && <span className="text-slate-400 flex items-center"><span className="material-symbols-outlined text-[10px] mr-0.5">trending_flat</span>Stable</span>}
            </div>
        </div>
    );
}
