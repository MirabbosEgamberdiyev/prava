import { useEffect, useRef, useState } from "react";
import { Alert, Button, Group, Loader, Modal, SimpleGrid, Stack, Text, UnstyledButton } from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPhotoUp, IconTrash } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useSWRConfig } from "swr";
import { useAuth } from "../../../auth/AuthContext";
import { showToast } from "../../../utils/notificationUtils";
import { getAvatarUrl } from "../../../utils/imageUtils";
import type { UserResponse } from "../../../types/auth";
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, avatarApi, prepareAvatarImage, type AvatarPreset } from "../avatar/avatarApi";
import { UserAvatar } from "../../../components/common/UserAvatar";

interface Props {
  opened: boolean;
  onClose: () => void;
  currentUrl?: string | null;
  initials: string;
}

const ACCEPTED_TYPES = AVATAR_ACCEPT.split(",");

/** Avatar tanlash: rasm yuklash (fayl / telefonda kamera), 8 ta tayyor avatar yoki o'chirish. */
export function AvatarPickerModal({ opened, onClose, currentUrl, initials }: Props) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const { mutate } = useSWRConfig();
  const fileRef = useRef<HTMLInputElement>(null);
  const [presets, setPresets] = useState<AvatarPreset[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || presets) return;
    let alive = true;
    avatarApi
      .presets()
      .then((list) => alive && setPresets(list))
      .catch(() => alive && setPresets([]));
    return () => {
      alive = false;
    };
  }, [opened, presets]);

  const apply = async (user: UserResponse, message: string) => {
    updateUser({ profileImageUrl: user.profileImageUrl ?? null });
    await mutate("/api/v1/auth/me", { data: user }, { revalidate: true });
    showToast({ color: "green", message });
    onClose();
  };

  const serverMessage = (e: unknown) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message || t("profile.avatar.error");

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("profile.avatar.unsupported"));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(t("profile.avatar.tooLarge"));
      return;
    }
    setBusy("upload");
    try {
      const image = await prepareAvatarImage(file);
      if (image.size > AVATAR_MAX_BYTES) {
        setError(t("profile.avatar.tooLarge"));
        return;
      }
      await apply(await avatarApi.upload(image), t("profile.avatar.updated"));
    } catch (e) {
      setError(serverMessage(e));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const choose = async (url: string | null) => {
    setError(null);
    setBusy(url ?? "remove");
    try {
      await apply(await avatarApi.choose(url), url ? t("profile.avatar.updated") : t("profile.avatar.removed"));
    } catch (e) {
      setError(serverMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t("profile.avatar.title")} centered radius="lg">
      <Stack gap="md">
        <Group justify="center">
          <UserAvatar imageUrl={currentUrl} initials={initials} size={96} radius={96} color="blue" />
        </Group>

        {error && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={AVATAR_ACCEPT}
          hidden
          onChange={(e) => void onFile(e.currentTarget.files?.[0])}
          data-testid="avatar-file-input"
        />
        <Button
          leftSection={<IconPhotoUp size={18} />}
          loading={busy === "upload"}
          disabled={Boolean(busy) && busy !== "upload"}
          onClick={() => fileRef.current?.click()}
        >
          {t("profile.avatar.upload")}
        </Button>
        <Text size="xs" c="dimmed" ta="center">
          {t("profile.avatar.uploadHint")}
        </Text>

        <Text fw={700} size="sm">
          {t("profile.avatar.presets")}
        </Text>
        {presets === null ? (
          <Group justify="center" py="sm">
            <Loader size="sm" />
          </Group>
        ) : (
          <SimpleGrid cols={4} spacing="sm">
            {presets.map((p) => {
              const selected = currentUrl === p.url;
              return (
                <UnstyledButton
                  key={p.id}
                  onClick={() => void choose(p.url)}
                  disabled={Boolean(busy)}
                  aria-label={t("profile.avatar.choosePreset", { name: p.id })}
                  aria-pressed={selected}
                  style={{
                    position: "relative",
                    borderRadius: "50%",
                    outline: selected ? "3px solid var(--mantine-color-blue-5)" : "none",
                    outlineOffset: 2,
                    opacity: busy && busy !== p.url ? 0.5 : 1,
                  }}
                >
                  <img src={getAvatarUrl(p.url)} alt="" width="100%" style={{ display: "block", borderRadius: "50%", aspectRatio: "1" }} />
                  {(selected || busy === p.url) && (
                    <span
                      style={{
                        position: "absolute",
                        right: 0,
                        bottom: 0,
                        background: "var(--mantine-color-blue-6)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {busy === p.url ? <Loader size={12} color="white" /> : <IconCheck size={14} />}
                    </span>
                  )}
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        )}

        {currentUrl && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconTrash size={16} />}
            loading={busy === "remove"}
            disabled={Boolean(busy) && busy !== "remove"}
            onClick={() => void choose(null)}
          >
            {t("profile.avatar.remove")}
          </Button>
        )}
      </Stack>
    </Modal>
  );
}
