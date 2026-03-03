interface ProgressTrackerProps {
  totalLessons: number;
  completedLessons: number;
}

export default function ProgressTracker({
  totalLessons,
  completedLessons,
}: ProgressTrackerProps) {
  const percentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between font-sans text-sm">
        <span style={{ color: 'var(--parchment)' }}>
          {completedLessons} de {totalLessons} aulas concluídas
        </span>
        <span className="font-medium" style={{ color: 'var(--cream)' }}>{percentage}%</span>
      </div>

      <div className="h-1" style={{ backgroundColor: 'var(--tobacco)' }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: 'var(--copper)' }}
        />
      </div>

      {percentage === 100 && (
        <p className="font-sans text-sm font-medium" style={{ color: 'var(--copper)' }}>
          Parabéns. Você concluiu o curso.
        </p>
      )}
    </div>
  );
}
