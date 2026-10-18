import { Link } from "react-router-dom";
import {
  Anchor,
  Divider,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

// Google Play talabi: mobil ilova to'playdigan ma'lumotlar, ruxsatlar va o'chirish yo'li
const APP_SECTION = {
  uzl: {
    title: "7. Mobil ilova (PravaOnline, Android) va hisobni o'chirish",
    text:
      "Mobil ilova kirish uchun Google yoki Telegram identifikatoringiz, ismingiz va e-mail manzilingizdan; o'quv natijalari va statistika uchun imtihon javoblaringizdan; xavfsizlik uchun qurilma nomi va identifikatoridan foydalanadi. Kamera faqat kompyuterga kirish uchun QR kodni skanerlashda ishlatiladi — rasm saqlanmaydi va yuborilmaydi. Ilovada reklama yo'q, ma'lumotlar uchinchi shaxslarga sotilmaydi, barcha so'rovlar HTTPS orqali shifrlanadi. Ma'lumotlar hisob faol bo'lgan davrda saqlanadi.",
    deletion: "Hisobni va ma'lumotlarni ilova ichida (Profil → Hisobni o'chirish) yoki ilovasiz quyidagi sahifa orqali o'chirishingiz mumkin:",
  },
  uzc: {
    title: "7. Мобил илова (PravaOnline, Android) ва ҳисобни ўчириш",
    text:
      "Мобил илова кириш учун Google ёки Telegram идентификаторингиз, исмингиз ва e-mail манзилингиздан; ўқув натижалари ва статистика учун имтиҳон жавобларингиздан; хавфсизлик учун қурилма номи ва идентификаторидан фойдаланади. Камера фақат компьютерга кириш учун QR кодни сканерлашда ишлатилади — расм сақланмайди ва юборилмайди. Иловада реклама йўқ, маълумотлар учинчи шахсларга сотилмайди, барча сўровлар HTTPS орқали шифрланади. Маълумотлар ҳисоб фаол бўлган даврда сақланади.",
    deletion: "Ҳисобни ва маълумотларни илова ичида (Профил → Ҳисобни ўчириш) ёки иловасиз қуйидаги саҳифа орқали ўчиришингиз мумкин:",
  },
  ru: {
    title: "7. Мобильное приложение (PravaOnline, Android) и удаление аккаунта",
    text:
      "Для входа приложение использует ваш идентификатор Google или Telegram, имя и e-mail; для результатов и статистики — ваши ответы на экзаменах; для безопасности — название и идентификатор устройства. Камера используется только для сканирования QR-кода при входе на компьютере — изображение не сохраняется и не передаётся. В приложении нет рекламы, данные не продаются третьим лицам, все запросы шифруются (HTTPS). Данные хранятся, пока аккаунт активен.",
    deletion: "Удалить аккаунт и данные можно в приложении (Профиль → Удалить аккаунт) или без приложения на странице:",
  },
} as const;

export default function Privacy_Page() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language === "ru" || i18n.language === "uzc" ? i18n.language : "uzl") as keyof typeof APP_SECTION;

  return (
    <>
      <SEO
        title={t("seo.privacy.title")}
        description={t("seo.privacy.desc")}
        keywords="prava online maxfiylik siyosati, privacy policy prava, shaxsiy ma'lumotlar xavfsizligi"
        canonical="/privacy"
      />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconShieldCheck size={13} />
            <span>{t("legal.privacyBadge")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("legal.privacyTitle")}
          </h1>
          <p className="saas-page-subtitle">
            {t("legal.lastUpdated")}
          </p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec1Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec1Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec2Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec2Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec3Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec3Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec4Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec4Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec5Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec5Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.privacy.sec6Title")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.privacy.sec6Text"
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {APP_SECTION[lang].title}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {APP_SECTION[lang].text}
            </Text>
            <Text size="sm" lh={1.8}>
              {APP_SECTION[lang].deletion}{" "}
              <Anchor component={Link} to="/account-deletion">pravaonline.uz/account-deletion</Anchor>
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
