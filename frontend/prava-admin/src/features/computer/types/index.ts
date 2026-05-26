// ─── Enums ────────────────────────────────────────────────────────────────────

export type ComputerStatus = "ACTIVE" | "INACTIVE";

// ─── Request ──────────────────────────────────────────────────────────────────

export interface ComputerRequest {
  name: string;
  machineId: string;
  macAddress?: string;
  deviceId?: string;
  learningCenterId: number;
  notes?: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface ComputerResponse {
  id: number;
  name: string;
  machineId: string;
  macAddress?: string;
  deviceId?: string;
  learningCenterId: number;
  learningCenterName?: string;
  status: ComputerStatus;
  notes?: string;
  totalCodes?: number;
  activeCodes?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface ComputerFilter {
  search?: string;
  lcId?: number;
  status?: ComputerStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
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
