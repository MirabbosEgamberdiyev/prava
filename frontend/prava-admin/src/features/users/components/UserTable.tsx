import {
  Paper,
  Table,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Text,
  Avatar,
  Menu,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconDotsVertical,
  IconUserShield,
  IconUserOff,
  IconUserCheck,
} from "@tabler/icons-react";
import { formatDate } from "../../../utils/formatDate";
import type { User } from "../types";
import { useAuth } from "../../../hooks/auth/AuthContext";
import { useTranslation } from "react-i18next";

const roleBadgeColor: Record<string, string> = {
  SUPER_ADMIN: "red",
  ADMIN: "blue",
  USER: "gray",
};

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  USER: "User",
};

interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onChangeRole: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

const UserTable = ({
  users,
  onView,
  onEdit,
  onDelete,
  onChangeRole,
  onToggleStatus,
}: UserTableProps) => {
  const { user: currentUser } = useAuth();
  const { t } = useTranslation();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <Table.ScrollContainer minWidth={700} component={Paper} mt="md">
      <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm" fz="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>{t("users.user")}</Table.Th>
            <Table.Th>{t("users.phone")}</Table.Th>
            <Table.Th>{t("users.email")}</Table.Th>
            <Table.Th ta="center">{t("users.role")}</Table.Th>
            <Table.Th ta="center">{t("common.status")}</Table.Th>
            <Table.Th>{t("users.lastLogin")}</Table.Th>
            <Table.Th ta="center">{t("common.actions")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((u, idx) => (
            <Table.Tr key={u.id}>
              <Table.Td>{idx + 1}</Table.Td>
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  <Avatar src={u.profileImageUrl} size={32} radius="xl" color="blue">
                    {u.firstName?.charAt(0)}
                  </Avatar>
                  <div>
                    <Text size="sm" fw={500} lineClamp={1}>
                      {u.fullName}
                    </Text>
                    {u.oauthProvider !== "LOCAL" && (
                      <Badge size="xs" variant="dot" color="cyan">
                        {u.oauthProvider}
                      </Badge>
                    )}
                  </div>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{u.phoneNumber || "-"}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" lineClamp={1}>{u.email || "-"}</Text>
              </Table.Td>
              <Table.Td ta="center">
                <Badge variant="light" color={roleBadgeColor[u.role]} size="sm">
                  {roleLabel[u.role]}
                </Badge>
              </Table.Td>
              <Table.Td ta="center">
                <Badge variant="light" color={u.isActive ? "green" : "red"} size="sm">
                  {u.isActive ? t("common.active") : t("common.blocked")}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "-"}
                </Text>
              </Table.Td>
              <Table.Td ta="center">
                <Group gap={4} justify="center" wrap="nowrap">
                  <Tooltip label={t("users.viewTooltip")}>
                    <ActionIcon variant="light" color="blue" onClick={() => onView(u)}>
                      <IconEye size={16} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t("users.editTooltip")}>
                    <ActionIcon variant="light" color="orange" onClick={() => onEdit(u)}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Tooltip>
                  {isSuperAdmin && (
                    <Menu shadow="md" width={180} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="light">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconUserShield size={14} />} onClick={() => onChangeRole(u)}>
                          {t("users.changeRole")}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={u.isActive ? <IconUserOff size={14} /> : <IconUserCheck size={14} />}
                          color={u.isActive ? "orange" : "green"}
                          onClick={() => onToggleStatus(u)}
                        >
                          {u.isActive ? t("users.block") : t("users.activate")}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => onDelete(u)}>
                          {t("common.delete")}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export default UserTable;
