export interface TopicFormValues {
  code: string;
  nameUzl: string;
  nameUzc: string;
  nameEn: string;
  nameRu: string;
  descriptionUzl: string;
  descriptionUzc: string;
  descriptionEn: string;
  descriptionRu: string;
  iconUrl: string | null; // Rasm bo'lmasa null bo'lishi uchun
  displayOrder: number;
  isActive: boolean;
}
