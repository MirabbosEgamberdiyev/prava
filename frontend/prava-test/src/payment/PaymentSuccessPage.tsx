import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { errorKeyFor } from "../types/errors";
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconCreditCard,
  IconX,
  IconSparkles,
} from '@tabler/icons-react';
import { paymentApi } from './paymentApi';
import type { PaymentStatusResponse } from './paymentApi';

/**
 * Polls /payment/{id}/status until state is terminal (PERFORMED / CANCELLED / REFUNDED / FAILED).
 * Attach this component to the route /payment/success
 * — Click return_url and Payme c= param both redirect here with ?payment=<id>
 */
export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  // Error is stored as a code (not a translated string) so the polling effect
  // does not depend on `t` and does not restart when the language changes.
  const [error, setError] = useState<
    { kind: 'missingId' | 'invalidId' } | { kind: 'server'; messageKey: string } | null
  >(null);
  const [polling, setPolling] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idStr = params.get('payment');
    if (!idStr) {
      setError({ kind: 'missingId' });
      setPolling(false);
      return;
    }
    const id = Number(idStr);
    if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
      setError({ kind: 'invalidId' });
      setPolling(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30; // ~90 seconds
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const r = await paymentApi.status(id);
        if (cancelled) return;
        setStatus(r);
        if (
          r.state === 'PERFORMED' ||
          r.state === 'CANCELLED' ||
          r.state === 'REFUNDED' ||
          r.state === 'FAILED'
        ) {
          setPolling(false);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          setTimedOut(true);
          setPolling(false);
          return;
        }
        timer = setTimeout(tick, 3000);
      } catch (e: any) {
        if (cancelled) return;
        // W-05: backend'ning xom xato matni ko'rsatilmaydi — xato turiga mos lokal matn
        setError({ kind: 'server', messageKey: errorKeyFor(e, "common.unknownError") });
        setPolling(false);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [refreshNonce]);

  const handleManualRefresh = () => {
    setError(null);
    setTimedOut(false);
    setPolling(true);
    setRefreshNonce((n) => n + 1);
  };

  const errorText = !error
    ? null
    : error.kind === 'missingId'
    ? t("payment.missingId")
    : error.kind === 'invalidId'
    ? t("payment.invalidPaymentId")
    : error.kind === 'server'
    ? t(error.messageKey)
    : t("common.unknownError");

  const isSuccess = status?.state === 'PERFORMED';
  const isFailed =
    status?.state === 'CANCELLED' ||
    status?.state === 'REFUNDED' ||
    status?.state === 'FAILED';

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'PERFORMED':
        return t("payment.statePerformed");
      case 'CANCELLED':
        return t("payment.stateCancelled");
      case 'REFUNDED':
        return t("payment.stateRefunded");
      case 'FAILED':
        return t("payment.stateFailed");
      default:
        return t("payment.statePending");
    }
  };

  return (
    <div className="review-screen">
      <header className="review-header">
        <button
          className="review-back-btn"
          type="button"
          onClick={() => navigate('/me')}
        >
          <IconArrowLeft size={16} />
          <span>{t("examResult.backToDashboard")}</span>
        </button>
        <span className="review-header-title">{t("payment.statusTitle")}</span>
      </header>

      <main
        style={{
          flex: "1 0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
        }}
      >
        <Card
          shadow="md"
          padding="xl"
          radius="lg"
          withBorder
          maw={480}
          w="100%"
          style={{ background: "var(--card-bg)" }}
        >
          <Stack gap="lg" align="center">
            {polling && (
              <Stack align="center" gap="sm" py="xl">
                <Loader size="lg" color="blue" />
                <Title order={3} ta="center" size="h4">
                  {t("payment.verifying")}
                </Title>
                <Text size="sm" c="dimmed" ta="center">
                  {t("payment.verifyingDesc")}
                </Text>
              </Stack>
            )}

            {errorText && (
              <Alert color="red" w="100%" radius="md">
                {errorText}
              </Alert>
            )}

            {status && !polling && (
              <>
                {/* Visual Status Icon */}
                {isSuccess && (
                  <ThemeIcon size={72} radius="xl" color="green" variant="light">
                    <IconCheck size={38} stroke={2.5} />
                  </ThemeIcon>
                )}
                {isFailed && (
                  <ThemeIcon size={72} radius="xl" color="red" variant="light">
                    <IconX size={38} stroke={2.5} />
                  </ThemeIcon>
                )}
                {!isSuccess && !isFailed && (
                  <ThemeIcon size={72} radius="xl" color="orange" variant="light">
                    <IconClock size={38} stroke={2.5} />
                  </ThemeIcon>
                )}

                {/* Status Title */}
                <Stack gap={4} align="center">
                  <Title order={2} size="h3" ta="center">
                    {isSuccess
                      ? t("payment.successTitle")
                      : isFailed
                      ? t("payment.failedTitle")
                      : t("payment.statusTitle")}
                  </Title>
                  <Text size="sm" c="dimmed" ta="center">
                    {isSuccess
                      ? t("payment.successDesc")
                      : isFailed
                      ? t("payment.failedDesc")
                      : t("payment.verifying")}
                  </Text>
                </Stack>

                {timedOut && !isSuccess && !isFailed && (
                  <Alert color="orange" w="100%" radius="md">
                    <Stack gap="xs">
                      <Text size="sm">
                        {t(
                          "payment.stillVerifying"
                        )}
                      </Text>
                      <Button size="xs" variant="light" color="orange" onClick={handleManualRefresh}>
                        {t("payment.refreshStatus")}
                      </Button>
                    </Stack>
                  </Alert>
                )}

                {/* Amount Hero */}
                <Box
                  w="100%"
                  py="md"
                  px="lg"
                  ta="center"
                  style={{
                    borderRadius: "var(--radius)",
                    background: isSuccess
                      ? "rgba(47, 158, 68, 0.08)"
                      : isFailed
                      ? "rgba(224, 49, 49, 0.08)"
                      : "rgba(var(--primary-rgb), 0.08)",
                  }}
                >
                  <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                    {t("payment.amount")}
                  </Text>
                  <Text size="28px" fw={800} c={isSuccess ? "green.6" : isFailed ? "red.6" : "blue.6"}>
                    {Number(status.amount).toLocaleString('uz-UZ')}{" "}
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>
                      {t("payment.currency")}
                    </span>
                  </Text>
                </Box>

                {/* Key-Value Breakdown */}
                <Paper withBorder p="sm" radius="md" w="100%" style={{ background: "transparent" }}>
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        {t("payment.paymentId")}:
                      </Text>
                      <Text size="sm" fw={600} style={{ fontFamily: "monospace" }}>
                        #{status.paymentId}
                      </Text>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        {t("payment.provider")}:
                      </Text>
                      <Badge variant="light" color="blue" size="sm">
                        {status.provider}
                      </Badge>
                    </Group>
                    <Divider />
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">
                        {t("payment.status")}:
                      </Text>
                      <Badge
                        variant="filled"
                        color={isSuccess ? "green" : isFailed ? "red" : "orange"}
                        size="sm"
                      >
                        {getStateLabel(status.state)}
                      </Badge>
                    </Group>
                  </Stack>
                </Paper>

                {/* CTAs */}
                <Stack gap="xs" w="100%" mt="xs">
                  {isSuccess ? (
                    <>
                      <Button
                        size="md"
                        radius="md"
                        color="blue"
                        fullWidth
                        rightSection={<IconSparkles size={16} />}
                        onClick={() => navigate('/packages')}
                      >
                        {t("payment.startLearning")}
                      </Button>
                      <Button
                        size="md"
                        radius="md"
                        variant="subtle"
                        fullWidth
                        onClick={() => navigate('/me')}
                      >
                        {t("nav.dashboard")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="md"
                        radius="md"
                        color="blue"
                        fullWidth
                        leftSection={<IconCreditCard size={16} />}
                        onClick={() => navigate('/me')}
                      >
                        {t("payment.retry")}
                      </Button>
                      <Button
                        size="md"
                        radius="md"
                        variant="subtle"
                        fullWidth
                        onClick={() => navigate('/me')}
                      >
                        {t("common.backToHome")}
                      </Button>
                    </>
                  )}
                </Stack>
              </>
            )}

            {error && !status && (
              <Button size="md" radius="md" fullWidth onClick={() => navigate('/me')}>
                {t("common.backToHome")}
              </Button>
            )}
          </Stack>
        </Card>
      </main>
    </div>
  );
}
