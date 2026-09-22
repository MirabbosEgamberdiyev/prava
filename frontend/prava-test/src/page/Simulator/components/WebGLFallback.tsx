import { Paper, Title, Text, Button, Stack, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  onRetry?: () => void;
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

export default function WebGLFallback({ onRetry }: Props) {
  const { lang } = useLanguage();

  const title =
    lang === "ru"
      ? "3D Графика недоступна"
      : lang === "uzc"
      ? "3D Графика мавжуд эмас"
      : "3D Grafika mavjud emas";

  const message =
    lang === "ru"
      ? "Ваше устройство или браузер не поддерживает аппаратное ускорение WebGL. Пожалуйста, обновите видеодрайвер или включите аппаратное ускорение в настройках браузера."
      : lang === "uzc"
      ? "Қурилмангиз ёки браузерингиз WebGL аппарат тезланишини қўллаб-қувватламайди. Илтимос, видеокарта драйверини янгиланг ёки браузер созламаларида аппарат тезланишини ёқинг."
      : "Qurilmangiz yoki brauzeringiz WebGL apparat tezlanishini qo'llab-quvvatlamaydi. Iltimos, videokarta drayverini yangilang yoki brauzer sozlamalarida apparat tezlanishini yoqing.";

  const buttonText =
    lang === "ru" ? "Повторить попытку" : lang === "uzc" ? "Қайта уриниш" : "Qayta urinish";

  return (
    <Paper p="xl" radius="md" withBorder ta="center" bg="var(--surface)" my="xl">
      <Stack align="center" gap="md">
        <ThemeIcon size={64} radius="xl" color="orange" variant="light">
          <IconAlertTriangle size={36} />
        </ThemeIcon>
        <Title order={3}>{title}</Title>
        <Text c="dimmed" size="sm" style={{ maxWidth: 540 }}>
          {message}
        </Text>
        {onRetry && (
          <Button leftSection={<IconRefresh size={18} />} color="blue" onClick={onRetry}>
            {buttonText}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
