import { WS_BASE_URL, IS_MOCK_MODE } from '../api/apiClient';
import { Inspection } from '../../types/inspection';
import { mockInspections } from '../mock/mockData';

type StreamCallback = (inspection: Inspection) => void;

export class InspectionStreamService {
  private ws: WebSocket | null = null;
  private subscribers: Set<StreamCallback> = new Set();
  private mockInterval: number | null = null;
  private isConnected = false;
  private mockIndex = 0;

  connect(): void {
    if (this.isConnected) return;

    if (IS_MOCK_MODE) {
      this.isConnected = true;
      this.startMockStream();
      return;
    }

    try {
      this.ws = new WebSocket(`${WS_BASE_URL}/inspection`);
      this.ws.onopen = () => {
        this.isConnected = true;
      };
      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.notifySubscribers(payload);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };
      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch (err) {
      console.warn('Real WebSocket failed, falling back to local simulation', err);
      this.startMockStream();
    }
  }

  private startMockStream(): void {
    if (this.mockInterval) return;
    this.mockInterval = window.setInterval(() => {
      if (this.subscribers.size === 0) return;
      const base = mockInspections[this.mockIndex % mockInspections.length];
      this.mockIndex++;

      const simulatedItem: Inspection = {
        ...base,
        id: `INS-${String(100 + this.mockIndex).padStart(3, '0')}`,
        boardId: `ESP32-${String(100 + this.mockIndex).padStart(3, '0')}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        inferenceTimeMs: Math.round(25 + Math.random() * 8),
      };

      this.notifySubscribers(simulatedItem);
    }, 4000);
  }

  disconnect(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  subscribe(callback: StreamCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(inspection: Inspection): void {
    this.subscribers.forEach((cb) => cb(inspection));
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}

export const inspectionStream = new InspectionStreamService();
