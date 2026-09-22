import { Paper, Group, Stack, Text, Badge, SimpleGrid, Box } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";
import { useLanguage } from "../../../context/LanguageContext";

interface ExerciseCardItem {
  number: number;
  title: { uzl: string; uzc: string; ru: string };
}

const EXERCISES_LIST: ExerciseCardItem[] = [
  { number: 1, title: { uzl: "START", uzc: "СТАРТ", ru: "СТАРТ" } },
  { number: 2, title: { uzl: "Piyodalar o'tish joyi", uzc: "Пиёдалар ўтиш жойи", ru: "Пешеходный переход" } },
  { number: 3, title: { uzl: "Estakada", uzc: "Эстакада", ru: "Эстакада" } },
  { number: 4, title: { uzl: "90° burilish", uzc: "90° бурилиш", ru: "Повороты 90°" } },
  { number: 5, title: { uzl: "Zmeyka", uzc: "Змейка", ru: "Змейка" } },
  { number: 6, title: { uzl: "Chorraha", uzc: "Чорраҳа", ru: "Перекресток" } },
  { number: 7, title: { uzl: "Garaj", uzc: "Гараж", ru: "Гараж" } },
  { number: 8, title: { uzl: "Temir yo'l", uzc: "Темир йўл", ru: "Ж/Д переезд" } },
  { number: 9, title: { uzl: "Tezlashish", uzc: "Тезлашиш", ru: "Полоса разгона" } },
  { number: 10, title: { uzl: "Avariya to'xtash", uzc: "Авария тўхташ", ru: "Авар. остановка" } },
  { number: 11, title: { uzl: "Parallel parkovka", uzc: "Параллель парковка", ru: "Парковка" } },
  { number: 12, title: { uzl: "FINISH", uzc: "ФИНИШ", ru: "ФИНИШ" } },
];

interface Props {
  currentExerciseNumber: number;
  completedExercises?: number[];
  onSelectExercise: (num: number) => void;
}

export default function ExerciseNavigatorBar({
  currentExerciseNumber,
  completedExercises = [],
  onSelectExercise,
}: Props) {
  const { lang } = useLanguage();

  const getLoc = (obj: { uzl: string; uzc: string; ru: string }) => {
    if (lang === "ru") return obj.ru;
    if (lang === "uzc") return obj.uzc;
    return obj.uzl;
  };

  return (
    <Paper
      p="md"
      radius="lg"
      withBorder
      style={{
        backgroundColor: "#0d1526",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      <Text size="sm" fw={800} c="white" mb="sm" style={{ letterSpacing: "0.4px" }}>
        {lang === "ru" ? "Упражнения (1-12)" : "Mashqlar (1-12)"}
      </Text>

      <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 6, lg: 12 }} spacing="xs">
        {EXERCISES_LIST.map((ex) => {
          const isCurrent = ex.number === currentExerciseNumber;
          const isCompleted = completedExercises.includes(ex.number);

          return (
            <Paper
              key={ex.number}
              p={8}
              radius="md"
              withBorder
              onClick={() => onSelectExercise(ex.number)}
              style={{
                cursor: "pointer",
                backgroundColor: isCurrent ? "rgba(2, 132, 199, 0.12)" : "rgba(30, 41, 59, 0.5)",
                borderColor: isCurrent ? "#0284c7" : "rgba(255, 255, 255, 0.08)",
                boxShadow: isCurrent ? "0 0 14px rgba(2, 132, 199, 0.35)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              <Stack gap={4}>
                <Group gap={6} align="center" wrap="nowrap">
                  <Badge
                    size="sm"
                    color={isCurrent ? "blue" : isCompleted ? "green" : "gray"}
                    variant={isCurrent ? "filled" : "light"}
                    style={{ minWidth: "22px", padding: "0 5px" }}
                  >
                    {ex.number}
                  </Badge>
                  <Text size="11px" fw={700} c="white" lineClamp={1}>
                    {getLoc(ex.title)}
                  </Text>
                </Group>

                <Group gap={4} align="center">
                  {isCurrent ? (
                    <Group gap={4}>
                      <Box
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#22c55e",
                        }}
                      />
                      <Text size="9px" c="#38bdf8" fw={700}>
                        {lang === "ru" ? "Текущее" : "Joriy"}
                      </Text>
                    </Group>
                  ) : isCompleted ? (
                    <Text size="9px" c="#22c55e" fw={600}>
                      {lang === "ru" ? "Сдано" : "Bajarildi"}
                    </Text>
                  ) : (
                    <Group gap={3}>
                      <IconClock size={10} color="#64748b" />
                      <Text size="9px" c="#64748b">
                        {lang === "ru" ? "Ожидание" : "Kutilmoqda"}
                      </Text>
                    </Group>
                  )}
                </Group>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Paper>
  );
}
