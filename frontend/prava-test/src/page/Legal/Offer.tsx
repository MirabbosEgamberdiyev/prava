import {
  Divider,
  Stack,
  Text,
  Title,
  Group,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { IconFileCertificate, IconShieldCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function Offer_Page() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title={t("seo.offer.title", "Ommaviy Oferta — Prava Online")}
        description={t(
          "seo.offer.desc",
          "Prava Online axborot-ta'lim platformasi orqali xizmatlar ko'rsatish bo'yicha rasmiy ommaviy oferta shartnomasi."
        )}
        keywords="prava online oferta, ommaviy oferta prava, ommaviy shartnoma prava test, to'lov shartlari prava"
        canonical="/offer"
      />

      <div className="saas-page-container" style={{ maxWidth: 1040 }}>
        {/* Header Block */}
        <div className="saas-header-block">
          <div className="saas-badge-pill">
            <IconFileCertificate size={13} />
            <span>{t("legal.offerBadge", "Rasmiy Yuridik Hujjat")}</span>
          </div>
          <h1 className="saas-page-title">
            {t("legal.offerTitle", "Ommaviy Oferta Shartnomasi")}
          </h1>
          <p className="saas-page-subtitle">
            {t("legal.lastUpdated", "Oxirgi yangilanish: 2026-yil 1-yanvar")}
          </p>
        </div>

        <div className="saas-card" style={{ padding: "40px 32px", marginBottom: 64 }}>
          <Stack gap="md">
            <Box p="md" style={{ borderRadius: 12, background: "var(--card-highlight-bg, rgba(37,99,235,0.04))", border: "1px solid var(--border)" }}>
              <Group gap="xs" align="flex-start">
                <ThemeIcon size={22} radius="xl" color="blue" variant="light" mt={2}>
                  <IconShieldCheck size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" lh={1.6}>
                  {t(
                    "legal.offerNotice",
                    "Ushbu hujjat O'zbekiston Respublikasi Fuqarolik Kodeksining 367 va 369-moddalariga muvofiq rasmiy ommaviy oferta hisoblanadi. Saytda ro'yxatdan o'tish yoki to'lovni amalga oshirish mazkur oferta shartlarini to'liq va so'zsiz qabul qilish (aksept) hisoblanadi."
                  )}
                </Text>
              </Group>
            </Box>

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec1Title", "1. Atamalar va ta'riflar")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec1Text",
                "• 'Ijrochi' — 'Prava Online' mustaqil axborot-ta'lim platformasi boshqaruvchisi.\n• 'Buyurtmachi' (Foydalanuvchi) — Platformada ro'yxatdan o'tgan yoki to'lovni amalga oshirgan jismoniy yoki yuridik shaxs.\n• 'Aksept' — Buyurtmachi tomonidan ofertaning barcha shartlarini to'liq va so'zsiz qabul qilish harakati (to'lov yoki ro'yxatdan o'tish).\n• 'Xizmatlar' — Haydovchilik nazariy imtihoniga tayyorgarlik ko'rish uchun testlar, biletlar, simulyator va tahliliy vositalarga elektron kirish huquqini berish."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec2Title", "2. Shartnoma predmeti")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec2Text",
                "Ijrochi Buyurtmachiga platformadagi tanlangan tarif rejasi doirasida avtomatlashtirilgan o'quv-test materiallaridan, imtihon simulyatoridan va shaxsiy kabinet imkoniyatlaridan belgilangan muddat davomida masofaviy foydalanish huquqini taqdim etadi, Buyurtmachi esa xizmatlar uchun belgilangan haqni to'laydi."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec3Title", "3. Akseptlash tartibi")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec3Text",
                "Mazkur ofertaning aksepti quyidagi harakatlardan biri sodir etilganda to'liq hisoblanadi: a) Platformada telefon raqami yoki Telegram/Google orqali muvaffaqiyatli ro'yxatdan o'tish; b) Tanlangan pullik tarif uchun to'lovni tasdiqlash. Aksept amalga oshirilgan paytdan boshlab shartnoma qonuniy kuchga kirgan hisoblanadi."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec4Title", "4. Tariflar va to'lov shartlari")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec4Text",
                "Xizmatlarning amaldagi qiymati 'Tariflar' sahifasida O'zbekiston so'mida (UZS) ko'rsatiladi. To'lovlar 100% oldindan to'lov shaklida litsenziyaga ega to'lov operatorlari (Payme, Click, Uzum Bank) orqali amalga oshiriladi. To'lov tasdiqlangach, kirish huquqi real vaqtda avtomatik ochiladi."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec5Title", "5. Xizmatlarni ko'rsatish tartibi")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec5Text",
                "Xizmatlar 24/7 rejimida masofaviy elektron shaklda ko'rsatiladi. Profilga kirish uchun Buyurtmachi o'zining internetga ulangan qurilmasi (telefon, kompyuter, planshet) yoki Windows uchun offline ilovadan foydalanadi. Ijrochi rejaviy profilaktika ishlarini o'tkazishda xizmatni qisqa muddatga cheklash huquqiga ega."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec6Title", "6. Tomonlarning huquq va majburiyatlari")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec6Text",
                "Buyurtmachi o'z akkauntini uchinchi shaxslarga bermaslik, platformaning intellektual mulkini himoya qilish va tizim xavfsizligiga ziyon yetkazmaslik majburiyatini oladi. Ijrochi xizmatlarning barqaror ishlashini ta'minlash va foydalanuvchining shaxsiy ma'lumotlarini maxfiy saqlash majburiyatini oladi."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec7Title", "7. Mablag'larni qaytarish (Refund) siyosati")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec7Text",
                "Raqamli xizmatlar o'ziga xos xususiyatga ega bo'lib, to'lov amalga oshirilib, akkauntga to'liq kirish huquqi taqdim etilgandan so'ng, xizmat ko'rsatilgan hisoblanadi. Agar texnik nosozlik sababli kirish imkoni bo'lmasa va bu holat 48 soat ichida bartaraf etilmasa, Buyurtmachi mablag'ni qaytarishni talab qilishga haqli."
              )}
            </Text>

            <Divider my="sm" />

            <Title order={3} size="h4" mt="xs">
              {t("legal.offer.sec8Title", "8. Nizolarni hal qilish va rekvizitlar")}
            </Title>
            <Text size="sm" c="dimmed" lh={1.8}>
              {t(
                "legal.offer.sec8Text",
                "Shartnoma bo'yicha yuzaga keladigan barcha nizolar dastlab muzokaralar va yozma murojaatlar orqali hal etiladi. Kelishuvga erishilmagan taqdirda nizo O'zbekiston Respublikasining amaldagi qonunchiligiga muvofiq sudda ko'rib chiqiladi.\n\nBog'lanish: +998 99 391 25 05 | Telegram: @pravaonlineuz"
              )}
            </Text>
          </Stack>
        </div>
      </div>
    </>
  );
}
