import useSWR from "swr";
import licenseService from "../../../services/licenseService";
import type {
  ActivationCodeFilter,
  ActivationCodeResponse,
  ActivationCodeStatsResponse,
  PageResponse,
} from "../types";

// ─── Stats hook ───────────────────────────────────────────────────────────────

export function useLicenseStats() {
  const { data, error, isLoading, mutate } = useSWR<ActivationCodeStatsResponse>(
    "license-stats",
    () => licenseService.stats(),
    { refreshInterval: 60_000 },
  );

  return {
    stats: data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

// ─── List hook ────────────────────────────────────────────────────────────────

export function useLicenseList(filter: ActivationCodeFilter) {
  const key = ["license-list", JSON.stringify(filter)];

  const { data, error, isLoading, mutate } = useSWR<PageResponse<ActivationCodeResponse>>(
    key,
    () => licenseService.list(filter),
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
