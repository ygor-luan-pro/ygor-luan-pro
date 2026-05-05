import { useState } from 'react';
import type { QuizQuestion } from '../types';

interface AdminQuizFormProps {
  moduleNumber: number;
  question?: QuizQuestion;
  mode: 'create' | 'edit';
}

const LABELS = ['A', 'B', 'C', 'D'];

export default function AdminQuizForm({ moduleNumber, question, mode }: AdminQuizFormProps) {
  const [questionText, setQuestionText] = useState(question?.question ?? '');
  const [options, setOptions] = useState<[string, string, string, string]>(
    (question?.options as [string, string, string, string]) ?? ['', '', '', ''],
  );
  const [correctIndex, setCorrectIndex] = useState(question?.correct_answer_index ?? 0);
  const [orderNumber, setOrderNumber] = useState(question?.order_number ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => { const next = [...prev] as [string, string, string, string]; next[index] = value; return next; });
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(false);
    const endpoint = mode === 'create' ? '/api/admin/quiz' : `/api/admin/quiz/${question?.id}`;
    try {
      const res = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_number: moduleNumber, question: questionText, options, correct_answer_index: correctIndex, order_number: orderNumber }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erro ao salvar questão');
      if (mode === 'create') { window.location.href = `/admin/quiz/${moduleNumber}`; }
      else { setSuccess(true); }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!question?.id || !window.confirm('Excluir esta questão?')) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/admin/quiz/${question.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir questão');
      window.location.href = `/admin/quiz/${moduleNumber}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally { setLoading(false); }
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
        <label htmlFor="quiz-question" style={labelStyle}>Pergunta *</label>
        <textarea
          id="quiz-question"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          required
          className="input-field"
          placeholder="Ex: Qual ferramenta é indicada para degradê?"
        />
      </div>
      <fieldset className="space-y-2" style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={labelStyle}>Opções (marque a correta) *</legend>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="radio"
              id={`quiz-option-radio-${i}`}
              name="correct"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
              aria-label={`Marcar opção ${LABELS[i]} como correta`}
              style={{ accentColor: 'var(--copper)', flexShrink: 0 }}
            />
            <span className="font-mono text-xs" style={{ color: 'var(--fade)', minWidth: '1rem' }}>{LABELS[i]}</span>
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              required
              aria-label={`Texto da opção ${LABELS[i]}`}
              className="input-field flex-1"
              placeholder={`Opção ${LABELS[i]}`}
            />
          </div>
        ))}
      </fieldset>
      <div>
        <label htmlFor="quiz-order" style={labelStyle}>Ordem</label>
        <input
          id="quiz-order"
          type="number"
          value={orderNumber}
          onChange={(e) => setOrderNumber(Number(e.target.value))}
          min={1}
          required
          className="input-field"
          style={{ maxWidth: '6rem' }}
        />
      </div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(201,133,58,0.10)', border: '1px solid var(--blade)', padding: '0.75rem 1rem', color: 'var(--copper)', fontSize: '0.875rem' }}>
          Questão atualizada com sucesso.
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Salvando...' : mode === 'create' ? 'Criar Questão' : 'Salvar Alterações'}
        </button>
        <a href={`/admin/quiz/${moduleNumber}`} className="btn-ghost">Cancelar</a>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            style={{ color: '#f87171', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  );
}
