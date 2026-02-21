import {
  IconCheck,
  IconDownload,
  IconArrowRight,
  IconExternalLink,
  IconRefresh,
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
  Tooltip,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useInstallPrompt } from "../../../hooks/useInstallPrompt";
import { useRegisterSW } from "virtual:pwa-register/react";
import classes from "./Home.module.css";

export function Hero_Banner() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, isStandalone, isIOS, install, openApp } =
    useInstallPrompt();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Telefon ichidagi tugma — 3 ta holat
  const renderPhoneButton = () => {
    // PWA ichida bo'lsa — hech narsa ko'rsatmaymiz
    if (isStandalone) {
      return null;
    }

    // 1. Yangilanish mavjud — "Ilovani yangilash"
    if (needRefresh && isInstalled) {
      return (
        <Button
          leftSection={<IconRefresh size={20} />}
          radius="md"
          fullWidth
          variant="filled"
          color="orange"
          onClick={() => updateServiceWorker(true)}
        >
          {t("pwa.updateApp")}
        </Button>
      );
    }

    // 2. Ilova o'rnatilgan — "Ilova bilan ochish"
    if (isInstalled) {
      return (
        <Button
          leftSection={<IconExternalLink size={20} />}
          radius="md"
          fullWidth
          variant="filled"
          color="blue"
          onClick={openApp}
        >
          {t("pwa.openWithApp")}
        </Button>
      );
    }

    // 3. O'rnatish mumkin (Chrome/Edge/Android) — "Ilovani yuklab olish"
    if (isInstallable) {
      return (
        <Button
          leftSection={<IconDownload size={20} />}
          radius="md"
          fullWidth
          variant="filled"
          color="dark"
          onClick={install}
        >
          {t("pwa.downloadApp")}
        </Button>
      );
    }

    // 4. iOS — manual ko'rsatma bilan "Ilovani yuklab olish"
    if (isIOS) {
      return (
        <Tooltip
          label={t("pwa.iosInstall")}
          multiline
          w={280}
          position="bottom"
        >
          <Button
            leftSection={<IconDownload size={20} />}
            radius="md"
            fullWidth
            variant="filled"
            color="dark"
          >
            {t("pwa.downloadApp")}
          </Button>
        </Tooltip>
      );
    }

    // 5. Brauzer qo'llab-quvvatlamaydi
    return (
      <Button
        leftSection={<IconDownload size={20} />}
        radius="md"
        fullWidth
        variant="light"
        color="gray"
        disabled
      >
        {t("pwa.downloadApp")}
      </Button>
    );
  };

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
              <Link to="/me">
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

        {/* O'ng qism - Telefon */}
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
                    {t("pwa.phoneDescription")}
                  </Text>

                  {renderPhoneButton()}
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
