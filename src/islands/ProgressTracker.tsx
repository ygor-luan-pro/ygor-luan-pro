interface ModuleProgress {
  number: number;
  title: string;
  completed: number;
  total: number;
  allDone: boolean;
}

interface ProgressTrackerProps {
  totalLessons: number;
  completedLessons: number;
  modules?: ModuleProgress[];
}

export default function ProgressTracker({
  totalLessons,
  completedLessons,
  modules,
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

      {modules && modules.length > 0 && (
        <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--ink)' }}>
          {modules.map((mod) => {
            const modPercentage = mod.total > 0 ? Math.round((mod.completed / mod.total) * 100) : 0;
            return (
              <div key={mod.number}>
                <div className="flex justify-between items-center font-sans text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--parchment)' }}>{mod.title}</span>
                    {mod.allDone && (
                      <span style={{ color: 'var(--copper)', fontSize: '0.65rem', fontVariant: 'small-caps', letterSpacing: '0.05em' }}>
                        concluído
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3" style={{ color: 'var(--fade)' }}>
                    <span>{mod.completed} de {mod.total}</span>
                    <span className="font-medium" style={{ color: mod.allDone ? 'var(--copper)' : 'var(--parchment)', minWidth: '2.5rem', textAlign: 'right' }}>
                      {modPercentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1" style={{ backgroundColor: 'var(--tobacco)' }}>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${modPercentage}%`,
                      backgroundColor: mod.allDone ? 'var(--copper)' : 'var(--blade)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
