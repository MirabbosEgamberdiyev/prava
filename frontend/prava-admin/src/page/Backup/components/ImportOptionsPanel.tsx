import { useTranslation } from "react-i18next";
import {
  Box, Button, Collapse, Card, Group, SimpleGrid, Stack, Text, Checkbox, Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import type { ImportOptions } from "../../../features/backup/types";

interface ImportOptionsPanelProps {
  options: ImportOptions;
  onChange: (opts: ImportOptions) => void;
}

export function ImportOptionsPanel({ options, onChange }: ImportOptionsPanelProps) {
  const { t } = useTranslation();
  const [open, { toggle }] = useDisclosure(false);

  const set = (key: keyof ImportOptions, val: boolean) =>
    onChange({ ...options, [key]: val });

  const allEnabled = Object.values(options).every(Boolean);
  const toggleAll = () => {
    const val = !allEnabled;
    onChange(Object.fromEntries(
      Object.keys(options).map(k => [k, val])
    ) as unknown as ImportOptions);
  };
  const enabled = Object.values(options).filter(Boolean).length;

  return (
    <Box>
      <Button
        variant="subtle"
        size="xs"
        rightSection={open ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        onClick={toggle}
        px={0}
      >
        {t("backup.importOptions.title", { enabled })}
      </Button>

      <Collapse in={open}>
        <Card withBorder radius="sm" p="sm" mt="xs" bg="gray.0">
          <Group justify="flex-end" mb="sm">
            <Button size="xs" variant="light" onClick={toggleAll}>
              {allEnabled ? t("backup.importOptions.disableAll") : t("backup.importOptions.enableAll")}
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupCore")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label={t("backup.importOptions.users")} checked={options.importUsers}
                  onChange={e => set("importUsers", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.topics")} checked={options.importTopics}
                  onChange={e => set("importTopics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupQuestions")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examPackagesTooltip")}>
                      <span>{t("backup.importOptions.questions")}</span>
                    </Tooltip>
                  }
                  checked={options.importQuestions}
                  onChange={e => set("importQuestions", e.currentTarget.checked)} />
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examPackagesTooltip")}>
                      <span>{t("backup.importOptions.examPackages")}</span>
                    </Tooltip>
                  }
                  checked={options.importExamPackages}
                  onChange={e => set("importExamPackages", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupExam")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.examSessionsTooltip")}>
                      <span>{t("backup.importOptions.examSessions")}</span>
                    </Tooltip>
                  }
                  checked={options.importExamSessions}
                  onChange={e => set("importExamSessions", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.userStatistics")} checked={options.importUserStatistics}
                  onChange={e => set("importUserStatistics", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupFinance")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs" label={t("backup.importOptions.payments")} checked={options.importPayments}
                  onChange={e => set("importPayments", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.packageAccess")} checked={options.importUserPackageAccess}
                  onChange={e => set("importUserPackageAccess", e.currentTarget.checked)} />
              </Stack>
            </Box>

            <Box>
              <Text size="xs" fw={600} c="dimmed" mb={4}>{t("backup.importOptions.groupTokens")}</Text>
              <Stack gap={4}>
                <Checkbox size="xs"
                  label={
                    <Tooltip label={t("backup.importOptions.tokensTooltip")}>
                      <span>{t("backup.importOptions.tokens")}</span>
                    </Tooltip>
                  }
                  checked={options.importTokens}
                  onChange={e => set("importTokens", e.currentTarget.checked)} />
                <Checkbox size="xs" label={t("backup.importOptions.media")} checked={options.importMedia}
                  onChange={e => set("importMedia", e.currentTarget.checked)} />
              </Stack>
            </Box>
          </SimpleGrid>
        </Card>
      </Collapse>
    </Box>
  );
}
