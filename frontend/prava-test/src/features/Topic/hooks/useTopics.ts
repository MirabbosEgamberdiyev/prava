import useSWR from "swr";
import { useTranslation } from "react-i18next";
import type { TopicsResponse } from "../types";

export function useTopics() {
  const { t } = useTranslation();
  // User endpoint (same TopicResponse as the admin one); keep only topics that have questions.
  const { data, isLoading, error } = useSWR<TopicsResponse>("/api/v1/app/topics");

  return {
    topics: (data?.data ?? []).filter((topic) => (topic.questionCount ?? 0) > 0),
    loading: isLoading,
    error: error ? t("topics.loadError") : null,
  };
}
