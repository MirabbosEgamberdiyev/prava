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

const Home_Page = () => {
  return (
    <Box>
      <SEO
        title="Prava Online - Haydovchilik guvohnomasi imtihoniga tayyorlaning"
        description="O'zbekistonda haydovchilik guvohnomasi imtihoniga online tayyorlanish platformasi. 1200+ savollar bazasi, real imtihon formati, 4 tilda: o'zbek, rus, ingliz."
        keywords="prava online, haydovchilik guvohnomasi, imtihon, prava test, YHXBB, avtomaktab, prava uz, prava test online, водительские права, экзамен ПДД"
        canonical="/"
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
