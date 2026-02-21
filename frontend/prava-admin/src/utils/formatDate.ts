// src/utils/formatDate.ts

export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Agarda sana noto'g'ri bo'lsa, xato bermasligi uchun
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
