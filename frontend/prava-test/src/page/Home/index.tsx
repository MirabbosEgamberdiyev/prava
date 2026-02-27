import { Container, Box } from "@mantine/core";
import {
  Hero_Banner,
  Stats_Section,
  Features_Section,
  Testimonials_Section,
  FAQ_Section,
  CTA_Section,
} from "../../features/Home";
import classes from "../../features/Home/components/Home.module.css";
import SEO from "../../components/common/SEO";

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
          inLanguage: ["uz", "ru", "en"],
          isAccessibleForFree: true,
        },
      },
    ],
  },
};

const Home_Page = () => {
  return (
    <Box>
      <SEO
        title="Prava Online - Haydovchilik guvohnomasi imtihoniga tayyorlaning | YHXBB test"
        description="O'zbekistonda haydovchilik guvohnomasi imtihoniga online tayyorlanish platformasi. 1200+ savollar bazasi, real imtihon formati, biletlar va mavzular bo'yicha testlar. Bepul ro'yxatdan o'ting!"
        keywords="prava online, haydovchilik guvohnomasi, imtihon, prava test, YHXBB, avtomaktab, prava uz, prava test online, haydovchilik guvohnomasi imtihoni, avtomaktab savollari, pdd test, yo'l harakati qoidalari, водительские права, экзамен ПДД, тест ПДД онлайн, правила дорожного движения, driving license test uzbekistan, prava online uz"
        canonical="/"
        jsonLd={homeJsonLd}
      />
      <Container size="xl">
        {/* Hero Section */}
        <Hero_Banner />

        <hr className={classes.divider} />

        {/* Statistics Section */}
        <Stats_Section />

        <hr className={classes.divider} />

        {/* Features Section */}
        <Features_Section />

        <hr className={classes.divider} />

        {/* Testimonials Section */}
        <Testimonials_Section />

        <hr className={classes.divider} />

        {/* FAQ Section */}
        <FAQ_Section />

        {/* CTA Section */}
        <CTA_Section />
      </Container>
    </Box>
  );
};

export default Home_Page;
