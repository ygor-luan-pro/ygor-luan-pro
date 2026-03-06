// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VideoPlayer from '../../../src/islands/VideoPlayer';

let mockOnHandlers: Record<string, (data: { seconds: number; duration: number }) => Promise<void>> = {};

const mockPlayerInstance = {
  on: vi.fn((event: string, handler: (data: { seconds: number; duration: number }) => Promise<void>) => {
    mockOnHandlers[event] = handler;
  }),
  destroy: vi.fn(),
};

vi.mock('@vimeo/player', () => ({
  default: vi.fn(function (_el: unknown) { return mockPlayerInstance; }),
}));

const getCompleteCalls = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.filter(([url]: unknown[]) => url === '/api/progress/complete');

describe('VideoPlayer', () => {
  beforeEach(() => {
    mockOnHandlers = {};
    mockPlayerInstance.on.mockClear();
    mockPlayerInstance.destroy.mockClear();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renderiza iframe com URL Vimeo correta', () => {
    render(<VideoPlayer lessonId="l1" videoUrl="https://vimeo.com/123456" />);
    const iframe = screen.getByTitle('Aula') as HTMLIFrameElement;
    expect(iframe.src).toContain('player.vimeo.com/video/123456');
  });

  it('URL inválida mostra fallback', () => {
    render(<VideoPlayer lessonId="l1" videoUrl="https://youtube.com/watch?v=abc" />);
    expect(screen.getByText('URL de vídeo inválida')).toBeInTheDocument();
  });

  it('timeupdate com 30s chama watch-time API', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 30, duration: 100 });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/progress/watch-time',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"watchTime":30'),
      }),
    );
  });

  it('timeupdate a 90% chama complete API', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 90, duration: 100 });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/progress/complete',
      expect.objectContaining({ method: 'POST' }),
    );
    const completeCalls = getCompleteCalls(global.fetch as ReturnType<typeof vi.fn>);
    expect(completeCalls).toHaveLength(1);
  });

  it('timeupdate a 90% chama complete API apenas uma vez mesmo disparado várias vezes', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 90, duration: 100 });
      await mockOnHandlers['timeupdate']({ seconds: 92, duration: 100 });
    });

    const completeCalls = getCompleteCalls(global.fetch as ReturnType<typeof vi.fn>);
    expect(completeCalls).toHaveLength(1);
  });

  it('initialCompleted=true esconde botão', () => {
    render(<VideoPlayer lessonId="l1" videoUrl="https://vimeo.com/123456" initialCompleted={true} />);
    expect(screen.queryByText('Marcar como concluída')).not.toBeInTheDocument();
  });

  it('botão manual chama complete API', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      fireEvent.click(screen.getByText('Marcar como concluída'));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/progress/complete',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('texto "Aula concluída" aparece após completar', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      fireEvent.click(screen.getByText('Marcar como concluída'));
    });

    expect(screen.getByText('— Aula concluída')).toBeInTheDocument();
  });

  it('cliques duplos rápidos chamam complete API apenas uma vez', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);
    const button = screen.getByText('Marcar como concluída');

    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
    });

    const completeCalls = getCompleteCalls(global.fetch as ReturnType<typeof vi.fn>);
    expect(completeCalls).toHaveLength(1);
  });

  it('initialCompleted=true impede chamada à complete API via timeupdate', async () => {
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" initialCompleted={true} />);

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 90, duration: 100 });
    });

    const completeCalls = getCompleteCalls(global.fetch as ReturnType<typeof vi.fn>);
    expect(completeCalls).toHaveLength(0);
  });

  it('markComplete reverte estado quando fetch falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      fireEvent.click(screen.getByText('Marcar como concluída'));
    });

    expect(screen.getByText('Marcar como concluída')).toBeInTheDocument();
  });

  it('markComplete permite nova tentativa após falha', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      fireEvent.click(screen.getByText('Marcar como concluída'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Marcar como concluída'));
    });

    const completeCalls = getCompleteCalls(fetchMock);
    expect(completeCalls).toHaveLength(2);
  });

  it('lastSavedRef reseta para 0 ao trocar lessonId', async () => {
    const { rerender } = render(
      <VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/111" initialWatchTime={60} />,
    );

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 90, duration: 200 });
    });

    rerender(<VideoPlayer lessonId="lesson-2" videoUrl="https://vimeo.com/222" />);

    (global.fetch as ReturnType<typeof vi.fn>).mockClear();

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 30, duration: 200 });
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/progress/watch-time',
      expect.objectContaining({ body: expect.stringContaining('"watchTime":30') }),
    );
  });

  it('timeupdate reverte estado quando fetch de complete falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    render(<VideoPlayer lessonId="lesson-1" videoUrl="https://vimeo.com/123456" />);

    await act(async () => {
      await mockOnHandlers['timeupdate']({ seconds: 90, duration: 100 });
    });

    expect(screen.getByText('Marcar como concluída')).toBeInTheDocument();
  });
});
