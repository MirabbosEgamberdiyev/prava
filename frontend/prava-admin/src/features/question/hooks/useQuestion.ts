import useSWR from "swr";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import type { Question } from "../types";

/**
 * Bitta savolni ID bo'yicha olish
 * @param id - Savol ID raqami (null bo'lsa request yuborilmaydi)
 * @returns question, loading va error states
 */
export const useQuestion = (id: number | null) => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: Question;
  }>(
    // id null bo'lsa, request yuborilmaydi
    id ? [`/api/v1/admin/questions/${id}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    {
      // Har safar focus bo'lganda revalidate qilmaslik
      revalidateOnFocus: false,
    },
  );

  return {
    question: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
};
