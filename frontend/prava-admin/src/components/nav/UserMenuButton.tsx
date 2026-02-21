import {
  IconChevronDown,
  IconLogout,
  IconSettings,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import {
  Group,
  Avatar,
  Text,
  Menu,
  UnstyledButton,
  Box,
} from "@mantine/core";
import { useAuth } from "../../hooks/auth/AuthContext";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

function UserMenuButton() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    notifications.show({
      title: t("userMenu.logoutTitle"),
      message: t("userMenu.logoutMessage"),
      color: "yellow",
    });
    logout();
  };

  const fullName = user?.fullName || t("userMenu.user");
  const contact = user?.phoneNumber || user?.email || "";
  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() || "A";

  return (
    <Menu shadow="md" width={200} withArrow position="bottom-end">
      <Menu.Target>
        <UnstyledButton
          aria-label={t("userMenu.application")}
          style={{
            padding: "4px 8px",
            borderRadius: "var(--mantine-radius-md)",
            color: "var(--mantine-color-text)",
            transition: "background-color 150ms ease",
          }}
        >
          <Group gap={8} wrap="nowrap">
            <Avatar
              size={36}
              radius="md"
              color="blue"
              style={{ flexShrink: 0 }}
            >
              {initials}
            </Avatar>

            <Box
              visibleFrom="sm"
              style={{
                overflow: "hidden",
                maxWidth: 140,
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              <Text
                size="sm"
                fw={600}
                truncate="end"
                lh={1.3}
              >
                {fullName}
              </Text>
              {contact && (
                <Text
                  size="xs"
                  c="dimmed"
                  truncate="end"
                  lh={1.3}
                >
                  {contact}
                </Text>
              )}
            </Box>

            <IconChevronDown
              size={14}
              style={{ flexShrink: 0, opacity: 0.6 }}
            />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>{t("userMenu.application")}</Menu.Label>
        <Menu.Item
          leftSection={<IconLayoutDashboard size={14} />}
          onClick={() => navigate("/")}
        >
          {t("nav.home")}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSettings size={14} />}
          onClick={() => navigate("/settings")}
        >
          {t("userMenu.settings")}
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          onClick={handleLogout}
          leftSection={<IconLogout size={14} />}
        >
          {t("userMenu.logout")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default UserMenuButton;
