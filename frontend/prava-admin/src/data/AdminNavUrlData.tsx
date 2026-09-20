import React from "react";
import {
  IconAlignBoxLeftTop,
  IconApps,
  IconBuilding,
  IconChartBar,
  IconDatabaseExport,
  IconFolder,
  IconHome,
  IconKey,
  IconListDetails,
  IconServer,
  IconSettings,
  IconTicket,
  IconUsers,
  IconFiles,
  IconNotebook,
  IconMail,
  IconHeartHandshake,
  IconDownload,
  IconNews,
  IconHelp,
  IconHistory,
  IconCertificate,
  IconTrafficLights,
  IconRoadSign,
  IconGavel,
  IconSteeringWheel,
  IconMapPin,
  IconBook,
} from "@tabler/icons-react";

export interface NavItem {
  name: string;
  url: string;
  icon: React.ReactNode;
  role?: string;
  roles?: string[];
  sub?: { name: string; url: string; role?: string; roles?: string[] }[];
}

export interface NavCategory {
  categoryKey: string;
  categoryName: string;
  roles?: string[];
  items: NavItem[];
}

export const AdminNavCategories: NavCategory[] = [
  {
    categoryKey: "dashboard",
    categoryName: "nav.categoryDashboard",
    items: [
      {
        name: "nav.home",
        url: "/",
        icon: <IconHome size="16px" />,
      },
    ],
  },
  {
    categoryKey: "content",
    categoryName: "nav.categoryContent",
    roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
    items: [
      {
        name: "nav.questions",
        url: "/questions",
        icon: <IconListDetails size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
        sub: [
          { name: "nav.questionsView", url: "/questions" },
          { name: "nav.questionsAdd", url: "/questions/add" },
        ],
      },
      {
        name: "nav.topics",
        url: "/topics",
        icon: <IconAlignBoxLeftTop size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
        sub: [
          { name: "nav.topicsView", url: "/topics" },
          { name: "nav.topicsAdd", url: "/topics/add" },
        ],
      },
      {
        name: "nav.tickets",
        url: "/tickets",
        icon: <IconTicket size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
        sub: [
          { name: "nav.ticketsView", url: "/tickets" },
          { name: "nav.ticketsAdd", url: "/tickets/add" },
        ],
      },
      {
        name: "nav.packages",
        url: "/packages",
        icon: <IconFolder size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
        sub: [
          { name: "nav.packagesView", url: "/packages" },
          { name: "nav.packagesAdd", url: "/packages/add" },
        ],
      },
      {
        name: "nav.signs",
        url: "/signs",
        icon: <IconRoadSign size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
      {
        name: "nav.markings",
        url: "/markings",
        icon: <IconTrafficLights size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
      {
        name: "nav.rules",
        url: "/rules",
        icon: <IconBook size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
      {
        name: "nav.fines",
        url: "/fines",
        icon: <IconGavel size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
      {
        name: "nav.autodrom",
        url: "/autodrom",
        icon: <IconSteeringWheel size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
    ],
  },
  {
    categoryKey: "users",
    categoryName: "nav.categoryUsers",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        name: "nav.users",
        url: "/users",
        icon: <IconUsers size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
    ],
  },
  {
    categoryKey: "operations",
    categoryName: "nav.categoryOperations",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        name: "nav.examCenters",
        url: "/exam-centers",
        icon: <IconMapPin size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        name: "nav.applications",
        url: "/applications",
        icon: <IconApps size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        name: "nav.learningCenters",
        url: "/learning-centers",
        icon: <IconBuilding size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "nav.agreements",
        url: "/agreements",
        icon: <IconNotebook size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "nav.license",
        url: "/license",
        icon: <IconKey size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
  {
    categoryKey: "crm",
    categoryName: "nav.categoryCrm",
    roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "CONTENT_MANAGER"],
    items: [
      {
        name: "nav.contact",
        url: "/contact",
        icon: <IconMail size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"],
      },
      {
        name: "nav.partners",
        url: "/partners",
        icon: <IconHeartHandshake size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"],
      },
      {
        name: "nav.news",
        url: "/news",
        icon: <IconNews size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
      {
        name: "nav.faq",
        url: "/faq",
        icon: <IconHelp size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"],
      },
    ],
  },
  {
    categoryKey: "analytics",
    categoryName: "nav.categoryAnalytics",
    roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
    items: [
      {
        name: "nav.exams",
        url: "/exams",
        icon: <IconCertificate size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
      },
      {
        name: "nav.statistics",
        url: "/statistics",
        icon: <IconChartBar size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
      },
      {
        name: "nav.downloads",
        url: "/downloads",
        icon: <IconDownload size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
      },
    ],
  },
  {
    categoryKey: "system",
    categoryName: "nav.categorySystem",
    roles: ["SUPER_ADMIN", "ADMIN"],
    items: [
      {
        name: "nav.settings",
        url: "/settings",
        icon: <IconSettings size="16px" />,
      },
      {
        name: "nav.audit",
        url: "/audit",
        icon: <IconHistory size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "nav.files",
        url: "/files",
        icon: <IconFiles size="16px" />,
        roles: ["SUPER_ADMIN", "ADMIN"],
      },
      {
        name: "nav.systemMonitor",
        url: "/system",
        icon: <IconServer size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "nav.backup",
        url: "/backup",
        icon: <IconDatabaseExport size="16px" />,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

// Flattened list of all nav items for backwards compatibility and breadcrumbs
const AdminNavUrlData: NavItem[] = AdminNavCategories.flatMap((cat) => cat.items);

export default AdminNavUrlData;
