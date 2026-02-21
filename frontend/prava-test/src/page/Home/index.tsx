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

const Home_Page = () => {
  return (
    <Box>
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
