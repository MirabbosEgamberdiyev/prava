import { useState, useEffect } from "react";
import {
  Title,
  Text,
  Stack,
  Group,
  SimpleGrid,
  Card,
  Badge,
  Button,
  Tabs,
  Table,
  Switch,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  ThemeIcon,
  Paper,
  Box,
} from "@mantine/core";
import {
  IconDeviceGamepad2,
  IconRefresh,
  IconCheck,
  IconX,
  IconEdit,
  IconSteeringWheel,
  IconAlertTriangle,
  IconCar,
  IconHistory,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import api from "../../services/api";

interface AdminExerciseConfig {
  id: number;
  exerciseNumber: number;
  code: string;
  titleUzl: string;
  titleUzc: string;
  titleRu: string;
  timeLimitSeconds: number;
  maxPenaltyPoints: number;
  minSpeedKmh: number;
  maxSpeedKmh: number;
  isActive: boolean;
}

interface AdminPenaltyRule {
  id: number;
  ruleCode: string;
  points: number;
  severity: "MINOR" | "MEDIUM" | "MAJOR" | "CRITICAL";
  isInstantFail: boolean;
  descUzl: string;
  descUzc: string;
  descRu: string;
}

interface AdminVehicleConfig {
  id: number;
  modelName: string;
  brand: string;
  maxSpeedKmh: number;
  acceleration: number;
  braking: number;
  maxSteerAngleDeg: number;
  isActive: boolean;
}

interface AdminSimulatorSession {
  id: string;
  userPhone: string;
  mode: string;
  vehicleModel: string;
  totalPenaltyPoints: number;
  timeSpentSeconds: number;
  isPassed: boolean;
  status: string;
  createdAt: string;
}

const DEFAULT_EXERCISES: AdminExerciseConfig[] = [
  { id: 1, exerciseNumber: 1, code: "START_ZONE", titleUzl: "Boshlang'ich hudud va xavfsizlik kamarini taqish", titleUzc: "Бошланғич ҳудуд ва хавфсизлик камарини тақиш", titleRu: "Стартовая зона и пристегивание ремня", timeLimitSeconds: 60, maxPenaltyPoints: 20, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 2, exerciseNumber: 2, code: "PEDESTRIAN_CROSSING", titleUzl: "Piyodalar o'tish joyi va to'xtash", titleUzc: "Пиёдалар ўтиш жойи ва тўхташ", titleRu: "Пешеходный переход и остановка", timeLimitSeconds: 60, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 3, exerciseNumber: 3, code: "ESTAKADA_INCLINE", titleUzl: "Estakada (ko'tarilishda to'xtash va orqaga ketmasdan qo'zg'alish)", titleUzc: "Эстакада (кўтарилишда тўхташ ва орқага кетмасдан қўзғалиш)", titleRu: "Эстакада (остановка и трогание на подъеме)", timeLimitSeconds: 120, maxPenaltyPoints: 30, minSpeedKmh: 0, maxSpeedKmh: 15, isActive: true },
  { id: 4, exerciseNumber: 4, code: "CORRIDOR_90", titleUzl: "90 gradusli burilishlar yo'lagi", titleUzc: "90 градусли бурилишлар йўлаги", titleRu: "Повороты на 90 градусов", timeLimitSeconds: 90, maxPenaltyPoints: 20, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 5, exerciseNumber: 5, code: "SLALOM_ZMEYKA", titleUzl: "Ilon izi (Zmeyka / Slalom)", titleUzc: "Илон изи (Змейка / Слалом)", titleRu: "Змейка / Слалом между конусами", timeLimitSeconds: 90, maxPenaltyPoints: 20, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 6, exerciseNumber: 6, code: "INTERSECTION", titleUzl: "Tartibga solinmagan chorraha va aylanma harakat", titleUzc: "Тартибга солинмаган чорраҳа ва айланма ҳаракат", titleRu: "Нерегулируемый перекресток и круговое движение", timeLimitSeconds: 90, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 7, exerciseNumber: 7, code: "GARAGE_90", titleUzl: "Boksga (garajga) 90 gradus orqa bilan kirish", titleUzc: "Боксга (гаражга) 90 градус орқа билан кириш", titleRu: "Въезд в бокс (гараж) задним ходом под 90°", timeLimitSeconds: 120, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 10, isActive: true },
  { id: 8, exerciseNumber: 8, code: "RAILWAY_CROSSING", titleUzl: "Temir yo'l kesishmasi va to'xtash qoidasi", titleUzc: "Темир йўл кесишмаси ва тўхташ қоидаси", titleRu: "Железнодорожный переезд", timeLimitSeconds: 60, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 20, isActive: true },
  { id: 9, exerciseNumber: 9, code: "ACCELERATION_STRIP", titleUzl: "Tezlanish yo'lagi va viteslarni almashtirish", titleUzc: "Тезланиш йўлаги ва узатмаларни алмаштириш", titleRu: "Полоса разгона и переключение передач", timeLimitSeconds: 60, maxPenaltyPoints: 20, minSpeedKmh: 20, maxSpeedKmh: 40, isActive: true },
  { id: 10, exerciseNumber: 10, code: "EMERGENCY_STOP", titleUzl: "Favqulodda to'xtash va avariya chiroqlari", titleUzc: "Фавқулодда тўхташ ва авария чироқлари", titleRu: "Экстренное торможение и аварийная сигнализация", timeLimitSeconds: 60, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 30, isActive: true },
  { id: 11, exerciseNumber: 11, code: "PARALLEL_PARKING", titleUzl: "Parallel parkovka (orqa bilan to'xtash joyiga kirish)", titleUzc: "Параллель парковка (орқа билан тўхташ жойига кириш)", titleRu: "Параллельная парковка задним ходом", timeLimitSeconds: 120, maxPenaltyPoints: 25, minSpeedKmh: 0, maxSpeedKmh: 10, isActive: true },
  { id: 12, exerciseNumber: 12, code: "FINISH_ZONE", titleUzl: "Finish (to'xtash, neytral vites, qo'l tormozi)", titleUzc: "Финиш (тўхташ, нейтрал узатма, қўл тормози)", titleRu: "Финишная зона и постановка на ручной тормоз", timeLimitSeconds: 60, maxPenaltyPoints: 20, minSpeedKmh: 0, maxSpeedKmh: 15, isActive: true },
];

const DEFAULT_PENALTY_RULES: AdminPenaltyRule[] = [
  { id: 1, ruleCode: "UNFASTENED_SEATBELT", points: 20, severity: "MAJOR", isInstantFail: false, descUzl: "Xavfsizlik kamarini taqmasdan harakatlanish", descUzc: "Хавфсизлик камарини тақмасдан ҳаракатланиш", descRu: "Движение с непристегнутым ремнем безопасности" },
  { id: 2, ruleCode: "HANDBRAKE_NOT_RELEASED", points: 10, severity: "MEDIUM", isInstantFail: false, descUzl: "Qo'l tormozini tushirmasdan harakatlanish", descUzc: "Қўл тормозини туширмасдан ҳаракатланиш", descRu: "Движение на включенном стояночном тормозе" },
  { id: 3, ruleCode: "STOP_LINE_VIOLATION", points: 20, severity: "MAJOR", isInstantFail: false, descUzl: "To'xtash (STOP) chizig'ini bosish yoki kesib o'tish", descUzc: "Тўхташ (СТОП) чизиғини босиш ёки кесиб ўтиш", descRu: "Наезд или пересечение стоп-линии" },
  { id: 4, ruleCode: "CONE_COLLISION", points: 15, severity: "MEDIUM", isInstantFail: false, descUzl: "Belgilovchi konus yoki to'siqqa urilish", descUzc: "Белгиловчи конус ёки тўсиққа урилиш", descRu: "Сбивание или касание разметочного конуса" },
  { id: 5, ruleCode: "ESTAKADA_ROLLBACK_EXCEEDED", points: 100, severity: "CRITICAL", isInstantFail: true, descUzl: "Estakadada 20 sm dan ortiq orqaga ketib qolish", descUzc: "Эстакадада 20 см дан ортиқ орқага кетиб қолиш", descRu: "Откат автомобиля на эстакаде более 20 см" },
  { id: 6, ruleCode: "SPEEDING", points: 15, severity: "MEDIUM", isInstantFail: false, descUzl: "Avtodromda ruxsat etilgan tezlikdan oshirish", descUzc: "Автодромда рухсат этилган тезликдан ошириш", descRu: "Превышение установленной скорости на автодроме" },
  { id: 7, ruleCode: "BOUNDARY_CROSSING", points: 100, severity: "CRITICAL", isInstantFail: true, descUzl: "Mashq hududi chegarasidan (yaxlit chiziq) chiqib ketish", descUzc: "Машқ ҳудуди чегарасидан (яхлит чизиқ) чиқиб кетиш", descRu: "Выезд за габариты упражнения (сплошная линия)" },
  { id: 8, ruleCode: "ENGINE_STALL", points: 10, severity: "MINOR", isInstantFail: false, descUzl: "Harakat paytida dvigatelni o'chirib qo'yish", descUzc: "Ҳаракат пайтида двигателни ўчириб қўйиш", descRu: "Остановка двигателя (заглох)" },
  { id: 9, ruleCode: "TIME_LIMIT_EXCEEDED", points: 100, severity: "CRITICAL", isInstantFail: true, descUzl: "Mashq uchun ajratilgan vaqt me'yoridan oshib ketish", descUzc: "Машқ учун ажратилган вақт меъёридан ошиб кетиш", descRu: "Превышение лимита времени на упражнение" },
];

const DEFAULT_VEHICLES: AdminVehicleConfig[] = [
  { id: 1, modelName: "Chevrolet Cobalt 1.5L AT", brand: "Chevrolet", maxSpeedKmh: 45, acceleration: 2.2, braking: 5.5, maxSteerAngleDeg: 35, isActive: true },
  { id: 2, modelName: "Chevrolet Gentra 1.5L MT", brand: "Chevrolet", maxSpeedKmh: 45, acceleration: 2.4, braking: 5.8, maxSteerAngleDeg: 36, isActive: true },
  { id: 3, modelName: "Chevrolet Malibu 2.0 Turbo", brand: "Chevrolet", maxSpeedKmh: 50, acceleration: 2.8, braking: 6.2, maxSteerAngleDeg: 34, isActive: true },
];

export default function SimulatorAdminPage() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "uzl";

  const [exercises, setExercises] = useState<AdminExerciseConfig[]>(DEFAULT_EXERCISES);
  const [rules] = useState<AdminPenaltyRule[]>(DEFAULT_PENALTY_RULES);
  const [vehicles, setVehicles] = useState<AdminVehicleConfig[]>(DEFAULT_VEHICLES);
  const [sessions, setSessions] = useState<AdminSimulatorSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Edit Modal State
  const [editingExercise, setEditingExercise] = useState<AdminExerciseConfig | null>(null);

  const fetchSimulatorData = async () => {
    setLoading(true);
    try {
      // Fetch live sessions from backend
      const res = await api.get("/api/v1/simulator/sessions");
      if (res?.data?.data && Array.isArray(res.data.data)) {
        setSessions(res.data.data);
      }
    } catch {
      // Mock / local fallback sessions for admin display
      setSessions([
        { id: "sim_9481a_1", userPhone: "+998 90 123 45 67", mode: "EXAM", vehicleModel: "Chevrolet Cobalt", totalPenaltyPoints: 15, timeSpentSeconds: 420, isPassed: true, status: "COMPLETED", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "sim_8273b_2", userPhone: "+998 93 987 65 43", mode: "EXAM", vehicleModel: "Chevrolet Gentra", totalPenaltyPoints: 115, timeSpentSeconds: 280, isPassed: false, status: "FAILED", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: "sim_6190c_3", userPhone: "+998 97 555 11 22", mode: "TRAINING", vehicleModel: "Chevrolet Cobalt", totalPenaltyPoints: 0, timeSpentSeconds: 610, isPassed: true, status: "COMPLETED", createdAt: new Date(Date.now() - 14400000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulatorData();
  }, []);

  const toggleExerciseActive = (id: number) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e))
    );
  };

  const toggleVehicleActive = (id: number) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v))
    );
  };

  const saveExerciseEdit = () => {
    if (!editingExercise) return;
    setExercises((prev) =>
      prev.map((e) => (e.id === editingExercise.id ? editingExercise : e))
    );
    setEditingExercise(null);
  };

  const getExTitle = (e: AdminExerciseConfig) => {
    if (currentLang === "ru") return e.titleRu;
    if (currentLang === "uzc") return e.titleUzc;
    return e.titleUzl;
  };

  const getRuleDesc = (r: AdminPenaltyRule) => {
    if (currentLang === "ru") return r.descRu;
    if (currentLang === "uzc") return r.descUzc;
    return r.descUzl;
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">
            <IconDeviceGamepad2 size={26} style={{ marginRight: 8, verticalAlign: "middle" }} />
            {t("simulator.adminTitle", "Avtodrom Simulyatori boshqaruv paneli")}
          </Title>
          <Text size="sm" c="dimmed">
            {t("simulator.adminSubtitle", "12 ta amaliy mashq, jarima qoidalari, avtomobil parametrlari va imtihon sessiyalarini boshqarish")}
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          loading={loading}
          onClick={fetchSimulatorData}
          size="sm"
        >
          {t("common.refresh", "Yangilash")}
        </Button>
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
        <Card p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Amaliy mashqlar
            </Text>
            <ThemeIcon color="blue" variant="light" size="sm" radius="xl">
              <IconSteeringWheel size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800}>
            {exercises.length}
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Faol: {exercises.filter((e) => e.isActive).length} ta mashq
          </Text>
        </Card>

        <Card p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Jarima qoidalari
            </Text>
            <ThemeIcon color="red" variant="light" size="sm" radius="xl">
              <IconAlertTriangle size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800}>
            {rules.length}
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Kritik: {rules.filter((r) => r.isInstantFail).length} ta to'xtatuvchi
          </Text>
        </Card>

        <Card p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Avtomobil modellari
            </Text>
            <ThemeIcon color="teal" variant="light" size="sm" radius="xl">
              <IconCar size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800}>
            {vehicles.length}
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Hammasi faol holatda
          </Text>
        </Card>

        <Card p="md" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="xs">
            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
              Jami imtihonlar
            </Text>
            <ThemeIcon color="indigo" variant="light" size="sm" radius="xl">
              <IconHistory size={14} />
            </ThemeIcon>
          </Group>
          <Title order={2} fw={800}>
            {sessions.length}
          </Title>
          <Text size="xs" c="dimmed" mt={4}>
            Topshirdi: {sessions.filter((s) => s.isPassed).length} nafar
          </Text>
        </Card>
      </SimpleGrid>

      {/* Tabs View */}
      <Tabs defaultValue="exercises" radius="md">
        <Tabs.List>
          <Tabs.Tab value="exercises" leftSection={<IconSteeringWheel size={16} />}>
            Mashqlar konfiguratsiyasi ({exercises.length})
          </Tabs.Tab>
          <Tabs.Tab value="rules" leftSection={<IconAlertTriangle size={16} />}>
            Jarima qoidalari ({rules.length})
          </Tabs.Tab>
          <Tabs.Tab value="vehicles" leftSection={<IconCar size={16} />}>
            Avtomobillar dinamikasi ({vehicles.length})
          </Tabs.Tab>
          <Tabs.Tab value="sessions" leftSection={<IconHistory size={16} />}>
            Imtihon sessiyalari ({sessions.length})
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Exercises */}
        <Tabs.Panel value="exercises" pt="md">
          <Paper p="md" radius="md" withBorder bg="white">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Kod</Table.Th>
                  <Table.Th>Mashq nomi</Table.Th>
                  <Table.Th>Vaqt chegarasi</Table.Th>
                  <Table.Th>Maks. jarima</Table.Th>
                  <Table.Th>Holati</Table.Th>
                  <Table.Th ta="right">Amal</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {exercises.map((e) => (
                  <Table.Tr key={e.id}>
                    <Table.Td>
                      <Badge circle color="blue">
                        {e.exerciseNumber}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {e.code}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{getExTitle(e)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="gray">
                        {e.timeLimitSeconds} soniya
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="red">
                        {e.maxPenaltyPoints} ball
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        checked={e.isActive}
                        onChange={() => toggleExerciseActive(e.id)}
                        color="teal"
                        size="sm"
                      />
                    </Table.Td>
                    <Table.Td ta="right">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => setEditingExercise({ ...e })}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Tab 2: Penalty Rules */}
        <Tabs.Panel value="rules" pt="md">
          <Paper p="md" radius="md" withBorder bg="white">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Qoida kodi</Table.Th>
                  <Table.Th>Tavsif</Table.Th>
                  <Table.Th>Jarima bali</Table.Th>
                  <Table.Th>Og'irlik darajasi</Table.Th>
                  <Table.Th>To'xtatuvchi xato</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rules.map((r) => (
                  <Table.Tr key={r.id}>
                    <Table.Td>
                      <Text fw={700} size="sm">
                        {r.ruleCode}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{getRuleDesc(r)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={r.points >= 100 ? "red" : r.points >= 20 ? "orange" : "yellow"}
                        variant="filled"
                      >
                        +{r.points} ball
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="dot"
                        color={
                          r.severity === "CRITICAL"
                            ? "red"
                            : r.severity === "MAJOR"
                            ? "orange"
                            : "blue"
                        }
                      >
                        {r.severity}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {r.isInstantFail ? (
                        <Badge color="red" variant="light" leftSection={<IconX size={12} />}>
                          HA (Darhol to'xtatish)
                        </Badge>
                      ) : (
                        <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                          YO'Q
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Tab 3: Vehicle Dynamics */}
        <Tabs.Panel value="vehicles" pt="md">
          <Paper p="md" radius="md" withBorder bg="white">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Model</Table.Th>
                  <Table.Th>Brend</Table.Th>
                  <Table.Th>Maks. tezlik</Table.Th>
                  <Table.Th>Tezlanish (m/s²)</Table.Th>
                  <Table.Th>Tormoz (m/s²)</Table.Th>
                  <Table.Th>Rul burilish burchagi</Table.Th>
                  <Table.Th>Holati</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {vehicles.map((v) => (
                  <Table.Tr key={v.id}>
                    <Table.Td>
                      <Text fw={700} size="sm">
                        {v.modelName}
                      </Text>
                    </Table.Td>
                    <Table.Td>{v.brand}</Table.Td>
                    <Table.Td>{v.maxSpeedKmh} km/soat</Table.Td>
                    <Table.Td>{v.acceleration}</Table.Td>
                    <Table.Td>{v.braking}</Table.Td>
                    <Table.Td>{v.maxSteerAngleDeg}°</Table.Td>
                    <Table.Td>
                      <Switch
                        checked={v.isActive}
                        onChange={() => toggleVehicleActive(v.id)}
                        color="teal"
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Tabs.Panel>

        {/* Tab 4: Sessions */}
        <Tabs.Panel value="sessions" pt="md">
          <Paper p="md" radius="md" withBorder bg="white">
            {sessions.length === 0 ? (
              <Box py="xl" ta="center">
                <Text c="dimmed">Hozircha faol sessiyalar mavjud emas</Text>
              </Box>
            ) : (
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Sessiya ID</Table.Th>
                    <Table.Th>Foydalanuvchi</Table.Th>
                    <Table.Th>Rejim</Table.Th>
                    <Table.Th>Avtomobil</Table.Th>
                    <Table.Th>Jarima bali</Table.Th>
                    <Table.Th>Sarflangan vaqt</Table.Th>
                    <Table.Th>Natija</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sessions.map((s) => (
                    <Table.Tr key={s.id}>
                      <Table.Td>
                        <Text size="xs" ff="monospace">
                          {s.id}
                        </Text>
                      </Table.Td>
                      <Table.Td>{s.userPhone}</Table.Td>
                      <Table.Td>
                        <Badge color={s.mode === "EXAM" ? "indigo" : "teal"} variant="dot">
                          {s.mode}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{s.vehicleModel}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={s.totalPenaltyPoints >= 100 ? "red" : "orange"}
                          variant="light"
                        >
                          {s.totalPenaltyPoints} ball
                        </Badge>
                      </Table.Td>
                      <Table.Td>{Math.round(s.timeSpentSeconds)} soniya</Table.Td>
                      <Table.Td>
                        {s.isPassed ? (
                          <Badge color="green" variant="filled" leftSection={<IconCheck size={12} />}>
                            O'TDI
                          </Badge>
                        ) : (
                          <Badge color="red" variant="filled" leftSection={<IconX size={12} />}>
                            YIQILDI
                          </Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Edit Exercise Modal */}
      <Modal
        opened={!!editingExercise}
        onClose={() => setEditingExercise(null)}
        title="Mashq parametrlarini tahrirlash"
        centered
      >
        {editingExercise && (
          <Stack gap="md">
            <TextInput
              label="Kod"
              value={editingExercise.code}
              disabled
            />
            <TextInput
              label="Mashq nomi (O'zbekcha Lotin)"
              value={editingExercise.titleUzl}
              onChange={(e) =>
                setEditingExercise({ ...editingExercise, titleUzl: e.target.value })
              }
            />
            <TextInput
              label="Mashq nomi (Русский)"
              value={editingExercise.titleRu}
              onChange={(e) =>
                setEditingExercise({ ...editingExercise, titleRu: e.target.value })
              }
            />
            <NumberInput
              label="Ajratilgan vaqt chegarasi (soniya)"
              value={editingExercise.timeLimitSeconds}
              onChange={(v) =>
                setEditingExercise({ ...editingExercise, timeLimitSeconds: Number(v) || 60 })
              }
            />
            <NumberInput
              label="Maksimal ruxsat etilgan jarima bali"
              value={editingExercise.maxPenaltyPoints}
              onChange={(v) =>
                setEditingExercise({ ...editingExercise, maxPenaltyPoints: Number(v) || 20 })
              }
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditingExercise(null)}>
                Bekor qilish
              </Button>
              <Button color="blue" onClick={saveExerciseEdit}>
                Saqlash
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
