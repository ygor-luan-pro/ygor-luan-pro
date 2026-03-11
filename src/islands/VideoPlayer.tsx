import Player from '@vimeo/player';
import { useState, useEffect, useRef, useCallback } from 'react';
import { shouldSaveWatchTime, shouldAutoComplete, extractVimeoId } from './vimeo-utils';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  initialWatchTime?: number;
  initialCompleted?: boolean;
}

export default function VideoPlayer({
  lessonId,
  videoUrl,
  initialWatchTime = 0,
  initialCompleted = false,
}: VideoPlayerProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [progressError, setProgressError] = useState(false);
  const completedRef = useRef(initialCompleted);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastSavedRef = useRef(initialWatchTime);

  const vimeoId = extractVimeoId(videoUrl);
  const embedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&color=C9853A&title=0&byline=0&portrait=0`
    : null;

  const markComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    try {
      const res = await fetch('/api/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) throw new Error('Falha ao marcar aula como concluída');
    } catch {
      completedRef.current = false;
      setCompleted(false);
      setProgressError(true);
    }
  }, [lessonId]);

  useEffect(() => {
    lastSavedRef.current = 0;
    if (!iframeRef.current) return;

    const player = new Player(iframeRef.current);

    player.on('timeupdate', async ({ seconds, duration }: { seconds: number; duration: number }) => {
      if (shouldSaveWatchTime(seconds, lastSavedRef.current)) {
        lastSavedRef.current = seconds;
        try {
          const res = await fetch('/api/progress/watch-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lessonId, watchTime: Math.floor(seconds) }),
          });
          if (!res.ok) {
            setProgressError(true);
          } else {
            setProgressError(false);
          }
        } catch {
          console.error('VideoPlayer: falha ao salvar progresso');
        }
      }

      if (shouldAutoComplete(seconds, duration)) {
        await markComplete();
      }
    });

    return () => {
      player.destroy();
    };
  }, [lessonId, markComplete]);

  if (!embedUrl) {
    return (
      <div
        className="aspect-video flex items-center justify-center font-sans text-sm"
        style={{ backgroundColor: 'var(--tobacco)', color: 'var(--fade)' }}
      >
        URL de vídeo inválida
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden" style={{ backgroundColor: 'var(--mahogany)' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Aula"
        />
      </div>

      {progressError && (
        <p className="font-sans text-sm" style={{ color: '#f87171' }}>
          Não foi possível salvar seu progresso. Verifique sua conexão.
        </p>
      )}

      {!completed && (
        <button onClick={markComplete} className="btn-ghost text-sm px-4 py-2">
          Marcar como concluída
        </button>
      )}

      {completed && (
        <p className="font-sans text-sm" style={{ color: 'var(--copper)' }}>
          — Aula concluída
        </p>
      )}
    </div>
  );
}
