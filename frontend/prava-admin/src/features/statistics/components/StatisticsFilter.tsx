/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Stack,
  Card,
  Group,
  Text,
  Select,
  Center,
  Loader,
  Paper,
  SimpleGrid,
  TextInput,
  Button,
  NumberInput,
  Collapse,
} from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";

interface FilterParams {
  dateFrom: string;
  dateTo: string;
  userId: number | string;
  packageId: number | string;
  ticketId: number | string;
  topicId: number | string;
  mode: string | null;
}

const initialFilter: FilterParams = {
  dateFrom: "",
  dateTo: "",
  userId: "",
  packageId: "",
  ticketId: "",
  topicId: "",
  mode: null,
};

export const StatisticsFilter = () => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [filter, setFilter] = useState<FilterParams>(initialFilter);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleApply = async () => {
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, unknown> = {};
      if (filter.dateFrom) body.dateFrom = filter.dateFrom;
      if (filter.dateTo) body.dateTo = filter.dateTo;
      if (filter.userId !== "" && filter.userId !== undefined)
        body.userId = Number(filter.userId);
      if (filter.packageId !== "" && filter.packageId !== undefined)
        body.packageId = Number(filter.packageId);
      if (filter.ticketId !== "" && filter.ticketId !== undefined)
        body.ticketId = Number(filter.ticketId);
      if (filter.topicId !== "" && filter.topicId !== undefined)
        body.topicId = Number(filter.topicId);
      if (filter.mode) body.mode = filter.mode;

      const response = await api.post("/api/v2/admin/statistics/filter", body);
      setResult(response.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilter(initialFilter);
    setResult(null);
  };

  const renderResultCards = () => {
    if (!result?.data) return null;
    const s = result.data.summary || result.data;
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">
          {t("statistics.filterResults")}
        </Text>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.totalExams")}
            </Text>
            <Text size="lg" fw={700}>
              {s.totalExams || 0}
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.passedExams")}
            </Text>
            <Text size="lg" fw={700} c="green">
              {s.passedExams || 0}
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.failedExams")}
            </Text>
            <Text size="lg" fw={700} c="red">
              {s.failedExams || 0}
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.passRate")}
            </Text>
            <Text size="lg" fw={700}>
              {(s.passRate || 0).toFixed(1)}%
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.avgScore")}
            </Text>
            <Text size="lg" fw={700}>
              {(s.averageScore || 0).toFixed(1)}
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.bestScore")}
            </Text>
            <Text size="lg" fw={700}>
              {s.bestScore || 0}
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.accuracy")}
            </Text>
            <Text size="lg" fw={700}>
              {(s.accuracy || 0).toFixed(1)}%
            </Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">
              {t("statistics.totalTime")}
            </Text>
            <Text size="lg" fw={700}>
              {((s.totalTimeSpentSeconds || 0) / 3600).toFixed(1)}
            </Text>
          </Paper>
        </SimpleGrid>
      </Card>
    );
  };

  return (
    <Stack gap="md">
      <Button
        variant="light"
        leftSection={<IconFilter size={16} />}
        onClick={() => setOpened((o) => !o)}
      >
        {t("statistics.advancedFilter")}
      </Button>

      <Collapse in={opened}>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mb="md">
            <TextInput
              type="date"
              label={t("statistics.filterDateFrom")}
              value={filter.dateFrom}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  dateFrom: e.currentTarget.value,
                }))
              }
            />
            <TextInput
              type="date"
              label={t("statistics.filterDateTo")}
              value={filter.dateTo}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  dateTo: e.currentTarget.value,
                }))
              }
            />
            <NumberInput
              label={t("statistics.filterUserId")}
              value={filter.userId}
              onChange={(v) =>
                setFilter((prev) => ({ ...prev, userId: v ?? "" }))
              }
              min={1}
              allowDecimal={false}
            />
            <NumberInput
              label={t("statistics.filterPackageId")}
              value={filter.packageId}
              onChange={(v) =>
                setFilter((prev) => ({ ...prev, packageId: v ?? "" }))
              }
              min={1}
              allowDecimal={false}
            />
            <NumberInput
              label={t("statistics.filterTicketId")}
              value={filter.ticketId}
              onChange={(v) =>
                setFilter((prev) => ({ ...prev, ticketId: v ?? "" }))
              }
              min={1}
              allowDecimal={false}
            />
            <NumberInput
              label={t("statistics.filterTopicId")}
              value={filter.topicId}
              onChange={(v) =>
                setFilter((prev) => ({ ...prev, topicId: v ?? "" }))
              }
              min={1}
              allowDecimal={false}
            />
            <Select
              label={t("statistics.filterMode")}
              value={filter.mode}
              onChange={(v) => setFilter((prev) => ({ ...prev, mode: v }))}
              data={[
                { value: "PACKAGE", label: "PACKAGE" },
                { value: "TICKET", label: "TICKET" },
                { value: "MARATHON", label: "MARATHON" },
              ]}
              clearable
            />
          </SimpleGrid>

          <Group>
            <Button onClick={handleApply} loading={loading}>
              {t("statistics.filterApply")}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {t("statistics.filterReset")}
            </Button>
          </Group>
        </Card>
      </Collapse>

      {loading && (
        <Center h={100}>
          <Loader size="sm" />
        </Center>
      )}

      {!loading && result && renderResultCards()}

      {!loading && result && !result.data && (
        <Center h={100}>
          <Text c="dimmed">{t("statistics.noData")}</Text>
        </Center>
      )}
    </Stack>
  );
};
