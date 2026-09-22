import { useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  SimpleGrid,
  Card,
  Badge,
  Center,
  Loader,
  Button,
  Paper,
  Divider,
  Anchor,
} from "@mantine/core";
import {
  IconMapPin,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
  IconPhone,
  IconClock,
  IconBus,
  IconCash,
  IconExternalLink,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useExamCenters, type ExamCenter } from "../../features/curriculum";

export default function ExamCentersPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { centers, isLoading, isError, refresh } = useExamCenters();

  const getLocalizedRegion = (c: ExamCenter) => {
    if (i18n.language === "ru" && c.region_ru) return c.region_ru;
    if (i18n.language === "uzc" && c.region_uzc) return c.region_uzc;
    return c.region_uzl;
  };

  const getLocalizedAddress = (c: ExamCenter) => {
    if (i18n.language === "ru" && c.address_ru) return c.address_ru;
    if (i18n.language === "uzc" && c.address_uzc) return c.address_uzc;
    return c.address_uzl;
  };

  const getLocalizedTransport = (c: ExamCenter) => {
    if (i18n.language === "ru" && c.transport_ru) return c.transport_ru;
    if (i18n.language === "uzc" && c.transport_uzc) return c.transport_uzc;
    return c.transport_uzl || "";
  };

  const filteredCenters = centers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const region = getLocalizedRegion(c).toLowerCase();
    const address = getLocalizedAddress(c).toLowerCase();
    return region.includes(q) || address.includes(q);
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconMapPin size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.centersTitle", "Yagona Imtihon Markazlari")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.centersSubtitle", "O'zbekiston Respublikasi bo'ylab 14 ta hududiy rasmiy imtihon markazi")}
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

      {/* Filter and Search */}
      <Paper p={{ base: "xs", sm: "md" }} radius="md" withBorder>
        <Group justify="space-between" wrap="wrap" gap="sm">
          <TextInput
            placeholder={t("curriculum.searchCenters", "Viloyat yoki manzil bo'yicha qidirish...")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flexGrow: 1, minWidth: 180 }}
          />
          <Badge size="lg" variant="light" color="cyan">
            {t("common.total", "Jami")}: {centers.length} {t("curriculum.centersCount", "ta markaz")}
          </Badge>
        </Group>
      </Paper>

      {/* Grid of Exam Centers */}
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
      ) : filteredCenters.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Imtihon markazi topilmadi")}</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
          {filteredCenters.map((c) => {
            const region = getLocalizedRegion(c);
            const address = getLocalizedAddress(c);
            const transport = getLocalizedTransport(c);

            return (
              <Card key={c.id} shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Title order={3} fz="md" fw={700}>
                      {region}
                    </Title>
                    <Badge variant="light" color="blue">
                      ID #{c.id}
                    </Badge>
                  </Group>

                  <Group gap={6} align="flex-start">
                    <IconMapPin size={16} color="var(--mantine-primary-color-filled)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <Text size="sm">{address}</Text>
                  </Group>

                  {c.phones && (
                    <Group gap={6} align="center">
                      <IconPhone size={16} color="gray" style={{ flexShrink: 0 }} />
                      <Text size="xs" c="dimmed">{c.phones}</Text>
                    </Group>
                  )}

                  {(c.work_days || c.work_hours) && (
                    <Group gap={6} align="center">
                      <IconClock size={16} color="gray" style={{ flexShrink: 0 }} />
                      <Text size="xs" c="dimmed">
                        {c.work_days} ({c.work_hours})
                      </Text>
                    </Group>
                  )}

                  {transport && (
                    <Group gap={6} align="center">
                      <IconBus size={16} color="gray" style={{ flexShrink: 0 }} />
                      <Text size="xs" c="dimmed">{transport}</Text>
                    </Group>
                  )}

                  <Divider my={4} />

                  {(c.price_theory || c.price_practical) && (
                    <Group justify="space-between">
                      <Group gap={4}>
                        <IconCash size={16} color="green" />
                        <Text size="xs" fw={600}>
                          {t("curriculum.theory", "Nazariya")}: {c.price_theory || "-"}
                        </Text>
                      </Group>
                      <Text size="xs" fw={600} c="dimmed">
                        {t("curriculum.practical", "Amaliy")}: {c.price_practical || "-"}
                      </Text>
                    </Group>
                  )}

                  {c.map_url && (
                    <Anchor
                      href={c.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      mt="xs"
                    >
                      <Button
                        variant="light"
                        color="blue"
                        size="xs"
                        fullWidth
                        rightSection={<IconExternalLink size={14} />}
                      >
                        {t("curriculum.openMap", "Xaritada ochish")}
                      </Button>
                    </Anchor>
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
