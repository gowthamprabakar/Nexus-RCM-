/**
 * Recharts theme configuration for RCM Pulse v5.0
 * Provides light/dark aware chart styling.
 */

const LIGHT = {
  colors: [
    '#0C66E4', // blue
    '#1B806A', // teal
    '#CF8600', // amber
    '#CA3521', // red
    '#8250DF', // purple
    '#626F86', // slate
    '#0B7285', // cyan
    '#C05621', // orange
  ],
  grid: '#DFE1E6',
  axis: '#626F86',
  axisLine: '#DFE1E6',
  tooltip: {
    bg: '#FFFFFF',
    border: '#DFE1E6',
    text: '#172B4D',
    label: '#626F86',
  },
  legend: '#44546F',
};

const DARK = {
  colors: [
    '#428FFF', // blue
    '#34C780', // teal
    '#FFB728', // amber
    '#FF664F', // red
    '#B392F0', // purple
    '#8296AC', // slate
    '#3BC9DB', // cyan
    '#FFA040', // orange
  ],
  grid: '#283A5E',
  axis: '#8296AC',
  axisLine: '#283A5E',
  tooltip: {
    bg: '#161F32',
    border: '#283A5E',
    text: '#FFFFFF',
    label: '#8296AC',
  },
  legend: '#B3C0D6',
};

/**
 * Detect whether dark mode is active.
 */
function isDark() {
  return document.documentElement.classList.contains('dark');
}

/**
 * Return the full theme object for the current mode.
 */
export function getChartTheme() {
  return isDark() ? DARK : LIGHT;
}

/**
 * Return the 8-color series palette for the current mode.
 */
export function getSeriesColors() {
  return isDark() ? DARK.colors : LIGHT.colors;
}

/**
 * Return Recharts <CartesianGrid /> props.
 */
export function getGridProps() {
  const t = getChartTheme();
  return {
    stroke: t.grid,
    strokeDasharray: '3 3',
    vertical: false,
  };
}

/**
 * Return Recharts <XAxis /> or <YAxis /> props.
 */
export function getAxisProps() {
  const t = getChartTheme();
  return {
    tick: { fill: t.axis, fontSize: 12 },
    axisLine: { stroke: t.axisLine },
    tickLine: { stroke: t.axisLine },
  };
}

/**
 * Return Recharts <Tooltip /> contentStyle / labelStyle / itemStyle.
 */
export function getTooltipStyle() {
  const t = getChartTheme();
  return {
    contentStyle: {
      backgroundColor: t.tooltip.bg,
      border: `1px solid ${t.tooltip.border}`,
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      padding: '10px 14px',
    },
    labelStyle: {
      color: t.tooltip.label,
      fontWeight: 600,
      fontSize: 12,
      marginBottom: 4,
    },
    itemStyle: {
      color: t.tooltip.text,
      fontSize: 13,
      padding: '2px 0',
    },
  };
}

/**
 * Return Recharts <Legend /> props.
 */
export function getLegendProps() {
  const t = getChartTheme();
  return {
    wrapperStyle: {
      color: t.legend,
      fontSize: 12,
      fontWeight: 500,
    },
  };
}
