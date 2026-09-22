import { useState } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  TextInput,
  Accordion,
  Paper,
  Badge,
  Center,
  Loader,
  Button,
  Box,
} from "@mantine/core";
import {
  IconBook,
  IconSearch,
  IconRefresh,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useTrafficRules, type TrafficRule } from "../../features/curriculum";

export default function RulesPage() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const { rules, isLoading, isError, refresh } = useTrafficRules();

  const getLocalizedTitle = (rule: TrafficRule) => {
    if (i18n.language === "ru" && rule.title_ru) return rule.title_ru;
    if (i18n.language === "uzc" && rule.title_uzc) return rule.title_uzc;
    return rule.title_uzl;
  };

  const getLocalizedHtml = (rule: TrafficRule) => {
    if (i18n.language === "ru" && rule.content_html_ru) return rule.content_html_ru;
    if (i18n.language === "uzc" && rule.content_html_uzc) return rule.content_html_uzc;
    return rule.content_html_uzl || "";
  };

  const filteredRules = rules.filter((rule) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = getLocalizedTitle(rule).toLowerCase();
    const content = getLocalizedHtml(rule).toLowerCase();
    return title.includes(q) || content.includes(q);
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconBook size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("curriculum.rulesTitle", "Yo'l harakati qoidalari (YHQ)")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("curriculum.rulesSubtitle", "O'zbekiston Respublikasi rasmiy yo'l harakati qoidalari matni")}
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

      {/* Search Input */}
      <Paper p={{ base: "xs", sm: "md" }} radius="md" withBorder>
        <Group justify="space-between" wrap="wrap" gap="sm">
          <TextInput
            placeholder={t("curriculum.searchRules", "Bob nomi yoki matni bo'yicha qidirish...")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flexGrow: 1, minWidth: 180 }}
          />
          <Badge size="lg" variant="light" color="indigo">
            {t("curriculum.totalChapters", "Jami boblar")}: {rules.length}
          </Badge>
        </Group>
      </Paper>

      {/* Content Area */}
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
      ) : filteredRules.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData", "Hech narsa topilmadi")}</Text>
        </Center>
      ) : (
        <Accordion variant="separated" radius="md" chevronPosition="right">
          {filteredRules.map((rule) => {
            const title = getLocalizedTitle(rule);
            const contentHtml = getLocalizedHtml(rule);

            return (
              <Accordion.Item key={rule.id} value={String(rule.id)}>
                <Accordion.Control>
                  <Group gap="sm">
                    <Badge size="sm" variant="filled" color="indigo">
                      {rule.chapter_num}-bob
                    </Badge>
                    <Text fw={600} size="sm">
                      {title}
                    </Text>
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  <Box
                    p="xs"
                    style={{
                      lineHeight: "1.7",
                      fontSize: "14px",
                    }}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Stack>
  );
}
