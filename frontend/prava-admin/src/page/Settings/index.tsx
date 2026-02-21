import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Grid,
  Select,
  Avatar,
  Divider,
  Badge,
  NumberInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy, IconLock, IconUser, IconDevices } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/auth/AuthContext";
import api from "../../services/api";

const Settings_Page = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [globalDeviceLimit, setGlobalDeviceLimit] = useState<number>(4);
  const [globalDeviceLoading, setGlobalDeviceLoading] = useState(false);

  const profileForm = useForm({
    initialValues: {
      firstName: user?.firstName || user?.fullName?.split(" ")[0] || "",
      lastName: user?.lastName || user?.fullName?.split(" ").slice(1).join(" ") || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      preferredLanguage: user?.preferredLanguage || "UZL",
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validate: {
      currentPassword: (v) => (v.length < 1 ? t("validation.currentPasswordRequired") : null),
      newPassword: (v) => (v.length < 8 ? t("validation.passwordMin", { count: 8 }) : null),
      confirmPassword: (v, values) =>
        v !== values.newPassword ? t("validation.passwordMismatch") : null,
    },
  });

  const handleProfileSubmit = async (values: typeof profileForm.values) => {
    setProfileLoading(true);
    try {
      await api.put(`/api/v1/admin/users/${user?.id}`, {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        preferredLanguage: values.preferredLanguage,
      });
      notifications.show({
        title: t("settings.profileSuccess"),
        message: t("settings.profileSuccess"),
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("settings.profileError"),
        color: "red",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
    setPasswordLoading(true);
    try {
      await api.post("/api/v1/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      notifications.show({
        title: t("common.success"),
        message: t("settings.passwordSuccess"),
        color: "green",
      });
      passwordForm.reset();
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("settings.passwordError"),
        color: "red",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetGlobalDeviceLimit = async () => {
    setGlobalDeviceLoading(true);
    try {
      await api.post(`/api/v2/admin/statistics/device-limit/global?maxDevices=${globalDeviceLimit}`);
      notifications.show({
        title: t("common.success"),
        message: t("settings.globalLimitSuccess"),
        color: "green",
      });
    } catch {
      notifications.show({
        title: t("common.error"),
        message: t("settings.globalLimitError"),
        color: "red",
      });
    } finally {
      setGlobalDeviceLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Title order={3}>{t("settings.title")}</Title>

      <Grid>
        {/* Profil ma'lumotlari */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="md">
              <IconUser size={20} />
              <Text fw={600} size="lg">{t("settings.profileTitle")}</Text>
            </Group>

            <Group mb="lg">
              <Avatar size={64} radius="xl" color="blue" src={user?.profileImageUrl}>
                {user?.firstName?.charAt(0) || "U"}
              </Avatar>
              <div>
                <Text fw={600}>{user?.fullName || t("userMenu.user")}</Text>
                <Badge variant="light" color={user?.role === "SUPER_ADMIN" ? "red" : "blue"}>
                  {user?.role}
                </Badge>
              </div>
            </Group>

            <form onSubmit={profileForm.onSubmit(handleProfileSubmit)}>
              <Stack gap="md">
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t("settings.firstName")} {...profileForm.getInputProps("firstName")} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t("settings.lastName")} {...profileForm.getInputProps("lastName")} />
                  </Grid.Col>
                </Grid>
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t("settings.phone")} {...profileForm.getInputProps("phoneNumber")} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput label={t("settings.email")} {...profileForm.getInputProps("email")} />
                  </Grid.Col>
                </Grid>
                <Select
                  label={t("settings.language")}
                  w={250}
                  data={[
                    { value: "UZL", label: t("languages.uzLatin") },
                    { value: "UZC", label: t("languages.uzCyrillic") },
                    { value: "RU", label: t("languages.russian") },
                    { value: "EN", label: t("languages.english") },
                  ]}
                  {...profileForm.getInputProps("preferredLanguage")}
                />
                <Button
                  type="submit"
                  loading={profileLoading}
                  leftSection={<IconDeviceFloppy size={18} />}
                  w={200}
                >
                  {t("settings.save")}
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>

        {/* Parol o'zgartirish */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group mb="md">
              <IconLock size={20} />
              <Text fw={600} size="lg">{t("settings.passwordTitle")}</Text>
            </Group>

            <form onSubmit={passwordForm.onSubmit(handlePasswordSubmit)}>
              <Stack gap="md">
                <PasswordInput
                  label={t("settings.currentPassword")}
                  {...passwordForm.getInputProps("currentPassword")}
                />
                <Divider />
                <PasswordInput
                  label={t("settings.newPassword")}
                  {...passwordForm.getInputProps("newPassword")}
                />
                <PasswordInput
                  label={t("settings.confirmPassword")}
                  {...passwordForm.getInputProps("confirmPassword")}
                />
                <Button
                  type="submit"
                  loading={passwordLoading}
                  leftSection={<IconLock size={18} />}
                  color="orange"
                >
                  {t("settings.changePassword")}
                </Button>
              </Stack>
            </form>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Global Device Limit - SUPER_ADMIN only */}
      {isSuperAdmin && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group mb="md">
            <IconDevices size={20} />
            <Text fw={600} size="lg">{t("settings.globalDeviceTitle")}</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="md">
            {t("settings.globalDeviceDesc")}
          </Text>
          <Group>
            <NumberInput
              label={t("settings.globalDeviceLimit")}
              value={globalDeviceLimit}
              onChange={(v) => setGlobalDeviceLimit(typeof v === "number" ? v : globalDeviceLimit)}
              min={1}
              max={20}
              w={150}
            />
            <Button
              loading={globalDeviceLoading}
              onClick={handleSetGlobalDeviceLimit}
              leftSection={<IconDeviceFloppy size={18} />}
              mt={24}
            >
              {t("settings.setGlobalLimit")}
            </Button>
          </Group>
        </Card>
      )}
    </Stack>
  );
};

export default Settings_Page;
