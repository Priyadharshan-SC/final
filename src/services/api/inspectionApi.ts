import { IS_MOCK_MODE, request } from './apiClient';
import { mockInspections } from '../mock/mockData';
import { Inspection, InspectionFilter, PaginatedInspections } from '../../types/inspection';

let liveInspections = [...mockInspections];

export const inspectionApi = {
  async getLatestInspections(limit = 5): Promise<Inspection[]> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 60));
      return liveInspections.slice(0, limit);
    }
    return request<Inspection[]>(`/inspections/latest?limit=${limit}`);
  },

  async getInspectionById(id: string): Promise<Inspection | undefined> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 80));
      return liveInspections.find(ins => ins.id === id || ins.boardId === id) || liveInspections[0];
    }
    return request<Inspection>(`/inspections/${id}`);
  },

  async queryHistory(filter: InspectionFilter): Promise<PaginatedInspections> {
    if (IS_MOCK_MODE) {
      await new Promise(r => setTimeout(r, 100));
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
        total: 1842, // As shown on Stitch mock
        page,
        limit,
        totalPages: Math.ceil(1842 / limit),
      };
    }

    const params = new URLSearchParams();
    if (filter.page) params.append('page', String(filter.page));
    if (filter.limit) params.append('limit', String(filter.limit));
    if (filter.status) params.append('status', filter.status);
    if (filter.boardType) params.append('boardType', filter.boardType);
    if (filter.defectType) params.append('defectType', filter.defectType);
    if (filter.search) params.append('search', filter.search);

    return request<PaginatedInspections>(`/inspections?${params.toString()}`);
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
  }
};
