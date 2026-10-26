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
  'inpay.uz',
  'checkout.inpay.uz',
  'pay.inpay.uz',
]);

function isAllowedPaymentRedirect(url: unknown): url is string {
  if (typeof url !== 'string' || !url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_REDIRECT_HOSTS.has(host) || host.endsWith('.inpay.uz');
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
  const [loading, setLoading] = useState<'click' | 'payme' | 'inpay' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const go = (url: unknown) => {
    if (!isAllowedPaymentRedirect(url)) {
      setErr(t('payment.invalidRedirect'));
      return;
    }
    if (openInNewTab) window.open(url, '_blank', 'noopener,noreferrer');
    else window.location.href = url;
  };

  const payInPay = async () => {
    setErr(null);
    setLoading('inpay');
    try {
      const r = await paymentApi.createInPayInvoice(packageId);
      go(r.redirectUrl);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.response?.data?.message ?? t('errors.serverError'));
    } finally {
      setLoading(null);
    }
  };

  const payClick = async () => {
    setErr(null);
    setLoading('click');
    try {
      const r = await paymentApi.createClickInvoice(packageId);
      go(r.redirectUrl);
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? e?.response?.data?.message ?? t('errors.serverError'));
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
      setErr(e?.response?.data?.error ?? e?.response?.data?.message ?? t('errors.serverError'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Title order={4}>{packageName}</Title>
        <Text fw={600} size="lg">
          {priceSum.toLocaleString('uz-UZ')} {t('common.currency')}
        </Text>
        <Stack gap="sm" mt="sm">
          <Button
            size="md"
            variant="gradient"
            gradient={{ from: 'indigo', to: 'violet', deg: 45 }}
            loading={loading === 'inpay'}
            disabled={!!loading}
            onClick={payInPay}
          >
            {t('payment.payWithInpay', 'inPAY (Click, Payme, Uzcard, Humo)')}
          </Button>

          <Group grow>
            <Button
              color="blue"
              loading={loading === 'click'}
              disabled={!!loading}
              onClick={payClick}
            >
              {t('payment.payWithClick')}
            </Button>
            <Button
              color="teal"
              loading={loading === 'payme'}
              disabled={!!loading}
              onClick={payPayme}
            >
              {t('payment.payWithPayme')}
            </Button>
          </Group>
        </Stack>
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
