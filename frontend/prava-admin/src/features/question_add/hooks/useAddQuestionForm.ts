/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { postQuestion } from "../services/addQuestionApi";
import api from "../../../services/api";

export const useAddQuestionForm = () => {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      textUzl: "",
      textUzc: "",
      textEn: "",
      textRu: "",
      explanationUzl: "",
      explanationUzc: "",
      explanationEn: "",
      explanationRu: "",
      topicId: null as number | null,
      difficulty: "MEDIUM",
      options: [
        { optionIndex: 0, textUzl: "", textUzc: "", textEn: "", textRu: "" },
        { optionIndex: 1, textUzl: "", textUzc: "", textEn: "", textRu: "" },
      ],
      correctAnswerIndex: 0,
      imageUrl: "",
      isActive: true,
    },

    validate: {},
  });

  // --- RASM YUKLASH (FILE UPLOAD) ---
  const uploadFile = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/v1/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Backenddan qaytgan URL: res.data.data.fileUrl
      const uploadedUrl = res.data.data?.fileUrl || res.data;

      if (uploadedUrl) {
        form.setFieldValue("imageUrl", uploadedUrl);
        notifications.show({
          title: t("common.success"),
          message: t("questions.imageUploaded"),
          color: "green",
        });
      }
    } catch (error) {
      notifications.show({
        title: t("common.error"),
        message: t("questions.imageUploadError"),
        color: "red",
      });
    }
  };

  // --- SUBMIT (JSON PAYLOAD TAYYORLASH) ---
  const handleSubmit = async (values: typeof form.values) => {
    const options = values.options
      .filter((opt) => opt.textUzl?.trim())
      .map((opt, idx) => ({
        optionIndex: idx,
        textUzl: opt.textUzl || null,
        textUzc: opt.textUzc || null,
        textEn: opt.textEn || null,
        textRu: opt.textRu || null,
      }));

    const finalPayload = {
      textUzl: values.textUzl || null,
      textUzc: values.textUzc || null,
      textEn: values.textEn || null,
      textRu: values.textRu || null,
      explanationUzl: values.explanationUzl || null,
      explanationUzc: values.explanationUzc || null,
      explanationEn: values.explanationEn || null,
      explanationRu: values.explanationRu || null,
      topicId: values.topicId || null,
      difficulty: (values.difficulty as "EASY" | "MEDIUM" | "HARD") || null,
      options: options.length > 0 ? options : null,
      correctAnswerIndex: options.length > 0 ? values.correctAnswerIndex : null,
      imageUrl: values.imageUrl && values.imageUrl.trim() !== "" ? values.imageUrl : null,
      isActive: values.isActive,
    };

    try {
      await postQuestion(finalPayload);
      notifications.show({
        title: t("common.success"),
        message: t("questions.questionAdded"),
        color: "green",
        withBorder: true,
      });
      form.reset();
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("common.serverError"),
        color: "red",
        withBorder: true,
      });
    }
  };

  const addOption = () => {
    if (form.values.options.length < 6) {
      form.insertListItem("options", {
        optionIndex: form.values.options.length,
        textUzl: "",
        textUzc: "",
        textEn: "",
        textRu: "",
      });
    }
  };

  const removeOption = (index: number) => {
    if (form.values.options.length > 2) {
      form.removeListItem("options", index);

      if (form.values.correctAnswerIndex === index) {
        form.setFieldValue("correctAnswerIndex", 0);
      } else if (form.values.correctAnswerIndex > index) {
        form.setFieldValue(
          "correctAnswerIndex",
          form.values.correctAnswerIndex - 1
        );
      }
    }
  };

  return { form, addOption, removeOption, handleSubmit, uploadFile };
};
