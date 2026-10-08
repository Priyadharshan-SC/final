import React from 'react';
import { DefectDistributionItem } from '../../types/dashboard';

interface DefectDonutChartProps {
  data: DefectDistributionItem[];
  title?: string;
  subtitle?: string;
}

export const DefectDonutChart: React.FC<DefectDonutChartProps> = ({
  data,
  title = 'Defect Distribution',
  subtitle = 'Breakdown by anomaly classification',
}) => {
  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  // Calculate SVG donut stroke offsets
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-4">
        {/* Donut graphic with centered total */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#131F35"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Segments */}
            {data.map((item, i) => {
              const dashLength = (item.percentage / 100) * circumference;
              const dashOffset = -currentOffset;
              currentOffset += dashLength;

              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={dashOffset}
                  fill="transparent"
                  className="transition-all duration-300 hover:opacity-90"
                />
              );
            })}
          </svg>

          {/* Centered Total Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold font-mono text-white">{total}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Defects</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-200 font-semibold">{item.count}</span>
                <span className="text-slate-500 text-[11px]">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 border-t border-industrial-border/60 pt-2 flex items-center justify-between">
        <span>Highest: <strong className="text-rose-400">Solder Bridge</strong></span>
        <span>Accuracy: <strong className="text-cyan-400">98.4%</strong></span>
      </div>
    </div>
  );
};
