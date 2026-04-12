import { describe, it, expect } from 'vitest';
import { certificateAvailableTemplate } from '../../../../src/lib/email-templates/certificate-available';

describe('certificateAvailableTemplate', () => {
  it('retorna subject não vazio', () => {
    const { subject } = certificateAvailableTemplate({
      studentName: 'João',
      certificateUrl: 'https://example.com/certificate/1'
    });
    expect(subject).toBeTruthy();
  });

  it('subject contém menção a certificado', () => {
    const { subject } = certificateAvailableTemplate({
      studentName: 'João',
      certificateUrl: 'https://example.com/certificate/1'
    });
    expect(subject.toLowerCase()).toContain('certificado');
  });

  it('html contém o nome do aluno', () => {
    const { html } = certificateAvailableTemplate({
      studentName: 'Marina',
      certificateUrl: 'https://example.com/certificate/1'
    });
    expect(html).toContain('Marina');
  });

  it('html contém o certificateUrl', () => {
    const { html } = certificateAvailableTemplate({
      studentName: 'João',
      certificateUrl: 'https://certificates.com/abc123'
    });
    expect(html).toContain('https://certificates.com/abc123');
  });

  it('usa fallback quando studentName é null', () => {
    const { html } = certificateAvailableTemplate({
      studentName: null,
      certificateUrl: 'https://example.com/certificate/1'
    });
    expect(html).toContain('Aluno');
  });

  it('html possui estrutura válida de email', () => {
    const { html } = certificateAvailableTemplate({
      studentName: 'Test',
      certificateUrl: 'https://example.com'
    });
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('html e subject correspondem ao snapshot', () => {
    const { html, subject } = certificateAvailableTemplate({
      studentName: 'João',
      certificateUrl: 'https://ygorluanpro.com.br/certificado/verificar/YLP-2026-00001',
    });
    expect(subject).toMatchSnapshot();
    expect(html).toMatchSnapshot();
  });
});
