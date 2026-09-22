import type {
  SimulatorMode,
  SimulatorSessionData,
  UserSimulatorStats,
} from "../types";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";

const SESSIONS_STORAGE_KEY = "prava_simulator_sessions_v1";

export function createInitialSession(
  mode: SimulatorMode,
  vehicleModel: string = "Chevrolet Cobalt"
): SimulatorSessionData {
  return {
    sessionId: "sim_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now(),
    mode,
    status: "RUNNING",
    currentExerciseNumber: 1,
    totalPenaltyPoints: 0,
    isPassed: false,
    timeSpentSeconds: 0,
    startedAt: new Date().toISOString(),
    vehicleModel,
    exerciseResults: {},
    penalties: [],
  };
}

export function saveSessionLocally(session: SimulatorSessionData): void {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    const sessions: Record<string, SimulatorSessionData> = raw ? JSON.parse(raw) : {};
    sessions[session.sessionId] = session;
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn("Failed to persist simulation session to localStorage", e);
  }
}

export function loadSessionLocally(sessionId: string): SimulatorSessionData | null {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return null;
    const sessions: Record<string, SimulatorSessionData> = JSON.parse(raw);
    return sessions[sessionId] || null;
  } catch (e) {
    return null;
  }
}

export function loadAllSessionsLocally(): SimulatorSessionData[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return [];
    const sessions: Record<string, SimulatorSessionData> = JSON.parse(raw);
    return Object.values(sessions).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  } catch (e) {
    return [];
  }
}

export function calculateAggregatedStats(
  sessions: SimulatorSessionData[]
): UserSimulatorStats {
  const total = sessions.length;
  const passed = sessions.filter((s) => s.isPassed).length;
  const failed = total - passed;
  const passRate = total > 0 ? (passed / total) * 100 : 0;

  const totalScore = sessions.reduce((acc, s) => acc + s.totalPenaltyPoints, 0);
  const averageScore = total > 0 ? totalScore / total : 0;
  const bestScore =
    total > 0 ? Math.min(...sessions.map((s) => s.totalPenaltyPoints)) : 0;

  const totalTime = sessions.reduce((acc, s) => acc + s.timeSpentSeconds, 0);
  const averageTime = total > 0 ? totalTime / total : 0;

  // Weak exercises counts
  const failCountsByEx: Record<number, number> = {};
  sessions.forEach((s) => {
    s.penalties.forEach((p) => {
      failCountsByEx[p.exerciseNumber] = (failCountsByEx[p.exerciseNumber] || 0) + 1;
    });
  });

  const weakExercises = Object.entries(failCountsByEx)
    .map(([exNumStr, count]) => {
      const exNum = parseInt(exNumStr, 10);
      const def = EXERCISE_REGISTRY.find((e) => e.number === exNum);
      return {
        exerciseNumber: exNum,
        exerciseCode: def ? def.code : `EXERCISE_${exNum}`,
        title: def
          ? def.title
          : { uzl: `${exNum}-mashq`, uzc: `${exNum}-машқ`, ru: `Упражнение ${exNum}` },
        failCount: count,
      };
    })
    .sort((a, b) => b.failCount - a.failCount);

  return {
    totalSessions: total,
    passedSessions: passed,
    failedSessions: failed,
    passRate: Math.round(passRate * 10) / 10,
    averageScore: Math.round(averageScore * 10) / 10,
    bestScore,
    averageTimeSeconds: Math.round(averageTime),
    weakExercises,
  };
}
