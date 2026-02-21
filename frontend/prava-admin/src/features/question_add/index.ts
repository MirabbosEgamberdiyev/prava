// src/features/add_question/index.ts

// 1. Asosiy UI komponentasini eksport qilish
export { QuestionForm } from "./components/QuestionForm";
export { JsonBulkUploadQuestion } from "./components/JsonBulkUpload";

// 2. Agar sahifa darajasida hook ishlatish kerak bo'lsa (masalan, reset qilish uchun)
export { useAddQuestionForm } from "./hooks/useAddQuestionForm";

// 3. Tiplarni eksport qilish (ixtiyoriy, agar boshqa joyda kerak bo'lsa)
export type { QuestionFormValues } from "./types";
