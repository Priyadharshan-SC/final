import React, { useState, useEffect } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PcbViewer } from '../../components/inspection/PcbViewer';
import { mockInspections } from '../../services/mock/mockData';
import { Inspection } from '../../types/inspection';
import { inspectionApi } from '../../services/api/inspectionApi';
import { 
  History, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  X,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDataset } from '../../context/DatasetContext';
import { formatImageSrc } from '../../utils/imageUtils';

export const InspectionHistoryPage: React.FC = () => {
  const { activeDataset, activeProfile } = useDataset();
  const [selectedInspection, setSelectedInspection] = useState<Inspection>(mockInspections[0]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [boardFilter, setBoardFilter] = useState('All');
  const [defectFilter, setDefectFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>(['INS-001']);
  const [records, setRecords] = useState<(Inspection & { num?: number })[]>(
    mockInspections.map((item, idx) => ({ ...item, num: idx + 1 }))
  );
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    inspectionApi.queryHistory({
      page: currentPage,
      limit: 10,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      defectType: defectFilter !== 'All' ? defectFilter : undefined,
      search: searchQuery || undefined
    }).then((res) => {
      if (isMounted && res && res.items && res.items.length > 0) {
        const mapped = res.items.map((item, idx) => ({
          ...item,
          num: (currentPage - 1) * 10 + idx + 1
        }));
        setRecords(mapped);
        if (mapped.length > 0) {
          setSelectedInspection(mapped[0]);
          setSelectedIds([mapped[0].id]);
        }
      }
    }).catch((err) => {
      console.warn('Failed to load history records:', err);
    });
    return () => { isMounted = false; };
  }, [currentPage, statusFilter, defectFilter, searchQuery, activeDataset]);

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    if (defectFilter !== 'All') {
      if (defectFilter === 'No Defect' && r.defects.length > 0) return false;
      if (defectFilter !== 'No Defect' && !r.defects.some(d => d.type === defectFilter)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.boardId.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.defects.some(d => d.type.toLowerCase().includes(q));
    }
    return true;
  });

  const handleRowClick = (item: Inspection) => {
    setSelectedInspection(item);
    if (!selectedIds.includes(item.id)) {
      setSelectedIds([item.id]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
            <span className="hover:text-white cursor-pointer" onClick={() => navigate('/dashboard')}>Home</span>
            <span>&gt;</span>
            <span className="text-white font-semibold">Inspection History</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Inspection History</h1>
              <p className="text-xs text-slate-400">View and search all PCB inspection records</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export & Generate Report */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('Exporting all 1,842 inspection records to CSV/Excel...')}
            className="px-3.5 py-2 bg-[#0D1526] hover:bg-slate-800 text-slate-200 border border-industrial-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-glow-blue"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-card-dark">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-[#09101D] border border-industrial-border rounded-lg px-3 py-1.5 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Oct 1, 2026 - Oct 7, 2026</span>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#09101D] border border-industrial-border rounded-lg px-2.5 py-1.5">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#09101D]">All</option>
              <option value="GOOD" className="bg-[#09101D]">GOOD</option>
              <option value="DEFECTIVE" className="bg-[#09101D]">DEFECTIVE</option>
            </select>
          </div>

          {/* Board Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#09101D] border border-industrial-border rounded-lg px-2.5 py-1.5">
            <span>Board:</span>
            <select
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ESP32" className="bg-[#09101D]">ESP32</option>
              <option value="Arduino" className="bg-[#09101D]">Arduino</option>
              <option value="RP2040" className="bg-[#09101D]">RP2040</option>
            </select>
          </div>

          {/* Defect Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-[#09101D] border border-industrial-border rounded-lg px-2.5 py-1.5">
            <span>Defect:</span>
            <select
              value={defectFilter}
              onChange={(e) => setDefectFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#09101D]">All</option>
              {activeDataset === 'water_bottle' ? (
                <>
                  <option value="broken_large" className="bg-[#09101D]">broken_large</option>
                  <option value="broken_small" className="bg-[#09101D]">broken_small</option>
                  <option value="contamination" className="bg-[#09101D]">contamination</option>
                  <option value="No Defect" className="bg-[#09101D]">No Defect</option>
                </>
              ) : (
                <>
                  <option value="Short" className="bg-[#09101D]">Short</option>
                  <option value="Missing_hole" className="bg-[#09101D]">Missing_hole</option>
                  <option value="Mouse_bite" className="bg-[#09101D]">Mouse_bite</option>
                  <option value="Open_circuit" className="bg-[#09101D]">Open_circuit</option>
                  <option value="Spur" className="bg-[#09101D]">Spur</option>
                  <option value="Spurious_copper" className="bg-[#09101D]">Spurious_copper</option>
                  <option value="No Defect" className="bg-[#09101D]">No Defect</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, defect, or keyword..."
            className="w-full bg-[#09101D] border border-industrial-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* KPI 4-Card Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Inspections */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Total Inspections</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">1,842</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Filter className="w-4 h-4" />
          </div>
        </div>

        {/* Good Boards */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Good Boards</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">1,678</span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">91.1%</span>
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
              <span className="text-2xl font-bold font-mono text-white">164</span>
              <span className="text-xs font-mono text-rose-400 font-semibold">8.9%</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-950/40 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Avg. Inference Time */}
        <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-4 flex items-center justify-between shadow-card-dark">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Avg. Inference Time</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">28 <span className="text-sm font-normal text-slate-400">ms</span></div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Table on Left + Inspection Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Table Section (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-sm">📋</span>
                <h3 className="text-sm font-semibold text-white">Inspection Records (1,842)</h3>
              </div>
              <span className="text-xs text-slate-400">Showing 10 records per page</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-industrial-border/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider bg-[#080E1B]/50">
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRecords.length}
                        onChange={() => {
                          if (selectedIds.length === filteredRecords.length) setSelectedIds([]);
                          else setSelectedIds(filteredRecords.map(r => r.id));
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">BOARD ID</th>
                    <th className="py-2.5 px-3">IMAGE</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3">DEFECT TYPE</th>
                    <th className="py-2.5 px-3">CONFIDENCE</th>
                    <th className="py-2.5 px-3">INFERENCE</th>
                    <th className="py-2.5 px-3">DATE & TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-border/30 text-xs">
                  {filteredRecords.map((row) => {
                    const isSelected = selectedInspection.id === row.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleRowClick(row)}
                        className={`cursor-pointer transition group ${
                          isSelected
                            ? 'bg-blue-950/30 border-l-2 border-l-blue-500'
                            : 'hover:bg-industrial-800/40'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id]);
                            }}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.num}</td>
                        <td className="py-3 px-3 font-mono font-semibold text-blue-400 group-hover:underline">
                          {row.boardId}
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-10 h-7 rounded bg-[#0A1A14] border border-slate-700/60 overflow-hidden flex items-center justify-center relative">
                            {row.annotatedImageBase64 || row.imageUrl ? (
                              <img
                                src={formatImageSrc(row.annotatedImageBase64 || row.imageUrl)}
                                alt={row.boardId}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
                            )}
                            {row.status === 'DEFECTIVE' && (
                              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 ring-1 ring-black" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={row.status} size="sm" />
                        </td>
                        <td className="py-3 px-3">
                          {row.defects.length > 0 ? (
                            <span className="text-rose-400 font-medium">{row.defects[0].type}</span>
                          ) : (
                            <span className="text-slate-500 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">{row.confidence}%</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{row.inferenceTimeMs} ms</td>
                        <td className="py-3 px-3 font-mono text-slate-400">{row.timestamp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-4 mt-2 border-t border-industrial-border/60">
            <span>Showing 1-10 of 1,842 results</span>

            <div className="flex items-center gap-1 font-mono">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded bg-blue-600 text-white font-bold flex items-center justify-center">
                1
              </button>
              <button className="w-7 h-7 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center">
                2
              </button>
              <button className="w-7 h-7 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center">
                3
              </button>
              <button className="w-7 h-7 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center">
                4
              </button>
              <button className="w-7 h-7 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center">
                5
              </button>
              <span className="px-1 text-slate-500">...</span>
              <button className="w-7 h-7 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center">
                185
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Drawer: Inspection Details (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-industrial-border/60 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">✪</span>
                <h3 className="text-sm font-semibold text-white">Inspection Details</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-950/60 text-blue-400 border border-blue-500/30">
                  {selectedInspection.boardId}
                </span>
              </div>
              <button
                onClick={() => setSelectedInspection(mockInspections[0])}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inspection Viewer Box */}
            <div className="my-2">
              <PcbViewer
                boardId={selectedInspection.boardId}
                unitLabel={activeDataset === 'water_bottle' ? 'Bottle Unit' : 'PCB Board'}
                status={selectedInspection.status}
                defects={selectedInspection.defects}
                imageUrl={selectedInspection.imageUrl}
                annotatedImageBase64={selectedInspection.annotatedImageBase64}
                heatmapBase64={selectedInspection.heatmapBase64}
                engineName={activeProfile?.model_metrics?.engine_name || (activeDataset === 'water_bottle' ? 'PatchCore Anomaly Engine' : 'YOLO11 Edge Engine')}
                className="min-h-[220px]"
                interactive={false}
              />
            </div>

            {/* Carousel Sub-bar */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 my-2 px-1">
              <button className="hover:text-white">&lt;</button>
              <span>1 / 1</span>
              <button className="hover:text-white">&gt;</button>
            </div>

            {/* Metadata key-value list */}
            <div className="space-y-2 text-xs font-mono border-t border-industrial-border/60 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400">{activeDataset === 'water_bottle' ? 'Unit ID' : 'Board ID'}</span>
                <span className="text-slate-200 font-semibold">{selectedInspection.boardId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Product Category</span>
                <span className="text-slate-200">{selectedInspection.boardType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <StatusBadge status={selectedInspection.status} size="sm" />
              </div>
              {selectedInspection.anomalyScore !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Anomaly Score</span>
                  <span className={`font-bold ${selectedInspection.status === 'GOOD' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedInspection.anomalyScore.toFixed(4)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence</span>
                <span className="text-emerald-400 font-bold">{selectedInspection.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inference Time</span>
                <span className="text-slate-200">{selectedInspection.inferenceTimeMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Time</span>
                <span className="text-slate-300">{selectedInspection.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Engine</span>
                <span className="text-slate-300">
                  {selectedInspection.heatmapBase64 ? 'PatchCore ResNet18' : 'YOLO11n Edge'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Device ID</span>
                <span className="text-slate-300">LINE-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Image Resolution</span>
                <span className="text-slate-300">1920 × 1080</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">File Size</span>
                <span className="text-slate-300">{selectedInspection.fileSizeKb || 245} KB</span>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-industrial-border/60">
            <button
              onClick={() => alert(`Downloading high-resolution optical image for ${selectedInspection.boardId}`)}
              className="px-3 py-2 bg-industrial-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-industrial-border transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download Image
            </button>
            <button
              onClick={() => navigate(`/inspection/${selectedInspection.id}`)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-glow-blue"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
