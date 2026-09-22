import { useState } from "react";
import {
  Stack,
  Title,
  Card,
  Table,
  Group,
  Select,
  Badge,
  ActionIcon,
  Button,
  Modal,
  Text,
  Pagination,
  Skeleton,
  Paper,
} from "@mantine/core";
import {
  IconEye,
  IconRefresh,
  IconCertificate,
  IconCheck,
  IconX,
  IconClock,
} from "@tabler/icons-react";
import useSWR from "swr";
import { useDisclosure } from "@mantine/hooks";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

interface ExamSession {
  id: number;
  userId?: number;
  userName?: string;
  userFullName?: string;
  status: "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "TERMINATED";
  score?: number;
  totalQuestions?: number;
  correctAnswersCount?: number;
  percentage?: number;
  passed?: boolean;
  timeSpentSeconds?: number;
  startedAt: string;
  completedAt?: string;
}

interface ExamAnswer {
  id: number;
  questionId: number;
  questionTextUzl?: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}

export default function ExamsAuditPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [status, setStatus] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetail, setSessionDetail] = useState<{ session: ExamSession; answers: ExamAnswer[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);

  const queryParams = new URLSearchParams({
    page: String(page - 1),
    size: String(pageSize),
  });
  if (status) queryParams.set("status", status);

  const { data, error, mutate, isValidating } = useSWR(
    `/api/v1/admin/exams?${queryParams.toString()}`,
    () => api.get(`/api/v1/admin/exams?${queryParams.toString()}`).then((res) => res.data?.data)
  );

  const sessions: ExamSession[] = data?.content || [];
  const totalPages: number = data?.totalPages || 1;

  const handleOpenDetail = async (id: number) => {
    setSelectedSessionId(id);
    setLoadingDetail(true);
    openDetailModal();
    try {
      const res = await api.get(`/api/v1/admin/exams/${id}`);
      setSessionDetail(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between" align="center">
        <div>
          <Title order={1} fz="h3" fw={700}>{t("examsAdmin.title")}</Title>
          <Text c="dimmed" size="sm">{t("examsAdmin.subtitle")}</Text>
        </div>
        <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={() => mutate()} loading={isValidating}>
          {t("examsAdmin.refresh")}
        </Button>
      </Group>

      <Card withBorder radius="md" p="md">
        <Stack gap="md">
          <Group>
            <Select
              placeholder={t("examsAdmin.statusFilter")}
              clearable
              data={[
                { value: "COMPLETED", label: "Tugallangan (COMPLETED)" },
                { value: "IN_PROGRESS", label: "Jarayonda (IN_PROGRESS)" },
                { value: "EXPIRED", label: "Vaqti o'tgan (EXPIRED)" },
                { value: "TERMINATED", label: "To'xtatilgan (TERMINATED)" },
              ]}
              value={status}
              onChange={(val) => { setStatus(val || ""); setPage(1); }}
              style={{ width: 260 }}
            />
          </Group>

          {isValidating && !data ? (
            <Stack gap="xs">
              <Skeleton height={45} />
              <Skeleton height={45} />
              <Skeleton height={45} />
            </Stack>
          ) : error ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <Text c="red">{t("examsAdmin.errorLoad")}</Text>
              <Button mt="sm" variant="subtle" onClick={() => mutate()}>{t("examsAdmin.retry")}</Button>
            </Paper>
          ) : sessions.length === 0 ? (
            <Paper p="xl" withBorder style={{ textAlign: "center" }}>
              <IconCertificate size={48} color="gray" />
              <Text c="dimmed" mt="xs">{t("examsAdmin.empty")}</Text>
            </Paper>
          ) : (
            <Table striped highlightOnHover verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("examsAdmin.table.sessionId")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.userId")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.status")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.result")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.passFail")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.duration")}</Table.Th>
                  <Table.Th>{t("examsAdmin.table.startDate")}</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>{t("examsAdmin.table.audit")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sessions.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td fw={700}>#{s.id}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="indigo">User #{s.userId || "N/A"}</Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          s.status === "COMPLETED" ? "green" :
                          s.status === "IN_PROGRESS" ? "blue" : "gray"
                        }
                      >
                        {s.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {s.correctAnswersCount ?? 0} / {s.totalQuestions ?? 20} ({Math.round(s.percentage ?? 0)}%)
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {s.percentage !== undefined && (
                        <Badge color={(s.percentage ?? 0) >= 90 ? "teal" : "red"} variant="light">
                          {(s.percentage ?? 0) >= 90 ? t("examsAdmin.passed") : t("examsAdmin.failed")}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconClock size={14} color="gray" />
                        <Text size="xs" c="dimmed">
                          {s.timeSpentSeconds ? `${Math.round(s.timeSpentSeconds / 60)} daq` : "-"}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {s.startedAt ? new Date(s.startedAt).toLocaleString() : "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenDetail(s.id)}>
                        <IconEye size={18} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </Stack>
      </Card>

      {/* Savolma-savol javoblar auditi modali */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={<Text fw={700} size="lg">{t("examsAdmin.modal.title")} #{selectedSessionId}</Text>}
        size="xl"
      >
        {loadingDetail ? (
          <Stack gap="sm">
            <Skeleton height={50} />
            <Skeleton height={50} />
            <Skeleton height={50} />
          </Stack>
        ) : sessionDetail ? (
          <Stack gap="md">
            <Paper p="md" withBorder bg="gray.0">
              <Group grow>
                <div>
                  <Text size="xs" c="dimmed">Umumiy ball</Text>
                  <Text fw={700} size="lg">{Math.round(sessionDetail.session.percentage ?? 0)}%</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t("examsAdmin.modal.correctAnswers")}</Text>
                  <Text fw={700} size="lg" c="green">{sessionDetail.session.correctAnswersCount ?? 0} ta</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Holati</Text>
                  <Badge color={sessionDetail.session.status === "COMPLETED" ? "green" : "blue"}>
                    {sessionDetail.session.status}
                  </Badge>
                </div>
              </Group>
            </Paper>

            <Title order={4} fw={600}>{t("examsAdmin.modal.answersList")}</Title>

            {sessionDetail.answers.length === 0 ? (
              <Text c="dimmed" ta="center" py="md">Ushbu sessiyada hali birorta javob topshirilmagan</Text>
            ) : (
              <Table striped withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>{t("examsAdmin.modal.colQuestionId")}</Table.Th>
                    <Table.Th>{t("examsAdmin.modal.colSelected")}</Table.Th>
                    <Table.Th>{t("examsAdmin.modal.colCorrect")}</Table.Th>
                    <Table.Th>{t("examsAdmin.modal.colResult")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sessionDetail.answers.map((ans, idx) => (
                    <Table.Tr key={ans.id || idx}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td>Savol #{ans.questionId}</Table.Td>
                      <Table.Td>Variant {ans.selectedOptionIndex}</Table.Td>
                      <Table.Td>Variant {ans.correctOptionIndex}</Table.Td>
                      <Table.Td>
                        {ans.isCorrect ? (
                          <Badge color="green" leftSection={<IconCheck size={12} />}>{t("examsAdmin.modal.correct")}</Badge>
                        ) : (
                          <Badge color="red" leftSection={<IconX size={12} />}>{t("examsAdmin.modal.wrong")}</Badge>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={closeDetailModal}>{t("examsAdmin.modal.close")}</Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </Stack>
  );
}
