import {
  Drawer,
  TextInput,
  Button,
  Stack,
  Group,
  Switch,
  NumberInput,
  Textarea,
  Tabs,
  ScrollArea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Topic } from "../types";

interface Props {
  topic: Topic | null;
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: number, values: Topic) => void;
  loading: boolean;
}

export const TopicEditDrawer = ({
  topic,
  opened,
  onClose,
  onSubmit,
  loading,
}: Props) => {
  const { t } = useTranslation();
  const form = useForm({
    initialValues: {
      code: "",
      nameUzl: "",
      nameUzc: "",
      nameEn: "",
      nameRu: "",
      descriptionUzl: "",
      descriptionUzc: "",
      descriptionEn: "",
      descriptionRu: "",
      displayOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (topic) {
      form.setValues({
        code: topic.code || "",
        nameUzl: topic.nameUzl || "",
        nameUzc: topic.nameUzc || "",
        nameEn: topic.nameEn || "",
        nameRu: topic.nameRu || "",
        descriptionUzl: topic.descriptionUzl || "",
        descriptionUzc: topic.descriptionUzc || "",
        descriptionEn: topic.descriptionEn || "",
        descriptionRu: topic.descriptionRu || "",
        displayOrder: topic.displayOrder || 0,
        isActive: topic.isActive,
      });
    }
  }, [topic]);

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={t("topics.editTitle")}
      position="right"
      size="md"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <form
        onSubmit={form.onSubmit((values) => {
          if (topic) {
            onSubmit(topic.id, values as unknown as Topic);
          }
        })}
      >
        <Stack gap="md">
          <TextInput
            label={t("topics.code")}
            {...form.getInputProps("code")}
            readOnly
          />

          <Tabs defaultValue="uzl">
            <Tabs.List>
              <Tabs.Tab value="uzl">{t("languages.uzLatin")}</Tabs.Tab>
              <Tabs.Tab value="uzc">{t("languages.uzCyrillic")}</Tabs.Tab>
              <Tabs.Tab value="ru">{t("languages.russian")}</Tabs.Tab>
              <Tabs.Tab value="en">{t("languages.english")}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="uzl" pt="xs">
              <Stack gap="xs">
                <TextInput
                  label={t("topics.nameLatin")}
                  required
                  {...form.getInputProps("nameUzl")}
                />
                <Textarea
                  label={t("topics.descriptionLatin")}
                  autosize
                  minRows={2}
                  {...form.getInputProps("descriptionUzl")}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="uzc" pt="xs">
              <Stack gap="xs">
                <TextInput
                  label={t("topics.nameCyrillic")}
                  {...form.getInputProps("nameUzc")}
                />
                <Textarea
                  label={t("topics.descriptionCyrillic")}
                  autosize
                  minRows={2}
                  {...form.getInputProps("descriptionUzc")}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="ru" pt="xs">
              <Stack gap="xs">
                <TextInput label={t("topics.nameRussian")} {...form.getInputProps("nameRu")} />
                <Textarea
                  label={t("topics.descriptionRussian")}
                  autosize
                  minRows={2}
                  {...form.getInputProps("descriptionRu")}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="en" pt="xs">
              <Stack gap="xs">
                <TextInput label={t("topics.nameEnglish")} {...form.getInputProps("nameEn")} />
                <Textarea
                  label={t("topics.descriptionEnglish")}
                  autosize
                  minRows={2}
                  {...form.getInputProps("descriptionEn")}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group grow>
            <NumberInput
              label={t("topics.displayOrder")}
              {...form.getInputProps("displayOrder")}
            />
            <Switch
              label={t("topics.activeStatus")}
              labelPosition="left"
              mt="xl"
              {...form.getInputProps("isActive", { type: "checkbox" })}
            />
          </Group>

          <Group justify="flex-end" mt="xl">
            <Button variant="outline" onClick={onClose} color="gray">
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={loading}>
              {t("common.save")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
};
