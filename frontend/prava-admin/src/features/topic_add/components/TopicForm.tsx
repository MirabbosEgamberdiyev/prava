import {
  TextInput,
  Textarea,
  NumberInput,
  Checkbox,
  Button,
  Grid,
  Group,
  FileButton,
  Image,
  Paper,
  Text,
  Divider,
  Stack,
  Box,
} from "@mantine/core";
import { IconDeviceFloppy, IconUpload } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAddTopicForm } from "../hooks/useAddTopicForm";

export const TopicForm = () => {
  const { t } = useTranslation();
  const { form, handleSubmit, uploadIcon } = useAddTopicForm();

  return (
    <Paper withBorder p="lg" radius="md">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t("topics.topicCode")}
              withAsterisk
              {...form.getInputProps("code")}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label={t("topics.displayOrder")}
              placeholder="1"
              min={1}
              {...form.getInputProps("displayOrder")}
            />
          </Grid.Col>

          {/* NOMNI KIRITISH (4 TA TILDA) */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t("topics.nameLatin")}
              withAsterisk
              {...form.getInputProps("nameUzl")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t("topics.nameCyrillic")}
              {...form.getInputProps("nameUzc")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t("topics.nameRussian")}
              {...form.getInputProps("nameRu")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label={t("topics.nameEnglish")}
              {...form.getInputProps("nameEn")}
            />
          </Grid.Col>

          {/* TAVSIFLAR (4 TA TILDA) */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("topics.descLatin")}
              minRows={3}
              resize="vertical"
              {...form.getInputProps("descriptionUzl")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("topics.descCyrillic")}
              minRows={3}
              resize="vertical"
              {...form.getInputProps("descriptionUzc")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("topics.descRussian")}
              minRows={3}
              resize="vertical"
              {...form.getInputProps("descriptionRu")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("topics.descEnglish")}
              minRows={3}
              resize="vertical"
              {...form.getInputProps("descriptionEn")}
            />
          </Grid.Col>

          {/* ICON YUKLASH QISMI */}
          <Grid.Col span={12}>
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                {t("topics.iconLabel")}
              </Text>
              <Group align="center" gap="lg">
                <Box>
                  <FileButton
                    onChange={uploadIcon}
                    accept="image/png,image/jpeg,image/svg+xml"
                  >
                    {(props) => (
                      <Button
                        {...props}
                        variant="outline"
                        leftSection={<IconUpload size={16} />}
                      >
                        {t("topics.selectImage")}
                      </Button>
                    )}
                  </FileButton>
                </Box>

                {form.values.iconUrl ? (
                  <Paper
                    withBorder
                    p="xs"
                    radius="md"
                    style={{ backgroundColor: "#f8f9fa" }}
                  >
                    <Group gap="sm">
                      <Image
                        src={form.values.iconUrl}
                        h={40}
                        w={40}
                        fit="contain"
                      />
                      <Text size="xs" c="dimmed">
                        {t("topics.uploadedIcon")}
                      </Text>
                    </Group>
                  </Paper>
                ) : (
                  <Text size="xs" c="dimmed italic">
                    {t("topics.noIcon")}
                  </Text>
                )}
              </Group>
            </Stack>
          </Grid.Col>

          {/* SAQLASH VA HOLAT */}
          <Grid.Col span={12}>
            <Divider mt="md" mb="lg" />
            <Group justify="space-between">
              <Checkbox
                label={t("topics.isActive")}
                size="md"
                {...form.getInputProps("isActive", { type: "checkbox" })}
              />
              <Button
                type="submit"
                size="md"
                px="xl"
                leftSection={<IconDeviceFloppy size={22} />}
              >
                {t("topics.saveTopic")}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Paper>
  );
};
