import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Paper,
  Grid,
  Textarea,
  Select,
  TextInput,
  Checkbox,
  Button,
  Text,
  Stack,
  Group,
  ActionIcon,
  Radio,
  Image,
  FileButton,
  Divider,
  Center,
  Loader,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconTrash,
  IconPlus,
  IconDeviceFloppy,
  IconUpload,
  IconArrowLeft,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useQuestionDetail } from "../../../features/question/hooks/useQuestionDetail";
import { useTopicSelect } from "../../../features/question_add/hooks/useTopicSelect";
import api from "../../../services/api";

const Edit_Question_Page = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const questionId = id ? parseInt(id) : null;
  const { question, isLoading } = useQuestionDetail(questionId);
  const { topicOptions, isLoading: isTopicsLoading } = useTopicSelect();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      textUzl: "",
      textUzc: "",
      textEn: "",
      textRu: "",
      explanationUzl: "",
      explanationUzc: "",
      explanationEn: "",
      explanationRu: "",
      topicId: null as number | null,
      difficulty: "MEDIUM",
      options: [
        { optionIndex: 0, textUzl: "", textUzc: "", textEn: "", textRu: "" },
        { optionIndex: 1, textUzl: "", textUzc: "", textEn: "", textRu: "" },
      ],
      correctAnswerIndex: 0,
      imageUrl: "",
      isActive: true,
    },
    validate: {
      textUzl: (value) => (!value?.trim() ? t("validation.questionRequired") : null),
      topicId: (value) => (!value ? t("validation.topicIdRequired") : null),
    },
  });

  // Backend'dan kelgan ma'lumotlarni formaga yuklash (barcha 4 til)
  useEffect(() => {
    if (question) {
      form.setValues({
        textUzl: question.textUzl || "",
        textUzc: question.textUzc || "",
        textEn: question.textEn || "",
        textRu: question.textRu || "",
        explanationUzl: question.explanationUzl || "",
        explanationUzc: question.explanationUzc || "",
        explanationEn: question.explanationEn || "",
        explanationRu: question.explanationRu || "",
        topicId: question.topicId || null,
        difficulty: question.difficulty || "MEDIUM",
        options:
          question.options?.map((opt, idx) => ({
            optionIndex: idx,
            textUzl: opt.textUzl || "",
            textUzc: opt.textUzc || "",
            textEn: opt.textEn || "",
            textRu: opt.textRu || "",
          })) || [],
        correctAnswerIndex: question.correctAnswerIndex || 0,
        imageUrl: question.imageUrl || "",
        isActive: question.isActive ?? true,
      });
    }
  }, [question]);

  const uploadFile = async (file: File | null) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/api/v1/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploadedUrl = res.data.data?.fileUrl || res.data;
      if (uploadedUrl) {
        form.setFieldValue("imageUrl", uploadedUrl);
        notifications.show({ title: t("common.success"), message: t("questions.imageUploaded"), color: "green" });
      }
    } catch {
      notifications.show({ title: t("common.error"), message: t("questions.imageUploadError"), color: "red" });
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!questionId) return;
    setSubmitting(true);
    try {
      const options = values.options
        .filter((opt) => opt.textUzl?.trim())
        .map((opt, idx) => ({
          optionIndex: idx,
          textUzl: opt.textUzl || null,
          textUzc: opt.textUzc || null,
          textEn: opt.textEn || null,
          textRu: opt.textRu || null,
        }));

      const payload = {
        textUzl: values.textUzl || null,
        textUzc: values.textUzc || null,
        textEn: values.textEn || null,
        textRu: values.textRu || null,
        explanationUzl: values.explanationUzl || null,
        explanationUzc: values.explanationUzc || null,
        explanationEn: values.explanationEn || null,
        explanationRu: values.explanationRu || null,
        topicId: values.topicId || null,
        difficulty: values.difficulty || null,
        options: options.length > 0 ? options : null,
        correctAnswerIndex: options.length > 0 ? values.correctAnswerIndex : null,
        imageUrl: values.imageUrl && values.imageUrl.trim() !== "" ? values.imageUrl : null,
        isActive: values.isActive,
      };

      await api.put(`/api/v1/admin/questions/${questionId}`, payload);
      notifications.show({
        title: t("common.success"),
        message: t("questions.updateSuccess"),
        color: "green",
      });
      navigate("/questions");
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("questions.updateError"),
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addOption = () => {
    if (form.values.options.length < 6) {
      form.insertListItem("options", {
        optionIndex: form.values.options.length,
        textUzl: "",
        textUzc: "",
        textEn: "",
        textRu: "",
      });
    }
  };

  const removeOption = (index: number) => {
    if (form.values.options.length > 2) {
      form.removeListItem("options", index);
      if (form.values.correctAnswerIndex === index) {
        form.setFieldValue("correctAnswerIndex", 0);
      } else if (form.values.correctAnswerIndex > index) {
        form.setFieldValue("correctAnswerIndex", form.values.correctAnswerIndex - 1);
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!questionId) return;
    try {
      await api.delete(`/api/v1/admin/questions/${questionId}/image`);
      form.setFieldValue("imageUrl", "");
      notifications.show({ title: t("common.success"), message: t("questions.imageDeleted"), color: "green" });
    } catch {
      notifications.show({ title: t("common.error"), message: t("questions.imageDeleteError"), color: "red" });
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader type="bars" />
      </Center>
    );
  }

  if (!question) {
    return (
      <Center h={400}>
        <Text c="dimmed">{t("questions.questionNotFound")}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <ActionIcon variant="light" onClick={() => navigate("/questions")}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <Title order={3}>{t("questions.editTitle", { id: questionId })}</Title>
      </Group>

      <Paper p="lg" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid gutter="md">
            <Grid.Col span={12}>
              <Text fw={550} size="md">{t("questions.questionTexts")}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textLatin")} {...form.getInputProps("textUzl")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textCyrillic")} {...form.getInputProps("textUzc")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textRussian")} {...form.getInputProps("textRu")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textEnglish")} {...form.getInputProps("textEn")} resize="vertical" />
            </Grid.Col>

            <Grid.Col span={12} mt="sm">
              <Text fw={550} size="md">{t("questions.explanationTexts")}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textLatin")} {...form.getInputProps("explanationUzl")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textCyrillic")} {...form.getInputProps("explanationUzc")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textRussian")} {...form.getInputProps("explanationRu")} resize="vertical" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Textarea label={t("questions.textEnglish")} {...form.getInputProps("explanationEn")} resize="vertical" />
            </Grid.Col>

            <Grid.Col span={12} mt="sm">
              <Text fw={550} size="md">{t("questions.settingsSection")}</Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                data={topicOptions}
                label={t("questions.topicLabel")}
                searchable
                disabled={isTopicsLoading}
                {...form.getInputProps("topicId")}
                onChange={(value) => form.setFieldValue("topicId", value ? parseInt(value) : null)}
                value={form.values.topicId?.toString() ?? null}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select label={t("questions.difficulty")} data={["EASY", "MEDIUM", "HARD"]} {...form.getInputProps("difficulty")} />
            </Grid.Col>

            {/* Rasm */}
            <Grid.Col span={12}>
              <Group align="flex-end" mb="xs">
                <TextInput
                  label={t("questions.imageUrl")}
                  placeholder="https://..."
                  style={{ flex: 1 }}
                  {...form.getInputProps("imageUrl")}
                />
                <FileButton onChange={uploadFile} accept="image/png,image/jpeg,image/webp">
                  {(props) => (
                    <Button {...props} variant="light" leftSection={<IconUpload size={16} />}>
                      {t("questions.uploadImage")}
                    </Button>
                  )}
                </FileButton>
              </Group>
              {form.values.imageUrl && (
                <Paper withBorder mt="sm" p="xs" radius="md" style={{ display: "inline-block", position: "relative" }}>
                  <Image src={form.values.imageUrl} h={180} w="auto" fit="contain" radius="md" />
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="sm"
                    style={{ position: "absolute", top: 5, right: 5 }}
                    onClick={handleDeleteImage}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Paper>
              )}
            </Grid.Col>

            {/* Variantlar */}
            <Grid.Col span={12} mt="xl">
              <Group justify="space-between" mb="md">
                <Stack gap={0}>
                  <Text fw={550} size="md">{t("questions.answerOptions", { count: form.values.options.length })}</Text>
                  <Text size="xs" c="dimmed">{t("questions.answerHint")}</Text>
                </Stack>
                <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addOption} disabled={form.values.options.length >= 6}>
                  {t("questions.addOption")}
                </Button>
              </Group>

              <Radio.Group
                value={form.values.correctAnswerIndex.toString()}
                onChange={(val) => form.setFieldValue("correctAnswerIndex", parseInt(val))}
              >
                <Grid gutter="xl">
                  {form.values.options.map((_, index) => (
                    <Grid.Col span={12} key={index}>
                      <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" mb="sm">
                          <Group>
                            <Radio value={index.toString()} label={<Text fw={600}>{t("questions.variant", { n: index + 1 })}</Text>} />
                            {form.values.correctAnswerIndex === index && (
                              <Text size="xs" c="blue" fw={700}>{t("questions.correctAnswer")}</Text>
                            )}
                          </Group>
                          {form.values.options.length > 2 && (
                            <ActionIcon color="red" variant="light" onClick={() => removeOption(index)}>
                              <IconTrash size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                        <Grid gutter="xs">
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Textarea resize="vertical" label={t("questions.textLatin")} {...form.getInputProps(`options.${index}.textUzl`)} />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Textarea resize="vertical" label={t("questions.textCyrillic")} {...form.getInputProps(`options.${index}.textUzc`)} />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Textarea resize="vertical" label={t("questions.textRussian")} {...form.getInputProps(`options.${index}.textRu`)} />
                          </Grid.Col>
                          <Grid.Col span={{ base: 12, md: 6 }}>
                            <Textarea resize="vertical" label={t("questions.textEnglish")} {...form.getInputProps(`options.${index}.textEn`)} />
                          </Grid.Col>
                        </Grid>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>
              </Radio.Group>
            </Grid.Col>

            <Grid.Col span={12} mt="xl">
              <Divider mb="lg" />
              <Group justify="space-between">
                <Checkbox label={t("questions.showActive")} {...form.getInputProps("isActive", { type: "checkbox" })} />
                <Button type="submit" size="md" px="xl" loading={submitting} leftSection={<IconDeviceFloppy size={20} />}>
                  {t("common.save")}
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Paper>
    </Stack>
  );
};

export default Edit_Question_Page;
