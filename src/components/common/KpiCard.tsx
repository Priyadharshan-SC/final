import React, { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    variant: 'good' | 'defective' | 'warning' | 'info';
  };
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
  progressPercent?: number;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon,
  iconBg = 'bg-industrial-800 text-cyan-400 border-industrial-border',
  className = '',
  progressPercent,
}) => {
  return (
    <div
      className={`bg-industrial-900 border border-industrial-border rounded-xl p-4 flex flex-col justify-between hover:border-industrial-borderLight transition-all duration-200 shadow-card-dark ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-sm ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
          {badge && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                badge.variant === 'good'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                  : badge.variant === 'defective'
                  ? 'bg-rose-950/60 text-rose-400 border-rose-500/30'
                  : badge.variant === 'warning'
                  ? 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                  : 'bg-blue-950/60 text-blue-400 border-blue-500/30'
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {progressPercent !== undefined && (
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 transform -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-cyan-400"
                strokeDasharray={100}
                strokeDashoffset={100 - progressPercent}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-cyan-300">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-slate-400 mt-1.5">{subtitle}</p>}
    </div>
  );
};
