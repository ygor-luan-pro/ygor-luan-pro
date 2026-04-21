import { useState } from 'react';
import type { Material } from '../types';

interface Props {
  lessonId: string;
  initialMaterials: Material[];
}

export default function AdminMaterialsManager({ lessonId, initialMaterials }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--fade)',
    marginBottom: '0.375rem',
  };

  const handleAdd = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!file) throw new Error('Selecione um arquivo');

      const formData = new FormData();
      formData.set('lessonId', lessonId);
      formData.set('title', title);
      formData.set('file', file);

      const res = await fetch('/api/admin/materials/upload', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const data = await res.json() as Material & { error?: string };
      if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Erro ao adicionar');
      setMaterials((prev) => [...prev, data]);
      setTitle('');
      setFile(null);
      setFileInputKey((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remover este material?')) return;
    try {
      const res = await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover material');
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover material');
    }
  };

  return (
    <div>
      {materials.length === 0 && (
        <p className="font-sans text-sm mb-4" style={{ color: 'var(--fade)' }}>
          Nenhum material adicionado ainda.
        </p>
      )}
      {materials.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between mb-2 p-3"
          style={{ background: 'var(--espresso)', border: '1px solid var(--blade)' }}
        >
          <div>
            <span className="font-sans text-sm" style={{ color: 'var(--parchment)' }}>{m.title}</span>
            {m.file_type && (
              <span className="ml-2 font-sans text-xs uppercase" style={{ color: 'var(--fade)' }}>
                {m.file_type}
              </span>
            )}
          </div>
          <button onClick={() => handleDelete(m.id)} className="font-sans text-xs link-btn">
            Remover
          </button>
        </div>
      ))}

      <form
        onSubmit={handleAdd}
        className="mt-4 space-y-3"
        style={{ borderTop: '1px solid var(--blade)', paddingTop: '1rem' }}
      >
        <p className="font-sans text-xs uppercase tracking-widest" style={{ color: 'var(--fade)' }}>
          Adicionar material
        </p>
        <div>
          <label style={labelStyle}>Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-field"
            placeholder="Ex: Checklist de Barbearia"
          />
        </div>
        <div>
          <label htmlFor="material-file" style={labelStyle}>Arquivo *</label>
          <input
            key={fileInputKey}
            id="material-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            className="input-field"
            accept=".pdf,.jpg,.jpeg,.png,.zip,.xlsx"
          />
        </div>
        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.20)',
              padding: '0.75rem 1rem',
              color: '#f87171',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Enviando...' : 'Enviar material'}
        </button>
      </form>
    </div>
  );
}
