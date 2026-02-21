/* eslint-disable @typescript-eslint/no-explicit-any */
// features/ticket/types/index.ts

export interface TranslatedField {
  uzl: string;
  uzc: string;
  en: string;
  ru: string;
}

export interface TicketTranslations {
  nameUzl: string;
  nameUzc: string;
  nameEn: string;
  nameRu: string;
  descriptionUzl: string;
  descriptionUzc: string;
  descriptionEn: string;
  descriptionRu: string;
}

export interface TicketFormData extends TicketTranslations {
  ticketNumber: number;
  packageId: number;
  topicId: number;
  questionIds: number[];
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
}

export interface TicketListItem {
  id: number;
  ticketNumber: number;
  name: TranslatedField;
  description: TranslatedField;
  packageId: number;
  packageName: TranslatedField;
  topicId: number;
  topicName: TranslatedField;
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
  questionIds: number[];
}

export interface TicketDetail extends TicketListItem {
  nameUzl?: string;
  nameUzc?: string;
  nameEn?: string;
  nameRu?: string;
  descriptionUzl?: string;
  descriptionUzc?: string;
  descriptionEn?: string;
  descriptionRu?: string;
}

export interface ApiError {
  field: string;
  message: string;
  rejectedValue: any;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TicketListResponse {
  success: boolean;
  message: string;
  data: {
    content: TicketListItem[];
  } & PaginationMeta;
  timestamp: string;
  path: string;
  errors?: ApiError[];
}

export interface TicketDetailResponse {
  success: boolean;
  message: string;
  data: TicketDetail;
  timestamp: string;
  path: string;
  errors?: ApiError[];
}
