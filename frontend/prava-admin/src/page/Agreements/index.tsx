import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Badge, Button, Card, Group, Modal, NumberInput, Select, Stack,
  Table, Text, Textarea, Title, Tooltip, ActionIcon, Loader, Center,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconPlus, IconEdit, IconTrash, IconNotebook, IconRefresh,
} from "@tabler/icons-react";
import api from "../../services/api";
import { formatDateShort } from "../../utils/formatDate";

// ─── Types ───────────────────────────────────────────────────────────────────
type AgreementStatus = "PLANNED" | "ACTIVE" | "EXPIRED" | "CANCELLED";

interface LearningCenter {
  id: number;
  name: string;
}

interface Agreement {
  id: number;
  learningCenterId: number;
  learningCenterName: string;
  computerCount: number;
  startDate: string | null;
  endDate: string;
  status: AgreementStatus;
  amount: number | null;
  note: string | null;
  createdAt: string;
  createdBy: string;
  daysRemaining: number;
}

/**
 * Mantine 8 `DateInput` string ("YYYY-MM-DD") bilan ishlaydi, `Date` bilan emas.
 * Ilgari bu maydonlar `Date | null` deb tiplangan va onChange qiymati
 * `as unknown as Date` bilan majburan o'zgartirilgan edi — natijada saqlashda
 * `form.endDate.toISOString()` runtime'da xato berardi. Backend ham aynan
 * "YYYY-MM-DD" kutadi, shuning uchun stringni o'zini saqlaymiz: bu bir vaqtning
 * o'zida `toISOString()` dagi UTC siljish (kun -1) muammosini ham yopadi.
 */
interface FormState {
  id?: number;
  learningCenterId: number | "";
  computerCount: number | "";
  startDate: string | null;
  endDate: string | null;
  status: AgreementStatus;
  amount: number | "";
  note: string;
}

/** Bugungi sanani mahalliy vaqt zonasida "YYYY-MM-DD" ko'rinishida qaytaradi. */
function todayLocalISO(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Bo'sh forma. Ilgari modul yuklanganda bir marta hisoblanardi — panel tunda
 * ochiq qolsa "bugun" kechagi sanada qotib qolardi.
 */
function emptyForm(): FormState {
  return {
    learningCenterId: "",
    computerCount: 50,
    startDate: todayLocalISO(),
    endDate: null,
    status: "ACTIVE",
    amount: "",
    note: "",
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s: AgreementStatus): string {
  switch (s) {
    case "ACTIVE":    return "green";
    case "PLANNED":   return "blue";
    case "EXPIRED":   return "red";
    case "CANCELLED": return "gray";
    default:          return "gray";
  }
}

function errMessage(e: unknown): string | undefined {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Agreements_Page() {
  const { t } = useTranslation();

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [centers, setCenters] = useState<LearningCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agreementsRes, centersRes] = await Promise.all([
        api.get("/api/v1/admin/learning-center-agreements?page=0&size=200"),
        api.get("/api/v1/admin/learning-centers?page=0&size=200"),
      ]);

      // Pagination response: { data: { content: [...] } }
      const aData = agreementsRes.data?.data;
      const aList = Array.isArray(aData) ? aData : aData?.content ?? [];
      setAgreements(aList);

      const cData = centersRes.data?.data;
      const cList = Array.isArray(cData) ? cData : cData?.content ?? [];
      setCenters(cList.map((c: LearningCenter) => ({ id: c.id, name: c.name })));
      setLoadError(null);
    } catch (e: unknown) {
      // `e` ilgari umuman ishlatilmasdi — backend tushuntirishi yo'qolardi
      const message = errMessage(e) ?? t("agreements.notifications.loadError");
      setLoadError(message);
      notifications.show({ title: t("common.error"), message, color: "red" });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const centerOptions = useMemo(
    () => centers.map((c) => ({ value: String(c.id), label: c.name })),
    [centers],
  );

  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE",    label: t("agreements.status.active") },
      { value: "PLANNED",   label: t("agreements.status.planned") },
      { value: "EXPIRED",   label: t("agreements.status.expired") },
      { value: "CANCELLED", label: t("agreements.status.cancelled") },
    ],
    [t],
  );

  const statusLabel = useCallback(
    (s: AgreementStatus) => t(`agreements.status.${s.toLowerCase()}`),
    [t],
  );

  const fmtAmount = useCallback(
    (amount: number | null | undefined): string => {
      if (amount == null) return "—";
      return `${new Intl.NumberFormat("uz-UZ").format(amount)} ${t("agreements.currency")}`;
    },
    [t],
  );

  const openCreate = () => {
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (a: Agreement) => {
    setForm({
      id: a.id,
      learningCenterId: a.learningCenterId,
      computerCount: a.computerCount,
      startDate: a.startDate ? a.startDate.slice(0, 10) : null,
      endDate: a.endDate ? a.endDate.slice(0, 10) : null,
      status: a.status,
      amount: a.amount ?? "",
      note: a.note ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (saving) return; // ikki marta yuborilishidan himoya

    if (!form.learningCenterId || !form.computerCount || !form.endDate) {
      notifications.show({
        title: t("agreements.validation.requiredTitle"),
        message: t("agreements.validation.requiredMsg"),
        color: "yellow",
      });
      return;
    }

    setSaving(true);
    try {
      const body = {
        learningCenterId: Number(form.learningCenterId),
        computerCount: Number(form.computerCount),
        startDate: form.startDate || null,
        endDate: form.endDate,
        status: form.status,
        amount: form.amount === "" ? null : Number(form.amount),
        note: form.note || null,
      };

      if (form.id) {
        await api.put(`/api/v1/admin/learning-center-agreements/${form.id}`, body);
        notifications.show({
          title: t("agreements.notifications.updateSuccess"),
          message: t("agreements.notifications.updateSuccessMsg"),
          color: "green",
        });
      } else {
        await api.post("/api/v1/admin/learning-center-agreements", body);
        notifications.show({
          title: t("agreements.notifications.createSuccess"),
          message: t("agreements.notifications.createSuccessMsg"),
          color: "green",
        });
      }

      setModalOpen(false);
      await loadData();
    } catch (e: unknown) {
      notifications.show({
        title: t("common.error"),
        message: errMessage(e) ?? t("agreements.notifications.saveError"),
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (a: Agreement) => {
    modals.openConfirmModal({
      title: t("agreements.delete.title"),
      children: (
        <Text size="sm">
          {t("agreements.delete.confirm", { name: a.learningCenterName })}
        </Text>
      ),
      labels: { confirm: t("common.delete"), cancel: t("common.cancel") },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.delete(`/api/v1/admin/learning-center-agreements/${a.id}`);
          notifications.show({
            title: t("agreements.notifications.deleteSuccess"),
            message: t("agreements.notifications.deleteSuccessMsg"),
            color: "green",
          });
          await loadData();
        } catch (e: unknown) {
          notifications.show({
            title: t("common.error"),
            message: errMessage(e) ?? t("agreements.notifications.deleteError"),
            color: "red",
          });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconNotebook size={24} />
          <Title order={1} fz="h3">{t("agreements.title")}</Title>
        </Group>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="light"
            onClick={loadData}
            loading={loading}
          >
            {t("common.refresh")}
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            {t("agreements.newBtn")}
          </Button>
        </Group>
      </Group>

      <Text c="dimmed" size="sm">{t("agreements.subtitle")}</Text>

      <Card withBorder shadow="xs" radius="md">
        {loading ? (
          <Center h={200}><Loader /></Center>
        ) : loadError ? (
          <Center h={120}>
            <Stack align="center" gap="xs">
              <Text c="red" size="sm">{loadError}</Text>
              <Button size="xs" variant="light" onClick={loadData}>
                {t("common.refresh")}
              </Button>
            </Stack>
          </Center>
        ) : agreements.length === 0 ? (
          <Center h={120}>
            <Text c="dimmed">{t("agreements.empty")}</Text>
          </Center>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("agreements.table.center")}</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>{t("agreements.table.computers")}</Table.Th>
                <Table.Th>{t("agreements.table.startDate")}</Table.Th>
                <Table.Th>{t("agreements.table.endDate")}</Table.Th>
                <Table.Th>{t("agreements.table.status")}</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>{t("agreements.table.amount")}</Table.Th>
                <Table.Th>{t("agreements.table.note")}</Table.Th>
                <Table.Th>{t("agreements.table.actions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {agreements.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Text fw={600}>{a.learningCenterName}</Text>
                    <Text size="xs" c="dimmed">
                      {a.createdBy} · {formatDateShort(a.createdAt)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fw={700}>{a.computerCount}</Text>
                  </Table.Td>
                  <Table.Td>{formatDateShort(a.startDate)}</Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text>{formatDateShort(a.endDate)}</Text>
                      {a.status === "ACTIVE" && a.daysRemaining > 0 && (
                        <Text size="xs" c={a.daysRemaining <= 30 ? "orange" : "dimmed"}>
                          {t("agreements.daysRemaining", { count: a.daysRemaining })}
                        </Text>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={statusColor(a.status)} variant="light">
                      {statusLabel(a.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>{fmtAmount(a.amount)}</Table.Td>
                  <Table.Td>
                    <Tooltip label={a.note ?? ""} disabled={!a.note}>
                      <Text size="sm" lineClamp={2} maw={240}>
                        {a.note || "—"}
                      </Text>
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon
                        variant="light" color="blue"
                        onClick={() => openEdit(a)}
                        title={t("common.edit")} aria-label={t("common.edit")}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light" color="red"
                        onClick={() => handleDelete(a)}
                        title={t("common.delete")} aria-label={t("common.delete")}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? t("agreements.form.editTitle") : t("agreements.form.createTitle")}
        size="lg"
        centered
      >
        <Stack gap="md">
          <Select
            label={t("agreements.form.center")}
            placeholder={t("agreements.form.centerPlaceholder")}
            data={centerOptions}
            value={form.learningCenterId ? String(form.learningCenterId) : null}
            onChange={(v) => setForm((f) => ({ ...f, learningCenterId: v ? Number(v) : "" }))}
            required
            searchable
            nothingFoundMessage={t("agreements.form.centerNotFound")}
          />

          <Group grow>
            <NumberInput
              label={t("agreements.form.computerCount")}
              placeholder={t("agreements.form.computerCountPlaceholder")}
              min={1}
              max={100000}
              value={form.computerCount}
              onChange={(v) => setForm((f) => ({ ...f, computerCount: typeof v === "number" ? v : "" }))}
              required
            />
            <NumberInput
              label={t("agreements.form.amount")}
              placeholder={t("agreements.form.amountPlaceholder")}
              min={0}
              thousandSeparator=" "
              value={form.amount}
              onChange={(v) => setForm((f) => ({ ...f, amount: typeof v === "number" ? v : "" }))}
            />
          </Group>

          <Group grow>
            <DateInput
              label={t("agreements.form.startDate")}
              placeholder={t("agreements.form.startDatePlaceholder")}
              value={form.startDate}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  startDate: v,
                  // Boshlanish sanasi tugash sanasidan keyinga surilsa,
                  // eskirgan tugash sanasi jimgina qolib ketmasin
                  endDate: v && f.endDate && f.endDate < v ? null : f.endDate,
                }))
              }
              clearable
              valueFormat="DD.MM.YYYY"
            />
            <DateInput
              label={t("agreements.form.endDate")}
              placeholder={t("agreements.form.endDatePlaceholder")}
              value={form.endDate}
              onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
              required
              valueFormat="DD.MM.YYYY"
              minDate={form.startDate ?? undefined}
            />
          </Group>

          <Select
            label={t("agreements.form.status")}
            data={statusOptions}
            value={form.status}
            onChange={(v) => setForm((f) => ({ ...f, status: (v as AgreementStatus) || "ACTIVE" }))}
            allowDeselect={false}
          />

          <Textarea
            label={t("agreements.form.note")}
            placeholder={t("agreements.form.notePlaceholder")}
            minRows={3}
            maxRows={8}
            value={form.note}
            onChange={(e) => {
              const note = e.currentTarget.value;
              setForm((f) => ({ ...f, note }));
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setModalOpen(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {form.id ? t("common.save") : t("agreements.form.submitCreate")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
