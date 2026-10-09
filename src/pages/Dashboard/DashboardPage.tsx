import React, { useEffect, useState, useCallback } from 'react';
import { useDataset } from '../../context/DatasetContext';
import { dashboardApi } from '../../services/api/dashboardApi';
import { inspectionApi } from '../../services/api/inspectionApi';
import { inspectionStream } from '../../services/websocket/inspectionStream';
import { DashboardStats, InspectionTrendPoint, DefectDistributionItem, PipelineStage, ModelMetricStats, SystemAlert } from '../../types/dashboard';
import { Inspection } from '../../types/inspection';
import { KpiCard } from '../../components/common/KpiCard';
import { TrendChart } from '../../components/charts/TrendChart';
import { DefectDonutChart } from '../../components/charts/DefectDonutChart';
import { ProductionPipeline } from '../../components/dashboard/ProductionPipeline';
import { ModelPerformanceCard } from '../../components/dashboard/ModelPerformanceCard';
import { LatestInspectionsTable } from '../../components/dashboard/LatestInspectionsTable';
import { AlertsList } from '../../components/dashboard/AlertsList';
import { HistoricalSimulationModal } from '../../components/simulation/HistoricalSimulationModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  RefreshCw,
  Scan,
  Droplets,
  CircuitBoard,
  Sparkles,
  Database,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activeDataset, profile } = useDataset();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendRange, setTrendRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [trendData, setTrendData] = useState<InspectionTrendPoint[]>([]);
  const [defectsData, setDefectsData] = useState<DefectDistributionItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [model, setModel] = useState<ModelMetricStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [latestInspections, setLatestInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [simulationFilter, setSimulationFilter] = useState<'ALL' | 'REAL_ONLY' | 'SIMULATED_ONLY'>('ALL');
  const navigate = useNavigate();

  const isWaterBottle = activeDataset === 'water_bottle';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, t, d, p, m, a, l] = await Promise.all([
        dashboardApi.getStats(activeDataset, simulationFilter).catch(() => null),
        dashboardApi.getTrends(trendRange, activeDataset, simulationFilter).catch(() => []),
        dashboardApi.getDefectsDistribution(activeDataset, simulationFilter).catch(() => []),
        dashboardApi.getPipelineStages().catch(() => []),
        dashboardApi.getModelPerformance().catch(() => null),
        dashboardApi.getAlerts().catch(() => []),
        inspectionApi.getLatestInspections(5).catch(() => []),
      ]);
      if (s) setStats(s);
      setTrendData(t || []);
      setDefectsData(d || []);
      if (p && p.length > 0) setPipeline(p);
      if (m) setModel(m);
      if (a && a.length > 0) setAlerts(a);
      if (l) setLatestInspections(l);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeDataset, trendRange, simulationFilter]);

  // Initial load and filter change trigger
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time WebSocket synchronization & tab-focus auto-refresh
  useEffect(() => {
    inspectionStream.connect();
    const unsubscribe = inspectionStream.subscribe((payload: any) => {
      // Whenever an inspection completes or simulation batch changes, refresh database metrics
      if (payload?.type === 'INSPECTION_COMPLETED' || payload?.type === 'SIMULATION_GENERATED' || payload?.type === 'SIMULATION_CLEARED' || payload?.id) {
        loadData();
      }
    });

    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  const hasData = stats ? stats.hasData : false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dynamic Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-400">DASHBOARD</span>
            <span>&gt;</span>
            <span className="text-cyan-300 font-semibold uppercase">{profile?.category || 'PACKAGING LINE'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {isWaterBottle ? (
              <>
                <Droplets className="w-6 h-6 text-cyan-400" />
                <span>Water Bottle Inspection Command Center</span>
              </>
            ) : (
              <>
                <CircuitBoard className="w-6 h-6 text-emerald-400" />
                <span>PCB SMT Inspection Command Center</span>
              </>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isWaterBottle
              ? 'Real-time database-backed anomaly detection, rim inspection, and packaging audit.'
              : 'Real-time database-backed optical anomaly detection, IPC-A-610 quality metrics, and SMT line telematics.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Simulation Filter Selector */}
          <div className="flex items-center bg-industrial-950 border border-industrial-border rounded-lg p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setSimulationFilter('ALL')}
              className={`px-2.5 py-1.5 rounded transition ${
                simulationFilter === 'ALL'
                  ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show both genuine and simulated inspection records"
            >
              All Records
            </button>
            <button
              onClick={() => setSimulationFilter('REAL_ONLY')}
              className={`px-2.5 py-1.5 rounded transition ${
                simulationFilter === 'REAL_ONLY'
                  ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filter to genuine camera/file inspections only"
            >
              Genuine Only
            </button>
            <button
              onClick={() => setSimulationFilter('SIMULATED_ONLY')}
              className={`px-2.5 py-1.5 rounded transition ${
                simulationFilter === 'SIMULATED_ONLY'
                  ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filter to synthetic/simulated test runs"
            >
              Simulated Only
            </button>
          </div>

          {/* Simulate Data Button */}
          <button
            onClick={() => setIsSimulationModalOpen(true)}
            className="px-3 py-2 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/40 rounded-lg text-xs font-semibold text-purple-200 hover:text-white hover:border-purple-400 transition flex items-center gap-1.5 shadow-sm"
            title="Generate or purge historical test data (1d, 7d, 30d)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Simulate Data
          </button>

          <button
            onClick={loadData}
            className="px-3 py-2 bg-industrial-900 border border-industrial-border rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-industrial-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync DB
          </button>

          <button
            onClick={() => navigate('/live-inspection')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white shadow-glow-blue transition flex items-center gap-1.5"
          >
            <Scan className="w-3.5 h-3.5" />
            Launch Live Camera
          </button>
        </div>
      </div>

      {/* Database Empty State Notice */}
      {!hasData && !isLoading && (
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
            <div>
              <span className="font-semibold text-white">No inspections found in SQLite database</span>
              <p className="text-slate-300 mt-0.5">
                Current filter: <span className="font-mono text-cyan-300">{simulationFilter}</span> for dataset{' '}
                <span className="font-mono text-cyan-300">{profile?.name}</span>. Perform live inspections or click "Simulate Data" to generate 1, 7, or 30 days of test history.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSimulationModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition whitespace-nowrap"
          >
            Simulate Test Data
          </button>
        </div>
      )}

      {/* KPI Cards Row — Strictly Database-Driven */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={isWaterBottle ? "Total Bottles Inspected" : "Total Boards Inspected"}
          value={hasData && stats ? stats.totalInspected.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle={hasData ? (isWaterBottle ? "Bottles scanned on rotary line" : "Boards scanned today on SMT belt") : "No records in current scope"}
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
          iconBg="bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
        />
        <KpiCard
          title={isWaterBottle ? "Standard Pass Bottles" : "Good Boards"}
          value={hasData && stats ? stats.goodBoards.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle={isWaterBottle ? "Meets bottle packaging integrity" : "Meets IPC-A-610 Class 3"}
          badge={hasData && stats ? { text: `${stats.goodRate}%`, variant: 'good' } : undefined}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          iconBg="bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
        />
        <KpiCard
          title={isWaterBottle ? "Defective Bottles" : "Defective Boards"}
          value={hasData && stats ? stats.defectiveBoards.toLocaleString() : (isLoading ? '...' : '0')}
          subtitle={isWaterBottle ? "Diverted to rejection bin" : "Anomalies routed to rework lane"}
          badge={hasData && stats ? { text: `${stats.defectRate}%`, variant: 'defective' } : undefined}
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          iconBg="bg-rose-950/40 border-rose-500/30 text-rose-400"
        />
        <KpiCard
          title="Avg. Inference Latency"
          value={hasData && stats && stats.avgInferenceTimeMs != null && stats.avgInferenceTimeMs > 0 ? `${stats.avgInferenceTimeMs} ms` : (hasData ? '<1 ms' : 'N/A')}
          subtitle="CUDA / PyTorch Real-time Pipeline"
          badge={{ text: isWaterBottle ? 'PatchCore' : 'YOLO11n', variant: 'info' }}
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          iconBg="bg-blue-950/40 border-blue-500/30 text-blue-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart
            data={trendData}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
          />
        </div>
        <div className="lg:col-span-1">
          <DefectDonutChart data={defectsData} />
        </div>
      </div>

      {/* Production Pipeline 5-Stage Visualizer */}
      <ProductionPipeline stages={pipeline} />

      {/* Model Performance & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {model && <ModelPerformanceCard model={model} />}
        <AlertsList alerts={alerts} />
      </div>

      {/* Latest Inspections Table */}
      <LatestInspectionsTable inspections={latestInspections} />

      {/* Historical Simulation Modal */}
      <HistoricalSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        onSimulationUpdated={loadData}
      />
    </div>
  );
};

