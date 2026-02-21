/* eslint-disable @typescript-eslint/no-explicit-any */
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";

export const useDeleteTopic = (onSuccess: () => void) => {
  const { t } = useTranslation();

  const deleteTopic = async (id: number) => {
    try {
      await api.delete(`/api/v1/admin/topics/${id}`);
      notifications.show({
        title: t("common.success"),
        message: t("topics.deleteSuccess"),
        color: "green",
      });
      onSuccess();
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("topics.deleteError"),
        color: "red",
      });
    }
  };

  const confirmDelete = (id: number, name: string) => {
    modals.openConfirmModal({
      title: t("topics.deleteTitle"),
      centered: true,
      children: (
        <Text size="sm">
          {t("topics.deleteConfirm", { name })}
        </Text>
      ),
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: () => deleteTopic(id),
    });
  };

  return { confirmDelete };
};
