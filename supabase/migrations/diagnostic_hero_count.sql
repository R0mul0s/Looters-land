-- Diagnostic queries to check hero data
-- Run these in Supabase SQL Editor to diagnose the missing heroes issue

-- 1. Check total number of heroes in database
SELECT COUNT(*) as total_heroes FROM heroes;

-- 2. Check heroes per game save
SELECT
  gs.save_name,
  gs.user_id,
  COUNT(h.id) as hero_count
FROM game_saves gs
LEFT JOIN heroes h ON h.game_save_id = gs.id
GROUP BY gs.id, gs.save_name, gs.user_id
ORDER BY gs.updated_at DESC;

-- 3. Check if rarity column exists and has data
SELECT
  hero_name,
  hero_class,
  rarity,
  level,
  created_at
FROM heroes
ORDER BY created_at DESC
LIMIT 20;

-- 4. Check for heroes without rarity (should be none after migration)
SELECT COUNT(*) as heroes_without_rarity
FROM heroes
WHERE rarity IS NULL OR rarity = '';

-- 5. Check column schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'heroes'
ORDER BY ordinal_position;
