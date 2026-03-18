CREATE TABLE lesson_ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE TRIGGER update_lesson_ratings_updated_at
  BEFORE UPDATE ON lesson_ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lesson_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ratings"
  ON lesson_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all ratings"
  ON lesson_ratings FOR SELECT
  USING (is_admin());
