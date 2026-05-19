CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM orders
  WHERE status = 'approved';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_completion_date(p_user_id UUID)
RETURNS TIMESTAMPTZ AS $$
  SELECT MAX(up.completed_at)
  FROM user_progress up
  JOIN lessons l ON l.id = up.lesson_id
  WHERE up.user_id = p_user_id
    AND up.completed = true
    AND up.completed_at IS NOT NULL
    AND l.is_published = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
