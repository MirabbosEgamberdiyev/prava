import { useState, useEffect } from "react";
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
  Tabs,
  Switch,
  Textarea,
  Loader,
  Center,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconDeviceFloppy,
  IconLock,
  IconUser,
  IconDevices,
  IconSettings,
  IconWorld,
  IconCertificate,
  IconShield,
  IconSearch,
  IconTypography,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/auth/AuthContext";
import { SimpleTypographyControl } from "../../components/SimpleTypographyControl";
import api from "../../services/api";

function errMessage(e: unknown): string | undefined {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

const Settings_Page = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdminOrSuper = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<string | null>(isAdminOrSuper ? "system" : "profile");

  // Profil & Parol holati
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [globalDeviceLimit, setGlobalDeviceLimit] = useState<number>(4);
  const [globalDeviceLoading, setGlobalDeviceLoading] = useState(false);

  // Tizim Sozlamalari holati
  const [systemSettingsLoading, setSystemSettingsLoading] = useState(false);
  const [systemSettingsSaving, setSystemSettingsSaving] = useState(false);

  const [settings, setSettings] = useState<Record<string, string>>({
    site_name_uz: "PRAVA ONLINE",
    site_name_uzc: "ПРАВА ОНЛАЙН",
    site_name_ru: "ПРАВА ОНЛАЙН",
    site_description_uz: "O'zbekistondagi zamonaviy haydovchilik guvohnomasi imtihonlariga tayyorlanish platformasi",
    support_phone: "+998 71 200 00 00",
    support_email: "info@prava-imtihon.uz",
    telegram_bot: "https://t.me/prava_imtihon_bot",
    telegram_channel: "https://t.me/prava_imtihon",
    logo_url: "",
    favicon_url: "",
    exam_duration_minutes: "20",
    exam_pass_score: "18",
    exam_question_count: "20",
    shuffle_questions: "true",
    shuffle_options: "true",
    show_results_immediately: "true",
    max_active_sessions: "2",
    session_timeout_hours: "24",
    rate_limit_attempts: "5",
    seo_title_uz: "Prava Imtihon Testlari Onlayn 2026",
    seo_description_uz: "YHQ testlari, biletlar va avtomaktab imtihonlariga tayyorlanish",
    seo_keywords_uz: "prava, imtihon, avtomaktab, yhq testlari, haydovchilik guvohnomasi",
  });

  // Tizim sozlamalarini yuklash
  useEffect(() => {
    if (isAdminOrSuper) {
      setSystemSettingsLoading(true);
      api
        .get("/api/v1/admin/settings")
        .then((res) => {
          if (res.data?.data && typeof res.data.data === "object") {
            setSettings((prev) => ({ ...prev, ...res.data.data }));
          }
        })
        .catch(() => {
          // defaultlar ishlatiladi
        })
        .finally(() => setSystemSettingsLoading(false));
    }
  }, [isAdminOrSuper]);

  const handleSettingChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSystemSettings = async () => {
    setSystemSettingsSaving(true);
    try {
      await api.post("/api/v1/admin/settings", settings);
      notifications.show({
        title: t("common.success"),
        message: t("settingsAdmin.saveSuccess"),
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: t("common.error"),
        message: errMessage(err) || t("settingsAdmin.saveError"),
        color: "red",
      });
    } finally {
      setSystemSettingsSaving(false);
    }
  };

  const profileForm = useForm({
    initialValues: {
      firstName: user?.firstName || user?.fullName?.split(" ")[0] || "",
      lastName: user?.lastName || user?.fullName?.split(" ").slice(1).join(" ") || "",
      phoneNumber: user?.phoneNumber || "",
      email: user?.email || "",
      preferredLanguage: user?.preferredLanguage || "UZL",
    },
    validate: {
      firstName: (v) => (!v?.trim() ? t("validation.nameRequired") : null),
      email: (v) =>
        !v?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? null
          : t("validation.emailFormat"),
      phoneNumber: (v) =>
        !v?.trim() || /^\+?[0-9\s()-]{7,20}$/.test(v.trim())
          ? null
          : t("validation.phoneFormat"),
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
    if (!user?.id || profileLoading) return;
    setProfileLoading(true);
    try {
      await api.put(`/api/v1/admin/users/${user.id}`, {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        preferredLanguage: values.preferredLanguage,
      });

      updateUser({
        firstName: values.firstName,
        lastName: values.lastName,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        phoneNumber: values.phoneNumber || null,
        email: values.email || null,
        preferredLanguage: values.preferredLanguage,
      });

      i18n.changeLanguage(String(values.preferredLanguage).toLowerCase());

      notifications.show({
        title: t("common.success"),
        message: t("settings.profileSuccess"),
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: t("common.error"),
        message: errMessage(error) || t("settings.profileError"),
        color: "red",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: typeof passwordForm.values) => {
    if (passwordLoading) return;
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
    } catch (error: unknown) {
      notifications.show({
        title: t("common.error"),
        message: errMessage(error) || t("settings.passwordError"),
        color: "red",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSetGlobalDeviceLimit = () => {
    if (globalDeviceLoading) return;

    modals.openConfirmModal({
      title: t("settings.globalLimitConfirmTitle"),
      children: (
        <Text size="sm">
          {t("settings.globalLimitConfirm", { count: globalDeviceLimit })}
        </Text>
      ),
      labels: { confirm: t("common.confirm"), cancel: t("common.cancel") },
      confirmProps: { color: "orange" },
      onConfirm: async () => {
        setGlobalDeviceLoading(true);
        try {
          await api.post(
            `/api/v2/admin/statistics/device-limit/global?maxDevices=${globalDeviceLimit}`
          );
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
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">{t("settings.title")}</Title>
          <Text size="sm" c="dimmed">{t("settingsAdmin.subtitle")}</Text>
        </div>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List mb="md">
          {isAdminOrSuper && (
            <Tabs.Tab value="system" leftSection={<IconSettings size={16} />}>
              {t("settingsAdmin.tabSystem")}
            </Tabs.Tab>
          )}
          <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
            {t("settingsAdmin.tabProfile")}
          </Tabs.Tab>
          <Tabs.Tab value="appearance" leftSection={<IconTypography size={16} />}>
            {t("settings.appearance")}
          </Tabs.Tab>
          {isSuperAdmin && (
            <Tabs.Tab value="devices" leftSection={<IconDevices size={16} />}>
              {t("settingsAdmin.tabDevices")}
            </Tabs.Tab>
          )}
        </Tabs.List>

        {/* TAB 1: SYSTEM SETTINGS */}
        {isAdminOrSuper && (
          <Tabs.Panel value="system">
            {systemSettingsLoading ? (
              <Center h={300}>
                <Loader type="bars" />
              </Center>
            ) : (
              <Stack gap="lg">
                {/* 1. Umumiy sozlamalar */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group mb="md">
                    <IconWorld size={20} color="var(--mantine-color-blue-6)" />
                    <Text fw={600} size="lg">Umumiy Sayt Sozlamalari (General)</Text>
                  </Group>
                  <Grid>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="Sayt nomi (O'zbekcha Lotin)"
                        value={settings.site_name_uz || ""}
                        onChange={(e) => handleSettingChange("site_name_uz", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="Sayt nomi (Kirill)"
                        value={settings.site_name_uzc || ""}
                        onChange={(e) => handleSettingChange("site_name_uzc", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        label="Sayt nomi (Ruscha)"
                        value={settings.site_name_ru || ""}
                        onChange={(e) => handleSettingChange("site_name_ru", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Sayt tavsifi (Description)"
                        rows={2}
                        value={settings.site_description_uz || ""}
                        onChange={(e) => handleSettingChange("site_description_uz", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Qo'llab-quvvatlash telefoni"
                        value={settings.support_phone || ""}
                        onChange={(e) => handleSettingChange("support_phone", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Support Email"
                        value={settings.support_email || ""}
                        onChange={(e) => handleSettingChange("support_email", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Telegram Bot havolasi"
                        value={settings.telegram_bot || ""}
                        onChange={(e) => handleSettingChange("telegram_bot", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Telegram Kanal havolasi"
                        value={settings.telegram_channel || ""}
                        onChange={(e) => handleSettingChange("telegram_channel", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Logo URL"
                        placeholder="https://..."
                        value={settings.logo_url || ""}
                        onChange={(e) => handleSettingChange("logo_url", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <TextInput
                        label="Favicon URL"
                        placeholder="https://..."
                        value={settings.favicon_url || ""}
                        onChange={(e) => handleSettingChange("favicon_url", e.currentTarget.value)}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* 2. Imtihon sozlamalari */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group mb="md">
                    <IconCertificate size={20} color="var(--mantine-color-green-6)" />
                    <Text fw={600} size="lg">Imtihon Sozlamalari (Exam Settings)</Text>
                  </Group>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Imtihon davomiyligi (daqiqa)"
                        min={5}
                        max={120}
                        value={parseInt(settings.exam_duration_minutes || "20")}
                        onChange={(v) => handleSettingChange("exam_duration_minutes", String(v))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Biletda savollar soni"
                        min={10}
                        max={50}
                        value={parseInt(settings.exam_question_count || "20")}
                        onChange={(v) => handleSettingChange("exam_question_count", String(v))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Minimal o'tish bali (to'g'ri javoblar)"
                        min={1}
                        max={50}
                        value={parseInt(settings.exam_pass_score || "18")}
                        onChange={(v) => handleSettingChange("exam_pass_score", String(v))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Switch
                        mt="md"
                        label="Savollarni tasodifiy tartibda ko'rsatish"
                        checked={settings.shuffle_questions === "true"}
                        onChange={(e) => handleSettingChange("shuffle_questions", String(e.currentTarget.checked))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Switch
                        mt="md"
                        label="Variantlarni tasodifiy aralashtirish"
                        checked={settings.shuffle_options === "true"}
                        onChange={(e) => handleSettingChange("shuffle_options", String(e.currentTarget.checked))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Switch
                        mt="md"
                        label="Natijalarni darhol ko'rsatish"
                        checked={settings.show_results_immediately === "true"}
                        onChange={(e) => handleSettingChange("show_results_immediately", String(e.currentTarget.checked))}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* 3. Xavfsizlik va Sessiyalar */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group mb="md">
                    <IconShield size={20} color="var(--mantine-color-orange-6)" />
                    <Text fw={600} size="lg">{t("settingsAdmin.securitySectionTitle")}</Text>
                  </Group>
                  <Grid>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Maksimal faol sessiyalar (bir akkauntda)"
                        min={1}
                        max={10}
                        value={parseInt(settings.max_active_sessions || "2")}
                        onChange={(v) => handleSettingChange("max_active_sessions", String(v))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Sessiya amal qilish muddati (soatda)"
                        min={1}
                        max={720}
                        value={parseInt(settings.session_timeout_hours || "24")}
                        onChange={(v) => handleSettingChange("session_timeout_hours", String(v))}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <NumberInput
                        label="Login urinishlar chegarasi (Rate limit)"
                        min={3}
                        max={20}
                        value={parseInt(settings.rate_limit_attempts || "5")}
                        onChange={(v) => handleSettingChange("rate_limit_attempts", String(v))}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* 4. SEO Sozlamalari */}
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                  <Group mb="md">
                    <IconSearch size={20} color="var(--mantine-color-indigo-6)" />
                    <Text fw={600} size="lg">SEO va Meta Teglar (Search Engine Optimization)</Text>
                  </Group>
                  <Grid>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Meta Title (Sarlavha)"
                        value={settings.seo_title_uz || ""}
                        onChange={(e) => handleSettingChange("seo_title_uz", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Meta Description (Tavsif)"
                        rows={2}
                        value={settings.seo_description_uz || ""}
                        onChange={(e) => handleSettingChange("seo_description_uz", e.currentTarget.value)}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <TextInput
                        label="Meta Keywords (Kalit so'zlar vergul bilan)"
                        value={settings.seo_keywords_uz || ""}
                        onChange={(e) => handleSettingChange("seo_keywords_uz", e.currentTarget.value)}
                      />
                    </Grid.Col>
                  </Grid>
                </Card>

                {/* Saqlash tugmasi */}
                <Group justify="flex-end">
                  <Button
                    size="md"
                    color="blue"
                    leftSection={<IconDeviceFloppy size={20} />}
                    loading={systemSettingsSaving}
                    disabled={systemSettingsSaving}
                    onClick={handleSaveSystemSettings}
                  >
                    Barcha Tizim Sozlamalarini Saqlash
                  </Button>
                </Group>
              </Stack>
            )}
          </Tabs.Panel>
        )}

        {/* TAB 2: PROFILE & PASSWORD */}
        <Tabs.Panel value="profile">
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
                      disabled={profileLoading}
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
                      disabled={passwordLoading}
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
        </Tabs.Panel>

        {/* TAB: APPEARANCE (TYPOGRAPHY & DISPLAY) */}
        <Tabs.Panel value="appearance">
          <SimpleTypographyControl />
        </Tabs.Panel>

        {/* TAB 3: GLOBAL DEVICE LIMIT */}
        {isSuperAdmin && (
          <Tabs.Panel value="devices">
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
                  disabled={globalDeviceLoading}
                  onClick={handleSetGlobalDeviceLimit}
                  leftSection={<IconDeviceFloppy size={18} />}
                  mt={24}
                >
                  {t("settings.setGlobalLimit")}
                </Button>
              </Group>
            </Card>
          </Tabs.Panel>
        )}
      </Tabs>
    </Stack>
  );
};

export default Settings_Page;
