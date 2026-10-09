import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { dashboardApi } from '../../services/api/dashboardApi';
import { useDataset } from '../../context/DatasetContext';
import { Sparkles, Trash2, Calendar, AlertTriangle, CheckCircle2, Loader2, Database } from 'lucide-react';

interface HistoricalSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationUpdated: () => void;
}

export const HistoricalSimulationModal: React.FC<HistoricalSimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationUpdated
}) => {
  const { activeDataset, activeProfile } = useDataset();
  const [selectedDays, setSelectedDays] = useState<1 | 7 | 30>(7);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await dashboardApi.generateSimulation(selectedDays, activeDataset);
      setStatusMessage({
        text: `Generated ${res.recordsCreated} realistic simulated records over ${selectedDays} day(s). Batch ID: ${res.batchId}`,
        type: 'success'
      });
      onSimulationUpdated();
    } catch (e: any) {
      setStatusMessage({
        text: `Simulation failed: ${e.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm(`Clear all simulated historical records for ${activeProfile?.name || 'this dataset'}? Genuine records will be strictly preserved.`)) {
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await dashboardApi.clearSimulation(activeDataset);
      setStatusMessage({
        text: `Purged ${res.recordsDeleted} simulated records. Genuine production inspections remain intact.`,
        type: 'success'
      });
      onSimulationUpdated();
    } catch (e: any) {
      setStatusMessage({
        text: `Failed to clear simulation: ${e.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Historical Inspection Simulation" maxWidth="max-w-2xl">
      <div className="space-y-5 text-slate-300">
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs">
          <Database className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">Database Simulation Engine</p>
            <p className="text-slate-300">
              Generates timestamped historical records directly in SQLite for <strong>{activeProfile?.name || 'Active Product'}</strong>.
              All generated records are explicitly tagged as simulated (<code className="text-cyan-300 font-mono">is_simulated = true</code>) to ensure complete audit segregation.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' 
              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Select Simulation Period
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { days: 1 as const, label: '1 Day', count: '~50 Units' },
              { days: 7 as const, label: '7 Days', count: '~250 Units' },
              { days: 30 as const, label: '30 Days', count: '~800 Units' }
            ].map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => setSelectedDays(option.days)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  selectedDays === option.days
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 shadow-glow-cyan'
                    : 'border-industrial-border bg-industrial-950/60 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 text-cyan-400 mb-0.5" />
                <span className="text-sm font-bold text-white">{option.label}</span>
                <span className="text-[10px] font-mono text-slate-400">{option.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-industrial-950/70 border border-industrial-border/60 rounded-lg text-[11px] font-mono space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>Target Taxonomy:</span>
            <span className="text-slate-200">{activeDataset === 'water_bottle' ? 'Broken, Contamination' : 'Missing Hole, Short, Open'}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Yield Distribution:</span>
            <span className="text-emerald-400 font-semibold">~88% Pass / ~12% Defect</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Inference Latency:</span>
            <span className="text-cyan-400">{activeDataset === 'water_bottle' ? '~14 ms (PatchCore)' : '~28 ms (YOLO11)'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-industrial-border">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Simulated Data
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-glow-cyan disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate {selectedDays}d Data
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
