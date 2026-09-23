// scripts/merge-missing-keys.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'public', 'locales');

// Load en/translation.json to extract the 150-key dashboard block from lines 2332-2526
const enRaw = fs.readFileSync(path.join(LOCALES_DIR, 'en', 'translation.json'), 'utf8');
const enLines = enRaw.split('\n');
let dashSlice = enLines.slice(2331, 2526).join('\n').trim();
if (dashSlice.endsWith(',')) dashSlice = dashSlice.slice(0, -1);
const dashboardUzl = JSON.parse('{' + dashSlice + '}').dashboard;

// Russian translations for dashboard
const dashboardRu = {
  searchPlaceholder: "Поиск темы, вопроса или правила...",
  searchShortcut: "K",
  searchModalTitle: "Быстрый поиск",
  filterAll: "Все",
  filterTopics: "Темы",
  filterTickets: "Билеты",
  filterRules: "Правила",
  noResultsFound: "Подходящий раздел или вопрос не найден. Попробуйте другой запрос.",
  jumpToItem: "Перейти",
  notificationsTitle: "Уведомления",
  noNotifications: "Новых уведомлений нет",
  markAllAsRead: "Отметить все как прочитанные",
  greeting: "Добро пожаловать",
  subtitle: "Продолжайте подготовку к экзамену по вождению. Цель близка!",
  quote: "Дисциплина сегодня — уверенность и успех завтра!",
  accountStatus: "Премиум пользователь",
  freeStatus: "Обычный пользователь",
  nav: {
    home: "Главная",
    topics: "Темы",
    tickets: "Билеты",
    marathon: "Марафон",
    exam: "Настоящий экзамен",
    stats: "Статистика",
    saved: "Сохраненные",
    rating: "Рейтинг",
    settings: "Настройки",
    signs: "Дорожные знаки",
    markings: "Дорожная разметка",
    autodrom: "Автодром",
    examCenters: "Экзаменационные центры",
    rules: "Правила ПДД",
    penalties: "Штрафы",
    simulator: "3D Симулятор автодрома"
  },
  collapse: "Свернуть панель",
  expand: "Развернуть панель",
  premium: {
    title: "Премиум возможности",
    desc: "Используйте все функции на 100%!",
    btn: "Получить Премиум →",
    close: "Закрыть",
    reopen: "Премиум возможности"
  },
  nba: {
    badgeContinue: "ПРОДОЛЖИТЬ",
    badgeFixMistakes: "РАБОТА НАД ОШИБКАМИ",
    badgeWeakTopic: "СЛАБАЯ ТЕМА",
    badgeNextTicket: "СЛЕДУЮЩИЙ БИЛЕТ",
    badgeDiagnostic: "ДИАГНОСТИКА",
    badgeExamReady: "ГОСЭКЗАМЕН",
    marathonResumeTitle: "Продолжите марафон с места остановки",
    marathonResumeDesc: "Вы дошли до {{current}}-го вопроса из {{total}}. Не останавливайтесь!",
    resumeBtn: "Продолжить →",
    mistakesTitle: "Рекомендуется работа над ошибками",
    mistakesDesc: "У вас накопилось {{count}} ошибочных вопросов. Закрепите их повторным решением.",
    fixMistakesBtn: "Устранить ошибки →",
    weakTopicTitle: "Наиболее слабая тема: {{topic}}",
    weakTopicDesc: "В этой теме допущено {{count}} ошибок. Повторите этот материал перед экзаменом.",
    practiceTopicBtn: "Подтянуть тему →",
    nextTicketTitle: "Готовы решить билет №{{ticketNumber}}?",
    nextTicketDesc: "Последовательное решение билетов позволяет полностью привыкнуть к формату экзамена.",
    startTicketBtn: "Начать билет →",
    diagnosticTitle: "Пробный тест для определения уровня знаний",
    diagnosticDesc: "Определите свои сильные и слабые стороны с помощью начального теста из 20 вопросов.",
    startDiagnosticBtn: "Начать диагностический тест →",
    examReadyTitle: "Отличные знания! Проверьте себя на государственном экзамене",
    examReadyDesc: "Уровень вашей подготовки высок ({{readiness}}%). Испытайте себя в симуляторе с ограничением по времени.",
    startExamSimBtn: "Симулятор госэкзамена →",
    mistakesCount: "{{count}} ошибок",
    questionsCount: "{{count}} вопросов",
    readyPct: "{{pct}}% готов"
  },
  stats: {
    dailyPlanTitle: "Дневной план (вопросов)",
    dailyPlanDone: "Отлично! Ваш дневной план полностью выполнен.",
    dailyPlanOverflow: "+{{count}} сверх плана!",
    dailyPlanProgress: "Выполнение вашего сегодняшнего учебного плана.",
    streakDays: "{{count}}-дневная серия",
    startStreakToday: "Решите тест сегодня и начните серию!",
    solvedQuestionsTitle: "Решенные вопросы",
    solvedQuestionsFootnote: "Из всего {{count}} официальных вопросов",
    overallReadinessTitle: "Общая готовность",
    readinessFootnote: "На основе усвоенных вопросов и точности тестов",
    readinessExplanation: "Рассчитано на основе полностью усвоенных вопросов и точности ответов",
    levelBeginner: "Начальный",
    levelIntermediate: "Средний",
    levelAdvanced: "Продвинутый",
    levelReady: "Готов к сдаче"
  },
  modes: {
    title: "Основные режимы обучения",
    subtitle: "Выберите наиболее подходящий режим для вашей цели и получайте знания",
    topicsTitle: "Темы",
    topicsDesc: "Изучайте теоретические и практические знания поэтапно по темам.",
    topicsChip: "{{done}}/{{total}} тем",
    ticketsTitle: "Билеты",
    ticketsDesc: "Проверьте себя по официальным билетам от 1 до {{count}}.",
    ticketsChip: "{{done}}/{{total}} билетов",
    marathonTitle: "Марафон",
    marathonDesc: "Все {{count}} вопросов подряд. Максимальная проверка вашей выносливости и знаний.",
    marathonChip: "{{current}}/{{total}} вопросов",
    examTitle: "Настоящий экзамен",
    examDesc: "Официальный симулятор экзамена с ограничением по времени.",
    examChip: "Последний: {{score}}%",
    startBtn: "Начать",
    recommended: "РЕКОМЕНДУЕТСЯ"
  },
  recommendation: {
    title: "Умные рекомендации и работа над ошибками",
    subtitle: "Системно устраняйте пробелы в знаниях для повышения шансов на успешную сдачу экзамена.",
    weakTopicsBadge: "СЛАБЫЕ ТЕМЫ",
    weakTopicsTitle: "Направления с наибольшим числом ошибок",
    viewAllLink: "Смотреть все →",
    mistakesCount: "{{count}} ошибок",
    noMistakesYet: "Ошибок нет!",
    noMistakesDesc: "Ваши знания на отличном уровне. Проверьте себя в полном экзамене.",
    diagnosticEmptyTitle: "Пока нет зафиксированных ошибок",
    diagnosticEmptyDesc: "Пройдите пробный тест, чтобы выявить слабые темы и сформировать индивидуальный план.",
    startDiagnosticBtn: "Начать пробный тест →",
    masteryTitle: "Все темы освоены!",
    masteryDesc: "У вас нет вопросов, требующих повторения. Проверьте свои силы в симуляторе госэкзамена.",
    startMockExamBtn: "Сдать экзамен →",
    quickFixBadge: "БЫСТРОЕ ИСПРАВЛЕНИЕ",
    mistakesTitle: "ошибочных ответов",
    mistakesDesc: "Работа над ошибками — самый короткий путь к успеху. Повторите все проблемные вопросы через этот тест.",
    fixMistakesBtn: "Начать работу над ошибками →",
    startExamBtn: "Начать пробный экзамен →",
    goalTitle: "Ваша цель",
    goalDesc: "Достичь результата не менее 90% по теории и уверенно сдать экзамен."
  },
  tools: {
    title: "Аналитика и персональные инструменты",
    subtitle: "Мониторинг личного прогресса, результатов и тестов",
    savedTitle: "Сохраненные",
    savedDesc: "Вопросы с закладками",
    savedCount: "{{count}} шт.",
    statsTitle: "Статистика",
    statsDesc: "Подробная статистика обучения",
    ratingTitle: "Рейтинг",
    ratingDesc: "Ваше место в рейтинге учащихся",
    historyTitle: "История экзаменов",
    historyDesc: "Результаты предыдущих экзаменов",
    lastScore: "Последний: {{score}}%"
  },
  banner: {
    title: "Мечта о водительском удостоверении теперь еще ближе!",
    subtitle: "Регулярные занятия, правильный анализ и практические тесты непременно приведут вас к цели!",
    continueBtn: "Продолжить обучение →",
    benefit1: "Официальная база вопросов",
    benefit2: "Постоянные обновления",
    benefit3: "Системный анализ и практика",
    quote: "Знания дают уверенность и свободу на дороге!"
  },
  footer: {
    slogan: "Надежная платформа для подготовки к экзаменам по вождению.",
    product: "ПРОДУКТ",
    help: "ПОМОЩЬ",
    social: "СВЯЗАТЬСЯ С НАМИ",
    safety: "Безопасная дорога — уверенное будущее!",
    rights: "Все права защищены.",
    terms: "Условия использования"
  },
  weakTopics: {
    nextRecommendation: "Следующая рекомендация",
    mainFocusBlock: "Основной фокус"
  },
  fallbackName: "Уважаемый водитель",
  welcomeSubtitle: "Продолжайте подготовку к экзамену по вождению. Цель близка!",
  examQuestionCount: "20 вопросов",
  questionsUnit: "вопрос",
  minutesUnit: "минут",
  cancel: "Отмена",
  ticketNum: "Билет №{{num}}",
  searchModalLabel: "Поиск",
  noSearchResults: "Ничего не найдено",
  navigate: "Навигация",
  select: "Выбрать",
  close: "Закрыть",
  sidebarAria: "Основная навигация",
  motivationalTitle: "Мотивационный баннер",
  metricsAria: "Показатели пользователя",
  welcomeAria: "Раздел приветствия",
  categories: {
    exam: "Экзамен",
    practice: "Практика",
    tickets: "Билеты",
    topics: "Темы"
  },
  fallbackTopic1: "Дорожные знаки и разметка",
  fallbackTopic2: "Правила проезда перекрестков",
  fallbackTopic3: "Скорость движения и безопасная дистанция",
  fallbackTopic4: "Обгон и правила остановки",
  fallbackTopic5: "Движение пешеходов и велосипедистов",
  unread: "новых"
};
dashboardRu.footer.safetyTitle = "БЕЗОПАСНОСТЬ";
dashboardRu.footer.trustNote = "В соответствии с официальными экзаменационными стандартами СБДД МВД Республики Узбекистан.";

dashboardUzl.unread = "yangi";
if (!dashboardUzl.footer) dashboardUzl.footer = {};
dashboardUzl.footer.safetyTitle = "XAVFSIZLIK";
dashboardUzl.footer.trustNote = "O'zbekiston Respublikasi IIV YHXBB rasmiy imtihon standartlariga muvofiq.";

// Transliterate function for Uzc
function toUzcCyrillic(str) {
  if (!str) return '';
  return str
    .replace(/Sh/g, 'Ш').replace(/SH/g, 'Ш').replace(/sh/g, 'ш')
    .replace(/Ch/g, 'Ч').replace(/CH/g, 'Ч').replace(/ch/g, 'ч')
    .replace(/Yo['‘`ʼ]?/g, 'Ё').replace(/YO['‘`ʼ]?/g, 'Ё').replace(/yo['‘`ʼ]?/g, 'ё')
    .replace(/Yu/g, 'Ю').replace(/YU/g, 'Ю').replace(/yu/g, 'ю')
    .replace(/Ya/g, 'Я').replace(/YA/g, 'Я').replace(/ya/g, 'я')
    .replace(/Ye/g, 'Е').replace(/YE/g, 'Е').replace(/ye/g, 'е')
    .replace(/O['‘`ʼ]/g, 'Ў').replace(/o['‘`ʼ]/g, 'ў')
    .replace(/G['‘`ʼ]/g, 'Ғ').replace(/g['‘`ʼ]/g, 'ғ')
    .replace(/([a-zA-Zа-яА-ЯёЁ])e/g, '$1е').replace(/([a-zA-Zа-яА-ЯёЁ])E/g, '$1Е')
    .replace(/a/g, 'а').replace(/A/g, 'А')
    .replace(/b/g, 'б').replace(/B/g, 'Б')
    .replace(/d/g, 'д').replace(/D/g, 'Д')
    .replace(/e/g, 'э').replace(/E/g, 'Э')
    .replace(/f/g, 'ф').replace(/F/g, 'Ф')
    .replace(/g/g, 'г').replace(/G/g, 'Г')
    .replace(/h/g, 'ҳ').replace(/H/g, 'Ҳ')
    .replace(/i/g, 'и').replace(/I/g, 'И')
    .replace(/j/g, 'ж').replace(/J/g, 'Ж')
    .replace(/k/g, 'к').replace(/K/g, 'К')
    .replace(/l/g, 'л').replace(/L/g, 'Л')
    .replace(/m/g, 'м').replace(/M/g, 'М')
    .replace(/n/g, 'н').replace(/N/g, 'Н')
    .replace(/o/g, 'о').replace(/O/g, 'О')
    .replace(/p/g, 'п').replace(/P/g, 'П')
    .replace(/q/g, 'қ').replace(/Q/g, 'Қ')
    .replace(/r/g, 'р').replace(/R/g, 'Р')
    .replace(/s/g, 'с').replace(/S/g, 'С')
    .replace(/t/g, 'т').replace(/T/g, 'Т')
    .replace(/u/g, 'у').replace(/U/g, 'У')
    .replace(/v/g, 'в').replace(/V/g, 'В')
    .replace(/x/g, 'х').replace(/X/g, 'Х')
    .replace(/y/g, 'й').replace(/Y/g, 'Й')
    .replace(/z/g, 'з').replace(/Z/g, 'З')
    .replace(/['‘`ʼ]/g, 'ъ');
}

function transliterateObj(obj) {
  if (typeof obj === 'string') {
    // Preserve placeholder {{vars}}
    const parts = obj.split(/(\{\{[^\{\}]+\}\})/);
    return parts.map((part, idx) => {
      if (idx % 2 === 1) return part; // placeholder
      return toUzcCyrillic(part);
    }).join('');
  }
  if (Array.isArray(obj)) return obj.map(transliterateObj);
  if (obj && typeof obj === 'object') {
    const res = {};
    for (const k of Object.keys(obj)) {
      res[k] = transliterateObj(obj[k]);
    }
    return res;
  }
  return obj;
}

const dashboardUzc = transliterateObj(dashboardUzl);
// Manual tune-ups for dashboardUzc
dashboardUzc.nav.simulator = "Автодром Симулятори 3D";
dashboardUzc.nav.autodrom = "Автодром";
dashboardUzc.nav.examCenters = "Имтиҳон марказлари";
dashboardUzc.nav.rules = "ЙҲҚ Қоидалари";
dashboardUzc.nav.penalties = "Жарималар";
dashboardUzc.nav.stats = "Статистика";
dashboardUzc.accountStatus = "Премиум фойдаланувчи";
dashboardUzc.freeStatus = "Оддий фойдаланувчи";

// Missing section keys across languages
const extraKeys = {
  uzl: {
    nav: {
      tools: "Vositalar",
      mobileMenuTitle: "Mobil menyu",
      sections: "Bo'limlar",
      tickets: "Biletlar"
    },
    exam: {
      startBtn: "Imtihonni boshlash"
    },
    history: {
      subtitle: "O'tgan imtihonlar tarixi va natijalar tahlili"
    },
    leaderboard: {
      subtitle: "Eng yuqori natija ko'rsatgan o'quvchilar reytingi"
    },
    packages: {
      subtitle: "Mavzular va yo'nalishlar bo'yicha maxsus to'plamlar"
    },
    saved: {
      subtitle: "O'rganish uchun saqlab qo'yilgan savollar ro'yxati"
    },
    settings: {
      subtitle: "Hisob ma'lumotlari va tizim sozlamalari"
    },
    stats: {
      subtitle: "O'quv jarayoni va o'zlashtirish ko'rsatkichlari"
    },
    wrongAnswers: {
      subtitle: "Test yoki imtihon davomida yo'l qo'yilgan xatolar"
    },
    tickets: {
      unit: "ta rasmiy bilet"
    },
    common: {
      next: "Keyingi",
      clearSearch: "Qidiruvni tozalash"
    },
    curriculum: {
      loadRulesError: "Yo'l harakati qoidalarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
      loadPenaltiesError: "Jarimalar ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
      loadMarkingsError: "Yo'l chiziqlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
      loadCentersError: "Imtihon markazlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.",
      loadPracticalError: "Amaliy imtihon ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring."
    },
    simulator: {
      practiceAttempt: "{{count}}-urinish",
      bestScore: "Eng yaxshi: {{score}} ball",
      restart: "Qaytadan boshlash",
      attemptCompleted: "Urinish yakunlandi!",
      elapsedTime: "Sarflangan vaqt:",
      secondsUnit: "soniya",
      attemptErrors: "Ushbu urinishdagi xatolar:",
      toExerciseList: "Mashqlar ro'yxatiga",
      anotherAttempt: "Yana urinish",
      backToMenu: "Simulyator menyusi",
      practiceMode: "MASHQ REJIMI",
      practiceAction: "Mashq qilish",
      resultNotFound: "Natija topilmadi",
      backToSimulator: "Simulyatorga qaytish",
      finalPenalty: "Yakuniy jarima",
      recordedErrors: "Qayd etilgan xatolar",
      vehicle: "Avtomobil",
      errorList: "Qayd etilgan xatolar ro'yxati:",
      detailedReview: "Batafsil tahlil",
      thExercise: "Mashq",
      thViolation: "Qoidabuzarlik",
      thPenalty: "Jarima",
      thDate: "Sana",
      thMode: "Rejim",
      thVehicle: "Avtomobil",
      thPoints: "Jarima ballari",
      thTime: "Vaqt",
      thStatus: "Holat",
      thAction: "Amal",
      retakeExam: "Qaytadan imtihon topshirish",
      refreshData: "Yangilash",
      takeExam: "Imtihon topshirish",
      exerciseCatalog: "Mashqlar katalogi",
      totalAttempts: "Jami urinishlar",
      passRate: "Muvaffaqiyat ko'rsatkichi",
      averagePenalty: "O'rtacha jarima",
      penaltyLimitNote: "Imtihon chegarasi: 99 ballgacha",
      averageTime: "O'rtacha vaqt",
      statusPassed: "O'TDI",
      statusFailed: "O'TMADI",
      actionResult: "Natija",
      actionErrors: "Xatolar",
      trainingPanel: "Simulyator paneli",
      trainingMode: "O'RGANISH REJIMI",
      selectExercise: "Mashqni tanlash (1-12):",
      resetPosition: "Mashqni qayta boshlash",
      exerciseDone: "Mashq muvaffaqiyatli bajarildi!",
      repeatExercise: "Qayta mashq",
      nextExercise: "Keyingi mashq",
      finishTraining: "O'rganishni yakunlash"
    }
  },
  uzc: {
    nav: {
      tools: "Воситалар",
      mobileMenuTitle: "Мобил меню",
      sections: "Бўлимлар",
      tickets: "Билетлар"
    },
    exam: {
      startBtn: "Имтиҳонни бошлаш"
    },
    history: {
      subtitle: "Ўтган имтиҳонлар тарихи ва натижалар таҳлили"
    },
    leaderboard: {
      subtitle: "Энг юқори натижа кўрсатган ўқувчилар рейтинги"
    },
    packages: {
      subtitle: "Мавзулар ва йўналишлар бўйича махсус тўпламлар"
    },
    saved: {
      subtitle: "Ўрганиш учун сақлаб қўйилган саволлар рўйхати"
    },
    settings: {
      subtitle: "Ҳисоб маълумотлари ва тизим созламалари"
    },
    stats: {
      subtitle: "Ўқув жараёни ва ўзлаштириш кўрсаткичлари"
    },
    wrongAnswers: {
      subtitle: "Тест ёки имтиҳон давомида йўл қўйилган хатолар"
    },
    tickets: {
      unit: "та расмий билет"
    },
    common: {
      next: "Кейинги",
      clearSearch: "Қидирувни тозалаш"
    },
    curriculum: {
      loadRulesError: "Йўл ҳаракати қоидаларини юклашда хатолик юз берди. Қайта уриниб кўринг.",
      loadPenaltiesError: "Жарималар маълумотларини юклашда хатолик юз берди. Қайта уриниб кўринг.",
      loadMarkingsError: "Йўл чизиқларини юклашда хатолик юз берди. Қайта уриниб кўринг.",
      loadCentersError: "Имтиҳон марказларини юклашда хатолик юз берди. Қайта уриниб кўринг.",
      loadPracticalError: "Амалий имтиҳон маълумотларини юклашда хатолик юз берди. Қайта уриниб кўринг."
    },
    simulator: {
      practiceAttempt: "{{count}}-уриниш",
      bestScore: "Энг яхши: {{score}} балл",
      restart: "Қайтадан бошлаш",
      attemptCompleted: "Уриниш якунланди!",
      elapsedTime: "Сарфланган вақт:",
      secondsUnit: "сония",
      attemptErrors: "Ушбу уринишдаги хатолар:",
      toExerciseList: "Машқлар рўйхатига",
      anotherAttempt: "Яна уриниш",
      backToMenu: "Симулятор менюси",
      practiceMode: "МАШҚ РЕЖИМИ",
      practiceAction: "Машқ қилиш",
      resultNotFound: "Натижа топилмади",
      backToSimulator: "Симуляторга қайтиш",
      finalPenalty: "Якуний жарима",
      recordedErrors: "Қайд этилган хатолар",
      vehicle: "Автомобиль",
      errorList: "Қайд этилган хатолар рўйхати:",
      detailedReview: "Батафсил таҳлил",
      thExercise: "Машқ",
      thViolation: "Қоидабузарлик",
      thPenalty: "Жарима",
      thDate: "Сана",
      thMode: "Режим",
      thVehicle: "Автомобиль",
      thPoints: "Жарима баллари",
      thTime: "Вақт",
      thStatus: "Ҳолат",
      thAction: "Амал",
      retakeExam: "Қайтадан имтиҳон топшириш",
      refreshData: "Янгилаш",
      takeExam: "Имтиҳон топшириш",
      exerciseCatalog: "Машқлар каталоги",
      totalAttempts: "Жами уринишлар",
      passRate: "Муваффақият кўрсаткичи",
      averagePenalty: "Ўртача жарима",
      penaltyLimitNote: "Имтиҳон чегараси: 99 баллгача",
      averageTime: "Ўртача вақт",
      statusPassed: "ЎТДИ",
      statusFailed: "ЎТМАДИ",
      actionResult: "Натижа",
      actionErrors: "Хатолар",
      trainingPanel: "Симулятор панели",
      trainingMode: "ЎРГАНИШ РЕЖИМИ",
      selectExercise: "Машқни танлаш (1-12):",
      resetPosition: "Машқни қайта бошлаш",
      exerciseDone: "Машқ муваффақиятли бажарилди!",
      repeatExercise: "Қайта машқ",
      nextExercise: "Кейинги машқ",
      finishTraining: "Ўрганишни якунлаш"
    }
  },
  ru: {
    nav: {
      tools: "Инструменты",
      mobileMenuTitle: "Мобильное меню",
      sections: "Разделы",
      tickets: "Билеты"
    },
    exam: {
      startBtn: "Начать экзамен"
    },
    history: {
      subtitle: "История сданных экзаменов и анализ результатов"
    },
    leaderboard: {
      subtitle: "Рейтинг лучших учащихся с высокими результатами"
    },
    packages: {
      subtitle: "Специальные подборки вопросов по темам и категориям"
    },
    saved: {
      subtitle: "Список сохраненных вопросов для повторения"
    },
    settings: {
      subtitle: "Данные учетной записи и параметры системы"
    },
    stats: {
      subtitle: "Показатели успеваемости и статистика обучения"
    },
    wrongAnswers: {
      subtitle: "Ошибки, допущенные во время тестирования или экзамена"
    },
    tickets: {
      unit: "официальных билетов"
    },
    common: {
      next: "Далее",
      clearSearch: "Очистить поиск"
    },
    curriculum: {
      loadRulesError: "Произошла ошибка при загрузке правил дорожного движения. Попробуйте снова.",
      loadPenaltiesError: "Произошла ошибка при загрузке таблицы штрафов. Попробуйте снова.",
      loadMarkingsError: "Произошла ошибка при загрузке дорожной разметки. Попробуйте снова.",
      loadCentersError: "Произошла ошибка при загрузке экзаменационных центров. Попробуйте снова.",
      loadPracticalError: "Произошла ошибка при загрузке данных практического экзамена. Попробуйте снова."
    },
    simulator: {
      practiceAttempt: "Попытка #{{count}}",
      bestScore: "Лучший результат: {{score}} б.",
      restart: "Начать заново",
      attemptCompleted: "Попытка завершена!",
      elapsedTime: "Затраченное время:",
      secondsUnit: "сек.",
      attemptErrors: "Ошибки в этой попытке:",
      toExerciseList: "К списку упражнений",
      anotherAttempt: "Еще одна попытка",
      backToMenu: "Назад в меню",
      practiceMode: "РЕЖИМ ТРЕНИРОВКИ",
      practiceAction: "Тренировать",
      resultNotFound: "Результат не найден",
      backToSimulator: "Вернуться в симулятор",
      finalPenalty: "Итоговый штраф",
      recordedErrors: "Зафиксировано ошибок",
      vehicle: "Автомобиль",
      errorList: "Список допущенных ошибок:",
      detailedReview: "Подробный разбор",
      thExercise: "Упражнение",
      thViolation: "Нарушение",
      thPenalty: "Штраф",
      thDate: "Дата",
      thMode: "Режим",
      thVehicle: "Автомобиль",
      thPoints: "Штрафные баллы",
      thTime: "Время",
      thStatus: "Статус",
      thAction: "Действие",
      retakeExam: "Сдать заново",
      refreshData: "Обновить данные",
      takeExam: "Сдать экзамен",
      exerciseCatalog: "Каталог упражнений",
      totalAttempts: "Всего попыток",
      passRate: "Процент сдачи",
      averagePenalty: "Средний штраф",
      penaltyLimitNote: "Лимит сдачи: до 99 баллов",
      averageTime: "Среднее время",
      statusPassed: "СДАНО",
      statusFailed: "НЕ СДАНО",
      actionResult: "Результат",
      actionErrors: "Ошибки",
      trainingPanel: "Главная симулятора",
      trainingMode: "РЕЖИМ ОБУЧЕНИЯ",
      selectExercise: "Упражнение (1-12):",
      resetPosition: "Сбросить положение",
      exerciseDone: "Упражнение выполнено!",
      repeatExercise: "Повторить",
      nextExercise: "Следующее упражнение",
      finishTraining: "Завершить обучение"
    }
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// Update uzl/translation.json
const uzlPath = path.join(LOCALES_DIR, 'uzl', 'translation.json');
const uzlData = JSON.parse(fs.readFileSync(uzlPath, 'utf8'));
// Merge dashboard
uzlData.dashboard = deepMerge(uzlData.dashboard || {}, dashboardUzl);
deepMerge(uzlData, extraKeys.uzl);
fs.writeFileSync(uzlPath, JSON.stringify(uzlData, null, 2), 'utf8');
console.log('Updated uzl/translation.json');

// Update uzc/translation.json
const uzcPath = path.join(LOCALES_DIR, 'uzc', 'translation.json');
const uzcData = JSON.parse(fs.readFileSync(uzcPath, 'utf8'));
uzcData.dashboard = deepMerge(uzcData.dashboard || {}, dashboardUzc);
deepMerge(uzcData, extraKeys.uzc);
fs.writeFileSync(uzcPath, JSON.stringify(uzcData, null, 2), 'utf8');
console.log('Updated uzc/translation.json');

// Update ru/translation.json
const ruPath = path.join(LOCALES_DIR, 'ru', 'translation.json');
const ruData = JSON.parse(fs.readFileSync(ruPath, 'utf8'));
ruData.dashboard = deepMerge(ruData.dashboard || {}, dashboardRu);
deepMerge(ruData, extraKeys.ru);
fs.writeFileSync(ruPath, JSON.stringify(ruData, null, 2), 'utf8');
console.log('Updated ru/translation.json');

console.log('Dictionaries successfully merged!');
