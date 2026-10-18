const fs = require('fs');
const path = require('path');

const targetDirs = [
  'D:\\My-project\\PRAVA-ONLINE\\prava\\frontend\\prava-test\\src\\locales',
  'D:\\My-project\\PRAVA-ONLINE\\prava\\frontend\\prava-test\\public\\locales',
  'D:\\My-project\\PRAVA-ONLINE\\prava-desktop-online\\public\\locales'
];

const NEW_KEYS = {
  auth: {
    connecting: {
      uzl: "Ilovaga ulanmoqda...",
      uzc: "Иловага уланмоқда...",
      ru: "Подключение к приложению..."
    },
    google: {
      timeoutMessage: {
        uzl: "Google orqali kirish vaqti tugadi. Qaytadan urinib ko'ring.",
        uzc: "Google орқали кириш вақти тугади. Қайтадан уриниб кўринг.",
        ru: "Время входа через Google истекло. Пожалуйста, попробуйте снова."
      }
    },
    desktopBridgeTitle: {
      uzl: "Prava Online Desktop — Kirish",
      uzc: "Prava Online Desktop — Кириш",
      ru: "Prava Online Desktop — Вход"
    },
    desktopBridgeDesc: {
      uzl: "Prava Online Desktop ilovasiga xavfsiz kirish",
      uzc: "Prava Online Desktop иловасига хавфсиз кириш",
      ru: "Безопасный вход в приложение Prava Online Desktop"
    },
    loginWithTelegram: {
      uzl: "Telegram orqali kirish",
      uzc: "Telegram орқали кириш",
      ru: "Войти через Telegram"
    },
    loginWithGoogle: {
      uzl: "Google bilan kirish",
      uzc: "Google билан кириш",
      ru: "Войти через Google"
    },
    googleChecking: {
      uzl: "Google hisobi tekshirilmoqda...",
      uzc: "Google ҳисоби текширилмоқда...",
      ru: "Проверка учетной записи Google..."
    },
    tokenTransferring: {
      uzl: "Desktop ilovasiga token uzatilmoqda...",
      uzc: "Desktop иловасига токен узатилмоқда...",
      ru: "Передача токена в приложение..."
    },
    mobileTokenTransferring: {
      uzl: "Ilovaga token uzatilmoqda...",
      uzc: "Иловага токен узатилмоқда...",
      ru: "Передача токена в мобильное приложение..."
    },
    connectedSuccess: {
      uzl: "Muvaffaqiyatli ulandingiz!",
      uzc: "Муваффақиятли уландингиз!",
      ru: "Успешное подключение!"
    },
    desktopConnectedDesc: {
      uzl: "Prava Online Desktop ilovangizga kirildi. Dasturga qaytishingiz mumkin.",
      uzc: "Prava Online Desktop иловангизга кирилди. Дастурга қайтишингиз мумкин.",
      ru: "Вход в приложение Prava Online Desktop выполнен. Вы можете вернуться в программу."
    },
    mobileConnectedDesc: {
      uzl: "Prava Online ilovangizga muvaffaqiyatli kirildi. Ilovaga qaytishingiz mumkin.",
      uzc: "Prava Online иловангизга муваффақиятли кирилди. Иловага қайтишингиз мумкин.",
      ru: "Вход в приложение Prava Online выполнен успешно. Вы можете вернуться в приложение."
    },
    windowAutoCloses: {
      uzl: "Ushbu oyna {{count}} soniyada avtomatik yopiladi...",
      uzc: "Ушбу ойна {{count}} сонияда автоматик ёпилади...",
      ru: "Это окно закроется автоматически через {{count}} сек..."
    },
    backToApp: {
      uzl: "Ilovaga qaytish",
      uzc: "Иловага қайтиш",
      ru: "Вернуться в приложение"
    },
    closeWindow: {
      uzl: "Oynani yopish",
      uzc: "Ойнани ёпиш",
      ru: "Закрыть окно"
    },
    loginError: {
      uzl: "Kirishda xatolik yuz berdi",
      uzc: "Киришда хатолик юз берди",
      ru: "Произошла ошибка при входе"
    },
    retry: {
      uzl: "Qayta urinish",
      uzc: "Қайта уриниш",
      ru: "Повторить попытку"
    },
    promptTelegramDesktop: {
      uzl: "Desktop ilovangizga kirish uchun Telegram hisobingizni tasdiqlang.",
      uzc: "Desktop иловангизга кириш учун Telegram ҳисобингизни тасдиқланг.",
      ru: "Подтвердите учетную запись Telegram для входа в приложение Desktop."
    },
    promptTelegramMobile: {
      uzl: "Ilovaga kirish uchun Telegram hisobingizni tasdiqlang.",
      uzc: "Иловага кириш учун Telegram ҳисобингизни тасдиқланг.",
      ru: "Подтвердите учетную запись Telegram для входа в мобильное приложение."
    },
    promptGoogleDesktop: {
      uzl: "Desktop ilovangizga kirish uchun Google hisobingiz orqali 1 bosqichda kiring.",
      uzc: "Desktop иловангизга кириш учун Google ҳисобингиз орқали 1 босқичда киринг.",
      ru: "Войдите через Google в 1 клик для входа в приложение Desktop."
    },
    promptGoogleMobile: {
      uzl: "Prava Online ilovasiga kirish uchun Google hisobingiz orqali 1 bosqichda kiring.",
      uzc: "Prava Online иловасига кириш учун Google ҳисобингиз орқали 1 босқичда киринг.",
      ru: "Войдите через Google в 1 клик для входа в мобильное приложение."
    }
  },
  common: {
    exit: {
      uzl: "Chiqish",
      uzc: "Чиқиш",
      ru: "Выход"
    },
    mainContent: {
      uzl: "Asosiy kontent",
      uzc: "Асосий контент",
      ru: "Основное содержимое"
    }
  },
  exam: {
    elapsedTime: {
      uzl: "O'tgan vaqt",
      uzc: "Ўтган вақт",
      ru: "Прошедшее время"
    },
    timeRemaining: {
      uzl: "Qolgan vaqt",
      uzc: "Қолган вақт",
      ru: "Оставшееся время"
    }
  },
  examDesktop: {
    bookmarkHint: {
      uzl: "Savolni saqlash / belgilash (B)",
      uzc: "Саволни сақлаш / белгилаш (B)",
      ru: "Сохранить вопрос / закладка (B)"
    },
    navigation: {
      uzl: "Savollar navigatsiyasi",
      uzc: "Саволлар навигацияси",
      ru: "Навигация по вопросам"
    },
    noExplanation: {
      uzl: "Ushbu savol uchun qo'shimcha izoh kiritilmagan.",
      uzc: "Ушбу савол учун қўшимча изоҳ киритилмаган.",
      ru: "Для этого вопроса дополнительное пояснение отсутствует."
    },
    startExam: {
      uzl: "Imtihon topshirish",
      uzc: "Имтиҳон топшириш",
      ru: "Сдать экзамен"
    }
  },
  guest: {
    leaderboardTitle: {
      uzl: "Reytingni ko'rish",
      uzc: "Рейтингни кўриш",
      ru: "Просмотр рейтинга"
    },
    leaderboardDesc: {
      uzl: "Boshqa o'quvchilar bilan raqobatlashish va o'z o'rningizni bilish uchun tizimga kiring.",
      uzc: "Бошқа ўқувчилар билан рақобатлашиш ва ўз ўрнингизни билиш учун тизимга киринг.",
      ru: "Войдите в систему, чтобы соревноваться с другими учениками и видеть свое место в рейтинге."
    }
  },
  leaderboard: {
    emptyTitle: {
      uzl: "Reyting hali mavjud emas",
      uzc: "Рейтинг ҳали мавжуд эмас",
      ru: "Рейтинг пока недоступен"
    },
    emptyDesc: {
      uzl: "Ushbu davr bo'yicha imtihon natijalari mavjud emas. Imtihon topshirib birinchi o'rinni egallang!",
      uzc: "Ушбу давр бўйича имтиҳон натижалари мавжуд эмас. Имтиҳон топшириб биринчи ўринни эгалланг!",
      ru: "Нет результатов экзаменов за этот период. Сдайте экзамен и займите первое место!"
    }
  },
  packages: {
    defaultName: {
      uzl: "Maxsus o'quv paketi",
      uzc: "Махсус ўқув пакети",
      ru: "Специальный учебный пакет"
    }
  },
  qr: {
    appLoginSubtitle: {
      uzl: "Ilova orqali QR-kodni skanerlab tezkor kiring",
      uzc: "Илова орқали QR-кодни сканерлаб тезкор киринг",
      ru: "Войдите мгновенно, отсканировав QR-код через приложение"
    },
    rejected: {
      uzl: "Ulanish bekor qilindi",
      uzc: "Уланиш бекор қилинди",
      ru: "Подключение отклонено"
    }
  },
  topics: {
    availableCount: {
      uzl: "Mavjud: {{count}}",
      uzc: "Мавжуд: {{count}}",
      ru: "Доступно: {{count}}"
    },
    countBadge: {
      uzl: "{{count}} ta mavzu",
      uzc: "{{count}} та мавзу",
      ru: "{{count}} тем"
    },
    modalTitle: {
      uzl: "Mavzulashtirilgan test",
      uzc: "Мавзулаштирилган тест",
      ru: "Тематический тест"
    },
    questionCountLabel: {
      uzl: "Savollar soni",
      uzc: "Саволлар сони",
      ru: "Количество вопросов"
    },
    selectTopic: {
      uzl: "Mavzuni tanlang",
      uzc: "Мавзуни танланг",
      ru: "Выберите тему"
    },
    subtitleFull: {
      uzl: "Yo'l harakati qoidalarini mavzulashtirilgan tarzda tizimli o'rganing va testdan o'ting.",
      uzc: "Йўл ҳаракати қоидаларини мавзулаштирилган тарзда тизимли ўрганинг ва тестдан ўтинг.",
      ru: "Изучайте правила дорожного движения системно по темам и проходите тесты."
    }
  },
  survival: {
    resultSeoDesc: {
      uzl: "Xatogacha marafon natijasi",
      uzc: "Хатогача марафон натижаси",
      ru: "Результат марафона до первой ошибки"
    }
  },
  quiz: {
    questionNumber: {
      uzl: "{{num}}-savol",
      uzc: "{{num}}-савол",
      ru: "Вопрос {{num}}"
    }
  },
  simulator: {
    promo: {
      seoTitle: {
        uzl: "3D Avtodrom Simulyatori — Prava Online",
        uzc: "3D Автодром Симулятори — Prava Online",
        ru: "3D Симулятор автодрома — Prava Online"
      },
      seoDesc: {
        uzl: "Avtodromda haydash simulyatoridan to'liq foydalanish uchun Prava Online Desktop yoki Mobil versiyasini yuklab oling.",
        uzc: "Автодромда ҳайдаш симуляторидан тўлиқ фойдаланиш учун Prava Online Desktop ёки Мобил версиясини юклаб олинг.",
        ru: "Для полноценного использования симулятора вождения на автодроме скачайте Prava Online Desktop или мобильную версию."
      },
      badge: {
        uzl: "3D Avtodrom Simulyatori",
        uzc: "3D Автодром Симулятори",
        ru: "3D Симулятор автодрома"
      },
      title: {
        uzl: "Avtodromda haydash simulyatori",
        uzc: "Автодромда ҳайдаш симулятори",
        ru: "Симулятор вождения на автодроме"
      },
      lead: {
        uzl: "3D Simulyatordan to‘liq, silliq va yuqori unumdorlikda (60 FPS) foydalanish uchun Prava Online Desktop (Windows) yoki Mobil versiyasini yuklab oling!",
        uzc: "3D Симулятордан тўлиқ, силлиқ ва юқори унумдорликда (60 FPS) фойдаланиш учун Prava Online Desktop (Windows) ёки Мобил версиясини юклаб олинг!",
        ru: "Для плавного и высокопроизводительного использования 3D-симулятора со скоростью 60 FPS скачайте Prava Online Desktop (Windows) или мобильную версию!"
      },
      downloadWindows: {
        uzl: "Windows uchun yuklab olish (.exe)",
        uzc: "Windows учун юклаб олиш (.exe)",
        ru: "Скачать для Windows (.exe)"
      },
      allDownloads: {
        uzl: "Barcha versiyalar",
        uzc: "Барча версиялар",
        ru: "Все версии"
      },
      choosePlatform: {
        uzl: "Qurilmangizni tanlang",
        uzc: "Қурилмангизни танланг",
        ru: "Выберите ваше устройство"
      },
      recommended: {
        uzl: "Tavsiya etiladi",
        uzc: "Тавсия этилади",
        ru: "Рекомендуется"
      },
      downloadExe: {
        uzl: "O‘rnatish (.exe)",
        uzc: "Ўрнатиш (.exe)",
        ru: "Установить (.exe)"
      },
      mobileApp: {
        uzl: "Mobil ilova",
        uzc: "Мобил илова",
        ru: "Мобильное приложение"
      },
      appleDevice: {
        uzl: "iPhone & iPad",
        uzc: "iPhone & iPad",
        ru: "iPhone и iPad"
      },
      whyDesktop: {
        uzl: "Nega alohida dasturda foydalanish tavsiya etiladi?",
        uzc: "Нега алоҳида дастурда фойдаланиш тавсия этилади?",
        ru: "Почему рекомендуется использовать отдельное приложение?"
      },
      feature1Title: {
        uzl: "To‘liq GPU tezlanishi",
        uzc: "Тўлиқ GPU тезланиши",
        ru: "Полное ускорение GPU"
      },
      feature1Desc: {
        uzl: "Brauzer cheklovlarisiz to‘liq video karta kuchidan foydalanadi va silliq 60 FPS beradi.",
        uzc: "Браузер чекловларисиз тўлиқ видео карта кучидан фойдаланади ва силлиқ 60 FPS беради.",
        ru: "Использует всю мощь видеокарты без ограничений браузера и обеспечивает плавные 60 FPS."
      },
      feature2Title: {
        uzl: "Rul va Geympad",
        uzc: "Рул ва Геймпад",
        ru: "Руль и Геймпад"
      },
      feature2Desc: {
        uzl: "Logitech, Thrustmaster va geympadlarni ulab, haqiqiy mashinadagidek his eting.",
        uzc: "Logitech, Thrustmaster ва геймпадларни улаб, ҳақиқий машинадагидек ҳис этинг.",
        ru: "Подключайте рули Logitech, Thrustmaster и геймпады для ощущений настоящего автомобиля."
      },
      feature3Title: {
        uzl: "Oflayn ishlash",
        uzc: "Офлайн ишлаш",
        ru: "Работа офлайн"
      },
      feature3Desc: {
        uzl: "Bir marta yuklab oling va internetsiz ham barcha avtodrom mashqlarini bajaring.",
        uzc: "Бир марта юклаб олинг ва интернетсиз ҳам барча автодром машқларини бажаринг.",
        ru: "Скачайте один раз и выполняйте все упражнения автодрома даже без интернета."
      },
      feature4Title: {
        uzl: "100% Imtihon Standartlari",
        uzc: "100% Имтиҳон Стандартлари",
        ru: "100% Стандарты экзамена"
      },
      feature4Desc: {
        uzl: "YHXX amaliy imtihon avtodromining estakada, parallel parkovka va garaj mashqlari nusxasi.",
        uzc: "ЙҲХХ амалий имтиҳон автодромининг эстакада, параллел парковка ва гараж машқлари нусхаси.",
        ru: "Точная копия упражнений эстакады, параллельной парковки и въезда в бокс автодрома СБДД."
      },
      featDesktop1: {
        uzl: "To‘liq 3D Avtodrom va real avtomobil fizikasi",
        uzc: "Тўлиқ 3D Автодром ва реал автомобил физикаси",
        ru: "Полноценный 3D-автодром и реалистичная физика автомобиля"
      },
      featDesktop2: {
        uzl: "Rul chambaragi, geympad va klaviatura bilan boshqarish",
        uzc: "Рул чамбараги, геймпад ва клавиатура билан бошқариш",
        ru: "Управление рулем, геймпадом и клавиатурой"
      },
      featDesktop3: {
        uzl: "Internet talab qilmaydigan 100% oflayn rejim",
        uzc: "Интернет талаб қилмайдиган 100% офлайн режим",
        ru: "100% офлайн-режим, не требующий интернета"
      },
      featDesktop4: {
        uzl: "Ultra HD grafika va 0ms minimal kechikish",
        uzc: "Ultra HD графика ва 0ms минимал кечикиш",
        ru: "Графика Ultra HD и минимальная задержка отклика"
      },
      featMobile1: {
        uzl: "Istalgan joyda smartfonda mashq qilish",
        uzc: "Исталган жойда смартфонда машқ қилиш",
        ru: "Тренировки на смартфоне в любом месте"
      },
      featMobile2: {
        uzl: "Sensorli virtual rul va boshqaruv pedallari",
        uzc: "Сенсорли виртуал рул ва бошқарув педаллари",
        ru: "Сенсорный виртуальный руль и педали управления"
      },
      featMobile3: {
        uzl: "Google Play orqali avtomatik yangilanish",
        uzc: "Google Play орқали автоматик янгиланиш",
        ru: "Автоматические обновления через Google Play"
      },
      featMobile4: {
        uzl: "To‘g‘ridan-to‘g‘ri APK orqali tezkor o‘rnatish",
        uzc: "Тўғридан-тўғри APK орқали тезкор ўрнатиш",
        ru: "Быстрая установка напрямую через APK-файл"
      },
      featApple1: {
        uzl: "Metal grafik tezlatgich bilan silliq kadrlar",
        uzc: "Metal график тезлатгич билан силлиқ кадрлар",
        ru: "Плавная частота кадров с ускорением Metal"
      },
      featApple2: {
        uzl: "iPhone va iPad ekranlariga moslashtirilgan interfeys",
        uzc: "iPhone ва iPad экранларига мослаштирилган интерфейс",
        ru: "Интерфейс, оптимизированный под экраны iPhone и iPad"
      },
      featApple3: {
        uzl: "Apple ID orqali natijalarni sinxronlashtirish",
        uzc: "Apple ID орқали натижаларни синхронлаштириш",
        ru: "Синхронизация результатов через Apple ID"
      },
      featApple4: {
        uzl: "App Store rasmiy do‘koni orqali himoyalangan",
        uzc: "App Store расмий дўкони орқали ҳимояланган",
        ru: "Безопасная загрузка через официальный App Store"
      },
      loadingAutodrome: {
        uzl: "Avtodrom yuklanmoqda...",
        uzc: "Автодром юкланмоқда...",
        ru: "Загрузка автодрома..."
      },
      platformWindows: {
        uzl: "Windows Desktop",
        uzc: "Windows Desktop",
        ru: "Windows Desktop"
      },
      platformWindowsSpecs: {
        uzl: "Windows 10 / 11 (64-bit) • 60 FPS Engine",
        uzc: "Windows 10 / 11 (64-bit) • 60 FPS Двигатель",
        ru: "Windows 10 / 11 (64-бит) • Движок 60 FPS"
      },
      platformAndroid: {
        uzl: "Android Ilova",
        uzc: "Android Илова",
        ru: "Приложение Android"
      },
      platformAndroidSpecs: {
        uzl: "Android 8.0+ • Google Play & APK",
        uzc: "Android 8.0+ • Google Play & APK",
        ru: "Android 8.0+ • Google Play и APK"
      },
      platformIos: {
        uzl: "iOS / iPadOS",
        uzc: "iOS / iPadOS",
        ru: "iOS / iPadOS"
      },
      platformIosSpecs: {
        uzl: "iOS 15.0+ • iPhone va iPad",
        uzc: "iOS 15.0+ • iPhone ва iPad",
        ru: "iOS 15.0+ • iPhone и iPad"
      }
    }
  }
};

function deepMerge(target, source, lang) {
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !('uzl' in val)) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], val, lang);
    } else if (val && typeof val === 'object' && ('uzl' in val)) {
      target[key] = val[lang] ?? val['uzl'];
    }
  }
}

const langs = ['uzl', 'uzc', 'ru'];

// 1. Update src/locales/*.json in prava-test
const webSrcLocales = 'D:\\My-project\\PRAVA-ONLINE\\prava\\frontend\\prava-test\\src\\locales';
for (const lang of langs) {
  const filePath = path.join(webSrcLocales, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, NEW_KEYS, lang);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
}

// 2. Update public/locales/*/translation.json in prava-test
const webPubLocales = 'D:\\My-project\\PRAVA-ONLINE\\prava\\frontend\\prava-test\\public\\locales';
for (const lang of langs) {
  const filePath = path.join(webPubLocales, lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, NEW_KEYS, lang);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
}

// 3. Update public/locales/*/translation.json in prava-desktop-online
const deskPubLocales = 'D:\\My-project\\PRAVA-ONLINE\\prava-desktop-online\\public\\locales';
for (const lang of langs) {
  const filePath = path.join(deskPubLocales, lang, 'translation.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  deepMerge(data, NEW_KEYS, lang);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
}

console.log('ALL LOCALES SUCCESSFULLY PATCHED!');
