# Update Global World State - Edge Function

Tato Edge Function automaticky aktualizuje globální stav počasí a času ve hře.

## Nasazení

### 1. Nainstalujte Supabase CLI

```bash
# Windows (pomocí Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Nebo stáhněte z: https://github.com/supabase/cli/releases
```

### 2. Přihlaste se k Supabase

```bash
supabase login
```

### 3. Propojte projekt

```bash
supabase link --project-ref <your-project-ref>
```

Project ref najdete v Supabase Dashboard → Settings → API → Project URL

### 4. Nasaďte funkci

```bash
supabase functions deploy update-global-world-state
```

### 5. Nastavte Cron Job

V Supabase Dashboard:

1. Přejděte na **Database** → **Extensions**
2. Povolte extension `pg_cron`
3. Přejděte na **SQL Editor**
4. Spusťte následující SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule function to run every 15 minutes
SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := '<YOUR_SUPABASE_URL>/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Důležité:**
- Nahraďte `<YOUR_SUPABASE_URL>` vaší Supabase URL (např. `https://xxx.supabase.co`)
- Nahraďte `<YOUR_SERVICE_ROLE_KEY>` vaším service role key z Dashboard → Settings → API

### 6. Ověřte, že Cron Job běží

```sql
-- Zobrazit všechny cron joby
SELECT * FROM cron.job;

-- Zobrazit historii běhů
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## Manuální spuštění

Můžete funkci spustit manuálně pro testování:

```bash
curl -X POST \
  '<YOUR_SUPABASE_URL>/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer <YOUR_ANON_KEY>' \
  -H 'Content-Type: application/json'
```

## Konfigurace

### Frekvence aktualizací

V SQL příkazu můžete upravit cron výraz:
- `*/15 * * * *` - každých 15 minut (doporučeno)
- `*/30 * * * *` - každých 30 minut
- `0 * * * *` - každou hodinu

### Trvání počasí a času

V `index.ts`:
- **Počasí:** 30-60 minut (řádek 126)
- **Čas:** 15-25 minut (řádek 141)

### Váhy počasí

V `index.ts` (řádky 42-47):
- `clear`: 40% šance
- `rain`: 25% šance
- `storm`: 10% šance
- `fog`: 15% šance
- `snow`: 10% šance

## Monitoring

### Logy Edge Function

```bash
supabase functions logs update-global-world-state
```

### SQL dotaz na aktuální stav

```sql
SELECT
  weather_current,
  weather_next,
  weather_transition_start + (weather_duration || ' minutes')::interval AS weather_changes_at,
  time_current,
  time_next,
  time_transition_start + (time_duration || ' minutes')::interval AS time_changes_at,
  updated_at
FROM global_world_state
WHERE id = 1;
```

## Odstranění Cron Job

Pokud potřebujete cron job zastavit:

```sql
SELECT cron.unschedule('update-global-world-state');
```
