import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, Stack, Alert, TextInput, SimpleGrid, Textarea, Group, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle, IconBuilding } from "@tabler/icons-react";
import learningCenterService from "../../../services/learningCenterService";
import type { LearningCenterResponse, LearningCenterRequest } from "../../../features/learningCenter/types";

export function LearningCenterFormModal({
  opened,
  editing,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  editing: LearningCenterResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<LearningCenterRequest>({
    initialValues: editing
      ? {
          name:          editing.name,
          address:       editing.address       ?? "",
          phone:         editing.phone         ?? "",
          contactPerson: editing.contactPerson ?? "",
          email:         editing.email         ?? "",
          notes:         editing.notes         ?? "",
        }
      : { name: "", address: "", phone: "", contactPerson: "", email: "", notes: "" },
    validate: {
      name:  (v) => !v.trim() ? t("lc.validation.nameRequired") : null,
      email: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t("lc.validation.emailInvalid") : null,
    },
  });

  const handleClose = () => { form.reset(); onClose(); };

  const handleSubmit = async (values: LearningCenterRequest) => {
    setLoading(true);
    try {
      const req: LearningCenterRequest = {
        name:          values.name.trim(),
        address:       values.address?.trim()       || undefined,
        phone:         values.phone?.trim()         || undefined,
        contactPerson: values.contactPerson?.trim() || undefined,
        email:         values.email?.trim()         || undefined,
        notes:         values.notes?.trim()         || undefined,
      };
      if (editing) {
        await learningCenterService.update(editing.id, req);
        notifications.show({ title: t("lc.notifications.updateSuccess"), message: req.name, color: "green" });
      } else {
        await learningCenterService.create(req);
        notifications.show({ title: t("lc.notifications.createSuccess"), message: req.name, color: "green" });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? t("common.serverError");
      notifications.show({ title: t("common.error"), message: msg, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">{editing ? t("lc.form.editTitle") : t("lc.form.createTitle")}</Text>}
      size="lg"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light">
            {t("lc.form.info")}
          </Alert>

          <TextInput label={t("lc.form.name")} placeholder={t("lc.form.namePlaceholder")} required {...form.getInputProps("name")} />
          <TextInput label={t("lc.form.address")} placeholder={t("lc.form.optional")} {...form.getInputProps("address")} />

          <SimpleGrid cols={2} spacing="sm">
            <TextInput label={t("lc.form.phone")} placeholder={t("lc.form.optional")} {...form.getInputProps("phone")} />
            <TextInput label={t("lc.form.contactPerson")} placeholder={t("lc.form.optional")} {...form.getInputProps("contactPerson")} />
          </SimpleGrid>

          <TextInput label={t("lc.form.email")} placeholder={t("lc.form.optional")} type="email" {...form.getInputProps("email")} />
          <Textarea label={t("lc.form.notes")} placeholder={t("lc.form.optional")} rows={2} {...form.getInputProps("notes")} />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" loading={loading} leftSection={<IconBuilding size={16} />}>
              {editing ? t("common.save") : t("lc.form.createBtn")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
