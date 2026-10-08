import React from 'react';

interface StatusBadgeProps {
  status: 'GOOD' | 'DEFECTIVE' | 'PENDING' | 'FAILED' | 'ONLINE' | 'OFFLINE' | 'WARNING' | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const norm = status?.toUpperCase() || '';

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';

  if (norm === 'GOOD' || norm === 'ONLINE' || norm === 'PASSED' || norm === 'READY') {
    styles = 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950';
  } else if (norm === 'DEFECTIVE' || norm === 'FAILED' || norm === 'OFFLINE' || norm === 'CRITICAL') {
    styles = 'bg-rose-950/60 text-rose-400 border-rose-500/40 shadow-sm shadow-rose-950';
  } else if (norm === 'WARNING' || norm === 'PROCESSING' || norm === 'CALIBRATING') {
    styles = 'bg-amber-950/60 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-950';
  } else if (norm === 'PENDING' || norm === 'QUEUED') {
    styles = 'bg-blue-950/60 text-blue-400 border-blue-500/40 shadow-sm shadow-blue-950';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-wider rounded border ${padding} ${styles} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        norm === 'GOOD' || norm === 'ONLINE' ? 'bg-emerald-400' :
        norm === 'DEFECTIVE' || norm === 'FAILED' ? 'bg-rose-400' :
        norm === 'WARNING' ? 'bg-amber-400' : 'bg-blue-400'
      }`} />
      {norm}
    </span>
  );
};
