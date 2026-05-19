export type JobState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type JobType  = "EXPORT" | "IMPORT";

export interface BackupJob {
  jobId:           string;
  type:            JobType;
  state:           JobState;
  progressPercent: number;
  phase:           string;
  startedAt:       string;
  completedAt?:    string;
  error?:          string;
  // EXPORT
  fileSizeKB?:     number;
  downloadUrl?:    string;
  backupId?:       string;
  entities?:       Record<string, number>;
  // IMPORT
  summary?:        string;
}

export interface StartExportRequest {
  encrypt:   boolean;
  password?: string;
}

export interface StartImportRequest {
  file:         File;
  forceReplace: boolean;
  password?:    string;
}
