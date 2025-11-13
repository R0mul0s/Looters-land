# Nastavení Globálního Počasí a Času

Tento dokument popisuje, jak nastavit globální synchronizaci počasí a času mezi všemi hráči.

## ✅ Co už je hotovo

1. **Databázová migrace** - `supabase/migrations/20251113_add_global_world_state.sql`
   - ✅ Aplikováno v Supabase Dashboard

2. **Frontend implementace**
   - ✅ `GlobalWorldStateService.ts` - služba pro práci s databází
   - ✅ `useGlobalWorldState.ts` - React hook pro globální stav
   - ✅ `WorldMapDemo2.tsx` - integrace globálního stavu do mapy
   - ✅ Kompilace úspěšná

## 🔧 Co je potřeba ještě udělat

### 1. Nasadit Edge Function

Edge Function automaticky aktualizuje počasí a čas každých 15 minut.

**Kroky:**

```bash
# 1. Nainstalovat Supabase CLI (pokud ještě není)
scoop install supabase

# 2. Přihlásit se
supabase login

# 3. Propojit projekt (project-ref z Dashboard → Settings → API)
supabase link --project-ref <your-project-ref>

# 4. Nasadit funkci
cd c:\Github\New-game\looters-land
supabase functions deploy update-global-world-state
```

### 2. Nastavit Cron Job

V **Supabase Dashboard → SQL Editor** spusťte:

```sql
-- Povolit pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Naplánovat funkci na každých 15 minut
SELECT cron.schedule(
  'update-global-world-state',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/update-global-world-state',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Nahraďte:**
- `<PROJECT_REF>` - z Dashboard → Settings → API → Project URL
- `<SERVICE_ROLE_KEY>` - z Dashboard → Settings → API → service_role key

### 3. Ověřit funkčnost

```sql
-- Zkontrolovat cron job
SELECT * FROM cron.job;

-- Zkontrolovat aktuální stav počasí a času
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

### 4. Manuální test

Můžete funkci spustit manuálně pro okamžité testování:

```bash
curl -X POST \
  'https://<PROJECT_REF>.supabase.co/functions/v1/update-global-world-state' \
  -H 'Authorization: Bearer <ANON_KEY>' \
  -H 'Content-Type: application/json'
```

## 🎮 Jak to funguje

1. **Edge Function** běží každých 15 minut (cron job)
2. Kontroluje, jestli uplynul čas pro přechod počasí nebo času
3. Pokud ano, aktualizuje `global_world_state` tabulku v databázi
4. Všichni hráči dostávají real-time update přes Supabase Realtime
5. `useGlobalWorldState` hook automaticky aplikuje změny do lokální mapy

## 📊 Konfigurace

### Trvání stavů

- **Počasí**: 30-60 minut (náhodně)
- **Čas**: 15-25 minut (náhodně)

### Pravděpodobnosti počasí

- Jasno: 40%
- Déšť: 25%
- Bouřka: 10%
- Mlha: 15%
- Sníh: 10%

### Cyklus času

Dawn → Day → Dusk → Night → Dawn (opakuje se)

## 🐛 Troubleshooting

### Počasí/čas se nesynchronizuje

1. Zkontrolujte, že migrace byla aplikována:
   ```sql
   SELECT * FROM global_world_state WHERE id = 1;
   ```

2. Zkontrolujte, že Edge Function běží:
   ```bash
   supabase functions logs update-global-world-state
   ```

3. Zkontrolujte cron job:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```

### Hráči vidí různé počasí

- Zkontrolujte konzoli prohlížeče - měly by být vidět logy `🌍 Global world state loaded`
- Zkontrolujte Network tab - měl by být aktivní WebSocket pro Realtime
- Obnovte stránku (F5)

## 📚 Další dokumentace

- Edge Function: `supabase/functions/update-global-world-state/README.md`
- Migrace: `supabase/migrations/20251113_add_global_world_state.sql`
- Service: `src/services/GlobalWorldStateService.ts`
- Hook: `src/hooks/useGlobalWorldState.ts`
