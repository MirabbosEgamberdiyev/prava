import api from "../../../services/api";
import type { TopicFormValues } from "../types";

export const postTopic = async (data: TopicFormValues) => {
  const response = await api.post("/api/v1/admin/topics", data);
  return response.data;
};
