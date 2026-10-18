import React, { useState, useEffect } from "react";
import { Modal, Text, Stack, Group, Button, TextInput, ThemeIcon, CopyButton, ActionIcon, Tooltip, Loader, Center } from "@mantine/core";
import { IconSwords, IconCopy, IconCheck } from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";

interface Props {
  opened: boolean;
  onClose: () => void;
  onStartDuel: (code: string) => void;
}

export const OctagonDuelModal: React.FC<Props> = ({ opened, onClose, onStartDuel }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");

  useEffect(() => {
    if (!opened) {
      setInviteCode("");
      setInputCode("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    OctagonApi.createChallenge()
      .then((res) => {
        if (isMounted && res?.inviteCode) {
          setInviteCode(res.inviteCode);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [opened]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://web.pravaonline.uz";
  const duelUrl = inviteCode ? `${origin}/octagon?duel=${inviteCode}` : "";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="grape" variant="light" size="lg" radius="xl">
            <IconSwords size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.duel.title", "Do'st bilan Duel")}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
    >
      <Stack gap="lg">
        {loading ? (
          <Center py="xl">
            <Loader color="grape" />
          </Center>
        ) : (
          <>
            <Text size="sm" c="dimmed">
              {t("octagon.duel.subtitle", "Do'stingizga ushbu havolani yuboring va 1v1 jangda o'zaro kuch sinashing!")}
            </Text>

            {duelUrl && (
              <Stack align="center" gap="sm" my="xs">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <QRCodeSVG value={duelUrl} size={150} level="M" />
                </div>
                <Text size="xs" c="dimmed">
                  {t("octagon.duel.scanQr", "Kamera orqali QR-kodni skaner qiling")}
                </Text>
              </Stack>
            )}

            <Stack gap="xs">
              <Text size="xs" fw={700} c="dimmed">
                {t("octagon.duel.inviteLink", "Taklif havolasi:")}
              </Text>
              <Group gap="xs">
                <TextInput
                  readOnly
                  value={duelUrl}
                  style={{ flex: 1 }}
                  radius="md"
                />
                <CopyButton value={duelUrl} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t("octagon.duel.copied", "Nusxalandi!") : t("octagon.duel.copy", "Nusxalash")}>
                      <ActionIcon color={copied ? "teal" : "grape"} variant="filled" size="lg" radius="md" onClick={copy}>
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Stack>

            <div className="relative my-1 border-t border-slate-700">
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-slate-900 text-xs text-slate-400">
                {t("octagon.duel.orCode", "Yoki taklif kodini kiriting")}
              </span>
            </div>

            <Group gap="xs">
              <TextInput
                placeholder={t("octagon.duel.enterCodePlaceholder", "Duel kodi (masalan: 123456)")}
                value={inputCode}
                onChange={(e) => setInputCode(e.currentTarget.value.toUpperCase())}
                style={{ flex: 1 }}
                radius="md"
              />
              <Button
                color="grape"
                radius="md"
                disabled={!inputCode.trim()}
                onClick={() => onStartDuel(inputCode.trim())}
              >
                {t("octagon.duel.join", "Qo'shilish")}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
};
