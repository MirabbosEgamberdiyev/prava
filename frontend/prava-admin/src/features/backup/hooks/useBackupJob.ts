import useSWR from "swr";
import api from "../../../services/api";
import type { BackupJob } from "../types";

const POLL_INTERVAL = 2000; // 2s — active job paytida

export function useBackupJob(jobId: string | null, type: "export" | "import") {
  const url = jobId ? `/api/v1/admin/backup/${type}/${jobId}` : null;

  const { data, error, isLoading } = useSWR<{ data: BackupJob }>(
    url,
    async (u: string) => (await api.get(u)).data,
    {
      revalidateOnFocus: false,
      // Job tugaguncha har 2 sekundda yangilanadi
      refreshInterval: (latestData) => {
        const state = latestData?.data?.state;
        return state === "RUNNING" || state === "PENDING" ? POLL_INTERVAL : 0;
      },
    }
  );

  return {
    job:       data?.data ?? null,
    isLoading,
    isError:   !!error,
  };
}

export function useAllJobs() {
  const { data, error, isLoading, mutate } = useSWR<{ data: BackupJob[] }>(
    "/api/v1/admin/backup/jobs",
    async (u: string) => (await api.get(u)).data,
    { revalidateOnFocus: false, refreshInterval: 5000 }
  );

  return {
    jobs:      data?.data ?? [],
    isLoading,
    isError:   !!error,
    refresh:   mutate,
  };
}
