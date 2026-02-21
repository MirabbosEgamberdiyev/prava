// Hozirgi typelaringiz (saqlanadi)
export interface QuestionTopic {
  id: number;
  code: string;
  name: string;
  iconUrl: string;
}

export interface QuestionOption {
  id: number;
  optionIndex: number;
  text: string;
}

export interface Question {
  id: number;
  text: string | null;
  explanation: string | null;
  topic: QuestionTopic | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  options: QuestionOption[] | null;
  correctAnswerIndex: number | null;
  imageUrl: string | null;
  isActive: boolean;
  timesUsed: number;
  successRate: number;
}

export interface QuestionResponse {
  success: boolean;
  data: {
    content: Question[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// CRUD operatsiyalar uchun DTOlar (backend QuestionRequest formatiga mos)
export interface CreateQuestionOption {
  optionIndex?: number;
  textUzl?: string | null;
  textUzc?: string | null;
  textEn?: string | null;
  textRu?: string | null;
}

export interface CreateQuestionDTO {
  textUzl?: string | null;
  textUzc?: string | null;
  textEn?: string | null;
  textRu?: string | null;
  explanationUzl?: string | null;
  explanationUzc?: string | null;
  explanationEn?: string | null;
  explanationRu?: string | null;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
  correctAnswerIndex?: number | null;
  topicId?: number | null;
  options?: CreateQuestionOption[] | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateQuestionDTO {
  textUzl?: string;
  textUzc?: string | null;
  textEn?: string | null;
  textRu?: string | null;
  explanationUzl?: string | null;
  explanationUzc?: string | null;
  explanationEn?: string | null;
  explanationRu?: string | null;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  correctAnswerIndex?: number;
  topicId?: number;
  options?: CreateQuestionOption[];
  imageUrl?: string | null;
  isActive?: boolean;
}

// Admin edit uchun - barcha 4 til varianti
export interface QuestionOptionDetail {
  id: number;
  optionIndex: number;
  textUzl: string | null;
  textUzc: string | null;
  textEn: string | null;
  textRu: string | null;
}

export interface QuestionDetail {
  id: number;
  textUzl: string | null;
  textUzc: string | null;
  textEn: string | null;
  textRu: string | null;
  explanationUzl: string | null;
  explanationUzc: string | null;
  explanationEn: string | null;
  explanationRu: string | null;
  topicId: number | null;
  topicName: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  correctAnswerIndex: number | null;
  imageUrl: string | null;
  isActive: boolean;
  timesUsed: number;
  successRate: number;
  options: QuestionOptionDetail[];
}

// YANGI: Hook return types
export interface UseQuestionsReturn {
  questions: Question[];
  pagination: {
    totalPages: number;
    totalElements: number;
  };
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export interface UseQuestionReturn {
  question: Question | null;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}
