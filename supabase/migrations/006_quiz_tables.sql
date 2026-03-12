CREATE TABLE public.quiz_questions (
  id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_number        INTEGER     NOT NULL,
  question             TEXT        NOT NULL,
  options              JSONB       NOT NULL,
  correct_answer_index INTEGER     NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  order_number         INTEGER     NOT NULL DEFAULT 1,
  created_at           TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.quiz_attempts (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_number  INTEGER     NOT NULL,
  score          INTEGER     NOT NULL,
  total          INTEGER     NOT NULL,
  answers        JSONB       NOT NULL,
  completed_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quiz_questions_select_paid" ON public.quiz_questions
  FOR SELECT USING (has_paid_access() OR is_admin());

CREATE POLICY "quiz_questions_all_admin" ON public.quiz_questions
  FOR ALL USING (is_admin());

CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
