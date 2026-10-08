import React from 'react';
import { ModelMetricStats } from '../../types/dashboard';
import { Cpu, CheckCircle } from 'lucide-react';

interface ModelPerformanceCardProps {
  model: ModelMetricStats;
}

export const ModelPerformanceCard: React.FC<ModelPerformanceCardProps> = ({ model }) => {
  const metrics = [
    { label: 'Accuracy', value: `${model.accuracy}%`, color: 'text-emerald-400', progress: model.accuracy },
    { label: 'Precision', value: `${model.precision}%`, color: 'text-cyan-400', progress: model.precision },
    { label: 'Recall', value: `${model.recall}%`, color: 'text-blue-400', progress: model.recall },
    { label: 'F1 Score', value: `${model.f1Score}%`, color: 'text-purple-400', progress: model.f1Score },
  ];

  return (
    <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{model.name}</h3>
            <span className="text-[11px] font-mono text-slate-400">{model.version} • Anomaly Detection</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
          {model.status}
        </span>
      </div>

      {/* 4 Performance Bars */}
      <div className="grid grid-cols-2 gap-3 my-2">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-industrial-950/60 border border-industrial-border/60 rounded-lg p-2.5">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">{m.label}</span>
              <span className={`font-mono font-bold ${m.color}`}>{m.value}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-current h-full rounded-full transition-all duration-500"
                style={{ width: `${m.progress}%`, color: m.color.includes('emerald') ? '#10B981' : m.color.includes('cyan') ? '#06B6D4' : m.color.includes('blue') ? '#3B82F6' : '#A855F7' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-industrial-border/60 pt-3 mt-1">
        <span>Average Latency: <strong className="text-white font-mono">{model.avgInferenceTimeMs} ms</strong></span>
        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
          <CheckCircle className="w-3.5 h-3.5" /> Benchmarked
        </span>
      </div>
    </div>
  );
};
