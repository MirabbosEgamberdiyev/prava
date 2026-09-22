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
import { AppImage } from "../../components/common/AppImage";

export default function RoadMarkings_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [markings, setMarkings] = useState<RoadMarking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedMarking, setSelectedMarking] = useState<RoadMarking | null>(null);

  const fetchMarkings = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getMarkings()
      .then((data) => {
        setMarkings(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load markings:", err);
        setError("Yo'l chiziqlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setMarkings([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMarkings();
  }, [fetchMarkings]);

  const safeMarkings = useMemo(() => (Array.isArray(markings) ? markings : []), [markings]);

  const getLocalizedTitle = (m: RoadMarking) => {
    if (lang === "ru" && m.title_ru) return m.title_ru;
    if (lang === "uzc" && m.title_uzc) return m.title_uzc;
    return m.title_uzl;
  };

  const getLocalizedDesc = (m: RoadMarking) => {
    if (lang === "ru" && m.description_ru) return m.description_ru;
    if (lang === "uzc" && m.description_uzc) return m.description_uzc;
    return m.description_uzl || "";
  };

  const filteredMarkings = useMemo(() => {
    if (activeTab === "all") return safeMarkings;
    if (activeTab === "horizontal") {
      return safeMarkings.filter((m) => m && m.code && m.code.startsWith("1."));
    }
    if (activeTab === "vertical") {
      return safeMarkings.filter((m) => m && m.code && m.code.startsWith("2."));
    }
    return safeMarkings;
  }, [safeMarkings, activeTab]);

  return (
    <Container size="xl" py="xl">
      <SEO
        title={t("seo.markings.title", "Yo'l chiziqlari — Rasmiy YHXX Yo'l Belgilash Chiziqlari")}
        description={t("seo.markings.desc", "O'zbekiston Respublikasi Yo'l Harakati Qoidalaridagi barcha rasmiy gorizontal va vertikal yo'l chiziqlari.")}
      />

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
          <Badge size="lg" variant="filled" color="teal" leftSection={<IconRoad size={14} />}>
            {filteredMarkings.length} {t("curriculum.markingsCount")}
          </Badge>
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

        {/* Error State with Retry Button */}
        {error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t("common.error")}
            color="red"
            variant="light"
            radius="md"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{error}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchMarkings}
              >
                {t("common.refresh")}
              </Button>
            </Group>
          </Alert>
        )}

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
        ) : filteredMarkings.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">{t("curriculum.emptyMarkings", "Yo'l chiziqlari topilmadi")}</Text>
              {activeTab !== "all" && (
                <Button size="xs" variant="subtle" onClick={() => setActiveTab("all")}>
                  {t("curriculum.showAllMarkings", "Barcha chiziqlarni ko'rsatish")}
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
                    {m.code.startsWith("2.") ? t("curriculum.verticalBadge", "Vertikal") : t("curriculum.horizontalBadge", "Gorizontal")}
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
            <div
              style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: getLocalizedDesc(selectedMarking) }}
            />
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
