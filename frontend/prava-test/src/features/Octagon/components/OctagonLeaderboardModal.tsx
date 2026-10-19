import React, { useState, useEffect } from "react";
import { Modal, Tabs, Table, Text, Group, ThemeIcon, Avatar, Badge, Loader, Center } from "@mantine/core";
import { IconTrophy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { LeaderboardEntry } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
}

export const OctagonLeaderboardModal: React.FC<Props> = ({ opened, onClose }) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all_time">("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened) return;

    let isMounted = true;
    setLoading(true);
    OctagonApi.getLeaderboard(period)
      .then((data) => {
        if (isMounted) {
          setEntries(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [opened, period]);

  const getRankBadge = (rank: string) => {
    const r = rank?.toLowerCase();
    if (r === "brilliant") return <Badge color="violet" variant="light">{`💎 ${t("octagon.rank.brilliant", "Brilliant")}`}</Badge>;
    if (r === "gold") return <Badge color="yellow" variant="light">{`🥇 ${t("octagon.rank.gold", "Oltin")}`}</Badge>;
    if (r === "silver") return <Badge color="gray" variant="light">{`🥈 ${t("octagon.rank.silver", "Kumush")}`}</Badge>;
    return <Badge color="orange" variant="light">{`🥉 ${t("octagon.rank.bronze", "Bronza")}`}</Badge>;
  };

  const getMedalIcon = (position: number) => {
    if (position === 1) return <span className="text-xl">🥇</span>;
    if (position === 2) return <span className="text-xl">🥈</span>;
    if (position === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-sm font-bold text-gray-400">#{position}</span>;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="yellow" variant="light" size="lg" radius="xl">
            <IconTrophy size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.leaderboard.title", "Peshqadamlar Jadvali")}
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      padding="xl"
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
    >
      <Tabs value={period} onChange={(val) => setPeriod((val as "weekly" | "monthly" | "all_time") || "weekly")} variant="pills" radius="xl">
        <Tabs.List grow mb="md">
          <Tabs.Tab value="weekly">{t("octagon.leaderboard.weekly", "Haftalik")}</Tabs.Tab>
          <Tabs.Tab value="monthly">{t("octagon.leaderboard.monthly", "Oylik")}</Tabs.Tab>
          <Tabs.Tab value="all_time">{t("octagon.leaderboard.allTime", "Umumiy")}</Tabs.Tab>
        </Tabs.List>

        {loading ? (
          <Center py="xl">
            <Loader size="md" color="yellow" />
          </Center>
        ) : entries.length === 0 ? (
          <Center py="xl">
            <Text c="dimmed" size="sm">
              {t("octagon.leaderboard.empty", "Hozircha natijalar mavjud emas")}
            </Text>
          </Center>
        ) : (
          <Table.ScrollContainer minWidth={450}>
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60 }}>{t("octagon.leaderboard.rankCol", "O'rin")}</Table.Th>
                  <Table.Th>{t("octagon.leaderboard.userCol", "Foydalanuvchi")}</Table.Th>
                  <Table.Th>{t("octagon.leaderboard.leagueCol", "Liga")}</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>{t("octagon.leaderboard.scoreCol", "ELO Ball")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entries.map((item, idx) => {
                  const playerName = item.displayName || item.name || "O'yinchi";
                  const playerPos = item.position || item.rankPosition || idx + 1;
                  return (
                    <Table.Tr key={item.userId || idx}>
                      <Table.Td>
                        <Center>{getMedalIcon(playerPos)}</Center>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar size="sm" radius="xl" color="blue">
                            {playerName.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={700}>
                              {playerName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t("octagon.leaderboard.winsAndMatches", "{{wins}} G'alaba • {{total}} Jang", {
                                wins: item.wins,
                                total: item.totalMatches,
                              })}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>{getRankBadge(item.rank)}</Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>
                        <Text fw={800} size="sm" c="yellow">
                          {item.eloRating}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}

              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Tabs>
    </Modal>
  );
};
