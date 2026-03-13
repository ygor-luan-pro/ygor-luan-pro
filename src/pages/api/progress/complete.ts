import type { APIRoute } from 'astro';
import { ProgressService } from '../../../services/progress.service';
import { EmailService } from '../../../services/email.service';
import { supabaseAdmin } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!locals.hasAccess) {
    return new Response(JSON.stringify({ error: 'Sem acesso' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { lessonId } = await request.json() as { lessonId?: string };

  if (!lessonId) {
    return new Response(JSON.stringify({ error: 'lessonId obrigatório' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await ProgressService.markComplete(locals.user.id, lessonId);

  try {
    const stats = await ProgressService.getStudentStats(locals.user.id);
    if (stats.completed_count === stats.total_lessons && stats.total_lessons > 0) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', locals.user.id)
        .single();
      if (profile) {
        void EmailService.notifyCertificateAvailable(profile.email, profile.full_name);
      }
    }
  } catch (err) {
    console.error('progress/complete: erro ao verificar certificado', err);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
