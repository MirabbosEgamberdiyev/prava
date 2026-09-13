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
  Paper,
  PasswordInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconPlus,
  IconSearch,
  IconAlertTriangle,
  IconDownload,
  IconUserCheck,
  IconUserOff,
  IconTrash,
  IconKey,
  IconLogout,
} from "@tabler/icons-react";
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

const PAGE_SIZE = 20;

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

  // Multi-select for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const isActive =
    statusFilter === "active" ? true : statusFilter === "inactive" ? false : null;

  const { users, pagination, isLoading, isError } = useUsers(
    page,
    PAGE_SIZE,
    search || undefined,
    roleFilter || undefined,
    isActive
  );

  const {
    changeRole,
    changeStatus,
    deleteUser,
    resetPassword,
    forceLogout,
    bulkStatus,
    bulkDelete,
    exportUsersCsv,
  } = useUserMutations();

  // Modallar
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [roleOpened, { open: openRole, close: closeRole }] = useDisclosure(false);
  const [resetPwdOpened, { open: openResetPwd, close: closeResetPwd }] = useDisclosure(false);
  const [forceLogoutOpened, { open: openForceLogout, close: closeForceLogout }] = useDisclosure(false);
  const [bulkDeleteOpened, { open: openBulkDelete, close: closeBulkDelete }] = useDisclosure(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [customPassword, setCustomPassword] = useState("");
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

  const handleResetPasswordClick = (user: User) => {
    setSelectedUser(user);
    setCustomPassword("");
    openResetPwd();
  };

  const handleForceLogoutClick = (user: User) => {
    setSelectedUser(user);
    openForceLogout();
  };

  const handleToggleStatus = async (user: User) => {
    setActionLoading(true);
    try {
      await changeStatus(user.id, { active: !user.isActive });
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleConfirm = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(true);
    try {
      await changeRole(selectedUser.id, {
        role: newRole as "SUPER_ADMIN" | "ADMIN" | "CONTENT_MANAGER" | "SUPPORT" | "ANALYST" | "USER",
      });
      closeRole();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await resetPassword(selectedUser.id, customPassword || undefined);
      closeResetPwd();
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceLogoutConfirm = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await forceLogout(selectedUser.id);
      closeForceLogout();
    } finally {
      setActionLoading(false);
    }
  };

  // Multi-selection handlers
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (users.length === 0) return;
    const allSelected = users.every((u) => selectedIds.includes(u.id));
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const handleBulkStatusChange = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkStatus(selectedIds, active);
      setSelectedIds([]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkDelete(selectedIds);
      setSelectedIds([]);
      closeBulkDelete();
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">{t("users.title")}</Title>
          <Text size="sm" c="dimmed">Tizim foydalanuvchilarini boshqarish va nazorat qilish</Text>
        </div>
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            onClick={() => exportUsersCsv()}
          >
            Eksport (CSV)
          </Button>
          {isSuperAdmin && (
            <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
              {t("users.newUser")}
            </Button>
          )}
        </Group>
      </Group>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-blue-light)">
          <Group justify="space-between" align="center" wrap="wrap">
            <Text size="sm" fw={600} c="blue">
              {selectedIds.length} ta foydalanuvchi tanlandi
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color="green"
                leftSection={<IconUserCheck size={14} />}
                loading={actionLoading}
                onClick={() => handleBulkStatusChange(true)}
              >
                Faollashtirish
              </Button>
              <Button
                size="xs"
                variant="light"
                color="orange"
                leftSection={<IconUserOff size={14} />}
                loading={actionLoading}
                onClick={() => handleBulkStatusChange(false)}
              >
                Bloklash
              </Button>
              {isSuperAdmin && (
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={openBulkDelete}
                >
                  O'chirish
                </Button>
              )}
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setSelectedIds([])}
              >
                Bekor qilish
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Filtrlar */}
      <Group wrap="wrap">
        <TextInput
          placeholder={t("users.searchPlaceholder")}
          leftSection={<IconSearch size={16} />}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1, minWidth: 220 }}
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
            { value: "CONTENT_MANAGER", label: "Kontent Menejer" },
            { value: "SUPPORT", label: "Qo'llab-quvvatlash" },
            { value: "ANALYST", label: "Tahlilchi" },
            { value: "USER", label: "Foydalanuvchi" },
          ]}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          w={180}
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
            page={page}
            pageSize={PAGE_SIZE}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onChangeRole={handleChangeRoleClick}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPasswordClick}
            onForceLogout={handleForceLogoutClick}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
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
              { value: "USER", label: "Foydalanuvchi (USER)" },
              { value: "ADMIN", label: "Administrator (ADMIN)" },
              { value: "CONTENT_MANAGER", label: "Kontent Menejer (CONTENT_MANAGER)" },
              { value: "SUPPORT", label: "Qo'llab-quvvatlash (SUPPORT)" },
              { value: "ANALYST", label: "Tahlilchi (ANALYST)" },
              { value: "SUPER_ADMIN", label: "Super Admin (SUPER_ADMIN)" },
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

      {/* Parolni tiklash modali */}
      <Modal opened={resetPwdOpened} onClose={closeResetPwd} title="Foydalanuvchi parolini tiklash" centered>
        <Stack gap="md">
          <Alert icon={<IconKey size={20} />} title="Parol almashtirish" color="blue" variant="light">
            <strong>{selectedUser?.fullName}</strong> uchun yangi parol o'rnating yoki bo'sh qoldirsangiz tizim avtomatik yangi xavfsiz parol generatsiya qiladi.
          </Alert>
          <PasswordInput
            label="Yangi parol (ixtiyoriy)"
            placeholder="Kiritilmasa, tizim avtomatik yaratadi"
            value={customPassword}
            onChange={(e) => setCustomPassword(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeResetPwd}>{t("common.cancel")}</Button>
            <Button color="blue" loading={actionLoading} onClick={handleResetPasswordConfirm}>
              Parolni yangilash
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Force Logout modali */}
      <Modal opened={forceLogoutOpened} onClose={closeForceLogout} title="Sessiyani majburiy yakunlash" centered>
        <Stack gap="md">
          <Alert icon={<IconLogout size={20} />} title="Majburiy chiqish" color="orange" variant="light">
            Foydalanuvchi <strong>{selectedUser?.fullName}</strong> ning barcha qurilmalardagi faol JWT tokenlari bekor qilinadi va u qaytadan login qilishi talab etiladi.
          </Alert>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeForceLogout}>{t("common.cancel")}</Button>
            <Button color="orange" loading={actionLoading} onClick={handleForceLogoutConfirm}>
              Majburiy logout qilish
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Bulk Delete modali */}
      <Modal opened={bulkDeleteOpened} onClose={closeBulkDelete} title="Ommaviy o'chirish" centered>
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={20} />} title={t("common.warning")} color="red" variant="light">
            Tanlangan <strong>{selectedIds.length}</strong> ta foydalanuvchini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi!
          </Alert>
          <Group justify="flex-end">
            <Button variant="light" onClick={closeBulkDelete}>{t("common.cancel")}</Button>
            <Button color="red" loading={actionLoading} onClick={handleBulkDeleteConfirm}>
              Barchasini o'chirish
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Users_Page;
