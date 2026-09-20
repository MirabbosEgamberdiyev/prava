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
  image_file?: string;
  imageUrl?: string | null;
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
  image_file?: string;
  imageUrl?: string | null;
}

export interface TrafficRule {
  id: number;
  chapter_num: number;
  title_uzl: string;
  title_uzc?: string;
  title_ru?: string;
  content_html_uzl: string;
  content_html_uzc?: string;
  content_html_ru?: string;
}

export interface PracticalPenalty {
  id: number;
  penalty_number: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | string;
  points: number;
  text_uzl: string;
  text_uzc?: string;
  text_ru?: string;
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
  max_penalty_points: number;
  image_url?: string;
}

export interface ExamCenter {
  id: number;
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
  price_theory?: string;
  price_practical?: string;
}
