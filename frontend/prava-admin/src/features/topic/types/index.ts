export interface Topic {
  id: number;
  code: string;
  nameUzl: string;
  nameUzc: string;
  nameEn: string;
  nameRu: string;
  descriptionUzl: string;
  descriptionUzc: string;
  descriptionEn: string;
  descriptionRu: string;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  name: string; // Qo'shimcha maydon: hozirgi tilga mos nom
  description: string; // Qo'shimcha maydon: hozirgi tilga mos tavsif
}

// Backenddan keladigan pagination qismi
export interface TopicPageContent {
  content: Topic[];
  totalElements: number;
  totalPages: number;
  size: number;
  page: number;
}

// Eng tashqi qobiq (Sizning holatingizda data.data)
export interface TopicResponse {
  data: TopicPageContent; // Mana shu joyda "data" ichida pagination borligini aytyapmiz
  message?: string;
  status?: number;
}
