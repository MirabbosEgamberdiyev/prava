import api from "./api";
import type {
  Question,
  QuestionResponse,
  CreateQuestionDTO,
  UpdateQuestionDTO,
} from "../features/question/types";

/**
 * Question Service - barcha CRUD operatsiyalar
 * Hozirgi kodingizga qo'shimcha, buzilmaydi
 */

class QuestionService {
  private baseUrl = "/api/v1/admin/questions";

  /**
   * Barcha savollarni olish (pagination bilan)
   * Hozirgi useQuestions hook bilan ishlaydi
   */
  async getAll(params: {
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: "ASC" | "DESC";
  }): Promise<QuestionResponse> {
    const {
      page = 0,
      size = 20,
      sortBy = "createdAt",
      direction = "DESC",
    } = params;
    const response = await api.get<QuestionResponse>(
      `${this.baseUrl}?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`,
    );
    return response.data;
  }

  /**
   * ID bo'yicha bitta savolni olish
   */
  async getById(id: number): Promise<Question> {
    const response = await api.get<{ success: boolean; data: Question }>(
      `${this.baseUrl}/${id}`,
    );
    return response.data.data;
  }

  /**
   * Mavzu bo'yicha savollarni olish
   */
  async getByTopic(topicId: number, params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const response = await api.get<QuestionResponse>(
      `${this.baseUrl}/topic/${topicId}?page=${page}&size=${size}`,
    );
    return response.data;
  }

  /**
   * Qiyinlik darajasi bo'yicha
   */
  async getByDifficulty(
    difficulty: "EASY" | "MEDIUM" | "HARD",
    params?: { page?: number; size?: number },
  ) {
    const { page = 0, size = 20 } = params || {};
    const response = await api.get<QuestionResponse>(
      `${this.baseUrl}/by-difficulty/${difficulty}?page=${page}&size=${size}`,
    );
    return response.data;
  }

  /**
   * Qidiruv
   */
  async search(query: string, params?: { page?: number; size?: number }) {
    const { page = 0, size = 20 } = params || {};
    const response = await api.get<QuestionResponse>(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`,
    );
    return response.data;
  }

  /**
   * YANGI SAVOL YARATISH
   * JSON formatida (application/json)
   */
  async create(data: CreateQuestionDTO): Promise<Question> {
    const response = await api.post<{ success: boolean; data: Question }>(
      this.baseUrl,
      data,
    );

    return response.data.data;
  }

  /**
   * SAVOLNI YANGILASH
   * JSON formatida (application/json)
   */
  async update(id: number, data: UpdateQuestionDTO): Promise<Question> {
    const response = await api.put<{ success: boolean; data: Question }>(
      `${this.baseUrl}/${id}`,
      data,
    );

    return response.data.data;
  }

  /**
   * Faqat rasmni yangilash
   */
  async updateImage(id: number, image: File): Promise<Question> {
    const formData = new FormData();
    formData.append("imageFile", image);

    const response = await api.patch<{ success: boolean; data: Question }>(
      `${this.baseUrl}/${id}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.data;
  }

  /**
   * SAVOLNI O'CHIRISH
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Savol rasmini o'chirish
   */
  async deleteImage(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}/image`);
  }

  /**
   * Savol statusini o'zgartirish (active/inactive)
   */
  async toggleStatus(id: number): Promise<Question> {
    const response = await api.patch<{ success: boolean; data: Question }>(
      `${this.baseUrl}/${id}/toggle`,
    );
    return response.data.data;
  }

  /**
   * Faol savollarni olish
   */
  async getActive() {
    const response = await api.get(`${this.baseUrl}/active`);
    return response.data;
  }

  /**
   * Tasodifiy savollar
   */
  async getRandom(count = 10, topicId?: number) {
    let url = `${this.baseUrl}/random?count=${count}`;
    if (topicId) url += `&topicId=${topicId}`;
    const response = await api.get(url);
    return response.data;
  }

  /**
   * Mavzu bo'yicha savollar soni
   */
  async getTopicCount(topicId: number) {
    const response = await api.get(`${this.baseUrl}/topic/${topicId}/count`);
    return response.data;
  }

  /**
   * Past natijali savollar statistikasi
   */
  async getLowSuccessQuestions(threshold = 50, limit = 20) {
    const response = await api.get(
      `${this.baseUrl}/statistics/low-success?threshold=${threshold}&limit=${limit}`,
    );
    return response.data;
  }

  /**
   * Eng ko'p ishlatiladigan savollar
   */
  async getMostUsedQuestions(limit = 20) {
    const response = await api.get(`${this.baseUrl}/statistics/most-used?limit=${limit}`);
    return response.data;
  }

  /**
   * Mavzu bo'yicha savollar soni (statistika)
   */
  async getCountByTopic(topicId: number) {
    const response = await api.get(`${this.baseUrl}/statistics/count-by-topic/${topicId}`);
    return response.data;
  }

  /**
   * Barcha mavzular bo'yicha savol statistikasi
   */
  async getStatsByTopic() {
    const response = await api.get(`${this.baseUrl}/statistics/by-topic`);
    return response.data;
  }
}

// Singleton instance
export const questionService = new QuestionService();
export default questionService;
