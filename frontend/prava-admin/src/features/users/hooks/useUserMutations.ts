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

  return { createUser, updateUser, changeRole, changeStatus, deleteUser };
};
