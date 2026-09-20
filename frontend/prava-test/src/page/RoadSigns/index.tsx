import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Title,
  Text,
  TextInput,
  Tabs,
  SimpleGrid,
  Card,
  Badge,
  Group,
  Stack,
  Modal,
  Center,
  ActionIcon,
  Box,
  rem,
  Button,
  Skeleton,
  Alert,
} from "@mantine/core";
import {
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconDirections,
  IconRefresh,
} from "@tabler/icons-react";
import { curriculumApi, type RoadSign } from "../../services/curriculumApi";
import { useLanguage } from "../../context/LanguageContext";
import SEO from "../../components/common/SEO";
import { AppImage } from "../../components/common/AppImage";

const CATEGORIES = [
  { id: "all", label: "Barchasi" },
  { id: "Ogohlantiruvchi belgilar", label: "Ogohlantiruvchi" },
  { id: "Imtiyozli belgilar", label: "Imtiyozli" },
  { id: "Taqiqlovchi belgilar", label: "Taqiqlovchi" },
  { id: "Buyuruvchi belgilar", label: "Buyuruvchi" },
  { id: "Axborot-ishora belgilari", label: "Axborot-ishora" },
  { id: "Servis belgilari", label: "Servis" },
  { id: "Qo'shimcha axborot belgilari", label: "Qo'shimcha" },
];

export default function RoadSigns_Page() {
  const { lang } = useLanguage();

  const [signs, setSigns] = useState<RoadSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedSign, setSelectedSign] = useState<RoadSign | null>(null);

  const fetchSigns = useCallback(() => {
    setLoading(true);
    setError(null);
    curriculumApi
      .getSigns()
      .then((data) => {
        setSigns(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load signs:", err);
        setError("Yo'l belgilarini yuklashda xatolik yuz berdi. Qayta urinib ko'ring.");
        setSigns([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSigns();
  }, [fetchSigns]);

  const safeSigns = useMemo(() => (Array.isArray(signs) ? signs : []), [signs]);

  const getLocalizedTitle = (s: RoadSign) => {
    if (lang === "ru" && s.title_ru) return s.title_ru;
    if (lang === "uzc" && s.title_uzc) return s.title_uzc;
    return s.title_uzl;
  };

  const getLocalizedDesc = (s: RoadSign) => {
    if (lang === "ru" && s.description_ru) return s.description_ru;
    if (lang === "uzc" && s.description_uzc) return s.description_uzc;
    return s.description_uzl || "";
  };

  const filteredSigns = useMemo(() => {
    return safeSigns.filter((s) => {
      if (!s) return false;
      const matchCat =
        activeCategory === "all" ||
        (s.category && s.category.toLowerCase() === activeCategory.toLowerCase());

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        getLocalizedTitle(s).toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [safeSigns, activeCategory, search, lang]);

  return (
    <Container size="xl" py="xl">
      <SEO
        title="Yo'l belgilari katalogi — Rasmiy YHXX Yo'l Belgilari"
        description="O'zbekiston Respublikasi Yo'l Harakati Qoidalaridagi barcha rasmiy yo'l belgilari, ta'riflari va rasmlari."
      />

      <Stack gap="lg">
        <div>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} fw={900} style={{ letterSpacing: "-0.5px" }}>
                Yo'l belgilari
              </Title>
              <Text c="dimmed" size="sm" mt={4}>
                Barcha {safeSigns.length > 0 ? safeSigns.length : 297} ta rasmiy yo'l belgilari va ularning qoidaviy ta'riflari
              </Text>
            </div>
            <Badge size="lg" variant="filled" color="blue" leftSection={<IconDirections size={14} />}>
              {filteredSigns.length} ta belgi
            </Badge>
          </Group>
        </div>

        {/* Search Input */}
        <TextInput
          placeholder="Belgi kodi (masalan, 3.24) yoki nomini qidiring..."
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

        {/* Categories Tabs */}
        <Tabs value={activeCategory} onChange={(val) => setActiveCategory(val || "all")}>
          <Tabs.List>
            {CATEGORIES.map((cat) => (
              <Tabs.Tab key={cat.id} value={cat.id} style={{ fontWeight: 600 }}>
                {cat.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

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
                onClick={fetchSigns}
              >
                Qayta yuklash
              </Button>
            </Group>
          </Alert>
        )}

        {/* Content */}
        {loading ? (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
            {Array.from({ length: 10 }).map((_, idx) => (
              <Card key={idx} shadow="sm" padding="md" radius="md" withBorder>
                <Skeleton height={110} mb="sm" radius="md" />
                <Skeleton height={16} width="50%" mb="xs" />
                <Skeleton height={20} width="90%" />
              </Card>
            ))}
          </SimpleGrid>
        ) : filteredSigns.length === 0 ? (
          <Center py={60}>
            <Stack align="center" gap="xs">
              <IconAlertTriangle size={40} color="gray" />
              <Text c="dimmed" fw={500}>
                Mos keluvchi belgilar topilmadi
              </Text>
              {(search || activeCategory !== "all") && (
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("all");
                  }}
                >
                  Filtrlarni tozalash
                </Button>
              )}
            </Stack>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
            {filteredSigns.map((sign) => (
              <Card
                key={sign.id}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                onClick={() => setSelectedSign(sign)}
              >
                <Card.Section p="sm" bg="var(--mantine-color-gray-1)">
                  <Center h={110}>
                    <AppImage
                      src={sign.imageUrl}
                      alt={getLocalizedTitle(sign)}
                      fit="contain"
                      h={95}
                    />
                  </Center>
                </Card.Section>

                <Group justify="space-between" mt="sm" mb={4}>
                  <Badge variant="light" color="blue" size="sm">
                    {sign.code}
                  </Badge>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {sign.category}
                  </Text>
                </Group>

                <Text fw={600} size="sm" lineClamp={2} title={getLocalizedTitle(sign)}>
                  {getLocalizedTitle(sign)}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Detail Modal */}
      <Modal
        opened={!!selectedSign}
        onClose={() => setSelectedSign(null)}
        title={
          selectedSign && (
            <Group gap="xs">
              <Badge color="blue" size="lg">
                {selectedSign.code}
              </Badge>
              <Text fw={700} size="md">
                {getLocalizedTitle(selectedSign)}
              </Text>
            </Group>
          )
        }
        size="lg"
        centered
      >
        {selectedSign && (
          <Stack gap="md" align="center">
            <Box
              p="lg"
              bg="var(--mantine-color-gray-0)"
              style={{ borderRadius: rem(8), width: "100%", display: "flex", justifyContent: "center" }}
            >
              <AppImage
                src={selectedSign.imageUrl}
                alt={getLocalizedTitle(selectedSign)}
                fit="contain"
                h={180}
                style={{ maxWidth: 220 }}
              />
            </Box>
            <Box w="100%">
              <Badge variant="outline" color="gray" mb="xs">
                {selectedSign.category}
              </Badge>
              <div
                style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--mantine-color-text)" }}
                dangerouslySetInnerHTML={{ __html: getLocalizedDesc(selectedSign) }}
              />
            </Box>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
