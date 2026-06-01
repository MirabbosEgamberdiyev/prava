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
  if (filter.platform && filter.platform !== "")  params.platform = filter.platform;
  if (filter.appType  && filter.appType  !== "")  params.appType  = filter.appType;
  if (filter.status   && filter.status   !== "")  params.status   = filter.status;
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

// ─── File Upload ──────────────────────────────────────────────────────────────

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
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    })
    .then((r) => r.data.data);
};
