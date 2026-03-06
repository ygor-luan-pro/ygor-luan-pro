import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/services/**'],
    },
    env: {
      PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      MERCADOPAGO_ACCESS_TOKEN: 'test-mp-token',
      MERCADOPAGO_PUBLIC_KEY: 'test-mp-public-key',
      RESEND_API_KEY: 'test-resend-key',
      RESEND_FROM_EMAIL: 'noreply@test.com',
      PUBLIC_SITE_URL: 'http://localhost:4321',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
