import type { ReactNode } from "react";
import { Paper, Text } from "@mantine/core";

/** Natija / xato ekranlari uchun markazlashtirilgan konteyner (100dvh, 320px xavfsiz). */
export function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "var(--bg)",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

/** Natija ekranidagi raqamli ko'rsatkich. */
export function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <Paper withBorder radius="md" p="sm" ta="center">
      <Text fz={28} fw={800} lh={1.1}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Paper>
  );
}
