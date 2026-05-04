import { useState, useEffect, useRef } from 'react';

interface AccessStatusResponse {
  hasAccess: boolean;
  lastOrder: { status: string; created_at: string } | null;
}

interface Props {
  pollingRelevant: boolean;
}

export default function AccessStatusWatcher({ pollingRelevant }: Props) {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [pollStopped, setPollStopped] = useState(false);
  const tickCount = useRef(0);
  const stopped = useRef(false);
  const fetching = useRef(false);

  async function checkAccess() {
    if (stopped.current || fetching.current) return;
    fetching.current = true;
    setChecking(true);
    try {
      const res = await fetch('/api/auth/access-status');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) return;
      const data: AccessStatusResponse = await res.json();
      if (data.hasAccess) {
        window.location.href = '/dashboard';
      }
    } catch {
      // network error — will retry on next tick
    } finally {
      fetching.current = false;
      setChecking(false);
      setLastChecked(new Date());
    }
  }

  useEffect(() => {
    if (!pollingRelevant) return;
    tickCount.current = 0;
    stopped.current = false;

    const interval = setInterval(async () => {
      tickCount.current += 1;
      if (tickCount.current > 60) {
        stopped.current = true;
        setPollStopped(true);
        clearInterval(interval);
        return;
      }
      await checkAccess();
    }, 5000);

    return () => clearInterval(interval);
  }, [pollingRelevant]);

  if (!pollingRelevant) return null;

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <button
        onClick={checkAccess}
        disabled={checking || pollStopped}
        className="btn-secondary"
        type="button"
      >
        {checking ? 'Verificando...' : 'Verificar agora'}
      </button>
      {lastChecked && !checking && (
        <p className="text-sm" style={{ color: 'var(--fade)' }}>
          Última verificação: {lastChecked.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  );
}
