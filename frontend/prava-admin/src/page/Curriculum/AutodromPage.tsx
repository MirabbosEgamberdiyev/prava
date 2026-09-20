import {
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Center,
  Loader,
  Button,
  Alert,
  ThemeIcon,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconRefresh,
  IconAlertCircle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { usePracticalExam, type PracticalExercise } from "../../features/curriculum";

export default function AutodromPage() {
  const { t, i18n } = useTranslation();
  const { exercises, isLoading, isError, refresh } = usePracticalExam();

  const getLocalizedTitle = (ex: PracticalExercise) => {
    if (i18n.language === "ru" && ex.title_ru) return ex.title_ru;
    if (i18n.language === "uzc" && ex.title_uzc) return ex.title_uzc;
    return ex.title_uzl;
  };

  const getLocalizedDescription = (ex: PracticalExercise) => {
    if (i18n.language === "ru" && ex.description_ru) return ex.description_ru;
    if (i18n.language === "uzc" && ex.description_uzc) return ex.description_uzc;
    return ex.description_uzl || "";
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconSteeringWheel size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.autodromTitle", "Avtodrom & Amaliy mashqlar")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.autodromSubtitle", "Davlat amaliy haydash imtihonining 6 ta asosiy mashqi va talablari")}
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={() => refresh()}
          size="sm"
        >
          {t("common.refresh", "Yangilash")}
        </Button>
      </Group>

      {/* Official Rule Notice */}
      <Alert
        icon={<IconInfoCircle size={18} />}
        title={t("curriculum.autodromNoticeTitle", "Amaliy imtihon qoidalari")}
        color="blue"
        radius="md"
      >
        {t(
          "curriculum.autodromNoticeText",
          "Nomzod avtodromdagi barcha mashqlarni ketma-ket bajarishi shart. Jarima ballari yig'indisi 99 ballgacha bo'lsa imtihon 'O'TDI', 100 ball yoki undan oshsa 'YIQILDI' deb hisoblanadi."
        )}
      </Alert>

      {/* Content Area */}
      {isLoading ? (
        <Center h={300}>
          <Loader size="lg" />
        </Center>
      ) : isError ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <IconAlertCircle size={36} color="red" />
            <Text c="red">{t("common.errorLoading", "Ma'lumotlarni yuklashda xatolik")}</Text>
            <Button variant="light" size="xs" onClick={() => refresh()}>
              {t("common.refresh", "Qayta urinish")}
            </Button>
          </Stack>
        </Center>
      ) : exercises.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Mashqlar topilmadi")}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {exercises.map((ex) => {
            const title = getLocalizedTitle(ex);
            const desc = getLocalizedDescription(ex);

            return (
              <Card key={ex.id} shadow="sm" padding="md" radius="md" withBorder>
                {ex.image_url ? (
                  <Card.Section p="xs" bg="var(--mantine-color-gray-0)">
                    <Center h={160}>
                      <Image
                        src={ex.image_url}
                        alt={title}
                        fit="contain"
                        h={140}
                        fallbackSrc="/icons/traffic-sign-fallback.svg"
                      />
                    </Center>
                  </Card.Section>
                ) : (
                  <Card.Section p="md" bg="var(--mantine-color-gray-0)">
                    <Center h={100}>
                      <ThemeIcon size={56} radius="xl" variant="light" color="blue">
                        <IconSteeringWheel size={32} />
                      </ThemeIcon>
                    </Center>
                  </Card.Section>
                )}

                <Stack gap="xs" mt="sm">
                  <Group justify="space-between" align="center">
                    <Badge size="md" variant="filled" color="blue">
                      {t("curriculum.exercise", "Mashq")} #{ex.exercise_number}
                    </Badge>
                    <Badge size="sm" variant="light" color="red">
                      {t("curriculum.maxPenalty", "Maks. jarima")}: {ex.max_penalty_points} ball
                    </Badge>
                  </Group>

                  <Text fw={700} size="md">
                    {title}
                  </Text>

                  {desc && (
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                      {desc}
                    </Text>
                  )}
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
