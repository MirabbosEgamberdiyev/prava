import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Center,
  Button,
  Divider,
  Skeleton,
  Alert,
} from "@mantine/core";
import {
  IconBuildingSkyscraper,
  IconMapPin,
  IconPhone,
  IconClock,
  IconBus,
  IconExternalLink,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import { curriculumApi, type ExamCenter } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";

export default function ExamCenters_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [centers, setCenters] = useState<ExamCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCenters = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getExamCenters()
      .then((data) => {
        setCenters(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load exam centers:", err);
        setError("Imtihon markazlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setCenters([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const safeCenters = useMemo(() => (Array.isArray(centers) ? centers : []), [centers]);

  const getLocalizedRegion = (c: ExamCenter) => {
    if (lang === "ru" && c.region_ru) return c.region_ru;
    if (lang === "uzc" && c.region_uzc) return c.region_uzc;
    return c.region_uzl || "";
  };

  const getLocalizedAddress = (c: ExamCenter) => {
    if (lang === "ru" && c.address_ru) return c.address_ru;
    if (lang === "uzc" && c.address_uzc) return c.address_uzc;
    return c.address_uzl || "";
  };

  const getLocalizedTransport = (c: ExamCenter) => {
    if (lang === "ru" && c.transport_ru) return c.transport_ru;
    if (lang === "uzc" && c.transport_uzc) return c.transport_uzc;
    return c.transport_uzl || "";
  };

  return (
    <Container size="xl" py="xl">
      <SEO
        title={t("seo.examCentersTitle", "Imtihon markazlari — O'zbekiston bo'yicha Yagona Imtihon Markazlari")}
        description={t("seo.examCentersDesc", "O'zbekiston Respublikasi bo'yicha barcha 14 ta hududiy yagona haydovchilik imtihon markazlari manzillari, telefonlari va ish vaqtlari.")}
      />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.centersTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.centersSubtitle")}
            </Text>
          </div>
          <Badge size="lg" variant="filled" color="indigo" leftSection={<IconBuildingSkyscraper size={14} />}>
            {safeCenters.length} {t("curriculum.centersCount")}
          </Badge>
        </Group>

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
                variant="subtle"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchCenters}
              >
                {t("common.refresh")}
              </Button>
            </Group>
          </Alert>
        )}

        {loading ? (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Card key={idx} shadow="sm" padding="lg" radius="md" withBorder>
                <Skeleton height={20} width="35%" mb="sm" />
                <Skeleton height={26} width="75%" mb="md" />
                <Skeleton height={14} width="90%" mb="xs" />
                <Skeleton height={14} width="60%" mb="xs" />
                <Skeleton height={14} width="70%" />
              </Card>
            ))}
          </SimpleGrid>
        ) : safeCenters.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">{t("curriculum.emptyCenters")}</Text>
              <Button size="xs" variant="subtle" onClick={fetchCenters}>
                Qayta urinish
              </Button>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {safeCenters.map((c) => (
              <Card key={c.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Group justify="space-between" align="center" mb="xs">
                  <Badge color="indigo" size="md" variant="light">
                    {getLocalizedRegion(c)}
                  </Badge>
                  <Badge color="green" size="xs" variant="dot">
                    Faol
                  </Badge>
                </Group>

                <Title order={4} fw={700} mb="xs">
                  {getLocalizedRegion(c)} Imtihon Markazi
                </Title>

                <Stack gap="xs" mt="md">
                  <Group gap="xs" align="flex-start" wrap="nowrap">
                    <IconMapPin size={18} color="var(--mantine-color-indigo-6)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Text size="sm">{getLocalizedAddress(c)}</Text>
                  </Group>

                  {c.phones && (
                    <Group gap="xs" align="center">
                      <IconPhone size={18} color="var(--mantine-color-green-6)" style={{ flexShrink: 0 }} />
                      <Text size="sm" fw={600} c="green">
                        {c.phones}
                      </Text>
                    </Group>
                  )}

                  <Group gap="xs" align="center">
                    <IconClock size={18} color="var(--mantine-color-orange-6)" style={{ flexShrink: 0 }} />
                    <Text size="sm">{c.work_days || "Dushanba - Shanba"}: {c.work_hours || "09:00 - 18:00"}</Text>
                  </Group>

                  {getLocalizedTransport(c) && (
                    <Group gap="xs" align="flex-start" wrap="nowrap">
                      <IconBus size={18} color="var(--mantine-color-blue-6)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <Text size="xs" c="dimmed">
                        {getLocalizedTransport(c)}
                      </Text>
                    </Group>
                  )}
                </Stack>

                <Divider my="md" />

                <Group justify="space-between" align="center">
                  <div>
                    <Text size="xs" c="dimmed">{t("curriculum.theoryPractical", "Nazariy / Amaliy")}</Text>
                    <Text size="sm" fw={700}>
                      {c.price_theory ? c.price_theory.toLocaleString() : "100 000"} / {c.price_practical ? c.price_practical.toLocaleString() : "150 000"} so'm
                    </Text>
                  </div>
                  {c.map_url && (
                    <Button
                      component="a"
                      href={c.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="xs"
                      variant="light"
                      color="indigo"
                      rightSection={<IconExternalLink size={14} />}
                    >
                      Xarita
                    </Button>
                  )}
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
