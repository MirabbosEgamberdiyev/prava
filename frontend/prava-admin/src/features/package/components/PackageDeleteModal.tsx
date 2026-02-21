// features/package/components/PackageDeleteModal.tsx

import { Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import i18n from "../../../utils/i18n";

export function openDeleteConfirmModal(
  packageName: string,
  onConfirm: () => void,
) {
  modals.openConfirmModal({
    title: i18n.t("packages.deleteTitle"),
    children: (
      <Text size="sm">
        {i18n.t("packages.deleteConfirm", { name: packageName })}
      </Text>
    ),
    labels: { confirm: i18n.t("packages.deleteButton"), cancel: i18n.t("packages.cancelButton") },
    confirmProps: { color: "red" },
    onConfirm,
  });
}

export function openToggleConfirmModal(
  packageName: string,
  isActive: boolean,
  onConfirm: () => void,
) {
  modals.openConfirmModal({
    title: isActive ? i18n.t("packages.deactivateTitle", { name: packageName }) : i18n.t("packages.activateTitle", { name: packageName }),
    children: (
      <Text size="sm">
        {isActive
          ? i18n.t("packages.deactivateConfirm", { name: packageName })
          : i18n.t("packages.activateConfirm", { name: packageName })}
      </Text>
    ),
    labels: { confirm: i18n.t("packages.yes"), cancel: i18n.t("packages.no") },
    confirmProps: { color: isActive ? "orange" : "green" },
    onConfirm,
  });
}

export function openRegenerateConfirmModal(
  packageName: string,
  onConfirm: () => void,
) {
  modals.openConfirmModal({
    title: i18n.t("packages.regenerateTitle"),
    children: (
      <Text size="sm">
        {i18n.t("packages.regenerateConfirm", { name: packageName })}
      </Text>
    ),
    labels: { confirm: i18n.t("packages.regenerateButton"), cancel: i18n.t("packages.cancelButton") },
    confirmProps: { color: "grape" },
    onConfirm,
  });
}
