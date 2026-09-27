import api from "../api/api";

export interface CurriculumStats {
  totalQuestions: number;
  totalTickets: number;
  totalTopics: number;
  totalSigns: number;
  totalMarkings: number;
  totalExamCenters: number;
  totalPracticalExercises: number;
  totalPenalties: number;
}

export interface RoadSign {
  id: number;
  code: string;
  category: string;
  number_in_category?: number;
  title_uzl: string;
  title_uzc?: string;
  title_ru?: string;
  description_uzl?: string;
  description_uzc?: string;
  description_ru?: string;
  imageUrl?: string;
}

export interface RoadMarking {
  id: number;
  code: string;
  marking_type: string;
  title_uzl: string;
  title_uzc?: string;
  title_ru?: string;
  description_uzl?: string;
  description_uzc?: string;
  description_ru?: string;
  imageUrl?: string;
}

export interface ExamCenter {
  id: string;
  region_uzl: string;
  region_uzc?: string;
  region_ru?: string;
  address_uzl: string;
  address_uzc?: string;
  address_ru?: string;
  lat?: number;
  lng?: number;
  map_url?: string;
  phones?: string;
  work_days?: string;
  work_hours?: string;
  transport_uzl?: string;
  transport_uzc?: string;
  transport_ru?: string;
  price_theory?: number;
  price_practical?: number;
}

export interface PracticalExercise {
  id: number;
  exercise_number: number;
  title_uzl: string;
  title_uzc?: string;
  title_ru?: string;
  description_uzl?: string;
  description_uzc?: string;
  description_ru?: string;
  max_penalty_points?: number;
  image_url?: string;
}

export interface PracticalPenalty {
  id: number;
  penalty_number: number;
  severity?: string;
  points: number;
  text_uzl: string;
  text_uzc?: string;
  text_ru?: string;
}

export interface TrafficRule {
  id: number;
  chapter_num: number;
  title_uzl: string;
  title_uzc?: string;
  title_ru?: string;
  content_html_uzl?: string;
  content_html_uzc?: string;
  content_html_ru?: string;
}

/**
 * Curriculum API. Barcha getterlar tarmoq/server xatolarida THROW qiladi (xatoni yutib
 * bo'sh ro'yxat qaytarmaydi) — sahifalar "yuklanmoqda / xato + qayta urinish / bo'sh"
 * holatlarini alohida ko'rsatishi uchun.
 */
function unwrap(res: { data?: unknown }): unknown {
  const body = res?.data as { data?: unknown } | undefined;
  return body && typeof body === "object" && "data" in body ? body.data : body;
}

function asArray<T>(payload: unknown): T[] {
  return Array.isArray(payload) ? (payload as T[]) : [];
}

export const curriculumApi = {
  getStats: async (): Promise<CurriculumStats> => {
    const res = await api.get("/api/v1/curriculum/stats");
    const data = unwrap(res);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid curriculum stats payload");
    }
    return data as CurriculumStats;
  },

  getSigns: async (category?: string, search?: string): Promise<RoadSign[]> => {
    const res = await api.get("/api/v1/curriculum/signs", {
      params: { category, search },
    });
    return asArray<RoadSign>(unwrap(res));
  },

  getMarkings: async (type?: string): Promise<RoadMarking[]> => {
    const res = await api.get("/api/v1/curriculum/markings", {
      params: { type },
    });
    return asArray<RoadMarking>(unwrap(res));
  },

  getExamCenters: async (): Promise<ExamCenter[]> => {
    const res = await api.get("/api/v1/curriculum/exam-centers");
    return asArray<ExamCenter>(unwrap(res));
  },

  getPracticalExam: async (): Promise<{
    exercises: PracticalExercise[];
    penalties: PracticalPenalty[];
  }> => {
    const res = await api.get("/api/v1/curriculum/practical-exam");
    const payload = unwrap(res) as { exercises?: unknown; penalties?: unknown } | null | undefined;
    return {
      exercises: asArray<PracticalExercise>(payload?.exercises),
      penalties: asArray<PracticalPenalty>(payload?.penalties),
    };
  },

  getPenalties: async (): Promise<PracticalPenalty[]> => {
    const res = await api.get("/api/v1/curriculum/penalties");
    return asArray<PracticalPenalty>(unwrap(res));
  },

  getRules: async (): Promise<TrafficRule[]> => {
    const res = await api.get("/api/v1/curriculum/rules");
    return asArray<TrafficRule>(unwrap(res));
  },
};
