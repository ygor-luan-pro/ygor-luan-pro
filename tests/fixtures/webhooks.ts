export const CAKTO_TEST_SECRET = 'test-cakto-secret';

export function makeCaktoPayload(
  secret = CAKTO_TEST_SECRET,
  overrides: Record<string, unknown> = {},
) {
  return {
    event: 'purchase_approved',
    secret,
    sentAt: '2024-01-01T00:00:00.000Z',
    data: {
      id: 'order-test-001',
      refId: 'ref-001',
      status: 'paid',
      amount: 99700,
      paymentMethod: 'credit_card',
      installments: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      paidAt: '2024-01-01T00:00:00.000Z',
      customer: {
        name: 'Comprador Teste',
        email: 'aluno@example.com',
        phone: null as string | null,
        docType: null as string | null,
        docNumber: null as string | null,
      },
      product: { id: 'prod-001', name: 'Mentoria Completa' },
      offer: { id: 'offer-001', name: 'Oferta Principal', price: 99700 },
    },
    ...overrides,
  };
}

export const CAL_BOOKING_CREATED_PAYLOAD = {
  triggerEvent: 'BOOKING_CREATED',
  payload: {
    startTime: '2026-04-01T10:00:00Z',
    attendees: [{ email: 'aluno@email.com', name: 'Aluno Teste' }],
    videoCallData: { url: 'https://meet.example.com/abc' },
  },
} as const;
