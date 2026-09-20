import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Stack,
  Center,
  TextInput,
  ActionIcon,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import { IconGavel, IconSearch, IconX, IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { curriculumApi, type PracticalPenalty } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";

export default function Penalties_Page() {
  const { lang } = useLanguage();

  const [penalties, setPenalties] = useState<PracticalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchPenalties = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getPenalties()
      .then((data) => {
        setPenalties(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load penalties:", err);
        setError("Jarimalar ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setPenalties([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPenalties();
  }, [fetchPenalties]);

  const safePenalties = useMemo(() => (Array.isArray(penalties) ? penalties : []), [penalties]);

  const getLocalizedText = (p: PracticalPenalty) => {
    if (lang === "ru" && p.text_ru) return p.text_ru;
    if (lang === "uzc" && p.text_uzc) return p.text_uzc;
    return p.text_uzl || "";
  };

  const filtered = useMemo(() => {
    return safePenalties.filter((p) => {
      if (!p) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        getLocalizedText(p).toLowerCase().includes(q) ||
        (p.penalty_number != null && p.penalty_number.toString().includes(q))
      );
    });
  }, [safePenalties, search, lang]);

  return (
    <Container size="xl" py="xl">
      <SEO
        title="Jarimalar va Qoidabuzarliklar — Rasmiy Imtihon va YHQ Nizomi"
        description="Imtihondagi jarima ballari va yo'l harakati qoidabuzarliklari bo'yicha to'liq ma'lumotlar jadvali."
      />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              Jarimalar va Qoidabuzarliklar
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              Davlat imtihonida belgilangan 32 ta asosiy jarima ballari nizomi
            </Text>
          </div>
          <Badge size="lg" variant="filled" color="red" leftSection={<IconGavel size={14} />}>
            {filtered.length} ta qoida
          </Badge>
        </Group>

        <TextInput
          placeholder="Qoidabuzarlik turi bo'yicha qidiring..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          leftSection={<IconSearch size={18} />}
          rightSection={
            search ? (
              <ActionIcon variant="subtle" color="gray" onClick={() => setSearch("")} aria-label="Tozalash">
                <IconX size={16} />
              </ActionIcon>
            ) : null
          }
          size="md"
          radius="md"
        />

        {/* Error State with Retry Button */}
        {error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title="Xatolik"
            color="red"
            variant="light"
            radius="md"
          >
            <Group justify="space-between" align="center">
              <Text size="sm">{error}</Text>
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconRefresh size={14} />}
                onClick={fetchPenalties}
              >
                Qayta yuklash
              </Button>
            </Group>
          </Alert>
        )}

        {loading ? (
          <Stack gap="xs">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} height={42} radius="sm" />
            ))}
          </Stack>
        ) : filtered.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed">Mos keluvchi jarimalar topilmadi</Text>
              {search && (
                <Button size="xs" variant="subtle" onClick={() => setSearch("")}>
                  Qidiruvni tozalash
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <Paper withBorder radius="md" p="md">
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60 }}>#</Table.Th>
                  <Table.Th>Qoidabuzarlik holati</Table.Th>
                  <Table.Th style={{ width: 220 }}>Jarima balli</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((p) => (
                  <Table.Tr key={p.id}>
                    <Table.Td fw={700}>{p.penalty_number}</Table.Td>
                    <Table.Td style={{ fontSize: "0.95rem" }}>{getLocalizedText(p)}</Table.Td>
                    <Table.Td>
                      {p.points >= 100 ? (
                        <Badge color="red" variant="filled">
                          Yiqitish (100 ball)
                        </Badge>
                      ) : p.points >= 20 ? (
                        <Badge color="orange" variant="filled">
                          {p.points} ball
                        </Badge>
                      ) : (
                        <Badge color="yellow" variant="light">
                          {p.points} ball
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
