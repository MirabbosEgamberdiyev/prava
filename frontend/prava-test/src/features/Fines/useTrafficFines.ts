import { useCallback, useState } from "react";
import useSWR from "swr";
import { getCachedFines, loadFines, type FinesResult } from "../../services/finesService";

const SWR_KEY = "traffic-fines";

/** Data lives in the SWR memory cache; the service handles ETag revalidation and the offline snapshot. */
const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateOnMount: true,
  revalidateIfStale: true,
  dedupingInterval: 60 * 1000,
  shouldRetryOnError: false,
  keepPreviousData: true,
} as const;

function initialData(): FinesResult | undefined {
  const cached = getCachedFines();
  // Shown instantly while the mount revalidation runs; the "offline copy" chip only
  // appears once the network has actually failed.
  return cached ? { data: cached, stale: false, source: "memory", fromCache: false, savedAt: null } : undefined;
}

export function useTrafficFines() {
  const { data, error, isLoading, mutate } = useSWR<FinesResult>(SWR_KEY, () => loadFines(), {
    ...SWR_OPTIONS,
    fallbackData: initialData(),
  });
  const [refreshing, setRefreshing] = useState(false);

  /** Retry / Refresh / F5: skips the 5-minute freshness window. */
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await loadFines({ force: true });
      await mutate(fresh, { revalidate: false });
      return !fresh.fromCache;
    } catch {
      await mutate();
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [mutate]);

  return {
    data: data?.data ?? null,
    savedAt: data?.savedAt ?? null,
    fromCache: data?.fromCache ?? false,
    error: data ? null : error,
    isLoading: isLoading && !data,
    refreshing,
    refresh,
  };
}
