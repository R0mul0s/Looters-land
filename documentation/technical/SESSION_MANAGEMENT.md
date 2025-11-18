# Single-Session Authentication System

## Přehled

Systém pro zajištění, že každý uživatel může být přihlášen pouze na jednom zařízení/tabu najednou. Při přihlášení z nového zařízení se automaticky odhlásí všechny ostatní sessions.

## Architektura

### Komponenty

1. **Database Layer** (`20251118_add_session_management.sql`)
   - Tabulka `user_sessions` pro sledování aktivních sessions
   - Tabulka `user_sessions_audit` pro audit log
   - SQL funkce pro správu sessions

2. **Service Layer** (`SessionManager.ts`)
   - Singleton třída pro správu session
   - Real-time monitoring přes Supabase Realtime
   - Heartbeat mechanismus pro detekci stale sessions

3. **Integration Layer** (`AuthService.ts`, `Router.tsx`)
   - Integrace do auth flow
   - UI notifikace při invalidaci session

## Jak to funguje

### 1. Přihlášení

```typescript
// Při úspěšném přihlášení
const result = await AuthService.login(email, password);

// AuthService automaticky inicializuje SessionManager
await sessionManager.initialize(userId, (reason) => {
  // Callback při invalidaci session
  showNotification(reason);
  logout();
});
```

**Co se děje:**
1. Vygeneruje se unikátní `session_id` (UUID)
2. Zavolá se `create_new_session()` v databázi
3. Všechny ostatní aktivní sessions pro tohoto uživatele se označí jako neaktivní
4. Nová session se uloží s `is_active = true`
5. Spustí se real-time monitoring změn

### 2. Real-time Monitoring

```typescript
// SessionManager se přihlásí k odběru změn
supabase
  .channel(`session:${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    table: 'user_sessions',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    if (!payload.new.is_active) {
      handleSessionInvalidated();
    }
  })
  .subscribe();
```

**Co se děje:**
- Supabase Realtime sleduje změny v `user_sessions` tabulce
- Když se změní `is_active` na `false`, spustí se callback
- Uživatel dostane notifikaci a je automaticky odhlášen

### 3. Heartbeat Mechanismus

```typescript
// Každých 30 sekund
setInterval(async () => {
  await supabase.rpc('update_session_heartbeat', {
    p_session_id: sessionId
  });
}, 30000);
```

**Co se děje:**
1. Každých 30s se aktualizuje `last_heartbeat` timestamp
2. Funkce ověří, zda je session stále aktivní
3. Pokud není (někdo se přihlásil jinde), vrátí `is_still_active = false`
4. Spustí se callback pro odhlášení

### 4. Cleanup Stale Sessions

```sql
-- Automaticky každých 5 minut (přes pg_cron)
SELECT cleanup_stale_sessions();
```

**Co se děje:**
- Najde sessions, které nemají heartbeat > 5 minut
- Označí je jako neaktivní
- Vymaže velmi staré sessions (> 7 dní)

## Database Schema

### Tabulka `user_sessions`

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT UNIQUE NOT NULL,
  device_info JSONB,
  created_at TIMESTAMPTZ,
  last_heartbeat TIMESTAMPTZ,
  is_active BOOLEAN
);
```

**Indexy:**
- `idx_user_sessions_user_id` - vyhledávání podle uživatele
- `idx_user_sessions_active` - aktivní sessions
- `idx_user_sessions_heartbeat` - cleanup stale sessions

### Funkce

#### `create_new_session(user_id, session_id, device_info)`
Vytvoří novou session a invaliduje všechny ostatní.

```sql
SELECT * FROM create_new_session(
  '00000000-0000-0000-0000-000000000001',
  'abc-123-def-456',
  '{"userAgent": "Chrome", "platform": "Windows"}'::jsonb
);
```

**Vrací:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "session_id": "abc-123-def-456",
  "invalidated_count": 2
}
```

#### `update_session_heartbeat(session_id)`
Aktualizuje heartbeat a vrátí, zda je session stále aktivní.

```sql
SELECT * FROM update_session_heartbeat('abc-123-def-456');
```

**Vrací:**
```json
{
  "success": true,
  "is_still_active": true,
  "message": "Heartbeat updated"
}
```

#### `cleanup_stale_sessions()`
Vyčistí staré sessions (> 5 min bez heartbeat).

```sql
SELECT * FROM cleanup_stale_sessions();
```

**Vrací:**
```json
{
  "cleaned_count": 5,
  "message": "Cleanup completed"
}
```

#### `get_user_active_sessions()`
Vrátí aktivní sessions pro aktuálního uživatele.

```sql
SELECT * FROM get_user_active_sessions();
```

**Vrací:**
```json
[
  {
    "session_id": "abc-123",
    "device_info": {"userAgent": "Chrome", "platform": "Windows"},
    "created_at": "2025-11-18T10:00:00Z",
    "last_heartbeat": "2025-11-18T10:05:00Z",
    "is_current": true
  }
]
```

## Row Level Security

```sql
-- Uživatelé vidí pouze své sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Uživatelé mohou vytvořit pouze své sessions
CREATE POLICY "Users can create own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Testování

### 1. Ruční test

```bash
# Spusť migraci
npx supabase db push

# Spusť test skript
psql $DATABASE_URL -f supabase/TEST_SESSION_MANAGEMENT.sql
```

### 2. Multi-tab test

1. Otevři aplikaci v Chrome
2. Přihlas se
3. Otevři aplikaci v novém tabu/okně
4. Přihlas se stejným účtem
5. První tab by měl zobrazit notifikaci a odhlásit se

### 3. Multi-device test

1. Přihlas se na počítači
2. Přihlas se na mobilu se stejným účtem
3. Počítač by měl zobrazit notifikaci a odhlásit se

## Konfigurace

### Heartbeat interval

```typescript
// SessionManager.ts
private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 sekund
```

### Stale session timeout

```sql
-- 20251118_add_session_management.sql
v_stale_threshold INTERVAL := INTERVAL '5 minutes';
```

### Audit log retention

```sql
-- 20251118_add_session_management.sql
DELETE FROM user_sessions
WHERE is_active = false
  AND created_at < NOW() - INTERVAL '7 days';
```

## Monitoring

### Active sessions count

```sql
SELECT COUNT(*)
FROM user_sessions
WHERE is_active = true;
```

### Sessions per user

```sql
SELECT
  u.email,
  COUNT(*) as session_count
FROM user_sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.is_active = true
GROUP BY u.email
ORDER BY session_count DESC;
```

### Stale sessions

```sql
SELECT
  u.email,
  s.session_id,
  s.last_heartbeat,
  NOW() - s.last_heartbeat as age
FROM user_sessions s
JOIN auth.users u ON u.id = s.user_id
WHERE s.is_active = true
  AND s.last_heartbeat < NOW() - INTERVAL '5 minutes';
```

## Troubleshooting

### Problém: Uživatel se neodhlásil na druhém zařízení

**Možné příčiny:**
1. Real-time není připojeno
2. Firewall blokuje WebSocket
3. Session nebyla vytvořena v DB

**Řešení:**
```typescript
// Zkontroluj realtime subscription status
console.log('Realtime status:', sessionManager.realtimeChannel?.state);

// Zkontroluj session v DB
const sessions = await sessionManager.getActiveSessions();
console.log('Active sessions:', sessions);
```

### Problém: Session expiruje příliš brzy

**Možné příčiny:**
1. Heartbeat se neposílá
2. Tab je suspended (Chrome tab throttling)

**Řešení:**
```typescript
// Zkontroluj heartbeat interval
console.log('Heartbeat active:', sessionManager.heartbeatInterval !== null);

// Zkontroluj last_heartbeat v DB
SELECT session_id, last_heartbeat, NOW() - last_heartbeat as age
FROM user_sessions
WHERE is_active = true;
```

### Problém: Realtime notifikace nepřichází

**Možné příčiny:**
1. Supabase Realtime není zapnutý
2. Špatný channel name
3. RLS policy blokuje updates

**Řešení:**
```bash
# Zapni Realtime v Supabase Dashboard
Settings > API > Realtime

# Zkontroluj RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_sessions';
```

## Performance

### Očekávaná latence

- **Session creation:** < 50ms
- **Heartbeat update:** < 10ms
- **Realtime notification:** < 2s
- **Cleanup query:** < 100ms (pro 1000 sessions)

### Optimalizace

1. **Indexy** - Všechny dotazy používají indexy
2. **Batch cleanup** - Cleanup běží jednou za 5 minut, ne při každém heartbeat
3. **Minimal data** - Device info je JSONB, ne plný user-agent string
4. **Cascade delete** - Staré sessions se automaticky mažou

## Security Considerations

1. **Session ID** - UUID v4, kryptograficky bezpečný
2. **RLS Policies** - Uživatelé vidí pouze své sessions
3. **Device Info** - Ukládá se pro audit, ne pro autentizaci
4. **Heartbeat** - Ověřuje se server-side, ne client-side
5. **Audit Log** - Všechny změny se logují pro forensics

## Budoucí vylepšení

### Možná rozšíření

1. **Grace period** - 5-10s warning před odhlášením
2. **Session management UI** - Zobrazit aktivní zařízení
3. **Selective logout** - Odhlásit konkrétní zařízení
4. **Trust this device** - Povolit více sessions pro důvěryhodná zařízení
5. **Session analytics** - Grafy aktivních sessions v čase

### Příklad: Grace Period

```typescript
// SessionManager.ts
private handleSessionInvalidated(reason: string): void {
  // Zobraz warning 5 sekund před odhlášením
  showWarning('You will be logged out in 5 seconds...');

  setTimeout(() => {
    showNotification(reason);
    this.onSessionInvalidated?.(reason);
  }, 5000);
}
```

### Příklad: Session Management UI

```tsx
// SessionList.tsx
const activeSessions = await sessionManager.getActiveSessions();

return (
  <div>
    <h3>Active Devices</h3>
    {activeSessions.map(session => (
      <div key={session.session_id}>
        <span>{session.device_info.platform}</span>
        <span>{session.device_info.userAgent}</span>
        <span>{formatDate(session.last_heartbeat)}</span>
        <button onClick={() => logoutSession(session.session_id)}>
          Logout
        </button>
      </div>
    ))}
  </div>
);
```

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
