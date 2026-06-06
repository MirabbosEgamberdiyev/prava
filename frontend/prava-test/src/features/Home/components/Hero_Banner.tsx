import {
  IconCheck,
  IconDownload,
  IconArrowRight,
} from "@tabler/icons-react";
import {
  Box,
  Button,
  Flex,
  Grid,
  Group,
  Image,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import classes from "./Home.module.css";

export function Hero_Banner() {
  const { t } = useTranslation();

  return (
    <section className={classes.heroSection} aria-label="Hero">
      <Grid justify="center" align="center" gutter={{ base: "xl", md: 50 }}>
        {/* Chap qism - Matn */}
        <Grid.Col span={{ base: 12, md: 6, lg: 7 }}>
          <Box className={classes.heroContent}>
            <Title order={1} className={classes.heroTitle}>
              {t("home.hero.title")}{" "}
              <span className={classes.heroHighlight}>
                {t("home.hero.highlight")}
              </span>{" "}
              {t("home.hero.titleEnd")}
            </Title>

            <Text className={classes.heroDescription} mt="lg">
              {t("home.hero.description")}
            </Text>

            <List
              mt={30}
              spacing="lg"
              size="md"
              className={classes.heroList}
              icon={
                <ThemeIcon size={28} radius="xl" variant="light" color="green">
                  <IconCheck size={16} stroke={2.5} />
                </ThemeIcon>
              }
            >
              <List.Item>
                <Text fw={600}>{t("home.hero.feature1Title")}</Text>
                <Text size="sm" c="dimmed">
                  {t("home.hero.feature1Desc")}
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>{t("home.hero.feature2Title")}</Text>
                <Text size="sm" c="dimmed">
                  {t("home.hero.feature2Desc")}
                </Text>
              </List.Item>
              <List.Item>
                <Text fw={600}>{t("home.hero.feature3Title")}</Text>
                <Text size="sm" c="dimmed">
                  {t("home.hero.feature3Desc")}
                </Text>
              </List.Item>
            </List>

            <Group mt={40} className={classes.heroButtons}>
              <Link to="/auth/register">
                <Button
                  radius="xl"
                  size="lg"
                  className={classes.heroButton}
                  rightSection={<IconArrowRight size={18} />}
                >
                  {t("home.hero.startFree")}
                </Button>
              </Link>
              <Link to="/try-exam">
                <Button
                  radius="xl"
                  size="lg"
                  variant="outline"
                >
                  {t("guestExam.tryFree")}
                </Button>
              </Link>
            </Group>
          </Box>
        </Grid.Col>

        {/* O'ng qism - Telefon mockup → Ilovalar sahifasiga link */}
        <Grid.Col span={{ base: 12, md: 6, lg: 5 }}>
          <Flex
            justify="center"
            align="center"
            mt={{ base: 60, md: 0 }}
            className={classes.phoneWrapper}
          >
            <Box className={classes.phoneMockup}>
              <Box className={classes.screen}>
                <Stack align="center" justify="center" h="100%" p="xl">
                  <Image
                    src="/logo.svg"
                    alt="Prava Online"
                    w={80}
                    mb="md"
                    fallbackSrc="/favicon.svg"
                  />
                  <Text ta="center" fw={700} size="xl">
                    PravaOnline
                  </Text>
                  <Text ta="center" size="sm" c="dimmed" mb="xl">
                    {t("downloads.phoneDesc", { defaultValue: "Ilovani telefoningizga o'rnating va istalgan joyda mashq qiling" })}
                  </Text>

                  <Link to="/downloads" style={{ width: "100%" }}>
                    <Button
                      leftSection={<IconDownload size={20} />}
                      radius="md"
                      fullWidth
                      variant="filled"
                      color="blue"
                    >
                      {t("downloads.title", { defaultValue: "Ilovalar" })}
                    </Button>
                  </Link>
                </Stack>
              </Box>
              <Box className={classes.homeButton} />
            </Box>
          </Flex>
        </Grid.Col>
      </Grid>
    </section>
  );
}
