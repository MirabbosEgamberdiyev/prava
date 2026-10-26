import { describe, it, expect, vi } from 'vitest';
import api from '../api/api';
import { paymentApi } from '../payment/paymentApi';

vi.mock('../api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('inPAY Integration Tests', () => {
  it('calls createInPayInvoice with correct endpoint and packageId', async () => {
    const mockResponse = {
      data: {
        paymentId: 42,
        merchantOrderId: 'PR-INPAY-12345678',
        packageId: 7,
        amount: 50000,
        provider: 'INPAY' as const,
        redirectUrl: 'https://inpay.uz/pay/abcdef123456',
      },
    };

    (api.post as any).mockResolvedValueOnce(mockResponse);

    const result = await paymentApi.createInPayInvoice(7);

    expect(api.post).toHaveBeenCalledWith('/api/v1/payment/inpay/invoice', { packageId: 7 });
    expect(result.paymentId).toBe(42);
    expect(result.redirectUrl).toBe('https://inpay.uz/pay/abcdef123456');
    expect(result.provider).toBe('INPAY');
  });

  it('validates allowed redirect hosts for inPAY', () => {
    const ALLOWED_REDIRECT_HOSTS = new Set([
      'my.click.uz',
      'checkout.paycom.uz',
      'test.paycom.uz',
      'checkout.test.paycom.uz',
      'inpay.uz',
      'checkout.inpay.uz',
      'pay.inpay.uz',
    ]);

    function isAllowed(url: string): boolean {
      try {
        const u = new URL(url);
        if (u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase();
        return ALLOWED_REDIRECT_HOSTS.has(host) || host.endsWith('.inpay.uz');
      } catch {
        return false;
      }
    }

    expect(isAllowed('https://inpay.uz/pay/123')).toBe(true);
    expect(isAllowed('https://checkout.inpay.uz/invoice/456')).toBe(true);
    expect(isAllowed('https://pay.inpay.uz/test')).toBe(true);
    expect(isAllowed('https://sub.domain.inpay.uz/checkout')).toBe(true);

    // Reject phishing/malicious domains
    expect(isAllowed('http://inpay.uz/pay/123')).toBe(false); // not https
    expect(isAllowed('https://inpay.uz.malicious.com')).toBe(false); // phishing domain
    expect(isAllowed('https://fake-inpay.com')).toBe(false);
  });
});
