import api from "../../../api/api";
import type {
  SimulatorMode,
  SimulatorSessionData,
  UserSimulatorStats,
  ExerciseAttemptResult,
} from "../types";
import {
  createInitialSession,
  saveSessionLocally,
  loadSessionLocally,
  loadAllSessionsLocally,
  calculateAggregatedStats,
} from "../engine/sessionManager";

export const simulatorApi = {
  async startSession(mode: SimulatorMode, vehicleModel: string = "Chevrolet Cobalt"): Promise<SimulatorSessionData> {
    try {
      const response = await api.post("/api/v1/simulator/sessions", {
        mode: mode.toUpperCase(),
        vehicleModel,
      });
      if (response?.data?.data) {
        const d = response.data.data;
        const session: SimulatorSessionData = {
          sessionId: String(d.id),
          mode,
          status: "RUNNING",
          currentExerciseNumber: 1,
          totalPenaltyPoints: d.totalPenaltyPoints || 0,
          isPassed: d.isPassed || false,
          timeSpentSeconds: 0,
          startedAt: d.startedAt || new Date().toISOString(),
          vehicleModel,
          exerciseResults: {},
          penalties: [],
        };
        saveSessionLocally(session);
        return session;
      }
    } catch (e) {
      console.info("Using local session engine fallback");
    }

    // Local fallback
    const local = createInitialSession(mode, vehicleModel);
    saveSessionLocally(local);
    return local;
  },

  async recordPenaltyEvent(
    sessionId: string,
    exerciseNumber: number,
    ruleCode: string,
    points: number,
    posX: number,
    posY: number,
    occurredAtSeconds: number
  ): Promise<void> {
    try {
      await api.post(`/api/v1/simulator/sessions/${sessionId}/events`, {
        exerciseNumber,
        ruleCode,
        points,
        posX,
        posY,
        occurredAtSeconds,
      });
    } catch (e) {
      // offline silent fallback
    }
  },

  async finishSession(
    sessionId: string,
    totalPenaltyPoints: number,
    timeSpentSeconds: number,
    isPassed: boolean,
    exerciseResults: ExerciseAttemptResult[]
  ): Promise<SimulatorSessionData> {
    try {
      const res = await api.post(`/api/v1/simulator/sessions/${sessionId}/finish`, {
        totalPenaltyPoints,
        timeSpentSeconds,
        isPassed,
        exerciseResults: exerciseResults.map((r) => ({
          exerciseNumber: r.exerciseNumber,
          isPassed: r.isPassed,
          penaltyPoints: r.penaltyPoints,
          timeSpentSeconds: r.timeSpentSeconds,
        })),
      });
      if (res?.data?.data) {
        // update local
        const local = loadSessionLocally(sessionId);
        if (local) {
          local.isPassed = isPassed;
          local.totalPenaltyPoints = totalPenaltyPoints;
          local.timeSpentSeconds = timeSpentSeconds;
          local.status = isPassed ? "COMPLETED" : "FAILED";
          local.finishedAt = new Date().toISOString();
          saveSessionLocally(local);
          return local;
        }
      }
    } catch (e) {
      console.info("Using local finish session fallback");
    }

    const local = loadSessionLocally(sessionId);
    if (local) {
      local.isPassed = isPassed;
      local.totalPenaltyPoints = totalPenaltyPoints;
      local.timeSpentSeconds = timeSpentSeconds;
      local.status = isPassed ? "COMPLETED" : "FAILED";
      local.finishedAt = new Date().toISOString();
      saveSessionLocally(local);
      return local;
    }

    return createInitialSession("exam");
  },

  async getUserStats(): Promise<UserSimulatorStats> {
    try {
      const res = await api.get("/api/v1/simulator/statistics");
      if (res?.data?.data) {
        const d = res.data.data;
        return {
          totalSessions: d.totalSessions || 0,
          passedSessions: d.passedSessions || 0,
          failedSessions: d.failedSessions || 0,
          passRate: d.passRate || 0,
          averageScore: d.averageScore || 0,
          bestScore: d.bestScore || 0,
          averageTimeSeconds: d.averageTimeSeconds || 0,
          weakExercises: d.weakExercises || [],
        };
      }
    } catch (e) {
      // fallback to local stats
    }

    const sessions = loadAllSessionsLocally();
    return calculateAggregatedStats(sessions);
  },
};
