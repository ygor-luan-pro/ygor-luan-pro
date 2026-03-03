import { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  initialWatchTime?: number;
  onComplete?: () => void;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function VideoPlayer({
  lessonId,
  videoUrl,
  initialWatchTime = 0,
  onComplete,
}: VideoPlayerProps) {
  const [completed, setCompleted] = useState(false);
  const watchTimeRef = useRef(initialWatchTime);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const vimeoId = extractVimeoId(videoUrl);
  const embedUrl = vimeoId
    ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&color=C9853A&title=0&byline=0&portrait=0`
    : null;

  const saveWatchTime = async (time: number) => {
    await fetch('/api/progress/watch-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId, watchTime: Math.floor(time) }),
    });
  };

  const markComplete = async () => {
    if (completed) return;
    setCompleted(true);

    await fetch('/api/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId }),
    });

    onComplete?.();
  };

  useEffect(() => {
    saveIntervalRef.current = setInterval(() => {
      watchTimeRef.current += 30;
      saveWatchTime(watchTimeRef.current);
    }, 30_000);

    return () => {
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [lessonId]);

  if (!embedUrl) {
    return (
      <div className="aspect-video flex items-center justify-center font-sans text-sm"
        style={{ backgroundColor: 'var(--tobacco)', color: 'var(--fade)' }}>
        URL de vídeo inválida
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden" style={{ backgroundColor: 'var(--mahogany)' }}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Aula"
        />
      </div>

      {!completed && (
        <button
          onClick={markComplete}
          className="btn-ghost text-sm px-4 py-2"
        >
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
