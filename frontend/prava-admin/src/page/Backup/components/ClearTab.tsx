import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Stack, Alert, Card, Text, SimpleGrid, Box, Checkbox, Divider, Badge, Group,
  TextInput, Button, ThemeIcon, Code, List,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconTrash, IconCheck } from "@tabler/icons-react";
import { useBackupMutations } from "../../../features/backup/hooks/useBackupMutations";
import type { ClearOptions, ClearResult } from "../../../features/backup/types";
import { getAffectedTables, isClearEmpty } from "../../../features/backup/types";

const EMPTY_CLEAR: ClearOptions = {
  clearUsers: false, clearTopics: false, clearQuestions: false,
  clearExamPackages: false, clearExamSessions: false, clearPayments: false,
  clearUserPackageAccess: false, clearStatistics: false, clearTokens: false,
  clearMedia: false,
};

export function ClearTab() {
  const { t } = useTranslation();
  const clearConfirmWord = t("backup.clear.confirmWord");

  const [opts, setOpts]               = useState<ClearOptions>(EMPTY_CLEAR);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ClearResult | null>(null);

  const { clearData, handleError } = useBackupMutations();

  const setOpt = (key: keyof ClearOptions, val: boolean) =>
    setOpts(prev => ({ ...prev, [key]: val }));

  const affectedTables = getAffectedTables(opts);
  const isEmpty        = isClearEmpty(opts);
  const canClear       = !isEmpty && confirmText === clearConfirmWord && !loading;

  const handleClear = async () => {
    modals.openConfirmModal({
      title: t("backup.clear.finalConfirmTitle"),
      children: (
        <Stack gap="xs">
          <Text size="sm" c="red" fw={600}>
            {t("backup.clear.irrecoverable")}
          </Text>
          <Text size="sm">
            {t("backup.clear.willClean", { count: affectedTables.length })}
          </Text>
          <List size="xs" spacing={2}>
            {affectedTables.map(table => (
              <List.Item key={table}><Code fz={11}>{table}</Code></List.Item>
            ))}
          </List>
          {opts.clearMedia && (
            <Alert color="red" fz="xs">{t("backup.clear.mediaWillDelete")}</Alert>
          )}
        </Stack>
      ),
      labels: { confirm: t("backup.clear.confirmYes"), cancel: t("backup.clear.confirmNo") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await clearData(opts);
          setResult(res);
          setOpts(EMPTY_CLEAR);
          setConfirmText("");
          notifications.show({
            title: t("backup.clear.successNotif"),
            message: t("backup.clear.successMsg", { count: res.clearedCount }),
            color: "green",
          });
        } catch (e) {
          handleError(e, t("backup.clear.errorMsg"));
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="filled">
        <Text fw={700} size="sm">{t("backup.clear.dangerAlert")}</Text>
        <Text size="xs" mt={4}>{t("backup.clear.dangerAlertDesc")}</Text>
      </Alert>

      <Card withBorder radius="md" p="md">
        <Text fw={600} mb="md">{t("backup.clear.whatToClean")}</Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupExam")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm"
                  label={
                    <>
                      <b>{t("backup.clear.examSessions")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.examSessionsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearExamSessions}
                  onChange={e => setOpt("clearExamSessions", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupFinance")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label={t("backup.clear.payments")}
                  checked={opts.clearPayments} onChange={e => setOpt("clearPayments", e.currentTarget.checked)} />
                <Checkbox size="sm" label={t("backup.clear.packageAccess")}
                  checked={opts.clearUserPackageAccess} onChange={e => setOpt("clearUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb="xs">{t("backup.clear.groupStats")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" label={t("backup.clear.statistics")}
                  checked={opts.clearStatistics} onChange={e => setOpt("clearStatistics", e.currentTarget.checked)} />
                <Checkbox size="sm"
                  label={
                    <>
                      <b>{t("backup.clear.tokens")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.tokensDesc")}</Text>
                    </>
                  }
                  checked={opts.clearTokens} onChange={e => setOpt("clearTokens", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>

          <Stack gap="md">
            <Box>
              <Text size="xs" fw={600} c="orange" mb="xs">{t("backup.clear.groupData")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="orange"
                  label={
                    <>
                      <b>{t("backup.clear.questions")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.questionsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearQuestions} onChange={e => setOpt("clearQuestions", e.currentTarget.checked)} />
                <Checkbox size="sm" color="orange"
                  label={
                    <>
                      <b>{t("backup.clear.examPackages")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.examPackagesDesc")}</Text>
                    </>
                  }
                  checked={opts.clearExamPackages} onChange={e => setOpt("clearExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="red" mb="xs">{t("backup.clear.groupCore")}</Text>
              <Stack gap={6}>
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.allUsers")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.allUsersDesc")}</Text>
                    </>
                  }
                  checked={opts.clearUsers} onChange={e => setOpt("clearUsers", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.allTopics")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.allTopicsDesc")}</Text>
                    </>
                  }
                  checked={opts.clearTopics} onChange={e => setOpt("clearTopics", e.currentTarget.checked)} />
                <Checkbox size="sm" color="red"
                  label={
                    <>
                      <b>{t("backup.clear.mediaFiles")}</b>
                      <Text size="xs" c="dimmed">{t("backup.clear.mediaFilesDesc")}</Text>
                    </>
                  }
                  checked={opts.clearMedia} onChange={e => setOpt("clearMedia", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </Stack>
        </SimpleGrid>

        {!isEmpty && (
          <>
            <Divider my="md" />
            <Alert color="orange" icon={<IconAlertTriangle size={14} />} mb="sm">
              <Text size="xs" fw={600} mb={4}>{t("backup.clear.affectedTablesLabel")}</Text>
              <Group gap={4} wrap="wrap">
                {affectedTables.map(table => (
                  <Badge key={table} size="xs" color="orange" variant="outline">
                    {table}
                  </Badge>
                ))}
                {opts.clearMedia && (
                  <Badge size="xs" color="red" variant="outline">
                    {t("backup.clear.mediaFilesTag")}
                  </Badge>
                )}
              </Group>
            </Alert>

            <TextInput
              label={t("backup.clear.confirmLabel")}
              placeholder={t("backup.clear.confirmPlaceholder")}
              value={confirmText}
              onChange={e => setConfirmText(e.currentTarget.value)}
              error={confirmText && confirmText !== clearConfirmWord ? t("backup.clear.confirmWordError") : null}
              mb="sm"
            />

            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              disabled={!canClear}
              loading={loading}
              onClick={handleClear}
            >
              {t("backup.clear.startBtn", {
                count: affectedTables.length + (opts.clearMedia ? 1 : 0),
              })}
            </Button>
          </>
        )}
      </Card>

      {result && (
        <Card withBorder radius="md" p="md">
          <Group gap="xs" mb="sm">
            <ThemeIcon color="green" variant="light" size="sm"><IconCheck size={14} /></ThemeIcon>
            <Text fw={600} size="sm">{t("backup.clear.resultTitle")}</Text>
          </Group>
          <Group gap="xs" wrap="wrap">
            {result.clearedTables.map(table => (
              <Badge key={table} color="green" variant="light" size="sm">{table}</Badge>
            ))}
            {result.mediaCleared && (
              <Badge color="green" variant="light" size="sm">
                {t("backup.clear.mediaFilesTag")}
              </Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            {t("backup.clear.totalCleaned", { count: result.clearedCount, by: result.clearedBy })}
          </Text>
          <Button size="xs" variant="subtle" mt="xs" onClick={() => setResult(null)}>
            {t("backup.clear.close")}
          </Button>
        </Card>
      )}
    </Stack>
  );
}
