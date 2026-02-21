// features/package/components/EditPackageForm.tsx

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
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PackageFormData, PackageDetail } from "../types";
import { useQuestionOptions } from "../../question/hooks/useQuestions";

interface EditPackageFormProps {
  initialData: PackageDetail;
  onSubmit: (values: Partial<PackageFormData>) => Promise<void>;
  onCancel: () => void;
  topics?: Array<{ value: string; label: string }>;
  loading?: boolean;
}

export function EditPackageForm({
  initialData,
  onSubmit,
  onCancel,
  topics = [],
  loading = false,
}: EditPackageFormProps) {
  const { t } = useTranslation();
  const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>(
    initialData.topicId && initialData.topicId !== 0
      ? initialData.topicId
      : undefined,
  );

  const form = useForm<PackageFormData>({
    initialValues: {
      nameUzl: initialData.nameUzl || "",
      nameUzc: initialData.nameUzc || "",
      nameEn: initialData.nameEn || "",
      nameRu: initialData.nameRu || "",
      descriptionUzl: initialData.descriptionUzl || "",
      descriptionUzc: initialData.descriptionUzc || "",
      descriptionEn: initialData.descriptionEn || "",
      descriptionRu: initialData.descriptionRu || "",
      questionCount: initialData.questionCount,
      durationMinutes: initialData.durationMinutes,
      passingScore: initialData.passingScore,
      generationType: initialData.generationType,
      topicId: initialData.topicId || 0,
      isFree: initialData.isFree,
      price: initialData.price,
      orderIndex: initialData.orderIndex,
      isActive: initialData.isActive,
      questionIds: initialData.questionIds || [],
    },
    validate: {
      nameUzl: (value) => (!value ? t("validation.nameUzlRequired") : null),
      nameUzc: (value) => (!value ? t("validation.nameUzcRequired") : null),
      nameEn: (value) => (!value ? t("validation.nameEnRequired") : null),
      nameRu: (value) => (!value ? t("validation.nameRuRequired") : null),
      topicId: (value) => (value === 0 ? t("validation.topicIdRequired") : null),
      questionCount: (value) => (value < 1 ? t("validation.minQuestions") : null),
      durationMinutes: (value) => (value < 1 ? t("validation.minDuration") : null),
      passingScore: (value) =>
        value < 0 || value > 100 ? t("validation.scoreRange") : null,
      price: (value, values) =>
        !values.isFree && value <= 0 ? t("validation.priceRequired") : null,
    },
  });

  // Topic bo'yicha savollarni yuklash
  const { options: topicQuestions, isLoading: loadingTopicQuestions } =
    useQuestionOptions(selectedTopicId);

  const handleTopicChange = (value: string | null) => {
    if (!value) {
      form.setFieldValue("topicId", 0);
      setSelectedTopicId(undefined);
      return;
    }
    const topicId = parseInt(value);
    form.setFieldValue("topicId", topicId);
    setSelectedTopicId(topicId);
  };

  const handleSubmit = form.onSubmit(async (values) => {
    // Faqat o'zgargan maydonlarni topish
    const changedFields: Partial<PackageFormData> = {};

    (Object.keys(values) as Array<keyof PackageFormData>).forEach((key) => {
      const currentValue = values[key];
      const initialValue = initialData[key as keyof PackageDetail];

      // Array lar uchun
      if (Array.isArray(currentValue)) {
        if (
          JSON.stringify(currentValue) !== JSON.stringify(initialValue || [])
        ) {
          (changedFields as Record<string, unknown>)[key] = currentValue;
        }
      }
      // Oddiy qiymatlar uchun
      else if (currentValue !== initialValue) {
        (changedFields as Record<string, unknown>)[key] = currentValue;
      }
    });

    // Agar o'zgarishlar bo'lsa, yuborish
    if (Object.keys(changedFields).length > 0) {
      await onSubmit(changedFields);
    } else {
      onCancel();
    }
  });

  const availableQuestions = topicQuestions;

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
              searchable
              clearable
              value={
                form.values.topicId === 0
                  ? null
                  : form.values.topicId.toString()
              }
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
                  loadingTopicQuestions
                    ? t("packages.form.questionsLoading")
                    : t("packages.form.selectQuestions")
                }
                data={availableQuestions}
                searchable
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
                  loadingTopicQuestions ? (
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
            {t("common.form.saveChanges")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
