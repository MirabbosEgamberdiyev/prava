import api from "./api";

class TicketService {
  private baseUrl = "/api/v2/tickets";

  async getAll(params?: { page?: number; size?: number; sortBy?: string; direction?: string }) {
    const { page = 0, size = 20, sortBy = "ticketNumber", direction = "ASC" } = params || {};
    const res = await api.get(`${this.baseUrl}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
    return res.data;
  }

  async getById(ticketId: number) {
    const res = await api.get(`${this.baseUrl}/${ticketId}`);
    return res.data;
  }

  async getDetail(ticketId: number) {
    const res = await api.get(`${this.baseUrl}/${ticketId}/detail`);
    return res.data;
  }

  async getByPackage(packageId: number) {
    const res = await api.get(`${this.baseUrl}/package/${packageId}`);
    return res.data;
  }

  async getByTopic(topicId: number) {
    const res = await api.get(`${this.baseUrl}/topic/${topicId}`);
    return res.data;
  }

  async create(data: Record<string, unknown>) {
    const res = await api.post(this.baseUrl, data);
    return res.data;
  }

  async update(ticketId: number, data: Record<string, unknown>) {
    const res = await api.put(`${this.baseUrl}/${ticketId}`, data);
    return res.data;
  }

  async delete(ticketId: number) {
    const res = await api.delete(`${this.baseUrl}/${ticketId}`);
    return res.data;
  }

  async startVisible(data: Record<string, unknown>) {
    const res = await api.post(`${this.baseUrl}/start-visible`, data);
    return res.data;
  }

  async startSecure(data: Record<string, unknown>) {
    const res = await api.post(`${this.baseUrl}/start-secure`, data);
    return res.data;
  }
}

export const ticketService = new TicketService();
export default ticketService;
