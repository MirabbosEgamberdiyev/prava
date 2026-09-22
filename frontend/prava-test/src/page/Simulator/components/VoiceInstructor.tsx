import { useEffect, useRef } from "react";
import { Paper, Group, Text, ThemeIcon } from "@mantine/core";
import { IconVolume } from "@tabler/icons-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  message: string;
  soundEnabled: boolean;
}

export default function VoiceInstructor({ message, soundEnabled }: Props) {
  const { lang } = useLanguage();
  const lastSpokenRef = useRef<string>("");

  useEffect(() => {
    if (!message || message === lastSpokenRef.current) return;
    lastSpokenRef.current = message;

    if (soundEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = lang === "ru" ? "ru-RU" : "uz-UZ";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis unavailable", e);
      }
    }
  }, [message, soundEnabled, lang]);

  if (!message) return null;

  return (
    <Paper
      px="md"
      py="xs"
      radius="md"
      withBorder
      style={{
        backgroundColor: "rgba(26, 37, 47, 0.9)",
        backdropFilter: "blur(8px)",
        borderColor: "rgba(52, 152, 219, 0.4)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
      }}
    >
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon size="sm" color="blue" variant="filled">
          <IconVolume size={14} />
        </ThemeIcon>
        <Text size="sm" fw={600} c="white">
          {message}
        </Text>
      </Group>
    </Paper>
  );
}
