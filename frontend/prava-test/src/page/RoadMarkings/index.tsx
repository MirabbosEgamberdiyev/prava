import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Tabs,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Modal,
  Center,
  Box,
  rem,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import { IconAlertTriangle, IconRoad, IconRefresh } from "@tabler/icons-react";
import { curriculumApi, type RoadMarking } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import SafeHtml from "../../components/common/SafeHtml";
import { AppImage } from "../../components/common/AppImage";
import { errorKeyFor } from "../../types/errors";
import { pickLocalized } from "../../data/curriculumLocale";

export default function RoadMarkings_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [markings, setMarkings] = useState<RoadMarking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedMarking, setSelectedMarking] = useState<RoadMarking | null>(null);

  const fetchMarkings = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getMarkings()
      .then((data) => {
        setMarkings(data);
      })
      .catch((err: unknown) => {
        // 5xx/tarmoq xatolari uchun global toast api.ts'da chiqadi — bu yerda faqat inline xato.
        setError(err);
        setMarkings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMarkings();
  }, [fetchMarkings]);

  const safeMarkings = useMemo(() => markings.filter((m): m is RoadMarking => !!m), [markings]);

  const getLocalizedTitle = (m: RoadMarking) => pickLocalized(lang, m.title_uzl, m.title_uzc, m.title_ru);

  const getLocalizedDesc = (m: RoadMarking) =>
    pickLocalized(lang, m.description_uzl, m.description_uzc, m.description_ru);

  const filteredMarkings = useMemo(() => {
    if (activeTab === "all") return safeMarkings;
    if (activeTab === "horizontal") {
      return safeMarkings.filter((m) => m.code?.startsWith("1."));
    }
    if (activeTab === "vertical") {
      return safeMarkings.filter((m) => m.code?.startsWith("2."));
    }
    return safeMarkings;
  }, [safeMarkings, activeTab]);

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.markings.title")} description={t("seo.markings.desc")} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.markingsTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.markingsSubtitle")}
            </Text>
          </div>
          {!loading && !error && (
            <Badge size="lg" variant="filled" color="teal" leftSection={<IconRoad size={14} />}>
              {t("curriculum.markingsCount", { count: filteredMarkings.length })}
            </Badge>
          )}
        </Group>

        {/* Filter Tabs */}
        <Tabs value={activeTab} onChange={(val) => setActiveTab(val || "all")}>
          <Tabs.List>
            <Tabs.Tab value="all" style={{ fontWeight: 600 }}>
              {t("curriculum.all")} ({safeMarkings.length})
            </Tabs.Tab>
            <Tabs.Tab value="horizontal" style={{ fontWeight: 600 }}>
              {t("curriculum.horizontal")}
            </Tabs.Tab>
            <Tabs.Tab value="vertical" style={{ fontWeight: 600 }}>
              {t("curriculum.vertical")}
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {/* Content Area */}
        {loading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} shadow="sm" padding="md" radius="md" withBorder>
                <Skeleton height={100} mb="sm" radius="md" />
                <Skeleton height={16} width="40%" mb="xs" />
                <Skeleton height={20} width="85%" />
              </Card>
            ))}
          </SimpleGrid>
        ) : error ? (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t("common.error")}
            color="red"
            variant="light"
            radius="md"
            role="alert"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{t(errorKeyFor(error, "curriculum.loadMarkingsError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchMarkings}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        ) : filteredMarkings.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">{t("curriculum.emptyMarkings")}</Text>
              {activeTab !== "all" && (
                <Button size="xs" variant="subtle" onClick={() => setActiveTab("all")}>
                  {t("curriculum.showAllMarkings")}
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {filteredMarkings.map((m) => (
              <Card
                key={m.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                onClick={() => setSelectedMarking(m)}
              >
                <Card.Section p="md" bg="var(--mantine-color-gray-1)">
                  <Center h={100}>
                    <AppImage
                      src={m.imageUrl}
                      alt={getLocalizedTitle(m)}
                      fit="contain"
                      h={85}
                    />
                  </Center>
                </Card.Section>

                <Group justify="space-between" mt="sm" mb={4}>
                  <Badge variant="light" color="teal" size="sm">
                    {m.code}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {m.code?.startsWith("2.") ? t("curriculum.verticalBadge") : t("curriculum.horizontalBadge")}
                  </Text>
                </Group>

                <Text fw={600} size="sm" lineClamp={2}>
                  {getLocalizedTitle(m)}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Detail Modal */}
      <Modal
        opened={!!selectedMarking}
        onClose={() => setSelectedMarking(null)}
        title={
          selectedMarking && (
            <Group gap="xs">
              <Badge color="teal" size="lg">
                {selectedMarking.code}
              </Badge>
              <Text fw={700} size="md">
                {getLocalizedTitle(selectedMarking)}
              </Text>
            </Group>
          )
        }
        size="lg"
        centered
      >
        {selectedMarking && (
          <Stack gap="md">
            <Box
              p="md"
              bg="var(--mantine-color-gray-0)"
              style={{ borderRadius: rem(8), display: "flex", justifyContent: "center" }}
            >
              <AppImage
                src={selectedMarking.imageUrl}
                alt={getLocalizedTitle(selectedMarking)}
                fit="contain"
                h={140}
              />
            </Box>
            <SafeHtml
              style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
              html={getLocalizedDesc(selectedMarking)}
            />
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
