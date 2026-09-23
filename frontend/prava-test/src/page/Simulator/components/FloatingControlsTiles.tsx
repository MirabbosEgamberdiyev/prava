import { Paper, Stack, Group, Text, Badge } from "@mantine/core";
import { useLanguage } from "../../../context/LanguageContext";

export default function FloatingControlsTiles() {
  const { lang } = useLanguage();

  const t3 = (uzl: string, uzc: string, ru: string) => {
    if (lang === "ru") return ru;
    if (lang === "uzc") return uzc;
    return uzl;
  };

  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      {/* Tile 1: Kamera & Boshqaruv Controls */}
      <Paper
        radius="md"
        withBorder
        p="xs"
        style={{
          pointerEvents: "auto",
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(255, 255, 255, 0.14)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          minWidth: "160px",
        }}
      >
        <Text size="10px" fw={800} c="#94a3b8" mb={6} style={{ letterSpacing: "0.5px" }}>
          {t3("BOSHQARUV", "БОШҚАРУВ", "УПРАВЛЕНИЕ")}
        </Text>
        <Stack gap={4}>
          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                W
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Gaz", "Газ", "Газ")}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                S
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Tormoz", "Тормоз", "Тормоз")}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                A
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Chapga", "Чапга", "Влево")}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                D
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("O'ngga", "Ўнгга", "Вправо")}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "36px", padding: "0 4px" }}>
                Space
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Ruchnik", "Ручник", "Ручник")}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                R
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Orqaga", "Орқага", "Задний")}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                Q
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("Chap signal", "Чап сигнал", "Лев. повор.")}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                E
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {t3("O'ng signal", "Ўнг сигнал", "Прав. повор.")}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Paper>

      {/* Tile 2: Statistika / Key Shortcuts Indicator */}
      <Paper
        radius="md"
        withBorder
        p="xs"
        style={{
          pointerEvents: "auto",
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(255, 255, 255, 0.14)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          minWidth: "120px",
        }}
      >
        <Text size="10px" fw={800} c="#94a3b8" mb={6} style={{ letterSpacing: "0.5px" }}>
          {t3("BOSHQARUV TUGMALARI", "БОШҚАРУВ ТУГМАЛАРИ", "СТАТИСТИКА")}
        </Text>
        <Stack gap={4}>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="teal" style={{ minWidth: "20px", padding: "0 4px" }}>
              I
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {t3("Zavod", "Завод", "Запуск")}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              B
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {t3("Kamar", "Камар", "Ремень")}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              L
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {t3("Chiroqlar", "Чироқлар", "Фары")}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              C
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {t3("Kamera", "Камера", "Камера")}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Group>
  );
}
