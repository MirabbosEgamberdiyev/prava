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
  });

  let fetchUrl: string;
  if (searchQuery?.trim()) {
    params.append("query", searchQuery.trim());
    fetchUrl = `/api/v1/admin/questions/search?${params.toString()}`;
  } else {
    params.append("sortBy", "createdAt");
    params.append("direction", "DESC");
    if (topicId) params.append("topicId", topicId.toString());
    fetchUrl = `/api/v1/admin/questions?${params.toString()}`;
  }

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

function toOption(question: Question) {
  return {
    value: question.id.toString(),
    label: `${(question.text || "").substring(0, 80)}${(question.text || "").length > 80 ? "..." : ""} (${question.topic?.name || ""})`,
  };
}

/**
 * Select/MultiSelect component uchun question options — server-side search.
 *
 * PERF FIX: avval `size=1000` bilan butun topic savollari bir yo'la
 * yuklanardi (dropdown to'ldirish uchun). Katta topic'larda bu keraksiz
 * og'ir so'rov edi. Endi backend `?query=...&size=20` orqali qidiruv
 * qiladi — foydalanuvchi yozgan sayin server tomonda filtrlanadi.
 *
 * @param topicId - Faqat shu topic savollari
 * @param search - Qidiruv matni (chaqiruvchi tomondan debounce qilingan bo'lishi kerak)
 * @param selectedIds - Hozir tanlangan savol ID'lari — qidiruv natijasida
 *   ko'rinmay qolsa ham, MultiSelect'da chip sifatida to'g'ri label bilan
 *   ko'rsatilishi uchun alohida yuklanadi va natijaga qo'shiladi.
 */
export function useQuestionOptions(
  topicId?: number,
  search?: string,
  selectedIds?: number[],
) {
  const { i18n } = useTranslation();

  const trimmedSearch = search?.trim() || "";
  const params = new URLSearchParams({
    page: "0",
    size: "20",
    sortBy: "createdAt",
    direction: "DESC",
  });
  if (trimmedSearch) params.set("query", trimmedSearch);
  const fetchUrl = `/api/v1/admin/questions/topic/${topicId}?${params.toString()}`;

  const { data, error, isLoading } = useSWR<QuestionResponse>(
    topicId ? [fetchUrl, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  const searchResults: Question[] = data?.data?.content || [];

  // Hozir tanlangan (lekin joriy qidiruv natijasida bo'lmasligi mumkin
  // bo'lgan) savollarni alohida yuklaymiz, shunday qilib ular har doim
  // options ro'yxatida — va demak chip label sifatida — mavjud bo'ladi.
  const missingSelectedIds = (selectedIds || []).filter(
    (id) => !searchResults.some((q) => q.id === id),
  );

  const { data: selectedQuestions } = useSWR<Question[]>(
    missingSelectedIds.length > 0
      ? ["question-options-selected", missingSelectedIds.join(","), i18n.language]
      : null,
    async () => {
      const responses = await Promise.all(
        missingSelectedIds.map((id) =>
          api.get(`/api/v1/admin/questions/${id}`).then((res) => res.data?.data as Question),
        ),
      );
      return responses.filter(Boolean);
    },
  );

  const merged = [...searchResults, ...(selectedQuestions || [])];

  const options = merged
    .filter((q) => q.isActive) // Faqat faol savollar
    .map(toOption);

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
