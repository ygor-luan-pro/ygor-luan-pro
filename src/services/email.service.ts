import { resend, FROM_EMAIL } from '../lib/resend';
import { supabaseAdmin } from '../lib/supabase-admin';
import { welcomeTemplate } from '../lib/email-templates/welcome';
import { newLessonTemplate } from '../lib/email-templates/new-lesson';
import { certificateAvailableTemplate } from '../lib/email-templates/certificate-available';
import { mentorshipReminderTemplate } from '../lib/email-templates/mentorship-reminder';
import type { Lesson } from '../types';

type ActiveStudent = { email: string; full_name: string | null };

export class EmailService {
  static async getActiveStudents(): Promise<ActiveStudent[]> {
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('status', 'approved');

    if (ordersError) throw new Error(ordersError.message);

    const userIds = (orders ?? []).map((o) => o.user_id);
    if (userIds.length === 0) return [];

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .in('id', userIds);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async sendWelcome(
    email: string,
    name: string | null,
    loginUrl: string,
  ): Promise<void> {
    const { subject, html } = welcomeTemplate({ name, loginUrl });
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    } catch (error) {
      console.error('EmailService: falha ao enviar email:', error);
    }
  }

  static async notifyNewLesson(lesson: Lesson): Promise<void> {
    const students = await EmailService.getActiveStudents();
    const lessonUrl = `${import.meta.env.PUBLIC_SITE_URL}/dashboard/aula/${lesson.id}`;
    const moduleName = `Módulo ${lesson.module_number}`;
    const { subject, html } = newLessonTemplate({
      lessonTitle: lesson.title,
      moduleName,
      lessonUrl,
    });

    await Promise.allSettled(
      students.map((student) =>
        resend.emails.send({ from: FROM_EMAIL, to: student.email, subject, html }).catch((error) => {
          console.error('EmailService: falha ao enviar email:', error);
        }),
      ),
    );
  }

  static async notifyCertificateAvailable(
    email: string,
    name: string | null,
  ): Promise<void> {
    const certificateUrl = `${import.meta.env.PUBLIC_SITE_URL}/dashboard/certificado`;
    const { subject, html } = certificateAvailableTemplate({
      studentName: name,
      certificateUrl,
    });
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    } catch (error) {
      console.error('EmailService: falha ao enviar email:', error);
    }
  }

  static async sendMentorshipReminder(
    email: string,
    name: string | null,
    scheduledAt: Date,
    meetingUrl: string,
  ): Promise<void> {
    const { subject, html } = mentorshipReminderTemplate({
      studentName: name,
      scheduledAt,
      meetingUrl,
    });
    try {
      await resend.emails.send({ from: FROM_EMAIL, to: email, subject, html });
    } catch (error) {
      console.error('EmailService: falha ao enviar email:', error);
    }
  }
}
