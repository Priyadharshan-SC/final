import React, { useState, useRef, useEffect } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { inspectionApi } from '../../services/api/inspectionApi';
import { DEFECT_EXPLANATIONS } from '../../components/inspection/PcbViewer';
import { useDataset } from '../../context/DatasetContext';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  StopCircle, 
  Clock, 
  Search, 
  Eye, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  FolderOpen,
  Cpu,
  Sparkles,
  X,
  Layers,
  Activity,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatImageSrc } from '../../utils/imageUtils';

export interface BatchItem {
  id: string;
  boardId: string;
  filename: string;
  status: 'GOOD' | 'DEFECTIVE' | 'FAILED';
  defectType: string;
  confidence: string;
  inferenceTime: string;
  processedAt: string;
  defects: any[];
  annotatedImageBase64?: string;
  heatmapBase64?: string;
  anomalyScore?: number;
  previewUrl?: string;
}

const BOTTLE_DEFAULT_ROWS: BatchItem[] = [
  { id: '1', boardId: 'PET-BOTTLE-001', filename: '000_broken_small.png', status: 'DEFECTIVE', defectType: 'broken_small', confidence: '96.2%', inferenceTime: '13 ms', processedAt: '2026-10-08 14:32:15', defects: [{ class_name: 'broken_small', confidence: 0.96, bbox: [220, 180, 290, 240] }] },
  { id: '2', boardId: 'PET-BOTTLE-002', filename: '000_good.png', status: 'GOOD', defectType: '-', confidence: '99.4%', inferenceTime: '14 ms', processedAt: '2026-10-08 14:30:17', defects: [] },
  { id: '3', boardId: 'PET-BOTTLE-003', filename: '000_broken_large.png', status: 'DEFECTIVE', defectType: 'broken_large', confidence: '98.8%', inferenceTime: '13 ms', processedAt: '2026-10-08 14:28:18', defects: [{ class_name: 'broken_large', confidence: 0.99, bbox: [410, 310, 580, 490] }] },
  { id: '4', boardId: 'PET-BOTTLE-004', filename: '001_good.png', status: 'GOOD', defectType: '-', confidence: '99.8%', inferenceTime: '14 ms', processedAt: '2026-10-08 14:25:29', defects: [] },
  { id: '5', boardId: 'PET-BOTTLE-005', filename: '000_contamination.png', status: 'DEFECTIVE', defectType: 'contamination', confidence: '94.5%', inferenceTime: '14 ms', processedAt: '2026-10-08 14:22:22', defects: [{ class_name: 'contamination', confidence: 0.95, bbox: [320, 410, 370, 460] }] },
];

const PCB_DEFAULT_ROWS: BatchItem[] = [
  { id: '1', boardId: 'ESP32-001', filename: '04_missing_hole_07.jpg', status: 'DEFECTIVE', defectType: 'Missing_hole', confidence: '89.0%', inferenceTime: '32 ms', processedAt: '2026-10-08 14:32:15', defects: [{ class_name: 'Missing_hole', confidence: 0.89, bbox: [2617, 351, 2678, 419] }] },
  { id: '2', boardId: 'ESP32-002', filename: '01_golden_template.jpg', status: 'GOOD', defectType: '-', confidence: '98.5%', inferenceTime: '29 ms', processedAt: '2026-10-08 14:30:17', defects: [] },
  { id: '3', boardId: 'ESP32-003', filename: '04_short_06.jpg', status: 'DEFECTIVE', defectType: 'Short', confidence: '92.4%', inferenceTime: '35 ms', processedAt: '2026-10-08 14:28:18', defects: [{ class_name: 'Short', confidence: 0.92, bbox: [1200, 450, 1340, 520] }] },
  { id: '4', boardId: 'ESP32-004', filename: '09_golden_template.jpg', status: 'GOOD', defectType: '-', confidence: '99.1%', inferenceTime: '28 ms', processedAt: '2026-10-08 14:25:29', defects: [] },
  { id: '5', boardId: 'ESP32-005', filename: '04_mouse_bite_04.jpg', status: 'DEFECTIVE', defectType: 'Mouse_bite', confidence: '87.8%', inferenceTime: '31 ms', processedAt: '2026-10-08 14:22:22', defects: [{ class_name: 'Mouse_bite', confidence: 0.88, bbox: [500, 800, 590, 890] }] },
];

export const BatchInspectionPage: React.FC = () => {
  const { activeDataset, activeProfile } = useDataset();
  const [boardType, setBoardType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [inspectModalRow, setInspectModalRow] = useState<BatchItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table rows with real batch data adapting to active dataset
  const [tableRows, setTableRows] = useState<BatchItem[]>(
    activeDataset === 'water_bottle' ? BOTTLE_DEFAULT_ROWS : PCB_DEFAULT_ROWS
  );

  useEffect(() => {
    setTableRows(activeDataset === 'water_bottle' ? BOTTLE_DEFAULT_ROWS : PCB_DEFAULT_ROWS);
  }, [activeDataset]);

  // Dynamically computed stats
  const total = tableRows.length;
  const processed = tableRows.filter(r => r.status !== 'FAILED').length;
  const good = tableRows.filter(r => r.status === 'GOOD').length;
  const defective = tableRows.filter(r => r.status === 'DEFECTIVE').length;
  const failed = tableRows.filter(r => r.status === 'FAILED').length;

  const goodPct = total > 0 ? `${((good / total) * 100).toFixed(1)}%` : '0%';
  const defectivePct = total > 0 ? `${((defective / total) * 100).toFixed(1)}%` : '0%';
  const failedPct = total > 0 ? `${((failed / total) * 100).toFixed(1)}%` : '0%';

  const stats = {
    total,
    processed,
    good,
    goodPct,
    defective,
    defectivePct,
    failed,
    failedPct,
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadStatusMsg(`Processing ${files.length} images with ${activeProfile?.model_metrics?.engine_name || 'AI Engine'}...`);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const data = await inspectionApi.uploadBatchImages(formData, activeDataset);
      if (data && data.results) {
        const newRows: BatchItem[] = data.results.map((r: any, idx: number) => ({
          id: `UP-${Date.now()}-${idx + 1}`,
          boardId: r.board_id || r.filename,
          filename: r.filename,
          status: r.status as any,
          defectType: r.defect_type,
          confidence: r.confidence,
          inferenceTime: r.inference_time,
          processedAt: r.processed_at || new Date().toLocaleTimeString(),
          defects: r.defects || [],
          annotatedImageBase64: r.annotated_image_b64 ? formatImageSrc(r.annotated_image_b64) : undefined,
          heatmapBase64: r.heatmap_base64 ? formatImageSrc(r.heatmap_base64) : undefined,
          anomalyScore: r.anomaly_score,
          previewUrl: formatImageSrc(r.annotated_image_b64 || r.heatmap_base64 || r.image_url || r.imageUrl)
        }));

        setTableRows(prev => [...newRows, ...prev]);
        setUploadStatusMsg(`Processed ${files.length} image(s)! Found ${data.good} Good and ${data.defective} Defective.`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
      }
    } catch (e: any) {
      setUploadStatusMsg(`Upload error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleBatch = async () => {
    setIsProcessing(true);
    setUploadStatusMsg(`Running real ${activeProfile?.name || 'product'} batch through ${activeProfile?.model_metrics?.engine_name || 'AI Engine'}...`);
    try {
      const data = await inspectionApi.getBatchSamples(activeDataset);
      if (data && data.results) {
        const newRows: BatchItem[] = data.results.map((r: any, idx: number) => ({
          id: `SMP-${Date.now()}-${idx + 1}`,
          boardId: r.board_id,
          filename: r.filename,
          status: r.status as any,
          defectType: r.defect_type,
          confidence: r.confidence,
          inferenceTime: r.inference_time,
          processedAt: r.processed_at,
          defects: r.defects || [],
          annotatedImageBase64: r.annotated_image_b64 ? formatImageSrc(r.annotated_image_b64) : undefined,
          heatmapBase64: r.heatmap_base64 ? formatImageSrc(r.heatmap_base64) : undefined,
          anomalyScore: r.anomaly_score,
          previewUrl: formatImageSrc(r.annotated_image_b64 || r.heatmap_base64 || r.image_url || r.imageUrl)
        }));
        setTableRows(newRows);
        setUploadStatusMsg(`Loaded 6 real ${activeProfile?.name || 'dataset'} items: ${data.good} Good / Passed, ${data.defective} Defective.`);
        setTimeout(() => setUploadStatusMsg(null), 4000);
      }
    } catch (e: any) {
      setUploadStatusMsg(`Failed to load samples: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRows = tableRows.filter((row) => {
    if (statusFilter !== 'All Status' && row.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return row.boardId.toLowerCase().includes(q) || row.defectType.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map(r => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <span className="hover:text-white cursor-pointer">Home</span>
            <span>&gt;</span>
            <span className="text-white font-semibold">Batch Inspection</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Batch Inspection Workstation</h1>
              <p className="text-xs text-slate-400">
                Upload multiple {activeProfile?.name || 'product'} images for real-time {activeProfile?.model_metrics?.engine_name || 'AI Engine'} defect triage
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleBatch}
            disabled={isProcessing}
            className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-glow-cyan disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Inspect Sample Dataset Batch
          </button>
        </div>
      </div>

      {uploadStatusMsg && (
        <div className="p-3 bg-blue-950/50 border border-blue-500/40 rounded-xl text-xs text-cyan-300 font-medium flex items-center gap-2 animate-fade-in shadow-md">
          <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{uploadStatusMsg}</span>
        </div>
      )}

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Images */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Total Images</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{stats.total}</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ImageIcon className="w-4 h-4" />
          </div>
        </div>

        {/* Processed */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Processed</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">{stats.processed}</div>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-emerald-500 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400">
            {stats.total > 0 ? `${Math.round((stats.processed / stats.total) * 100)}%` : '100%'}
          </div>
        </div>

        {/* Good Boards */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Good Boards</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">{stats.good}</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">{stats.goodPct}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Defective Boards */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Defective Boards</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">{stats.defective}</span>
              <span className="text-xs font-mono text-rose-400 font-semibold">{stats.defectivePct}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-950/40 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Failed */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Failed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">{stats.failed}</span>
              <span className="text-xs font-mono text-amber-400 font-semibold">{stats.failedPct}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Middle Row (Upload PCB Images + Inspection Progress + Batch Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upload PCB Images Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-end mb-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Board Model</span>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                  className="bg-[#0A101D] border border-industrial-border rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ESP32">ESP32-WROOM-32D</option>
                  <option value="Arduino">Arduino Nano</option>
                  <option value="RP2040">Raspberry Pi Pico</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center transition cursor-pointer ${
                isDragging 
                  ? 'border-cyan-400 bg-cyan-950/30' 
                  : 'border-blue-500/40 bg-[#09101C]/60 hover:border-blue-500'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Upload {activeProfile?.name || 'Inspection'} Images</h3>
              <p className="text-xs text-slate-400 mt-1">
                Drag and drop images here, or <span className="text-blue-400 underline font-semibold">click to browse</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports: JPG, PNG, BMP | Max size: 100 MB per batch
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
              >
                <FolderOpen className="w-4 h-4" />
                Choose Files
              </button>
            </div>
          </div>

          {/* Uploaded Thumbnails Grid Strip */}
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-industrial-border/60 overflow-x-auto pb-1">
            {tableRows.slice(0, 6).map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => setInspectModalRow(item)}
                className="w-10 h-10 rounded-lg bg-[#08121E] border border-industrial-border flex items-center justify-center flex-shrink-0 relative overflow-hidden cursor-pointer hover:border-cyan-400 transition"
                title={`${item.boardId}: ${item.status}`}
              >
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt={item.boardId} className="w-full h-full object-cover" />
                ) : (
                  <span className={`w-3 h-3 rounded-sm ${item.status === 'GOOD' ? 'bg-emerald-600/70' : 'bg-rose-600/70'}`} />
                )}
                {item.status === 'DEFECTIVE' && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-white" />}
              </div>
            ))}
            {tableRows.length > 6 && (
              <div className="w-10 h-10 rounded-lg bg-industrial-950 border border-industrial-border flex items-center justify-center text-xs font-mono font-bold text-slate-400 flex-shrink-0">
                +{tableRows.length - 6}
              </div>
            )}
          </div>
        </div>

        {/* Inspection Progress Card (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Inspection Engine Status</h3>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {isProcessing ? 'RUNNING' : 'IDLE'}
              </span>
            </div>

            <div className="text-xs text-slate-400 mb-3">
              Hardware: <span className="font-mono text-slate-200">NVIDIA RTX 2050 CUDA</span>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
                  <span>YOLO11 Model Loaded</span>
                </div>
                <span className="font-mono text-emerald-400 text-[11px]">Active</span>
              </div>

              <div className="flex items-center justify-between text-blue-400 font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[10px]">●</span>
                  <span>Total Inspected</span>
                </div>
                <span className="font-mono text-blue-400 text-[11px]">{stats.processed} / {stats.total}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
                  <span>Good Yield Rate</span>
                </div>
                <span className="font-mono text-emerald-400 text-[11px]">{stats.goodPct}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px]">!</span>
                  <span>Defect Triage Rate</span>
                </div>
                <span className="font-mono text-rose-400 text-[11px]">{stats.defectivePct}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-industrial-border/60 text-xs font-mono text-slate-400 flex justify-between">
            <span>Avg Latency: <strong className="text-cyan-400">28.4 ms</strong></span>
            <span>Classes: <strong className="text-slate-200">6 Defects</strong></span>
          </div>
        </div>

        {/* Batch Results Donut Card (3 cols) */}
        <div className="lg:col-span-3 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <span className="text-cyan-400">📊</span> Batch Yield Ratio
            </h3>

            {/* Dynamic Donut */}
            <div className="flex items-center justify-center my-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle 
                    cx="56" cy="56" r="44" 
                    stroke="#10B981" 
                    strokeWidth="12" 
                    strokeDasharray={`${Math.round(((stats.good || 1) / Math.max(1, stats.total)) * 276)} 276`} 
                    fill="transparent" 
                  />
                  <circle 
                    cx="56" cy="56" r="44" 
                    stroke="#EF4444" 
                    strokeWidth="12" 
                    strokeDasharray={`${Math.round(((stats.defective || 0) / Math.max(1, stats.total)) * 276)} 276`} 
                    strokeDashoffset={`-${Math.round(((stats.good || 1) / Math.max(1, stats.total)) * 276)}`} 
                    fill="transparent" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold font-mono text-white">{stats.total}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">Boards</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Good (Pass)</span>
                </div>
                <span className="font-mono text-emerald-400 font-semibold">{stats.good} ({stats.goodPct})</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Defective</span>
                </div>
                <span className="font-mono text-rose-400 font-semibold">{stats.defective} ({stats.defectivePct})</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-industrial-border/60 text-[11px] font-mono text-slate-400">
            <span>IPC Standard: </span>
            <strong className="text-slate-200">IPC-A-610 Class 3</strong>
          </div>
        </div>
      </div>

      {/* Bottom Inspection Results Table */}
      <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-sm">📄</span>
            <h3 className="text-sm font-semibold text-white">
              Inspection Results ({filteredRows.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search board ID, defect..."
                className="bg-[#0A101D] border border-industrial-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0A101D] border border-industrial-border rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All Status">All Status</option>
              <option value="GOOD">GOOD (Pass)</option>
              <option value="DEFECTIVE">DEFECTIVE</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-industrial-border/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-[#080E1B]/50">
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 w-8">#</th>
                <th className="py-2.5 px-3">BOARD ID / FILE</th>
                <th className="py-2.5 px-3">PREVIEW</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">DEFECT DETECTED</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">INFERENCE TIME</th>
                <th className="py-2.5 px-3">PROCESSED AT</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/30 text-xs font-sans">
              {filteredRows.map((row, idx) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-industrial-800/40 transition group cursor-pointer ${
                      isSelected ? 'bg-blue-950/20' : ''
                    }`}
                    onClick={() => setInspectModalRow(row)}
                  >
                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                      <span>{row.boardId}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-10 h-7 rounded bg-[#0A1A14] border border-slate-700/60 overflow-hidden flex items-center justify-center">
                        {row.previewUrl ? (
                          <img src={formatImageSrc(row.previewUrl)} alt={row.boardId} className="w-full h-full object-cover" />
                        ) : (
                          <span className={`w-2.5 h-2.5 rounded-sm ${row.status === 'GOOD' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      {row.defectType !== '-' ? (
                        <span className="text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
                          {row.defectType} ({row.defects?.length || 1})
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono font-semibold">✓ Pass</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{row.confidence}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{row.inferenceTime}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{row.processedAt}</td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectModalRow(row)}
                          className="p-1 rounded text-cyan-400 hover:text-white hover:bg-slate-800 transition"
                          title="View Optical Image & Defect Localization"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert(`Exporting test report for ${row.boardId}`)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Download Image & Log"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-2 border-t border-industrial-border/60">
          <span>Showing 1-{filteredRows.length} of {tableRows.length} results</span>
        </div>
      </div>

      {/* Inspection Detail Modal */}
      {inspectModalRow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B1220] border border-industrial-border rounded-xl max-w-2xl w-full p-5 shadow-2xl relative animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-industrial-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono">{inspectModalRow.boardId}</span>
                <StatusBadge status={inspectModalRow.status} size="sm" />
              </div>
              <button
                onClick={() => setInspectModalRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inspectModalRow.heatmapBase64 && (
              <div className="flex items-center justify-end gap-2 mb-2">
                <button
                  onClick={() => {
                    const isHeatmap = inspectModalRow.previewUrl === formatImageSrc(inspectModalRow.heatmapBase64);
                    const newUrl = isHeatmap && inspectModalRow.annotatedImageBase64
                      ? formatImageSrc(inspectModalRow.annotatedImageBase64)
                      : formatImageSrc(inspectModalRow.heatmapBase64 || inspectModalRow.annotatedImageBase64);
                    setInspectModalRow({ ...inspectModalRow, previewUrl: newUrl });
                  }}
                  className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Toggle PatchCore Heatmap
                </button>
              </div>
            )}

            <div className="my-2 flex items-center justify-center bg-black/60 rounded-lg p-2 border border-slate-800 min-h-[260px]">
              {inspectModalRow.previewUrl ? (
                <img 
                  src={formatImageSrc(inspectModalRow.previewUrl)} 
                  alt={inspectModalRow.boardId} 
                  className="max-h-[380px] w-auto object-contain rounded"
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-white">Clean Golden {activeDataset === 'water_bottle' ? 'Bottle' : 'Board'}</p>
                  <p className="text-xs text-slate-400">
                    {activeDataset === 'water_bottle' ? 'Zero anomaly deviations localized by PatchCore engine.' : 'Zero defects localized by YOLO11 engine.'}
                  </p>
                </div>
              )}
            </div>

            {/* Defect Explanation if Defective */}
            {inspectModalRow.defectType !== '-' && DEFECT_EXPLANATIONS[inspectModalRow.defectType] && (
              <div className="p-3 bg-[#070D18] border border-rose-500/30 rounded-lg text-xs space-y-1 mb-3">
                <div className="flex items-center justify-between text-rose-400 font-bold">
                  <span>{DEFECT_EXPLANATIONS[inspectModalRow.defectType].title}</span>
                  <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/40">
                    {DEFECT_EXPLANATIONS[inspectModalRow.defectType].severity}
                  </span>
                </div>
                <p className="text-slate-300">{DEFECT_EXPLANATIONS[inspectModalRow.defectType].description}</p>
                <p className="text-[11px] font-mono text-slate-400">Standard: <strong className="text-slate-200">{DEFECT_EXPLANATIONS[inspectModalRow.defectType].standard}</strong></p>
                <p className="text-[11px] font-mono text-amber-400">Action: {DEFECT_EXPLANATIONS[inspectModalRow.defectType].action}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-industrial-border text-xs font-mono text-slate-400">
              <span>Confidence: <strong className="text-cyan-400">{inspectModalRow.confidence}</strong></span>
              <span>Inference: <strong className="text-slate-200">{inspectModalRow.inferenceTime}</strong></span>
              <button
                onClick={() => setInspectModalRow(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
