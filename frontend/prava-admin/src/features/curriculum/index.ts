import useSWR from "swr";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import type {
  CurriculumStats,
  RoadSign,
  RoadMarking,
  TrafficRule,
  PracticalPenalty,
  PracticalExercise,
  ExamCenter,
} from "./types";

export * from "./types";

export const useCurriculumStats = () => {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: CurriculumStats;
  }>("/api/v1/curriculum/stats", async (url: string) => {
    const res = await api.get(url);
    return res.data;
  });

  return {
    stats: data?.data || null,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const useRoadSigns = (category?: string, search?: string) => {
  const { i18n } = useTranslation();
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);

  const queryStr = params.toString();
  const url = `/api/v1/curriculum/signs${queryStr ? `?${queryStr}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: RoadSign[];
  }>([url, i18n.language], async ([fetchUrl]) => {
    const res = await api.get(fetchUrl as string);
    return res.data;
  });

  return {
    signs: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const useRoadMarkings = (type?: string) => {
  const { i18n } = useTranslation();
  const params = new URLSearchParams();
  if (type) params.append("type", type);

  const queryStr = params.toString();
  const url = `/api/v1/curriculum/markings${queryStr ? `?${queryStr}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: RoadMarking[];
  }>([url, i18n.language], async ([fetchUrl]) => {
    const res = await api.get(fetchUrl as string);
    return res.data;
  });

  return {
    markings: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const useTrafficRules = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: TrafficRule[];
  }>(["/api/v1/curriculum/rules", i18n.language], async ([url]) => {
    const res = await api.get(url as string);
    return res.data;
  });

  return {
    rules: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const usePracticalPenalties = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: PracticalPenalty[];
  }>(["/api/v1/curriculum/penalties", i18n.language], async ([url]) => {
    const res = await api.get(url as string);
    return res.data;
  });

  return {
    penalties: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const usePracticalExam = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: {
      exercises: PracticalExercise[];
      penalties: PracticalPenalty[];
    };
  }>(["/api/v1/curriculum/practical-exam", i18n.language], async ([url]) => {
    const res = await api.get(url as string);
    return res.data;
  });

  return {
    exercises: data?.data?.exercises || [],
    penalties: data?.data?.penalties || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};

export const useExamCenters = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ExamCenter[];
  }>(["/api/v1/curriculum/exam-centers", i18n.language], async ([url]) => {
    const res = await api.get(url as string);
    return res.data;
  });

  return {
    centers: data?.data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
};
