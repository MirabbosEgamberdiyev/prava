import { Container, Title, Text, Button, Group, Stack, Paper, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconHome, IconArrowLeft } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container size="md" py={80}>
      <Paper radius="md" p="xl" withBorder shadow="sm">
        <Stack align="center" gap="lg" py={40}>
          <ThemeIcon size={80} radius="xl" color="red" variant="light">
            <IconAlertTriangle size={48} stroke={1.5} />
          </ThemeIcon>

          <Title order={1} fz={{ base: 32, sm: 48 }} ta="center" fw={900}>
            404
          </Title>

          <Title order={2} fz={{ base: 20, sm: 24 }} ta="center" fw={700}>
            {t("notFound.title", "Sahifa topilmadi")}
          </Title>

          <Text c="dimmed" size="md" ta="center" maw={520}>
            {t(
              "notFound.description",
              "Siz qidirayotgan sahifa mavjud emas, nomi o'zgartirilgan yoki unga kirish uchun ruxsat berilmagan."
            )}
          </Text>

          <Group gap="md" mt="md" wrap="wrap" justify="center">
            <Button
              variant="default"
              size="md"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
            >
              {t("notFound.back", "Orqaga qaytish")}
            </Button>
            <Button
              variant="filled"
              color="blue"
              size="md"
              leftSection={<IconHome size={18} />}
              onClick={() => navigate("/")}
            >
              {t("notFound.home", "Bosh sahifaga o'tish")}
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
