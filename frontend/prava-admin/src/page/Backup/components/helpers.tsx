import { IconCircleCheck, IconCircleX, IconClock } from "@tabler/icons-react";
import type { JobState } from "../../../features/backup/types";

export function stateColor(s: JobState) {
  return s === "COMPLETED" ? "green"
       : s === "FAILED"    ? "red"
       : s === "RUNNING"   ? "blue"
       : s === "PENDING"   ? "yellow"
       : "gray";
}

export function stateIcon(s: JobState) {
  if (s === "COMPLETED") return <IconCircleCheck size={16} />;
  if (s === "FAILED")    return <IconCircleX     size={16} />;
  if (s === "RUNNING" || s === "PENDING") return <IconClock size={16} />;
  return null;
}

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function fmtKB(kb?: number) {
  if (!kb) return "—";
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}
