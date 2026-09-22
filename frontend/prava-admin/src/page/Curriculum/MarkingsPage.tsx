import { useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  SegmentedControl,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Center,
  Loader,
  Button,
  Paper,
  Box,
} from "@mantine/core";
import {
  IconTrafficLights,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useRoadMarkings, type RoadMarking } from "../../features/curriculum";

export default function MarkingsPage() {
  const { t, i18n } = useTranslation();
  const [selectedType, setSelectedType] = useState<string>("");

  const { markings, isLoading, isError, refresh } = useRoadMarkings(
    selectedType || undefined
  );

  const getLocalizedTitle = (m: RoadMarking) => {
    if (i18n.language === "ru" && m.title_ru) return m.title_ru;
    if (i18n.language === "uzc" && m.title_uzc) return m.title_uzc;
    return m.title_uzl;
  };

  const getLocalizedDescription = (m: RoadMarking) => {
    if (i18n.language === "ru" && m.description_ru) return m.description_ru;
    if (i18n.language === "uzc" && m.description_uzc) return m.description_uzc;
    return m.description_uzl || "";
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconTrafficLights size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.markingsTitle", "Yo'l chiziqlari")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.markingsSubtitle", "Gorizontal va vertikal yo'l chiziqlari hamda yotiq chiziqlar")}
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

      {/* Filter Segmented Control */}
      <Paper p={{ base: "xs", sm: "md" }} radius="md" withBorder>
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Box style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: 4 }}>
            <SegmentedControl
              value={selectedType}
              onChange={setSelectedType}
              data={[
                { value: "", label: t("common.all", "Barchasi") },
                { value: "gorizontal", label: t("curriculum.horizontal", "Gorizontal chiziqlar") },
                { value: "vertikal", label: t("curriculum.vertical", "Vertikal chiziqlar") },
              ]}
              radius="md"
              size="xs"
            />
          </Box>
          <Badge size="lg" variant="light" color="teal">
            {t("common.total", "Jami")}: {markings.length}
          </Badge>
        </Group>
      </Paper>

      {/* Grid of Markings */}
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
      ) : markings.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Hech qanday chiziq topilmadi")}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
          {markings.map((m) => {
            const title = getLocalizedTitle(m);
            const desc = getLocalizedDescription(m);

            return (
              <Card key={m.id} shadow="xs" padding="sm" radius="md" withBorder>
                <Card.Section p="xs" bg="var(--mantine-color-gray-0)">
                  <Center h={100}>
                    {m.imageUrl ? (
                      <Image
                        src={m.imageUrl}
                        alt={title}
                        fit="contain"
                        h={80}
                        w="100%"
                        fallbackSrc="/icons/traffic-sign-fallback.svg"
                      />
                    ) : (
                      <IconTrafficLights size={48} opacity={0.3} />
                    )}
                  </Center>
                </Card.Section>

                <Stack gap={4} mt="sm">
                  <Group justify="space-between" align="center">
                    <Badge size="sm" variant="filled" color="teal">
                      {m.code}
                    </Badge>
                    <Badge size="xs" variant="light" color="blue">
                      {m.marking_type}
                    </Badge>
                  </Group>

                  <Text fw={600} size="sm" lineClamp={2} title={title}>
                    {title}
                  </Text>

                  {desc && (
                    <Text size="xs" c="dimmed" lineClamp={3} title={desc}>
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
