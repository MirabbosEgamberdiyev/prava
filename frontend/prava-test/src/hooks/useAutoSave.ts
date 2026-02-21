import { useEffect, useRef, useCallback } from "react";
import api from "../api/api";
import type { AnswersMap } from "../types/api";

const AUTOSAVE_INTERVAL = 30_000; // 30 seconds
const LOCAL_STORAGE_KEY = "prava_autosave_";

interface UseAutoSaveOptions {
  sessionId: number | null;
  answers: AnswersMap;
  questions: Array<{ id: number }>;
  enabled: boolean;
}

/**
 * Auto-saves exam answers to the server every 30 seconds.
 * Falls back to localStorage when offline and syncs when back online.
 */
export function useAutoSave({ sessionId, answers, questions, enabled }: UseAutoSaveOptions) {
  const lastSavedRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  const saveToServer = useCallback(
    async (answersToSave: AnswersMap) => {
      if (!sessionId || isSavingRef.current) return;
      isSavingRef.current = true;

      // Map question indices to actual question IDs
      const answersList = Object.entries(answersToSave).map(
        ([questionIndex, answer]) => ({
          questionId: questionsRef.current[Number(questionIndex)]?.id ?? Number(questionIndex),
          selectedOptionIndex: answer.optionIndex,
          timeSpentSeconds: answer.timeSpentSeconds,
        }),
      );

      if (answersList.length === 0) return;

      try {
        await api.put(`/api/v2/exams/${sessionId}/autosave`, {
          answers: answersList,
        });
        // Clear localStorage backup on successful save
        localStorage.removeItem(LOCAL_STORAGE_KEY + sessionId);
      } catch {
        // Save to localStorage as fallback
        localStorage.setItem(
          LOCAL_STORAGE_KEY + sessionId,
          JSON.stringify(answersToSave),
        );
      } finally {
        isSavingRef.current = false;
      }
    },
    [sessionId],
  );

  // Auto-save interval
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const interval = setInterval(() => {
      const serialized = JSON.stringify(answers);
      if (serialized !== lastSavedRef.current && Object.keys(answers).length > 0) {
        lastSavedRef.current = serialized;
        if (navigator.onLine) {
          saveToServer(answers);
        } else {
          localStorage.setItem(
            LOCAL_STORAGE_KEY + sessionId,
            JSON.stringify(answers),
          );
        }
      }
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, sessionId, answers, saveToServer]);

  // Save on visibility change (tab switching / closing)
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && Object.keys(answers).length > 0) {
        if (navigator.onLine) {
          saveToServer(answers);
        } else {
          localStorage.setItem(
            LOCAL_STORAGE_KEY + sessionId,
            JSON.stringify(answers),
          );
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, sessionId, answers, saveToServer]);

  // Sync localStorage backup when coming back online
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const handleOnline = () => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY + sessionId);
      if (saved) {
        try {
          const parsedAnswers = JSON.parse(saved) as AnswersMap;
          saveToServer(parsedAnswers);
        } catch {
          localStorage.removeItem(LOCAL_STORAGE_KEY + sessionId);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [enabled, sessionId, saveToServer]);

  return { saveToServer };
}
