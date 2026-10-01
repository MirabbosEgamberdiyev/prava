import api from "../api/api";
import type { User } from "../types";

/**
 * Desktop OAuth completion (audit D-06): the identity is ALWAYS resolved server-side from the
 * received access token — any `user` carried by the completion URL / Tauri event is ignored.
 * Returns null when the token cannot be verified.
 */
export async function fetchVerifiedUser(accessToken: string): Promise<User | null> {
  if (!accessToken) return null;
  try {
    const res = await api.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = res.data?.success ? res.data?.data : null;
    return data && data.id ? (data as User) : null;
  } catch {
    return null;
  }
}
