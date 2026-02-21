import { useState } from "react";
import {
  Title,
  Group,
  Button,
  TextInput,
  Select,
  Pagination,
  Center,
  Loader,
  Text,
  Stack,
  Modal,
  Alert,
  SegmentedControl,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch, IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  UserTable,
  UserViewModal,
  UserCreateModal,
  UserEditModal,
  useUsers,
  useUserMutations,
} from "../../features/users";
import type { User } from "../../features/users";
import { useAuth } from "../../hooks/auth/AuthContext";

const Users_Page = () => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Filtrlar
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isActive =
    statusFilter === "active" ? true : statusFilter === "inactive" ? false : null;

  const { users, pagination, isLoading, isError } = useUsers(
    page,
    20,
    search || undefined,
    roleFilter || undefined,
    isActive
  );

  const { changeRole, changeStatus, deleteUser } = useUserMutations();

  // Modallar
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [roleOpened, { open: openRole, close: closeRole }] = useDisclosure(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSearch = () => {
    setSearch(searchValue);
    setPage(1);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    openView();
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    openEdit();
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    openDelete();
  };

  const handleChangeRoleClick = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    openRole();
  };

  const handleToggleStatus = async (user: User) => {
    setActionLoading(true);
    try {
      await changeStatus(user.id, { active: !user.isActive });
    } catch {
      // handled in hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await deleteUser(selectedUser.id);
      closeDelete();
    } catch {
      // handled in hook
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleConfirm = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(true);
    try {
      await changeRole(selectedUser.id, { role: newRole as "SUPER_ADMIN" | "ADMIN" | "USER" });
      closeRole();
    } catch {
      // handled in hook
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>{t("users.title")}</Title>
        {isSuperAdmin && (
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            {t("users.newUser")}
          </Button>
        )}
      </Group>

      {/* Filtrlar */}
      <Group>
        <TextInput
          placeholder={t("users.searchPlaceholder")}
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1, maxWidth: 300 }}
        />
        <Button variant="light" onClick={handleSearch}>
          {t("users.search")}
        </Button>
        <Select
          placeholder={t("users.role")}
          clearable
          data={[
            { value: "SUPER_ADMIN", label: "Super Admin" },
            { value: "ADMIN", label: "Admin" },
            { value: "USER", label: "User" },
          ]}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          w={160}
        />
        <SegmentedControl
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          data={[
            { value: "all", label: t("users.allStatuses") },
            { value: "active", label: t("users.activeStatus") },
            { value: "inactive", label: t("users.blockedStatus") },
          ]}
        />
      </Group>

      {/* Jadval */}
      {isLoading ? (
        <Center h={300}>
          <Loader type="bars" />
        </Center>
      ) : isError ? (
        <Center h={200}>
          <Text c="red">{t("common.errorLoading")}</Text>
        </Center>
      ) : users.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">{t("common.noData")}</Text>
        </Center>
      ) : (
        <>
          <UserTable
            users={users}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onChangeRole={handleChangeRoleClick}
            onToggleStatus={handleToggleStatus}
          />
          {pagination.totalPages > 1 && (
            <Center>
              <Pagination
                total={pagination.totalPages}
                value={page}
                onChange={setPage}
                withEdges
              />
            </Center>
          )}
        </>
      )}

      {/* Modallar */}
      <UserViewModal opened={viewOpened} onClose={closeView} user={selectedUser} />
      <UserCreateModal opened={createOpened} onClose={closeCreate} />
      <UserEditModal opened={editOpened} onClose={closeEdit} user={selectedUser} />

      {/* O'chirish tasdiqlash */}
      <Modal opened={deleteOpened} onClose={closeDelete} title={t("users.deleteTitle")} centered>
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={20} />} title={t("common.warning")} color="red" variant="light">
            {t("common.irreversibleAction")}
          </Alert>
          <Text>
            <strong>{selectedUser?.fullName}</strong> {t("users.deleteConfirm")}
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeDelete}>{t("common.cancel")}</Button>
            <Button color="red" loading={actionLoading} onClick={handleDeleteConfirm}>
              {t("common.delete")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Rol o'zgartirish */}
      <Modal opened={roleOpened} onClose={closeRole} title={t("users.roleChangeTitle")} centered>
        <Stack gap="md">
          <Text>
            <strong>{selectedUser?.fullName}</strong> {t("users.roleChangePrompt")}
          </Text>
          <Select
            data={[
              { value: "USER", label: t("users.roleUser") },
              { value: "ADMIN", label: t("users.roleAdmin") },
              { value: "SUPER_ADMIN", label: t("users.roleSuperAdmin") },
            ]}
            value={newRole}
            onChange={setNewRole}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeRole}>{t("common.cancel")}</Button>
            <Button loading={actionLoading} onClick={handleRoleConfirm}>
              {t("common.save")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Users_Page;
