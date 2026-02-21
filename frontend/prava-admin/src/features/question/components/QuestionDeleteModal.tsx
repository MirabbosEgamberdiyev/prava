import { Modal, Stack, Alert, Text, Paper, Group, Button } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useQuestionMutations } from "../hooks/useQuestionMutations";

interface QuestionDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  questionId: number | null;
  onSuccess?: () => void;
}

export const QuestionDeleteModal = ({
  opened,
  onClose,
  questionId,
  onSuccess,
}: QuestionDeleteModalProps) => {
  const { t } = useTranslation();
  const { deleteQuestion } = useQuestionMutations();

  const handleDeleteConfirm = async () => {
    if (!questionId) return;

    try {
      await deleteQuestion(questionId);
      onClose();
      onSuccess?.();
    } catch {
      // Error notification handled in useQuestionMutations hook
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("questions.deleteTitle")} centered>
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size={20} />}
          title={t("common.warning")}
          color="red"
          variant="light"
        >
          {t("common.irreversibleAction")}
        </Alert>

        <Text>{t("questions.deleteConfirm")}</Text>

        {questionId && (
          <Paper p="md" bg="gray.0" radius="md" withBorder>
            <Text size="sm" fw={500}>
              ID: {questionId}
            </Text>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="light" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            color="red"
            onClick={handleDeleteConfirm}
            leftSection={<IconAlertTriangle size={18} />}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
