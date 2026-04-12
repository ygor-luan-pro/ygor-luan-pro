import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuizService } from '../../../src/services/quiz.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

const mockQuestion = {
  id: 'q-1',
  module_number: 1,
  question: 'Qual ferramenta usar para degrade?',
  options: ['Tesoura', 'Navalha', 'Clipper', 'Pente'],
  correct_answer_index: 2,
  order_number: 1,
  created_at: new Date().toISOString(),
};

const mockAttempt = {
  id: 'a-1',
  user_id: 'user-1',
  module_number: 1,
  score: 3,
  total: 4,
  answers: [2, 1, 0, 2],
  completed_at: new Date().toISOString(),
};

describe('QuizService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getQuestionsByModule', () => {
    it('retorna questões do módulo ordenadas por order_number', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockQuestion], error: null }),
          }),
        }),
      } as never);
      const questions = await QuizService.getQuestionsByModule(1);
      expect(questions).toHaveLength(1);
      expect(questions[0].question).toBe('Qual ferramenta usar para degrade?');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('quiz_questions');
    });

    it('retorna array vazio quando não há questões', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);
      const questions = await QuizService.getQuestionsByModule(99);
      expect(questions).toEqual([]);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never);
      await expect(QuizService.getQuestionsByModule(1)).rejects.toThrow('DB error');
    });
  });

  describe('getPublicQuestionsByModule', () => {
    it('remove correct_answer_index das questões retornadas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockQuestion], error: null }),
          }),
        }),
      } as never);
      const questions = await QuizService.getPublicQuestionsByModule(1);
      expect(questions).toHaveLength(1);
      expect('correct_answer_index' in questions[0]).toBe(false);
      expect(questions[0].options).toEqual(['Tesoura', 'Navalha', 'Clipper', 'Pente']);
    });
  });

  describe('submitAttempt', () => {
    it('calcula score correto e persiste tentativa', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockQuestion], error: null }),
          }),
        }),
      } as never);
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockAttempt, error: null }),
          }),
        }),
      } as never);
      const result = await QuizService.submitAttempt('user-1', 1, [2]);
      expect(result.score).toBe(1);
      expect(result.total).toBe(1);
      expect(result.perQuestion).toEqual([true]);
    });

    it('score 0 quando todas as respostas estão erradas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockQuestion], error: null }),
          }),
        }),
      } as never);
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...mockAttempt, score: 0, answers: [0] }, error: null }),
          }),
        }),
      } as never);
      const result = await QuizService.submitAttempt('user-1', 1, [0]);
      expect(result.score).toBe(0);
      expect(result.total).toBe(1);
    });

    it('lança erro quando não há questões para o módulo', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      } as never);
      await expect(QuizService.submitAttempt('user-1', 99, [])).rejects.toThrow('Módulo sem questões');
    });

    it('lança erro quando número de respostas não bate com questões', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockQuestion, { ...mockQuestion, id: 'q-2' }],
              error: null,
            }),
          }),
        }),
      } as never);
      await expect(QuizService.submitAttempt('user-1', 1, [0])).rejects.toThrow('Número de respostas inválido');
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [mockQuestion], error: null }),
          }),
        }),
      } as never);
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'insert fail' } }),
          }),
        }),
      } as never);
      await expect(QuizService.submitAttempt('user-1', 1, [2])).rejects.toThrow('insert fail');
    });
  });

  describe('getBestAttempt', () => {
    it('retorna a melhor tentativa do usuário no módulo', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockAttempt, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as never);
      const attempt = await QuizService.getBestAttempt('user-1', 1);
      expect(attempt?.score).toBe(3);
    });

    it('retorna null quando usuário nunca fez o quiz', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116', message: 'Not found' },
                  }),
                }),
              }),
            }),
          }),
        }),
      } as never);
      const attempt = await QuizService.getBestAttempt('user-1', 99);
      expect(attempt).toBeNull();
    });
  });

  describe('hasQuestions', () => {
    it('retorna true quando há questões no módulo', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockQuestion, error: null }),
            }),
          }),
        }),
      } as never);
      expect(await QuizService.hasQuestions(1)).toBe(true);
    });

    it('retorna false quando não há questões', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      } as never);
      expect(await QuizService.hasQuestions(99)).toBe(false);
    });
  });

  describe('createQuestion', () => {
    it('cria e retorna a nova questão', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockQuestion, error: null }),
          }),
        }),
      } as never);
      const question = await QuizService.createQuestion({
        module_number: 1,
        question: 'Qual ferramenta usar para degrade?',
        options: ['Tesoura', 'Navalha', 'Clipper', 'Pente'],
        correct_answer_index: 2,
        order_number: 1,
      });
      expect(question.id).toBe('q-1');
    });

    it('lança erro quando insert falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'violação' } }),
          }),
        }),
      } as never);
      await expect(
        QuizService.createQuestion({ module_number: 1, question: 'x', options: ['a','b','c','d'], correct_answer_index: 0, order_number: 1 })
      ).rejects.toThrow('violação');
    });
  });

  describe('updateQuestion', () => {
    it('atualiza e retorna a questão modificada', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { ...mockQuestion, question: 'Atualizada' }, error: null }),
            }),
          }),
        }),
      } as never);
      const q = await QuizService.updateQuestion('q-1', { question: 'Atualizada' });
      expect(q.question).toBe('Atualizada');
    });

    it('lança erro quando questão não existe', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
            }),
          }),
        }),
      } as never);
      await expect(QuizService.updateQuestion('invalid', {})).rejects.toThrow('not found');
    });
  });

  describe('deleteQuestion', () => {
    it('deleta questão sem lançar erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      await expect(QuizService.deleteQuestion('q-1')).resolves.toBeUndefined();
    });

    it('lança erro quando delete falha', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      } as never);
      await expect(QuizService.deleteQuestion('q-1')).rejects.toThrow('DB error');
    });
  });

  describe('getAttemptCount', () => {
    it('retorna a contagem de tentativas do usuário no módulo', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
          }),
        }),
      } as never);
      const count = await QuizService.getAttemptCount('user-1', 1);
      expect(count).toBe(2);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('quiz_attempts');
    });

    it('retorna 0 quando não há tentativas', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }),
        }),
      } as never);
      const count = await QuizService.getAttemptCount('user-1', 99);
      expect(count).toBe(0);
    });

    it('lança erro quando Supabase retorna erro', async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never);
      await expect(QuizService.getAttemptCount('user-1', 1)).rejects.toThrow('DB error');
    });
  });
});
