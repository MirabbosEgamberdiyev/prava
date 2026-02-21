// features/topic/hook/index.ts

import useSWR from "swr";
import api from "../../../services/api";
import type { TopicResponse } from "../types";
import { useTranslation } from "react-i18next";

export const useTopics = (page: number, size = 12) => {
  const { i18n } = useTranslation();

  // Backend 0-indexed sahifalashni ishlatsa (0, 1, 2...)
  const fetchUrl = `/api/v1/admin/topics?page=${
    page - 1
  }&size=${size}&sortBy=displayOrder&direction=ASC`;

  const { data, error, isLoading, mutate } = useSWR<TopicResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topics: data?.data?.content || [],
    totalPages: data?.data?.totalPages || 0,
    totalElements: data?.data?.totalElements || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export function useTopicOptions() {
  const { i18n } = useTranslation();

  const fetchUrl = `/api/v1/admin/topics?page=0&size=100&sortBy=displayOrder&direction=ASC`;

  const { data, error, isLoading } = useSWR<TopicResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  const topics = data?.data?.content || [];

  const options = topics
    .filter((topic) => topic.isActive)
    .map((topic) => ({
      value: topic.id.toString(),
      label: topic.name,
    }));

  return {
    options,
    isLoading,
    isError: !!error,
  };
}

export function useTopicById(id: number | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    id ? [`/api/v1/admin/topics/${id}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topic: data?.data || null,
    isLoading,
    isError: !!error,
  };
}

export function useTopicByCode(code: string | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    code ? [`/api/v1/admin/topics/code/${code}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topic: data?.data || null,
    isLoading,
    isError: !!error,
  };
}

export function useActiveTopics() {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    ["/api/v1/admin/topics/active", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topics: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

export function useSimpleTopics() {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    ["/api/v1/admin/topics/simple", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topics: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

export function useTopicsWithQuestions() {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    ["/api/v1/admin/topics/with-questions", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topics: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

export function useSearchTopics(query: string | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    query ? [`/api/v1/admin/topics/search?query=${encodeURIComponent(query)}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    topics: data?.data || [],
    isLoading,
    isError: !!error,
  };
}
