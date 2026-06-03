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
   * GET /export/{jobId}/download → ZIP fayl sifatida yuklash.
   *
   * Axios + blob aralashganda xato javoblar yashirinib qoladi (JSON blob ichida tushib qoladi).
   * Shuning uchun fetch() ishlatamiz va response status'ini aniq tekshiramiz.
   * Katta fayllar uchun timeout yo'q.
   */
  const downloadBackup = async (jobId: string, filename: string): Promise<void> => {
    const token = sessionStorage.getItem("accessToken");
    const baseURL = api.defaults.baseURL || "";
    const url = `${baseURL}/api/v1/admin/backup/export/${jobId}/download`;

    const res = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!res.ok) {
      // Xato javob — bo'sh ZIP tushirmasdan, tushunarli message bilan throw qilamiz
      let message = `HTTP ${res.status}`;
      const ct = res.headers.get("content-type") || "";
      try {
        if (ct.includes("application/json")) {
          const json = await res.json();
          message = json?.message || json?.error || message;
        } else {
          const text = await res.text();
          if (text) message = text.slice(0, 200);
        }
      } catch { /* parse fail — message qoldi */ }

      if (res.status === 404 || res.status === 410) {
        throw new Error(
          `Backup fayl serverda topilmadi (${res.status}). ` +
          `Server qayta ishga tushgan yoki temp fayl 2 soatdan oshib o'chirilgan bo'lishi mumkin. ` +
          `Yangi backup yarating.`
        );
      }
      throw new Error(message);
    }

    // ⚡ Stream blob: katta fayllar uchun xotirani egallamaslik
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Brauzer downloadni boshlashga ulgursin, keyin URL'ni bo'shatamiz
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
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
        timeout: 1_800_000, // 30 daqiqa — 1000 MB fayl sekin tarmoqda ham yuklana olsin
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
