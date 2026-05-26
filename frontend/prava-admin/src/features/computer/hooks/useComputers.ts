import useSWR from "swr";
import computerService from "../../../services/computerService";
import type { ComputerFilter, ComputerResponse, PageResponse } from "../types";

// ─── Paginated list ───────────────────────────────────────────────────────────

export function useComputerList(filter: ComputerFilter) {
  const key = ["computer-list", JSON.stringify(filter)];
  const { data, error, isLoading, mutate } = useSWR<PageResponse<ComputerResponse>>(
    key,
    () => computerService.list(filter),
    { refreshInterval: 30_000, keepPreviousData: true },
  );
  return { page: data, isLoading, isError: !!error, refresh: mutate };
}

// ─── All active computers (dropdown — all LCs) ───────────────────────────────

export function useComputersAllActive() {
  const { data, error, isLoading, mutate } = useSWR<ComputerResponse[]>(
    "computers-all-active",
    () => computerService.listAllActive(),
    { refreshInterval: 60_000 },
  );
  return { computers: data ?? [], isLoading, isError: !!error, refresh: mutate };
}

// ─── Active computers for one LC (dropdown) ───────────────────────────────────

export function useComputersByLC(lcId: number | null) {
  const { data, error, isLoading, mutate } = useSWR<ComputerResponse[]>(
    lcId ? ["computers-by-lc", lcId] : null,
    () => computerService.listActiveByLC(lcId!),
    { refreshInterval: 60_000 },
  );
  return { computers: data ?? [], isLoading, isError: !!error, refresh: mutate };
}
