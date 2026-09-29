import api from "./api";

export type QrSessionStatus = "PENDING" | "SCANNED" | "APPROVED" | "EXPIRED" | "REJECTED";

export interface QrInitResponse {
  sessionId: string;
  qrPayload: string;
  expiresIn: number;
  createdAt: number;
  pollSecret?: string;
}

export interface QrStatusResponse {
  status: QrSessionStatus;
  accessToken?: string;
  refreshToken?: string;
  user?: any;
}

export const QR_POLL_SECRET_HEADER = "X-QR-Poll-Secret";

export class QrAuthService {
  static async initSession(options: {
    clientType?: string;
    clientVersion?: string;
    deviceName?: string;
  } = {}): Promise<QrInitResponse> {
    const payload = {
      clientType: options.clientType || "WEB",
      clientVersion: options.clientVersion || "1.0.0",
      deviceName: options.deviceName || "Web Browser",
    };

    const response = await api.post<{
      success: boolean;
      data: {
        sessionId: string;
        qrPayload?: string;
        pairingUrl?: string;
        expiresIn?: number;
        pollSecret?: string;
      };
    }>("/api/v1/auth/qr/init", payload, { timeout: 8000 });

    if (response.data?.success && response.data?.data?.sessionId) {
      const d = response.data.data;
      return {
        sessionId: d.sessionId,
        qrPayload: d.pairingUrl || d.qrPayload || `https://pravaonline.uz/auth/pair?sessionId=${d.sessionId}`,
        expiresIn: d.expiresIn || 90,
        createdAt: Date.now(),
        ...(typeof d.pollSecret === "string" && d.pollSecret ? { pollSecret: d.pollSecret } : {}),
      };
    }

    throw new Error("QR pairing session initialization failed");
  }

  static async checkStatus(sessionId: string, pollSecret?: string): Promise<QrStatusResponse> {
    try {
      const response = await api.get<{
        success: boolean;
        data: { status: QrSessionStatus; accessToken?: string; refreshToken?: string; user?: any };
      }>("/api/v1/auth/qr/status", {
        params: { sessionId },
        ...(pollSecret ? { headers: { [QR_POLL_SECRET_HEADER]: pollSecret } } : {}),
        timeout: 6000,
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      if (err.response?.status === 410 || err.response?.status === 404) {
        return { status: "EXPIRED" };
      }
    }

    return { status: "PENDING" };
  }

  static async cancelSession(sessionId: string, pollSecret?: string): Promise<void> {
    try {
      const headers = pollSecret ? { [QR_POLL_SECRET_HEADER]: pollSecret } : undefined;
      await api.post("/api/v1/auth/qr/cancel", { sessionId }, headers ? { headers } : undefined);
    } catch {
      // Best-effort cleanup
    }
  }
}

export default QrAuthService;
