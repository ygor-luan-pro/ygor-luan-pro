import { describe, it, expect } from 'vitest';
import { mentorshipReminderTemplate } from '../../../../src/lib/email-templates/mentorship-reminder';

describe('mentorshipReminderTemplate', () => {
  const testDate = new Date('2026-03-14T15:30:00-03:00');
  const testUrl = 'https://meeting.example.com/room123';

  it('retorna subject não vazio', () => {
    const { subject } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(subject).toBeTruthy();
  });

  it('subject contém menção a mentoria', () => {
    const { subject } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(subject.toLowerCase()).toContain('mentoria');
  });

  it('html contém o nome do aluno', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: 'Carlos',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(html).toContain('Carlos');
  });

  it('html contém a data formatada em pt-BR', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(html).toMatch(/\d{1,2}.*de.*de.*\d{4}/);
  });

  it('html contém a hora da mentoria', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(html).toContain('15:30');
  });

  it('html contém o meetingUrl', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: 'https://cal.com/ygor/session/abc123'
    });
    expect(html).toContain('https://cal.com/ygor/session/abc123');
  });

  it('usa fallback quando studentName é null', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: null,
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(html).toContain('Aluno');
  });

  it('html possui estrutura válida de email', () => {
    const { html } = mentorshipReminderTemplate({
      studentName: 'Test',
      scheduledAt: testDate,
      meetingUrl: testUrl
    });
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('html e subject correspondem ao snapshot', () => {
    const { html, subject } = mentorshipReminderTemplate({
      studentName: 'João',
      scheduledAt: testDate,
      meetingUrl: 'https://cal.com/ygor/mentoria/abc123',
    });
    expect(subject).toMatchSnapshot();
    expect(html).toMatchSnapshot();
  });
});
