import React, { useState } from 'react';
import { Defect } from '../../types/defect';
import { InspectionStatus } from '../../types/inspection';
import { ZoomIn, ZoomOut, Maximize2, Scan, Eye } from 'lucide-react';

interface PcbViewerProps {
  boardId?: string;
  status?: InspectionStatus;
  defects?: Defect[];
  selectedDefectId?: string | null;
  onSelectDefect?: (defectId: string) => void;
  showScanner?: boolean;
  interactive?: boolean;
  className?: string;
}

export const PcbViewer: React.FC<PcbViewerProps> = ({
  boardId = 'ESP32-001',
  status = 'GOOD',
  defects = [],
  selectedDefectId,
  onSelectDefect,
  showScanner = false,
  interactive = true,
  className = '',
}) => {
  const [zoom, setZoom] = useState(1);
  const [showBBoxes, setShowBBoxes] = useState(true);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className={`relative bg-[#070D18] border border-industrial-border rounded-xl overflow-hidden flex flex-col ${className}`}>
      {/* Top Overlay Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0B1424]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-industrial-border pointer-events-auto shadow-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="text-xs font-mono font-medium text-slate-200">{boardId}</span>
          <span className="text-[10px] text-slate-400">|</span>
          <span className="text-[10px] font-mono text-cyan-400">1920×1080</span>
        </div>

        <div className="flex items-center gap-1 bg-[#0B1424]/85 backdrop-blur-md p-1 rounded-lg border border-industrial-border pointer-events-auto shadow-md">
          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            title="Toggle Defect Boxes"
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

      {/* Main PCB Canvas Viewport */}
      <div className="relative flex-1 min-h-[300px] w-full flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Animated Radar Scanning Line */}
        {showScanner && <div className="radar-scanner z-10 pointer-events-none" />}

        {/* Scalable PCB Drawing */}
        <div 
          className="relative transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 800 480"
            className="w-[720px] max-w-full h-auto drop-shadow-2xl rounded-lg"
            style={{ filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.7))' }}
          >
            {/* Definitions */}
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

            {/* Board Substrate */}
            <rect x="20" y="20" width="760" height="440" rx="18" fill="url(#pcbGrad)" stroke="#166534" strokeWidth="2.5" />
            <rect x="20" y="20" width="760" height="440" rx="18" fill="url(#pcbGridSub)" />

            {/* Mounting Holes with Gold annular rings */}
            {[
              [45, 45], [755, 45], [45, 435], [755, 435]
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="16" fill="none" stroke="#CA8A04" strokeWidth="2.5" />
                <circle cx={cx} cy={cy} r="9" fill="#070D18" stroke="#EAB308" strokeWidth="1" />
              </g>
            ))}

            {/* Copper Tracks & Signal Lines */}
            <g stroke="#22C55E" strokeWidth="1.5" strokeOpacity="0.45" fill="none">
              <path d="M 120 70 L 190 70 L 230 110 L 230 190" />
              <path d="M 130 90 L 180 90 L 210 120 L 210 210" />
              <path d="M 120 410 L 190 410 L 230 370 L 230 290" />
              <path d="M 130 390 L 180 390 L 210 360 L 210 270" />
              <path d="M 370 190 L 410 190 L 440 160 L 490 160" />
              <path d="M 370 290 L 410 290 L 440 320 L 490 320" />
              <path d="M 520 200 L 590 200 L 620 170 L 660 170" />
              <path d="M 520 280 L 590 280 L 620 310 L 660 310" />
            </g>

            {/* Ground Plane Vias */}
            {[
              [140, 150], [160, 180], [150, 310], [170, 330],
              [380, 130], [390, 350], [680, 140], [680, 340]
            ].map(([vx, vy], i) => (
              <circle key={i} cx={vx} cy={vy} r="2.5" fill="#EAB308" opacity="0.8" />
            ))}

            {/* Left Micro-USB / Type-C Connector */}
            <g>
              <rect x="15" y="195" width="45" height="90" rx="6" fill="#64748B" stroke="#94A3B8" strokeWidth="2" />
              <rect x="25" y="210" width="30" height="60" rx="3" fill="#1E293B" />
              <line x1="60" y1="210" x2="80" y2="210" stroke="#CA8A04" strokeWidth="2" />
              <line x1="60" y1="230" x2="80" y2="230" stroke="#CA8A04" strokeWidth="2" />
              <line x1="60" y1="250" x2="80" y2="250" stroke="#CA8A04" strokeWidth="2" />
              <line x1="60" y1="270" x2="80" y2="270" stroke="#CA8A04" strokeWidth="2" />
              <text x="70" y="185" fill="#94A3B8" fontSize="10" fontFamily="monospace">USB-C</text>
            </g>

            {/* AMS1117 3.3V Voltage Regulator (U2) */}
            <g id="component-ams1117">
              <rect x="330" y="140" width="90" height="70" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <rect x="350" y="130" width="50" height="10" fill="#94A3B8" />
              <rect x="340" y="210" width="16" height="12" fill="#EAB308" />
              <rect x="367" y="210" width="16" height="12" fill="#EAB308" />
              <rect x="394" y="210" width="16" height="12" fill="#EAB308" />
              <text x="375" y="180" fill="#94A3B8" fontSize="10" textAnchor="middle" fontFamily="monospace">AMS1117</text>
              <text x="375" y="120" fill="#64748B" fontSize="9" textAnchor="middle">U2</text>
            </g>

            {/* Central ESP32 Metal Can Shield (MCU) */}
            <g id="component-esp32-mcu">
              <rect x="220" y="180" width="150" height="120" rx="6" fill="url(#mcuShield)" stroke="#64748B" strokeWidth="2" />
              {/* Espressif Logo & Text */}
              <rect x="235" y="195" width="20" height="20" rx="3" fill="#EF4444" opacity="0.8" />
              <text x="265" y="210" fill="#F8FAFC" fontSize="13" fontWeight="bold" fontFamily="monospace">ESP32</text>
              <text x="235" y="235" fill="#94A3B8" fontSize="10" fontFamily="monospace">WROOM-32D</text>
              <text x="235" y="255" fill="#64748B" fontSize="8" fontFamily="monospace">FCC ID: 2AC7Z-ESPWROOM32D</text>
              <text x="235" y="275" fill="#64748B" fontSize="8" fontFamily="monospace">CE 0700 | 2026-REV.C</text>

              {/* MCU Pins on top/bottom/sides */}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={`pin-t-${i}`} x={235 + i * 15} y="172" width="8" height="8" fill="#CA8A04" />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <rect key={`pin-b-${i}`} x={235 + i * 15} y="300" width="8" height="8" fill="#CA8A04" />
              ))}
            </g>

            {/* PCB Trace Antenna on Right */}
            <g id="pcb-antenna">
              <rect x="670" y="160" width="85" height="160" rx="4" fill="#0A1D17" stroke="#166534" strokeWidth="1" />
              {/* Serpentine Meander Antenna line */}
              <path
                d="M 680 180 L 740 180 L 740 200 L 690 200 L 690 220 L 740 220 L 740 240 L 690 240 L 690 260 L 740 260 L 740 280 L 680 280"
                fill="none"
                stroke="#CA8A04"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="712" y="310" fill="#94A3B8" fontSize="8" textAnchor="middle" fontFamily="monospace">2.4 GHz ANT</text>
            </g>

            {/* IC Pin Header J3 (Where defect Solder Bridge is placed) */}
            <g id="component-header-j3">
              <rect x="415" y="185" width="100" height="70" rx="3" fill="#111827" stroke="#374151" strokeWidth="1.5" />
              {/* Pins */}
              <circle cx="430" cy="205" r="5" fill="#EAB308" />
              <circle cx="450" cy="205" r="5" fill="#EAB308" />
              <circle cx="470" cy="205" r="5" fill="#EAB308" />
              <circle cx="490" cy="205" r="5" fill="#EAB308" />
              <circle cx="430" cy="235" r="5" fill="#EAB308" />
              <circle cx="450" cy="235" r="5" fill="#EAB308" />
              <circle cx="470" cy="235" r="5" fill="#EAB308" />
              <circle cx="490" cy="235" r="5" fill="#EAB308" />
              {/* Defect illustration: solder bridge between pin 450 and 470 if defective */}
              {status === 'DEFECTIVE' && defects.some(d => d.type === 'Solder Bridge') && (
                <ellipse cx="460" cy="205" rx="12" ry="6" fill="#94A3B8" opacity="0.95" />
              )}
              <text x="465" y="175" fill="#64748B" fontSize="9" textAnchor="middle">J3 (IC PINS)</text>
            </g>

            {/* Capacitor C14 (Where Missing Component is placed) */}
            <g id="component-c14">
              <rect x="275" y="335" width="85" height="70" rx="2" fill="none" stroke="#22C55E" strokeWidth="0.8" strokeDasharray="3 3" />
              <rect x="285" y="355" width="14" height="25" fill="#CA8A04" />
              <rect x="335" y="355" width="14" height="25" fill="#CA8A04" />
              {/* If component is present */}
              {!(status === 'DEFECTIVE' && defects.some(d => d.type === 'Missing Component')) && (
                <rect x="295" y="357" width="44" height="21" fill="#78350F" stroke="#CA8A04" strokeWidth="1" />
              )}
              <text x="317" y="398" fill="#64748B" fontSize="9" textAnchor="middle">C14 (0805)</text>
            </g>

            {/* Crystal Oscillator Q1 */}
            <g id="component-q1">
              <rect x="575" y="215" width="75" height="55" rx="6" fill="#334155" stroke="#64748B" strokeWidth="1" />
              <circle cx="590" cy="225" r="4" fill="#EAB308" />
              <circle cx="635" cy="225" r="4" fill="#EAB308" />
              <circle cx="590" cy="260" r="4" fill="#EAB308" />
              <circle cx="635" cy="260" r="4" fill="#EAB308" />
              <text x="612" y="246" fill="#F1F5F9" fontSize="8" textAnchor="middle" fontFamily="monospace">40.0 MHz</text>
              <text x="612" y="205" fill="#64748B" fontSize="9" textAnchor="middle">Q1</text>
            </g>

            {/* Inductor L1 */}
            <g id="component-l1">
              <rect x="485" y="305" width="80" height="65" rx="8" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
              <circle cx="525" cy="337" r="18" fill="#0F172A" stroke="#334155" strokeWidth="2" />
              <text x="525" y="341" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="monospace">4R7</text>
              <text x="525" y="295" fill="#64748B" fontSize="9" textAnchor="middle">L1</text>
            </g>

            {/* Tactile Pushbuttons EN & BOOT */}
            <g id="buttons-en-boot">
              <rect x="70" y="100" width="30" height="30" rx="4" fill="#475569" />
              <circle cx="85" cy="115" r="7" fill="#CBD5E1" />
              <text x="85" y="90" fill="#94A3B8" fontSize="9" textAnchor="middle">EN</text>

              <rect x="70" y="350" width="30" height="30" rx="4" fill="#475569" />
              <circle cx="85" cy="365" r="7" fill="#CBD5E1" />
              <text x="85" y="340" fill="#94A3B8" fontSize="9" textAnchor="middle">BOOT</text>
            </g>

            {/* Overlaid Bounding Boxes for Defects */}
            {showBBoxes && defects.map((defect) => {
              const isSelected = selectedDefectId === defect.id;
              const { x, y, width, height } = defect.bbox;

              const boxColor = defect.severity === 'HIGH' ? '#EF4444' : defect.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6';

              return (
                <g
                  key={defect.id}
                  className={`cursor-pointer transition-all duration-150 ${interactive ? 'hover:opacity-90' : ''}`}
                  onClick={() => onSelectDefect && onSelectDefect(defect.id)}
                >
                  {/* Bounding box pulse glow */}
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={width + 8}
                    height={height + 8}
                    fill={boxColor}
                    fillOpacity={isSelected ? 0.25 : 0.12}
                    stroke={boxColor}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={isSelected ? 'none' : '4 2'}
                    rx="4"
                  />

                  {/* Corner brackets */}
                  <path
                    d={`M ${x - 4} ${y + 6} L ${x - 4} ${y - 4} L ${x + 6} ${y - 4}`}
                    fill="none"
                    stroke={boxColor}
                    strokeWidth="3"
                  />
                  <path
                    d={`M ${x + width - 6} ${y - 4} L ${x + width + 4} ${y - 4} L ${x + width + 4} ${y + 6}`}
                    fill="none"
                    stroke={boxColor}
                    strokeWidth="3"
                  />
                  <path
                    d={`M ${x - 4} ${y + height - 6} L ${x - 4} ${y + height + 4} L ${x + 6} ${y + height + 4}`}
                    fill="none"
                    stroke={boxColor}
                    strokeWidth="3"
                  />
                  <path
                    d={`M ${x + width - 6} ${y + height + 4} L ${x + width + 4} ${y + height + 4} L ${x + width + 4} ${y + height - 6}`}
                    fill="none"
                    stroke={boxColor}
                    strokeWidth="3"
                  />

                  {/* Defect Label Tag */}
                  <g transform={`translate(${x - 4}, ${y - 24})`}>
                    <rect
                      x="0"
                      y="0"
                      width={Math.max(defect.type.length * 8 + 48, 110)}
                      height="20"
                      rx="3"
                      fill={boxColor}
                    />
                    <text
                      x="6"
                      y="14"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui"
                    >
                      {defect.type} ({defect.confidence}%)
                    </text>
                  </g>
                </g>
              );
            })}

            {/* "GOOD PASS" Status Stamp if 0 defects */}
            {status === 'GOOD' && defects.length === 0 && (
              <g transform="translate(60, 45)">
                <rect x="0" y="0" width="110" height="26" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="14" cy="13" r="4" fill="#10B981" />
                <text x="26" y="18" fill="#10B981" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  GOOD PASS
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Footer Meta / Status Bar */}
      <div className="bg-[#080F1D] border-t border-industrial-border px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Board Type:</span>
            <span className="font-mono text-slate-200">ESP32-WROOM-32</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Inspection:</span>
            <span className={`font-semibold ${status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status} {defects.length > 0 && `(${defects.length} Defect${defects.length > 1 ? 's' : ''})`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Scan className="w-3 h-3 text-cyan-400" />
            AI Model: PatchCore v1.0.0
          </span>
        </div>
      </div>
    </div>
  );
};
