import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inspectionApi } from '../../services/api/inspectionApi';
import { Inspection } from '../../types/inspection';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PcbViewer } from '../../components/inspection/PcbViewer';
import { 
  ArrowLeft, 
  Download, 
  FileCheck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Cpu, 
  Layers, 
  Camera, 
  HardDrive
} from 'lucide-react';

export const InspectionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      inspectionApi.getInspectionById(id).then((res) => {
        if (res) {
          setInspection(res);
          if (res.defects.length > 0) {
            setSelectedDefectId(res.defects[0].id);
          }
        }
      });
    }
  }, [id]);

  const handleReview = async (action: 'CONFIRMED' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE') => {
    if (!inspection) return;
    await inspectionApi.submitReview(inspection.id, action);
    setReviewStatus(action);
    setInspection({
      ...inspection,
      reviewed: true,
      reviewStatus: action,
    });
  };

  if (!inspection) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <span className="text-sm">Loading inspection record...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-industrial-900 border border-industrial-border text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <span>INSPECTION DETAILS</span>
              <span>•</span>
              <span className="text-slate-300 font-bold">{inspection.boardId}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5 mt-0.5">
              Defect Audit & Forensic Analysis
              <StatusBadge status={inspection.status} size="sm" />
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert(`Generated PDF inspection report for ${inspection.boardId}`)}
            className="px-3.5 py-2 bg-industrial-900 hover:bg-slate-800 text-slate-200 border border-industrial-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Main Grid: Deep Optical Viewport (Left) + Defect List & Metadata (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Zoomable PCB View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-white">OPTICAL BOARD INSPECTION VIEWER</span>
              <span className="font-mono text-slate-400">Resolution: 1920 × 1080 (Sony IMX477)</span>
            </div>

            <PcbViewer
              boardId={inspection.boardId}
              status={inspection.status}
              defects={inspection.defects}
              selectedDefectId={selectedDefectId}
              onSelectDefect={(defId) => setSelectedDefectId(defId)}
              className="min-h-[460px]"
            />
          </div>

          {/* Audit Trail Timeline */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Inspection Lifecycle Audit Log
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-border/60">
                <span className="text-[10px] text-slate-500">1. OPTICAL INGESTION</span>
                <p className="text-slate-200 font-semibold mt-1">Conveyor Sensor S1</p>
                <span className="text-[10px] text-slate-400">{inspection.timestamp}</span>
              </div>
              <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-border/60">
                <span className="text-[10px] text-slate-500">2. INFERENCE RUN</span>
                <p className="text-cyan-400 font-semibold mt-1">PatchCore ESP32</p>
                <span className="text-[10px] text-slate-400">{inspection.inferenceTimeMs} ms latency</span>
              </div>
              <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-border/60">
                <span className="text-[10px] text-slate-500">3. SORTING ACTUATOR</span>
                <p className={inspection.status === 'GOOD' ? 'text-emerald-400 font-semibold mt-1' : 'text-rose-400 font-semibold mt-1'}>
                  {inspection.status === 'GOOD' ? 'Lane A (Pass)' : 'Lane B (Defect Bin)'}
                </p>
                <span className="text-[10px] text-slate-400">Actuated</span>
              </div>
              <div className="bg-industrial-950 p-3 rounded-lg border border-industrial-border/60">
                <span className="text-[10px] text-slate-500">4. QA VERIFICATION</span>
                <p className="text-slate-200 font-semibold mt-1">
                  {inspection.reviewed ? inspection.reviewStatus : 'Pending Human Audit'}
                </p>
                <span className="text-[10px] text-slate-400">Priyadharshan (Admin)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Defect Inspector & Human-in-the-Loop */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Hardware & Vision Telemetry
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-industrial-border/40 pb-1.5">
                <span className="text-slate-400">Board Identifier</span>
                <span className="text-cyan-400 font-bold">{inspection.boardId}</span>
              </div>
              <div className="flex justify-between border-b border-industrial-border/40 pb-1.5">
                <span className="text-slate-400">Board Architecture</span>
                <span className="text-slate-200">{inspection.boardType}</span>
              </div>
              <div className="flex justify-between border-b border-industrial-border/40 pb-1.5">
                <span className="text-slate-400">Inference Engine</span>
                <span className="text-slate-200">PatchCore v1.0.0</span>
              </div>
              <div className="flex justify-between border-b border-industrial-border/40 pb-1.5">
                <span className="text-slate-400">Station / Line</span>
                <span className="text-slate-200">LINE-01 (Main SMT)</span>
              </div>
              <div className="flex justify-between border-b border-industrial-border/40 pb-1.5">
                <span className="text-slate-400">Confidence Score</span>
                <span className="text-emerald-400 font-bold">{inspection.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Image Size</span>
                <span className="text-slate-200">{inspection.fileSizeKb || 245} KB</span>
              </div>
            </div>
          </div>

          {/* Defect Details Cards */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Detected Defects</span>
              <span className="text-cyan-400 font-mono">({inspection.defects.length})</span>
            </h3>

            {inspection.defects.length > 0 ? (
              <div className="space-y-3">
                {inspection.defects.map((def) => (
                  <div
                    key={def.id}
                    onClick={() => setSelectedDefectId(def.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition ${
                      selectedDefectId === def.id
                        ? 'bg-rose-950/40 border-rose-500/80 shadow-glow-red'
                        : 'bg-industrial-950/60 border-industrial-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-rose-400">{def.type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {def.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mb-1">{def.location}</p>
                    {def.suggestedAction && (
                      <p className="text-[11px] text-amber-300/80 bg-amber-950/40 p-2 rounded border border-amber-900/40">
                        Action: {def.suggestedAction}
                      </p>
                    )}
                    <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                      <span>Confidence: {def.confidence}%</span>
                      <span>Bounding Box: [{def.bbox.x}, {def.bbox.y}, {def.bbox.width}, {def.bbox.height}]</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-emerald-300">Clean Board Verification</p>
                <p className="text-[11px] text-slate-400 mt-1">No solder bridges, scratches, or open circuits.</p>
              </div>
            )}
          </div>

          {/* Active Learning / Human Review Actions */}
          <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark space-y-3">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              Human Decision Override
            </h3>
            <p className="text-[11px] text-slate-400">
              Submit auditor review to update anomaly memory-bank and retraining dataset.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleReview('CONFIRMED')}
                className="px-2.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-1 shadow-md shadow-rose-950"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm</span>
              </button>
              <button
                onClick={() => handleReview('FALSE_POSITIVE')}
                className="px-2.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition flex flex-col items-center justify-center gap-1 shadow-md shadow-amber-950"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>False +</span>
              </button>
              <button
                onClick={() => handleReview('FALSE_NEGATIVE')}
                className="px-2.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-industrial-border transition flex flex-col items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                <span>False -</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
