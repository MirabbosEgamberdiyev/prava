// features/package/components/PackageFilters.tsx

import { Grid, Select, TextInput, Group, ActionIcon } from "@mantine/core";
import { IconClearAll, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { PackageFilters, GenerationType } from "../types";

interface PackageFiltersProps {
  onFilter: (filters: PackageFilters) => void;
  onReset: () => void;
  topics?: Array<{ value: string; label: string }>;
}

export function PackageFiltersComponent({
  onFilter,
  onReset,
  topics = [],
}: PackageFiltersProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const [isFree, setIsFree] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<string | null>(null);
  const [generationType, setGenerationType] = useState<string | null>(null);

  const handleFilter = () => {
    const filters: PackageFilters = {};
    if (search) filters.search = search;
    if (topicId) filters.topicId = parseInt(topicId);
    if (isFree !== null) filters.isFree = isFree === "true";
    if (isActive !== null) filters.isActive = isActive === "true";
    if (generationType)
      filters.generationType = generationType as GenerationType;

    onFilter(filters);
  };

  const handleReset = () => {
    setSearch("");
    setTopicId(null);
    setIsFree(null);
    setIsActive(null);
    setGenerationType(null);
    onReset();
  };

  return (
    <Grid gutter="md">
      <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
        <TextInput
          placeholder={t("common.search")}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilter()}
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6, lg: 2 }}>
        <Select
          placeholder={t("packages.form.topic")}
          data={topics}
          value={topicId}
          onChange={setTopicId}
          clearable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6, lg: 2 }}>
        <Select
          placeholder={t("packages.form.priceType")}
          data={[
            { value: "true", label: t("packages.form.isFree") },
            { value: "false", label: t("packages.form.paid") },
          ]}
          value={isFree}
          onChange={setIsFree}
          clearable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6, lg: 2 }}>
        <Select
          placeholder={t("common.status")}
          data={[
            { value: "true", label: t("common.active") },
            { value: "false", label: t("common.inactive") },
          ]}
          value={isActive}
          onChange={setIsActive}
          clearable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 6, lg: 2 }}>
        <Select
          placeholder={t("packages.form.generationType")}
          data={[
            { value: "MANUAL", label: t("packages.form.manual") },
            { value: "AUTO", label: t("packages.form.auto") },
          ]}
          value={generationType}
          onChange={setGenerationType}
          clearable
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, lg: 1 }}>
        <Group gap="xs" justify="end">
          <ActionIcon size={"lg"} onClick={handleFilter}>
            <IconSearch size={20} />
          </ActionIcon>
          <ActionIcon
            size={"lg"}
            variant="light"
            color="red"
            onClick={handleReset}
          >
            <IconClearAll size={20} />
          </ActionIcon>
        </Group>
      </Grid.Col>
    </Grid>
  );
}
