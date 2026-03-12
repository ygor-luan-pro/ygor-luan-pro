import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global do módulo Supabase para todos os testes unitários
vi.mock('../src/lib/supabase', () => {
  const mockClient = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        count: vi.fn(() => Promise.resolve({ count: 0, error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test/path.pdf' }, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
        createSignedUrl: vi.fn(() =>
          Promise.resolve({ data: { signedUrl: 'https://signed.url/test.pdf' }, error: null }),
        ),
      })),
    },
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
  };

  return {
    supabase: mockClient,
    supabaseAdmin: {
      ...mockClient,
      auth: {
        ...mockClient.auth,
        admin: {
          createUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
          listUsers: vi.fn(() => Promise.resolve({ data: { users: [] } })),
        },
      },
    },
  };
});
