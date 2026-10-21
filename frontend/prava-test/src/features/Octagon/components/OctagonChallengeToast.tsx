import React, { useEffect, useState } from "react";
import { Modal, Text, Group, Button, Progress, ThemeIcon } from "@mantine/core";
import { IconSwords, IconCheck, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { IncomingChallenge } from "../types";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { safeName } from "../rank";

interface Props {
  challenge: IncomingChallenge | null;
  onAccept: (challengeId: string) => void;
  onReject: (challengeId: string) => void;
}

export const OctagonChallengeToast: React.FC<Props> = ({ challenge, onAccept, onReject }) => {
  const { t } = useTranslation();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!challenge) {
      setTimeLeft(30);
      return;
    }

    setTimeLeft(challenge.expiresInSec || 30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReject(challenge.challengeId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge, onReject]);

  if (!challenge) return null;

  const challengerName = safeName(challenge.challenger.displayName, t("octagon.lobby.defaultUser"));
  const pct = Math.max(0, Math.min(100, (timeLeft / (challenge.expiresInSec || 30)) * 100));

  return (
    <Modal
      opened={Boolean(challenge)}
      onClose={() => onReject(challenge.challengeId)}
      withCloseButton={false}
      centered
      radius="lg"
      padding="lg"
      size="sm"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      styles={{
        content: {
          backgroundColor: "#0f172a",
          border: "2px solid #a855f7",
          color: "#f8fafc",
          boxShadow: "0 0 35px rgba(168, 85, 247, 0.35)",
        },
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon color="grape" variant="light" size="lg" radius="xl">
              <IconSwords size={20} />
            </ThemeIcon>
            <Text fw={800} size="md">
              {t("octagon.challenge.incomingTitle", "Jangga Chorlov!")}
            </Text>
          </Group>
          <Text size="xs" fw={700} c="dimmed">
            {timeLeft}s
          </Text>
        </Group>

        <div
          style={{
            background: "#1e293b",
            borderRadius: 12,
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <OctagonAvatar name={challengerName} src={challenge.challenger.avatarUrl} size={52} ring="#a855f7" />
          <div>
            <Text fw={800} size="md">
              {challengerName}
            </Text>
            <Group gap={6} mt={2}>
              <Text size="xs" c="dimmed">
                {challenge.challenger.eloRating} ELO
              </Text>
              <OctagonRankBadge rank={challenge.challenger.rank} elo={challenge.challenger.eloRating} size="xs" />
            </Group>
          </div>
        </div>

        <Text size="xs" c="dimmed" style={{ textAlign: "center" }}>
          {t("octagon.challenge.incomingPrompt", "Raqib siz bilan real vaqtda 1v1 Oktagonda kuch sinashmoqchi!")}
        </Text>

        <Progress value={pct} color="grape" size="sm" radius="xl" />

        <Group justify="space-between" mt="xs">
          <Button
            variant="default"
            color="red"
            size="sm"
            radius="md"
            leftSection={<IconX size={16} />}
            onClick={() => onReject(challenge.challengeId)}
          >
            {t("octagon.challenge.reject", "Rad etish")}
          </Button>
          <Button
            color="grape"
            size="sm"
            radius="md"
            leftSection={<IconCheck size={16} />}
            onClick={() => onAccept(challenge.challengeId)}
          >
            {t("octagon.challenge.accept", "Qabul qilish")}
          </Button>
        </Group>
      </div>
    </Modal>
  );
};
