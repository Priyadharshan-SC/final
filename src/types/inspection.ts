import { Defect } from './defect';

export type InspectionStatus = 'GOOD' | 'DEFECTIVE' | 'PENDING' | 'FAILED';

export interface Inspection {
  id: string;
  boardId: string;
  boardType: string;
  timestamp: string;
  status: InspectionStatus;
  confidence: number;
  inferenceTimeMs: number;
  imageUrl?: string;
  annotatedImageBase64?: string;
  heatmapBase64?: string;
  anomalyScore?: number;
  threshold?: number;
  datasetId?: string;
  defects: Defect[];
  modelVersion?: string;
  deviceId?: string;
  resolution?: string;
  fileSizeKb?: number;
  reviewed?: boolean;
  reviewStatus?: 'CONFIRMED' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'UNREVIEWED';
  reviewNotes?: string;
  isSimulated?: boolean;
  simulationBatchId?: string;
}

export interface InspectionFilter {
  page?: number;
  limit?: number;
  status?: string;
  boardType?: string;
  defectType?: string;
  dateRange?: string;
  search?: string;
}

export interface PaginatedInspections {
  items: Inspection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
