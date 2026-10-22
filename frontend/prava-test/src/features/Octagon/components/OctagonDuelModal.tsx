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
  Divider,
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
  IconShare,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { InviteJoinState, OutgoingChallenge, UserSearchResult } from "../types";
import { OctagonPinInput } from "./OctagonPinInput";
import { showToast } from "../../../utils/notificationUtils";
import { OctagonAvatar } from "./OctagonAvatar";
import { OctagonRankBadge } from "./OctagonRankBadge";
import { safeName } from "../rank";

interface Props {
  opened: boolean;
  onClose: () => void;
  /** 4 xonali kod / havola / QR orqali do'st jangiga qo'shilish. */
  onJoinInvite: (code: string) => void;
  /** Kod bilan qo'shilish holati (xato oynada ko'rsatiladi). */
  inviteJoin?: InviteJoinState;
  onResetInviteJoin?: () => void;
  onSendChallenge: (target: UserSearchResult) => void;
  onCancelChallenge: () => void;
  onClearOutgoing: () => void;
  outgoing: OutgoingChallenge | null;
}

const CODE_LENGTH = 4;
/** Taklif havolasi asosiy domenda: pravaonline.uz/oktagon?code=1234 (saytda kod o'zi kiritiladi). */
const INVITE_BASE_URL = "https://pravaonline.uz/oktagon?code=";

export const OctagonDuelModal: React.FC<Props> = ({
  opened,
  onClose,
  onJoinInvite,
  inviteJoin,
  onResetInviteJoin,
  onSendChallenge,
  onCancelChallenge,
  onClearOutgoing,
  outgoing,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const joining = inviteJoin?.status === "joining";
  const joinError = inviteJoin?.status === "error" ? inviteJoin.message || t("octagon.duel.codeNotFound") : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!opened) {
      setInviteCode("");
      setInviteUrl("");
      setInputCode("");
      setSearchQuery("");
      setSearchResults([]);
      setSearched(false);
      setErrorMessage(null);
      onResetInviteJoin?.();
      return;
    }
    if (activeTab !== "link" || inviteCode) return;

    let isMounted = true;
    setLoading(true);
    OctagonApi.createChallenge()
      .then((res) => {
        if (isMounted && res?.inviteCode) {
          setInviteCode(res.inviteCode);
          setInviteUrl(res.inviteUrl || `${INVITE_BASE_URL}${res.inviteCode}`);
        }
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
  }, [opened, activeTab, inviteCode, t, onResetInviteJoin]);

  // Xato kod — kataklar tozalanadi, foydalanuvchi darhol qayta kiritadi
  useEffect(() => {
    if (inviteJoin?.status === "error") setInputCode("");
  }, [inviteJoin?.status]);

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
    try {
      const results: UserSearchResult[] = await OctagonApi.searchUsers(q);
      setSearchResults(results);
    } catch {
      setErrorMessage(t("octagon.duel.searchError"));
      setSearchResults([]);
    } finally {
      setSearched(true);
      setIsSearching(false);
    }
  };

  const duelUrl = inviteCode ? inviteUrl || `${INVITE_BASE_URL}${inviteCode}` : "";
  const shareText = inviteCode ? t("octagon.duel.shareText", { code: inviteCode, url: duelUrl }) : "";

  /** Telefon/brauzerda tizim "Ulashish" oynasi; bo'lmasa (desktop) tayyor matn nusxalanadi. */
  const handleShare = async () => {
    if (!shareText) return;
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: "PRAVA ONLINE", text: shareText });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await nav?.clipboard?.writeText(shareText);
      showToast({ color: "teal", message: t("octagon.duel.shareCopied") });
    } catch {
      showToast({ color: "red", message: t("octagon.common.error") });
    }
  };

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
      closeButtonProps={{ "aria-label": t("common.close") }}
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
      classNames={{ content: "oct-modal-dark", header: "oct-modal-dark-header", close: "oct-modal-dark-close" }}
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
                  // Bir xil ismli o'yinchilar ID orqali farqlanadi; har qatorda — o'z "Chaqirish" tugmasi
                  <ul className="oct-user-list" aria-label={t("octagon.duel.tabSearch")}>
                    {searchResults.map((u) => {
                      const name = safeName(u.displayName, t("octagon.lobby.defaultUser"));
                      const ok = canChallenge(u);
                      return (
                        <li key={u.userId} className="oct-user-item">
                          <span className="oct-user-item-avatar">
                            <OctagonAvatar name={name} src={u.avatarUrl} size={44} />
                            <span className={`oct-presence ${ok ? "on" : "off"}`} aria-hidden="true" />
                          </span>
                          <div className="oct-user-item-info">
                            <div className="oct-user-item-name">
                              <span className="oct-user-item-text">{name}</span>
                              <span className="oct-user-id">#{u.userId}</span>
                            </div>
                            <div className="oct-user-item-meta">
                              <span>{u.eloRating} ELO</span>
                              <OctagonRankBadge rank={u.rank} elo={u.eloRating} size="xs" />
                              <span className={`oct-user-status ${ok ? "on" : ""}`}>{statusText(u)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="oct-3d-btn purple oct-invite-btn"
                            disabled={!ok}
                            onClick={() => onSendChallenge(u)}
                            aria-label={t("octagon.duel.challengeNamed", { name })}
                          >
                            <IconSwords size={16} stroke={2.6} />
                            <span>{t("octagon.duel.challengeShort")}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
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

            {/* TAB 2: o'z kodim (4 raqam) + ulashish + QR, do'st kodini kiritish (4 katak) */}
            <Tabs.Panel value="link">
              <Stack gap="md">
                {/* Do'stning kodi: 4-raqam kiritilishi bilan jang boshlanadi (Enter shart emas) */}
                <Stack gap={8} align="center">
                  <Text size="sm" fw={800} ta="center">
                    {t("octagon.duel.enterFriendCode")}
                  </Text>
                  <OctagonPinInput
                    value={inputCode}
                    onChange={(v) => {
                      setInputCode(v);
                      if (inviteJoin?.status === "error") onResetInviteJoin?.();
                    }}
                    onComplete={(code) => onJoinInvite(code)}
                    length={CODE_LENGTH}
                    disabled={joining}
                    error={Boolean(joinError)}
                    label={t("octagon.duel.enterFriendCode")}
                  />
                  {joining ? (
                    <Group gap={6}>
                      <Loader color="grape" size="xs" />
                      <Text size="xs" c="dimmed">
                        {t("octagon.duel.joiningInvite")}
                      </Text>
                    </Group>
                  ) : joinError ? (
                    <Text size="xs" c="red.4" ta="center" role="alert">
                      {joinError}
                    </Text>
                  ) : (
                    <Text size="xs" c="dimmed" ta="center">
                      {t("octagon.duel.enterFriendCodeHint")}
                    </Text>
                  )}
                </Stack>

                <Divider label={t("octagon.duel.orYourCode")} labelPosition="center" color="rgba(148,163,184,0.25)" />

                {loading ? (
                  <Center py="md">
                    <Loader color="grape" />
                  </Center>
                ) : inviteCode ? (
                  <>
                    <div className="oct-code-card">
                      <Text size="xs" fw={800} c="dimmed" tt="uppercase">
                        {t("octagon.duel.yourCode")}
                      </Text>
                      <div className="oct-code-digits" aria-label={inviteCode}>
                        {inviteCode.split("").map((d, i) => (
                          <span key={i} className="oct-code-digit">
                            {d}
                          </span>
                        ))}
                      </div>
                      <Group gap="xs" mt={4}>
                        <CopyButton value={inviteCode} timeout={2000}>
                          {({ copied, copy }) => (
                            <Button
                              variant="light"
                              color={copied ? "teal" : "grape"}
                              radius="md"
                              leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                              onClick={copy}
                            >
                              {copied ? t("octagon.duel.copied") : t("octagon.duel.copyCode")}
                            </Button>
                          )}
                        </CopyButton>
                        <Button color="grape" radius="md" leftSection={<IconShare size={16} />} onClick={() => void handleShare()}>
                          {t("octagon.duel.share")}
                        </Button>
                      </Group>
                      <Text size="xs" c="dimmed" ta="center">
                        {t("octagon.duel.codeValidity")}
                      </Text>
                    </div>

                    <Group align="center" gap="md" wrap="nowrap">
                      <div style={{ padding: 8, background: "#ffffff", borderRadius: 10, flexShrink: 0 }}>
                        <QRCodeSVG value={duelUrl} size={96} level="M" />
                      </div>
                      <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" c="dimmed">
                          {t("octagon.duel.scanQr")}
                        </Text>
                        <Group gap="xs" wrap="nowrap">
                          <TextInput readOnly value={duelUrl} style={{ flex: 1, minWidth: 0 }} radius="md" size="xs" aria-label={t("octagon.duel.inviteLink")} />
                          <CopyButton value={duelUrl} timeout={2000}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? t("octagon.duel.copied") : t("octagon.duel.copy")}>
                                <ActionIcon
                                  color={copied ? "teal" : "grape"}
                                  variant="filled"
                                  size="md"
                                  radius="md"
                                  onClick={copy}
                                  aria-label={t("octagon.duel.copy")}
                                >
                                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Stack>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t("octagon.duel.keepPageOpen")}
                    </Text>
                  </>
                ) : null}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Modal>
  );
};
