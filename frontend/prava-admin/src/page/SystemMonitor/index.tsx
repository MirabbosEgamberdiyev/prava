import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  Badge,
  Button,
  Tabs,
  Center,
  Loader,
  Code,
  TextInput,
  Paper,
  SimpleGrid,
  Progress,
  Alert,
} from "@mantine/core";
import {
  IconServer,
  IconFileText,
  IconDatabaseExport,
  IconHeartbeat,
  IconTrash,
  IconDownload,
  IconSearch,
  IconRefresh,
  IconAlertTriangle,
} from "@tabler/icons-react";
import useSWR from "swr";
import api from "../../services/api";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { modals } from "@mantine/modals";

const BackupJsonViewer = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useSWR(
    "/api/v1/admin/system/backup",
    async (url) => (await api.get(url)).data,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <Center h={100}><Loader type="bars" /></Center>;

  return (
    <Paper withBorder p="md" radius="md" style={{ maxHeight: 400, overflow: "auto" }}>
      <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
        {data?.data ? JSON.stringify(data.data, null, 2) : t("system.backupNoData")}
      </Code>
    </Paper>
  );
};

const SystemMonitor_Page = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string | null>("info");
  const [logSearch, setLogSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [backupJsonView, setBackupJsonView] = useState(false);

  // Server info
  const { data: infoData, isLoading: infoLoading, mutate: mutateInfo } = useSWR(
    "/api/v1/admin/system/info",
    async (url) => (await api.get(url)).data,
    { revalidateOnFocus: false }
  );

  // Health check
  const { data: healthData, isLoading: healthLoading, mutate: mutateHealth } = useSWR(
    activeTab === "health" ? "/api/v1/admin/system/health" : null,
    async (url) => (await api.get(url)).data,
    { revalidateOnFocus: false }
  );

  // Logs
  const { data: logsData, isLoading: logsLoading, mutate: mutateLogs } = useSWR(
    activeTab === "logs" ? "/api/v1/admin/system/logs" : null,
    async (url) => (await api.get(url)).data,
    { revalidateOnFocus: false }
  );

  // Log search
  const { data: logSearchData } = useSWR(
    logSearch && activeTab === "logs"
      ? `/api/v1/admin/system/logs/search?query=${encodeURIComponent(logSearch)}`
      : null,
    async (url) => (await api.get(url)).data,
    { revalidateOnFocus: false }
  );

  const handleClearLogs = async () => {
    modals.openConfirmModal({
      title: t("system.logClearConfirmTitle"),
      children: <Text size="sm">{t("system.logClearConfirm")}</Text>,
      labels: { confirm: t("system.logClearBtn"), cancel: t("system.logCancelBtn") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await api.delete("/api/v1/admin/system/logs");
          mutateLogs();
          notifications.show({ title: t("common.success"), message: t("system.logClearSuccess"), color: "green" });
        } catch {
          notifications.show({ title: t("common.error"), message: t("system.logClearError"), color: "red" });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleDownloadLogs = async () => {
    try {
      const res = await api.get("/api/v1/admin/system/logs/download", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "server.log";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notifications.show({ title: t("common.error"), message: t("system.logDownloadError"), color: "red" });
    }
  };

  const handleBackupDownload = async () => {
    try {
      const res = await api.get("/api/v1/admin/system/backup/download", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      notifications.show({ title: t("common.error"), message: t("system.backupDownloadError"), color: "red" });
    }
  };

  const handleGC = async () => {
    setActionLoading(true);
    try {
      await api.post("/api/v1/admin/system/gc");
      mutateInfo();
      notifications.show({ title: t("common.success"), message: t("system.gcSuccess"), color: "green" });
    } catch {
      notifications.show({ title: t("common.error"), message: t("system.gcError"), color: "red" });
    } finally {
      setActionLoading(false);
    }
  };

  const info = infoData?.data;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>
          <IconServer size={24} style={{ marginRight: 8, verticalAlign: "middle" }} />
          {t("system.title")}
        </Title>
        <Badge color="red" variant="light" size="lg">{t("system.superAdminBadge")}</Badge>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="info" leftSection={<IconServer size={16} />}>
            {t("system.serverTab")}
          </Tabs.Tab>
          <Tabs.Tab value="health" leftSection={<IconHeartbeat size={16} />}>
            {t("system.healthTab")}
          </Tabs.Tab>
          <Tabs.Tab value="logs" leftSection={<IconFileText size={16} />}>
            {t("system.logsTab")}
          </Tabs.Tab>
          <Tabs.Tab value="backup" leftSection={<IconDatabaseExport size={16} />}>
            {t("system.backupTab")}
          </Tabs.Tab>
        </Tabs.List>

        {/* Server Info */}
        <Tabs.Panel value="info" pt="md">
          {infoLoading ? (
            <Center h={200}><Loader type="bars" /></Center>
          ) : info ? (
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.javaVersion")}</Text>
                  <Text fw={600}>{info.javaVersion || "-"}</Text>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.os")}</Text>
                  <Text fw={600}>{info.osName || "-"}</Text>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.uptime")}</Text>
                  <Text fw={600}>{info.uptime || "-"}</Text>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.cpuCores")}</Text>
                  <Text fw={600}>{info.availableProcessors || "-"}</Text>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.totalMemory")}</Text>
                  <Text fw={600}>{info.totalMemory || "-"}</Text>
                </Card>
                <Card withBorder padding="md" radius="md">
                  <Text size="xs" c="dimmed" tt="uppercase">{t("system.freeMemory")}</Text>
                  <Text fw={600}>{info.freeMemory || "-"}</Text>
                </Card>
              </SimpleGrid>

              {info.memoryUsagePercent !== undefined && (
                <Card withBorder padding="md" radius="md">
                  <Text size="sm" fw={500} mb="xs">{t("system.memoryUsage")}</Text>
                  <Progress
                    value={info.memoryUsagePercent}
                    size="xl"
                    radius="xl"
                    color={info.memoryUsagePercent > 80 ? "red" : info.memoryUsagePercent > 60 ? "yellow" : "green"}
                  />
                  <Text size="xs" c="dimmed" mt={4}>{t("system.memoryPercent", { percent: info.memoryUsagePercent?.toFixed(1) })}</Text>
                </Card>
              )}

              <Group>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  onClick={() => mutateInfo()}
                >
                  {t("system.refresh")}
                </Button>
                <Button
                  variant="light"
                  color="orange"
                  loading={actionLoading}
                  onClick={handleGC}
                >
                  {t("system.gc")}
                </Button>
              </Group>
            </Stack>
          ) : (
            <Center h={200}><Text c="dimmed">{t("system.noInfo")}</Text></Center>
          )}
        </Tabs.Panel>

        {/* Health Check */}
        <Tabs.Panel value="health" pt="md">
          {healthLoading ? (
            <Center h={200}><Loader type="bars" /></Center>
          ) : healthData?.data ? (
            <Stack gap="md">
              <Alert
                color={healthData.data.status === "UP" ? "green" : "red"}
                title={`Status: ${healthData.data.status}`}
              >
                {healthData.data.status === "UP" ? t("system.healthUp") : t("system.healthDown")}
              </Alert>
              <Code block>{JSON.stringify(healthData.data, null, 2)}</Code>
              <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => mutateHealth()} w={150}>
                {t("system.refresh")}
              </Button>
            </Stack>
          ) : (
            <Center h={200}><Text c="dimmed">{t("system.noHealthData")}</Text></Center>
          )}
        </Tabs.Panel>

        {/* Logs */}
        <Tabs.Panel value="logs" pt="md">
          <Stack gap="md">
            <Group>
              <TextInput
                placeholder={t("system.logSearch")}
                leftSection={<IconSearch size={16} />}
                value={logSearch}
                onChange={(e) => setLogSearch(e.currentTarget.value)}
                style={{ flex: 1, maxWidth: 400 }}
              />
              <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={() => mutateLogs()}>
                {t("system.refresh")}
              </Button>
              <Button variant="light" leftSection={<IconDownload size={16} />} onClick={handleDownloadLogs}>
                {t("system.logDownload")}
              </Button>
              <Button variant="light" color="red" leftSection={<IconTrash size={16} />} loading={actionLoading} onClick={handleClearLogs}>
                {t("system.logClear")}
              </Button>
            </Group>

            {logsLoading ? (
              <Center h={200}><Loader type="bars" /></Center>
            ) : (
              <Paper withBorder p="md" radius="md" style={{ maxHeight: 500, overflow: "auto" }}>
                <Code block style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {logSearch && logSearchData?.data
                    ? (typeof logSearchData.data === "string" ? logSearchData.data : JSON.stringify(logSearchData.data, null, 2))
                    : logsData?.data
                      ? (typeof logsData.data === "string" ? logsData.data : JSON.stringify(logsData.data, null, 2))
                      : t("system.logsEmpty")}
                </Code>
              </Paper>
            )}
          </Stack>
        </Tabs.Panel>

        {/* Backup */}
        <Tabs.Panel value="backup" pt="md">
          <Stack gap="md">
            <Alert icon={<IconAlertTriangle size={20} />} color="yellow" variant="light">
              {t("system.backupWarning")}
            </Alert>
            <Group>
              <Button leftSection={<IconDownload size={18} />} onClick={handleBackupDownload}>
                {t("system.backupDownload")}
              </Button>
              <Button
                variant="light"
                onClick={async () => {
                  if (backupJsonView) {
                    setBackupJsonView(false);
                  } else {
                    setBackupJsonView(true);
                  }
                }}
              >
                {backupJsonView ? t("system.backupHideJson") : t("system.backupViewJson")}
              </Button>
            </Group>
            {backupJsonView && (
              <BackupJsonViewer />
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default SystemMonitor_Page;
