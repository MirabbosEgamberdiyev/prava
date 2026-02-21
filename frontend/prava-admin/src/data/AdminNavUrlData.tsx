import {
  IconAlignBoxLeftTop,
  IconChartBar,
  IconFolder,
  IconHome,
  IconListDetails,
  IconServer,
  IconSettings,
  IconTicket,
  IconUsers,
  IconFiles,
} from "@tabler/icons-react";

export interface NavItem {
  name: string;
  url: string;
  icon: React.ReactNode;
  role?: string; // "ADMIN" | "SUPER_ADMIN" - minimum required role
  sub?: { name: string; url: string; role?: string }[];
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
  },
  {
    name: "nav.questions",
    url: "/questions",
    icon: <IconListDetails size="16px" />,
    sub: [
      { name: "nav.questionsView", url: "/questions" },
      { name: "nav.questionsAdd", url: "/questions/add" },
    ],
  },
  {
    name: "nav.topics",
    url: "/topics",
    icon: <IconAlignBoxLeftTop size="16px" />,
    sub: [
      { name: "nav.topicsView", url: "/topics" },
      { name: "nav.topicsAdd", url: "/topics/add" },
    ],
  },
  {
    name: "nav.packages",
    url: "/packages",
    icon: <IconFolder size="16px" />,
    sub: [
      { name: "nav.packagesView", url: "/packages" },
      { name: "nav.packagesAdd", url: "/packages/add" },
    ],
  },
  {
    name: "nav.tickets",
    url: "/tickets",
    icon: <IconTicket size="16px" />,
    sub: [
      { name: "nav.ticketsView", url: "/tickets" },
      { name: "nav.ticketsAdd", url: "/tickets/add" },
    ],
  },
  {
    name: "nav.statistics",
    url: "/statistics",
    icon: <IconChartBar size="16px" />,
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
    role: "ADMIN",
  },
  {
    name: "nav.systemMonitor",
    url: "/system",
    icon: <IconServer size="16px" />,
    role: "SUPER_ADMIN",
  },
];

export default AdminNavUrlData;
