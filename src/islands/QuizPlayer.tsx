import { useState, type FormEvent } from 'react';
import type { QuizQuestionPublic, QuizAttemptResult } from '../types';

interface QuizPlayerProps {
  moduleNumber: number;
  questions: QuizQuestionPublic[];
  initialBestAttempt: { score: number; total: number } | null;
}

type QuizState = 'idle' | 'answering' | 'submitted';
const LABELS = ['A', 'B', 'C', 'D'];

export default function QuizPlayer({ moduleNumber, questions, initialBestAttempt }: QuizPlayerProps) {
  const [state, setState] = useState<QuizState>('idle');
  const [selected, setSelected] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [bestAttempt, setBestAttempt] = useState(initialBestAttempt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = selected.every((s) => s !== null);

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (state === 'submitted') return;
    setSelected((prev) => { const next = [...prev]; next[qIdx] = oIdx; return next; });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${moduleNumber}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: selected }),
      });
      const data = await res.json() as QuizAttemptResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar respostas');
      setResult(data);
      setState('submitted');
      if (!bestAttempt || data.score > bestAttempt.score) setBestAttempt({ score: data.score, total: data.total });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => { setState('answering'); setSelected(Array(questions.length).fill(null)); setResult(null); setError(null); };

  if (questions.length === 0)
    return <div style={{ color: 'var(--fade)', fontSize: '0.875rem' }}>Nenhuma questão disponível para este módulo.</div>;

  return (
    <div>
      {bestAttempt && state !== 'submitted' && (
        <div style={{ background: 'rgba(201,133,58,0.08)', border: '1px solid var(--blade)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--copper)' }}>
          Melhor resultado: {bestAttempt.score}/{bestAttempt.total} corretas
        </div>
      )}
      {state === 'idle' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="font-sans text-sm mb-4" style={{ color: 'var(--parchment)' }}>
            {questions.length} {questions.length === 1 ? 'questão' : 'questões'} sobre este módulo.
            {bestAttempt && ' Você pode refazer para melhorar sua nota.'}
          </p>
          <button onClick={() => setState('answering')} className="btn-primary">
            {bestAttempt ? 'Refazer Quiz' : 'Iniciar Quiz'}
          </button>
        </div>
      )}
      {(state === 'answering' || state === 'submitted') && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, qIdx) => {
            const isCorrect = result && selected[qIdx] === result.correctIndices[qIdx];
            return (
              <div key={q.id}>
                <p className="font-sans font-medium text-sm mb-3" style={{ color: 'var(--cream)' }}>{qIdx + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((option, oIdx) => {
                    const isSelected = selected[qIdx] === oIdx;
                    const isCorrectOption = result && result.correctIndices[qIdx] === oIdx;
                    let borderColor = 'var(--ink)', bgColor = 'transparent', textColor = 'var(--parchment)';
                    if (state === 'submitted') {
                      if (isCorrectOption) { borderColor = 'var(--copper)'; bgColor = 'rgba(201,133,58,0.08)'; textColor = 'var(--copper)'; }
                      else if (isSelected) { borderColor = 'rgba(239,68,68,0.5)'; bgColor = 'rgba(239,68,68,0.06)'; textColor = '#f87171'; }
                    } else if (isSelected) { borderColor = 'var(--copper)'; bgColor = 'rgba(201,133,58,0.06)'; textColor = 'var(--cream)'; }
                    return (
                      <button key={oIdx} type="button" disabled={state === 'submitted'} onClick={() => handleSelect(qIdx, oIdx)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: `1px solid ${borderColor}`, background: bgColor, color: textColor, textAlign: 'left', cursor: state === 'submitted' ? 'default' : 'pointer', transition: 'all 0.15s', fontSize: '0.875rem' }}>
                        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--fade)', minWidth: '1rem' }}>{LABELS[oIdx]}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
                {state === 'submitted' && (
                  <p className="font-sans text-xs mt-2" style={{ color: isCorrect ? 'var(--copper)' : '#f87171' }}>
                    {isCorrect ? '✓ Correto' : '✗ Incorreto'}
                  </p>
                )}
              </div>
            );
          })}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          {state === 'answering' && (
            <button type="submit" disabled={!allAnswered || loading} className="btn-primary">
              {loading ? 'Enviando...' : 'Confirmar Respostas'}
            </button>
          )}
          {state === 'submitted' && result && (
            <div>
              <div style={{ background: 'rgba(201,133,58,0.10)', border: '1px solid var(--blade)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                <p className="font-display font-light text-2xl" style={{ color: 'var(--cream)' }}>{result.score}/{result.total} corretas</p>
                <p className="font-sans text-xs mt-1" style={{ color: 'var(--fade)' }}>{Math.round((result.score / result.total) * 100)}% de aproveitamento</p>
              </div>
              <button type="button" onClick={handleRetry} className="btn-ghost">Refazer Quiz</button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
