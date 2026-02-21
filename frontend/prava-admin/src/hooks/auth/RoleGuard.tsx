import React from "react";
import { Center, Text, Stack, Button } from "@mantine/core";
import { IconShieldOff } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <IconShieldOff size={48} color="var(--mantine-color-red-6)" />
          <Text size="lg" fw={600}>{t("common.noPermission")}</Text>
          <Text c="dimmed" ta="center">
            {t("common.noPermissionDesc")}
          </Text>
          <Button variant="light" onClick={() => navigate("/")}>
            {t("common.backToHome")}
          </Button>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
