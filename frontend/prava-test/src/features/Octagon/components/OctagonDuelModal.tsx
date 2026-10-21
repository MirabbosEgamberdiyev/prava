import React, { useState, useEffect } from "react";
import {
  Modal,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  ThemeIcon,
  CopyButton,
  ActionIcon,
  Tooltip,
  Loader,
  Center,
  Tabs,
  Alert,
  RingProgress,
} from "@mantine/core";
import {
  IconSwords,
  IconCopy,
  IconCheck,
  IconSearch,
  IconLink,
  IconAlertCircle,
  IconUser,
  IconX,
  IconArrowBack,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { OutgoingChallenge, UserSearchResult } from "../types";
import { OctagonOpponentRadar } from "./OctagonOpponentRadar";
import { RADAR_MAX } from "../layout";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { safeName } from "../rank";

interface Props {
  opened: boolean;
  onClose: () => void;
  /** Havola/QR kodi orqali do'st jangiga qo'shilish. */
  onJoinInvite: (code: string) => void;
  onSendChallenge: (target: UserSearchResult) => void;
  onCancelChallenge: () => void;
  onClearOutgoing: () => void;
  outgoing: OutgoingChallenge | null;
}

export const OctagonDuelModal: React.FC<Props> = ({
  opened,
  onClose,
  onJoinInvite,
  onSendChallenge,
  onCancelChallenge,
  onClearOutgoing,
  outgoing,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!opened) {
      setInviteCode("");
      setInputCode("");
      setSearchQuery("");
      setSearchResults([]);
      setSearched(false);
      setSelectedId(null);
      setErrorMessage(null);
      return;
    }
    if (activeTab !== "link" || inviteCode) return;

    let isMounted = true;
    setLoading(true);
    OctagonApi.createChallenge()
      .then((res) => {
        if (isMounted && res?.inviteCode) setInviteCode(res.inviteCode);
      })
      .catch(() => {
        if (isMounted) setErrorMessage(t("octagon.common.error"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [opened, activeTab, inviteCode, t]);

  // 30 soniyalik kutish hisoblagichi
  useEffect(() => {
    if (!outgoing || (outgoing.status !== "waiting" && outgoing.status !== "sending")) return;
    const deadline = Date.now() + outgoing.expiresInSec * 1000;
    setSecondsLeft(outgoing.expiresInSec);
    const id = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);
    return () => window.clearInterval(id);
  }, [outgoing]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) return;
    setIsSearching(true);
    setErrorMessage(null);
    setSelectedId(null);
    try {
      const results: UserSearchResult[] = await OctagonApi.searchUsers(q);
      setSearchResults(results);
      if (results.length === 1) setSelectedId(results[0].userId);
    } catch {
      setErrorMessage(t("octagon.duel.searchError"));
      setSearchResults([]);
    } finally {
      setSearched(true);
      setIsSearching(false);
    }
  };

  const selected = searchResults.find((u) => u.userId === selectedId) || null;
  const overflow = searchResults.slice(RADAR_MAX);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://web.pravaonline.uz";
  const duelUrl = inviteCode ? `${origin}/octagon?duel=${inviteCode}` : "";

  const statusText = (u: UserSearchResult) =>
    u.status === "IN_MATCH"
      ? t("octagon.duel.statusInMatch")
      : u.status === "IN_QUEUE"
      ? t("octagon.duel.statusInQueue")
      : u.isOnline
      ? t("octagon.duel.statusOnline")
      : t("octagon.duel.statusOffline");

  const canChallenge = (u: UserSearchResult) => u.isOnline && u.status !== "IN_MATCH" && u.status !== "OFFLINE";

  // --- Waiting / result overlay for an outgoing challenge ---
  const renderOutgoing = (o: OutgoingChallenge) => {
    const name = safeName(o.targetName, t("octagon.lobby.defaultUser"));
    const waiting = o.status === "waiting" || o.status === "sending";
    const pct = waiting && o.expiresInSec > 0 ? (secondsLeft / o.expiresInSec) * 100 : 0;
    return (
      <Stack align="center" gap="sm" py="sm" className="oct-outgoing">
        <div className={waiting ? "oct-outgoing-pulse" : undefined}>
          <OctagonAvatar name={name} src={o.targetAvatar} size={88} ring={waiting ? "#e879f9" : "#64748b"} />
        </div>
        <Text fw={800} size="lg" ta="center">
          {name}
        </Text>
        {typeof o.targetElo === "number" && (
          <Group gap={6}>
            <Text size="sm" c="dimmed">
              {o.targetElo} ELO
            </Text>
            <OctagonRankBadge elo={o.targetElo} size="xs" />
          </Group>
        )}

        {waiting ? (
          <>
            <RingProgress
              size={92}
              thickness={8}
              roundCaps
              sections={[{ value: pct, color: "grape" }]}
              label={
                <Text ta="center" fw={900} size="xl">
                  {secondsLeft}
                </Text>
              }
            />
            <Text size="sm" c="dimmed" ta="center">
              {t("octagon.duel.waitingFor", { name })}
            </Text>
            <Button variant="default" color="red" radius="md" leftSection={<IconX size={16} />} onClick={onCancelChallenge}>
              {t("octagon.duel.cancelChallenge")}
            </Button>
          </>
        ) : (
          <>
            <Alert color={o.status === "rejected" ? "orange" : "red"} variant="light" radius="md" icon={<IconAlertCircle size={16} />}>
              {o.status === "rejected"
                ? t("octagon.duel.rejectedBy", { name })
                : o.status === "timeout"
                ? t("octagon.duel.noAnswer", { name })
                : o.message || t("octagon.common.error")}
            </Alert>
            <Button variant="light" color="grape" radius="md" leftSection={<IconArrowBack size={16} />} onClick={onClearOutgoing}>
              {t("octagon.duel.pickAnother")}
            </Button>
          </>
        )}
      </Stack>
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="grape" variant="light" size="lg" radius="xl">
            <IconSwords size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.duel.title")}
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
      {outgoing ? (
        renderOutgoing(outgoing)
      ) : (
        <Stack gap="md">
          {errorMessage && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
              {errorMessage}
            </Alert>
          )}

          <Tabs value={activeTab} onChange={setActiveTab} color="grape" styles={{ tab: { color: "#94a3b8", fontWeight: 700 } }}>
            <Tabs.List grow mb="md">
              <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
                {t("octagon.duel.tabSearch")}
              </Tabs.Tab>
              <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
                {t("octagon.duel.tabLink")}
              </Tabs.Tab>
            </Tabs.List>

            {/* TAB 1: qidiruv → radar → tanlash → duelga chorlash */}
            <Tabs.Panel value="search">
              <Stack gap="md">
                <Group gap="xs">
                  <TextInput
                    placeholder={t("octagon.duel.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    style={{ flex: 1 }}
                    radius="md"
                    leftSection={<IconSearch size={16} />}
                    aria-label={t("octagon.duel.searchPlaceholder")}
                  />
                  <Button color="grape" radius="md" loading={isSearching} disabled={searchQuery.trim().length < 2} onClick={handleSearch}>
                    {t("octagon.duel.searchBtn")}
                  </Button>
                </Group>

                {isSearching ? (
                  <Center py="md">
                    <Loader color="grape" size="sm" />
                  </Center>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.length > 1 && (
                      <Text size="xs" c="dimmed" ta="center">
                        {t("octagon.duel.pickHint", { count: searchResults.length })}
                      </Text>
                    )}
                    <OctagonOpponentRadar players={searchResults} selectedId={selectedId} onSelect={setSelectedId} />

                    {overflow.length > 0 && (
                      <div className="oct-pick-overflow">
                        {overflow.map((u) => {
                          const name = safeName(u.displayName, t("octagon.lobby.defaultUser"));
                          return (
                            <button
                              key={u.userId}
                              type="button"
                              className={`oct-pick-chip ${u.userId === selectedId ? "selected" : ""}`}
                              onClick={() => setSelectedId(u.userId)}
                            >
                              <OctagonAvatar name={name} src={u.avatarUrl} size={24} />
                              <span>{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selected ? (
                      <div className="oct-pick-card">
                        <OctagonAvatar
                          name={safeName(selected.displayName, t("octagon.lobby.defaultUser"))}
                          src={selected.avatarUrl}
                          size={64}
                          ring="#e879f9"
                        />
                        <div className="oct-pick-card-info">
                          <Text fw={800} size="md">
                            {safeName(selected.displayName, t("octagon.lobby.defaultUser"))}
                          </Text>
                          <Group gap={6} mt={2}>
                            <Text size="xs" c="dimmed">
                              {selected.eloRating} ELO
                            </Text>
                            <OctagonRankBadge rank={selected.rank} elo={selected.eloRating} size="xs" />
                          </Group>
                          <Text size="xs" mt={2} c={canChallenge(selected) ? "teal" : "dimmed"}>
                            ● {statusText(selected)}
                          </Text>
                        </div>
                        <button
                          type="button"
                          className="oct-3d-btn purple oct-pick-cta"
                          disabled={!canChallenge(selected)}
                          onClick={() => onSendChallenge(selected)}
                        >
                          <IconSwords size={20} stroke={2.5} />
                          <span>{t("octagon.duel.challengeBtn")}</span>
                        </button>
                      </div>
                    ) : (
                      <Text size="xs" c="dimmed" ta="center">
                        {t("octagon.duel.tapToSelect")}
                      </Text>
                    )}
                  </>
                ) : searched ? (
                  <Center py="sm">
                    <Text size="xs" c="dimmed">
                      {t("octagon.duel.noUsersFound")}
                    </Text>
                  </Center>
                ) : (
                  <Center py="sm">
                    <Stack align="center" gap={4}>
                      <IconUser size={32} color="#475569" />
                      <Text size="xs" c="dimmed">
                        {t("octagon.duel.searchHint")}
                      </Text>
                    </Stack>
                  </Center>
                )}
              </Stack>
            </Tabs.Panel>

            {/* TAB 2: havola, QR va kod */}
            <Tabs.Panel value="link">
              {loading ? (
                <Center py="xl">
                  <Loader color="grape" />
                </Center>
              ) : (
                <Stack gap="md">
                  <Text size="sm" c="dimmed">
                    {t("octagon.duel.subtitle")}
                  </Text>

                  {duelUrl && (
                    <Stack align="center" gap="sm" my="xs">
                      <div style={{ padding: 12, background: "#ffffff", borderRadius: 12 }}>
                        <QRCodeSVG value={duelUrl} size={150} level="M" />
                      </div>
                      <Text size="xs" c="dimmed">
                        {t("octagon.duel.scanQr")}
                      </Text>
                    </Stack>
                  )}

                  <Stack gap="xs">
                    <Text size="xs" fw={700} c="dimmed">
                      {t("octagon.duel.inviteLink")}
                    </Text>
                    <Group gap="xs">
                      <TextInput readOnly value={duelUrl} style={{ flex: 1 }} radius="md" aria-label={t("octagon.duel.inviteLink")} />
                      <CopyButton value={duelUrl} timeout={2000}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? t("octagon.duel.copied") : t("octagon.duel.copy")}>
                            <ActionIcon
                              color={copied ? "teal" : "grape"}
                              variant="filled"
                              size="lg"
                              radius="md"
                              onClick={copy}
                              aria-label={t("octagon.duel.copy")}
                            >
                              {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t("octagon.duel.keepPageOpen")}
                    </Text>
                  </Stack>

                  <Text size="xs" fw={700} c="dimmed" mt="xs">
                    {t("octagon.duel.orCode")}
                  </Text>
                  <Group gap="xs">
                    <TextInput
                      placeholder={t("octagon.duel.enterCodePlaceholder")}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.currentTarget.value.toUpperCase())}
                      style={{ flex: 1 }}
                      radius="md"
                      maxLength={32}
                      aria-label={t("octagon.duel.enterCodePlaceholder")}
                    />
                    <Button color="grape" radius="md" disabled={!inputCode.trim()} onClick={() => onJoinInvite(inputCode.trim())}>
                      {t("octagon.duel.join")}
                    </Button>
                  </Group>
                </Stack>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Modal>
  );
};
