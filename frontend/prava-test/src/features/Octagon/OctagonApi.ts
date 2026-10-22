import api from "../../api/api";
import type { UserStats, LeaderboardUser, OctagonQuestion, MatchHistoryEntry } from "./types";

export interface TicketResponseData {
  ticket: string;
  expiresInSeconds: number;
  /** O'yinchi ID'si (winnerId bilan solishtirish uchun). */
  userId?: string;
}

export interface ChallengeResponseData {
  challengeId: string;
  inviteCode: string;
  inviteUrl: string;
  challengerId: string;
  challengerName: string;
  expiresAt: string;
}

export const OctagonApi = {
  /** Faqat tizimga kirgan foydalanuvchi (mehmonga server 401 qaytaradi). */
  async getTicket(): Promise<TicketResponseData> {
    const res = await api.post("/api/v1/octagon/ticket");
    const data = res.data?.data || {};
    return {
      ticket: data.ticket || "",
      expiresInSeconds: data.expiresInSeconds || 0,
      userId: data.userId,
    };
  },

  async getStats(userId?: string): Promise<UserStats | null> {
    const params = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const res = await api.get(`/api/v1/octagon/stats${params}`);
    return res.data?.data || null;
  },

  async getLeaderboard(period: "weekly" | "monthly" | "all_time" = "all_time"): Promise<LeaderboardUser[]> {
    const res = await api.get(`/api/v1/octagon/leaderboard?period=${period}`);
    return res.data?.data || [];
  },

  /** Mening o'rnim (jadval ostida alohida); davrda o'ynamagan bo'lsam — null. Faqat tizimga kirganda. */
  async getMyLeaderboardPosition(period: "weekly" | "monthly" | "all_time" = "all_time"): Promise<LeaderboardUser | null> {
    const res = await api.get(`/api/v1/octagon/leaderboard/me?period=${period}`);
    return res.data?.data || null;
  },

  /** result: WIN / LOSS / DRAW — filtr serverda (sahifalash to'g'ri ishlaydi); ALL yoki bo'sh — barchasi. */
  async getHistory(page = 0, size = 10, result?: "ALL" | "WIN" | "LOSS" | "DRAW") {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (result && result !== "ALL") params.append("result", result);
    const res = await api.get(`/api/v1/octagon/history?${params.toString()}`);
    return res.data?.data || { content: [] };
  },

  async createChallenge(targetUserId?: string): Promise<ChallengeResponseData | null> {
    const params = new URLSearchParams();
    if (targetUserId) params.append("targetUserId", targetUserId);
    const res = await api.post(`/api/v1/octagon/challenge/create?${params.toString()}`);
    return res.data?.data || null;
  },

  async getChallenge(code: string): Promise<ChallengeResponseData | null> {
    const res = await api.get(`/api/v1/octagon/challenge/${encodeURIComponent(code)}`);
    return res.data?.data || null;
  },

  async getQuestions(questionIds: number[]): Promise<OctagonQuestion[]> {
    const res = await api.post("/api/v1/octagon/questions", questionIds);
    return res.data?.data || [];
  },

  async searchUsers(query: string) {
    const res = await api.get(`/api/v1/octagon/users/search?q=${encodeURIComponent(query)}`);
    return res.data?.data || [];
  },

  async getRoom(code: string) {
    const res = await api.get(`/api/v1/octagon/room/${encodeURIComponent(code)}`);
    return res.data?.data || null;
  },

  /**
   * Retrieves match history for user
   */
  async getMatchHistory(page = 0, size = 10): Promise<{ content: MatchHistoryEntry[]; totalPages: number }> {
    const res = await api.get(`/api/v1/octagon/history?page=${page}&size=${size}`);
    const data = res.data?.data || {};
    return {
      content: data.content || (Array.isArray(data) ? data : []),
      totalPages: data.totalPages || 1,
    };
  },

  /**
   * Submit abuse report or complaint against an opponent
   */
  async reportMatch(request: { matchId?: string; reportedUserId: string; reason: string; comment?: string }): Promise<void> {
    await api.post("/api/v1/octagon/report", request);
  },
};

