import useSWR from "swr";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import type { DashboardStats, TopicStats, RecentExam } from "../types";

export const useDashboardStats = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR<{ success: boolean; data: DashboardStats }>(
    ["/api/v1/admin/dashboard/stats", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.data || null,
    isLoading,
    isError: !!error,
  };
};

export const useTopicStats = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR<{ success: boolean; data: TopicStats[] }>(
    ["/api/v1/admin/dashboard/topics", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    topics: data?.data || [],
    isLoading,
    isError: !!error,
  };
};

export const useRecentExams = (page = 0, size = 10) => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR<{
    success: boolean;
    data: { content: RecentExam[]; totalPages: number; totalElements: number };
  }>(
    [`/api/v1/admin/dashboard/recent-exams?page=${page}&size=${size}`, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    exams: data?.data?.content || [],
    totalPages: data?.data?.totalPages || 0,
    totalElements: data?.data?.totalElements || 0,
    isLoading,
    isError: !!error,
  };
};

export const useUserExams = (userId: number | null, page = 0, size = 10) => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    userId ? [`/api/v1/admin/dashboard/user/${userId}/exams?page=${page}&size=${size}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    exams: data?.data?.content || [],
    totalPages: data?.data?.totalPages || 0,
    isLoading,
    isError: !!error,
  };
};

export const useUserDashboardStats = (userId: number | null) => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    userId ? [`/api/v1/admin/dashboard/user/${userId}/statistics`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    stats: data?.data || null,
    isLoading,
    isError: !!error,
  };
};

export const useActiveExamsCount = () => {
  const { i18n } = useTranslation();

  const { data, isLoading } = useSWR(
    ["/api/v1/admin/dashboard/active-exams-count", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return { count: data?.data || 0, isLoading };
};

export const useCompletedExamsCount = () => {
  const { i18n } = useTranslation();

  const { data, isLoading } = useSWR(
    ["/api/v1/admin/dashboard/completed-exams-count", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return { count: data?.data || 0, isLoading };
};

export const useTodayExamsCount = () => {
  const { i18n } = useTranslation();

  const { data, isLoading } = useSWR(
    ["/api/v1/admin/dashboard/today-exams-count", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return { count: data?.data || 0, isLoading };
};
