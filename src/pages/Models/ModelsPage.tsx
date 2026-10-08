import React, { useState } from 'react';
import { mockModels } from '../../services/mock/mockData';
import { ModelInfo } from '../../types/system';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Cpu, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive, 
  Activity, 
  Layers
} from 'lucide-react';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>(mockModels);
  const [activeModelId, setActiveModelId] = useState<string>('mod-1');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleActivate = (id: string, name: string) => {
    setActiveModelId(id);
    setModels(models.map(m => ({
      ...m,
      status: m.id === id ? 'PRODUCTION' : 'INACTIVE',
    })));
    setActionMessage(`Activated ${name} for Production Line 01 inference.`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">MODELS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Model Registry & Management</h1>
              <p className="text-xs text-slate-400">Manage PatchCore memory banks, YOLO checkpoints, and inference pipelines</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-border px-3 py-1.5 rounded-lg text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">Active Engine: PatchCore ESP32</span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {actionMessage}
        </div>
      )}

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {models.map((mod) => {
          const isCurrentActive = mod.id === activeModelId;
          return (
            <div
              key={mod.id}
              className={`bg-industrial-900 border rounded-xl p-5 shadow-card-dark flex flex-col justify-between transition-all ${
                isCurrentActive
                  ? 'border-purple-500/80 shadow-glow-blue bg-gradient-to-b from-industrial-900 to-[#10142B]'
                  : 'border-industrial-border hover:border-industrial-borderLight'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-industrial-950 text-cyan-400 border border-industrial-border">
                    {mod.version}
                  </span>
                  <StatusBadge status={mod.status} size="sm" />
                </div>

                <h3 className="text-base font-bold text-white font-sans">{mod.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{mod.framework}</p>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                  <div className="bg-industrial-950/80 p-2 rounded border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">ACCURACY</span>
                    <span className="text-emerald-400 font-bold text-sm">{mod.accuracy}%</span>
                  </div>
                  <div className="bg-industrial-950/80 p-2 rounded border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">PRECISION</span>
                    <span className="text-cyan-400 font-bold text-sm">{mod.precision}%</span>
                  </div>
                  <div className="bg-industrial-950/80 p-2 rounded border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">RECALL</span>
                    <span className="text-blue-400 font-bold text-sm">{mod.recall}%</span>
                  </div>
                  <div className="bg-industrial-950/80 p-2 rounded border border-industrial-border/60">
                    <span className="text-[10px] text-slate-500 block">F1 SCORE</span>
                    <span className="text-purple-400 font-bold text-sm">{mod.f1Score}%</span>
                  </div>
                </div>

                <div className="space-y-1.5 mt-4 pt-3 border-t border-industrial-border/40 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Inference Latency:</span>
                    <span className="text-slate-200 font-bold">{mod.avgInferenceTimeMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Checkpoint Size:</span>
                    <span className="text-slate-300">{mod.sizeMb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Dataset:</span>
                    <span className="text-slate-400 truncate max-w-[150px]">{mod.datasetName}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-industrial-border/60 flex items-center gap-2">
                {isCurrentActive ? (
                  <button
                    disabled
                    className="flex-1 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active in Production
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(mod.id, mod.name)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Activate to Production
                  </button>
                )}
                <button
                  onClick={() => alert(`Rolled back model parameters for ${mod.name}`)}
                  className="p-2 rounded-lg bg-industrial-950 border border-industrial-border text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Rollback Model Weights"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
