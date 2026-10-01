/**
 * Canonical 44 Topic Translations (UZL, UZC, RU, EN)
 * Guarantees 100% correct topic names in all locales regardless of backend/cache state.
 */

export interface TopicTranslation {
  uzl: string;
  uzc: string;
  ru: string;
  en: string;
}

export const TOPIC_TRANSLATIONS: Record<number, TopicTranslation> = {
  1: {
    uzl: "Umumiy qoidalar",
    uzc: "Умумий қоидалар",
    ru: "Общие положения",
    en: "General Provisions",
  },
  2: {
    uzl: "Haydovchilarning umumiy vazifalari",
    uzc: "Ҳайдовчиларнинг умумий вазифалари",
    ru: "Общие обязанности водителей",
    en: "General Duties of Drivers",
  },
  3: {
    uzl: "Piyodalarning umumiy vazifalari",
    uzc: "Пиёдаларнинг умумий вазифалари",
    ru: "Обязанности пешеходов",
    en: "Duties of Pedestrians",
  },
  4: {
    uzl: "Maxsus transport vositalarining imtiyozlari",
    uzc: "Махсус транспорт воситаларининг имтиёзлари",
    ru: "Приоритет специальных транспортных средств",
    en: "Priority of Special Vehicles",
  },
  5: {
    uzl: "Ogohlantiruvchi belgilar",
    uzc: "Огоҳлантирувчи белгилар",
    ru: "Предупреждающие знаки",
    en: "Warning Signs",
  },
  6: {
    uzl: "Imtiyoz belgilari",
    uzc: "Имтиёз белгилари",
    ru: "Знаки приоритета",
    en: "Priority Signs",
  },
  7: {
    uzl: "Taqiqlovchi belgilar",
    uzc: "Тақиқловчи белгилар",
    ru: "Запрещающие знаки",
    en: "Prohibitory Signs",
  },
  8: {
    uzl: "Buyuruvchi belgilar",
    uzc: "Буюрувчи белгилар",
    ru: "Предписывающие знаки",
    en: "Mandatory Signs",
  },
  9: {
    uzl: "Axborot-koʻrsatkich belgilari",
    uzc: "Ахборот-кўрсаткич белгилари",
    ru: "Информационно-указательные знаки",
    en: "Information and Direction Signs",
  },
  10: {
    uzl: "Servis belgilari",
    uzc: "Сервис белгилари",
    ru: "Знаки сервиса",
    en: "Service Signs",
  },
  11: {
    uzl: "Qoʻshimcha axborot belgilari",
    uzc: "Қўшимча ахборот белгилари",
    ru: "Знаки дополнительной информации (таблички)",
    en: "Additional Information Signs",
  },
  12: {
    uzl: "Yotiq chiziqlar",
    uzc: "Ётиқ чизиқлар",
    ru: "Горизонтальная разметка",
    en: "Horizontal Markings",
  },
  13: {
    uzl: "Tik chiziqlar",
    uzc: "Тик чизиқлар",
    ru: "Вертикальная разметка",
    en: "Vertical Markings",
  },
  14: {
    uzl: "Svetofor ishoralari",
    uzc: "Светофор ишоралари",
    ru: "Сигналы светофора",
    en: "Traffic Light Signals",
  },
  15: {
    uzl: "Tartibga soluvchining ishoralari",
    uzc: "Тартибга солувчининг ишоралари",
    ru: "Сигналы регулировщика",
    en: "Signals of Traffic Controller",
  },
  16: {
    uzl: "Ogohlantiruvchi va avariya ishoralari",
    uzc: "Огоҳлантирувчи ва авария ишоралари",
    ru: "Предупредительные и аварийные сигналы",
    en: "Warning and Hazard Signals",
  },
  17: {
    uzl: "Harakatlanishni boshlash, manyovr qilish",
    uzc: "Ҳаракатланишни бошлаш, манёвр қилиш",
    ru: "Начало движения, маневрирование",
    en: "Starting Movement, Maneuvering",
  },
  18: {
    uzl: "Yoʻlning qatnov qismida transport vositalarining joylashuvi",
    uzc: "Йўлнинг қатнов қисмида транспорт воситаларининг жойлашуви",
    ru: "Расположение транспортных средств на проезжей части",
    en: "Position of Vehicles on Roadway",
  },
  19: {
    uzl: "Harakatlanish tezligi",
    uzc: "Ҳаракатланиш тезлиги",
    ru: "Скорость движения",
    en: "Speed of Movement",
  },
  20: {
    uzl: "Quvib oʻtish",
    uzc: "Қувиб ўтиш",
    ru: "Обгон",
    en: "Overtaking",
  },
  21: {
    uzl: "Toʻxtash va toʻxtab turish",
    uzc: "Тўхташ ва тўхтаб туриш",
    ru: "Остановка и стоянка",
    en: "Stopping and Parking",
  },
  22: {
    uzl: "Chorrahalarda harakatlanish",
    uzc: "Чорраҳаларда ҳаракатланиш",
    ru: "Проезд перекрёстков",
    en: "Intersections",
  },
  23: {
    uzl: "Tartibga solingan chorrahalar",
    uzc: "Тартибга солинган чорраҳалар",
    ru: "Регулируемые перекрёстки",
    en: "Regulated Intersections",
  },
  24: {
    uzl: "Tartibga solinmagan chorrahalar (asosiy yoʻl toʻgʻri yoʻnalishda)",
    uzc: "Тартибга солинмаган чорраҳалар (асосий йўл тўғри йўналишда)",
    ru: "Нерегулируемые перекрёстки (главная дорога в прямом направлении)",
    en: "Unregulated Intersections (Main Road Straight)",
  },
  25: {
    uzl: "Tartibga solinmagan teng ahamiyatli chorrahalar",
    uzc: "Тартибга солинмаган тенг аҳамиятли чорраҳалар",
    ru: "Нерегулируемые перекрёстки равнозначных дорог",
    en: "Unregulated Intersections of Equivalent Roads",
  },
  26: {
    uzl: "Tartibga solinmagan chorrahalar (asosiy yoʻl yoʻnalishi oʻzgarishi)",
    uzc: "Тартибга солинмаган чорраҳалар (асосий йўл йўналиши ўзгариши)",
    ru: "Нерегулируемые перекрёстки (изменение направления главной дороги)",
    en: "Unregulated Intersections (Main Road Direction Change)",
  },
  27: {
    uzl: "Piyodalar oʻtish joylari va yoʻnalishli transport vositalari bekatlari",
    uzc: "Пиёдалар ўтиш жойлари ва йўналишли транспорт воситалари бекатлари",
    ru: "Пешеходные переходы и остановки маршрутных транспортных средств",
    en: "Pedestrian Crossings and Transit Stops",
  },
  28: {
    uzl: "Temir yoʻl kesishmalari orqali harakatlanish",
    uzc: "Темир йўл кесишмалари орқали ҳаракатланиш",
    ru: "Движение через железнодорожные пути",
    en: "Level Crossings",
  },
  29: {
    uzl: "Avtomagistrallarda harakatlanish",
    uzc: "Автомагистралларда ҳаракатланиш",
    ru: "Движение по автомагистралям",
    en: "Motorway Driving",
  },
  30: {
    uzl: "Turar joy dahalarida harakatlanish",
    uzc: "Турар жой даҳаларида ҳаракатланиш",
    ru: "Движение в жилых зонах",
    en: "Residential Zones",
  },
  31: {
    uzl: "Tik balandlik va nishabliklarda harakatlanish",
    uzc: "Тик баландлик ва нишабликларда ҳаракатланиш",
    ru: "Движение на крутых спусках и подъёмах",
    en: "Driving on Steep Slopes",
  },
  32: {
    uzl: "Yoʻnalishli transport vositalarining imtiyozlari",
    uzc: "Йўналишли транспорт воситаларининг имтиёзлари",
    ru: "Приоритет маршрутных транспортных средств",
    en: "Priority of Route Vehicles",
  },
  33: {
    uzl: "Tashqi yoritish asboblaridan foydalanish",
    uzc: "Ташқи ёритиш асбобларидан фойдаланиш",
    ru: "Пользование внешними световыми приборами",
    en: "Use of External Lighting",
  },
  34: {
    uzl: "Mexanik transport vositalarini shatakka olish",
    uzc: "Механик транспорт воситаларини шатакка олиш",
    ru: "Буксировка механических транспортных средств",
    en: "Towing Mechanical Vehicles",
  },
  35: {
    uzl: "Transport vositalarini boshqarishni oʻrgatish",
    uzc: "Транспорт воситаларини бошқаришни ўргатиш",
    ru: "Обучение вождению транспортных средств",
    en: "Driver Training",
  },
  36: {
    uzl: "Odam tashish",
    uzc: "Одам ташиш",
    ru: "Перевозка людей",
    en: "Passenger Transport",
  },
  37: {
    uzl: "Yuk tashish",
    uzc: "Юк ташиш",
    ru: "Перевозка грузов",
    en: "Cargo Transport",
  },
  38: {
    uzl: "Velosiped, moped va aravalar harakatlanishiga hamda hayvonlarni haydab oʻtishga doir qoʻshimcha talablar",
    uzc: "Велосипед, мопед ва аравалар ҳаракатланишига ҳамда ҳайвонларни ҳайдаб ўтишга доир қўшимча талаблар",
    ru: "Дополнительные требования к движению велосипедов, мопедов, гужевых повозок и прогону животных",
    en: "Rules for Bicycles, Mopeds and Carts",
  },
  39: {
    uzl: "Taniqli belgilar",
    uzc: "Таниқли белгилар",
    ru: "Опознавательные знаки транспортных средств",
    en: "Identification Signs",
  },
  40: {
    uzl: "Transport vositalaridan foydalanishni taqiqlovchi shartlar",
    uzc: "Транспорт воситаларидан фойдаланишни тақиқловчи шартлар",
    ru: "Условия, запрещающие эксплуатацию транспортных средств",
    en: "Conditions Prohibiting Vehicle Operation",
  },
  41: {
    uzl: "Harakat xavfsizligi asoslari",
    uzc: "Ҳаракат хавфсизлиги асослари",
    ru: "Основы безопасности движения",
    en: "Traffic Safety Basics",
  },
  42: {
    uzl: "Birinchi tibbiy yordam",
    uzc: "Биринчи тиббий ёрдам",
    ru: "Первая медицинская помощь",
    en: "First Medical Aid",
  },
  43: {
    uzl: "Murakkab savollar",
    uzc: "Мураккаб саволлар",
    ru: "Сложные вопросы",
    en: "Complex Questions",
  },
  44: {
    uzl: "Raqamli savollar",
    uzc: "Рақамли саволлар",
    ru: "Цифровые вопросы",
    en: "Numerical Questions",
  },
};

export function getFallbackTopicName(id: number | undefined, lang: "uzl" | "uzc" | "ru"): string | null {
  if (!id || !TOPIC_TRANSLATIONS[id]) return null;
  const t = TOPIC_TRANSLATIONS[id];
  return t[lang] || t.uzl;
}
