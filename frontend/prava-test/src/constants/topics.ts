import type { OfflineTopic } from "../types/desktop";

/**
 * 44 Official IIV YHXBB Examination Topics with 100% complete translations across all languages (UZ-LATIN, UZ-CYRILLIC, RU, EN).
 * Acts as guaranteed fallback so topic names never show raw IDs or break during language switching.
 */
export const OFFICIAL_TOPICS: OfflineTopic[] = [
  {
    id: 1,
    code: "general_rules",
    name_uzl: "Umumiy qoidalar",
    name_uzc: "Умумий қоидалар",
    name_ru: "Общие положения",
    name_en: "General Provisions",
    question_count: 41,
  },
  {
    id: 2,
    code: "drivers_duties",
    name_uzl: "Haydovchilarning umumiy vazifalari",
    name_uzc: "Ҳайдовчиларнинг умумий вазифалари",
    name_ru: "Общие обязанности водителей",
    name_en: "General Duties of Drivers",
    question_count: 13,
  },
  {
    id: 3,
    code: "pedestrians_duties",
    name_uzl: "Piyodalarning umumiy vazifalari",
    name_uzc: "Пиёдаларнинг умумий вазифалари",
    name_ru: "Обязанности пешеходов",
    name_en: "Duties of Pedestrians",
    question_count: 18,
  },
  {
    id: 4,
    code: "special_vehicles_priority",
    name_uzl: "Maxsus transport vositalarining imtiyozlari",
    name_uzc: "Махсус транспорт воситаларининг имтиёзлари",
    name_ru: "Приоритет специальных транспортных средств",
    name_en: "Priority of Special Vehicles",
    question_count: 10,
  },
  {
    id: 5,
    code: "warning_signs",
    name_uzl: "Ogohlantiruvchi belgilar",
    name_uzc: "Огоҳлантирувчи белгилар",
    name_ru: "Предупреждающие знаки",
    name_en: "Warning Signs",
    question_count: 38,
  },
  {
    id: 6,
    code: "priority_signs",
    name_uzl: "Imtiyoz belgilari",
    name_uzc: "Имтиёз белгилари",
    name_ru: "Знаки приоритета",
    name_en: "Priority Signs",
    question_count: 23,
  },
  {
    id: 7,
    code: "prohibitory_signs",
    name_uzl: "Taqiqlovchi belgilar",
    name_uzc: "Тақиқловчи белгилар",
    name_ru: "Запрещающие знаки",
    name_en: "Prohibitory Signs",
    question_count: 59,
  },
  {
    id: 8,
    code: "mandatory_signs",
    name_uzl: "Buyuruvchi belgilar",
    name_uzc: "Буюрувчи белгилар",
    name_ru: "Предписывающие знаки",
    name_en: "Mandatory Signs",
    question_count: 32,
  },
  {
    id: 9,
    code: "informative_signs",
    name_uzl: "Axborot-koʻrsatkich belgilari",
    name_uzc: "Ахборот-кўрсаткич белгилари",
    name_ru: "Информационно-указательные знаки",
    name_en: "Information and Direction Signs",
    question_count: 60,
  },
  {
    id: 10,
    code: "service_signs",
    name_uzl: "Servis belgilari",
    name_uzc: "Сервис белгилари",
    name_ru: "Знаки сервиса",
    name_en: "Service Signs",
    question_count: 1,
  },
  {
    id: 11,
    code: "additional_signs",
    name_uzl: "Qoʻshimcha axborot belgilari",
    name_uzc: "Қўшимча ахборот белгилари",
    name_ru: "Знаки дополнительной информации (таблички)",
    name_en: "Additional Information Signs",
    question_count: 38,
  },
  {
    id: 12,
    code: "horizontal_markings",
    name_uzl: "Yotiq chiziqlar",
    name_uzc: "Ётиқ чизиқлар",
    name_ru: "Горизонтальная разметка",
    name_en: "Horizontal Markings",
    question_count: 74,
  },
  {
    id: 13,
    code: "vertical_markings",
    name_uzl: "Tik chiziqlar",
    name_uzc: "Тик чизиқлар",
    name_ru: "Вертикальная разметка",
    name_en: "Vertical Markings",
    question_count: 5,
  },
  {
    id: 14,
    code: "traffic_lights",
    name_uzl: "Svetofor ishoralari",
    name_uzc: "Светофор ишоралари",
    name_ru: "Сигналы светофора",
    name_en: "Traffic Light Signals",
    question_count: 34,
  },
  {
    id: 15,
    code: "traffic_controllers",
    name_uzl: "Tartibga soluvchining ishoralari",
    name_uzc: "Тартибга солувчининг ишоралари",
    name_ru: "Сигналы регулировщика",
    name_en: "Signals of Traffic Controller",
    question_count: 29,
  },
  {
    id: 16,
    code: "hazard_signals",
    name_uzl: "Ogohlantiruvchi va avariya ishoralari",
    name_uzc: "Огоҳлантирувчи ва авария ишоралари",
    name_ru: "Предупредительные и аварийные сигналы",
    name_en: "Warning and Hazard Signals",
    question_count: 20,
  },
  {
    id: 17,
    code: "starting_maneuvering",
    name_uzl: "Harakatlanishni boshlash, manyovr qilish",
    name_uzc: "Ҳаракатланишни бошлаш, манёвр қилиш",
    name_ru: "Начало движения, маневрирование",
    name_en: "Starting Movement, Maneuvering",
    question_count: 45,
  },
  {
    id: 18,
    code: "vehicle_position",
    name_uzl: "Yoʻlning qatnov qismida transport vositalarining joylashuvi",
    name_uzc: "Йўлнинг қатнов қисмида транспорт воситаларининг жойлашуви",
    name_ru: "Расположение транспортных средств на проезжей части",
    name_en: "Position of Vehicles on Roadway",
    question_count: 30,
  },
  {
    id: 19,
    code: "speed_limits",
    name_uzl: "Harakatlanish tezligi",
    name_uzc: "Ҳаракатланиш тезлиги",
    name_ru: "Скорость движения",
    name_en: "Speed of Movement",
    question_count: 25,
  },
  {
    id: 20,
    code: "overtaking",
    name_uzl: "Quvib oʻtish",
    name_uzc: "Қувиб ўтиш",
    name_ru: "Обгон",
    name_en: "Overtaking",
    question_count: 58,
  },
  {
    id: 21,
    code: "stopping_parking",
    name_uzl: "Toʻxtash va toʻxtab turish",
    name_uzc: "Тўхташ ва тўхтаб туриш",
    name_ru: "Остановка и стоянка",
    name_en: "Stopping and Parking",
    question_count: 86,
  },
  {
    id: 22,
    code: "intersections",
    name_uzl: "Chorrahalarda harakatlanish",
    name_uzc: "Чорраҳаларда ҳаракатланиш",
    name_ru: "Проезд перекрёстков",
    name_en: "Intersections",
    question_count: 40,
  },
  {
    id: 23,
    code: "regulated_intersections",
    name_uzl: "Tartibga solingan chorrahalar",
    name_uzc: "Тартибга солинган чорраҳалар",
    name_ru: "Регулируемые перекрёстки",
    name_en: "Regulated Intersections",
    question_count: 35,
  },
  {
    id: 24,
    code: "unregulated_main_straight",
    name_uzl: "Tartibga solinmagan chorrahalar (asosiy yoʻl toʻgʻri yoʻnalishda)",
    name_uzc: "Тартибга солинмаган чорраҳалар (асосий йўл тўғри йўналишда)",
    name_ru: "Нерегулируемые перекрёстки (главная дорога в прямом направлении)",
    name_en: "Unregulated Intersections (Main Road Straight)",
    question_count: 30,
  },
  {
    id: 25,
    code: "unregulated_equivalent",
    name_uzl: "Tartibga solinmagan teng ahamiyatli chorrahalar",
    name_uzc: "Тартибга солинмаган тенг аҳамиятли чорраҳалар",
    name_ru: "Нерегулируемые перекрёстки равнозначных дорог",
    name_en: "Unregulated Intersections of Equivalent Roads",
    question_count: 25,
  },
  {
    id: 26,
    code: "unregulated_main_turns",
    name_uzl: "Tartibga solinmagan chorrahalar (asosiy yoʻl yoʻnalishi oʻzgarishi)",
    name_uzc: "Тартибга солинмаган чорраҳалар (асосий йўл йўналиши ўзгариши)",
    name_ru: "Нерегулируемые перекрёстки (изменение направления главной дороги)",
    name_en: "Unregulated Intersections (Main Road Direction Change)",
    question_count: 28,
  },
  {
    id: 27,
    code: "pedestrian_crossings_stops",
    name_uzl: "Piyodalar oʻtish joylari va yoʻnalishli transport vositalari bekatlari",
    name_uzc: "Пиёдалар ўтиш жойлари ва йўналишли транспорт воситалари бекатлари",
    name_ru: "Пешеходные переходы и остановки маршрутных транспортных средств",
    name_en: "Pedestrian Crossings and Transit Stops",
    question_count: 24,
  },
  {
    id: 28,
    code: "railway_crossings",
    name_uzl: "Temir yoʻl kesishmalari orqali harakatlanish",
    name_uzc: "Темир йўл кесишмалари орқали ҳаракатланиш",
    name_ru: "Движение через железнодорожные пути",
    name_en: "Level Crossings",
    question_count: 20,
  },
  {
    id: 29,
    code: "motorways",
    name_uzl: "Avtomagistrallarda harakatlanish",
    name_uzc: "Автомагистралларда ҳаракатланиш",
    name_ru: "Движение по автомагистралям",
    name_en: "Motorway Driving",
    question_count: 15,
  },
  {
    id: 30,
    code: "residential_zones",
    name_uzl: "Turar joy dahalarida harakatlanish",
    name_uzc: "Турар жой даҳаларида ҳаракатланиш",
    name_ru: "Движение в жилых зонах",
    name_en: "Residential Zones",
    question_count: 12,
  },
  {
    id: 31,
    code: "slopes_and_climbs",
    name_uzl: "Tik balandlik va nishabliklarda harakatlanish",
    name_uzc: "Тик баландлик ва нишабликларда ҳаракатланиш",
    name_ru: "Движение на крутых спусках и подъёмах",
    name_en: "Driving on Steep Slopes",
    question_count: 15,
  },
  {
    id: 32,
    code: "priority_transit",
    name_uzl: "Yoʻnalishli transport vositalarining imtiyozlari",
    name_uzc: "Йўналишли транспорт воситаларининг имтиёзлари",
    name_ru: "Приоритет маршрутных транспортных средств",
    name_en: "Priority of Route Vehicles",
    question_count: 18,
  },
  {
    id: 33,
    code: "external_lights",
    name_uzl: "Tashqi yoritish asboblaridan foydalanish",
    name_uzc: "Ташқи ёритиш асбобларидан фойдаланиш",
    name_ru: "Пользование внешними световыми приборами",
    name_en: "Use of External Lighting",
    question_count: 22,
  },
  {
    id: 34,
    code: "towing",
    name_uzl: "Mexanik transport vositalarini shatakka olish",
    name_uzc: "Механик транспорт воситаларини шатакка олиш",
    name_ru: "Буксировка механических транспортных средств",
    name_en: "Towing Mechanical Vehicles",
    question_count: 16,
  },
  {
    id: 35,
    code: "driver_training",
    name_uzl: "Transport vositalarini boshqarishni oʻrgatish",
    name_uzc: "Транспорт воситаларини бошқаришни ўргатиш",
    name_ru: "Обучение вождению транспортных средств",
    name_en: "Driver Training",
    question_count: 14,
  },
  {
    id: 36,
    code: "people_transportation",
    name_uzl: "Odam tashish",
    name_uzc: "Одам ташиш",
    name_ru: "Перевозка людей",
    name_en: "Passenger Transport",
    question_count: 20,
  },
  {
    id: 37,
    code: "cargo_transportation",
    name_uzl: "Yuk tashish",
    name_uzc: "Юк ташиш",
    name_ru: "Перевозка грузов",
    name_en: "Cargo Transport",
    question_count: 18,
  },
  {
    id: 38,
    code: "bicycles_mopeds",
    name_uzl: "Velosiped, moped va aravalar harakatlanishiga hamda hayvonlarni haydab oʻtishga doir qoʻshimcha talablar",
    name_uzc: "Велосипед, мопед ва аравалар ҳаракатланишига ҳамда ҳайвонларни ҳайдаб ўтишга доир қўшимча талаблар",
    name_ru: "Дополнительные требования к движению велосипедов, мопедов, гужевых повозок и прогону животных",
    name_en: "Rules for Bicycles, Mopeds and Carts",
    question_count: 15,
  },
  {
    id: 39,
    code: "identification_signs",
    name_uzl: "Taniqli belgilar",
    name_uzc: "Таниқли белгилар",
    name_ru: "Опознавательные знаки транспортных средств",
    name_en: "Identification Signs",
    question_count: 20,
  },
  {
    id: 40,
    code: "prohibition_conditions",
    name_uzl: "Transport vositalaridan foydalanishni taqiqlovchi shartlar",
    name_uzc: "Транспорт воситаларидан фойдаланишни тақиқловчи шартлар",
    name_ru: "Условия, запрещающие эксплуатацию транспортных средств",
    name_en: "Conditions Prohibiting Vehicle Operation",
    question_count: 35,
  },
  {
    id: 41,
    code: "traffic_safety_basics",
    name_uzl: "Harakat xavfsizligi asoslari",
    name_uzc: "Ҳаракат хавфсизлиги асослари",
    name_ru: "Основы безопасности движения",
    name_en: "Traffic Safety Basics",
    question_count: 30,
  },
  {
    id: 42,
    code: "first_aid",
    name_uzl: "Birinchi tibbiy yordam",
    name_uzc: "Биринчи тиббий ёрдам",
    name_ru: "Первая медицинская помощь",
    name_en: "First Medical Aid",
    question_count: 23,
  },
  {
    id: 43,
    code: "complicated_questions",
    name_uzl: "Murakkab savollar",
    name_uzc: "Мураккаб саволлар",
    name_ru: "Сложные вопросы",
    name_en: "Complex Questions",
    question_count: 31,
  },
  {
    id: 44,
    code: "digital_questions",
    name_uzl: "Raqamli savollar",
    name_uzc: "Рақамли саволлар",
    name_ru: "Цифровые вопросы",
    name_en: "Numerical Questions",
    question_count: 20,
  },
];

// Normalize a string for relaxed dictionary key lookups
function normalizeTopicKey(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[`ʻʼ'’ʻ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .trim();
}

export const OFFICIAL_TOPIC_MAP: Record<number, OfflineTopic> = Object.fromEntries(
  OFFICIAL_TOPICS.map((tp) => [tp.id, tp])
);

export const OFFICIAL_TOPIC_BY_CODE: Record<string, OfflineTopic> = Object.fromEntries(
  OFFICIAL_TOPICS.filter((tp) => tp.code).map((tp) => [tp.code as string, tp])
);

export const OFFICIAL_TOPIC_BY_NAME_MAP: Record<string, OfflineTopic> = (() => {
  const map: Record<string, OfflineTopic> = {};
  for (const tp of OFFICIAL_TOPICS) {
    if (tp.name_uzl) map[normalizeTopicKey(tp.name_uzl)] = tp;
    if (tp.name_uzc) map[normalizeTopicKey(tp.name_uzc)] = tp;
    if (tp.name_ru) map[normalizeTopicKey(tp.name_ru)] = tp;
    if (tp.name_en) map[normalizeTopicKey(tp.name_en)] = tp;
  }
  return map;
})();

/**
 * Resolves an official topic definition by ID, code, or name.
 */
export function findOfficialTopic(topic: any): OfflineTopic | undefined {
  if (!topic) return undefined;
  if (typeof topic === "number") return OFFICIAL_TOPIC_MAP[topic];
  if (typeof topic === "string" && !isNaN(Number(topic)) && topic.trim() !== "") {
    const num = Number(topic);
    if (OFFICIAL_TOPIC_MAP[num]) return OFFICIAL_TOPIC_MAP[num];
  }
  const id =
    topic.id != null
      ? Number(topic.id)
      : topic.topicId != null
      ? Number(topic.topicId)
      : topic.topic_id != null
      ? Number(topic.topic_id)
      : null;
  if (id != null && !isNaN(id) && OFFICIAL_TOPIC_MAP[id]) {
    return OFFICIAL_TOPIC_MAP[id];
  }
  if (topic.code && OFFICIAL_TOPIC_BY_CODE[topic.code]) {
    return OFFICIAL_TOPIC_BY_CODE[topic.code];
  }
  const rawName =
    (typeof topic === "string" ? topic : null) ||
    topic.name_uzl ||
    topic.nameUzl ||
    (typeof topic.name === "string" ? topic.name : null) ||
    topic.name_uzc ||
    topic.nameUzc ||
    topic.name_ru ||
    topic.nameRu ||
    (typeof topic.title === "string" ? topic.title : null) ||
    "";
  if (rawName) {
    const key = normalizeTopicKey(rawName);
    if (OFFICIAL_TOPIC_BY_NAME_MAP[key]) {
      return OFFICIAL_TOPIC_BY_NAME_MAP[key];
    }
  }
  return undefined;
}
