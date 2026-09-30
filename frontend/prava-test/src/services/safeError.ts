/**
 * Log-safe error text. Axios errors carry the request config (Authorization header, body with
 * phone numbers / passwords…), so never pass raw error objects to console.* — log this instead.
 */
export function errorMessage(err: unknown): string {
  if (err == null) return "unknown error";
  const anyErr = err as { response?: { status?: unknown }; code?: unknown; message?: unknown; name?: unknown };
  const status = typeof anyErr.response?.status === "number" ? ` (HTTP ${anyErr.response.status})` : "";
  if (typeof anyErr.message === "string" && anyErr.message) return `${anyErr.message}${status}`;
  if (typeof err === "string") return err;
  if (typeof anyErr.name === "string") return `${anyErr.name}${status}`;
  return `error${status}`;
}
