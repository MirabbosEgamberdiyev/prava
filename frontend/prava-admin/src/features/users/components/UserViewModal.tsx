import { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  Group,
  Avatar,
  Text,
  Badge,
  Divider,
  SimpleGrid,
  Paper,
  Button,
  NumberInput,
} from "@mantine/core";
import { IconDevices, IconRefresh } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { formatDate } from "../../../utils/formatDate";
import { useAuth } from "../../../hooks/auth/AuthContext";
import api from "../../../services/api";
import type { User } from "../types";
import { useTranslation } from "react-i18next";

interface UserViewModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserViewModal = ({ opened, onClose, user }: UserViewModalProps) => {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const [deviceLimit, setDeviceLimit] = useState<number>(user?.maxDevices || 4);
  const [deviceLoading, setDeviceLoading] = useState(false);

  useEffect(() => {
    if (user?.maxDevices) {
      setDeviceLimit(user.maxDevices);
    }
  }, [user?.maxDevices]);

  if (!user) return null;

  const handleSetDeviceLimit = async () => {
    setDeviceLoading(true);
    try {
      await api.post("/api/v2/admin/statistics/device-limit", {
        userId: user.id,
        maxDevices: deviceLimit,
      });
      notifications.show({ title: t("common.success"), message: t("users.deviceLimitChanged"), color: "green" });
    } catch {
      notifications.show({ title: t("common.error"), message: t("users.deviceLimitError"), color: "red" });
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleResetDevices = async () => {
    setDeviceLoading(true);
    try {
      await api.post(`/api/v2/admin/statistics/device-limit/${user.id}/reset`);
      notifications.show({ title: t("common.success"), message: t("users.sessionsReset"), color: "green" });
    } catch {
      notifications.show({ title: t("common.error"), message: t("users.sessionsResetError"), color: "red" });
    } finally {
      setDeviceLoading(false);
    }
  };

  const handleResetToGlobal = async () => {
    setDeviceLoading(true);
    try {
      await api.post(`/api/v2/admin/statistics/device-limit/${user.id}/reset-to-global?globalLimit=${deviceLimit}`);
      notifications.show({ title: t("common.success"), message: t("users.resetToGlobalSuccess"), color: "green" });
    } catch {
      notifications.show({ title: t("common.error"), message: t("users.resetToGlobalError"), color: "red" });
    } finally {
      setDeviceLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("users.userInfo")} size="lg">
      <Stack gap="md">
        <Group>
          <Avatar src={user.profileImageUrl} size={64} radius="xl" color="blue">
            {user.firstName?.charAt(0)}
          </Avatar>
          <div>
            <Text size="lg" fw={600}>{user.fullName}</Text>
            <Group gap="xs">
              <Badge color={user.role === "SUPER_ADMIN" ? "red" : user.role === "ADMIN" ? "blue" : "gray"} variant="light">
                {user.role}
              </Badge>
              <Badge color={user.isActive ? "green" : "red"} variant="light">
                {user.isActive ? t("common.active") : t("common.blocked")}
              </Badge>
              {user.oauthProvider !== "LOCAL" && (
                <Badge color="cyan" variant="dot">{user.oauthProvider}</Badge>
              )}
            </Group>
          </div>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.phone")}</Text>
            <Text size="sm" fw={500}>{user.phoneNumber || "-"}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.email")}</Text>
            <Text size="sm" fw={500}>{user.email || "-"}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.language")}</Text>
            <Text size="sm" fw={500}>{user.preferredLanguage || "-"}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.telegram")}</Text>
            <Text size="sm" fw={500}>{user.telegramUsername ? `@${user.telegramUsername}` : "-"}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.devices")}</Text>
            <Text size="sm" fw={500}>{user.activeDeviceCount} / {user.maxDevices}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.lastLogin")}</Text>
            <Text size="sm" fw={500}>{user.lastLoginAt ? formatDate(user.lastLoginAt) : "-"}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.registered")}</Text>
            <Text size="sm" fw={500}>{formatDate(user.createdAt)}</Text>
          </Paper>
          <Paper withBorder p="sm" radius="sm">
            <Text size="xs" c="dimmed">{t("users.verification")}</Text>
            <Group gap={4}>
              <Badge size="xs" color={user.isPhoneVerified ? "green" : "gray"}>
                {t("users.phoneVerified")} {user.isPhoneVerified ? "✓" : "✗"}
              </Badge>
              <Badge size="xs" color={user.isEmailVerified ? "green" : "gray"}>
                {t("users.emailVerified")} {user.isEmailVerified ? "✓" : "✗"}
              </Badge>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Device management */}
        {isSuperAdmin && (
          <>
            <Divider label={t("users.deviceManagement")} labelPosition="center" />
            <Paper withBorder p="md" radius="md">
              <Group gap="sm" align="flex-end" wrap="wrap">
                <IconDevices size={20} />
                <NumberInput
                  label={t("users.deviceLimit")}
                  value={deviceLimit}
                  onChange={(v) => setDeviceLimit(typeof v === "number" ? v : deviceLimit)}
                  min={1}
                  max={10}
                  w={120}
                />
                <Button size="sm" loading={deviceLoading} onClick={handleSetDeviceLimit}>
                  {t("users.changeLimitBtn")}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="orange"
                  leftSection={<IconRefresh size={16} />}
                  loading={deviceLoading}
                  onClick={handleResetDevices}
                >
                  {t("users.resetSessions")}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="grape"
                  loading={deviceLoading}
                  onClick={handleResetToGlobal}
                >
                  {t("users.resetToGlobal")}
                </Button>
              </Group>
            </Paper>
          </>
        )}
      </Stack>
    </Modal>
  );
};
