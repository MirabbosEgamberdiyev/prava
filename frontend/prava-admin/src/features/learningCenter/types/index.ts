// ─── Enums ────────────────────────────────────────────────────────────────────

export type LearningCenterStatus = "ACTIVE" | "INACTIVE";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface LearningCenterRequest {
  name: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  email?: string;
  notes?: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface LearningCenterResponse {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  email?: string;
  notes?: string;
  status: LearningCenterStatus;
  totalCodes?: number;
  activeCodes?: number;
  computerCount?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface LearningCenterFilter {
  search?: string;
  status?: LearningCenterStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
