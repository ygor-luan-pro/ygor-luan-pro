CREATE INDEX idx_lesson_comments_lesson ON lesson_comments(lesson_id);
CREATE INDEX idx_lesson_comments_user ON lesson_comments(user_id);
CREATE INDEX idx_lesson_comments_feed
  ON lesson_comments(lesson_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_lesson_ratings_lesson ON lesson_ratings(lesson_id);
CREATE INDEX idx_materials_lesson ON materials(lesson_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
