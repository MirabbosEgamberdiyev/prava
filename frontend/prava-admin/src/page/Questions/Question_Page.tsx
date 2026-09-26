import { useState } from "react";
import {
  Group,
  Title,
  TextInput,
  Select,
  Button,
  Stack,
  Text,
  Modal,
  FileInput,
  Alert,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconDownload,
  IconUpload,
  IconFileSpreadsheet,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { QuestionList } from "../../features/question";
import { useTopicOptions } from "../../features/topic/hooks/useTopics";
import api from "../../services/api";

const Question_Page = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [topicId, setTopicId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const { options: topicOptions } = useTopicOptions();

  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportCsv = async () => {
    setExportLoading(true);
    try {
      const res = await api.get("/api/v1/admin/questions/export/csv", {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `questions_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notifications.show({
        title: t("common.success"),
        message: t("questions.exportSuccess"),
        color: "green",
      });
    } catch {
      notifications.show({
        title: t("common.error"),
        message: t("questions.exportError"),
        color: "red",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      await api.post("/api/v1/admin/questions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      notifications.show({
        title: t("common.success"),
        message: t("questions.importSuccess"),
        color: "green",
      });
      closeImport();
      setImportFile(null);
      window.location.reload();
    } catch (err: any) {
      notifications.show({
        title: t("common.error"),
        message: err.response?.data?.message || t("questions.importError"),
        color: "red",
      });
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap">
        <div>
          <Title order={1} fz="h3">{t("questions.title")}</Title>
          <Text size="sm" c="dimmed">{t("questions.subtitle")}</Text>
        </div>
        <Group gap="xs">
          <Button
            variant="default"
            leftSection={<IconDownload size={16} />}
            loading={exportLoading}
            onClick={handleExportCsv}
          >
            Eksport (CSV)
          </Button>
          <Button
            variant="default"
            leftSection={<IconUpload size={16} />}
            onClick={openImport}
          >
            Import
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate("/questions/add")}
          >
            {t("questions.newQuestion")}
          </Button>
        </Group>
      </Group>

      {/* Filtrlar */}
      <Group wrap="wrap">
        <TextInput
          placeholder={t("questions.searchPlaceholder")}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <Select
          placeholder={t("questions.topicFilter")}
          data={topicOptions}
          value={topicId?.toString() ?? null}
          onChange={(val) => setTopicId(val ? parseInt(val) : null)}
          clearable
          searchable
          w={240}
        />
        <Select
          placeholder={t("questions.difficulty")}
          data={[
            { value: "EASY", label: `${t("questions.easy")} (Easy)` },
            { value: "MEDIUM", label: `${t("questions.medium")} (Medium)` },
            { value: "HARD", label: `${t("questions.hard")} (Hard)` },
          ]}
          value={difficulty}
          onChange={setDifficulty}
          clearable
          w={180}
        />
      </Group>

      <QuestionList
        searchQuery={debouncedSearch}
        topicId={topicId}
      />

      {/* Import Modal */}
      <Modal
        opened={importOpened}
        onClose={closeImport}
        title={t("questions.importModalTitle")}
        centered
      >
        <Stack gap="md">
          <Alert icon={<IconFileSpreadsheet size={20} />} title={t("questions.fileFormat")} color="blue" variant="light">
            {t("questions.fileFormatDesc")}
          </Alert>
          <FileInput
            label={t("questions.selectFile")}
            placeholder={t("questions.selectFilePlaceholder")}
            accept=".json,.csv"
            value={importFile}
            onChange={setImportFile}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeImport}>{t("common.cancel")}</Button>
            <Button
              color="blue"
              loading={importLoading}
              disabled={!importFile}
              onClick={handleImportSubmit}
            >
              {t("questions.uploadAndImport")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Question_Page;
