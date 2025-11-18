# Deployment Instructions - Session Management

## Krok 1: Aplikace databázové migrace

### Možnost A: Přes Supabase Dashboard (DOPORUČENO)

1. Otevři Supabase Dashboard: https://supabase.com/dashboard
2. Vyber svůj projekt
3. Jdi do **SQL Editor** (v levém menu)
4. Klikni na **New query**
5. Zkopíruj celý obsah souboru `supabase/migrations/20251118_add_session_management.sql`
6. Vlož do SQL editoru
7. Klikni na **Run** (nebo F5)
8. Ověř, že vidíš zprávu "✅ Session management system installed successfully!"

### Možnost B: Přes Supabase CLI

```bash
# 1. Nainstaluj Supabase CLI (pokud ještě nemáš)
npm install -g supabase

# 2. Linkni projekt
cd looters-land
npx supabase link --project-ref ykkjdsciiztoeqycxmtg

# 3. Aplikuj migraci
npx supabase db push
```

### Možnost C: Přes SQL soubor přímo

```bash
# Použij psql nebo pg_dump s connection stringem z Supabase
psql "postgresql://postgres:[YOUR-PASSWORD]@db.ykkjdsciiztoeqycxmtg.supabase.co:5432/postgres" \
  -f supabase/migrations/20251118_add_session_management.sql
```

## Krok 2: Ověření migrace

### Zkontroluj tabulky

V Supabase Dashboard > **Database** > **Tables** by měly být vidět nové tabulky:
- `user_sessions`
- `user_sessions_audit`

### Zkontroluj funkce

V Supabase Dashboard > **Database** > **Functions** by měly být vidět funkce:
- `create_new_session`
- `update_session_heartbeat`
- `cleanup_stale_sessions`
- `get_user_active_sessions`
- `log_session_event`

### Spusť test skript (Volitelné)

```bash
# V Supabase Dashboard > SQL Editor
# Zkopíruj a spusť obsah souboru: supabase/TEST_SESSION_MANAGEMENT.sql
```

## Krok 3: Zapnutí Supabase Realtime

1. V Supabase Dashboard jdi do **Settings** > **API**
2. Scroll dolů na **Realtime**
3. Ověř, že Realtime je **Enabled**
4. Přidej tabulku `user_sessions` do Realtime:
   - Jdi do **Database** > **Replication**
   - Najdi tabulku `user_sessions`
   - Klikni na **Enable Realtime**

## Krok 4: Nastavení pg_cron (Volitelné, ale doporučené)

Pro automatické čištění starých sessions:

1. V Supabase Dashboard jdi do **Database** > **Extensions**
2. Najdi `pg_cron` a klikni **Enable**
3. V SQL Editoru spusť:

```sql
-- Schedule cleanup job to run every 5 minutes
SELECT cron.schedule(
  'cleanup-stale-sessions',
  '*/5 * * * *',
  $$SELECT cleanup_stale_sessions();$$
);
```

## Krok 5: Build a deploy aplikace

```bash
cd looters-land

# Install dependencies (pokud ještě nemáš)
npm install

# Build aplikace
npm run build

# Deploy na tvůj hosting (Vercel, Netlify, etc.)
# Např. pro Vercel:
vercel --prod
```

## Krok 6: Testování

### Test 1: Single device

1. Otevři aplikaci v prohlížeči
2. Přihlas se
3. Zkontroluj konzoli - měla by být zpráva "✅ Session created"
4. Otevři DevTools > Network > WS - měl by být WebSocket připojený (Realtime)

### Test 2: Multi-tab

1. Otevři aplikaci v jednom tabu
2. Přihlas se
3. Otevři aplikaci v druhém tabu (stejný prohlížeč)
4. Přihlas se stejným účtem
5. První tab by měl zobrazit modal "Session Expired" a odhlásit se

### Test 3: Multi-device

1. Přihlas se na PC
2. Přihlas se na mobilu se stejným účtem
3. PC by měl zobrazit modal "Session Expired" a odhlásit se

## Troubleshooting

### Migrace selhala

**Chyba:** "relation user_sessions already exists"
**Řešení:** Tabulka už existuje. Můžeš ji smazat a spustit migraci znovu:
```sql
DROP TABLE IF EXISTS user_sessions_audit CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
-- Pak spusť migraci znovu
```

### Realtime nefunguje

**Příznaky:** Session se neodhlásí na druhém zařízení
**Řešení:**
1. Zkontroluj, že Realtime je enabled (Krok 3)
2. Zkontroluj konzoli - měla by být zpráva "📡 Realtime subscription status: SUBSCRIBED"
3. Zkontroluj Network tab - měl by být WebSocket připojený

### Heartbeat selhává

**Příznaky:** Session expiruje příliš brzy
**Řešení:**
1. Zkontroluj konzoli - měla by být zpráva "💓 Heartbeat sent successfully" každých 30s
2. Zkontroluj `last_heartbeat` v databázi:
```sql
SELECT session_id, last_heartbeat, NOW() - last_heartbeat as age
FROM user_sessions WHERE is_active = true;
```

## Rollback (v případě problémů)

Pokud potřebuješ vrátit změny:

```sql
-- V Supabase Dashboard > SQL Editor

-- 1. Odstranit pg_cron job (pokud byl vytvořen)
SELECT cron.unschedule('cleanup-stale-sessions');

-- 2. Odstranit triggery
DROP TRIGGER IF EXISTS trigger_log_session_events ON user_sessions;

-- 3. Odstranit funkce
DROP FUNCTION IF EXISTS log_session_event();
DROP FUNCTION IF EXISTS get_user_active_sessions();
DROP FUNCTION IF EXISTS cleanup_stale_sessions();
DROP FUNCTION IF EXISTS update_session_heartbeat(TEXT);
DROP FUNCTION IF EXISTS create_new_session(UUID, TEXT, JSONB);

-- 4. Odstranit tabulky
DROP TABLE IF EXISTS user_sessions_audit CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
```

## Monitoring

### Zkontroluj aktivní sessions

```sql
SELECT
  u.email,
  s.session_id,
  s.device_info->>'platform' as platform,
  s.device_info->>'userAgent' as user_agent,
  s.last_heartbeat,
  NOW() - s.last_heartbeat as idle_time
FROM user_sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.is_active = true
ORDER BY s.last_heartbeat DESC;
```

### Zkontroluj session audit log

```sql
SELECT
  u.email,
  sa.event_type,
  sa.session_id,
  sa.created_at
FROM user_sessions_audit sa
JOIN auth.users u ON u.id = sa.user_id
ORDER BY sa.created_at DESC
LIMIT 20;
```

## Next Steps

Po úspěšném nasazení:

1. ✅ Monitoruj active sessions první den
2. ✅ Zkontroluj, že cleanup_stale_sessions() běží každých 5 minut
3. ✅ Přidej alerting pro neočekávané počty sessions
4. ✅ Zvažte přidání grace period (5s warning před odhlášením)
5. ✅ Zvažte přidání Session Management UI (zobrazení aktivních zařízení)

Více informací viz [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md)
