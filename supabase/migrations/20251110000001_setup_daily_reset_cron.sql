-- Setup daily reset cron job
-- This schedules the daily-reset Edge Function to run at midnight UTC

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension (required for HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing daily reset job if it exists (ignore errors if doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-reset-trigger');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Schedule the daily reset Edge Function to run at 00:00 UTC every day
-- NOTE: No Authorization header needed - Edge Function uses SUPABASE_SERVICE_ROLE_KEY env variable
SELECT cron.schedule(
  'daily-reset-trigger',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  SELECT net.http_post(
    url:='https://ykkjdsciiztoeqycxmtg.supabase.co/functions/v1/daily-reset',
    headers:=jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-reset-trigger';

-- Check execution history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-reset-trigger')
ORDER BY start_time DESC
LIMIT 10;
