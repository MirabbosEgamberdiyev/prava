/**
 * PRAVA DESKTOP ONLINE — QR DEVICE PAIRING AUTHENTICATION PROTOCOL
 * Real-time device pairing and session authorization between Desktop and Mobile app.
 *
 * Flow:
 * 1. Desktop requests new pairing session: POST /api/v1/auth/qr/init
 * 2. Backend returns { sessionId, qrPayload, expiresIn } (90s TTL)
 * 3. Desktop renders dynamic QR code with animated countdown and radar scanning effect
 * 4. User scans QR with Prava Online Mobile App
 * 5. Mobile approves pairing -> Backend authorizes session
 * 6. Desktop polls GET /api/v1/auth/qr/status -> receives tokens & logs in automatically.
 *
 * Poll secret (audit D-21): the init response may carry `pollSecret` (never part of the QR
 * payload). When present it is sent as the `X-QR-Poll-Secret` header on status/poll/cancel so a
 * leaked sessionId (it is in the QR image) cannot be used to steal the tokens. Older backends
 * without it keep working unchanged.
 *
 * Production Hardened: No mock/demo code, typed error classification for backend availability.
 */

import api from "./api";
import i18n from "../utils/i18n";
import { generateUUID } from "../sync/outboxQueue";
import type { User } from "../types";

export type QrSessionStatus = "PENDING" | "SCANNED" | "APPROVED" | "EXPIRED" | "REJECTED";

export interface QrInitResponse {
  sessionId: string;
  challenge?: string;
  qrPayload: string;
  expiresIn: number; // in seconds
  createdAt: number;
  /** Secret for status/poll/cancel calls (absent on older backends). */
  pollSecret?: string;
}

export const QR_POLL_SECRET_HEADER = "X-QR-Poll-Secret";

/** Header object for status/poll/cancel calls; empty when the backend issued no secret. */
export function qrPollHeaders(pollSecret?: string | null): Record<string, string> {
  return typeof pollSecret === "string" && pollSecret.length > 0
    ? { [QR_POLL_SECRET_HEADER]: pollSecret }
    : {};
}

export interface QrStatusResponse {
  status: QrSessionStatus;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export class QrServiceUnavailableError extends Error {
  constructor(message = i18n.t("qr.serviceUnavailable")) {
    super(message);
    this.name = "QrServiceUnavailableError";
  }
}

export interface QrInitOptions {
  clientType?: string;
  clientVersion?: string;
  deviceName?: string;
  deviceUuid?: string;
}

export class QrAuthService {
  /**
   * Initialize a new QR device pairing session on the backend
   */
  static async initSession(options?: QrInitOptions): Promise<QrInitResponse> {
    const platform = typeof navigator !== "undefined" ? navigator.platform : "Desktop";
    const payload = {
      clientType: options?.clientType || "DESKTOP",
      clientVersion: options?.clientVersion || "1.0.0",
      deviceName: options?.deviceName || `Prava Desktop (${platform})`,
      deviceUuid: options?.deviceUuid || generateUUID(),
    };

    try {
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
          challenge: (d as any).challenge,
          qrPayload: d.pairingUrl || d.qrPayload || `https://pravaonline.uz/auth/pair?sessionId=${d.sessionId}`,
          expiresIn: d.expiresIn || 90,
          createdAt: Date.now(),
          ...(typeof d.pollSecret === "string" && d.pollSecret ? { pollSecret: d.pollSecret } : {}),
        };
      }

      throw new QrServiceUnavailableError();
    } catch (err: any) {
      if (err instanceof QrServiceUnavailableError) {
        throw err;
      }

      // Backend 500 (unmapped route) or 404
      const status = err?.response?.status;
      if (status === 500 || status === 404 || status === 501 || status === 503) {
        throw new QrServiceUnavailableError(i18n.t("qr.serviceUnavailable"));
      }

      // Offline / network failure
      if (!err?.response && (err?.code === "ERR_NETWORK" || err?.message?.includes("Network"))) {
        throw new Error(i18n.t("errors.networkError"));
      }

      throw new QrServiceUnavailableError(
        err?.response?.data?.message || i18n.t("qr.initFailed")
      );
    }
  }

  /**
   * Poll current pairing session status from the backend
   */
  static async checkStatus(sessionId: string, pollSecret?: string): Promise<QrStatusResponse> {
    try {
      const response = await api.get<{
        success: boolean;
        data: { status: QrSessionStatus; accessToken?: string; refreshToken?: string; user?: User };
      }>("/api/v1/auth/qr/status", {
        params: { sessionId },
        ...(pollSecret ? { headers: qrPollHeaders(pollSecret) } : {}),
        timeout: 6000,
      });

      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
    } catch (err: any) {
      if (err.response?.status === 410) {
        return { status: "EXPIRED" };
      }
      if (err.response?.status === 404) {
        return { status: "EXPIRED" };
      }
    }

    return { status: "PENDING" };
  }

  /**
   * Cancel an active pairing session
   */
  static async cancelSession(sessionId: string, pollSecret?: string): Promise<void> {
    try {
      const headers = qrPollHeaders(pollSecret);
      if (Object.keys(headers).length > 0) {
        await api.post("/api/v1/auth/qr/cancel", { sessionId }, { headers });
      } else {
        await api.post("/api/v1/auth/qr/cancel", { sessionId });
      }
    } catch {
      // Best-effort cleanup
    }
  }

  /**
   * Remote Session Revocation
   */
  static async revokeDevice(deviceId: string): Promise<boolean> {
    try {
      const res = await api.delete(`/api/v2/my-statistics/devices/${deviceId}`);
      return res.status === 200 || Boolean(res.data?.success);
    } catch {
      try {
        const res2 = await api.post(`/api/v1/auth/devices/${deviceId}/revoke`);
        return res2.status === 200 || Boolean(res2.data?.success);
      } catch {
        throw new Error(i18n.t("qr.revokeFailed"));
      }
    }
  }
}
