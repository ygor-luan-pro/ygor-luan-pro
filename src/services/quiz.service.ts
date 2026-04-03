import { supabaseAdmin } from '../lib/supabase-admin';
import type { QuizAttempt, QuizAttemptResult, QuizQuestion, QuizQuestionPublic } from '../types';

export class QuizService {
  static async getQuestionsByModule(moduleNumber: number): Promise<QuizQuestion[]> {
    const { data, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('module_number', moduleNumber)
      .order('order_number');
    if (error) throw new Error(error.message);
    return data ?? [];
  }

  static async getPublicQuestionsByModule(moduleNumber: number): Promise<QuizQuestionPublic[]> {
    const questions = await QuizService.getQuestionsByModule(moduleNumber);
    return questions.map(({ correct_answer_index: _stripped, ...rest }) => ({
      ...rest,
      options: rest.options as string[],
    }));
  }

  static async submitAttempt(
    userId: string,
    moduleNumber: number,
    answers: number[],
  ): Promise<QuizAttemptResult> {
    const questions = await QuizService.getQuestionsByModule(moduleNumber);
    if (questions.length === 0) throw new Error('Módulo sem questões');
    if (answers.length !== questions.length) throw new Error('Número de respostas inválido');

    const perQuestion = answers.map((answer, i) => answer === questions[i].correct_answer_index);
    const score = perQuestion.filter(Boolean).length;

    const { error } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({ user_id: userId, module_number: moduleNumber, score, total: questions.length, answers })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return { score, total: questions.length, perQuestion };
  }

  static async getBestAttempt(
    userId: string,
    moduleNumber: number,
  ): Promise<Pick<QuizAttempt, 'score' | 'total'> | null> {
    const { data, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('score, total')
      .eq('user_id', userId)
      .eq('module_number', moduleNumber)
      .order('score', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw new Error(error.message);
    return data;
  }

  static async hasQuestions(moduleNumber: number): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('id')
      .eq('module_number', moduleNumber)
      .limit(1)
      .single();
    if (error && error.code === 'PGRST116') return false;
    if (error) throw new Error(error.message);
    return data !== null;
  }

  static async createQuestion(input: Omit<QuizQuestion, 'id' | 'created_at'>): Promise<QuizQuestion> {
    const { data, error } = await supabaseAdmin
      .from('quiz_questions')
      .insert(input)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async updateQuestion(
    id: string,
    input: Partial<Omit<QuizQuestion, 'id' | 'created_at'>>,
  ): Promise<QuizQuestion> {
    const { data, error } = await supabaseAdmin
      .from('quiz_questions')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteQuestion(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('quiz_questions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async getAttemptCount(userId: string, moduleNumber: number): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('module_number', moduleNumber);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
