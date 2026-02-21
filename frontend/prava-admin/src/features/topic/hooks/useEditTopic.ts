/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import type { Topic } from "../types";

export const useEditTopic = (onSuccess: () => void) => {
  const { t } = useTranslation();
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdate = async (id: number, values: any) => {
    try {
      setIsSubmitting(true);
      await api.put(`/api/v1/admin/topics/${id}`, values);

      notifications.show({
        title: t("common.success"),
        message: t("topics.updateSuccess"),
        color: "green",
      });

      onSuccess();
      setEditingTopic(null);
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("topics.updateError"),
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    editingTopic, // Karta bosilganda tanlangan mavzu
    setEditingTopic, // Modalni ochish/yopish uchun (editingTopic ni o'zgartiradi)
    isSubmitting, // Button loading holati uchun
    handleUpdate, // Form submit bo'lganda chaqiriladi
  };
};
