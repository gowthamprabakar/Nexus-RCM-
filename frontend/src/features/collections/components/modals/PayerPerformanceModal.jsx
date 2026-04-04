import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getSeriesColors, getGridProps, getAxisProps, getTooltipStyle, getChartTheme } from '../../../../lib/chartTheme';

export function PayerPerformanceModal({ payer, onClose }) {
 if (!payer) return null;

 const colors = getSeriesColors();
 const theme = getChartTheme();
 const gridProps = getGridProps();
 const axisProps = getAxisProps();
 const tooltipStyle = getTooltipStyle();

 // Mock trend data for the payer
 const trendData = [
 { month: 'Jul', days: payer.days + 5, volume: 85 },
 { month: 'Aug', days: payer.days + 3, volume: 92 },
 { month: 'Sep', days: payer.days + 1, volume: 88 },
 { month: 'Oct', days: payer.days - 1, volume: 95 },
 { month: 'Nov', days: payer.days, volume: 90 },
 { month: 'Dec', days: payer.days, volume: 87 }
 ];

 return (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
 <div
 className="bg-th-surface-raised rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="bg-[rgb(var(--color-primary))] p-6 text-th-heading">
 <div className="flex justify-between items-start">
 <div>
 <h2 className="text-2xl font-black mb-2">{payer.payer} Performance</h2>
 <p className="text-purple-100">6-month collection velocity analysis</p>
 </div>
 <button
 onClick={onClose}
 className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
 >
 <span className="material-symbols-outlined">close</span>
 </button>
 </div>
 </div>

 {/* Content */}
 <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
 {/* KPI Grid */}
 <div className="grid grid-cols-4 gap-4 mb-6">
 <div className="bg-th-surface-overlay/30 p-4 rounded-lg">
 <p className="text-th-muted text-xs font-bold mb-1">Avg Days to Settle</p>
 <p className="text-2xl font-black text-th-heading ">{payer.days}</p>
 </div>
 <div className="bg-th-surface-overlay/30 p-4 rounded-lg">
 <p className="text-th-muted text-xs font-bold mb-1">Avg Balance</p>
 <p className="text-2xl font-black text-th-heading ">
 ${(payer.avgBalance / 1000).toFixed(0)}k
 </p>
 </div>
 <div className="bg-th-surface-overlay/30 p-4 rounded-lg">
 <p className="text-th-muted text-xs font-bold mb-1">Performance</p>
 <p className="text-2xl font-black text-th-heading capitalize">{payer.performance}</p>
 </div>
 <div className="bg-th-surface-overlay/30 p-4 rounded-lg">
 <p className="text-th-muted text-xs font-bold mb-1">Denial Rate</p>
 <p className="text-2xl font-black text-th-heading ">8.2%</p>
 </div>
 </div>

 {/* Trend Chart */}
 <div className="bg-th-surface-overlay/30 p-6 rounded-xl mb-6">
 <h3 className="text-lg font-bold text-th-heading mb-4">Collection Velocity Trend</h3>
 <ResponsiveContainer width="100%" height={250}>
 <LineChart data={trendData}>
 <CartesianGrid {...gridProps} />
 <XAxis dataKey="month" tick={axisProps.tick} />
 <YAxis tick={axisProps.tick} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
 <Tooltip
 contentStyle={tooltipStyle.contentStyle}
 />
 <Line
 type="monotone"
 dataKey="days"
 stroke={colors[4]}
 strokeWidth={3}
 dot={{ fill: colors[4], r: 5 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Insights */}
 <div className="space-y-3">
 <h3 className="text-lg font-bold text-th-heading ">Key Insights</h3>
 <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-blue-600">lightbulb</span>
 <div>
 <p className="font-bold text-th-heading mb-1">Improving Trend</p>
 <p className="text-sm text-th-muted ">
 Collection velocity has improved by 12% over the last 3 months.
 </p>
 </div>
 </div>
 </div>
 <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
 <div className="flex items-start gap-3">
 <span className="material-symbols-outlined text-amber-600">warning</span>
 <div>
 <p className="font-bold text-th-heading mb-1">Watch Point</p>
 <p className="text-sm text-th-muted ">
 Claims with specific CPT codes (99285, 27447) show 20% longer settlement times.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="border-t border-th-border p-6 bg-th-surface-overlay/30 /50 flex justify-end gap-3">
 <button className="px-4 py-2 border border-th-border-strong -strong rounded-lg text-sm font-bold hover:bg-th-surface-overlay dark:hover:bg-th-surface-overlay transition-colors">
 Export Report
 </button>
 <button
 onClick={onClose}
 className="px-4 py-2 bg-[rgb(var(--color-primary))] text-th-heading rounded-lg text-sm font-bold hover:opacity-90 transition-colors"
 >
 Close
 </button>
 </div>
 </div>
 </div>
 );
}
