import React, { useState } from 'react';
import { Defect } from '../../types/defect';
import { InspectionStatus } from '../../types/inspection';
import { ZoomIn, ZoomOut, Maximize2, Scan, Eye, Camera, Cpu, Info, CheckCircle2, Flame, Layers } from 'lucide-react';

import { formatImageSrc } from '../../utils/imageUtils';

export const DEFECT_EXPLANATIONS: Record<string, { title: string; description: string; standard: string; severity: string; action: string; color: string }> = {
  // PCB SMT Defect Classes
  Short: {
    title: 'Short Circuit / Solder Bridging',
    description: 'Unintended conductive path bridging adjacent copper traces or SMD component pads.',
    standard: 'IPC-A-610 Class 3 Section 5.2.3 — Defect / Reject',
    severity: 'CRITICAL',
    action: 'Route board to selective desoldering rework station to remove conductive bridge.',
    color: '#EF4444'
  },
  Missing_hole: {
    title: 'Missing Drilled Hole / Via',
    description: 'Drilled via or pin-through hole omitted during PCB drilling, breaking interlayer continuity.',
    standard: 'IPC-A-610 Class 3 Section 10.2 — Non-conformance',
    severity: 'CRITICAL',
    action: 'Reject board to quarantine. Drill station spindle calibration required.',
    color: '#F97316'
  },
  Mouse_bite: {
    title: 'Mouse Bite / Substrate Tear-out',
    description: 'Excessive edge breakout along breakaway perforation tabs encroaching on minimum clearance.',
    standard: 'IPC-A-610 Section 8.1 — Edge Breakout Criteria',
    severity: 'MAJOR',
    action: 'Inspect conductor spacing. Deburr edge or route for engineering disposition.',
    color: '#3B82F6'
  },
  Open_circuit: {
    title: 'Open Circuit / Broken Trace',
    description: 'Conductor discontinuity or severe neck-down (>20% width reduction) preventing signal flow.',
    standard: 'IPC-A-610 Class 3 Section 5.1 — Defect',
    severity: 'CRITICAL',
    action: 'Tag as scrap or apply approved IPC micro-jumper repair procedure.',
    color: '#A855F7'
  },
  Spur: {
    title: 'Copper Spur / Conductor Flare',
    description: 'Sharp conductive protrusion extending from a copper trace toward adjacent conductor lines.',
    standard: 'IPC-A-610 Section 5.2 — Reduced Spacing Concern',
    severity: 'MAJOR',
    action: 'Micro-chisel or laser ablate spur if spacing violation exceeds 25% minimum gap.',
    color: '#F59E0B'
  },
  Spurious_copper: {
    title: 'Spurious Copper / Unetched Metal',
    description: 'Isolated conductive island left on laminate surface due to incomplete chemical etching.',
    standard: 'IPC-A-610 Section 5.2 — Extraneous Metal',
    severity: 'MINOR',
    action: 'Verify dielectric standoff distance. Scrape or remove extraneous metal flake.',
    color: '#14B8A6'
  },
  // Water Bottle Defect Classes
  broken_large: {
    title: 'Large Wall Fracture / Rupture',
    description: 'Gross crack, side puncture, or wall fracture causing structural failure and liquid leakage.',
    standard: 'ASTM D2684 / MVTec AD Bottle Integrity Standard',
    severity: 'CRITICAL',
    action: 'Eject bottle to reject bin. Inspect blow-molding cooling pin and mold clearance.',
    color: '#EF4444'
  },
  broken_small: {
    title: 'Small Surface Crack / Neck Chipping',
    description: 'Micro-crack or rim fracture exceeding 0.5mm packaging integrity threshold.',
    standard: 'ASTM D2684 / Packaging Quality Specification',
    severity: 'MAJOR',
    action: 'Reject unit. Verify de-molding ejection pressure and neck finish guide.',
    color: '#F97316'
  },
  contamination: {
    title: 'Resin Contamination / Foreign Matter',
    description: 'Embedded dark particulate, degraded polymer streak, or foreign matter on transparent surface.',
    standard: 'FDA 21 CFR 177.1520 / Food Grade Contact Standard',
    severity: 'CRITICAL',
    action: 'Quarantine unit. Inspect raw material hopper filter and purge extrusion barrel.',
    color: '#A855F7'
  },
  anomaly: {
    title: 'PatchCore Feature Anomaly',
    description: 'Pixel-level spatial feature embedding deviation exceeding normality threshold.',
    standard: 'MVTec AD Industrial Benchmark Standard',
    severity: 'MAJOR',
    action: 'Audit unit at manual visual verification station.',
    color: '#EC4899'
  }
};

interface PcbViewerProps {
  boardId?: string;
  unitLabel?: string;
  status?: InspectionStatus;
  defects?: Defect[];
  selectedDefectId?: string | null;
  onSelectDefect?: (defectId: string) => void;
  showScanner?: boolean;
  interactive?: boolean;
  className?: string;
  imageUrl?: string | null;
  annotatedImageBase64?: string | null;
  heatmapBase64?: string | null;
  engineName?: string;
}

export const PcbViewer: React.FC<PcbViewerProps> = ({
  boardId = 'UNIT-001',
  unitLabel = 'Unit',
  status = 'GOOD',
  defects = [],
  selectedDefectId,
  onSelectDefect,
  showScanner = false,
  interactive = true,
  className = '',
  imageUrl = null,
  annotatedImageBase64 = null,
  heatmapBase64 = null,
  engineName,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showBBoxes, setShowBBoxes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [viewMode, setViewMode] = useState<'real' | 'schematic'>('real');
  const [hoveredDefect, setHoveredDefect] = useState<Defect | null>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  // Active highlighted defect info
  const activeDefect = (defects || []).find(d => d.id === selectedDefectId) || hoveredDefect;
  const activeExplanation = activeDefect ? (DEFECT_EXPLANATIONS[activeDefect.type] || {
    title: activeDefect.type,
    description: `Anomaly localized at ${activeDefect.location || 'detected region'}`,
    standard: 'Industrial Quality Standard Inspection',
    severity: activeDefect.severity || 'MAJOR',
    action: activeDefect.suggestedAction || 'Visual review required.',
    color: '#EF4444'
  }) : null;

  const isBottle = unitLabel?.toLowerCase().includes('bottle') || boardId?.toLowerCase().includes('bottle');
  const displaySrc = formatImageSrc(
    showHeatmap && heatmapBase64
      ? heatmapBase64
      : (annotatedImageBase64 || imageUrl)
  );
  const hasRealImage = Boolean(displaySrc);

  return (
    <div className={`relative bg-[#070D18] border border-industrial-border rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Top Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0B1424]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-industrial-border pointer-events-auto shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-mono font-bold text-slate-100">{boardId}</span>
          <span className="text-[10px] text-slate-500">|</span>
          <span className="text-[10px] font-mono text-cyan-400">
            {showHeatmap && heatmapBase64 ? 'PATCHCORE HEATMAP' : (viewMode === 'real' && hasRealImage ? 'REAL OPTICAL SENSOR' : (isBottle ? 'OPTICAL CAMERA' : 'VECTOR SCHEMATIC'))}
          </span>
        </div>

        {/* View Toggle & Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#0B1424]/90 backdrop-blur-md p-1 rounded-lg border border-industrial-border pointer-events-auto shadow-md">
          {heatmapBase64 && (
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                showHeatmap
                  ? 'bg-rose-600 text-white shadow-glow-red animate-pulse'
                  : 'bg-slate-800 text-rose-300 hover:text-white'
              }`}
              title="Toggle PatchCore Spatial Anomaly Heatmap"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{showHeatmap ? 'Heatmap ON' : 'Heatmap'}</span>
            </button>
          )}

          {!isBottle && hasRealImage && (
            <button
              onClick={() => setViewMode(viewMode === 'real' ? 'schematic' : 'real')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                viewMode === 'real'
                  ? 'bg-blue-600 text-white shadow-glow-blue'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle between Real Optical Capture and Schematic"
            >
              {viewMode === 'real' ? <Camera className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
              <span>{viewMode === 'real' ? 'Real Image' : 'Schematic'}</span>
            </button>
          )}

          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            title="Toggle Defect Localization Overlays"
            className={`p-1.5 rounded text-xs transition ${showBBoxes ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Fit to Screen"
            className="p-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative flex-1 min-h-[380px] w-full flex items-center justify-center p-4 overflow-hidden select-none bg-black/40">
        {/* Animated Radar Scanning Line */}
        {showScanner && <div className="radar-scanner z-20 pointer-events-none" />}

        {/* Viewport Scalable Container */}
        <div 
          className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full"
          style={{ transform: `scale(${zoom})` }}
        >
          {viewMode === 'real' && hasRealImage ? (
            /* REAL OPTICAL IMAGE RENDERER */
            <div className="relative max-w-[760px] max-h-[500px] rounded-lg overflow-hidden border border-slate-700/80 shadow-2xl bg-black">
              <img
                src={displaySrc}
                alt={`${unitLabel} ${boardId}`}
                className="w-full h-auto object-contain max-h-[460px] block"
              />

              {/* Anomaly Heatmap Active Indicator */}
              {showHeatmap && heatmapBase64 && (
                <div className="absolute top-2 right-2 bg-black/85 backdrop-blur px-2.5 py-1 rounded border border-rose-500/60 text-[10px] font-mono text-rose-300 flex items-center gap-1.5 z-20 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  PATCHCORE SPATIAL HEATMAP (TURBO/JET)
                </div>
              )}

              {/* Overlaid Interactive Bounding Boxes on Real Image */}
              {showBBoxes && (defects || []).map((defect) => {
                const isSelected = selectedDefectId === defect.id;
                const isHovered = hoveredDefect?.id === defect.id;
                const color = DEFECT_EXPLANATIONS[defect.type]?.color || '#EF4444';

                // Normalized box percentage based on 3056x2464 optical resolution
                const left = `${Math.min(95, Math.max(1, (defect.bbox.x / 3056) * 100))}%`;
                const top = `${Math.min(95, Math.max(1, (defect.bbox.y / 2464) * 100))}%`;
                const width = `${Math.min(50, Math.max(3, (defect.bbox.width / 3056) * 100))}%`;
                const height = `${Math.min(50, Math.max(3, (defect.bbox.height / 2464) * 100))}%`;

                return (
                  <div
                    key={defect.id}
                    onClick={() => onSelectDefect && onSelectDefect(defect.id)}
                    onMouseEnter={() => setHoveredDefect(defect)}
                    onMouseLeave={() => setHoveredDefect(null)}
                    style={{
                      position: 'absolute',
                      top,
                      left,
                      width,
                      height,
                      borderColor: color,
                    }}
                    className={`border-2 rounded cursor-pointer transition-all ${
                      isSelected || isHovered
                        ? 'bg-rose-500/25 ring-2 ring-white shadow-glow-red z-30'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 z-10'
                    }`}
                  >
                    {/* Bounding Box Floating Label */}
                    <span 
                      style={{ backgroundColor: color }}
                      className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono text-white whitespace-nowrap shadow-md"
                    >
                      {defect.type} ({defect.confidence}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : isBottle ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-industrial-950/60 rounded-xl border border-industrial-border min-h-[360px] min-w-[480px]">
              <Camera className="w-12 h-12 text-cyan-400 mb-3 animate-pulse" />
              <p className="font-semibold text-slate-200 text-sm">Optical Bottle Inspection Stream</p>
              <p className="text-xs text-slate-500 font-mono mt-1">Acquiring sensor frame for {boardId}...</p>
            </div>
          ) : (
            /* VECTOR PCB SCHEMATIC FALLBACK */
            <svg
              viewBox="0 0 800 480"
              className="w-[720px] max-w-full h-auto drop-shadow-2xl rounded-lg"
              style={{ filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.7))' }}
            >
              <defs>
                <linearGradient id="pcbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B251E" />
                  <stop offset="50%" stopColor="#0E3329" />
                  <stop offset="100%" stopColor="#081E18" />
                </linearGradient>

                <linearGradient id="mcuShield" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                <pattern id="pcbGridSub" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="10" cy="10" r="0.8" fill="#14532D" opacity="0.4" />
                </pattern>
              </defs>

              <rect x="20" y="20" width="760" height="440" rx="18" fill="url(#pcbGrad)" stroke="#166534" strokeWidth="2.5" />
              <rect x="20" y="20" width="760" height="440" rx="18" fill="url(#pcbGridSub)" />

              {/* Mounting Holes */}
              {[[45, 45], [755, 45], [45, 435], [755, 435]].map(([cx, cy], i) => (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="16" fill="none" stroke="#CA8A04" strokeWidth="2.5" />
                  <circle cx={cx} cy={cy} r="9" fill="#070D18" stroke="#EAB308" strokeWidth="1" />
                </g>
              ))}

              {/* Copper Tracks */}
              <g stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.45" fill="none">
                <path d="M 120 70 L 190 70 L 230 110 L 230 190" />
                <path d="M 130 90 L 180 90 L 210 120 L 210 210" />
                <path d="M 120 410 L 190 410 L 230 370 L 230 290" />
                <path d="M 130 390 L 180 390 L 210 360 L 210 270" />
              </g>

              {/* MCU Module Shield */}
              <g transform="translate(300, 140)">
                <rect x="0" y="0" width="210" height="200" rx="6" fill="url(#mcuShield)" stroke="#64748B" strokeWidth="2" />
                <text x="105" y="80" textAnchor="middle" fill="#E2E8F0" fontSize="13" fontWeight="bold" fontFamily="monospace">
                  ESP-WROOM-32
                </text>
                <text x="105" y="105" textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                  DUAL CORE 240MHz
                </text>
              </g>

              {/* Defect Bounding Boxes */}
              {showBBoxes && (defects || []).map((defect) => {
                const isSelected = selectedDefectId === defect.id;
                const isHighRes = defect.bbox.x > 800 || defect.bbox.y > 480;
                const boxX = isHighRes ? Math.round(defect.bbox.x * (800 / 3056)) : defect.bbox.x;
                const boxY = isHighRes ? Math.round(defect.bbox.y * (480 / 2464)) : defect.bbox.y;
                const boxW = isHighRes ? Math.max(24, Math.round(defect.bbox.width * (800 / 3056))) : defect.bbox.width;
                const boxH = isHighRes ? Math.max(24, Math.round(defect.bbox.height * (480 / 2464))) : defect.bbox.height;
                return (
                  <g
                    key={defect.id}
                    onClick={() => onSelectDefect && onSelectDefect(defect.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={boxX}
                      y={boxY}
                      width={boxW}
                      height={boxH}
                      fill="rgba(239, 68, 68, 0.2)"
                      stroke="#EF4444"
                      strokeWidth={isSelected ? 3 : 2}
                      rx="3"
                    />
                    <text
                      x={boxX + 4}
                      y={Math.max(16, boxY - 6)}
                      fill="#FCA5A5"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {defect.type} ({defect.confidence}%)
                    </text>
                  </g>
                );
              })}

              {status === 'GOOD' && (defects || []).length === 0 && (
                <g transform="translate(60, 45)">
                  <rect x="0" y="0" width="110" height="26" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.5" />
                  <circle cx="14" cy="13" r="4" fill="#10B981" />
                  <text x="26" y="18" fill="#10B981" fontSize="12" fontWeight="bold" fontFamily="monospace">
                    GOOD PASS
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Localization & Defect Technical Explanation Drawer */}
      {activeExplanation && (
        <div className="bg-[#0B1528] border-t border-industrial-border/80 px-4 py-3 animate-fade-in">
          <div className="flex items-start gap-3">
            <div 
              style={{ borderColor: activeExplanation.color }}
              className="w-8 h-8 rounded-lg bg-black/40 border-2 flex items-center justify-center flex-shrink-0 text-white font-bold"
            >
              <Info className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white tracking-wide">{activeExplanation.title}</span>
                <span 
                  style={{ backgroundColor: `${activeExplanation.color}20`, color: activeExplanation.color, borderColor: `${activeExplanation.color}50` }}
                  className="px-2 py-0.5 rounded text-[10px] font-bold border"
                >
                  {activeExplanation.severity}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 ml-auto">
                  LOC: [{activeDefect?.bbox.x}, {activeDefect?.bbox.y}, {activeDefect?.bbox.width}, {activeDefect?.bbox.height}]
                </span>
              </div>
              <p className="text-slate-300 leading-snug">{activeExplanation.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] font-mono text-slate-400">
                <span>Standard: <strong className="text-slate-200">{activeExplanation.standard}</strong></span>
                <span>•</span>
                <span>Action: <strong className="text-amber-400">{activeExplanation.action}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Meta / Status Bar */}
      <div className="bg-[#080F1D] border-t border-industrial-border px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{unitLabel}:</span>
            <span className="font-mono text-slate-200">{boardId}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Inspection:</span>
            <span className={`font-semibold ${status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status} {(defects || []).length > 0 && `(${defects.length} Defect${defects.length > 1 ? 's' : ''})`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Scan className="w-3 h-3" />
            {engineName || (heatmapBase64 ? 'PatchCore Feature Anomaly Engine' : 'YOLO11 Edge Engine')}
          </span>
        </div>
      </div>
    </div>
  );
};
