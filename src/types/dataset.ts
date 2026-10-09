export interface DefectClassInfo {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  color: string;
  description?: string;
}

export interface PipelineStageInfo {
  id: string;
  name: string;
  status: 'ONLINE' | 'WARNING' | 'OFFLINE';
  detail: string;
  latency_ms?: number;
}

export interface ModelMetricInfo {
  name: string;
  version: string;
  engine_type: 'patch_anomaly' | 'supervised_yolo' | 'pretrained_clip';
  engine_name?: string;
  model_name?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  image_auroc?: number;
  pixel_auroc?: number;
  avg_inference_time_ms: number;
  status: 'PRODUCTION' | 'STAGING' | 'ARCHIVED';
}

export interface ProductProfile {
  product_id: string;
  name: string;
  category: string;
  description: string;
  standards_reference?: string;
  engine_type: 'patch_anomaly' | 'supervised_yolo';
  status: 'ready' | 'onboarding' | 'unvalidated';
  dataset_path: string;
  defect_classes: DefectClassInfo[];
  normal_class: { id: string; name: string; color: string };
  decision_policy: {
    confidence_threshold: number;
    anomaly_threshold: number;
    review_margin?: number;
    fail_defect_count?: number;
  };
  pipeline_stages: PipelineStageInfo[];
  model_metrics?: ModelMetricInfo;
  sample_images: Array<{
    id: string;
    name: string;
    category: string;
    is_normal: boolean;
    image_url: string;
    file_path: string;
  }>;
  golden_templates: Array<{
    id: string;
    name: string;
    image_url: string;
    file_path: string;
  }>;
  custom_metadata?: Record<string, any>;
}

export interface DatasetListItem {
  id: string;
  name: string;
  category: string;
  description: string;
  engine_type: string;
  status: string;
  is_active: boolean;
  defect_classes_count: number;
  samples_count: number;
  model_name: string;
  accuracy: number;
}
