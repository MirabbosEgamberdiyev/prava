import { useState } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Select,
  Slider,
  Button,
  Group,
  SimpleGrid,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import { IconEye, IconLock, IconPlayerPlay } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { Marathon_ExamPage } from "../../features/Marathon";
import type { ExamMode } from "../../components/quiz/ExamModeModal";
import { useLanguage } from "../../hooks/useLanguage";
import type { LocalizedText } from "../../types";

interface TopicSimple {
  id: number;
  code: string;
  name: LocalizedText;
  questionCount?: number;
}

interface MarathonConfig {
  questionCount: number;
  topicId: number | null;
  examMode: ExamMode;
}

const QUESTION_MARKS = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 30, label: "30" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

const Marafon_Page = () => {
  const { t } = useTranslation();
  const { localize } = useLanguage();
  const navigate = useNavigate();

  const [config, setConfig] = useState<MarathonConfig | null>(null);
  const [questionCount, setQuestionCount] = useState(20);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [examMode, setExamMode] = useState<ExamMode>("visible");

  const { data: topicsResponse } = useSWR<{
    data: TopicSimple[];
  }>("/api/v1/admin/topics/with-questions");

  const topics = topicsResponse?.data ?? [];

  const topicOptions = [
    { value: "", label: t("marathon.allTopics") },
    ...topics.map((topic) => ({
      value: String(topic.id),
      label: localize(topic.name),
    })),
  ];

  const handleStart = () => {
    setConfig({
      questionCount,
      topicId: topicId ? Number(topicId) : null,
      examMode,
    });
  };

  if (config) {
    return (
      <Marathon_ExamPage
        questionCount={config.questionCount}
        durationMinutes={config.questionCount}
        topicId={config.topicId}
        examMode={config.examMode}
      />
    );
  }

  return (
    <Container size={500} py="xl">
      <Stack gap="lg">
        <div>
          <Title order={2}>{t("marathon.title")}</Title>
          <Text c="dimmed" size="sm" mt={4}>
            {t("marathon.setupDesc")}
          </Text>
        </div>

        {/* Question Count */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <Text fw={600} mb="xs">
            {t("marathon.questionCount")}
          </Text>
          <Text size="xs" c="dimmed" mb="md">
            {questionCount} {t("marathon.questions")}
          </Text>
          <Slider
            value={questionCount}
            onChange={setQuestionCount}
            min={5}
            max={100}
            step={5}
            marks={QUESTION_MARKS}
            label={(val) => `${val}`}
          />
        </Paper>

        {/* Topic Selection */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <Text fw={600} mb="xs">
            {t("marathon.selectTopic")}
          </Text>
          <Select
            data={topicOptions}
            value={topicId}
            onChange={setTopicId}
            placeholder={t("marathon.allTopics")}
            clearable
            radius="md"
            searchable
          />
        </Paper>

        {/* Exam Mode */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <Text fw={600} mb="md">
            {t("examMode.title")}
          </Text>
          <SimpleGrid cols={2} spacing="md">
            <Paper
              p="md"
              radius="md"
              withBorder
              ta="center"
              style={{
                cursor: "pointer",
                borderColor:
                  examMode === "visible"
                    ? "var(--mantine-color-green-5)"
                    : undefined,
                transition: "border-color 0.15s ease",
              }}
              onClick={() => setExamMode("visible")}
            >
              <Stack align="center" gap="xs">
                <ThemeIcon
                  size="lg"
                  radius="xl"
                  color="green"
                  variant={examMode === "visible" ? "filled" : "light"}
                >
                  <IconEye size={20} />
                </ThemeIcon>
                <Text size="sm" fw={600}>
                  {t("examMode.practice")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("examMode.practiceDesc")}
                </Text>
              </Stack>
            </Paper>

            <Paper
              p="md"
              radius="md"
              withBorder
              ta="center"
              style={{
                cursor: "pointer",
                borderColor:
                  examMode === "secure"
                    ? "var(--mantine-color-red-5)"
                    : undefined,
                transition: "border-color 0.15s ease",
              }}
              onClick={() => setExamMode("secure")}
            >
              <Stack align="center" gap="xs">
                <ThemeIcon
                  size="lg"
                  radius="xl"
                  color="red"
                  variant={examMode === "secure" ? "filled" : "light"}
                >
                  <IconLock size={20} />
                </ThemeIcon>
                <Text size="sm" fw={600}>
                  {t("examMode.realExam")}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("examMode.realExamDesc")}
                </Text>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Paper>

        {/* Summary & Start */}
        <Paper p="md" radius="md" withBorder shadow="sm">
          <Group justify="space-between" mb="md">
            <Text fw={600}>{t("marathon.summary")}</Text>
            <Group gap="xs">
              <Badge variant="light">
                {questionCount} {t("marathon.questions")}
              </Badge>
              <Badge variant="light" color={questionCount > 30 ? "orange" : "blue"}>
                ~{questionCount} {t("marathon.minutes")}
              </Badge>
              <Badge
                variant="light"
                color={examMode === "secure" ? "red" : "green"}
              >
                {examMode === "secure"
                  ? t("examMode.realExam")
                  : t("examMode.practice")}
              </Badge>
            </Group>
          </Group>
          <Group>
            <Button variant="light" radius="md" onClick={() => navigate("/me")}>
              {t("common.back")}
            </Button>
            <Button
              radius="md"
              flex={1}
              rightSection={<IconPlayerPlay size={18} />}
              onClick={handleStart}
            >
              {t("marathon.startExam")}
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Container>
  );
};

export default Marafon_Page;
