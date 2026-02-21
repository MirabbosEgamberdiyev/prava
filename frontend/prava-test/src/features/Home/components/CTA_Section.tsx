import { Box, Text, Title, Button, Group } from "@mantine/core";
import { IconArrowRight, IconSparkles } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import classes from "./Home.module.css";

export function CTA_Section() {
  const { t } = useTranslation();

  return (
    <section className={classes.ctaSection} aria-label="Call to Action">
      <Box className={classes.ctaCard}>
        <Box className={classes.ctaContent}>
          <Group justify="center" mb="lg">
            <IconSparkles size={48} color="white" stroke={1.5} />
          </Group>

          <Title order={2} className={classes.ctaTitle}>
            {t("home.cta.title")}
          </Title>

          <Text className={classes.ctaDescription} ta={"center"} my={"lg"} mx={'auto'} c={'white'}>
            {t("home.cta.description")}
          </Text>

          <Group justify="center" gap="md">
            <Link to="/auth/register">
              <Button
                size="lg"
                radius="xl"
                color="white"
                c="blue"
                className={classes.ctaButton}
                rightSection={<IconArrowRight size={18} />}
              >
                {t("home.cta.register")}
              </Button>
            </Link>
            <Link to="/auth/login">
              <Button
                size="lg"
                radius="xl"
                variant="white"
                color="dark"
                className={classes.ctaButton}
                styles={{
                  root: {
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.25)",
                    },
                  },
                }}
              >
                {t("home.cta.login")}
              </Button>
            </Link>
          </Group>
        </Box>
      </Box>
    </section>
  );
}
