/* eslint-disable @typescript-eslint/no-explicit-any */
// features/ticket/hook/index.ts

import useSWR from "swr";
import { useState, useCallback } from "react";
import api from "../../../services/api";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import type {
  TicketListResponse,
  TicketDetailResponse,
  TicketFormData,
} from "../types";

const BASE_URL = "/api/v2/tickets";

// GET - Barcha biletlar
export function useTickets(page = 0, size = 20) {
  const { i18n } = useTranslation();

  const fetchUrl = `${BASE_URL}?page=${page}&size=${size}&sortBy=ticketNumber&direction=ASC`;

  const { data, error, isLoading, mutate } = useSWR<TicketListResponse>(
    [fetchUrl, i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    tickets: data?.data.content || [],
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

// GET - Bitta bilet (detail)
export function useTicketDetail(id: number | null) {
  const { i18n } = useTranslation();

  const fetchUrl = id ? `${BASE_URL}/${id}/detail` : null;

  const { data, error, isLoading, mutate } = useSWR<TicketDetailResponse>(
    fetchUrl ? [fetchUrl, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    ticket: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

// GET - Bitta bilet (basic)
export function useTicketById(id: number | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    id ? [`${BASE_URL}/${id}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    ticket: data?.data || null,
    isLoading,
    isError: !!error,
  };
}

// GET - Package bo'yicha biletlar
export function useTicketsByPackage(packageId: number | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    packageId ? [`${BASE_URL}/package/${packageId}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    tickets: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

// GET - Topic bo'yicha biletlar
export function useTicketsByTopic(topicId: number | null) {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR(
    topicId ? [`${BASE_URL}/topic/${topicId}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
  );

  return {
    tickets: data?.data || [],
    isLoading,
    isError: !!error,
  };
}

// PUT - Update ticket
export function useUpdateTicket() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const updateTicket = useCallback(
    async (id: number, data: Partial<TicketFormData>) => {
      setLoading(true);
      try {
        const response = await api.put(`${BASE_URL}/${id}`, data);
        notifications.show({
          title: t("common.success"),
          message: t("tickets.updateSuccess"),
          color: "green",
        });
        return response.data;
      } catch (error: any) {
        notifications.show({
          title: t("common.error"),
          message: error.response?.data?.message || t("tickets.updateError"),
          color: "red",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  return { updateTicket, loading };
}

// POST - Create ticket
export function useCreateTicket() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const createTicket = useCallback(async (data: TicketFormData) => {
    setLoading(true);
    try {
      const response = await api.post(BASE_URL, data);
      notifications.show({
        title: t("common.success"),
        message: t("tickets.createSuccess"),
        color: "green",
      });
      return response.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("tickets.createError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { createTicket, loading };
}

// DELETE - Delete ticket
export function useDeleteTicket() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const deleteTicket = useCallback(async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`${BASE_URL}/${id}`);
      notifications.show({
        title: t("common.success"),
        message: t("tickets.deletedSuccess"),
        color: "green",
      });
      return true;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("tickets.deleteError"),
        color: "red",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [t]);

  return { deleteTicket, loading };
}
