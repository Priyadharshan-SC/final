import { IS_MOCK_MODE, request } from './apiClient';
import { mockInspections } from '../mock/mockData';
import { Inspection, InspectionFilter, PaginatedInspections } from '../../types/inspection';
import { formatImageSrc } from '../../utils/imageUtils';

let liveInspections = [...mockInspections];

function normalizeInspection(data: any): Inspection {
  const isGood = data.status === 'GOOD' || data.verdict === 'PASS' || (!data.defects || data.defects.length === 0);
  const defects = (data.defects || []).map((d: any, idx: number) => ({
    id: d.id || `DEF-${idx + 1}`,
    type: d.type || d.class_name || 'Defect',
    severity: d.severity || (d.confidence > 80 || (d.confidence <= 1 && d.confidence > 0.8) ? 'CRITICAL' : 'MAJOR'),
    location: d.location || `X:${d.bbox?.x ?? d.bbox?.[0] ?? 0} Y:${d.bbox?.y ?? d.bbox?.[1] ?? 0}`,
    confidence: typeof d.confidence === 'number' && d.confidence <= 1 ? Math.round(d.confidence * 100) : (d.confidence || 90),
    bbox: d.bbox?.x !== undefined ? d.bbox : {
      x: d.bbox?.[0] || 100,
      y: d.bbox?.[1] || 100,
      width: d.bbox?.[2] ? (d.bbox[2] - d.bbox[0]) : 120,
      height: d.bbox?.[3] ? (d.bbox[3] - d.bbox[1]) : 100,
    },
    suggestedAction: d.suggestedAction || 'Route to rework station for optical verification.'
  }));

  const rawImg = data.imageUrl || data.image_url || data.thumbnail_url;
  const rawAnnotated = data.annotatedImageBase64 || data.annotated_image_b64 || data.results?.annotated_image_b64;
  const rawHeatmap = data.heatmapBase64 || data.heatmap_base64 || data.heatmap_b64 || data.results?.heatmap_base64;

  const imageUrl = rawImg ? formatImageSrc(rawImg) : undefined;
  const annotatedImageBase64 = rawAnnotated ? formatImageSrc(rawAnnotated) : undefined;
  const heatmapBase64 = rawHeatmap ? formatImageSrc(rawHeatmap) : undefined;

  return {
    id: data.id || data.inspection_id || 'INS-001',
    boardId: data.boardId || data.board_id || 'ESP32-001',
    boardType: data.boardType || data.board_type || 'Industrial Unit',
    timestamp: data.timestamp || new Date().toLocaleTimeString(),
    status: isGood ? 'GOOD' : 'DEFECTIVE',
    confidence: data.confidence ?? 98,
    inferenceTimeMs: data.inferenceTimeMs ?? data.inference_time_ms ?? 28,
    imageUrl: imageUrl,
    annotatedImageBase64: annotatedImageBase64,
    heatmapBase64: heatmapBase64,
    anomalyScore: data.anomalyScore || data.anomaly_score || data.results?.anomaly_score,
    threshold: data.threshold || data.results?.threshold,
    datasetId: data.datasetId || data.dataset_id,
    defects: defects,
    reviewed: Boolean(data.reviewed),
    reviewStatus: data.reviewStatus || data.review_status,
    reviewNotes: data.reviewNotes || data.review_notes
  };
}

export const inspectionApi = {
  async getLatestInspections(limit = 5): Promise<Inspection[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 60));
      return liveInspections.slice(0, limit);
    }
    try {
      const items = await request<any[]>(`/inspections/latest?limit=${limit}`);
      return (items || []).map(normalizeInspection);
    } catch (e) {
      return liveInspections.slice(0, limit);
    }
  },

  async getInspectionById(id: string): Promise<Inspection | undefined> {
    try {
      const data = await request<any>(`/inspections/${id}`);
      if (data && (data.id || data.boardId || data.board_id)) {
        return normalizeInspection(data);
      }
    } catch (e) {
      try {
        const data = await request<any>(`/inspection/${id}`);
        if (data && (data.id || data.boardId || data.board_id)) {
          return normalizeInspection(data);
        }
      } catch (err) {
        // Fallback to local
      }
    }

    const found = liveInspections.find(ins => 
      ins.id === id || 
      ins.boardId === id || 
      ins.id.toLowerCase() === id.toLowerCase() || 
      ins.boardId.toLowerCase() === id.toLowerCase()
    );
    if (found) return found;

    return normalizeInspection({
      id: id,
      boardId: id,
      status: 'GOOD',
      confidence: 98,
      inferenceTimeMs: 28,
      defects: []
    });
  },

  async queryHistory(filter: InspectionFilter): Promise<PaginatedInspections> {
    try {
      const params = new URLSearchParams();
      if (filter.page) params.append('page', String(filter.page));
      if (filter.limit) params.append('limit', String(filter.limit));
      if (filter.status) params.append('status', filter.status);
      if (filter.boardType) params.append('boardType', filter.boardType);
      if (filter.defectType) params.append('defectType', filter.defectType);
      if (filter.search) params.append('search', filter.search);

      const res = await request<any>(`/inspections?${params.toString()}`);
      if (res && res.items) {
        return {
          items: res.items.map(normalizeInspection),
          total: res.total || res.items.length,
          page: res.page || 1,
          limit: res.limit || 10,
          totalPages: res.totalPages || 1
        };
      }
    } catch (e) {
      console.warn('[inspectionApi] queryHistory backend failed, fallback to local', e);
    }

    let filtered = [...liveInspections];
    if (filter.status && filter.status !== 'ALL') {
      filtered = filtered.filter(i => i.status === filter.status);
    }
    if (filter.defectType && filter.defectType !== 'ALL') {
      filtered = filtered.filter(i => i.defects.some(d => d.type === filter.defectType));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      filtered = filtered.filter(i => 
        i.boardId.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.defects.some(d => d.type.toLowerCase().includes(q))
      );
    }
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return {
      items: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  },

  async submitReview(inspectionId: string, reviewStatus: 'CONFIRMED' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE', notes?: string): Promise<Inspection> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 120));
      const target = liveInspections.find(i => i.id === inspectionId || i.boardId === inspectionId);
      if (target) {
        target.reviewed = true;
        target.reviewStatus = reviewStatus;
        target.reviewNotes = notes;
        return { ...target };
      }
      return liveInspections[0];
    }
    return request<Inspection>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ inspectionId, reviewStatus, notes }),
    });
  },

  async runBatchInspection(boardType: string, fileCount: number): Promise<Inspection[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 500));
      return liveInspections.slice(0, fileCount);
    }
    return request<Inspection[]>('/inspections/batch', {
      method: 'POST',
      body: JSON.stringify({ boardType, fileCount }),
    });
  },

  // ── REAL BACKEND CONVEYOR & BOARD INTEGRATION ──────────────────────────────
  async getBoards(): Promise<any[]> {
    try {
      const res = await request<{ boards: any[]; total: number }>('/boards');
      return res.boards || [];
    } catch (e) {
      console.warn('[inspectionApi] Backend getBoards failed, falling back', e);
      return [
        { board_id: 'board_1', name: 'PCB Board #1', model: 'ESP32-WROOM-32D', image_count: 6, thumbnail_url: '' },
        { board_id: 'board_2', name: 'PCB Board #2', model: 'ESP32-WROOM-32D', image_count: 6, thumbnail_url: '' },
        { board_id: 'board_3', name: 'PCB Board #3', model: 'ESP32-WROOM-32D', image_count: 6, thumbnail_url: '' },
      ];
    }
  },

  async getBoard(boardId: string): Promise<any> {
    try {
      return await request<any>(`/boards/${boardId}`);
    } catch (e) {
      console.warn(`[inspectionApi] Backend getBoard(${boardId}) failed`, e);
      return null;
    }
  },

  async findSimilarBoards(boardId: string, topK = 5): Promise<any[]> {
    try {
      const res = await request<{ similar_boards: any[] }>('/similarity/search', {
        method: 'POST',
        body: JSON.stringify({ board_id: boardId, top_k: topK }),
      });
      return res.similar_boards || [];
    } catch (e) {
      console.warn('[inspectionApi] Similarity search failed', e);
      return [];
    }
  },

  async startInspection(boardId: string, topK = 5, datasetId?: string): Promise<any> {
    try {
      return await request<any>('/inspection/start', {
        method: 'POST',
        body: JSON.stringify({ board_id: boardId, top_k: topK, dataset_id: datasetId }),
      });
    } catch (e) {
      console.warn('[inspectionApi] startInspection failed', e);
      return null;
    }
  },

  async getInspectionStatus(inspectionId: string): Promise<any> {
    try {
      return await request<any>(`/inspection/${inspectionId}`);
    } catch (e) {
      console.warn(`[inspectionApi] getInspectionStatus(${inspectionId}) failed`, e);
      return null;
    }
  },

  async stepInspection(inspectionId: string): Promise<any> {
    try {
      return await request<any>(`/inspection/${inspectionId}/step`, {
        method: 'POST',
      });
    } catch (e) {
      console.warn(`[inspectionApi] stepInspection(${inspectionId}) failed`, e);
      return null;
    }
  },

  async runAllInspection(inspectionId: string): Promise<any> {
    try {
      return await request<any>(`/inspection/${inspectionId}/run_all`, {
        method: 'POST',
      });
    } catch (e) {
      console.warn(`[inspectionApi] runAllInspection(${inspectionId}) failed`, e);
      return null;
    }
  },

  async detectDefects(boardId: string, imageId?: string): Promise<any> {
    try {
      return await request<any>('/detect', {
        method: 'POST',
        body: JSON.stringify({ board_id: boardId, image_id: imageId }),
      });
    } catch (e) {
      console.warn('[inspectionApi] detectDefects failed', e);
      return null;
    }
  },

  async uploadBatchImages(formData: FormData, datasetId?: string): Promise<any> {
    try {
      const url = datasetId ? `/api/batch/upload?datasetId=${encodeURIComponent(datasetId)}` : '/api/batch/upload';
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      return await res.json();
    } catch (e) {
      console.warn('[inspectionApi] uploadBatchImages failed', e);
      throw e;
    }
  },

  async getBatchSamples(datasetId?: string): Promise<any> {
    try {
      const url = datasetId ? `/api/batch/samples?datasetId=${encodeURIComponent(datasetId)}` : '/api/batch/samples';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to load samples: ${res.statusText}`);
      }
      return await res.json();
    } catch (e) {
      console.warn('[inspectionApi] getBatchSamples failed', e);
      throw e;
    }
  }
};

