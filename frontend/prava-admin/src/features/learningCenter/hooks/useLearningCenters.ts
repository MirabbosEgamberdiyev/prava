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
