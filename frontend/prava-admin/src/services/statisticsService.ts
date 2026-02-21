import api from "./api";

class StatisticsService {
  // ===== V2 Admin Statistics =====
  private v2Base = "/api/v2/admin/statistics";

  async filter(data: Record<string, unknown>) {
    const res = await api.post(`${this.v2Base}/filter`, data);
    return res.data;
  }

  async getToday() {
    const res = await api.get(`${this.v2Base}/today`);
    return res.data;
  }

  async getThisWeek() {
    const res = await api.get(`${this.v2Base}/this-week`);
    return res.data;
  }

  async getThisMonth() {
    const res = await api.get(`${this.v2Base}/this-month`);
    return res.data;
  }

  async getMarathon() {
    const res = await api.get(`${this.v2Base}/marathon`);
    return res.data;
  }

  async getUserStats(userId: number) {
    const res = await api.get(`${this.v2Base}/user/${userId}`);
    return res.data;
  }

  async getUserPackageStats(userId: number, packageId: number) {
    const res = await api.get(`${this.v2Base}/user/${userId}/package/${packageId}`);
    return res.data;
  }

  async getUserTicketStats(userId: number, ticketId: number) {
    const res = await api.get(`${this.v2Base}/user/${userId}/ticket/${ticketId}`);
    return res.data;
  }

  async getUserTopicStats(userId: number, topicId: number) {
    const res = await api.get(`${this.v2Base}/user/${userId}/topic/${topicId}`);
    return res.data;
  }

  async getUserMarathonStats(userId: number) {
    const res = await api.get(`${this.v2Base}/user/${userId}/marathon`);
    return res.data;
  }

  async getPackageStats(packageId: number) {
    const res = await api.get(`${this.v2Base}/package/${packageId}`);
    return res.data;
  }

  async getTicketStats(ticketId: number) {
    const res = await api.get(`${this.v2Base}/ticket/${ticketId}`);
    return res.data;
  }

  async getTopicStats(topicId: number) {
    const res = await api.get(`${this.v2Base}/topic/${topicId}`);
    return res.data;
  }

  // Device limit
  async setDeviceLimit(userId: number, maxDevices: number) {
    const res = await api.post(`${this.v2Base}/device-limit`, { userId, maxDevices });
    return res.data;
  }

  async getDeviceLimit(userId: number) {
    const res = await api.get(`${this.v2Base}/device-limit/${userId}`);
    return res.data;
  }

  async resetDeviceSessions(userId: number) {
    const res = await api.post(`${this.v2Base}/device-limit/${userId}/reset`);
    return res.data;
  }

  async setGlobalDeviceLimit(maxDevices: number) {
    const res = await api.post(`${this.v2Base}/device-limit/global?maxDevices=${maxDevices}`);
    return res.data;
  }

  async resetToGlobalLimit(userId: number, globalLimit: number) {
    const res = await api.post(`${this.v2Base}/device-limit/${userId}/reset-to-global?globalLimit=${globalLimit}`);
    return res.data;
  }

  // ===== V1 Statistics =====
  private v1Base = "/api/v1/statistics";

  async getDashboard() {
    const res = await api.get(`${this.v1Base}/dashboard`);
    return res.data;
  }

  async getTopicStatsV1() {
    const res = await api.get(`${this.v1Base}/topics`);
    return res.data;
  }

  async getUserStatsV1(userId: number) {
    const res = await api.get(`${this.v1Base}/user/${userId}`);
    return res.data;
  }

  async getRecentExams(page = 0, size = 10) {
    const res = await api.get(`${this.v1Base}/exams/recent?page=${page}&size=${size}`);
    return res.data;
  }

  async getLeaderboardByTopic(topic: string) {
    const res = await api.get(`${this.v1Base}/leaderboard/${topic}`);
    return res.data;
  }

  async getGlobalLeaderboard() {
    const res = await api.get(`${this.v1Base}/leaderboard/global`);
    return res.data;
  }

  // V1 "me" endpoints (current user)
  async getMyStats() {
    const res = await api.get(`${this.v1Base}/me`);
    return res.data;
  }

  async getMyTopicStats(topic: string) {
    const res = await api.get(`${this.v1Base}/me/topic/${topic}`);
    return res.data;
  }

  async getMyDashboard() {
    const res = await api.get(`${this.v1Base}/me/dashboard`);
    return res.data;
  }

  async getMyExams(page = 0, size = 10) {
    const res = await api.get(`${this.v1Base}/me/exams?page=${page}&size=${size}`);
    return res.data;
  }

  async getMyExamsByTopic(topic: string, page = 0, size = 10) {
    const res = await api.get(`${this.v1Base}/me/exams/topic/${topic}?page=${page}&size=${size}`);
    return res.data;
  }
}

export const statisticsService = new StatisticsService();
export default statisticsService;
