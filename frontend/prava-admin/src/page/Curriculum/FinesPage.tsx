import { useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  SegmentedControl,
  Table,
  Paper,
  Badge,
  Center,
  Loader,
  Button,
  SimpleGrid,
  Card,
  ThemeIcon,
  Box,
} from "@mantine/core";
import {
  IconGavel,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconAlertTriangle,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { usePracticalPenalties, type PracticalPenalty } from "../../features/curriculum";

export default function FinesPage() {
  const { t, i18n } = useTranslation();
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { penalties, isLoading, isError, refresh } = usePracticalPenalties();

  const getLocalizedText = (p: PracticalPenalty) => {
    if (i18n.language === "ru" && p.text_ru) return p.text_ru;
    if (i18n.language === "uzc" && p.text_uzc) return p.text_uzc;
    return p.text_uzl;
  };

  const filteredPenalties = penalties.filter((p) => {
    if (selectedSeverity && p.severity !== selectedSeverity) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const text = getLocalizedText(p).toLowerCase();
    return text.includes(q) || String(p.penalty_number).includes(q);
  });

  const criticalCount = penalties.filter((p) => p.severity === "CRITICAL").length;
  const majorCount = penalties.filter((p) => p.severity === "MAJOR").length;
  const minorCount = penalties.filter((p) => p.severity === "MINOR").length;

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return <Badge color="red" variant="filled">{t("curriculum.critical", "Qo'pol xato")}</Badge>;
      case "MAJOR":
        return <Badge color="orange" variant="light">{t("curriculum.major", "O'rtacha xato")}</Badge>;
      case "MINOR":
        return <Badge color="blue" variant="light">{t("curriculum.minor", "Kichik xato")}</Badge>;
      default:
        return <Badge color="gray" variant="light">{severity}</Badge>;
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconGavel size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.finesTitle", "Jarimalar & Qoidabuzarliklar")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.finesSubtitle", "Amaliy imtihondagi jarima ballari va rasmiy qoidabuzarliklar reyestri")}
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

      {/* Summary KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("curriculum.totalViolations", "Jami qoidabuzarliklar")}
              </Text>
              <Text size="xl" fw={700}>
                {penalties.length}
              </Text>
            </div>
            <ThemeIcon size={38} radius="md" variant="light" color="blue">
              <IconGavel size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("curriculum.critical", "Qo'pol xatolar")}
              </Text>
              <Text size="xl" fw={700} c="red">
                {criticalCount}
              </Text>
            </div>
            <ThemeIcon size={38} radius="md" variant="light" color="red">
              <IconAlertCircle size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("curriculum.major", "O'rtacha xatolar")}
              </Text>
              <Text size="xl" fw={700} c="orange">
                {majorCount}
              </Text>
            </div>
            <ThemeIcon size={38} radius="md" variant="light" color="orange">
              <IconAlertTriangle size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        <Card shadow="xs" padding="sm" radius="md" withBorder>
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                {t("curriculum.minor", "Kichik xatolar")}
              </Text>
              <Text size="xl" fw={700} c="blue">
                {minorCount}
              </Text>
            </div>
            <ThemeIcon size={38} radius="md" variant="light" color="blue">
              <IconInfoCircle size={20} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Filter and Search Controls */}
      <Paper p={{ base: "xs", sm: "md" }} radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <TextInput
              placeholder={t("curriculum.searchFines", "Qoidabuzarlik matni bo'yicha qidirish...")}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flexGrow: 1, minWidth: 180 }}
            />
            <Box style={{ overflowX: "auto", maxWidth: "100%", paddingBottom: 4 }}>
              <SegmentedControl
                value={selectedSeverity}
                onChange={setSelectedSeverity}
                data={[
                  { value: "", label: t("common.all", "Barchasi") },
                  { value: "CRITICAL", label: t("curriculum.critical", "Qo'pol") },
                  { value: "MAJOR", label: t("curriculum.major", "O'rtacha") },
                  { value: "MINOR", label: t("curriculum.minor", "Kichik") },
                ]}
                radius="md"
                size="xs"
              />
            </Box>
          </Group>
        </Stack>
      </Paper>

      {/* Table of Penalties */}
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
      ) : filteredPenalties.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Hech qanday jarima topilmadi")}</Text>
        </Center>
      ) : (
        <Table.ScrollContainer minWidth={700}>
          <Table striped highlightOnHover withTableBorder verticalSpacing="sm" fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 60 }}>#</Table.Th>
                <Table.Th style={{ width: 140 }}>{t("curriculum.severity", "Daraja")}</Table.Th>
                <Table.Th style={{ width: 120 }}>{t("curriculum.points", "Jarima balli")}</Table.Th>
                <Table.Th>{t("curriculum.violation", "Qoidabuzarlik mazmuni")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredPenalties.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td fw={700}>{p.penalty_number}</Table.Td>
                  <Table.Td>{getSeverityBadge(p.severity)}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="light"
                      color={p.points >= 25 ? "red" : p.points >= 10 ? "orange" : "blue"}
                    >
                      {p.points} ball
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{getLocalizedText(p)}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  );
}
