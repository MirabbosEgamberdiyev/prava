import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../api/api";
import { EXAM_API, EXAM_DEFAULTS } from "../constants";
import type { ExamData, AnswersRecord, ExamStartRequest } from "../types";

interface UseExamOptions {
  questionCount?: number;
  durationMinutes?: number;
}

interface UseExamReturn {
  examData: ExamData | null;
  loading: boolean;
  error: string | null;
  answers: AnswersRecord;
  handleAnswerSelect: (
    questionIndex: number,
    optionIndex: number,
    timeSpentSeconds: number
  ) => void;
  handleReset: () => void;
  handleRetry: () => void;
  navigate: ReturnType<typeof useNavigate>;
}

export function useExam(options: UseExamOptions = {}): UseExamReturn {
  const {
    questionCount = EXAM_DEFAULTS.QUESTION_COUNT,
    durationMinutes = EXAM_DEFAULTS.DURATION_MINUTES,
  } = options;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswersRecord>({});

  // API faqat bir marta chaqirilishi uchun ref
  const hasFetched = useRef(false);

  const startExam = useCallback(
    async (isRetry = false) => {
      // Faqat birinchi marta yoki qayta urinishda ishlaydi
      if (hasFetched.current && !isRetry) return;
      hasFetched.current = true;

      setLoading(true);
      setError(null);

      try {
        const requestData: ExamStartRequest = {
          questionCount,
          durationMinutes,
        };

        const response = await api.post<ExamData>(
          EXAM_API.START_VISIBLE,
          requestData
        );

        if (response.data) {
          setExamData(response.data);
        }
      } catch (err: unknown) {
        const errorMessage =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || t("exam.startError");

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
    // t ni dependency dan olib tashladik - re-render oldini olish uchun
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questionCount, durationMinutes]
  );

  useEffect(() => {
    startExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Javobni saqlash funksiyasi
  const handleAnswerSelect = useCallback(
    (questionIndex: number, optionIndex: number, timeSpentSeconds: number) => {
      setAnswers((prev) => ({
        ...prev,
        [questionIndex]: { optionIndex, timeSpentSeconds },
      }));
    },
    []
  );

  // Javoblarni tozalash
  const handleReset = useCallback(() => {
    setAnswers({});
  }, []);

  // Qayta urinish
  const handleRetry = useCallback(() => {
    startExam(true);
  }, [startExam]);

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
