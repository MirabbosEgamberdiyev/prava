export interface QuestionOption {
  optionIndex: number;
  textUzl: string | null;
  textUzc: string | null;
  textEn: string | null;
  textRu: string | null;
}

export interface QuestionFormValues {
  textUzl: string | null;
  textUzc: string | null;
  textEn: string | null;
  textRu: string | null;
  explanationUzl: string | null;
  explanationUzc: string | null;
  explanationEn: string | null;
  explanationRu: string | null;
  topicId: number | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  options: QuestionOption[] | null;
  correctAnswerIndex: number | null;
  imageUrl: string | null;
  isActive: boolean;
}
