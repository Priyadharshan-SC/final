import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../services/api/dashboardApi';
import { inspectionApi } from '../../services/api/inspectionApi';
import { DashboardStats, InspectionTrendPoint, DefectDistributionItem, PipelineStage, ModelMetricStats, SystemAlert } from '../../types/dashboard';
import { Inspection } from '../../types/inspection';
import { KpiCard } from '../../components/common/KpiCard';
import { TrendChart } from '../../components/charts/TrendChart';
import { DefectDonutChart } from '../../components/charts/DefectDonutChart';
import { ProductionPipeline } from '../../components/dashboard/ProductionPipeline';
import { ModelPerformanceCard } from '../../components/dashboard/ModelPerformanceCard';
import { LatestInspectionsTable } from '../../components/dashboard/LatestInspectionsTable';
import { AlertsList } from '../../components/dashboard/AlertsList';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  RefreshCw,
  PlusCircle,
  Scan
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendRange, setTrendRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [trendData, setTrendData] = useState<InspectionTrendPoint[]>([]);
  const [defectsData, setDefectsData] = useState<DefectDistributionItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [model, setModel] = useState<ModelMetricStats | null>(null);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [latestInspections, setLatestInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, t, d, p, m, a, l] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTrends(trendRange),
        dashboardApi.getDefectsDistribution(),
        dashboardApi.getPipelineStages(),
        dashboardApi.getModelPerformance(),
        dashboardApi.getAlerts(),
        inspectionApi.getLatestInspections(5),
      ]);
      setStats(s);
      setTrendData(t);
      setDefectsData(d);
      setPipeline(p);
      setModel(m);
      setAlerts(a);
      setLatestInspections(l);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [trendRange]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <span>HOME</span>
            <span>&gt;</span>
            <span className="text-slate-300">DASHBOARD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Inspection Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time optical anomaly detection, quality metrics, and factory line telematics.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="px-3 py-2 bg-industrial-900 border border-industrial-border rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-industrial-800 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Telemetry
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

      {/* KPI Cards Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Inspected"
          value={stats?.totalInspected.toLocaleString() || '1,842'}
          subtitle="Boards scanned today"
          icon={<Layers className="w-4 h-4 text-cyan-400" />}
          iconBg="bg-cyan-950/40 border-cyan-500/30 text-cyan-400"
        />
        <KpiCard
          title="Good Boards"
          value={stats?.goodBoards.toLocaleString() || '1,678'}
          subtitle="Meets all IPC-A-610 standards"
          badge={{ text: `${stats?.goodRate || 91.1}%`, variant: 'good' }}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          iconBg="bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
        />
        <KpiCard
          title="Defective Boards"
          value={stats?.defectiveBoards.toLocaleString() || '164'}
          subtitle="Anomalies flagged for review"
          badge={{ text: `${stats?.defectRate || 8.9}%`, variant: 'defective' }}
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
          iconBg="bg-rose-950/40 border-rose-500/30 text-rose-400"
        />
        <KpiCard
          title="Avg. Inference Time"
          value={`${stats?.avgInferenceTimeMs || 28} ms`}
          subtitle="Latency per optical frame"
          badge={{ text: 'Edge AI', variant: 'info' }}
          icon={<Clock className="w-4 h-4 text-blue-400" />}
          iconBg="bg-blue-950/40 border-blue-500/30 text-blue-400"
        />
      </div>

      {/* Charts Row (2 columns: Trend Line Chart + Defect Donut) */}
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

      {/* Latest Inspected Boards Table */}
      <LatestInspectionsTable inspections={latestInspections} />
    </div>
  );
};
