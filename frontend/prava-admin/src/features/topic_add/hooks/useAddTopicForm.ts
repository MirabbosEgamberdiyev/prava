/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { postTopic } from "../services/topicApi";
import api from "../../../services/api";
import type { TopicFormValues } from "../types";

export const useAddTopicForm = () => {
  const { t } = useTranslation();
  const form = useForm<TopicFormValues>({
    initialValues: {
      code: "",
      nameUzl: "",
      nameUzc: "",
      nameEn: "",
      nameRu: "",
      descriptionUzl: "",
      descriptionUzc: "",
      descriptionEn: "",
      descriptionRu: "",
      iconUrl: null,
      displayOrder: 1,
      isActive: true,
    },
    validate: {
      code: (val) => (val.length < 2 ? t("validation.codeRequired") : null),
      nameUzl: (val) => (val.length < 2 ? t("validation.nameUzlRequired") : null),
    },
  });

  const uploadIcon = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/v1/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data?.fileUrl || res.data;
      form.setFieldValue("iconUrl", url);
      notifications.show({
        title: t("common.success"),
        message: t("topics.iconUploaded"),
        color: "green",
        withBorder: true,
      });
    } catch (error) {
      notifications.show({
        title: t("common.error"),
        message: t("topics.iconUploadError"),
        color: "red",
        withBorder: true,
      });
    }
  };

  const handleSubmit = async (values: TopicFormValues) => {
    try {
      await postTopic(values);
      notifications.show({
        title: t("common.success"),
        message: t("topics.topicAdded"),
        color: "green",
      });
      form.reset();
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("common.serverError"),
        color: "red",
      });
    }
  };

  return { form, handleSubmit, uploadIcon };
};
