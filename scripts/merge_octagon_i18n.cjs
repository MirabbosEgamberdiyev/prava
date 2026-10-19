const fs = require('fs');
const path = require('path');

const translations = {
  uzl: {
    lobby: {
      groupBattle: "Guruhli Bahs",
      groupBattleDesc: "Do'stlar bilan xona ochib birgalikda bellashing",
      history: "Bahslar Tarixi",
      historyDesc: "Oldingi janglaringiz va ELO o'zgarishlari"
    },
    group: {
      title: "Guruhli Bahs (Party)",
      tabCreate: "Xona yaratish",
      tabJoin: "Xonaga qo'shilish",
      maxPlayers: "Maksimal ishtirokchilar soni:",
      privateRoom: "Xususiy xona",
      privateDesc: "Faqat kod orqali kirish mumkin",
      createBtn: "Xonani Yaratish",
      enterCode: "Xona kodi:",
      joinBtn: "Xonaga Kirish",
      roomCodeLabel: "XONA KODI",
      copied: "Nusxalandi!",
      copy: "Nusxalash",
      members: "Ishtirokchilar:",
      host: "Xona egasi",
      hostBadge: "Host",
      ready: "Tayyor",
      waiting: "Kutilmoqda...",
      leave: "Chiqish",
      startGame: "O'yinni Boshlash",
      setReady: "Men Tayyorman!",
      unready: "Bekor qilish"
    },
    history: {
      title: "Bahslar Tarixi",
      empty: "Hozircha yakunlangan janglar mavjud emas",
      win: "G'alaba",
      draw: "Durang",
      loss: "Mag'lubiyat",
      opponent: "Raqib",
      prev: "Oldingi",
      next: "Keyingi"
    },
    challenge: {
      incomingTitle: "Jangga Chorlov!",
      incomingPrompt: "Raqib siz bilan real vaqtda 1v1 Oktagonda kuch sinashmoqchi!",
      accept: "Qabul qilish",
      reject: "Rad etish"
    },
    duel: {
      tabSearch: "Foydalanuvchini qidirish",
      tabLink: "Havola va QR-kod",
      searchPlaceholder: "Ism, telefon yoki ID kiriting...",
      searchBtn: "Qidirish",
      statusInMatch: "Jangda",
      statusInQueue: "Qidiruvda",
      statusOnline: "Onlayn",
      statusOffline: "Oflayn",
      challengeSent: "Yuborildi...",
      challengeBtn: "Jangga Chorlash",
      noUsersFound: "Foydalanuvchi topilmadi",
      searchHint: "Do'stingizning ismi yoki ID raqamini kiriting",
      searchError: "Qidirishda xatolik yuz berdi"
    }
  },
  uzc: {
    lobby: {
      groupBattle: "Гуруҳли Баҳс",
      groupBattleDesc: "Дўстлар билан хона очиб биргаликда беллашинг",
      history: "Баҳслар Тарихи",
      historyDesc: "Олдинги жангларингиз ва ELO ўзгаришлари"
    },
    group: {
      title: "Гуруҳли Баҳс (Party)",
      tabCreate: "Хона яратиш",
      tabJoin: "Хонага қўшилиш",
      maxPlayers: "Максимал иштирокчилар сони:",
      privateRoom: "Хусусий хона",
      privateDesc: "Фақат код орқали кириш мумкин",
      createBtn: "Хонани Яратиш",
      enterCode: "Хона коди:",
      joinBtn: "Хонага Кириш",
      roomCodeLabel: "ХОНА КОДИ",
      copied: "Нусхаланди!",
      copy: "Нусхалаш",
      members: "Иштирокчилар:",
      host: "Хона эгаси",
      hostBadge: "Хост",
      ready: "Тайёр",
      waiting: "Кутилмоқда...",
      leave: "Чиқиш",
      startGame: "Ўйинни Бошлаш",
      setReady: "Мен Тайёрман!",
      unready: "Бекор қилиш"
    },
    history: {
      title: "Баҳслар Тарихи",
      empty: "Ҳозирча якунланган жанглар мавжуд эмас",
      win: "Ғалаба",
      draw: "Дуранг",
      loss: "Мағлубият",
      opponent: "Рақиб",
      prev: "Олдинги",
      next: "Кейинги"
    },
    challenge: {
      incomingTitle: "Жангга Чорлов!",
      incomingPrompt: "Рақиб сиз билан реал вақтда 1v1 Октагонда куч синашмоқчи!",
      accept: "Қабул қилиш",
      reject: "Рад этиш"
    },
    duel: {
      tabSearch: "Фойдаланувчини қидириш",
      tabLink: "Ҳавола ва QR-код",
      searchPlaceholder: "Исм, телефон ёки ID киритинг...",
      searchBtn: "Қидириш",
      statusInMatch: "Жангда",
      statusInQueue: "Қидирувда",
      statusOnline: "Онлайн",
      statusOffline: "Офлайн",
      challengeSent: "Юборилди...",
      challengeBtn: "Жангга Чорлаш",
      noUsersFound: "Фойдаланувчи топилмади",
      searchHint: "Дўстингизнинг исми ёки ID рақамини киритинг",
      searchError: "Қидиришда хатолик юз берди"
    }
  },
  ru: {
    lobby: {
      groupBattle: "Групповая битва",
      groupBattleDesc: "Создайте комнату и соревнуйтесь вместе с друзьями",
      history: "История битв",
      historyDesc: "Ваши прошлые матчи и изменения ELO"
    },
    group: {
      title: "Групповая битва (Party)",
      tabCreate: "Создать комнату",
      tabJoin: "Войти в комнату",
      maxPlayers: "Макс. участников:",
      privateRoom: "Приватная комната",
      privateDesc: "Вход только по коду",
      createBtn: "Создать комнату",
      enterCode: "Код комнаты:",
      joinBtn: "Войти",
      roomCodeLabel: "КОД КОМНАТЫ",
      copied: "Скопировано!",
      copy: "Копировать",
      members: "Участники:",
      host: "Хост комнаты",
      hostBadge: "Хост",
      ready: "Готов",
      waiting: "Ожидание...",
      leave: "Выйти",
      startGame: "Начать игру",
      setReady: "Я готов!",
      unready: "Отмена"
    },
    history: {
      title: "История битв",
      empty: "Пока нет завершенных битв",
      win: "Победа",
      draw: "Ничья",
      loss: "Поражение",
      opponent: "Соперник",
      prev: "Назад",
      next: "Вперед"
    },
    challenge: {
      incomingTitle: "Вызов на битву!",
      incomingPrompt: "Соперник хочет сразиться с вами 1 на 1 в реальном времени!",
      accept: "Принять",
      reject: "Отклонить"
    },
    duel: {
      tabSearch: "Поиск игрока",
      tabLink: "Ссылка и QR-код",
      searchPlaceholder: "Введите имя, телефон или ID...",
      searchBtn: "Найти",
      statusInMatch: "В битве",
      statusInQueue: "В поиске",
      statusOnline: "В сети",
      statusOffline: "Не в сети",
      challengeSent: "Отправлено...",
      challengeBtn: "Вызвать на дуэль",
      noUsersFound: "Игрок не найден",
      searchHint: "Введите имя или ID вашего друга",
      searchError: "Ошибка при поиске"
    }
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} });
      deepMerge(target[key], source[key]);
    } else {
      Object.assign(target, { [key]: source[key] });
    }
  }
  return target;
}

// 1. Web (prava-test)
['uzl', 'uzc', 'ru'].forEach(lang => {
  const file = path.join(__dirname, '../frontend/prava-test/src/locales', `${lang}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.octagon) data.octagon = {};
    deepMerge(data.octagon, translations[lang]);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + file);
  }
});

// 2. Desktop (prava-desktop-online)
['uzl', 'uzc', 'ru'].forEach(lang => {
  const file = path.join(__dirname, '../../prava-desktop-online/public/locales', lang, 'translation.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.octagon) data.octagon = {};
    deepMerge(data.octagon, translations[lang]);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    console.log('Updated ' + file);
  }
});
