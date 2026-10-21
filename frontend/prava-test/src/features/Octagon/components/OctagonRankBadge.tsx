import React from "react";
import { Badge } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { getRankMeta } from "../rank";

interface Props {
  rank?: unknown;
  /** ELO berilsa liga undan hisoblanadi (server bilan bir xil shkala). */
  elo?: number | null;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "filled" | "light" | "outline";
}

export const OctagonRankBadge: React.FC<Props> = ({ rank, elo, size = "sm", variant = "filled" }) => {
  const { t } = useTranslation();
  const meta = getRankMeta(rank, elo);
  return (
    <Badge color={meta.color} size={size} variant={variant}>
      {`${meta.emoji} ${t(meta.labelKey)}`}
    </Badge>
  );
};
