import useSWR from "swr";
import api from "../../../services/api";
import type { QuestionDetail } from "../types";

/**
 * Admin edit uchun savol detail - barcha 4 til varianti qaytariladi.
 * Accept-Language headerga bog'liq emas.
 */
export const useQuestionDetail = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: QuestionDetail;
  }>(
    id ? `/api/v1/admin/questions/${id}/detail` : null,
    async (url: string) => {
      const res = await api.get(url);
      return res.data;
    },
    {
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
