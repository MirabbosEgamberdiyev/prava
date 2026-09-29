import api from "./api";

class AuthService {
  private baseUrl = "/api/v1/auth";

  async logout(refreshToken: string) {
    const res = await api.post(`${this.baseUrl}/logout`, { refreshToken });
    return res.data;
  }

  async refresh(refreshToken: string) {
    const res = await api.post(`${this.baseUrl}/refresh`, { refreshToken });
    return res.data;
  }

  async getMe() {
    const res = await api.get(`${this.baseUrl}/me`);
    return res.data;
  }

  async getConfig() {
    const res = await api.get(`${this.baseUrl}/config`);
    return res.data;
  }

  async googleLogin(data: { idToken?: string; accessToken?: string }) {
    const res = await api.post(`${this.baseUrl}/google`, data);
    return res.data;
  }

  async telegramLogin(data: Record<string, unknown>) {
    const res = await api.post(`${this.baseUrl}/telegram`, data);
    return res.data;
  }

  async telegramTokenLogin(data: { token: string }) {
    const res = await api.post(`${this.baseUrl}/telegram/token-login`, data);
    return res.data;
  }
}

export const authService = new AuthService();
export default authService;
