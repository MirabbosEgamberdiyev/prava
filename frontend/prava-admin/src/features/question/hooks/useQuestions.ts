// features/question/hook/index.ts

import useSWR from "swr";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import type { QuestionResponse, UseQuestionsReturn, Question } from "../types";

/**
 * Barcha savollarni olish (pagination bilan)
 * @param page - Sahifa raqami (1-dan boshlanadi)
 * @param size - Sahifadagi elementlar soni
 * @returns questions, pagination, loading va error states
 */
export const useQuestions = (
  page = 1,
  size = 20,
  searchQuery?: string,
  topicId?: number | null,
): UseQuestionsReturn => {
  const { i18n } = useTranslation();

  // Backend 0-dan boshlanadi, UI 1-dan boshlanadi
  const backendPage = Math.max(0, page - 1);

  const params = new URLSearchParams({
    page: backendPage.toString(),
    size: size.toString(),
    sortBy: "createdAt",
    direction: "DESC",
  });
  if (searchQuery?.trim()) params.append("search", searchQuery.trim());
  if (topicId) params.append("topicId", topicId.toString());

  const fetchUrl = `/api/v1/admin/questions?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<QuestionResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    questions: data?.data?.content || [],
    pagination: {
      totalPages: data?.data?.totalPages || 0,
      totalElements: data?.data?.totalElements || 0,
    },
    isLoading,
    isError: !!error,
    mutate,
  };
};

/**
 * Topic bo'yicha savollarni olish
 * @param topicId - Topic ID
 * @param page - Sahifa raqami
 * @param size - Sahifadagi elementlar soni
 */
export const useQuestionsByTopic = (
  topicId?: number,
  page = 1,
  size = 20,
): UseQuestionsReturn => {
  const { i18n } = useTranslation();

  const backendPage = Math.max(0, page - 1);

  const fetchUrl = topicId
    ? `/api/v1/admin/questions?topicId=${topicId}&page=${backendPage}&size=${size}&sortBy=createdAt&direction=DESC`
    : null;

  const { data, error, isLoading, mutate } = useSWR<QuestionResponse>(
    fetchUrl ? [fetchUrl, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    questions: data?.data?.content || [],
    pagination: {
      totalPages: data?.data?.totalPages || 0,
      totalElements: data?.data?.totalElements || 0,
    },
    isLoading,
    isError: !!error,
    mutate,
  };
};

/**
 * Select component uchun question options
 * @param topicId - Agar topicId bo'lsa, faqat shu topic savollari
 * @returns options array for Select/MultiSelect
 */
export function useQuestionOptions(topicId?: number) {
  const { i18n } = useTranslation();

  // Topic bo'yicha filter qilish
  const fetchUrl = topicId
    ? `/api/v1/admin/questions?topicId=${topicId}&page=0&size=1000&sortBy=createdAt&direction=DESC`
    : `/api/v1/admin/questions?page=0&size=1000&sortBy=createdAt&direction=DESC`;

  const { data, error, isLoading } = useSWR<QuestionResponse>(
    topicId ? [fetchUrl, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  const questions: Question[] = data?.data?.content || [];

  const options = questions
    .filter((q) => q.isActive) // Faqat faol savollar
    .map((question) => ({
      value: question.id.toString(),
      label: `${(question.text || "").substring(0, 80)}${(question.text || "").length > 80 ? "..." : ""} (${question.topic?.name || ""})`,
    }));

  return {
    options,
    isLoading,
    isError: !!error,
  };
}

/**
 * Bitta savolni olish
 * @param id - Savol ID
 */
export function useQuestion(id: number | null) {
  const { i18n } = useTranslation();

  const fetchUrl = id ? `/api/v1/admin/questions/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Question;
  }>(fetchUrl ? [fetchUrl, i18n.language] : null, async ([url]) => {
    const res = await api.get(url as string);
    return res.data;
  });

  return {
    question: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
}
