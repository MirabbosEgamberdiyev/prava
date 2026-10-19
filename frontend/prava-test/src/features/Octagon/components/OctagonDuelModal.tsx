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
  Badge,
  Alert,
} from "@mantine/core";
import {
  IconSwords,
  IconCopy,
  IconCheck,
  IconSearch,
  IconLink,
  IconAlertCircle,
  IconSend,
  IconUser,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { OctagonApi } from "../OctagonApi";
import type { UserSearchResult } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  onStartDuel: (code: string) => void;
  onSendChallenge?: (targetUserId: string) => void;
}

export const OctagonDuelModal: React.FC<Props> = ({
  opened,
  onClose,
  onStartDuel,
  onSendChallenge,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("search");
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [challengeSentId, setChallengeSentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!opened) {
      setInviteCode("");
      setInputCode("");
      setSearchQuery("");
      setSearchResults([]);
      setChallengeSentId(null);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    OctagonApi.createChallenge()
      .then((res) => {
        if (isMounted && res?.inviteCode) {
          setInviteCode(res.inviteCode);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [opened]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setIsSearching(true);
    setErrorMessage(null);
    try {
      const results = await OctagonApi.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch {
      setErrorMessage(t("octagon.duel.searchError", "Qidirishda xatolik yuz berdi"));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendChallenge = (userId: string) => {
    setChallengeSentId(userId);
    setErrorMessage(null);
    if (onSendChallenge) {
      onSendChallenge(userId);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://web.pravaonline.uz";
  const duelUrl = inviteCode ? `${origin}/octagon?duel=${inviteCode}` : "";

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
            {t("octagon.duel.title", "Do'st bilan 1v1 Duel")}
          </Text>
        </Group>
      }
      centered
      radius="lg"
      padding="lg"
      size="md"
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
        {errorMessage && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" radius="md">
            {errorMessage}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          color="grape"
          styles={{
            tab: { color: "#94a3b8", fontWeight: 700 },
          }}
        >
          <Tabs.List grow mb="md">
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              {t("octagon.duel.tabSearch", "Foydalanuvchini qidirish")}
            </Tabs.Tab>
            <Tabs.Tab value="link" leftSection={<IconLink size={16} />}>
              {t("octagon.duel.tabLink", "Havola va QR-kod")}
            </Tabs.Tab>
          </Tabs.List>

          {/* TAB 1: USER SEARCH & PREVIEW CARD */}
          <Tabs.Panel value="search">
            <Stack gap="md">
              <Group gap="xs">
                <TextInput
                  placeholder={t("octagon.duel.searchPlaceholder", "Ism, telefon yoki ID kiriting...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  style={{ flex: 1 }}
                  radius="md"
                  leftSection={<IconSearch size={16} />}
                />
                <Button
                  color="grape"
                  radius="md"
                  loading={isSearching}
                  disabled={searchQuery.trim().length < 2}
                  onClick={handleSearch}
                >
                  {t("octagon.duel.searchBtn", "Qidirish")}
                </Button>
              </Group>

              {/* Search Results */}
              {isSearching ? (
                <Center py="md">
                  <Loader color="grape" size="sm" />
                </Center>
              ) : searchResults.length > 0 ? (
                <Stack gap="xs">
                  {searchResults.map((user) => {
                    const isOnline = user.isOnline;
                    const status = user.status;
                    const statusColor =
                      status === "IN_MATCH"
                        ? "yellow"
                        : status === "IN_QUEUE"
                        ? "orange"
                        : isOnline
                        ? "emerald"
                        : "gray";

                    const statusText =
                      status === "IN_MATCH"
                        ? t("octagon.duel.statusInMatch", "Jangda")
                        : status === "IN_QUEUE"
                        ? t("octagon.duel.statusInQueue", "Qidiruvda")
                        : isOnline
                        ? t("octagon.duel.statusOnline", "Onlayn")
                        : t("octagon.duel.statusOffline", "Oflayn");

                    const isChallenged = challengeSentId === user.userId;

                    return (
                      <div
                        key={user.userId}
                        style={{
                          background: "#1e293b",
                          borderRadius: 12,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          border: "1px solid rgba(148, 163, 184, 0.12)",
                        }}
                      >
                        <Group gap="sm">
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #a855f7, #6366f1)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              color: "#ffffff",
                              fontSize: 15,
                            }}
                          >
                            {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <Group gap={6}>
                              <Text fw={700} size="sm">
                                {user.displayName}
                              </Text>
                              <Badge size="xs" color={statusColor} variant="dot">
                                {statusText}
                              </Badge>
                            </Group>
                            <Text size="xs" c="dimmed">
                              {user.rankEmoji} {user.eloRating} ELO • ID: {user.userId}
                            </Text>
                          </div>
                        </Group>

                        <Button
                          size="xs"
                          color={isChallenged ? "teal" : "grape"}
                          radius="md"
                          disabled={!isOnline || status === "IN_MATCH" || isChallenged}
                          leftSection={isChallenged ? <IconCheck size={14} /> : <IconSend size={14} />}
                          onClick={() => handleSendChallenge(user.userId)}
                        >
                          {isChallenged
                            ? t("octagon.duel.challengeSent", "Yuborildi...")
                            : t("octagon.duel.challengeBtn", "Jangga Chorlash")}
                        </Button>
                      </div>
                    );
                  })}
                </Stack>
              ) : searchQuery.trim().length >= 2 ? (
                <Center py="sm">
                  <Text size="xs" c="dimmed">
                    {t("octagon.duel.noUsersFound", "Foydalanuvchi topilmadi")}
                  </Text>
                </Center>
              ) : (
                <Center py="sm">
                  <Stack align="center" gap={4}>
                    <IconUser size={32} className="text-slate-600" />
                    <Text size="xs" c="dimmed">
                      {t("octagon.duel.searchHint", "Do'stingizning ismi yoki ID raqamini kiriting")}
                    </Text>
                  </Stack>
                </Center>
              )}
            </Stack>
          </Tabs.Panel>

          {/* TAB 2: LINK & QR CODE */}
          <Tabs.Panel value="link">
            {loading ? (
              <Center py="xl">
                <Loader color="grape" />
              </Center>
            ) : (
              <Stack gap="md">
                <Text size="sm" c="dimmed">
                  {t("octagon.duel.subtitle", "Do'stingizga ushbu havolani yuboring va 1v1 jangda o'zaro kuch sinashing!")}
                </Text>

                {duelUrl && (
                  <Stack align="center" gap="sm" my="xs">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <QRCodeSVG value={duelUrl} size={150} level="M" />
                    </div>
                    <Text size="xs" c="dimmed">
                      {t("octagon.duel.scanQr", "Kamera orqali QR-kodni skaner qiling")}
                    </Text>
                  </Stack>
                )}

                <Stack gap="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    {t("octagon.duel.inviteLink", "Taklif havolasi:")}
                  </Text>
                  <Group gap="xs">
                    <TextInput readOnly value={duelUrl} style={{ flex: 1 }} radius="md" />
                    <CopyButton value={duelUrl} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? t("octagon.duel.copied", "Nusxalandi!") : t("octagon.duel.copy", "Nusxalash")}>
                          <ActionIcon color={copied ? "teal" : "grape"} variant="filled" size="lg" radius="md" onClick={copy}>
                            {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Stack>

                <div className="relative my-1 border-t border-slate-700">
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-slate-900 text-xs text-slate-400">
                    {t("octagon.duel.orCode", "Yoki taklif kodini kiriting")}
                  </span>
                </div>

                <Group gap="xs">
                  <TextInput
                    placeholder={t("octagon.duel.enterCodePlaceholder", "Duel kodi (masalan: 123456)")}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.currentTarget.value.toUpperCase())}
                    style={{ flex: 1 }}
                    radius="md"
                  />
                  <Button
                    color="grape"
                    radius="md"
                    disabled={!inputCode.trim()}
                    onClick={() => onStartDuel(inputCode.trim())}
                  >
                    {t("octagon.duel.join", "Qo'shilish")}
                  </Button>
                </Group>
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
};
