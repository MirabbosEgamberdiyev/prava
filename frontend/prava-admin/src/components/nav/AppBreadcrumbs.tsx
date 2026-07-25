import { Breadcrumbs, Anchor, Text, Group } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AdminNavUrlData from "../../data/AdminNavUrlData";

interface Crumb {
  label: string;
  url?: string;
}

/**
 * A8: joriy sahifa qayerdaligini ko'rsatadi (sidebar'dagi "active" holatidan
 * tashqari). AdminNavUrlData'dagi marshrut ro'yxatidan avtomatik quriladi —
 * har bir yangi sahifa uchun alohida qo'shish shart emas.
 */
export default function AppBreadcrumbs() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  if (pathname === "/") return null;

  const crumbs: Crumb[] = [{ label: t("nav.home"), url: "/" }];

  let bestSection: { name: string; url: string } | null = null;
  let bestSub: { name: string; url: string } | null = null;

  for (const item of AdminNavUrlData) {
    if (item.url !== "/" && pathname.startsWith(item.url)) {
      if (!bestSection || item.url.length > bestSection.url.length) {
        bestSection = item;
      }
    }
    for (const sub of item.sub ?? []) {
      if (pathname.startsWith(sub.url)) {
        if (!bestSub || sub.url.length > bestSub.url.length) {
          bestSub = sub;
          bestSection = item;
        }
      }
    }
  }

  if (bestSection) {
    crumbs.push({
      label: t(bestSection.name),
      url: bestSub ? bestSection.url : undefined,
    });
  }
  if (bestSub && bestSub.url !== bestSection?.url) {
    crumbs.push({ label: t(bestSub.name) });
  }

  if (crumbs.length < 2) return null;

  return (
    <Breadcrumbs mb="md" separator="/">
      {crumbs.map((c, i) =>
        c.url ? (
          <Anchor component={Link} to={c.url} key={i} size="sm" c="dimmed">
            {i === 0 ? (
              <Group gap={4} wrap="nowrap">
                <IconHome size={14} />
                <span>{c.label}</span>
              </Group>
            ) : (
              c.label
            )}
          </Anchor>
        ) : (
          <Text key={i} size="sm" fw={500}>
            {c.label}
          </Text>
        )
      )}
    </Breadcrumbs>
  );
}
