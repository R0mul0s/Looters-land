-- ============================================================================
-- Check Daily Reset Status
-- ============================================================================

-- 1. Check your current profile data
SELECT 
  user_id,
  nickname,
  energy,
  bank_vault_tier,
  240 + (CASE bank_vault_tier
    WHEN 0 THEN 0
    WHEN 1 THEN 25
    WHEN 2 THEN 50
    WHEN 3 THEN 75
    WHEN 4 THEN 100
    WHEN 5 THEN 125
    ELSE 0
  END) as calculated_max_energy,
  world_map_data IS NOT NULL as has_map,
  array_length(discovered_locations, 1) as discovered_count,
  updated_at,
  updated_at AT TIME ZONE 'UTC' as updated_at_utc
FROM player_profiles
WHERE user_id != '00000000-0000-0000-0000-000000000000'
ORDER BY updated_at DESC
LIMIT 5;

-- 2. Check cron job configuration
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  nodename
FROM cron.job
WHERE jobname = 'daily-reset-trigger';

-- 3. Check cron job execution history (last 10 runs)
SELECT
  jr.jobid,
  j.jobname,
  jr.runid,
  jr.status,
  jr.return_message,
  jr.start_time AT TIME ZONE 'UTC' as start_time_utc,
  jr.start_time AT TIME ZONE 'Europe/Prague' as start_time_cz,
  jr.end_time AT TIME ZONE 'UTC' as end_time_utc,
  jr.end_time - jr.start_time as duration
FROM cron.job_run_details jr
JOIN cron.job j ON j.jobid = jr.jobid
WHERE j.jobname = 'daily-reset-trigger'
ORDER BY jr.start_time DESC
LIMIT 10;

-- 4. Test the calculate_bank_energy_bonus function
SELECT 
  tier,
  calculate_bank_energy_bonus(tier) as energy_bonus
FROM generate_series(0, 5) as tier;

-- ============================================================================
