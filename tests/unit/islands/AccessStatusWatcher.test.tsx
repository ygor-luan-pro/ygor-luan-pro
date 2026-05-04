// @vitest-environment jsdom
import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AccessStatusWatcher from '../../../src/islands/AccessStatusWatcher';

const mockFetch = vi.fn();
global.fetch = mockFetch;
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', { value: mockLocation, writable: true });

describe('AccessStatusWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasAccess: false, lastOrder: null }),
    });
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not start polling when pollingRelevant=false', async () => {
    render(<AccessStatusWatcher pollingRelevant={false} />);
    await act(async () => { vi.advanceTimersByTime(10000); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('starts polling every 5s when pollingRelevant=true', async () => {
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(5000); });
    await act(async () => { vi.advanceTimersByTime(5000); });
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/access-status');
  });

  it('redirects to /dashboard when hasAccess=true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasAccess: true, lastOrder: { status: 'approved', created_at: new Date().toISOString() } }),
    });
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mockLocation.href).toBe('/dashboard');
  });

  it('stops polling after 60 ticks', async () => {
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(305000); }); // 61 * 5s
    const callCount = mockFetch.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mockFetch.mock.calls.length).toBe(callCount);
  });

  it('shows "Verificar agora" button when pollingRelevant=true', () => {
    render(<AccessStatusWatcher pollingRelevant={true} />);
    expect(screen.getByRole('button', { name: /verificar agora/i })).toBeInTheDocument();
  });

  it('triggers immediate fetch when "Verificar agora" is clicked', async () => {
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /verificar agora/i }));
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('does not redirect when fetch returns non-ok response (non-401)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: 'Server error' }) });
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mockLocation.href).toBe('');
  });

  it('redirects to /login when fetch returns 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ error: 'Não autenticado' }) });
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(mockLocation.href).toBe('/login');
  });

  it('does not throw when fetch rejects with network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await expect(
      act(async () => { vi.advanceTimersByTime(5000); })
    ).resolves.not.toThrow();
    expect(mockLocation.href).toBe('');
  });

  it('disables button after polling stops', async () => {
    render(<AccessStatusWatcher pollingRelevant={true} />);
    await act(async () => { vi.advanceTimersByTime(305000); }); // 61 * 5s
    expect(screen.getByRole('button', { name: /verificar agora/i })).toBeDisabled();
  });
});
