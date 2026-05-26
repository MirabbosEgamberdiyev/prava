import api from "./api";
import type {
  LearningCenterRequest,
  LearningCenterFilter,
  LearningCenterResponse,
  PageResponse,
} from "../features/learningCenter/types";

const BASE = "/api/v1/admin/learning-centers";

class LearningCenterService {
  /** Yangi o'quv markazi yaratish */
  async create(req: LearningCenterRequest): Promise<LearningCenterResponse> {
    const res = await api.post(BASE, req);
    return res.data.data as LearningCenterResponse;
  }

  /** O'quv markazini yangilash */
  async update(id: number, req: LearningCenterRequest): Promise<LearningCenterResponse> {
    const res = await api.put(`${BASE}/${id}`, req);
    return res.data.data as LearningCenterResponse;
  }

  /** Filtrlash va sahifalash bilan ro'yxat */
  async list(filter: LearningCenterFilter): Promise<PageResponse<LearningCenterResponse>> {
    const params: Record<string, string | number> = {
      page: filter.page ?? 0,
      size: filter.size ?? 20,
    };
    if (filter.search)  params.search  = filter.search;
    if (filter.status)  params.status  = filter.status;
    if (filter.sortBy)  params.sortBy  = filter.sortBy;
    if (filter.sortDir) params.sortDir = filter.sortDir;

    const res = await api.get(BASE, { params });
    return res.data.data as PageResponse<LearningCenterResponse>;
  }

  /** Bitta o'quv markazi */
  async getById(id: number): Promise<LearningCenterResponse> {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data as LearningCenterResponse;
  }

  /** Dropdown uchun barcha aktiv o'quv markazlari */
  async listActive(): Promise<LearningCenterResponse[]> {
    const res = await api.get(`${BASE}/active`);
    return res.data.data as LearningCenterResponse[];
  }

  /** Statusni o'zgartirish */
  async setStatus(id: number, status: "ACTIVE" | "INACTIVE"): Promise<LearningCenterResponse> {
    const res = await api.patch(`${BASE}/${id}/status`, { status });
    return res.data.data as LearningCenterResponse;
  }

  /** O'chirish */
  async delete(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }
}

export const learningCenterService = new LearningCenterService();
export default learningCenterService;
