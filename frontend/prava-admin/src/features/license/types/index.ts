// ─── Enums ────────────────────────────────────────────────────────────────────

export type ActivationCodeStatus = "ACTIVE" | "EXPIRED" | "DEACTIVATED";

/** Virtual group — EXPIRING is computed, not persisted */
export type ActivationCodeGroup = "ACTIVE" | "EXPIRING" | "EXPIRED" | "DEACTIVATED";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface ActivationCodeRequest {
  machineId: string;
  startDate: string;           // "YYYY-MM-DD"
  endDate: string;             // "YYYY-MM-DD"
  clientFirstName?: string;
  clientLastName?: string;
  clientPhone?: string;
  learningCenter?: string;
  notes?: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface ActivationCodeResponse {
  id: number;
  clientFirstName?: string;
  clientLastName?: string;
  clientFullName: string;
  clientPhone?: string;
  learningCenter?: string;
  machineId: string;
  startDate: string;
  endDate: string;
  licenseKey: string;
  status: ActivationCodeStatus;
  displayGroup: ActivationCodeGroup;
  daysUntilExpiry?: number;
  notes?: string;
  generatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivationCodeStatsResponse {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  deactivated: number;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface ActivationCodeFilter {
  page?: number;
  size?: number;
  search?: string;
  status?: ActivationCodeStatus;
  group?: ActivationCodeGroup;
  sort?: string;
  dir?: "asc" | "desc";
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-based)
  size: number;
  first: boolean;
  last: boolean;
}
