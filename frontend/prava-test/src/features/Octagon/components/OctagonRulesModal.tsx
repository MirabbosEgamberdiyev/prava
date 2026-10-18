import React, { useState, useEffect } from "react";
import { Modal, Text, Stack, Group, ThemeIcon } from "@mantine/core";
import { IconShieldCheck, IconClock, IconTrophy, IconFlame } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface Props {
  opened: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const OctagonRulesModal: React.FC<Props> = ({ opened, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    if (!opened) {
      setSecondsLeft(4);
      return;
    }

    setSecondsLeft(4);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [opened]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
            <IconShieldCheck size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.rules.title", "Oktagon Qoidalari")}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("octagon.rules.subtitle", "1v1 Intellektual arena – haqiqiy bilimlar jangi!")}
        </Text>

        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon color="blue" variant="light" radius="xl" size="md">
            <IconClock size={16} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700}>
              {t("octagon.rules.rule1Title", "10 ta Savol, Har biriga 30 soniya")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("octagon.rules.rule1Desc", "Vaqt tugashidan oldin to'g'ri variantni tanlang.")}
            </Text>
          </div>
        </Group>

        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon color="green" variant="light" radius="xl" size="md">
            <IconFlame size={16} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700}>
              {t("octagon.rules.rule2Title", "Tezlik va Aniqlik")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("octagon.rules.rule2Desc", "Qancha tezroq to'g'ri topsangiz, shuncha yuqori ball olasiz.")}
            </Text>
          </div>
        </Group>

        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon color="yellow" variant="light" radius="xl" size="md">
            <IconTrophy size={16} />
          </ThemeIcon>
          <div>
            <Text size="sm" fw={700}>
              {t("octagon.rules.rule3Title", "Reyting va Ligalar (ELO)")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("octagon.rules.rule3Desc", "G'alaba qozonib Bronzadan Brilliant ligasigacha ko'tariling!")}
            </Text>
          </div>
        </Group>

        <button
          type="button"
          disabled={secondsLeft > 0}
          onClick={onConfirm}
          className={`octagon-btn-duo-green w-full py-3.5 rounded-2xl text-white font-extrabold text-base transition-all mt-3 ${
            secondsLeft > 0 ? "opacity-50 cursor-not-allowed filter grayscale" : "cursor-pointer"
          }`}
          style={{
            background: secondsLeft > 0 ? "#4b5563" : "#22c55e",
            boxShadow: secondsLeft > 0 ? "none" : "0 4px 0 #15803d",
            border: "none",
          }}
        >
          {secondsLeft > 0
            ? t("octagon.rules.waitCountdown", "{{sec}} soniya kuting...", { sec: secondsLeft })
            : t("octagon.rules.understand", "TUSHUNDIM")}
        </button>
      </Stack>
    </Modal>
  );
};
