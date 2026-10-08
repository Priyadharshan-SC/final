export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING';
export type CameraStatus = 'CONNECTED' | 'DISCONNECTED' | 'CALIBRATING';

export interface EdgeDevice {
  id: string;
  name: string;
  status: DeviceStatus;
  cameraStatus: CameraStatus;
  modelVersion: string;
  fps: number;
  inferenceTimeMs: number;
  temperatureC: number;
  cpuUsagePercent: number;
  gpuUsagePercent: number;
  memoryUsagePercent: number;
  storageUsagePercent: number;
  lineId: string;
  ipAddress: string;
}
