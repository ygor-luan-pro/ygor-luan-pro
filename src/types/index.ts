export type { Database } from './database.types';

import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Lesson = Database['public']['Tables']['lessons']['Row'];
export type Module = Database['public']['Tables']['modules']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];
export type MentorshipSession = Database['public']['Tables']['mentorship_sessions']['Row'];
export type Material = Database['public']['Tables']['materials']['Row'];

export type LessonWithProgress = Lesson & {
  progress?: UserProgress;
};

export type ModuleWithLessons = Module & {
  lessons: LessonWithProgress[];
};

export type StudentStats = {
  total_lessons: number;
  completed_count: number;
  total_watch_time: number;
};

export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type QuizAttempt  = Database['public']['Tables']['quiz_attempts']['Row'];

export type QuizQuestionPublic = Omit<QuizQuestion, 'correct_answer_index'> & {
  options: string[];
};

export type QuizAttemptResult = {
  score: number;
  total: number;
  perQuestion: boolean[];
};

export type ModuleWithQuiz = Module & {
  hasQuiz: boolean;
  bestAttempt: Pick<QuizAttempt, 'score' | 'total'> | null;
};

export type ProductId = 'videoaulas' | 'mentoria-completa';

export interface PricingProduct {
  id: ProductId;
  eyebrow: string;
  title: string;
  features: string[];
  price: number;
  originalPrice?: number;
  cta: string;
  highlighted: boolean;
}
