import React, { useState } from 'react';
import { StatusBadge } from '../../components/common/StatusBadge';
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
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BatchInspectionPage: React.FC = () => {
  const [boardType, setBoardType] = useState('ESP32');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Batch stats matching Stitch screenshot 88b1cd2feb984d4988ab0ac8babc8eef
  const stats = {
    total: 120,
    processed: 108,
    good: 92,
    goodPct: '76.7%',
    defective: 16,
    defectivePct: '13.3%',
    failed: 4,
    failedPct: '3.3%',
  };

  // Table rows matching Stitch screenshot
  const tableRows = [
    { id: '1', boardId: 'ESP32-001', status: 'GOOD', defectType: '-', confidence: '99.1%', inferenceTime: '29 ms', processedAt: '2026-10-08 14:32:15' },
    { id: '2', boardId: 'ESP32-002', status: 'DEFECTIVE', defectType: 'Solder Bridge', confidence: '94.2%', inferenceTime: '32 ms', processedAt: '2026-10-08 14:30:17' },
    { id: '3', boardId: 'ESP32-003', status: 'GOOD', defectType: '-', confidence: '97.6%', inferenceTime: '27 ms', processedAt: '2026-10-08 14:28:18' },
    { id: '4', boardId: 'ESP32-004', status: 'DEFECTIVE', defectType: 'Missing Component', confidence: '88.6%', inferenceTime: '31 ms', processedAt: '2026-10-08 14:25:29' },
    { id: '5', boardId: 'ESP32-005', status: 'GOOD', defectType: '-', confidence: '98.9%', inferenceTime: '29 ms', processedAt: '2026-10-08 14:22:22' },
  ];

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
              <h1 className="text-xl font-bold tracking-tight text-white">Batch Inspection</h1>
              <p className="text-xs text-slate-400">Upload multiple PCB images for AI inspection</p>
            </div>
          </div>
        </div>
      </div>

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
            90%
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
                <span>Board Type</span>
                <select
                  value={boardType}
                  onChange={(e) => setBoardType(e.target.value)}
                  className="bg-[#0A101D] border border-industrial-border rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="ESP32">ESP32</option>
                  <option value="Arduino">Arduino Nano</option>
                  <option value="RP2040">Raspberry Pi Pico</option>
                </select>
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div className="border border-dashed border-blue-500/40 bg-[#09101C]/60 rounded-xl p-6 text-center flex flex-col items-center justify-center group hover:border-blue-500 transition">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-105 transition">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">Upload PCB Images</h3>
              <p className="text-xs text-slate-400 mt-1">
                Drag and drop images here, or <span className="text-blue-400 underline cursor-pointer">click to browse</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supports: JPG, PNG, BMP | Max size: 10 MB per image
              </p>

              <button
                onClick={() => alert('File picker dialog simulation: selected 120 PCB inspection frames.')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
              >
                <FolderOpen className="w-4 h-4" />
                Choose Files
              </button>
            </div>
          </div>

          {/* Uploaded Thumbnails Grid Strip */}
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-industrial-border/60 overflow-x-auto pb-1">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="w-10 h-10 rounded-lg bg-[#08121E] border border-industrial-border flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <span className="w-3 h-3 rounded-sm bg-emerald-600/70" />
                {idx === 2 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />}
              </div>
            ))}
            <div className="w-10 h-10 rounded-lg bg-industrial-950 border border-industrial-border flex items-center justify-center text-xs font-mono font-bold text-slate-400 flex-shrink-0">
              +115
            </div>
          </div>
        </div>

        {/* Inspection Progress Card (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Inspection Progress</h3>
              <span className="text-xs font-mono font-bold text-blue-400">15%</span>
            </div>

            <div className="text-xs text-slate-400 mb-3">
              Processing... <span className="font-mono text-slate-300">(18/120)</span>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</span>
                  <span>Uploading Images</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">120/120</span>
              </div>

              <div className="flex items-center justify-between text-blue-400 font-medium">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center text-[10px]">●</span>
                  <span>Queued for Inspection</span>
                </div>
                <span className="font-mono text-blue-400 text-[11px]">18/120</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]">○</span>
                  <span>AI Inference</span>
                </div>
                <span className="font-mono text-cyan-400 text-[11px]">Processing...</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center text-[10px]">○</span>
                  <span>Generating Results</span>
                </div>
                <span className="font-mono text-[11px]">Pending</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-600 flex items-center justify-center text-[10px]">○</span>
                  <span>Completed</span>
                </div>
                <span className="font-mono text-[11px]">Pending</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsProcessing(!isProcessing)}
            className="w-full mt-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-rose-950"
          >
            <StopCircle className="w-4 h-4" />
            {isProcessing ? 'Stop Batch Inspection' : 'Resume Batch Inspection'}
          </button>
        </div>

        {/* Batch Results Card (3 cols) */}
        <div className="lg:col-span-3 bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <span className="text-cyan-400">📊</span> Batch Results
            </h3>

            {/* Donut with 108 Processed */}
            <div className="flex items-center justify-center my-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="44" stroke="#10B981" strokeWidth="12" strokeDasharray="210 280" fill="transparent" />
                  <circle cx="56" cy="56" r="44" stroke="#EF4444" strokeWidth="12" strokeDasharray="36 280" strokeDashoffset="-210" fill="transparent" />
                  <circle cx="56" cy="56" r="44" stroke="#F59E0B" strokeWidth="12" strokeDasharray="10 280" strokeDashoffset="-246" fill="transparent" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-bold font-mono text-white">108</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider">Processed</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Good</span>
                </div>
                <span className="font-mono text-slate-300">92 (76.7%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-300">Defective</span>
                </div>
                <span className="font-mono text-slate-300">16 (13.3%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-slate-300">Failed</span>
                </div>
                <span className="font-mono text-slate-300">4 (3.3%)</span>
              </div>
            </div>
          </div>

          {/* Processing Details */}
          <div className="mt-4 pt-3 border-t border-industrial-border/60 text-[11px] font-mono space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Start Time:</span>
              <span className="text-slate-200">2026-10-08 14:32:10</span>
            </div>
            <div className="flex justify-between">
              <span>Elapsed Time:</span>
              <span className="text-slate-200">00:02:18</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Time:</span>
              <span className="text-slate-200">00:20:24</span>
            </div>
            <div className="flex justify-between">
              <span>Current Speed:</span>
              <span className="text-cyan-400 font-semibold">12.4 images/min</span>
            </div>
            <div className="flex justify-between">
              <span>Total Size:</span>
              <span className="text-slate-200">248 MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Inspection Results Table (108 items) */}
      <div className="bg-[#0D1526] border border-industrial-border rounded-xl p-5 shadow-card-dark">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-sm">📄</span>
            <h3 className="text-sm font-semibold text-white">Inspection Results (108)</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by board ID, status, or defect..."
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
              <option value="GOOD">GOOD</option>
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
                <th className="py-2.5 px-3">BOARD ID</th>
                <th className="py-2.5 px-3">IMAGE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">DEFECT TYPE</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">INFERENCE TIME</th>
                <th className="py-2.5 px-3">PROCESSED AT</th>
                <th className="py-2.5 px-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/30 text-xs font-sans">
              {filteredRows.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-industrial-800/40 transition group ${
                      isSelected ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(row.id)}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{row.id}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                      <Link to={`/inspection/${row.boardId}`} className="hover:text-cyan-400 transition">
                        {row.boardId}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-8 h-6 rounded bg-[#0A1A14] border border-emerald-800/60 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={row.status} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      {row.defectType !== '-' ? (
                        <span className="text-rose-400 font-medium">{row.defectType}</span>
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{row.confidence}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{row.inferenceTime}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{row.processedAt}</td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/inspection/${row.boardId}`}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="View Defect Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => alert(`Downloaded report package for ${row.boardId}`)}
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
          <span>Showing 1-5 of 108 results</span>

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
              22
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
    </div>
  );
};
