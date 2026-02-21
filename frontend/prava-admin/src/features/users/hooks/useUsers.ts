import useSWR from "swr";
import api from "../../../services/api";
import { useTranslation } from "react-i18next";
import type { User, UsersResponse } from "../types";

export const useUsers = (
  page = 1,
  size = 20,
  search?: string,
  role?: string,
  isActive?: boolean | null
) => {
  const { i18n } = useTranslation();
  const backendPage = Math.max(0, page - 1);

  let url = `/api/v1/admin/users?page=${backendPage}&size=${size}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (role) url += `&role=${role}`;
  if (isActive !== null && isActive !== undefined) url += `&isActive=${isActive}`;

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    [url, i18n.language],
    async ([fetchUrl]) => {
      const res = await api.get(fetchUrl as string);
      return res.data;
    }
  );

  return {
    users: data?.data?.content || [],
    pagination: {
      totalPages: data?.data?.totalPages || 0,
      totalElements: data?.data?.totalElements || 0,
    },
    isLoading,
    isError: !!error,
    mutate,
  };
};

export const useUser = (id: number | null) => {
  const { i18n } = useTranslation();

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: User }>(
    id ? [`/api/v1/admin/users/${id}`, i18n.language] : null,
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    user: data?.data || null,
    isLoading,
    isError: !!error,
    mutate,
  };
};

export const useAdmins = () => {
  const { i18n } = useTranslation();

  const { data, error, isLoading } = useSWR<{ success: boolean; data: User[] }>(
    ["/api/v1/admin/users/admins", i18n.language],
    async ([url]) => {
      const res = await api.get(url as string);
      return res.data;
    },
    { revalidateOnFocus: false }
  );

  return {
    admins: data?.data || [],
    isLoading,
    isError: !!error,
  };
};
