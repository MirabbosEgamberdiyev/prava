import api from "../../../services/api";
import type { QuestionFormValues } from "../types";

export const uploadBulkQuestions = async (payload: {
  questions: QuestionFormValues[];
}) => {
  const response = await api.post("/api/v1/admin/questions/bulk", payload);
  return response.data;
};
