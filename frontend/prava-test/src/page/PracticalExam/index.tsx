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
  Modal,
  ThemeIcon,
} from "@mantine/core";
import {
  IconSteeringWheel,
  IconAlertOctagon,
  IconChecklist,
  IconAlertTriangle,
  IconRefresh,
  IconDeviceGamepad2,
  IconPlayerPlay,
  IconAward,
  IconCompass,
  IconVolume,
} from "@tabler/icons-react";
import {
  curriculumApi,
  type PracticalExercise,
  type PracticalPenalty,
} from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import SEO from "../../components/common/SEO";

export default function PracticalExam_Page() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { t } = useTranslation();

  const [exercises, setExercises] = useState<PracticalExercise[]>([]);
  const [penalties, setPenalties] = useState<PracticalPenalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"training" | "practice" | "exam">("training");

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
        setError(t("curriculum.loadPracticalError", "Amaliy imtihon ma'lumotlarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring."));
        setExercises([]);
        setPenalties([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

interface ExerciseFallback {
  number: number;
  title: { uzl: string; uzc: string; ru: string };
  description: { uzl: string; uzc: string; ru: string };
}

const PRACTICAL_EXERCISES_FALLBACK: ExerciseFallback[] = [
  {
    number: 1,
    title: {
      uzl: "Harakatni boshlash (START)",
      uzc: "Ҳаракатни бошлаш (СТАРТ)",
      ru: "Начало движения (СТАРТ)",
    },
    description: {
      uzl: "Start chizig'ida to'xtab, chapga burilish chirog'ini yoqib harakatni boshlash.",
      uzc: "Старт чизиғида тўхтаб, чапга бурилиш чироғини ёқиб ҳаракатни бошлаш.",
      ru: "Остановиться у линии старта, включить левый указатель поворота и начать движение.",
    },
  },
  {
    number: 2,
    title: {
      uzl: "Piyodalar o'tish joyi",
      uzc: "Пиёдалар ўтиш жойи",
      ru: "Пешеходный переход",
    },
    description: {
      uzl: "Piyodalar o'tish joyi oldida piyodaga yo'l berish va to'xtash.",
      uzc: "Пиёдалар ўтиш жойи олдида пиёдага йўл бериш ва тўхташ.",
      ru: "Уступить дорогу пешеходу перед пешеходным переходом и остановиться.",
    },
  },
  {
    number: 3,
    title: {
      uzl: "To'xtash va tik balandlikka ko'tarilish (Estakada)",
      uzc: "Тўхташ ва тик баландликка кўтарилиш (Эстакада)",
      ru: "Остановка и трогание на подъёме (Эстакада)",
    },
    description: {
      uzl: "Estakadada to'xtash, orqaga 20 sm dan ortiq ketmasdan siljish.",
      uzc: "Эстакадада тўхташ, орқага 20 см дан ортиқ кетмасдан силжиш.",
      ru: "Остановка на эстакаде (подъеме), начало движения без отката назад более чем на 20 см.",
    },
  },
  {
    number: 4,
    title: {
      uzl: "90 gradus burchak ostida burilishlar",
      uzc: "90 градус бурчак остида бурилишлар",
      ru: "Повороты под углом 90 градусов",
    },
    description: {
      uzl: "90 gradus burchak ostida o'ng va chap tomonga aniq burilish.",
      uzc: "90 градус бурчак остида ўнг ва чап томонга аниқ бурилиш.",
      ru: "Повороты под углом 90 градусов направо и налево без заезда на ограничители.",
    },
  },
  {
    number: 5,
    title: {
      uzl: "Ilon izi",
      uzc: "Илон изи",
      ru: "Змейка",
    },
    description: {
      uzl: "Konuslarni urmasdan ilon izi bo'ylab ravon o'tish.",
      uzc: "Конусларни урмасдан илон изи бўйлаб равон ўтиш.",
      ru: "Плавное прохождение «змейки» без сбивания конусов и наезда на линии разметки.",
    },
  },
  {
    number: 6,
    title: {
      uzl: "Harakat tartibga solingan chorraha",
      uzc: "Ҳаракат тартибга солинган чорраҳа",
      ru: "Регулируемый перекрёсток",
    },
    description: {
      uzl: "Svetoforning ruxsat etuvchi ishorasida chorrahani kesib o'tish.",
      uzc: "Светофорнинг рухсат этувчи ишорасида чорраҳани кесиб ўтиш.",
      ru: "Проезд регулируемого перекрестка на разрешающий сигнал светофора.",
    },
  },
  {
    number: 7,
    title: {
      uzl: "Tor joyda qayrilib olish uchun boksga kirish",
      uzc: "Тор жойда қайрилиб олиш учун боксга кириш",
      ru: "Въезд в бокс для разворота в ограниченном пространстве",
    },
    description: {
      uzl: "Tor maydonda 90 gradus burchak ostida orqaga burilib boksga kirish.",
      uzc: "Тор майдонда 90 градус бурчак остида орқага бурилиб боксга кириш.",
      ru: "Въезд в бокс (гараж) задним ходом под углом 90 градусов в ограниченном пространстве.",
    },
  },
  {
    number: 8,
    title: {
      uzl: "Temir yo'l kesishmasi (tartibga solinmagan)",
      uzc: "Темир йўл кесишмаси (тартибга солинмаган)",
      ru: "Железнодорожный переезд (нерегулируемый)",
    },
    description: {
      uzl: "Temir yo'l kesishmasi to'xtash chizig'ida to'xtab, yo'l bo'shligiga ishonch hosil qilish.",
      uzc: "Темир йўл кесишмаси тўхташ чизиғида тўхтаб, йўл бўшлигига ишонч ҳосил қилиш.",
      ru: "Остановка перед стоп-линией железнодорожного переезда, оценка безопасности и возобновление движения.",
    },
  },
  {
    number: 9,
    title: {
      uzl: "Tezlashish bo'lagi",
      uzc: "Тезлашиш бўлаги",
      ru: "Участок разгона",
    },
    description: {
      uzl: "Tezlanish yo'lagida 30-40 km/soatgacha tezlanib, uzatmani almashtirish.",
      uzc: "Тезланиш йўлагида 30-40 км/соатгача тезланиб, узатмани алмаштириш.",
      ru: "Разгон на полосе разгона до 30-40 км/ч с переключением передачи и своевременным торможением.",
    },
  },
  {
    number: 10,
    title: {
      uzl: "Avariya holatda to'xtash",
      uzc: "Авария ҳолатда тўхташ",
      ru: "Аварийная остановка",
    },
    description: {
      uzl: "Avariya chiroqlarini yoqib, shoshilinch to'xtashni amalga oshirish.",
      uzc: "Авария чироқларини ёқиб, шошилинч тўхташни амалга ошириш.",
      ru: "Экстренное торможение с включением аварийной световой сигнализации.",
    },
  },
  {
    number: 11,
    title: {
      uzl: "Orqaga harakatlanib parallel to'xtash (Parkovka)",
      uzc: "Орқага ҳаракатланиб параллел тўхташ (Парковка)",
      ru: "Параллельная парковка задним ходом",
    },
    description: {
      uzl: "Ikki avtomobil orasiga orqa uzatma bilan parallel parkovka qilish.",
      uzc: "Икки автомобиль орасига орқа узатма билан параллел парковка қилиш.",
      ru: "Параллельная парковка задним ходом между двумя транспортными средствами.",
    },
  },
  {
    number: 12,
    title: {
      uzl: "Harakatni yakunlash (FINISH)",
      uzc: "Ҳаракатни якунлаш (ФИНИШ)",
      ru: "Завершение движения (ФИНИШ)",
    },
    description: {
      uzl: "Finish chizig'ida to'xtab, to'xtab turish tormozini (ruchnik) tortish va dvigatelni o'chirish.",
      uzc: "Финиш чизиғида тўхтаб, тўхтаб туриш тормозини (ручник) тортиш ва двигателни ўчириш.",
      ru: "Остановка у линии финиша, включение стояночного тормоза и выключение двигателя.",
    },
  },
];

  const safeExercises = useMemo(() => (Array.isArray(exercises) && exercises.length > 0 ? exercises : PRACTICAL_EXERCISES_FALLBACK.map((f) => ({
    id: f.number,
    exercise_number: f.number,
    title_uzl: f.title.uzl,
    title_uzc: f.title.uzc,
    title_ru: f.title.ru,
    description_uzl: f.description.uzl,
    description_uzc: f.description.uzc,
    description_ru: f.description.ru,
  }))), [exercises]);
  const safePenalties = useMemo(() => (Array.isArray(penalties) ? penalties : []), [penalties]);

  const getLocalizedTitle = (e: PracticalExercise) => {
    const fallback = PRACTICAL_EXERCISES_FALLBACK.find((x) => x.number === e.exercise_number);
    if (lang === "ru") return e.title_ru || fallback?.title.ru || e.title_uzl || "";
    if (lang === "uzc") return e.title_uzc || fallback?.title.uzc || e.title_uzl || "";
    return e.title_uzl || fallback?.title.uzl || "";
  };

  const getLocalizedDesc = (e: PracticalExercise) => {
    const fallback = PRACTICAL_EXERCISES_FALLBACK.find((x) => x.number === e.exercise_number);
    if (lang === "ru") return e.description_ru || fallback?.description.ru || "";
    if (lang === "uzc") return e.description_uzc || fallback?.description.uzc || "";
    return e.description_uzl || fallback?.description.uzl || "";
  };

  const getLocalizedPenalty = (p: PracticalPenalty) => {
    if (lang === "ru" && p.text_ru) return p.text_ru;
    if (lang === "uzc" && p.text_uzc) return p.text_uzc;
    return p.text_uzl || "";
  };

  const getSeverityBadge = (points: number) => {
    const ballLabel = t("curriculum.ball", "ball");
    if (points >= 100) {
      return (
        <Badge color="red" variant="filled">
          {t("curriculum.severityMajor", "Imtihondan yiqitish")} (100 {ballLabel})
        </Badge>
      );
    }
    if (points >= 20) {
      return (
        <Badge color="orange" variant="filled">
          {t("curriculum.severityMedium", "Qo'pol")} ({points} {ballLabel})
        </Badge>
      );
    }
    return (
      <Badge color="yellow" variant="light">
        {t("curriculum.severityMinor", "Kichik")} ({points} {ballLabel})
      </Badge>
    );
  };

  return (
    <Container size="xl" py="xl">
      <SEO
        title={t("seo.practical.title", "Avtodrom Amaliy Imtihoni — 12 ta Mashq va Jarima Ballari")}
        description={t("seo.practical.desc", "Haydovchilik guvohnomasi uchun avtodrom amaliy imtihonining 12 ta mashqi, bajarish ketma-ketligi va 32 ta jarima ballari nizomi.")}
      />

      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
              {t("curriculum.autodromTitle")}
            </Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t("curriculum.autodromSubtitle")}
            </Text>
          </div>
          <Badge size="lg" variant="filled" color="teal" leftSection={<IconSteeringWheel size={14} />}>
            {safeExercises.length} / {safePenalties.length}
          </Badge>
        </Group>

        {/* Error State with Retry Button */}
        {error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title={t("common.error")}
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
                {t("common.refresh")}
              </Button>
            </Group>
          </Alert>
        )}

        {/* Avtodrom 3D Simulator Interactive Banner */}
        <Paper
          p="xl"
          radius="lg"
          withBorder
          style={{
            background: "linear-gradient(135deg, rgba(24, 100, 171, 0.08) 0%, rgba(12, 133, 153, 0.12) 100%)",
            borderColor: "rgba(24, 100, 171, 0.25)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="lg">
            <Stack gap="xs" style={{ maxWidth: 680 }}>
              <Group gap="xs">
                <Badge
                  color="cyan"
                  variant="filled"
                  size="md"
                  leftSection={<IconDeviceGamepad2 size={14} />}
                >
                  {t("curriculum.simulatorBadge", "3D WebGL Simulyator")}
                </Badge>
                <Badge color="green" variant="light" size="md">
                  12 ta Mashq • 60 FPS
                </Badge>
              </Group>
              <Title order={3} fw={800}>
                {t("curriculum.simulatorTitle", "Avtodrom 3D Simulyatori")}
              </Title>
              <Text size="sm" c="dimmed">
                {t(
                  "curriculum.simulatorDesc",
                  "YHXX Davlat imtihon markazi standartidagi 12 ta amaliy mashqni interaktiv 3D WebGL simulyatorida real fizika va ovozli instruktor bilan mashq qiling!"
                )}
              </Text>
              <Group gap="xs" mt="xs">
                <Badge variant="outline" color="blue" size="sm">
                  {t("curriculum.modeTraining", "O'rganish (Training)")}
                </Badge>
                <Badge variant="outline" color="cyan" size="sm">
                  {t("curriculum.modePractice", "Mashq (Practice)")}
                </Badge>
                <Badge variant="outline" color="orange" size="sm">
                  {t("curriculum.modeExam", "Real Imtihon (Exam 100 ball)")}
                </Badge>
              </Group>
            </Stack>

            <Button
              size="lg"
              radius="md"
              color="blue"
              leftSection={<IconPlayerPlay size={20} />}
              onClick={() => setSimulatorOpen(true)}
              style={{
                boxShadow: "0 8px 20px rgba(24, 100, 171, 0.3)",
              }}
            >
              {t("curriculum.startSimulator", "Simulyatorni boshlash")}
            </Button>
          </Group>
        </Paper>

        <Tabs defaultValue="exercises">
          <Tabs.List mb="lg">
            <Tabs.Tab value="exercises" leftSection={<IconChecklist size={16} />} style={{ fontWeight: 600 }}>
              {t("curriculum.tabExercises")}
            </Tabs.Tab>
            <Tabs.Tab value="penalties" leftSection={<IconAlertOctagon size={16} />} style={{ fontWeight: 600 }}>
              {t("curriculum.tabPenalties")}
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
                  <Text c="dimmed">{t("curriculum.emptyExercises", "Amaliy mashqlar topilmadi")}</Text>
                  <Button size="xs" variant="subtle" onClick={fetchData}>
                    {t("common.refresh")}
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
                        {t("curriculum.colNumber")} {ex.exercise_number}
                      </Text>
                    </Group>

                    <Title order={4} fw={700} mt="xs" mb="sm">
                      {getLocalizedTitle(ex)}
                    </Title>

                    <Text size="sm" c="dimmed" lineClamp={3}>
                      {getLocalizedDesc(ex)}
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
                  <Text c="dimmed">{t("curriculum.emptyPenalties")}</Text>
                  <Button size="xs" variant="subtle" onClick={fetchData}>
                    {t("common.refresh")}
                  </Button>
                </Stack>
              </Center>
            ) : (
              <Paper withBorder radius="md" p="md">
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 60 }}>{t("curriculum.colNumber")}</Table.Th>
                      <Table.Th>{t("curriculum.colViolation")}</Table.Th>
                      <Table.Th style={{ width: 220 }}>{t("curriculum.colPoints")}</Table.Th>
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

      {/* Avtodrom 3D Simulator Launcher Modal */}
      <Modal
        opened={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="blue" size="lg" radius="md">
              <IconSteeringWheel size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="md">
                {t("curriculum.simulatorTitle", "Avtodrom 3D Simulyatori")}
              </Text>
              <Text size="xs" c="dimmed">
                v2.0 • WebGL & Rapier 3D Physics
              </Text>
            </div>
          </Group>
        }
        size="lg"
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            {t(
              "curriculum.simulatorDesc",
              "YHXX Davlat imtihon markazi standartidagi 12 ta amaliy mashqni interaktiv 3D WebGL simulyatorida real fizika va ovozli instruktor bilan mashq qiling!"
            )}
          </Text>

          <Paper p="md" radius="md" withBorder bg="var(--surface)">
            <Text fw={600} size="sm" mb="xs">
              Rejimni tanlang:
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xs">
              <Card
                padding="sm"
                radius="sm"
                withBorder
                style={{
                  cursor: "pointer",
                  borderColor: selectedMode === "training" ? "var(--mantine-color-blue-6)" : undefined,
                  backgroundColor: selectedMode === "training" ? "rgba(24, 100, 171, 0.08)" : undefined,
                }}
                onClick={() => setSelectedMode("training")}
              >
                <Group gap="xs" mb={4}>
                  <ThemeIcon size="sm" color="blue" variant="light">
                    <IconCompass size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="xs">
                    Training
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Yo'naltiruvchi chiziqlar va ovozli instruktor
                </Text>
              </Card>

              <Card
                padding="sm"
                radius="sm"
                withBorder
                style={{
                  cursor: "pointer",
                  borderColor: selectedMode === "practice" ? "var(--mantine-color-cyan-6)" : undefined,
                  backgroundColor: selectedMode === "practice" ? "rgba(12, 133, 153, 0.08)" : undefined,
                }}
                onClick={() => setSelectedMode("practice")}
              >
                <Group gap="xs" mb={4}>
                  <ThemeIcon size="sm" color="cyan" variant="light">
                    <IconRefresh size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="xs">
                    Practice
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  Alohida tanlangan mashqni cheksiz takrorlash
                </Text>
              </Card>

              <Card
                padding="sm"
                radius="sm"
                withBorder
                style={{
                  cursor: "pointer",
                  borderColor: selectedMode === "exam" ? "var(--mantine-color-orange-6)" : undefined,
                  backgroundColor: selectedMode === "exam" ? "rgba(232, 89, 12, 0.08)" : undefined,
                }}
                onClick={() => setSelectedMode("exam")}
              >
                <Group gap="xs" mb={4}>
                  <ThemeIcon size="sm" color="orange" variant="light">
                    <IconAward size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="xs">
                    Real Imtihon
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  12 ta mashq ketma-ket, 100 ballik qat'iy nazorat
                </Text>
              </Card>
            </SimpleGrid>
          </Paper>

          <Paper p="md" radius="md" withBorder bg="var(--surface)">
            <Text fw={600} size="sm" mb="xs">
              Boshqaruv tugmalari (Klaviatura):
            </Text>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
              <Paper p="xs" radius="sm" withBorder ta="center">
                <Badge size="sm" variant="outline">W / ↑</Badge>
                <Text size="xs" mt={4} c="dimmed">Gaz (Tezlanish)</Text>
              </Paper>
              <Paper p="xs" radius="sm" withBorder ta="center">
                <Badge size="sm" variant="outline">S / ↓</Badge>
                <Text size="xs" mt={4} c="dimmed">Tormoz / Orqaga</Text>
              </Paper>
              <Paper p="xs" radius="sm" withBorder ta="center">
                <Badge size="sm" variant="outline">A / D / ← →</Badge>
                <Text size="xs" mt={4} c="dimmed">Rul burilishi</Text>
              </Paper>
              <Paper p="xs" radius="sm" withBorder ta="center">
                <Badge size="sm" variant="outline">SPACE</Badge>
                <Text size="xs" mt={4} c="dimmed">Qo'l tormozi</Text>
              </Paper>
            </SimpleGrid>
          </Paper>

          <Group justify="space-between" align="center" mt="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" color="teal" variant="light">
                <IconVolume size={14} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">
                Ovozli instruktor: O'zbekcha / Kirill / Ruscha
              </Text>
            </Group>
            <Button
              color="blue"
              size="md"
              leftSection={<IconPlayerPlay size={18} />}
              onClick={() => {
                setSimulatorOpen(false);
                navigate(`/practical-exam/simulator?mode=${selectedMode}`);
              }}
            >
              Mashqni boshlash ({selectedMode.toUpperCase()})
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
