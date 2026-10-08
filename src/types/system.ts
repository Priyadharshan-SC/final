export interface ModelInfo {
  id: string;
  name: string;
  boardType: string;
  version: string;
  framework: string;
  status: 'PRODUCTION' | 'STAGING' | 'INACTIVE';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgInferenceTimeMs: number;
  sizeMb: number;
  createdAt: string;
  datasetName: string;
}

export interface DatasetInfo {
  id: string;
  name: string;
  boardType: string;
  totalImages: number;
  goodSamples: number;
  defectiveSamples: number;
  version: string;
  createdAt: string;
  status: 'READY' | 'TRAINING' | 'PROCESSING';
}

export interface ReportItem {
  id: string;
  title: string;
  type: 'DAILY' | 'WEEKLY' | 'DEFECT_ANALYSIS' | 'QUALITY' | 'MODEL_AUDIT';
  dateRange: string;
  generatedAt: string;
  totalInspected: number;
  defectRate: number;
  status: 'GENERATED' | 'PROCESSING';
  downloadUrl?: string;
}
