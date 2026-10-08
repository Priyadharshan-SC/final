import { Inspection } from './inspection';

export interface DashboardStats {
  totalInspected: number;
  goodBoards: number;
  goodRate: number;
  defectiveBoards: number;
  defectRate: number;
  avgInferenceTimeMs: number;
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
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  detail: string;
  latencyMs?: number;
}

export interface ModelMetricStats {
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgInferenceTimeMs: number;
  status: 'PRODUCTION' | 'STAGING' | 'ARCHIVED';
}

export interface SystemAlert {
  id: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  timestamp: string;
  source: string;
}
