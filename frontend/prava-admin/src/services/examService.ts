import api from "./api";

class ExamService {
  // ===== V1 Exams =====
  private v1Base = "/api/v1/exams";

  async startExam(data: Record<string, unknown>) {
    const res = await api.post(`${this.v1Base}/start`, data);
    return res.data;
  }

  async startMarathon(data: Record<string, unknown>) {
    const res = await api.post(`${this.v1Base}/marathon`, data);
    return res.data;
  }

  async submitExam(data: Record<string, unknown>) {
    const res = await api.post(`${this.v1Base}/submit`, data);
    return res.data;
  }

  async getResult(sessionId: string) {
    const res = await api.get(`${this.v1Base}/${sessionId}/result`);
    return res.data;
  }

  async getHistory(params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const res = await api.get(`${this.v1Base}/history?page=${page}&size=${size}`);
    return res.data;
  }

  async getHistoryByStatus(status: string, params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const res = await api.get(`${this.v1Base}/history/status/${status}?page=${page}&size=${size}`);
    return res.data;
  }

  async getHistorySummary() {
    const res = await api.get(`${this.v1Base}/history/summary`);
    return res.data;
  }

  async getActiveExam() {
    const res = await api.get(`${this.v1Base}/active`);
    return res.data;
  }

  async hasActiveExam() {
    const res = await api.get(`${this.v1Base}/has-active`);
    return res.data;
  }

  async abandonExam(sessionId: string) {
    const res = await api.delete(`${this.v1Base}/${sessionId}/abandon`);
    return res.data;
  }

  async getExamStatistics(sessionId: string) {
    const res = await api.get(`${this.v1Base}/${sessionId}/statistics`);
    return res.data;
  }

  // ===== V2 Exams =====
  private v2Base = "/api/v2/exams";

  async startVisible(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/start-visible`, data);
    return res.data;
  }

  async startSecure(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/start-secure`, data);
    return res.data;
  }

  async startMarathonVisible(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/marathon/start-visible`, data);
    return res.data;
  }

  async startMarathonSecure(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/marathon/start-secure`, data);
    return res.data;
  }

  async submitV2(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/submit`, data);
    return res.data;
  }

  async checkAnswer(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/check-answer`, data);
    return res.data;
  }

  async getResultV2(sessionId: string) {
    const res = await api.get(`${this.v2Base}/${sessionId}/result`);
    return res.data;
  }

  async getStatisticsV2(sessionId: string) {
    const res = await api.get(`${this.v2Base}/${sessionId}/statistics`);
    return res.data;
  }

  async getHistoryV2(params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const res = await api.get(`${this.v2Base}/history?page=${page}&size=${size}`);
    return res.data;
  }

  async getHistoryByStatusV2(status: string, params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const res = await api.get(`${this.v2Base}/history/status/${status}?page=${page}&size=${size}`);
    return res.data;
  }

  async abandonV2(sessionId: string) {
    const res = await api.delete(`${this.v2Base}/${sessionId}/abandon`);
    return res.data;
  }

  async autosave(sessionId: string, data: Record<string, unknown>) {
    const res = await api.put(`${this.v2Base}/${sessionId}/autosave`, data);
    return res.data;
  }

  async getActiveV2() {
    const res = await api.get(`${this.v2Base}/active`);
    return res.data;
  }

  async getPackageStatistics(packageId: number) {
    const res = await api.get(`${this.v2Base}/packages/${packageId}/statistics`);
    return res.data;
  }
}

export const examService = new ExamService();
export default examService;
