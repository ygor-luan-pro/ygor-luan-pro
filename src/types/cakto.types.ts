export interface CaktoWebhookPayload {
  event:
    | "purchase_approved"
    | "purchase_refused"
    | "refund"
    | "chargeback"
    | "initiate_checkout"
    | "checkout_abandonment"
    | "subscription_created"
    | "subscription_canceled"
    | "subscription_renewed"
    | "subscription_renewal_refused"
    | (string & {});
  secret: string;
  sentAt: string;
  data: {
    id: string;
    refId: string;
    status: string;
    amount: number;
    paymentMethod: string | null;
    installments: number;
    createdAt: string;
    paidAt: string;
    customer: {
      name: string | null;
      email: string;
      phone: string | null;
      docType: string | null;
      docNumber: string | null;
    };
    product: { id: string; name: string };
    offer: { id: string; name: string; price: number };
  };
}
