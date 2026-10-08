import { IS_MOCK_MODE, request } from './apiClient';
import { 
  mockDashboardStats, 
  mockTrend24h, 
  mockTrend7d, 
  mockTrend30d, 
  mockDefectDistribution, 
  mockPipelineStages, 
  mockModelPerformance, 
  mockSystemAlerts 
} from '../mock/mockData';
import { DashboardStats, InspectionTrendPoint, DefectDistributionItem, PipelineStage, ModelMetricStats, SystemAlert } from '../../types/dashboard';

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 80));
      return mockDashboardStats;
    }
    return request<DashboardStats>('/dashboard/stats');
  },

  async getTrends(range: '24h' | '7d' | '30d'): Promise<InspectionTrendPoint[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 80));
      if (range === '24h') return mockTrend24h;
      if (range === '7d') return mockTrend7d;
      return mockTrend30d;
    }
    return request<InspectionTrendPoint[]>(`/dashboard/trends?range=${range}`);
  },

  async getDefectsDistribution(): Promise<DefectDistributionItem[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 60));
      return mockDefectDistribution;
    }
    return request<DefectDistributionItem[]>('/dashboard/defects');
  },

  async getPipelineStages(): Promise<PipelineStage[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 50));
      return mockPipelineStages;
    }
    return request<PipelineStage[]>('/dashboard/pipeline');
  },

  async getModelPerformance(): Promise<ModelMetricStats> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 50));
      return mockModelPerformance;
    }
    return request<ModelMetricStats>('/dashboard/model-metrics');
  },

  async getAlerts(): Promise<SystemAlert[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 50));
      return mockSystemAlerts;
    }
    return request<SystemAlert[]>('/dashboard/alerts');
  }
};
