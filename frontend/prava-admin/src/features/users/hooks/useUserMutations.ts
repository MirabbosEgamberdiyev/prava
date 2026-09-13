import { useSWRConfig } from "swr";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import api from "../../../services/api";
import type { CreateUserDTO, UpdateUserDTO, ChangeRoleDTO, ChangeStatusDTO } from "../types";

export const useUserMutations = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();

  const invalidateUsers = () => {
    mutate((key: unknown) => {
      if (Array.isArray(key)) return typeof key[0] === "string" && key[0].includes("/api/v1/admin/users");
      return typeof key === "string" && key.includes("/api/v1/admin/users");
    });
  };

  const createUser = async (data: CreateUserDTO) => {
    try {
      const res = await api.post("/api/v1/admin/users", data);
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: t("users.userCreated"),
        color: "green",
      });
      return res.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("users.createError"),
        color: "red",
      });
      throw error;
    }
  };

  const updateUser = async (id: number, data: UpdateUserDTO) => {
    try {
      const res = await api.put(`/api/v1/admin/users/${id}`, data);
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: t("users.userUpdated"),
        color: "green",
      });
      return res.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("users.updateError"),
        color: "red",
      });
      throw error;
    }
  };

  const changeRole = async (id: number, data: ChangeRoleDTO) => {
    try {
      const res = await api.put(`/api/v1/admin/users/${id}/role?newRole=${data.role}`);
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: t("users.roleChanged"),
        color: "green",
      });
      return res.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("users.roleChangeError"),
        color: "red",
      });
      throw error;
    }
  };

  const changeStatus = async (id: number, data: ChangeStatusDTO) => {
    try {
      const res = await api.put(`/api/v1/admin/users/${id}/status?isActive=${data.active}`);
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: data.active ? t("users.userActivated") : t("users.userBlocked"),
        color: "green",
      });
      return res.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("users.statusChangeError"),
        color: "red",
      });
      throw error;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await api.delete(`/api/v1/admin/users/${id}`);
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: t("users.userDeleted"),
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("users.deleteError"),
        color: "red",
      });
      throw error;
    }
  };

  const resetPassword = async (userId: number, password?: string) => {
    try {
      const res = await api.post(`/api/v1/admin/users/${userId}/reset-password`, {
        password: password || undefined,
      });
      notifications.show({
        title: t("common.success"),
        message: res.data?.message || "Foydalanuvchi paroli muvaffaqiyatli tiklandi",
        color: "green",
      });
      return res.data;
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || "Parolni tiklashda xatolik yuz berdi",
        color: "red",
      });
      throw error;
    }
  };

  const forceLogout = async (userId: number) => {
    try {
      await api.post(`/api/v1/admin/users/${userId}/force-logout`);
      notifications.show({
        title: t("common.success"),
        message: "Foydalanuvchining barcha sessiyalari majburiy yakunlandi",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || "Sessiyani yakunlashda xatolik yuz berdi",
        color: "red",
      });
      throw error;
    }
  };

  const bulkStatus = async (userIds: number[], active: boolean) => {
    try {
      await api.put("/api/v1/admin/users/bulk/status", { userIds, active });
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: `${userIds.length} ta foydalanuvchi holati o'zgartirildi`,
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || "Ommaviy statusni o'zgartirishda xatolik",
        color: "red",
      });
      throw error;
    }
  };

  const bulkDelete = async (userIds: number[]) => {
    try {
      await api.delete("/api/v1/admin/users/bulk", { data: { userIds } });
      invalidateUsers();
      notifications.show({
        title: t("common.success"),
        message: `${userIds.length} ta foydalanuvchi tizimdan o'chirildi`,
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || "Ommaviy o'chirishda xatolik",
        color: "red",
      });
      throw error;
    }
  };

  const exportUsersCsv = async () => {
    try {
      const res = await api.get("/api/v1/admin/users/export/csv", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notifications.show({
        title: t("common.success"),
        message: "Foydalanuvchilar CSV fayli yuklab olindi",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || "CSV eksport qilishda xatolik",
        color: "red",
      });
    }
  };

  return {
    createUser,
    updateUser,
    changeRole,
    changeStatus,
    deleteUser,
    resetPassword,
    forceLogout,
    bulkStatus,
    bulkDelete,
    exportUsersCsv,
  };
};
