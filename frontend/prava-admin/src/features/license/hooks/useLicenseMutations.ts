import { notifications } from "@mantine/notifications";
import licenseService from "../../../services/licenseService";
import type { ActivationCodeRequest } from "../types";

export function useLicenseMutations() {

  const generate = async (req: ActivationCodeRequest) => {
    return await licenseService.generate(req);
  };

  const deactivate = async (id: number, notes?: string) => {
    return await licenseService.deactivate(id, notes);
  };

  const reactivate = async (id: number) => {
    return await licenseService.reactivate(id);
  };

  const deleteCode = async (id: number) => {
    await licenseService.deleteCode(id);
  };

  const handleError = (err: unknown, fallback: string): void => {
    const msg =
      (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? fallback;
    notifications.show({ title: "Xato", message: msg, color: "red" });
  };

  return { generate, deactivate, reactivate, deleteCode, handleError };
}
