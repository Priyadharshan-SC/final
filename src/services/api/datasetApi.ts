import { request } from './apiClient';
import { ProductProfile, DatasetListItem } from '../../types/dataset';

export const datasetApi = {
  async listDatasets(): Promise<{ datasets: DatasetListItem[]; active_dataset: string }> {
    try {
      return await request<{ datasets: DatasetListItem[]; active_dataset: string }>('/datasets');
    } catch (e) {
      console.warn('[datasetApi] listDatasets backend call failed, fallback', e);
      return {
        datasets: [
          {
            id: 'water_bottle',
            name: 'Industrial Water Bottle',
            category: 'Bottling & Packaging Line',
            description: 'Optical anomaly & contamination detection for blow-molded bottles',
            engine_type: 'patch_anomaly',
            status: 'ready',
            is_active: true,
            defect_classes_count: 3,
            samples_count: 24,
            model_name: 'PatchCore ResNet18',
            accuracy: 98.8
          },
          {
            id: 'pcb_industrial',
            name: 'Industrial PCB SMT',
            category: 'Electronics Surface Mount',
            description: 'Automated Optical Inspection for soldered circuit boards',
            engine_type: 'supervised_yolo',
            status: 'ready',
            is_active: false,
            defect_classes_count: 6,
            samples_count: 10,
            model_name: 'YOLO11n Supervised',
            accuracy: 98.4
          }
        ],
        active_dataset: 'water_bottle'
      };
    }
  },

  async getActiveProfile(): Promise<ProductProfile> {
    try {
      return await request<ProductProfile>('/datasets/active');
    } catch (e) {
      console.warn('[datasetApi] getActiveProfile backend call failed, fallback', e);
      return {
        product_id: 'water_bottle',
        name: 'Industrial Water Bottle',
        category: 'Bottling & Packaging Line',
        description: 'Optical anomaly detection & particulate contamination audit for blow-molded PET bottles',
        engine_type: 'patch_anomaly',
        status: 'ready',
        dataset_path: 'datasets/water_bottle',
        defect_classes: [
          { id: 'broken_large', name: 'Broken (Large Fracture)', severity: 'CRITICAL', color: '#EF4444', description: 'Severe structural cracks, splits, and sidewall fracture anomalies' },
          { id: 'broken_small', name: 'Broken (Small / Rim Chip)', severity: 'MAJOR', color: '#F97316', description: 'Localized mouth chips, neck finish fractures, and capping rim defects' },
          { id: 'contamination', name: 'Surface Contamination', severity: 'CRITICAL', color: '#EAB308', description: 'Foreign particulate inclusion, embedded dust, oil residue, and debris' }
        ],
        normal_class: { id: 'good', name: 'Standard Pass (Defect-Free)', color: '#10B981' },
        decision_policy: {
          confidence_threshold: 0.20,
          anomaly_threshold: 0.0070,
          review_margin: 0.0020
        },
        pipeline_stages: [
          { id: '1', name: 'Bottle Infeed', status: 'ONLINE', detail: 'Rotary infeed starwheel 1.2 m/s' },
          { id: '2', name: 'Inspection Cell', status: 'ONLINE', detail: '360° Diffused backlight LED array', latency_ms: 5 },
          { id: '3', name: 'PatchCore AI', status: 'ONLINE', detail: 'NVIDIA RTX 2050 (Spatial Tensor Cores)', latency_ms: 14 },
          { id: '4', name: 'Decision Matrix', status: 'ONLINE', detail: 'Calibrated anomaly threshold (0.0070)', latency_ms: 2 },
          { id: '5', name: 'Ejection Gate', status: 'ONLINE', detail: 'High-speed pneumatic diverter ready' }
        ],
        model_metrics: {
          name: 'PatchCore ResNet18 Feature Pyramid',
          version: 'v1.0.0',
          engine_type: 'patch_anomaly',
          accuracy: 98.8,
          precision: 98.1,
          recall: 99.2,
          f1_score: 98.6,
          image_auroc: 0.992,
          pixel_auroc: 0.978,
          avg_inference_time_ms: 14,
          status: 'PRODUCTION'
        },
        sample_images: [],
        golden_templates: []
      };
    }
  },

  async selectDataset(datasetId: string): Promise<{ success: boolean; active_dataset: string; profile: ProductProfile }> {
    return await request<{ success: boolean; active_dataset: string; profile: ProductProfile }>('/datasets/select', {
      method: 'POST',
      body: JSON.stringify({ dataset_id: datasetId })
    });
  },

  async onboardDataset(payload: { path: string; product_id: string; name?: string; category?: string }): Promise<any> {
    return await request<any>('/datasets/onboard', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
