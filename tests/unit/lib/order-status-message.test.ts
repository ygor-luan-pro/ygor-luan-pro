import { describe, it, expect } from 'vitest';
import { getStatusContext } from '../../../src/lib/order-status-message';
import type { Order } from '../../../src/types';

describe('getStatusContext', () => {
  it('returns showBuyButton=true and pollingRelevant=false when no order', () => {
    const ctx = getStatusContext(null);
    expect(ctx.showBuyButton).toBe(true);
    expect(ctx.pollingRelevant).toBe(false);
    expect(ctx.showSupportLink).toBe(false);
  });

  it('returns pollingRelevant=true and showBuyButton=false for recent pending order', () => {
    const order: Partial<Order> = {
      status: 'pending',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    };
    const ctx = getStatusContext(order as Order);
    expect(ctx.pollingRelevant).toBe(true);
    expect(ctx.showBuyButton).toBe(false);
  });

  it('mentions support for old pending order (> 30min)', () => {
    const order: Partial<Order> = {
      status: 'pending',
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    };
    const ctx = getStatusContext(order as Order);
    expect(ctx.pollingRelevant).toBe(true);
    expect(ctx.showSupportLink).toBe(true);
  });

  it('returns showBuyButton=true and pollingRelevant=false for failed order', () => {
    const order: Partial<Order> = { status: 'rejected', created_at: new Date().toISOString() };
    const ctx = getStatusContext(order as Order);
    expect(ctx.showBuyButton).toBe(true);
    expect(ctx.pollingRelevant).toBe(false);
  });

  it('returns showBuyButton=true and pollingRelevant=false for refunded order', () => {
    const order: Partial<Order> = { status: 'refunded', created_at: new Date().toISOString() };
    const ctx = getStatusContext(order as Order);
    expect(ctx.showBuyButton).toBe(true);
    expect(ctx.pollingRelevant).toBe(false);
  });

  it('returns showBuyButton=false and pollingRelevant=true for approved order', () => {
    const order: Partial<Order> = { status: 'approved', created_at: new Date().toISOString() };
    const ctx = getStatusContext(order as Order);
    expect(ctx.showBuyButton).toBe(false);
    expect(ctx.pollingRelevant).toBe(true);
    expect(ctx.showSupportLink).toBe(false);
  });
});
