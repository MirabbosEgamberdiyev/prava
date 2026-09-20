import { useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  SegmentedControl,
  SimpleGrid,
  Card,
  Image,
  Badge,
  Center,
  Loader,
  Button,
  Paper,
} from "@mantine/core";
import {
  IconSearch,
  IconRoadSign,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useRoadSigns, type RoadSign } from "../../features/curriculum";

const SIGN_CATEGORIES = [
  { value: "", labelKey: "common.all" },
  { value: "ogohlantiruvchi", labelKey: "curriculum.warning" },
  { value: "imtiyozli", labelKey: "curriculum.priority" },
  { value: "taqiqlovchi", labelKey: "curriculum.prohibitory" },
  { value: "buyuruvchi", labelKey: "curriculum.mandatory" },
  { value: "axborot-ishora", labelKey: "curriculum.informative" },
  { value: "servis", labelKey: "curriculum.service" },
  { value: "qoshimcha", labelKey: "curriculum.additional" },
];

export default function SignsPage() {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { signs, isLoading, isError, refresh } = useRoadSigns(
    selectedCategory || undefined,
    searchQuery || undefined
  );

  const getLocalizedTitle = (sign: RoadSign) => {
    if (i18n.language === "ru" && sign.title_ru) return sign.title_ru;
    if (i18n.language === "uzc" && sign.title_uzc) return sign.title_uzc;
    return sign.title_uzl;
  };

  const getLocalizedDescription = (sign: RoadSign) => {
    if (i18n.language === "ru" && sign.description_ru) return sign.description_ru;
    if (i18n.language === "uzc" && sign.description_uzc) return sign.description_uzc;
    return sign.description_uzl || "";
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconRoadSign size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.signsTitle", "Yo'l belgilari")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.signsSubtitle", "O'zbekiston Respublikasi rasmiy yo'l belgilari katalogi")}
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

      {/* Filter and Search Controls */}
      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap">
            <TextInput
              placeholder={t("curriculum.searchSigns", "Belgi kodi yoki nomi bo'yicha qidirish...")}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flexGrow: 1, minWidth: 260 }}
            />
            <Badge size="lg" variant="light" color="blue">
              {t("common.total", "Jami")}: {signs.length}
            </Badge>
          </Group>

          <SegmentedControl
            value={selectedCategory}
            onChange={setSelectedCategory}
            data={SIGN_CATEGORIES.map((c) => ({
              value: c.value,
              label: t(c.labelKey, c.value || "Barchasi"),
            }))}
            fullWidth
            radius="md"
            size="xs"
          />
        </Stack>
      </Paper>

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
      ) : signs.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Hech qanday belgi topilmadi")}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {signs.map((sign) => {
            const title = getLocalizedTitle(sign);
            const desc = getLocalizedDescription(sign);

            return (
              <Card key={sign.id} shadow="xs" padding="sm" radius="md" withBorder>
                <Card.Section p="xs" bg="var(--mantine-color-gray-0)">
                  <Center h={120}>
                    {sign.imageUrl ? (
                      <Image
                        src={sign.imageUrl}
                        alt={title}
                        fit="contain"
                        h={100}
                        w={100}
                        fallbackSrc="/icons/traffic-sign-fallback.svg"
                      />
                    ) : (
                      <IconRoadSign size={64} opacity={0.3} />
                    )}
                  </Center>
                </Card.Section>

                <Stack gap={4} mt="sm">
                  <Group justify="space-between" align="center">
                    <Badge size="sm" variant="filled" color="blue">
                      {sign.code}
                    </Badge>
                    <Badge size="xs" variant="light" color="gray">
                      {sign.category}
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
