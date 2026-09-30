import {
  IconLogout,
  IconSettings,
  IconUser,
  IconHistory,
  IconTrophy,
} from "@tabler/icons-react";
import { Group, Avatar, Text, Menu, UnstyledButton, Box } from "@mantine/core";
import { useAuth } from "../../auth/AuthContext";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { getWebAppUrl, isLandingDomain } from "../../utils/domain";

function UserMenuButton() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const goToApp = (path: string) => {
    if (isLandingDomain()) {
      window.location.href = getWebAppUrl(path);
    } else {
      navigate(path);
    }
  };

  const handleLogout = () => {
    logout();
    notifications.show({
      title: t("userMenu.logoutTitle", "Chiqish"),
      message: t("userMenu.logoutMessage", "Tizimdan muvaffaqiyatli chiqdingiz"),
      color: "yellow",
      withBorder: true,
    });
  };

  const fullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || t("userMenu.user", "Foydalanuvchi");
  const contact = user?.phoneNumber || user?.email || "";
  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() ||
    (fullName ? fullName.charAt(0).toUpperCase() : "") ||
    "U";

  const rawRole = (user?.role || "passenger").toLowerCase();
  const roleText =
    rawRole === "admin"
      ? t("roles.admin", "ADMIN")
      : rawRole === "instructor"
      ? t("roles.instructor", "INSTRUKTOR")
      : rawRole === "student"
      ? t("roles.student", "O'QUVCHI")
      : t("roles.passenger", "YO'LOVCHI");

  return (
    <Menu shadow="md" width={220} position="bottom-end" radius="md" withinPortal>
      <Menu.Target>
        <UnstyledButton
          className="header-control-btn user-menu-profile-btn"
          aria-label={fullName}
          style={{ paddingLeft: 4, paddingRight: 6 }}
        >
          <Group gap={8} wrap="nowrap" style={{ cursor: "pointer", alignItems: "center" }}>
            <Avatar
              size={32}
              radius="xl"
              style={{
                background: "#0284c7",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
              }}
            >
              {initials}
            </Avatar>

            <Box style={{ lineHeight: 1.15, textAlign: "left" }} visibleFrom="xs">
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text, #ffffff)",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.2px",
                }}
              >
                {fullName}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.5px",
                  marginTop: "1px",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span>{roleText}</span>
              </div>
            </Box>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown style={{ padding: 6 }}>
        <Box px="xs" py={6}>
          <Text size="sm" fw={700} truncate="end" c="var(--text)">
            {fullName}
          </Text>
          {contact && (
            <Text size="xs" c="dimmed" truncate="end">
              {contact}
            </Text>
          )}
        </Box>

        <Menu.Divider />

        <Menu.Item
          leftSection={<IconUser size={15} />}
          onClick={() => goToApp("/me")}
        >
          {t("nav.dashboard", "Boshqaruv paneli")}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconSettings size={15} />}
          onClick={() => goToApp("/settings")}
        >
          {t("userMenu.settings", "Sozlamalar")}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconHistory size={15} />}
          onClick={() => goToApp("/history")}
        >
          {t("history.title", "Imtihon tarixi")}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconTrophy size={15} />}
          onClick={() => goToApp("/leaderboard")}
        >
          {t("leaderboard.title", "Reyting")}
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item
          color="red"
          onClick={handleLogout}
          leftSection={<IconLogout size={15} />}
        >
          {t("userMenu.logout", "Chiqish")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default UserMenuButton;

