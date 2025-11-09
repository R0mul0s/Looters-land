-- Enable Realtime for player_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE player_profiles;

-- Verify realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
