import type { ActivationCodeGroup } from "../../../features/license/types";

export function groupColor(group: ActivationCodeGroup): string {
  switch (group) {
    case "ACTIVE":      return "green";
    case "EXPIRING":    return "orange";
    case "EXPIRED":     return "red";
    case "DEACTIVATED": return "gray";
    default:            return "blue";
  }
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}
