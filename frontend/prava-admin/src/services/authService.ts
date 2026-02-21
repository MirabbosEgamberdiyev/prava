import api from "./api";

class AuthService {
  async login(identifier: string, password: string) {
    const res = await api.post("/api/v1/auth/login", { identifier, password });
    return res.data;
  }

  async logout(refreshToken: string) {
    const res = await api.post("/api/v1/auth/logout", { refreshToken });
    return res.data;
  }

  async refresh(refreshToken: string) {
    const res = await api.post("/api/v1/auth/refresh", { refreshToken });
    return res.data;
  }

  async getMe() {
    const res = await api.get("/api/v1/auth/me");
    return res.data;
  }

  async getConfig() {
    const res = await api.get("/api/v1/auth/config");
    return res.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.post("/api/v1/auth/change-password", { currentPassword, newPassword });
    return res.data;
  }

  async forgotPassword(identifier: string) {
    const res = await api.post("/api/v1/auth/forgot-password", { identifier });
    return res.data;
  }

  async resetPassword(identifier: string, code: string, newPassword: string) {
    const res = await api.post("/api/v1/auth/reset-password", { identifier, code, newPassword });
    return res.data;
  }

  async registerInit(data: { phoneNumber?: string; email?: string }) {
    const res = await api.post("/api/v1/auth/register/init", data);
    return res.data;
  }

  async registerComplete(data: { identifier: string; code: string; firstName: string; lastName?: string; password: string }) {
    const res = await api.post("/api/v1/auth/register/complete", data);
    return res.data;
  }

  async googleLogin(data: { idToken: string }) {
    const res = await api.post("/api/v1/auth/google", data);
    return res.data;
  }

  async telegramLogin(data: Record<string, unknown>) {
    const res = await api.post("/api/v1/auth/telegram", data);
    return res.data;
  }

  async telegramTokenLogin(data: { token: string }) {
    const res = await api.post("/api/v1/auth/telegram/token-login", data);
    return res.data;
  }
}

export const authService = new AuthService();
export default authService;
