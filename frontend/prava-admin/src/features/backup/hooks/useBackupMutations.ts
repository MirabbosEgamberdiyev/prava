import { notifications } from "@mantine/notifications";
import api from "../../../services/api";
import type {
  ClearOptions,
  ClearResult,
  StartExportRequest,
  StartImportRequest,
} from "../types";

export function useBackupMutations() {

  /** POST /export → jobId qaytaradi */
  const startExport = async (req: StartExportRequest): Promise<string> => {
    const params = new URLSearchParams();
    params.set("encrypt", String(req.encrypt));
    if (req.encrypt && req.password) params.set("password", req.password);

    const res = await api.post(`/api/v1/admin/backup/export?${params.toString()}`);
    return res.data.data.jobId as string;
  };

  /**
   * GET /export/{jobId}/download → ZIP blob sifatida yuklash.
   * Katta fayllar uchun timeout o'chirilgan (0 = cheksiz).
   */
  const downloadBackup = async (jobId: string, filename: string): Promise<void> => {
    const res = await api.get(`/api/v1/admin/backup/export/${jobId}/download`, {
      responseType: "blob",
      timeout: 0,
    });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  };

  /**
   * POST /import → jobId qaytaradi.
   * Selective import opsiyalari query param sifatida beriladi.
   * Timeout 5 daqiqa — katta fayllar uchun.
   */
  const startImport = async (req: StartImportRequest): Promise<string> => {
    const form = new FormData();
    form.append("file", req.file);

    const params = new URLSearchParams();
    params.set("forceReplace", String(req.forceReplace));
    if (req.password) params.set("password", req.password);

    // Selective import options
    const { options: o } = req;
    params.set("importUsers",             String(o.importUsers));
    params.set("importTopics",            String(o.importTopics));
    params.set("importQuestions",         String(o.importQuestions));
    params.set("importExamPackages",      String(o.importExamPackages));
    params.set("importExamSessions",      String(o.importExamSessions));
    params.set("importUserStatistics",    String(o.importUserStatistics));
    params.set("importPayments",          String(o.importPayments));
    params.set("importTokens",            String(o.importTokens));
    params.set("importUserPackageAccess", String(o.importUserPackageAccess));
    params.set("importMedia",             String(o.importMedia));

    const res = await api.post(
      `/api/v1/admin/backup/import?${params.toString()}`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000, // 5 daqiqa
      }
    );
    return res.data.data.jobId as string;
  };

  /** POST /clear → tozalash natijasini qaytaradi */
  const clearData = async (options: ClearOptions): Promise<ClearResult> => {
    const res = await api.post("/api/v1/admin/backup/clear", options);
    return res.data.data as ClearResult;
  };

  const handleError = (err: unknown, fallback: string): void => {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? fallback;
    notifications.show({ title: "Xato", message: msg, color: "red" });
  };

  return { startExport, downloadBackup, startImport, clearData, handleError };
}
