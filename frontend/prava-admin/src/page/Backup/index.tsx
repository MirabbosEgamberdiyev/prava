import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Stack, Title, Group, Badge, Tabs, ThemeIcon } from "@mantine/core";
import {
  IconDatabaseExport, IconDatabaseImport, IconTrash, IconList,
} from "@tabler/icons-react";
import { ExportTab } from "./components/ExportTab";
import { ImportTab } from "./components/ImportTab";
import { ClearTab } from "./components/ClearTab";
import { JobsTab } from "./components/JobsTab";

const Backup_Page = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<string | null>("export");

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            <IconDatabaseExport size={20} />
          </ThemeIcon>
          <Title order={3}>{t("backup.title")}</Title>
        </Group>
        <Badge color="red" variant="light" size="lg">{t("backup.superAdmin")}</Badge>
      </Group>

      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="export" leftSection={<IconDatabaseExport size={15} />}>
            {t("backup.tabs.export")}
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconDatabaseImport size={15} />}>
            {t("backup.tabs.import")}
          </Tabs.Tab>
          <Tabs.Tab value="clear" leftSection={<IconTrash size={15} />} color="red">
            {t("backup.tabs.clear")}
          </Tabs.Tab>
          <Tabs.Tab value="jobs" leftSection={<IconList size={15} />}>
            {t("backup.tabs.jobs")}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="export" pt="md"><ExportTab /></Tabs.Panel>
        <Tabs.Panel value="import" pt="md"><ImportTab /></Tabs.Panel>
        <Tabs.Panel value="clear"  pt="md"><ClearTab  /></Tabs.Panel>
        <Tabs.Panel value="jobs"   pt="md"><JobsTab   /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Backup_Page;
