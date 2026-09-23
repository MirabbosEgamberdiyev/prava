import { Modal, Tabs, SimpleGrid, Card, Group, Badge, Text, Button, Stack, ThemeIcon, Progress } from "@mantine/core";
import { IconCar, IconTruck, IconBus, IconCheck, IconGasStation, IconManualGearbox, IconGauge, IconRulerMeasure } from "@tabler/icons-react";
import { getVehiclesByCategory } from "../registry/vehicleConfigs";
import type { VehicleCategory, VehicleConfig } from "../types";
import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  opened: boolean;
  onClose: () => void;
  selectedVehicle: string;
  onSelectVehicle: (modelName: string) => void;
  currentCategory: VehicleCategory;
  onCategoryChange: (category: VehicleCategory) => void;
}

export default function VehicleSelectorModal({
  opened,
  onClose,
  selectedVehicle,
  onSelectVehicle,
  currentCategory,
  onCategoryChange,
}: Props) {
  const { lang } = useLanguage();

  const labels = {
    title: lang === "ru" ? "Выбор учебного автомобиля" : lang === "uzc" ? "Ўқув автомобилини танлаш" : "O'quv avtomobilini tanlash",
    subtitle: lang === "ru" ? "Реалистичные параметры физики, габаритов и рулевого управления" : lang === "uzc" ? "Реал физика, ўлчамлар ва бошқарув параметрлари" : "Real fizika, o'lchamlar va boshqaruv parametrlari",
    catB: lang === "ru" ? "B — Легковые" : lang === "uzc" ? "B — Енгил" : "B — Yengil",
    catC: lang === "ru" ? "C — Грузовой" : lang === "uzc" ? "C — Юк" : "C — Yuk",
    catD: lang === "ru" ? "D — Автобус" : lang === "uzc" ? "D — Автобус" : "D — Avtobus",
    select: lang === "ru" ? "Выбрать" : lang === "uzc" ? "Танлаш" : "Tanlash",
    selected: lang === "ru" ? "Выбрано" : lang === "uzc" ? "Танланган" : "Tanlangan",
    mass: lang === "ru" ? "Масса:" : lang === "uzc" ? "Массаси:" : "Massasi:",
    wheelbase: lang === "ru" ? "Колесная база:" : lang === "uzc" ? "Ғилдирак базаси:" : "G'ildirak bazasi:",
    turnAngle: lang === "ru" ? "Макс. выворот:" : lang === "uzc" ? "Макс. бурилиш:" : "Maks. burilish:",
    transmission: lang === "ru" ? "КПП:" : lang === "uzc" ? "КПП:" : "KPP:",
    auto: lang === "ru" ? "Автомат" : lang === "uzc" ? "Автомат" : "Avtomat",
    manual: lang === "ru" ? "Механика" : lang === "uzc" ? "Механика" : "Mexanika",
  };

  const handleChoose = (vehicle: VehicleConfig) => {
    onCategoryChange(vehicle.category);
    onSelectVehicle(vehicle.modelName);
    onClose();
  };

  const renderVehicleCard = (v: VehicleConfig) => {
    const isCurrent = selectedVehicle.toLowerCase() === v.modelName.toLowerCase();

    return (
      <Card
        key={v.id}
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          backgroundColor: isCurrent ? "rgba(2, 132, 199, 0.15)" : "rgba(15, 23, 42, 0.8)",
          borderColor: isCurrent ? "#0284c7" : "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(12px)",
          transition: "all 0.2s ease",
        }}
      >
        <Stack gap="xs">
          {/* Header: Color Swatch + Name + Category Badge */}
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: v.color,
                  border: "2px solid #ffffff",
                  boxShadow: `0 0 10px ${v.color}66`,
                  flexShrink: 0,
                }}
              />
              <div>
                <Text fw={700} size="sm" c="white">
                  {v.modelName}
                </Text>
                <Text size="xs" c="dimmed">
                  {(v.bodyType || "sedan").toUpperCase()} • {(v.engineType || "gasoline").toUpperCase()}
                </Text>
              </div>
            </Group>
            <Badge
              color={v.category === "B" ? "blue" : v.category === "C" ? "orange" : "teal"}
              variant="filled"
              size="sm"
            >
              {v.category}
            </Badge>
          </Group>

          {/* Quick Specs Grid */}
          <SimpleGrid cols={2} spacing={6} mt={4}>
            <Group gap={4} wrap="nowrap">
              <ThemeIcon size="xs" radius="xl" variant="subtle" color="gray">
                <IconGauge size={12} />
              </ThemeIcon>
              <Text size="11px" c="dimmed">
                {labels.mass} <strong style={{ color: "#f8fafc" }}>{v.massKg} kg</strong>
              </Text>
            </Group>

            <Group gap={4} wrap="nowrap">
              <ThemeIcon size="xs" radius="xl" variant="subtle" color="gray">
                <IconRulerMeasure size={12} />
              </ThemeIcon>
              <Text size="11px" c="dimmed">
                {labels.wheelbase} <strong style={{ color: "#f8fafc" }}>{v.wheelbaseMeters} m</strong>
              </Text>
            </Group>

            <Group gap={4} wrap="nowrap">
              <ThemeIcon size="xs" radius="xl" variant="subtle" color="gray">
                <IconManualGearbox size={12} />
              </ThemeIcon>
              <Text size="11px" c="dimmed">
                {labels.transmission}{" "}
                <strong style={{ color: "#f8fafc" }}>
                  {v.transmissionType === "auto" ? labels.auto : labels.manual}
                </strong>
              </Text>
            </Group>

            <Group gap={4} wrap="nowrap">
              <ThemeIcon size="xs" radius="xl" variant="subtle" color="gray">
                <IconGasStation size={12} />
              </ThemeIcon>
              <Text size="11px" c="dimmed">
                {labels.turnAngle} <strong style={{ color: "#f8fafc" }}>{v.steeringAngleMax}°</strong>
              </Text>
            </Group>
          </SimpleGrid>

          {/* Acceleration & Braking Power Bars */}
          <Stack gap={3} mt={4}>
            <Group justify="space-between">
              <Text size="10px" c="dimmed">
                Quvvat / Tezlanish
              </Text>
              <Text size="10px" fw={600} c="blue.3">
                {Math.round(v.accelerationPower * 200)} ot kuchi
              </Text>
            </Group>
            <Progress value={v.accelerationPower * 200} size="xs" color="blue" radius="xl" />
          </Stack>

          {/* Action Select Button */}
          <Button
            mt="xs"
            size="xs"
            fullWidth
            variant={isCurrent ? "filled" : "light"}
            color={isCurrent ? "teal" : "blue"}
            leftSection={isCurrent ? <IconCheck size={14} /> : undefined}
            onClick={() => handleChoose(v)}
          >
            {isCurrent ? labels.selected : labels.select}
          </Button>
        </Stack>
      </Card>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <div>
          <Text fw={800} size="md" c="white">
            {labels.title}
          </Text>
          <Text size="xs" c="dimmed">
            {labels.subtitle}
          </Text>
        </div>
      }
      size="lg"
      radius="md"
      styles={{
        header: {
          backgroundColor: "#0d1526",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        },
        content: {
          backgroundColor: "#0b1120",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        },
        body: {
          paddingTop: 16,
        },
      }}
    >
      <Tabs
        defaultValue={currentCategory}
        value={currentCategory}
        onChange={(val) => onCategoryChange((val as VehicleCategory) || "B")}
      >
        <Tabs.List grow mb="md">
          <Tabs.Tab value="B" leftSection={<IconCar size={16} />}>
            {labels.catB}
          </Tabs.Tab>
          <Tabs.Tab value="C" leftSection={<IconTruck size={16} />}>
            {labels.catC}
          </Tabs.Tab>
          <Tabs.Tab value="D" leftSection={<IconBus size={16} />}>
            {labels.catD}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="B">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {getVehiclesByCategory("B").map((v) => renderVehicleCard(v))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="C">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {getVehiclesByCategory("C").map((v) => renderVehicleCard(v))}
          </SimpleGrid>
        </Tabs.Panel>

        <Tabs.Panel value="D">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {getVehiclesByCategory("D").map((v) => renderVehicleCard(v))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
