/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSWRConfig } from "swr";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import questionService from "../../../services/questionService";
import type { CreateQuestionDTO, UpdateQuestionDTO, Question } from "../types";

export const useQuestionMutations = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();

  /**
   * Yangi savol yaratish
   */
  const createQuestion = async (data: CreateQuestionDTO): Promise<Question> => {
    try {
      const newQuestion = await questionService.create(data);

      // Cache ni yangilash
      mutate(
        (key) =>
          typeof key === "string" && key.includes("/api/v1/admin/questions"),
      );

      notifications.show({
        title: t("common.success"),
        message: t("questions.questionCreated"),
        color: "green",
        withBorder: true,
      });

      return newQuestion;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("questions.createError"),
        color: "red",
        withBorder: true,
      });
      throw error;
    }
  };

  /**
   * Savolni yangilash
   */
  const updateQuestion = async (
    id: number,
    data: UpdateQuestionDTO,
  ): Promise<Question> => {
    try {
      const updatedQuestion = await questionService.update(id, data);

      // Cache ni yangilash
      mutate(
        (key) =>
          typeof key === "string" && key.includes("/api/v1/admin/questions"),
      );

      notifications.show({
        title: t("common.success"),
        message: t("questions.updateSuccess"),
        color: "green",
        withBorder: true,
      });

      return updatedQuestion;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("questions.updateError"),
        color: "red",
        withBorder: true,
      });
      throw error;
    }
  };

  /**
   * Savolni o'chirish
   */
  const deleteQuestion = async (id: number): Promise<void> => {
    try {
      await questionService.delete(id);

      // Cache ni yangilash
      mutate(
        (key) =>
          typeof key === "string" && key.includes("/api/v1/admin/questions"),
      );

      notifications.show({
        title: t("common.success"),
        message: t("questions.deletedSuccess"),
        color: "green",
        withBorder: true,
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("questions.deleteError"),
        color: "red",
        withBorder: true,
      });
      throw error;
    }
  };

  /**
   * Savol statusini o'zgartirish
   */
  const toggleQuestionStatus = async (id: number): Promise<Question> => {
    try {
      const updatedQuestion = await questionService.toggleStatus(id);

      // Cache ni yangilash
      mutate(
        (key) =>
          typeof key === "string" && key.includes("/api/v1/admin/questions"),
      );

      notifications.show({
        title: t("common.success"),
        message: t("questions.statusChanged"),
        color: "green",
        withBorder: true,
      });

      return updatedQuestion;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message:
          error.response?.data?.message || t("questions.statusChangeError"),
        color: "red",
        withBorder: true,
      });
      throw error;
    }
  };

  return {
    createQuestion,
    updateQuestion,
    deleteQuestion,
    toggleQuestionStatus,
  };
};
