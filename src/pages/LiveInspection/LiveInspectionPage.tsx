import React, { useState, useEffect } from 'react';
import { PcbViewer } from '../../components/inspection/PcbViewer';
import { ConveyorBelt, ConveyorBoard } from '../../components/inspection/ConveyorBelt';
import { StatusBadge } from '../../components/common/StatusBadge';
import { inspectionStream } from '../../services/websocket/inspectionStream';
import { mockInspections } from '../../services/mock/mockData';
import { Inspection } from '../../types/inspection';
import { inspectionApi } from '../../services/api/inspectionApi';
import { useDataset } from '../../context/DatasetContext';
import { formatImageSrc } from '../../utils/imageUtils';
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
  FileCheck,
  FastForward
} from 'lucide-react';

export const LiveInspectionPage: React.FC = () => {
  const { activeDataset, activeProfile } = useDataset();
  const [currentInspection, setCurrentInspection] = useState<Inspection>(() => {
    if (activeDataset === 'water_bottle') {
      return {
        id: 'FRAME-01',
        boardId: 'bottle_01',
        boardType: 'PET Water Bottle',
        timestamp: new Date().toLocaleTimeString(),
        status: 'GOOD',
        confidence: 99,
        inferenceTimeMs: 14,
        imageUrl: '/api/images/water_bottle/test/good/000.png',
        defects: [],
        reviewed: false
      };
    }
    return {
      ...mockInspections[1],
      imageUrl: '/api/images/board_1/04_missing_hole_07.jpg'
    };
  });
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(true);
  const [recentFrames, setRecentFrames] = useState<Inspection[]>(() => {
    return activeDataset === 'water_bottle'
      ? []
      : mockInspections.slice(0, 5).map(m => ({
          ...m,
          imageUrl: '/api/images/board_1/04_missing_hole_07.jpg'
        }));
  });
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  // Real Backend Board & Conveyor Queue State
  const [availableBoards, setAvailableBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('board_1');
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isConveyorRunning, setIsConveyorRunning] = useState<boolean>(true);

  // Load conveyor session whenever active dataset changes
  useEffect(() => {
    let isMounted = true;
    inspectionApi.startInspection('auto', 6, activeDataset).then((session) => {
      if (isMounted && session && session.queue) {
        setActiveSession(session);
        inspectionApi.stepInspection(session.inspection_id).then((stepped) => {
          if (isMounted && stepped && stepped.queue) {
            setActiveSession(stepped);
            updateUiFromQueue(stepped.queue, 0);
          } else if (isMounted) {
            updateUiFromQueue(session.queue, 0);
          }
        });
      }
    }).catch(e => console.warn('Conveyor start failed', e));

    if (activeDataset === 'pcb_industrial') {
      inspectionApi.getBoards().then((boards) => {
        if (isMounted && boards.length > 0) setAvailableBoards(boards);
      });
    } else {
      setAvailableBoards([]);
    }
    return () => { isMounted = false; };
  }, [activeDataset]);

  const handleSelectBoard = async (boardId: string) => {
    setSelectedBoardId(boardId);
    try {
      const session = await inspectionApi.startInspection(boardId, 6, activeDataset);
      if (session && session.queue) {
        setActiveSession(session);
        const stepped = await inspectionApi.stepInspection(session.inspection_id);
        if (stepped && stepped.queue) {
          setActiveSession(stepped);
          updateUiFromQueue(stepped.queue, 0);
        } else {
          updateUiFromQueue(session.queue, 0);
        }
      }
    } catch (e) {
      console.warn('[LiveInspection] Failed to start backend inspection', e);
    }
  };

  const updateUiFromQueue = (queue: any[], targetIdx: number) => {
    const item = queue[targetIdx] || queue[0];
    if (!item) return;

    const res = item.results || {};
    const rawDefects = res.defects || [];

    const defects = rawDefects.map((d: any, idx: number) => {
      const x1 = d.bbox?.[0] ?? 100;
      const y1 = d.bbox?.[1] ?? 100;
      const x2 = d.bbox?.[2] ?? 250;
      const y2 = d.bbox?.[3] ?? 250;
      const w = Math.max(30, x2 - x1);
      const h = Math.max(30, y2 - y1);

      return {
        id: `DEF-${idx}`,
        type: d.class_name || 'Defect',
        severity: (d.confidence > 0.80 ? 'CRITICAL' : 'MAJOR') as any,
        location: `X:${x1} Y:${y1} (W:${w} H:${h})`,
        confidence: Math.round((d.confidence || 0.88) * 100),
        bbox: {
          x: x1,
          y: y1,
          width: w,
          height: h,
        },
        suggestedAction: d.suggestedAction || (
          d.class_name === 'broken_large' ? 'Eject bottle to reject bin immediately.' :
          d.class_name === 'broken_small' ? 'Reject unit. Inspect demolding pin.' :
          d.class_name === 'contamination' ? 'Quarantine unit. Inspect raw resin hopper.' :
          d.class_name === 'Missing_hole' ? 'Quarantine board. Recalibrate CNC drilling spindle.' :
          d.class_name === 'Short' ? 'Route to desoldering station to clear solder bridge.' :
          'Route to rework station for optical verification.'
        )
      };
    });

    const rawImgUrl = item.thumbnail_url || (item.image_id ? (activeDataset === 'water_bottle' ? `/api/images/water_bottle/${item.image_id}` : `/api/images/${item.board_id}/${item.image_id}`) : undefined);
    const imageUrl = rawImgUrl ? formatImageSrc(rawImgUrl) : undefined;

    const insp: Inspection = {
      id: `FRAME-${item.position + 1}`,
      boardId: item.name || item.board_id,
      boardType: activeProfile?.name || (activeDataset === 'water_bottle' ? 'PET Water Bottle' : 'ESP32 Industrial PCB'),
      timestamp: new Date().toLocaleTimeString(),
      status: (res.verdict === 'PASS' || (!res.verdict && defects.length === 0)) ? 'GOOD' : 'DEFECTIVE',
      confidence: defects[0]?.confidence || (res.defects?.[0]?.confidence ? Math.round(res.defects[0].confidence * 100) : 98),
      inferenceTimeMs: res.inference_time_ms || 14,
      imageUrl: imageUrl,
      annotatedImageBase64: res.annotated_image_b64 ? formatImageSrc(res.annotated_image_b64) : undefined,
      heatmapBase64: res.heatmap_b64 ? formatImageSrc(res.heatmap_b64) : undefined,
      anomalyScore: res.anomaly_score,
      threshold: res.threshold,
      datasetId: activeDataset,
      defects: defects,
      reviewed: false
    };

    setCurrentInspection(insp);

    // Update filmstrip with queue items and their real optical images
    const frames: Inspection[] = queue.map((qItem: any) => {
      const qRes = qItem.results || {};
      const qRawDefects = qRes.defects || [];
      const qDefects = qRawDefects.map((d: any, idx: number) => ({
        id: `DEF-${idx}`,
        type: d.class_name || 'Defect',
        severity: (d.confidence > 0.80 ? 'CRITICAL' : 'MAJOR') as any,
        location: `X:${d.bbox?.[0] || 0} Y:${d.bbox?.[1] || 0}`,
        confidence: Math.round((d.confidence || 0.88) * 100),
        bbox: {
          x: d.bbox?.[0] || 0,
          y: d.bbox?.[1] || 0,
          width: d.bbox?.[2] ? (d.bbox[2] - d.bbox[0]) : 80,
          height: d.bbox?.[3] ? (d.bbox[3] - d.bbox[1]) : 70,
        },
        suggestedAction: 'Route to rework station for optical verification.'
      }));

      const qImgUrl = qItem.thumbnail_url ? formatImageSrc(qItem.thumbnail_url) : undefined;

      return {
        id: `FRAME-${qItem.position + 1}`,
        boardId: `${qItem.board_id} (${qItem.similarity_pct || '100%'})`,
        boardType: activeProfile?.name || (activeDataset === 'water_bottle' ? 'PET Water Bottle' : 'ESP32 Industrial PCB'),
        timestamp: new Date().toLocaleTimeString(),
        status: qItem.status === 'completed' ? 'GOOD' : (qItem.status === 'defective' ? 'DEFECTIVE' : 'GOOD'),
        confidence: Math.round((qItem.similarity || 1.0) * 100),
        inferenceTimeMs: qRes.inference_time_ms || 14,
        imageUrl: qImgUrl,
        annotatedImageBase64: qRes.annotated_image_b64 ? formatImageSrc(qRes.annotated_image_b64) : undefined,
        heatmapBase64: qRes.heatmap_b64 ? formatImageSrc(qRes.heatmap_b64) : undefined,
        anomalyScore: qRes.anomaly_score,
        threshold: qRes.threshold,
        datasetId: activeDataset,
        defects: qDefects,
        reviewed: false
      };
    });
    setRecentFrames(frames.slice(0, 5));
  };

  useEffect(() => {
    inspectionStream.connect();
    const unsubscribe = inspectionStream.subscribe((newInspection) => {
      if (isStreamActive && !activeSession && activeDataset === 'pcb_industrial') {
        setCurrentInspection(newInspection);
        setRecentFrames((prev) => [newInspection, ...prev.slice(0, 4)]);
      }
    });

    return () => {
      unsubscribe();
      inspectionStream.disconnect();
    };
  }, [isStreamActive, activeSession, activeDataset]);

  const handleInspectNext = async () => {
    if (activeSession) {
      try {
        const nextState = await inspectionApi.stepInspection(activeSession.inspection_id);
        if (nextState && nextState.queue) {
          setActiveSession(nextState);
          updateUiFromQueue(nextState.queue, nextState.current_index);
          return;
        }
      } catch (e) {
        console.warn('Step failed, fallback to mock', e);
      }
    }

    const nextIdx = (mockInspections.findIndex(i => i.id === currentInspection.id) + 1) % mockInspections.length;
    const next = mockInspections[nextIdx];
    setCurrentInspection(next);
    setRecentFrames(prev => [next, ...prev.slice(0, 4)]);
  };

  const handleRunAll = async () => {
    if (!activeSession) return;
    try {
      const finished = await inspectionApi.runAllInspection(activeSession.inspection_id);
      if (finished && finished.queue) {
        setActiveSession(finished);
        updateUiFromQueue(finished.queue, finished.current_index || 0);
      }
    } catch (e) {
      console.warn('Run all failed', e);
    }
  };

  const handleSelectConveyorBoard = (board: ConveyorBoard, index: number) => {
    if (activeSession && activeSession.queue) {
      updateUiFromQueue(activeSession.queue, index);
    }
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
            Live {activeProfile?.name || (activeDataset === 'water_bottle' ? 'Water Bottle' : 'PCB')} Inspection Workstation
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeDataset === 'water_bottle' 
              ? 'Real-time automated edge camera stream and PatchCore spatial feature anomaly detection'
              : 'Real-time automated edge camera stream and YOLO11 bounding box anomaly detection'}
          </p>
        </div>

        {/* Telemetry Chips */}
        <div className="flex items-center gap-3">
          {availableBoards.length > 0 && (
            <div className="flex items-center gap-2 bg-industrial-900 border border-industrial-border px-3 py-1.5 rounded-lg text-xs font-mono shadow-sm">
              <span className="text-slate-400 font-semibold">
                INSPECT {activeDataset === 'water_bottle' ? 'UNIT' : 'BOARD'}:
              </span>
              <select
                value={selectedBoardId}
                onChange={(e) => handleSelectBoard(e.target.value)}
                className="bg-industrial-950 border border-industrial-border rounded px-2 py-0.5 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {availableBoards.map((b) => (
                  <option key={b.board_id} value={b.board_id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      {/* Automated Physical Conveyor Belt Simulation */}
      <ConveyorBelt
        queue={activeSession?.queue || []}
        currentIndex={activeSession?.current_index ?? 0}
        isRunning={isConveyorRunning}
        onToggleRunning={() => setIsConveyorRunning(prev => !prev)}
        onStepNext={handleInspectNext}
        onRunAll={handleRunAll}
        onSelectBoard={handleSelectConveyorBoard}
      />

      {/* Main Split Layout: Camera Viewport (Left/Middle) + Decision Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Camera Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark relative flex flex-col">
            {/* Viewport Header */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-semibold text-slate-200">ACTIVE CAMERA STREAM</span>
                <span className="text-slate-500 font-mono">• 4K HDR OPTICAL SENSOR</span>
              </div>
              <div className="font-mono text-cyan-400 text-[11px] bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30">
                AI ACTIVE: {activeProfile?.model_metrics?.engine_name || (activeDataset === 'water_bottle' ? 'PatchCore-Bottle (RTX 2050 GPU)' : 'YOLO11-PCB (RTX 2050 GPU)')}
              </div>
            </div>

            {/* Real Optical & Schematic Canvas with Bounding Boxes & Heatmap */}
            <PcbViewer
              boardId={currentInspection?.boardId || (activeDataset === 'water_bottle' ? 'BOTTLE-01' : 'ESP32-001')}
              unitLabel={activeDataset === 'water_bottle' ? 'Bottle Unit' : 'PCB Board'}
              status={currentInspection?.status || 'GOOD'}
              defects={currentInspection?.defects || []}
              selectedDefectId={selectedDefectId}
              onSelectDefect={(id) => setSelectedDefectId(id)}
              showScanner={isStreamActive}
              imageUrl={currentInspection?.imageUrl}
              annotatedImageBase64={currentInspection?.annotatedImageBase64}
              heatmapBase64={currentInspection?.heatmapBase64}
              engineName={activeProfile?.model_metrics?.engine_name || (activeDataset === 'water_bottle' ? 'PatchCore Feature Anomaly Engine (RTX 2050)' : 'YOLO11 Edge Engine')}
              className="min-h-[420px]"
            />

            {/* Bottom Controls Bar */}
            <div className="mt-4 pt-3 border-t border-industrial-border/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInspectNext}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-glow-blue"
                >
                  <SkipForward className="w-3.5 h-3.5" /> Inspect Next {activeDataset === 'water_bottle' ? 'Bottle' : 'Board'}
                </button>
                <button
                  onClick={() => alert(`Captured optical frame for ${currentInspection?.boardId || 'unit'}`)}
                  className="px-3 py-1.5 bg-industrial-950 hover:bg-industrial-800 text-slate-300 rounded-lg text-xs font-medium border border-industrial-border transition flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" /> Snapshot
                </button>
              </div>

              <div className="text-xs font-mono text-slate-400">
                <span>Model: </span>
                <strong className="text-slate-200">
                  {activeProfile?.model_metrics?.model_name || (activeDataset === 'water_bottle' ? 'Bottle-PatchCore-v1.0' : 'ESP32-v1.0.8')}
                </strong>
                <span className="mx-2 text-slate-600">|</span>
                <span>Frame: </span>
                <strong className="text-cyan-400">#{currentInspection?.id || '1'}</strong>
              </div>
            </div>
          </div>

          {/* Previous Frames Strip */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 shadow-card-dark">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Previous Inspected Frames
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(recentFrames || []).map((frame, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (frame) {
                      setCurrentInspection({
                        ...frame,
                        defects: frame.defects || []
                      });
                    }
                  }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    currentInspection?.id === frame.id
                      ? 'border-cyan-500 bg-cyan-950/30 shadow-glow-cyan'
                      : 'border-industrial-border bg-industrial-950/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-200 font-semibold truncate max-w-[90px]">{frame.boardId}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${frame.status === 'GOOD' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </div>
                  <div className="h-11 rounded bg-[#091A14] border border-slate-700/60 flex items-center justify-center relative overflow-hidden mb-1.5">
                    {frame.annotatedImageBase64 || frame.imageUrl ? (
                      <img
                        src={formatImageSrc(frame.annotatedImageBase64 || frame.imageUrl)}
                        alt={frame.boardId}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-400">
                        {activeDataset === 'water_bottle' ? 'PET' : 'PCB'}
                      </span>
                    )}
                    {frame.status === 'DEFECTIVE' && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-black" />
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
                    <StatusBadge status={currentInspection?.status || 'GOOD'} size="md" />
                    <span className="text-xs font-mono text-slate-400">
                      {currentInspection?.confidence || 98}% confidence
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 uppercase">
                    {activeDataset === 'water_bottle' ? 'Unit' : 'Board ID'}
                  </span>
                  <div className="text-sm font-bold text-cyan-400 truncate max-w-[150px]">
                    {currentInspection?.boardId || (activeDataset === 'water_bottle' ? 'BOTTLE-01' : 'ESP32')}
                  </div>
                </div>
              </div>

              {/* Detected Defects List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Detected Anomalies ({(currentInspection?.defects || []).length})
                  </h4>
                  {(!currentInspection?.defects || currentInspection.defects.length === 0) && (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> All Checks Passed
                    </span>
                  )}
                </div>

                {(currentInspection?.defects || []).length > 0 ? (
                  <div className="space-y-2.5">
                    {(currentInspection?.defects || []).map((defect) => (
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
                    <p className="text-xs font-semibold text-emerald-300">
                      {activeProfile?.standards_reference || (activeDataset === 'water_bottle' ? 'ISO 9001 / ASTM D2684 Compliant' : 'IPC-A-610 Class 3 Compliant')}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {activeDataset === 'water_bottle' 
                        ? 'Zero wall fractures, rim chips, or foreign particulates detected on this unit.' 
                        : 'Zero solder bridges, open traces, or misalignments detected on this PCB.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inspection Telemetry Specifications */}
            <div className="mt-5 pt-3 border-t border-industrial-border/60 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Model Engine:</span>
                <span className="text-slate-200">
                  {activeProfile?.model_metrics?.engine_name || (activeDataset === 'water_bottle' ? 'PatchCore ResNet18 (RTX 2050 CUDA)' : 'YOLO11n-PCB (RTX 2050 CUDA)')}
                </span>
              </div>
              {currentInspection?.anomalyScore !== undefined && (
                <div className="flex justify-between text-slate-400">
                  <span>Anomaly Score:</span>
                  <span className={`font-semibold ${currentInspection.status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {currentInspection.anomalyScore.toFixed(4)} (Threshold: {currentInspection.threshold || 0.0070})
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Inference Time:</span>
                <span className="text-cyan-400">{currentInspection?.inferenceTimeMs ?? 14} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Timestamp:</span>
                <span className="text-slate-300">{currentInspection?.timestamp || ''}</span>
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
