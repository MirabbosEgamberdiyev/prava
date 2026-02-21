/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  Stack,
  Card,
  Text,
  Table,
  NumberInput,
  Group,
  Button,
  Center,
  Loader,
  Badge,
} from "@mantine/core";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";

export const QuestionStats = () => {
  const { t, i18n } = useTranslation();
  const [threshold, setThreshold] = useState<number>(50);
  const [appliedThreshold, setAppliedThreshold] = useState<number>(50);

  // Low success rate questions
  const { data: lowSuccessData, isLoading: lowSuccessLoading } = useSWR(
    [`/api/v1/admin/questions/statistics/low-success?threshold=${appliedThreshold}&limit=20`, i18n.language],
    async ([url]) => (await api.get(url)).data
  );

  // Most used questions
  const { data: mostUsedData, isLoading: mostUsedLoading } = useSWR(
    ["/api/v1/admin/questions/statistics/most-used?limit=20", i18n.language],
    async ([url]) => (await api.get(url)).data
  );

  // Stats by topic
  const { data: byTopicData, isLoading: byTopicLoading } = useSWR(
    ["/api/v1/admin/questions/statistics/by-topic", i18n.language],
    async ([url]) => (await api.get(url)).data
  );

  const lowSuccessItems: any[] = Array.isArray(lowSuccessData?.data)
    ? lowSuccessData.data
    : Array.isArray(lowSuccessData)
      ? lowSuccessData
      : [];

  const mostUsedItems: any[] = Array.isArray(mostUsedData?.data)
    ? mostUsedData.data
    : Array.isArray(mostUsedData)
      ? mostUsedData
      : [];

  const byTopicItems: any[] = Array.isArray(byTopicData?.data)
    ? byTopicData.data
    : Array.isArray(byTopicData)
      ? byTopicData
      : [];

  return (
    <Stack gap="md">
      {/* Low success rate questions */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">
          {t("statistics.lowSuccessTitle")}
        </Text>
        <Group mb="md">
          <NumberInput
            label={t("statistics.lowSuccessThreshold")}
            value={threshold}
            onChange={(v) => setThreshold(typeof v === "number" ? v : 50)}
            min={0}
            max={100}
            w={200}
          />
          <Button
            variant="light"
            mt={24}
            onClick={() => setAppliedThreshold(threshold)}
          >
            {t("statistics.searchBtn", "Apply")}
          </Button>
        </Group>

        {lowSuccessLoading && (
          <Center h={100}>
            <Loader size="sm" />
          </Center>
        )}

        {!lowSuccessLoading && lowSuccessItems.length > 0 ? (
          <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("statistics.questionId")}</Table.Th>
                <Table.Th>{t("statistics.questionText")}</Table.Th>
                <Table.Th ta="center">{t("statistics.successRateCol")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {lowSuccessItems.map((item: any, idx: number) => (
                <Table.Tr key={item.id ?? idx}>
                  <Table.Td>{item.id ?? item.questionId ?? "-"}</Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>
                      {item.text ?? item.questionText ?? "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      variant="light"
                      color={
                        (item.successRate ?? item.rate ?? 0) < 30
                          ? "red"
                          : "orange"
                      }
                    >
                      {(item.successRate ?? item.rate ?? 0).toFixed(1)}%
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          !lowSuccessLoading && (
            <Center h={100}>
              <Text c="dimmed">{t("statistics.noData")}</Text>
            </Center>
          )
        )}
      </Card>

      {/* Most used questions */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">
          {t("statistics.mostUsedTitle")}
        </Text>

        {mostUsedLoading && (
          <Center h={100}>
            <Loader size="sm" />
          </Center>
        )}

        {!mostUsedLoading && mostUsedItems.length > 0 ? (
          <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("statistics.questionId")}</Table.Th>
                <Table.Th>{t("statistics.questionText")}</Table.Th>
                <Table.Th ta="center">{t("statistics.usageCount")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {mostUsedItems.map((item: any, idx: number) => (
                <Table.Tr key={item.id ?? idx}>
                  <Table.Td>{item.id ?? item.questionId ?? "-"}</Table.Td>
                  <Table.Td>
                    <Text size="sm" lineClamp={2}>
                      {item.text ?? item.questionText ?? "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge variant="light" color="blue">
                      {item.usageCount ?? item.count ?? 0}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          !mostUsedLoading && (
            <Center h={100}>
              <Text c="dimmed">{t("statistics.noData")}</Text>
            </Center>
          )
        )}
      </Card>

      {/* Stats by topic */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={600} mb="md">
          {t("statistics.statsByTopicTitle")}
        </Text>

        {byTopicLoading && (
          <Center h={100}>
            <Loader size="sm" />
          </Center>
        )}

        {!byTopicLoading && byTopicItems.length > 0 ? (
          <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("statistics.topicName")}</Table.Th>
                <Table.Th ta="center">{t("statistics.questionCount")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {byTopicItems.map((item: any, idx: number) => (
                <Table.Tr key={item.topicId ?? idx}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {item.topicName ?? item.topic ?? item.name ?? "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge variant="light" color="teal">
                      {item.questionCount ?? item.count ?? item.totalQuestions ?? 0}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          !byTopicLoading && (
            <Center h={100}>
              <Text c="dimmed">{t("statistics.noData")}</Text>
            </Center>
          )
        )}
      </Card>
    </Stack>
  );
};
