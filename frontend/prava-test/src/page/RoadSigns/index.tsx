import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IconDirections } from "@tabler/icons-react";
import SEO from "../../components/common/SEO";
import type { RoadSign } from "../../api/curriculumApi";
import { useCurriculum } from "../../features/Curriculum/useCurriculum";
import CatalogPage, { type CatalogCategory } from "../../features/Curriculum/components/CatalogPage";

const normalizeCategory = (cat?: string): string =>
  (cat || "")
    .toLowerCase()
    .replace(/[`ʻ'"]/g, "'")
    .trim();

/**
 * Official categories with aliases matching backend database rows,
 * Cyrillic/Latin variants, and official YHQ nomenclature.
 */
const CATEGORIES: {
  id: string;
  key: string;
  fallback: string;
  aliases: string[];
}[] = [
  { id: "all", key: "curriculum.all", fallback: "Barchasi", aliases: [] },
  {
    id: "warning",
    key: "curriculum.warning",
    fallback: "Ogohlantiruvchi",
    aliases: [
      "ogohlantiruvchi belgilar",
      "ogohlantiruvchi belgilari",
      "ogohlantiruvchi",
      "предупреждающие знаки",
    ],
  },
  {
    id: "priority",
    key: "curriculum.priority",
    fallback: "Imtiyozli",
    aliases: [
      "imtiyoz belgilari",
      "imtiyozli belgilar",
      "imtiyozli belgilari",
      "imtiyozli",
      "imtiyoz",
      "знаки приоритета",
    ],
  },
  {
    id: "prohibitory",
    key: "curriculum.prohibitory",
    fallback: "Taqiqlovchi",
    aliases: [
      "taqiqlovchi belgilar",
      "taqiqlovchi belgilari",
      "taqiqlovchi",
      "запрещающие знаки",
    ],
  },
  {
    id: "mandatory",
    key: "curriculum.mandatory",
    fallback: "Buyuruvchi",
    aliases: [
      "buyuruvchi belgilar",
      "buyuruvchi belgilari",
      "buyuruvchi",
      "предписывающие знаки",
    ],
  },
  {
    id: "informative",
    key: "curriculum.informative",
    fallback: "Axborot-ishora",
    aliases: [
      "axborot-ko'rsatgich belgilari",
      "axborot-korsatgich belgilari",
      "axborot-ko'rsatkich belgilari",
      "axborot-korsatkich belgilari",
      "axborot-ishora belgilari",
      "axborot-ishora",
      "axborot ko'rsatgich belgilari",
      "информационно-указательные знаки",
    ],
  },
  {
    id: "service",
    key: "curriculum.service",
    fallback: "Servis",
    aliases: [
      "servis belgilari",
      "servis",
      "знаки сервиса",
    ],
  },
  {
    id: "additional",
    key: "curriculum.additional",
    fallback: "Qo'shimcha",
    aliases: [
      "qo'shimcha axborot belgilari",
      "qoshimcha axborot belgilari",
      "qo'shimcha",
      "qoshimcha",
      "знаки дополнительной информации",
    ],
  },
];

export default function RoadSigns_Page() {
  const { t } = useTranslation();
  const { data, error, isLoading, refresh, refreshing, savedAt, fromCache } = useCurriculum("signs");
  const signs = useMemo(() => data ?? [], [data]);

  const categories: CatalogCategory<RoadSign>[] = useMemo(() => {
    return CATEGORIES.map((c) => ({
      id: c.id,
      label: t(c.key, c.fallback),
      match:
        c.id === "all"
          ? () => true
          : (s: RoadSign) => {
              const norm = normalizeCategory(s.category);
              return c.aliases.some((alias) => norm === alias || norm.includes(alias));
            },
    }));
  }, [t]);

  return (
    <>
      <SEO
        title={t("curriculum.signsTitle", "Yo'l belgilari")}
        description={t("curriculum.signsSubtitle", "")}
        canonical="/signs"
        noIndex
      />
      <CatalogPage
        section="signs"
        title={t("curriculum.signsTitle", "Yo'l belgilari")}
        subtitle={t("curriculum.signsSubtitle", "")}
        countBadge={(n) => (
          <span className="cur-badge">
            <IconDirections size={14} /> {n} {t("curriculum.signsCount", "ta belgi")}
          </span>
        )}
        items={signs}
        loading={isLoading}
        error={error}
        savedAt={savedAt}
        fromCache={fromCache}
        refreshing={refreshing}
        onRefresh={refresh}
        categories={categories}
        searchPlaceholder={t("curriculum.searchSigns", "Belgi kodi yoki nomini qidiring...")}
        emptyText={t("learn.noSignsFound", "Mos keluvchi belgilar topilmadi")}
        itemMeta={(s) => {
          const norm = normalizeCategory(s.category);
          const matched = CATEGORIES.find((c) =>
            c.aliases.some((alias) => norm === alias || norm.includes(alias))
          );
          return matched ? t(matched.key, matched.fallback) : s.category || "";
        }}
      />
    </>
  );
}
