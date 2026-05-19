export type JobState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type JobType  = "EXPORT" | "IMPORT";

/** Bitta jadval uchun import natijasi (backend TableImportResult) */
export interface TableImportResult {
  tableName: string;
  totalRows: number;
  inserted:  number;
  /** ON CONFLICT DO NOTHING sababli o'tkazilgan qatorlar */
  skipped:   number;
  /** Xato sababli kiritilmagan qatorlar */
  failed:    number;
  error?:    string;
}

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
  tableResults?:   Record<string, TableImportResult>;
}

/** Qaysi jadvallar guruhlarini import qilishni belgilaydi */
export interface ImportOptions {
  importUsers:             boolean;
  importTopics:            boolean;
  /** questions, question_options, package_questions, ticket_questions */
  importQuestions:         boolean;
  /** exam_packages, tickets */
  importExamPackages:      boolean;
  /** exam_sessions, exam_answers */
  importExamSessions:      boolean;
  importUserStatistics:    boolean;
  importPayments:          boolean;
  /** refresh_tokens, verification_codes */
  importTokens:            boolean;
  importUserPackageAccess: boolean;
  importMedia:             boolean;
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  importUsers:             true,
  importTopics:            true,
  importQuestions:         true,
  importExamPackages:      true,
  importExamSessions:      true,
  importUserStatistics:    true,
  importPayments:          true,
  importTokens:            true,
  importUserPackageAccess: true,
  importMedia:             true,
};

/** Ma'lumotlarni selektiv tozalash opsiyalari */
export interface ClearOptions {
  clearUsers:             boolean;
  clearTopics:            boolean;
  clearQuestions:         boolean;
  clearExamPackages:      boolean;
  clearExamSessions:      boolean;
  clearPayments:          boolean;
  clearUserPackageAccess: boolean;
  clearStatistics:        boolean;
  clearTokens:            boolean;
  clearMedia:             boolean;
}

export interface ClearResult {
  clearedTables: string[];
  clearedCount:  number;
  mediaCleared:  boolean;
  clearedBy:     string;
}

export interface StartExportRequest {
  encrypt:   boolean;
  password?: string;
}

export interface StartImportRequest {
  file:         File;
  forceReplace: boolean;
  password?:    string;
  options:      ImportOptions;
}

// FK-safe tartibda tozalanadigan jadvallar hisoblash (backend ClearOptions.getTablesToClear() mirror)
const FK_ORDER = [
  "user_package_access", "payments",
  "exam_answers", "exam_sessions",
  "ticket_questions", "package_questions",
  "verification_codes", "refresh_tokens",
  "user_statistics",
  "question_options", "questions",
  "tickets", "exam_packages",
  "users", "topics",
];

export function getAffectedTables(opts: ClearOptions): string[] {
  const tables = new Set<string>();

  if (opts.clearExamSessions)      { tables.add("exam_answers"); tables.add("exam_sessions"); }
  if (opts.clearPayments)          { tables.add("payments"); }
  if (opts.clearUserPackageAccess) { tables.add("user_package_access"); }
  if (opts.clearStatistics)        { tables.add("user_statistics"); }
  if (opts.clearTokens)            { tables.add("verification_codes"); tables.add("refresh_tokens"); }
  if (opts.clearQuestions)         { tables.add("ticket_questions"); tables.add("package_questions"); tables.add("question_options"); tables.add("questions"); }
  if (opts.clearExamPackages)      { tables.add("ticket_questions"); tables.add("package_questions"); tables.add("tickets"); tables.add("exam_packages"); }
  if (opts.clearUsers)             {
    ["user_package_access","payments","user_statistics","refresh_tokens",
     "verification_codes","exam_answers","exam_sessions","users"].forEach(t => tables.add(t));
  }
  if (opts.clearTopics)            {
    ["ticket_questions","package_questions","question_options","questions",
     "tickets","exam_packages","user_statistics","topics"].forEach(t => tables.add(t));
  }

  return FK_ORDER.filter(t => tables.has(t));
}

export function isClearEmpty(opts: ClearOptions): boolean {
  return !opts.clearUsers && !opts.clearTopics && !opts.clearQuestions &&
         !opts.clearExamPackages && !opts.clearExamSessions && !opts.clearPayments &&
         !opts.clearUserPackageAccess && !opts.clearStatistics && !opts.clearTokens &&
         !opts.clearMedia;
}
