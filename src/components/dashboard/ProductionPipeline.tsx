import React from 'react';
import { PipelineStage } from '../../types/dashboard';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Activity } from 'lucide-react';

interface ProductionPipelineProps {
  stages: PipelineStage[];
}

export const ProductionPipeline: React.FC<ProductionPipelineProps> = ({ stages }) => {
  const getStatusBadge = (status: PipelineStage['status']) => {
    switch (status) {
      case 'HEALTHY':
        return {
          label: 'OPERATIONAL',
          color: 'text-emerald-400',
          dot: 'bg-emerald-400',
          bg: 'bg-emerald-950/30 border-emerald-500/20',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 'DEGRADED':
        return {
          label: 'DEGRADED',
          color: 'text-amber-400',
          dot: 'bg-amber-400',
          bg: 'bg-amber-950/30 border-amber-500/20',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 'OFFLINE':
        return {
          label: 'OFFLINE',
          color: 'text-rose-400',
          dot: 'bg-rose-400',
          bg: 'bg-rose-950/30 border-rose-500/20',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />
        };
      default:
        return {
          label: 'NOT CONFIGURED',
          color: 'text-slate-400',
          dot: 'bg-slate-400',
          bg: 'bg-slate-900/30 border-slate-700/20',
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const isDegradedOrOffline = stages.some(s => s.status === 'DEGRADED' || s.status === 'OFFLINE');
  const allHealthy = stages.length > 0 && stages.every(s => s.status === 'HEALTHY');

  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            5-Stage Inspection Pipeline Health
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry and operational validation per stage</p>
        </div>
        <div className="flex items-center gap-2">
          {allHealthy ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-medium text-emerald-400">All Stages Verified & Operational</span>
            </>
          ) : isDegradedOrOffline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-medium text-amber-400">Attention Required / Simulated Stages Active</span>
            </>
          ) : (
            <span className="text-xs font-mono text-slate-400">Pipeline Status Telemetry</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stage) => {
          const badge = getStatusBadge(stage.status);
          return (
            <div
              key={stage.id}
              className={`border rounded-lg p-3 relative flex flex-col justify-between transition group ${badge.bg}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">STAGE 0{stage.id}</span>
                  <div className="flex items-center gap-1.5">
                    {stage.isSimulated && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        SIMULATED
                      </span>
                    )}
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                  </div>
                </div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                  {stage.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{stage.detail}</p>
                {stage.errorReason && (
                  <p className="text-[10px] text-amber-400/90 mt-1 italic font-mono">
                    Note: {stage.errorReason}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-industrial-border/40 flex items-center justify-between text-[10px] font-mono">
                <span className={`${badge.color} font-semibold flex items-center gap-1`}>
                  {badge.icon}
                  {badge.label}
                </span>
                {stage.latencyMs ? (
                  <span className="text-slate-400">{stage.latencyMs} ms</span>
                ) : (
                  <span className="text-slate-500">READY</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

