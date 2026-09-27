import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Stack,
  Center,
  Badge,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import { IconBook2, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { curriculumApi, type TrafficRule } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import SEO from "../../components/common/SEO";
import SafeHtml from "../../components/common/SafeHtml";
import { errorKeyFor } from "../../types/errors";
import { pickLocalized } from "../../data/curriculumLocale";

export default function TrafficRules_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [rules, setRules] = useState<TrafficRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchRules = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getRules()
      .then((data) => {
        setRules(data);
      })
      .catch((err: unknown) => {
        // 5xx/tarmoq xatolari uchun global toast api.ts'da chiqadi — bu yerda faqat inline xato.
        setError(err);
        setRules([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const currentRule: TrafficRule | undefined = rules[0];
  const currentHtml = useMemo(
    () =>
      currentRule
        ? pickLocalized(lang, currentRule.content_html_uzl, currentRule.content_html_uzc, currentRule.content_html_ru)
        : "",
    [currentRule, lang],
  );

  return (
    <Container size="xl" py="xl">
      <SEO title={t("seo.rulesTitle")} description={t("seo.rulesDesc")} />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.rulesTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.rulesSubtitle")}
            </Text>
          </div>
          <Badge size="lg" variant="filled" color="blue" leftSection={<IconBook2 size={14} />}>
            {t("curriculum.officialText")}
          </Badge>
        </Group>

        {loading ? (
          <Paper withBorder radius="md" p="xl" bg="var(--mantine-color-body)">
            <Stack gap="md">
              <Skeleton height={28} width="40%" mb="md" />
              <Skeleton height={16} width="95%" />
              <Skeleton height={16} width="90%" />
              <Skeleton height={16} width="85%" />
              <Skeleton height={16} width="92%" />
            </Stack>
          </Paper>
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
              <Text size="sm">{t(errorKeyFor(error, "curriculum.loadRulesError"))}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchRules}
              >
                {t("common.retry")}
              </Button>
            </Group>
          </Alert>
        ) : (
          <Paper withBorder radius="md" p="xl" bg="var(--mantine-color-body)">
            {currentHtml ? (
              <SafeHtml
                style={{
                  lineHeight: 1.8,
                  fontSize: "1rem",
                  color: "var(--mantine-color-text)",
                }}
                html={currentHtml}
              />
            ) : (
              <Center py={40}>
                <Stack align="center" gap="xs">
                  <IconAlertTriangle size={40} color="gray" />
                  <Text c="dimmed">{t("curriculum.rulesNotLoaded")}</Text>
                  <Button size="xs" variant="subtle" onClick={fetchRules}>
                    {t("common.refresh")}
                  </Button>
                </Stack>
              </Center>
            )}
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
