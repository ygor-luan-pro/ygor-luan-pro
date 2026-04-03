import type { APIRoute } from 'astro';
import { ProgressService } from '../../../services/progress.service';
import { CertificateService } from '../../../services/certificate.service';
import { EmailService } from '../../../services/email.service';
import { supabaseAdmin } from '../../../lib/supabase-admin';

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

  let wasAlreadyComplete = false;
  try {
    const existing = await ProgressService.getLessonProgress(locals.user.id, lessonId);
    wasAlreadyComplete = existing?.completed === true;
    await ProgressService.markComplete(locals.user.id, lessonId);
  } catch (err) {
    console.error('progress/complete:', err);
    return new Response(JSON.stringify({ error: 'Erro ao marcar aula como concluída' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!wasAlreadyComplete) {
    try {
      const eligible = await CertificateService.isEligible(locals.user.id);
      if (eligible) {
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
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
