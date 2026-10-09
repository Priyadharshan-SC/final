import React, { useState, useRef, useEffect } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { 
  ChevronDown, 
  Check, 
  Cpu, 
  Sparkles, 
  Layers, 
  RefreshCw,
  Box,
  Droplets,
  CircuitBoard
} from 'lucide-react';

export const DatasetSelector: React.FC = () => {
  const { activeDataset, datasets, profile, switchDataset, isSwitching } = useDataset();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProductIcon = (id: string) => {
    if (id === 'water_bottle') {
      return <Droplets className="w-4 h-4 text-cyan-400" />;
    }
    return <CircuitBoard className="w-4 h-4 text-emerald-400" />;
  };

  const getEngineBadge = (engineType?: string) => {
    if (engineType === 'patch_anomaly') {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
          PatchCore Anomaly
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
        YOLO11n Supervised
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Selection Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0E1626] hover:bg-[#131E33] border border-industrial-border hover:border-cyan-500/50 rounded-lg text-xs font-medium text-slate-200 transition shadow-sm"
        title="Switch Industrial Inspection Dataset"
      >
        <div className="flex items-center gap-2">
          {getProductIcon(activeDataset)}
          <span className="font-semibold text-white">
            {profile?.name || (activeDataset === 'water_bottle' ? 'Industrial Water Bottle' : 'Industrial PCB SMT')}
          </span>
        </div>

        <div className="hidden sm:block">
          {getEngineBadge(profile?.engine_type)}
        </div>

        {isSwitching ? (
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-[#0A101D] border border-industrial-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-industrial-border/60 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              Select Active Inspection Dataset
            </span>
          </div>

          <div className="space-y-1">
            {datasets.map((d) => {
              const isActive = d.id === activeDataset;
              return (
                <div
                  key={d.id}
                  onClick={async () => {
                    setIsOpen(false);
                    await switchDataset(d.id);
                  }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition flex items-start justify-between gap-3 ${
                    isActive
                      ? 'bg-blue-950/40 border-cyan-500/60 shadow-glow-blue'
                      : 'bg-transparent border-transparent hover:bg-slate-900/60 hover:border-industrial-border'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1.5 rounded-md bg-[#0F1829] border border-industrial-border/60">
                      {getProductIcon(d.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{d.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{d.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getEngineBadge(d.engine_type)}
                        <span className="text-[10px] font-mono text-slate-400">
                          {d.defect_classes_count} classes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-industrial-border/60 px-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Hardware: RTX 2050 CUDA</span>
            <span className="text-emerald-400">Adaptive AI</span>
          </div>
        </div>
      )}
    </div>
  );
};
