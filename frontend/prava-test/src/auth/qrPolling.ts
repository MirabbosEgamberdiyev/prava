import { QrAuthService, type QrStatusResponse } from "../api/qrAuthService";

export interface QrPollingOptions {
  sessionId: string;
  /** From the /qr/init response; sent as X-QR-Poll-Secret when present (audit D-21). */
  pollSecret?: string;
  intervalMs: number;
  onStatus: (res: QrStatusResponse) => void;
  /** Injectable for tests. */
  check?: (sessionId: string, pollSecret?: string) => Promise<QrStatusResponse>;
}

/**
 * Polls the QR pairing status with an in-flight guard: a tick is skipped while the previous
 * request is still pending, so slow networks never produce overlapping /status calls.
 * Returns a stop function; no callback fires after stop().
 */
export function startQrPolling({
  sessionId,
  pollSecret,
  intervalMs,
  onStatus,
  check = (id, secret) => QrAuthService.checkStatus(id, secret),
}: QrPollingOptions): () => void {
  let stopped = false;
  let inFlight = false;

  const tick = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const res = await check(sessionId, pollSecret);
      if (!stopped) onStatus(res);
    } catch {
      // transient error — keep polling
    } finally {
      inFlight = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
