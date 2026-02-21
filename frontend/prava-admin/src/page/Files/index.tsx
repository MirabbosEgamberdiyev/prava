import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  Card,
  Group,
  Text,
  TextInput,
  Button,
  Badge,
  FileInput,
  Paper,
  Divider,
} from "@mantine/core";
import {
  IconUpload,
  IconDownload,
  IconTrash,
  IconSearch,
  IconFile,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { modals } from "@mantine/modals";
import fileService from "../../services/fileService";

const Files_Page = () => {
  const { t } = useTranslation();

  // Storage type
  const [storageType, setStorageType] = useState<string>("");

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFolder, setUploadFolder] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // Check exists state
  const [checkFileName, setCheckFileName] = useState("");
  const [checkFolder, setCheckFolder] = useState("");
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<boolean | null>(null);

  // Download state
  const [downloadFileName, setDownloadFileName] = useState("");
  const [downloadFolder, setDownloadFolder] = useState("");
  const [downloadFileUrl, setDownloadFileUrl] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Delete state
  const [deleteFileName, setDeleteFileName] = useState("");
  const [deleteFolder, setDeleteFolder] = useState("");
  const [deleteFileUrl, setDeleteFileUrl] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fileService
      .getStorageType()
      .then((data) => setStorageType(data))
      .catch(() => setStorageType("unknown"));
  }, []);

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      await fileService.upload(uploadFile, uploadFolder || undefined);
      notifications.show({
        title: t("common.success"),
        message: t("files.uploadSuccess"),
        color: "green",
      });
      setUploadFile(null);
      setUploadFolder("");
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("files.uploadError"),
        color: "red",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  // Check exists handler
  const handleCheckExists = async () => {
    if (!checkFileName) return;
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const exists = await fileService.existsByName(
        checkFileName,
        checkFolder || undefined
      );
      setCheckResult(exists);
    } catch {
      setCheckResult(false);
    } finally {
      setCheckLoading(false);
    }
  };

  // Download by name handler
  const handleDownloadByName = async () => {
    if (!downloadFileName) return;
    setDownloadLoading(true);
    try {
      const blob = await fileService.downloadByName(
        downloadFileName,
        downloadFolder || undefined
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("common.error"),
        color: "red",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // Download by URL handler
  const handleDownloadByUrl = async () => {
    if (!downloadFileUrl) return;
    setDownloadLoading(true);
    try {
      const blob = await fileService.downloadByUrl(downloadFileUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileUrl.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      notifications.show({
        title: t("common.error"),
        message: error.response?.data?.message || t("common.error"),
        color: "red",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  // Delete by name handler
  const handleDeleteByName = () => {
    if (!deleteFileName) return;
    modals.openConfirmModal({
      title: t("common.delete"),
      children: (
        <Text size="sm">
          {t("files.deleteByName")}: <strong>{deleteFileName}</strong>
        </Text>
      ),
      labels: {
        confirm: t("common.delete"),
        cancel: t("common.cancel"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          await fileService.deleteByName(
            deleteFileName,
            deleteFolder || undefined
          );
          notifications.show({
            title: t("common.success"),
            message: t("files.deleteSuccess"),
            color: "green",
          });
          setDeleteFileName("");
          setDeleteFolder("");
        } catch (error: any) {
          notifications.show({
            title: t("common.error"),
            message: error.response?.data?.message || t("files.deleteError"),
            color: "red",
          });
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  // Delete by URL handler
  const handleDeleteByUrl = () => {
    if (!deleteFileUrl) return;
    modals.openConfirmModal({
      title: t("common.delete"),
      children: (
        <Text size="sm">
          {t("files.deleteByName")}: <strong>{deleteFileUrl}</strong>
        </Text>
      ),
      labels: {
        confirm: t("common.delete"),
        cancel: t("common.cancel"),
      },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          await fileService.deleteByUrl(deleteFileUrl);
          notifications.show({
            title: t("common.success"),
            message: t("files.deleteSuccess"),
            color: "green",
          });
          setDeleteFileUrl("");
        } catch (error: any) {
          notifications.show({
            title: t("common.error"),
            message: error.response?.data?.message || t("files.deleteError"),
            color: "red",
          });
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>{t("files.title")}</Title>
        <Badge variant="light" size="lg" leftSection={<IconFile size={14} />}>
          {t("files.storageType")}: {storageType || "..."}
        </Badge>
      </Group>

      {/* Upload Section */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md">
          <IconUpload size={20} />
          <Text fw={600} size="lg">
            {t("files.upload")}
          </Text>
        </Group>
        <Stack gap="sm">
          <FileInput
            label={t("files.fileName")}
            placeholder={t("files.fileName")}
            leftSection={<IconFile size={16} />}
            value={uploadFile}
            onChange={setUploadFile}
          />
          <TextInput
            label={t("files.folder")}
            placeholder={t("files.folder")}
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.currentTarget.value)}
          />
          <Group>
            <Button
              leftSection={<IconUpload size={16} />}
              loading={uploadLoading}
              disabled={!uploadFile}
              onClick={handleUpload}
            >
              {t("files.upload")}
            </Button>
          </Group>
        </Stack>
      </Card>

      {/* Check File Existence */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md">
          <IconSearch size={20} />
          <Text fw={600} size="lg">
            {t("files.checkExists")}
          </Text>
        </Group>
        <Stack gap="sm">
          <TextInput
            label={t("files.fileName")}
            placeholder={t("files.fileName")}
            value={checkFileName}
            onChange={(e) => {
              setCheckFileName(e.currentTarget.value);
              setCheckResult(null);
            }}
          />
          <TextInput
            label={t("files.folder")}
            placeholder={t("files.folder")}
            value={checkFolder}
            onChange={(e) => setCheckFolder(e.currentTarget.value)}
          />
          <Group>
            <Button
              variant="light"
              leftSection={<IconSearch size={16} />}
              loading={checkLoading}
              disabled={!checkFileName}
              onClick={handleCheckExists}
            >
              {t("files.checkExists")}
            </Button>
            {checkResult !== null && (
              <Badge
                color={checkResult ? "green" : "red"}
                variant="filled"
                size="lg"
              >
                {checkResult
                  ? t("files.fileExists")
                  : t("files.fileNotExists")}
              </Badge>
            )}
          </Group>
        </Stack>
      </Card>

      {/* Download Section */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md">
          <IconDownload size={20} />
          <Text fw={600} size="lg">
            {t("files.downloadByName")}
          </Text>
        </Group>
        <Stack gap="sm">
          <Paper p="md" withBorder radius="md">
            <Text fw={500} mb="xs">
              {t("files.fileName")}
            </Text>
            <Group align="flex-end">
              <TextInput
                placeholder={t("files.fileName")}
                value={downloadFileName}
                onChange={(e) => setDownloadFileName(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder={t("files.folder")}
                value={downloadFolder}
                onChange={(e) => setDownloadFolder(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconDownload size={16} />}
                loading={downloadLoading}
                disabled={!downloadFileName}
                onClick={handleDownloadByName}
              >
                {t("files.downloadByName")}
              </Button>
            </Group>
          </Paper>

          <Divider />

          <Paper p="md" withBorder radius="md">
            <Text fw={500} mb="xs">
              {t("files.fileUrl")}
            </Text>
            <Group align="flex-end">
              <TextInput
                placeholder={t("files.fileUrl")}
                value={downloadFileUrl}
                onChange={(e) => setDownloadFileUrl(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                leftSection={<IconDownload size={16} />}
                loading={downloadLoading}
                disabled={!downloadFileUrl}
                onClick={handleDownloadByUrl}
              >
                {t("files.downloadByName")}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Card>

      {/* Delete Section */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group mb="md">
          <IconTrash size={20} />
          <Text fw={600} size="lg" c="red">
            {t("files.deleteByName")}
          </Text>
        </Group>
        <Stack gap="sm">
          <Paper p="md" withBorder radius="md">
            <Text fw={500} mb="xs">
              {t("files.fileName")}
            </Text>
            <Group align="flex-end">
              <TextInput
                placeholder={t("files.fileName")}
                value={deleteFileName}
                onChange={(e) => setDeleteFileName(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <TextInput
                placeholder={t("files.folder")}
                value={deleteFolder}
                onChange={(e) => setDeleteFolder(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                loading={deleteLoading}
                disabled={!deleteFileName}
                onClick={handleDeleteByName}
              >
                {t("common.delete")}
              </Button>
            </Group>
          </Paper>

          <Divider />

          <Paper p="md" withBorder radius="md">
            <Text fw={500} mb="xs">
              {t("files.fileUrl")}
            </Text>
            <Group align="flex-end">
              <TextInput
                placeholder={t("files.fileUrl")}
                value={deleteFileUrl}
                onChange={(e) => setDeleteFileUrl(e.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Button
                color="red"
                leftSection={<IconTrash size={16} />}
                loading={deleteLoading}
                disabled={!deleteFileUrl}
                onClick={handleDeleteByUrl}
              >
                {t("common.delete")}
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Card>
    </Stack>
  );
};

export default Files_Page;
