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

export const curriculumApi = {
  getStats: async (): Promise<CurriculumStats> => {
    try {
      const res = await api.get("/api/v1/curriculum/stats");
      const data = res.data?.data ?? res.data;
      return (
        data && typeof data === "object"
          ? data
          : {
              totalQuestions: 1234,
              totalTickets: 63,
              totalTopics: 44,
              totalSigns: 297,
              totalMarkings: 47,
              totalExamCenters: 14,
              totalPracticalExercises: 12,
              totalPenalties: 32,
            }
      );
    } catch {
      return {
        totalQuestions: 1234,
        totalTickets: 63,
        totalTopics: 44,
        totalSigns: 297,
        totalMarkings: 47,
        totalExamCenters: 14,
        totalPracticalExercises: 12,
        totalPenalties: 32,
      };
    }
  },

  getSigns: async (category?: string, search?: string): Promise<RoadSign[]> => {
    try {
      const res = await api.get("/api/v1/curriculum/signs", {
        params: { category, search },
      });
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error("Error in getSigns:", err);
      return [];
    }
  },

  getMarkings: async (type?: string): Promise<RoadMarking[]> => {
    try {
      const res = await api.get("/api/v1/curriculum/markings", {
        params: { type },
      });
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error("Error in getMarkings:", err);
      return [];
    }
  },

  getExamCenters: async (): Promise<ExamCenter[]> => {
    try {
      const res = await api.get("/api/v1/curriculum/exam-centers");
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error("Error in getExamCenters:", err);
      return [];
    }
  },

  getPracticalExam: async (): Promise<{
    exercises: PracticalExercise[];
    penalties: PracticalPenalty[];
  }> => {
    try {
      const res = await api.get("/api/v1/curriculum/practical-exam");
      const payload = res.data?.data ?? res.data;
      return {
        exercises: Array.isArray(payload?.exercises) ? payload.exercises : [],
        penalties: Array.isArray(payload?.penalties) ? payload.penalties : [],
      };
    } catch (err) {
      console.error("Error in getPracticalExam:", err);
      return { exercises: [], penalties: [] };
    }
  },

  getPenalties: async (): Promise<PracticalPenalty[]> => {
    try {
      const res = await api.get("/api/v1/curriculum/penalties");
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error("Error in getPenalties:", err);
      return [];
    }
  },

  getRules: async (): Promise<TrafficRule[]> => {
    try {
      const res = await api.get("/api/v1/curriculum/rules");
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      console.error("Error in getRules:", err);
      return [];
    }
  },
};
