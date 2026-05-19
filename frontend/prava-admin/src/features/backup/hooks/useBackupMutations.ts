import { notifications } from "@mantine/notifications";
import api from "../../../services/api";
import type { StartExportRequest, StartImportRequest } from "../types";

export function useBackupMutations() {
  /** POST /export → jobId qaytaradi */
  const startExport = async (req: StartExportRequest): Promise<string> => {
    const params = new URLSearchParams();
    params.set("encrypt", String(req.encrypt));
    if (req.encrypt && req.password) params.set("password", req.password);

    const res = await api.post(`/api/v1/admin/backup/export?${params.toString()}`);
    return res.data.data.jobId as string;
  };

  /** GET /export/{jobId}/download → ZIP blob sifatida yuklash */
  const downloadBackup = async (jobId: string, filename: string) => {
    const res = await api.get(`/api/v1/admin/backup/export/${jobId}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement("a");
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  /** POST /import → jobId qaytaradi */
  const startImport = async (req: StartImportRequest): Promise<string> => {
    const form = new FormData();
    form.append("file", req.file);

    const params = new URLSearchParams();
    params.set("forceReplace", String(req.forceReplace));
    if (req.password) params.set("password", req.password);

    const res = await api.post(
      `/api/v1/admin/backup/import?${params.toString()}`,
      form,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 300_000 }
    );
    return res.data.data.jobId as string;
  };

  const handleError = (err: unknown, fallback: string) => {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ?? fallback;
    notifications.show({ title: "Xato", message: msg, color: "red" });
  };

  return { startExport, downloadBackup, startImport, handleError };
}
