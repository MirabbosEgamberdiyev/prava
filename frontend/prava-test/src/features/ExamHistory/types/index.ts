import type { LocalizedText } from "../../../types";

export type HistoryFilterStatus = "ALL" | "COMPLETED" | "FAILED" | "IN_PROGRESS" | "ABANDONED";

export interface ExamHistoryItem {
  sessionId: number;
  status: string;
  score: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalTimeSpentSeconds: number;
  startedAt: string;
  completedAt: string | null;
  packageName?: LocalizedText;
  ticketName?: LocalizedText;
  ticketNumber?: number;
  isMarathon?: boolean;
}

export interface ExamHistoryResponse {
  success: boolean;
  message: string;
  data: {
    content: ExamHistoryItem[];
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}
