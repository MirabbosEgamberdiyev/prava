import {
  IconBook,
  IconBuildingSkyscraper,
  IconDirections,
  IconGavel,
  IconReportMoney,
  IconRoad,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type LearnSectionId = "signs" | "markings" | "rules" | "fines" | "penalties" | "exam-centers" | "practical-exam";

export interface LearnSection {
  id: LearnSectionId;
  path: string;
  /** i18n key (web locale) + fallback */
  labelKey: string;
  fallback: string;
  descKey: string;
  descFallback: string;
  icon: ComponentType<{ size?: number; stroke?: number; color?: string }>;
  gradient: string;
  /** Extra Ctrl+K search terms (all languages). */
  keywords?: string;
}

/** Order = Learn nav order (also Alt+1…7 inside curriculum pages). Paths match the web app. */
export const LEARN_SECTIONS: LearnSection[] = [
  {
    id: "signs",
    path: "/signs",
    labelKey: "dashboard.nav.signs",
    fallback: "Yo'l belgilari",
    descKey: "curriculum.signsSubtitle",
    descFallback: "",
    icon: IconDirections,
    gradient: "linear-gradient(135deg,#4dabf7,#1971c2)",
  },
  {
    id: "markings",
    path: "/markings",
    labelKey: "dashboard.nav.markings",
    fallback: "Yo'l chiziqlari",
    descKey: "curriculum.markingsSubtitle",
    descFallback: "",
    icon: IconRoad,
    gradient: "linear-gradient(135deg,#38d9a9,#0c8599)",
  },
  {
    id: "rules",
    path: "/rules",
    labelKey: "dashboard.nav.rules",
    fallback: "YHQ Qoidalari",
    descKey: "curriculum.rulesSubtitle",
    descFallback: "",
    icon: IconBook,
    gradient: "linear-gradient(135deg,#9775fa,#7950f2)",
  },
  {
    id: "fines",
    path: "/fines",
    labelKey: "fines.navLabel",
    fallback: "Yo'l harakati jarimalari",
    descKey: "fines.subtitle",
    descFallback: "",
    icon: IconReportMoney,
    gradient: "linear-gradient(135deg,#69db7c,#2b8a3e)",
    keywords: "jarima jarimalar BHM БҲМ жарима штраф штрафы БРВ fines KoAP МЖтК КоАП",
  },
  {
    id: "penalties",
    path: "/penalties",
    labelKey: "dashboard.nav.penalties",
    fallback: "Amaliy imtihon jarima ballari",
    descKey: "curriculum.finesSubtitle",
    descFallback: "",
    icon: IconGavel,
    gradient: "linear-gradient(135deg,#ff8787,#e03131)",
  },
  {
    id: "exam-centers",
    path: "/exam-centers",
    labelKey: "dashboard.nav.examCenters",
    fallback: "Imtihon markazlari",
    descKey: "curriculum.centersSubtitle",
    descFallback: "",
    icon: IconBuildingSkyscraper,
    gradient: "linear-gradient(135deg,#748ffc,#4263eb)",
  },
];
