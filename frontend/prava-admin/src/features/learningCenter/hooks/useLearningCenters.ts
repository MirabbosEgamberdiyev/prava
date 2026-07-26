import useSWR from "swr";
import learningCenterService from "../../../services/learningCenterService";
import type {
  LearningCenterFilter,
  LearningCenterResponse,
  PageResponse,
} from "../types";

// ─── List hook ────────────────────────────────────────────────────────────────

export function useLearningCenterList(filter: LearningCenterFilter) {
  const key = ["learning-center-list", JSON.stringify(filter)];

  const { data, error, isLoading, mutate } = useSWR<PageResponse<LearningCenterResponse>>(
    key,
    () => learningCenterService.list(filter),
    {
      refreshInterval: 30_000,
      keepPreviousData: true,
    },
  );

  return {
    page: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

// ─── Stats hook ───────────────────────────────────────────────────────────────

/**
 * Yig'ma ko'rsatkichlar.
 *
 * Ilgari StatsCards joriy sahifadagi (15 ta) markazlardan hisoblanardi:
 * "Jami" 40 ta markaz bo'lsa ham 15 ko'rsatardi va qidiruv/filtr o'zgarganda
 * raqamlar sakrardi. Backendda alohida stats endpointi yo'q, shuning uchun
 * ko'rsatkichlar filtrdan mustaqil ravishda to'liq ro'yxatdan hisoblanadi.
 */
export function useLearningCenterStats() {
  const { data, error, isLoading, mutate } = useSWR<PageResponse<LearningCenterResponse>>(
    "learning-center-stats",
    () => learningCenterService.list({ page: 0, size: 500 }),
    { refreshInterval: 60_000 },
  );

  const all = data?.content ?? [];

  return {
    stats: {
      total:       data?.totalElements ?? all.length,
      active:      all.filter((c) => c.status === "ACTIVE").length,
      inactive:    all.filter((c) => c.status === "INACTIVE").length,
      totalCodes:  all.reduce((s, c) => s + (c.totalCodes    ?? 0), 0),
      activeCodes: all.reduce((s, c) => s + (c.activeCodes   ?? 0), 0),
      computers:   all.reduce((s, c) => s + (c.computerCount ?? 0), 0),
    },
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

// ─── Active (dropdown) hook ───────────────────────────────────────────────────

export function useLearningCentersActive() {
  const { data, error, isLoading, mutate } = useSWR<LearningCenterResponse[]>(
    "learning-centers-active",
    () => learningCenterService.listActive(),
    { refreshInterval: 60_000 },
  );

  return {
    centers: data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
