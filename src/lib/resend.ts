import { Resend } from 'resend';

export const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const FROM_EMAIL =
  import.meta.env.RESEND_FROM_EMAIL ?? 'noreply@ygorluanacademy.com.br';
