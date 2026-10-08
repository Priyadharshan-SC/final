import React, { useState, useEffect } from 'react';
import { PcbViewer } from '../../components/inspection/PcbViewer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { inspectionStream } from '../../services/websocket/inspectionStream';
import { mockInspections } from '../../services/mock/mockData';
import { Inspection } from '../../types/inspection';
import { inspectionApi } from '../../services/api/inspectionApi';
import { 
  Camera, 
  Video, 
  Play, 
  Pause, 
  SkipForward, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Scan, 
  Radio, 
  Maximize2,
  FileCheck
} from 'lucide-react';

export const LiveInspectionPage: React.FC = () => {
  const [currentInspection, setCurrentInspection] = useState<Inspection>(mockInspections[1]); // Default to defective PCB with solder bridge
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(true);
  const [recentFrames, setRecentFrames] = useState<Inspection[]>(mockInspections.slice(0, 5));
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  useEffect(() => {
    inspectionStream.connect();
    const unsubscribe = inspectionStream.subscribe((newInspection) => {
      if (isStreamActive) {
        setCurrentInspection(newInspection);
        setRecentFrames((prev) => [newInspection, ...prev.slice(0, 4)]);
      }
    });

    return () => {
      unsubscribe();
      inspectionStream.disconnect();
    };
  }, [isStreamActive]);

  const handleInspectNext = () => {
    const nextIdx = (mockInspections.findIndex(i => i.id === currentInspection.id) + 1) % mockInspections.length;
    const next = mockInspections[nextIdx];
    setCurrentInspection(next);
    setRecentFrames(prev => [next, ...prev.slice(0, 4)]);
  };

  const handleReviewAction = async (status: 'CONFIRMED' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE') => {
    await inspectionApi.submitReview(currentInspection.id, status);
    setReviewMessage(`Review recorded: marked as ${status.replace('_', ' ')}.`);
    setTimeout(() => setReviewMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">LIVE INSPECTION</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Live Optical Inspection Workstation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time automated edge camera stream and bounding box anomaly detection
          </p>
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-border px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-slate-300">CAM-01: 60 FPS</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">LATENCY: {currentInspection.inferenceTimeMs}ms</span>
          </div>
          <button
            onClick={() => setIsStreamActive(!isStreamActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              isStreamActive
                ? 'bg-amber-950/40 text-amber-400 border-amber-500/30 hover:bg-amber-900/50'
                : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/50'
            }`}
          >
            {isStreamActive ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Feed
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Resume Feed
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Layout: Camera Viewport (Left/Middle) + Decision Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live PCB Camera Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark relative flex flex-col">
            {/* Viewport Header */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold text-slate-200">ACTIVE CAMERA STREAM</span>
                <span className="text-slate-500 font-mono">• 4K HDR SENSOR</span>
              </div>
              <div className="font-mono text-cyan-400 text-[11px] bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30">
                AI ACTIVE: PATCHCORE-ESP32
              </div>
            </div>

            {/* PCB SVG Canvas with Bounding Boxes */}
            <PcbViewer
              boardId={currentInspection.boardId}
              status={currentInspection.status}
              defects={currentInspection.defects}
              selectedDefectId={selectedDefectId}
              onSelectDefect={(id) => setSelectedDefectId(id)}
              showScanner={isStreamActive}
              className="min-h-[420px]"
            />

            {/* Bottom Controls Bar */}
            <div className="mt-4 pt-3 border-t border-industrial-border/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInspectNext}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-glow-blue"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Inspect Next Board
                </button>
                <button
                  onClick={() => alert(`Captured optical frame for board ${currentInspection.boardId}`)}
                  className="px-3 py-1.5 bg-industrial-950 hover:bg-industrial-800 text-slate-300 rounded-lg text-xs font-medium border border-industrial-border transition flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Snapshot
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400">
                <span>Model: </span>
                <strong className="text-slate-200">ESP32-v1.0.8</strong>
                <span className="mx-2 text-slate-600">|</span>
                <span>Frame: </span>
                <strong className="text-cyan-400">#{currentInspection.id}</strong>
              </div>
            </div>
          </div>

          {/* Previous Frames Strip */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Previous Inspected Frames
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {recentFrames.map((frame, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentInspection(frame)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    currentInspection.id === frame.id
                      ? 'border-cyan-500 bg-cyan-950/30 shadow-glow-cyan'
                      : 'border-industrial-border bg-industrial-950/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-200 font-semibold">{frame.boardId}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${frame.status === 'GOOD' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                  <div className="h-10 rounded bg-[#091A14] border border-emerald-900/60 flex items-center justify-center relative overflow-hidden mb-1.5">
                    <span className="text-[10px] font-mono text-emerald-400">PCB</span>
                    {frame.status === 'DEFECTIVE' && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={frame.status === 'GOOD' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                      {frame.status}
                    </span>
                    <span className="font-mono text-slate-500">{frame.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Inference & Human Review Panel */}
        <div className="space-y-4">
          {/* Result Card */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-industrial-border/60">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Decision Result</span>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={currentInspection.status} size="md" />
                    <span className="text-xs font-mono text-slate-400">
                      {currentInspection.confidence}% confidence
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 uppercase">Board ID</span>
                  <div className="text-sm font-bold text-cyan-400">{currentInspection.boardId}</div>
                </div>
              </div>

              {/* Detected Defects List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Detected Anomalies ({currentInspection.defects.length})
                  </h4>
                  {currentInspection.defects.length === 0 && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> All Checks Passed
                    </span>
                  )}
                </div>

                {currentInspection.defects.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentInspection.defects.map((defect) => (
                      <div
                        key={defect.id}
                        onClick={() => setSelectedDefectId(defect.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition ${
                          selectedDefectId === defect.id
                            ? 'bg-rose-950/40 border-rose-500/80 shadow-glow-red'
                            : 'bg-industrial-950/60 border-industrial-border hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-rose-400">{defect.type}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {defect.severity} SEVERITY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono">{defect.location}</p>
                        {defect.suggestedAction && (
                          <p className="text-[11px] text-amber-300/80 mt-1 bg-amber-950/30 p-1.5 rounded border border-amber-900/40">
                            💡 {defect.suggestedAction}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Confidence: {defect.confidence}%</span>
                          <span>BBox: [{defect.bbox.x},{defect.bbox.y},{defect.bbox.width},{defect.bbox.height}]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-center space-y-2">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-emerald-300">IPC-A-610 Class 3 Compliant</p>
                    <p className="text-[11px] text-slate-400">Zero solder bridges, open traces, or misalignments detected on this PCB.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Telemetry Specifications */}
            <div className="mt-5 pt-3 border-t border-industrial-border/60 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Model Engine:</span>
                <span className="text-slate-200">PatchCore ESP32 v1.0.0</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inference Time:</span>
                <span className="text-cyan-400">{currentInspection.inferenceTimeMs} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-slate-300">{currentInspection.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Human Review & Active Learning Workflow Card */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Human Review & Feedback Loop
            </h4>
            <p className="text-[11px] text-slate-400">
              Confirm or correct AI prediction to continuously fine-tune the memory-bank anomaly model.
            </p>

            {reviewMessage && (
              <div className="p-2.5 rounded bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-fade-in">
                {reviewMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => handleReviewAction('CONFIRMED')}
                className="px-2.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Confirm Defect</span>
              </button>
              <button
                onClick={() => handleReviewAction('FALSE_POSITIVE')}
                className="px-2.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>False Positive</span>
              </button>
              <button
                onClick={() => handleReviewAction('FALSE_NEGATIVE')}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-industrial-border transition flex flex-col items-center justify-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>False Negative</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
