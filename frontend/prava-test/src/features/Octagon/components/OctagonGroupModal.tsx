import React, { useState } from "react";
import {
  Modal,
  Text,
  Stack,
  Group,
  Button,
  TextInput,
  ThemeIcon,
  Badge,
  Tabs,
  CopyButton,
  ActionIcon,
  Tooltip,
  SegmentedControl,
  Switch,
  Alert,
} from "@mantine/core";
import {
  IconUsers,
  IconPlus,
  IconLogin,
  IconCopy,
  IconCheck,
  IconCrown,
  IconDoorExit,
  IconPlayerPlay,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { GroupRoom } from "../types";

interface Props {
  opened: boolean;
  onClose: () => void;
  currentUserId: string;
  currentRoom: GroupRoom | null;
  errorMessage?: string | null;
  onCreateRoom: (maxPlayers: number, isPrivate: boolean) => void;
  onJoinRoom: (roomCode: string) => void;
  onLeaveRoom: () => void;
  onToggleReady: (ready: boolean) => void;
  onStartRoomGame: () => void;
}

export const OctagonGroupModal: React.FC<Props> = ({
  opened,
  onClose,
  currentUserId,
  currentRoom,
  errorMessage,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onToggleReady,
  onStartRoomGame,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("create");
  const [maxPlayers, setMaxPlayers] = useState<string>("4");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>("");

  const isHost = currentRoom?.hostId === currentUserId;
  const myMember = currentRoom?.members?.find((m) => m.userId === currentUserId);
  const canStart = Boolean(
    isHost &&
      currentRoom &&
      currentRoom.members.length >= 2 &&
      currentRoom.members.filter((m) => !m.isHost).every((m) => m.isReady)
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="cyan" variant="light" size="lg" radius="xl">
            <IconUsers size={20} />
          </ThemeIcon>
          <Text fw={800} size="lg">
            {t("octagon.group.title", "Guruhli Bahs (Party)")}
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
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            radius="md"
          >
            {errorMessage}
          </Alert>
        )}

        {!currentRoom ? (
          // ================= VIEW 1: CREATE OR JOIN =================
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            color="cyan"
            styles={{
              tab: { color: "#94a3b8", fontWeight: 700 },
            }}
          >
            <Tabs.List grow mb="md">
              <Tabs.Tab value="create" leftSection={<IconPlus size={16} />}>
                {t("octagon.group.tabCreate", "Xona yaratish")}
              </Tabs.Tab>
              <Tabs.Tab value="join" leftSection={<IconLogin size={16} />}>
                {t("octagon.group.tabJoin", "Xonaga qo'shilish")}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="create">
              <Stack gap="md">
                <div>
                  <Text size="xs" fw={700} c="dimmed" mb={6}>
                    {t("octagon.group.maxPlayers", "Maksimal ishtirokchilar soni:")}
                  </Text>
                  <SegmentedControl
                    fullWidth
                    color="cyan"
                    value={maxPlayers}
                    onChange={setMaxPlayers}
                    data={[
                      { label: "2", value: "2" },
                      { label: "3", value: "3" },
                      { label: "4", value: "4" },
                      { label: "6", value: "6" },
                      { label: "8", value: "8" },
                    ]}
                  />
                </div>

                <Group justify="space-between" py="xs">
                  <div>
                    <Text size="sm" fw={700}>
                      {t("octagon.group.privateRoom", "Xususiy xona")}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t("octagon.group.privateDesc", "Faqat kod orqali kirish mumkin")}
                    </Text>
                  </div>
                  <Switch
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.currentTarget.checked)}
                    color="cyan"
                  />
                </Group>

                <Button
                  fullWidth
                  color="cyan"
                  size="md"
                  radius="md"
                  onClick={() => onCreateRoom(parseInt(maxPlayers, 10), isPrivate)}
                >
                  {t("octagon.group.createBtn", "Xonani Yaratish")}
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="join">
              <Stack gap="md">
                <TextInput
                  label={t("octagon.group.enterCode", "Xona kodi:")}
                  placeholder="Masalan: OCT-4821"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.currentTarget.value.toUpperCase())}
                  radius="md"
                  styles={{
                    input: {
                      background: "#1e293b",
                      color: "#ffffff",
                      fontWeight: 800,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                    },
                  }}
                />

                <Button
                  fullWidth
                  color="cyan"
                  size="md"
                  radius="md"
                  disabled={!joinCode.trim()}
                  onClick={() => onJoinRoom(joinCode.trim())}
                >
                  {t("octagon.group.joinBtn", "Xonaga Kirish")}
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>
        ) : (
          // ================= VIEW 2: ACTIVE ROOM LOBBY =================
          <Stack gap="md">
            {/* Room Code Card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.1))",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <Text size="xs" c="dimmed" fw={700}>
                  {t("octagon.group.roomCodeLabel", "XONA KODI")}
                </Text>
                <Text fw={900} size="xl" style={{ letterSpacing: 2, color: "#38bdf8" }}>
                  {currentRoom.roomCode}
                </Text>
              </div>

              <Group gap="xs">
                <Badge color="cyan" variant="light" size="lg">
                  {currentRoom.members.length} / {currentRoom.maxPlayers}
                </Badge>
                <CopyButton value={currentRoom.roomCode} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? t("octagon.group.copied", "Nusxalandi!") : t("octagon.group.copy", "Nusxalash")}>
                      <ActionIcon color={copied ? "teal" : "cyan"} variant="filled" size="lg" radius="md" onClick={copy}>
                        {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </div>

            {/* Members List */}
            <Stack gap="xs">
              <Text size="xs" fw={700} c="dimmed">
                {t("octagon.group.members", "Ishtirokchilar:")}
              </Text>

              {currentRoom.members.map((member) => (
                <div
                  key={member.userId}
                  style={{
                    background: "#1e293b",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: member.isHost ? "1px solid rgba(234, 179, 8, 0.4)" : "1px solid rgba(148, 163, 184, 0.1)",
                  }}
                >
                  <Group gap="sm">
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        background: member.isHost
                          ? "linear-gradient(135deg, #eab308, #f59e0b)"
                          : "linear-gradient(135deg, #64748b, #475569)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        color: "#ffffff",
                        fontSize: 14,
                      }}
                    >
                      {member.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <Group gap={6}>
                        <Text fw={700} size="sm">
                          {member.displayName}
                        </Text>
                        {member.isHost && (
                          <Tooltip label={t("octagon.group.host", "Xona egasi")}>
                            <IconCrown size={15} style={{ color: "#eab308" }} />
                          </Tooltip>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {member.rankEmoji} {member.eloRating} ELO
                      </Text>
                    </div>
                  </Group>

                  <div>
                    {member.isHost ? (
                      <Badge color="yellow" variant="light" size="sm">
                        {t("octagon.group.hostBadge", "Host")}
                      </Badge>
                    ) : member.isReady ? (
                      <Badge color="emerald" variant="light" size="sm" leftSection={<IconCheck size={12} />}>
                        {t("octagon.group.ready", "Tayyor")}
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light" size="sm">
                        {t("octagon.group.waiting", "Kutilmoqda...")}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </Stack>

            {/* Bottom Actions */}
            <Group justify="space-between" pt="sm">
              <Button
                variant="subtle"
                color="red"
                size="sm"
                leftSection={<IconDoorExit size={16} />}
                onClick={onLeaveRoom}
              >
                {t("octagon.group.leave", "Chiqish")}
              </Button>

              {isHost ? (
                <Button
                  color="cyan"
                  size="md"
                  radius="md"
                  disabled={!canStart}
                  leftSection={<IconPlayerPlay size={18} />}
                  onClick={onStartRoomGame}
                >
                  {t("octagon.group.startGame", "O'yinni Boshlash")}
                </Button>
              ) : (
                <Button
                  color={myMember?.isReady ? "gray" : "emerald"}
                  size="md"
                  radius="md"
                  onClick={() => onToggleReady(!myMember?.isReady)}
                >
                  {myMember?.isReady
                    ? t("octagon.group.unready", "Bekor qilish")
                    : t("octagon.group.setReady", "Men Tayyorman!")}
                </Button>
              )}
            </Group>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
};
