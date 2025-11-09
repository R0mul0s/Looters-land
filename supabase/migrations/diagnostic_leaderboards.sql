-- Diagnostic queries to check leaderboard system
-- Run these in Supabase SQL Editor to diagnose the 406 error

-- 1. Check if daily_leaderboards table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'daily_leaderboards';

-- 2. Check table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'daily_leaderboards'
ORDER BY ordinal_position;

-- 3. Check if leaderboard_category enum exists
SELECT
  t.typname,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'leaderboard_category'
ORDER BY e.enumsortorder;

-- 4. Check RLS (Row Level Security) status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'daily_leaderboards';

-- 5. List all RLS policies on daily_leaderboards
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'daily_leaderboards';

-- 6. Check if any data exists
SELECT COUNT(*) as total_entries FROM daily_leaderboards;

-- 7. Check entries for today
SELECT
  category,
  COUNT(*) as entry_count
FROM daily_leaderboards
WHERE date = CURRENT_DATE
GROUP BY category;

-- 8. Test basic insert (will fail if RLS blocks it)
-- INSERT INTO daily_leaderboards (user_id, category, score, deepest_floor)
-- VALUES (auth.uid(), 'deepest_floor', 1, 1);
-- DELETE FROM daily_leaderboards WHERE user_id = auth.uid() AND category = 'deepest_floor' AND score = 1;
