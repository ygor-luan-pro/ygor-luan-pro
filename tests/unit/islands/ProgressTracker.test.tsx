// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressTracker from '../../../src/islands/ProgressTracker';

const mockModules = [
  { number: 1, title: 'Fundamentos', completed: 4, total: 4, allDone: true },
  { number: 2, title: 'Degradê', completed: 2, total: 5, allDone: false },
  { number: 3, title: 'Coloração', completed: 0, total: 6, allDone: false },
];

describe('ProgressTracker', () => {
  describe('overall progress (sem módulos)', () => {
    it('exibe contagem e percentual geral', () => {
      render(<ProgressTracker totalLessons={10} completedLessons={5} />);
      expect(screen.getByText(/5 de 10 aulas concluídas/i)).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
    });

    it('exibe mensagem de conclusão ao atingir 100%', () => {
      render(<ProgressTracker totalLessons={10} completedLessons={10} />);
      expect(screen.getByText(/parabéns/i)).toBeTruthy();
    });

    it('não exibe breakdown quando modules não é passado', () => {
      render(<ProgressTracker totalLessons={10} completedLessons={5} />);
      expect(screen.queryByText('Fundamentos')).toBeNull();
    });
  });

  describe('breakdown por módulo', () => {
    it('exibe uma linha por módulo quando modules é passado', () => {
      render(<ProgressTracker totalLessons={15} completedLessons={6} modules={mockModules} />);
      expect(screen.getByText('Fundamentos')).toBeTruthy();
      expect(screen.getByText('Degradê')).toBeTruthy();
      expect(screen.getByText('Coloração')).toBeTruthy();
    });

    it('exibe percentual correto por módulo', () => {
      render(<ProgressTracker totalLessons={15} completedLessons={6} modules={mockModules} />);
      expect(screen.getByText('100%')).toBeTruthy(); // Fundamentos
      expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1); // Degradê: 2/5 (also matches overall 6/15)
      expect(screen.getByText('0%')).toBeTruthy();   // Coloração
    });

    it('exibe badge "concluído" apenas em módulos com allDone=true', () => {
      render(<ProgressTracker totalLessons={15} completedLessons={6} modules={mockModules} />);
      const badges = screen.queryAllByText(/concluído/i);
      expect(badges).toHaveLength(1);
    });

    it('exibe contagem de aulas por módulo', () => {
      render(<ProgressTracker totalLessons={15} completedLessons={6} modules={mockModules} />);
      expect(screen.getByText(/4 de 4/i)).toBeTruthy();
      expect(screen.getByText(/2 de 5/i)).toBeTruthy();
      expect(screen.getByText(/0 de 6/i)).toBeTruthy();
    });
  });
});
