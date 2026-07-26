/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { postQuestion } from "../services/addQuestionApi";
import api from "../../../services/api";

// Rasm yuklash chegarasi — backend 413 qaytarishidan oldin foydalanuvchiga aytamiz
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export const useAddQuestionForm = () => {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
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

    // Ilgari `validate: {}` edi — bo'sh savolni ham serverga yuborish mumkin edi.
    validate: {
      textUzl: (value) =>
        !value?.trim() ? t("validation.questionRequired") : null,
      topicId: (value) => (!value ? t("validation.topicIdRequired") : null),
      options: {
        // To'g'ri javob sifatida belgilangan variant bo'sh qolmasin
        textUzl: (value, values, path) => {
          const index = Number(path.split(".")[1]);
          if (index === values.correctAnswerIndex && !value?.trim()) {
            return t("validation.textRequired");
          }
          return null;
        },
      },
    },
  });

  // --- RASM YUKLASH (FILE UPLOAD) ---
  const uploadFile = async (file: File | null) => {
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notifications.show({
        title: t("common.error"),
        message: t("questions.imageUploadError"),
        color: "red",
      });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      notifications.show({
        title: t("common.error"),
        message: t("questions.imageUploadError"),
        color: "red",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "questions");

    setUploading(true);
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
    } finally {
      setUploading(false);
    }
  };

  // --- SUBMIT (JSON PAYLOAD TAYYORLASH) ---
  const handleSubmit = async (values: typeof form.values) => {
    // Ikki marta bosishdan himoya (race condition → dublikat savol)
    if (submitting) return;

    // MUHIM: bo'sh variantlar filtrlanganda indekslar siljiydi. Ilgari
    // correctAnswerIndex eski (filtrlashdan oldingi) indeks bilan yuborilardi —
    // natijada noto'g'ri javob to'g'ri deb saqlanardi. Endi yangi indeksga
    // qayta xaritalaymiz.
    const keptOriginalIndexes: number[] = [];
    const options = values.options
      .map((opt, originalIdx) => ({ opt, originalIdx }))
      .filter(({ opt }) => opt.textUzl?.trim())
      .map(({ opt, originalIdx }, idx) => {
        keptOriginalIndexes.push(originalIdx);
        return {
          optionIndex: idx,
          textUzl: opt.textUzl || null,
          textUzc: opt.textUzc || null,
          textEn: opt.textEn || null,
          textRu: opt.textRu || null,
        };
      });

    const remappedCorrectIndex = keptOriginalIndexes.indexOf(
      values.correctAnswerIndex,
    );

    if (options.length < 2 || remappedCorrectIndex < 0) {
      notifications.show({
        title: t("common.error"),
        message: t("validation.textRequired"),
        color: "red",
      });
      return;
    }

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
      options,
      correctAnswerIndex: remappedCorrectIndex,
      imageUrl: values.imageUrl && values.imageUrl.trim() !== "" ? values.imageUrl : null,
      isActive: values.isActive,
    };

    setSubmitting(true);
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
    } finally {
      setSubmitting(false);
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

  return {
    form,
    addOption,
    removeOption,
    handleSubmit,
    uploadFile,
    submitting,
    uploading,
  };
};
