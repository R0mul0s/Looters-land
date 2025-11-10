-- Setup daily reset cron job
-- This schedules the daily-reset Edge Function to run at midnight UTC

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing daily reset job if it exists
SELECT cron.unschedule('daily-reset-trigger');

-- Schedule the daily reset Edge Function to run at 00:00 UTC every day
-- IMPORTANT: Replace [your-project-id] and [your-anon-key] with actual values
-- You can find these in Supabase Dashboard -> Settings -> API

-- For now, this is a template. You need to run this manually in SQL Editor
-- and replace the placeholders with your actual values.

/*
SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
    headers:='{"Authorization": "Bearer [your-anon-key]"}'::jsonb
  )
  $$
);
*/

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-reset-trigger';

-- Check execution history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-reset-trigger')
ORDER BY start_time DESC
LIMIT 10;
