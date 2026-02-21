// features/add_question/services/addQuestionApi.ts
import api from "../../../services/api";
import type { QuestionFormValues } from "../types";

export const postQuestion = async (data: QuestionFormValues) => {
  const response = await api.post("/api/v1/admin/questions", data);
  return response.data;
};
