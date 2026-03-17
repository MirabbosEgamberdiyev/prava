// features/ticket/components/TicketForm.tsx

import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Stack,
  Grid,
  Tabs,
  Group,
  Divider,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { TicketFormData } from "../types";
import { useTopicOptions } from "../../topic/hooks/useTopics";
import { usePackageOptions } from "../../package/hook";
import { TicketQuestionsManager } from "./TicketQuestionsManager";

interface TicketFormProps {
  initialValues?: Partial<TicketFormData>;
  onSubmit: (values: TicketFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TicketForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}: TicketFormProps) {
  const { t } = useTranslation();
  const { options: topicOptions, isLoading: topicsLoading } = useTopicOptions();
  const { options: packageOptions, isLoading: packagesLoading } = usePackageOptions();

  const form = useForm<TicketFormData>({
    initialValues: {
      nameUzl: "",
      nameUzc: "",
      nameEn: "",
      nameRu: "",
      descriptionUzl: "",
      descriptionUzc: "",
      descriptionEn: "",
      descriptionRu: "",
      ticketNumber: 1,
      packageId: 0,
      topicId: 0,
      questionIds: [],
      questionCount: 10,
      durationMinutes: 15,
      passingScore: 70,
      ...initialValues,
    },
    validate: {
      nameUzl: (value: string) => (!value ? t("validation.nameUzlRequired") : null),
      nameUzc: (value: string) => (!value ? t("validation.nameUzcRequired") : null),
      nameEn: (value: string) => (!value ? t("validation.nameEnRequired") : null),
      nameRu: (value: string) => (!value ? t("validation.nameRuRequired") : null),
      ticketNumber: (value: number) => (value < 1 ? t("validation.ticketNumberRequired") : null),
      durationMinutes: (value: number) => (value < 1 ? t("validation.minDuration") : null),
      passingScore: (value: number) =>
        value < 0 || value > 100 ? t("validation.scoreRange") : null,
      questionIds: (value: number[]) =>
        value.length < 10 ? "Kamida 10 ta savol tanlash kerak" : null,
    },
  });

  const handleSubmit = form.onSubmit(async (values: TicketFormData) => {
    await onSubmit({
      ...values,
      packageId: values.packageId === 0 ? (null as unknown as number) : values.packageId,
      topicId: values.topicId === 0 ? (null as unknown as number) : values.topicId,
      questionCount: values.questionIds.length,
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        {/* Nomlar */}
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
                placeholder={t("tickets.form.namePlaceholder")}
                required
                {...form.getInputProps("nameUzl")}
              />
              <Textarea
                label={t("common.form.descUzl")}
                placeholder={t("tickets.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionUzl")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="uzc" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameUzc")}
                placeholder={t("tickets.form.namePlaceholder")}
                required
                {...form.getInputProps("nameUzc")}
              />
              <Textarea
                label={t("common.form.descUzc")}
                placeholder={t("tickets.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionUzc")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="en" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameEn")}
                placeholder={t("tickets.form.namePlaceholder")}
                required
                {...form.getInputProps("nameEn")}
              />
              <Textarea
                label={t("common.form.descEn")}
                placeholder={t("tickets.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionEn")}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="ru" pt="md">
            <Stack gap="sm">
              <TextInput
                label={t("common.form.nameRu")}
                placeholder={t("tickets.form.namePlaceholder")}
                required
                {...form.getInputProps("nameRu")}
              />
              <Textarea
                label={t("common.form.descRu")}
                placeholder={t("tickets.form.descPlaceholder")}
                rows={3}
                {...form.getInputProps("descriptionRu")}
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* Asosiy sozlamalar */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("tickets.form.ticketNumber")}
              min={1}
              required
              {...form.getInputProps("ticketNumber")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label={t("tickets.form.topicId")}
              placeholder={t("validation.selectTopic")}
              data={topicOptions}
              searchable
              clearable
              disabled={topicsLoading}
              value={form.values.topicId === 0 ? null : form.values.topicId.toString()}
              onChange={(val: string | null) => form.setFieldValue("topicId", val ? parseInt(val) : 0)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label={t("tickets.form.packageId")}
              placeholder={t("tickets.form.packageOptional", { defaultValue: "Paket (ixtiyoriy)" })}
              data={packageOptions}
              searchable
              clearable
              disabled={packagesLoading}
              value={form.values.packageId === 0 ? null : form.values.packageId.toString()}
              onChange={(val: string | null) => form.setFieldValue("packageId", val ? parseInt(val) : 0)}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("tickets.form.duration")}
              min={1}
              required
              {...form.getInputProps("durationMinutes")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label={t("tickets.form.passingScore")}
              min={0}
              max={100}
              required
              {...form.getInputProps("passingScore")}
            />
          </Grid.Col>
        </Grid>

        <Divider />

        {/* Savollar boshqaruvi */}
        <Stack gap="xs">
          {form.errors.questionIds && (
            <Text size="xs" c="red">
              {form.errors.questionIds}
            </Text>
          )}
          <TicketQuestionsManager
            topicId={form.values.topicId > 0 ? form.values.topicId : undefined}
            onChange={(ids) => form.setFieldValue("questionIds", ids)}
          />
        </Stack>

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
