import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Group, Loader, Stack, Text } from "@mantine/core";
import { IconBrandTelegram, IconExternalLink } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  pollTelegramSession,
  TelegramSessionService,
  type TelegramSessionInit,
  type TelegramSessionStatusResponse,
} from "../../auth/telegramSession";

type Phase = "idle" | "starting" | "waiting" | "rejected" | "expired" | "error";

interface Props {
  platform: "web" | "desktop";
  /** Modal ochiq bo'lgan payt; yopilganda kutilayotgan sessiya bekor qilinadi. */
  active: boolean;
  openExternalUrl: (url: string) => void | Promise<void>;
  onApproved: (res: TelegramSessionStatusResponse & { accessToken: string }) => void;
}

/**
 * Telegram orqali bir bosishda kirish: Telegram ochiladi, botdagi «Tasdiqlash» bosiladi, ilova o'zi kiradi.
 * Kod kiritish usuli (pastda) zaxira sifatida qoladi.
 */
export const TelegramOneTapSection = ({ platform, active, openExternalUrl, onApproved }: Props) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const sessionRef = useRef<TelegramSessionInit | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    const s = sessionRef.current;
    sessionRef.current = null;
    if (s) void TelegramSessionService.cancel(s.token, s.pollSecret);
  }, []);

  useEffect(() => {
    if (!active) {
      cancel();
      setPhase("idle");
    }
  }, [active, cancel]);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(async () => {
    cancel();
    setPhase("starting");
    try {
      const redirect = typeof window !== "undefined" ? window.location.pathname : undefined;
      const session = await TelegramSessionService.init(platform, redirect);
      sessionRef.current = session;
      setPhase("waiting");
      // Desktop'da tg:// to'g'ridan-to'g'ri Telegram Desktop'ni ochadi; brauzerda t.me ilova yo'q bo'lsa ham ishlaydi
      void openExternalUrl(platform === "desktop" ? session.directAppUrl : session.botUrl);
      stopRef.current = pollTelegramSession({
        token: session.token,
        pollSecret: session.pollSecret,
        onFinal: (res) => {
          stopRef.current = null;
          sessionRef.current = null;
          if (res.status === "APPROVED" && res.accessToken && res.user) {
            setPhase("idle");
            onApproved(res as TelegramSessionStatusResponse & { accessToken: string });
          } else if (res.status === "REJECTED") {
            setPhase("rejected");
          } else {
            setPhase("expired");
          }
        },
      });
    } catch {
      setPhase("error");
    }
  }, [cancel, platform, openExternalUrl, onApproved]);

  const session = sessionRef.current;

  return (
    <Stack
      gap="xs"
      p="md"
      style={{
        background: "rgba(34, 158, 217, 0.08)",
        borderRadius: "12px",
        border: "1px solid rgba(34, 158, 217, 0.35)",
      }}
    >
      {phase === "waiting" && session ? (
        <>
          <Group gap="sm" wrap="nowrap" role="status" aria-live="polite">
            <Loader size="sm" color="#229ED9" />
            <Text size="sm" fw={600}>
              {t("auth.telegram.oneTapWaiting")}
            </Text>
          </Group>
          <Button
            variant="subtle"
            color="#229ED9"
            size="xs"
            rightSection={<IconExternalLink size={14} />}
            onClick={() => openExternalUrl(session.botUrl)}
          >
            {t("auth.telegram.oneTapNotOpened")}
          </Button>
        </>
      ) : (
        <>
          <Text size="sm">{t("auth.telegram.oneTapHint")}</Text>
          <Button
            fullWidth
            color="#229ED9"
            loading={phase === "starting"}
            leftSection={<IconBrandTelegram size={18} />}
            onClick={start}
            radius="md"
          >
            {t("auth.telegram.oneTapButton")}
          </Button>
          {phase === "rejected" && (
            <Text size="xs" c="red" role="alert">
              {t("auth.telegram.oneTapRejected")}
            </Text>
          )}
          {phase === "expired" && (
            <Text size="xs" c="orange" role="alert">
              {t("auth.telegram.oneTapExpired")}
            </Text>
          )}
          {phase === "error" && (
            <Text size="xs" c="red" role="alert">
              {t("auth.telegram.oneTapError")}
            </Text>
          )}
        </>
      )}
    </Stack>
  );
};

export default TelegramOneTapSection;
