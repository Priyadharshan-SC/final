import React from 'react';
import { InspectionTrendPoint } from '../../types/dashboard';

interface TrendChartProps {
  data: InspectionTrendPoint[];
  range: '24h' | '7d' | '30d';
  onRangeChange: (range: '24h' | '7d' | '30d') => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, range, onRangeChange }) => {
  const maxGood = Math.max(...data.map(d => d.good), 10);
  const maxDef = Math.max(...data.map(d => d.defective), 5);
  const yMax = Math.max(maxGood + 20, 100);

  // SVG chart dimensions
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const pointsCount = data.length;
  const stepX = (width - paddingX * 2) / (pointsCount - 1);

  // Good line path
  const goodPath = data.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - (d.good / yMax) * (height - paddingY * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Defective line path
  const defPath = data.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - (d.defective / yMax) * (height - paddingY * 2);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Fill area under good path
  const goodArea = `${goodPath} L ${paddingX + (pointsCount - 1) * stepX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
      {/* Header with Title and Range Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Inspection Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Good vs Defective distribution over time</p>
        </div>

        {/* Range Tabs */}
        <div className="flex items-center gap-1 bg-industrial-950 p-1 rounded-lg border border-industrial-border">
          {(['24h', '7d', '30d'] as const).map((r) => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition ${
                range === r
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG Trend Chart */}
      <div className="relative w-full h-[200px] flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
          <defs>
            <linearGradient id="goodAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - paddingY - pct * (height - paddingY * 2);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#1E2C44"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {Math.round(pct * yMax)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={goodArea} fill="url(#goodAreaGrad)" />

          {/* Good boards line */}
          <path d={goodPath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Defective boards line */}
          <path d={defPath} fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {data.map((d, i) => {
            const x = paddingX + i * stepX;
            const yGood = height - paddingY - (d.good / yMax) * (height - paddingY * 2);
            const yDef = height - paddingY - (d.defective / yMax) * (height - paddingY * 2);
            return (
              <g key={i} className="group">
                <circle cx={x} cy={yGood} r="3.5" fill="#10B981" stroke="#0B111E" strokeWidth="2" />
                <circle cx={x} cy={yDef} r="3.5" fill="#EF4444" stroke="#0B111E" strokeWidth="2" />
                {/* X Axis Labels */}
                <text
                  x={x}
                  y={height - 6}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {d.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-industrial-border/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300 font-medium">Good Boards</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-300 font-medium">Defective Boards</span>
        </div>
      </div>
    </div>
  );
};
