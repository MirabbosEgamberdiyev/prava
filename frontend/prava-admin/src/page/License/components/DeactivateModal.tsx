import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Text, Stack, Alert, Box, Code, Textarea, Group, Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconBan } from "@tabler/icons-react";
import { useLicenseMutations } from "../../../features/license/hooks/useLicenseMutations";
import type { ActivationCodeResponse } from "../../../features/license/types";

export function DeactivateModal({
  code,
  onClose,
  onSuccess,
}: {
  code: ActivationCodeResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { deactivate, handleError } = useLicenseMutations();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  if (!code) return null;

  /**
   * Ilgari `notes` faqat state'da qolib ketardi: bitta kod uchun izoh yozib,
   * "Bekor qilish" bosilsa, keyingi ochilgan boshqa kodga o'sha izoh
   * bog'lanib ketishi mumkin edi.
   */
  const handleClose = () => {
    setNotes("");
    onClose();
  };

  const handleDeactivate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await deactivate(code.id, notes.trim() || undefined);
      onSuccess();
      notifications.show({
        title:   t("license.notifications.deactivateSuccess"),
        message: t("license.notifications.deactivateSuccessMsg"),
        color:   "orange",
      });
      handleClose();
    } catch (e) {
      handleError(e, t("license.notifications.deactivateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={!!code}
      onClose={handleClose}
      title={<Text fw={700} size="lg" c="orange">{t("license.deactivate.title")}</Text>}
      size="md"
      radius="md"
    >
      <Stack gap="md">
        <Alert icon={<IconAlertTriangle size={16} />} color="orange">
          {t("license.deactivate.confirm", {
            computer: code.computerName ?? code.machineId,
          })}
        </Alert>

        <Box>
          <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
          <Code fz="xs">{code.machineId}</Code>
        </Box>

        <Textarea
          label={t("license.deactivate.notesLabel")}
          placeholder={t("license.deactivate.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          rows={3}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button color="orange" loading={loading} onClick={handleDeactivate} leftSection={<IconBan size={16} />}>
            {t("license.deactivate.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
