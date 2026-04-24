import { beforeEach, describe, expect, it } from 'vitest';
import {
  checkAccountLockout,
  recordAccountFailure,
  resetRateLimitStore,
} from '../../../src/lib/rate-limit';

describe('per-account lockout', () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  it('permite login quando não há falhas registradas', async () => {
    const result = await checkAccountLockout('usuario@test.com');
    expect(result.allowed).toBe(true);
  });

  it('permite login com menos de 10 falhas', async () => {
    for (let i = 0; i < 9; i++) {
      await recordAccountFailure('aluno@test.com');
    }
    const result = await checkAccountLockout('aluno@test.com');
    expect(result.allowed).toBe(true);
  });

  it('bloqueia após 10 falhas', async () => {
    for (let i = 0; i < 10; i++) {
      await recordAccountFailure('atacante@test.com');
    }
    const result = await checkAccountLockout('atacante@test.com');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('usa bucket separado por conta (e-mails diferentes não interferem)', async () => {
    for (let i = 0; i < 10; i++) {
      await recordAccountFailure('atacante@test.com');
    }
    const result = await checkAccountLockout('inocente@test.com');
    expect(result.allowed).toBe(true);
  });

  it('é insensível a capitalização de e-mail', async () => {
    for (let i = 0; i < 10; i++) {
      await recordAccountFailure('ALUNO@TEST.COM');
    }
    const result = await checkAccountLockout('aluno@test.com');
    expect(result.allowed).toBe(false);
  });
});
