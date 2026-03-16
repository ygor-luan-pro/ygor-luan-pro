import { useState } from 'react';
import type { Lesson } from '../types';
import { slugify } from '../lib/utils';

interface AdminLessonFormProps {
  mode: 'create' | 'edit';
  lesson?: Lesson;
}

export default function AdminLessonForm({ mode, lesson }: AdminLessonFormProps) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [slug, setSlug] = useState(lesson?.slug ?? '');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? '');
  const [moduleNumber, setModuleNumber] = useState(lesson?.module_number ?? 1);
  const [orderNumber, setOrderNumber] = useState(lesson?.order_number ?? 1);
  const [durationMinutes, setDurationMinutes] = useState(lesson?.duration_minutes ?? 0);
  const [isPublished, setIsPublished] = useState(lesson?.is_published ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === 'create') setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint =
      mode === 'create'
        ? '/api/admin/lessons'
        : `/api/admin/lessons/${lesson?.id}`;

    try {
      const res = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          description: description || null,
          video_url: videoUrl,
          module_number: moduleNumber,
          order_number: orderNumber,
          duration_minutes: durationMinutes || null,
          is_published: isPublished,
        }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar aula');

      if (mode === 'create') {
        window.location.href = '/admin/aulas';
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--fade)',
    marginBottom: '0.375rem',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label style={labelStyle}>Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="input-field"
          placeholder="Ex: Técnicas de Navalha"
        />
      </div>

      <div>
        <label style={labelStyle}>Slug *</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="input-field"
          placeholder="tecnicas-de-navalha"
        />
      </div>

      <div>
        <label style={labelStyle}>URL do Vídeo (Vimeo) *</label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          required
          className="input-field"
          placeholder="https://vimeo.com/123456789"
        />
      </div>

      <div>
        <label style={labelStyle}>Descrição</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Descrição da aula..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label style={labelStyle}>Módulo</label>
          <input
            type="number"
            value={moduleNumber}
            onChange={(e) => setModuleNumber(Number(e.target.value))}
            min={1}
            required
            className="input-field"
          />
        </div>
        <div>
          <label style={labelStyle}>Ordem</label>
          <input
            type="number"
            value={orderNumber}
            onChange={(e) => setOrderNumber(Number(e.target.value))}
            min={1}
            required
            className="input-field"
          />
        </div>
        <div>
          <label style={labelStyle}>Duração (min)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min={0}
            className="input-field"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="w-4 h-4"
          style={{ accentColor: 'var(--copper)' }}
        />
        <span className="font-sans text-sm" style={{ color: 'var(--parchment)' }}>
          Publicar aula (visível para alunos)
        </span>
      </label>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ background: 'rgba(201,133,58,0.10)', border: '1px solid var(--blade)', padding: '0.75rem 1rem', color: 'var(--copper)', fontSize: '0.875rem' }}>
          Aula atualizada com sucesso.
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Salvando...' : mode === 'create' ? 'Criar Aula' : 'Salvar Alterações'}
        </button>
        <a href="/admin/aulas" className="btn-ghost">
          Cancelar
        </a>
      </div>
    </form>
  );
}
