import {
  Modal,
  Stack,
  TextInput,
  Select,
  PasswordInput,
  Button,
  Grid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useUserMutations } from "../hooks/useUserMutations";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UserCreateModalProps {
  opened: boolean;
  onClose: () => void;
}

export const UserCreateModal = ({ opened, onClose }: UserCreateModalProps) => {
  const { createUser } = useUserMutations();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      role: "USER" as "ADMIN" | "USER",
      preferredLanguage: "UZL",
    },
    validate: {
      firstName: (v) => (v.trim().length < 2 ? t("validation.nameRequired") : null),
      password: (v) => (v.length < 8 ? t("validation.passwordMin", { count: 8 }) : null),
      email: (v) =>
        v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
          ? t("validation.emailFormat")
          : null,
      phoneNumber: (v) =>
        v && !/^\+?[0-9]{9,15}$/.test(v)
          ? t("validation.phoneFormat")
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await createUser({
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        password: values.password,
        role: values.role,
        preferredLanguage: values.preferredLanguage,
      });
      form.reset();
      onClose();
    } catch {
      // notification handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("users.createUser")} size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label={t("users.firstName")} required {...form.getInputProps("firstName")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label={t("users.lastName")} {...form.getInputProps("lastName")} />
            </Grid.Col>
          </Grid>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label={t("users.phone")} placeholder="+998901234567" {...form.getInputProps("phoneNumber")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label={t("users.email")} placeholder="user@example.com" {...form.getInputProps("email")} />
            </Grid.Col>
          </Grid>
          <PasswordInput label={t("users.passwordLabel")} required {...form.getInputProps("password")} />
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label={t("users.selectRole")}
                data={[
                  { value: "USER", label: t("users.roleUser") },
                  { value: "ADMIN", label: t("users.roleAdmin") },
                ]}
                {...form.getInputProps("role")}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label={t("users.selectLang")}
                data={[
                  { value: "UZL", label: t("languages.uzLatin") },
                  { value: "UZC", label: t("languages.uzCyrillic") },
                  { value: "RU", label: t("languages.russian") },
                  { value: "EN", label: t("languages.english") },
                ]}
                {...form.getInputProps("preferredLanguage")}
              />
            </Grid.Col>
          </Grid>
          <Button
            type="submit"
            loading={loading}
            leftSection={<IconDeviceFloppy size={18} />}
          >
            {t("common.create")}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
