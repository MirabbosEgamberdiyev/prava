import api from "./api";
import type {
  ComputerRequest,
  ComputerFilter,
  ComputerResponse,
  PageResponse,
} from "../features/computer/types";

const BASE = "/api/v1/admin/computers";

class ComputerService {
  async create(req: ComputerRequest): Promise<ComputerResponse> {
    const res = await api.post(BASE, req);
    return res.data.data as ComputerResponse;
  }

  async update(id: number, req: ComputerRequest): Promise<ComputerResponse> {
    const res = await api.put(`${BASE}/${id}`, req);
    return res.data.data as ComputerResponse;
  }

  async list(filter: ComputerFilter): Promise<PageResponse<ComputerResponse>> {
    const params: Record<string, string | number> = {
      page: filter.page ?? 0,
      size: filter.size ?? 20,
    };
    if (filter.search)  params.search           = filter.search;
    if (filter.lcId)    params.learningCenterId = filter.lcId;
    if (filter.status)  params.status           = filter.status;
    if (filter.sortBy)  params.sortBy  = filter.sortBy;
    if (filter.sortDir) params.sortDir = filter.sortDir;
    const res = await api.get(BASE, { params });
    return res.data.data as PageResponse<ComputerResponse>;
  }

  async getById(id: number): Promise<ComputerResponse> {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data as ComputerResponse;
  }

  async listAllActive(): Promise<ComputerResponse[]> {
    const res = await api.get(`${BASE}/active`);
    return res.data.data as ComputerResponse[];
  }

  async listActiveByLC(lcId: number): Promise<ComputerResponse[]> {
    const res = await api.get(`${BASE}/active/by-lc/${lcId}`);
    return res.data.data as ComputerResponse[];
  }

  async setStatus(id: number, status: string): Promise<ComputerResponse> {
    const res = await api.patch(`${BASE}/${id}/status`, { status });
    return res.data.data as ComputerResponse;
  }

  async deleteComputer(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  }
}

export const computerService = new ComputerService();
export default computerService;
