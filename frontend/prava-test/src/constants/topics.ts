import type { OfflineTopic } from "../types/desktop";

/**
 * 10 Official IIV YHXBB Examination Topics with 100% complete translations across all 3 languages (UZ-LATIN, UZ-CYRILLIC, RU, EN).
 * Acts as guaranteed fallback so topic names never show raw IDs or break during language switching.
 */
export const OFFICIAL_TOPICS: OfflineTopic[] = [
  {
    id: 1,
    code: "road_signs",
    name_uzl: "Yo'l belgilari",
    name_uzc: "Йўл белгилари",
    name_ru: "Дорожные знаки",
    name_en: "Road Signs",
    question_count: 20,
  },
  {
    id: 2,
    code: "road_markings",
    name_uzl: "Yo'l chiziqlari",
    name_uzc: "Йўл чизиқлари",
    name_ru: "Дорожная разметка",
    name_en: "Road Markings",
    question_count: 20,
  },
  {
    id: 3,
    code: "traffic_lights",
    name_uzl: "Svetofor va tartibga soluvchi",
    name_uzc: "Светофор ва тартибга солувчи",
    name_ru: "Светофор и регулировщик",
    name_en: "Traffic Lights & Controllers",
    question_count: 20,
  },
  {
    id: 4,
    code: "intersections",
    name_uzl: "Chorrahada harakatlanish",
    name_uzc: "Чорраҳада ҳаракатланиш",
    name_ru: "Проезд перекрёстков",
    name_en: "Intersections",
    question_count: 20,
  },
  {
    id: 5,
    code: "overtaking",
    name_uzl: "Quvib o'tish",
    name_uzc: "Қувиб ўтиш",
    name_ru: "Обгон и опережение",
    name_en: "Overtaking",
    question_count: 20,
  },
  {
    id: 6,
    code: "stopping_parking",
    name_uzl: "To'xtash va turish",
    name_uzc: "Тўхташ ва туриш",
    name_ru: "Остановка и стоянка",
    name_en: "Stopping & Parking",
    question_count: 20,
  },
  {
    id: 7,
    code: "pedestrians",
    name_uzl: "Piyodalar va maxsus yo'laklar",
    name_uzc: "Пиёдалар ва махсус йўлаклар",
    name_ru: "Пешеходы и спецполосы",
    name_en: "Pedestrians & Special Lanes",
    question_count: 20,
  },
  {
    id: 8,
    code: "first_aid",
    name_uzl: "Tibbiy yordam",
    name_uzc: "Тиббий ёрдам",
    name_ru: "Первая медицинская помощь",
    name_en: "First Aid",
    question_count: 20,
  },
  {
    id: 9,
    code: "vehicle_tech",
    name_uzl: "Transport vositasi texnik holati",
    name_uzc: "Транспорт воситаси техник ҳолати",
    name_ru: "Техническое состояние ТС",
    name_en: "Vehicle Technical Condition",
    question_count: 20,
  },
  {
    id: 10,
    code: "general_rules",
    name_uzl: "Umumiy qoidalar",
    name_uzc: "Умумий қоидалар",
    name_ru: "Общие правила",
    name_en: "General Rules",
    question_count: 20,
  },
];

export const OFFICIAL_TOPIC_MAP: Record<number, OfflineTopic> = Object.fromEntries(
  OFFICIAL_TOPICS.map((tp) => [tp.id, tp])
);
