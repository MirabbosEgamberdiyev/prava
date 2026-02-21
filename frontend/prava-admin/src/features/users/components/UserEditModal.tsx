import {
  Modal,
  Stack,
  TextInput,
  Select,
  Button,
  Grid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useUserMutations } from "../hooks/useUserMutations";
import { useState, useEffect } from "react";
import type { User } from "../types";
import { useTranslation } from "react-i18next";

interface UserEditModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserEditModal = ({ opened, onClose, user }: UserEditModalProps) => {
  const { updateUser } = useUserMutations();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      preferredLanguage: "UZL",
    },
    validate: {
      firstName: (v) => (v.trim().length < 2 ? t("validation.nameRequired") : null),
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

  useEffect(() => {
    if (user && opened) {
      form.setValues({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        preferredLanguage: user.preferredLanguage || "UZL",
      });
    }
  }, [user, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUser(user.id, {
        firstName: values.firstName,
        lastName: values.lastName,
        phoneNumber: values.phoneNumber || undefined,
        email: values.email || undefined,
        preferredLanguage: values.preferredLanguage,
      });
      onClose();
    } catch {
      // notification handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("users.editUser")} size="lg">
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
              <TextInput label={t("users.phone")} {...form.getInputProps("phoneNumber")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput label={t("users.email")} {...form.getInputProps("email")} />
            </Grid.Col>
          </Grid>
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
          <Button type="submit" loading={loading} leftSection={<IconDeviceFloppy size={18} />}>
            {t("common.save")}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
};
