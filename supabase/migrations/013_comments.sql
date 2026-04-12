CREATE TABLE lesson_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  deleted_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_lesson_comments_updated_at
  BEFORE UPDATE ON lesson_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active comments"
  ON lesson_comments FOR SELECT
  USING (deleted_at IS NULL AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can create own comments"
  ON lesson_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own comments"
  ON lesson_comments FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all comments including deleted"
  ON lesson_comments FOR SELECT
  USING (is_admin());

CREATE POLICY "Admin can soft-delete any comment"
  ON lesson_comments FOR UPDATE
  USING (is_admin());
