import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal, Text, Stack, Alert, SimpleGrid, Box, Code, Group, CopyButton,
  Button, Select, TextInput, Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconKey, IconCheck, IconCopy, IconInfoCircle, IconBuilding, IconDeviceDesktop,
} from "@tabler/icons-react";
import { useLicenseMutations } from "../../../features/license/hooks/useLicenseMutations";
import type { ActivationCodeResponse, ActivationCodeRequest } from "../../../features/license/types";
import { useLearningCentersActive } from "../../../features/learningCenter/hooks/useLearningCenters";
import { useComputersAllActive, useComputersByLC } from "../../../features/computer/hooks/useComputers";
import { fmtDate } from "./helpers";

export function GenerateModal({
  opened,
  onClose,
  onSuccess,
}: {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const { generate, handleError } = useLicenseMutations();
  const { centers } = useLearningCentersActive();

  // Local LC selection for narrowing the computer dropdown
  const [filterLcId, setFilterLcId] = useState<number | null>(null);

  // If a specific LC is chosen, load only that LC's computers; otherwise load all
  const { computers: allComputers }  = useComputersAllActive();
  const { computers: lcComputers }   = useComputersByLC(filterLcId);
  const computers = filterLcId ? lcComputers : allComputers;

  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<ActivationCodeResponse | null>(null);

  const today   = new Date().toISOString().split("T")[0];
  const oneYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0];

  const form = useForm<ActivationCodeRequest>({
    initialValues: {
      computerId: 0,
      startDate:  today,
      endDate:    oneYear,
      notes:      "",
    },
    validate: {
      computerId: (v) => (!v || v === 0) ? t("license.validation.computerRequired") : null,
      startDate:  (v) => !v ? t("license.validation.startDateRequired") : null,
      endDate: (v, vals) =>
        !v ? t("license.validation.endDateRequired") :
        v < vals.startDate ? t("license.validation.endBeforeStart") : null,
    },
  });

  // Find the currently selected computer for showing machineId info
  const selectedComputer = computers.find(c => c.id === form.values.computerId) ?? null;

  const handleSubmit = async (values: ActivationCodeRequest) => {
    setLoading(true);
    try {
      const req: ActivationCodeRequest = {
        computerId: values.computerId,
        startDate:  values.startDate,
        endDate:    values.endDate,
        notes:      values.notes?.trim() || undefined,
      };
      const result = await generate(req);
      setGeneratedCode(result);
      onSuccess();
      notifications.show({
        title:   t("license.notifications.generateSuccess"),
        message: t("license.notifications.generateSuccessMsg"),
        color:   "green",
      });
    } catch (e) {
      handleError(e, t("license.notifications.generateError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setGeneratedCode(null);
    setFilterLcId(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">{t("license.generate.title")}</Text>}
      size="lg"
      radius="md"
    >
      {generatedCode ? (
        <Stack gap="md">
          <Alert icon={<IconCheck size={16} />} color="green" title={t("license.generate.successTitle")}>
            {t("license.generate.successMsg")}
          </Alert>

          <SimpleGrid cols={2} spacing="xs">
            {generatedCode.computerName && (
              <Box>
                <Text size="xs" c="dimmed">{t("license.table.computer")}</Text>
                <Text size="sm" fw={500}>{generatedCode.computerName}</Text>
              </Box>
            )}
            {generatedCode.learningCenterName && (
              <Box>
                <Text size="xs" c="dimmed">{t("license.table.learningCenter")}</Text>
                <Text size="sm">{generatedCode.learningCenterName}</Text>
              </Box>
            )}
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.machineId")}</Text>
              <Code fz="xs">{generatedCode.machineId}</Code>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.startDate")}</Text>
              <Text size="sm">{fmtDate(generatedCode.startDate)}</Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed">{t("license.table.endDate")}</Text>
              <Text size="sm">{fmtDate(generatedCode.endDate)}</Text>
            </Box>
          </SimpleGrid>

          <Box>
            <Group justify="space-between" mb={6}>
              <Text size="sm" fw={600}>{t("license.detail.licenseKey")}</Text>
              <CopyButton value={generatedCode.licenseKey} timeout={2000}>
                {({ copied, copy }) => (
                  <Button
                    size="xs"
                    variant="light"
                    color={copied ? "green" : "blue"}
                    leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    onClick={copy}
                  >
                    {copied ? t("license.detail.copied") : t("license.detail.copy")}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Code
              block
              fz="xs"
              style={{
                wordBreak: "break-all",
                userSelect: "all",
                maxHeight: 140,
                overflow: "auto",
              }}
            >
              {generatedCode.licenseKey}
            </Code>
          </Box>

          <Button fullWidth onClick={handleClose}>{t("common.close")}</Button>
        </Stack>
      ) : (
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light">
              {t("license.generate.info")}
            </Alert>

            {/* LC filter — optional, just narrows the computer dropdown */}
            <Select
              label={t("license.generate.learningCenter")}
              placeholder={t("license.generate.learningCenterPlaceholder")}
              data={centers.map(c => ({ value: String(c.id), label: c.name }))}
              value={filterLcId ? String(filterLcId) : null}
              onChange={(v) => {
                setFilterLcId(v ? Number(v) : null);
                form.setFieldValue("computerId", 0);
              }}
              clearable
              searchable
              leftSection={<IconBuilding size={14} />}
            />

            {/* Computer select — required */}
            <Select
              label={t("license.generate.computer")}
              placeholder={t("license.generate.computerPlaceholder")}
              required
              data={computers.map(c => ({
                value: String(c.id),
                label: `${c.name}${c.learningCenterName ? ` — ${c.learningCenterName}` : ""}`,
              }))}
              value={form.values.computerId ? String(form.values.computerId) : null}
              onChange={(v) => form.setFieldValue("computerId", v ? Number(v) : 0)}
              searchable
              leftSection={<IconDeviceDesktop size={14} />}
              error={form.errors.computerId}
            />

            {/* Show machineId of selected computer as readonly info */}
            {selectedComputer && (
              <Box
                p="xs"
                style={(theme) => ({
                  borderRadius: theme.radius.sm,
                  background: theme.colors.gray[0],
                  border: `1px solid ${theme.colors.gray[3]}`,
                })}
              >
                <Text size="xs" c="dimmed" mb={2}>{t("license.generate.machineIdInfo")}</Text>
                <Code fz="xs">{selectedComputer.machineId}</Code>
                {selectedComputer.macAddress && (
                  <Text size="xs" c="dimmed" mt={2}>
                    MAC: <Code fz="xs">{selectedComputer.macAddress}</Code>
                  </Text>
                )}
              </Box>
            )}

            <SimpleGrid cols={2} spacing="sm">
              <TextInput
                type="date"
                label={t("license.generate.startDate")}
                required
                {...form.getInputProps("startDate")}
              />
              <TextInput
                type="date"
                label={t("license.generate.endDate")}
                required
                {...form.getInputProps("endDate")}
              />
            </SimpleGrid>

            <Textarea
              label={t("license.generate.notes")}
              placeholder={t("license.generate.optional")}
              rows={2}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end" mt="xs">
              <Button variant="default" onClick={handleClose}>{t("common.cancel")}</Button>
              <Button
                type="submit"
                loading={loading}
                leftSection={<IconKey size={16} />}
              >
                {t("license.generate.submit")}
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
