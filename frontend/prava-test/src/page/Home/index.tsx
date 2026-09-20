import { useTranslation } from 'react-i18next';
import { Box } from "@mantine/core";
import {
  Hero_Banner,
  Stats_Section,
  Key_Benefits,
  Learning_Flow,
  Device_Platforms,
  FAQ_Section,
  CTA_Section,
} from "../../features/Home";
import SEO from "../../components/common/SEO";
import { getCachedTotalTickets, getCachedTotalQuestions } from "../../services/desktopAdapter";

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Prava Online",
  url: "https://pravaonline.uz",
  logo: "https://pravaonline.uz/logo.svg",
  description:
    "O'zbekistonda haydovchilik guvohnomasi imtihoniga online tayyorlanish platformasi. 1200+ savollar bazasi, real imtihon formati.",
  areaServed: {
    "@type": "Country",
    name: "Uzbekistan",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Haydovchilik guvohnomasi imtihon testlari",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "YHXBB imtihon testlari",
          description: "1200+ savollar bazasi bilan real imtihonga tayyorlaning",
          provider: { "@type": "Organization", name: "Prava Online" },
          inLanguage: ["uz", "uz-Cyrl", "ru"],
          isAccessibleForFree: true,
        },
      },
    ],
  },
};

const Home_Page = () => {
  const { t } = useTranslation();
  const totalTickets = getCachedTotalTickets();
  const totalQuestions = getCachedTotalQuestions();

  return (
    <Box className="page-transition-wrapper">
      <SEO
        title={t("seo.home.title", "Prava Test — Haydovchilik guvohnomasi imtihoniga tayyorgarlik | Prava Online")}
        description={t("seo.home.desc", {
          ticketsCount: totalTickets,
          questionsCount: totalQuestions.toLocaleString(),
          defaultValue: `O'zbekistonda haydovchilik guvohnomasi imtihoni uchun online testlar: ${totalTickets} ta bilet, ${totalQuestions.toLocaleString()} ta rasmiy YHXBB savollari, yo'l harakati qoidalari (YHQ) va davlat imtihoni simulyatori.`
        })}
        keywords={`prava, prava test, prava imtihon, prava imtihoni, prava olish, prava test ishlash, haydovchilik imtihoni, haydovchilik testi, haydovchilik guvohnomasi testi, imtihon testlari, yo'l harakati qoidalari testi, YHQ test, ${totalTickets} ta bilet, prava savollari, YHXBB test, avtotest, avtomobil testlari, avtomaktab testlari, online prava test, prava online test, driving test uzbekistan, экзамен ПДД, тест ПДД онлайн, правила дорожного движения`}
        canonical="/"
        jsonLd={homeJsonLd}
      />
      <div className="saas-page-container" style={{ paddingTop: 8 }}>
        {/* 1. HERO — PRAVA ONLINE nima? */}
        <Hero_Banner />

        {/* 2. STATS BAR — Real raqamlar (1200+ savol, 70 bilet, 100% format, 3 til) */}
        <Stats_Section />

        {/* 3. BENEFITS — Nima uchun foydalanish kerak? */}
        <Key_Benefits />

        {/* 4. HOW IT WORKS — Qanday boshlanadi? */}
        <Learning_Flow />

        {/* 5. DEVICE / APPLICATIONS — Qaysi qurilmalarda ishlaydi? */}
        <Device_Platforms />

        {/* 6. FAQ — Muhim savollarga javob */}
        <FAQ_Section />

        {/* 7. FINAL CTA — Boshlash */}
        <CTA_Section />
      </div>
    </Box>
  );
};

export default Home_Page;
