const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'src', 'locales');
const PUBLIC_LOCALES_DIR = path.join(ROOT, 'public', 'locales');

const translations = {
  "uzl": {
    "desktopShell": {
      "nav": {
        "octagon": "Oktagon (1v1 PvP)"
      }
    },
    "dashboard": {
      "modes": {
        "octagonTitle": "Oktagon (1v1 PvP)",
        "octagonDesc": "Real vaqt rejimida boshqa haydovchilar bilan intellektual bellashuv va ELO reytingi"
      }
    },
    "octagon": {
      "rules": {
        "title": "Oktagon Qoidalari",
        "subtitle": "1v1 Intellektual arena – haqiqiy bilimlar jangi!",
        "rule1Title": "10 ta Savol, Har biriga 30 soniya",
        "rule1Desc": "Vaqt tugashidan oldin to'g'ri variantni tanlang.",
        "rule2Title": "Tezlik va Aniqlik",
        "rule2Desc": "Qancha tezroq to'g'ri topsangiz, shuncha yuqori ball olasiz.",
        "rule3Title": "Reyting va Ligalar (ELO)",
        "rule3Desc": "G'alaba qozonib Bronzadan Brilliant ligasigacha ko'tariling!",
        "waitCountdown": "{{sec}} soniya kuting...",
        "understand": "TUSHUNDIM"
      },
      "guest": {
        "title": "Oktagon Arenaga Kirish",
        "desc": "Jangni mehmon sifatida boshlashingiz yoki natijalaringiz saqlanib qolishi uchun tizimga kirishingiz mumkin.",
        "nicknameLabel": "Sizning Laqabingiz (Nickname):",
        "placeholder": "Masalan: Tezkor_Haydovchi",
        "randomize": "Boshqa nom tanlash",
        "continueAsGuest": "Mehmon sifatida o'ynash",
        "or": "Yoki",
        "loginToSave": "Tizimga kirish (Natijalarni saqlash)"
      },
      "radar": {
        "connectingBot": "Zaxira botga ulanmoqda...",
        "searchingOpponent": "Teng kuchli raqib qidirilmoqda...",
        "botDesc": "Kutib qolmasligingiz uchun insondek o'ylanuvchi bot ulanmoqda",
        "eloMatchDesc": "Sizning ELO reytingingizga mos raqib saralanmoqda",
        "cancel": "Qidiruvni bekor qilish"
      },
      "leaderboard": {
        "title": "Peshqadamlar Jadvali",
        "weekly": "Haftalik",
        "monthly": "Oylik",
        "allTime": "Umumiy",
        "empty": "Hozircha natijalar mavjud emas",
        "winsAndMatches": "{{wins}} G'alaba • {{total}} Jang",
        "rankCol": "O'rin",
        "userCol": "Foydalanuvchi",
        "leagueCol": "Liga",
        "scoreCol": "ELO Ball"
      },
      "duel": {
        "title": "Do'st bilan Duel",
        "subtitle": "Do'stingizga ushbu havolani yuboring va 1v1 jangda o'zaro kuch sinashing!",
        "scanQr": "Kamera orqali QR-kodni skaner qiling",
        "inviteLink": "Taklif havolasi:",
        "copy": "Nusxalash",
        "copied": "Nusxalandi!",
        "orCode": "Yoki taklif kodini kiriting",
        "enterCodePlaceholder": "Duel kodi (masalan: 123456)",
        "join": "Qo'shilish"
      },
      "arena": {
        "opponent": "Raqib",
        "imageAlt": "Savol chizmasi",
        "preloadingTitle": "Raqib topildi!",
        "preloadingDesc": "Savollar va rasmlar oldindan yuklanmoqda (8 soniya)...",
        "countdownDesc": "Diqqat qiling, jang hoziroq boshlanadi!",
        "you": "Siz",
        "points": "ball",
        "questionNumber": "Savol {{curr}} / {{total}}",
        "hotkeyTip": "1-4 yoki A-D klavishlarini bosishingiz mumkin",
        "loadingQuestion": "Savol yuklanmoqda...",
        "reactions": "Reaksiyalar:"
      },
      "result": {
        "victory": "G'ALABA!",
        "draw": "DURANG!",
        "defeat": "MAG'LUBIYAT",
        "winDesc": "Ajoyib g'alaba! Bilimlaringiz yuksak darajada.",
        "drawDesc": "Teng kurash! Ikkala tomon ham mahorat ko'rsatdi.",
        "loseDesc": "Tushkunlikka tushmang! Xatolarni o'rganing va qasos oling.",
        "eloChange": "Reyting o'zgarishi:",
        "waitingRevenge": "Raqib javobi kutilmoqda...",
        "requestRevenge": "Qasos (Rematch) talab qilish",
        "backToLobby": "Lobbiyga qaytish"
      },
      "lobby": {
        "guest": "Mehmon O'yinchi",
        "tagline": "Haqiqiy raqiblar bilan real vaqt rejimida bilim sinovi!",
        "rating": "Reyting",
        "wins": "G'alabalar",
        "winRate": "G'alaba %",
        "streak": "Seriya",
        "startSearch": "QIDIRISHNI BOSHLASH",
        "duelFriend": "Do'st bilan duel",
        "leaderboard": "Peshqadamlar",
        "viewRules": "Oktagon qoidalari bilan tanishish"
      },
      "rank": {
        "brilliant": "Brilliant",
        "gold": "Oltin",
        "silver": "Kumush",
        "bronze": "Bronza"
      }
    }
  },
  "uzc": {
    "desktopShell": {
      "nav": {
        "octagon": "Октагон (1v1 PvP)"
      }
    },
    "dashboard": {
      "modes": {
        "octagonTitle": "Октагон (1v1 PvP)",
        "octagonDesc": "Реал вақт режимида бошқа ҳайдовчилар билан интеллектуал беллашув ва ELO рейтинги"
      }
    },
    "octagon": {
      "rules": {
        "title": "Октагон Қоидалари",
        "subtitle": "1v1 Интеллектуал арена – ҳақиқий билимлар жанги!",
        "rule1Title": "10 та Савол, Ҳар бирига 30 сония",
        "rule1Desc": "Вақт тугашидан олдин тўғри вариантни танланг.",
        "rule2Title": "Тезлик ва Аниқлик",
        "rule2Desc": "Қанча тезроқ тўғри топсангиз, шунча юқори балл оласиз.",
        "rule3Title": "Рейтинг ва Лигалар (ELO)",
        "rule3Desc": "Ғалаба қозониб Бронзадан Бриллиант лигасигача кўтарилингиз!",
        "waitCountdown": "{{sec}} сония кутинг...",
        "understand": "ТУШУНДИМ"
      },
      "guest": {
        "title": "Октагон Аренага Кириш",
        "desc": "Жангни меҳмон сифатида бошлашингиз ёки натижаларингиз сақланиб қолиши учун тизимга киришингиз мумкин.",
        "nicknameLabel": "Сизнинг Лақабингиз (Nickname):",
        "placeholder": "Масалан: Тезкор_Ҳайдовчи",
        "randomize": "Бошқа ном танлаш",
        "continueAsGuest": "Меҳмон сифатида ўйнаш",
        "or": "Ёки",
        "loginToSave": "Тизимга кириш (Натижаларни сақлаш)"
      },
      "radar": {
        "connectingBot": "Захира ботга уланмоқда...",
        "searchingOpponent": "Тенг кучли рақиб қидирилмоқда...",
        "botDesc": "Кутиб қолмаслигингиз учун инсондек ўйланувчи бот уланмоқда",
        "eloMatchDesc": "Сизнинг ELO рейтингингизга мос рақиб сараланмоқда",
        "cancel": "Қидирувни бекор қилиш"
      },
      "leaderboard": {
        "title": "Пешқадамлар Жадвали",
        "weekly": "Ҳафталик",
        "monthly": "Ойлик",
        "allTime": "Умумий",
        "empty": "Ҳозирча натижалар мавжуд эмас",
        "winsAndMatches": "{{wins}} Ғалаба • {{total}} Жанг",
        "rankCol": "Ўрин",
        "userCol": "Фойдаланувчи",
        "leagueCol": "Лига",
        "scoreCol": "ELO Балл"
      },
      "duel": {
        "title": "Дўст билан Дуэль",
        "subtitle": "Дўстингизга ушбу ҳаволани юборинг ва 1v1 жангда ўзаро куч синашинг!",
        "scanQr": "Камера орқали QR-кодни сканер қилинг",
        "inviteLink": "Таклиф ҳаволаси:",
        "copy": "Нусхалаш",
        "copied": "Нусхаланди!",
        "orCode": "Ёки таклиф кодини киритинг",
        "enterCodePlaceholder": "Дуэль коди (масалан: 123456)",
        "join": "Қўшилиш"
      },
      "arena": {
        "opponent": "Рақиб",
        "imageAlt": "Савол чизмаси",
        "preloadingTitle": "Рақиб топилди!",
        "preloadingDesc": "Саволлар ва расмлар олдиндан юкланмоқда (8 сония)...",
        "countdownDesc": "Диққат қилинг, жанг ҳозироқ бошланади!",
        "you": "Сиз",
        "points": "балл",
        "questionNumber": "Савол {{curr}} / {{total}}",
        "hotkeyTip": "1-4 ёки A-D клавишларини босишингиз мумкин",
        "loadingQuestion": "Савол юкланмоқда...",
        "reactions": "Реакциялар:"
      },
      "result": {
        "victory": "ҒАЛАБА!",
        "draw": "ДУРАНГ!",
        "defeat": "МАҒЛУБИЯТ",
        "winDesc": "Ажойиб ғалаба! Билимларингиз юксак даражада.",
        "drawDesc": "Тенг кураш! Иккала томон ҳам маҳорат кўрсатди.",
        "loseDesc": "Тушкунликка тушманг! Хатоларни ўрганинг ва қасос олинг.",
        "eloChange": "Рейтинг ўзгариши:",
        "waitingRevenge": "Рақиб жавоби кутилмоқда...",
        "requestRevenge": "Қасос (Rematch) талаб қилиш",
        "backToLobby": "Лоббийга қайтиш"
      },
      "lobby": {
        "guest": "Меҳмон Ўйинчи",
        "tagline": "Ҳақиқий рақиблар билан реал вақт режимида билим синови!",
        "rating": "Рейтинг",
        "wins": "Ғалабалар",
        "winRate": "Ғалаба %",
        "streak": "Серия",
        "startSearch": "ҚИДИРИШНИ БОШЛАШ",
        "duelFriend": "Дўст билан дуэль",
        "leaderboard": "Пешқадамлар",
        "viewRules": "Октагон қоидалари билан танишиш"
      },
      "rank": {
        "brilliant": "Бриллиант",
        "gold": "Олтин",
        "silver": "Кумуш",
        "bronze": "Бронза"
      }
    }
  },
  "ru": {
    "desktopShell": {
      "nav": {
        "octagon": "Октагон (1v1 PvP)"
      }
    },
    "dashboard": {
      "modes": {
        "octagonTitle": "Октагон (1v1 PvP)",
        "octagonDesc": "Интеллектуальная битва в реальном времени с другими водителями и ELO рейтинг"
      }
    },
    "octagon": {
      "rules": {
        "title": "Правила Октагона",
        "subtitle": "1v1 Интеллектуальная арена – настоящая битва знаний!",
        "rule1Title": "10 вопросов, по 30 секунд на каждый",
        "rule1Desc": "Выберите правильный вариант до истечения времени.",
        "rule2Title": "Скорость и точность",
        "rule2Desc": "Чем быстрее и точнее вы ответите, тем больше очков получите.",
        "rule3Title": "Рейтинг и лиги (ELO)",
        "rule3Desc": "Побеждайте и поднимайтесь от Бронзовой до Бриллиантовой лиги!",
        "waitCountdown": "Подождите {{sec}} сек...",
        "understand": "ПОНЯТНО"
      },
      "guest": {
        "title": "Вход в Арену Октагон",
        "desc": "Вы можете начать игру как гость или войти в систему для сохранения результатов.",
        "nicknameLabel": "Ваш псевдоним (Никнейм):",
        "placeholder": "Например: Быстрый_Водитель",
        "randomize": "Выбрать другое имя",
        "continueAsGuest": "Играть как гость",
        "or": "Или",
        "loginToSave": "Войти в систему (сохранить результаты)"
      },
      "radar": {
        "connectingBot": "Подключение к запасному боту...",
        "searchingOpponent": "Поиск равного соперника...",
        "botDesc": "Чтобы не заставлять вас ждать, подключается человекоподобный бот",
        "eloMatchDesc": "Подбор соперника по вашему ELO рейтингу",
        "cancel": "Отменить поиск"
      },
      "leaderboard": {
        "title": "Таблица Лидеров",
        "weekly": "За неделю",
        "monthly": "За месяц",
        "allTime": "За все время",
        "empty": "Пока нет результатов",
        "winsAndMatches": "{{wins}} Побед • {{total}} Игр",
        "rankCol": "Место",
        "userCol": "Пользователь",
        "leagueCol": "Лига",
        "scoreCol": "ELO Баллы"
      },
      "duel": {
        "title": "Дуэль с Другом",
        "subtitle": "Отправьте эту ссылку другу и сразитесь в битве 1 на 1!",
        "scanQr": "Отсканируйте QR-код камерой",
        "inviteLink": "Ссылка для приглашения:",
        "copy": "Копировать",
        "copied": "Скопировано!",
        "orCode": "Или введите код приглашения",
        "enterCodePlaceholder": "Код дуэли (например: 123456)",
        "join": "Присоединиться"
      },
      "arena": {
        "opponent": "Соперник",
        "imageAlt": "Иллюстрация к вопросу",
        "preloadingTitle": "Соперник найден!",
        "preloadingDesc": "Предварительная загрузка вопросов и изображений (8 секунд)...",
        "countdownDesc": "Внимание, битва начинается прямо сейчас!",
        "you": "Вы",
        "points": "очков",
        "questionNumber": "Вопрос {{curr}} / {{total}}",
        "hotkeyTip": "Вы можете нажимать клавиши 1-4 или A-D",
        "loadingQuestion": "Загрузка вопроса...",
        "reactions": "Реакции:"
      },
      "result": {
        "victory": "ПОБЕДА!",
        "draw": "НИЧЬЯ!",
        "defeat": "ПОРАЖЕНИЕ",
        "winDesc": "Отличная победа! Ваши знания на высоте.",
        "drawDesc": "Равная борьба! Обе стороны проявили мастерство.",
        "loseDesc": "Не унывайте! Разберите ошибки и возьмите реванш.",
        "eloChange": "Изменение рейтинга:",
        "waitingRevenge": "Ожидание ответа соперника...",
        "requestRevenge": "Потребовать реванш (Rematch)",
        "backToLobby": "Вернуться в лобби"
      },
      "lobby": {
        "guest": "Гостевой игрок",
        "tagline": "Проверка знаний в реальном времени с реальными соперниками!",
        "rating": "Рейтинг",
        "wins": "Побед",
        "winRate": "Побед %",
        "streak": "Серия",
        "startSearch": "НАЧАТЬ ПОИСК",
        "duelFriend": "Дуэль с другом",
        "leaderboard": "Лидеры",
        "viewRules": "Ознакомиться с правилами Октагона"
      },
      "rank": {
        "brilliant": "Бриллиант",
        "gold": "Золото",
        "silver": "Серебро",
        "bronze": "Бронза"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const lng of ['uzl', 'uzc', 'ru']) {
  const filePath = path.join(LOCALES_DIR, `${lng}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    deepMerge(data, translations[lng]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
  }

  // Also sync to public/locales/<lng>/common.json if exists
  const publicDir = path.join(PUBLIC_LOCALES_DIR, lng);
  if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const f of files) {
      if (f.endsWith('.json')) {
        const pf = path.join(publicDir, f);
        try {
          const pdata = JSON.parse(fs.readFileSync(pf, 'utf8'));
          deepMerge(pdata, translations[lng]);
          fs.writeFileSync(pf, JSON.stringify(pdata, null, 2), 'utf8');
          console.log(`Updated public locale: ${pf}`);
        } catch (e) {
          // ignore
        }
      }
    }
  }
}
console.log('Finished updating translations.');
