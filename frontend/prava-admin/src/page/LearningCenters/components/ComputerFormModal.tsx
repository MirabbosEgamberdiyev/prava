import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, Stack, TextInput, SimpleGrid, Textarea, Group, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconDeviceDesktop } from "@tabler/icons-react";
import computerService from "../../../services/computerService";
import type { ComputerResponse, ComputerRequest } from "../../../features/computer/types";

export function ComputerFormModal({
  opened,
  editing,
  lcId,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  editing: ComputerResponse | null;
  lcId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm<ComputerRequest>({
    initialValues: editing
      ? {
          name:             editing.name,
          machineId:        editing.machineId,
          macAddress:       editing.macAddress  ?? "",
          deviceId:         editing.deviceId    ?? "",
          learningCenterId: editing.learningCenterId,
          notes:            editing.notes        ?? "",
        }
      : {
          name:             "",
          machineId:        "",
          macAddress:       "",
          deviceId:         "",
          learningCenterId: lcId,
          notes:            "",
        },
    validate: {
      name:             (v) => !v.trim() ? t("computer.validation.nameRequired") : null,
      machineId:        (v) =>
        !v.trim() ? t("computer.validation.machineIdRequired") :
        v.trim().length < 4 ? t("computer.validation.machineIdMin") : null,
      learningCenterId: (v) => !v ? t("computer.validation.learningCenterRequired") : null,
    },
  });

  const handleClose = () => { form.reset(); onClose(); };

  const handleSubmit = async (values: ComputerRequest) => {
    setLoading(true);
    try {
      const req: ComputerRequest = {
        name:             values.name.trim(),
        machineId:        values.machineId.trim(),
        macAddress:       values.macAddress?.trim()  || undefined,
        deviceId:         values.deviceId?.trim()    || undefined,
        learningCenterId: lcId,
        notes:            values.notes?.trim()       || undefined,
      };
      if (editing) {
        await computerService.update(editing.id, req);
        notifications.show({ title: t("computer.notifications.updateSuccess"), message: req.name, color: "green" });
      } else {
        await computerService.create(req);
        notifications.show({ title: t("computer.notifications.createSuccess"), message: req.name, color: "green" });
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
      title={<Text fw={700} size="lg">{editing ? t("computer.form.editTitle") : t("computer.form.createTitle")}</Text>}
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label={t("computer.form.name")}
            placeholder={t("computer.form.namePlaceholder")}
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label={t("computer.form.machineId")}
            placeholder={t("computer.form.machineIdPlaceholder")}
            required
            {...form.getInputProps("machineId")}
          />
          <SimpleGrid cols={2} spacing="sm">
            <TextInput
              label={t("computer.form.macAddress")}
              placeholder={t("computer.form.macAddressPlaceholder")}
              {...form.getInputProps("macAddress")}
            />
            <TextInput
              label={t("computer.form.deviceId")}
              placeholder={t("computer.form.deviceIdPlaceholder")}
              {...form.getInputProps("deviceId")}
            />
          </SimpleGrid>
          <Textarea
            label={t("computer.form.notes")}
            placeholder={t("computer.form.optional")}
            rows={2}
            {...form.getInputProps("notes")}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
            <Button type="submit" loading={loading} leftSection={<IconDeviceDesktop size={16} />}>
              {editing ? t("common.save") : t("computer.form.createBtn")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
