/* eslint-disable @typescript-eslint/no-explicit-any */
// features/package/hook/index.ts

import useSWR from "swr";
import { useState, useCallback } from "react";
import api from "../../../services/api";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import type {
  PackageListResponse,
  PackageDetailResponse,
  PackageFormData,
  PackageFilters,
} from "../types";

const BASE_URL = "/api/v1/packages";

// GET - Barcha packagelar
export function usePackages(page = 0, size = 10, filters?: PackageFilters) {
  const { i18n } = useTranslation();

  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sortBy: "orderIndex",
    direction: "ASC",
  });

  if (filters?.topicId) params.append("topicId", filters.topicId.toString());
  if (filters?.isFree !== undefined)
    params.append("isFree", filters.isFree.toString());
  if (filters?.isActive !== undefined)
    params.append("isActive", filters.isActive.toString());
  if (filters?.generationType)
    params.append("generationType", filters.generationType);
  if (filters?.search) params.append("search", filters.search);

  const fetchUrl = `${BASE_URL}?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PackageListResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    packages: data?.data.content || [],
    pagination: data?.data
      ? {
          page: data.data.page,
          size: data.data.size,
          totalElements: data.data.totalElements,
          totalPages: data.data.totalPages,
        }
      : null,
    isLoading,
    error,
    mutate,
  };
}

// GET - Admin packagelar
export function useAdminPackages(page = 0, size = 10) {
  const { i18n } = useTranslation();

  const fetchUrl = `${BASE_URL}/admin?page=${page}&size=${size}&sortBy=orderIndex&direction=ASC`;

  const { data, error, isLoading, mutate } = useSWR<PackageListResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    packages: data?.data.content || [],
    pagination: data?.data
      ? {
          page: data.data.page,
          size: data.data.size,
          totalElements: data.data.totalElements,
          totalPages: data.data.totalPages,
        }
      : null,
    isLoading,
    error,
    mutate,
  };
}

// GET - Bitta package (detail)
export function usePackageDetail(id: number | null) {
  const { i18n } = useTranslation();

  const fetchUrl = id ? `${BASE_URL}/${id}/detail` : null;

  const { data, error, isLoading, mutate } = useSWR<PackageDetailResponse>(
    fetchUrl ? [fetchUrl, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    package: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

// GET - Bitta package (basic)
export function usePackageById(id: number | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    id ? [`${BASE_URL}/${id}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    package: data?.data || null,
    isLoading,
    isError: !!error,
  };
}

// GET - Free packages
export function useFreePackages() {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<PackageListResponse>(
    [`${BASE_URL}/free`, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    packages: data?.data.content || [],
    isLoading,
    error,
    mutate,
  };
}

// GET - Topic code bo'yicha packagelar
export function usePackagesByTopicCode(topicCode: string | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    topicCode ? [`${BASE_URL}/topic/${topicCode}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    packages: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

// GET - Package count
export function usePackageCount() {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR<{ success: boolean; data: number }>(
    [`${BASE_URL}/count`, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    count: data?.data || 0,
    isLoading,
    error,
  };
}

// Select uchun packagelar ro'yxati
export function usePackageOptions() {
  const { i18n } = useTranslation();

  const fetchUrl = `${BASE_URL}?page=0&size=100&sortBy=orderIndex&direction=ASC`;

  const { data, error, isLoading } = useSWR<PackageListResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  const packages = data?.data?.content || [];

  const options = packages
    .filter((pkg) => pkg.isActive)
    .map((pkg) => ({
      value: pkg.id.toString(),
      label: pkg.name,
    }));

  return { options, isLoading, isError: !!error };
}

// POST - Create package
export function useCreatePackage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const createPackage = useCallback(async (data: PackageFormData) => {
    setLoading(true);
    try {
      const response = await api.post(BASE_URL, data);
      notifications.show({
        title: t("common.success"),
        message: t("packages.createSuccess"),
        color: "green",
      });
      return response.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("packages.createError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { createPackage, loading };
}

// PUT - Update package
export function useUpdatePackage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const updatePackage = useCallback(
    async (id: number, data: Partial<PackageFormData>) => {
      setLoading(true);
      try {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        notifications.show({
          title: t("common.success"),
          message: t("packages.updateSuccess"),
          color: "green",
        });
        return response.data;
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message:
            error.response?.data?.message || t("packages.updateError"),
          color: "red",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  return { updatePackage, loading };
}

// DELETE - Delete package
export function useDeletePackage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const deletePackage = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}`);
      notifications.show({
        title: t("common.success"),
        message: t("packages.deleteSuccess"),
        color: "green",
      });
      return true;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("packages.deleteError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { deletePackage, loading };
}

// PATCH - Toggle package status
export function useTogglePackageStatus() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const toggleStatus = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.patch(`${BASE_URL}/${id}/toggle`);
      notifications.show({
        title: t("common.success"),
        message: t("packages.statusChanged"),
        color: "green",
      });
      return true;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message:
          error.response?.data?.message || t("packages.statusChangeError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { toggleStatus, loading };
}

// POST - Regenerate questions
export function useRegenerateQuestions() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const regenerate = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.post(`${BASE_URL}/${id}/regenerate`);
      notifications.show({
        title: t("common.success"),
        message: t("packages.regenerateSuccess"),
        color: "green",
      });
      return true;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("packages.regenerateError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { regenerate, loading };
}

// POST - Attach questions to package
export function useAttachQuestions() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const attachQuestions = useCallback(
    async (packageId: number, questionCount: number, questionIds: number[]) => {
      setLoading(true);
      try {
        await api.patch(`${BASE_URL}/${packageId}`, {
          questionIds,
          questionCount,
        });
        notifications.show({
          title: t("common.success"),
          message: t("packages.attachSuccess", { count: questionIds.length }),
          color: "green",
        });
        return true;
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message:
            error.response?.data?.message ||
            t("packages.attachError"),
          color: "red",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  return { attachQuestions, loading };
}
