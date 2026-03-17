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
     * Savol o'zgarishi bilan bog'liq barcha SWR cachlarini tozalaydi:
     * - Savollar ro'yxati
     * - Mavzular (savol soni o'zgaradi)
     * - Biletlar (o'chirilgan savollar chiqib ketsin)
     * - To'plamlar (packages - o'chirilgan savollar chiqib ketsin)
     * - Dashboard statistikasi (savol soni yangilansin)
     */
    const invalidateQuestionsCache = () => {
        mutate((key) => {
            const k = Array.isArray(key) ? key[0] : key;
            if (typeof k !== "string") return false;
            return (
                k.includes("/api/v1/admin/questions") ||
                k.includes("/api/v1/admin/topics") ||
                k.includes("/api/v1/admin/tickets") ||
                k.includes("/api/v1/admin/dashboard") ||
                k.includes("/api/v1/admin/statistics") ||
                k.includes("/api/v1/packages") ||
                k.includes("/api/v2/tickets") ||
                k.includes("/api/v2/topics")
            );
        });
    };

    const createQuestion = async (data: CreateQuestionDTO): Promise<Question> => {
        try {
            const newQuestion = await questionService.create(data);
            invalidateQuestionsCache();

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

    const updateQuestion = async (id: number, data: UpdateQuestionDTO): Promise<Question> => {
        try {
            const updatedQuestion = await questionService.update(id, data);
            invalidateQuestionsCache();

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

    const deleteQuestion = async (id: number): Promise<void> => {
        try {
            await questionService.delete(id);
            invalidateQuestionsCache();

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

    const toggleQuestionStatus = async (id: number): Promise<Question> => {
        try {
            const updatedQuestion = await questionService.toggleStatus(id);
            invalidateQuestionsCache();

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
                message: error.response?.data?.message || t("questions.statusChangeError"),
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