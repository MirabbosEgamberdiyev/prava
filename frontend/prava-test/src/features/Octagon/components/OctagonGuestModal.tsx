import React, { useState } from "react";
import { Modal, TextInput, Stack, Text, Group, Button, ThemeIcon, Divider } from "@mantine/core";
import { IconUser, IconLogin, IconDice, IconSwords } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useAuthModal } from "../../../auth/AuthModalContext";

interface Props {
  opened: boolean;
  onContinueAsGuest: (nickname: string) => void;
  onClose: () => void;
}

function generateRandomNickname(): string {
  const adjectives = ["Chaqqon", "Tezkor", "Alp", "Mohir", "Baqquvvat", "Kuzatuvchi", "Yulduz"];
  const nouns = ["Haydovchi", "Poygachi", "Yo'lovchi", "Pilot", "Sardor", "Qahramon", "Master"];
  const randAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randNum = Math.floor(100 + Math.random() * 900);
  return `${randAdj}_${randNoun}_${randNum}`;
}

export const OctagonGuestModal: React.FC<Props> = ({ opened, onContinueAsGuest, onClose }) => {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem("octagon_guest_nickname") || generateRandomNickname();
  });

  const handleRandomize = () => {
    setNickname(generateRandomNickname());
  };

  const handleGuestSubmit = () => {
    const finalNick = nickname.trim() || generateRandomNickname();
    localStorage.setItem("octagon_guest_nickname", finalNick);
    if (!localStorage.getItem("octagon_guest_id")) {
      localStorage.setItem("octagon_guest_id", "guest_" + Math.random().toString(36).substring(2, 10));
    }
    onContinueAsGuest(finalNick);
  };

  const handleLogin = () => {
    onClose();
    openAuthModal({ returnUrl: "/octagon" });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="orange" variant="light" size="lg" radius="xl">
            <IconSwords size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.guest.title", "Oktagon Arenaga Kirish")}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          {t("octagon.guest.desc", "Jangni mehmon sifatida boshlashingiz yoki natijalaringiz saqlanib qolishi uchun tizimga kirishingiz mumkin.")}
        </Text>

        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed">
            {t("octagon.guest.nicknameLabel", "Sizning Laqabingiz (Nickname):")}
          </Text>
          <Group gap="xs">
            <TextInput
              style={{ flex: 1 }}
              value={nickname}
              onChange={(e) => setNickname(e.currentTarget.value)}
              placeholder={t("octagon.guest.placeholder", "Masalan: Tezkor_Haydovchi")}
              leftSection={<IconUser size={16} />}
              maxLength={24}
              radius="md"
            />
            <Button
              variant="light"
              color="gray"
              radius="md"
              onClick={handleRandomize}
              title={t("octagon.guest.randomize", "Boshqa nom tanlash")}
            >
              <IconDice size={18} />
            </Button>
          </Group>
        </Stack>

        <button
          type="button"
          onClick={handleGuestSubmit}
          className="octagon-btn-duo-green w-full py-3 rounded-2xl text-white font-extrabold text-base cursor-pointer"
          style={{
            background: "#22c55e",
            boxShadow: "0 4px 0 #15803d",
            border: "none",
          }}
        >
          {t("octagon.guest.continueAsGuest", "Mehmon sifatida o'ynash")}
        </button>

        <Divider label={t("octagon.guest.or", "Yoki")} labelPosition="center" />

        <Button
          variant="outline"
          color="blue"
          radius="xl"
          size="md"
          leftSection={<IconLogin size={18} />}
          onClick={handleLogin}
          fullWidth
        >
          {t("octagon.guest.loginToSave", "Tizimga kirish (Natijalarni saqlash)")}
        </Button>
      </Stack>
    </Modal>
  );
};
