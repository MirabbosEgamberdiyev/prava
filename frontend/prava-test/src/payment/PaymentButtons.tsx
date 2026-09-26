import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { paymentApi } from './paymentApi';

/**
 * Only these payment-provider origins may receive a browser redirect.
 * Anything else coming back from the server is refused (open-redirect / phishing guard).
 */
const ALLOWED_REDIRECT_HOSTS = new Set([
  'my.click.uz',
  'checkout.paycom.uz',
  'test.paycom.uz',
  'checkout.test.paycom.uz',
]);

function isAllowedPaymentRedirect(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_REDIRECT_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export interface PaymentButtonsProps {
  packageId: number;
  packageName: string;
  priceSum: number;
  /** Optional — pass to open in same tab; default = same tab */
  openInNewTab?: boolean;
}

export function PaymentButtons({
  packageId,
  packageName,
  priceSum,
  openInNewTab = false,
}: PaymentButtonsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<'click' | 'payme' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const go = (url: unknown) => {
    if (!isAllowedPaymentRedirect(url)) {
      setErr(t('payment.invalidRedirect', "To'lov sahifasi manzili noto'g'ri. Iltimos, keyinroq qayta urinib ko'ring."));
      return;
    }
    if (openInNewTab) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  const payClick = async () => {
    setErr(null);
    setLoading('click');
    try {
      const r = await paymentApi.createClickInvoice(packageId);
      go(r.redirectUrl);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? t('errors.serverError', 'Click xatosi'));
    } finally {
      setLoading(null);
    }
  };

  const payPayme = async () => {
    setErr(null);
    setLoading('payme');
    try {
      const r = await paymentApi.createPaymeInvoice(packageId);
      go(r.redirectUrl);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? t('errors.serverError', 'Payme xatosi'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Title order={4}>{packageName}</Title>
        <Text fw={600} size="lg">
          {priceSum.toLocaleString('uz-UZ')} {t('common.currency', "so'm")}
        </Text>
        <Group grow mt="sm">
          <Button
            color="blue"
            loading={loading === 'click'}
            disabled={!!loading}
            onClick={payClick}
          >
            {t('payment.payWithClick', "Click orqali to'lash")}
          </Button>
          <Button
            color="teal"
            loading={loading === 'payme'}
            disabled={!!loading}
            onClick={payPayme}
          >
            {t('payment.payWithPayme', "Payme orqali to'lash")}
          </Button>
        </Group>
        {err && (
          <Text c="red" size="sm" mt="xs">
            {err}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

export default PaymentButtons;
