import { Paper, Stack, Group, Text, Badge } from "@mantine/core";
import { useLanguage } from "../../../context/LanguageContext";

export default function FloatingControlsTiles() {
  const { lang } = useLanguage();

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
          {lang === "ru" ? "УПРАВЛЕНИЕ" : "BOSHQARUV"}
        </Text>
        <Stack gap={4}>
          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                W
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Газ" : "Gaz"}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                S
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Тормоз" : "Tormoz"}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                A
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Влево" : "Chapga"}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                D
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Вправо" : "O'ngga"}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "36px", padding: "0 4px" }}>
                Space
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Ручник" : "Ruchnik"}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                R
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Задний" : "Orqaga"}
              </Text>
            </Group>
          </Group>

          <Group justify="space-between" gap="xs">
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                Q
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Лев. повор." : "Chap signal"}
              </Text>
            </Group>
            <Group gap={4}>
              <Badge size="xs" variant="filled" color="dark" style={{ minWidth: "22px", padding: "0 4px" }}>
                E
              </Badge>
              <Text size="10px" c="white" fw={600}>
                {lang === "ru" ? "Прав. повор." : "O'ng signal"}
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
          {lang === "ru" ? "СТАТИСТИКА" : "STATISTIKA"}
        </Text>
        <Stack gap={4}>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="teal" style={{ minWidth: "20px", padding: "0 4px" }}>
              I
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {lang === "ru" ? "Запуск" : "Zavod"}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              B
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {lang === "ru" ? "Ремень" : "Kamar"}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              L
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {lang === "ru" ? "Фары" : "Chiroqlar"}
            </Text>
          </Group>
          <Group gap={6}>
            <Badge size="xs" variant="filled" color="blue" style={{ minWidth: "20px", padding: "0 4px" }}>
              C
            </Badge>
            <Text size="10px" c="#e2e8f0" fw={600}>
              {lang === "ru" ? "Камера" : "Kamera"}
            </Text>
          </Group>
        </Stack>
      </Paper>
    </Group>
  );
}
