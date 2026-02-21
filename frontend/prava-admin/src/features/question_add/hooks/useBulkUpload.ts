/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { uploadBulkQuestions } from "../services/bulkQuestionApi";

export const useBulkUpload = () => {
  const { t } = useTranslation();
  const [jsonContent, setJsonContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBulkSubmit = async () => {
    if (!jsonContent.trim()) return;

    try {
      setLoading(true);

      const parsedData = JSON.parse(jsonContent);

      let payload;
      if (Array.isArray(parsedData)) {
        payload = { questions: parsedData };
      } else if (parsedData.questions && Array.isArray(parsedData.questions)) {
        payload = parsedData;
      } else {
        throw new Error(t("questions.jsonFormatError"));
      }

      await uploadBulkQuestions(payload);

      notifications.show({
        title: t("common.success"),
        message: t("questions.bulkUploaded", { count: payload.questions.length }),
        color: "green",
      });

      navigate("/questions");
    } catch (err: any) {
      notifications.show({
        title: t("common.error"),
        message: err.message || t("questions.jsonSyntaxError"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return { jsonContent, setJsonContent, handleBulkSubmit, loading };
};
