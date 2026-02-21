import api from "./api";

class TopicService {
  private baseUrl = "/api/v1/admin/topics";

  async getAll(params?: { page?: number; size?: number; sortBy?: string; direction?: string }) {
    const { page = 0, size = 20, sortBy = "displayOrder", direction = "ASC" } = params || {};
    const res = await api.get(`${this.baseUrl}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
    return res.data;
  }

  async getById(id: number) {
    const res = await api.get(`${this.baseUrl}/${id}`);
    return res.data;
  }

  async getByCode(code: string) {
    const res = await api.get(`${this.baseUrl}/code/${code}`);
    return res.data;
  }

  async getActive() {
    const res = await api.get(`${this.baseUrl}/active`);
    return res.data;
  }

  async getSimple() {
    const res = await api.get(`${this.baseUrl}/simple`);
    return res.data;
  }

  async getWithQuestions() {
    const res = await api.get(`${this.baseUrl}/with-questions`);
    return res.data;
  }

  async search(query: string) {
    const res = await api.get(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
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

  async delete(id: number) {
    const res = await api.delete(`${this.baseUrl}/${id}`);
    return res.data;
  }

  async toggleStatus(id: number) {
    const res = await api.patch(`${this.baseUrl}/${id}/toggle`);
    return res.data;
  }

  async bulkCreate(data: Record<string, unknown>[]) {
    const res = await api.post(`${this.baseUrl}/bulk`, data);
    return res.data;
  }
}

export const topicService = new TopicService();
export default topicService;
