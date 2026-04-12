import { describe, it, expect } from 'vitest';
import { newLessonTemplate } from '../../../../src/lib/email-templates/new-lesson';

describe('newLessonTemplate', () => {
  it('retorna subject não vazio', () => {
    const { subject } = newLessonTemplate({
      lessonTitle: 'Curso de Barba',
      moduleName: 'Módulo 1',
      lessonUrl: 'https://example.com/lesson/1'
    });
    expect(subject).toBeTruthy();
  });

  it('subject contém o título da aula', () => {
    const { subject } = newLessonTemplate({
      lessonTitle: 'Curso de Barba',
      moduleName: 'Módulo 1',
      lessonUrl: 'https://example.com/lesson/1'
    });
    expect(subject).toContain('Curso de Barba');
  });

  it('html contém o título da aula', () => {
    const { html } = newLessonTemplate({
      lessonTitle: 'Curso de Barba',
      moduleName: 'Módulo 1',
      lessonUrl: 'https://example.com/lesson/1'
    });
    expect(html).toContain('Curso de Barba');
  });

  it('html contém o nome do módulo', () => {
    const { html } = newLessonTemplate({
      lessonTitle: 'Curso de Barba',
      moduleName: 'Módulo Avançado',
      lessonUrl: 'https://example.com/lesson/1'
    });
    expect(html).toContain('Módulo Avançado');
  });

  it('html contém o lessonUrl', () => {
    const { html } = newLessonTemplate({
      lessonTitle: 'Curso de Barba',
      moduleName: 'Módulo 1',
      lessonUrl: 'https://custom.url/lesson/123'
    });
    expect(html).toContain('https://custom.url/lesson/123');
  });

  it('html possui estrutura válida de email', () => {
    const { html } = newLessonTemplate({
      lessonTitle: 'Test',
      moduleName: 'Test Module',
      lessonUrl: 'https://example.com'
    });
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('html e subject correspondem ao snapshot', () => {
    const { html, subject } = newLessonTemplate({
      lessonTitle: 'Fade Degradê Avançado',
      moduleName: 'Módulo 2 — Técnicas',
      lessonUrl: 'https://ygorluanpro.com.br/dashboard/aulas/fade-avancado',
    });
    expect(subject).toMatchSnapshot();
    expect(html).toMatchSnapshot();
  });
});
