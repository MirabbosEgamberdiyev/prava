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
   * ⚡ Brauzer nativ download: 1 GB+ fayllar uchun fetch+blob() RAMni portlatadi.
   * Buning o'rniga `<a href="...?access_token=...">` orqali brauzerni o'zi yuklasin —
   * disk'ga to'g'ridan-to'g'ri yozadi, progress brauzer download manager'ida ko'rinadi,
   * uzilganda davom ettirish ham mumkin.
   *
   * Avval HEAD so'rovi bilan endpoint mavjud va ruxsat berilganligini tekshiramiz —
   * shu yo'l bilan 404/410 xatosi brauzer fayl yo'q deb ko'rinmaydi.
   */
  const downloadBackup = async (jobId: string, filename: string): Promise<void> => {
    const token = sessionStorage.getItem("accessToken");
    const baseURL = api.defaults.baseURL || "";
    const url = `${baseURL}/api/v1/admin/backup/export/${jobId}/download`;

    // 1) HEAD bilan oldindan tekshirish — file mavjudmi va token to'g'rimi
    try {
      const probe = await fetch(url, {
        method: "HEAD",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!probe.ok) {
        if (probe.status === 404 || probe.status === 410) {
          throw new Error(
            `Backup fayl serverda topilmadi (${probe.status}). ` +
            `Server qayta ishga tushgan yoki temp fayl 2 soatdan oshib o'chirilgan bo'lishi mumkin. ` +
            `Yangi backup yarating.`
          );
        }
        throw new Error(`HTTP ${probe.status}`);
      }
    } catch (e) {
      // HEAD ba'zi konfiguratsiyalarda 405 berishi mumkin — bunday holatda davom etamiz
      const msg = (e as Error)?.message || "";
      if (msg.startsWith("Backup fayl")) throw e;
      // boshqa xatolar — tinch o'tamiz, GET o'zi tekshiradi
    }

    // 2) Brauzer nativ download: <a href> + access_token query param
    //    Backend JwtAuthenticationFilter GET so'rovlarda ?access_token=... ni qabul qiladi
    const downloadUrl = token
      ? `${url}?access_token=${encodeURIComponent(token)}&filename=${encodeURIComponent(filename)}`
      : url;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
