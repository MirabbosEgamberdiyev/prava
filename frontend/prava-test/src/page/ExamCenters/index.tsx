import { useState, useEffect, useCallback } from "react";
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
import { errorKeyFor } from "../../types/errors";
import { formatLocalizedNumber, pickLocalized } from "../../data/curriculumLocale";

/** Faqat http(s) xarita havolalari ochiladi (javascript: va h.k. rad etiladi). */
function safeMapUrl(url?: string): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : null;
}

function isPositivePrice(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export default function ExamCenters_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [centers, setCenters] = useState<ExamCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchCenters = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getExamCenters()
      .then((data) => {
        setCenters(data.filter((c): c is ExamCenter => !!c));
      })
      .catch((err: unknown) => {
        // 5xx/tarmoq xatolari uchun global toast api.ts'da chiqadi — bu yerda faqat inline xato.
        setError(err);
        setCenters([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const formatPrice = (value: number) => `${formatLocalizedNumber(value, lang)} ${t("common.currency")}`;

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.examCentersTitle")} description={t("seo.examCentersDesc")} />

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
          {!loading && !error && (
            <Badge size="lg" variant="filled" color="indigo" leftSection={<IconBuildingSkyscraper size={14} />}>
              {t("curriculum.centersCount", { count: centers.length })}
            </Badge>
          )}
        </Group>

        {loading ? (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg" aria-busy="true" aria-label={t("common.loading")}>
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
              <Text size="sm">{t(errorKeyFor(error, "curriculum.loadCentersError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchCenters}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        ) : centers.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">{t("curriculum.emptyCenters")}</Text>
              <Button size="xs" variant="subtle" onClick={fetchCenters}>
                {t("common.refresh")}
              </Button>
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {centers.map((c) => {
              const region = pickLocalized(lang, c.region_uzl, c.region_uzc, c.region_ru);
              const address = pickLocalized(lang, c.address_uzl, c.address_uzc, c.address_ru);
              const transport = pickLocalized(lang, c.transport_uzl, c.transport_uzc, c.transport_ru);
              const schedule = [c.work_days, c.work_hours].filter(Boolean).join(": ");
              const mapUrl = safeMapUrl(c.map_url);
              const hasTheory = isPositivePrice(c.price_theory);
              const hasPractical = isPositivePrice(c.price_practical);

              return (
                <Card key={c.id} shadow="sm" padding="lg" radius="md" withBorder>
                  {region && (
                    <Group mb="xs">
                      <Badge color="indigo" size="md" variant="light" maw="100%">
                        {region}
                      </Badge>
                    </Group>
                  )}

                  <Title order={4} fw={700} mb="xs">
                    {region ? t("curriculum.centerName", { region }) : t("curriculum.centersTitle")}
                  </Title>

                  <Stack gap="xs" mt="md">
                    {address && (
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <IconMapPin size={18} color="var(--mantine-color-indigo-6)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
                        <Text size="sm">{address}</Text>
                      </Group>
                    )}

                    {c.phones && (
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <IconPhone
                          size={18}
                          color="var(--mantine-color-green-6)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                          aria-label={t("curriculum.phone")}
                        />
                        <Text size="sm" fw={600} c="green" style={{ wordBreak: "break-word" }}>
                          {c.phones}
                        </Text>
                      </Group>
                    )}

                    {schedule && (
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <IconClock
                          size={18}
                          color="var(--mantine-color-orange-6)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                          aria-label={t("curriculum.workHours")}
                        />
                        <Text size="sm">{schedule}</Text>
                      </Group>
                    )}

                    {transport && (
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <IconBus
                          size={18}
                          color="var(--mantine-color-blue-6)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                          aria-label={t("curriculum.transport")}
                        />
                        <Text size="xs" c="dimmed">
                          {transport}
                        </Text>
                      </Group>
                    )}
                  </Stack>

                  {(hasTheory || hasPractical || mapUrl) && (
                    <>
                      <Divider my="md" />

                      <Group justify="space-between" align="center" gap="sm">
                        {(hasTheory || hasPractical) && (
                          <Stack gap={2}>
                            <Text size="xs" c="dimmed">
                              {t("curriculum.examFees")}
                            </Text>
                            {hasTheory && (
                              <Text size="sm" fw={700}>
                                {t("curriculum.theory")}: {formatPrice(c.price_theory as number)}
                              </Text>
                            )}
                            {hasPractical && (
                              <Text size="sm" fw={700}>
                                {t("curriculum.practical")}: {formatPrice(c.price_practical as number)}
                              </Text>
                            )}
                          </Stack>
                        )}
                        {mapUrl && (
                          <Button
                            component="a"
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="xs"
                            variant="light"
                            color="indigo"
                            rightSection={<IconExternalLink size={14} />}
                            title={t("curriculum.openMap")}
                            maw="100%"
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                              {t("curriculum.openMap")}
                            </span>
                          </Button>
                        )}
                      </Group>
                    </>
                  )}
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}
