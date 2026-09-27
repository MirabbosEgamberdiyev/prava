import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Stack,
  Center,
  TextInput,
  ActionIcon,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import { IconGavel, IconSearch, IconX, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { curriculumApi, type PracticalPenalty } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import { errorKeyFor } from "../../types/errors";
import { pickLocalized } from "../../data/curriculumLocale";

export default function Penalties_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [penalties, setPenalties] = useState<PracticalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");

  const fetchPenalties = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getPenalties()
      .then((data) => {
        setPenalties(data);
      })
      .catch((err: unknown) => {
        // 5xx/tarmoq xatolari uchun global toast api.ts'da chiqadi — bu yerda faqat inline xato.
        setError(err);
        setPenalties([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPenalties();
  }, [fetchPenalties]);

  const localized = useMemo(
    () =>
      penalties
        .filter((p): p is PracticalPenalty => !!p)
        .map((p) => ({ penalty: p, text: pickLocalized(lang, p.text_uzl, p.text_uzc, p.text_ru) })),
    [penalties, lang],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return localized;
    return localized.filter(
      ({ penalty, text }) =>
        text.toLowerCase().includes(q) ||
        (penalty.penalty_number != null && penalty.penalty_number.toString().includes(q)),
    );
  }, [localized, search]);

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.penaltiesTitle")} description={t("seo.penaltiesDesc")} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.finesTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.finesSubtitle")}
            </Text>
          </div>
          {!loading && !error && (
            <Badge size="lg" variant="filled" color="red" leftSection={<IconGavel size={14} />}>
              {t("curriculum.finesCount", { count: filtered.length })}
            </Badge>
          )}
        </Group>

        <TextInput
          placeholder={t("curriculum.searchFines")}
          aria-label={t("curriculum.searchFines")}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={18} />}
          rightSection={
            search ? (
              <ActionIcon variant="subtle" color="gray" onClick={() => setSearch("")} aria-label={t("curriculum.clean")}>
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
          size="md"
          radius="md"
        />

        {loading ? (
          <Stack gap="xs" aria-busy="true" aria-label={t("common.loading")}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} height={42} radius="sm" />
            ))}
          </Stack>
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
              <Text size="sm">{t(errorKeyFor(error, "curriculum.loadPenaltiesError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchPenalties}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        ) : filtered.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">{t("curriculum.emptyFines")}</Text>
              {search && (
                <Button size="xs" variant="subtle" onClick={() => setSearch("")}>
                  {t("curriculum.clearSearch")}
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Paper withBorder radius="md" p="md">
            <Table.ScrollContainer minWidth={560}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 60 }}>{t("curriculum.colNumber")}</Table.Th>
                    <Table.Th>{t("curriculum.colViolation")}</Table.Th>
                    <Table.Th style={{ width: 220 }}>{t("curriculum.colPoints")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map(({ penalty: p, text }) => (
                    <Table.Tr key={p.id}>
                      <Table.Td fw={700}>{p.penalty_number}</Table.Td>
                      <Table.Td style={{ fontSize: "0.95rem" }}>{text}</Table.Td>
                      <Table.Td>
                        {p.points >= 100 ? (
                          <Badge color="red" variant="filled">
                            {t("curriculum.fail100")}
                          </Badge>
                        ) : p.points >= 20 ? (
                          <Badge color="orange" variant="filled">
                            {t("curriculum.pointsValue", { count: p.points })}
                          </Badge>
                        ) : (
                          <Badge color="yellow" variant="light">
                            {t("curriculum.pointsValue", { count: p.points })}
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
