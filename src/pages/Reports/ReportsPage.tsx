import React, { useState, useEffect, useCallback } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { dashboardApi } from '../../services/api/dashboardApi';
import { ReportSummaryResponse } from '../../types/dashboard';
import { KpiCard } from '../../components/common/KpiCard';
import { TrendChart } from '../../components/charts/TrendChart';
import { DefectDonutChart } from '../../components/charts/DefectDonutChart';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  BarChart2, 
  Download, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  FileSpreadsheet,
  Filter,
  ShieldCheck,
  Info
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activeDataset, profile } = useDataset();
  const [range, setRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [simulationFilter, setSimulationFilter] = useState<'ALL' | 'REAL_ONLY' | 'SIMULATED_ONLY'>('ALL');
  const [summary, setSummary] = useState<ReportSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dashboardApi.getReportsSummary({
        datasetId: activeDataset,
        range,
        outcome: outcomeFilter,
        simulationFilter,
      });
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch report summary', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDataset, range, outcomeFilter, simulationFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const stats = summary?.kpis;
  const hasData = stats ? stats.hasData : false;

  const handleExportCsv = () => {
    const exportUrl = dashboardApi.getExportCsvUrl({
      datasetId: activeDataset,
      range,
      outcome: outcomeFilter,
      simulationFilter,
    });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-400">REPORTS</span>
            <span>&gt;</span>
            <span className="text-cyan-300 font-semibold uppercase">{profile?.category || 'PACKAGING LINE'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Certified Quality & Defect Audit Report</h1>
              <p className="text-xs text-slate-400">
                SQLAlchemy database-backed inspection analytics, defect Pareto breakdown, and audit traceability
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchReport}
            className="px-3 py-2 bg-industrial-900 border border-industrial-border rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-industrial-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-glow-emerald"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Certified CSV
          </button>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="bg-industrial-900 border border-industrial-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>REPORT FILTERS:</span>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-industrial-950 border border-industrial-border rounded-lg p-0.5 text-xs font-mono">
            {(['24h', '7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded transition ${
                  range === r
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === '24h' ? '24 Hours' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Outcome Filter */}
          <div className="flex items-center bg-industrial-950 border border-industrial-border rounded-lg p-0.5 text-xs font-mono">
            {(['ALL', 'PASS', 'FAIL'] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOutcomeFilter(o)}
                className={`px-3 py-1 rounded transition ${
                  outcomeFilter === o
                    ? 'bg-cyan-600/30 text-cyan-300 font-semibold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {o === 'ALL' ? 'All Outcomes' : o === 'PASS' ? 'Pass Only' : 'Fail Only'}
              </button>
            ))}
          </div>

          {/* Simulation Filter */}
          <div className="flex items-center bg-industrial-950 border border-industrial-border rounded-lg p-0.5 text-xs font-mono">
            {(['ALL', 'REAL_ONLY', 'SIMULATED_ONLY'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSimulationFilter(s)}
                className={`px-3 py-1 rounded transition ${
                  simulationFilter === s
                    ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'ALL' ? 'All Records' : s === 'REAL_ONLY' ? 'Genuine Only' : 'Simulated Only'}
              </button>
            ))}
          </div>
        </div>

        {summary?.generatedAt && (
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Generated: {summary.generatedAt}</span>
          </div>
        )}
      </div>

      {/* Empty State Banner */}
      {!hasData && !isLoading && (
        <div className="bg-industrial-900 border border-industrial-border rounded-xl p-8 text-center">
          <Info className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-white">No Inspection Records Match the Selected Filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            There are currently no matching database records for dataset{' '}
            <span className="font-mono text-cyan-300">{profile?.name}</span> with period{' '}
            <span className="font-mono text-cyan-300">{range}</span>. Try adjusting the outcome or simulation filters, or run inspections on the Dashboard.
          </p>
        </div>
      )}

      {/* KPI Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Units Inspected"
          value={hasData && stats ? stats.totalInspected.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle={`Reporting window: ${range.toUpperCase()}`}
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
          iconBg="bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
        />
        <KpiCard
          title="Standard Pass Yield"
          value={hasData && stats ? stats.goodBoards.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle="Certified conforming units"
          badge={hasData && stats ? { text: `${stats.goodRate}% Yield`, variant: 'good' } : undefined}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          iconBg="bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
        />
        <KpiCard
          title="Defective Diverted Units"
          value={hasData && stats ? stats.defectiveBoards.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle="Non-conforming rejects"
          badge={hasData && stats ? { text: `${stats.defectRate}% Defect`, variant: 'defective' } : undefined}
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          iconBg="bg-rose-950/40 border-rose-500/30 text-rose-400"
        />
        <KpiCard
          title="Avg. Inference Latency"
          value={hasData && stats && stats.avgInferenceTimeMs != null && stats.avgInferenceTimeMs > 0 ? `${stats.avgInferenceTimeMs} ms` : (hasData ? '<1 ms' : 'N/A')}
          subtitle="Real-time model cycle time"
          badge={{ text: 'PyTorch / CUDA', variant: 'info' }}
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          iconBg="bg-blue-950/40 border-blue-500/30 text-blue-400"
        />
      </div>

      {/* Visual Analytics Row: Trends & Defect Pareto Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={summary?.trends || []}
            range={range === 'all' ? '30d' : range}
            onRangeChange={(r) => setRange(r)}
          />
        </div>
        <div className="lg:col-span-1">
          <DefectDonutChart
            data={summary?.defectBreakdown || []}
            title="Defect Pareto Breakdown"
            subtitle="Observed defect taxonomy"
          />
        </div>
      </div>

      {/* Traceable Inspection Records Table */}
      <div className="bg-industrial-900 border border-industrial-border rounded-xl p-5 shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Traceable Inspection Audit Records ({summary?.inspections?.items?.length || 0} Shown)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual inspection traces persisted in SQLite with bounding boxes and latency
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-industrial-950 hover:bg-slate-800 text-slate-300 border border-industrial-border rounded-lg text-xs font-mono flex items-center gap-1.5 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Download Full Trace CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-industrial-950/80 text-slate-400 border-b border-industrial-border">
              <tr>
                <th className="py-2.5 px-3">INSPECTION ID</th>
                <th className="py-2.5 px-3">TIMESTAMP</th>
                <th className="py-2.5 px-3">PRODUCT / DATASET</th>
                <th className="py-2.5 px-3">OUTCOME</th>
                <th className="py-2.5 px-3">DEFECT CLASS</th>
                <th className="py-2.5 px-3">CONFIDENCE</th>
                <th className="py-2.5 px-3">LATENCY</th>
                <th className="py-2.5 px-3">ORIGIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-border/40">
              {summary?.inspections?.items && summary.inspections.items.length > 0 ? (
                summary.inspections.items.map((rec) => (
                  <tr key={rec.id} className="hover:bg-industrial-800/40 transition">
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">{rec.id}</td>
                    <td className="py-2.5 px-3 text-slate-400">{rec.timestamp}</td>
                    <td className="py-2.5 px-3 text-slate-300">{rec.boardId || rec.datasetId}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={rec.status === 'GOOD' ? 'PASS' : rec.status === 'DEFECTIVE' ? 'FAIL' : 'REVIEW'} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {rec.defects && rec.defects.length > 0 ? (
                        <span className="text-rose-400 font-medium">{rec.defects[0].type}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {typeof rec.confidence === 'number' ? `${rec.confidence.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {rec.inferenceTimeMs ? `${rec.inferenceTimeMs} ms` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {rec.isSimulated ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30">
                          SIMULATED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                          GENUINE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No inspection records found for the current query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
