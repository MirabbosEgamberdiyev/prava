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
  Card,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconScale,
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconRefresh,
  IconInfoCircle,
  IconWifiOff,
  IconFileOff,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import { errorKeyFor } from "../../types/errors";
import {
  fetchFines,
  getCachedFines,
  getFineAmountRange,
  formatAmountRange,
  formatBhmMultiplier,
  formatEffectiveDate,
  formatMoney,
  pickFineText,
  type FinesPayload,
  type TrafficFine,
} from "../../services/finesService";

interface FineRow {
  fine: TrafficFine;
  title: string;
  sanction: string;
  amount: string;
  multiplier: string;
}

export default function TrafficFines_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();
  const isNarrow = useMediaQuery("(max-width: 600px)", false, { getInitialValueInEffect: false });

  const [payload, setPayload] = useState<FinesPayload | null>(() => getCachedFines());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [stale, setStale] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback((force = false) => {
    setLoading(true);
    setError(null);
    fetchFines({ force })
      .then((res) => {
        setPayload(res.data);
        setStale(res.stale);
      })
      .catch((err: unknown) => {
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo<FineRow[]>(() => {
    if (!payload) return [];
    return payload.fines.map((fine) => ({
      fine,
      title: pickFineText(fine.title, lang),
      sanction: pickFineText(fine.extraSanction, lang),
      amount: formatAmountRange(getFineAmountRange(fine, payload.bhm), lang),
      multiplier: t("trafficFines.bhmMultiplier", { value: formatBhmMultiplier(fine, lang) }),
    }));
  }, [payload, lang, t]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.fine.articleCode.toLowerCase().includes(q) ||
        r.sanction.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const showSkeleton = loading && !payload;
  const showError = !!error && !payload;
  const hasFines = rows.length > 0;

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.trafficFinesTitle")} description={t("seo.trafficFinesDesc")} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("trafficFines.title")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("trafficFines.subtitle")}
            </Text>
          </div>
          {payload && hasFines && (
            <Badge size="lg" variant="filled" color="red" leftSection={<IconScale size={14} />}>
              {t("trafficFines.total", { count: filtered.length })}
            </Badge>
          )}
        </Group>

        {payload && payload.bhm.amount > 0 && (
          <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light" radius="md">
            <Text size="sm" fw={600}>
              {t("trafficFines.bhmNote", {
                amount: formatMoney(payload.bhm.amount, lang),
                date: formatEffectiveDate(payload.bhm.effectiveFrom, lang),
              })}
            </Text>
          </Alert>
        )}

        {stale && (
          <Alert icon={<IconWifiOff size={18} />} color="yellow" variant="light" radius="md">
            <Group justify="space-between" align="center">
              <Text size="sm">{t("trafficFines.staleNote")}</Text>
              <Button
                size="xs"
                variant="light"
                color="yellow"
                leftSection={<IconRefresh size={14} />}
                loading={loading}
                onClick={() => load(true)}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        )}

        {hasFines && (
          <TextInput
            placeholder={t("trafficFines.searchPlaceholder")}
            aria-label={t("trafficFines.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            leftSection={<IconSearch size={18} />}
            rightSection={
              search ? (
                <ActionIcon variant="subtle" color="gray" onClick={() => setSearch("")} aria-label={t("common.clearSearch")}>
                  <IconX size={16} />
                </ActionIcon>
              ) : null
            }
            size="md"
            radius="md"
          />
        )}

        {showSkeleton ? (
          <Stack gap="xs" aria-busy="true" aria-label={t("common.loading")}>
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} height={isNarrow ? 96 : 42} radius="sm" />
            ))}
          </Stack>
        ) : showError ? (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t("common.error")}
            color="red"
            variant="light"
            radius="md"
            role="alert"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{t(errorKeyFor(error, "trafficFines.loadError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                loading={loading}
                onClick={() => load(true)}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        ) : !hasFines ? (
          <Center py={60}>
            <Stack align="center" gap="xs" maw={420} ta="center">
              <IconFileOff size={40} color="gray" aria-hidden />
              <Text fw={700}>{t("trafficFines.emptyTitle")}</Text>
              <Text c="dimmed" size="sm">
                {t("trafficFines.emptyHint")}
              </Text>
            </Stack>
          </Center>
        ) : filtered.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconSearch size={40} color="gray" aria-hidden />
              <Text c="dimmed">{t("trafficFines.noResults")}</Text>
              <Button size="xs" variant="subtle" onClick={() => setSearch("")}>
                {t("common.clearSearch")}
              </Button>
            </Stack>
          </Center>
        ) : isNarrow ? (
          <Stack gap="sm">
            {filtered.map((r) => (
              <Card key={r.fine.id} withBorder radius="md" padding="md">
                <Stack gap={6}>
                  <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Badge variant="light" color="gray" style={{ textTransform: "none" }}>
                      {t("trafficFines.colArticle")} {r.fine.articleCode}
                    </Badge>
                    <Text size="xs" c="dimmed">
                      {r.multiplier}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} style={{ overflowWrap: "anywhere" }}>
                    {r.title}
                  </Text>
                  <Text size="sm" fw={800} c="red">
                    {r.amount}
                  </Text>
                  {r.sanction && (
                    <Text size="xs" c="dimmed">
                      {t("trafficFines.colSanction")}: {r.sanction}
                    </Text>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        ) : (
          <Paper withBorder radius="md" p="md">
            <Table.ScrollContainer minWidth={720}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 110 }}>{t("trafficFines.colArticle")}</Table.Th>
                    <Table.Th>{t("trafficFines.colViolation")}</Table.Th>
                    <Table.Th style={{ width: 230 }}>{t("trafficFines.colAmount")}</Table.Th>
                    <Table.Th style={{ width: 240 }}>{t("trafficFines.colSanction")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((r) => (
                    <Table.Tr key={r.fine.id}>
                      <Table.Td fw={700} style={{ whiteSpace: "nowrap" }}>
                        {r.fine.articleCode}
                      </Table.Td>
                      <Table.Td style={{ fontSize: "0.95rem" }}>{r.title}</Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700}>
                          {r.amount}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {r.multiplier}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c={r.sanction ? undefined : "dimmed"}>
                          {r.sanction || "—"}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}

        {payload && hasFines && (
          <Text size="xs" c="dimmed">
            {t("trafficFines.disclaimer")}
          </Text>
        )}
      </Stack>
    </Container>
  );
}
