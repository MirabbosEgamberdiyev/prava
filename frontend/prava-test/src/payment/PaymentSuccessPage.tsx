import { Alert, Button, Card, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { paymentApi, PaymentStatusResponse } from './paymentApi';

/**
 * Polls /payment/{id}/status until state is terminal (PERFORMED / CANCELLED / REFUNDED / FAILED).
 * Attach this component to the route  /payment/success
 *   — Click return_url and Payme c= param both redirect here with ?payment=<id>
 */
export default function PaymentSuccessPage() {
  const [status, setStatus] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idStr = params.get('payment');
    if (!idStr) {
      setError("To'lov identifikatori topilmadi");
      setPolling(false);
      return;
    }
    const id = Number(idStr);

    let attempts = 0;
    const maxAttempts = 30; // ~90 seconds
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const r = await paymentApi.status(id);
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
          setPolling(false);
          return;
        }
        timer = setTimeout(tick, 3000);
      } catch (e: any) {
        setError(e?.response?.data?.error ?? 'Xatolik yuz berdi');
        setPolling(false);
      }
    };
    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder maw={520} mx="auto" mt="xl">
      <Stack gap="md">
        <Title order={3}>To'lov holati</Title>

        {error && <Alert color="red">{error}</Alert>}
        {polling && (
          <Stack align="center" gap="xs">
            <Loader />
            <Text>To'lov tasdiqlanmoqda...</Text>
          </Stack>
        )}

        {status && (
          <Stack gap={4}>
            <Text>ID: {status.paymentId}</Text>
            <Text>Provider: {status.provider}</Text>
            <Text>
              Summa: {Number(status.amount).toLocaleString('uz-UZ')} so'm
            </Text>
            <Text>Holati: <b>{status.state}</b></Text>
            {status.state === 'PERFORMED' && (
              <Alert color="green" mt="sm">
                To'lov muvaffaqiyatli! Paketga kirish ochildi.
              </Alert>
            )}
            {(status.state === 'CANCELLED' ||
              status.state === 'REFUNDED' ||
              status.state === 'FAILED') && (
              <Alert color="red" mt="sm">
                To'lov amalga oshmadi yoki bekor qilindi.
              </Alert>
            )}
          </Stack>
        )}

        <Button mt="md" onClick={() => (window.location.href = '/')}>
          Bosh sahifaga
        </Button>
      </Stack>
    </Card>
  );
}
