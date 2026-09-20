import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  Tabs,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Center,
  Table,
  Paper,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconAlertOctagon,
  IconChecklist,
  IconAlertTriangle,
  IconRefresh,
} from "@tabler/icons-react";
import {
  curriculumApi,
  type PracticalExercise,
  type PracticalPenalty,
} from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";

export default function PracticalExam_Page() {
  const { lang } = useLanguage();

  const [exercises, setExercises] = useState<PracticalExercise[]>([]);
  const [penalties, setPenalties] = useState<PracticalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getPracticalExam()
      .then((data) => {
        setExercises(Array.isArray(data?.exercises) ? data.exercises : []);
        setPenalties(Array.isArray(data?.penalties) ? data.penalties : []);
      })
      .catch((err) => {
        console.error("Failed to load practical exam data:", err);
        setError("Amaliy imtihon ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setExercises([]);
        setPenalties([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const safeExercises = useMemo(() => (Array.isArray(exercises) ? exercises : []), [exercises]);
  const safePenalties = useMemo(() => (Array.isArray(penalties) ? penalties : []), [penalties]);

  const getLocalizedTitle = (e: PracticalExercise) => {
    if (lang === "ru" && e.title_ru) return e.title_ru;
    if (lang === "uzc" && e.title_uzc) return e.title_uzc;
    return e.title_uzl || "";
  };

  const getLocalizedPenalty = (p: PracticalPenalty) => {
    if (lang === "ru" && p.text_ru) return p.text_ru;
    if (lang === "uzc" && p.text_uzc) return p.text_uzc;
    return p.text_uzl || "";
  };

  const getSeverityBadge = (points: number) => {
    if (points >= 100) return <Badge color="red" variant="filled">Imtihondan yiqitish (100 ball)</Badge>;
    if (points >= 20) return <Badge color="orange" variant="filled">Qo'pol ({points} ball)</Badge>;
    return <Badge color="yellow" variant="light">Kichik ({points} ball)</Badge>;
  };

  return (
    <Container size="xl" py="xl">
      <SEO
        title="Avtodrom Amaliy Imtihoni — 12 ta Mashq va Jarima Ballari"
        description="Haydovchilik guvohnomasi uchun avtodrom amaliy imtihonining 12 ta mashqi, bajarish ketma-ketligi va 32 ta jarima ballari nizomi."
      />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              Avtodrom Amaliy Imtihoni
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              12 ta majburiy avtodrom mashqlari va 32 ta rasmiy jarima ballari tizimi
            </Text>
          </div>
          <Badge size="lg" variant="filled" color="teal" leftSection={<IconSteeringWheel size={14} />}>
            {safeExercises.length} mashq / {safePenalties.length} jarima
          </Badge>
        </Group>

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
                onClick={fetchData}
              >
                Qayta yuklash
              </Button>
            </Group>
          </Alert>
        )}

        <Tabs defaultValue="exercises">
          <Tabs.List mb="lg">
            <Tabs.Tab value="exercises" leftSection={<IconChecklist size={16} />} style={{ fontWeight: 600 }}>
              12 ta Mashq (Avtodrom)
            </Tabs.Tab>
            <Tabs.Tab value="penalties" leftSection={<IconAlertOctagon size={16} />} style={{ fontWeight: 600 }}>
              32 ta Jarima Ballari
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="exercises">
            {loading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Card key={idx} shadow="sm" padding="lg" radius="md" withBorder>
                    <Skeleton height={28} width={28} circle mb="sm" />
                    <Skeleton height={20} width="70%" mb="xs" />
                    <Skeleton height={14} width="95%" mb="xs" />
                    <Skeleton height={14} width="80%" />
                  </Card>
                ))}
              </SimpleGrid>
            ) : safeExercises.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="xs">
                  <IconAlertTriangle size={40} color="gray" />
                  <Text c="dimmed">Mashqlar topilmadi</Text>
                  <Button size="xs" variant="subtle" onClick={fetchData}>
                    Qayta yuklash
                  </Button>
                </Stack>
              </Center>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                {safeExercises.map((ex) => (
                  <Card key={ex.id} shadow="sm" padding="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Badge color="blue" size="lg" circle>
                        {ex.exercise_number}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        Mashq #{ex.exercise_number}
                      </Text>
                    </Group>

                    <Title order={4} fw={700} mt="xs" mb="sm">
                      {getLocalizedTitle(ex)}
                    </Title>

                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {ex.exercise_number === 1 && "Start chizig'ida to'xtab, chapga burilish chirog'ini yoqib harakatni boshlash."}
                      {ex.exercise_number === 2 && "Piyodalar o'tish joyi oldida piyodaga yo'l berish va to'xtash."}
                      {ex.exercise_number === 3 && "Estakadada to'xtash, orqaga 20 sm dan ortiq ketmasdan siljish."}
                      {ex.exercise_number === 4 && "90 gradus burchak ostida o'ng va chap tomonga aniq burilish."}
                      {ex.exercise_number === 5 && "Konuslarni urmasdan ilon izi bo'ylab ravon o'tish."}
                      {ex.exercise_number === 6 && "Svetoforning ruxsat etuvchi ishorasida chorrahani kesib o'tish."}
                      {ex.exercise_number === 7 && "Tor maydonda 90 gradus burchak ostida orqaga burilib boksga kirish."}
                      {ex.exercise_number === 8 && "Temir yo'l kesishmasi to'xtash chizig'ida to'xtab, yo'l bo'shligiga ishonch hosil qilish."}
                      {ex.exercise_number === 9 && "Tezlanish yo'lagida 30-40 km/soatgacha tezlanib, uzatmani almashtirish."}
                      {ex.exercise_number === 10 && "Avariya chiroqlarini yoqib, shoshilinch to'xtashni amalga oshirish."}
                      {ex.exercise_number === 11 && "Ikki avtomobil orasiga orqa uzatma bilan parallel parkovka qilish."}
                      {ex.exercise_number === 12 && "Finish chizig'ida to'xtab, to'xtab turish tormozini (ruchnik) tortish va dvigatelni o'chirish."}
                    </Text>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="penalties">
            {loading ? (
              <Stack gap="xs">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <Skeleton key={idx} height={40} radius="sm" />
                ))}
              </Stack>
            ) : safePenalties.length === 0 ? (
              <Center py={60}>
                <Stack align="center" gap="xs">
                  <IconAlertTriangle size={40} color="gray" />
                  <Text c="dimmed">Jarima ma'lumotlari topilmadi</Text>
                  <Button size="xs" variant="subtle" onClick={fetchData}>
                    Qayta yuklash
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Paper withBorder radius="md" p="md">
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 60 }}>#</Table.Th>
                      <Table.Th>Qoidabuzarlik tavsifi</Table.Th>
                      <Table.Th style={{ width: 220 }}>Jarima bali</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {safePenalties.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td fw={700}>{p.penalty_number}</Table.Td>
                        <Table.Td style={{ fontSize: "0.95rem" }}>
                          {getLocalizedPenalty(p)}
                        </Table.Td>
                        <Table.Td>{getSeverityBadge(p.points)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
