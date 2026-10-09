export type DefectSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type DefectType = 
  | 'Solder Bridge'
  | 'Missing Component'
  | 'Misaligned Component'
  | 'Insufficient Solder'
  | 'Excess Solder'
  | 'Open Circuit'
  | 'Short Circuit'
  | 'Scratch'
  | 'Damaged Component'
  | 'Other Anomaly'
  | 'broken_large'
  | 'broken_small'
  | 'contamination'
  | 'anomaly'
  | string;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Defect {
  id: string;
  type: DefectType;
  confidence: number;
  severity: DefectSeverity;
  bbox: BoundingBox;
  location?: string;
  suggestedAction?: string;
}
