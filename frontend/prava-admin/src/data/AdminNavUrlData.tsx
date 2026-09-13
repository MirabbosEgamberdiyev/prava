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
} from "@tabler/icons-react";

export interface NavItem {
  name: string;
  url: string;
  icon: React.ReactNode;
  role?: string;
  roles?: string[];
  sub?: { name: string; url: string; role?: string; roles?: string[] }[];
}

const AdminNavUrlData: NavItem[] = [
  {
    name: "nav.home",
    url: "/",
    icon: <IconHome size="16px" />,
  },
  {
    name: "nav.users",
    url: "/users",
    icon: <IconUsers size="16px" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
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
    name: "nav.exams",
    url: "/exams",
    icon: <IconCertificate size="16px" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
  },
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
    name: "nav.downloads",
    url: "/downloads",
    icon: <IconDownload size="16px" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
  },
  {
    name: "nav.applications",
    url: "/applications",
    icon: <IconApps size="16px" />,
    roles: ["SUPER_ADMIN", "ADMIN"],
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
  {
    name: "nav.statistics",
    url: "/statistics",
    icon: <IconChartBar size="16px" />,
    roles: ["SUPER_ADMIN", "ADMIN", "ANALYST"],
  },
  {
    name: "nav.audit",
    url: "/audit",
    icon: <IconHistory size="16px" />,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "nav.settings",
    url: "/settings",
    icon: <IconSettings size="16px" />,
  },
  {
    name: "nav.files",
    url: "/files",
    icon: <IconFiles size="16px" />,
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
  {
    name: "nav.backup",
    url: "/backup",
    icon: <IconDatabaseExport size="16px" />,
    roles: ["SUPER_ADMIN"],
  },
  {
    name: "nav.systemMonitor",
    url: "/system",
    icon: <IconServer size="16px" />,
    roles: ["SUPER_ADMIN"],
  },
];

export default AdminNavUrlData;
