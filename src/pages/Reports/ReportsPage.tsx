import React, { useState } from 'react';
import { mockReports } from '../../services/mock/mockData';
import { ReportItem } from '../../types/system';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { 
  BarChart2, 
  Download, 
  Plus, 
  FileText, 
  Calendar, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>(mockReports);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportType, setReportType] = useState('DAILY');
  const [reportTitle, setReportTitle] = useState('');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newRep: ReportItem = {
      id: `rep-${Date.now()}`,
      title: reportTitle || `${reportType} Automated Quality Audit`,
      type: reportType as any,
      dateRange: 'Recent Batch',
      generatedAt: 'Just now',
      totalInspected: 1842,
      defectRate: 8.9,
      status: 'GENERATED',
    };
    setReports([newRep, ...reports]);
    setReportTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">REPORTS</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Quality & Defect Reports</h1>
              <p className="text-xs text-slate-400">Generate certified compliance summaries and defect Pareto charts</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-blue"
        >
          <Plus className="w-4 h-4" />
          Generate New Report
        </button>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark flex flex-col justify-between hover:border-industrial-borderLight transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-industrial-950 text-cyan-400 border border-industrial-border">
                  {rep.type}
                </span>
                <StatusBadge status={rep.status} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                {rep.title}
              </h3>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                <div className="bg-industrial-950/80 p-2.5 rounded border border-industrial-border/60">
                  <span className="text-[10px] text-slate-500 block">TOTAL SCANNED</span>
                  <span className="text-white font-bold">{rep.totalInspected.toLocaleString()}</span>
                </div>
                <div className="bg-industrial-950/80 p-2.5 rounded border border-industrial-border/60">
                  <span className="text-[10px] text-slate-500 block">DEFECT RATE</span>
                  <span className="text-rose-400 font-bold">{rep.defectRate}%</span>
                </div>
              </div>

              <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>Coverage: {rep.dateRange}</span>
                </div>
                <div>Generated: {rep.generatedAt}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-industrial-border/60">
              <button
                onClick={() => alert(`Downloading PDF report package for ${rep.title}`)}
                className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </button>
              <button
                onClick={() => alert(`Exported CSV raw data for ${rep.title}`)}
                className="px-3 py-2 bg-industrial-950 hover:bg-slate-800 text-slate-300 border border-industrial-border rounded-lg text-xs font-medium transition"
                title="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Factory Quality Audit Report"
        subtitle="Produce certified production reports for quality inspection"
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g. Daily Shift Line-01 Defect Audit"
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-[#0E1626] border border-industrial-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="DAILY">Daily Shift Inspection Report</option>
              <option value="WEEKLY">Weekly Quality Audit</option>
              <option value="DEFECT_ANALYSIS">Defect Pareto Root-Cause Analysis</option>
              <option value="QUALITY">IPC-A-610 Class 3 Compliance Audit</option>
            </select>
          </div>

          <div className="bg-industrial-950/60 p-3.5 rounded-lg border border-industrial-border text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200">Includes:</span>
            <p>• High-resolution defect micrographs and coordinates</p>
            <p>• Statistical anomaly thresholds and confidence distributions</p>
            <p>• Certified timestamp and digital audit stamp</p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-industrial-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-industrial-950 text-slate-300 rounded-lg text-xs font-medium border border-industrial-border hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-glow-blue"
            >
              Generate Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
