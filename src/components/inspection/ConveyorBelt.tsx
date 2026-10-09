import React from 'react';
import { Play, Pause, SkipForward, FastForward, CheckCircle2, AlertTriangle, Layers, Activity, Package } from 'lucide-react';
import { formatImageSrc } from '../../utils/imageUtils';

export interface ConveyorBoard {
  position: number;
  board_id: string;
  name?: string;
  similarity?: number;
  similarity_pct?: string;
  thumbnail_url?: string;
  image_id?: string;
  status: 'queued' | 'processing' | 'completed' | 'defective';
  results?: any;
}

interface ConveyorBeltProps {
  queue: ConveyorBoard[];
  currentIndex: number;
  isRunning: boolean;
  onToggleRunning: () => void;
  onStepNext: () => void;
  onRunAll: () => void;
  onSelectBoard: (board: ConveyorBoard, index: number) => void;
}

export const ConveyorBelt: React.FC<ConveyorBeltProps> = ({
  queue = [],
  currentIndex = 0,
  isRunning = true,
  onToggleRunning,
  onStepNext,
  onRunAll,
  onSelectBoard,
}) => {
  return (
    <div className="bg-[#0B1220] border border-industrial-border rounded-xl p-4 shadow-card-dark relative overflow-hidden">
      {/* Conveyor Belt Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-industrial-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                Automated Inspection Conveyor Belt
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isRunning ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40' : 'bg-amber-950/60 text-amber-400 border border-amber-500/40'
              }`}>
                {isRunning ? 'BELT SPEED: 1.2 M/S' : 'BELT PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sequential optical inspection line with real-time pneumatic diverter sorting
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRunning}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
              isRunning
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30 hover:bg-amber-900/50'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
            }`}
          >
            {isRunning ? <><Pause className="w-3.5 h-3.5" /> Pause Belt</> : <><Play className="w-3.5 h-3.5" /> Run Belt</>}
          </button>

          <button
            onClick={onStepNext}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-glow-blue"
          >
            <SkipForward className="w-3.5 h-3.5" /> Next Board
          </button>

          <button
            onClick={onRunAll}
            className="px-3 py-1.5 bg-industrial-950 hover:bg-industrial-800 text-slate-200 border border-industrial-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" /> Run All ({queue.length})
          </button>
        </div>
      </div>

      {/* Main Physical Conveyor Track Animation */}
      <div className="relative bg-[#070D18] border border-industrial-border/90 rounded-lg p-3 pt-7 pb-6 overflow-hidden">
        {/* Conveyor Belt Motion Background Texture */}
        <div 
          className="absolute inset-x-0 bottom-2 h-10 bg-[#0E1626] border-y border-slate-700/60 overflow-hidden"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #1A263D 0px, #1A263D 14px, #0F1728 14px, #0F1728 28px)`,
            animation: isRunning ? 'conveyorSlide 1.2s linear infinite' : 'none',
          }}
        />

        {/* Roller Wheels Top & Bottom Indicators */}
        <div className="absolute left-2 bottom-3 w-4 h-8 rounded-full bg-slate-600 border border-slate-400 opacity-60 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
        </div>
        <div className="absolute right-2 bottom-3 w-4 h-8 rounded-full bg-slate-600 border border-slate-400 opacity-60 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
        </div>

        {/* Optical Sensor & Laser Inspection Head Overlay (Fixed in middle position) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
          <div className="bg-cyan-950/90 border border-cyan-400/80 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-300 shadow-glow-cyan flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>OPTICAL SENSOR CAM-01</span>
          </div>
          <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-400 to-transparent" />
        </div>

        {/* Physical Board Carriers moving along conveyor */}
        <div className="relative z-10 flex items-center justify-around gap-4 min-h-[140px] px-4">
          {queue.length === 0 ? (
            <div className="w-full text-center py-8 text-xs text-slate-500 font-mono">
              Loading PCB boards onto conveyor feed hopper...
            </div>
          ) : (
            queue.map((board, idx) => {
              const isCurrent = idx === currentIndex;
              const isDefective = board.status === 'defective';
              const isCompleted = board.status === 'completed';
              const isQueued = board.status === 'queued';
              const isProcessing = board.status === 'processing';

              return (
                <div
                  key={board.position ?? idx}
                  onClick={() => onSelectBoard(board, idx)}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-300 transform ${
                    isCurrent ? 'scale-105 z-20' : 'hover:scale-100 opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Status Indicator Beacon */}
                  <div className="mb-2">
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500 text-slate-950 shadow-glow-cyan animate-pulse">
                        INSPECTING
                      </span>
                    ) : isDefective ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-400 border border-rose-500/40">
                        DEFECT
                      </span>
                    ) : isCompleted ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                        PASSED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-industrial-950 border border-slate-700">
                        POS #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Physical PCB Board Carrier Box */}
                  <div
                    className={`w-28 sm:w-32 h-24 rounded-lg border-2 p-2 relative flex flex-col justify-between shadow-lg transition ${
                      isCurrent
                        ? isDefective
                          ? 'border-rose-500 bg-[#160B0F] shadow-glow-red ring-2 ring-rose-500/50'
                          : 'border-cyan-400 bg-[#071720] shadow-glow-cyan ring-2 ring-cyan-400/40'
                        : isDefective
                        ? 'border-rose-500/60 bg-[#14080B]'
                        : isCompleted
                        ? 'border-emerald-500/60 bg-[#071810]'
                        : 'border-industrial-border bg-[#0B1424]'
                    }`}
                  >
                    {/* Top board header */}
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-slate-200 truncate">{board.board_id}</span>
                      {board.similarity_pct && (
                        <span className="text-cyan-400 text-[9px] font-semibold">
                          {board.similarity_pct}
                        </span>
                      )}
                    </div>

                    {/* Unit Image or Schematic Thumbnail */}
                    <div className="h-11 rounded bg-[#040912] border border-slate-800 flex items-center justify-center overflow-hidden relative">
                      {board.thumbnail_url ? (
                        <img 
                          src={formatImageSrc(board.thumbnail_url)} 
                          alt={board.board_id}
                          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (board.board_id?.toLowerCase().includes('bottle') || board.name?.toLowerCase().includes('bottle')) ? (
                        <div className="text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                          <Package className="w-3 h-3 text-cyan-400" />
                          <span>PET Unit</span>
                        </div>
                      ) : (
                        <div className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          <span>PCB FR-4</span>
                        </div>
                      )}

                      {/* Overlaid Defect Badge if detected */}
                      {isDefective && (
                        <span className="absolute inset-0 bg-rose-950/60 flex items-center justify-center text-[10px] font-bold font-mono text-rose-300">
                          FAULT
                        </span>
                      )}
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="flex items-center justify-between text-[9px] font-mono pt-1 border-t border-slate-800/60">
                      <span className={isDefective ? 'text-rose-400 font-bold' : isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {isDefective ? 'REJECT' : isCompleted ? 'PASS' : isProcessing ? 'SCANNING' : 'QUEUED'}
                      </span>
                      {board.results?.inference_time_ms && (
                        <span className="text-slate-500">{board.results.inference_time_ms}ms</span>
                      )}
                    </div>
                  </div>

                  {/* Conveyor Carrier Leg / Mount */}
                  <div className="w-12 h-2 bg-slate-700/70 border-x border-slate-500/50 mt-1" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Global CSS for Conveyor Movement Animation */}
      <style>{`
        @keyframes conveyorSlide {
          0% { background-position: 0 0; }
          100% { background-position: 28px 0; }
        }
      `}</style>
    </div>
  );
};
