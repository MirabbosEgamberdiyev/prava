import { Anchor, Divider, List, Stack, Text, Title } from "@mantine/core";
import { IconUserX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

const SUPPORT_EMAIL = "info@pravaonline.uz";
const SUPPORT_TELEGRAM = "https://t.me/pravaonline_support";

type Copy = {
  badge: string;
  title: string;
  intro: string;
  inAppTitle: string;
  inAppSteps: string[];
  requestTitle: string;
  requestText: string;
  requestSteps: string[];
  deletedTitle: string;
  deleted: string[];
  keptTitle: string;
  kept: string[];
  timing: string;
};

const COPY: Record<"uzl" | "uzc" | "ru", Copy> = {
  uzl: {
    badge: "Google Play talabi",
    title: "Hisobni va ma'lumotlarni o'chirish",
    intro:
      "Bu sahifa \"PravaOnline\" mobil ilovasi (Android, uz.pravaimtihon) va pravaonline.uz platformasi foydalanuvchilari uchun. Dasturchi: Prava Online.",
    inAppTitle: "1. Ilova ichida (eng tez yo'l)",
    inAppSteps: [
      "PravaOnline ilovasini oching va hisobingizga kiring.",
      "Pastki menyudan \"Profil\" bo'limiga o'ting.",
      "\"Hisob\" bo'limida \"Hisobni o'chirish\" ni bosing va tasdiqlang.",
    ],
    requestTitle: "2. Ilovani ochmasdan so'rov yuborish",
    requestText: "Ilova o'rnatilmagan bo'lsa yoki unga kira olmasangiz, so'rov yuboring:",
    requestSteps: [
      `E-mail: ${SUPPORT_EMAIL} (mavzu: "Hisobni o'chirish")`,
      "Telegram: @pravaonline_support",
      "Xabarda hisobga bog'langan Telegram username, Google e-mail yoki telefon raqamini yozing.",
    ],
    deletedTitle: "Nimalar o'chiriladi",
    deleted: [
      "Profil: ism, familiya, telefon, e-mail, Google va Telegram identifikatorlari, profil rasmi, parol",
      "Imtihon va bilet natijalari, statistika, xatolar ro'yxati, saqlangan savollar",
      "Simulyator natijalari, paket ruxsatlari",
      "Barcha faol sessiyalar va qurilmalarga kirish (tokenlar)",
      "Telefondagi ilova ma'lumotlari (ilova ichida o'chirilganda)",
    ],
    keptTitle: "Nimalar saqlanadi",
    kept: [
      "To'lov tranzaksiyalari yozuvlari (summa, sana, provayder ID) — soliq va buxgalteriya qonunchiligi talabi bilan 5 yilgacha, sizning ismingiz va kontaktlaringizsiz (anonim).",
    ],
    timing:
      "Ilova ichidagi o'chirish darhol bajariladi. E-mail/Telegram orqali yuborilgan so'rovlar 7 ish kuni ichida bajariladi. O'chirilgan hisobni tiklab bo'lmaydi.",
  },
  uzc: {
    badge: "Google Play талаби",
    title: "Ҳисобни ва маълумотларни ўчириш",
    intro:
      "Бу саҳифа \"PravaOnline\" мобил иловаси (Android, uz.pravaimtihon) ва pravaonline.uz платформаси фойдаланувчилари учун. Дастурчи: Prava Online.",
    inAppTitle: "1. Илова ичида (энг тез йўл)",
    inAppSteps: [
      "PravaOnline иловасини очинг ва ҳисобингизга киринг.",
      "Пастки менюдан \"Профил\" бўлимига ўтинг.",
      "\"Ҳисоб\" бўлимида \"Ҳисобни ўчириш\" ни босинг ва тасдиқланг.",
    ],
    requestTitle: "2. Иловани очмасдан сўров юбориш",
    requestText: "Илова ўрнатилмаган бўлса ёки унга кира олмасангиз, сўров юборинг:",
    requestSteps: [
      `E-mail: ${SUPPORT_EMAIL} (мавзу: "Ҳисобни ўчириш")`,
      "Telegram: @pravaonline_support",
      "Хабарда ҳисобга боғланган Telegram username, Google e-mail ёки телефон рақамини ёзинг.",
    ],
    deletedTitle: "Нималар ўчирилади",
    deleted: [
      "Профил: исм, фамилия, телефон, e-mail, Google ва Telegram идентификаторлари, профил расми, парол",
      "Имтиҳон ва билет натижалари, статистика, хатолар рўйхати, сақланган саволлар",
      "Симулятор натижалари, пакет рухсатлари",
      "Барча фаол сессиялар ва қурилмаларга кириш (токенлар)",
      "Телефондаги илова маълумотлари (илова ичида ўчирилганда)",
    ],
    keptTitle: "Нималар сақланади",
    kept: [
      "Тўлов транзакциялари ёзувлари (сумма, сана, провайдер ID) — солиқ ва бухгалтерия қонунчилиги талаби билан 5 йилгача, исмингиз ва контактларингизсиз (аноним).",
    ],
    timing:
      "Илова ичидаги ўчириш дарҳол бажарилади. E-mail/Telegram орқали юборилган сўровлар 7 иш куни ичида бажарилади. Ўчирилган ҳисобни тиклаб бўлмайди.",
  },
  ru: {
    badge: "Требование Google Play",
    title: "Удаление аккаунта и данных",
    intro:
      "Эта страница для пользователей мобильного приложения «PravaOnline» (Android, uz.pravaimtihon) и платформы pravaonline.uz. Разработчик: Prava Online.",
    inAppTitle: "1. В приложении (самый быстрый способ)",
    inAppSteps: [
      "Откройте приложение PravaOnline и войдите в аккаунт.",
      "В нижнем меню откройте «Профиль».",
      "В разделе «Аккаунт» нажмите «Удалить аккаунт» и подтвердите.",
    ],
    requestTitle: "2. Запрос без приложения",
    requestText: "Если приложение не установлено или вы не можете войти, отправьте запрос:",
    requestSteps: [
      `E-mail: ${SUPPORT_EMAIL} (тема: «Удаление аккаунта»)`,
      "Telegram: @pravaonline_support",
      "Укажите Telegram username, Google e-mail или номер телефона, привязанный к аккаунту.",
    ],
    deletedTitle: "Что удаляется",
    deleted: [
      "Профиль: имя, фамилия, телефон, e-mail, идентификаторы Google и Telegram, фото профиля, пароль",
      "Результаты экзаменов и билетов, статистика, список ошибок, сохранённые вопросы",
      "Результаты симулятора, доступы к пакетам",
      "Все активные сессии и доступ с устройств (токены)",
      "Данные приложения на телефоне (при удалении в приложении)",
    ],
    keptTitle: "Что сохраняется",
    kept: [
      "Записи платёжных транзакций (сумма, дата, ID провайдера) — до 5 лет по требованию налогового и бухгалтерского законодательства, без вашего имени и контактов (анонимно).",
    ],
    timing:
      "Удаление в приложении выполняется сразу. Запросы по e-mail/Telegram выполняются в течение 7 рабочих дней. Удалённый аккаунт восстановить нельзя.",
  },
};

export default function AccountDeletion_Page() {
  const { i18n } = useTranslation();
  const lang = (i18n.language === "ru" || i18n.language === "uzc" ? i18n.language : "uzl") as keyof typeof COPY;
  const c = COPY[lang];

  return (
    <>
      <SEO title={c.title} description={c.intro} canonical="/account-deletion" />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconUserX size={13} />
            <span>{c.badge}</span>
          </div>
          <h1 className="saas-page-title">{c.title}</h1>
          <p className="saas-page-subtitle">{c.intro}</p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Title order={3} size="h4">{c.inAppTitle}</Title>
            <List type="ordered" size="sm" spacing="xs">
              {c.inAppSteps.map((s) => <List.Item key={s}>{s}</List.Item>)}
            </List>

            <Divider my="sm" />

            <Title order={3} size="h4">{c.requestTitle}</Title>
            <Text size="sm" c="dimmed">{c.requestText}</Text>
            <List size="sm" spacing="xs">
              <List.Item>
                <Anchor href={`mailto:${SUPPORT_EMAIL}`}>{c.requestSteps[0]}</Anchor>
              </List.Item>
              <List.Item>
                <Anchor href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">{c.requestSteps[1]}</Anchor>
              </List.Item>
              <List.Item>{c.requestSteps[2]}</List.Item>
            </List>

            <Divider my="sm" />

            <Title order={3} size="h4">{c.deletedTitle}</Title>
            <List size="sm" spacing="xs">
              {c.deleted.map((s) => <List.Item key={s}>{s}</List.Item>)}
            </List>

            <Title order={3} size="h4" mt="xs">{c.keptTitle}</Title>
            <List size="sm" spacing="xs">
              {c.kept.map((s) => <List.Item key={s}>{s}</List.Item>)}
            </List>

            <Divider my="sm" />

            <Text size="sm" lh={1.8}>{c.timing}</Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
