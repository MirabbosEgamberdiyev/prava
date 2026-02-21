/* eslint-disable @typescript-eslint/no-explicit-any */
// features/package/types/index.ts

export const GenerationType = {
  MANUAL: "MANUAL",
  AUTO: "AUTO",
} as const;
export type GenerationType = (typeof GenerationType)[keyof typeof GenerationType];

export interface PackageTranslations {
  nameUzl: string;
  nameUzc: string;
  nameEn: string;
  nameRu: string;
  descriptionUzl: string;
  descriptionUzc: string;
  descriptionEn: string;
  descriptionRu: string;
}

export interface PackageFormData extends PackageTranslations {
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
  generationType: GenerationType;
  topicId: number;
  isFree: boolean;
  price: number;
  orderIndex: number;
  isActive: boolean;
  questionIds: number[];
}

export interface PackageListItem {
  id: number;
  name: string;
  description: string;
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
  generationType: GenerationType;
  topic: string;
  topicName: string;
  isActive: boolean;
  isFree: boolean;
  price: number;
  orderIndex: number;
  actualQuestionCount: number;
}

export interface PackageDetail extends PackageListItem {
  topicId?: number;
  nameUzl?: string;
  nameUzc?: string;
  nameEn?: string;
  nameRu?: string;
  descriptionUzl?: string;
  descriptionUzc?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  questionIds?: number[];
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

export interface PackageListResponse {
  success: boolean;
  message: string;
  data: {
    content: PackageListItem[];
  } & PaginationMeta;
  timestamp: string;
  path: string;
  errors?: ApiError[];
}

export interface PackageDetailResponse {
  success: boolean;
  message: string;
  data: PackageDetail;
  timestamp: string;
  path: string;
  errors?: ApiError[];
}

export interface PackageFilters {
  topicId?: number;
  isFree?: boolean;
  isActive?: boolean;
  generationType?: GenerationType;
  search?: string;
}

export interface PackageTableColumn {
  key: keyof PackageListItem;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: PackageListItem) => React.ReactNode;
}
