import api from "./api";

class SystemService {
  private baseUrl = "/api/v1/admin/system";

  async getInfo() {
    const res = await api.get(`${this.baseUrl}/info`);
    return res.data;
  }

  async getHealth() {
    const res = await api.get(`${this.baseUrl}/health`);
    return res.data;
  }

  async getLogs(lines?: number, fromLine?: number) {
    const params = new URLSearchParams();
    if (lines) params.append("lines", lines.toString());
    if (fromLine) params.append("fromLine", fromLine.toString());
    const query = params.toString();
    const res = await api.get(`${this.baseUrl}/logs${query ? `?${query}` : ""}`);
    return res.data;
  }

  async searchLogs(pattern: string, maxResults?: number) {
    const params = new URLSearchParams({ pattern });
    if (maxResults) params.append("maxResults", maxResults.toString());
    const res = await api.get(`${this.baseUrl}/logs/search?${params}`);
    return res.data;
  }

  async clearLogs() {
    const res = await api.delete(`${this.baseUrl}/logs`);
    return res.data;
  }

  async downloadLogs() {
    const res = await api.get(`${this.baseUrl}/logs/download`, { responseType: "blob" });
    return res.data;
  }

  async triggerGC() {
    const res = await api.post(`${this.baseUrl}/gc`);
    return res.data;
  }

  async getBackup() {
    const res = await api.get(`${this.baseUrl}/backup`);
    return res.data;
  }

  async downloadBackup() {
    const res = await api.get(`${this.baseUrl}/backup/download`, { responseType: "blob" });
    return res.data;
  }
}

export const systemService = new SystemService();
export default systemService;
