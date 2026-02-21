// features/package/components/PackageForm.tsx

import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Switch,
  Button,
  Stack,
  Grid,
  Tabs,
  MultiSelect,
  Group,
  Text,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { PackageFormData, GenerationType } from "../types";
import { useQuestionOptions } from "../../question/hooks/useQuestions";

interface PackageFormProps {
  initialValues?: Partial<PackageFormData>;
  onSubmit: (values: PackageFormData) => Promise<void>;
  onCancel: () => void;
  topics?: Array<{ value: string; label: string }>;
  questions?: Array<{ value: string; label: string }>;
  loading?: boolean;
}

export function PackageForm({
  initialValues,
  onSubmit,
  onCancel,
  topics = [],
  questions = [],
  loading = false,
}: PackageFormProps) {
  const { t } = useTranslation();
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(
    initialValues?.topicId && initialValues.topicId !== 0
      ? initialValues.topicId
      : undefined,
  );

  const form = useForm<PackageFormData>({
    initialValues: {
      nameUzl: "",
      nameUzc: "",
      nameEn: "",
      nameRu: "",
      descriptionUzl: "",
      descriptionUzc: "",
      descriptionEn: "",
      descriptionRu: "",
      questionCount: 10,
      durationMinutes: 60,
      passingScore: 70,
      generationType: "MANUAL" as GenerationType,
      topicId: 0,
      isFree: true,
      price: 0,
      orderIndex: 0,
      isActive: true,
      questionIds: [],
      ...initialValues,
    },
    validate: {
      nameUzl: (value) => (!value ? t("validation.nameUzlRequired") : null),
      nameUzc: (value) => (!value ? t("validation.nameUzcRequired") : null),
      nameEn: (value) => (!value ? t("validation.nameEnRequired") : null),
      nameRu: (value) => (!value ? t("validation.nameRuRequired") : null),
      questionCount: (value) => (value < 1 ? t("validation.minQuestions") : null),
      durationMinutes: (value) => (value < 1 ? t("validation.minDuration") : null),
      passingScore: (value) =>
        value < 0 || value > 100 ? t("validation.scoreRange") : null,
      topicId: (value) => (value === 0 ? t("validation.selectTopic") : null),
      price: (value, values) =>
        !values.isFree && value <= 0 ? t("validation.priceRequired") : null,
    },
  });

  // Topic bo'yicha savollarni yuklash
  const { options: topicQuestions, isLoading: loadingTopicQuestions } =
    useQuestionOptions(selectedTopicId);

  // Topic o'zgarganda savollar listini tozalash
  useEffect(() => {
    if (selectedTopicId && form.values.generationType === "MANUAL") {
      if (
        !initialValues?.topicId ||
        initialValues.topicId !== selectedTopicId
      ) {
        form.setFieldValue("questionIds", []);
      }
    }
  }, [selectedTopicId]);

  const handleTopicChange = (value: string | null) => {
    const topicId = parseInt(value || "0");
    form.setFieldValue("topicId", topicId);
    setSelectedTopicId(topicId || undefined);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    await onSubmit(values);
  });

  const availableQuestions =
    selectedTopicId && topicQuestions.length > 0 ? topicQuestions : questions;

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <Tabs defaultValue="uzl">
          <Tabs.List>
            <Tabs.Tab value="uzl">{t("common.form.langUzl")}</Tabs.Tab>
            <Tabs.Tab value="uzc">{t("common.form.langUzc")}</Tabs.Tab>
            <Tabs.Tab value="en">{t("common.form.langEn")}</Tabs.Tab>
            <Tabs.Tab value="ru">{t("common.form.langRu")}</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="uzl" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameUzl")}
                placeholder={t("packages.form.namePlaceholder")}
                required
                {...form.getInputProps("nameUzl")}
              />
              <Textarea
                label={t("common.form.descUzl")}
                placeholder={t("packages.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionUzl")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="uzc" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameUzc")}
                placeholder={t("packages.form.namePlaceholder")}
                required
                {...form.getInputProps("nameUzc")}
              />
              <Textarea
                label={t("common.form.descUzc")}
                placeholder={t("packages.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionUzc")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="en" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameEn")}
                placeholder={t("packages.form.namePlaceholder")}
                required
                {...form.getInputProps("nameEn")}
              />
              <Textarea
                label={t("common.form.descEn")}
                placeholder={t("packages.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionEn")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="ru" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameRu")}
                placeholder={t("packages.form.namePlaceholder")}
                required
                {...form.getInputProps("nameRu")}
              />
              <Textarea
                label={t("common.form.descRu")}
                placeholder={t("packages.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionRu")}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t("packages.form.topic")}
              placeholder={t("packages.form.selectTopic")}
              data={topics}
              required
              searchable
              value={form.values.topicId.toString()}
              onChange={handleTopicChange}
              error={form.errors.topicId}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              label={t("packages.form.generationType")}
              placeholder={t("packages.form.selectType")}
              data={[
                { value: "MANUAL", label: t("packages.form.manual") },
                { value: "AUTO", label: t("packages.form.auto") },
              ]}
              required
              {...form.getInputProps("generationType")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("packages.form.questionCount")}
              min={1}
              required
              {...form.getInputProps("questionCount")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("packages.form.duration")}
              min={1}
              required
              {...form.getInputProps("durationMinutes")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("packages.form.passingScore")}
              min={0}
              max={100}
              required
              {...form.getInputProps("passingScore")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label={t("packages.form.orderIndex")}
              min={0}
              {...form.getInputProps("orderIndex")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label={t("packages.form.price")}
              min={0}
              disabled={form.values.isFree}
              {...form.getInputProps("price")}
            />
          </Grid.Col>

          {form.values.generationType === "MANUAL" && (
            <Grid.Col span={12}>
              <MultiSelect
                label={t("packages.form.questions")}
                placeholder={
                  !selectedTopicId
                    ? t("packages.form.selectTopicFirst")
                    : loadingTopicQuestions
                      ? t("packages.form.questionsLoading")
                      : t("packages.form.selectQuestions")
                }
                data={availableQuestions}
                searchable
                disabled={!selectedTopicId}
                rightSection={
                  loadingTopicQuestions ? <Loader size="xs" /> : null
                }
                {...form.getInputProps("questionIds")}
                onChange={(value) =>
                  form.setFieldValue(
                    "questionIds",
                    value.map((v) => parseInt(v)),
                  )
                }
                value={form.values.questionIds.map((id) => id.toString())}
                description={
                  !selectedTopicId ? (
                    <Text size="xs" c="dimmed">
                      {t("packages.form.selectTopicThenQuestions")}
                    </Text>
                  ) : loadingTopicQuestions ? (
                    <Text size="xs" c="dimmed">
                      {t("packages.form.questionsLoading")}
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed">
                      {t("packages.form.questionsAvailable", { count: availableQuestions.length })}
                    </Text>
                  )
                }
              />
            </Grid.Col>
          )}

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Switch
              label={t("packages.form.isFree")}
              {...form.getInputProps("isFree", { type: "checkbox" })}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Switch
              label={t("packages.form.isActive")}
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />
          </Grid.Col>
        </Grid>

        <Group justify="flex-end" mt="md">
          <Button
            variant="light"
            color="red"
            onClick={onCancel}
            leftSection={<IconX size={16} />}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            {t("common.save")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
