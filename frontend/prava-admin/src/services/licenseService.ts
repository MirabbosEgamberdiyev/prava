import api from "./api";
import type {
  ActivationCodeRequest,
  ActivationCodeFilter,
  ActivationCodeResponse,
  ActivationCodeStatsResponse,
  PageResponse,
} from "../features/license/types";

const BASE = "/api/v1/admin/activation-codes";

class LicenseService {
  /** Yangi aktivatsiya kodi yaratish */
  async generate(req: ActivationCodeRequest): Promise<ActivationCodeResponse> {
    const res = await api.post(BASE, req);
    return res.data.data as ActivationCodeResponse;
  }

  /** Filtrlash va sahifalash bilan kodlar ro'yxati */
  async list(filter: ActivationCodeFilter): Promise<PageResponse<ActivationCodeResponse>> {
    const params: Record<string, string | number | boolean> = {
      page: filter.page ?? 0,
      size: filter.size ?? 20,
    };
    if (filter.search)           params.search           = filter.search;
    if (filter.status)           params.status           = filter.status;
    if (filter.group)            params.group            = filter.group;
    if (filter.computerId)       params.computerId       = filter.computerId;
    if (filter.learningCenterId) params.learningCenterId = filter.learningCenterId;
    if (filter.sort)             params.sortBy           = filter.sort;
    if (filter.dir)              params.sortDir          = filter.dir;

    const res = await api.get(BASE, { params });
    return res.data.data as PageResponse<ActivationCodeResponse>;
  }

  /** Statistikalar */
  async stats(): Promise<ActivationCodeStatsResponse> {
    const res = await api.get(`${BASE}/stats`);
    return res.data.data as ActivationCodeStatsResponse;
  }

  /** Bitta kod */
  async getById(id: number): Promise<ActivationCodeResponse> {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data as ActivationCodeResponse;
  }

  /** Deaktivatsiya */
  async deactivate(id: number, notes?: string): Promise<ActivationCodeResponse> {
    const res = await api.patch(`${BASE}/${id}/deactivate`, { reason: notes });
    return res.data.data as ActivationCodeResponse;
  }

  /** Qayta faollashtirish (faqat DEACTIVATED, muddati o'tmagan) */
  async reactivate(id: number): Promise<ActivationCodeResponse> {
    const res = await api.patch(`${BASE}/${id}/reactivate`);
    return res.data.data as ActivationCodeResponse;
  }

  /** O'chirish (faqat DEACTIVATED yoki EXPIRED) */
  async deleteCode(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }
}

export const licenseService = new LicenseService();
export default licenseService;
