import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../api/api";
import type { AnswersMap } from "../types";

interface UseQuizSessionOptions<T> {
  apiUrl: string;
  requestData: Record<string, unknown>;
  errorKey?: string;
  initialData?: T | null;
}

interface UseQuizSessionReturn<T> {
  examData: T | null;
  loading: boolean;
  error: string | null;
  answers: AnswersMap;
  handleAnswerSelect: (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number,
  ) => void;
  handleReset: () => void;
  handleRetry: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

export function useQuizSession<T>(
  options: UseQuizSessionOptions<T>,
): UseQuizSessionReturn<T> {
  const { apiUrl, requestData, errorKey = "exam.startError", initialData = null } = options;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [examData, setExamData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersMap>({});

  const hasFetched = useRef(false);

  const startSession = useCallback(
    async (isRetry = false) => {
      if (hasFetched.current && !isRetry) return;
      hasFetched.current = true;

      setLoading(true);
      setError(null);

      try {
        const response = await api.post<T>(apiUrl, requestData);
        if (response.data) {
          setExamData(response.data);
        }
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || t(errorKey);

        setError(errorMessage);
        notifications.show({
          title: t("common.error"),
          message: errorMessage,
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiUrl],
  );

  useEffect(() => {
    if (!initialData) {
      startSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnswerSelect = useCallback(
    (questionIndex: number, optionIndex: number, timeSpentSeconds: number) => {
      setAnswers((prev) => ({
        ...prev,
        [questionIndex]: { optionIndex, timeSpentSeconds },
      }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setAnswers({});
  }, []);

  const handleRetry = useCallback(() => {
    startSession(true);
  }, [startSession]);

  return {
    examData,
    loading,
    error,
    answers,
    handleAnswerSelect,
    handleReset,
    handleRetry,
    navigate,
  };
}
