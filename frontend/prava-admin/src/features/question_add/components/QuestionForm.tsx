import {
  TextInput,
  Select,
  Checkbox,
  Button,
  Grid,
  Textarea,
  Paper,
  Text,
  Divider,
  Stack,
  Group,
  ActionIcon,
  Radio,
  Image,
  FileButton, // Fayl yuklash uchun
} from "@mantine/core";
import {
  IconTrash,
  IconPlus,
  IconDeviceFloppy,
  IconUpload, // Yuklash belgisi
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAddQuestionForm } from "../hooks/useAddQuestionForm";
import { useTopicSelect } from "../hooks/useTopicSelect";

export const QuestionForm = () => {
  const { t } = useTranslation();
  // uploadFile funksiyasini hookdan qabul qilamiz
  const { form, addOption, removeOption, handleSubmit, uploadFile } =
    useAddQuestionForm();
  const { topicOptions, isLoading: isTopicsLoading } = useTopicSelect();

  return (
    <Paper p="lg" radius="md" withBorder>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Grid gutter="md">
          {/* --- SAVOL MATNLARI --- */}
          <Grid.Col span={12}>
            <Text fw={550} size="md">
              {t("questions.questionTexts")}
            </Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textLatin")}
              {...form.getInputProps("textUzl")}
              resize="vertical"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textCyrillic")}
              {...form.getInputProps("textUzc")}
              resize="vertical"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textRussian")}
              {...form.getInputProps("textRu")}
              resize="vertical"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textEnglish")}
              {...form.getInputProps("textEn")}
              resize="vertical"
            />
          </Grid.Col>

          {/* --- TUSHUNTIRISH MATNLARI --- */}
          <Grid.Col span={12} mt="sm">
            <Text fw={550} size="md">
              {t("questions.explanationTexts")}
            </Text>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textLatin")}
              {...form.getInputProps("explanationUzl")}
              resize="vertical"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textCyrillic")}
              resize="vertical"
              {...form.getInputProps("explanationUzc")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textRussian")}
              resize="vertical"
              {...form.getInputProps("explanationRu")}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Textarea
              label={t("questions.textEnglish")}
              resize="vertical"
              {...form.getInputProps("explanationEn")}
            />
          </Grid.Col>
          <Grid.Col span={12} mt="sm">
            <Text fw={550} size="md">
              {t("questions.settingsSection")}
            </Text>
          </Grid.Col>
          {/* --- SOZLAMALAR --- */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              data={topicOptions}
              label={t("questions.topicId")}
              searchable
              disabled={isTopicsLoading}
              {...form.getInputProps("topicId")}
              onChange={(value) =>
                form.setFieldValue("topicId", value ? parseInt(value) : null)
              }
              value={form.values.topicId?.toString() ?? null}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label={t("questions.difficulty")}
              data={["EASY", "MEDIUM", "HARD"]}
              {...form.getInputProps("difficulty")}
            />
          </Grid.Col>

          {/* --- RASM BO'LIMI --- */}
          <Grid.Col span={12}>
            <Group align="flex-end" mb="xs">
              <TextInput
                label={t("questions.imageUrl")}
                placeholder="https://..."
                style={{ flex: 1 }}
                {...form.getInputProps("imageUrl")}
              />
              {/* FILE UPLOAD TUGMASI */}
              <FileButton
                onChange={uploadFile}
                accept="image/png,image/jpeg,image/webp"
              >
                {(props) => (
                  <Button
                    {...props}
                    variant="light"
                    leftSection={<IconUpload size={16} />}
                  >
                    {t("questions.uploadImage")}
                  </Button>
                )}
              </FileButton>
            </Group>

            {/* --- RASM PREVIEW QISMI --- */}
            {form.values.imageUrl && (
              <Paper
                withBorder
                mt="sm"
                p="xs"
                radius="md"
                style={{ display: "inline-block", position: "relative" }}
              >
                <Image
                  src={form.values.imageUrl}
                  h={180}
                  w="auto"
                  fit="contain"
                  radius="md"
                  fallbackSrc="https://placehold.co/600x400?text=No+image"
                />
                <ActionIcon
                  variant="filled"
                  color="red"
                  size="sm"
                  style={{ position: "absolute", top: 5, right: 5 }}
                  onClick={() => form.setFieldValue("imageUrl", "")}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Paper>
            )}
          </Grid.Col>

          {/* --- VARIANTLAR SECTION --- */}
          <Grid.Col span={12} mt="xl">
            <Group justify="space-between" mb="md">
              <Stack gap={0}>
                <Text fw={550} size="md">
                  {t("questions.answerOptions", { count: form.values.options.length })}
                </Text>
                <Text size="xs" c="dimmed">
                  {t("questions.answerHint")}
                </Text>
              </Stack>
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={addOption}
                disabled={form.values.options.length >= 6}
              >
                {t("questions.addOption")}
              </Button>
            </Group>

            <Radio.Group
              value={form.values.correctAnswerIndex.toString()}
              onChange={(val) =>
                form.setFieldValue("correctAnswerIndex", parseInt(val))
              }
            >
              <Grid gutter="xl">
                {form.values.options.map((_, index) => (
                  <Grid.Col span={12} key={index}>
                    <Paper
                      withBorder
                      p="md"
                      radius="md"
                      // bg={
                      //   form.values.correctAnswerIndex === index
                      //     ? "blue.0"
                      //     : "var(--mantine-color-gray-0)"
                      // }
                    >
                      <Group justify="space-between" mb="sm">
                        <Group>
                          <Radio
                            value={index.toString()}
                            label={<Text fw={600}>{t("questions.variant", { n: index + 1 })}</Text>}
                          />
                          {form.values.correctAnswerIndex === index && (
                            <Text size="xs" c="blue" fw={700}>
                              {t("questions.correctAnswer")}
                            </Text>
                          )}
                        </Group>

                        {form.values.options.length > 2 && (
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => removeOption(index)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>

                      <Grid gutter="xs">
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Textarea
                            resize="vertical"
                            label={t("questions.textLatin")}
                            {...form.getInputProps(`options.${index}.textUzl`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Textarea
                            resize="vertical"
                            label={t("questions.textCyrillic")}
                            {...form.getInputProps(`options.${index}.textUzc`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Textarea
                            resize="vertical"
                            label={t("questions.textRussian")}
                            {...form.getInputProps(`options.${index}.textRu`)}
                          />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                          <Textarea
                            resize="vertical"
                            label={t("questions.textEnglish")}
                            {...form.getInputProps(`options.${index}.textEn`)}
                          />
                        </Grid.Col>
                      </Grid>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            </Radio.Group>
          </Grid.Col>

          {/* --- STATUS VA SAQLASH --- */}
          <Grid.Col span={12} mt="xl">
            <Divider mb="lg" />
            <Group justify="space-between">
              <Checkbox
                label={t("questions.showActive")}
                {...form.getInputProps("isActive", { type: "checkbox" })}
              />
              <Button
                type="submit"
                size="md"
                px="xl"
                leftSection={<IconDeviceFloppy size={20} />}
              >
                {t("questions.saveQuestion")}
              </Button>
            </Group>
          </Grid.Col>
        </Grid>
      </form>
    </Paper>
  );
};
