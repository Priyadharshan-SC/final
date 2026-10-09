import { Inspection } from './inspection';

export interface DashboardStats {
  hasData?: boolean;
  totalInspected: number;
  goodBoards: number;
  goodRate: number | null;
  defectiveBoards: number;
  defectRate: number | null;
  pendingReview?: number;
  avgInferenceTimeMs: number | null;
  p95InferenceTimeMs?: number | null;
  datasetId?: string;
  productName?: string;
}

export interface InspectionTrendPoint {
  time: string;
  good: number;
  defective: number;
  total: number;
}

export interface DefectDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'NOT_CONFIGURED' | 'ONLINE' | 'WARNING';
  detail?: string;
  device?: string;
  lastActivity?: string;
  latencyMs?: number;
  message?: string;
  isSimulated?: boolean;
  errorReason?: string;
}

export interface ModelMetricStats {
  name: string;
  version?: string;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  avgInferenceTimeMs: number;
  status: 'PRODUCTION' | 'STAGING' | 'ARCHIVED';
}

export interface SystemAlert {
  id: string;
  type?: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS' | 'ERROR';
  timestamp: string;
  source: string;
}

export interface ReportSummaryResponse {
  generatedAt: string;
  datasetId: string;
  timeRange: string;
  outcome: string;
  simulationFilter: string;
  kpis: DashboardStats;
  trends: InspectionTrendPoint[];
  defectBreakdown: DefectDistributionItem[];
  reviews: {
    confirmed: number;
    falsePositive: number;
    falseNegative: number;
    totalReviewed: number;
  };
  inspections: {
    items: Inspection[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
