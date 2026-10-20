import api from "../../api/api";
import type { UserStats, LeaderboardUser, OctagonQuestion } from "./types";

export interface TicketResponseData {
  ticket: string;
  expiresInSeconds: number;
  /** Mehmon uchun server bergan imzolangan token (saqlab qo'yiladi). */
  guestId?: string | null;
  /** Ochiq o'yinchi ID'si (winnerId bilan solishtirish uchun). */
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
  async getTicket(guestToken?: string, displayName?: string): Promise<TicketResponseData> {
    const params = new URLSearchParams();
    if (guestToken) params.append("guestId", guestToken);
    if (displayName) params.append("displayName", displayName);

    const res = await api.post(`/api/v1/octagon/ticket?${params.toString()}`);
    const data = res.data?.data || {};
    return {
      ticket: data.ticket || "",
      expiresInSeconds: data.expiresInSeconds || 0,
      guestId: data.guestId,
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

  async getHistory(page = 0, size = 10, userId?: string) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (userId) params.append("userId", userId);
    const res = await api.get(`/api/v1/octagon/history?${params.toString()}`);
    return res.data?.data || { content: [] };
  },

  async createChallenge(targetUserId?: string, guestId?: string): Promise<ChallengeResponseData | null> {
    const params = new URLSearchParams();
    if (targetUserId) params.append("targetUserId", targetUserId);
    if (guestId) params.append("guestId", guestId);
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
  async getMatchHistory(page = 0, size = 10): Promise<{ content: any[]; totalPages: number }> {
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
  async reportMatch(
    request: { matchId?: string; reportedUserId: string; reason: string; comment?: string },
    guestToken?: string
  ): Promise<void> {
    const q = guestToken ? `?reporterId=${encodeURIComponent(guestToken)}` : "";
    await api.post(`/api/v1/octagon/report${q}`, request);
  },
};

