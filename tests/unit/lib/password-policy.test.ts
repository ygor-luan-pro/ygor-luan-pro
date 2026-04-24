import { describe, expect, it } from 'vitest';
import { validatePassword } from '../../../src/lib/password-policy';

describe('validatePassword', () => {
  it('aceita senha válida com 8+ chars', () => {
    const result = validatePassword('MinhaSenh@1');
    expect(result.ok).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const result = validatePassword('abc123');
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('A senha deve ter no mínimo 8 caracteres.');
  });

  it('rejeita senha com exatamente 7 caracteres', () => {
    const result = validatePassword('Ab1!xyz');
    expect(result.ok).toBe(false);
  });

  it('aceita senha com exatamente 8 caracteres', () => {
    const result = validatePassword('Ab1!xyzW');
    expect(result.ok).toBe(true);
  });

  it('rejeita senha em lista de senhas comuns (123456)', () => {
    const result = validatePassword('123456');
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('Esta senha é muito comum. Escolha uma mais segura.');
  });

  it('rejeita senha em lista de senhas comuns (password)', () => {
    const result = validatePassword('password');
    expect(result.ok).toBe(false);
    expect(result.reasons.some((r) => r.includes('comum'))).toBe(true);
  });

  it('rejeita senha em lista de senhas comuns (12345678)', () => {
    const result = validatePassword('12345678');
    expect(result.ok).toBe(false);
  });

  it('rejeita quando senha contém o prefixo do email do usuário', () => {
    const result = validatePassword('joaosilva123', 'joaosilva@example.com');
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('A senha não pode conter seu endereço de e-mail.');
  });

  it('aceita quando senha não contém o email do usuário', () => {
    const result = validatePassword('SenhaForte!99', 'joao@example.com');
    expect(result.ok).toBe(true);
  });

  it('retorna múltiplas razões quando viola mais de uma regra', () => {
    const result = validatePassword('123456', 'joao@example.com');
    expect(result.reasons.length).toBeGreaterThan(1);
  });

  it('comparação de email é case-insensitive', () => {
    const result = validatePassword('JOAOSILVA123', 'joaosilva@example.com');
    expect(result.ok).toBe(false);
  });

  it('ignora email undefined na validação de email', () => {
    const result = validatePassword('SenhaForte!99');
    expect(result.ok).toBe(true);
  });
});
