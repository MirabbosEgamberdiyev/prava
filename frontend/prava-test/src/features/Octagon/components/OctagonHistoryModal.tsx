import React, { useState, useEffect } from "react";
import {
  Modal,
  Text,
  Stack,
  Group,
  Badge,
  Loader,
  Center,
  ThemeIcon,
  Button,
} from "@mantine/core";
import { IconHistory, IconTrophy, IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { MatchHistoryEntry } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  userId?: string;
}

export const OctagonHistoryModal: React.FC<Props> = ({ opened, onClose, userId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState<MatchHistoryEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!opened) return;
    let isMounted = true;
    setLoading(true);

    OctagonApi.getHistory(page, 10, userId)
      .then((res) => {
        if (!isMounted) return;
        const items = res?.content || (Array.isArray(res) ? res : []);
        setHistoryList(items);
        setTotalPages(res?.totalPages || 1);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [opened, page, userId]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="indigo" variant="light" size="lg" radius="xl">
            <IconHistory size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.history.title", "Bahslar Tarixi")}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      padding="lg"
      size="lg"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      styles={{
        content: {
          backgroundColor: "#0f172a",
          border: "1px solid rgba(148, 163, 184, 0.15)",
          color: "#f8fafc",
        },
        header: {
          backgroundColor: "#0f172a",
          color: "#f8fafc",
        },
      }}
    >
      <Stack gap="md">
        {loading ? (
          <Center py="xl">
            <Loader color="indigo" />
          </Center>
        ) : historyList.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconTrophy size={48} className="text-slate-500 opacity-40" />
              <Text size="sm" c="dimmed">
                {t("octagon.history.empty", "Hozircha yakunlangan janglar mavjud emas")}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="xs">
            {historyList.map((m) => {
              const isWin = m.result === "WIN";
              const isDraw = m.result === "DRAW";
              const badgeColor = isWin ? "emerald" : isDraw ? "yellow" : "red";
              const resultText = isWin
                ? t("octagon.history.win", "G'alaba")
                : isDraw
                ? t("octagon.history.draw", "Durang")
                : t("octagon.history.loss", "Mag'lubiyat");

              return (
                <div
                  key={m.matchId}
                  style={{
                    background: "rgba(30, 41, 59, 0.7)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}
                >
                  <Group gap="sm">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        color: "#ffffff",
                        fontSize: 16,
                      }}
                    >
                      {m.opponentName?.charAt(0)?.toUpperCase() || "R"}
                    </div>
                    <div>
                      <Text fw={700} size="sm">
                        {m.opponentName || t("octagon.history.opponent", "Raqib")}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {m.durationSeconds
                          ? `${m.durationSeconds}s`
                          : ""}{" "}
                        {m.createdAt ? `• ${new Date(m.createdAt).toLocaleDateString()}` : ""}
                      </Text>
                    </div>
                  </Group>

                  <Group gap="md">
                    <div style={{ textAlign: "center" }}>
                      <Text fw={800} size="md">
                        {m.myScore} : {m.opponentScore}
                      </Text>
                      <Badge size="xs" color={badgeColor} variant="light">
                        {resultText}
                      </Badge>
                    </div>

                    <div style={{ minWidth: 50, textAlign: "right" }}>
                      <Text
                        fw={800}
                        size="sm"
                        style={{
                          color: m.deltaElo > 0 ? "#10b981" : m.deltaElo < 0 ? "#ef4444" : "#94a3b8",
                        }}
                      >
                        {m.deltaElo > 0 ? `+${m.deltaElo}` : m.deltaElo} ELO
                      </Text>
                    </div>
                  </Group>
                </div>
              );
            })}
          </Stack>
        )}

        {totalPages > 1 && (
          <Group justify="space-between" pt="sm">
            <Button
              variant="default"
              size="xs"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              leftSection={<IconArrowLeft size={14} />}
            >
              {t("octagon.history.prev", "Oldingi")}
            </Button>
            <Text size="xs" c="dimmed">
              {page + 1} / {totalPages}
            </Text>
            <Button
              variant="default"
              size="xs"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              rightSection={<IconArrowRight size={14} />}
            >
              {t("octagon.history.next", "Keyingi")}
            </Button>
          </Group>
        )}
      </Stack>
    </Modal>
  );
};
