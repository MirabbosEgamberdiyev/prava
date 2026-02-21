import api from "./api";

class DashboardService {
  private baseUrl = "/api/v1/admin/dashboard";

  async getStats() {
    const res = await api.get(`${this.baseUrl}/stats`);
    return res.data;
  }

  async getTopics() {
    const res = await api.get(`${this.baseUrl}/topics`);
    return res.data;
  }

  async getRecentExams(page = 0, size = 10) {
    const res = await api.get(`${this.baseUrl}/recent-exams?page=${page}&size=${size}`);
    return res.data;
  }

  async getUserExams(userId: number, page = 0, size = 10) {
    const res = await api.get(`${this.baseUrl}/user/${userId}/exams?page=${page}&size=${size}`);
    return res.data;
  }

  async getUserStatistics(userId: number) {
    const res = await api.get(`${this.baseUrl}/user/${userId}/statistics`);
    return res.data;
  }

  async getActiveExamsCount() {
    const res = await api.get(`${this.baseUrl}/active-exams-count`);
    return res.data;
  }

  async getCompletedExamsCount() {
    const res = await api.get(`${this.baseUrl}/completed-exams-count`);
    return res.data;
  }

  async getTodayExamsCount() {
    const res = await api.get(`${this.baseUrl}/today-exams-count`);
    return res.data;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
