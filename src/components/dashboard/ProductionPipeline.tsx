import React from 'react';
import { PipelineStage } from '../../types/dashboard';
import { ChevronRight, ArrowRight } from 'lucide-react';

interface ProductionPipelineProps {
  stages: PipelineStage[];
}

export const ProductionPipeline: React.FC<ProductionPipelineProps> = ({ stages }) => {
  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Production Line Status</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time inspection stage health and throughput</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-medium text-emerald-400">All 5 Stages Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <div
              key={stage.id}
              className="bg-industrial-950/80 border border-industrial-border/80 rounded-lg p-3 relative flex flex-col justify-between hover:border-cyan-500/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">STAGE 0{stage.id}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition">
                  {stage.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{stage.detail}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-industrial-border/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400 font-semibold">{stage.status}</span>
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
