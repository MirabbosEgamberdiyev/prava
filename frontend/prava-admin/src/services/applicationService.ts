import api from "./api";
import type {
  AppReleaseRequest,
  AppReleaseResponse,
  AppReleaseFilter,
  AppReleaseStatus,
  PageResponse,
} from "../features/applications/types";

const BASE = "/api/v1/admin/app-releases";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createRelease = (data: AppReleaseRequest) =>
  api.post<{ data: AppReleaseResponse }>(BASE, data).then((r) => r.data.data);

export const updateRelease = (id: number, data: AppReleaseRequest) =>
  api.put<{ data: AppReleaseResponse }>(`${BASE}/${id}`, data).then((r) => r.data.data);

export const getRelease = (id: number) =>
  api.get<{ data: AppReleaseResponse }>(`${BASE}/${id}`).then((r) => r.data.data);

export const deleteRelease = (id: number) =>
  api.delete(`${BASE}/${id}`);

// ─── List (paginated + filtered) ──────────────────────────────────────────────

export const listReleases = (filter: AppReleaseFilter = {}) => {
  const params: Record<string, string | number | undefined> = {
    page:    filter.page    ?? 0,
    size:    filter.size    ?? 20,
    sortBy:  filter.sortBy  ?? "releaseDate",
    sortDir: filter.sortDir ?? "desc",
  };
  if (filter.platform) params.platform = filter.platform;
  if (filter.appType)  params.appType  = filter.appType;
  if (filter.status)   params.status   = filter.status;
  if (filter.appName  && filter.appName.trim())   params.appName  = filter.appName.trim();
  if (filter.version  && filter.version.trim())   params.version  = filter.version.trim();

  return api
    .get<{ data: PageResponse<AppReleaseResponse> }>(BASE, { params })
    .then((r) => r.data.data);
};

// ─── Status & Latest ──────────────────────────────────────────────────────────

export const setReleaseStatus = (id: number, status: AppReleaseStatus) =>
  api
    .patch<{ data: AppReleaseResponse }>(`${BASE}/${id}/status`, { status })
    .then((r) => r.data.data);

export const setReleaseLatest = (id: number) =>
  api
    .patch<{ data: AppReleaseResponse }>(`${BASE}/${id}/set-latest`)
    .then((r) => r.data.data);

// ─── File Upload (LEGACY: single-shot) ────────────────────────────────────────
const UPLOAD_TIMEOUT_MS = 30 * 60 * 1000; // 30 daqiqa

export const uploadInstallerFile = (
  id: number,
  file: File,
  onProgress?: (pct: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  return api
    .post<{ data: AppReleaseResponse }>(`${BASE}/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: UPLOAD_TIMEOUT_MS,
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    })
    .then((r) => r.data.data);
};

// ─── Chunked Upload (KATTA fayllar uchun: 100MB+) ─────────────────────────────
// Tavsiya: ushbu funksiyadan foydalaning. Fayl 5MB bo'laklarga bo'linadi va
// sequential yuboriladi. Bitta chunk uchun 60s timeout — tarmoq sekin bo'lsa ham
// retry qilinadi. Progressi: 0-95% chunklar, 95-100% finalize.

const CHUNK_SIZE        = 5 * 1024 * 1024;  // 5 MB
const CHUNK_TIMEOUT_MS  = 60 * 1000;        // 1 daqiqa har chunk
const MAX_CHUNK_RETRIES = 3;

interface ChunkUploadParams {
  file:         File;
  appName:      string;
  version:      string;
  releaseNotesUzl?: string;
  releaseNotesUzc?: string;
  releaseNotesRu?:  string;
  releaseNotesEn?:  string;
  appCategory:  "ONLINE" | "OFFLINE";
  isActive:     boolean;
  onProgress?:  (pct: number) => void;
  /** Tahrirlash uchun mavjud release id (yangi yaratish uchun undefined) */
  releaseId?:   number;
}

/** Sleep yordamchi */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Bitta chunk yuborish (retry bilan) */
async function uploadOneChunk(
  uploadId: string,
  chunkIndex: number,
  chunk: Blob
): Promise<void> {
  let lastErr: any;
  for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt++) {
    try {
      const fd = new FormData();
      fd.append("uploadId",   uploadId);
      fd.append("chunkIndex", String(chunkIndex));
      fd.append("chunk",      chunk, `chunk-${chunkIndex}`);
      await api.post(`${BASE}/chunk-upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: CHUNK_TIMEOUT_MS,
      });
      return;
    } catch (e) {
      lastErr = e;
      console.warn(`Chunk ${chunkIndex} attempt ${attempt} failed, retrying...`);
      await sleep(1000 * attempt);
    }
  }
  throw lastErr;
}

/**
 * Katta faylni chunklab yuklash. Yangi reliz yoki mavjudni yangilash.
 * Internet uzilsa har chunk uchun 3 marta retry qiladi.
 */
export const uploadChunked = async ({
  file, appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn,
  appCategory, isActive, onProgress, releaseId,
}: ChunkUploadParams): Promise<AppReleaseResponse> => {

  // 1. INIT
  const initResp = await api.post<{ data: { uploadId: string; chunkSize: number } }>(
    `${BASE}/chunk-init`,
    { fileName: file.name, totalSize: file.size },
    { timeout: 30_000 }
  );
  const uploadId  = initResp.data.data.uploadId;
  const chunkSize = initResp.data.data.chunkSize || CHUNK_SIZE;

  // 2. CHUNKLARNI SEQUENTIAL YUBORISH
  const totalChunks = Math.ceil(file.size / chunkSize);
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end   = Math.min(start + chunkSize, file.size);
      const blob  = file.slice(start, end);
      await uploadOneChunk(uploadId, i, blob);

      if (onProgress) {
        // 0 → 95% chunklar uchun
        const pct = Math.round(((i + 1) / totalChunks) * 95);
        onProgress(pct);
      }
    }

    // 3. FINALIZE
    if (onProgress) onProgress(96);
    const endpoint = releaseId
      ? `${BASE}/${releaseId}/chunk-complete`
      : `${BASE}/chunk-complete`;
    const method   = releaseId ? "put" : "post";

    const resp = await api[method]<{ data: AppReleaseResponse }>(
      endpoint,
      { uploadId, appName, version, releaseNotesUzl, releaseNotesUzc, releaseNotesRu, releaseNotesEn, appCategory, isActive },
      { timeout: 5 * 60 * 1000 } // 5 daqiqa — server'da SHA-256 va merge
    );

    if (onProgress) onProgress(100);
    return resp.data.data;

  } catch (err) {
    // Xato bo'lsa session ni bekor qil (vaqtinchalik fayllarni o'chir)
    try {
      await api.delete(`${BASE}/chunk-cancel/${uploadId}`, { timeout: 5000 });
    } catch { /* ignore */ }
    throw err;
  }
};
