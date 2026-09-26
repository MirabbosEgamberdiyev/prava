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

export default function TrafficRules_Page() {
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [rules, setRules] = useState<TrafficRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getRules()
      .then((data) => {
        setRules(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load traffic rules:", err);
        setError(t("curriculum.loadRulesError", "Yo'l harakati qoidalarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring."));
        setRules([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const safeRules = useMemo(() => (Array.isArray(rules) ? rules : []), [rules]);

  const getLocalizedContent = (r: TrafficRule) => {
    if (lang === "ru" && r.content_html_ru) return r.content_html_ru;
    if (lang === "uzc" && r.content_html_uzc) return r.content_html_uzc;
    return r.content_html_uzl || "";
  };

  const currentRule = safeRules[0];

  return (
    <Container size="xl" py="xl">
      <SEO
        title={t("seo.rulesTitle", "Yo'l Harakati Qoidalari — Rasmiy Elektron Kitob (YHQ)")}
        description={t("seo.rulesDesc", "O'zbekiston Respublikasi Vazirlar Mahkamasining 172-son qarori bilan tasdiqlangan rasmiy Yo'l Harakati Qoidalari matni.")}
      />

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
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchRules}
              >
                {t("common.refresh")}
              </Button>
            </Group>
          </Alert>
        )}

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
        ) : (
          <Paper withBorder radius="md" p="xl" bg="var(--mantine-color-body)">
            {currentRule ? (
              <SafeHtml
                style={{
                  lineHeight: 1.8,
                  fontSize: "1rem",
                  color: "var(--mantine-color-text)",
                }}
                html={getLocalizedContent(currentRule)}
              />
            ) : (
              <Center py={40}>
                <Stack align="center" gap="xs">
                  <IconAlertTriangle size={40} color="gray" />
                  <Text c="dimmed">{t("curriculum.rulesNotLoaded")}</Text>
                  <Button size="xs" variant="subtle" onClick={fetchRules}>
                    Qayta urinish
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
