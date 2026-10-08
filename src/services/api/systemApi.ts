import { IS_MOCK_MODE, request } from './apiClient';
import { mockEdgeDevice, mockDatasets, mockModels, mockReports } from '../mock/mockData';
import { EdgeDevice } from '../../types/device';
import { DatasetInfo, ModelInfo, ReportItem } from '../../types/system';

export const deviceApi = {
  async getDeviceStatus(deviceId = 'LINE-01'): Promise<EdgeDevice> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 60));
      return {
        ...mockEdgeDevice,
        fps: +(58 + Math.random() * 3).toFixed(1),
        inferenceTimeMs: Math.round(27 + Math.random() * 3),
        cpuUsagePercent: Math.round(30 + Math.random() * 8),
        gpuUsagePercent: Math.round(58 + Math.random() * 8),
      };
    }
    return request<EdgeDevice>(`/devices/${deviceId}/status`);
  }
};

export const modelApi = {
  async getModels(): Promise<ModelInfo[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 70));
      return mockModels;
    }
    return request<ModelInfo[]>('/models');
  },

  async activateModel(modelId: string): Promise<boolean> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 200));
      return true;
    }
    return request<boolean>(`/models/${modelId}/activate`, { method: 'POST' });
  }
};

export const datasetApi = {
  async getDatasets(): Promise<DatasetInfo[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 70));
      return mockDatasets;
    }
    return request<DatasetInfo[]>('/datasets');
  }
};

export const reportApi = {
  async getReports(): Promise<ReportItem[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 70));
      return mockReports;
    }
    return request<ReportItem[]>('/reports');
  },

  async generateReport(type: string): Promise<ReportItem> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 400));
      return {
        id: `rep-${Date.now()}`,
        title: `Generated ${type} Report`,
        type: type as any,
        dateRange: 'Recent Batch',
        generatedAt: 'Just now',
        totalInspected: 1842,
        defectRate: 8.9,
        status: 'GENERATED'
      };
    }
    return request<ReportItem>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }
};

export const authApi = {
  async login(email: string, pass: string): Promise<{ user: { name: string; email: string; role: string }; token: string }> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 150));
      return {
        user: { name: 'Priyadharshan', email: email || 'priyadharshan@pcbinspect.ai', role: 'Admin' },
        token: 'mock-jwt-token-pcbinspect-ai-2026',
      };
    }
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, pass }),
    });
  }
};
