import api from "./api";

class PackageService {
  private baseUrl = "/api/v1/packages";

  async getAll(params?: { page?: number; size?: number; sortBy?: string; direction?: string }) {
    const { page = 0, size = 20, sortBy = "orderIndex", direction = "ASC" } = params || {};
    const res = await api.get(`${this.baseUrl}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
    return res.data;
  }

  async getAdmin(params?: { page?: number; size?: number; sortBy?: string; direction?: string }) {
    const { page = 0, size = 20, sortBy = "orderIndex", direction = "ASC" } = params || {};
    const res = await api.get(`${this.baseUrl}/admin?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
    return res.data;
  }

  async getFree() {
    const res = await api.get(`${this.baseUrl}/free`);
    return res.data;
  }

  async getById(id: number) {
    const res = await api.get(`${this.baseUrl}/${id}`);
    return res.data;
  }

  async getDetail(id: number) {
    const res = await api.get(`${this.baseUrl}/${id}/detail`);
    return res.data;
  }

  async getByTopicCode(topicCode: string) {
    const res = await api.get(`${this.baseUrl}/topic/${topicCode}`);
    return res.data;
  }

  async getCount() {
    const res = await api.get(`${this.baseUrl}/count`);
    return res.data;
  }

  async create(data: Record<string, unknown>) {
    const res = await api.post(this.baseUrl, data);
    return res.data;
  }

  async update(id: number, data: Record<string, unknown>) {
    const res = await api.put(`${this.baseUrl}/${id}`, data);
    return res.data;
  }

  async patch(id: number, data: Record<string, unknown>) {
    const res = await api.patch(`${this.baseUrl}/${id}`, data);
    return res.data;
  }

  async delete(id: number) {
    const res = await api.delete(`${this.baseUrl}/${id}`);
    return res.data;
  }

  async toggleStatus(id: number) {
    const res = await api.patch(`${this.baseUrl}/${id}/toggle`);
    return res.data;
  }

  async regenerateQuestions(id: number) {
    const res = await api.post(`${this.baseUrl}/${id}/regenerate`);
    return res.data;
  }
}

export const packageService = new PackageService();
export default packageService;
