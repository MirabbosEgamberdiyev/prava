/**
 * Payment API client.
 * Uses the shared `api` axios instance (cookies + auto-refresh).
 * Does NOT create its own instance — reuses the project's existing one.
 */
import api from '../api/api';

export type PaymentProvider = 'CLICK' | 'PAYME' | 'MANUAL';
export type PaymentState =
  | 'PENDING'
  | 'CREATED'
  | 'PERFORMED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'FAILED';

export interface InvoiceResponse {
  paymentId: number;
  merchantOrderId: string;
  packageId: number;
  amount: number;
  provider: PaymentProvider;
  redirectUrl: string;
}

export interface PaymentStatusResponse {
  paymentId: number;
  merchantOrderId: string;
  provider: PaymentProvider;
  state: PaymentState;
  amount: number;
  packageId: number;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  accessGranted: boolean;
}

const base = '/api/v1/payment';

export const paymentApi = {
  createClickInvoice: (packageId: number) =>
    api.post<InvoiceResponse>(`${base}/click/invoice`, { packageId }).then((r) => r.data),

  createPaymeInvoice: (packageId: number) =>
    api.post<InvoiceResponse>(`${base}/payme/invoice`, { packageId }).then((r) => r.data),

  status: (paymentId: number) =>
    api.get<PaymentStatusResponse>(`${base}/${paymentId}/status`).then((r) => r.data),
};

