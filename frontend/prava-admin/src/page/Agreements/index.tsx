import { useEffect, useMemo, useState } from "react";
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

interface FormState {
  id?: number;
  learningCenterId: number | "";
  computerCount: number | "";
  startDate: Date | null;
  endDate: Date | null;
  status: AgreementStatus;
  amount: number | "";
  note: string;
}

const EMPTY_FORM: FormState = {
  learningCenterId: "",
  computerCount: 50,
  startDate: new Date(),
  endDate: null,
  status: "ACTIVE",
  amount: "",
  note: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtAmount(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function statusColor(s: AgreementStatus): string {
  switch (s) {
    case "ACTIVE":    return "green";
    case "PLANNED":   return "blue";
    case "EXPIRED":   return "red";
    case "CANCELLED": return "gray";
  }
}

function statusLabel(s: AgreementStatus): string {
  switch (s) {
    case "ACTIVE":    return "Faol";
    case "PLANNED":   return "Rejada";
    case "EXPIRED":   return "Tugagan";
    case "CANCELLED": return "Bekor qilingan";
  }
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function Agreements_Page() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [centers, setCenters] = useState<LearningCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
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
    } catch (e) {
      notifications.show({
        title: "Xato",
        message: "Ma'lumotlarni yuklab bo'lmadi",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const centerOptions = useMemo(
    () => centers.map((c) => ({ value: String(c.id), label: c.name })),
    [centers],
  );

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (a: Agreement) => {
    setForm({
      id: a.id,
      learningCenterId: a.learningCenterId,
      computerCount: a.computerCount,
      startDate: a.startDate ? new Date(a.startDate) : null,
      endDate: a.endDate ? new Date(a.endDate) : null,
      status: a.status,
      amount: a.amount ?? "",
      note: a.note ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.learningCenterId || !form.computerCount || !form.endDate) {
      notifications.show({
        title: "To'ldirilmagan maydon",
        message: "O'quv markaz, kompyuter soni va tugash sanasi majburiy",
        color: "yellow",
      });
      return;
    }

    setSaving(true);
    try {
      const body = {
        learningCenterId: Number(form.learningCenterId),
        computerCount: Number(form.computerCount),
        startDate: form.startDate ? form.startDate.toISOString().slice(0, 10) : null,
        endDate: form.endDate.toISOString().slice(0, 10),
        status: form.status,
        amount: form.amount === "" ? null : Number(form.amount),
        note: form.note || null,
      };

      if (form.id) {
        await api.put(`/api/v1/admin/learning-center-agreements/${form.id}`, body);
        notifications.show({ title: "Saqlandi", message: "Shartnoma yangilandi", color: "green" });
      } else {
        await api.post("/api/v1/admin/learning-center-agreements", body);
        notifications.show({ title: "Yaratildi", message: "Yangi shartnoma qo'shildi", color: "green" });
      }

      setModalOpen(false);
      loadData();
    } catch (e: any) {
      notifications.show({
        title: "Xato",
        message: e?.response?.data?.message || "Saqlab bo'lmadi",
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (a: Agreement) => {
    modals.openConfirmModal({
      title: "Shartnomani o'chirish",
      children: (
        <Text size="sm">
          {`"${a.learningCenterName}" shartnomasini o'chirmoqchimisiz? Bu amalni orqaga qaytarib bo'lmaydi.`}
        </Text>
      ),
      labels: { confirm: "O'chirish", cancel: "Bekor qilish" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await api.delete(`/api/v1/admin/learning-center-agreements/${a.id}`);
          notifications.show({ title: "O'chirildi", message: "Shartnoma o'chirildi", color: "green" });
          loadData();
        } catch (e: unknown) {
          const message =
            (e as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? "O'chirib bo'lmadi";
          notifications.show({ title: "Xato", message, color: "red" });
        }
      },
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group gap="xs">
          <IconNotebook size={24} />
          <Title order={2}>Shartnoma eslatmalari</Title>
        </Group>
        <Group>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={loadData}>
            Yangilash
          </Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Yangi shartnoma
          </Button>
        </Group>
      </Group>

      <Text c="dimmed" size="sm">
        Oddiy eslatma: o'quv markaz bilan tuzilgan shartnomalarni shu yerda yozib boring.
        Faqat ko'rib qoldirish uchun — aktivatsiya kodlari yoki licenseni bog'lamaydi.
      </Text>

      <Card withBorder shadow="xs" radius="md">
        {loading ? (
          <Center h={200}><Loader /></Center>
        ) : agreements.length === 0 ? (
          <Center h={120}>
            <Text c="dimmed">Hozircha shartnomalar yo'q. "Yangi shartnoma" tugmasini bosing.</Text>
          </Center>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>O'quv markaz</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Komputer</Table.Th>
                <Table.Th>Boshlanish</Table.Th>
                <Table.Th>Tugash</Table.Th>
                <Table.Th>Holat</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Summa</Table.Th>
                <Table.Th>Izoh</Table.Th>
                <Table.Th>Amal</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {agreements.map((a) => (
                <Table.Tr key={a.id}>
                  <Table.Td>
                    <Text fw={600}>{a.learningCenterName}</Text>
                    <Text size="xs" c="dimmed">{a.createdBy} · {fmtDate(a.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Text fw={700}>{a.computerCount}</Text>
                  </Table.Td>
                  <Table.Td>{fmtDate(a.startDate)}</Table.Td>
                  <Table.Td>
                    <Stack gap={2}>
                      <Text>{fmtDate(a.endDate)}</Text>
                      {a.status === "ACTIVE" && a.daysRemaining > 0 && (
                        <Text size="xs" c={a.daysRemaining <= 30 ? "orange" : "dimmed"}>
                          {a.daysRemaining} kun qoldi
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
                      <ActionIcon variant="light" color="blue" onClick={() => openEdit(a)} title="Tahrirlash">
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="red" onClick={() => handleDelete(a)} title="O'chirish">
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
        title={form.id ? "Shartnomani tahrirlash" : "Yangi shartnoma"}
        size="lg"
        centered
      >
        <Stack gap="md">
          <Select
            label="O'quv markaz"
            placeholder="Markazni tanlang"
            data={centerOptions}
            value={form.learningCenterId ? String(form.learningCenterId) : null}
            onChange={(v) => setForm({ ...form, learningCenterId: v ? Number(v) : "" })}
            required
            searchable
            nothingFoundMessage="Topilmadi"
          />

          <Group grow>
            <NumberInput
              label="Komputer soni"
              placeholder="50"
              min={1}
              max={100000}
              value={form.computerCount}
              onChange={(v) => setForm({ ...form, computerCount: typeof v === "number" ? v : "" })}
              required
            />
            <NumberInput
              label="Shartnoma summasi (so'm)"
              placeholder="Bo'sh qoldirish mumkin"
              min={0}
              thousandSeparator=" "
              value={form.amount}
              onChange={(v) => setForm({ ...form, amount: typeof v === "number" ? v : "" })}
            />
          </Group>

          <Group grow>
            <DateInput
              label="Boshlanish sanasi"
              placeholder="Bugun"
              value={form.startDate}
              onChange={(v) => setForm({ ...form, startDate: v as unknown as Date | null })}
              clearable
              valueFormat="DD.MM.YYYY"
            />
            <DateInput
              label="Tugash sanasi"
              placeholder="Tanlang"
              value={form.endDate}
              onChange={(v) => setForm({ ...form, endDate: v as unknown as Date | null })}
              required
              valueFormat="DD.MM.YYYY"
              minDate={form.startDate ?? undefined}
            />
          </Group>

          <Select
            label="Holat"
            data={[
              { value: "ACTIVE",    label: "Faol" },
              { value: "PLANNED",   label: "Rejada" },
              { value: "EXPIRED",   label: "Tugagan" },
              { value: "CANCELLED", label: "Bekor qilingan" },
            ]}
            value={form.status}
            onChange={(v) => setForm({ ...form, status: (v as AgreementStatus) || "ACTIVE" })}
            allowDeselect={false}
          />

          <Textarea
            label="Izoh"
            placeholder="Masalan: Toshkent avtomaktab, 2-bosqich, oldindan to'lov..."
            minRows={3}
            maxRows={8}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.currentTarget.value })}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setModalOpen(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {form.id ? "Saqlash" : "Yaratish"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
