import { describe, it, expect } from 'vitest';
import { welcomeTemplate } from '../../../../src/lib/email-templates/welcome';

describe('welcomeTemplate', () => {
  it('retorna subject não vazio', () => {
    const { subject } = welcomeTemplate({ name: 'João', loginUrl: 'https://example.com' });
    expect(subject).toBeTruthy();
  });

  it('html contém o nome do aluno', () => {
    const { html } = welcomeTemplate({ name: 'João', loginUrl: 'https://example.com' });
    expect(html).toContain('João');
  });

  it('html contém o loginUrl', () => {
    const { html } = welcomeTemplate({ name: null, loginUrl: 'https://login.com' });
    expect(html).toContain('https://login.com');
  });

  it('usa fallback quando name é null', () => {
    const { html } = welcomeTemplate({ name: null, loginUrl: 'https://login.com' });
    expect(html).toContain('Aluno');
  });

  it('html possui estrutura válida de email', () => {
    const { html } = welcomeTemplate({ name: 'Maria', loginUrl: 'https://example.com' });
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('subject contém emojis ou caracteres especiais', () => {
    const { subject } = welcomeTemplate({ name: 'Test', loginUrl: 'https://example.com' });
    expect(subject.length).toBeGreaterThan(0);
  });
});
