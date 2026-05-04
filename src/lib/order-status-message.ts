import type { Order } from '../types';

interface StatusContext {
  title: string;
  body: string;
  showBuyButton: boolean;
  showSupportLink: boolean;
  pollingRelevant: boolean;
}

const PENDING_STALE_MS = 30 * 60 * 1000;

export function getStatusContext(lastOrder: Order | null): StatusContext {
  if (!lastOrder) {
    return {
      title: 'Acesso não encontrado',
      body: 'Você ainda não adquiriu o curso.',
      showBuyButton: true,
      showSupportLink: false,
      pollingRelevant: false,
    };
  }

  if (lastOrder.status === 'pending') {
    const ageMs = Date.now() - new Date(lastOrder.created_at).getTime();
    const isOld = ageMs > PENDING_STALE_MS;
    return {
      title: 'Pagamento em processamento',
      body: isOld
        ? 'Está demorando mais que o esperado. Entre em contato com o suporte.'
        : 'A confirmação chega em instantes.',
      showBuyButton: false,
      showSupportLink: isOld,
      pollingRelevant: true,
    };
  }

  if (lastOrder.status === 'rejected') {
    return {
      title: 'Pagamento não confirmado',
      body: 'Houve um problema. Tente novamente.',
      showBuyButton: true,
      showSupportLink: false,
      pollingRelevant: false,
    };
  }

  if (lastOrder.status === 'refunded') {
    return {
      title: 'Pedido reembolsado',
      body: 'Seu acesso foi encerrado.',
      showBuyButton: true,
      showSupportLink: false,
      pollingRelevant: false,
    };
  }

  if (lastOrder.status === 'approved') {
    return {
      title: 'Acesso liberado',
      body: 'Redirecionando...',
      showBuyButton: false,
      showSupportLink: false,
      pollingRelevant: true,
    };
  }

  return {
    title: 'Acesso pendente',
    body: 'Seu status está sendo verificado.',
    showBuyButton: false,
    showSupportLink: false,
    pollingRelevant: false,
  };
}
